import { test, expect } from './site-fixture.mjs';
import AxeBuilder from '@axe-core/playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const guaranteeCopy = 'If you don’t use or don’t find the app useful, you get 100% of your money back.';
const guaranteeScope = 'This covers your app subscription, not investment performance or losses.';

test('local assets, anchors, metadata, factual CTAs and production exclusions', async ({ page, request, baseURL }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://istocklens.com/');
  await expect(page.locator('.guarantee-exact')).toHaveText(guaranteeCopy);
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

test('updated guarantee covers non-use or lack of usefulness on every landing and embedded signup', async ({ page }) => {
  for (const route of ['/', '/version-1/', '/version-2/', '/version-3/', '/version-4/']) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#guarantee [class$="guarantee-exact"]')).toHaveText(guaranteeCopy);
    await expect(page.locator('#guarantee [class$="guarantee-scope"]')).toHaveText(guaranteeScope);
    await expect(page.locator('.sf-guarantee strong')).toHaveText(guaranteeCopy);
    await expect(page.locator('.sf-guarantee p')).toHaveText(guaranteeScope);
    expect(await page.locator('body').textContent()).not.toMatch(/non-use|If you don’t use the app,|Don’t use the app\?/i);
    if (route !== '/version-4/') {
      await expect(page.locator('a[class*="hero-guarantee"]')).toContainText('Don’t use it or don’t find it useful? 100% money back.');
      await expect(page.locator('.seal-bottom, .v2-stamp .v2-label:last-child')).toContainText('IF YOU DON’T USE IT OR DON’T FIND IT USEFUL.');
      const faq = page.locator('details').filter({ hasText: 'What does the money-back guarantee cover?' });
      await faq.locator('summary').click();
      await expect(faq.locator('p')).toHaveText(`${guaranteeCopy} The guarantee covers your app subscription—not investment performance or losses.`);
    }
    for (const width of [320, 390, 768, 960, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}px`).toBe(true);
      const clipped = await page.locator('#guarantee').evaluate(root => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const failures = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          if ([...range.getClientRects()].some(rect => rect.left < -1 || rect.right > innerWidth + 1)) failures.push(node.textContent);
        }
        return failures;
      });
      expect(clipped, `${route} guarantee text at ${width}px`).toEqual([]);
    }
  }
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
  await expect(page.locator('script[src="/assets/js/main.js"]')).toHaveCount(1);
  await expect(page.locator('script[src="/assets/js/signup-flow.js"]')).toHaveCount(1);
  await expect(page.locator('.v2-guarantee-exact')).toHaveText(guaranteeCopy);
  await expect(page.locator('.v2-guarantee-scope')).toHaveText(guaranteeScope);
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

test('V2 keeps its research CTA and guarantee above the desktop fold', async ({ page }) => {
  for (const width of [1280, 1440, 1512, 1920]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(v2);
    await page.evaluate(() => document.fonts.ready);
    for (const selector of ['.v2-hero-actions', '.v2-hero-guarantee']) {
      const box = await page.locator(selector).boundingBox();
      expect(box.y, `${selector} top at ${width}px`).toBeGreaterThan(0);
      expect(box.y + box.height, `${selector} below fold at ${width}px`).toBeLessThanOrEqual(800);
    }
  }
});

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

const v3 = '/version-3/';
const v3Widths = [320, 390, 768, 1024, 1440, 1920];

test('V3 exact motto, owned metadata, local assets, comparison links and unchanged guarantee', async ({ page, request, baseURL }) => {
  const errors = [];
  const remoteRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  page.on('request', request => { if (!request.url().startsWith(baseURL)) remoteRequests.push(request.url()); });
  await page.goto(v3);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('body')).toHaveClass('version-3');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1, name: 'Before you buy, know why.', exact: true })).toBeVisible();
  await expect(page).toHaveTitle('iStockLens — Before you buy, know why.');
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://istocklens.com/version-3/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://istocklens.com/version-3/');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#285be2');
  for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    await expect(page.locator(selector)).toHaveAttribute('content', 'https://istocklens.com/assets/images/version-3-social.png');
  }
  await expect(page.locator('link[rel=icon]')).toHaveAttribute('href', '/assets/images/version-3-favicon.svg');
  await expect(page.locator('link[rel=stylesheet]')).toHaveAttribute('href', '/assets/css/main.css');
  await expect(page.locator('script[src="/assets/js/main.js"]')).toHaveCount(1);
  await expect(page.locator('script[src="/assets/js/signup-flow.js"]')).toHaveCount(1);
  expect(await page.locator('link[rel=preload][as=font]').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')))).toEqual([
    '/assets/fonts/manrope-latin.woff2', '/assets/fonts/instrument-serif-italic-latin.woff2',
  ]);
  const social = await (await request.get('/assets/images/version-3-social.png')).body();
  expect([social.readUInt32BE(16), social.readUInt32BE(20)]).toEqual([1200, 630]);
  expect((await request.get('/assets/images/version-3-social.svg')).status()).toBe(200);
  for (const container of ['.v3-version-switch', '.v3-footer-versions']) {
    for (const version of [1, 2, 3]) {
      await expect(page.locator(container).getByRole('link', { name: `Version ${version}`, exact: true })).toHaveAttribute('href', `/version-${version}/`);
    }
    await expect(page.locator(`${container} [aria-current=page]`)).toHaveCount(1);
    await expect(page.locator(`${container} [aria-current=page]`)).toHaveAttribute('href', v3);
  }
  await expect(page.locator('.guarantee-exact')).toHaveText(guaranteeCopy);
  await expect(page.locator('.guarantee-scope')).toHaveText(guaranteeScope);
  await expect(page.locator('.v3-brief-disclaimer')).toHaveText('Illustrative report · not live data');
  await expect(page.locator('.v3-plot svg')).toHaveAttribute('aria-label', /Not historical market data\./);
  for (const label of ['Start researching', 'Start your research', 'Get iStockLens']) {
    const links = page.getByRole('link', { name: new RegExp(`^${label}`), includeHidden: true });
    expect(await links.count()).toBeGreaterThan(0);
    for (const link of await links.all()) await expect(link).toHaveAttribute('href', 'https://istocklens.com/download');
  }
  const verified = new Set(['/download', '/stocks', '/stocks/aapl', '/today', '/privacy', '/terms']);
  const refs = await page.locator('[href], [src]').evaluateAll(elements => elements.flatMap(el => ['href', 'src'].filter(attr => el.hasAttribute(attr)).map(attr => el.getAttribute(attr))));
  for (const ref of new Set(refs)) {
    if (ref.startsWith('#')) expect(await page.locator(`[id="${ref.slice(1)}"]`).count(), ref).toBe(1);
    else if (ref.startsWith('/')) expect((await request.get(baseURL + ref)).status(), ref).toBe(200);
    else if (ref !== 'https://istocklens.com/version-3/') {
      expect(new URL(ref).origin).toBe('https://istocklens.com');
      expect(verified.has(new URL(ref).pathname), ref).toBeTruthy();
    }
  }
  expect(await page.evaluate(() => ['Manrope', 'Instrument Serif'].every(family => [...document.fonts].some(font => font.family === family && font.status === 'loaded')))).toBeTruthy();
  expect(remoteRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test('V3 blue typography, headline and art bounds at six widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of v3Widths) {
    await page.setViewportSize({ width, height: width < 640 ? 844 : 1000 });
    // A pointer left over from the previous tab click can hover the CTA after resize.
    await page.mouse.move(0, 0);
    await page.goto(v3);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(244, 247, 252)');
    const title = await page.locator('h1').evaluate(el => ({ family: getComputedStyle(el).fontFamily, weight: getComputedStyle(el).fontWeight, color: getComputedStyle(el).color }));
    expect(title.family).toContain('Manrope');
    expect(title.weight).toBe('750');
    expect(title.color).toBe('rgb(20, 43, 80)');
    expect(await page.locator('h1 em').evaluate(el => ({ family: getComputedStyle(el).fontFamily, weight: getComputedStyle(el).fontWeight, color: getComputedStyle(el).color }))).toEqual({ family: '"Instrument Serif", Georgia, serif', weight: '400', color: 'rgb(40, 91, 226)' });
    for (const selector of ['.v3-art', '.hero-actions .button-lime', '.guarantee-section']) {
      expect(await page.locator(selector).evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(40, 91, 226)');
    }
    const shell = await page.locator('.hero.shell').boundingBox();
    const copy = await page.locator('.hero-copy').boundingBox();
    const art = await page.locator('.v3-art').boundingBox();
    const brief = await page.locator('.v3-brief').boundingBox();
    for (const box of [copy, art]) {
      expect(box.x, `${width}px left bound`).toBeGreaterThanOrEqual(shell.x);
      expect(box.x + box.width, `${width}px right bound`).toBeLessThanOrEqual(shell.x + shell.width + 1);
    }
    const headlineRects = await page.locator('h1').evaluate(el => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return [...range.getClientRects()].map(rect => rect.toJSON());
    });
    for (const rect of headlineRects) {
      expect(rect.x, `${width}px headline left`).toBeGreaterThanOrEqual(copy.x);
      expect(rect.right, `${width}px headline right`).toBeLessThanOrEqual(copy.x + copy.width + 1);
      expect(rect.bottom, `${width}px headline bottom`).toBeLessThanOrEqual(copy.y + copy.height + 1);
    }
    expect(brief.width).toBeGreaterThan(220);
    expect(brief.x).toBeGreaterThanOrEqual(art.x);
    expect(brief.y).toBeGreaterThanOrEqual(art.y);
    expect(brief.x + brief.width).toBeLessThanOrEqual(art.x + art.width + 1);
    expect(brief.y + brief.height).toBeLessThanOrEqual(art.y + art.height + 1);
    for (const tab of await page.getByRole('tab').all()) {
      await tab.click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px overflow`).toBeTruthy();
    }
    await page.getByRole('tab').first().click();
    if (process.env.SCREENSHOTS && [320, 390, 1440].includes(width)) {
      await mkdir('tmp/version-3', { recursive: true });
      await page.mouse.move(0, 0);
      await page.evaluate(() => { document.activeElement.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
      await page.screenshot({ path: `tmp/version-3/page-${width}.png`, fullPage: true });
      await page.screenshot({ path: `tmp/version-3/hero-${width}.png` });
    }
  }
});

test('V3 keyboard menu, tabs and all FAQs remain usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 320 });
  await page.goto(v3);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  const menu = page.getByRole('button', { name: 'Menu' });
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav).not.toBeVisible();
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  // Reach every menu destination by keyboard, including the V3 comparison links.
  for (const link of await nav.getByRole('link').all()) {
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    const box = await link.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(321);
  }
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(nav).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link', { name: 'The research' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#research$/);
  await expect(nav).not.toBeVisible();
  const tabs = page.getByRole('tab');
  await tabs.first().focus();
  for (const [key, index] of [['ArrowRight', 1], ['End', 2], ['ArrowRight', 0], ['ArrowLeft', 2], ['Home', 0]]) {
    await page.keyboard.press(key);
    await expect(tabs.nth(index)).toBeFocused();
    await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', await tabs.nth(index).getAttribute('id'));
    expect(await tabs.evaluateAll(nodes => nodes.filter(node => node.tabIndex === 0).length)).toBe(1);
    expect(await tabs.nth(index).evaluate(el => ({ style: getComputedStyle(el).outlineStyle, color: getComputedStyle(el).outlineColor }))).toEqual({ style: 'solid', color: 'rgb(40, 91, 226)' });
  }
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel')).toBeFocused();
  await expect(page.locator('summary')).toHaveCount(6);
  for (const summary of await page.locator('summary').all()) {
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(summary.locator('..')).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(summary.locator('..')).not.toHaveAttribute('open');
  }
});

test('V3 axe WCAG AA on desktop and phone in every tab and expanded controls', async ({ page }) => {
  test.setTimeout(60000);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(v3);
    await page.evaluate(() => document.fonts.ready);
    for (const tab of await page.getByRole('tab').all()) {
      await tab.click();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(results.violations, `${width}px ${await tab.innerText()}`).toEqual([]);
    }
    for (const summary of await page.locator('summary').all()) await summary.click();
    if (width === 390) await page.getByRole('button', { name: 'Menu' }).click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations, `${width}px expanded controls`).toEqual([]);
  }
});

test('V3 no-JavaScript navigation, all panels, native FAQ and reduced motion', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.goto(baseURL + v3);
    await page.evaluate(() => document.fonts.ready);
    for (const width of v3Widths) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
      await expect(page.locator('[data-panel]:visible')).toHaveCount(3);
      await expect(page.getByRole('button', { name: 'Menu' })).not.toBeVisible();
      await expect(page.locator('.tabs')).not.toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no JS at ${width}px`).toBeTruthy();
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
      expect(await page.locator('.button').first().evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
    }
    await page.locator('summary').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('details').first()).toHaveAttribute('open', '');
    await page.getByRole('link', { name: 'Explore a sample' }).click();
    await expect(page).toHaveURL(/#sample$/);
  } finally {
    await context.close();
  }
});

const v4 = '/version-4/';

test('V4 independent identity, factual boundaries, local assets and metadata', async ({ page, request, baseURL }) => {
  const errors = [];
  const remote = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
  page.on('request', request => { if (!request.url().startsWith(baseURL)) remote.push(request.url()); });
  await page.goto(v4);
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveTitle('iStockLens — Research the stock. Challenge the thesis.');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText(/Research the stock\.\s*Challenge the thesis\./);
  await expect(page.locator('body')).toHaveClass(/version-4/);
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://istocklens.com/version-4/');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f5f7fa');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://istocklens.com/assets/images/version-4-social.png');
  await expect(page.locator('link[rel=icon]')).toHaveAttribute('href', '/assets/images/version-4-favicon.svg');
  await expect(page.locator('script[src="/assets/js/version-4.js"]')).toHaveCount(1);
  await expect(page.locator('script[src="/assets/js/signup-flow.js"]')).toHaveCount(1);
  await expect(page.locator('.v4-guarantee-exact')).toHaveText(guaranteeCopy);
  await expect(page.locator('.v4-guarantee-scope')).toHaveText(guaranteeScope);
  await expect(page.locator('.v4-note-bottom')).toContainText('not an app screenshot or a current assessment');
  await expect(page.locator('.v4-ledger-note')).toContainText('not independently verified conclusions');
  await expect(page.locator('.v4-disclosure')).toContainText('Investing involves risk, including loss of capital.');
  expect(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(245, 247, 250)');
  for (const heading of await page.locator('h1, h2, h3, h4').all()) expect(await heading.evaluate(el => getComputedStyle(el).fontFamily)).toContain('IBM Plex Sans');
  expect(await page.locator('h1').evaluate(el => Number(getComputedStyle(el).fontWeight))).toBeGreaterThanOrEqual(600);
  expect(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily)).toContain('IBM Plex Sans');
  expect(await page.evaluate(() => [...document.fonts].some(font => font.family === 'IBM Plex Sans' && font.status === 'loaded'))).toBeTruthy();
  const loadedFonts = await page.evaluate(() => [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family));
  expect(loadedFonts).not.toContain('Instrument Serif');
  expect(loadedFonts).not.toContain('Source Serif 4');
  await expect(page.locator('.v4-intro .v4-button')).toHaveAttribute('href', 'https://istocklens.com/download');
  const verified = new Set(['/stocks', '/stocks/aapl', '/download', '/privacy', '/terms', '/version-4/']);
  const refs = await page.locator('[href], [src]').evaluateAll(nodes => nodes.flatMap(node => ['href', 'src'].filter(attr => node.hasAttribute(attr)).map(attr => node.getAttribute(attr))));
  for (const ref of new Set(refs)) {
    if (ref.startsWith('#')) expect(await page.locator(`[id="${ref.slice(1)}"]`).count(), ref).toBe(1);
    else if (ref.startsWith('/')) expect((await request.get(baseURL + ref)).status(), ref).toBe(200);
    else { expect(new URL(ref).origin).toBe('https://istocklens.com'); expect(verified.has(new URL(ref).pathname), ref).toBeTruthy(); }
  }
  for (const [file, family] of [['ibm-plex-sans-latin.woff2', 'IBM Plex Sans']]) {
    const font = await request.get(`/assets/fonts/${file}`);
    expect((await font.body()).subarray(0, 4).toString(), family).toBe('wOF2');
  }
  for (const name of ['IBMPlexSans', 'SourceSerif4']) expect(await (await request.get(`/assets/fonts/${name}-OFL.txt`)).text()).toContain('SIL OPEN FONT LICENSE Version 1.1');
  const png = await (await request.get('/assets/images/version-4-social.png')).body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  const versions = page.getByRole('navigation', { name: 'Compare designs' });
  for (const number of [1, 2, 3, 4]) await expect(versions.getByRole('link', { name: `Version ${number}`, exact: true })).toHaveAttribute('href', `/version-${number}/`);
  await expect(versions.getByRole('link', { name: 'Version 4', exact: true })).toHaveAttribute('aria-current', 'page');
  expect(errors).toEqual([]);
  expect(remote).toEqual([]);
});

test('V4 responsive notebook and ledger fit all research states', async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(v4);
    await page.evaluate(() => document.fonts.ready);
    for (const tab of await page.getByRole('tab').all()) {
      await tab.click();
      await expect(page.getByRole('tabpanel')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}px`).toBeTruthy();
      const notebook = await page.locator('.v4-notebook').boundingBox();
      const panel = await page.getByRole('tabpanel').boundingBox();
      expect(panel.x).toBeGreaterThanOrEqual(notebook.x);
      expect(panel.x + panel.width).toBeLessThanOrEqual(notebook.x + notebook.width + 1);
    }
    await page.getByRole('tab', { name: /The readout/ }).click();
    await expect(page.locator('.v4-ledger tbody th')).toHaveText(['Growth', 'Profitability', 'Cash', 'Valuation', 'Stability']);
    await expect(page.locator('.v4-data-score')).toHaveText(['65', '90', '90', '49', '75']);
    if (width >= 960) {
      const intro = await page.locator('.v4-intro').boundingBox();
      const example = await page.locator('.v4-example').boundingBox();
      expect(intro.x + intro.width).toBeLessThan(example.x);
      expect(example.y).toBeLessThan(180);
      expect((await page.locator('.v4-readout-summary').boundingBox()).y).toBeLessThan(420);
    }
    const tracks = page.locator('.v4-score-track > span');
    expect(await tracks.evaluateAll(nodes => nodes.map(node => parseFloat(node.style.width)))).toEqual([65, 90, 90, 49, 75]);
    const ledger = await page.locator('.v4-ledger').boundingBox();
    expect(ledger.x).toBeGreaterThan(0);
    expect(ledger.x + ledger.width).toBeLessThan(width);
    expect(await page.locator('.v4-ledger').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBeTruthy();
    if (process.env.SCREENSHOTS) {
      await mkdir('tmp/version-4', { recursive: true });
      await page.evaluate(() => { document.activeElement.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
      await page.screenshot({ path: `tmp/version-4/page-${width}.png`, fullPage: true });
    }
  }
});

test('V4 mobile reading sizes, touch targets and stacked score semantics', async ({ page }) => {
  for (const width of [320, 375, 390, 430, 640, 767, 768, 959]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(v4);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.v4-intro-copy')).toHaveCSS('font-size', '18px');
    await expect(page.locator('.v4-disclosure')).toHaveCSS('font-size', '16px');
    await expect(page.locator('.v4-checklist label > span').first()).toHaveCSS('font-size', '18px');
    for (const tab of await page.getByRole('tab').all()) {
      await tab.click();
      const undersized = await page.evaluate(() => [...document.body.querySelectorAll('*')].filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 1 && rect.height > 1 && !el.closest('[aria-hidden="true"]') &&
          getComputedStyle(el).visibility !== 'hidden' &&
          [...el.childNodes].some(node => node.nodeType === 3 && node.textContent.trim()) &&
          parseFloat(getComputedStyle(el).fontSize) < 14;
      }).map(el => ({ text: el.textContent.trim().slice(0, 60), size: getComputedStyle(el).fontSize })));
      expect(undersized, `small mobile text at ${width}px`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await expect(tab).toHaveCSS('font-size', '16px');
      const target = await tab.boundingBox();
      expect(target.width).toBeGreaterThanOrEqual(44);
      expect(target.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByRole('tab', { name: /The readout/ }).click();
    const table = page.getByRole('table', { name: /Illustrative model scores/ });
    await expect(table).toHaveCount(1);
    await expect(table.getByRole('columnheader')).toHaveCount(3);
    await expect(table.getByRole('rowheader')).toHaveText(['Growth', 'Profitability', 'Cash', 'Valuation', 'Stability']);
    await expect(table.getByRole('cell')).toHaveCount(10);
    await expect(table.getByRole('row')).toHaveCount(6);
    for (const row of await page.locator('.v4-ledger tbody tr').all()) {
      const metric = await row.locator('th').boundingBox();
      const score = await row.locator('td').first().boundingBox();
      const question = await row.locator('td').last().boundingBox();
      expect(metric.x + metric.width).toBeLessThanOrEqual(score.x + 1);
      if (width < 768) {
        await expect(row).toHaveCSS('display', 'grid');
        expect(question.y).toBeGreaterThanOrEqual(metric.y + metric.height);
        await expect(row.locator('.v4-data-score')).toHaveCSS('font-size', '22px');
        await expect(row.locator('.v4-score-unit')).toBeVisible();
      }
    }
    for (const selector of ['.v4-intro .v4-button', '.v4-intro .v4-text-link', '.v4-menu-button', '.v4-checklist label', '.v4-faq summary', '.v4-footer nav a']) {
      for (const control of await page.locator(selector).all()) {
        const target = await control.boundingBox();
        expect(target.width, `${selector} at ${width}px`).toBeGreaterThanOrEqual(44);
        expect(target.height, `${selector} at ${width}px`).toBeGreaterThanOrEqual(44);
      }
    }
  }
});

test('V4 mobile readability changes leave desktop type and table layout intact', async ({ page }) => {
  for (const width of [960, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(v4);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('body')).toHaveCSS('font-size', '16px');
    await expect(page.locator('.v4-intro-copy')).toHaveCSS('font-size', width < 1200 ? '16px' : '17px');
    await expect(page.locator('.v4-ledger tbody th').first()).toHaveCSS('font-size', '11px');
    await expect(page.getByRole('tab').first()).toHaveCSS('font-size', '11px');
    await expect(page.locator('.v4-readout-summary strong').first()).toHaveCSS('font-size', '22px');
    await expect(page.locator('.v4-checklist label > span').first()).toHaveCSS('font-size', '13px');
    await expect(page.locator('.v4-ledger')).toHaveCSS('display', 'table');
    await expect(page.locator('.v4-ledger tbody tr').first()).toHaveCSS('display', 'table-row');
    await expect(page.locator('.v4-ledger-mobile-label')).toBeHidden();
    await expect(page.locator('.v4-score-unit').first()).toBeHidden();
  }
});

test('V4 keyboard research, navigation, short-screen menu and FAQs', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(v4);
  const tabs = page.getByRole('tab');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(1).focus();
  for (const [key, index] of [['ArrowRight', 2], ['ArrowRight', 0], ['End', 2], ['Home', 0], ['ArrowLeft', 2]]) {
    await page.keyboard.press(key);
    await expect(tabs.nth(index)).toBeFocused();
    await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
    expect(await tabs.evaluateAll(nodes => nodes.filter(node => node.tabIndex === 0).length)).toBe(1);
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    expect(await tabs.nth(index).evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
  }
  await page.keyboard.press('Tab');
  await expect(page.getByRole('tabpanel')).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('These are checks for you to perform.');
  await page.setViewportSize({ width: 390, height: 320 });
  const menu = page.getByRole('button', { name: 'Menu' });
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav).not.toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  const cta = nav.getByRole('link', { name: /Get iStockLens/ });
  await cta.scrollIntoViewIfNeeded();
  const box = await cta.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(321);
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(nav).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [label, id] of [['Our approach', 'approach'], ['Research example', 'research-example'], ['What to verify', 'verification']]) {
    await menu.click();
    await nav.getByRole('link', { name: label, exact: true }).click();
    await expect(nav).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    const section = await page.locator(`#${id}`).boundingBox();
    expect(section.y).toBeGreaterThanOrEqual(69);
  }
  await menu.click();
  await page.locator('.v4-questions').click({ position: { x: 10, y: 350 } });
  await expect(nav).not.toBeVisible();
  await expect(page.locator('summary')).toHaveCount(4);
  for (const summary of await page.locator('summary').all()) {
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(summary.locator('..')).toHaveAttribute('open', '');
    await page.keyboard.press('Space');
    await expect(summary.locator('..')).not.toHaveAttribute('open');
  }
  await page.goto(v4);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('V4 reflection checklist and actual downloadable worksheet do not certify investments', async ({ page, request }) => {
  await page.goto(v4);
  const boxes = page.getByRole('checkbox');
  await expect(boxes).toHaveCount(3);
  const progress = page.locator('[data-v4-progress]');
  await expect(progress).toHaveText('0 of 3 questions considered.');
  for (let i = 0; i < 3; i++) {
    await boxes.nth(i).check();
    await expect(progress).toHaveText(`${i + 1} of 3 questions considered.${i === 2 ? ' Keep verifying.' : ''}`);
  }
  await boxes.first().uncheck();
  await expect(progress).toHaveText('2 of 3 questions considered.');
  await expect(page.locator('.v4-checklist-card')).toContainText('does not verify a claim or make an investment safe');
  const link = page.getByRole('link', { name: /Download the research checklist/ });
  await expect(link).toHaveAttribute('download', '');
  await expect(link).toHaveAttribute('href', '/assets/resources/independent-research-checklist.txt');
  const response = await request.get('/assets/resources/independent-research-checklist.txt');
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toContain('THE INDEPENDENT INVESTOR\'S RESEARCH CHECKLIST');
  expect(body).toContain('does not certify an investment as safe or suitable');
  const downloadPromise = page.waitForEvent('download');
  await link.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('independent-research-checklist.txt');
  expect(await readFile(await download.path(), 'utf8')).toBe(body);
  await page.reload();
  await expect(progress).toHaveText('0 of 3 questions considered.');
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test('V4 axe accessibility across notebook, reflection, FAQ and menu states', async ({ page }) => {
  test.setTimeout(60000);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(v4);
    await page.evaluate(() => document.fonts.ready);
    for (const tab of await page.getByRole('tab').all()) {
      await tab.click();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(results.violations).toEqual([]);
    }
    for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
    for (const summary of await page.locator('summary').all()) await summary.click();
    if (width < 960) await page.getByRole('button', { name: 'Menu' }).click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('V4 useful no-JS research, controls and reduced-motion fallback', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto(baseURL + v4);
    await page.evaluate(() => document.fonts.ready);
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Menu' })).not.toBeVisible();
      await expect(page.locator('[data-v4-tablist]')).not.toBeVisible();
      await expect(page.locator('[data-v4-panel]:visible')).toHaveCount(3);
      await expect(page.locator('[data-v4-progress]')).not.toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no JS at ${width}`).toBeTruthy();
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
    }
    await page.getByRole('checkbox').first().check();
    await expect(page.getByRole('checkbox').first()).toBeChecked();
    await page.locator('summary').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('details').first()).toHaveAttribute('open', '');
    await expect(page.getByRole('link', { name: /Download the research checklist/ })).toHaveAttribute('download', '');
    await page.getByRole('link', { name: /Inspect a sample/ }).click();
    await expect(page).toHaveURL(/#research-example$/);
  } finally { await context.close(); }
});

const readableVariants = [
  { name: 'Original', route: '/', prefix: '' },
  { name: 'V1', route: '/version-1/', prefix: '' },
  { name: 'V2', route: '/version-2/', prefix: 'v2-' },
  { name: 'V3', route: '/version-3/', prefix: '' },
];

async function expectReadableMobileText(page, label) {
  const undersized = await page.evaluate(() => [...document.body.querySelectorAll('*')].filter(el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1 && !el.closest('[aria-hidden="true"]') &&
      getComputedStyle(el).visibility !== 'hidden' &&
      [...el.childNodes].some(node => node.nodeType === 3 && node.textContent.trim()) &&
      parseFloat(getComputedStyle(el).fontSize) < 14;
  }).map(el => ({ text: el.textContent.trim().slice(0, 60), size: getComputedStyle(el).fontSize })));
  expect(undersized, label).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label).toBeTruthy();
}

for (const { name, route, prefix } of readableVariants) {
  test(`${name} mobile reading comfort across all research states and controls`, async ({ page }) => {
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [320, 375, 390, 430, 640, 767, 768, 900, 959]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator(`.${prefix}hero-description`)).toHaveCSS('font-size', '18px');
      await expect(page.locator(`.${prefix}hero-guarantee`)).toHaveCSS('font-size', '16px');
      await expect(page.locator(`.${prefix}guarantee-exact`)).toHaveCSS('font-size', '18px');
      await expect(page.locator(`.${prefix}score-row strong`).first()).toHaveCSS('font-size', '22px');
      for (const row of await page.locator(`.${prefix}score-row`).all()) {
        const metric = await row.locator(':scope > span').boundingBox();
        const score = await row.locator('strong').boundingBox();
        const bar = await row.locator(`.${prefix}score-track`).boundingBox();
        expect(metric.x + metric.width).toBeLessThanOrEqual(score.x);
        expect(bar.y).toBeGreaterThanOrEqual(Math.max(metric.y + metric.height, score.y + score.height));
      }
      for (const tab of await page.getByRole('tab').all()) {
        await tab.click();
        await expect(tab).toHaveCSS('font-size', '16px');
        await expectReadableMobileText(page, `${name}, ${width}px, ${await tab.textContent()}`);
        const target = await tab.boundingBox();
        expect(target.width).toBeGreaterThanOrEqual(44);
        expect(target.height).toBeGreaterThanOrEqual(44);
      }
      if (prefix === 'v2-') await expect(page.locator('.v2-valuation-number')).toHaveCSS('font-size', '72px');
      for (const selector of [`.${prefix}hero-actions a`, `.${prefix}menu-toggle`, `.${prefix}faq-list summary`, `.${prefix}footer-top nav a`, '.v3-footer-versions a', '.v2-footer .v2-switch a']) {
        for (const control of await page.locator(selector).all()) {
          const target = await control.boundingBox();
          expect(target.width, `${name} ${selector} at ${width}px`).toBeGreaterThanOrEqual(44);
          expect(target.height, `${name} ${selector} at ${width}px`).toBeGreaterThanOrEqual(44);
        }
      }
      // Include normally hidden FAQ text and the open menu, not just the hero.
      for (const summary of await page.locator('summary').all()) await summary.click();
      expect(await page.locator(`.${prefix}faq-answer`).evaluateAll(nodes => nodes.map(node => getComputedStyle(node).fontSize))).toEqual(Array(6).fill('18px'));
      await page.getByRole('button', { name: 'Menu' }).click();
      const nav = page.getByRole('navigation', { name: 'Main navigation' });
      for (const link of await nav.getByRole('link').all()) {
        const target = await link.boundingBox();
        expect(target.width).toBeGreaterThanOrEqual(44);
        expect(target.height).toBeGreaterThanOrEqual(44);
      }
      await expectReadableMobileText(page, `${name}, ${width}px, expanded FAQs/menu`);
      await page.keyboard.press('Escape');
    }
  });
}

test('mobile readability overrides preserve original/V1/V2/V3 desktop typography and grids', async ({ page }) => {
  for (const { name, route, prefix } of readableVariants) {
    for (const width of [960, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('body')).toHaveCSS('font-size', '15px');
      const introSize = name === 'V3' ? (width < 1200 ? 14 : 15) : name === 'V2' ? (width < 1200 ? 14 : 15) : width >= 1500 ? 16 : width < 1200 ? 13 : 15;
      await expect(page.locator(`.${prefix}hero-description`)).toHaveCSS('font-size', `${introSize}px`);
      const buttonSize = name === 'V2' ? (width < 1200 ? 12 : 13) : name === 'V3' ? (width < 1200 ? 11 : 13) : width < 1200 ? 11 : 12;
      await expect(page.locator(`.${prefix}hero-actions .${prefix}button`).first()).toHaveCSS('font-size', `${buttonSize}px`);
      const columns = selector => page.locator(selector).first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
      expect(await columns(`.${prefix}hero-grid`)).toBe(2);
      expect(await columns(`.${prefix}score-row`)).toBe(3);
    }
  }
});

test('all earlier variants retain readable no-JS mobile navigation, research and FAQs', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    for (const { name, route, prefix } of readableVariants) {
      await page.goto(baseURL + route);
      for (const width of [320, 390, 768, 959]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(() => document.fonts.ready);
        await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
        await expect(page.locator('[data-panel]:visible')).toHaveCount(3);
        await expect(page.locator(`.${prefix}hero-description`)).toHaveCSS('font-size', '18px');
        await expectReadableMobileText(page, `${name} no-JS at ${width}px`);
      }
      await page.locator('summary').first().click();
      await expect(page.locator(`.${prefix}faq-answer`).first()).toBeVisible();
      await expect(page.locator(`.${prefix}faq-answer`).first()).toHaveCSS('font-size', '18px');
    }
  } finally { await context.close(); }
});
