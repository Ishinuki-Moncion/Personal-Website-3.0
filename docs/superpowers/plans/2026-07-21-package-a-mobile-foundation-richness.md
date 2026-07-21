# Package A Mobile Foundation and Richness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the current mobile/runtime baseline, make essential behavior independent of WebGL, and safely deliver the measured `mobile-rich` renderer with bounded memory and deterministic demotion tests.

**Architecture:** A committed Playwright/Node test package guards the live static site. Essential DOM modules initialize and paint before an isolated scene bootstrap. A pure `quality-policy.mjs` owns tier decisions, memory estimates, and watchdog state; `gpu-probe.mjs` performs a yielded, fully-cleaned measurement; `background.js` consumes explicit capabilities and exposes debug-only deterministic test hooks.

**Tech Stack:** Static HTML/CSS, vanilla ES modules, Node 22 built-in test runner, Playwright 1.61.1, html-validate 11.5.6, Lighthouse 13.4.1, vendored Three.js r158.

**Spec:** `docs/superpowers/specs/2026-07-21-v34-corrective-completion-program-design.md`, Package A.

## Global Constraints

- Work only in `Personal-Website-3.0` on `codex/v34-corrective-completion`.
- Desktop composition and settled high-tier rendering are locked.
- Essential app behavior must work when WebGL, scene imports, or the probe fail.
- Reduced motion wins and never probes.
- `LITE` remains layout/input state; renderer capability lives in `quality`.
- No UA, GPU-string, `deviceMemory`, or device-identity sniffing.
- Email plaintext may not appear in committed files.
- Mobile-rich starts at DPR 1.75, half-resolution bloom, final samples 2, bloom samples 0, 5,000 globe particles, and no mobile rivulet.
- Postprocessing attachment estimate must remain ≤128 MiB at 430×932.
- Demotion uses a live DPR cap, disposes every postprocessing resource, persists for the session, and never re-promotes.
- Every behavior change follows red-green-refactor and ends with browser verification.
- Codex-authored commits use `OpenAI Codex <noreply@openai.com>` and a `codex-v34` marker.
- Do not push, open a PR, change Pages settings, or deploy.

## File Structure

- `package.json`, `package-lock.json` — reproducible QA dependencies and commands only.
- `playwright.config.mjs` — Chromium/WebKit projects and local server lifecycle.
- `.htmlvalidate.json` — production HTML conformance rules.
- `tests/helpers/serve.mjs` — zero-dependency static server with traversal protection.
- `tests/unit/quality-policy.test.mjs` — pure tier, memory, and demotion tests.
- `tests/browser/mobile-baseline.spec.mjs` — responsive navigation/contact/modal coverage.
- `tests/browser/progressive-enhancement.spec.mjs` — no-WebGL, failed-import, reduced, and boot coverage.
- `tests/browser/mobile-rich.spec.mjs` — forced tiers, payload, cleanup, resize, and demotion.
- `tests/browser/site-matrix.spec.mjs` — final viewport/interaction sweep.
- `tests/visual/capture-reference.mjs` — deterministic desktop reference capture.
- `js/quality-policy.mjs` — pure profile choice, memory estimate, and fps demoter.
- `js/gpu-probe.mjs` — measured coarse-pointer promotion with full cleanup.
- `js/scene-bootstrap.mjs` — scene dependency loading and failure isolation.
- `js/boot.mjs` — essential-first orchestration.
- `js/background.js` — capability profiles and render implementation.
- `js/app.js`, `js/boot.js`, `css/site.css`, `index.html` — baseline mobile/accessibility fixes and boot pacing.
- `tools/verify-site-hardening.js` — structural guarantees complementing behavioral tests.

---

### Task 1: Reproducible QA foundation and locked desktop references

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `playwright.config.mjs`
- Create: `.htmlvalidate.json`
- Create: `tools/validate-w3c.mjs`
- Create: `tests/helpers/serve.mjs`
- Create: `tests/unit/qa-harness.test.mjs`
- Create: `tests/browser/smoke.spec.mjs`
- Create: `tests/visual/capture-reference.mjs`
- Modify: `.gitignore`
- Modify: `docs/superpowers/CODEX-AUDIT-LOG.md`

**Interfaces:**
- Produces: `npm run qa:static`, `npm run qa:browser`, `npm run qa:all`, and
  pinned `npm run test:w3c`; server URL `http://127.0.0.1:4173`; Playwright
  projects `chromium` and `webkit`.

- [ ] **Step 1: Create the QA package manifest**

```json
{
  "name": "daikieos-qa",
  "private": true,
  "type": "module",
  "scripts": {
    "serve": "node tests/helpers/serve.mjs",
    "test:unit": "node --test tests/unit/*.test.mjs",
    "test:browser": "playwright test",
    "test:hardening": "node tools/verify-site-hardening.js",
    "test:html": "html-validate index.html 404.html",
    "test:w3c": "node tools/validate-w3c.mjs",
    "qa:static": "npm run test:unit && npm run test:hardening",
    "qa:browser": "npm run test:browser",
    "qa:all": "npm run qa:static && npm run qa:browser"
  },
  "devDependencies": {
    "@playwright/test": "1.61.1",
    "chrome-launcher": "1.2.1",
    "html-validate": "11.5.6",
    "lighthouse": "13.4.1",
    "pixelmatch": "7.2.0",
    "pngjs": "7.0.0",
    "vnu-jar": "26.7.16"
  }
}
```

Keep `html-validate` as the fast local structural linter and use the pinned
Nu HTML Checker for the actual W3C-compatible conformance gate. The
`vnu-jar` postinstall supplies its Node-local Java runtime when the system has
no Java. `tools/validate-w3c.mjs` runs the same pinned `vnu` executable over
the production-page allowlist and is the single command target used by CI;
do not call the mutable remote validator service.

```js
// tools/validate-w3c.mjs
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const vnu = fileURLToPath(new URL('../node_modules/vnu-jar/vnu-jar.js', import.meta.url));
const result = spawnSync(process.execPath, [vnu, '--errors-only', 'index.html', '404.html'], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
```

Create `tests/unit/qa-harness.test.mjs` with one built-in Node test that uses
`fs/promises.access` to assert that `index.html`, `404.html`, and
`tools/verify-site-hardening.js` exist. This makes `npm run test:unit` green
from the first QA commit instead of relying on a glob that has no matches.

- [ ] **Step 2: Install exact dependencies and browsers**

Run:

```bash
npm install
npx playwright install chromium webkit
```

Expected: `package-lock.json` is created; install exits 0.

- [ ] **Step 3: Create the traversal-safe static server**

```js
// tests/helpers/serve.mjs
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    const candidate = resolve(root, `.${normalize(pathname)}`);
    if (candidate !== root && !candidate.startsWith(root + sep)) throw new Error('outside root');
    let file = candidate;
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`qa-server http://127.0.0.1:${port}`));
```

- [ ] **Step 4: Create Playwright configuration**

```js
// playwright.config.mjs
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/browser',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: 'node tests/helpers/serve.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 15_000
  }
});
```

- [ ] **Step 5: Create initial smoke tests**

```js
// tests/browser/smoke.spec.mjs
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
```

- [ ] **Step 6: Configure HTML validation without style-opinion rules**

```json
{
  "extends": ["html-validate:recommended"],
  "rules": {
    "no-inline-style": "off",
    "prefer-native-element": "off",
    "long-title": "off",
    "tel-non-breaking": "off"
  }
}
```

- [ ] **Step 7: Run baseline and record any validator debt**

Run:

```bash
npm run test:hardening
npm run test:unit
npm run test:browser -- --project=chromium tests/browser/smoke.spec.mjs
npm run test:html
npm run test:w3c
```

Expected: unit 1/1, hardening 48/48, and smoke 2/2. Local HTML lint and pinned
Nu/W3C validation are explicit RED observations for Task 2: save every exact
failing rule/message ID and location in the Task 2 report. Neither is part of
`qa:static` until Task 2 is green.

- [ ] **Step 8: Add deterministic desktop reference capture**

```js
// tests/visual/capture-reference.mjs
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
await mkdir(`${out}/states`, { recursive: true });
await page.locator('.deck-toggle').click();
await page.screenshot({ path: `${out}/states/control-deck.png` });
await page.keyboard.press('Escape');
await page.locator('#gallery').evaluate(el => el.scrollIntoView({ behavior: 'instant' }));
await page.locator('.gallery-grid .shot').first().click();
await page.screenshot({ path: `${out}/states/lightbox.png` });
await page.keyboard.press('Escape');
if (errors.length) throw new Error(`reference capture page errors: ${errors.join(' | ')}`);
await browser.close();

const mobile = await chromium.launch();
const mobilePage = await mobile.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mobilePage.goto('http://127.0.0.1:4173/');
await mobilePage.evaluate(() => sessionStorage.setItem('daikie-booted', '1'));
await mobilePage.reload();
await mobilePage.locator('.nav-burger').click();
await mobilePage.screenshot({ path: `${out}/states/mobile-menu-390x844.png` });
await mobile.close();
```

Add `.superpowers/gates/codex-v34/` to `.gitignore`, run the QA server in one
terminal and `node tests/visual/capture-reference.mjs before` in another. Expected:
six full-scene PNGs, six scene-hidden layout PNGs, control-deck, lightbox, and
mobile-menu state PNGs, and zero page errors.

- [ ] **Step 9: Commit the QA foundation as Codex**

```bash
git add package.json package-lock.json playwright.config.mjs .htmlvalidate.json tools/validate-w3c.mjs tests .gitignore docs/superpowers/CODEX-AUDIT-LOG.md
git -c user.name='OpenAI Codex' -c user.email='noreply@openai.com' commit -m "test(codex-v34a): reproducible browser QA and desktop references"
```

---

### Task 2: Fix current mobile layout, modal, and semantic defects

**Files:**
- Create: `tests/browser/mobile-baseline.spec.mjs`
- Modify: `index.html`
- Modify: `css/site.css`
- Modify: `js/app.js`
- Modify: `tools/verify-site-hardening.js`
- Modify: `package.json`

**Interfaces:**
- Produces: scrollable short-height menu; `setOverlaySiblingsInert(container, open)`; 320px-safe signal row; valid static gallery names and headings.

- [ ] **Step 1: Write failing mobile-baseline tests**

```js
// tests/browser/mobile-baseline.spec.mjs
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

test('lightbox inerts the document and restores it on close', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('daikie-booted', '1'));
  await page.reload();
  await page.locator('.gallery-grid .shot').first().click();
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(true);
  await page.keyboard.press('Escape');
  expect(await page.locator('main').evaluate(el => el.inert)).toBe(false);
});

test('gallery and work controls are semantically complete before app initialization', async ({ page }) => {
  await page.route('**/js/app.js*', route => route.abort());
  await page.goto('/');
  await expect(page.locator('.gallery-grid .shot').first()).toHaveAttribute('aria-label', /NAGANO/);
  await expect(page.locator('#work h3')).toHaveCount(3);
  await expect(page.locator('#projects h3')).toHaveCount(3);
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npm run test:browser -- --project=chromium tests/browser/mobile-baseline.spec.mjs
```

Expected: failures for landscape Contact visibility/scrolling, missing dialog semantics/inert background, 320/375 signal overflow, static gallery names, and missing `h3` headings.

- [ ] **Step 3: Implement valid static semantics in `index.html`**

Make these exact structural changes:

- `#mobileMenu`: add `role="dialog" aria-modal="true" aria-label="Site navigation" inert`.
- Add `aria-label="Primary navigation"` to `.nav` and
  `aria-label="Mobile navigation"` to `.mm-links` so the two navigation
  landmarks have unique names.
- Replace each gallery tile’s two child `div` elements with `span` elements and add its final accessible label directly in markup using the existing location/title.
- Replace each `.row-title` in Work and Projects with `<h3 class="row-title">`.
- Initialize `.lb-img` with `src="images/tiles/gallery-07.jpg" width="640" height="426" alt="NAGANO // 長野 — gallery photograph 1 of 12"`; those are the committed file's measured intrinsic dimensions.
- Change Control Deck heading to `<h2>` and replace unattached `<label>` nodes with `.grp-label` elements referenced by `role="group" aria-labelledby="..."` on each `.seg`.
- Rename the unused template ID `__bundler_thumbnail` to
  `bundler-thumbnail`; the former is valid HTML but violates the committed
  structural linter's CSS-safe ID contract, and no runtime code references it.

- [ ] **Step 4: Implement modal sibling inertness in `app.js`**

Add beside the overlay focus helpers:

```js
const overlayInertState = new Map();
function setOverlaySiblingsInert(container, open) {
  [...document.body.children].forEach(el => {
    if (el === container || el.tagName === 'SCRIPT' || el.tagName === 'TEMPLATE') return;
    if (open) {
      overlayInertState.set(el, el.inert);
      el.inert = true;
    } else if (overlayInertState.has(el)) {
      el.inert = overlayInertState.get(el);
      overlayInertState.delete(el);
    }
  });
}
```

In `setMenu(open)`, set `mmenu.inert = !open`; call
`setOverlaySiblingsInert(mmenu, true)` before focusing Close; on close call
`setOverlaySiblingsInert(mmenu, false)` before restoring burger focus. Apply
the same helper to the existing lightbox open/close paths, before focus enters
and before it is restored. Preserve `aria-hidden`, `aria-expanded`, body scroll
lock, Escape, and the existing Tab traps.

Update the language button names to include visible text:

```js
langBtn.setAttribute('aria-label', lang === 'en'
  ? 'EN / 日本 — Switch to Japanese'
  : '日本 / EN — 英語に切り替える');
```

- [ ] **Step 5: Implement narrow and landscape CSS**

Add:

```css
.mobile-menu { overflow-y: auto; -webkit-overflow-scrolling: touch; }
.signal-row { max-width: 100%; flex-wrap: wrap; }
.signal-row .signal-addr { min-width: 0; overflow-wrap: anywhere; }

@media (max-height: 520px) and (max-width: 820px) {
  .mobile-menu { display: block; }
  .mm-head { position: sticky; top: 0; padding-bottom: 12px; background: rgba(3,4,7,0.97); }
  .mm-links { display: block; margin-block: 20px; }
  .mm-links a { padding: 10px 0; }
  .mm-label { font-size: clamp(30px, 9vh, 42px); }
}

@media (max-width: 400px) {
  .signal-row { display: grid; width: 100%; grid-template-columns: auto minmax(0, 1fr); gap: 8px 12px; }
  .signal-row .signal-tick { grid-column: 2; }
  .signal-row .signal-addr { font-size: 12px; letter-spacing: 0.05em; }
}
```

If the copied tick remains outside 320px during GREEN verification, keep it in column 2 and allow it to wrap; do not reduce the email below 12px.

- [ ] **Step 6: Strengthen structural hardening**

Add checks that require mobile-menu dialog/inert markup, static gallery `aria-label`s, Work/Projects `h3`, `.mobile-menu` overflow, and a max-width-400 signal layout. Avoid exact whole-rule byte matching; pin the semantic tokens and selectors.

- [ ] **Step 7: Run GREEN**

After HTML validation is green, change `qa:static` in `package.json` to:

```json
"qa:static": "npm run test:unit && npm run test:hardening && npm run test:html && npm run test:w3c"
```

```bash
npm run test:browser -- --project=chromium tests/browser/mobile-baseline.spec.mjs
npm run test:browser -- --project=webkit tests/browser/mobile-baseline.spec.mjs
npm run test:html
npm run test:w3c
npm run test:hardening
```

Expected: all mobile-baseline tests pass in both engines; both the local HTML
linter and pinned Nu/W3C conformance check exit 0; hardening count increases
with all PASS; no console/page errors.

- [ ] **Step 8: Commit**

```bash
git add index.html css/site.css js/app.js tools/verify-site-hardening.js tests/browser/mobile-baseline.spec.mjs package.json
git -c user.name='OpenAI Codex' -c user.email='noreply@openai.com' commit -m "fix(codex-v34b): repair mobile menu contact and semantic baseline"
```

---

### Task 3: Decouple essential application behavior from WebGL and paint boot first

**Files:**
- Create: `js/scene-bootstrap.mjs`
- Create: `tests/browser/progressive-enhancement.spec.mjs`
- Modify: `js/boot.mjs`
- Modify: `js/boot.js`
- Modify: `js/cursor.js`
- Modify: `css/site.css`
- Modify: `index.html`
- Modify: `tools/verify-site-hardening.js`

**Interfaces:**
- Produces: `bootstrapScene({ version, probeVersion }) -> Promise<{ ok:boolean, probe:object|null, error:string|null }>`; `window.__SCENE_STATUS`; essential modules initialized before scene bootstrap.

- [ ] **Step 1: Write failing progressive-enhancement tests**

```js
// tests/browser/progressive-enhancement.spec.mjs
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
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?sceneDebug=1');
  expect(await page.evaluate(() => window.__TIER_PROBE)).toBeNull();
  expect(await page.evaluate(() => window.__CURSOR_ACTIVE)).toBe(false);
  expect(await page.locator('body').evaluate(el => getComputedStyle(el).cursor)).not.toBe('none');
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});
```

- [ ] **Step 2: Run RED**

```bash
npm run test:browser -- --project=chromium tests/browser/progressive-enhancement.spec.mjs
```

Expected: failed background import prevents app initialization; coarse reveal exceeds the new budget or lacks first-paint ordering; reduced cursor loop is still live.

- [ ] **Step 3: Create isolated scene bootstrap**

```js
// js/scene-bootstrap.mjs
export async function bootstrapScene({ version, probeVersion }) {
  try {
    const { resolveTier } = await import(`./gpu-probe.mjs?v=${probeVersion}`).catch(() => ({ resolveTier: async () => null }));
    const probe = await resolveTier();
    window.__TIER_PROBE = probe;

    const THREE = await import('three');
    const [{ EffectComposer }, { RenderPass }, { ShaderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/ShaderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/OutputPass.js')
    ]);
    window.THREE = THREE;
    window.POST = { EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass };
    await import(`./background.js?v=${version}`);
    return { ok: true, probe, error: null };
  } catch (error) {
    document.getElementById('scene-root')?.replaceChildren();
    document.body.dataset.scene = 'unavailable';
    return { ok: false, probe: window.__TIER_PROBE ?? null, error: String(error?.message || error) };
  }
}
```

The temporary `gpu-probe.mjs` import fallback is intentional until Task 4 creates the module; Task 3’s test route targets `background.js`, so this task remains independently green.

- [ ] **Step 4: Reorder `boot.mjs`**

Replace the static Three imports and serial scene-first chain with:

```js
const V = { bg: '6.1', boot: '3.2', cursor: '3.2', fx: '3.8', app: '4.4', probe: '1' };

await import(`./app.js?v=${V.app}`);
await import(`./effects.js?v=${V.fx}`);
await import(`./cursor.js?v=${V.cursor}`);
await import(`./boot.js?v=${V.boot}`);

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const { bootstrapScene } = await import('./scene-bootstrap.mjs?v=1');
window.__SCENE_STATUS = { ...(await bootstrapScene({ version: V.bg, probeVersion: V.probe })), readyAt: performance.now() };
document.dispatchEvent(new CustomEvent('scene:ready', { detail: window.__SCENE_STATUS }));
```

- [ ] **Step 5: Enforce mobile boot pacing and reduced cursor shutdown**

In `boot.js`, add `coarse`, `pace`, and cap:

```js
const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
const pace = coarse ? 0.42 : 1;
const hardCap = coarse ? 1500 : 9000;
const later = (fn, ms) => { const tm = setTimeout(fn, ms * pace); timers.push(tm); return tm; };
const repeat = (fn, ms) => { const tm = setInterval(fn, ms * pace); timers.push(tm); return tm; };
```

Use `later()` for every one-shot line/ramp/final delay, `repeat()` for every
scramble/ramp interval, and `hardCap` for the final safety timer. Preserve
instant reduced/returning visits and clear both timeout and interval handles
on reveal.

In `cursor.js`, initialize `window.__CURSOR_ACTIVE = false`, move the existing
cursor body into `initCursor()`, set the flag true only when that body starts,
and call it
only when neither reduced motion nor coarse pointer is active. Do not use a
top-level `return` in an ES module. The disabled path must create no RAF and
leave the native cursor intact.

Add a reduced-motion CSS rule that restores `cursor:auto` on `body` and every
interactive selector that currently declares `cursor:none`; the disabled
custom cursor may not leave fine-pointer reduced-motion users without a cursor.

- [ ] **Step 6: Update watchdog and structural checks**

Keep the inline ten-second watchdog as catastrophic fallback, but make its
normal path independent of scene status. Add hardening checks requiring
essential imports before `scene-bootstrap`, the double-RAF paint boundary,
scene `try/catch`, the coarse 1500 cap, and reduced cursor gating.

- [ ] **Step 7: Run GREEN and existing regressions**

```bash
npm run test:browser -- --project=chromium tests/browser/progressive-enhancement.spec.mjs
npm run test:browser -- --project=webkit tests/browser/progressive-enhancement.spec.mjs
npm run test:browser -- --project=chromium tests/browser/smoke.spec.mjs
npm run test:hardening
```

Expected: all tests pass; failed scene still leaves every DOM interaction usable; mobile reveal ≤1550ms; reduced has zero animations.

- [ ] **Step 8: Commit**

```bash
git add js/scene-bootstrap.mjs js/boot.mjs js/boot.js js/cursor.js css/site.css index.html tools/verify-site-hardening.js tests/browser/progressive-enhancement.spec.mjs
git -c user.name='OpenAI Codex' -c user.email='noreply@openai.com' commit -m "refactor(codex-v34c): make WebGL optional and paint mobile boot first"
```

---

### Task 4: Pure quality policy and fully-cleaned yielded GPU probe

**Files:**
- Create: `js/quality-policy.mjs`
- Create: `js/gpu-probe.mjs`
- Create: `tests/unit/quality-policy.test.mjs`
- Modify: `tests/browser/mobile-rich.spec.mjs`
- Modify: `tools/verify-site-hardening.js`

**Interfaces:**
- Produces: `classifyTier(input)`, `estimatePostFxBytes(input)`, `createFpsDemoter(options)`, `resolveTier(env?) -> Promise<ProbeResult|null>`.
- `ProbeResult`: `{ tier:'mobile-rich'|'lite'|null, score:number|null, forced:boolean, reason:string, cleaned:boolean }`.

- [ ] **Step 1: Write failing pure policy tests**

```js
// tests/unit/quality-policy.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyTier, estimatePostFxBytes, createFpsDemoter } from '../../js/quality-policy.mjs';

test('reduced wins and fine desktop never probes', () => {
  assert.equal(classifyTier({ reduced: true, coarse: true, small: true, forced: 'rich', probeTier: 'mobile-rich', score: 1 }), 'reduced');
  assert.equal(classifyTier({ reduced: false, coarse: false, small: false, forced: null, probeTier: 'lite', score: null }), 'high');
  assert.equal(classifyTier({ reduced: false, coarse: false, small: true, forced: null, probeTier: null, score: 1 }), 'lite');
});

test('coarse pointer earns rich only at the measured threshold', () => {
  assert.equal(classifyTier({ reduced: false, coarse: true, small: true, forced: null, probeTier: null, score: 4.5 }), 'mobile-rich');
  assert.equal(classifyTier({ reduced: false, coarse: true, small: true, forced: null, probeTier: null, score: 4.51 }), 'lite');
  assert.equal(classifyTier({ reduced: false, coarse: true, small: true, forced: 'rich', probeTier: null, score: null }), 'mobile-rich');
  assert.equal(classifyTier({ reduced: false, coarse: true, small: true, forced: null, probeTier: 'lite', score: 1 }), 'lite');
});

test('mobile-rich attachment estimate stays below 128 MiB at the largest phone gate', () => {
  const bytes = estimatePostFxBytes({ width: 430, height: 932, dpr: 1.75, finalSamples: 2, bloomSamples: 0, bloomScale: 0.5 });
  assert.ok(bytes <= 128 * 1024 * 1024, `${bytes} exceeds budget`);
});

test('demoter fires once after four cumulative low-fps seconds and resets on recovery', () => {
  let calls = 0;
  const d = createFpsDemoter({ threshold: 45, holdSeconds: 4, onDemote: () => calls++ });
  d.sample(40, 2); d.sample(50, 1); d.sample(40, 3.9);
  assert.equal(calls, 0);
  d.sample(40, 0.1); d.sample(20, 10);
  assert.equal(calls, 1);
  assert.equal(d.demoted, true);
});
```

Also add an injected probe test with a fake WebGL2 context that counts every
created shader, program, buffer, texture, and framebuffer. Exercise both a
successful measurement and a thrown `readPixels` path through `resolveTier()`;
assert matching delete counts, one `loseContext()` call, yielded frames, and a
`cleaned:true` result in both cases. This is the behavioral cleanup proof;
hardening string checks are only its structural complement.

- [ ] **Step 2: Run RED**

Run: `npm run test:unit`

Expected: module-not-found for `js/quality-policy.mjs`.

- [ ] **Step 3: Implement the pure policy**

```js
// js/quality-policy.mjs
export const RICH_THRESHOLD_MS = 4.5;

export function classifyTier({ reduced, coarse, small, forced, probeTier, score }) {
  if (reduced) return 'reduced';
  if (coarse) {
    if (forced === 'rich') return 'mobile-rich';
    if (forced === 'lite') return 'lite';
    if (probeTier === 'mobile-rich' || probeTier === 'lite') return probeTier;
    return Number.isFinite(score) && score <= RICH_THRESHOLD_MS ? 'mobile-rich' : 'lite';
  }
  return small ? 'lite' : 'high';
}

export function estimatePostFxBytes({ width, height, dpr, finalSamples, bloomSamples, bloomScale }) {
  const bpp = 8;
  const pixels = width * height * dpr * dpr;
  const finalPair = 2 * pixels * bpp * (1 + finalSamples);
  const bloomPixels = pixels * bloomScale * bloomScale;
  const bloomPair = 2 * bloomPixels * bpp * (1 + bloomSamples);
  const bloomInternalsConservative = bloomPixels * bpp;
  return Math.ceil(finalPair + bloomPair + bloomInternalsConservative);
}

export function createFpsDemoter({ threshold = 45, holdSeconds = 4, onDemote }) {
  let lowSeconds = 0;
  let demoted = false;
  return {
    sample(fps, dt) {
      if (demoted) return;
      lowSeconds = fps < threshold ? lowSeconds + dt : 0;
      if (lowSeconds >= holdSeconds) { demoted = true; onDemote(); }
    },
    get demoted() { return demoted; },
    get lowSeconds() { return lowSeconds; }
  };
}
```

- [ ] **Step 4: Implement `gpu-probe.mjs` with injectable environment and `finally` cleanup**

Use these exact exported and internal contracts:

```js
import { RICH_THRESHOLD_MS } from './quality-policy.mjs';

const CACHE_KEY = 'v34.tierProbe';
const FRAMES = 10;
const WARMUP = 2;
const BUDGET_MS = 1500;

export async function resolveTier(env = browserEnv()) {
  if (env.reduced()) return null;
  if (!env.coarse()) return null;
  const forced = env.forced();
  if (forced) return { tier: forced === 'rich' ? 'mobile-rich' : 'lite', score: null, forced: true, reason: 'forced', cleaned: true };
  const cached = env.cacheRead(CACHE_KEY);
  if (cached?.tier === 'mobile-rich' || cached?.tier === 'lite') return { ...cached, forced: false, reason: 'cache', cleaned: true };
  let result;
  try { result = await runProbe(env); }
  catch { result = { tier: 'lite', score: null, forced: false, reason: 'error', cleaned: true }; }
  env.cacheWrite(CACHE_KEY, result);
  return result;
}
```

`browserEnv()` supplies media queries, URL override, guarded sessionStorage, `performance.now`, `requestAnimationFrame`, and an unattached 512×512 canvas. `runProbe()` must retain every created shader, program, buffer, texture, framebuffer, and context in local variables; execute one rain-shaped draw plus four 256×256 blur passes per iteration; `await env.nextFrame()` between iterations; fence each with `readPixels`; check budget before and after each iteration; and in `finally` call the matching `delete*` methods followed by `WEBGL_lose_context.loseContext()`. Return `cleaned:true` on success, budget failure, missing WebGL2, and caught failure. Median uses measured frames after two warmups; score `<= RICH_THRESHOLD_MS` selects `mobile-rich`.

- [ ] **Step 5: Add forced-tier browser assertions**

Create `tests/browser/mobile-rich.spec.mjs` with a mobile context (`390×844`, `hasTouch:true`, `isMobile:true`) and assert:

```js
const probe = await page.evaluate(() => window.__TIER_PROBE);
expect(probe.tier).toBe('mobile-rich');
expect(probe.forced).toBe(true);
expect(probe.cleaned).toBe(true);
```

for `?tier=rich&sceneDebug=1`; assert lite for `?tier=lite`; assert `window.__TIER_PROBE === null` under reduced motion.

- [ ] **Step 6: Run GREEN**

```bash
npm run test:unit
npm run test:browser -- --project=chromium tests/browser/mobile-rich.spec.mjs
npm run test:browser -- --project=webkit tests/browser/mobile-rich.spec.mjs
npm run test:hardening
```

Expected: the policy/demoter/memory/cleanup subtests plus the Task 1 harness pass, forced-tier
browser tests pass, no probe runs under reduced/fine pointer, and hardening
checks probe measurement, yields, identity-ban, cache, and `finally` cleanup.

- [ ] **Step 7: Commit**

```bash
git add js/quality-policy.mjs js/gpu-probe.mjs tests/unit/quality-policy.test.mjs tests/browser/mobile-rich.spec.mjs tools/verify-site-hardening.js
git -c user.name='OpenAI Codex' -c user.email='noreply@openai.com' commit -m "feat(codex-v34d): measured tier policy and leak-free yielded probe"
```

---

### Task 5: Capability profiles and the mobile-rich scene payload

**Files:**
- Modify: `js/background.js`
- Modify: `tests/browser/mobile-rich.spec.mjs`
- Modify: `tools/verify-site-hardening.js`

**Interfaces:**
- Consumes: `window.__TIER_PROBE`, `classifyTier()`.
- Produces: `quality` profiles with explicit fields; debug `{quality,tier,capabilities,probeScore,demoted,effectiveDprCap}`.

- [ ] **Step 1: Extend failing browser expectations**

For forced rich assert debug values exactly:

```js
expect(state.tier).toBe('mobile-rich');
expect(state.expectedGlobeParticles).toBe(5000);
expect(state.capabilities).toMatchObject({ postFX: true, wells: true, graticuleFull: true, refractBeads: true, rivulet: false });
expect(state.effectiveDprCap).toBe(1.75);
```

For forced lite assert 2,600 particles, no postFX/wells/full graticule/refraction, DPR cap 1.5. For desktop assert high, 7,000 particles, DPR cap 2, rivulet true. Assert `state.lite === true` for both rich and lite mobile to pin layout/input separation.

- [ ] **Step 2: Run RED**

Run: `npm run test:browser -- --project=chromium tests/browser/mobile-rich.spec.mjs`

Expected: current quality remains lite and debug fields are missing.

- [ ] **Step 3: Replace `getQualityProfile()` with explicit profiles**

Import `classifyTier` at top of `background.js`. Derive `tier` from `reduced`,
`coarse`, `small`, URL override, and `window.__TIER_PROBE` by passing its
`tier` as `probeTier` and its score as `score`. Keep `LITE = coarse || small`
only for input/layout. Copy the selected profile before adding live fields so
the shared profile literal is never mutated.

Move the existing `RIVULET_GATE` declaration beside the other query/debug
flags before defining `profiles`; remove its old later declaration. This is
required because the `high` profile reads it during profile construction.

Profiles use these exact values:

```js
const profiles = {
  reduced: { name:'reduced', dprCap:1, globeParticles:2600, fieldCounts:[360,180,120], haloLabels:1, haloTicks:8, haloRings:1, postFX:false, postFXSamples:{final:0,bloom:0}, bloomScale:0.5, wells:false, labelPriority:1, graticuleFull:false, shellSegments:[24,16], beadCap:0, refractBeads:false, rivulet:false },
  lite: { name:'lite', dprCap:1.5, globeParticles:2600, fieldCounts:[1100,520,360], haloLabels:2, haloTicks:12, haloRings:1, postFX:false, postFXSamples:{final:0,bloom:0}, bloomScale:0.5, wells:false, labelPriority:1, graticuleFull:false, shellSegments:[24,16], beadCap:12, refractBeads:false, rivulet:false },
  'mobile-rich': { name:'mobile-rich', dprCap:1.75, globeParticles:5000, fieldCounts:[1800,850,620], haloLabels:5, haloTicks:24, haloRings:2, postFX:true, postFXSamples:{final:2,bloom:0}, bloomScale:0.5, wells:true, labelPriority:3, graticuleFull:true, shellSegments:[48,32], beadCap:16, refractBeads:true, rivulet:false },
  high: { name:'high', dprCap:2, globeParticles:7000, fieldCounts:[2600,1200,900], haloLabels:5, haloTicks:24, haloRings:2, postFX:true, postFXSamples:{final:4,bloom:4}, bloomScale:1, wells:true, labelPriority:3, graticuleFull:true, shellSegments:[48,32], beadCap:24, refractBeads:true, rivulet:RIVULET_GATE }
};
```

Set `quality.dpr = Math.min(devicePixelRatio || 1, quality.dprCap)` after selection.

- [ ] **Step 4: Replace richness gates with capabilities**

Replace all richness uses exactly:

- postFX gate → `quality.postFX`.
- rain shader `WELLS` define/update → `quality.wells`.
- halo label priority → `quality.labelPriority`.
- graticule latitudes/meridians → `quality.graticuleFull`.
- shell segments → `quality.shellSegments`.
- bead cap/refraction → `quality.beadCap` / `quality.refractBeads`.
- rivulet early return/import → `quality.rivulet`.

Leave only portrait/input uses on `LITE`: globe seat, halo scale/glow/label opacity/spin, pointer hover/tap behavior, and debug layout field.

- [ ] **Step 5: Add three-way rain definitions**

Use the original lite/high arrays unchanged. Add mobile-rich:

```js
[{ n:50, size:0.38, speed:[7.5,13], op:0.48, z:[-4,-7], len:0.8, head:0.9 },
 { n:100, size:0.23, speed:[4,7], op:0.35, z:[-6,-11], len:0.55, head:0.8 },
 { n:170, size:0.15, speed:[2.2,4.2], op:0.24, z:[-9,-16], len:0.35, head:0.65 }]
```

- [ ] **Step 6: Expand debug surface**

Add `tier`, `probeScore`, `demoted:false` for now, `effectiveDprCap:quality.dprCap`, and a shallow `capabilities` object. Preserve all existing debug keys for prior QA.

- [ ] **Step 7: Run GREEN and audit remaining `LITE` sites**

```bash
rg -n "LITE|quality\.name === 'high'" js/background.js
npm run test:browser -- --project=chromium tests/browser/mobile-rich.spec.mjs
npm run test:browser -- --project=webkit tests/browser/mobile-rich.spec.mjs
npm run test:hardening
```

Expected: every remaining executable `LITE` site is layout/input-only; zero `quality.name === 'high'` richness gates; rich/lite/high tests pass.

- [ ] **Step 8: Commit**

```bash
git add js/background.js tests/browser/mobile-rich.spec.mjs tools/verify-site-hardening.js
git -c user.name='OpenAI Codex' -c user.email='noreply@openai.com' commit -m "feat(codex-v34e): capability profiles and mobile-rich scene payload"
```

---

### Task 6: Memory-bounded mobile postprocessing

**Files:**
- Modify: `js/background.js`
- Modify: `tests/browser/mobile-rich.spec.mjs`
- Modify: `tests/unit/quality-policy.test.mjs`
- Modify: `tools/verify-site-hardening.js`
- Create: `tests/visual/compare-reference.mjs`

**Interfaces:**
- Consumes: `quality.postFXSamples.final`, `quality.postFXSamples.bloom`, `quality.bloomScale`, `estimatePostFxBytes()`.
- Produces: half-resolution mobile bloom, full-resolution final composer,
  desktop settings unchanged, and fail-closed direct rendering on an estimated
  mobile budget breach.

- [ ] **Step 1: Add failing runtime size assertions**

Expose in scene debug:

```js
postFX: { enabled, bloomScale, finalSamples, bloomSamples, estimatedBytes }
```

Assert rich has `{enabled:true,bloomScale:0.5,finalSamples:2,bloomSamples:0}` and `estimatedBytes <= 134217728`. Assert high remains `{bloomScale:1,finalSamples:4,bloomSamples:4}`.

- [ ] **Step 2: Run RED**

Run: `npm run test:browser -- --project=chromium tests/browser/mobile-rich.spec.mjs`

Expected: debug postFX fields absent and rich composer not enabled.

- [ ] **Step 3: Apply profile sample values**

Set bloom composer target samples to `quality.postFXSamples.bloom` and final
composer targets to `quality.postFXSamples.final`. Do not assign mobile MSAA
to bloom targets.

After composer creation and on resize:

```js
function sizeComposers(width, height, dpr) {
  if (!bloomComposer || !finalComposer) return;
  bloomComposer.setPixelRatio(dpr);
  bloomComposer.setSize(Math.max(1, Math.round(width * quality.bloomScale)), Math.max(1, Math.round(height * quality.bloomScale)));
  finalComposer.setPixelRatio(dpr);
  finalComposer.setSize(width, height);
}
```

Desktop `bloomScale:1` preserves existing dimensions. Mobile-rich uses 0.5.

- [ ] **Step 4: Add memory estimate and debug**

Import `estimatePostFxBytes`; calculate it before composer creation at current
CSS width/height, effective DPR, and profile settings. Define
`postFxWithinBudget = quality.name !== 'mobile-rich' || estimatedBytes <= 128 *
1024 * 1024` and create/enable the composers only when both
`quality.postFX && postFxWithinBudget`. Expose `withinBudget` in debug and warn
once on breach. This task fails closed to direct rendering before allocating
composer resources; Task 7 generalizes that path into persisted live demotion.

- [ ] **Step 5: Run GREEN plus desktop reference comparison**

```bash
npm run test:unit
npm run test:browser -- --project=chromium tests/browser/mobile-rich.spec.mjs
npm run test:browser -- --project=webkit tests/browser/mobile-rich.spec.mjs
npm run test:hardening
```

Run `node tests/visual/capture-reference.mjs after` once after a 15-second
settle. Compare the immutable `before/layout/` and `after/layout/` captures with
`pixelmatch`; expected desktop structural difference ratio ≤0.5%. Inspect the
matching `before/` and `after/` full-scene pairs by eye for globe seat, floor,
rain, bloom, and typography;
record the verdict and both artifact paths in the task report. Do not apply a
pixel threshold to nondeterministic animated scene pixels.

Implement `tests/visual/compare-reference.mjs` with `pngjs` and `pixelmatch`.
It compares the six same-size scene-hidden PNG pairs, prints each ratio, exits
nonzero if any ratio exceeds `0.005`, and never writes into `before/`. Optional
diff PNGs go under `package-a-reference/diff/`, which must not already exist.

- [ ] **Step 6: Commit**

```bash
git add js/background.js tests/browser/mobile-rich.spec.mjs tests/unit/quality-policy.test.mjs tests/visual/compare-reference.mjs tools/verify-site-hardening.js
git -c user.name='OpenAI Codex' -c user.email='noreply@openai.com' commit -m "perf(codex-v34f): bound mobile postprocessing memory"
```

---

### Task 7: Deterministic demotion, full disposal, and resize persistence

**Files:**
- Modify: `js/background.js`
- Modify: `tests/browser/mobile-rich.spec.mjs`
- Modify: `tools/verify-site-hardening.js`

**Interfaces:**
- Consumes: `createFpsDemoter()`.
- Produces: live `effectiveDprCap`; `disposePostFX()`; debug-only `window.__sceneTest.setFps(number|null)` when `sceneDebug=1`.

- [ ] **Step 1: Write failing browser demotion test**

```js
test('mobile-rich demotes once, disposes postFX, persists DPR through resize, and stays lite next load', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/?tier=rich&sceneDebug=1');
  await expect.poll(() => page.evaluate(() => typeof window.__sceneTest?.setFps)).toBe('function');
  await page.evaluate(() => window.__sceneTest.setFps(30));
  await page.waitForTimeout(4300);
  let state = await page.evaluate(() => window.__sceneDebug());
  expect(state.demoted).toBe(true);
  expect(state.effectiveDprCap).toBe(1.5);
  expect(state.postFX.enabled).toBe(false);
  expect(state.postFX.disposed).toBe(true);
  expect(state.postFX.disposal.expected.length).toBeGreaterThan(0);
  expect(state.postFX.disposal.called).toEqual(state.postFX.disposal.expected);
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
  expect(state.demotionCount).toBe(1);
  await page.goto('/?sceneDebug=1');
  await expect.poll(() => page.evaluate(() => window.__sceneDebug?.().tier)).toBe('lite');
  state = await page.evaluate(() => window.__sceneDebug());
  expect(state.tier).toBe('lite');
  await context.close();
});
```

The forced rich override normally disables production enforcement. The debug injected FPS source explicitly enables the watchdog for this test; without `sceneDebug=1`, `window.__sceneTest` must be undefined.

- [ ] **Step 2: Run RED**

Expected: `window.__sceneTest` missing.

- [ ] **Step 3: Implement live render state and full disposal**

Add:

```js
let effectiveDprCap = quality.dprCap;
let usePost = !!renderBloomThenFinal;
let postDisposed = false;
let demotionCount = 0;
const postPasses = [];
const disposalCalls = new Map();

function disposePostFX() {
  if (postDisposed) return;
  postDisposed = true;
  usePost = false;
  for (const pass of postPasses.splice(0)) pass?.dispose?.();
  for (const material of [darkMat, darkPoints, darkSprite]) material?.dispose?.();
  matCache?.clear?.();
  bloomComposer?.dispose?.();
  finalComposer?.dispose?.();
  bloomComposer = null;
  finalComposer = null;
}
```

Register every pass at the point it is added to either composer, including both
`RenderPass` instances, `UnrealBloomPass`, mix, output, grade, and chromatic
aberration. Retain nullable handles for both composers and for the three
dark-swap materials. After disposal, clear all pass/composer/material
references and the material cache, not only the composer references shown in
the abbreviated snippet. Do not rely on GC. The render function reads live
`usePost`.

When `sceneDebug=1`, wrap each registered pass/composer/material `dispose()`
with a transparent spy that increments its named counter and then calls the
original method. Debug exposes the sorted expected names and the sorted names
whose real method ran exactly once. Outside scene debug, register the same
resources without wrappers. This behaviorally proves invocation without
replacing the real cleanup.

- [ ] **Step 4: Integrate pure demoter and debug source**

```js
let injectedFps = null;
const demoter = createFpsDemoter({ onDemote: () => {
  demotionCount++;
  effectiveDprCap = 1.5;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, effectiveDprCap));
  disposePostFX();
  try { sessionStorage.setItem('v34.tierProbe', JSON.stringify({ tier:'lite', score:null, demoted:true })); } catch {}
} });

if (sceneDebug) window.__sceneTest = { setFps(value) { injectedFps = Number.isFinite(value) ? value : null; } };
```

In the loop, sample `injectedFps ?? fpsEMA` only for mobile-rich. A forced override stands down unless `injectedFps` is non-null. Resize uses `effectiveDprCap` and never touches disposed composers.

- [ ] **Step 5: Expand debug and hardening**

The render function increments separate direct/postFX frame counters and reports
its last live path. Debug reports `demoted`, `demotionCount`,
`effectiveDprCap`, `renderPath`, `renderCounts`, `postFX.enabled`,
`postFX.disposed`, and the disposal-spy result. Hardening pins `dispose()`
calls, live cap use in resize, the exactly-once pure controller, and
`sceneDebug` gating of `__sceneTest`. Demotion may not rebuild geometry.

- [ ] **Step 6: Run GREEN**

```bash
npm run test:unit
npm run test:browser -- --project=chromium tests/browser/mobile-rich.spec.mjs
npm run test:browser -- --project=webkit tests/browser/mobile-rich.spec.mjs
npm run test:hardening
```

Expected: real behavioral demotion passes in both engines; no context loss/page errors; session next load selects lite; debug hook absent without query flag.

- [ ] **Step 7: Commit**

```bash
git add js/background.js tests/browser/mobile-rich.spec.mjs tools/verify-site-hardening.js
git -c user.name='OpenAI Codex' -c user.email='noreply@openai.com' commit -m "feat(codex-v34g): deterministic demotion with complete GPU disposal"
```

---

### Task 8: Full viewport, failure, performance, and context-loss battery

**Files:**
- Create: `tests/browser/site-matrix.spec.mjs`
- Create: `tests/performance/lighthouse-mobile.mjs`
- Create: `tests/device/mobile-rich-calibration.html`
- Create: `tests/device/mobile-rich-calibration.mjs`
- Modify: `package.json`
- Modify: `js/background.js` only for bugs proven by RED tests
- Modify: `css/site.css` or `js/app.js` only for bugs proven by RED tests

**Interfaces:**
- Produces: `npm run qa:matrix`, `npm run qa:perf`; Package A release evidence.

- [ ] **Step 1: Write the full matrix test**

For each of `320×568`, `375×812`, `390×844`, `430×932`, `480×800`,
`667×375`, `768×1024`, `844×390`, and `1440×900`, run a fresh context in
both configured engines. Phone/portrait and touch-landscape rows use explicit
`hasTouch:true, isMobile:true` coarse-pointer contexts; desktop rows use fine
pointer contexts. Set `daikie-booted=1`, reload, and assert:

- no horizontal document overflow;
- menu destination reachability where burger is shown;
- signal-row containment;
- gallery first/last tile visible;
- lightbox open/next/previous/Escape/focus restore;
- internal Contact navigation and all external-link destinations/`noopener` behavior;
- zero page errors and console errors.

Add separate tests for reduced motion, aborted `background.js`, aborted
`three.module.min.js`, a `getContext('webgl2'|'webgl')` override that returns
`null`, forced lite, forced rich, Japanese-mode document/control behavior,
JavaScript-disabled static navigation/content/gallery names, successful
clipboard copy, clipboard-denial fallback with focus preservation, touch
swipe in both directions, deliberate `WEBGL_lose_context`, background/restore,
repeated navigation, second-visit session cache, and rotation. Test `file://`
fallback in a separately launched Chromium
instance with `args:['--allow-file-access-from-files']`; skip it on WebKit and
assert that app semantics and content remain available even if the scene is
unavailable.

- [ ] **Step 2: Add the owner-device calibration surface**

Create a local-only page under `tests/device/` that loads the home page in a
same-origin iframe without `?tier=` forcing, clears only `v34.tierProbe` on
request, runs five independent probe samples, records raw scores/tier/reason,
then records the 15-second FPS minimum/median, context-loss count, viewport,
DPR, reduced-motion state, and user-agent for diagnostic labeling only. It
must export/copy one JSON packet and state that UA is never input to tier
selection. Add `serve:device` as
`HOST=0.0.0.0 node tests/helpers/serve.mjs`; update the server to bind
`process.env.HOST || '127.0.0.1'` and print the bound host. This tool is test
evidence and is excluded from the later production artifact.

- [ ] **Step 3: Run RED and fix only reproduced defects**

```bash
npm run test:browser -- --project=chromium tests/browser/site-matrix.spec.mjs
npm run test:browser -- --project=webkit tests/browser/site-matrix.spec.mjs
```

Expected: any red item includes an exact viewport/engine/error. Apply the smallest fix, rerun that named test, then rerun the matrix. Do not tune appearance without a failing behavioral assertion.

- [ ] **Step 4: Add Lighthouse median runner**

`tests/performance/lighthouse-mobile.mjs` starts
`tests/helpers/serve.mjs` as a child process, waits until port 4173 responds,
launches Chrome through `chrome-launcher`, and performs three cold mobile
Lighthouse runs. Capture output in a temporary directory, sort performance,
FCP, LCP, CLS, and TBT, print the median, and exit nonzero unless performance
≥80, LCP ≤2500ms, CLS ≤0.10, and TBT ≤200ms. Put child server and Chrome
shutdown in `finally`, including failure paths. Before shutdown, run one
desktop Lighthouse pass and require performance ≥85, LCP ≤2500ms, and CLS
≤0.10. Add scripts:

```json
"qa:matrix": "playwright test tests/browser/site-matrix.spec.mjs",
"qa:perf": "node tests/performance/lighthouse-mobile.mjs"
```

Use `mkdtemp(join(tmpdir(), 'daikie-lh-'))`; never write Lighthouse output into the repository.

- [ ] **Step 5: Run performance gates**

```bash
npm run qa:perf
```

Expected: mobile median meets all four thresholds; desktop performance ≥85, LCP ≤2500ms, CLS ≤0.10. If a threshold fails, capture the failing audit IDs, add a focused regression assertion where possible, and fix the measured cause before continuing.

- [ ] **Step 6: Run complete Package A verification**

```bash
npm run qa:all
npm run qa:matrix -- --project=chromium
npm run qa:matrix -- --project=webkit
npm run qa:perf
git diff --check
```

Expected: all commands exit 0; zero console/page errors; hardening all PASS.

- [ ] **Step 7: Commit**

```bash
git add tests/browser/site-matrix.spec.mjs tests/performance/lighthouse-mobile.mjs tests/device package.json package-lock.json tests/helpers/serve.mjs js/background.js js/app.js css/site.css
git -c user.name='OpenAI Codex' -c user.email='noreply@openai.com' commit -m "test(codex-v34h): full mobile failure and performance battery"
```

---

### Task 9: Package A close-out and Claude Fable audit handoff

**Files:**
- Modify: `js/boot.mjs`
- Modify: `index.html`
- Modify: `docs/superpowers/CODEX-AUDIT-LOG.md`
- Create: `docs/superpowers/handoffs/2026-07-21-package-a-codex-to-claude.md`
- Modify: `.superpowers/sdd/progress.md` (local ignored ledger)

**Interfaces:**
- Produces: burned cache-bust values; review package and executable owner-device calibration gate.

- [ ] **Step 1: Burn new cache versions**

Set `V.bg='7.0'`, `V.boot='3.2'`, `V.cursor='3.2'`, `V.app='4.4'`, `V.probe='1'`, `scene-bootstrap.mjs?v=1`, `quality-policy.mjs?v=1`; bump `index.html` boot entry from `v=30` to `v=31`. Run the complete battery after bumping.

- [ ] **Step 2: Update the Codex audit log**

Add every Package A commit, author, task report path, reviewer verdict, test commands/results, visual artifacts, known minor findings, and unresolved owner-device measurements. State explicitly that no push/deploy occurred.

- [ ] **Step 3: Write Claude Fable handoff**

The handoff must include:

- Compare ranges `v34-mobile-rich...codex/v34-corrective-completion` and `origin/main...codex/v34-corrective-completion`.
- Spec and plan paths.
- All test commands and expected counts.
- Lighthouse medians and desktop reference verdict.
- Probe cleanup, memory arithmetic, demotion/disposal, resize, no-WebGL, and reduced-motion review prompts.
- Current owner gates: actual iPhone normal/Low Power/warm/rotation/restore verdict; no deployment.

Give the owner this exact calibration loop: run `npm run serve:device`, open
`http://<Mac-LAN-IP>:4173/tests/device/mobile-rich-calibration.html` on the
actual iPhone, collect the JSON packet in normal/cold, Low Power, and warm
conditions, and return all three packets plus visual/context-loss verdicts.
`RICH_THRESHOLD_MS = 4.5` is provisional until at least five unforced cold
scores and the 15-second owner-device result are reviewed. Record an explicit
owner decision to keep or change it; if changed, make a new Codex calibration
commit, rerun unit/browser/performance gates, regenerate the review package,
and update the audit log before calling the threshold approved.

- [ ] **Step 4: Run final Package A verification**

```bash
npm run qa:all
npm run qa:matrix -- --project=chromium
npm run qa:matrix -- --project=webkit
npm run qa:perf
git diff --check
git status --short
```

Expected: all tests pass and only intended handoff/audit files are uncommitted before the final commit.

- [ ] **Step 5: Commit close-out**

```bash
git add js/boot.mjs index.html docs/superpowers/CODEX-AUDIT-LOG.md docs/superpowers/handoffs/2026-07-21-package-a-codex-to-claude.md
git -c user.name='OpenAI Codex' -c user.email='noreply@openai.com' commit -m "docs(codex-v34i): close Package A for Claude Fable audit"
```

- [ ] **Step 6: Stop at the owner-device gate**

Do not push or deploy. Report the local branch, worktree, commit range,
automated evidence, and exact iPhone checks still requiring the owner. Task 9
is explicitly waiting at this external gate until the threshold is kept or
changed by recorded owner decision. Package B planning/execution may continue
locally because it does not alter the Package A device verdict, but mobile-rich
is not called shipped until the owner gate and Claude Fable review are
resolved.

---

## Plan self-review

- **Spec coverage:** A1→Task 1; A2→Task 2; A3→Task 3; A4→Tasks 4–6; A5→Task 7; A6→Task 8; visual lock and handoff→Tasks 1/6/9.
- **Known external boundary:** actual iPhone calibration cannot be automated locally and remains an explicit Task 9 owner gate.
- **Type consistency:** `ProbeResult`, `classifyTier`, `estimatePostFxBytes`, `createFpsDemoter`, `effectiveDprCap`, `disposePostFX`, and debug fields are named consistently across producer/consumer tasks.
- **Original-plan defects closed:** no uninterruptible-loop claim, cleanup is `finally`, `LITE` remains true on rich mobile, watchdog is behaviorally exercised, pass resources are explicitly disposed, resize uses a live cap, and 320/375/landscape are in the matrix.
- **Independent pre-flight defects closed:** valid lightbox dimensions,
  immutable before/after captures, full mode/interaction matrix, pinned Nu/W3C
  validation, executable owner-device threshold feedback, and behavioral
  disposal/direct-render proof.
- **No mobile rivulet:** explicitly excluded from all profiles and gates for first ship.
