/* The desktop rescue (owner decision, 2026-07-29).
 *
 * A desktop that cannot render this scene does not degrade, it FREEZES: measured
 * on a GPU-less runner, the main thread stopped answering for seventeen seconds
 * at a single click. Software rasterisation on a desktop is not exotic — VMs,
 * remote desktops and stale drivers all land there.
 *
 * The rescue is the sustained-FPS watchdog rather than a boot-time probe,
 * because probing here would put ~200ms of GPU work on a critical path whose
 * LCP is already over its 2500ms gate. The cost of that choice is that the
 * rescue arrives after four seconds instead of before the first frame, and the
 * benefit is that it is free for the overwhelming majority of visitors whose
 * machines are fine.
 */
import { expect, test } from '@playwright/test';

import { NEEDS_REAL_GPU, SOFTWARE_RENDERER } from '../helpers/ci-timing.mjs';

/* Drives the real render loop and asserts on real postFX allocation. */
test.skip(SOFTWARE_RENDERER, NEEDS_REAL_GPU);

/* Two four-second windows have to elapse in real time inside one test — one
   that must NOT close and one that must — so the default 30s budget is not
   enough to observe both plus two navigations. */
test.setTimeout(90_000);

async function openDesktop(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    hasTouch: false,
    isMobile: false,
    deviceScaleFactor: 2
  });
  return { context, page: await context.newPage() };
}

const debug = page => page.evaluate(() => window.__sceneDebug());

test('a desktop that cannot keep up is demoted, and stays demoted next load', async ({ browser }) => {
  const { context, page } = await openDesktop(browser);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    await page.goto('/?sceneDebug=1');
    await expect.poll(() => page.evaluate(() => typeof window.__sceneTest?.setFps)).toBe('function');
    expect((await debug(page)).tier).toBe('high');

    /* 30fps is BELOW the mobile-rich bar of 45 and ABOVE the desktop bar of 20.
       Holding it well past the four-second window proves the desktop profile is
       not being judged by the phone's standard — a dip during a heavy scroll
       must not cost the locked art direction. */
    await page.evaluate(() => window.__sceneTest.setFps(30));
    await page.waitForTimeout(5000);
    let state = await debug(page);
    expect(state.demoted, 'a merely-imperfect desktop must keep the locked profile').toBe(false);
    expect(state.postFX.enabled).toBe(true);

    /* Now the real signal: a machine presenting under 20fps is not dipping. */
    await page.evaluate(() => window.__sceneTest.setFps(8));
    await expect.poll(() => page.evaluate(() => window.__sceneDebug().demoted), { timeout: 12_000 }).toBe(true);

    state = await debug(page);
    expect(state.demotionCount, 'demotion is one-way').toBe(1);
    expect(state.effectiveDprCap).toBe(1.5);
    expect(state.rendererDpr).toBe(1.5);
    expect(state.postFX.enabled).toBe(false);
    expect(state.postFX.disposed).toBe(true);
    expect(state.postFX.disposal.retained, 'nothing may stay reachable after the rescue').toEqual([]);

    /* Rescued, not killed — the scene keeps rendering, directly. */
    const before = state.renderCounts.direct;
    await page.waitForTimeout(400);
    state = await debug(page);
    expect(state.renderPath).toBe('direct');
    expect(state.renderCounts.direct).toBeGreaterThan(before);

    /* And the verdict sticks: the next load in this session starts lite instead
       of spending four more seconds rediscovering the same machine. This is the
       whole reason the probe cache is read on fine pointers. */
    await page.evaluate(() => window.__sceneTest?.setFps(60));
    await page.goto('/?sceneDebug=1');
    await expect.poll(() => page.evaluate(() => window.__sceneDebug?.().tier)).toBe('lite');

    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});

test('a healthy desktop is never demoted and keeps the locked profile', async ({ browser }) => {
  const { context, page } = await openDesktop(browser);
  try {
    await page.goto('/?sceneDebug=1');
    await expect.poll(() => page.evaluate(() => typeof window.__sceneTest?.setFps)).toBe('function');
    await page.evaluate(() => window.__sceneTest.setFps(60));
    await page.waitForTimeout(5000);

    const state = await debug(page);
    expect(state.tier).toBe('high');
    expect(state.demoted).toBe(false);
    expect(state.demotionCount).toBe(0);
    expect(state.postFX.enabled).toBe(true);
    expect(state.capabilities.postFX).toBe(true);
    /* No verdict may be persisted for a machine that never earned one, or every
       later navigation in the session would inherit a demotion that never
       happened. */
    expect(await page.evaluate(() => sessionStorage.getItem('v34.tierProbe'))).toBeNull();
  } finally {
    await context.close();
  }
});
