import { test, expect } from '@playwright/test';

test('home boots and exposes the full document without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));

  /* Seed the returning-visitor flag via an init script rather than
     goto -> evaluate -> reload. The old shape armed the pageerror listener, then
     navigated away while js/boot.mjs (a top-level-await module) still had module
     fetches in flight; WebKit reports that aborted graph as a real page error
     ("Importing a module script failed."), which this test then counted as a
     site defect. Measured flake rate before this change: 3 failures in 18 WebKit
     runs (~17%), which also made the documented "qa:all 97 passed" not reliably
     reproducible for anyone following the handoff's verification contract.
     One navigation, no abort, and the assertion still covers the real page. */
  await page.addInitScript(() => {
    try { sessionStorage.setItem('daikie-booted', '1'); } catch { /* privacy modes */ }
  });
  await page.goto('/?sceneDebug=1');
  await expect(page.locator('body')).not.toHaveAttribute('data-booting', '');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ishinuki Daikie');
  await expect(page.locator('#contact')).toBeAttached();
  expect(errors).toEqual([]);
});

test('reduced motion reveals content and selects reduced quality', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?sceneDebug=1');
  await expect.poll(() => page.evaluate(() => typeof window.__sceneDebug)).toBe('function');
  const state = await page.evaluate(() => window.__sceneDebug && window.__sceneDebug());
  expect(state.quality).toBe('reduced');
  await expect(page.locator('[data-reveal]').first()).toBeVisible();
});
