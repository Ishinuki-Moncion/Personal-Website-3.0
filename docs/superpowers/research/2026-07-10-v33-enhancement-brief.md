# v3.3 Enhancement Brief — Rain, Light, Motion (owner options)

**Date:** 2026-07-10. **Status:** synthesis of three same-day research tracks — no code written. This brief seeds the v3.3 design session.
**Inputs:** [`2026-07-10-rain-liquid-sim-options.md`](2026-07-10-rain-liquid-sim-options.md) (R1–R6) · [`2026-07-10-light-sim-options.md`](2026-07-10-light-sim-options.md) (families A–E) · [`2026-07-10-animation-framework-options.md`](2026-07-10-animation-framework-options.md) (options A–D).
**Grounded against canon:** `../specs/2026-07-03-north-star.md` ("light is an event"; "instrument only the focus"), `../specs/2026-07-03-design-language-v3.md` (§2 rain, §4 motion, §6 grade), the rain + motion elevation briefs, and `../specs/2026-07-08-v32-law-addendum.md` — the law of record: deep-black floor `#05060a`, section p50 luminance floors **8/7/9**, §8b baselines + the variance law (medians of ≥5 interleaved frames or same-frame A/B toggles, never single frames), pinned negatives, closed deferrals.
**Owner asks answered:** (1) "the rain could be improved further… light simulation or liquid simulations with the rain" — §§2–3; (2) improve flow and animations — §§2–3; (3) "explore frameworks like anime.js and GSAP" — answered directly in §5.

---

## 1. Executive read (one page)

Five findings, then the shape of the answer.

1. **The scroll-globe jank is a four-line filter, not a missing framework.** The scene loop feeds raw `scrollN` into globe spin, camera dolly, look-at, and grid phase while smoothing camera height — three channels snap, one lags, the composite shears. The identical one-pole ease already smooths nine other state channels in the same function. ScrollTrigger's celebrated `scrub: 1` *is* that filter, at 46 KB gz.
2. **True liquid simulation is closed, with numbers.** FLIP/SPH/stable-fluids are a 10–100× cost-class jump (David Li's reference FLIP consumes a desktop iGPU's whole frame budget; the modern WebGPU compute-rain path requires migrating off the r158 pin and rebuilding the two-composer bloom — an engine rebuild, not an effect). But the **look** of liquid — merge, rivulets, velocity-stretched streaks, splashes, ripples — is parametric and cheap. The door is recorded shut so it never resurfaces as an additive temptation.
3. **"Light simulation" here is parameter plumbing, not new rendering.** The scene already renders the two textures any light sim needs (the graded frame; the emitters-only bloom target — a ready-made "light sources only" buffer) and already computes ≤3 motivated-well positions per frame. The whole scene can start answering its own lightning for a handful of uniforms. Prior art is exactly this shape (ATI Toy Shop: lightning as a global parameter piped into every material, "negligible cost").
4. **The best single move on the board is subtractive.** Replacing the three `THREE.Points` rain planes with one instanced, velocity-stretched streak batch retires 3 scene objects into 1, deletes the per-frame CPU loop over 470 drops, fixes the one visible cheapness tell (streaks that slide sideways without leaning — baked 10° sprite vs 30° wind shear), and completes the rain brief's Lever A (per-drop motivated light) and Lever F (directional lightning) in the same shader. Luminance is neutral-or-negative *by construction*: the terminal opacity formula carries over verbatim, and per-drop wells concentrate the same budget into smaller pools.
5. **Frameworks: decline, both.** GSAP is the wrong shape for a no-bundler, fixed-canvas, own-clock site (§5). anime.js v4 is the only candidate that fits the architecture — and still loses to zero-byte platform answers (WAAPI, CSS scroll-driven animations) for everything on today's list. The bytes ledger never balances (29–46 KB in vs ~1.5 KB of bespoke code out); it could only ever balance on maintainability, and only after the zero-byte version has been felt and found wanting.

**The shape of the answer:** three composable packages (S ⊂ M ⊂ L, §3), every one net-subtractive or layer-neutral, every added photon event-gated on beats the scene already owns (lightning flash, haloPulse, lockT). All hold the p50 floors 8/7/9 by construction and are proven by §8b-method gates. The measured bar is already set: current hero rain's rest contribution to frame mean is **below measurement resolution** (interleaved A/B median Δ −0.01) — elevations may redistribute rain light but must keep net ≈ 0 at rest.

**Recommendation (§4): build Package M as the v3.3 slice.** Zero new dependencies, net scene objects −2, CPU work deleted, the rain finally leans and pools, the world answers its lightning. Hold Package L's visible additions for an owner board verdict; the rivulet-glass splurge only on explicit appetite.

---

## 2. The unified move list (cross-track dedupe)

The three tracks converged on the same ground from different sides: rain **R1** and light **B1/B2 + C2** are one shader move; rain **R4** and light **E1** are one canvas move. Deduped:

| # | Move | From | What it is | Class |
|---|------|------|------------|-------|
| M1 | Scroll scrub | anim A | one-pole `smoothScrollN` filter feeding spin / dolly / look-at / grid (the four raw channels) | S |
| M2 | Lightning plumbing | light C1+C3+C4+C5 | flash→grade lift · limb catch toward Tokyo · glass glint · exponential flash gradient | S |
| M3 | Droplet-glass v2 | rain R2 | bead–bead merge + trail beads on the existing 24-bead canvas (+ optional emitter bokeh) | S |
| M4 | Rain rebuild | rain R1 = light B1/B2 + C2 | one instanced velocity-stretched streak batch, GPU recycle, per-drop wells, directional lightning response | M |
| M5 | Choreography truing | anim A | hero entrance rebuilt on WAAPI (`el.animate`) — real lifecycle semantics, zero bytes | S |
| M6 | CSS scroll-driven animations | anim B | `data-parallax` + view reveals on `animation-timeline: view()/scroll()` behind `@supports`, JS fallback retained | S |
| M7 | Wet-ground band + splash landings | rain R4 = light E1 | flipped/smeared/dimmed emitter reflections in a bottom band + pooled splash rings; **retires the sheet-lightning scene sprite** | M |
| M8 | Grid-ripple landing | rain R5 | one live `frac`-ring in the synthwave-grid shader when a splash fires | S |
| M9 | Bloom-streak shafts | light A-bloomstreak | 8–16-tap radial streak over the existing emitters-only bloom target, strength 0 at rest, beat-keyed | M |
| M10 | Rivulet-glass pass | rain R3 | `GPUComputationRenderer` drop sim + grabpass metaball refraction; **retires the entire 2D droplet canvas** (high tier) | L |

**Closed doors (do-not-repropose, recorded with numbers in the tracks):** true fluid sim (R6 — FLIP/SPH/stable-fluids/WebGPU compute); SSR (`SSRPass`/0beqz — this scene writes no depth, nothing to march); raymarched volumetrics / `three-good-godrays` (need lights + shadow maps + a pmndrs dependency — none exist here); **always-on city-glow limb** (a halo variant already failed the luminance gate and ships OFF — precedent stands); caustics (no diegetic anchor); GSAP ScrollSmoother / Lenis (break every `position: fixed` surface: nav, HUD, state-word, lightbox, the canvas itself; AT cost); renderer migration off r158.

---

## 3. Option menu — three packages + one splurge

Packages compose strictly: **S ⊂ M ⊂ L.** Every item ships behind its own gate; any item can be killed on the board without unwinding the others.

### Package S — "True the flow; the scene answers its lightning" (M1 + M2 + M3 + M5)

- **What it adds:** nothing visible at rest. Scrolling stops shearing (M1, τ tuned ≈ ScrollTrigger `scrub` 0.5–1). Roughly once a minute, during the lightning the scene already fires, the whole frame breathes: grade gain lifts by `flash × 0.05–0.10` (capped), the globe limb catches the flash toward Tokyo, the glass beads glint sharper, the flash falloff goes exponential (M2). Glass beads merge and spawn trail beads — the single most "liquid" read at 24-bead scale (M3). The hero entrance is rebuilt on WAAPI with real cancel/finish semantics (M5).
- **What it retires (law):** the scroll shear (a defect, not a layer); the `setTimeout` entrance ladders + all three hand-built safety nets (~60 lines). M2/M3 are in-place elevations of existing layers plus uniform plumbing — no layer added, so nothing owed.
- **Luminance risk + gate:** near zero. All new light is event-gated and decays with the existing ~1 s envelope; p50 medians are untouched by construction. Gate: §8b 5-frame medians (p50 must hold 8/7/9) plus one *during-flash* p95 capture against a harness-pinned cap on the grade-lift constant. Bokeh (if taken) sits under the existing 0.22-alpha glint law, at well positions only.
- **One-signal:** every coupling rides the existing flash beat — zero new beats, zero new timers (pinned negative #4 honored).
- **Mobile/perf:** +0 KB dependencies. LITE untouched or lighter (grade pass is high-tier-only; wells are off on LITE; beads capped at 12; merge works at n=12). Warm-LCP budget unaffected.
- **Build effort:** small — 1–2 days including gates.
- **Feel:** same furniture, zero clutter added; the site stops stuttering and starts *reacting*.

### Package M — S + "Rain that leans, light that pools" (+ M4 + M6) ← recommended

- **What it adds:** the rain rebuild (M4): one `InstancedBufferGeometry` batch (470 high / 210 LITE) whose vertex shader stretches each drop along its true velocity — every drop leans with the wind and scroll shear — recycles drops on the GPU, and evaluates the existing ≤3 motivation wells **per drop**. Rain finally lights in true screen-space pools (under the halo, inside a strike's reach) and falls dark between them — the rain brief's own stated end-state (Lever A, ref rain/023) plus directional lightning (Lever F) free, since well 3 already carries the strike. M6 moves parallax drift and view reveals to the compositor for ~83% of visitors.
- **What it retires (law):** the three `Points` rain planes → **1 object (net −2)**, `makeStreakTexture()`, and the per-frame CPU advection loop over 470 drops (M4 is a strict 1:1 replacement). M6 retires per-frame JS parallax work where supported. Combined with S's retirements, this package deletes more than it adds.
- **Luminance risk + gate:** neutral-or-negative by construction — the terminal opacity formula (`baseOp × vis × beat × motivation`, MOTIV_FLOOR/CAP) carries over verbatim; per-drop wells concentrate the same budget (MOTIV_FLOOR can later *drop* below 0.16 because lit drops carry the read). Gates: interleaved A/B vs current build, median Δ ≤ 0 (current bar: Δ −0.01); MOTIV_CAP carried into the shader uniform and harness-pinned; the new instanced mesh gets a **type-correct invisible dark-swap material** in the bloom pass and stays excluded from the bloom emitter set (the v3.1g lesson) — pinned.
- **One-signal:** unchanged — rain is weather, not a motion signal; beat/lock coupling untouched. M6 reveals remain threshold events.
- **Mobile/perf:** LITE strictly cheaper than today (210 instances, flat veil, no well math compiled, CPU loop gone). Desktop: 1 draw call instead of 3, same fill. M6 is CSS-only; dual code path until Firefox ships SDA (Interop 2026 priority) — fallback stays truthful.
- **Build effort:** medium — 3–5 days including the material rewrite, dark-swap pin, and both gate suites.
- **Feel:** the rain stops being a veil and becomes weather with a light source — the north star's "rain lights only where something backlights it," finally literal.

### Package L — M + "The world reads wet" (+ M7 + M8 + M9)

- **What it adds:** the never-built wetness sell from the accepted rain brief. M7: a bottom ~12% band on the existing droplet canvas draws vertically-flipped, smeared, dimmed strips of the rendered frame under **live emitters only** (≤3 clipped blits @30 fps, per-column sine jitter as the water), and near-plane drops crossing the band inside a well's footprint spawn pooled splash rings (~8 max, 0.3 s) — rain finally *lands* where light is (rain/025's source–shaft–landing rule). M8: one expanding ripple ring in the grid shader per splash (≤1 live, 0.5 s). M9: during a lock/pulse/flash beat only, a radial streak pass over the emitters-only bloom target throws a brief shaft — godrays with zero new scene renders, targets, lights, or libraries.
- **What it retires (law):** the sheet-lightning **scene sprite** — lightning re-homes as a directional top-band gradient flash on the same canvas, gaining Lever F's exponential falloff for free. Net: **−1 scene object, 0 new DOM layers** (the canvas already exists). M8 modifies an existing shader; M9 reuses the existing bloom target (folded into mixPass: zero new render targets).
- **Luminance risk + gate:** **this is the package with real floor risk** — M7 adds light to a formerly-black band. Mitigations as law: strips drawn only under live emitters, scaled by well strength (mostly-black frame ⇒ mostly-black band); per-strip alpha cap tuned until the hero-mean interleaved A/B sits below measurement resolution; **ships behind a flag for an owner board verdict** — it is the most visible addition in this brief and the owner's de-clutter taste gets the call. M9: strength 0 at rest; p95 measured *during* the beat per the §8b variance law. M8: an event light in the shipped haloPulse class, ≤1 live.
- **One-signal:** M9 *is* the globe-scene motion signal while live — it must ride existing beats, never a new timer. M8 is suppressed while `lockT` is active. M7 reflections are static-ish (reflection ≠ motion signal).
- **Mobile/perf:** band at reduced alpha on LITE (cheapest wetness signal per pixel); splashes, ripples, and shafts non-LITE (they key off wells/composer). All canvas work rides the existing 30 fps half-rate.
- **Build effort:** +2–4 days on top of M; each move behind its own flag.
- **Feel:** emitters smear on wet ground, drops land in rings, a locked signal throws a shaft — the world reads *wet* instead of merely rained-on.

### Splurge (deliberately in no package) — M10 rivulet-glass pass

The only proposal that genuinely earns the word "simulation": a 64×64 GPU drop-state sim (gravity, hang-and-burst runs, collision-merge, evaporation) splatted as SDF metaballs that refract the already-rendered graded frame — true grabpass, zero texture uploads. Desktop/high tier only; ~+8–12% postFX fill; ~a week. Clean retire-one pairing: the **entire 2D droplet canvas** goes (DOM element, CSS, IIFE, per-frame blit). Honest cost: LITE loses glass drops entirely (or two implementations stay alive — recommend the deletion, recorded as an owner call). Luminance gated by a pinned max-covered-area uniform + the 0.22 luma clamp on refracted samples + hero-median A/B. **Build only on explicit owner appetite: M3 delivers ~70% of the read at ~5% of the cost.**

---

## 4. Recommendation — the v3.3 slice

**Build Package M.** It is the option that honors the owner's taste laws *maximally* rather than merely adequately:

- **Deep-black minimal:** nothing in M raises a single p50; M4 is neutral-or-negative by construction and gated by the same interleaved A/B that already measured rain at Δ −0.01.
- **One signal:** zero new beats anywhere in M — every light response rides the lightning/halo/lock beats the scene already owns.
- **Subtract to add:** net scene objects −2; the 470-iteration CPU loop, the streak sprite factory, the `setTimeout` ladders and their three safety nets all deleted; zero dependencies added. This is the rare slice where the diffstat itself argues the taste case.
- **It answers all three owner asks at the root:** flow (M1/M5 fix the actual jank and the actual choreography stiffness), light simulation (M2/M4 make the scene answer its own light), liquid (M3's merge is the liquid read at this scale; the sim door is closed with numbers).

**Suggested build order inside the slice** (each step independently gated, killable on the board): M1 → M5 → M2 → M3 → M4 → M6. M1 first because it changes how everything else is judged; M4 last because it carries the two pins (dark-swap material, MOTIV_CAP uniform).

**Gates carried for the whole slice:** §8b medians (p50 8/7/9, medians of 5, spreads reported) · hero rain interleaved A/B Δ ≤ 0 · during-flash p95 with pinned caps · `fpsEMA` on high tier · LITE untouched-or-lighter · reduced-motion no-ops preserved (rain layer stays `null`) · zero console messages · harness pins updated with features, never deleted.

**Package L is not rejected — it is sequenced.** M7 (the wet band) is the strongest *visual* idea in the three tracks and the accepted rain brief calls reflections the wetness sell; it is also the most visible addition and the only real floor risk. It should be built flag-first in a later slice and judged by the owner on the board, taking the lightning-sprite retirement with it. M8/M9 ride that same session. M10 waits for explicit appetite.

**Sequencing note:** v3.2 sits complete on `v3-build`, whole-branch-reviewed, awaiting the 14-item gate pile + PR to main. v3.3 should start **after** that merge (or at minimum after the gate-pile verdicts), and if the owner re-baselines §8b post-merge, re-baseline *before* v3.3's first measurement so every A/B in this brief compares against the build it modifies.

---

## 5. Framework verdict — GSAP / anime.js (asked directly, answered directly)

**Verdict: decline both. GSAP: decline outright. anime.js: decline now, with a named re-entry condition. Motion 12: not a candidate.**

- **GSAP 3.15 — decline.** The 2026 story is real: Webflow made the entire library free including every former Club plugin — the license was never this site's blocker; **the shape is.** On a no-bundler import-map site, GSAP costs 46.3 KB gz as UMD globals (breaking the ESM discipline) or ~109 KB gz as its unminified ESM source (2× the site's entire authored JS). Its headline value here — ScrollTrigger scrubbing — collapses on a fixed full-viewport canvas to *a smoothed scalar provider*, and the scalar smoothing is a 4-line idiom `background.js` already applies to nine other channels. Adopting it "properly" (the ecosystem-blessed shape in every 2026 tutorial) means re-parenting the scene's battle-hardened master clock into `gsap.ticker` — the largest blast radius on the board for pixels identical to the bespoke fix. ScrollSmoother and Lenis are rejected independently and permanently: they re-parent content into a transformed wrapper, and this site's nav, scroll-HUD, state-word, lightbox, and canvas are all `position: fixed`.
- **anime.js v4.5 — decline now; it is the named fallback.** It is the only framework whose shape fits this architecture: import-map documented as a first-class install, one self-hostable 29.1 KB gz ESM file vendorable beside `three-0.158.0/`, and a manually-tickable engine (`engine.update()`) that would stay subordinate to the site's one rAF clock. It is still declined because everything it would fix *today* — entrance lifecycle, interruption safety, sequencing legibility — is fixed for **zero bytes** by M5 (WAAPI) inside Package S/M, and +29 KB is +55% of the site's authored JS against ~1.5 KB of retired bespoke code. The ledger can only balance on maintainability, and only after the owner has *felt* the zero-byte version. **Re-entry condition (record it):** if, after Package M ships, the owner still wants choreography the platform can't express cleanly — a multi-element timeline with relative position syntax across surfaces — vendor `anime.esm.min.js`, drive it in mode 1 (engine ticked from the scene loop; no scene channel ever tweened from DOM code), and delete the bespoke ladders in the same commit.
- **Motion 12 — not a candidate.** Its crown jewel (compositor-native ScrollTimeline) cannot drive a WebGL scene's JS loop, and its DOM value duplicates what plain CSS transitions already deliver here.
- **What is adopted instead: the platform.** WAAPI for lifecycle (M5, zero bytes); CSS scroll-driven animations as progressive enhancement (M6 — Chrome/Edge/Safari shipped, Firefox behind a flag, Interop 2026 priority, JS fallback retained); View Transitions, already load-bearing in the lightbox.
- **Law guard:** nothing in this verdict re-opens the closed motion deferrals (ghost-echo, per-letter decrypt, idle marks — law addendum §5). A framework is a tooling question; the motion *law* — animate the focus only, one boxed word per state change — is settled and unaffected.

---

## 6. Open questions for the owner

1. **The wet band (M7):** it is the accepted brief's wetness sell *and* the most visible addition on this board. Given the de-clutter taste — do you want the world's bottom edge to read wet at all? If yes, we build flag-first and you judge it live against the A/B numbers.
2. **Rivulet-glass appetite (M10):** is a headline "liquid simulation" signature moment wanted on desktop? Saying yes also deletes LITE's glass droplets (recorded as your call) — phones would keep depth rain but lose the glass.
3. **Grid-as-water (M8):** the ripple makes the synthwave grid read as a water surface. Is that your read of the floor, or does the grid stay dry geometry?
4. **Shaft moments (M9):** do you want brief godray shafts on lock/pulse/flash beats at all, or is bloom already this site's ceiling for light drama?
5. **anime.js re-entry:** after feeling M5's WAAPI choreography, do you still want a richer timeline vocabulary? (That answer, not any technical fact, is what would bring the 29 KB in.)
6. **Scrub feel (M1):** the filter constant is taste — snappier (≈0.14, globe answers scroll almost immediately) vs more cinematic (≈0.08, ~1 s settle). Pick it live on the board.
7. **Sequencing:** confirm v3.3 waits for the v3.2 gate pile + PR to main — and whether §8b should be re-baselined post-merge before v3.3's first measurement.

---

## Sources

Primary evidence and full citation trails live in the three input docs; load-bearing externals repeated here:

- This repo: `2026-07-10-rain-liquid-sim-options.md` · `2026-07-10-light-sim-options.md` · `2026-07-10-animation-framework-options.md` · `../specs/2026-07-03-north-star.md` · `../specs/2026-07-03-design-language-v3.md` · `../specs/2026-07-03-rain-elevation-brief.md` · `../specs/2026-07-03-motion-elevation-brief.md` · `../specs/2026-07-08-v32-law-addendum.md`
- Tatarchuk & Isidoro, *Artist-Directable Real-Time Rain Rendering in City Environments* (ATI Toy Shop, SIGGRAPH 2006) — https://advances.realtimerendering.com/s2006/Tatarchuk-Rain.pdf
- Mitchell, *Volumetric Light Scattering as a Post-Process*, GPU Gems 3 ch. 13 — https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process
- Lagarde, *Water drop 2b — dynamic rain and its effects* — https://seblagarde.wordpress.com/2013/01/03/water-drop-2b-dynamic-rain-and-its-effects/
- SardineFish, *raindrop-fx* (WebGL2 raindrop glass, perf numbers) — https://github.com/SardineFish/raindrop-fx · Codrops/Bebber *RainEffect* — https://github.com/codrops/RainEffect
- David Li, *Fluid Particles* (WebGL FLIP cost reference) — http://david.li/fluid · three.js WebGPU compute rain (rejected path) — https://threejs.org/examples/webgpu_compute_particles_rain.html
- GSAP free under Webflow — https://webflow.com/updates/gsap-becomes-free · ScrollTrigger `scrub` — https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- anime.js v4 import-map install + manual engine — https://animejs.com/documentation/getting-started/module-imports/ · https://animejs.com/documentation/engine
- CSS scroll-driven animations status — https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations · https://caniuse.com/mdn-css_properties_animation-timeline_scroll
