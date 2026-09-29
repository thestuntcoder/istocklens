import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import http from 'node:http';
import { readFile, writeFile, stat, mkdir } from 'node:fs/promises';
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
  await expect(page.locator('.guarantee-exact')).toHaveText('If you don’t use the app, you get 100% of your money back.');
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

// Both original routes intentionally share exactly the same body. Keep comparison
// coverage separate from the V2 tests so a new design cannot silently replace V1.
test('original routes retain identical content, computed styles and appearance', async ({ page }, testInfo) => {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let original;
    const referenceName = `original-${width}.png`;
    const referencePath = testInfo.snapshotPath(referenceName);
    for (const route of ['/', '/version-1/']) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('.v2-switch, .v2-header')).toHaveCount(0);
      await expect(page.locator('body')).not.toHaveClass('version-2');
      const snapshot = await page.evaluate(() => ({
        html: document.body.innerHTML,
        styles: [...document.querySelectorAll('body, .site-header, .brand, h1, h1 em, .hero-description, .hero-art, .hero-report, .button, .section-title, .sample-panel, .guarantee-seal, .site-footer')].map(el => ({
          box: el.getBoundingClientRect().toJSON(),
          computed: Object.fromEntries([...getComputedStyle(el)].map(key => [key, getComputedStyle(el).getPropertyValue(key)])),
        })),
      }));
      // Token checks also guard against an identical blue repaint of both originals.
      expect(snapshot.styles[0].computed['background-color']).toBe('rgb(247, 248, 242)');
      expect(await page.locator('h1 em').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Instrument Serif');
      const image = await page.screenshot({ fullPage: true, animations: 'disabled' });
      if (original) {
        expect(snapshot, `${width}px content, geometry and computed CSS`).toEqual(original);
        // Compare decoded pixels with Playwright's small antialiasing tolerance;
        // PNG-byte equality is flaky with Chromium's subpixel rasterization.
        expect(image).toMatchSnapshot(referenceName, { threshold: 0.1, maxDiffPixels: 0 });
      } else {
        original = snapshot;
        await mkdir(path.dirname(referencePath), { recursive: true });
        await writeFile(referencePath, image);
      }
    }
  }
});

const v2 = '/version-2/';

test('V2 assets, fonts, metadata, factual links and isolated branding', async ({ page, request, baseURL }) => {
  const errors = [];
  const remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  page.on('request', request => { if (!request.url().startsWith(baseURL)) remoteRequests.push(request.url()); });
  await page.goto(v2);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveTitle('Your money. Your call. Know why. | iStockLens');
  await expect(page.locator('body')).toHaveClass('version-2');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1 > span')).toHaveText(['YOUR MONEY.', 'YOUR CALL.', 'KNOW WHY.']);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://istocklens.com/version-2/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://istocklens.com/version-2/');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#08162d');
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    await expect(page.locator(selector)).toHaveAttribute('content', 'https://istocklens.com/assets/images/version-2-social.png');
  }
  await expect(page.locator('link[rel=icon]')).toHaveAttribute('href', '/assets/images/version-2-favicon.svg');
  await expect(page.locator('link[rel=stylesheet]')).toHaveAttribute('href', '/assets/css/main.css');
  await expect(page.locator('script[src]')).toHaveAttribute('src', '/assets/js/main.js');
  await expect(page.locator('.v2-guarantee-exact')).toHaveText('If you don’t use the app, you get 100% of your money back.');
  await expect(page.locator('.v2-guarantee-scope')).toHaveText('This covers non-use of the app subscription, not investment performance or losses.');
  await expect(page.locator('.v2-footer')).toContainText('Investing involves risk, including loss of capital.');
  await expect(page.locator('.v2-brief figcaption')).toHaveText('Illustrative sample · not live data');
  await expect(page.locator('.v2-workbench-top')).toContainText('Illustrative sample · not live data');
  await expect(page.locator('.v2-brief')).toContainText('Static score comparison. Not a price history.');
  await expect(page.locator('.v2-brief-insight')).toHaveText('GREAT BUSINESS ≠ GREAT PRICE');
  const verified = new Set(['/download', '/stocks', '/stocks/aapl', '/today', '/privacy', '/terms']);
  const refs = await page.locator('[href], [src]').evaluateAll(elements => elements.flatMap(el => ['href', 'src'].filter(attr => el.hasAttribute(attr)).map(attr => el.getAttribute(attr))));
  for (const ref of new Set(refs)) {
    if (ref.startsWith('#')) expect(await page.locator(`[id="${ref.slice(1)}"]`).count(), ref).toBe(1);
    else if (ref.startsWith('/')) expect((await request.get(baseURL + ref)).status(), ref).toBe(200);
    else if (ref !== 'https://istocklens.com/version-2/') { expect(new URL(ref).origin).toBe('https://istocklens.com'); expect(verified.has(new URL(ref).pathname), ref).toBeTruthy(); }
  }
  for (const label of ['Start researching', 'Start your research', 'Get iStockLens']) {
    for (const link of await page.getByRole('link', { name: new RegExp(`^${label}`) }).all()) await expect(link).toHaveAttribute('href', 'https://istocklens.com/download');
  }
  await expect(page.locator('[href*="/pricing"]')).toHaveCount(0);
  await expect(page.locator('.v2-switch a[aria-current=page]')).toHaveCount(2);
  for (const link of await page.locator('.v2-switch a[aria-current=page]').all()) await expect(link).toHaveAttribute('href', '/version-2/');
  for (const link of await page.locator('.v2-switch a:not([aria-current])').all()) await expect(link).toHaveAttribute('href', '/version-1/');
  const brand = await page.locator('.v2-header .brand-mark').evaluate(el => ({ fill: getComputedStyle(el.querySelector('path')).fill, center: getComputedStyle(el.querySelector('circle')).fill }));
  expect(brand).toEqual({ fill: 'rgb(134, 182, 255)', center: 'rgb(8, 22, 45)' });
  expect(await page.evaluate(() => [...document.fonts].some(font => font.family === 'Barlow Condensed' && font.weight === '800' && font.status === 'loaded'))).toBeTruthy();
  expect(await page.evaluate(() => [...document.fonts].some(font => font.family === 'Instrument Serif' && font.status === 'loaded'))).toBeFalsy();
  const font = await request.get('/assets/fonts/barlow-condensed-800-latin.woff2');
  expect((await font.body()).subarray(0, 4).toString()).toBe('wOF2');
  expect(await (await request.get('/assets/fonts/BarlowCondensed-OFL.txt')).text()).toContain('SIL OPEN FONT LICENSE Version 1.1');
  const social = await (await request.get('/assets/images/version-2-social.png')).body();
  expect([social.readUInt32BE(16), social.readUInt32BE(20)]).toEqual([1200, 630]);
  expect((await request.get('/assets/images/version-2-social.svg')).status()).toBe(200);
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('V2 mobile menu, short viewport, sticky anchors and comparison links', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 320 });
  await page.goto(v2);
  const menu = page.getByRole('button', { name: 'Menu' });
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav).not.toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  const cta = nav.getByRole('link', { name: 'Start researching' });
  await cta.scrollIntoViewIfNeeded();
  const box = await cta.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(321);
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(nav).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [label, id] of [['The research', 'research'], ['How it works', 'how-it-works'], ['Our guarantee', 'guarantee']]) {
    await menu.click();
    await nav.getByRole('link', { name: label }).click();
    await expect(nav).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    expect((await page.locator(`#${id}`).boundingBox()).y).toBeGreaterThanOrEqual((await page.locator('.v2-header').boundingBox()).height);
  }
  await page.getByRole('link', { name: 'Explore a sample' }).click();
  await expect(page).toHaveURL(/#sample$/);
  expect((await page.locator('#sample').boundingBox()).y).toBeGreaterThanOrEqual(72);
  await menu.click();
  await page.locator('.v2-sample').click({ position: { x: 10, y: 650 } });
  await expect(nav).not.toBeVisible();
  await page.locator('.v2-footer').getByRole('link', { name: 'Version 1', exact: true }).click();
  await expect(page).toHaveURL(/\/version-1\/$/);
  await expect(page.locator('.v2-switch')).toHaveCount(0);
});

test('V2 directional tabs, shared sample scores, keyboard sequence and focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(v2);
  const tabs = page.getByRole('tab');
  const list = page.getByRole('tablist');
  await expect(list).toHaveAttribute('aria-orientation', 'vertical');
  await expect(page.locator('.v2-score-row > span')).toHaveText(['Growth', 'Profitability', 'Cash', 'Valuation', 'Stability']);
  await expect(page.locator('.v2-score-row > strong')).toHaveText(['65', '90', '90', '49', '75']);
  expect(await page.locator('.v2-score-row .v2-score-track > span').evaluateAll(nodes => nodes.map(node => node.style.width))).toEqual(['65%', '90%', '90%', '49%', '75%']);
  await tabs.first().focus();
  for (const [key, index, text] of [['ArrowDown', 1, 'GREAT COMPANY.'], ['End', 2, 'THE SCORE IS'], ['ArrowDown', 0, 'KNOW WHAT'], ['ArrowUp', 2, 'THE SCORE IS'], ['Home', 0, 'KNOW WHAT']]) {
    await page.keyboard.press(key);
    await expect(tabs.nth(index)).toBeFocused();
    await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.getByRole('tabpanel')).toContainText(text);
    expect(await tabs.evaluateAll(nodes => nodes.filter(node => node.tabIndex === 0).length)).toBe(1);
    const style = await tabs.nth(index).evaluate(el => ({ outline: getComputedStyle(el).outlineStyle, width: getComputedStyle(el).outlineWidth, color: getComputedStyle(el).outlineColor }));
    expect(style).toEqual({ outline: 'solid', width: '3px', color: 'rgb(40, 92, 255)' });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(list).toHaveAttribute('aria-orientation', 'horizontal');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('49');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel')).toBeFocused();
  await tabs.nth(2).click();
  await expect(page.getByRole('tabpanel')).toContainText('No current news or analyst data shown.');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(list).toHaveAttribute('aria-orientation', 'vertical');
  await page.goto(v2);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('V2 all six native FAQs support Enter and Space', async ({ page }) => {
  await page.goto(v2);
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

for (const width of [320, 390, 768, 1024, 1440, 1920]) {
  test(`V2 typography, artwork and sample layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(v2);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    const title = await page.locator('h1').evaluate(el => ({ font: getComputedStyle(el).fontFamily, size: parseFloat(getComputedStyle(el).fontSize), weight: getComputedStyle(el).fontWeight }));
    expect(title.font).toContain('Barlow Condensed');
    expect(title.weight).toBe('800');
    if (width >= 1440) { expect(title.size).toBeGreaterThanOrEqual(110); expect(title.size).toBeLessThanOrEqual(130); }
    const copy = await page.locator('.v2-hero-copy').boundingBox();
    const lines = await page.locator('h1 > span').evaluateAll(nodes => nodes.map(node => {
      const range = document.createRange(); range.selectNodeContents(node);
      return { rect: range.getBoundingClientRect().toJSON(), lines: range.getClientRects().length };
    }));
    expect(lines).toHaveLength(3);
    for (const line of lines) {
      expect(line.lines).toBe(1);
      expect(line.rect.x).toBeGreaterThanOrEqual(copy.x);
      expect(line.rect.right).toBeLessThanOrEqual(copy.x + copy.width + 1);
    }
    const art = await page.locator('.v2-hero-art').boundingBox();
    const brief = await page.locator('.v2-brief').boundingBox();
    expect(brief.width).toBeGreaterThan(250);
    expect(brief.x).toBeGreaterThanOrEqual(art.x);
    expect(brief.x + brief.width).toBeLessThanOrEqual(art.x + art.width + 1);
    expect(brief.y + brief.height).toBeLessThanOrEqual(art.y + art.height);
    // V1 font and green palette must never become visible on the blue alternative.
    const remnants = await page.locator('body *').evaluateAll(nodes => nodes.filter(node => {
      const style = getComputedStyle(node);
      return node.getClientRects().length && (style.fontFamily.includes('Instrument Serif') || ['color', 'backgroundColor', 'borderTopColor'].some(key => ['rgb(32, 60, 45)', 'rgb(217, 239, 140)', 'rgb(247, 248, 242)'].includes(style[key])));
    }).map(node => node.className));
    expect(remnants).toEqual([]);
    for (const tab of await page.getByRole('tab').all()) {
      await tab.click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    }
    await page.getByRole('tab').first().click();
    if (process.env.SCREENSHOTS) {
      await mkdir('tmp/version-2', { recursive: true });
      await page.evaluate(() => { document.activeElement.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
      await page.screenshot({ path: `tmp/version-2/page-${width}.png`, fullPage: true });
      await page.screenshot({ path: `tmp/version-2/hero-${width}.png` });
    }
  });
}

test('V2 axe WCAG AA across sample, expanded FAQ and menu states', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(v2);
    await page.evaluate(() => document.fonts.ready);
    for (const tab of await page.getByRole('tab').all()) {
      await tab.click();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(results.violations).toEqual([]);
    }
    for (const summary of await page.locator('summary').all()) await summary.click();
    if (width < 1100) await page.getByRole('button', { name: 'Menu' }).click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('V2 useful no-JS content and reduced-motion fallback', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(baseURL + v2);
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(page.locator('[data-panel]:visible')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Menu' })).not.toBeVisible();
    await expect(page.locator('[data-tablist]')).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no JS at ${width}`).toBeTruthy();
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
    expect(await page.locator('.v2-button').first().evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  }
  await page.locator('summary').first().click();
  await expect(page.locator('details').first()).toHaveAttribute('open', '');
  await page.getByRole('link', { name: 'Explore a sample' }).click();
  await expect(page).toHaveURL(/#sample$/);
  await context.close();
});
