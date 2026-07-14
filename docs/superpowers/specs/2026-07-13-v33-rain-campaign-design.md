# v3.3 — Rain campaign: the rain leans, the world answers its light

**Date:** 2026-07-13. **Author:** Fable 5 (design-spec pass), from the three 2026-07-10 research tracks + the owner enhancement brief.
**Branch:** `v33-rain` @ `c531877`, off the completed v3.2r remediation. All `file:LINE` anchors in this spec are against that tree; re-anchor if files move.
**Owner decision (verbatim scope — settled, do not re-litigate):** **Package M plus the M10 rivulet-glass Splurge rider, STAGED** — M's items first, M10 as its own late slice behind a flag. The owner's intent in their own words: *"the rain could be improved further, and the effects of the rain can also be improved further… light simulation or liquid simulations with the rain."* Framework verdict already settled: **NO framework** (GSAP declined outright; anime.js declined-now with its re-entry condition recorded in `../research/2026-07-10-animation-framework-options.md` §6; Motion not a candidate). Nothing in this campaign may reopen that verdict.
**Inputs of record:** `../research/2026-07-10-rain-liquid-sim-options.md` (R1–R6) · `../research/2026-07-10-light-sim-options.md` (families A–E) · `../research/2026-07-10-animation-framework-options.md` (options A–D) · `../research/2026-07-10-v33-enhancement-brief.md` (M1–M10, packages S/M/L).
**Standing law (unchanged, binding on every task):** deep-black floor `#05060a` family; section p50 luminance floors **8/7/9** (hero/projects/gallery); scarcity — never add a layer without retiring one; amber is an event (~1–6% warm budget) except the amber-starfield signature; one signal per section-change; photos dim at rest / full on demand; NO AUDIO; no push/PR without owner sign-off; harness pins updated with features, never deleted. Law of record: `2026-07-08-v32-law-addendum.md` (incl. the §8b variance law and the v3.2r close-out — the measurement context this campaign inherits).

---

## §0 — Context: what is already landed, what this campaign measures against

- **M1 (scroll scrub) LANDED at `3b49a5d` — out of scope.** The one-pole `scrollNS` filter (`js/background.js:2037`, `:2050–2052`, τ ≈ 0.125 s) already feeds spin (`:2101`), grid (`:2094`), dolly (`:2185`), and look-at (`:2186`); harness check "v3.2r — scroll scrub" pins it (`tools/verify-site-hardening.js:370–377`). This campaign records it as shipped and builds nothing for it.
- **Baseline of record:** the v3.2r close-out table (law addendum, "v3.2r close-out measurements", HEAD `2fd4734`): hero mean 18.54 / p50 8 / p95 77 / warm 0.0086 · projects 21.96 / 7 / 114 / 0.0028 · gallery 38.21 / 9 / 120 / 0.0015. The hero depth-rain rest contribution is **below measurement resolution** (interleaved A/B pairwise Δ median **−0.01**). That −0.01 is the bar every rain change in this campaign is judged against. Because two commits (`3b49a5d`, `2afddcc`) and this spec sit between that close-out and the first v3.3 build commit, **task v33a MUST capture a fresh same-procedure pre-campaign baseline in the same session as its own after-captures** (§4.1) — cross-session comparison is what burned the original §8 rows.
- **Harness state:** `node tools/verify-site-hardening.js` = **42/42 PASS** at `c531877`. The campaign only ever raises this count.
- **v3.2 → main:** v3-build has since merged to main (`a2bca72`). The cache-bust burn rule this creates is §7.

---

## §1 — Campaign laws (these bind every task below)

### 1.1 Retirement pairings (MUST — each is a law, pinned negatively in the harness)

| Task | ADDS | RETIRES (deleted-symbols list — the harness pins these as MUST-NOT-MATCH) |
|---|---|---|
| v33a M4 | ONE instanced streak mesh (net scene objects **−2**) | the three `THREE.Points` rain layers (`'rain-layer-0/1/2'`, `background.js:521–525`); the rain `PointsMaterial` constructions; the three rain streak-sprite call sites `makeStreakTexture(d.len, d.head)` (`:522`); the per-frame CPU advection/recycle loop over 470 drops (`:1346–1358` — the `ud.speeds` walk and the `p[i*3+1] < -ud.halfH` recycle) |
| v33b M2 | ≤4 uniforms + two consts + the `wordT` suppression envelope | the shared flat `(flash \|\| 0) * 1.3` beat literal (`:1341` — high tier goes directional via well 3; LITE's surviving coupling re-homes under a named `LITE_FLASH_BEAT` const, §3.2 C2); the roughly-linear lightning gradient (`:1122–1125` — exponential replaces it) |
| v33c M3 | merge + trail-bead logic inside the existing IIFE | nothing — and adds no layer; in-place elevation of an existing layer (the shipped Lever-D category). Bead cap (24/12, `:651`) does not rise |
| v33d M5 | WAAPI `el.animate()` sequencer | the hero `setTimeout` ladders (`app.js:48`, `:84`, `:106`), `heroSettleTimer`/`settleHero` (`app.js:25–43`, `:108–109`), the inline `style.transition`/`transitionDelay` plumbing + double-rAF kicks (`:60–71`, `:80–83`) |
| v33e M6 | one `@supports (animation-timeline: …)` CSS block | per-frame JS parallax transform writes (`effects.js:123–130`) and progress-bar width writes (`effects.js:120`) **on SDA browsers** (~83% of visitors); JS path retained as the no-SDA fallback, never double-driving |
| v33f M10 | one GPGPU sim + one full-screen refraction pass (high tier, flagged) | the **desktop** 2D droplet-canvas work: on `quality.name === 'high'` with `RIVULET_GATE` true, the `droplets` IIFE (`background.js:646–753`) allocates nothing, binds nothing, draws nothing (HALO_GATE discipline, §5). The `.scene-droplets` DOM element (`index.html:62`) and its CSS stay — they are LITE's home |

**Correction of record #1:** the enhancement brief says M4 retires `makeStreakTexture()`. Code says the shooting star also consumes it (`background.js:1059`, `makeStreakTexture(0.9, 0.9)`). Binding: the three **rain** call sites are retired; the factory stays with the star as its single caller. The negative pin targets `makeStreakTexture(d.len, d.head)`, not the factory name.

### 1.2 One-signal law, applied to lightning (the M2 ruling)

The lightning flash + every M2 response is **ONE event, not five**: all couplings consume the single decaying envelope `env` returned by `updateLightning()` (`background.js:1147–1149`) — one cause, one time-envelope, zero new timers, zero new beats (pinned negative #4 of the law addendum honored). A signal is counted by its *source*, not by how many surfaces express it — exactly the shipped grammar of `lockT`, which already brightens rain, spins the halo faster, and boxes the state-word from one lock event.

**Suppression rule (binding):** the whole-frame grade lift (C1) is the only M2 coupling with global reach, and the boxed state-word owns the frame while it runs. `lockT` alone CANNOT gate this: `sceneState.lockT = 1` arms only on home entry (`background.js:1515`) and the boot warp (`:2030`), while the state-word explicitly skips home (`effects.js:13`) and fires on every *other* section change — the two are mutually exclusive by construction, and `lockT`'s ~1.1 s decay (`:2057`) would not even cover the word's 1.9 s run (`.state-flash.show`, `css/site.css:665`). Therefore **v33b arms a NEW scene-side envelope**: `sceneState.wordT = 1` inside `__sceneFocus` on every real (non-guarded) section change with `id !== 'home'` — beside the existing entry beats at `:1514–1515` — decaying to match the word's 1.9 s animation (`wordT −= dt / 1.9`, clamped ≥ 0, beside `lockT`'s decay at `:2057`). **`wordT` drives NOTHING else** — not `beat`, not wells, not halo, not haloPulse; it is purely the suppression envelope (arming any existing beat from it would be an unordered behavioral regression — forbidden). Drive: `uFlash = LIGHTNING_GRADE_LIFT × env × max(0, 1 − max(sceneState.lockT, sceneState.wordT))` — `lockT` stays in the gate for the home/boot signal-lock beat. The local responses (per-drop wells, limb catch, glint) are spatially confined and ride un-suppressed, like rain's existing `lockT` coupling. The suppression term AND the `wordT` arming line are harness-pinned (§6).

### 1.3 Bloom dark-swap (the v3.1g lesson, now a REQUIREMENT with a test)

Any new scene object MUST have a type-correct invisible dark-swap in the bloom pass (`darken()`, `background.js:1937–1942`), and rain stays **excluded** from the bloom emitter set (`:1780–1781` — pinned). For M4's instanced mesh: the swap material must compile and render invisibly against instanced geometry (opacity 0, transparent, depthWrite false; the custom attributes are simply ignored — quads collapse to raw geometry positions and contribute nothing). **Acceptance test (v33a, mandatory):** **the bloom-target capture is the method** — capture `bloomComposer`'s output target in isolation (devtools `evaluate_script` render) with the rain mesh `visible = true` vs `false`; the two bloom-target captures must be pixel-identical (no stamped holes, no dark squares). (A *full-frame* pair is only valid as a fallback if rain's final-pass contribution is first nulled — vis/opacity uniforms to 0 — since toggling visibility otherwise changes the frame by the streaks themselves.) Zero WebGL/console warnings across the session. A shipped M4 without this capture pair archived is a failed task.

### 1.4 Measurement prohibitions (inherited, binding)

From §8b + the v3.2r close-out: **never single frames** — medians of ≥5 fresh-hard-reload frames or interleaved same-frame A/B toggles; **no below-resolution delta is ever cited as fact** (report it, mark it unresolvable, route letter-fails to the gate pile — the v3.2r precedent); viewport + DPR recorded per capture; ONE tab per session, stale QA tabs closed; zero console messages is part of every gate; gallery p95 saturates at 120 — mean is the sensitive gallery metric.

### 1.5 Reduced-motion (binding on every task)

`depthRain` stays `null` under reduced motion (`background.js:639` — pinned); M4 must not resurrect it. M5 must keep `runHero()`'s reduced short-circuit byte-identical in behavior (`app.js:102`). M6: the global `.001ms` animation kill (`site.css:442–448`) does **NOT** stop a scroll-driven animation — duration is irrelevant to progress-driven playback — so every SDA-driven element MUST get an explicit `animation: none` inside the reduced-motion block. Acceptance: reduced-motion emulation + scroll sweep shows zero transform/width change on the migrated elements.

---

## §2 — Slices and task order (binding)

**Order: v33a M4 → v33b M2 → v33c M3 → v33d M5 → v33e M6 → [slice boundary: M-package complete, shippable] → v33f M10 → v33g close-out.**

Justification:
1. **M4 first.** It is the deepest render change (material rewrite + dark-swap + both gate suites) and needs the longest soak under every later task's QA sessions. More binding: M2's rain-coupled parts (C2 directional response) **land in the new shader** — building M2 first would write the flash coupling twice (once per-plane into code M4 deletes, once per-drop). The enhancement brief's own note agrees: "M4 last because it carries the two pins" was ordering within Package S+M *as a whole*; with the campaign scoped to M-and-M10 only, M4's dependents (C2, splash hooks someday) make it the head of the chain, and its A/B gate is cleanest against a freshly captured baseline before anything else moves pixels.
2. **M2 second** — pure parameter plumbing into surfaces that now all exist in final form (new rain shader, grade pass, limb shell, droplet glass).
3. **M3 third** — same droplet IIFE that M2's C4 glint just touched; adjacent commits, one QA session covers both.
4. **M5 → M6 fourth/fifth** — the DOM lane, independent of the scene lane; M5 before M6 because both edit the entrance/reveal surface area and M5's retirements shrink what M6's parity captures have to hold still.
5. **M10 as its own late slice** — per the owner's staging decision. It consumes M-slice products (the graded frame; the settled composer chain) and its taste gate must not hold the M slice hostage.
6. **Close-out last** — measurements, letter-criterion verdicts, gate pile.

Each task boundary is a shippable stopping point; any task can be killed on the board without unwinding the ones before it.

---

## §3 — Per-item binding requirements

### 3.1 v33a — M4: instanced velocity-stretched rain, per-drop light wells (R1 = B1/B2 + C2-prep)

**WHAT:** replace the three `THREE.Points` planes built by `makeDepthRain()` (`background.js:499–534`) with **one** `InstancedBufferGeometry` quad batch under the same factory name and the same `'depth-rain'` camera-parented group (`:531–532` — `reduced ? null : makeDepthRain()` at `:639` and the camera-space design carry over verbatim).

Binding requirements:
- **Counts and layer read:** 70+150+250 = **470** instances high tier, 80+130 = **210** LITE, carrying the per-layer params of `:501–506` (size, speed range, baseOp, z-band, len, head) as per-instance attributes (seed xyz, speed, layer id/params). The ≥2-depth-plane read (design-language §2.1) MUST survive in the one draw call — near sparse/bright, far dense/dim.
- **Velocity stretch (the cheapness-tell fix):** the vertex shader stretches each quad along its **true velocity vector** — fall speed + `uWind` (the CPU keeps computing `wind = 0.10 + sin(...)*0.05 + clamp(rainShear, ±0.6)` at `:1340` and uploads one float). Streak length ∝ speed × per-layer `len`; streak angle = `atan(wind)` — under full shear the drops **lean ~30°** instead of sliding sideways under a baked 10° sprite. Head/tail alpha profile reproduces the retired `makeStreakTexture` gradient (`:1035–1039`) analytically or via one shared texture.
- **GPU recycle:** `y = mod(seedY − speed·uT, 2·halfH) − halfH` in the shader; the CPU loop at `:1346–1358` is DELETED (see §1.1). The loop's only remaining rain work per frame: well projection (existing `setWell`, `:1314–1323`), uniform uploads, `group.visible` (`:1327`).
- **Per-drop wells:** the ≤3 wells (`:1329–1338` — Tokyo halo / focused place / live lightning, strengths unchanged) upload as `uniform vec4 uWells[3]` = (screen-xy from the existing projection, strength, camera-z). Per-drop brightness = `baseOp × vis × beat × min(MOTIV_CAP, MOTIV_FLOOR + Σ wellᵢ)` where each well contributes `s × exp(−|zDrop − wz| / WELL_DEPTH_SIGMA) × exp(−dScreen² / WELL_XY_SIGMA²)`. The depth falloff carries `WELL_DEPTH_SIGMA = 6.0` (`:1310`) verbatim; the **new** screen-xy falloff sigma is the one new tunable (start ≈ 0.25 NDC units; tune downward only under the A/B gate). `MOTIV_FLOOR = 0.16` / `MOTIV_CAP = 0.80` (`:1307–1308`) move into shader uniforms **at the same values** — both harness-pinned by value (§6). (Lowering MOTIV_FLOOR below 0.16 because lit drops now carry the read is a *later owner call*, not this task.)
- **Carried behaviors (each one an acceptance check):** `beat = 0.85 + haloPulse*0.5 + lockT*0.45` (`:1341`, flash term moves in v33b — until then carried verbatim including `+ flash*1.3`); layer-0 amber tint on projects entry (`rainTintK` decay `:1344–1345`, `rainTintK = 1` arm at `:1521`) via a `uTint` uniform applied to layer-0 instances; additive blending, `depthWrite:false`, `renderOrder = 3`, color `0xbfeaff` (`:521–527`); `group.visible = vis > 0.02` (`:1327`); reduced-motion null (`:639`).
- **LITE:** 210 instances; the well branch is **not compiled** on LITE (`#define`/separate material) — flat `RAIN_LITE_VEIL = 0.55` uniform (`:1309`); LITE keeps the flat flash beat coupling (v33b, §3.2). LITE is strictly cheaper than today: CPU loop gone, 2 draw calls → 1, zero projection math (unchanged).
- **A/B lever (binding, for this and every future gate):** the render loop writes ONLY `group.visible` and uniforms — never the child mesh's `.visible` — so `mesh.visible = false` via `evaluate_script` is the loop-proof isolation toggle (the v3.2r close-out method, one child instead of three).
- **Naming:** new object `nameObject(..., 'rain-streaks')`; group stays `'depth-rain'`.
- **Bloom dark-swap:** per §1.3, with the archived capture pair.

**Acceptance criteria (all observable):**
1. Bloom-isolation capture pair pixel-identical (§1.3); zero console messages.
2. **Lean:** two archived captures at 1440×743 @ DPR 2 — rest wind vs. forced shear (`evaluate_script` sets the scroll velocity / `rainShear` to its ±0.6 clamp) — streak angle visibly tracks the velocity vector (measured ≥ 20° lean difference between the pair on any near-plane streak).
3. **Pools:** archived same-frame pair toggling `uWells` strengths → 0 via `evaluate_script`: with wells on, rain inside the Tokyo-halo footprint reads brighter than the dark-field corner; with wells zeroed, the field is uniform at the floor. (Qualitative pair + the numeric gates below; no invented ratio claims.)
4. **Net luminance:** §4.2 rain gates pass (interleaved on/off Δ median ≤ 0; same-session before/after medians; p50 8/7/9 hold).
5. **Perf:** §4.4 (fpsEMA, LITE trace).
6. Harness: rewritten checks green (§6), `node --check` clean, all 42 legacy checks still green.

### 3.2 v33b — M2: the scene answers its lightning (C-bundle: C1+C2+C3+C4+C5)

**WHAT:** the Toy Shop parameter-plumbing move — the flash the scene already fires (`updateLightning`, `background.js:1135–1153`) becomes a scene-wide illumination parameter. Five couplings, one event (§1.2):

- **C1 — flash → grade lift.** New uniform `uFlash` in `gradePass` (uniform block `:1835–1843`), applied as a pre-saturation exposure scale (`c *= 1.0 + uFlash` before step (3) of the shader, `:1867`). Driven per frame: `uFlash = LIGHTNING_GRADE_LIFT × env × max(0, 1 − max(sceneState.lockT, sceneState.wordT))` (suppression per §1.2 — includes arming the new `wordT` envelope in `__sceneFocus`). **`const LIGHTNING_GRADE_LIFT = 0.08`** — the research band is 0.05–0.10; the pinned law is `0 < LIGHTNING_GRADE_LIFT ≤ 0.10` by value (biasCap-style harness pin, §6). Kill = set `0.0` (one-const flip; documented in §5). High-tier only by construction (grade pass doesn't exist on LITE/reduced) — LITE unaffected.
- **C2 — directional rain response.** In M4's shader the strike already lives in well 3 (`:1336`, strength `flash × 0.9`): drops near the strike over-brighten via the per-drop falloff. The flat `+ (flash||0) * 1.3` term in `beat` (`:1341`) — today ONE shared expression serving both tiers — is **retired as a literal**: the high tier drops the flat coupling entirely (directional via well 3), and the surviving LITE coupling (no wells compiled there — without it, phone rain would stop answering lightning entirely) takes a distinct pinnable shape: a named **`const LITE_FLASH_BEAT = 1.3`** applied only in the LITE branch. Old literal pinned negative, new const pinned positive (§6).
- **C3 — limb catch.** GLOBE_ELEV limb shell (`limbMat`, `:958+`; uniforms at `:960`): new `uFlashLimb` uniform added to the rim intensity, driven `= flash × 0.25 × tokyoFacing` (`tokyoFacing` computed at `:2128`). Event-gated, decays with `env`; at rest the uniform is 0 and the shader output is unchanged. The `?globe=classic` sprite path (`:2160`) is untouched (recorded: it is the A/B–rollback path, not a shipping surface).
- **C4 — glass glint.** `droplets.update(dt)` gains a second argument (`:2188` call site): the frame's `flash`. In `drawDrop`, the specular highlight alpha (`:703`, currently `0.2 × a`) scales by `(1 + flash × 0.6)`, hard-capped at `0.32`. The **body/lens sample alpha cap `0.22` (`:690`) MUST NOT rise** — Toy Shop's translucency finding (drops go *more* transparent under lightning, never brighter-bodied) is the law here. NOTE: the `0.22` literal is **not currently harness-pinned** (the v3.2l check, `tools/verify-site-hardening.js:307–312`, pins the saturate/brightness filter only) — v33b's new pin adds it (§6); the plan author must not skip it on the assumption it already exists.
- **C5 — exponential flash gradient.** Reshape the sprite gradient (`:1122–1125`) from the roughly-linear 3-stop ramp to an exponential falloff (≥5 stops approximating `exp(−r/σ)`: near-white core dissolving into blue-black — rain brief Lever F part 1). Peak sprite opacity stays `env × 0.24` (`:1148`).

**Acceptance criteria:**
1. **Rest-state invariance:** with no flash live (`env = 0`), every touched surface is bit-equivalent to pre-M2 by construction (all couplings multiply by `env`); verified by the §4.1 medians (no rest-state motion of hero/projects/gallery medians beyond resolution).
2. **During-flash cap:** §4.3 — engineered-flash hero captures, p95 median ≤ **110**, grade-lift const pinned ≤ 0.10.
3. **One-signal (`wordT` co-occurrence):** scripted section change (e.g. home → about) during a forced flash — the state-word fires AND `uFlash` reads ≈ 0 while `sceneState.wordT` ≈ 1 (evaluate_script assertion archived); after the word's 1.9 s window, `uFlash` responds to a fresh flash again. Companion assertion: `wordT` arming a section change moves NO other channel (rain `beat`, wells, `haloPulse` unchanged vs a pre-M2 section change — no behavioral regression smuggled in via the new envelope). The home/boot `lockT` beat still suppresses too (gate uses `max(lockT, wordT)`).
4. **Directionality (archived, with a numeric fallback):** forced strike at `sp.position.x = ±14` (`:1142`) — capture pair shows near-strike rain flaring hardest, far-field barely reacting. Fallback observable if the eye-read is contested: mean luma (`frame-luminance` over crops) of a fixed ~200×200 px patch centred on the strike's screen x vs the mirrored far-field patch, across the flash-on/flash-off pair — the near-strike patch delta MUST exceed the far-field patch delta. Before/after C5 flash captures archived.
5. Zero console; harness pins green (§6); LITE visually unchanged except the (kept) flat flash beat.

### 3.3 v33c — M3: droplet-glass v2 — merge + trail beads (R2, bokeh CUT)

**M3's resolved fate (the conditional, resolved with code evidence):** the 2D droplet canvas **DOES run on mobile/LITE** — `const cap = LITE ? 12 : 24` (`background.js:651`) and `REFRACT = !LITE` (`:652`): phones get 12 beads (gradient body + highlight, no frame sampling), and only `reduced` kills the IIFE (`:647`). **Therefore M3 has standalone mobile value and SHIPS in the M slice**, on the shared IIFE (both tiers) — it is exactly the glass that keeps living where M10 will never reach. After v33f lands (RIVULET_GATE ON, high tier), the IIFE is LITE-scoped and M3 continues as LITE's glass. **If the owner kills M10 at its gate, desktop reverts to this M3-elevated canvas — the fallback is pre-built, zero extra work.** (Had the canvas been desktop-only, M3 would have been fallback-only, built only on an M10 kill; code says otherwise, so it is not.)

Binding requirements:
- **Merge:** O(n²) pair check at n ≤ 24 (≤ 276 pairs at the existing ~30 fps half-rate, `:710`): overlapping beads absorb radius²-conserving (area-conserving — total glass coverage cannot grow from a merge); survivor jitters and briefly accelerates. Works at n = 12 (LITE).
- **Trail beads:** a running drop (`state === 'run'`, `:741–748`) spawns 1–3 tiny static beads along its wobble path; they fade via the existing `destination-out` decay (`:726–728`); trail beads are strictly smaller than the parent and count against the same `cap`.
- **CUT — emitter bokeh (correction of record #2):** the enhancement brief lists bokeh in M3. It is non-LITE-only (needs wells) and its home — the desktop canvas — is scheduled for retirement by v33f **in this same campaign**. Building it to delete it violates subtract-to-add. Bokeh is cut from M3, recorded here; if M10 dies at its gate, bokeh becomes a legitimate future desktop lever again (deferred, not closed).
- **Caps:** bead cap unchanged (24/12); the merged-survivor radius clamps at the current max spawn envelope so peak coverage cannot exceed today's.

**Acceptance:** archived 3-frame sequence showing a merge event (two beads → one, survivor wobble) and a run with trail beads, desktop AND 390×844 LITE emulation; hero rest medians unmoved (§4.1 — merging *reduces* live bead count; ≈ 0 by construction); bead-cap assertion in code; zero console.

### 3.4 v33d — M5: hero choreography on WAAPI (zero bytes)

**WHAT:** rebuild the hero-entrance sequencing on `Element.animate()` — real lifecycle semantics (cancel/finish/fill) instead of `setTimeout` ladders with hand-built safety nets. Zero dependencies (the settled framework verdict).

**Scope fence — exactly what migrates:**
- `runStagger` (`app.js:55–72`): per-char inline `style.transition`/`transitionDelay` + double-rAF kick → one `span.animate([...], { duration, delay: li*280 + ci*45, easing: var(--ease-out)'s cubic-bezier, fill: 'both' })` per char. Same offsets, same curves. **[AMENDED 2026-07-14: `fill: 'both'` was a spec defect (deviation D2 of record) — a fill-held final `transform: 'none'` serializes as `matrix(1, 0, 0, 1, 0, 0)`, so this section's own acceptance-2/chOk criterion can never pass as written; shipped is `fill: 'backwards'` (js/app.js runStagger), which ceases on finish and releases the chars' natural computed styles — `.superpowers/sdd/v33/task-v33d-report.md` F2, and the matching amendment at plan Step 5.]**
- `runChromatic` (`app.js:74–86`): clip-path transition + double-rAF + nested `setTimeout` fire-class → `line.animate()` for the clip wipe; the `fire` class rides `animation.finished`.
- `runDecrypt` (`app.js:45–53`): the `li * 230` `setTimeout` stagger → WAAPI-sequenced starts (or `delay` on a zero-duration marker animation whose `finished` fires the scramble). **The scramble engine itself does not migrate** — see fence below.
- `runHero` (`app.js:100–110`): `setTimeout(typeSub, 700)` → sequenced off the entrance timeline (same 700 ms beat, now a named constant in one place); `heroSettleTimer`/`settleHero` (`app.js:25–43, 108–109`) **DELETED** — interruption safety becomes structural: `runHero()` cancels every tracked `Animation` (one `anims[]` array, `anims.forEach(a => a.cancel())`) before starting, and end-states are owned by `fill: 'both'`. **[AMENDED 2026-07-14: shipped end-states are owned by the animation lifecycle — `fill: 'backwards'` ceases on finish, releasing the natural styles; `fill: 'both'` is the D2 spec defect, see the marker on the `runStagger` bullet above.]**

**Scope fence — what does NOT migrate (binding):**
- `window.scramble` (`effects.js:25–51`) and its two nets — the token guard (`:29`, `:36`) and the wall-clock settle cap (`:49`). **Correction of record #3:** the enhancement brief counts "all three safety nets" in M5's retirement ledger. Code says two of the three live inside the scramble engine, which also serves the language swap (`app.js:121–125`) and the one-shot coord decrypt (`effects.js:101–104`) — surfaces M5 does not touch — and rAF-driven `textContent` animation has no WAAPI equivalent. They stay. M5's honest ledger: the ladders + `settleHero` net + inline-style plumbing, ≈ 45–55 lines. (Decrypt-variant blank-title safety is already guaranteed by scramble's own wall-clock cap, `dur + 400` — `settleHero` was redundant there.)
- `typeSub` (`app.js:88–98`): the 26 ms typewriter is a `textContent` animation; WAAPI cannot express it without markup surgery. Stays, recorded.
- The occasional hero glitch interval (`app.js:487–493`), boot.js, cursor.js: untouched.
- **No scene channel is ever driven from DOM choreography** (the framework-verdict law guard, held for WAAPI too).

**What must not change visually (acceptance):**
1. **Beat parity:** line stagger 230 ms (decrypt) / 280+45 ms (stagger) / 180–200 ms (chromatic), sub at 700 ms — asserted as constants in the new sequencer; total entrance duration within ±1 frame of today (compare screen-recordings or timestamped console marks, archived).
2. **End-state equality (byte-comparable where feasible):** after settle, for every `.line`: `getComputedStyle` opacity `1`, transform `none`, `textContent === dataset.line`; identical assertions pass on the pre-M5 build. Run for all three variants via the deck switcher.
3. **Interruption torture:** switch hero variants from the deck 10× rapidly mid-entrance — title lands correct every time, zero console errors, no orphaned inline styles (`line.style.cssText === ''` or fill-managed).
4. **Hidden-tab torture:** start entrance, hide tab 5 s, return — title settled (WAAPI runs on the document timeline through throttling; decrypt covered by scramble's wall-clock net).
5. **Reduced-motion:** `runHero()`'s reduced path (`app.js:102`) byte-identical — instant text, `typeSub` instant path, zero animations created.

### 3.5 v33e — M6: CSS scroll-driven animations as progressive enhancement

**Scope fence — exactly which CSS/JS migrates (grounded in a census of the tree):**
- **`data-parallax` — exactly ONE element exists:** the about portrait, `index.html:170` (`data-parallax="0.06"`), driven per scroll-frame by `effects.js:123–130` (`translate3d(0, -center*speed, 0)`). Migrates to `animation-timeline: view()` with `animation-range: cover 0% cover 100%` and keyframes reproducing the linear formula — sign per `effects.js:126–128` (element entering at the viewport bottom → `center` positive → translateY NEGATIVE): cover 0% → `translateY(calc((50vh + 50%) * -0.06))`, cover 100% → `translateY(calc((50vh + 50%) * 0.06))`. Translate percentages resolve against the element box, so the expression is exact, not approximate.
- **`.scroll-progress`** (`index.html:73`, CSS `site.css:397`, JS width write `effects.js:120`): migrates to a `scaleX` transform animation on `animation-timeline: scroll(root)` (transform-origin left) — the canonical `scroll()` case; compositor replaces a layout write on the hottest path.
- **View reveals do NOT migrate (binding ruling):** the reveal system is **fire-once** — `.seen` is added and the element spliced out forever (`effects.js:95`); SDA is bidirectional by construction (scrolling back up reverses the animation; no pure-CSS way to latch completion). Migrating would replay reveals on every scroll-direction change — a motion-law regression (design-language §4.6 "animate the focus only"; reveal-once is the shipped idiom). The JS threshold path (`checkReveals`) remains the only reveal driver on ALL browsers. The alternative (SDA reveals with `animation-range: entry`, accepting replays) is considered and REJECTED here so it never resurfaces. Same ruling for nav/section-detect/state-word — threshold events, not scroll-linked values.

**Binding requirements:**
- All SDA rules live in one `@supports (animation-timeline: view())` block in `site.css`; **the JS fallback keeps today's path** and the two sides never double-drive: `effects.js` gates its parallax loop and progress write on `!CSS.supports('animation-timeline: view()')` (one boot-time check, mirrored — the pinned shape, §6). Firefox stable (flag off as of Fx 152) takes the JS path unchanged; Chrome/Edge/Safari take the compositor.
- Firefox's non-zero `animation-duration` requirement honored (any positive duration; progress comes from the timeline).
- Reduced-motion: explicit `animation: none` for both migrated elements inside the reduced block (§1.5) AND the JS fallback keeps its existing `reduced` guard (`effects.js:123`).

**Acceptance:**
1. **Computed-style parity:** at ≥3 scroll positions (element entering / centered / leaving), `getComputedStyle(portrait).transform` translateY under SDA matches the JS-fallback value within 1 px (compare Chrome-SDA vs the same build with the `@supports` block disabled via devtools, and/or vs Firefox). Progress bar visual width within 1 px of `y/max`.
2. **No double-drive:** on an SDA browser, `effects.js` writes neither `transform` on the portrait nor `width` on the progress bar (assert via a MutationObserver probe in the QA session, archived).
3. **Reduced-motion:** §1.5 test — zero movement on scroll sweep.
4. Zero console on both engines; harness pins green.

### 3.6 v33f — M10: rivulet-glass grabpass (R3) — its own late slice, behind RIVULET_GATE

**WHAT:** the only proposal that earns the word "simulation": a 64×64 GPGPU drop-state sim (gravity, hang-and-burst runs, collision-merge, evaporation — the raindrop-fx model) splatted as SDF metaballs whose smooth-min merges produce real menisci, deriving normals from the SDF and **refracting the already-rendered graded frame** — a true grabpass, zero texture uploads (never the raindrop-fx image-background API, which would force per-frame canvas re-upload).

Binding requirements:
- **Machinery:** vendor `examples/jsm/misc/GPUComputationRenderer.js` from the **r158 tag exactly** into `js/vendor/three-0.158.0/examples/jsm/misc/` (import via the existing `three/addons/` map; byte size recorded in the commit message). Loaded by dynamic `import()` ONLY when `RIVULET_GATE && quality.name === 'high' && !reduced` — LITE/reduced never fetch it.
- **Slot:** one `ShaderPass` in `finalComposer` after `gradePass`, before `caPass` (chain at `background.js:1913–1917`) — drops refract the graded world and still receive the lens fringe. Alpha-preserving (centre-tap alpha, the `caPass` convention `:1896–1903`); `NoBlending`.
- **Restraint numbers (pinned):** ≤ **200** live drops; `uCoverageMax = 0.05` — total splatted SDF footprint ≤ 5% of frame area, enforced in the sim (spawn throttles against the running coverage sum) and harness-pinned by value; refracted-sample added-luma clamp keyed to the existing **0.22** glint law (shader clamp — a drop may never add more luminance than the 2D bead it replaces was allowed).
- **Retirement:** per §1.1 — on high tier with the gate ON, the droplets IIFE allocates/draws nothing (early return before canvas/context/listener setup, HALO_GATE discipline). LITE keeps the M3-elevated canvas. **The two-implementations-alive cost is recorded and routed to the owner at the gate** (the research's alternative — delete LITE glass entirely — remains a one-line owner call either way; this spec ships the tier-split because M3's mobile value is real, §3.3).
- **Budget:** +8–12% postFX fill (research number, desktop) — bounded by the fpsEMA gate (§4.4).

**Acceptance:**
1. **Luminance:** interleaved pass-on/off pairs (uniform/flag toggle via `evaluate_script`, same frame phase), hero mean pairwise Δ median ≤ 0 (letter criterion; refraction redistributes, must not add); p50 floors hold; coverage uniform readback ≤ 0.05.
2. **Perf:** fpsEMA gate §4.4 on the high tier; LITE trace unchanged (it never loads the module — verify zero extra requests in the network log).
3. **Simulation read (archived):** 5-frame sequence showing a hang-and-burst run and a collision-merge meniscus; a capture over the globe limb showing refraction of real scene content.
4. **Taste gate:** this is the owner's Splurge — ships ON for the live verdict (§5); the gate-pile entry pairs the ON captures with the M3-fallback (gate OFF) captures.
5. Zero console; dark-swap not applicable (post-pass, not a scene object) but the pass must not break the bloom-isolation captures (re-run the §1.3 pair with the pass on).

### 3.7 v33g — close-out

Full §4 measurement suite vs the v33a pre-campaign baseline + the v3.2r inherited context; letter-criterion verdicts reported as-measured (v3.2r style — no renaming, no averaging away); gate-pile addendum assembled (§8); harness full-suite + `node --check` on all touched JS; desktop 1440×743 + mobile 390×844 + reduced-motion sweeps with zero console. **The campaign stops here — no push, no PR, until the owner rules on the pile.**

---

## §4 — Measurement contract (every number is binding)

**Common procedure (inherited §8b/v3.2r — reproduce exactly):** `http://127.0.0.1:8765/index.html` (python3 http.server from repo root); ONE tab, stale QA tabs closed; viewport **1440×743 CSS px @ DPR 2** via device-metrics emulation (2880×1486 captures — byte-geometry-identical to the baseline sets); **fresh hard-reload (`ignoreCache`) before every capture**; 11 s settle post-boot and post-scroll; scroll landing verified via `evaluate_script` before every capture; statistic = per-metric **median of 5**, spreads reported; `node tools/frame-luminance.mjs <png>`; viewport + DPR + cache-busts recorded per capture set; zero console messages per session. Frames archived git-ignored under `docs/superpowers/gates/v33/`. **fpsEMA readings are a SEPARATE session on `?sceneDebug=1`** — `window.__sceneDebug` only exists behind that flag (`background.js:1579`; `fps` is `Math.round(fpsEMA)`), and the debug overlay changes pixels, so luminance captures stay on the plain URL, never mixed.

### 4.1 Floors and rest-state medians (every task that touches pixels: v33a, b, c, f)
- **p50 floors MUST hold: hero 8 / projects 7 / gallery 9** — any capture set violating a floor fails the task outright (not gate-pile material; a build error).
- Task v33a captures the **pre-campaign baseline** (same session as its after-set, pre/post via git stash or checkout — the v32n same-session method): 5-frame medians for hero/projects/gallery, all four metrics. Later tasks compare against this set; the v3.2r close-out numbers are provenance context.
- Rest-state deltas: reported as measured; anything within the documented per-frame spread (hero σ ≈ 0.4–1.2, projects ≈ 1.17, gallery ≈ 0.72) is marked *below resolution* and never cited as a real change (§1.4).

### 4.2 Rain gates (v33a, and re-run at v33g)
- **Interleaved same-frame A/B:** 5 pairs, `rain-streaks` mesh `.visible` toggled per pair via a captured scene reference (§3.1's loop-proof lever), matched settle (post-11 s), 1440×743 @ DPR 2. **Median pairwise Δ (on−off) ≤ 0.** The current build's bar is **−0.01**; a Δ in (0, resolution) fails the letter and routes to the gate pile with the variance analysis attached (v3.2r precedent) — it is not silently passed.
- **Cross-build:** same-session pre/post hero medians (4.1) — hero mean must not rise beyond resolution.
- The 2D droplet glass stays live in BOTH arms of every rain A/B (it is rain-keyed; isolating only the WebGL rain is the sanctioned method).

### 4.3 During-flash gates (v33b)
- **Pinned capture phase.** The envelope `env = sin(k·π·3)·(1 − 0.7k)` decays at `dt × 2.4` (`:1145–1147`) — it double-peaks (≈ 0.88 at ~70 ms post-trigger, ≈ 0.42 at ~350 ms) and is gone in ~420 ms; an unpinned "capture during flash" would sample arbitrary phases. Binding phase = **the first peak, env ≈ 0.88, held steady**: v33b ships a sceneDebug-gated test hook (`window.__forceFlash(hold)`, allocated only under `?sceneDebug=1` — the `__sceneDebug`/`__scanPlace` precedent) that holds `L.t = 5/6` per frame so `env` sits at its worst-case ≈ 0.88 for the capture set. 5 captures at the held peak; strike x fixed per capture set and recorded.
- **Feasibility control (mandatory, same session):** a control arm with `uFlash` forced to 0 — same held envelope, sheet-lightning sprite (`env × 0.24`, `:1148`) and per-drop rain response live. The dominant during-flash luma is that PRE-EXISTING sprite, so: **the ≤ 110 cap binds v33b only if the control arm passes ≤ 110**; a control-arm fail is routed to the gate pile as pre-existing flash luminance, not a v33b task-fail (the with-lift arm must then stay within the multiplicative bound of the control, ≤ control × 1.10).
- **Hero during-flash p95 median ≤ 110** (below gallery's saturated photo tail 120; comfortably an *event*, never a photo-class highlight) with `LIGHTNING_GRADE_LIFT` at its shipped value, given the control passes.
- **`LIGHTNING_GRADE_LIFT ≤ 0.10` pinned by value** in the harness (§6). If the p95 cap fails at 0.08 while the control passes, the constant tunes DOWN, never the cap up.
- Grade-lift isolation: same-frame `uFlash`-forced on/off pair (the two arms above, interleaved) confirms the lift is the multiplicative bound and nothing else moved.
- Rest-state: §4.1 medians unmoved (all couplings decay to zero with `env`); the `__forceFlash` hook must be inert (unallocated) without `?sceneDebug=1`.

### 4.4 Performance gates (v33a, v33f; spot-check at v33g)
- **fpsEMA, high tier:** median of 5 readings of `__sceneDebug().fps` (`?sceneDebug=1` session per §4 note; 30 s settle, hero at rest) **≥ baseline median − 2 fps**, same machine, same session. **v33a:** baseline arm = pre-M4 build in the same session (the §4.1 stash method). **v33f:** the two arms are **same-session rivulet pass enabled vs disabled** (the §3.6 acceptance-1 lever — pass `.enabled`/uniform toggle via the debug hook), never a cross-session baseline.
- **Mobile LITE strictly cheaper or unchanged:** v33a deletes the CPU loop and halves draw calls (structural); verified by a v32n-method trace (412×823 @ DPR 1.75 mobile+touch, 4× CPU, Slow 4G, warm regime, ≥3 runs, medians) — **warm-regime LCP parity** with baseline (the 257 ms class; cross-regime comparisons are banned per the v32n finding). v33f: LITE network log shows zero new requests.
- Byte ledger reported per commit (`wc -c` deltas; v33f additionally the vendored GPUComputationRenderer size).

### 4.5 Choreography gates (v33d, v33e)
Not luminance-gated (no emissive change): the M5 parity/torture suite (§3.4) and M6 computed-style parity + no-double-drive + reduced-motion proofs (§3.5), all archived.

---

## §5 — Flags and gate policy (house idiom: `HALO_GATE`/`RAIL_GATE`, app.js:323/:342)

| Const | Home | Ships | Kill switch | Rationale |
|---|---|---|---|---|
| **`RIVULET_GATE`** | `js/background.js` (scene-side, unlike the DOM gates — the pass lives there) | **`true`** | flip to `false` + `?v=` bump: dynamic import never fires, droplets IIFE's high-tier early-return deactivates, **desktop reverts to the M3-elevated canvas** — a one-const flip with a pre-built fallback | owner said *build it*; the taste verdict needs the real thing live on the board. HALO_GATE discipline: with the gate false, nothing is allocated, fetched, bound, or drawn |
| **`LIGHTNING_GRADE_LIFT`** | `js/background.js` | `0.08` | set `0.0` (couplings C2–C5 are independently revertable per-commit) | a tuning constant doubling as the C1 kill; pinned `≤ 0.10` by value |
| M4 | — | **no flag** | `git revert` of `feat(v33a)` | a flag would keep the three Points layers alive in the tree — violating the retirement law. Strict replacements don't get flags |
| M5/M6 | — | no flag | M6 self-gates via `@supports` + the `CSS.supports` handoff (the no-SDA fallback IS today's path); M5 reverts by commit | |
| `HALO_GATE`/`RAIL_GATE` | `app.js:323/:342` | stay `false` | — | untouched by this campaign |

**M9-style items are NOT in scope:** Package L (M7 wet-ground band, M8 grid-ripple, M9 bloom-streak shafts) was deferred by the owner's package selection — recorded in §9, no flags reserved, no code built.

---

## §6 — Harness plan (`tools/verify-site-hardening.js` — 42 checks today; update-with-feature, never delete)

**Checks that MUST be rewritten in the same commit as the feature (their current regexes pin the retired shapes):**
- `depth rain renders as camera-space parallax particle layers` (`:110–114`): drop the `/rain-layer-/` expectation; keep `makeDepthRain`, `'depth-rain'`, `camera.add(group)`, `reduced ? null : makeDepthRain()`; add the `'rain-streaks'` instanced shape. *(v33a)*
- `v3.2l — rain is motivated light, not a flat veil` (`:307–312`): the terminal-opacity formula moves into GLSL — re-pin as: `MOTIV_FLOOR`/`MOTIV_CAP` uniforms initialized at **0.16/0.80 by value**, the shader's `min(uMotivCap, uMotivFloor + m)` form, `RAIN_LITE_VEIL` 0.55, and the surviving `saturate(0.5) brightness(0.9)` droplet filter. *(v33a)*

**New pins (named per task; one check may bundle a task's pins):**
- **v33a** `v3.3a — rain is ONE instanced batch; the Points planes and the CPU loop are retired`: positive — `InstancedBufferGeometry`/instanced mesh named `rain-streaks`, `uWells`, `uWind`, GPU recycle (`mod(`-form), dark-swap handling for the instanced mesh, `renderOrder = 3` carried; **negative (deleted symbols)** — `/rain-layer-/`, `/makeStreakTexture\(d\.len, d\.head\)/`, the `ud.speeds` per-frame walk, the CPU recycle branch (`p[i * 3 + 1] < -ud.halfH` inside updateDepthRain). Rain absent from the bloom emitter set (no `userData.bloom` on rain — pinned).
- **v33b** `v3.3b — the scene answers its lightning as ONE event`: `LIGHTNING_GRADE_LIFT` extracted by value, `> 0 && <= 0.10` (biasCap idiom, `:318–328`); the suppression term present in the uFlash drive in its `max(sceneState.lockT, sceneState.wordT)` shape (regex on `1 - Math.max(sceneState.lockT, sceneState.wordT)` or the equivalent shipped form); **positive pin on the `wordT` arming line** (`sceneState.wordT = 1` inside `__sceneFocus`, home-excluded shape) and on its `dt / 1.9`-class decay; `uFlashLimb` in the limb shader; the droplet body cap `0.22` literal AND the glint cap `0.32`; **positive** — `LITE_FLASH_BEAT` const in the LITE-only branch; **negative** — the old shared literal `(flash || 0) * 1.3` gone entirely (no self-contradiction: the surviving LITE coupling lives under the new const name, so the old literal can be pinned MUST-NOT-MATCH).
- **v33c** `v3.3c — droplet glass merges and trails, cap unchanged`: merge pair-check + trail spawn shapes present; `cap = LITE ? 12 : 24` unchanged.
- **v33d** `v3.3d — hero choreography is WAAPI with structural interruption safety`: positive — `.animate(` in app.js, the `anims`-cancel-before-start shape; **negative** — `heroSettleTimer`, `settleHero`, `setTimeout(typeSub, 700)` gone; scramble token guard + wall-clock net still present in effects.js (pinned POSITIVE — they must survive M5).
- **v33e** `v3.3e — scroll-driven animations behind @supports with a truthful JS fallback`: `@supports (animation-timeline` block in css; `animation-timeline: scroll(` and `view()` present; `CSS.supports('animation-timeline` gate in effects.js; explicit `animation: none` for the migrated elements in the reduced-motion block.
- **v33f** `v3.3f — rivulet grabpass is gated, clamped, and the desktop 2D canvas is retired behind it`: `RIVULET_GATE` const present; vendored `GPUComputationRenderer.js` exists on disk; dynamic `import(` gated on the const + high tier; `uCoverageMax` extracted by value `<= 0.05`; the refraction luma clamp keyed to `0.22`; the droplets IIFE high-tier early-return shape.

Every commit: harness exit 0, count strictly ≥ previous, `node --check` on all touched JS.

---

## §7 — Version / cache-bust rules (rule of record from `2afddcc`)

- **Any `?v=` value ever published from main is BURNED** for a file whose bytes differ — never reassign it, even after reverts. Main has served (at `a2bca72`): `site.css?v=3.28`, `boot.mjs?v=20`, `V = { bg:'5.3', boot:'3.1', cursor:'3.1', fx:'3.7', app:'4.1' }`. Branch HEAD sits above or equal: `site.css?v=3.29`, `boot.mjs?v=23`, `V = { bg:'5.6', boot:'3.1', cursor:'3.1', fx:'3.7', app:'4.2' }` (`index.html:28/:438`, `js/boot.mjs:17`).
- **Rule:** every touched user-facing file bumps its value **monotonically from branch HEAD** in the same commit — first css touch → `3.30`, first background.js touch → `V.bg '5.7'` (which also bumps `boot.mjs?v=` → `24`, since the V map lives in boot.mjs), first effects.js touch → `V.fx '3.8'`, first app.js touch → `V.app '4.3'`, and so on per commit. Before assigning, confirm the value has never appeared in main's history for that file (`git log main -- index.html js/boot.mjs`). Monotonic-from-branch satisfies the burn rule by construction; the check is the guard against future main drift.

---

## §8 — Commit plan

One commit per task, **no push**, Fable trailer per house style (`Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`):

1. `feat(v33a): instanced velocity-stretched rain — per-drop wells, GPU recycle; Points planes + CPU loop retired`
2. `feat(v33b): lightning is a scene parameter — grade lift (word/lock-suppressed), directional rain, limb catch, glint, exp falloff`
3. `feat(v33c): droplet glass v2 — bead merge + trail beads (both tiers; bokeh cut, recorded)`
4. `feat(v33d): hero choreography on WAAPI — ladders + settle net retired, interruption safety structural`
5. `feat(v33e): scroll-driven animations behind @supports — parallax + progress to the compositor, JS fallback truthful`
6. `feat(v33f): rivulet-glass grabpass behind RIVULET_GATE — 64×64 GPGPU sim, SDF metaball refraction; desktop 2D glass retired`
7. `docs(v33g): close-out — measurements vs pre-campaign baseline, letter verdicts, gate pile`

The campaign **stops at the v33g gate-pile addendum** for the owner's verdict. Gate pile contents (minimum): (1) M10 keep/kill with ON-vs-fallback capture pairs + the LITE double-implementation note; (2) M2 during-flash feel — flash capture set + the p95 numbers; (3) any letter-criterion fails, reported as measured; (4) the M6 parallax parity captures; (5) anything an implementer flags as taste-ambiguous mid-pass; (6) the deferred-Package-L reminder (owner questions 1–4 of the enhancement brief remain open); (7) **the M1 scrub-feel constant (enhancement-brief open question 6, otherwise unrouted):** shipped τ ≈ 0.125 s (`dt * 8`, `background.js:2052`) sits between the brief's snappier (≈ 0.14) and cinematic (≈ 0.08) taste options — the owner picks live on the board; a retune is a one-const change, out of this campaign's build scope.

---

## §9 — Out of scope / deferred / closed (recorded so nothing resurfaces silently)

- **Landed, not in scope:** M1 scroll scrub (`3b49a5d`).
- **Deferred (owner-sequenced, NOT closed):** Package L — M7 wet-ground band + splash landings (carries the lightning-sprite retirement pairing with it), M8 grid-ripple, M9 bloom-streak shafts. Flag-first in a later slice, owner board verdict; enhancement-brief questions 1–4 stand.
- **Cut within scope (this spec):** M3 emitter bokeh (§3.3, correction #2) — deferred, revivable only if M10 dies.
- **Closed doors (do not repropose — numbers in the research docs):** true fluid sim (R6: FLIP/SPH/stable-fluids/WebGPU compute — 10–100× cost class, engine rebuild); SSR (`SSRPass`/0beqz — no depth to march); raymarched volumetrics / three-good-godrays (no lights/shadow maps/pmndrs here); always-on city-glow limb (failed-gate precedent, ships OFF); caustics (no diegetic anchor); GSAP ScrollSmoother/Lenis (break every `position: fixed` surface); renderer migration off r158; soft particles / depth-fade (no occluders by design).
- **Framework verdict:** settled NO (header). anime.js re-entry condition stays recorded in the research doc; it is not a v3.3 concern.
- **Law guard:** nothing here reopens the closed motion deferrals (ghost-echo, per-letter, idle marks — law addendum §5) or the pinned negatives (§4 of the addendum).
- **Owner-data debts (unchanged):** photo→city label verification; per-project geo/districts; GALLERY_PLACES coords.

## §10 — Corrections of record (this spec vs the enhancement brief)

1. `makeStreakTexture` is NOT fully retired by M4 — the shooting star consumes it (`background.js:1059`); only the three rain call sites go (§1.1).
2. M3's bokeh sub-move is cut — non-LITE-only, and its home is scheduled for retirement by M10 in this same campaign (§3.3).
3. M5 retires the ladders + ONE net (`settleHero`), not "all three" — the scramble token guard and wall-clock cap serve the lang swap and coord decrypt and MUST survive (§3.4, pinned positive).
4. M6's "view reveals" do NOT migrate — fire-once semantics (`effects.js:95`) are unexpressible in bidirectional SDA; replay-on-scroll-up would violate motion law §4.6. Parallax + progress migrate; reveals stay JS on all browsers (§3.5).
