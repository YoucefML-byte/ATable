import { defineConfig, devices } from '@playwright/test';

// End-to-end scenarios (vol. 08 §1.1). Hosts are subdomains of localhost, which browsers resolve
// to the local machine: bistrot.localhost, lounge.localhost, pro.localhost, console.localhost.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;
const launchOptions = executablePath ? { executablePath } : {};

export default defineConfig({
  testDir: './tests/e2e',
  // Outside the project in development: files written under the project root make `next dev`
  // reload the page.
  outputDir: process.env.PW_OUTPUT_DIR || 'test-results',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },
  projects: [
    // Mobile projects use the Chromium engine with the device viewport and user agent; in CI,
    // install WebKit to run "iPhone 13" on its real engine.
    { name: 'iphone-13', use: { ...devices['iPhone 13'], browserName: 'chromium', launchOptions }, grep: /@mobile/ },
    { name: 'pixel-7', use: { ...devices['Pixel 7'], launchOptions }, grep: /@mobile/ },
    { name: 'tablette', use: { viewport: { width: 1024, height: 768 }, hasTouch: true, launchOptions }, grep: /@tablet/ },
    { name: 'bureau', use: { ...devices['Desktop Chrome'], launchOptions }, grep: /@desktop/ },
  ],
  ...(process.env.E2E_NO_SERVER
    ? {}
    : {
        webServer: {
          command: process.env.CI ? 'pnpm build && pnpm start' : 'pnpm dev',
          url: 'http://localhost:3000/api/health',
          reuseExistingServer: true,
          timeout: 240_000,
        },
      }),
});
