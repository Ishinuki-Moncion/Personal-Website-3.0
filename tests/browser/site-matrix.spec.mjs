import { test, expect, chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ms, SOFTWARE_RENDERER, WEBKIT_CANNOT_DRIVE_THIS_PAGE } from '../helpers/ci-timing.mjs';

/* The interaction matrix drives the whole page at nine viewports. On the
   GPU-less runner the 1440x900 pass spent 64s without reaching the gallery —
   a single isVisible() took 4s there — so this budget is scaled rather than
   raised for everyone. See tests/helpers/ci-timing.mjs. */
test.setTimeout(ms(60_000));

const viewports = [
  { width: 320, height: 568, touch: true },
  { width: 375, height: 812, touch: true },
  { width: 390, height: 844, touch: true },
  { width: 430, height: 932, touch: true },
  { width: 480, height: 800, touch: true },
  { width: 667, height: 375, touch: true },
  { width: 768, height: 1024, touch: true },
  { width: 844, height: 390, touch: true },
  { width: 1440, height: 900, touch: false }
];

const localOnly = context => context.route(/^https?:\/\/(?!127\.0\.0\.1(?::\d+)?(?:\/|$))/, route => {
  const url = new URL(route.request().url());
  if (url.hostname === 'fonts.googleapis.com') {
    return route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: '' });
  }
  return route.fulfill({ status: 204, body: '' });
});

function collectErrors(page) {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  return { pageErrors, consoleErrors };
}

/* The interaction matrix asserts layout, overflow, focus order, navigation,
   link hygiene and console cleanliness. None of that depends on which scene
   profile is running — but on a GPU-less runner the full profile decides
   whether the page answers at all: measured there, the browser went unresponsive
   partway through and returned empty values with no locator resolution.
   So CI drives the same assertions against the lite profile. The full-profile
   pass is the local gate, which is where the shipping decision is made.
   This uses the ordinary ?tier= override the site already ships, not a test
   backdoor. */
const MATRIX_PATH = SOFTWARE_RENDERER ? '/?tier=lite' : '/';

async function returningVisit(page, path = '/') {
  await page.goto(path);
  await page.evaluate(() => sessionStorage.setItem('daikie-booted', '1'));
  await page.reload();
  await expect(page.locator('body')).not.toHaveAttribute('data-booting', '');
}

async function expectContained(locator, viewport) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(-0.5);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
}

async function expectInViewport(locator, viewport) {
  await locator.scrollIntoViewIfNeeded();
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box.y + box.height).toBeGreaterThan(0);
  expect(box.y).toBeLessThan(viewport.height);
}

async function expectEssentialApp(page) {
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ishinuki Daikie');
  await expect(page.locator('#contact')).toBeAttached();
  await expect(page.locator('.gallery-grid .shot')).toHaveCount(12);
  await expect(page.locator('.gallery-grid .shot').first()).toHaveAttribute('aria-label', /NAGANO/);
}

async function expectDecodedSource(image, source) {
  await expect(image).toHaveAttribute('src', source);
  await expect.poll(() => image.evaluate(element => element.complete && element.naturalWidth > 0)).toBe(true);
}

test('closed lightbox defers its image until the first photograph opens', async ({ page, context }) => {
  await localOnly(context);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const requestedPaths = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.pathname.endsWith('/images/tiles/gallery-07.jpg') ||
        url.pathname.endsWith('/images/gallery-07.jpg')) {
      requestedPaths.push(url.pathname);
    }
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(250);
  expect(requestedPaths).toEqual([]);

  const first = page.locator('.gallery-grid .shot').first();
  await first.click();
  await expect(page.locator('.lightbox')).toHaveClass(/\bopen\b/);
  const lightboxImage = page.locator('.lb-img');
  await expectDecodedSource(lightboxImage, 'images/gallery-07.jpg');
  await page.locator('.lb-next').click();
  await expectDecodedSource(lightboxImage, 'images/gallery-03.jpg');
  await page.locator('.lb-prev').click();
  await expectDecodedSource(lightboxImage, 'images/gallery-07.jpg');
  expect(requestedPaths).toContain('/images/gallery-07.jpg');
});

test('view-transition lightbox opens and navigates decoded photographs', async ({ page, context }) => {
  await localOnly(context);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    window.__VIEW_TRANSITION_COUNT = 0;
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: update => {
        window.__VIEW_TRANSITION_COUNT++;
        update();
        return { finished: Promise.resolve() };
      }
    });
  });
  await returningVisit(page);

  await page.locator('.gallery-grid .shot').first().click();
  await expect(page.locator('.lightbox')).toHaveClass(/\bopen\b/);
  const lightboxImage = page.locator('.lb-img');
  await expect.poll(() => page.evaluate(() => window.__VIEW_TRANSITION_COUNT)).toBe(1);
  await expectDecodedSource(lightboxImage, 'images/gallery-07.jpg');
  await page.locator('.lb-next').click();
  await expectDecodedSource(lightboxImage, 'images/gallery-03.jpg');
  await page.locator('.lb-prev').click();
  await expectDecodedSource(lightboxImage, 'images/gallery-07.jpg');
});

for (const viewport of viewports) {
  const pointer = viewport.touch ? 'coarse touch' : 'fine pointer';
  test(`engine project viewport ${viewport.width}x${viewport.height} (${pointer}) completes the interaction matrix`, async ({ browser, browserName }) => {
    test.skip(SOFTWARE_RENDERER && browserName === 'webkit', WEBKIT_CANNOT_DRIVE_THIS_PAGE);
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
      isMobile: viewport.touch,
      deviceScaleFactor: 1
    });
    await localOnly(context);
    const page = await context.newPage();
    const errors = collectErrors(page);
    try {
      await returningVisit(page, MATRIX_PATH);
      await expectEssentialApp(page);

      const pointerMedia = await page.evaluate(() => ({
        coarse: matchMedia('(pointer: coarse)').matches,
        fine: matchMedia('(pointer: fine)').matches
      }));
      expect(pointerMedia.coarse).toBe(viewport.touch);
      expect(pointerMedia.fine).toBe(!viewport.touch);

      const overflow = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth
      }));
      expect(overflow.document).toBeLessThanOrEqual(1);
      expect(overflow.body).toBeLessThanOrEqual(1);

      const burger = page.locator('.nav-burger');
      if (await burger.isVisible()) {
        await burger.click();
        const menu = page.locator('#mobileMenu');
        await expect(menu).toHaveAttribute('aria-hidden', 'false');
        for (const destination of ['Home', 'About', 'Work', 'Gallery', 'Projects', 'Contact']) {
          const link = menu.getByRole('link', { name: new RegExp(destination, 'i') });
          await link.scrollIntoViewIfNeeded();
          await expect(link).toBeVisible();
        }
        await page.keyboard.press('Escape');
        await expect(burger).toBeFocused();
      }

      const first = page.locator('.gallery-grid .shot').first();
      const last = page.locator('.gallery-grid .shot').last();
      await expectInViewport(first, viewport);
      await expectInViewport(last, viewport);
      await first.scrollIntoViewIfNeeded();
      await first.click();
      await expect(page.locator('.lightbox')).toHaveClass(/\bopen\b/);
      await expect(page.locator('.lb-pos')).toHaveText('01/12');
      await page.locator('.lb-next').click();
      await expect(page.locator('.lb-pos')).toHaveText('02/12');
      await page.locator('.lb-prev').click();
      await expect(page.locator('.lb-pos')).toHaveText('01/12');
      await page.keyboard.press('Escape');
      await expect(first).toBeFocused();

      const contactLink = await burger.isVisible()
        ? page.locator('#mobileMenu a[href="#contact"]')
        : page.locator('.nav a[href="#contact"]');
      if (await burger.isVisible()) await burger.click();
      await contactLink.click();
      await expect(page).toHaveURL(/#contact$/);
      await expectContained(page.locator('.signal-row'), viewport);

      const externals = page.locator('a[target="_blank"]');
      expect(await externals.count()).toBeGreaterThan(0);
      const externalHrefs = [];
      for (let index = 0; index < await externals.count(); index++) {
        const external = externals.nth(index);
        externalHrefs.push(await external.getAttribute('href'));
        expect((await external.getAttribute('rel')).split(/\s+/)).toContain('noopener');
      }
      expect([...new Set(externalHrefs)].sort()).toEqual([
        'https://github.com/Ishinuki-Moncion',
        'https://www.instagram.com/d.moncion/',
        'https://www.linkedin.com/in/daikie-moncion-6a637b71/'
      ]);

      expect(errors.pageErrors).toEqual([]);
      expect(errors.consoleErrors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test('reduced motion keeps content static and bypasses the tier probe', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  await localOnly(context);
  const page = await context.newPage();
  try {
    await page.goto('/?sceneDebug=1');
    await expectEssentialApp(page);
    await expect(page.locator('body')).not.toHaveAttribute('data-booting', '');
    expect(await page.evaluate(() => window.__TIER_PROBE)).toBeNull();
    await expect.poll(() => page.evaluate(() => window.__sceneDebug?.().quality ?? null)).toBe('reduced');
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  } finally {
    await context.close();
  }
});

test('reduced-motion calibration exports an explicit non-applicable FPS result', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
    acceptDownloads: true
  });
  await localOnly(context);
  const page = await context.newPage();
  try {
    await page.goto('/tests/device/mobile-rich-calibration.html?fpsWindowMs=400');
    await expect(page.getByRole('heading', { name: 'Mobile-rich calibration' })).toBeVisible();
    await page.getByRole('button', { name: /RUN 5 PROBES/ }).click();
    await expect(page.locator('#status')).toContainText('FPS not applicable', { timeout: ms(35_000) });

    const packet = JSON.parse(await page.locator('#packet').textContent());
    expect(packet.selectionPolicy).toMatchObject({
      forcedTier: false,
      userAgentRole: 'diagnostic-label-only',
      userAgentUsedForTierSelection: false
    });
    expect(packet.environment.reducedMotion).toBe(true);
    expect(packet.fps15s).toEqual({
      applicable: false,
      reason: 'reduced-motion-static-scene',
      durationMs: 0,
      sampleCount: 0,
      min: null,
      median: null
    });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'EXPORT JSON' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^mobile-rich-calibration-.*\.json$/);
    const exportedPacket = JSON.parse(await readFile(await download.path(), 'utf8'));
    expect(exportedPacket.selectionPolicy).toEqual(packet.selectionPolicy);
    expect(exportedPacket.fps15s).toEqual(packet.fps15s);
  } finally {
    await context.close();
  }
});

for (const failure of [
  { name: 'aborted background.js', pattern: '**/js/background.js*' },
  { name: 'aborted three.module.min.js', pattern: '**/three.module.min.js*' }
]) {
  test(`${failure.name} leaves essential app behavior available`, async ({ page, context }) => {
    await localOnly(context);
    await page.route(failure.pattern, route => route.abort());
    await page.goto('/');
    await expect(page.locator('body')).not.toHaveAttribute('data-booting', '', { timeout: ms(4_000) });
    await expectEssentialApp(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.nav-burger').click();
    await expect(page.locator('#mobileMenu')).toHaveAttribute('aria-hidden', 'false');
    await page.keyboard.press('Escape');
    await page.locator('.gallery-grid .shot').first().click();
    await expect(page.locator('.lightbox')).toHaveClass(/\bopen\b/);
    await page.keyboard.press('Escape');
    await expect(page.locator('.signal-row')).toBeEnabled();
    await expect.poll(() => page.evaluate(() => window.__SCENE_STATUS?.ok ?? null)).toBe(false);
  });
}

test('null WebGL and WebGL2 contexts fail the scene closed without disabling content', async ({ page, context }) => {
  await localOnly(context);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl'
        ? null
        : original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expectEssentialApp(page);
  await expect.poll(() => page.evaluate(() => window.__SCENE_STATUS?.ok ?? null)).toBe(false);
  await page.locator('.gallery-grid .shot').first().click();
  await expect(page.locator('.lightbox')).toHaveClass(/\bopen\b/);
});

for (const forced of [
  { query: 'lite', quality: 'lite' },
  { query: 'rich', quality: 'mobile-rich' }
]) {
  test(`forced ${forced.query} selects ${forced.quality} from a coarse context`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await localOnly(context);
    const page = await context.newPage();
    try {
      await page.goto(`/?tier=${forced.query}&sceneDebug=1`);
      await expect.poll(() => page.evaluate(() => window.__TIER_PROBE)).toMatchObject({ forced: true });
      await expect.poll(() => page.evaluate(() => window.__sceneDebug?.().quality ?? null)).toBe(forced.quality);
      await expectEssentialApp(page);
    } finally {
      await context.close();
    }
  });
}

test('Japanese mode updates document language and both language controls', async ({ page, context }) => {
  await localOnly(context);
  await returningVisit(page);
  await page.locator('.lang-btn').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.locator('.lang-btn')).toHaveAttribute('aria-label', /英語/);
  await expect(page.locator('#contact h2')).toContainText('一緒に作りましょう');
  await page.locator('.deck-toggle').click();
  await expect(page.locator('.seg[data-seg="lang"] button[data-val="ja"]')).toHaveClass(/\bon\b/);
  await page.locator('.seg[data-seg="lang"] button[data-val="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.lang-btn')).toHaveAttribute('aria-label', /Switch to Japanese/);
});

test('JavaScript-disabled page exposes static navigation content and gallery names', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await localOnly(context);
  const page = await context.newPage();
  const initialRequests = [];
  page.on('request', request => initialRequests.push(new URL(request.url()).pathname));
  try {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ishinuki Daikie');
    /* Property, not census: every Work row must carry its title as a heading in
       static HTML with scripting off. Pinning the number instead meant adding a
       role or a qualification failed this for being new rather than wrong. */
    const workRows = await page.locator('#work .row').count();
    expect(workRows).toBeGreaterThan(0);
    await expect(page.locator('#work h3.row-title')).toHaveCount(workRows);
    await expect(page.locator('.gallery-grid .shot')).toHaveCount(12);
    await expect(page.locator('.gallery-grid .shot').first()).toHaveAccessibleName(/NAGANO/);
    await expect(page.locator('.gallery-grid .shot').last()).toHaveAccessibleName(/OKINAWA/);
    expect(initialRequests).not.toContain('/images/tiles/gallery-07.jpg');
    expect(initialRequests).not.toContain('/images/gallery-07.jpg');
    await page.locator('.brand').click();
    await expect(page).toHaveURL(/#home$/);
  } finally {
    await context.close();
  }
});

test('successful clipboard copy announces success and copies the runtime address', async ({ page, context }) => {
  await localOnly(context);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async value => { window.__COPIED_VALUE = value; } }
    });
  });
  await returningVisit(page);
  const signal = page.locator('.signal-row');
  await signal.scrollIntoViewIfNeeded();
  await signal.click();
  await expect(signal).toHaveClass(/\bcopied\b/);
  await expect(page.locator('[data-copy-status]')).toHaveText('Email address copied');
  expect(await page.evaluate(() => window.__COPIED_VALUE)).toBe(await page.locator('[data-addr]').textContent());
});

test('clipboard denial uses the fallback and preserves signal-row focus', async ({ page, context }) => {
  await localOnly(context);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async () => { throw new DOMException('denied', 'NotAllowedError'); } }
    });
    document.execCommand = command => {
      if (command === 'copy') {
        window.__FALLBACK_COPY_VALUE = document.activeElement?.value ?? null;
        return true;
      }
      return false;
    };
  });
  await returningVisit(page);
  const signal = page.locator('.signal-row');
  await signal.scrollIntoViewIfNeeded();
  await signal.focus();
  await page.keyboard.press('Enter');
  await expect(signal).toHaveClass(/\bcopied\b/);
  expect(await page.evaluate(() => window.__FALLBACK_COPY_VALUE)).toBe(await page.locator('[data-addr]').textContent());
  await expect(signal).toBeFocused();
});

test('touch lightbox swipe moves forward and backward', async ({ browser, browserName }) => {
  test.skip(SOFTWARE_RENDERER && browserName === 'webkit', WEBKIT_CANNOT_DRIVE_THIS_PAGE);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await localOnly(context);
  const page = await context.newPage();
  try {
    await returningVisit(page);
    await page.locator('.gallery-grid .shot').first().click();
    /* Wait for the dialog itself, not for the counter. `.lb-pos` ships as
       "01/12" in the markup, so asserting that text could not distinguish
       "opened on the first photograph" from "never opened at all" — it passed
       the instant the page loaded. Swiping on that signal raced the open, and
       the open then re-showed its own index over the swipe. Under load the
       swipe lost. */
    await expect(page.locator('.lightbox')).toHaveClass(/\bopen\b/);
    await expect(page.locator('.lb-pos')).toHaveText('01/12');
    const stage = page.locator('.lb-stage');
    await stage.dispatchEvent('touchstart', { changedTouches: [{ identifier: 1, clientX: 260, clientY: 100 }] });
    await stage.dispatchEvent('touchend', { changedTouches: [{ identifier: 1, clientX: 120, clientY: 100 }] });
    await expect(page.locator('.lb-pos')).toHaveText('02/12');
    await stage.dispatchEvent('touchstart', { changedTouches: [{ identifier: 2, clientX: 120, clientY: 100 }] });
    await stage.dispatchEvent('touchend', { changedTouches: [{ identifier: 2, clientX: 260, clientY: 100 }] });
    await expect(page.locator('.lb-pos')).toHaveText('01/12');
  } finally {
    await context.close();
  }
});

test('deliberate WEBGL_lose_context keeps content available and pauses then resumes', async ({ page, context }) => {
  await localOnly(context);
  await page.goto('/?tier=lite&sceneDebug=1');
  await expect.poll(() => page.evaluate(() => window.__SCENE_STATUS?.ok ?? null)).toBe(true);
  const totalRenderCount = () => page.evaluate(() => {
    const counts = window.__sceneDebug?.().renderCounts;
    return counts ? counts.direct + counts.postfx : 0;
  });
  await expect.poll(totalRenderCount).toBeGreaterThan(2);
  const supported = await page.evaluate(() => {
    const canvas = document.querySelector('#scene-root canvas');
    const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    return Boolean(gl?.getExtension('WEBGL_lose_context'));
  });
  test.skip(!supported, 'WEBGL_lose_context is unavailable in this engine');
  const beforeLoss = await totalRenderCount();
  await page.evaluate(() => {
    const canvas = document.querySelector('#scene-root canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    window.__LOSE_CONTEXT = gl.getExtension('WEBGL_lose_context');
    window.__LOSE_CONTEXT.loseContext();
  });
  await page.waitForTimeout(200);
  const lostCount = await totalRenderCount();
  expect(lostCount).toBeGreaterThanOrEqual(beforeLoss);
  await page.waitForTimeout(300);
  expect(await totalRenderCount()).toBe(lostCount);
  await expectEssentialApp(page);
  await page.evaluate(() => window.__LOSE_CONTEXT.restoreContext());
  await expect.poll(totalRenderCount).toBeGreaterThan(lostCount);
  await expectEssentialApp(page);
  await expect(page.locator('body')).not.toHaveAttribute('data-booting', '');
});

test('background and restore pause and resume the scene without duplicating the loop', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await localOnly(context);
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__TEST_HIDDEN = false;
    Object.defineProperty(Document.prototype, 'hidden', {
      configurable: true,
      get: () => window.__TEST_HIDDEN
    });
  });
  try {
    await page.goto('/?tier=lite&sceneDebug=1');
    await expect.poll(() => page.evaluate(() => window.__sceneDebug?.().renderCounts.direct ?? 0)).toBeGreaterThan(2);
    await page.evaluate(() => {
      window.__TEST_HIDDEN = true;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(200);
    const hiddenCount = await page.evaluate(() => window.__sceneDebug().renderCounts.direct);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.__sceneDebug().renderCounts.direct)).toBe(hiddenCount);
    await page.evaluate(() => {
      window.__TEST_HIDDEN = false;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(() => page.evaluate(() => window.__sceneDebug().renderCounts.direct)).toBeGreaterThan(hiddenCount);
  } finally {
    await context.close();
  }
});

test('repeated mobile navigation closes the modal and reaches each destination', async ({ browser, browserName }) => {
  test.skip(SOFTWARE_RENDERER && browserName === 'webkit', WEBKIT_CANNOT_DRIVE_THIS_PAGE);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await localOnly(context);
  const page = await context.newPage();
  try {
    await returningVisit(page);
    for (const id of ['about', 'gallery', 'projects', 'contact', 'home']) {
      await page.locator('.nav-burger').click();
      await page.locator(`#mobileMenu a[href="#${id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator('#mobileMenu')).toHaveAttribute('aria-hidden', 'true');
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  } finally {
    await context.close();
  }
});

test('second coarse visit reuses the session tier cache', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await localOnly(context);
  const page = await context.newPage();
  try {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.removeItem('v34.tierProbe'));
    await page.goto('/?sceneDebug=1');
    await expect.poll(() => page.evaluate(() => window.__TIER_PROBE)).not.toBeNull();
    expect(await page.evaluate(() => window.__TIER_PROBE.reason)).not.toBe('cache');
    await page.evaluate(() => sessionStorage.setItem('daikie-booted', '1'));
    await page.reload();
    await expect.poll(() => page.evaluate(() => window.__TIER_PROBE?.reason ?? null)).toBe('cache');
    await expect(page.locator('body')).not.toHaveAttribute('data-booting', '');
  } finally {
    await context.close();
  }
});

test('rotation preserves containment navigation and the live DPR cap', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  await localOnly(context);
  await context.addInitScript(() => sessionStorage.setItem('daikie-booted', '1'));
  const page = await context.newPage();
  try {
    await page.goto('/?tier=rich&sceneDebug=1');
    await expect.poll(() => page.evaluate(() => window.__sceneDebug?.().effectiveDprCap ?? null)).toBe(1.75);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    const burger = page.locator('.nav-burger');
    if (await burger.isVisible()) {
      await burger.click();
      await page.locator('#mobileMenu a[href="#contact"]').scrollIntoViewIfNeeded();
      await expect(page.locator('#mobileMenu a[href="#contact"]')).toBeVisible();
      await page.keyboard.press('Escape');
    } else {
      await expect(page.locator('.nav a[href="#contact"]')).toBeVisible();
    }
    expect(await page.evaluate(() => window.__sceneDebug().rendererDpr)).toBeLessThanOrEqual(1.75);
  } finally {
    await context.close();
  }
});

test('file:// Chromium fallback keeps app semantics and content when the scene is optional', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'file:// fallback is Chromium-only');
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await localOnly(context);
  const page = await context.newPage();
  try {
    const file = pathToFileURL(resolve(process.cwd(), 'index.html')).href;
    await page.goto(file);
    await expect(page.locator('body')).not.toHaveAttribute('data-booting', '', { timeout: ms(10_000) });
    await expectEssentialApp(page);
    await page.locator('.nav-burger').click();
    await expect(page.locator('#mobileMenu')).toHaveAttribute('aria-hidden', 'false');
    await page.keyboard.press('Escape');
    await page.locator('.gallery-grid .shot').first().click();
    await expect(page.locator('.lightbox')).toHaveClass(/\bopen\b/);
  } finally {
    await context.close();
    await browser.close();
  }
});
