import { test, expect } from '@playwright/test';

const sizes = [
  { width: 320, height: 568 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 667, height: 375 }
];

for (const viewport of sizes) {
  test(`menu and contact fit ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => sessionStorage.setItem('daikie-booted', '1'));
    await page.reload();
    await page.locator('.nav-burger').click();
    const menu = page.locator('#mobileMenu');
    await expect(menu).toHaveAttribute('role', 'dialog');
    await expect(menu).toHaveAttribute('aria-modal', 'true');
    const contact = menu.getByRole('link', { name: /Contact/i });
    await contact.scrollIntoViewIfNeeded();
    await expect(contact).toBeVisible();
    expect(await page.locator('main').evaluate(el => el.inert)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('.nav-burger')).toBeFocused();
    await page.locator('#contact').evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
    const signal = await page.locator('.signal-row').boundingBox();
    expect(signal.x).toBeGreaterThanOrEqual(0);
    expect(signal.x + signal.width).toBeLessThanOrEqual(viewport.width);
  });
}

test('lightbox inerts the document and restores focus to its activating shot', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('daikie-booted', '1'));
  await page.reload();
  const shot = page.locator('.gallery-grid .shot').first();
  await shot.click();
  await expect(page.locator('.lightbox')).toHaveClass(/\bopen\b/);
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(true);
  await page.keyboard.press('Escape');
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(false);
  await expect(shot).toBeFocused();
});

test('Escape cancels a delayed lightbox open before the View Transition starts', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addInitScript(() => {
    Object.defineProperty(Image.prototype, 'decode', {
      configurable: true,
      value() {
        return new Promise(resolve => { window.__resolveLightboxDecode = resolve; });
      }
    });
    if (typeof document.startViewTransition !== 'function') {
      document.startViewTransition = update => {
        update();
        return { finished: Promise.resolve() };
      };
    }
  });
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('daikie-booted', '1'));
  await page.reload();

  const shot = page.locator('.gallery-grid .shot').first();
  const lightbox = page.locator('.lightbox');
  await shot.click();
  await expect.poll(() => page.evaluate(() => typeof window.__resolveLightboxDecode)).toBe('function');
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(true);

  await page.keyboard.press('Escape');
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(false);
  await expect(shot).toBeFocused();

  await page.evaluate(() => window.__resolveLightboxDecode());
  await page.waitForTimeout(350);
  await expect(lightbox).not.toHaveClass(/\bopen\b/);
  await expect(lightbox).toHaveAttribute('aria-hidden', 'true');
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(false);
  await expect(shot).toBeFocused();
});

test('gallery and work controls are semantically complete before app initialization', async ({ page }) => {
  await page.route('**/js/app.js*', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.gallery-grid .shot').first()).toHaveAttribute('aria-label', /NAGANO/);
  await expect(page.locator('#work h3')).toHaveCount(3);
  await expect(page.locator('#projects h3')).toHaveCount(3);
});
