# Cyberpunk Three.js Atmosphere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first high-confidence Blade Runner / techno-Japanese upgrade to the existing Three.js earth scene: atmospheric rain/glass overlays, a Tokyo holographic halo, richer section story state, and stronger debug/verification hooks.

**Architecture:** Preserve the current static no-build architecture. Keep the Three.js runtime in `js/background.js`, add CSS-only atmosphere in `css/site.css`, add one decorative overlay root in `index.html`, and extend the existing debug verifier in `tools/verify-site-hardening.js`. Do not introduce npm dependencies, ES modules, runtime network data, or a new build step.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, generated global Three.js r158 build at `js/vendor/three.global.min.js`, WebGL `Points`, `LineSegments`, `Sprite`, `CanvasTexture`, and existing browser/manual visual verification.

## Global Constraints

- Work from `/Users/daikieishinuki/.codex/worktrees/db6c/Personal Website`.
- Expected branch is `codex/earth-scene-quality`.
- Preserve all current user changes. Do not revert unrelated files.
- The site must continue to work from direct `file://` open.
- The site must continue to work from a simple static server.
- Do not add package managers, npm dependencies, CDNs, module scripts, or fetch-based scene assets.
- Keep `#scene-root` decorative and `aria-hidden="true"`.
- Any new visual location/story meaning must remain decorative or also be represented in regular HTML.
- Preserve reduced-motion behavior with a meaningful static frame.
- Preserve LITE behavior for coarse pointers and screens at or below `760px`.
- Preserve the generated Three global vendor file and do not reintroduce deprecated `three.min.js`.
- Keep per-frame work cheap: transforms, opacity, uniforms, draw ranges, and small position updates only.
- Do not rebuild large particle buffers per frame.
- Do not implement true `EffectComposer`/`UnrealBloomPass` in this pass.
- Do not implement live weather, train, social, satellite, or map API data in this pass.
- Do not modify `Ishinuki Daikie v1 (backup).html`.
- Commit after each independently testable task if execution is happening in Claude Code.

---

## Claude Code Start Prompt

Use this exact framing when handing the task to a fresh Claude Code session:

```text
You are working in /Users/daikieishinuki/.codex/worktrees/db6c/Personal Website on branch codex/earth-scene-quality.

Read these files before editing:
- docs/superpowers/specs/2026-07-01-earth-scene-quality-design.md
- docs/superpowers/specs/2026-07-01-cyberpunk-threejs-future-work.md
- docs/superpowers/plans/2026-07-01-cyberpunk-threejs-claude-execution.md

Execute the implementation plan task by task. Keep the static no-build architecture. Do not add dependencies. Do not use live network data. Preserve file:// support. Verify with syntax checks, the site hardening script, browser console checks, and desktop/mobile/reduced-motion screenshots. Stop and ask before true post-processing, large file splits, or any change that breaks the current earth scene.
```

## Planning Inputs

Use these docs as the local source of truth:

- `docs/superpowers/specs/2026-07-01-earth-scene-quality-design.md`: already-executed quality upgrade design, current constraints, and existing Earth scene architecture.
- `docs/superpowers/specs/2026-07-01-cyberpunk-threejs-future-work.md`: broad future-work concept brief for Blade Runner / techno-Japanese atmosphere.
- This plan: execution-grade instructions for the first implementation slice.

## Current Code Map

- `index.html`
  - Scene roots live at lines near `#scene-root`, `.scene-debug`, `.crt`, and `.frame-hud`.
  - Scripts load near the bottom. Current Three script is `js/vendor/three.global.min.js?v=158.0.1`.
  - Current `background.js` load is versioned as `js/background.js?v=3.4`.
  - Current `effects.js` load is versioned as `js/effects.js?v=3.3`.
  - Current `site.css` load is versioned as `css/site.css?v=3.3`.

- `css/site.css`
  - CSS variables live at the top under `:root`.
  - `#scene-root`, `.scene-debug`, `.crt`, and `.frame-hud` are near the top under "Layered scene roots".
  - Existing CRT scanline/vignette effects already exist. Do not remove them.
  - Add the new rain/glass layer near the existing overlay styles so z-index ordering is easy to audit.

- `js/background.js`
  - IIFE starts at the top and exits if `#scene-root` or `window.THREE` is missing.
  - `getQualityProfile()` returns `high`, `lite`, or `reduced`.
  - Geometry helpers: `setFiniteAttribute`, `makeGeometry`, `nameObject`.
  - `PLACES` contains Dallas and Tokyo.
  - `makePlaceNode(place)` creates the current Dallas/Tokyo points.
  - `tangentRing()` creates current Tokyo focus/ping rings.
  - `callout` IIFE creates the current coordinate sprite.
  - `sectionStories` and `window.__sceneFocus(sectionId)` already exist.
  - `getSceneDebug()` and `updateDebugText()` expose debug state behind `?sceneDebug=1`.
  - Reduced-motion branch renders once and returns.
  - Main `loop(now)` owns animation state.

- `js/effects.js`
  - Active section detection calls `window.__scenePing()` and `window.__sceneFocus(active)`.
  - Do not change this unless a new scene API absolutely requires it.

- `tools/verify-site-hardening.js`
  - Static verifier for critical site invariants.
  - Extend it to catch the new overlay, halo, story state, and debug hooks.

## Visual Target Sheet

Use these values unless browser verification proves they need tuning.

### Palette

```text
Void black: #05060a
Panel black: rgba(5, 6, 10, 0.82)
Neon cyan: #39f0ff
Deep cyan: #1c6f7a
Amber: #ff9e2c
Soft amber: #ffd9a0
Alert red, optional tiny accents only: #ff3b5c
Terminal green, optional tiny accents only: #8dffb3
Fog blue: rgba(57, 240, 255, 0.08)
Glass white: rgba(233, 241, 244, 0.08)
```

### Atmosphere Budgets

Desktop high:

- Rain/glass overlay visible but never stronger than the hero text.
- `--scene-rain-opacity`: target `0.28`.
- `--scene-glass-opacity`: target `0.18`.
- Animated rain allowed.
- Halo labels: max `5`.
- Halo rings: max `2`.
- Halo ticks: max `24`.

LITE:

- `--scene-rain-opacity`: target `0.14`.
- `--scene-glass-opacity`: target `0.10`.
- Halo labels: max `2`.
- Halo rings: max `1`.
- Halo ticks: max `12`.

Reduced motion:

- `--scene-rain-opacity`: target `0`.
- `--scene-glass-opacity`: target `0.12`.
- No animated rain.
- Static Tokyo halo can remain visible if it does not shimmer.

### Rejection Criteria

Reject and tune down if any of these happen:

- Hero name becomes harder to read at desktop or mobile.
- The globe is less recognizable within three seconds.
- Rain reads as a weather simulation instead of a glass/neo-noir texture.
- Tokyo labels look like random decorative stickers.
- Section changes strobe during fast scrolling.
- Browser console reports any Three.js warning or runtime error.

## Data Contracts

The implementation should converge on these structures inside `js/background.js`.

### Scene Colors

```javascript
const SCENE_COLORS = {
  cyan: CYAN,
  amber: AMBER,
  softAmber: 0xffd9a0,
  alert: 0xff3b5c,
  terminal: 0x8dffb3,
};
```

### Extended Quality Profile Shape

Keep the existing profile names and add effect budgets:

```javascript
{
  name: 'high',
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  globeParticles: 7000,
  fieldCounts: [2600, 1200, 900],
  streaks: 40,
  haloLabels: 5,
  haloTicks: 24,
  haloRings: 2,
  rain: 0.28,
  glass: 0.18,
}
```

Required exact values:

```javascript
// reduced
haloLabels: 1
haloTicks: 8
haloRings: 1
rain: 0
glass: 0.12

// lite
haloLabels: 2
haloTicks: 12
haloRings: 1
rain: 0.14
glass: 0.10

// high
haloLabels: 5
haloTicks: 24
haloRings: 2
rain: 0.28
glass: 0.18
```

### Tokyo Halo Labels

Use this exact data for the first pass:

```javascript
const TOKYO_HALO_LABELS = [
  { id: 'tokyo', jp: '東京', en: 'TOKYO', angle: 0, priority: 1, kind: 'place' },
  { id: 'jst', jp: '日本時間', en: 'JST', angle: 52, priority: 1, kind: 'status' },
  { id: 'shibuya', jp: '渋谷', en: 'SHIBUYA', angle: 112, priority: 2, kind: 'district' },
  { id: 'shinjuku', jp: '新宿', en: 'SHINJUKU', angle: 202, priority: 2, kind: 'district' },
  { id: 'akihabara', jp: '秋葉原', en: 'AKIHABARA', angle: 292, priority: 3, kind: 'district' },
];
```

Filtering rule:

```javascript
const visibleHaloLabels = TOKYO_HALO_LABELS
  .filter(label => label.priority <= (quality.name === 'high' ? 3 : 1))
  .slice(0, quality.haloLabels);
```

### Section Story Shape

Replace the current small story objects with this shape:

```javascript
{
  place: 'tokyo',
  sequence: null,
  intensity: 1,
  route: 'hold',
  halo: 1,
  rain: 1,
  labels: 1,
  callout: 1,
  camera: 0,
}
```

Use these exact section values:

```javascript
const sectionStories = {
  home: {
    place: 'tokyo', sequence: null, intensity: 1.2, route: 'replay',
    halo: 1, rain: 1, labels: 1, callout: 1, camera: 0,
  },
  about: {
    place: 'tokyo', sequence: ['dallas', 'tokyo'], intensity: 0.95, route: 'replay',
    halo: 0.85, rain: 0.85, labels: 0.85, callout: 1, camera: -0.2,
  },
  work: {
    place: 'tokyo', sequence: null, intensity: 0.85, route: 'hold',
    halo: 1.15, rain: 0.7, labels: 1, callout: 0.9, camera: 0,
  },
  gallery: {
    place: 'tokyo', sequence: null, intensity: 0.45, route: 'hold',
    halo: 0.45, rain: 0.35, labels: 0.35, callout: 0.35, camera: 0.15,
  },
  projects: {
    place: 'dallas', sequence: null, intensity: 0.75, route: 'hold',
    halo: 0.35, rain: 0.55, labels: 0.2, callout: 0.65, camera: -0.1,
  },
  contact: {
    place: 'tokyo', sequence: null, intensity: 1.0, route: 'hold',
    halo: 1.25, rain: 0.8, labels: 1, callout: 1, camera: 0,
  },
};
```

### Scene State Shape

Add one state object near `sectionStories`:

```javascript
const sceneState = {
  section: 'home',
  story: sectionStories.home,
  halo: sectionStories.home.halo,
  rain: sectionStories.home.rain,
  labels: sectionStories.home.labels,
  callout: sectionStories.home.callout,
  camera: sectionStories.home.camera,
  haloPulse: 0,
};
```

State interpolation rule in the animation loop:

```javascript
sceneState.halo += (sceneState.story.halo - sceneState.halo) * Math.min(1, 0.08 * f);
sceneState.rain += (sceneState.story.rain - sceneState.rain) * Math.min(1, 0.08 * f);
sceneState.labels += (sceneState.story.labels - sceneState.labels) * Math.min(1, 0.08 * f);
sceneState.callout += (sceneState.story.callout - sceneState.callout) * Math.min(1, 0.08 * f);
sceneState.camera += (sceneState.story.camera - sceneState.camera) * Math.min(1, 0.06 * f);
```

## File Structure

- Modify: `index.html`
  - Add one decorative `.scene-atmosphere` root after `.scene-debug`.
  - Bump CSS and `background.js` query strings after changes.

- Modify: `css/site.css`
  - Add scene atmosphere CSS variables.
  - Add `.scene-atmosphere`, rain, glass, and reduced-motion rules.
  - Keep existing `.crt` and `.frame-hud`.

- Modify: `js/background.js`
  - Extend quality profiles.
  - Add scene config constants and Tokyo halo labels.
  - Add canvas sprite helpers.
  - Add `makeTokyoHalo()`.
  - Replace `sectionStories` with richer state.
  - Add debug fields.
  - Update reduced-motion static frame.
  - Update render loop.

- Modify: `tools/verify-site-hardening.js`
  - Add static assertions for `.scene-atmosphere`, Tokyo halo data, richer `sectionStories`, `sceneState`, and debug fields.

- Optional modify: `docs/superpowers/specs/2026-07-01-cyberpunk-threejs-future-work.md`
  - Add a link to this plan under the recommended first execution slice.

## Task 0: Baseline And Safety Check

**Files:**
- Read only: all source files.

**Interfaces:**
- Consumes: current branch state.
- Produces: verified baseline before changes.

- [ ] **Step 1: Confirm branch and dirty state**

Run:

```bash
git status --short --branch
```

Expected:

```text
## codex/earth-scene-quality
?? docs/superpowers/specs/2026-07-01-cyberpunk-threejs-future-work.md
?? docs/superpowers/plans/2026-07-01-cyberpunk-threejs-claude-execution.md
```

Also acceptable: the same branch with no untracked docs if the planning docs were committed before execution.

If other modified files appear, inspect them before editing. Do not overwrite them.

- [ ] **Step 2: Read the planning docs**

Run:

```bash
sed -n '1,220p' docs/superpowers/specs/2026-07-01-earth-scene-quality-design.md
sed -n '1,260p' docs/superpowers/specs/2026-07-01-cyberpunk-threejs-future-work.md
sed -n '1,260p' docs/superpowers/plans/2026-07-01-cyberpunk-threejs-claude-execution.md
```

Expected: the docs describe no-build static deployment, Tokyo/Dallas story, and the first execution slice.

- [ ] **Step 3: Run baseline static checks**

Run:

```bash
node tools/verify-site-hardening.js
node --check js/background.js
node --check js/app.js
node --check js/effects.js
node --check tools/verify-site-hardening.js
```

Expected: all commands pass.

- [ ] **Step 4: Capture baseline browser state**

Start a local static server:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/?sceneDebug=1
```

Required checks:

- The canvas renders.
- Console has no Three.js warnings.
- Debug overlay appears.
- `window.__sceneDebug()` returns `quality`, `dpr`, `lite`, `reduced`, `globeParticles`, `expectedGlobeParticles`, `focusedPlaceId`, `arcHead`, and `arcSegments`.

If browser automation is unavailable, perform this manually and write down results before coding. Do not claim visual verification later unless an actual browser was checked.

- [ ] **Step 5: Stop baseline server**

Stop the static server before continuing unless the execution environment keeps it managed.

## Task 1: Add The Decorative Rain/Glass Overlay Root

**Files:**
- Modify: `index.html`
- Modify: `css/site.css`

**Interfaces:**
- Consumes: existing overlay roots `#scene-root`, `.scene-debug`, `.crt`, `.frame-hud`.
- Produces: decorative `.scene-atmosphere` DOM/CSS layer controlled by CSS variables.

- [ ] **Step 1: Add the atmosphere root in `index.html`**

In `index.html`, immediately after:

```html
<div class="scene-debug" aria-hidden="true"></div>
```

add:

```html
<div class="scene-atmosphere" aria-hidden="true">
  <div class="scene-rain"></div>
  <div class="scene-glass"></div>
</div>
```

Do not put text content inside this layer. It is decorative.

- [ ] **Step 2: Bump cache query strings**

In `index.html`, update:

```html
<link rel="stylesheet" href="css/site.css?v=3.3" />
```

to:

```html
<link rel="stylesheet" href="css/site.css?v=3.4" />
```

Do not bump JavaScript versions in this task unless JavaScript is edited in this task.

- [ ] **Step 3: Add atmosphere CSS variables**

In `css/site.css`, inside `:root` after the bloom variables, add:

```css
  --scene-rain-opacity: 0.28;
  --scene-glass-opacity: 0.18;
  --scene-rain-speed: 16s;
  --scene-rain-slant: -8deg;
```

- [ ] **Step 4: Add the overlay CSS**

In `css/site.css`, after `.scene-debug.on`, add:

```css
.scene-atmosphere {
  position: fixed;
  inset: 0;
  z-index: 86;
  pointer-events: none;
  overflow: hidden;
  opacity: 1;
}
.scene-rain,
.scene-glass {
  position: absolute;
  inset: -12%;
}
.scene-rain {
  opacity: var(--scene-rain-opacity);
  transform: rotate(var(--scene-rain-slant));
  background-image:
    repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 46px,
      rgba(57, 240, 255, 0.16) 47px,
      transparent 49px
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 83px,
      rgba(255, 158, 44, 0.10) 84px,
      transparent 86px
    );
  background-size: 160px 100%, 260px 100%;
  animation: sceneRainFall var(--scene-rain-speed) linear infinite;
  mix-blend-mode: screen;
}
.scene-glass {
  opacity: var(--scene-glass-opacity);
  background:
    linear-gradient(105deg, transparent 0 42%, rgba(233, 241, 244, 0.07) 46%, transparent 52%),
    radial-gradient(circle at 74% 34%, rgba(57, 240, 255, 0.12), transparent 30%),
    radial-gradient(circle at 18% 76%, rgba(255, 158, 44, 0.10), transparent 28%);
  filter: blur(0.2px);
}
@keyframes sceneRainFall {
  from { background-position: 0 -120px, 0 -220px; }
  to { background-position: 0 620px, 0 720px; }
}
@media (hover: none), (pointer: coarse) {
  :root {
    --scene-rain-opacity: 0.14;
    --scene-glass-opacity: 0.10;
    --scene-rain-speed: 22s;
  }
}
@media (prefers-reduced-motion: reduce) {
  :root {
    --scene-rain-opacity: 0;
    --scene-glass-opacity: 0.12;
  }
  .scene-rain { animation: none; }
}
```

- [ ] **Step 5: Run syntax/static checks**

Run:

```bash
node tools/verify-site-hardening.js
git diff --check
```

Expected: `verify-site-hardening.js` still passes because it has not yet been updated for new assertions. `git diff --check` reports no whitespace errors.

- [ ] **Step 6: Browser-check overlay readability**

Open `index.html` from `file://` and from `http://127.0.0.1:4173/`.

Expected:

- Rain/glass is visible but subtle.
- Hero text remains readable.
- Existing CRT and frame HUD still appear.
- Console is clean.

- [ ] **Step 7: Commit**

Run:

```bash
git add index.html css/site.css
git commit -m "feat: add cyberpunk scene atmosphere overlay"
```

## Task 2: Extend Quality Profiles And Scene State

**Files:**
- Modify: `js/background.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: existing `getQualityProfile()`, `quality`, `sectionStories`, `window.__sceneFocus`.
- Produces: effect budgets on `quality`, `SCENE_COLORS`, richer `sectionStories`, and `sceneState`.

- [ ] **Step 1: Extend `getQualityProfile()`**

In `js/background.js`, update the returned objects in `getQualityProfile()` to include halo/rain/glass budgets.

For `reduced`, return:

```javascript
    if (reduced) return {
      name: 'reduced',
      dpr: 1,
      globeParticles: 2600,
      fieldCounts: [360, 180, 120],
      streaks: 12,
      haloLabels: 1,
      haloTicks: 8,
      haloRings: 1,
      rain: 0,
      glass: 0.12,
    };
```

For `lite`, return:

```javascript
    if (LITE) return {
      name: 'lite',
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      globeParticles: 2600,
      fieldCounts: [1100, 520, 360],
      streaks: 22,
      haloLabels: 2,
      haloTicks: 12,
      haloRings: 1,
      rain: 0.14,
      glass: 0.10,
    };
```

For `high`, return:

```javascript
    return {
      name: 'high',
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      globeParticles: 7000,
      fieldCounts: [2600, 1200, 900],
      streaks: 40,
      haloLabels: 5,
      haloTicks: 24,
      haloRings: 2,
      rain: 0.28,
      glass: 0.18,
    };
```

- [ ] **Step 2: Add scene color constants**

After:

```javascript
  const quality = getQualityProfile();
```

add:

```javascript
  const SCENE_COLORS = {
    cyan: CYAN,
    amber: AMBER,
    softAmber: 0xffd9a0,
    alert: 0xff3b5c,
    terminal: 0x8dffb3,
  };
```

- [ ] **Step 3: Add atmosphere CSS variable sync**

After renderer creation and debug setup, add:

```javascript
  function setAtmosphereVars(rainScale, glassScale) {
    const rain = reduced ? 0 : quality.rain * Math.max(0, rainScale == null ? 1 : rainScale);
    const glass = quality.glass * Math.max(0, glassScale == null ? 1 : glassScale);
    document.documentElement.style.setProperty('--scene-rain-opacity', rain.toFixed(3));
    document.documentElement.style.setProperty('--scene-glass-opacity', glass.toFixed(3));
  }
  setAtmosphereVars(1, 1);
```

This keeps atmosphere tied to the scene quality profile even if CSS defaults differ.

- [ ] **Step 4: Replace `sectionStories` and add `sceneState`**

Replace the current `sectionStories` block with the exact object from the "Section Story Shape" section above, then add the exact `sceneState` object after it.

- [ ] **Step 5: Replace `window.__sceneFocus` body**

Replace the full current `window.__sceneFocus = sectionId => {` block that starts with `const story = sectionStories[sectionId] || sectionStories.home;` and ends with `setFocusedPlace(story.place, story.intensity);` with:

```javascript
  window.__sceneFocus = sectionId => {
    const story = sectionStories[sectionId] || sectionStories.home;
    sceneState.section = sectionStories[sectionId] ? sectionId : 'home';
    sceneState.story = story;
    sceneState.haloPulse = Math.max(sceneState.haloPulse, story.intensity || 1);
    clearTimeout(storyTimer);
    if (story.route === 'replay') replayJourney();
    if (story.sequence) {
      setFocusedPlace(story.sequence[0], story.intensity);
      storyTimer = setTimeout(() => setFocusedPlace(story.sequence[1], story.intensity * 0.85), 650);
      return;
    }
    setFocusedPlace(story.place, story.intensity);
  };
```

- [ ] **Step 6: Add debug fields**

In `getSceneDebug()`, add:

```javascript
      activeSection: sceneState.section,
      halo: Number(sceneState.halo.toFixed(3)),
      rain: Number(sceneState.rain.toFixed(3)),
      labels: Number(sceneState.labels.toFixed(3)),
      callout: Number(sceneState.callout.toFixed(3)),
```

In `updateDebugText()`, add these lines before `focus=`:

```javascript
      'section=' + d.activeSection,
      'halo=' + d.halo,
      'rain=' + d.rain,
```

- [ ] **Step 7: Interpolate state in the render loop**

In `loop(now)`, after `const f = dt * 60;`, add:

```javascript
    sceneState.halo += (sceneState.story.halo - sceneState.halo) * Math.min(1, 0.08 * f);
    sceneState.rain += (sceneState.story.rain - sceneState.rain) * Math.min(1, 0.08 * f);
    sceneState.labels += (sceneState.story.labels - sceneState.labels) * Math.min(1, 0.08 * f);
    sceneState.callout += (sceneState.story.callout - sceneState.callout) * Math.min(1, 0.08 * f);
    sceneState.camera += (sceneState.story.camera - sceneState.camera) * Math.min(1, 0.06 * f);
    if (sceneState.haloPulse > 0.01) sceneState.haloPulse *= Math.pow(0.92, f);
    else sceneState.haloPulse = 0;
    setAtmosphereVars(sceneState.rain, 1);
```

- [ ] **Step 8: Apply story callout intensity**

Replace:

```javascript
    callout.sprite.material.opacity = focusedFacing * focusedFacing * (focusedPlace.primary ? 0.9 : 0.55);
```

with:

```javascript
    callout.sprite.material.opacity = focusedFacing * focusedFacing * sceneState.callout * (focusedPlace.primary ? 0.9 : 0.55);
```

- [ ] **Step 9: Apply story camera bias**

Replace:

```javascript
    camera.position.y += (-mouse.y * 1.0 + scrollN * 3 - camera.position.y) * 0.04;
```

with:

```javascript
    camera.position.y += (-mouse.y * 1.0 + scrollN * 3 + sceneState.camera - camera.position.y) * 0.04;
```

- [ ] **Step 10: Bump `background.js` cache query**

In `index.html`, update:

```html
<script src="js/background.js?v=3.4"></script>
```

to:

```html
<script src="js/background.js?v=3.5"></script>
```

- [ ] **Step 11: Run checks**

Run:

```bash
node --check js/background.js
node tools/verify-site-hardening.js
git diff --check
```

Expected: pass.

- [ ] **Step 12: Browser-check debug state**

Open `http://127.0.0.1:4173/?sceneDebug=1`.

In console, run:

```javascript
window.__sceneDebug()
```

Expected: returned object includes `activeSection`, `halo`, `rain`, `labels`, and `callout`.

- [ ] **Step 13: Commit**

Run:

```bash
git add js/background.js index.html
git commit -m "feat: add cyberpunk scene story state"
```

## Task 3: Add Reusable Canvas Sprite Helpers

**Files:**
- Modify: `js/background.js`

**Interfaces:**
- Consumes: `THREE.CanvasTexture`, `THREE.Sprite`, `THREE.SpriteMaterial`, `nameObject`.
- Produces: `makeCanvasSprite(name, width, height, scale, drawFn)` and `drawHudLabel(ctx, label, width, height, accent)`.

- [ ] **Step 1: Add helper functions before the callout IIFE**

In `js/background.js`, immediately before:

```javascript
  // (d) coordinate callout — CanvasTexture sprite, drawn once fonts are ready
```

add:

```javascript
  function makeCanvasSprite(name, width, height, scale, drawFn) {
    const cv = document.createElement('canvas');
    cv.width = width;
    cv.height = height;
    const tex = new THREE.CanvasTexture(cv);
    const ctx = cv.getContext('2d');
    function redraw(payload) {
      ctx.clearRect(0, 0, width, height);
      drawFn(ctx, payload, width, height);
      tex.needsUpdate = true;
    }
    redraw();
    const sprite = nameObject(new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })), name);
    sprite.scale.set(scale[0], scale[1], scale[2] || 1);
    return { sprite, redraw, texture: tex, canvas: cv };
  }

  function drawHudLabel(ctx, label, width, height, accent) {
    const color = accent || '#39f0ff';
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(57, 240, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, 18); ctx.lineTo(2, 2); ctx.lineTo(28, 2);
    ctx.moveTo(width - 28, 2); ctx.lineTo(width - 2, 2); ctx.lineTo(width - 2, 18);
    ctx.moveTo(2, height - 18); ctx.lineTo(2, height - 2); ctx.lineTo(28, height - 2);
    ctx.moveTo(width - 28, height - 2); ctx.lineTo(width - 2, height - 2); ctx.lineTo(width - 2, height - 18);
    ctx.stroke();
    ctx.font = '500 28px "M PLUS Rounded 1c", "JetBrains Mono", monospace';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillText(label.jp || label.en, 16, 34);
    ctx.shadowBlur = 0;
    ctx.font = '500 13px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(233, 241, 244, 0.78)';
    ctx.fillText(label.en || '', 18, 54);
    ctx.fillStyle = 'rgba(255, 158, 44, 0.78)';
    ctx.fillRect(width - 58, height - 18, 34, 2);
    ctx.fillRect(width - 18, height - 18, 8, 2);
    ctx.restore();
  }
```

- [ ] **Step 2: Leave existing callout behavior unchanged**

Do not rewrite the current coordinate callout in this task. These helpers are for Tokyo halo labels first.

- [ ] **Step 3: Run checks**

Run:

```bash
node --check js/background.js
node tools/verify-site-hardening.js
git diff --check
```

Expected: pass.

- [ ] **Step 4: Commit**

Run:

```bash
git add js/background.js
git commit -m "chore: add scene canvas sprite helpers"
```

## Task 4: Build The Tokyo Holographic Halo

**Files:**
- Modify: `js/background.js`

**Interfaces:**
- Consumes: `TOKYO`, `R`, `quality`, `SCENE_COLORS`, `TOKYO_HALO_LABELS`, `makeGeometry`, `nameObject`, `makeCanvasSprite`, `drawHudLabel`, `spin`.
- Produces: `tokyoHalo` object with `.group`, `.rings`, `.ticks`, `.labels`, `.packet`, `.packetMat`, `.packetGeo`, and `.setPacketAt(angle)`.

- [ ] **Step 1: Add `TOKYO_HALO_LABELS`**

After `const placeVector = (place, radius) => toV3(place.lat, place.lon, radius);`, add the exact `TOKYO_HALO_LABELS` array from the "Data Contracts" section.

- [ ] **Step 2: Add circle/tick geometry helpers**

Before `function tangentRing(inner, outer, op, name)`, add:

```javascript
  function makeCircleLine(name, radius, segments, color, opacity) {
    const pts = new Float32Array(segments * 3);
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts[i * 3] = Math.cos(a) * radius;
      pts[i * 3 + 1] = Math.sin(a) * radius;
      pts[i * 3 + 2] = 0;
    }
    const geo = makeGeometry(name, pts, 3);
    if (!geo) return null;
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return nameObject(new THREE.LineLoop(geo, mat), name);
  }

  function makeRadialTicks(name, count, inner, outer, color, opacity) {
    const pts = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      pts.set([c * inner, s * inner, 0, c * outer, s * outer, 0], i * 6);
    }
    const geo = makeGeometry(name, pts, 3);
    if (!geo) return null;
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return nameObject(new THREE.LineSegments(geo, mat), name);
  }
```

- [ ] **Step 3: Add `makeTokyoHalo()`**

After `pingRing` is created, add:

```javascript
  function makeTokyoHalo() {
    const group = new THREE.Group();
    group.name = 'tokyo-holographic-halo';
    group.position.copy(TOKYO).multiplyScalar(1.08);
    group.lookAt(TOKYO.clone().multiplyScalar(2));
    group.scale.setScalar(LITE ? 0.82 : 1);

    const rings = [];
    const primaryRing = makeCircleLine('tokyo-halo-primary-ring', 0.58, 128, SCENE_COLORS.cyan, 0.36);
    if (primaryRing) { group.add(primaryRing); rings.push(primaryRing); }
    if (quality.haloRings > 1) {
      const secondaryRing = makeCircleLine('tokyo-halo-secondary-ring', 0.82, 128, SCENE_COLORS.amber, 0.18);
      if (secondaryRing) { group.add(secondaryRing); rings.push(secondaryRing); }
    }

    const ticks = makeRadialTicks('tokyo-halo-station-ticks', quality.haloTicks, 0.54, 0.62, SCENE_COLORS.softAmber, 0.42);
    if (ticks) group.add(ticks);

    const labels = [];
    const visibleLabels = TOKYO_HALO_LABELS
      .filter(label => label.priority <= (quality.name === 'high' ? 3 : 1))
      .slice(0, quality.haloLabels);
    visibleLabels.forEach(label => {
      const spritePack = makeCanvasSprite(
        'tokyo-halo-label-' + label.id,
        256,
        72,
        [1.25, 0.35, 1],
        (ctx, payload, width, height) => drawHudLabel(ctx, payload || label, width, height, label.kind === 'status' ? '#ff9e2c' : '#39f0ff')
      );
      const a = label.angle * Math.PI / 180;
      const radius = label.priority === 1 ? 0.94 : 1.08;
      spritePack.sprite.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.08);
      spritePack.sprite.userData.label = label;
      spritePack.sprite.material.opacity = 0;
      group.add(spritePack.sprite);
      labels.push(spritePack.sprite);
    });

    const packetGeo = makeGeometry('tokyo-halo-pulse-packet', new Float32Array([0, 0, 0.1]), 3);
    const packetMat = new THREE.PointsMaterial({
      color: SCENE_COLORS.softAmber,
      size: LITE ? 0.11 : 0.14,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const packet = packetGeo ? nameObject(new THREE.Points(packetGeo, packetMat), 'tokyo-halo-pulse-packet') : null;
    if (packet) group.add(packet);

    function setPacketAt(angle) {
      if (!packet || !packetGeo) return;
      const pos = packetGeo.attributes.position.array;
      const radius = quality.haloRings > 1 ? 0.82 : 0.58;
      pos[0] = Math.cos(angle) * radius;
      pos[1] = Math.sin(angle) * radius;
      pos[2] = 0.12;
      packetGeo.attributes.position.needsUpdate = true;
    }

    spin.add(group);
    return { group, rings, ticks, labels, packet, packetMat, packetGeo, setPacketAt };
  }

  const tokyoHalo = makeTokyoHalo();
```

- [ ] **Step 4: Add `updateTokyoHalo()`**

After `setFocusedPlace()`, add:

```javascript
  function updateTokyoHalo(f, pulse, focusedFacing) {
    if (!tokyoHalo) return;
    const haloStrength = sceneState.halo;
    const labelStrength = sceneState.labels;
    const pulseStrength = sceneState.haloPulse;
    tokyoHalo.group.rotation.z += 0.0018 * f * (LITE ? 0.5 : 1);
    tokyoHalo.group.visible = haloStrength > 0.02;
    tokyoHalo.rings.forEach((haloRing, i) => {
      const base = i === 0 ? 0.26 : 0.13;
      haloRing.material.opacity = focusedFacing * haloStrength * (base + pulse * 0.08 + pulseStrength * 0.14);
    });
    if (tokyoHalo.ticks) {
      tokyoHalo.ticks.material.opacity = focusedFacing * haloStrength * (0.22 + pulseStrength * 0.18);
    }
    tokyoHalo.labels.forEach((labelSprite, i) => {
      const stagger = 0.85 + i * 0.04;
      labelSprite.material.opacity = focusedFacing * labelStrength * stagger * (LITE ? 0.72 : 0.86);
    });
    if (tokyoHalo.packet && tokyoHalo.packetMat) {
      const angle = t * 4.8;
      tokyoHalo.setPacketAt(angle);
      tokyoHalo.packetMat.opacity = focusedFacing * haloStrength * Math.max(0.12, pulseStrength) * 0.85;
    }
  }
```

- [ ] **Step 5: Call `updateTokyoHalo()` in the render loop**

After:

```javascript
    const focusedFacing = Math.max(0, Math.sin(focusedAngle - spin.rotation.y));
```

add:

```javascript
    const tokyoFacing = Math.max(0, Math.sin(tokyoA0 - spin.rotation.y));
    updateTokyoHalo(f, pulse, tokyoFacing);
```

Use `tokyoFacing` rather than `focusedFacing`, because the halo is always anchored to Tokyo even when Projects focuses Dallas.

- [ ] **Step 6: Update reduced-motion branch**

In the reduced-motion branch, after:

```javascript
    tokyoRing.material.opacity = 0.7;
```

add:

```javascript
    if (tokyoHalo) {
      tokyoHalo.rings.forEach((haloRing, i) => { haloRing.material.opacity = i === 0 ? 0.28 : 0.12; });
      if (tokyoHalo.ticks) tokyoHalo.ticks.material.opacity = 0.18;
      tokyoHalo.labels.forEach(labelSprite => { labelSprite.material.opacity = 0.45; });
      if (tokyoHalo.packetMat) tokyoHalo.packetMat.opacity = 0;
    }
```

- [ ] **Step 7: Run checks**

Run:

```bash
node --check js/background.js
node tools/verify-site-hardening.js
git diff --check
```

Expected: pass.

- [ ] **Step 8: Browser-check halo**

Open `http://127.0.0.1:4173/?sceneDebug=1`.

Expected:

- Tokyo has a visible halo when facing the camera.
- Labels do not dominate the hero.
- Projects section can focus Dallas while Tokyo halo remains subdued/ambient.
- Console is clean.

- [ ] **Step 9: Commit**

Run:

```bash
git add js/background.js
git commit -m "feat: add Tokyo holographic scene halo"
```

## Task 5: Upgrade The Callout To Match The Halo Language

**Files:**
- Modify: `js/background.js`

**Interfaces:**
- Consumes: existing `callout` IIFE and `PLACES` data.
- Produces: richer bilingual/scanner-style place callout without changing `callout.draw(place)` public behavior.

- [ ] **Step 1: Replace callout canvas size and scale**

Inside the `callout` IIFE, change:

```javascript
    cv.width = 512; cv.height = 56;
```

to:

```javascript
    cv.width = 640; cv.height = 118;
```

Change:

```javascript
    sp.scale.set(3.6, 0.4, 1);
```

to:

```javascript
    sp.scale.set(3.9, 0.72, 1);
```

- [ ] **Step 2: Replace `draw(place)` body**

Replace the existing `draw(place)` body with:

```javascript
      const target = place || TOKYO_PLACE;
      const cx = cv.getContext('2d');
      cx.clearRect(0, 0, cv.width, cv.height);
      const isTokyo = target.id === 'tokyo';
      const accent = isTokyo ? '#ff9e2c' : '#ffd9a0';
      const jp = isTokyo ? '東京' : 'DALLAS';
      const status = isTokyo ? 'BASE: JST // SIGNAL ONLINE' : 'ORIGIN VECTOR // ROUTE TOKYO';
      cx.save();
      cx.strokeStyle = 'rgba(57, 240, 255, 0.42)';
      cx.lineWidth = 2;
      cx.beginPath();
      cx.moveTo(4, 24); cx.lineTo(4, 4); cx.lineTo(42, 4);
      cx.moveTo(cv.width - 42, 4); cx.lineTo(cv.width - 4, 4); cx.lineTo(cv.width - 4, 24);
      cx.moveTo(4, cv.height - 24); cx.lineTo(4, cv.height - 4); cx.lineTo(42, cv.height - 4);
      cx.moveTo(cv.width - 42, cv.height - 4); cx.lineTo(cv.width - 4, cv.height - 4); cx.lineTo(cv.width - 4, cv.height - 24);
      cx.stroke();
      cx.font = '500 32px "M PLUS Rounded 1c", "JetBrains Mono", monospace';
      cx.fillStyle = accent;
      cx.shadowColor = 'rgba(255,158,44,0.75)';
      cx.shadowBlur = 14;
      cx.fillText(jp + ' / ' + target.label, 18, 42);
      cx.shadowBlur = 0;
      cx.font = '500 15px "JetBrains Mono", monospace';
      cx.fillStyle = 'rgba(233, 241, 244, 0.82)';
      cx.fillText(status, 20, 70);
      cx.fillStyle = 'rgba(57, 240, 255, 0.78)';
      cx.fillText(target.detail, 20, 94);
      cx.fillStyle = 'rgba(255, 158, 44, 0.82)';
      for (let i = 0; i < 9; i++) {
        cx.fillRect(cv.width - 128 + i * 12, 70, i % 3 === 0 ? 7 : 3, 22);
      }
      cx.restore();
      tex.needsUpdate = true;
```

- [ ] **Step 3: Verify callout still redraws after fonts load**

Keep:

```javascript
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw());
```

Do not remove it.

- [ ] **Step 4: Run checks**

Run:

```bash
node --check js/background.js
node tools/verify-site-hardening.js
git diff --check
```

Expected: pass.

- [ ] **Step 5: Browser-check callout**

Open `http://127.0.0.1:4173/?sceneDebug=1`.

Trigger focus states:

```javascript
window.__sceneFocus('home')
window.__sceneFocus('projects')
window.__sceneFocus('contact')
```

Expected:

- Tokyo callout shows `東京 / TOKYO`.
- Dallas callout shows `DALLAS`.
- Callout is legible but not the dominant visual.
- Console is clean.

- [ ] **Step 6: Commit**

Run:

```bash
git add js/background.js
git commit -m "feat: redesign scene place callout"
```

## Task 6: Extend Static Verification

**Files:**
- Modify: `tools/verify-site-hardening.js`

**Interfaces:**
- Consumes: final `index.html`, `css/site.css`, `js/background.js`.
- Produces: static assertions that catch accidental removal of new hooks.

- [ ] **Step 1: Read CSS in the verifier**

After:

```javascript
const background = read('js/background.js');
```

add:

```javascript
const css = read('css/site.css');
```

- [ ] **Step 2: Add atmosphere checks**

After the existing debug mode check, add:

```javascript
check(
  'scene atmosphere overlay is declared and reduced-motion safe',
  /class="scene-atmosphere"[^>]*aria-hidden="true"/.test(index) &&
    /class="scene-rain"/.test(index) &&
    /class="scene-glass"/.test(index) &&
    /--scene-rain-opacity/.test(css) &&
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.scene-rain\s*\{\s*animation:\s*none;/.test(css),
  'index.html should declare decorative rain/glass layers and CSS should disable animated rain for reduced motion'
);
```

- [ ] **Step 3: Add scene state checks**

After the atmosphere check, add:

```javascript
check(
  'scene has richer cyberpunk story state',
  /const sceneState =/.test(background) &&
    /haloPulse/.test(background) &&
    /activeSection/.test(background) &&
    /route:\s*'replay'/.test(background) &&
    /sceneState\.callout/.test(background),
  'background.js should expose section, halo, rain, labels, and callout state for the upgraded scene'
);
```

- [ ] **Step 4: Add Tokyo halo checks**

After the scene state check, add:

```javascript
check(
  'scene defines Tokyo holographic halo assets',
  /const TOKYO_HALO_LABELS =/.test(background) &&
    /jp:\s*'東京'/.test(background) &&
    /makeTokyoHalo/.test(background) &&
    /tokyo-holographic-halo/.test(background) &&
    /tokyo-halo-pulse-packet/.test(background),
  'background.js should define local Tokyo labels, halo geometry, and a pulse packet'
);
```

- [ ] **Step 5: Add debug payload checks**

After the Tokyo halo check, add:

```javascript
check(
  'scene debug exposes cyberpunk atmosphere state',
  /activeSection/.test(background) &&
    /halo:\s*Number/.test(background) &&
    /rain:\s*Number/.test(background) &&
    /labels:\s*Number/.test(background) &&
    /callout:\s*Number/.test(background),
  'window.__sceneDebug should include active section and atmosphere state when sceneDebug=1'
);
```

- [ ] **Step 6: Run checks**

Run:

```bash
node --check tools/verify-site-hardening.js
node tools/verify-site-hardening.js
git diff --check
```

Expected: all checks pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add tools/verify-site-hardening.js
git commit -m "test: verify cyberpunk scene hooks"
```

## Task 7: Final Browser Verification And Tuning

**Files:**
- Modify only if tuning is required:
  - `css/site.css`
  - `js/background.js`
  - `index.html`

**Interfaces:**
- Consumes: implemented tasks 1-6.
- Produces: visually verified, tuned scene.

- [ ] **Step 1: Run full static verification**

Run:

```bash
node tools/verify-site-hardening.js
node --check js/background.js
node --check js/app.js
node --check js/effects.js
node --check tools/verify-site-hardening.js
node --check js/vendor/three.global.min.js
git diff --check
```

Expected: all pass.

- [ ] **Step 2: Browser-check local server**

Serve:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:4173/?sceneDebug=1
```

Expected:

- One WebGL canvas.
- No console errors or Three.js warnings.
- Debug overlay includes `section=home`, a numeric `halo=` value, and a numeric `rain=` value.
- Hero text remains readable.
- Rain/glass reads as atmosphere, not heavy weather.
- Tokyo halo appears when Tokyo faces the camera.

- [ ] **Step 3: Browser-check direct file open**

Open:

```text
file:///Users/daikieishinuki/.codex/worktrees/db6c/Personal%20Website/index.html?sceneDebug=1
```

Expected:

- Same rendering behavior as local server.
- No module/CORS/fetch errors.
- Console is clean.

- [ ] **Step 4: Check section story behavior**

In browser console, run:

```javascript
window.__sceneFocus('home')
window.__sceneDebug()
window.__sceneFocus('about')
window.__sceneFocus('work')
window.__sceneFocus('gallery')
window.__sceneFocus('projects')
window.__sceneFocus('contact')
window.__sceneDebug()
```

Expected:

- Home/contact focus Tokyo.
- About briefly focuses Dallas then Tokyo.
- Projects focuses Dallas.
- Gallery lowers callout/halo intensity.
- Debug active section updates.
- No visual strobing.

- [ ] **Step 5: Check reduced motion**

Use browser emulation or OS/browser devtools to enable `prefers-reduced-motion: reduce`, then reload:

```text
http://127.0.0.1:4173/?sceneDebug=1
```

Expected:

- Scene renders one meaningful static frame.
- Dallas-to-Tokyo arc is visible.
- Rain animation is disabled.
- Halo is static/subtle.
- Console is clean.

- [ ] **Step 6: Check mobile/LITE**

Use a mobile viewport near `390x844`.

Expected:

- Canvas is nonblank.
- Halo has no more than two visible labels.
- Rain is weaker than desktop.
- Nav and hero text do not overlap.
- Scene does not crowd the mobile layout.

- [ ] **Step 7: Tune only if needed**

Allowed tuning changes:

```css
--scene-rain-opacity
--scene-glass-opacity
--scene-rain-speed
```

Allowed JavaScript tuning:

```javascript
quality.haloLabels
quality.haloTicks
quality.rain
quality.glass
sceneState story halo/rain/labels/callout values
tokyoHalo label sprite scale
tokyoHalo group scale
```

Do not tune by adding new systems. If the concept still feels weak after this pass, stop and ask whether to move to true post-processing or a second planned slice.

- [ ] **Step 8: Commit tuning**

If tuning changed files, run:

```bash
git add index.html css/site.css js/background.js tools/verify-site-hardening.js
git commit -m "chore: tune cyberpunk scene atmosphere"
```

If no tuning changed files, do not create an empty commit.

## Task 8: Final Handoff Summary

**Files:**
- Read only unless documentation was changed:
  - `docs/superpowers/specs/2026-07-01-cyberpunk-threejs-future-work.md`
  - `docs/superpowers/plans/2026-07-01-cyberpunk-threejs-claude-execution.md`

**Interfaces:**
- Consumes: completed commits and verification evidence.
- Produces: final human-readable summary.

- [ ] **Step 1: Check final git state**

Run:

```bash
git status --short --branch
git log --oneline --decorate -8
```

Expected:

- Branch is still `codex/earth-scene-quality`.
- Runtime files are clean or only expected docs remain untracked if they were not committed.
- New commits correspond to the tasks above.

- [ ] **Step 2: Record verification commands in final response**

Final response must include:

- Static commands run.
- Browser targets checked.
- Any screenshots captured.
- Any tuning decisions.
- Any risks left open.

- [ ] **Step 3: Explicitly mention non-goals**

Final response must mention:

- No live data was added.
- No true post-processing was added.
- No new dependencies were added.
- `file://` support was checked.

## Stop Conditions

Stop and ask the user instead of continuing if any of these occur:

- `window.THREE` fails to load.
- Direct `file://` rendering breaks.
- Browser console shows Three.js geometry warnings after the change.
- Mobile viewport becomes unreadable or nonblank checks fail.
- Reduced motion cannot render a meaningful static frame.
- The user has uncommitted runtime changes that conflict with the planned edits.
- Implementing the desired look appears to require `EffectComposer`, external assets, or a build step.

## Future Slice After This Plan

After this first execution slice is verified, the next separate plan can cover one of these:

1. True Three.js post-processing with vendored examples, if the no-dependency glow is not strong enough.
2. Transit-map geometry around Tokyo with abstract line routes and station ticks.
3. Night-side earth and sparse city-light accents.
4. A standalone `tokyo-data-globe` sync if the scene should evolve outside the portfolio again.

Do not start these in this plan.
