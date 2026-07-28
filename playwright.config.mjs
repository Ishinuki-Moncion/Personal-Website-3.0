import { defineConfig, devices } from '@playwright/test';

import { ms } from './tests/helpers/ci-timing.mjs';

// Playwright supplies FORCE_COLOR to workers; inheriting NO_COLOR as well makes
// Node emit a warning before every otherwise-clean test run.
delete process.env.NO_COLOR;

export default defineConfig({
  testDir: 'tests/browser',
  timeout: ms(30_000),
  expect: { timeout: ms(8_000) },
  /* No retries, deliberately. Two of the fifteen failures in run 30331300075
     were real product defects that a retry policy would have reclassified as
     flake — the whole value of this gate is that it cannot do that. */
  retries: 0,
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
