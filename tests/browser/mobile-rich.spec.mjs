import { test, expect } from '@playwright/test';

async function openMobilePage(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true
  });
  return { context, page: await context.newPage() };
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
  } finally {
    await context.close();
  }
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
