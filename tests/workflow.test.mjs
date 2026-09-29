import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { parsePort, reservePort } from '../scripts/ports.mjs';

const bind = async () => {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return server;
};
const close = server => new Promise(resolve => server.close(resolve));

test('strict overrides and protected projects', () => {
  for (const value of ['', '0', '-1', 'abc', '4001x', '65536', '4000', '35729']) assert.throws(() => parsePort(value, 'PORT'));
  assert.equal(parsePort('4001', 'PORT'), 4001);
  assert.equal(parsePort(undefined, 'PORT'), undefined);
});

test('automatic selection skips occupied sockets; explicit conflicts never stop their owner', async () => {
  const sentinel = await bind();
  const port = sentinel.address().port;
  let chosen;
  try {
    chosen = await reservePort({ host: '127.0.0.1', preferred: port, label: 'HTTP' });
    assert.ok(chosen.port > port);
    await assert.rejects(reservePort({ host: '127.0.0.1', preferred: port, override: port, label: 'HTTP' }), /unavailable.*no process was stopped/);
    assert.equal(sentinel.listening, true);
    await assert.rejects(reservePort({ host: '127.0.0.1', override: chosen.port, label: 'LiveReload', unavailable: new Set([chosen.port]) }), /conflicts/);
  } finally { if (chosen) await chosen.release(); await close(sentinel); }
});

test('launcher fails clearly before spawning watchers for occupied overrides', async () => {
  const sentinel = await bind();
  try {
    const child = spawn(process.execPath, ['scripts/dev.mjs'], { env: { ...process.env, PORT: String(sentinel.address().port) } });
    let output = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', data => output += data);
    const code = await new Promise(resolve => child.on('exit', resolve));
    assert.equal(code, 1);
    assert.match(output, /HTTP .* unavailable/);
    assert.doesNotMatch(output, /Launcher PID/);
    assert.equal(sentinel.listening, true);
  } finally { await close(sentinel); }
});
