import { test, expect } from '@playwright/test';

test('home boots and exposes the full document without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?sceneDebug=1');
  await page.evaluate(() => sessionStorage.setItem('daikie-booted', '1'));
  await page.reload();
  await expect(page.locator('body')).not.toHaveAttribute('data-booting', '');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ishinuki Daikie');
  await expect(page.locator('#contact')).toBeAttached();
  expect(errors).toEqual([]);
});

test('reduced motion reveals content and selects reduced quality', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?sceneDebug=1');
  await expect.poll(() => page.evaluate(() => typeof window.__sceneDebug)).toBe('function');
  const state = await page.evaluate(() => window.__sceneDebug && window.__sceneDebug());
  expect(state.quality).toBe('reduced');
  await expect(page.locator('[data-reveal]').first()).toBeVisible();
});
