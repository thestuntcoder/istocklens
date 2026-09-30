import { test, expect } from './site-fixture.mjs';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { stubStripe, stripeStub } from './stripe-stub.mjs';

const guaranteeCopy = 'If you don’t use or don’t find the app useful, you get 100% of your money back.';
const guaranteeScope = 'This covers your app subscription, not investment performance or losses.';
const next = page => page.locator('[data-sf-next]').click();
const step = (page, n) => expect(page.locator(`[data-sf-step="${n}"]`)).toBeVisible();
async function toPayment(page, geometry = false) {
  await page.locator('#sf-email').fill('reader@example.test');
  await next(page);
  if (geometry) await checkGeometry(page);
  await page.getByRole('radio', { name: 'Intermediate', exact: true }).check();
  await next(page);
  if (geometry) await checkGeometry(page);
  await page.getByRole('radio', { name: 'EU', exact: true }).check();
  await next(page);
  await step(page, 4);
}
async function enterCards(page) {
  await expect(page.locator('[data-sf-payment-status]')).toContainText('ready');
  for (const [type, value] of [['cardNumber', '4242 4242 4242 4242'], ['cardExpiry', '12/39'], ['cardCvc', '123']]) {
    await page.frameLocator(`iframe[title="${type} test field"]`).getByRole('textbox').fill(value);
  }
}
async function checkGeometry(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const bad = await page.locator('.sf-flow, .sf-close, .sf-exit').evaluateAll(roots => roots.flatMap(root => [...root.querySelectorAll('*'), root]).filter(el => {
    if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') return false;
    return [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 14;
  }).map(el => el.outerHTML));
  expect(bad).toEqual([]);
  for (const control of await page.locator('.sf-flow button:visible, .sf-flow a:visible, .sf-option:visible, .sf-close:visible, .sf-exit:visible').all()) {
    expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  const visibleCopy = page.locator('.sf-copy:visible');
  if (await visibleCopy.count()) expect(await visibleCopy.first().evaluate(el => getComputedStyle(el).fontSize)).toBe('18px');
}

for (const route of ['/', '/version-1/', '/version-2/', '/version-3/', '/version-4/']) {
  test(`every acquisition CTA, lazy boundaries and exclusions ${route}`, async ({ page }) => {
    const requests = await stubStripe(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(route);
    const ctas = page.locator('[data-signup]');
    await expect(ctas).toHaveCount(route.includes('4') ? 3 : 5);
    expect(await page.locator('a[href="https://istocklens.com/download"]:not([data-signup])').count()).toBe(1); // success exit, never an acquisition launcher
    for (const cta of await ctas.all()) {
      await expect(cta).toHaveAttribute('href', 'https://istocklens.com/download');
      await cta.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await step(page, 1);
      await page.keyboard.press('Escape');
      await expect(cta).toBeFocused();
    }
    expect(await page.locator('[data-signup][href*="stocks"], [data-signup][download], [data-signup][href^="#"], [data-signup][href*="privacy"], [data-signup][href*="terms"]').count()).toBe(0);
    await ctas.first().evaluate(link => {
      window.__clickResults = ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'].map(key => {
        const event = new MouseEvent('click', { bubbles: true, cancelable: true, [key]: true });
        // prevent navigation after observing the enhancement's decision
        const listener = e => { window.__lastPrevented = e.defaultPrevented; e.preventDefault(); };
        window.addEventListener('click', listener, { once: true });
        link.dispatchEvent(event);
        return window.__lastPrevented;
      });
    });
    expect(await page.evaluate(() => window.__clickResults)).toEqual([false, false, false, false]);
    await expect(page.getByRole('dialog')).not.toBeVisible();
    expect(requests).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('main [data-signup]').first().click();
    await expect(page).toHaveURL(new RegExp(`/version-${route.match(/\d/)?.[0] || 1}/start/\\?step=1$`));
    await expect(page.locator('dialog')).toHaveCount(0);
  });
}

for (const variant of [1, 2, 3, 4]) {
  for (const mode of ['dialog', 'page']) {
    test(`V${variant} ${mode}: validation, five steps, restoration, axe and captures`, async ({ page }) => {
      test.setTimeout(90000);
      const requests = await stubStripe(page);
      const submissions = [];
      page.on('request', request => { if (request.method() !== 'GET') submissions.push(request.url()); });
      await page.setViewportSize({ width: mode === 'dialog' ? 1440 : 390, height: 1200 });
      await page.goto(`/version-${variant}/${mode === 'page' ? 'start/' : ''}`);
      if (mode === 'dialog') await page.locator('main [data-signup]').first().click();
      await next(page);
      await expect(page.locator('#sf-email')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#sf-email')).toBeFocused();
      await page.locator('#sf-email').fill('invalid');
      await next(page);
      await step(page, 1);
      await page.locator('#sf-email').fill('reader@example.test');
      for (let n = 1; n <= 5; n++) {
        await step(page, n);
        await checkGeometry(page);
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(axe.violations).toEqual([]);
        if (n <= 3) expect(requests).toEqual([]);
        if (n === 1) { await next(page); }
        if (n === 2 || n === 3) {
          await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
          await next(page);
          await expect(page.getByRole('radio').first()).toBeFocused();
          await page.getByRole('radio', { name: n === 2 ? 'Professional' : 'All stocks', exact: true }).check();
          await next(page);
        }
        if (n === 4) {
          await expect(page.locator('.sf-guarantee strong')).toHaveText(guaranteeCopy);
          await expect(page.locator('.sf-guarantee p')).toHaveText(guaranteeScope);
          await next(page);
          await step(page, 4);
          await expect(page.locator('#sf-payment-error')).toBeFocused();
          await enterCards(page);
          expect(await page.evaluate(() => window.__stripeElements.every(item => item.config.style.base.fontSize === '16px'))).toBe(true);
          await mkdir('tmp/signup-flow', { recursive: true });
          await page.screenshot({ path: `tmp/signup-flow/v${variant}-${mode}-payment.png`, fullPage: mode === 'page' });
          await page.locator('[data-sf-back]').click();
          await step(page, 3);
          await expect(page.getByRole('radio', { name: 'All stocks', exact: true })).toBeChecked();
          await page.locator('[data-sf-back]').click();
          await step(page, 2);
          await expect(page.getByRole('radio', { name: 'Professional', exact: true })).toBeChecked();
          await page.locator('[data-sf-back]').click();
          await step(page, 1);
          await expect(page.locator('#sf-email')).toHaveValue('reader@example.test');
          await next(page); await next(page); await next(page);
          await enterCards(page);
          await next(page);
        }
        if (n === 5) {
          await expect(page.locator('[data-sf-summary="email"]')).toHaveText('reader@example.test');
          await expect(page.locator('[data-sf-step="5"] [data-sf-test-notice]')).toHaveText('Test mode · Account activation isn’t connected yet.');
          await page.screenshot({ path: `tmp/signup-flow/v${variant}-${mode}-success.png`, fullPage: mode === 'page' });
          await page.locator('[data-sf-reset]').click();
          await step(page, 1);
          await expect(page.locator('#sf-email')).toHaveValue('');
          await expect(page.locator('input:checked')).toHaveCount(0);
          await expect(page.locator('[data-sf-summary="email"]')).toBeEmpty();
        }
      }
      expect(requests).toEqual(['https://js.stripe.com/v3/']);
      expect(submissions).toEqual([]);
      expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
      expect(page.url()).not.toContain('reader');
    });
  }
}

test('responsive matrix, short screens, resize preserves mounted answers and reduced motion', async ({ page }) => {
  test.setTimeout(90000);
  await stubStripe(page, 'blocked');
  for (const v of [1, 2, 3, 4]) {
    for (const width of [320, 375, 390, 430, 767, 768, 959, 1440]) {
      await page.setViewportSize({ width, height: width === 768 ? 320 : 760 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/version-${v}/${width < 768 ? 'start/' : ''}`);
      if (width >= 768) await page.locator('main [data-signup]').first().click();
      await checkGeometry(page);
      await toPayment(page, true);
      await checkGeometry(page);
      await page.locator('[data-sf-preset]').click();
      await next(page);
      await step(page, 5);
      await checkGeometry(page);
    }
  }
  await page.goto('/version-4/');
  await page.locator('main [data-signup]').first().click();
  await page.locator('#sf-email').fill('resize@example.test');
  await next(page);
  await page.setViewportSize({ width: 375, height: 600 });
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('radio', { name: 'Beginner', exact: true }).check();
  await page.setViewportSize({ width: 959, height: 320 });
  await expect(page.getByRole('radio', { name: 'Beginner', exact: true })).toBeChecked();
  await page.locator('[data-sf-back]').click();
  await expect(page.locator('#sf-email')).toHaveValue('resize@example.test');
});

test('mobile history privacy, unsafe direct entry, refresh, submit prevention and text-safe success', async ({ page }) => {
  const requests = await stubStripe(page, 'blocked');
  await page.goto('/version-1/start/?step=5&email=unsafe#payload');
  await expect(page).toHaveURL(/start\/\?step=1$/);
  await page.locator('#sf-email').fill('a&copy@example.test'); // valid local-part containing an HTML entity prefix
  await page.locator('form').evaluate(form => form.requestSubmit());
  await step(page, 2);
  await page.getByRole('radio', { name: 'Beginner', exact: true }).check();
  await next(page);
  await page.goBack();
  await step(page, 2);
  await expect(page.getByRole('radio', { name: 'Beginner', exact: true })).toBeChecked();
  await page.goForward();
  await step(page, 3);
  await page.getByRole('radio', { name: 'China', exact: true }).check();
  await next(page);
  await page.locator('[data-sf-preset]').click();
  await next(page);
  await step(page, 5);
  await expect(page.locator('[data-sf-summary="email"]')).toHaveText('a&copy@example.test');
  await expect(page.locator('[data-sf-summary="email"] b')).toHaveCount(0);
  expect(page.url()).toMatch(/\?step=5$/);
  expect(requests.every(url => !url.includes('example.test'))).toBe(true);
  await page.reload();
  await step(page, 1);
  await expect(page).toHaveURL(/\?step=1$/);
  await expect(page.locator('#sf-email')).toHaveValue('');
  await page.goBack();
  await step(page, 1);
});

test('no JS hides unavailable controls and keeps verified fallbacks at all routes', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const v of [1, 2, 3, 4]) {
    await page.goto(`${baseURL}/version-${v}/start/?step=5`);
    await expect(page.locator('[data-signup-flow]')).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Get iStockLens' })).toHaveAttribute('href', 'https://istocklens.com/download');
    await expect(page.locator('input:visible')).toHaveCount(0);
    await page.goto(`${baseURL}/version-${v}/`);
    await expect(page.locator('dialog')).not.toBeVisible();
    for (const cta of await page.locator('[data-signup]').all()) await expect(cta).toHaveAttribute('href', 'https://istocklens.com/download');
  }
  await context.close();
});

test('native modal isolation, scroll restoration, close/backdrop, Menu fallback and iframe keyboard', async ({ page }) => {
  await stubStripe(page);
  await page.setViewportSize({ width: 959, height: 800 });
  await page.goto('/version-4/');
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await page.locator('header [data-signup]').click();
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await expect(page.locator('#sf-title-1')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Menu', exact: true })).toBeFocused();
  await page.locator('main [data-signup]').last().scrollIntoViewIfNeeded();
  const y = await page.evaluate(() => scrollY);
  await page.locator('main [data-signup]').last().click();
  await toPayment(page);
  await enterCards(page);
  await page.frameLocator('iframe[title="cardNumber test field"]').getByRole('textbox').focus();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.title)).toBe('cardExpiry test field');
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement.closest('dialog'))).toBe(true);
  }
  await page.locator('[data-sf-close]').click();
  expect(await page.evaluate(() => scrollY)).toBe(y);
  await expect(page.locator('main')).not.toHaveAttribute('inert');
  await page.locator('main [data-signup]').last().click();
  await page.mouse.click(2, 2);
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('blocked SDK, explicit fallback, retry, incomplete fields and pending close never imply payment', async ({ page }) => {
  await stubStripe(page, 'blocked');
  await page.goto('/version-2/');
  await page.locator('main [data-signup]').first().click();
  await toPayment(page);
  await expect(page.locator('[data-sf-payment-status]')).toContainText('unavailable');
  await expect(page.locator('[data-sf-preset-details]')).not.toBeVisible();
  await next(page); await step(page, 4);
  await page.route('https://js.stripe.com/v3/', route => route.fulfill({ contentType: 'text/javascript', body: stripeStub }));
  await page.locator('[data-sf-retry]').click();
  await expect(page.locator('[data-sf-payment-status]')).toContainText('ready');
  await page.frameLocator('iframe[title="cardNumber test field"]').getByRole('textbox').fill('bad');
  await expect(page.locator('#sf-payment-error')).toContainText('Invalid');
  await next(page); await step(page, 4);
  await enterCards(page);
  await next(page);
  await page.locator('[data-sf-close]').click();
  await page.waitForTimeout(450);
  await page.locator('main [data-signup]').first().click();
  await step(page, 4);
  await page.locator('[data-sf-preset]').click();
  await expect(page.locator('[data-sf-preset-details]')).toBeVisible();
  await page.locator('[data-sf-next]').evaluate(button => { button.click(); button.click(); });
  await step(page, 5);
});

test('SDK timeout and mount timeout, stale callbacks and cancellation', async ({ page }) => {
  test.setTimeout(60000);
  await page.clock.install();
  let release;
  await page.route('https://js.stripe.com/v3/', async route => {
    await new Promise(resolve => { release = resolve; });
    await route.fulfill({ contentType: 'text/javascript', body: stripeStub }).catch(() => {});
  });
  await page.goto('/version-3/');
  await page.locator('main [data-signup]').first().click();
  await toPayment(page);
  await page.clock.fastForward(13000);
  await expect(page.locator('[data-sf-payment-status]')).toContainText('unavailable');
  release();
  await page.locator('[data-sf-close]').click();
  await page.waitForTimeout(100);
  expect(await page.locator('.sf-element iframe').count()).toBe(0);
  await page.unroute('https://js.stripe.com/v3/');
  await stubStripe(page);
  await page.evaluate(() => { window.__stripeNoReady = true; });
  await page.locator('main [data-signup]').first().click();
  await expect(page.locator('.sf-element iframe')).toHaveCount(3);
  await page.clock.fastForward(13000);
  await expect(page.locator('[data-sf-payment-status]')).toContainText('unavailable');
  await page.evaluate(() => window.__stripeElements.forEach(({element}) => { element.fire('ready'); element.fire('change', {complete:true}); }));
  await next(page); await step(page, 4);
  await expect(page.locator('[data-sf-preset-details]')).not.toBeVisible();
});

test('cancelling while SDK is loading cannot mount or auto-select a fallback', async ({ page }) => {
  let release;
  const received = new Promise(resolve => {
    page.route('https://js.stripe.com/v3/', async route => {
      resolve();
      await new Promise(done => { release = done; });
      await route.fulfill({ contentType: 'text/javascript', body: stripeStub }).catch(() => {});
    });
  });
  await page.goto('/version-1/');
  await page.locator('main [data-signup]').first().click();
  await toPayment(page);
  await received;
  await page.locator('[data-sf-close]').click();
  release();
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__stripeCalls?.length || 0)).toBe(0);
  await expect(page.locator('.sf-element iframe')).toHaveCount(0);
  await expect(page.locator('[data-sf-preset-details]')).not.toBeVisible();
});

test('invalid history states, partial Elements and failed fonts remain safe', async ({ page }) => {
  await stubStripe(page);
  await page.route('**/fonts/manrope-latin.woff2', route => route.abort());
  await page.goto('/version-1/start/');
  await page.evaluate(() => {
    history.pushState({}, '', '?step=2.5');
    dispatchEvent(new PopStateEvent('popstate'));
  });
  await step(page, 1);
  await expect(page).toHaveURL(/\?step=1$/);
  await toPayment(page);
  await expect(page.locator('[data-sf-payment-status]')).toContainText('ready');
  expect(await page.evaluate(() => window.__stripeElements[0].config.style.base.fontFamily)).toBe('Arial, sans-serif');
  await page.frameLocator('iframe[title="cardNumber test field"]').getByRole('textbox').fill('4242 4242 4242 4242');
  await next(page); await step(page, 4);
  await page.frameLocator('iframe[title="cardExpiry test field"]').getByRole('textbox').fill('12/39');
  await next(page); await step(page, 4);
  await page.frameLocator('iframe[title="cardCvc test field"]').getByRole('textbox').fill('12');
  await next(page); await step(page, 4);
  await page.frameLocator('iframe[title="cardCvc test field"]').getByRole('textbox').fill('123');
  await next(page); await step(page, 5);
});

test('popup close remains clickable when long payment content is scrolled', async ({ page }) => {
  await stubStripe(page, 'blocked');
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.goto('/version-3/');
  await page.locator('main [data-signup]').first().click();
  await toPayment(page);
  const dialog = page.getByRole('dialog');
  await dialog.evaluate(el => { el.scrollTop = el.scrollHeight; });
  const close = page.getByRole('button', { name: 'Close signup' });
  const box = await close.boundingBox();
  const bounds = await dialog.boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(bounds.y);
  expect(box.y + box.height).toBeLessThanOrEqual(bounds.y + bounds.height);
  expect(await close.evaluate(el => {
    const r = el.getBoundingClientRect();
    return !!document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('[data-sf-close]');
  })).toBe(true);
  await close.click();
  await expect(dialog).not.toBeVisible();
});

test('native form submission cannot send answers even when bypassing JS handlers', async ({ page }) => {
  for (const mode of ['dialog', 'page']) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/version-1/${mode === 'page' ? 'start/' : ''}`);
    if (mode === 'dialog') await page.locator('main [data-signup]').first().click();
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#sf-email').fill('private@example.test');
    await next(page);
    await page.getByRole('radio', { name: 'Professional', exact: true }).check();
    const url = page.url();
    const requests = [];
    const observe = request => requests.push(request.url());
    page.on('request', observe);
    await expect(page.locator('.sf-form')).toHaveAttribute('method', 'dialog');
    await page.locator('.sf-form').evaluate(form => HTMLFormElement.prototype.submit.call(form));
    await page.waitForTimeout(100);
    expect(page.url()).toBe(url);
    expect(requests).toEqual([]);
    if (mode === 'dialog') await expect(page.getByRole('dialog')).not.toBeVisible();
    else await step(page, 2);
    page.off('request', observe);
  }
});

test('customer-facing signup copy stays clean while test-payment boundaries remain explicit', async ({ page }) => {
  await stubStripe(page, 'blocked');
  for (const variant of [1, 2, 3, 4]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/version-${variant}/start/`);
    await expect(page).toHaveTitle('Create your account · iStockLens');
    await expect(page.locator('.sf-badge')).toHaveText('Account setup');
    await expect(page.locator('[data-sf-step="1"] .sf-copy')).toHaveText('Enter your email to get started with iStockLens.');
    await expect(page.locator('[data-sf-test-notice]:visible')).toHaveCount(0);
    await page.locator('#sf-email').fill('reader@example.test');
    for (let n = 1; n <= 5; n++) {
      await step(page, n);
      const visibleCopy = await page.locator('[data-signup-flow]').innerText();
      expect(visibleCopy).not.toMatch(/\b(demo|preview|fictitious|telemetry|token)\b/i);
      if (n < 4) await expect(page.locator('[data-sf-test-notice]:visible')).toHaveCount(0);
      if (n === 2) await page.getByRole('radio', { name: 'Beginner', exact: true }).check();
      if (n === 3) await page.getByRole('radio', { name: 'All stocks', exact: true }).check();
      if (n === 4) {
        await expect(page.locator('.sf-guarantee strong')).toHaveText(guaranteeCopy);
        await expect(page.locator('.sf-guarantee p')).toHaveText(guaranteeScope);
        await expect(page.locator('[data-sf-test-notice]:visible')).toContainText('Use test cards only. No charge will be made.');
        await expect(page.locator('[data-sf-next]')).toHaveText('Complete setup');
        await page.getByRole('button', { name: 'Use a test card', exact: true }).click();
        await expect(page.locator('[data-sf-preset-details]')).toHaveText('Test card ending in 4242 selected.');
      }
      if (n < 5) await next(page);
      else {
        await expect(page.locator('[data-sf-step="5"] .sf-copy')).toHaveText('Your account is getting ready.');
        await expect(page.locator('[data-sf-test-notice]:visible')).toHaveText('Test mode · Account activation isn’t connected yet.');
        await expect(page.getByRole('link', { name: 'Get iStockLens' })).toHaveAttribute('href', 'https://istocklens.com/download');
      }
    }
  }
});

test('source has no payment/signup APIs or persistent PII mechanisms', async () => {
  const source = await readFile('assets/js/signup-flow.js', 'utf8');
  expect(source).not.toMatch(/\.(createToken|createPaymentMethod|confirmPayment|confirmCardPayment|createSource)\s*\(/);
  expect(source).not.toMatch(/localStorage|sessionStorage|console\.|sendBeacon|XMLHttpRequest/);
  expect(source.match(/fetch\(/g)).toHaveLength(1); // local licensed font only
  expect(source).not.toContain('innerHTML');
});
