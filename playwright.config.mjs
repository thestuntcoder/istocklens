import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'page.spec.mjs',
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  reporter: 'list',
  // Route-to-route references are captured fresh, not committed golden images.
  snapshotPathTemplate: '{testDir}/../tmp/browser-comparisons/{testFilePath}/{arg}{ext}',
  use: {
    browserName: 'chromium',
    channel: process.env.CHROME_CHANNEL || 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
