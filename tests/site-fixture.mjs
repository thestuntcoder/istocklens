import { test as base } from '@playwright/test';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export async function serveSite() {
  const root = path.resolve('_site');
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
  const server = http.createServer(async (req, res) => {
    try {
      let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
      if (!file.startsWith(root + '/') && file !== root) throw new Error('Outside site');
      if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve)) };
}

export const test = base.extend({
  baseURL: async ({ siteURL }, use) => use(siteURL),
  siteURL: [async ({}, use) => {
    const site = await serveSite();
    await use(site.url);
    await site.close();
  }, { scope: 'worker' }],
});
export { expect } from '@playwright/test';
