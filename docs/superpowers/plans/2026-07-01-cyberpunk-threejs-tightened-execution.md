# Cyberpunk Three.js Tightened Slice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the council-hardened cyberpunk first slice — a clean editorial foreground over a deep, wet, *living* Tokyo signal-scape — fixing every council-found defect and adding the wet-neon glow + Tokyo signal-lock.

**Architecture:** Static no-build site. Runtime stays in `js/background.js` (one IIFE), atmosphere in `css/site.css`, one decorative DOM root in `index.html`, static verifier in `tools/verify-site-hardening.js`. No new dependencies, no build step, `file://` must keep working.

**Tech Stack:** Static HTML/CSS/vanilla JS; vendored global Three.js r158 (`js/vendor/three.global.min.js`); WebGL `Points`/`LineSegments`/`Line`/`Mesh`(`RingGeometry`)/`Sprite`/`CanvasTexture`; CSS `transform`/`@keyframes`; manual browser verification.

## Required Reading (every implementer opens these)

1. **Design of record:** `docs/superpowers/specs/2026-07-01-cyberpunk-threejs-tightened-slice-design.md` — the ratified spec. Its Acceptance Criteria are the definition of done.
2. **Base code source:** `docs/superpowers/plans/2026-07-01-cyberpunk-threejs-claude-execution.md` — the ORIGINAL plan. Reused scaffolding (quality-profile object shape, `sceneState`/`sectionStories` shapes, sprite skeleton, `makeCircleLine`/`makeRadialTicks`, callout structure, verifier pattern) is taken verbatim from the named task/step there. This plan gives the **deltas** on top, with complete code for everything new or changed.
3. **Current runtime:** `js/background.js`, `css/site.css`, `index.html` (the rain/glass overlay commit `2d4c9a6` is already present and is revised by Task 1).

## Global Constraints (bind every task; exact values from the spec)

- Static no-build: NO npm deps, NO CDNs, NO ES module scripts, NO fetch/network assets. Must work from `file://` AND a static server.
- NO new Three.js dependencies. True post-processing (EffectComposer/UnrealBloomPass) is a later escape hatch — do NOT build it here.
- `.scene-atmosphere` stays decorative, `aria-hidden="true"`, no text content, `pointer-events: none`.
- Atmosphere must NOT tint content: `.scene-atmosphere` renders above the globe canvas but BELOW `main` (hero name + gallery photos stay pristine).
- Rain must VISIBLY FALL (confirmed in a real browser — static checks cannot see motion). Achieved via `transform: translateY()` on a vertically-structured gradient, never `background-position` on a `90deg` gradient.
- No per-frame `:root`/inline style writes; atmosphere opacity changes only when its rounded value changes. No per-frame large-buffer rebuilds. Per-frame work = transforms, uniforms, opacity, draw ranges only.
- Japanese glyphs must never render as tofu: every `CanvasTexture` text sprite redraws on `document.fonts.ready`.
- Palette: void `#05060a`; neon cyan `#39f0ff`; deep cyan `#1c6f7a`; amber `#ff9e2c`; soft amber `#ffd9a0`; alert red `#ff3b5c` (tiny accents only); terminal green `#8dffb3` (tiny only); glass white `rgba(233,241,244,0.08)`.
- Rain base opacity ~0.17 desktop-high, ~0.11 LITE, 0 reduced-motion. Glass base ~0.16 high, ~0.10 LITE, ~0.12 reduced.
- Reduced motion: meaningful static frame — earth + Dallas→Tokyo arc + static Tokyo ring/glow + rendered labels; NO rain motion, NO packet, NO spinner.
- LITE (coarse pointer / ≤760px): Tokyo + 1–2 status labels only, sparser rain.
- Preserve the generated Three global vendor build; do NOT reintroduce deprecated `three.min.js`.
- Do NOT modify `Ishinuki Daikie v1 (backup).html`.
- Commit after each task with the exact message given.

---

## Task 1: Rain rebuild + layering + var ownership + CRT-toggle wiring

**Files:**
- Modify: `css/site.css`
- Modify: `index.html` (bump `css/site.css?v=` query; wire scan-toggle attribute if needed)

**Interfaces:**
- Consumes: existing `.scene-atmosphere`, `.scene-rain`, `.scene-glass` from commit `2d4c9a6`; the existing control-deck "scan"/CRT toggle.
- Produces: CSS custom properties `--scene-rain-base`, `--scene-glass-base`, `--scene-rain-mul` (JS writes only `--scene-rain-mul`, Task 2); a genuinely falling rain layer below `main`; atmosphere gated by the scan toggle.

- [ ] **Step 1: Find the current z-index stack and the scan toggle mechanism**

Run:
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website"
grep -nE 'z-index|#scene-root|\.scene-atmosphere|\.scene-rain|\.scene-glass|\.crt|\.frame-hud|main[ ,{]' css/site.css
grep -nE 'data-switch|scan|crt|classList|setAttribute' js/effects.js index.html
```
Expected: shows `.scene-atmosphere { … z-index: 86 }`, `main { … z-index: 1 }`, the `#scene-root` z-index, and how the "scan" control toggles the CRT (a class or `data-*` attribute on a root element). Record the scan-toggle mechanism — Step 6 mirrors it.

- [ ] **Step 2: Re-own the atmosphere variables in `:root` and media queries**

In `css/site.css`, replace the four atmosphere variables added in `2d4c9a6` (`--scene-rain-opacity`, `--scene-glass-opacity`, `--scene-rain-speed`, `--scene-rain-slant`) inside `:root` with:
```css
  --scene-rain-base: 0.17;
  --scene-glass-base: 0.16;
  --scene-rain-mul: 1;      /* JS (Task 2) sets this per section; CSS owns the base */
```
In the existing `@media (hover: none), (pointer: coarse)` block, replace the old overrides with:
```css
    --scene-rain-base: 0.11;
    --scene-glass-base: 0.10;
```
In the existing `@media (prefers-reduced-motion: reduce)` block, replace the old overrides with:
```css
    --scene-rain-base: 0;
    --scene-glass-base: 0.12;
```
(These `@media` rules now stay authoritative because JS no longer writes `--scene-rain-base`/`--scene-glass-base` as inline properties — it only writes `--scene-rain-mul`.)

- [ ] **Step 3: Lower `.scene-atmosphere` beneath content**

In `css/site.css`, change `.scene-atmosphere`'s `z-index: 86;` to `z-index: 0;`. Keep `position: fixed; inset: 0; pointer-events: none; overflow: hidden;`. Verify against Step 1's stack that `#scene-root` is `z-index: 0` (or lower) so the atmosphere — later in DOM — paints above the globe canvas, and that `main` (`z-index: 1`) paints above the atmosphere. If `#scene-root` is higher than 0, set `.scene-atmosphere` to one above `#scene-root` but strictly below `main`.

- [ ] **Step 4: Replace the rain and glass rules with a genuinely-falling design**

In `css/site.css`, replace the entire `.scene-rain { … }`, `.scene-glass { … }`, and `@keyframes sceneRainFall { … }` blocks from `2d4c9a6` with:
```css
.scene-rain {
  position: absolute;
  inset: -20% -10%;
  overflow: hidden;
  opacity: calc(var(--scene-rain-base) * var(--scene-rain-mul, 1));
  mix-blend-mode: screen;
}
.scene-rain::before,
.scene-rain::after {
  content: "";
  position: absolute;
  left: 0; right: 0; top: -120%; height: 260%;
  background-repeat: repeat;
  will-change: transform;
}
.scene-rain::before {           /* cyan near-field streaks */
  background-image: repeating-linear-gradient(180deg,
    rgba(57, 240, 255, 0) 0, rgba(57, 240, 255, 0) 42px,
    rgba(57, 240, 255, 0.55) 58px, rgba(57, 240, 255, 0) 96px);
  background-size: 3px 96px;     /* thin columns; dash cycle = 96px */
  transform: rotate(-8deg) translateY(0);
  animation: sceneRainFall 2.2s linear infinite;
  filter: blur(0.6px);
}
.scene-rain::after {            /* sparser amber far-field streaks */
  background-image: repeating-linear-gradient(180deg,
    rgba(255, 158, 44, 0) 0, rgba(255, 158, 44, 0) 120px,
    rgba(255, 158, 44, 0.35) 150px, rgba(255, 158, 44, 0) 210px);
  background-size: 5px 210px;
  transform: rotate(-8deg) translateY(0);
  animation: sceneRainFall2 3.6s linear infinite;
  filter: blur(0.9px);
}
.scene-glass {
  position: absolute;
  inset: -12%;
  opacity: var(--scene-glass-base);
  background:
    linear-gradient(105deg, transparent 0 42%, rgba(233, 241, 244, 0.07) 46%, transparent 52%),
    radial-gradient(circle at 74% 34%, rgba(57, 240, 255, 0.12), transparent 30%),
    radial-gradient(circle at 18% 76%, rgba(255, 158, 44, 0.10), transparent 28%);
}
@keyframes sceneRainFall {   /* one dash cycle (96px) → seamless loop; visible because gradient varies along Y */
  from { transform: rotate(-8deg) translateY(0); }
  to   { transform: rotate(-8deg) translateY(96px); }
}
@keyframes sceneRainFall2 {
  from { transform: rotate(-8deg) translateY(0); }
  to   { transform: rotate(-8deg) translateY(210px); }
}
```
Why this moves (the `2d4c9a6` bug): the streaks are now `180deg` gradients (vary along **Y**) and are translated along **Y**, so the dashes visibly fall; translating by exactly one dash cycle keeps the loop seamless. The old `filter: blur(0.2px)` on glass is removed (imperceptible, forced a raster layer).

- [ ] **Step 5: Disable rain animation under reduced motion**

In `css/site.css`, in the existing `@media (prefers-reduced-motion: reduce)` block, add:
```css
  .scene-rain::before,
  .scene-rain::after { animation: none; }
```

- [ ] **Step 6: Gate the atmosphere on the existing scan/CRT toggle**

Using the mechanism found in Step 1 (assume the CRT is gated by an attribute/class on a root element, e.g. `html[data-scan="off"] .crt { … }` or a `body.no-scan` class), add a sibling rule so turning scanlines off also calms the atmosphere. Example (adapt selector to the real mechanism):
```css
/* when the user turns Scanlines/CRT off, drop the neo-noir atmosphere too */
:root[data-scan="off"] .scene-atmosphere,
body.scan-off .scene-atmosphere { opacity: 0; }
```
If the scan toggle sets a CSS variable rather than a class/attribute, instead multiply that variable into `.scene-atmosphere`'s `opacity`. Do not add new user-facing controls.

- [ ] **Step 7: Bump the stylesheet cache query**

In `index.html`, change `css/site.css?v=3.4` to `css/site.css?v=3.5`. Do NOT change JS version strings in this task.

- [ ] **Step 8: Static checks**

Run:
```bash
node tools/verify-site-hardening.js
git diff --check
```
Expected: `verify-site-hardening.js` still passes (not yet updated for new assertions); no whitespace errors.

- [ ] **Step 9: Commit**

```bash
git add css/site.css index.html
git commit -m "fix: rebuild rain as falling streaks, seat atmosphere behind content, own vars in CSS"
```

---

## Task 2: Quality budgets + scene state + event-driven rain multiplier + cooldown

**Files:**
- Modify: `js/background.js`
- Modify: `index.html` (bump `js/background.js?v=`)

**Interfaces:**
- Consumes: `getQualityProfile()`, `quality`, `sectionStories`, `window.__sceneFocus`, `replayJourney`, `setFocusedPlace`, `storyTimer`, `getSceneDebug`, `updateDebugText`, the `loop(now)` body with `const f = dt * 60;`.
- Produces: `SCENE_COLORS`; halo budgets on `quality`; `sectionStories` + `sceneState` (with `haloPulse`, `lockT`); `setRainMultiplier(v)`; a cooldown-guarded `window.__sceneFocus`; debug fields `activeSection/halo/rain/labels/callout/lockT`.

- [ ] **Step 1: Extend `getQualityProfile()` with halo budgets (rain/glass now live in CSS)**

Use the exact `reduced`/`lite`/`high` objects from the ORIGINAL plan Task 2 Step 1, but REMOVE the `rain` and `glass` keys (CSS owns those now) and KEEP `haloLabels`/`haloTicks`/`haloRings`. Values unchanged: reduced `{haloLabels:1,haloTicks:8,haloRings:1}`, lite `{haloLabels:2,haloTicks:12,haloRings:1}`, high `{haloLabels:5,haloTicks:24,haloRings:2}` (plus the existing `dpr`/`globeParticles`/`fieldCounts`/`streaks`).

- [ ] **Step 2: Add `SCENE_COLORS`**

After `const quality = getQualityProfile();` add the exact `SCENE_COLORS` block from ORIGINAL plan Task 2 Step 2 (`cyan/amber/softAmber:0xffd9a0/alert:0xff3b5c/terminal:0x8dffb3`).

- [ ] **Step 3: Add the event-driven rain-multiplier writer (replaces per-frame `setAtmosphereVars`)**

After renderer/debug setup, add:
```javascript
  let _rainMulWritten = -1;
  function setRainMultiplier(v) {
    const next = Math.max(0, Math.round((v == null ? 1 : v) * 100) / 100); // 2-dp quantized
    if (next === _rainMulWritten) return;                                  // no per-frame writes
    _rainMulWritten = next;
    document.documentElement.style.setProperty('--scene-rain-mul', String(next));
  }
  setRainMultiplier(1);
```
Do NOT port the original `setAtmosphereVars` (it wrote base opacity every frame and clobbered the CSS `@media` fallbacks). Only `--scene-rain-mul` is written, and only when its 2-dp value changes.

- [ ] **Step 4: Replace `sectionStories` and add `sceneState`**

Use the exact `sectionStories` object from ORIGINAL plan "Section Story Shape". Then add `sceneState` from ORIGINAL plan "Scene State Shape" with two extra fields:
```javascript
  const sceneState = {
    section: 'home', story: sectionStories.home,
    halo: sectionStories.home.halo, rain: sectionStories.home.rain,
    labels: sectionStories.home.labels, callout: sectionStories.home.callout,
    camera: sectionStories.home.camera,
    haloPulse: 0,
    lockT: 0,          // signal-lock timer (1 → 0), drives Task 4 ring sweep + glow bloom
  };
```

- [ ] **Step 5: Rewrite `window.__sceneFocus` with a cooldown + signal-lock trigger**

Replace the full current `window.__sceneFocus = …` block with:
```javascript
  let storyCooldown = 0;                       // seconds; mirrors the effects.js ping guard
  window.__sceneFocus = sectionId => {
    const story = sectionStories[sectionId] || sectionStories.home;
    const id = sectionStories[sectionId] ? sectionId : 'home';
    const sameSection = id === sceneState.section;
    sceneState.section = id;
    sceneState.story = story;                  // target always updates (interpolation continues)
    if (sameSection || storyCooldown > 0) {     // guard re-arming replay/pulse on scroll jitter
      setRainMultiplier(story.rain);
      return;
    }
    storyCooldown = 0.6;
    sceneState.haloPulse = Math.max(sceneState.haloPulse, story.intensity || 1);
    if (id === 'home' || id === 'contact') sceneState.lockT = 1;   // signal-lock beat
    setRainMultiplier(story.rain);
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

In `getSceneDebug()` add (as ORIGINAL plan Task 2 Step 6): `activeSection: sceneState.section`, `halo/rain/labels/callout: Number(sceneState.X.toFixed(3))`, and also `lockT: Number(sceneState.lockT.toFixed(3))`. In `updateDebugText()` add `'section=' + d.activeSection`, `'halo=' + d.halo`, `'rain=' + d.rain` before `focus=`.

- [ ] **Step 7: Interpolate state + tick cooldown/lock + drive the multiplier in `loop(now)`**

After `const f = dt * 60;` add:
```javascript
    if (storyCooldown > 0) storyCooldown = Math.max(0, storyCooldown - dt);
    if (sceneState.lockT > 0) sceneState.lockT = Math.max(0, sceneState.lockT - dt * 0.9);
    sceneState.halo    += (sceneState.story.halo    - sceneState.halo)    * Math.min(1, 0.08 * f);
    sceneState.rain    += (sceneState.story.rain    - sceneState.rain)    * Math.min(1, 0.08 * f);
    sceneState.labels  += (sceneState.story.labels  - sceneState.labels)  * Math.min(1, 0.08 * f);
    sceneState.callout += (sceneState.story.callout - sceneState.callout) * Math.min(1, 0.08 * f);
    sceneState.camera  += (sceneState.story.camera  - sceneState.camera)  * Math.min(1, 0.06 * f);
    if (sceneState.haloPulse > 0.01) sceneState.haloPulse *= Math.pow(0.92, f); else sceneState.haloPulse = 0;
    setRainMultiplier(sceneState.rain);   // writes only when the 2-dp value changes
```
(The `0.08 * f` smoothing is correct and frame-rate-independent — keep it.)

- [ ] **Step 8: Apply story callout intensity + camera bias**

Exactly as ORIGINAL plan Task 2 Steps 8–9: multiply `callout.sprite.material.opacity` by `sceneState.callout`, and add `+ sceneState.camera` inside the `camera.position.y +=` expression.

- [ ] **Step 9: Bump `background.js` cache query**

In `index.html`, change `js/background.js?v=3.4` to `js/background.js?v=3.5`.

- [ ] **Step 10: Checks + commit**

```bash
node --check js/background.js
node tools/verify-site-hardening.js
git diff --check
git add js/background.js index.html
git commit -m "feat: section story state with event-driven rain multiplier, cooldown, and signal-lock trigger"
```

---

## Task 3: Canvas sprite helpers with font-load safety

**Files:**
- Modify: `js/background.js`

**Interfaces:**
- Consumes: `THREE.CanvasTexture/Sprite/SpriteMaterial`, `nameObject`, `document.fonts`.
- Produces: `makeCanvasSprite(name,w,h,scale,drawFn)` that re-renders on `document.fonts.ready`; `drawHudLabel(ctx,label,w,h,accent,variant)` with `'primary'` and `'district'` variants.

- [ ] **Step 1: Add `makeCanvasSprite` with a fonts-ready redraw**

Use the `makeCanvasSprite` from ORIGINAL plan Task 3 Step 1, but capture the last payload and register a fonts-ready redraw so Japanese glyphs never bake as tofu. The factory's `redraw` and the fonts hook:
```javascript
    let _payload;
    function redraw(payload) {
      _payload = payload;
      ctx.clearRect(0, 0, width, height);
      drawFn(ctx, payload, width, height);
      tex.needsUpdate = true;
    }
    redraw();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => redraw(_payload));
    }
```
(Everything else about the factory — canvas, `CanvasTexture`, the `Sprite`/`SpriteMaterial` with additive blending, `scale`, and the returned `{sprite, redraw, texture, canvas}` — stays as in the original.)

- [ ] **Step 2: Add `drawHudLabel` with primary/district variants**

Add `drawHudLabel(ctx, label, width, height, accent, variant)`. For `variant === 'primary'`: the full bracket-corners + JP + EN + barcode treatment from ORIGINAL plan Task 3 Step 1's `drawHudLabel`. For `variant === 'district'` (default for halo district labels): NO brackets, NO barcode — just the JP glyph and a single 2px tick:
```javascript
  function drawHudLabel(ctx, label, width, height, accent, variant) {
    const color = accent || '#39f0ff';
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    if (variant === 'primary') {
      ctx.strokeStyle = 'rgba(57,240,255,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2,18); ctx.lineTo(2,2); ctx.lineTo(28,2);
      ctx.moveTo(width-28,2); ctx.lineTo(width-2,2); ctx.lineTo(width-2,18);
      ctx.moveTo(2,height-18); ctx.lineTo(2,height-2); ctx.lineTo(28,height-2);
      ctx.moveTo(width-28,height-2); ctx.lineTo(width-2,height-2); ctx.lineTo(width-2,height-18);
      ctx.stroke();
    }
    ctx.font = '500 28px "M PLUS Rounded 1c", "JetBrains Mono", monospace';
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.fillText(label.jp || label.en, 16, 34);
    ctx.shadowBlur = 0;
    if (variant === 'primary') {
      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(233,241,244,0.78)';
      ctx.fillText(label.en || '', 18, 54);
      ctx.fillStyle = 'rgba(255,158,44,0.78)';
      ctx.fillRect(width-58, height-18, 34, 2);
      ctx.fillRect(width-18, height-18, 8, 2);
    } else {                                  /* district: one quiet tick */
      ctx.fillStyle = color; ctx.globalAlpha = 0.7;
      ctx.fillRect(16, 44, 22, 2);
    }
    ctx.restore();
  }
```

- [ ] **Step 3: Checks + commit**

```bash
node --check js/background.js
node tools/verify-site-hardening.js
git diff --check
git add js/background.js
git commit -m "feat: font-safe canvas sprite helper with primary/district label variants"
```

---

## Task 4: Tokyo halo — emissive glow, ring mesh, stable facing-gated labels, event packet, signal-lock

**Files:**
- Modify: `js/background.js`

**Interfaces:**
- Consumes: `TOKYO`, `R`, `quality`, `SCENE_COLORS`, `makeGeometry`, `nameObject`, `makeCanvasSprite`, `drawHudLabel`, `spin`, `t`, `tokyoA0`, `sceneState`, `setFocusedPlace`, the reduced-motion branch, `loop(now)`.
- Produces: `TOKYO_HALO_LABELS`; `makeGlowSprite`; `makeCircleLine`/`makeRadialTicks`; `makeTokyoHalo()` returning `{group, spinGroup, staticGroup, rings, ticks, glow, labels, packet, packetMat, packetGeo, setPacketAt}`; `updateTokyoHalo(f, focusedFacing, tokyoFacing)`.

- [ ] **Step 1: Add `TOKYO_HALO_LABELS`**

After `const placeVector = …`, add the exact `TOKYO_HALO_LABELS` array from ORIGINAL plan "Data Contracts" (tokyo/jst/shibuya/shinjuku/akihabara with `jp/en/angle/priority/kind`).

- [ ] **Step 2: Add geometry + glow helpers**

Before `function tangentRing(…)`, add `makeCircleLine` and `makeRadialTicks` exactly as ORIGINAL plan Task 4 Step 2. Then add an additive amber glow sprite helper (the wet-neon lever):
```javascript
  function makeGlowSprite(name, size, colorStops) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    (colorStops || [[0,'rgba(255,180,90,0.9)'],[0.4,'rgba(255,158,44,0.35)'],[1,'rgba(255,158,44,0)']])
      .forEach(function (s) { grd.addColorStop(s[0], s[1]); });
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(cv);
    const sp = nameObject(new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    })), name);
    sp.scale.set(size, size, 1);
    return sp;
  }
```

- [ ] **Step 3: Build the halo with a spinning ring/tick sub-group and a STATIC label sub-group**

After `pingRing` is created, add `makeTokyoHalo()`. Base it on ORIGINAL plan Task 4 Step 3 (group placement/lookAt/scale), with these REQUIRED changes:
- Create two child groups and add both to `group`: `const spinGroup = new THREE.Group();` (rings + ticks + packet — rotates) and `const staticGroup = new THREE.Group();` (glow + labels — never rotates).
- Primary ring is a **`RingGeometry` mesh** (emissive), not a 1px `LineLoop`:
```javascript
    const rings = [];
    const ringMat = new THREE.MeshBasicMaterial({ color: SCENE_COLORS.cyan, transparent: true,
      opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const primaryRing = nameObject(new THREE.Mesh(new THREE.RingGeometry(0.56, 0.60, 96), ringMat), 'tokyo-halo-primary-ring');
    spinGroup.add(primaryRing); rings.push(primaryRing);
    if (quality.haloRings > 1) {
      const secondary = makeCircleLine('tokyo-halo-secondary-ring', 0.82, 128, SCENE_COLORS.amber, 0.18);
      if (secondary) { spinGroup.add(secondary); rings.push(secondary); }
    }
```
- Ticks via `makeRadialTicks('tokyo-halo-station-ticks', quality.haloTicks, 0.54, 0.62, SCENE_COLORS.softAmber, 0.42)` → `spinGroup`.
- Glow behind the node: `const glow = makeGlowSprite('tokyo-halo-glow', LITE ? 0.9 : 1.15); glow.position.set(0,0,-0.02); staticGroup.add(glow);`
- Labels into **`staticGroup`** (never orbit), using the priority filter/slice from the ORIGINAL plan, each drawn with the variant + accent:
```javascript
    const labels = [];
    TOKYO_HALO_LABELS
      .filter(l => l.priority <= (quality.name === 'high' ? 3 : 1))
      .slice(0, quality.haloLabels)
      .forEach(label => {
        const pack = makeCanvasSprite('tokyo-halo-label-' + label.id, 256, 72, [1.25, 0.35, 1],
          (ctx, p, w, h) => drawHudLabel(ctx, p || label, w, h,
            label.kind === 'status' ? '#ff9e2c' : '#39f0ff',
            label.priority === 1 ? 'primary' : 'district'));
        const a = label.angle * Math.PI / 180;
        const radius = label.priority === 1 ? 0.94 : 1.08;
        pack.sprite.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.08);
        pack.sprite.userData.label = label;
        pack.sprite.material.opacity = 0;
        staticGroup.add(pack.sprite);
        labels.push(pack.sprite);
      });
```
- Packet (Points) into `spinGroup`, plus `setPacketAt(angle)` — as ORIGINAL plan Task 4 Step 3.
- `group.add(spinGroup); group.add(staticGroup); spin.add(group);`
- Return `{ group, spinGroup, staticGroup, rings, ticks, glow, labels, packet, packetMat, packetGeo, setPacketAt };` and `const tokyoHalo = makeTokyoHalo();`.

- [ ] **Step 4: Add `updateTokyoHalo` with per-label facing gate, event packet, glow bloom, signal-lock sweep**

After `setFocusedPlace()`, add:
```javascript
  function updateTokyoHalo(f, focusedFacing, tokyoFacing) {
    if (!tokyoHalo) return;
    const halo = sceneState.halo, lab = sceneState.labels;
    const pulse = sceneState.haloPulse, lock = sceneState.lockT;
    // spin ONLY rings/ticks/packet; a faster sweep during the signal-lock
    tokyoHalo.spinGroup.rotation.z += 0.0016 * f * (LITE ? 0.5 : 1) + lock * 0.02 * f;
    tokyoHalo.group.visible = halo > 0.02;
    tokyoHalo.rings.forEach((r, i) => {                       // ring keeps a small floor so the hub reads as "there"
      const base = i === 0 ? 0.24 : 0.12;
      r.material.opacity = (0.10 + tokyoFacing * 0.9) * halo * (base + pulse * 0.10 + lock * 0.25);
    });
    if (tokyoHalo.ticks) tokyoHalo.ticks.material.opacity = tokyoFacing * halo * (0.20 + pulse * 0.18);
    if (tokyoHalo.glow) tokyoHalo.glow.material.opacity = (0.10 + tokyoFacing * 0.5) * halo * (0.4 + pulse * 0.8 + lock * 1.0);
    tokyoHalo.labels.forEach(sp => {                          // per-label facing gate: only 1–2 read at once
      const a = (sp.userData.label.angle || 0) * Math.PI / 180;
      const lf = Math.max(0, Math.cos(a - spin.rotation.y + tokyoA0));
      sp.material.opacity = tokyoFacing * lab * lf * lf * (LITE ? 0.72 : 0.9);
    });
    if (tokyoHalo.packet && tokyoHalo.packetMat) {            // packet is event-gated, never a perpetual orbit
      tokyoHalo.setPacketAt(t * 4.8);
      const p = Math.max(pulse, lock);
      tokyoHalo.packet.visible = p > 0.03;
      tokyoHalo.packetMat.opacity = tokyoFacing * halo * p * 0.9;
    }
  }
```
Note: `tokyoA0` is the Tokyo base longitude angle already used to derive `tokyoFacing` in the render loop — reuse the same expression. The label-facing term uses each label's OWN `angle`, so labels light one/two at a time as they rotate toward the camera.

- [ ] **Step 5: Call it in the render loop**

After `const focusedFacing = Math.max(0, Math.sin(focusedAngle - spin.rotation.y));`, add:
```javascript
    const tokyoFacing = Math.max(0, Math.sin(tokyoA0 - spin.rotation.y));
    updateTokyoHalo(f, focusedFacing, tokyoFacing);
```
Use `tokyoFacing` (not `focusedFacing`) — the halo is anchored to Tokyo even when Projects focuses Dallas.

- [ ] **Step 6: Reduced-motion static frame**

In the reduced-motion branch, after `tokyoRing.material.opacity = 0.7;`, add a static, spinner-free halo frame (glow steady, labels rendered, no packet):
```javascript
    if (tokyoHalo) {
      tokyoHalo.rings.forEach((r, i) => { r.material.opacity = i === 0 ? 0.3 : 0.12; });
      if (tokyoHalo.ticks) tokyoHalo.ticks.material.opacity = 0.18;
      if (tokyoHalo.glow) tokyoHalo.glow.material.opacity = 0.4;
      tokyoHalo.labels.forEach(sp => { sp.material.opacity = 0.5; });
      if (tokyoHalo.packetMat) tokyoHalo.packetMat.opacity = 0;
    }
```

- [ ] **Step 7: Checks + commit**

```bash
node --check js/background.js
node tools/verify-site-hardening.js
git diff --check
git add js/background.js
git commit -m "feat: emissive Tokyo halo with glow, stable facing-gated labels, event packet, signal-lock"
```

---

## Task 5: Callout — fix DALLAS/DALLAS, live JST, keep it the one dense HUD element

**Files:**
- Modify: `js/background.js`

**Interfaces:**
- Consumes: the `callout` IIFE and `draw(place)`; `PLACES`/`TOKYO_PLACE`; the existing JST clock in the page (find it).
- Produces: a correct bilingual heading and a live JST status line.

- [ ] **Step 1: Locate any existing JST clock**

Run:
```bash
grep -nE "JST|Asia/Tokyo|toLocaleTimeString|timeZone|clock" js/effects.js js/app.js js/background.js index.html
```
Record how Tokyo local time is produced. Step 3 reuses it, or computes JST inline if none exists.

- [ ] **Step 2: Enlarge callout canvas/scale**

Apply ORIGINAL plan Task 5 Step 1 (`cv.width=640; cv.height=118;` and `sp.scale.set(3.9,0.72,1);`).

- [ ] **Step 3: Replace `draw(place)` — fix the heading + inject live JST**

Use ORIGINAL plan Task 5 Step 2's `draw(place)` body, with these REQUIRED changes:
- Fix the heading (the `DALLAS / DALLAS` bug) — replace the `jp`/`fillText(jp + ' / ' + target.label…)` lines with:
```javascript
      const heading = isTokyo ? '東京 / ' + target.label : target.label;
      // …where the original drew the heading:
      cx.fillText(heading, 18, 42);
```
- Make the Tokyo status line live:
```javascript
      const jst = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' });
      const status = isTokyo ? ('BASE: JST ' + jst + ' // SIGNAL ONLINE') : 'ORIGIN VECTOR // ROUTE TOKYO';
```
Keep the bracket-corners + barcode ticks — this single primary callout is the one place the dense HUD language belongs. Keep `if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw());`.

- [ ] **Step 4: Do NOT add a per-second timer**

JST to the minute, refreshed on focus/redraw, is sufficient. Do not tick a clock in the render loop.

- [ ] **Step 5: Checks + commit**

```bash
node --check js/background.js
node tools/verify-site-hardening.js
git diff --check
git add js/background.js
git commit -m "fix: correct bilingual callout heading and show live JST"
```

---

## Task 6: Extend static verification

**Files:**
- Modify: `tools/verify-site-hardening.js`

**Interfaces:**
- Consumes: final `index.html`, `css/site.css`, `js/background.js`.
- Produces: assertions that catch regressions of the tightening (some acceptance criteria are browser-only and are checked in Task 7).

- [ ] **Step 1: Read CSS in the verifier**

After `const background = read('js/background.js');` add `const css = read('css/site.css');`.

- [ ] **Step 2: Add tightening assertions**

When carrying over the ORIGINAL plan Task 6 checks, you MUST update the atmosphere check for the new symbols: replace `--scene-rain-opacity` with `--scene-rain-base`, and change its reduced-motion regex so it matches `.scene-rain::before, .scene-rain::after { animation: none; }` (the animation now lives on the pseudo-elements, not `.scene-rain`) — otherwise it becomes a stale failing assert. The state/halo/debug checks (`sceneState`, `haloPulse`, `activeSection`, `route: 'replay'`, `TOKYO_HALO_LABELS`, `makeTokyoHalo`, `tokyo-holographic-halo`, `tokyo-halo-pulse-packet`) are unchanged and stay. Then add these `check(...)` calls:
```javascript
check('rain animates via transform translateY (not a frozen background-position no-op)',
  /@keyframes sceneRainFall\b[\s\S]*translateY\(/.test(css) &&
    !/animation:\s*sceneRainFall[\s\S]*background-position/.test(css),
  'css/site.css rain must fall via transform translateY on a 180deg-structured gradient');

check('atmosphere sits below main content',
  /\.scene-atmosphere\s*\{[^}]*z-index:\s*0\b/.test(css),
  '.scene-atmosphere must render beneath main so content is not tinted');

check('rain opacity is CSS-owned base * JS multiplier',
  /--scene-rain-base/.test(css) && /--scene-rain-mul/.test(css) &&
    /calc\(var\(--scene-rain-base\)\s*\*\s*var\(--scene-rain-mul/.test(css),
  'CSS must own base rain opacity; JS only sets the multiplier');

check('rain multiplier is written only on change (no per-frame :root writes)',
  /_rainMulWritten/.test(background) && /setRainMultiplier/.test(background) &&
    !/setAtmosphereVars/.test(background),
  'background.js must gate --scene-rain-mul writes and must not restore per-frame setAtmosphereVars');

check('canvas sprites redraw after fonts load (no tofu labels)',
  /makeCanvasSprite/.test(background) && /document\.fonts\.ready\.then/.test(background),
  'makeCanvasSprite must redraw on document.fonts.ready');

check('Tokyo halo is emissive with a glow sprite and a ring mesh',
  /makeGlowSprite/.test(background) && /RingGeometry/.test(background) &&
    /tokyo-halo-glow/.test(background) && /spinGroup/.test(background) && /staticGroup/.test(background),
  'halo needs a glow sprite, a RingGeometry ring, and separate spin/static sub-groups');

check('halo packet is event-gated, not a perpetual spinner',
  /tokyoHalo\.packet\.visible\s*=\s*p\s*>\s*0\.03/.test(background),
  'the pulse packet must be gated on haloPulse/lock, never always-on');

check('section focus is cooldown-guarded with a signal-lock',
  /storyCooldown/.test(background) && /sceneState\.lockT\s*=\s*1/.test(background),
  '__sceneFocus must guard re-arming and trigger the home/contact signal-lock');

check('callout heading is bilingual only for Tokyo (no DALLAS / DALLAS)',
  /isTokyo \? '東京 \/ ' \+ target\.label : target\.label/.test(background) &&
    /timeZone:\s*'Asia\/Tokyo'/.test(background),
  'callout must not print DALLAS / DALLAS and must show live JST');
```

- [ ] **Step 3: Checks + commit**

```bash
node --check tools/verify-site-hardening.js
node tools/verify-site-hardening.js
git diff --check
git add tools/verify-site-hardening.js
git commit -m "test: assert tightened cyberpunk scene invariants"
```

---

## Task 7: Browser verification and tuning (acceptance)

**Files:** modify only if tuning is required (`css/site.css`, `js/background.js`).

**Interfaces:** Consumes Tasks 1–6. Produces a visually-verified, tuned scene meeting the spec's Acceptance Criteria.

- [ ] **Step 1: Full static pass**
```bash
node tools/verify-site-hardening.js
node --check js/background.js && node --check js/app.js && node --check js/effects.js && node --check tools/verify-site-hardening.js
git diff --check
```

- [ ] **Step 2: Serve + open with debug**
```bash
python3 -m http.server 4173 --bind 127.0.0.1
```
Open `http://127.0.0.1:4173/?sceneDebug=1`.

- [ ] **Step 3: Verify the spec's Acceptance Criteria in-browser** (what static checks cannot do):
  - Rain **visibly falls** (watch 3–5s); reads as sparse wet streaks, not a barcode, and does not cross-hatch the CRT into a test-pattern.
  - Halo Japanese labels render correctly (no □□ tofu), including after a hard reload; only 1–2 labels legible at once, fading by facing; labels do NOT orbit.
  - Tokyo **glow** reads as emitted light; on load and on `home`/`contact` re-entry the **signal-lock** fires (glow bloom + ring sweep + one packet) then settles; no perpetual orbiting dot.
  - Callout shows `東京 / TOKYO` with a live `JST HH:MM`, and `DALLAS` (never `DALLAS / DALLAS`).
  - Hero name and gallery photos are **not tinted**; toggling Scanlines/CRT off also calms the atmosphere.
  - `window.__sceneDebug()` exposes `activeSection/halo/rain/labels/callout/lockT`; console is clean (no Three.js warnings).
  - Run through `window.__sceneFocus('home'|'about'|'work'|'gallery'|'projects'|'contact')` — no strobing on rapid calls.
- [ ] **Step 4: Reduced-motion + mobile/LITE** — emulate `prefers-reduced-motion: reduce` (static frame, no rain motion, labels present) and a ~390×844 viewport (Tokyo + 1–2 labels, sparser rain, nonblank, nav/hero uncrowded).
- [ ] **Step 5: file://** — open `index.html` directly; same behavior, no CORS/module errors.
- [ ] **Step 6: Tune only if needed** — allowed knobs: `--scene-rain-base`, rain dash cadence/blur, glow sprite size/opacity, ring `RingGeometry` radii, label facing exponent, `lockT` decay. Do not add new systems.
- [ ] **Step 7: Commit any tuning**
```bash
git add -A && git commit -m "chore: tune tightened cyberpunk scene from browser verification"
```

## Stop Conditions

Stop and ask instead of pushing through if: `window.THREE` fails to load; `file://` rendering breaks; the console shows Three.js geometry warnings after a change; rain still doesn't visibly move after Task 1; Japanese labels still tofu after Task 3; reduced-motion cannot render a meaningful static frame; or achieving the look appears to require `EffectComposer`/assets/a build step (surface it, don't build it).
