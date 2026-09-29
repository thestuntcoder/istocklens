import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import http from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';

const test = base.extend({
  baseURL: async ({ siteURL }, use) => use(siteURL),
  siteURL: [async ({}, use) => {
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
    await use(`http://127.0.0.1:${server.address().port}`);
    await new Promise(resolve => server.close(resolve));
  }, { scope: 'worker' }],
});

test('local assets, anchors, metadata, factual CTAs and production exclusions', async ({ page, request, baseURL }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://istocklens.com/');
  await expect(page.locator('body')).toContainText('100% money back if customer does not use the app.');
  const refs = await page.locator('[href], [src]').evaluateAll(elements => elements.flatMap(e => ['href', 'src'].filter(a => e.hasAttribute(a)).map(a => e.getAttribute(a))));
  const verified = new Set(['/download', '/stocks', '/stocks/aapl', '/today', '/privacy', '/terms']);
  for (const ref of new Set(refs)) {
    if (ref.startsWith('#')) expect(await page.locator(`[id="${ref.slice(1)}"]`).count(), ref).toBe(1);
    else if (ref.startsWith('/')) expect((await request.get(baseURL + ref)).status(), ref).toBe(200);
    else if (ref.startsWith('https://istocklens.com') && ref !== 'https://istocklens.com/') expect(verified.has(new URL(ref).pathname), ref).toBeTruthy();
  }
  for (const label of ['Start researching', 'Start your research', 'Get iStockLens']) {
    for (const link of await page.getByRole('link', { name: new RegExp(`^${label}`) }).all()) await expect(link).toHaveAttribute('href', 'https://istocklens.com/download');
  }
  await expect(page.getByRole('link', { name: 'Open app' })).toHaveAttribute('href', 'https://istocklens.com/stocks');
  await expect(page.getByRole('link', { name: 'Explore a sample' })).toHaveAttribute('href', '#sample');
  expect(await page.locator('[href*="/pricing"]').count()).toBe(0);
  for (const excluded of ['README.md', 'package.json', 'playwright.config.mjs', 'docs/ui-design-spec.md', 'scripts/dev.mjs', 'tests/page.spec.mjs', 'node_modules/tailwindcss/package.json']) expect((await request.get(`${baseURL}/${excluded}`)).status(), excluded).toBe(404);
  expect(await page.evaluate(() => [...document.images].every(img => img.complete && img.naturalWidth > 0))).toBeTruthy();
  expect(errors).toEqual([]);
  expect(await page.locator('script[src*="livereload"]').count()).toBe(0);
});

test('mobile navigation closes with Escape, outside click and anchor; all links fit short screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 320 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Menu' });
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav).not.toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(nav).not.toBeVisible();
  await toggle.click();
  await nav.getByRole('link', { name: 'The research' }).click();
  await expect(nav).not.toBeVisible();
  await expect(page).toHaveURL(/#research$/);
  await toggle.click();
  const cta = nav.getByRole('link', { name: 'Start researching' });
  await cta.scrollIntoViewIfNeeded();
  const box = await cta.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(321);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await toggle.click();
  await page.locator('.problem-section').click({ position: { x: 10, y: 200 } });
  await expect(nav).not.toBeVisible();
});

test('sample supports roving tabs, arrows, Home/End and visible focus', async ({ page }) => {
  await page.goto('/');
  const tabs = page.getByRole('tab');
  await tabs.first().focus();
  for (const [key, index] of [['ArrowRight', 1], ['End', 2], ['ArrowRight', 0], ['ArrowLeft', 2], ['Home', 0]]) {
    await page.keyboard.press(key);
    await expect(tabs.nth(index)).toBeFocused();
    await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    expect(await tabs.evaluateAll(nodes => nodes.filter(n => n.tabIndex === 0).length)).toBe(1);
    expect(await tabs.nth(index).evaluate(e => getComputedStyle(e).outlineStyle)).toBe('solid');
  }
  await tabs.nth(1).click();
  await expect(page.getByRole('tabpanel')).toContainText('Good business.');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel')).toBeFocused();
});

test('all native FAQs expand with keyboard and collapse', async ({ page }) => {
  await page.goto('/');
  const summaries = page.locator('summary');
  await expect(summaries).toHaveCount(6);
  for (const summary of await summaries.all()) {
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(summary.locator('..')).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(summary.locator('..')).not.toHaveAttribute('open');
  }
});

for (const width of [320, 375, 390, 768, 900, 1024, 1100, 1440, 1920]) {
  test(`layout, report and screenshots at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 640 ? 844 : 1000 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    const shell = await page.locator('.hero.shell').boundingBox();
    const copy = await page.locator('.hero-copy').boundingBox();
    expect(copy.x + copy.width).toBeLessThanOrEqual(shell.x + shell.width + 1);
    const art = await page.locator('.hero-art').boundingBox();
    expect(art.x + art.width).toBeLessThanOrEqual(shell.x + shell.width + 1);
    const report = await page.locator('.hero-report').boundingBox();
    expect(report.x).toBeGreaterThanOrEqual(art.x);
    expect(report.x + report.width).toBeLessThanOrEqual(art.x + art.width + 1);
    expect(report.y + report.height).toBeLessThanOrEqual(art.y + art.height);
    for (const tab of await page.getByRole('tab').all()) {
      await tab.click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    }
    await page.getByRole('tab').first().click();
    if (process.env.SCREENSHOTS) {
      await mkdir('tmp/screenshots', { recursive: true });
      await page.evaluate(() => { document.activeElement.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
      await page.screenshot({ path: `tmp/screenshots/page-${width}.png`, fullPage: true });
      if ([320, 390, 1440].includes(width)) await page.screenshot({ path: `tmp/screenshots/hero-${width}.png` });
    }
  });
}

test('automated accessibility checks on desktop and expanded mobile controls', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    for (const tab of await page.getByRole('tab').all()) {
      await tab.click();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(results.violations).toEqual([]);
    }
    await page.locator('summary').first().click();
    if (width < 1100) await page.getByRole('button', { name: 'Menu' }).click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('reduced motion and no-JavaScript fallback', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce', viewport: { width: 768, height: 1000 } });
  const page = await context.newPage();
  await page.goto(baseURL);
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  await expect(page.locator('[data-panel]:visible')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Menu' })).not.toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no JS at ${width}`).toBeTruthy();
  }
  await context.close();
});
