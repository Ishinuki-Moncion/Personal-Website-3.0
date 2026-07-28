import { test, expect } from '@playwright/test';

import { DESKTOP_LITE_THRESHOLD_MS } from '../../js/quality-policy.mjs';
import { SOFTWARE_RENDERER } from '../helpers/ci-timing.mjs';

/* DESKTOP_LITE_THRESHOLD_MS is the one constant here that cannot be derived —
   it has to be calibrated against real machines. This reports what the current
   machine actually measured, and on a machine that cannot rasterise it also
   asserts the constant did its job. Without this the threshold would be a
   number nobody ever checked again. */
test('the desktop capability ceiling is reported, and holds on this machine', async ({ page }) => {
  await page.goto('/?sceneDebug=1');
  await expect.poll(() => page.evaluate(() => window.__TIER_PROBE !== null || window.__SCENE_STATUS != null)).toBe(true);
  const probe = await page.evaluate(() => window.__TIER_PROBE);
  const tier = await page.evaluate(() => document.body.dataset.scene ?? null);
  console.log(`[tier-probe] ceiling=${DESKTOP_LITE_THRESHOLD_MS}ms probe=${JSON.stringify(probe)} scene=${tier}`);

  if (!SOFTWARE_RENDERER || !probe) return;
  /* On the GPU-less runner the machine must land on the incapable side, by
     whichever half of the rule applies — otherwise the desktop viewports get
     the full scene and the page stops responding, which is the defect this
     rule exists to prevent. */
  const incapable = ['no-webgl2', 'error', 'budget'].includes(probe.reason)
    || (Number.isFinite(probe.score) && probe.score > DESKTOP_LITE_THRESHOLD_MS);
  expect(
    incapable,
    `a runner with no GPU measured ${JSON.stringify(probe)}, which this rule reads as capable — recalibrate DESKTOP_LITE_THRESHOLD_MS`
  ).toBe(true);
});

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
