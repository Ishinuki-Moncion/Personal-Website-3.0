/* Regression for the Critical overlay-inert lockout (audit, 2026-07-27).
 *
 * setOverlaySiblingsInert() re-saved every sibling's CURRENT inert value on each
 * acquisition. openLb() sets inert synchronously but defers the visible open
 * behind Promise.race([decode, 250ms]), and a second openLb during that window
 * re-baselined the saved state as `true` — so closing the lightbox "restored"
 * the whole page to inert. Navigation, gallery, contact, menu and skip-link were
 * all dead until a full reload.
 *
 * The second open was reachable by ordinary input: during the pending window the
 * lightbox has no `.open` class so background.js's tap-select guard does not
 * bail, the already-inert body makes elementFromPoint return BODY so its
 * closest() guard does not bail either, and selectPlace() then calls
 * domRef.click() — which fires listeners inside an inert subtree.
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

/** Inert state of the page chrome the lockout used to strand. */
function readChromeInert(page) {
  return page.evaluate(() => {
    const inertOf = selector => {
      const el = document.querySelector(selector);
      return el ? el.inert === true : null;
    };
    return {
      main: inertOf('main'),
      nav: inertOf('nav'),
      sceneRoot: inertOf('#scene-root'),
      lightboxOpen: document.querySelector('.lightbox')?.classList.contains('open') ?? null,
    };
  });
}

test('a re-entrant lightbox open does not strand the page inert after close', async ({ page }) => {
  await bootQuietly(page);

  const before = await readChromeInert(page);
  expect(before.main, 'baseline: page chrome starts interactive').toBe(false);

  /* Open, then immediately open again while the first is still pending. .click()
     is exactly the call selectPlace() makes, and it is what bypasses inert. */
  await page.evaluate(() => {
    const shots = document.querySelectorAll('.shot');
    shots[0].click();
    shots[1]?.click();
  });
  await expect(page.locator('.lightbox')).toHaveClass(/open/, { timeout: ms(5_000) });

  /* Escape is how the whole suite closes the lightbox; .lb-close sits under
     .lb-stage in the stacking order, so a centre-point click is intercepted. */
  await page.keyboard.press('Escape');
  await expect(page.locator('.lightbox')).not.toHaveClass(/open/);

  const after = await readChromeInert(page);
  expect(after.main, 'main was left inert — the page is dead until a reload').toBe(false);
  expect(after.nav, 'nav was left inert').toBe(false);
  expect(after.sceneRoot, 'the scene root was left inert').toBe(false);

  /* The real proof: ordinary interaction still works. */
  await page.locator('.lang-btn').first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await expect(page.locator('.shot').first()).toBeVisible();
});

test('the mobile menu and the lightbox never release each other inert state', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  try {
    await bootQuietly(page);

    await page.locator('.nav-burger').click();
    await expect(page.locator('#mobile-menu, .mobile-menu').first()).toBeVisible();
    const held = await readChromeInert(page);
    expect(held.main, 'the open menu must make the page behind it inert').toBe(true);

    /* A lightbox acquisition attempt while the menu owns the state must neither
       take ownership nor, on ITS release, hand the page back early. Driven
       through .click() because the gallery is inert behind the open menu — the
       same bypass selectPlace() uses, so this is the reachable shape. Escape is
       deliberately avoided here: it closes the menu, which would release the
       state legitimately and prove nothing about ownership. */
    await page.evaluate(() => document.querySelectorAll('.shot')[0]?.click());
    await page.waitForTimeout(400);
    await page.evaluate(() => document.querySelector('.lb-close')?.click());
    await page.waitForTimeout(200);

    const stillHeld = await readChromeInert(page);
    expect(
      stillHeld.main,
      'the lightbox released inert state it never owned — the page came back interactive behind an open modal menu'
    ).toBe(true);

    await page.locator('.mm-close').click();
    const released = await readChromeInert(page);
    expect(released.main, 'closing the owning menu must release the page').toBe(false);

    await page.locator('.lang-btn').first().click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  } finally {
    await context.close();
  }
});
