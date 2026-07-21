import { defineConfig, devices } from '@playwright/test';

// Playwright supplies FORCE_COLOR to workers; inheriting NO_COLOR as well makes
// Node emit a warning before every otherwise-clean test run.
delete process.env.NO_COLOR;

export default defineConfig({
  testDir: 'tests/browser',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: 'node tests/helpers/serve.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 15_000
  }
});
