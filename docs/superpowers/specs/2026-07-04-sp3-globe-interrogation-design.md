# SP3 — Globe Interrogation (Design)

**Date:** 2026-07-04 · **Branch:** `v3-build` · **Status:** approved (owner delegated — "continue, you don't need my approval"), ready for `writing-plans`.
**Part of:** the daikieOS **Plan C** build program (memory `v3-build-plan`), third sub-project. Builds on SP1 (ESM foundation) + SP2 (globe shading, shipped `33aa35d`→`a93b7a2`).
**Grounds on:** the `understand-sp3-globe-interactivity` research workflow (5 agents, all anchors re-verified against the current 1759-line `js/background.js`); the v3 interaction/motion briefs; the globe-elevation-brief's three deferred levers.

## What this is

SP3 makes the Tokyo data-globe **interrogatable with the pointer** — hover a region → a silent acquire-reticle; dwell → a scan-tag + live coordinate callout; select → the region's content. Today the globe has **zero raycasting**; all "focus" is scroll/section/auto-driven. SP3 builds the entire screen-pointer → globe-region path from scratch, pure no-build, additive-canvas-safe, and honestly wired to the content that actually exists.

**Governing reality (bounds the whole build):** only the **12 gallery photos** are content-backed — `GALLERY_PLACES` (`:1110-1123`) has 12/12 real coordinates pointing at the DOM lightbox. `PLACES` (tokyo, dallas) is narrative. Projects share one URL with no coordinates; "districts" (`TOKYO_HALO_LABELS` `:371`) are decorative angle-positioned labels; work has no geo. So SP3 **wires only what's real** and defers content authoring to the owner.

## §0 — Settled decisions

1. **Approach B — instrument-first.** Build the full pick machinery + hover/focus/select *feel*, but point `select` at reality: **gallery photo → existing DOM lightbox** (the one real destination); **tokyo/dallas → callout flash / scroll `#about`**; **projects, work, districts are NOT globe-selectable** in SP3.
2. **The interaction *is* the north-star feel** — "a calm console that comes alive only where you look." Hover is a silent snap; only the dwell-focus animates; at most one never-settling idle mark, reduced-gated.
3. **The two instrument levers (b, c) are IN** — they are the interaction's visual grammar (leader lines, reticle). **Lever (a) emitter clustering is DEFERRED** to a follow-up micro-spec — it is pure shading, orthogonal to interaction, and risks regressing SP2's night side.
4. **Accessibility is mandatory, not optional** — the pointer path is inaccessible to keyboard/AT, so SP3 mirrors globe focus onto the already-wired gallery/project DOM controls (`focus`/`blur` + one polite `aria-live` readout). The DOM is the accessible source of truth; the globe is its visual amplifier.
5. **Wire only real content; author none.** The `INTERROGABLE` lookup is *plumbing* derived from existing `PLACES` + `GALLERY_PLACES` — no invented coordinates, URLs, or district content.

## §1 — Raycast pick path

Point clouds don't raycast reliably, so pick against an **analytic sphere**, not the points:

- **Pointer:** a NEW `ptr` in true flipped-NDC — `ptr.x = (e.clientX/innerWidth)*2-1; ptr.y = -(e.clientY/innerHeight)*2+1`. The existing `mouse` (`:1439-1440`) is **not** valid NDC (its Y is not flipped) and drives parallax only — do not reuse it for picking.
- **Intersect:** `raycaster.setFromCamera(ptr, camera)`; `sphere = Sphere(coreGroup.getWorldPosition(tmpC), R)` (R=3.2 `:63`); `hit = raycaster.ray.intersectSphere(sphere, tmpHit)`. `intersectSphere` returns the **near-side** hit (front hemisphere) or null.
- **To geography:** `spin.worldToLocal(tmpHit)` → a point on the local sphere. **Use `spin`, NOT `coreGroup`** — `spin` owns `rotation.y` (`:1681`); the satellite `coreGroup.worldToLocal` at `:1032/:1041` must not be copied for picking or every reading drifts as the globe spins (top technique risk). `vecToLatLon(local)` = the exact inverse of `toV3(lat,lon,r)` (`:187`), for the coordinate readout.
- **Nearest place:** dot `normalize(local)` against each `INTERROGABLE` place's unit direction (`toV3(lat,lon,1)`); pick the max above `cos(8°)≈0.990`. Below threshold → "no place" (pointer between regions / off-globe).
- **Budget:** one flipped-NDC read on `pointermove`; **one pick per rAF, after `render()` at `:1740`**, gated `!reduced`, short-circuited on `coarse` (per-frame hover is pointless on touch). Alloc-free module-scope scratch vectors (`tmpC/tmpHit/tmpDir`).

## §2 — Hover → Focus → Select state machine

- **hover** — pick resolves a place → the **acquire-reticle** snaps to it (position + opacity, **no animation beyond the snap**); no place → reticle fades out. ~90 ms debounce on place-change kills boundary strobe.
- **focus** — the same place stays hovered ~400 ms (dwell) → fire the existing **`__scanPlace(place)`** (`:1168`, null-safe `:1169`) scan-tag + drive the coordinate callout. This is the only animated step.
- **select** — `pointerdown`→`pointerup` with sub-threshold movement (tap, not drag/parallax) on a place → **dispatch by content**: gallery photo → open its DOM lightbox; tokyo/dallas → callout flash + scroll `#about`; anything else → no-op. `Escape` deselects/clears.

## §3 — Select destinations (honest wiring)

| Region | Count | On select |
|---|---|---|
| Gallery photos | 12 (`GALLERY_PLACES`) | Open the existing DOM lightbox for that photo |
| tokyo / dallas | 2 (`PLACES`) | Callout flash + scroll to `#about` (narrative) |
| projects / work / districts | — | **Not selectable** (no real geo/content — deferred to owner) |

The scan-tag *labels* a photo's assumed city; those 12 photo→city assignments are **owner-unverified** (coords are real cities, the "shot here" claim is a guess). SP3 ships the interaction and flags the labels as the owner's to confirm.

## §4 — Lever (b): coordinate-callout leader

The corner-bracket coordinate callout already exists (IIFE `:790-839`, per-frame placement `:1697`, opacity gate `:1698`). Add a **thin dotted/dashed cyan leader** tying the focused node/reticle → the offset callout, so the readout reads as *pulled from* the point, not floating. Additive, `depthWrite:false`, capped, cyan.

## §5 — Lever (c): reticle + radial graticule leader

One **central reticle** with a **radial leader** out to the active label, seated on the faint `0.07` graticule substrate (`:276-299`; halo rings/labels `:471-572`). This is the "instrument targeting" grammar and makes the decorative districts read better *without* needing content behind them. Additive cyan lines.

## §6 — Accessibility (mandatory)

The globe interaction is pointer-only; the accessible content already lives in the DOM (gallery grid, project rows). SP3:
- Adds `focus`/`blur` mirrors on the already-wired gallery/project DOM controls (`:1216-1231`) so keyboard-focusing a thumbnail lights its globe region + fires the same scan path. **Run these on `!reduced` (not gated by `!LITE`)** — a11y must not depend on device class.
- Adds one **polite `aria-live`** region announcing the focused place ("Gallery — Shibuya, Tokyo").
- `:focus-visible` outlines on the controls; `Escape` deselects.
- **Freebie fix (flagged):** the project hover handler (`:1227`) queries `.proj-name`/`h3` but the markup is `.row-title`, so it silently falls back to `'PROJECT'`. Corrected to `.row-title` while in this block.

## §7 — Touch / LITE + reduced-motion

- **Touch/`coarse` (`:13`):** short-circuit the per-frame hover pick (no hover state on touch); **tap = single pick → select**.
- **Reduced-motion (`:12`):** honor the existing `:1584` early-return — **DOM + `aria-live` only, no globe motion, no pick loop** (the animated loop never runs; `scanTag` is already null there). Accessibility still fully works via the DOM mirrors.

## §8 — Data: the `INTERROGABLE` table (plumbing)

A module-scope lookup built at init from existing structures — **no authored content**:
- from `PLACES` (`:346`): `{id, label, lat, lon, kind:'place'}` for tokyo/dallas.
- from `GALLERY_PLACES` (`:1110-1123`): `{id, label, lat, lon, kind:'photo', domRef}` for the 12 photos, `domRef` = the existing `<img data-src>` / lightbox trigger.
Each entry precomputes its unit direction `toV3(lat,lon,1)` once (alloc-free picking).

## §9 — Acceptance gates

Method = SP1/SP2: `node --check` + local http server + Chrome (`__sceneDebug` parity + screenshots + console). Plus interaction-specific checks via `javascript_tool` (synthesize pointer events / call the pick fn) since automated hover is timing-sensitive.

- **A — Pick correctness:** hovering a known place's screen location resolves that place; the resolved lat/lon ≈ the place's coords; **no drift as the globe spins** (verify at two spin angles — the `spin.worldToLocal` correctness gate).
- **B — Hover reticle:** reticle snaps to the hovered place, silent (no easing/strobe); fades when pointer leaves the globe.
- **C — Focus:** ~400 ms dwell fires the scan-tag + coordinate callout + leader (lever b) + radial reticle leader (lever c).
- **D — Select:** tap on a gallery place opens its lightbox; tap on tokyo/dallas flashes + scrolls `#about`; drag (parallax) does NOT select; projects/work/districts not selectable.
- **E — Accessibility:** keyboard-focusing a gallery thumbnail mirrors the globe focus + announces via `aria-live`; `Escape` clears; `:focus-visible` visible. Project hover shows the real title (freebie fix).
- **F — Touch/LITE:** tap-to-select works on `coarse`; no per-frame hover cost.
- **G — Reduced-motion:** static globe, no pick loop, DOM + live-region still work.
- **H — Parity / discipline:** `__sceneDebug` tier/dpr/particles unchanged; fps ≥ baseline; every new mark additive + `depthWrite:false` (canvas transparency preserved); **no particle-count increase**; SP2 shading not regressed; no new render targets/composers.

## §10 — Out of scope

**Deferred to a follow-up micro-spec:** lever (a) emitter clustering (shading). **Deferred to the owner (content authoring):** per-project coordinates + distinct URLs, making projects/work/districts globe-selectable, district content, verifying the 12 photo→city assignments. **Later sub-projects:** SP4 postprocessing (CA/color-grade/bloom), SP5 cross-site grading.

## §11 — Open tuning knobs

nearest-place angular threshold (`8°`) · hover debounce (`90 ms`) · dwell (`400 ms`) · tap vs drag movement threshold (px) · reticle size/opacity · leader dash gap + opacity + cap · aria-live verbosity · idle-mark amplitude (reduced-gated).

## §12 — Risks

1. **Placeholder content** is the governing constraint → wire only what's real (§0.5). 
2. **Frame drift** if picking through `coreGroup` instead of `spin` → §1 mandates `spin.worldToLocal` (top risk).
3. **Un-flipped `mouse`** is not NDC → §1 builds a separate `ptr`.
4. **Over-animation** vs "animate the focus only" → hover is a silent snap; debounce+dwell kill strobe; ≤1 idle mark, reduced-gated.
5. **Owner-unverified photo→city labels** → ship interaction, flag labels for owner confirmation.

## §13 — Build anchors (current `js/background.js`, 1759 lines)

- **Hierarchy:** `coreGroup` (offset `:159`, tilt `:1682-1683`) → `spin` child (`:161-162`, `rotation.y` `:1681`); pick converts through `spin`.
- **Constants/util:** `R=3.2` `:63`, `toV3(lat,lon,r)` `:187` (invert → `vecToLatLon`).
- **Loop/insertion:** `function loop` `:1629`; `render()` `:1740` (call `interrogate(); updateFocus();` right after, gated `!reduced`); reduced static render `:1610`, early-return `:1584`.
- **Pointer:** `mouse` + `pointermove` `:1439-1440` (add separate flipped-NDC `ptr` here; add `pointerdown/up`, `keydown`).
- **scanTag:** def `:1124`, `__scanPlace` `:1168` (null-safe `:1169`), `__scanClear` `:1194`, `updateScanTag` `:1195` (called `:1657`), tag group under `spin` `:1163`.
- **DOM card wiring (a11y mirrors + freebie fix):** `:1216-1231`.
- **Focus/callout:** `focusedPlaceId` `:1276`, `setFocusedPlace` `:1278`, callout def `:790-839`, `calloutOffset` `:840`, placement `:1697`, opacity gate `:1698`.
- **Place nodes:** `placeNodesById` `:384`, `makePlaceNode` `:386`, added to `spin` `:402`, focus-highlight `:1701-1707`.
- **Data:** `PLACES` `:346` (2), `placeById` `:368`, `TOKYO_HALO_LABELS` `:371` (districts, angle-based), `GALLERY_PLACES` `:1110-1123` (12/12).
- **Lever (c) substrate:** graticule `:276-299`, halo `:471-572`.
- **Guards:** `reduced` `:12`, `coarse` `:13`, `LITE` `:15`.

## §14 — References

- `understand-sp3-globe-interactivity` workflow synthesis (this session) — current-state map, content audit, approaches, anchors.
- `2026-07-03-globe-elevation-brief.md` — the three deferred levers (a/b/c) and their code levers.
- `2026-07-03-design-language-v3.md` / `2026-07-03-north-star.md` — "observed and instrumented," "animate the focus only," "comes alive only where you look."
- `2026-07-03-sp2-globe-shader-elevation-design.md` — the shaded globe SP3 must not regress.

---

## §15 — Build results (2026-07-04, SP3 COMPLETE)

Executed inline (executing-plans), committed on `v3-build`:
`726149e` spec · `acd5075` plan · `3e74c87` T0 pick · `81b646d` T1+T2 reticle+dwell · `433b66a` T3 select · `e64c821` T4 a11y · T5 strip+record.

**Environment:** desktop, `high`/dpr2/7000 particles/fps 60–77. Dev hooks stripped; parity held; no console errors.

**Acceptance gates — all PASS:**

| Gate | Result |
|---|---|
| A pick correctness (no spin drift) | PASS — near-hemisphere places resolve at **dot=1.0** (round-trip); far-side correctly unpickable. **Fix:** `pickPlace()` calls `camera.updateMatrixWorld()` — the ray origin was `[0,0,0]` (stale camera matrix) when picking outside the render tick. `spin.worldToLocal` (not coreGroup) confirmed. |
| B hover reticle | PASS — DOM reticle+box+leader+coordinate snaps to the acquired place ("DALLAS 32.8N 96.7W"), silent snap, hides off-globe. |
| C dwell focus | PASS — ~0.4s dwell fires `__scanPlace` (verified scanCalled=`[dallas]`). |
| D select | PASS — gallery tap opens the lightbox (`.lightbox`→`open`, IMG_08); tokyo/dallas → `setFocusedPlace` + scroll `#about`; drag (>8px) no-op; Escape clears. |
| E accessibility | PASS — synthetic focus on gallery-05 → `__scanPlace(KYOTO)` + aria-live "Gallery — KYOTO"; project title fixed ("Degree Planning Audit Tool"); `:focus-visible` added. |
| F touch/LITE | PASS (by construction) — `interrogate()` gated `!coarse`; select (`pointerup`) ungated; `coarse=false` in the test env. |
| G reduced-motion | PASS — reduced re-import: `reduced=true`, a11y aria-live works ("Gallery — KYOTO"), `__scanPlace` no-op (no 3D scan), no pick loop (loop early-returns). |
| H parity/discipline | PASS — 7000/dpr2/high, fps≥60; grep: no new `WebGLRenderTarget`/composer (the `EffectComposer` refs are the pre-existing SP1 bloom), no particle-count change; SP2 shading intact. |

**Automation gotchas (dev-only, not user-facing):** the un-focused automation tab (a) throttles rAF — drive `window.__interrogate(0.1)` directly, not loop-timing; (b) does not dispatch focus events for programmatic `.focus()` — verify a11y via `dispatchEvent(new FocusEvent('focus'))`.

**Owner debts (deferred, not blockers):**
1. Verify the 12 photo→city assignments in `GALLERY_PLACES` (coords are real cities; the "shot here" claim is a guess).
2. To make projects/work/districts globe-selectable: supply per-item coordinates + distinct URLs (content authoring).
3. Lever (a) emitter clustering deferred to a follow-up micro-spec.

**Decision: SP3 COMPLETE.** The globe is now interrogatable — a calm instrument that comes alive where you point: reticle + live coordinates on hover, scan-tag on dwell, lightbox on tap, fully keyboard/AT accessible, touch + reduced-motion honored. Pure no-build, additive-canvas-safe, SP2 shading intact. Next = SP4 (postprocessing) or SP5 (cross-site grading), each its own spec→plan→build.
