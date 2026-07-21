import { test, expect } from '@playwright/test';

async function openMobilePage(browser, overrides = {}) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    ...overrides
  });
  return { context, page: await context.newPage() };
}

async function readSceneState(page) {
  await expect.poll(() => page.evaluate(() => typeof window.__sceneDebug)).toBe('function');
  return page.evaluate(() => window.__sceneDebug());
}

async function installPostFxReferenceInstrumentation(context) {
  await context.addInitScript(() => {
    const refs = { composers: [], passes: [] };
    Object.defineProperty(window, '__POST_TEST_REFS', { value: refs, configurable: true });
    let currentPost;
    const wrap = (Base, bucket) => class extends Base {
      constructor(...args) {
        super(...args);
        refs[bucket].push(this);
      }
    };
    Object.defineProperty(window, 'POST', {
      configurable: true,
      get: () => currentPost,
      set(value) {
        currentPost = value && {
          ...value,
          EffectComposer: wrap(value.EffectComposer, 'composers'),
          RenderPass: wrap(value.RenderPass, 'passes'),
          ShaderPass: wrap(value.ShaderPass, 'passes'),
          UnrealBloomPass: wrap(value.UnrealBloomPass, 'passes'),
          OutputPass: wrap(value.OutputPass, 'passes')
        };
      }
    });
  });
}

function readInstrumentedPostFxRetained(page) {
  return page.evaluate(() => {
    const refs = window.__POST_TEST_REFS;
    const retained = [];
    const record = (owner, key, value) => {
      if (value !== null && value !== undefined) retained.push(owner + '.' + key);
    };
    refs.composers.forEach((composer, index) => {
      const owner = 'composer[' + index + ']';
      if (composer.passes?.length) retained.push(owner + '.passes');
      for (const key of ['renderTarget1', 'renderTarget2', 'writeBuffer', 'readBuffer', 'copyPass', 'renderer', 'clock']) {
        record(owner, key, composer[key]);
      }
    });
    refs.passes.forEach((pass, index) => {
      const owner = 'pass[' + index + ']';
      for (const key of [
        'scene', 'camera', 'overrideMaterial', 'material', 'uniforms', 'fsQuad',
        'renderTargetBright', 'highPassUniforms', 'materialHighPassFilter',
        'compositeMaterial', 'copyUniforms', 'blendMaterial', 'basic', 'resolution'
      ]) record(owner, key, pass[key]);
      for (const key of ['renderTargetsHorizontal', 'renderTargetsVertical', 'separableBlurMaterials', 'bloomTintColors']) {
        if (pass[key]?.length) retained.push(owner + '.' + key);
      }
    });
    return { composers: refs.composers.length, passes: refs.passes.length, retained: retained.sort() };
  });
}

test('rich override resolves the mobile probe without GPU allocation', async ({ browser }) => {
  const { context, page } = await openMobilePage(browser, { deviceScaleFactor: 3 });
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
    expect(state.postFX).toMatchObject({
      enabled: true,
      disposed: false,
      bloomScale: 0.5,
      finalSamples: 2,
      bloomSamples: 0,
      estimatedBytes: expect.any(Number),
      withinBudget: true
    });
    expect(state.postFX.disposal.expected.length).toBeGreaterThan(0);
    expect(state.postFX.disposal.called).toEqual([]);
    expect(state.postFX.estimatedBytes).toBeLessThanOrEqual(128 * 1024 * 1024);
    expect(state.effectiveDprCap).toBe(1.75);
  } finally {
    await context.close();
  }
});

test('mobile-rich demotes once, disposes postFX, persists DPR through resize, and stays lite next load', async ({ browser }) => {
  const { context, page } = await openMobilePage(browser, { deviceScaleFactor: 3 });
  await installPostFxReferenceInstrumentation(context);
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  try {
    await page.goto('/?tier=rich&sceneDebug=1');
    await expect.poll(() => page.evaluate(() => typeof window.__sceneTest?.setFps)).toBe('function');
    await page.evaluate(() => window.__sceneTest.setFps(30));
    await page.waitForTimeout(4300);
    let state = await page.evaluate(() => window.__sceneDebug());
    expect(state.demoted).toBe(true);
    expect(state.effectiveDprCap).toBe(1.5);
    expect(state.rendererDpr).toBe(1.5);
    expect(state.postFX.enabled).toBe(false);
    expect(state.postFX.disposed).toBe(true);
    expect(state.postFX.disposal.expected.length).toBeGreaterThan(0);
    expect(state.postFX.disposal.expected).toHaveLength(12);
    expect(state.postFX.disposal.called).toEqual(state.postFX.disposal.expected);
    expect(state.postFX.disposal.retained).toEqual([]);
    expect(await readInstrumentedPostFxRetained(page)).toEqual({ composers: 2, passes: 7, retained: [] });
    expect(state.demotionCount).toBe(1);
    const afterDemotion = { direct: state.renderCounts.direct, postfx: state.renderCounts.postfx };
    await page.waitForTimeout(300);
    state = await page.evaluate(() => window.__sceneDebug());
    expect(state.renderPath).toBe('direct');
    expect(state.renderCounts.direct).toBeGreaterThan(afterDemotion.direct);
    expect(state.renderCounts.postfx).toBe(afterDemotion.postfx);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(400);
    state = await page.evaluate(() => window.__sceneDebug());
    expect(state.effectiveDprCap).toBe(1.5);
    expect(state.rendererDpr).toBe(1.5);
    expect(state.demotionCount).toBe(1);
    expect(state.postFX.disposal.retained).toEqual([]);
    expect(await readInstrumentedPostFxRetained(page)).toEqual({ composers: 2, passes: 7, retained: [] });
    await page.goto('/?sceneDebug=1');
    await expect.poll(() => page.evaluate(() => window.__sceneDebug?.().tier)).toBe('lite');
    state = await page.evaluate(() => window.__sceneDebug());
    expect(state.tier).toBe('lite');
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
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
  expect(state.postFX).toMatchObject({
    enabled: true,
    disposed: false,
    bloomScale: 1,
    finalSamples: 4,
    bloomSamples: 4,
    estimatedBytes: expect.any(Number),
    withinBudget: true
  });
  expect(state.postFX.disposal.expected.length).toBeGreaterThan(0);
  expect(state.postFX.disposal.called).toEqual([]);
  expect(state.effectiveDprCap).toBe(2);
});

test('deterministic FPS injection stays behind sceneDebug', async ({ browser }) => {
  const { context, page } = await openMobilePage(browser);
  try {
    await page.goto('/?tier=lite');
    expect(await page.evaluate(() => typeof window.__sceneTest)).toBe('undefined');
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
