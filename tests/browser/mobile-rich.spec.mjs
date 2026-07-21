import { test, expect } from '@playwright/test';

async function openMobilePage(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });
  return { context, page: await context.newPage() };
}

async function readSceneState(page) {
  await expect.poll(() => page.evaluate(() => typeof window.__sceneDebug)).toBe('function');
  return page.evaluate(() => window.__sceneDebug());
}

test('rich override resolves the mobile probe without GPU allocation', async ({ browser }) => {
  const { context, page } = await openMobilePage(browser);
  try {
    await page.goto('/?tier=rich&sceneDebug=1');
    await expect.poll(() => page.evaluate(() => window.__TIER_PROBE)).toMatchObject({
      tier: 'mobile-rich',
      forced: true,
      cleaned: true
    });
    const probe = await page.evaluate(() => window.__TIER_PROBE);
    expect(probe.tier).toBe('mobile-rich');
    expect(probe.forced).toBe(true);
    expect(probe.cleaned).toBe(true);

    const state = await readSceneState(page);
    expect(state.quality).toBe('mobile-rich');
    expect(state.tier).toBe('mobile-rich');
    expect(state.lite).toBe(true);
    expect(state.expectedGlobeParticles).toBe(5000);
    expect(state.capabilities).toMatchObject({
      postFX: true,
      wells: true,
      graticuleFull: true,
      refractBeads: true,
      rivulet: false
    });
    expect(state.postFX).toEqual({
      enabled: true,
      bloomScale: 0.5,
      finalSamples: 2,
      bloomSamples: 0,
      estimatedBytes: expect.any(Number),
      withinBudget: true
    });
    expect(state.postFX.estimatedBytes).toBeLessThanOrEqual(128 * 1024 * 1024);
    expect(state.effectiveDprCap).toBe(1.75);
  } finally {
    await context.close();
  }
});

test('lite override resolves the mobile probe without GPU allocation', async ({ browser }) => {
  const { context, page } = await openMobilePage(browser);
  try {
    await page.goto('/?tier=lite&sceneDebug=1');
    await expect.poll(() => page.evaluate(() => window.__TIER_PROBE)).toMatchObject({
      tier: 'lite',
      forced: true,
      cleaned: true
    });
    const probe = await page.evaluate(() => window.__TIER_PROBE);
    expect(probe.tier).toBe('lite');
    expect(probe.forced).toBe(true);
    expect(probe.cleaned).toBe(true);

    const state = await readSceneState(page);
    expect(state.quality).toBe('lite');
    expect(state.tier).toBe('lite');
    expect(state.lite).toBe(true);
    expect(state.expectedGlobeParticles).toBe(2600);
    expect(state.capabilities).toMatchObject({
      postFX: false,
      wells: false,
      graticuleFull: false,
      refractBeads: false,
      rivulet: false
    });
    expect(state.effectiveDprCap).toBe(1.5);
  } finally {
    await context.close();
  }
});

test('desktop keeps the locked high scene payload', async ({ page }) => {
  await page.goto('/?sceneDebug=1');
  const state = await readSceneState(page);
  expect(state.quality).toBe('high');
  expect(state.tier).toBe('high');
  expect(state.expectedGlobeParticles).toBe(7000);
  expect(state.capabilities).toMatchObject({
    postFX: true,
    wells: true,
    graticuleFull: true,
    refractBeads: true,
    rivulet: true
  });
  expect(state.postFX).toEqual({
    enabled: true,
    bloomScale: 1,
    finalSamples: 4,
    bloomSamples: 4,
    estimatedBytes: expect.any(Number),
    withinBudget: true
  });
  expect(state.effectiveDprCap).toBe(2);
});

test('reduced motion keeps the mobile tier probe null', async ({ browser }) => {
  const { context, page } = await openMobilePage(browser);
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?tier=rich&sceneDebug=1');
    await expect.poll(() => page.evaluate(() => window.__SCENE_STATUS?.ok ?? null)).toBe(true);
    expect(await page.evaluate(() => window.__TIER_PROBE)).toBeNull();
  } finally {
    await context.close();
  }
});

test('uncached coarse mobile runs the real probe and bootstraps the scene', async ({ browser }) => {
  const { context, page } = await openMobilePage(browser);
  try {
    await context.addInitScript(() => sessionStorage.removeItem('v34.tierProbe'));
    await page.goto('/?sceneDebug=1');
    await expect.poll(() => page.evaluate(() => window.__TIER_PROBE)).toMatchObject({
      forced: false,
      reason: 'measured',
      cleaned: true
    });

    const { probe, sceneOk } = await page.evaluate(() => ({
      probe: window.__TIER_PROBE,
      sceneOk: window.__SCENE_STATUS?.ok ?? null
    }));
    expect(['mobile-rich', 'lite']).toContain(probe.tier);
    expect(Number.isFinite(probe.score)).toBe(true);
    expect(sceneOk).toBe(true);
  } finally {
    await context.close();
  }
});
