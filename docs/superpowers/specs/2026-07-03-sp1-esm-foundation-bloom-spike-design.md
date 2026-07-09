# SP1 — ES-Module Foundation + Alpha-Preserving Bloom Spike (Design)

**Date:** 2026-07-03 · **Branch:** `v3-build` · **Status:** approved (owner), ready for `writing-plans`.
**Part of:** the daikieOS **Plan C** build program (see memory `v3-build-plan`), first sub-project.
**Grounds on:** `../research/2026-07-03-threejs-capability-ceiling.md` (§0 constraint, §1 bloom, §5 integration). Hardened by a 7-agent workflow (3 analyze → adversarial verify → synthesize); every code block below was checked against the real files.

## What this is

SP1 lays the **Path 2 spine** — migrate the site's JS loading from classic `<script>` globals to an **import-map + ES-module `boot.mjs`** — and **spikes alpha-preserving *official* bloom** over the transparent canvas (the #1 technical risk from the research). It is the enabler + de-risk for everything downstream (SP2 shaders, SP3 interactivity, SP4 postprocessing polish).

## §0 — Decision: SP1 stays on three **r158**

SP1 introduces **zero** three-version delta and validates the **official** jsm composer on the current build.

- Upgrading three (~r168) is provably safe for this scene — the audit checked every release r159→r172 against the actual API surface (26 constructors + renderer methods): **zero required code fixes**, both `onBeforeCompile` anchors survive verbatim at r168 (independently re-fetched), the additive/transparent path is structurally untouched. **But** the upgrade's *only* payoff is unlocking **pmndrs `postprocessing`** (peer-deps `three ≥0.168`) for the chromatic-aberration + color-grade stack — and it does **not** solve transparency.
- The adversarial verify **demoted pmndrs from "recommended" to "unproven"**: its alpha-0 preservation carries no verified evidence (the one cited demo renders over an opaque background). The **corrected official Route A** (§2) has a traced proof it preserves transparency.

**Therefore:** prove the hardest question — *does official bloom survive the transparent canvas?* — on the most-certain route with no version churn. The lush **CA + color-grade** stack is a **de-risked, separately-approved escalation** that folds into **SP4** (the r168 + pmndrs move; §2e). This still *is* Path 2 (import-map foundation + official jsm composer); only the pmndrs-specific extras defer.

---

## §1 — Foundation

### 1a. `index.html` — replace the tail (lines 337–343) with

```html
<!-- Import-map fallback for Safari <16.4 / Firefox <108. Loads async; no-ops on
     engines with native import-map + module support. Self-hosted, CSP-clean. -->
<script async src="js/vendor/es-module-shims-1.10.0.min.js?v=1"></script>

<script type="importmap">
{
  "imports": {
    "three": "./js/vendor/three-0.158.0/three.module.min.js",
    "three/addons/": "./js/vendor/three-0.158.0/examples/jsm/"
  }
}
</script>

<script>document.getElementById('year').textContent = new Date().getFullYear();</script>

<script type="module" src="js/boot.mjs?v=1"></script>
```

- The old `<script src="js/vendor/three.global.min.js">` is **deleted** — the shim in `boot.mjs` becomes the sole `window.THREE` (two builds ⇒ duplicate class identities / `instanceof` breakage → R1). Grep-confirmed the global is referenced only at index.html:337.
- Inline `#year` preserved verbatim (classic, THREE-independent). `<head>` unchanged (fonts, CSS, meta stay).
- `three/addons/` is a **trailing-slash prefix map**: each addon's own relative imports (`./Pass.js`, `../shaders/CopyShader.js`) resolve within the vendored subtree — no per-file entries.

### 1b. `js/boot.mjs` — new file, exact shape

```js
/* daikieOS ES-module foundation (SP1).
   Static imports evaluate BEFORE any body statement -> window.THREE + window.POST
   exist first; sequential dynamic import() runs the 5 scene IIFEs in original
   order, each strictly after the shim assignments. */

import * as THREE from 'three';
window.THREE = THREE;

import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';
window.POST = { EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass };

// Same order + ?v= as the old classic <script> tags (index.html:339-343).
const V = { bg: '3.8', boot: '3.1', cursor: '3.1', fx: '3.3', app: '3.4' };
await import(`./background.js?v=${V.bg}`);
await import(`./boot.js?v=${V.boot}`);
await import(`./cursor.js?v=${V.cursor}`);
await import(`./effects.js?v=${V.fx}`);
await import(`./app.js?v=${V.app}`);
```

### 1c. Load-order guarantee (structural fix for research §5 risk 4)

`boot.mjs` is a module → **deferred** (runs after parse). Its static imports (`three` + the 5 passes) are its dependency graph → they **evaluate before the first body statement** by ES-module semantics, so `window.THREE = THREE` and `window.POST = {…}` run first. Each scene file is loaded by **dynamic `import()` in the body** — not hoisted, evaluated at its `await` point, strictly after the assignments and in original order. At `background.js:9` the guard `if (!mount || !window.THREE) return;` therefore always sees `window.THREE` populated. The classic-script timing race is **structurally eliminated** — ordering is a data dependency inside one module, not source position across independent scripts. [VERIFIED — traced against the real guard + the no-lifecycle-events grep]

### 1d. Scene files ship **byte-identical** (verified, not asserted)

All five load unchanged: `boot/cursor/effects/app.js` have **0** THREE refs; `background.js` **never writes** `THREE.<x> =` (frozen ESM namespace safe) and has **no** `EffectComposer`/`POST` reference (publishing `window.POST` is pure preparation); **no** file uses `DOMContentLoaded`/`onload`/`readyState` (decisive — deferred + top-level-await modules fire *after* those events, so any reliance would break parity; none exists); each is already a strict-clean IIFE (module strict-mode is behavior-preserving; `node --check` passes all five); sequential `await` reproduces the exact `background→boot→cursor→effects→app` order that `app.js`/`effects.js` rely on for `window.scramble` etc.

### 1e. Cache-busting + vendoring

- **Scene files:** `?v=` moves verbatim into the `import()` strings (browser keys the module cache by full URL incl. query). `boot.mjs` becomes the single home for these versions.
- **Vendored three + addons:** **never** query the `three/addons/` prefix target (a query corrupts trailing-slash concatenation → R5). Version by **directory** (`three-0.158.0/`); a re-vendor changes the dir segment, cold-busting every resolved URL including addons' internal imports.
- **Vendor step:** add `tools/vendor-three-esm.cjs` (sibling to `build-three-global.cjs`) copying the **same pinned `three@0.158.0/build/three.module.min.js`** that produced today's global (single-source-of-truth ⇒ the retiring global and the new ESM build are provably the same r158) plus the minimal jsm graph into `js/vendor/three-0.158.0/`. Vendor `es-module-shims-1.10.0.min.js` locally too (no CDN). `build-three-global.cjs` stays valid until the global tag is removed; retire it then.
- **Minimal jsm graph to vendor (10 files) —** `examples/jsm/postprocessing/`: `EffectComposer, Pass, RenderPass, ShaderPass, MaskPass, UnrealBloomPass, OutputPass`; `examples/jsm/shaders/`: `CopyShader, LuminosityHighPassShader, OutputShader`. Complete transitive closure [EXTRACTED — r158 graph]; cannot be byte-verified pre-vendor → the **resolve-time 404 check is acceptance gate #1**. CA/grade passes (SP4) are our own inline `ShaderPass` objects — no extra files.

---

## §2 — Bloom recipe: corrected Route A (r158 jsm, two-composer selective, alpha-preserving)

The single-chain `EffectComposer → RenderPass → UnrealBloomPass → OutputPass` **cannot** work: UnrealBloomPass isn't layer-aware, and a lone bloom pass writes opaque black over `alpha:true` (issue #14104, "not planned") [VERIFIED — research §0]. The alpha-safe form is the official **two-composer dark-material-swap**, with the verification's fix folded in.

### 2a. The chain

```
BLOOM_LAYER = 1;
// selective via DARK-MATERIAL-SWAP (official webgl_postprocessing_unreal_bloom_selective),
// NOT camera.layers — avoids the per-frame camera.layers reset trap (R8).

// bloomComposer — renders ONLY tagged emitters (non-bloom swapped to black), off-screen
const bloomComposer = new POST.EffectComposer(renderer);   // omit type -> RGBA8 target (mobile-preferred)
bloomComposer.renderToScreen = false;
bloomComposer.addPass(new POST.RenderPass(scene, camera));
bloomComposer.addPass(new POST.UnrealBloomPass(new THREE.Vector2(w, h), strength, radius, threshold));

// finalComposer — full scene + ADD glow rgb + restore sRGB
const finalComposer = new POST.EffectComposer(renderer);
finalComposer.addPass(new POST.RenderPass(scene, camera));
finalComposer.addPass(mixPass);                            // see 2b — the fix lives here
finalComposer.addPass(new POST.OutputPass());              // REQUIRED: restores on-screen sRGB
```

### 2b. THE decisive fix — `mixPass` must **overwrite, not blend**

The verification caught that `mixPass.material.transparent = true` (and the official example's default `transparent = false`) both **leak the stale prior-frame buffer** into alpha-0 regions: `ShaderPass.clear` defaults `false`, and any blending over a `base.a≈0` scene retains the persistent target's ghost, occluding the CSS gradient. The official example survives only because its scene is opaque. Fix:

```js
mixPass.material.blending = THREE.NoBlending;   // NOT transparent = true
// fragment — add glow rgb, keep base alpha so undrawn regions stay alpha 0:
//   vec4 base  = texture2D(baseTexture,  vUv);
//   vec4 bloom = texture2D(bloomTexture, vUv);
//   gl_FragColor = vec4(base.rgb + bloom.rgb, base.a);
```

`NoBlending` disables GL blend → the fragment (incl. `base.a = 0`) overwrites the stale target verbatim; `OutputPass` (alpha-preserving [VERIFIED — r158 `OutputShader` tonemaps rgb only]) blits it; the browser clears the default framebuffer to `(0,0,0,0)` each frame. **Undrawn-pixel trace:** `(0,0,0,0)` survives RenderPass clear → NoBlending mixPass → alpha-preserving OutputPass → gradient shows through. Transparency preserved end-to-end.

### 2c. Selective targeting + integration touch-points

- **Tag BLOOM (bit 1) on emitters only:** cyan globe point-cloud, day/night terminator mesh, scan/ping rings, Tokyo halo glow sprite, Dallas→Tokyo arc + comet. **Exclude** the `fieldDeep` starfield, depth-rain, and all DOM overlays — so the frame doesn't wash ("instrument only the focus"). Keep every *source* intensity in `[0,1]` (bloom is a blow-out multiplier).
- **Render binding (R7 — `render` is `const` at background.js:1373, 4 call sites):** don't reassign; build the composer conditionally and define once —
  ```js
  const render = composer
    ? () => renderBloomThenFinal()             // dark-swap -> bloomComposer.render() -> finalComposer.render()
    : () => renderer.render(scene, camera);    // reduced / LITE / spike-off -> direct path
  ```
  routes the reduced branch (1393), fonts.ready re-present (1397), and context-restore redraw (1369) back to direct render.
- **Resize (1350):** add `bloomComposer.setSize(w,h)` + `finalComposer.setSize(w,h)` beside `renderer.setSize`.
- **Droplet lens (612/1516):** unaffected — the final pass renders to screen synchronously within the same `render()` before `droplets.update(dt)`; no `preserveDrawingBuffer`.

### 2d. Tier gating

`reduced` → no composer (direct static frame). `LITE` (`coarse||small`) → bloom **OFF** (two-composer ≈ 2× scene render, too heavy). `high` → full selective bloom. Runtime auto-degrade via the existing `fpsEMA` (1415): sustained sub-floor → disable.

### 2e. Escalation path (documented, de-risked, **SP4 — not SP1**)

For the lush **bloom + chromatic-aberration + color-grade** stack: bump to ~r168 (audit: zero code fixes, safe) and adopt **pmndrs `SelectiveBloomEffect`** — single fullscreen straight-alpha pass, per-object `Selection` (no dark-swap, no 2nd scene render). **Gate before adopting:** prove pmndrs alpha-0 with the *same* corner-pixel test as spike gate #2 (currently asserted, not verified). This is the moment the site leaves the dead-end r158 UMD build.

---

## §3 — Spike acceptance criteria + fallback

Served over **http(s)** (modules/import-maps are blocked under `file://`). Run the foundation gate first; it must pass before any bloom code.

| # | Gate | Pass condition | Fail ⇒ |
|---|------|----------------|--------|
| **1** | **Foundation parity** (composer OFF) | Boots via `boot.mjs`; globe + boot + cursor + effects + reveals **identical** to classic build; **zero 404s** (addon graph resolves); zero console errors; single THREE (no dup-class warning). | Fix vendoring/load-order first. |
| **2** | **Transparency gate (THE gate)** | Sample an **undrawn corner pixel** → alpha ≈ 0 **and** the CSS gradient is **visibly behind** the canvas. | `NoBlending` fix didn't hold → **abort to fallback**. |
| **3** | **Visual parity** (bloom off / empty selection) | Composited frame ≈ today's direct render (screenshot diff below threshold). | Missing OutputPass sRGB restore, or stale-buffer ghost. |
| **4** | **Selective bloom visible** | Tagged emitters (points, terminator, rings, halo, arc) show halo bleed; starfield + rain + DOM do **not** bloom. | Retag / fix dark-swap. |
| **5** | **Droplet lens intact** | Rain-on-glass still samples `renderer.domElement` correctly. | Composer not rendering to screen in the same sync `render()`. |
| **6** | **Fallback paths render** | Reduced one-shot (1393), fonts.ready re-present (1397), `webglcontextrestored` redraw (1369) all produce a frame via the composer-conditional binding. | Fix R7 binding. |
| **7** | **Perf budget** | Capture PRE-bloom `fpsEMA` baseline (desktop + mid phone — this spike **produces** the first real numbers); high-tier desktop stays within baseline; LITE bloom-off unaffected. | Drop resolution / disable per tier. |

**FALLBACK (spike fails gates 2–4 unrecoverably):** research §1's **hand-rolled half-res selective additive bloom** — render tagged emitters into a half-res **RGBA8** `WebGLRenderTarget`, dual-Kawase blur, blit **additively** with `renderer.autoClear = false`. Pure core THREE, no jsm, sidesteps transparency by construction. **Crucially the ES-module FOUNDATION is decoupled from the bloom outcome** — it stands regardless (Path 2 spine + on-ramp to the SP4 escalation), and the additive fallback needs no `window.POST`. SP1's foundation ships even if official bloom proves incompatible.

---

## §3.1 — SPIKE RESULTS (2026-07-03) — **PASS, SP1 COMPLETE**

**Verdict: alpha-preserving selective bloom is PROVEN on the r158 jsm Path-2 foundation.** The #1 unknown for Plan C — *does official `UnrealBloomPass` survive the transparent `alpha:true` canvas?* — resolves **YES**, via the two-composer dark-material-swap + `NoBlending` mixPass (design §2b). No fallback needed.

**Environment:** macOS desktop, Chromium, CSS viewport ≈1512×812, **dpr 2**, tier **high**, globe **7000/7000** particles, 60 fps rAF cap. Served over `python3 -m http.server`. Commits: **4636113** (ESM foundation), **9e39090** (bloom spike).

| # | Gate | Result | Evidence |
|---|------|--------|----------|
| **1** | Foundation parity | **PASS** | `REVISION 158`, `POST` 5 ctors, **57/57 requests 200** (full addon closure, 0×404), 0 console errors, single THREE (`classicGlobal:false`); scene fingerprint **identical** to classic (high/dpr2, 7000/7000, arc 128, reveals all 1.0, 60fps); `verify-site-hardening.js` 22/22. |
| **2** | Transparency (THE gate) | **PASS** | All 4 undrawn corners `[0,0,0,0]`; **stable over 16 s**, through the empty-selection composite path, **and after a full GPU context-loss/restore**. The additive canvas composites RGB over the CSS gradient with alpha≈0 (three premultiplied model) — bloom preserves both: corners contribute 0 RGB (no ghost), globe contributes RGB+bloom. |
| **3** | Visual parity | **PASS** | `emptySel` corner `[0,0,0,0]` (no stale-buffer ghost — R2) and **not washed dark** (OutputPass sRGB intact — R6). Isolating via same-path A/B (emptySel vs full-bloom) shows the brightness gain is genuine bloom, not a composite artifact. *Caveat:* a subtle composite-vs-direct brightness delta may exist (tone/color nuance) — finalize color grade in **SP4**. |
| **4** | Selective bloom visible | **PASS** | Bloom-on vs bloom-off A/B: globe wireframe + point-cloud + synthwave grid + halo/rings/arc **glow**; DOM wordmark, `fieldDeep` starfield, depth-rain, HUD chrome **unchanged**. Tagging is correct. |
| **5** | Droplet lens intact | **PASS (structural)** | `background.js:1629 render()` → `1630 droplets.update(dt)` (same sync tick); lens does `ctx.drawImage(renderer.domElement,…)` at :619. `render()` writes the composited/bloomed frame to `renderer.domElement` before the drawImage → lens refracts the bloomed frame. Mechanism is bloom-agnostic; a live droplet was not frame-captured but the timing is proven. |
| **6** | Fallback paths | **PASS** | Context-restore quantitatively verified: `lost+restored`, no error, **redrew 33 hot cells**, 60fps, corner still `[0,0,0,0]` — EffectComposer render targets survived the restore. Reduced path = the same flag-gated **direct** render verified via `?bloom=0` (`__bloomProbe` undefined, scene renders). Labels crisp after a cold hard-reload (fonts.ready). |
| **7** | Perf budget | **PASS** | **PRE-bloom fpsEMA = 60; POST-bloom fpsEMA = 60** (sustained ~16 s), high-tier desktop dpr2 — bloom adds no measurable frame cost (both at the rAF cap). *Caveat:* measured on high-end desktop only; LITE/mobile is bloom-off by design (no risk), but validate a real mid-tier device before shipping bloom broadly. |

**Decision:** SP1 **COMPLETE**. Plan C's Path-2 spine (import-map + `boot.mjs` + official jsm postprocessing) is validated end-to-end and the transparent-canvas bloom risk is retired. The **r168 + pmndrs CA/color-grade** escalation stays deferred to **SP4** (already audited safe; §2e).

**Notes carried to SP2+/SP4:**
- **Color:** possible subtle composite-vs-direct brightness offset → finalize grade in SP4 when CA/color-grade land.
- **Perf:** re-measure on a real mid-tier phone (emulation deferred here).
- **Dev-loop gotcha:** scene files keep a fixed `?v=` (e.g. `background.js?v=3.8`); the browser caches that exact URL, so **hard-reload (Cmd+Shift+R) is required to pick up scene-file edits** during dev — bump `?v=` on any real deploy.

---

## §4 — Ordered build steps

1. **Vendor r158 ESM assets.** Add `tools/vendor-three-esm.cjs` copying the same pinned `three@0.158.0/build/three.module.min.js` + the 10-file jsm graph (§1e) into `js/vendor/three-0.158.0/`; vendor `es-module-shims-1.10.0.min.js` locally.
2. **Restructure `index.html` tail** (delete global `<script>`; add the §1a block). `<head>` untouched.
3. **Write `js/boot.mjs`** (§1b exactly).
4. **Foundation checkpoint = acceptance gate #1.** Serve over http(s); confirm parity, zero 404s, zero console errors, single THREE. **If green, the foundation is done and independently shippable** — commit it as the SP1 foundation milestone before touching bloom.
5. **Build the bloom spike behind a dev flag (high-tier only)** in `background.js`: two-composer corrected Route A (§2a), `NoBlending` mixPass (§2b), dark-material-swap selective, emitter tags, composer-conditional `render` binding (R7), composer `setSize` in resize.
6. **Run acceptance gates 2–7;** capture the perf baseline.
7. **Decision point.** Gates pass → SP1 complete (alpha-preserving selective bloom proven on the r158 jsm Path-2 foundation; r168+pmndrs escalation documented + de-risked for SP4). Gates 2–4 fail → swap bloom for the hand-rolled additive fallback (foundation already banked at step 4).

---

## §5 — Risk register

| # | Risk | Sev | Mitigation |
|---|------|-----|------------|
| R1 | Two THREE instances if the global `<script>` is left in → dup classes, `instanceof`/material breakage | High | Delete the global tag in the same edit (referenced only at index.html:337); shim is sole THREE. |
| R2 | `NoBlending` mixPass regressed → stale-buffer ghost in alpha-0 regions | High | Gate #2 (corner-pixel + gradient visible) is the explicit pass/fail; fragment keeps `base.a`, blend disabled. |
| R3 | Addon import graph incomplete → resolve-time 404 (can't byte-verify pre-vendor) | Med | Gate #1 zero-404 network check before declaring the foundation done. |
| R4 | Load-order trap if any scene file were left a classic `<script>` | High (if mishandled) | All scene loading is in `boot.mjs` sequential `await import()`; no classic scene tags remain. |
| R5 | Addon cache-bust via import-map query corrupts URLs | Med | Never query the `three/addons/` target; version the vendor **directory**. |
| R6 | Missing `OutputPass` → dark/washed colors (composer removes on-screen sRGB) | Med | OutputPass terminates the final chain; gate #3 catches it. Alpha-preserving [VERIFIED — r158 OutputShader]. |
| R7 | `render` is `const` (1373), 4 call sites → naive reassignment won't compile | Med | Composer-conditional binding at definition; routes reduced/restore/fonts paths to direct render. |
| R8 | Selective via `camera.layers` needs a per-frame reset or the final render blanks | Med | Use **dark-material-swap** (official pattern), not `camera.layers`. |
| R9 | Top-level `await` stalls all scene init if a dynamic import 404s | Low/Med | Single `V` map; verify paths at vendor time (gate #1). Optional per-import try/catch to degrade — owner choice, not required for parity. |
| R10 | `.mjs` served as `application/octet-stream` blocks module load | Med | Host must serve `text/javascript`; es-module-shims fetch-evals as a sidestep; or name the entry `boot.js` with `type="module"`. |
| R11 | `file://` dev workflow dies (modules/import-maps blocked under `file:`) | Low | Doc "must be served over http(s)"; use a local static server for dev. |
| R12 | `tools/verify-site-hardening.js` asserts the global build the page no longer loads | Low (cosmetic) | Test still passes (global file kept on disk); retire that check when the global tag is removed. |
| R13 | pmndrs alpha-0 preservation is **unproven** (escalation path only) | Deferred | Out of SP1; if r168+pmndrs is later approved (SP4), gate with the same corner-pixel test before adoption. |
| R14 | Bloom re-tune: additive glow shifts against the composited buffer | Low | Gate #3 visual parity + source intensities in `[0,1]`; high-tier only, LITE unaffected. |

## Files touched / out of scope

**Touched by SP1:** `index.html` (script block only) · new `js/boot.mjs` · new `js/vendor/three-0.158.0/…` (11 files) · new `js/vendor/es-module-shims-1.10.0.min.js` · new `tools/vendor-three-esm.cjs` · a flagged bloom-spike block inside `js/background.js`.
**Byte-identical / untouched:** `js/boot.js`, `js/cursor.js`, `js/effects.js`, `js/app.js`, `<head>`, CSS, `tools/build-three-global.cjs` (retire post-migration).
**Out of scope (later sub-projects):** globe shader elevations (SP2), scan-and-tag interactivity (SP3), r168 upgrade + pmndrs CA/color-grade (SP4), cross-site v3 grading (SP5).
