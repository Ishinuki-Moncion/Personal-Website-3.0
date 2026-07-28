/* Regression for the two-clock boot deadline defect (audit finding, 2026-07-27).
 *
 * js/boot.js's desktop hard cap was measured from the moment boot.js EVALUATES,
 * while index.html's catastrophic watchdog is measured from HTML parse. Since
 * boot.js is reached through a chain of dynamic imports, any ordinary slow load
 * pushed its evaluation past the ~1s of headroom between the two and inverted
 * their order — the watchdog fired first, latched `.revealed`, and the later
 * boot:done could no longer remove it because index.html only clears it when its
 * own watchdog has NOT fired.
 *
 * Result on a plain cold-cache desktop visit: scroll-reveal choreography killed
 * for the whole session and boot:done dispatched twice.
 */
import { test, expect } from '@playwright/test';

import { ms } from '../helpers/ci-timing.mjs';

const BOOT_JS = /\/js\/boot\.js(\?|$)/;
const EVALUATION_DELAY_MS = 2500;

test('a slow boot.js evaluation still finishes inside the catastrophic watchdog', async ({ page }) => {
  test.setTimeout(60_000);

  await page.addInitScript(() => {
    window.__bootDoneCount = 0;
    document.addEventListener('boot:done', () => { window.__bootDoneCount++; });
  });

  /* Delay only boot.js, so the rest of the module graph loads normally and the
     single variable under test is when boot.js starts running. */
  await page.route(BOOT_JS, async route => {
    await new Promise(resolve => setTimeout(resolve, EVALUATION_DELAY_MS));
    await route.continue();
  });

  await page.goto('/');

  /* Wait past both deadlines: the 9s boot cap and the 10s watchdog. */
  await expect
    .poll(() => page.evaluate(() => window.__bootDoneCount), { timeout: ms(25_000) })
    .toBeGreaterThan(0);
  await page.waitForTimeout(3_000);

  const state = await page.evaluate(() => ({
    bootDoneCount: window.__bootDoneCount,
    revealedLatched: document.body.classList.contains('revealed'),
    booting: document.body.hasAttribute('data-booting'),
  }));

  expect(state.bootDoneCount, 'boot:done must be dispatched exactly once').toBe(1);
  expect(
    state.revealedLatched,
    'body.revealed stayed latched — the watchdog beat the boot cap, so the CSS force-reveal ' +
    'permanently overrides the scroll-reveal choreography'
  ).toBe(false);
  expect(state.booting, 'the boot overlay must be released').toBe(false);
});

test('essential content is reachable even when the boot cap is the thing that releases it', async ({ page }) => {
  test.setTimeout(60_000);
  await page.route(BOOT_JS, async route => {
    await new Promise(resolve => setTimeout(resolve, EVALUATION_DELAY_MS));
    await route.continue();
  });
  await page.goto('/');

  await expect(page.locator('body')).not.toHaveAttribute('data-booting', '', { timeout: ms(25_000) });
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ishinuki Daikie');
  await expect(page.locator('#contact')).toBeAttached();
});
