/* The lightbox open path must not depend on a View Transition completing.
 *
 * FINDING (2026-07-28, from CI trace evidence, not inference). openLb() adds the
 * `.open` class ONLY from inside the document.startViewTransition() update
 * callback. That callback is invoked by the browser at a rendering opportunity,
 * after it has captured the old-state snapshot of the whole page — including a
 * full-viewport WebGL canvas. If that capture stalls, nothing else ever opens
 * the lightbox: a visitor taps a photograph and the page simply does nothing.
 *
 * This is not hypothetical. On the GitHub runner (no GPU, Chromium launched
 * with --enable-unsafe-swiftshader) the trace for the WebKit interaction matrix
 * shows the screencast producing frames every 40-110ms right up to the click,
 * then ZERO frames for the following 8 seconds, while Playwright successfully
 * re-resolved the .lightbox locator three times over the same window. The page
 * was alive and executing script but not rendering — the exact signature of a
 * capture that never finishes. Nine of that run's fifteen failures were this.
 *
 * The stub below reproduces the mechanism deterministically in both engines,
 * independently of whether the engine ships View Transitions at all.
 */
import { expect, test } from '@playwright/test';

import { ms } from '../helpers/ci-timing.mjs';

/* A transition handle that never invokes its update callback — a capture that
   has begun and will not complete — but is otherwise faithful to the spec,
   because the fallback's correctness depends on that detail: skipTransition()
   REJECTS `ready`, and an unobserved rejection is reported as a page error. A
   stub that resolved everything would let the fallback pass here and then
   announce itself as a fault on the machine it exists for. */
async function stallViewTransitions(page) {
  await page.addInitScript(() => {
    window.__VT_STARTED = 0;
    window.__VT_SKIPPED = 0;
    document.startViewTransition = () => {
      window.__VT_STARTED++;
      const never = new Promise(() => {});
      let rejectReady;
      const ready = new Promise((_, reject) => { rejectReady = reject; });
      return {
        ready,
        updateCallbackDone: never,
        finished: never,
        skipTransition() {
          window.__VT_SKIPPED++;
          rejectReady(new DOMException('Transition was skipped', 'AbortError'));
        }
      };
    };
  });
}

function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  return errors;
}

async function bootQuietly(page) {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('daikie-booted', '1'); } catch { /* privacy modes */ }
  });
  await page.goto('/');
  await expect(page.locator('body')).not.toHaveAttribute('data-booting', '', { timeout: ms(9_000) });
}

test('a View Transition that never completes still opens the lightbox', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = collectPageErrors(page);
  await stallViewTransitions(page);
  await bootQuietly(page);

  await page.locator('.gallery-grid .shot').first().click();

  /* The transition must actually have been attempted — otherwise this test
     would pass for the trivial reason that the morph path was never taken,
     and would stop guarding the defect the moment the branch changed. */
  await expect.poll(() => page.evaluate(() => window.__VT_STARTED)).toBeGreaterThan(0);

  await expect(page.locator('.lightbox')).toHaveClass(/\bopen\b/);
  await expect(page.locator('.lb-pos')).toHaveText('01/12');
  /* The photograph itself must arrive, not just the container: the stalled
     branch is also the one that assigns lb-img's src. */
  await expect.poll(() => page.evaluate(() => document.querySelector('.lb-img')?.naturalWidth || 0)).toBeGreaterThan(0);

  /* The abandoned transition must be released, and releasing it must stay
     silent — a fallback that works but logs an unhandled rejection would fail
     the console-error assertion the interaction matrix makes on every viewport. */
  expect(await page.evaluate(() => window.__VT_SKIPPED)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('the lightbox still closes and releases the page after a stalled transition', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await stallViewTransitions(page);
  await bootQuietly(page);

  /* The baseline is NOT "nothing is inert": the closed mobile menu, the closed
     lightbox and the closed deck are all inert by design. What must hold is
     that closing restores exactly the state the page started in — which is the
     whole point of the owned-inert bookkeeping, and what a re-baselining bug
     would break by leaving nav, main and the gallery dead until a reload. */
  const inertNow = () => page.evaluate(() =>
    [...document.body.children].filter(el => el.inert).map(el => el.className || el.tagName).sort());
  const baseline = await inertNow();
  expect(baseline, 'the gallery must be interactive before we start').not.toContain('gallery');

  const first = page.locator('.gallery-grid .shot').first();
  await first.click();
  await expect(page.locator('.lightbox')).toHaveClass(/\bopen\b/);

  await page.keyboard.press('Escape');
  await expect(page.locator('.lightbox')).not.toHaveClass(/\bopen\b/);

  expect(await inertNow()).toEqual(baseline);
  await expect(page.locator('.gallery-grid .shot').first()).toBeVisible();
  await first.click();
  await expect(page.locator('.lightbox')).toHaveClass(/\bopen\b/);
});
