import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePort, reservePort } from './ports.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const children = new Set();
const reservations = [];
let stopping = false;
let stateFile;
let logDirectory;
let selected;
const host = process.env.HOST || '127.0.0.1';

function saveState() {
  if (stateFile) writeFileSync(stateFile, JSON.stringify({ launcherPid: process.pid, host, ...selected, logDirectory, children: [...children].map(c => ({ name: c.name, pid: c.pid })) }, null, 2) + '\n');
}
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  console.log('\n[dev] Stopping only this launcher’s process groups…');
  for (const reservation of reservations) reservation.release().catch(() => {});
  for (const child of children) signalGroup(child, 'SIGTERM');
  // Keep groups recorded until shutdown completes, even if their parent exits first.
  setTimeout(() => {
    for (const child of children) signalGroup(child, 'SIGKILL');
    if (stateFile) rmSync(stateFile, { force: true });
    process.exit(code);
  }, 1200);
}
function signalGroup(child, signal) {
  try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') console.error(error.message); }
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

function launch(name, command, args, persistent = false) {
  const log = createWriteStream(path.join(logDirectory, `${name}.log`), { flags: 'a' });
  const child = spawn(command, args, { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, JEKYLL_ENV: 'development' } });
  child.name = name;
  children.add(child);
  saveState();
  for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { log.write(data); process.stdout.write(data); });
  child.on('error', error => { console.error(`[${name}] ${error.message}`); stop(1); });
  child.on('exit', (code, signal) => {
    log.end();
    if (!stopping) {
      children.delete(child);
      saveState();
      if (persistent) {
        console.error(`[dev] ${name} exited (${signal || code}); shutting down its sibling.`);
        stop(code || 1);
      }
    }
  });
  return child;
}

try {
  const port = parsePort(process.env.PORT, 'PORT');
  const liveReloadPort = parsePort(process.env.LIVERELOAD_PORT, 'LIVERELOAD_PORT');
  // Reserve both before building, also keeping an explicit LR override away from HTTP auto-selection.
  const http = await reservePort({ host, preferred: 4001, override: port, label: 'HTTP', unavailable: new Set(liveReloadPort ? [liveReloadPort] : []) });
  reservations.push(http);
  const live = await reservePort({ host, preferred: 35730, override: liveReloadPort, label: 'LiveReload', unavailable: new Set([http.port]) });
  reservations.push(live);
  selected = { port: http.port, liveReloadPort: live.port, url: `http://${host.includes(':') ? `[${host}]` : host}:${http.port}/` };
  logDirectory = path.join(root, 'tmp', 'dev', `${new Date().toISOString().replaceAll(':', '-')}-${process.pid}`);
  mkdirSync(logDirectory, { recursive: true });
  stateFile = path.join(logDirectory, 'state.json');
  saveState();
  console.log(`[dev] URL: ${selected.url}\n[dev] LiveReload: ${live.port}\n[dev] Logs: ${logDirectory}\n[dev] Launcher PID: ${process.pid}; stop: Ctrl+C or kill -TERM ${process.pid}`);
  const tailwind = path.join(root, 'node_modules/@tailwindcss/cli/dist/index.mjs');
  const cssArgs = [tailwind, '-i', './_styles/main.css', '-o', './assets/css/main.css'];
  const initial = launch('css-build', process.execPath, [...cssArgs, '--minify']);
  const code = await new Promise(resolve => initial.on('exit', resolve));
  if (code !== 0) throw new Error('Initial CSS build failed. Run npm ci and check the CSS build log.');
  if (!stopping) {
    await Promise.all(reservations.splice(0).map(reservation => reservation.release()));
    // Jekyll owns the sockets from here. A bind race fails closed; it never kills the new owner.
    launch('css', process.execPath, [...cssArgs, '--watch=always'], true);
    launch('jekyll', 'bundle', ['exec', 'jekyll', 'serve', '--host', host, '--port', String(http.port), '--livereload', '--livereload-port', String(live.port), '--livereload-min-delay', '0.3'], true);
  }
} catch (error) {
  console.error(`[dev] ${error.message}`);
  stop(1);
}
