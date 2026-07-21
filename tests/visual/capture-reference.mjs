import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('usage: node tests/visual/capture-reference.mjs <before|after>');
const rootOut = '.superpowers/gates/codex-v34/package-a-reference';
const out = `${rootOut}/${phase}`;
await mkdir(rootOut, { recursive: true });
await mkdir(out); // fail instead of overwriting an immutable evidence set
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto('http://127.0.0.1:4173/?sceneDebug=1');
await page.evaluate(() => sessionStorage.setItem('daikie-booted', '1'));
await page.reload();
await page.waitForTimeout(15_000);
for (const id of ['home', 'about', 'work', 'gallery', 'projects', 'contact']) {
  await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(1_000);
  await page.screenshot({ path: `${out}/${id}.png` });
}
const sceneHideStyle = await page.addStyleTag({ content: '#scene-root { visibility: hidden !important; }' });
await mkdir(`${out}/layout`, { recursive: true });
for (const id of ['home', 'about', 'work', 'gallery', 'projects', 'contact']) {
  await page.locator(`#${id}`).evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${out}/layout/${id}.png` });
}
await sceneHideStyle.evaluate(el => el.remove());
await browser.close();
if (errors.length) throw new Error(`reference capture page errors: ${errors.join(' | ')}`);

const stateBrowser = await chromium.launch();
const statePage = await stateBrowser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const stateErrors = [];
statePage.on('pageerror', error => stateErrors.push(error.message));
await statePage.goto('http://127.0.0.1:4173/?sceneDebug=1');
await statePage.evaluate(() => sessionStorage.setItem('daikie-booted', '1'));
await statePage.reload();
await statePage.waitForTimeout(15_000);
await mkdir(`${out}/states`, { recursive: true });
await statePage.locator('#contact').evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
await statePage.waitForTimeout(250);
await statePage.locator('.deck-toggle').click();
await statePage.screenshot({ path: `${out}/states/control-deck.png` });
await statePage.keyboard.press('Escape');
await statePage.locator('#gallery').evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
await statePage.locator('.gallery-grid .shot').first().click();
await statePage.waitForFunction(() => {
  const lightbox = document.querySelector('.lightbox');
  const image = document.querySelector('.lb-img');
  const style = getComputedStyle(lightbox);
  return lightbox.classList.contains('open') &&
    lightbox.getAttribute('aria-hidden') === 'false' &&
    image.complete && image.naturalWidth > 0 &&
    style.opacity === '1' && style.visibility === 'visible';
});
await statePage.screenshot({ path: `${out}/states/lightbox.png` });
await statePage.keyboard.press('Escape');
await stateBrowser.close();
if (stateErrors.length) throw new Error(`reference state capture page errors: ${stateErrors.join(' | ')}`);

const mobile = await chromium.launch();
const mobilePage = await mobile.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mobileErrors = [];
mobilePage.on('pageerror', error => mobileErrors.push(error.message));
await mobilePage.goto('http://127.0.0.1:4173/');
await mobilePage.evaluate(() => sessionStorage.setItem('daikie-booted', '1'));
await mobilePage.reload();
await mobilePage.locator('.nav-burger').click();
await mobilePage.waitForFunction(() => {
  const menu = document.getElementById('mobileMenu');
  const links = [...document.querySelectorAll('.mm-links a')];
  return document.body.classList.contains('menu-open') &&
    menu?.getAttribute('aria-hidden') === 'false' &&
    getComputedStyle(menu).visibility === 'visible' &&
    links.length === 6 &&
    links.every(link => getComputedStyle(link).opacity === '1');
});
await mobilePage.screenshot({ path: `${out}/states/mobile-menu-390x844.png` });
await mobile.close();
if (mobileErrors.length) throw new Error(`reference mobile capture page errors: ${mobileErrors.join(' | ')}`);
