/* Three confirmed audit findings (2026-07-27), each a defect a visitor meets on
 * an ordinary path, and each of which passed every gate Package A shipped with.
 */
import { expect, test } from '@playwright/test';

import { ms } from '../helpers/ci-timing.mjs';

async function bootQuietly(page) {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('daikie-booted', '1'); } catch { /* privacy modes */ }
  });
  await page.goto('/');
  await expect(page.locator('body')).not.toHaveAttribute('data-booting', '', { timeout: ms(9_000) });
}

/* .lb-img shipped with width="640" height="426" — the intrinsic size of the
   640x426 THUMBNAIL TILE, hardcoded onto the element that displays the 2000x1333
   full photograph. Because .lb-img is sized only by max-width/max-height plus
   object-fit: contain, those attributes became the layout box: every photograph
   rendered at 35% of its available area. On a photographer's portfolio. */
test('lightbox photographs fill the stage rather than the thumbnail box', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootQuietly(page);

  await page.locator('.shot').first().click();
  await expect(page.locator('.lightbox')).toHaveClass(/open/, { timeout: ms(5_000) });
  await expect.poll(() => page.evaluate(() => document.querySelector('.lb-img')?.naturalWidth || 0)).toBeGreaterThan(0);

  const measure = () => page.evaluate(() => {
    const img = document.querySelector('.lb-img');
    const rect = img.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      attrWidth: img.getAttribute('width'),
    };
  });

  /* Constrained by max-height:80vh on a 900px viewport, a 3:2 photograph should
     land near 1080x720. The regression rendered it at exactly 640x426.

     Wait for LAYOUT, not just decode: naturalWidth only says the bytes arrived,
     and on a starved engine the element can still be sitting at its pre-open
     box a frame or two later — sampled once, that reads as exactly the defect
     this guards (measured on CI at 3x3). Polling cannot hide that defect,
     because the thumbnail-sized box is 640 wide and never crosses 900. */
  await expect
    .poll(async () => (await measure()).width, { timeout: ms(5_000) })
    .toBeGreaterThan(900);
  const box = await measure();

  /* The declared box must describe THIS photograph, so the aspect ratio holds. */
  const declaredRatio = box.naturalWidth / box.naturalHeight;
  const renderedRatio = box.width / box.height;
  expect(Math.abs(declaredRatio - renderedRatio)).toBeLessThan(0.02);
  expect(Number(box.attrWidth)).toBe(box.naturalWidth);
});

test('portrait photographs are not letterboxed into a landscape box', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootQuietly(page);

  /* Find a tile whose full image is taller than it is wide. */
  const portraitIndex = await page.evaluate(() =>
    [...document.querySelectorAll('.shot')].findIndex(s => Number(s.dataset.h) > Number(s.dataset.w))
  );
  expect(portraitIndex, 'the gallery should contain at least one portrait photograph').toBeGreaterThanOrEqual(0);

  await page.locator('.shot').nth(portraitIndex).click();
  await expect(page.locator('.lightbox')).toHaveClass(/open/, { timeout: ms(5_000) });
  await expect.poll(() => page.evaluate(() => document.querySelector('.lb-img')?.naturalWidth || 0)).toBeGreaterThan(0);

  /* Same layout race as above: wait for the stage box to exist before judging
     its shape. A pre-open element is square, which would read as letterboxing. */
  const shapeOf = () => page.evaluate(() => {
    const rect = document.querySelector('.lb-img').getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  });
  await expect.poll(async () => (await shapeOf()).height, { timeout: ms(5_000) }).toBeGreaterThan(200);
  const shape = await shapeOf();
  expect(shape.height, 'a portrait photograph must render taller than it is wide').toBeGreaterThan(shape.width);
});

/* body{cursor:none} and twelve element-level `cursor:none` rules hide the system
   pointer for the custom HUD reticle. js/cursor.js draws that reticle only when
   !reduced && !coarse — so under reduced motion the pointer must return. The
   restoration named the right selectors but was declared 240 lines before the
   rules it had to beat, and lost on source order. */
test('reduced motion restores a visible pointer on every interactive control', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await bootQuietly(page);

  const cursors = await page.evaluate(() => {
    const out = {};
    for (const selector of ['body', '.shot', '.lb-close', '.signal-row', '.pill', '.deck-toggle', '.seg button', '.nav-burger']) {
      const el = document.querySelector(selector);
      if (el) out[selector] = getComputedStyle(el).cursor;
    }
    out.__reticleDrawn = window.__CURSOR_ACTIVE === true;
    return out;
  });

  expect(cursors.__reticleDrawn, 'the custom reticle is disabled under reduced motion, so nothing replaces the pointer').toBe(false);
  for (const [selector, value] of Object.entries(cursors)) {
    if (selector.startsWith('__')) continue;
    expect(value, `${selector} has no visible pointer under reduced motion`).not.toBe('none');
  }
});

/* .mm-head is made position:sticky at short landscape heights so CLOSE stays
   reachable while scrolling to the lower destinations — but it kept the base
   z-index:1, and .mm-links carries z-index:1 while coming later in DOM order,
   so the links painted over the control that exists to be reachable. */
test('the sticky menu CLOSE stays on top at short landscape heights', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 667, height: 375 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await bootQuietly(page);
    await page.locator('.nav-burger').click();
    await expect(page.locator('.mm-close')).toBeVisible();

    /* SCROLL FIRST. The defect is that .mm-links (z-index 1, later in DOM) paints
       over the sticky .mm-head — which only matters once the links have scrolled
       up underneath it. Testing at scroll position 0 passed even with the z-index
       fix deleted, because nothing was overlapping yet. */
    await page.evaluate(() => {
      const menu = document.querySelector('.mobile-menu');
      (menu.scrollHeight > menu.clientHeight ? menu : document.querySelector('.mm-links'))
        .scrollTop = 200;
    });
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => {
      const close = document.querySelector('.mm-close');
      const rect = close.getBoundingClientRect();
      const atCentre = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return {
        headZ: getComputedStyle(document.querySelector('.mm-head')).zIndex,
        linksZ: getComputedStyle(document.querySelector('.mm-links')).zIndex,
        topmostIsClose: close.contains(atCentre) || atCentre === close,
        topmostTag: atCentre ? atCentre.tagName + '.' + atCentre.className : null,
      };
    });

    expect(
      state.topmostIsClose,
      `the CLOSE control is covered by ${state.topmostTag} (head z=${state.headZ}, links z=${state.linksZ})`
    ).toBe(true);

    await page.locator('.mm-close').click();
    await expect(page.locator('.mm-close')).not.toBeVisible();
  } finally {
    await context.close();
  }
});
