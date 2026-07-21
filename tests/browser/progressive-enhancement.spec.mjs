import { test, expect } from '@playwright/test';

test('scene import failure leaves menu gallery labels and contact usable', async ({ page }) => {
  await page.route('**/js/background.js*', route => route.abort());
  await page.goto('/');
  await expect(page.locator('body')).not.toHaveAttribute('data-booting', '', { timeout: 4_000 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.nav-burger').click();
  await expect(page.locator('#mobileMenu')).toHaveAttribute('aria-hidden', 'false');
  await page.keyboard.press('Escape');
  await page.locator('.gallery-grid .shot').first().click();
  await expect(page.locator('.lightbox')).toHaveClass(/open/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.signal-row')).toBeEnabled();
  expect(await page.evaluate(() => window.__SCENE_STATUS.ok)).toBe(false);
});

test('coarse first visit paints before scene readiness and reveals within 1500ms', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__CODEX_NAV_START = performance.now();
    const observeBoot = () => {
      if (!document.body) return requestAnimationFrame(observeBoot);
      const record = () => {
        if (!document.body.hasAttribute('data-booting') && window.__CODEX_REVEAL_AT == null) {
          window.__CODEX_REVEAL_AT = performance.now();
        }
      };
      new MutationObserver(record).observe(document.body, { attributes: true, attributeFilter: ['data-booting'] });
      record();
    };
    observeBoot();
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => document.body.hasAttribute('data-booting'))).toBe(false);
  const timing = await page.evaluate(() => {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    return {
      elapsed: window.__CODEX_REVEAL_AT - window.__CODEX_NAV_START,
      fcp: fcp?.startTime ?? null,
      sceneReadyAt: window.__SCENE_STATUS?.readyAt ?? null
    };
  });
  expect(timing.fcp).not.toBeNull();
  expect(timing.elapsed).toBeLessThanOrEqual(1550);
  if (timing.sceneReadyAt !== null) expect(timing.fcp).toBeLessThanOrEqual(timing.sceneReadyAt);
  await context.close();
});

test('reduced motion does not run cursor animation or probe', async ({ page }) => {
  await page.addInitScript(() => {
    window.__CODEX_BOOT_DONE_COUNT = 0;
    document.addEventListener('boot:done', () => { window.__CODEX_BOOT_DONE_COUNT++; });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?sceneDebug=1');
  expect(await page.evaluate(() => window.__TIER_PROBE)).toBeNull();
  expect(await page.evaluate(() => window.__CURSOR_ACTIVE)).toBe(false);
  await expect(page.locator('body')).not.toHaveAttribute('data-booting', '');
  expect(await page.locator('body').evaluate(el => getComputedStyle(el).cursor)).not.toBe('none');
  for (const selector of ['.cursor', '.cursor-dot', '.cursor-label']) {
    expect(await page.locator(selector).evaluate(el => getComputedStyle(el).display)).toBe('none');
  }
  expect(await page.evaluate(() => window.__CODEX_BOOT_DONE_COUNT)).toBe(1);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('returning visit completes language and reveal initialization with instant boot', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('daikie-booted', '1');
    localStorage.setItem('daikie-lang', 'ja');
    window.__CODEX_BOOT_DONE_COUNT = 0;
    document.addEventListener('boot:done', () => { window.__CODEX_BOOT_DONE_COUNT++; });

    const observer = new MutationObserver(() => {
      if (!document.body || document.body.hasAttribute('data-booting') || window.__CODEX_INSTANT_SNAPSHOT) return;
      window.__CODEX_INSTANT_SNAPSHOT = {
        bootDoneCount: window.__CODEX_BOOT_DONE_COUNT,
        language: document.documentElement.lang,
        heroStarted: document.querySelector('.hero')?.dataset.started ?? null,
        revealDelay: document.querySelector('[data-reveal-delay]')?.style.getPropertyValue('--d') ?? null
      };
      observer.disconnect();
    });
    observer.observe(document, {
      attributes: true,
      attributeFilter: ['data-booting'],
      childList: true,
      subtree: true
    });
  });

  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__CODEX_INSTANT_SNAPSHOT ?? null)).not.toBeNull();
  expect(await page.evaluate(() => window.__CODEX_INSTANT_SNAPSHOT)).toEqual({
    bootDoneCount: 1,
    language: 'ja',
    heroStarted: '1',
    revealDelay: '0.05s'
  });
});
