# SP4 — Postprocessing Polish (Design)

**Date:** 2026-07-04 · **Branch:** `v3-build` · **Status:** approved (owner delegated — "continue, you don't need my approval"), ready for `writing-plans`.
**Part of:** the daikieOS **Plan C** build program (memory `v3-build-plan`), fourth sub-project. Builds on SP1 (bloom spike), SP2 (globe shading), SP3 (interaction) — all shipped on `v3-build`.
**Grounds on:** the `understand-sp4-postprocessing` research workflow (5 agents; the r158-vs-r168 fork resolved and the composer color-space verified against the vendored source). Full synthesis + the exact CA/grade GLSL in the workflow's `handrolled-ca-grade` map: `.../tasks/w2m9e548m.output` (journal in `subagents/workflows/wf_b47c67e0-6e9/`).

## What this is

SP4 ships the lush postprocessing stack: **productionize SP1's alpha-preserving selective bloom** (turn it on by default, tuned), then append two **hand-rolled r158 `ShaderPass`es** — a **color-grade** and a **chromatic-aberration** — each copying SP1's `mixPass` alpha contract. Pure no-build, no version bump, no new dependency. The whole feature stays inside the existing `if (bloomEnabled) {…}` block (`js/background.js:1603-1697`).

## §0 — Settled decisions

1. **Hand-rolled r158, NOT r168 + pmndrs.** All four research readers converged. pmndrs `postprocessing` would re-open the transparent-canvas risk SP1 exists to have retired (documented "blackish glow on transparent bg", issue #133; alpha regressions #286/#529), for no material gain on this few-effect scene. r158's `POST.ShaderPass` is already exposed; SP1's `mixPass` (`:1630-1657`) is the working template. **A future three upgrade for longevity is decoupled from SP4** (SP1's ESM import-map already unblocks it independently).
2. **CA + grade go AFTER `OutputPass`, in display-referred sRGB.** Verified: the composer's ping-pong targets are **RGBA16F linear** (`EffectComposer.js:27`, `HalfFloatType`) — the in-repo comment at `:1623` claiming "RGBA8 (mobile-safe)" is **wrong and gets fixed**. The grade is a colorist control specified in sRGB hex (teal-black `#0a1416`), so it must run where those values live. `OutputPass` does the only linear→sRGB encode; the two custom passes omit `<colorspace_fragment>` so three does not re-encode them → they write display-sRGB to the canvas verbatim.
3. **Auto-gated, no new gating.** CA + grade live inside `if (bloomEnabled)` and are appended to `finalComposer`. When bloom is off (LITE / `prefers-reduced-motion` / no `window.POST`), `render()` falls back to direct `renderer.render` (`:1729-1731`) — no composer, no post. Bloom stays **high-tier only** (the two-composer path ≈ 2× scene render; mobile bandwidth is the cost).
4. **The SP3 reticle + all HUD chrome are DOM** — physically untouchable by the WebGL post chain (free win: post the 3D scene freely, chrome stays crisp).

## §1 — Productionize the SP1 bloom

- **Ship ON by default:** at `:1599-1600`, delete the `BLOOM_SPIKE &&` term; keep `quality.name === 'high' && !reduced && !!(window.POST && window.POST.EffectComposer)`.
- **Retire dev scaffolding:** delete the `BLOOM_SPIKE`/`bloomEmptySel` parse (`:1597-1598`) and the `if (!bloomEmptySel)` wrapper (`:1609`, keep the tagging body `:1610-1617`). **Transplant `__bloomProbe` (`:1687-1696`) into the SP4 spike harness (§6) BEFORE deleting it.**
- **Re-tune** `BLOOM_STRENGTH / RADIUS / THRESHOLD` (`:1605`) against the composited HalfFloat buffer **and the finished grade** (bloom + grade are tuned together; resolve the composite-vs-direct brightness offset). Keep every emitter *source* intensity in `[0,1]`; cool instruments lead B/G with R low so the additive sum never reaches neutral white.
- **Fix the wrong comment** at `:1623` (`"RGBA8 (mobile-safe)"` → HalfFloat/RGBA16F linear).
- **SP2 reveal:** the globe `earth-land-particles` is already bloom-tagged (`:1610-1617`) — the boot-reveal sweep glows for free; verify it reads well at the tuned strength.
- **SP2 limb shell — keep OUT of the bloom set by default** (atmospheric haze, not an emitter core; the globe brief warns the terminator must not blow to white). Evaluate a *gentle* limb bloom only if the terminator reads flat in-browser; if added, re-verify peak stays sub-white + cyan. The generic dark-swap traverse (`:1665-1682`) already blacks out the limb + `holo-scan-shell` during the bloom pass — no new exclusion wiring.

## §2 — Chromatic-aberration `ShaderPass`

A radial, edge-weighted "worn projected glass" fringe, subtle and always-on at low magnitude (an optional stepped sub-second pulse on transition/acquire events is a deferred nice-to-have). `POST.ShaderPass(new THREE.ShaderMaterial({…}), 'tDiffuse')`, `NoBlending`, **last** in the chain.

- **Technique:** sample R and B at `±radial offset` (offset grows with distance from centre for a lens feel); sample **G and alpha at the un-offset CENTRE tap**; output `vec4(r, c.g, b, c.a)`.
- **THE alpha rule:** alpha MUST come from the centre tap, never an offset tap — else a pixel just outside the silhouette whose R-tap lands inside drags color into transparent space (reintroducing the ghost SP1's gate #2 guards against).
- **Ceiling:** ≤ ~1px offset; fringe ghosts ≤ ~0.25 alpha; **never strobe.**
- Exact GLSL: the `handrolled-ca-grade` research map §1 (pulled into the plan).

## §3 — Color-grade `ShaderPass`

Analytic lift/gamma/gain + teal-black shadow crush + gentle saturation, in **display-referred sRGB**, `NoBlending`, after `OutputPass`, before `caPass`.

- **Look targets:** crush blacks toward **teal-black** (`#0a1416`–`#0c1f22`, hue ~185–195°) via a `smoothstep(0, 0.35, luma)` shadow mask; **protect** the electric-cyan emitter `#39f0ff` (never tint the base with it); highlight-gain leans *faintly* amber (a whisper, not a wash); keep amber scarce (~1–6% of frame, warm:cool ~1:8+).
- **Clamp graded rgb to `[0,1]`** before output (HalfFloat stores negatives/overshoots; bloom cores exceed 1; a teal lift can push a channel below 0).
- Pass through `src.a` unchanged.
- Exact GLSL: the `handrolled-ca-grade` map §2 (pulled into the plan). Optional 2D-strip `DataTexture` LUT is a deferred escalation.

## §4 — Chain order (the verified pass sequence)

```
finalComposer.addPass(RenderPass(scene, camera));   // :1661  unchanged
finalComposer.addPass(mixPass);                     // :1662  bloom.rgb ADD, keep base.a   (LINEAR)
finalComposer.addPass(OutputPass());                // :1663  tone-map + sRGB OETF; NO LONGER last
finalComposer.addPass(gradePass);                   // NEW    crush/tint in sRGB, keep .a
finalComposer.addPass(caPass);                      // NEW, LAST  lens fringe, centre-alpha, keep .a -> canvas
```

`OutputPass`'s `renderToScreen` auto-flips to false (composer's `isLastEnabledPass`); `caPass` becomes the canvas writer. CA-vs-grade order is purely aesthetic (both display-space, alpha-safe) — ship **CA last**; leave the swap a one-line tunable (swap to grade-last only if the grade later grows a radial vignette).

## §5 — Hard constraints

1. **Transparent canvas — every pass** `NoBlending` (overwrite the stale ping-pong target) + `gl_FragColor.a = <centre>.a`. `ShaderMaterial` defaults to `NormalBlending` — MUST set `.material.blending = THREE.NoBlending` (as `mixPass` does at `:1657`).
2. **No neutral-white state.** Primary lever is upstream (source intensities in `[0,1]`, lead B/G); the grade is the backstop (highlight-gain amber whisper, shadow teal crush).
3. **Amber scarce** (~1–6%); cyan leads.
4. **No SP2/SP3 regression:** limb + `holo-scan-shell` dark-swap to black in the bloom pass then restore (verify); SP2 reveal blooms via the tagged globe (verify); SP3 DOM reticle untouchable by post (verify no apparent smear).
5. **Rain-droplet regression watch:** `droplets.update(dt)` (`:1881`) samples "this frame's buffer" after `render()`; SP4 makes the composer the DEFAULT high-tier path for the first time — confirm the rain lenses sample the composited (graded, CA'd) frame, not a stale/direct buffer.
6. **Performance:** two extra full-screen passes (CA = 3 taps, grade = 1 tap) ≈ 0.5–1.5 ms on the already-measured-free (RGBA16F) chain; bandwidth (not ALU) dominates — validate on a real mid-tier device. Fallback if integrated GPUs bite: `composer.setPixelRatio(≤1.5)` (not needed initially).

## §6 — Required spike (the ship gate)

Extend SP1's corner-pixel gate to the full CA+grade chain, on the real page, BEFORE deleting `__bloomProbe`. Pass/fail:
1. **Undrawn corner alpha ≈ 0** AND the CSS gradient is *visibly* behind the canvas (not a black/teal rectangle).
2. **Centre pixel alpha > 0** (globe drawn — proves a live read).
3. **CA silhouette-edge sub-test (the new failure mode):** a pixel just *outside* the globe silhouette whose CA R-offset tap lands *inside* must still read **alpha 0** → no colored ghost bleeds into transparent space. Validates the centre-alpha discipline. If this fails, CA is reading alpha from an offset tap — fix, don't ship.
4. **Stability:** steady state, during the SP2 boot reveal, after a debounced resize (both composers `setSize`, `:1706`), through a WebGL context-loss/restore (`:1724-1727`), with SP3 pointer interaction active.

Fail criteria 1 or 3 → SP4 does not ship until the alpha write is corrected (same bar SP1 held).

## §7 — Out of scope

pmndrs / r168 upgrade (§0); a `.cube`/3D-LUT grade (analytic hits the target); event-gated CA `uGlitch` pulse choreography (motion surface's job — stub the hook, ship subtle always-on CA); per-section temperature switching cadence (grade exposes uniforms; the cadence is the motion brief); DOM chromatic ghost-echo (CSS, unrelated); widening bloom/grade to LITE.

## §8 — Build anchors (`js/background.js`, verified)

Whole feature = the one `if (bloomEnabled) {…}` block, `:1603-1697`.

| What | Lines | Action |
|---|---|---|
| Gate | `:1599-1600` | delete `BLOOM_SPIKE &&` |
| Dev-flag parse | `:1597-1598` | delete `BLOOM_SPIKE`/`bloomEmptySel` |
| Empty-sel guard | `:1609` | remove `if (!bloomEmptySel)` wrapper (keep tagging `:1610-1617`) |
| Bloom tunables | `:1605` | re-tune STRENGTH/RADIUS/THRESHOLD |
| Wrong comment | `:1623` | fix RGBA8 → HalfFloat/RGBA16F |
| `mixPass` template | `:1630-1657` | unchanged — copy its alpha contract |
| `finalComposer` chain | `:1660-1663` | append `gradePass` then `caPass` after `OutputPass` |
| dark-swap/sequence | `:1665-1682` | unchanged (covers SP2/SP3 objects) |
| `__bloomProbe` | `:1687-1696` | transplant to spike harness, then delete |
| resize | `:1706` | no new wiring (radial CA uses no `resolution` uniform) |
| `render()` indirection | `:1729-1731` | unchanged |

**Passes are drop-in** `POST.ShaderPass(new THREE.ShaderMaterial({…}), 'tDiffuse')` (default `textureID` `tDiffuse`, unlike `mixPass`'s `'baseTexture'`).

## §9 — CSS companion (all-tier teal-black floor)

The ~88% near-black field is the **CSS gradient behind the transparent canvas** — all-tier, independent of the grade. Migration note: the base literals `#05060a`/`#030407` read blue-black. **Re-hue the CSS gradient to teal-black (`~#0a1416`)** so LITE/reduced users get the on-brand floor without a grade. Keep this to the CSS gradient (trivial, all-tier) — do NOT build a second grade path for LITE. (Small, may fold into SP5 grading; noted here for coherence.)

## §10 — References

- `understand-sp4-postprocessing` workflow synthesis (this session) — the strategic fork, verified chain order, spike, anchors; exact CA/grade GLSL in its `handrolled-ca-grade` map.
- `2026-07-03-sp1-esm-foundation-bloom-spike-design.md` §3.1 — the proven bloom + `mixPass` alpha contract SP4 productionizes.
- `2026-07-03-design-language-v3.md` §6 palette tokens + §6.7 "no neutral-white state"; `2026-07-03-north-star.md` "~88% deep shadow."
- SP2/SP3 specs — the shaded, interactive globe SP4 must not regress.
