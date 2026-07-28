/* Regressions for two audit findings against Package A (2026-07-27).
 *
 * Both concern the postFX lifecycle on mobile-rich, and both are reachable in
 * production on the owner's primary device class.
 */
import { test, expect } from '@playwright/test';

async function openCoarsePage(browser, viewport) {
  const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true });
  return { context, page: await context.newPage() };
}

async function readSceneState(page) {
  await expect.poll(() => page.evaluate(() => typeof window.__sceneDebug)).toBe('function');
  return page.evaluate(() => window.__sceneDebug());
}

/* FINDING: the 128 MiB attachment gate was evaluated once, at module init.
   sizeComposers() then reallocated both composers on every resize with no
   re-check, so a coarse-pointer device that boots small and grows — an iPad
   leaving Split View is the concrete case — allocated straight through the gate
   that exists to prevent exactly that. Measured 55.6 MiB at boot, 152.6 MiB
   after expanding: a 2.7x overrun of a "fail closed" budget. */
test('growing the viewport past the postFX budget fails closed instead of reallocating', async ({ browser }) => {
  const { context, page } = await openCoarsePage(browser, { width: 500, height: 700 });
  try {
    await page.goto('/?tier=rich&sceneDebug=1');
    const before = await readSceneState(page);
    expect(before.quality).toBe('mobile-rich');
    expect(before.postFX.enabled, 'the small viewport must fit the budget').toBe(true);
    expect(before.postFX.withinBudget).toBe(true);

    await page.setViewportSize({ width: 1600, height: 1600 });
    await expect
      .poll(() => page.evaluate(() => window.__sceneDebug().postFX.enabled), { timeout: 6000 })
      .toBe(false);

    const after = await readSceneState(page);
    expect(after.postFX.withinBudget, 'the grown viewport must be recognised as over budget').toBe(false);
    expect(after.postFX.disposed, 'the over-budget path must dispose, not merely stop using, the chain').toBe(true);
    expect(after.postFX.disposal.retained, 'nothing may stay reachable after the fail-closed dispose').toEqual([]);

    /* Rendering must continue — failing closed means direct rendering, not a dead canvas. */
    const framesBefore = (await readSceneState(page)).renderCounts.direct;
    await page.waitForTimeout(500);
    const framesAfter = (await readSceneState(page)).renderCounts.direct;
    expect(framesAfter, 'the scene must keep rendering directly after failing closed').toBeGreaterThan(framesBefore);
  } finally {
    await context.close();
  }
});

/* FINDING: webglcontextrestored restarted the render loop without resetting the
   `last` timestamp, unlike every other resume path (the debug resume and
   visibilitychange both reset it, the latter with the comment "don't lerp across
   the hidden gap"). The first frame after a restore therefore reported the whole
   lost interval as one elapsed delta, and createFpsDemoter accumulates that raw
   delta — so a single frame could satisfy the "fpsEMA < 45 sustained for four
   seconds" rule outright.
   Consequence: a WebGL context loss, which is exactly what mobile Safari does
   under memory pressure and the reason the handler exists at all, permanently
   demoted the scene to lite for the session on any device. */
/* KNOWN TIMING-SENSITIVE. This test drives a real WEBGL_lose_context cycle and
   then asserts on a 300ms window, so it depends on when Chromium delivers the
   restore event and resumes rAF. Measured flake rates on this machine: 2/6, then
   1/3, then 0/5 after clamping the demoter delta — but ALSO 0/3 with the clamp
   removed, so the clamp is NOT demonstrated to be the cause of the improvement.
   Treated as unresolved rather than fixed. If it fails in CI, re-run before
   investigating: the production behaviour it guards (a context loss must not
   demote on its own) is separately enforced by the clamp in js/background.js. */
test('a context-loss gap does not by itself satisfy the sustained-low-FPS demotion rule', async ({ browser }) => {
  const { context, page } = await openCoarsePage(browser, { width: 390, height: 844 });
  try {
    await page.goto('/?tier=rich&sceneDebug=1');
    const before = await readSceneState(page);
    expect(before.quality).toBe('mobile-rich');
    expect(before.demoted).toBe(false);

    const lost = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
      const extension = gl?.getExtension('WEBGL_lose_context');
      if (!extension) return false;
      window.__loseContext = extension;
      extension.loseContext();
      return true;
    });
    test.skip(!lost, 'WEBGL_lose_context unavailable in this engine');

    /* Stay lost comfortably longer than the four-second demotion window. */
    await page.waitForTimeout(6000);

    /* Inject a below-threshold FPS so the demoter is actually sampled on the
       first frame after restore. Without the fix that frame carries ~6s of
       elapsed time and demotes immediately; with it, it carries one frame.

       The observation window is deliberately short. Injected FPS below the
       threshold makes lowSeconds accumulate in WALL time, so a long window
       eventually demotes legitimately and the test would report the bug it is
       meant to detect — flaky for the same reason Codex's WebKit smoke test was.
       The defect demotes on the FIRST frame (~16ms), so 300ms detects it with a
       13x margin against the 4s rule, and the healthy value is restored
       immediately afterwards so nothing accumulates while later assertions run. */
    await page.evaluate(() => window.__sceneTest?.setFps(30));
    await page.evaluate(() => window.__loseContext.restoreContext());
    await page.waitForTimeout(300);
    const after = await readSceneState(page);
    await page.evaluate(() => window.__sceneTest?.setFps(60));

    expect(
      after.demoted,
      'the lost interval was counted as sustained low FPS — a context loss must not demote on its own'
    ).toBe(false);
    expect(after.demotionCount, 'no demotion may have fired').toBe(0);
  } finally {
    await context.close();
  }
});
