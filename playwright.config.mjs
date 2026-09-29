import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'page.spec.mjs',
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  reporter: 'list',
  use: {
    browserName: 'chromium',
    channel: process.env.CHROME_CHANNEL || 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
