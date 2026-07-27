/* Regression for the boot.mjs serial-dependency-chain finding (audit, 2026-07-27).
 *
 * Spec 2026-07-21 §A3 requires that "boot.mjs becomes a coordinator rather than a
 * serial dependency chain" and that essential navigation, language, gallery,
 * contact and accessibility behavior survive a failure of the optional scene.
 *
 * It shipped as four unguarded sequential `await import()` calls. Because
 * js/boot.js is the only code besides index.html's 10s watchdog that removes
 * `data-booting` — and `body[data-booting]{overflow:hidden}` locks scrolling —
 * a failed fetch of ANY earlier module, including the purely decorative custom
 * cursor, left the visitor staring at the boot overlay unable to scroll.
 */
import { expect, test } from '@playwright/test';

/** Fail one module request and report how the page copes.
 *
 * Seeds the returning-visitor flag so js/boot.js takes its instant(), terminal
 * path. Without that, a desktop first visit reveals on the 9000ms cinematic cap,
 * which would swamp the thing under test — the question here is whether the
 * reveal happens AT ALL when an optional module is missing, not how long the
 * intro runs. With an instant boot, a healthy page reveals in well under a
 * second and a broken chain waits for index.html's 10s watchdog, so the two are
 * cleanly separated. */
async function bootWithModuleAborted(page, pattern) {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('daikie-booted', '1'); } catch { /* privacy modes */ }
  });
  await page.route(pattern, route => route.abort());
  const started = Date.now();
  await page.goto('/');
  await expect(page.locator('body')).not.toHaveAttribute('data-booting', '', { timeout: 4_000 });
  return Date.now() - started;
}

test('a failed DECORATIVE module never traps the page under the boot overlay', async ({ page }) => {
  /* js/cursor.js draws the custom HUD reticle and nothing else. Losing it must
     cost the reticle, not the website. */
  const revealMs = await bootWithModuleAborted(page, /\/js\/cursor\.js(\?|$)/);

  expect(
    revealMs,
    'losing a decorative module must not push reveal out to the catastrophic watchdog'
  ).toBeLessThan(4_000);

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ishinuki Daikie');
  await expect(page.locator('#contact')).toBeAttached();

  /* Essential interactive behavior from app.js must still be wired up. */
  await expect(page.locator('.shot').first()).toBeVisible();
  await page.locator('.lang-btn').first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');

  const scrollLocked = await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden');
  expect(scrollLocked, 'the page must not be left scroll-locked').toBe(false);
});

test('a failed effects module leaves the page VISIBLE, not merely attached', async ({ page }) => {
  await bootWithModuleAborted(page, /\/js\/effects\.js(\?|$)/);

  /* js/effects.js owns the scroll reveal: its line 104 is the only code anywhere
     that adds `.seen`, which lifts `[data-reveal]{opacity:0}`. Losing it must not
     leave a page that scrolls but shows nothing.

     The first version of this test asserted toBeAttached(), which a page with all
     34 revealed elements at opacity 0 satisfies perfectly — so it passed while the
     site was blank. Assert what a visitor can actually SEE. */
  /* The safety-net class lands a microtask after data-booting clears, and the
     helper returns on the earlier signal — so poll for the settled state rather
     than sampling mid-transition. A genuine regression still fails, on timeout. */
  await expect
    .poll(() => page.evaluate(() =>
      [...document.querySelectorAll('[data-reveal]')].filter(el => Number(getComputedStyle(el).opacity) === 0).length
    ), { timeout: 6_000 })
    .toBe(0);

  const visibility = await page.evaluate(() => {
    const revealed = [...document.querySelectorAll('[data-reveal]')];
    return {
      total: revealed.length,
      invisible: revealed.filter(el => Number(getComputedStyle(el).opacity) === 0).length,
      gallery: getComputedStyle(document.querySelector('.shot')).opacity,
      contact: getComputedStyle(document.querySelector('#contact h2')).opacity,
    };
  });

  expect(visibility.total, 'the page should have revealed elements to check').toBeGreaterThan(10);
  expect(
    visibility.invisible,
    `${visibility.invisible}/${visibility.total} revealed elements are at opacity 0 — ` +
    'losing the reveal module left a blank scrolling page'
  ).toBe(0);
  expect(Number(visibility.gallery)).toBeGreaterThan(0);
  expect(Number(visibility.contact)).toBeGreaterThan(0);

  await page.locator('.lang-btn').first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
});

/* The try/catch that produces { ok:false } and marks the scene unavailable lives
   INSIDE scene-bootstrap.mjs, so it cannot cover its own module fetch. A 404 on
   that one file — a deploy-artifact allowlist miss or a cache-bust mismatch —
   left __SCENE_STATUS unset, body.dataset.scene null, scene:ready never fired,
   and surfaced an unhandled module rejection. */
test('losing scene-bootstrap itself still reports the scene as unavailable', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.route(/\/js\/scene-bootstrap\.mjs(\?|$)/, route => route.abort());
  await page.goto('/');
  await expect(page.locator('body')).not.toHaveAttribute('data-booting', '', { timeout: 9_000 });

  await expect
    .poll(() => page.evaluate(() => window.__SCENE_STATUS?.ok), { timeout: 8_000 })
    .toBe(false);

  const state = await page.evaluate(() => ({
    scene: document.body.dataset.scene,
    sceneReadyFired: window.__SCENE_READY_FIRED === true,
  }));
  expect(state.scene, 'the scene must be marked unavailable').toBe('unavailable');
  expect(state.sceneReadyFired, 'scene:ready must fire even when the boundary module is the thing that failed').toBe(true);

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ishinuki Daikie');
  expect(pageErrors, 'a missing optional module must not surface as an unhandled page error').toEqual([]);
});
