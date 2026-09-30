// Explicitly opt-in, networked smoke; never part of deterministic browser suite.
// Run: node tests/stripe-real-smoke.mjs (production _site build required).
import { chromium, expect } from '@playwright/test';
import { serveSite } from './site-fixture.mjs';
import { mkdir, writeFile } from 'node:fs/promises';

const site = await serveSite();
const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL || 'chromium' });
const results = [];
await mkdir('tmp/signup-flow', { recursive: true });
try {
  for (const variant of [1, 2, 3, 4]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const forbiddenRequests = [], consoleErrors = [], paymentCalls = [];
    await page.addInitScript(() => {
      window.__paymentCalls = [];
      let realStripe;
      Object.defineProperty(window, 'Stripe', {
        configurable: true,
        get: () => realStripe,
        set: constructor => {
          realStripe = new Proxy(constructor, { apply(target, receiver, args) {
            const stripe = Reflect.apply(target, receiver, args);
            for (const name of ['createToken', 'createPaymentMethod', 'createSource', 'confirmPayment', 'confirmCardPayment']) {
              stripe[name] = () => { window.__paymentCalls.push(name); throw new Error('Forbidden demo payment API'); };
            }
            return stripe;
          }});
        },
      });
    });
    await page.route('**/*', async route => {
      const request = route.request();
      if (/api\.stripe\.com\/v1\/(tokens|payment_methods|payment_intents|sources|charges)/.test(request.url())) {
        forbiddenRequests.push(request.url()); await route.abort();
      } else await route.continue();
    });
    page.on('pageerror', error => consoleErrors.push(error.message));
    await page.goto(`${site.url}/version-${variant}/`);
    await page.locator('main [data-signup]').first().click();
    await page.locator('#sf-email').fill('real-smoke@example.test');
    await page.locator('[data-sf-next]').click();
    await page.getByRole('radio', { name: 'Intermediate', exact: true }).check();
    await page.locator('[data-sf-next]').click();
    await page.getByRole('radio', { name: 'US', exact: true }).check();
    await page.locator('[data-sf-next]').click();
    await expect(page.locator('[data-sf-payment-status]')).toContainText('ready', { timeout: 20000 });
    const typography = [];
    for (const [id, name, value] of [['number', 'cardnumber', '4242424242424242'], ['expiry', 'exp-date', '1239'], ['cvc', 'cvc', '123']]) {
      const frame = page.frameLocator(`#sf-card-${id} iframe`).first();
      const input = frame.locator(`input[name="${name}"]`);
      await input.fill(value);
      typography.push(await input.evaluate(el => ({ font: getComputedStyle(el).fontFamily, size: getComputedStyle(el).fontSize })));
    }
    await expect(page.locator('#sf-payment-error')).not.toBeVisible();
    const fontEvidence = await page.frameLocator('#sf-card-number iframe').first().locator('body').evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].map(font => ({ family: font.family, status: font.status }));
    });
    await page.screenshot({ path: `tmp/signup-flow/real-v${variant}-payment.png`, fullPage: true });
    // Cross-origin iframe Tab must remain in the native modal.
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement.closest('dialog'))).toBe(true);
    }
    await page.locator('[data-sf-next]').click();
    await expect(page.locator('[data-sf-step="5"]')).toBeVisible();
    paymentCalls.push(...await page.evaluate(() => window.__paymentCalls));
    expect(paymentCalls).toEqual([]);
    expect(forbiddenRequests).toEqual([]);
    expect(typography.every(item => parseFloat(item.size) >= 16)).toBe(true);
    results.push({ variant, result: 'ready, interactive test entry, keyboard and simulated success passed', typography, fontEvidence, paymentCalls, forbiddenRequests, consoleErrors });
    await page.close();
  }
} catch (error) {
  results.push({ error: error.stack });
  process.exitCode = 1;
} finally {
  await writeFile('tmp/signup-flow/real-stripe.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  await site.close();
}
