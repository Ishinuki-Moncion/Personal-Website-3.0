# SP2 — Globe Shader Elevation (Design)

**Date:** 2026-07-03 · **Branch:** `v3-build` · **Status:** approved (owner), ready for `writing-plans`.
**Part of:** the daikieOS **Plan C** build program (see memory `v3-build-plan`), second sub-project. Depends on the SP1 ESM foundation (already shipped: `06850a5`→`1d78840`).
**Grounds on:** `2026-07-03-globe-elevation-brief.md` (the authoritative per-surface brief), `2026-07-03-design-language-v3.md` §0/§1/§6, `2026-07-03-north-star.md`, and `../research/2026-07-03-threejs-capability-ceiling.md` §2 (shaders = pure no-build, the safest richest lane). Every code anchor below was verified against `js/background.js` (1648 lines, post-SP1) by a 3-agent research fan-out.

## What this is

SP2 grades the Tokyo data-globe to the v3 visual language through **pure no-build GPU shading** — no bundler, no render targets, no post passes. It edits the existing land-particle `ShaderMaterial` in place, **replaces** the uniform halo sprite with one additive back-side limb shell, dissolves the scan-band + graticule edges, softens the point cores, and adds a one-time boot-up scan-reveal. Everything composites **additive + `discard`**, the proven-safe model over the transparent `alpha:true` canvas (the one documented way to break it — a composer that forces output alpha `= 1.0` — is never touched).

The globe has **no sphere mesh and no lights**: it is a `THREE.Points` land cloud on one custom additive `ShaderMaterial` (`js/background.js:213-259`) + a `LineSegments` graticule (`:295-298`) + a flat `Sprite` halo (`:839-855`). All "lighting" is shader-faked, and a **real solar day/night terminator already exists** (`uSunDir`/`vNight`, `updateSunDir()` `:266-274`, refreshed every 120 s). SP2 elevates what's there rather than rebuilding it.

## §0 — Settled decisions (the design forks)

1. **Scope = the four *shading* levers only.** The globe brief lists six levers; the three that are data/annotation work — emitter clustering (data-mask reweight), coordinate callouts, reticle/graticule *leaders* — **defer to SP3** (scan-and-tag interactivity), where they belong. SP2 = limb + terminator + dissolve + soft points + the flourish.
2. **Character = instrument-grade, brief-faithful, + one flourish.** Impact comes from physical correctness and subtlety (near-black, ~88 % shadow, additive, capped), not from flashiness.
3. **The flourish = a one-time boot-up scan-reveal** that plays on first render and settles into the calm steady state. Chosen because it maps literally to the north-star ("a living instrument **booting up** in a near-black cyber-noir night") and is self-limiting, so it never violates the brief's "ration motion / animate the focus only" law.
4. **Ship ON by default** with a `?globe=classic` A/B escape hatch — SP2 shading is transparent-canvas-safe by construction, so it does not need SP1's flag-gate; the toggle exists only for tune-by-eye comparison and trivial rollback.

---

## §1 — Component ① Cool scatter limb (the headline)

**Replaces** `earth-atmosphere-halo` — the flat, camera-facing cyan radial `Sprite` (`js/background.js:839-855`, breathing `:1597`). The brief calls that sprite *wrong* because it is **uniform** — same brightness all the way round the silhouette — whereas the north-star key-art (`refs/globe/004`) is a **thin cool atmospheric limb, brightest toward the terminator, dying on the deep-night limb**.

**Technique** (research §2 item 1, [VERIFIED]): a single additive **back-side sphere shell**.

- `new THREE.Mesh(new THREE.SphereGeometry(R*1.02, 48, 32), limbMat)` — `BackSide`, `blending: AdditiveBlending`, `transparent: true`, `depthWrite: false`. One draw call **in**, the halo sprite **out** ⇒ draw budget flat.
- Custom `ShaderMaterial`, ES-1.00 style (matching the existing land shader — see §12), reusing the shared `uSunDir`:
  ```glsl
  // fragment (sketch) — matches the land shader's NON-premultiplied additive convention
  float rim  = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 4.0);    // edge-weighted (fix the sign — vFacing is inverse)
  float day  = smoothstep(-0.25, 0.30, dot(vSphereDir, uSunDir));   // 1 on day/terminator, ~0 on night limb; vSphereDir = normalize(objectPos), the uSunDir frame (as the land shader)
  float a    = min(rim * mix(0.12, 1.0, day) * uReveal, CAP);       // capped; biased toward the sun
  gl_FragColor = vec4(CYAN, a);                                     // AdditiveBlending (SRC_ALPHA, ONE) scales RGB by a — do NOT pre-multiply
  ```
- **Cyan only** (`#39f0ff`, `vec3(0.224,0.941,1.0)`); its scatter never warms. Width read ~1–2 % of R comes from the `R*1.02` offset + the `pow` tightness. Peak alpha **capped** (`CAP` ≈ 0.35–0.5, tune) — the additive blow-out rule ("no neutral-white state").

**Why this is within the brief's "no re-geometry" letter:** the brief forbids restructuring the particle system / adding render targets / new passes. A single additive shell that *replaces* the sprite is the research-sanctioned method for an edge-weighted limb, adds no render target or pass, and is net-neutral on draw calls. This is the one deliberate letter-bend, surfaced explicitly and owner-approved. A continuous limb **cannot** be built from the land points (they are sparse and land-only — no limb over oceans), so the shell is required.

---

## §2 — Component ② Terminator elevation (nearly free)

The day/night terminator is **already real** — do not rebuild it, do not add a second sun model. Edit the existing land shader (vertex `:216-239`, fragment `:240-258`):

- **Widen + soften** the night band: today `vNight = 1.0 - smoothstep(-0.18, 0.12, dot(normalize(position), uSunDir))` (`:235`). Broaden to a softer band (e.g. `smoothstep(-0.35, 0.25, …)`) so the terminator reads as a gradient, not a line.
- **Cool the day limb** — a subtle cyan lift on the day side so the two tones read as *cool day / near-black night*.
- **Keep the warm dusk band** (`:252-253`, `mix(col, vec3(1.0,0.72,0.35), vCity*vNight*0.85)`) as **the one sanctioned cyan→warm transition**. Amber stays gated strictly to `vNight`; cool and warm **never bleed** (design-language §1.6).

Subtle, gated, not dramatic. Reuses `uSunDir`/`vNight` — zero new uniforms, zero cost.

---

## §3 — Component ③ Rimless dissolve (the scan band, not the silhouette)

The brief is explicit: the "replace fresnel rim" clause is a **no-op** for the globe — there is no hard rim on the sphere to remove (grep `fresnel` = 0), and ① already owns the silhouette. The real work is the **holo-scan band's crisp `RingGeometry` edge** (~`js/background.js:865-867`, exact object confirmed in planning) + the graticule.

- Give the scan band a **radial alpha falloff** so its leading/trailing edges bleed into additive scatter instead of ending on a geometry line:
  ```glsl
  float a = pow(1.0 - clamp(abs(vR - uRCenter) / uHalfWidth, 0.0, 1.0), 3.0);
  ```
  via a small `ShaderMaterial` or per-vertex alpha across `R*0.99 → R*1.012`.
- Give the **graticule** (`:295-298`, `LineBasicMaterial` opacity 0.07) a mild alpha falloff so its lines don't terminate hard at the pole/edge.

"Don't add a rim just to elevate it." Free, additive, no new geometry.

---

## §4 — Component ④ Softer point cores (polish)

The land fragment already renders round discs (`float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;`, `:247-248`) with a **linear** alpha falloff (`alpha = vA * (1.0 - d * 2.0) * …`, `:256`). Upgrade the falloff to a soft power core (research §2 item 3, [VERIFIED]):

```glsl
float core = pow(max(1.0 - d * 2.0, 0.0), 3.0);   // was linear (1.0 - 2d)
```

Rounder, softer glow cores; the hard `discard` boundary stays (bounds the point) but the visible edge feathers. Spine-justified ("saturated core + soft same-hue halo"), free. Not in the brief as a named lever — included as owner-sanctioned polish.

---

## §5 — Component ⑤ Boot-up scan-reveal (the flourish)

A **one-time** assembly on first render: a bright scan front sweeps the globe pole-to-pole; land points `discard` ahead of the front and ignite with a bright leading band behind it; the limb shell (①) kindles as it completes; then everything settles into the calm steady state.

- **Driver:** a single `uReveal` uniform (`0 → 1`) shared by the land shader **and** the limb shell, advanced by a load tween (~1.6–2.2 s, ease-out cubic). Inert once it reaches 1.
- **Sweep:** map world-Y to `[0,1]`; a point/pixel is revealed when its normalized Y `< uReveal`. A bright leading band (`smoothstep` within ~0.08 of the front) gives the scan-line glow. **Curl/`cnoise` dithers** the front by ~5–10 % so it reads organic, not a hard wipe (research §2 item 5, [VERIFIED]: `onBeforeCompile`-inject `cnoise` vs a `uProgress` uniform — but here we own the full land `ShaderMaterial`, so it's inlined, not injected).
- **Trigger:** fires once on the first full render. Whether that hooks the load-tween directly or an `IntersectionObserver` depends on whether the globe is a fixed full-viewport background or a hero element — **confirmed in planning**.
- **Reduced-motion:** `uReveal = 1` **immediately**, no animation. The reveal is a load event, not persistent motion, so it honors "ration motion" even at full ambition.

---

## §6 — Uniforms & data flow

- **Existing (unchanged):** `uTime` (`:215`, updated `:1573`), `uPx`, `uSunDir` (`updateSunDir()` `:266-274`).
- **New:** `uReveal` (float, shared land + limb shell). Limb shell also consumes `uSunDir`. Scan band gets `uRCenter`/`uHalfWidth` (or per-vertex alpha).
- **Per-frame:** advance the `uReveal` tween until 1, then no-op; `uTime`/`uSunDir` continue as today. No new per-frame allocations; one extra uniform upload on the shell (within the brief's "one uniform upload" spirit).

## §7 — Tiering & reduced-motion

- **high:** full — limb shell `SphereGeometry(R*1.02, 48, 32)`, curl-dithered reveal, soft points, widened terminator, edge dissolve.
- **lite** (coarse pointer / ≤760 px): same free shader upgrades; limb shell drops to `(R*1.02, 24, 16)`; reveal simplified (drop curl dither). LITE particle budget (2600) preserved.
- **reduced-motion:** instant final state — `uReveal = 1`, no reveal, no halo breathing; terminator/dissolve/soft-points are static-safe. Honors `prefers-reduced-motion`.

## §8 — Rollout & safety

- **Ships ON by default.** SP2 is additive + `depthWrite:false` + `discard` throughout — it cannot force opaque alpha and never routes through a composer, so it is transparent-canvas-safe by construction (unlike SP1's bloom, which required a flag-gate to prove safety first).
- **`?globe=classic` escape hatch** forces the pre-SP2 look (keep the halo sprite, skip the shell + shader edits) for side-by-side A/B during tune-by-eye and as a one-line rollback. Implemented as a single `GLOBE_ELEV` boolean gate read from the URL, default `true`.
- **Scene-file cache gotcha (from SP1):** `js/background.js` keeps a fixed `?v=` in `boot.mjs`; bump it on deploy and **hard-reload (Cmd+Shift+R)** to pick up edits in-browser.

## §9 — Acceptance gates

Method = SP1's: `node --check` + import-closure check + local http server + Chrome automation reading `window.__sceneDebug()` telemetry + a readPixels corner probe + screenshot A/B (`?globe=classic` vs default).

- **A — canvas preserved (THE gate):** undrawn corners stay `[0,0,0,0]` after the limb shell + all edits. The shell is additive/`depthWrite:false` and must not fill undrawn pixels opaquely. Re-uses the SP1 `__bloomProbe` readPixels approach.
- **B — limb is terminator-biased, not uniform:** limb brightness at the day-side silhouette measurably exceeds the night-side silhouette; sample both.
- **C — terminator softened, warm dusk intact, no cool/warm bleed:** visual A/B; amber stays gated to `vNight`.
- **D — scan-band + graticule edges dissolve:** no hard ring line; edges bleed to scatter.
- **E — soft point cores:** points show feathered cores, no hard-edged discs.
- **F — reveal:** plays once on load, settles to steady state; **skipped** (instant final state) under reduced-motion.
- **G — parity / no-regression:** `__sceneDebug` tier/dpr/`globeParticles` unchanged; fps ≥ baseline (60 on high-tier desktop, dpr 2); LITE budget held.
- **H — discipline:** no particle-count increase, no render target, no new post pass (code review + `__sceneDebug`).

## §10 — Out of scope (→ later sub-projects)

Emitter clustering / thinning (data-mask), coordinate callouts, reticle & graticule *leaders* → **SP3**. Chromatic aberration + color-grade + tuned selective bloom → **SP4** (the r168 + pmndrs escalation). Cross-site teal-black grading → **SP5**. **No** re-geometry of the particle system, **no** render targets, **no** new post passes, **no** particle-count increase.

## §11 — Open tuning knobs (tune-by-eye debt, per the brief)

limb width (%R) · limb `pow` exponent (3–6) · limb alpha `CAP` · limb day-bias smoothstep edges · terminator band width · day-limb cool-lift amount · dusk warm amount · dissolve falloff width + exponent · soft-point exponent · reveal duration · reveal easing · reveal curl amplitude · leading-band width. Starting values are given inline above; final values are set by eye against `refs/globe/004` during the build.

## §12 — Verify in planning (research-flagged unknowns)

- **GLSL dialect — largely resolved by precedent:** the existing land `ShaderMaterial` already compiles ES-1.00 (`gl_FragColor` / `varying`) at r158, so ① and ③ are authored as **full ShaderMaterials in the same style** — this sidesteps the unverified `onBeforeCompile` chunk-anchor strings entirely. Only confirm anchors **if** any `onBeforeCompile` path is added (none currently planned for the globe).
- **Exact holo-scan band object** at ~`js/background.js:865-867` — confirm the precise `RingGeometry`/`Mesh` before editing (the brief's line refs predate the SP1 bloom insert at `:1343+`, so `:865-867` should be unshifted, but verify).
- **Reveal trigger** — load-tween vs `IntersectionObserver`, decided by the globe's DOM role (fixed background vs hero).

## §13 — References

- `2026-07-03-globe-elevation-brief.md` — the six-lever brief; §0 north-star, limb/terminator/dissolve directives, "out of scope / risks."
- `2026-07-03-design-language-v3.md` — §1.1–1.7 (cool-shell/warm-signal split, rimless holo, additive-never-occlude), §6 palette tokens, §6.7 "no neutral-white."
- `2026-07-03-north-star.md` — "living instrument booting up," pinned key-art `refs/globe/004`, ~88 % deep-shadow law.
- `../research/2026-07-03-threejs-capability-ceiling.md` — §2 shaders pure-no-build [VERIFIED]; Fresnel `pow(1-dot(N,V),3-6)` biased by `uSunDir`; additive blow-out survival kit; §0/§1/§5 transparent-canvas warnings.

---

## §14 — Build results (2026-07-03, SP2 COMPLETE)

Executed inline (executing-plans), 6 tasks + 1 tune, committed on `v3-build`:
`33aa35d` T0 flag+uniforms · `3455679` T1 limb shell · `b00fdb4` T2 land shader · `48a1a8b` T3 dissolve · `97a0d4c` T4 reveal drive · `6d6804b` limb tune · T5 record. (Spec `f74349d`, plan `01a9ed8`.)

**Environment:** desktop, `quality=high`, `dpr=2`, `globeParticles=7000`, `fps` 66–88 across tasks (rAF-capped; zero measurable cost). `?globe=classic` A/B verified reverting to the pre-SP2 look at each step.

**Acceptance gates — all PASS:**

| Gate | What | Result |
|---|---|---|
| A | Transparent canvas preserved | PASS — undrawn-corner readback `[0,0,0,0]`; stars/graticule read *through* the globe, no opaque disc. Additive + `depthWrite:false` = safe by construction. |
| B | Limb terminator-biased, not uniform | PASS — cyan limb bright on the day/terminator arc, dim on the night limb. |
| C | Terminator softened, warm dusk intact, no cool/warm bleed | PASS — wider day→night band + cool day-limb lift; amber stays night-gated (A/B vs classic). |
| D | Scan-band + graticule edges dissolve | PASS — holo-scan band melts into scatter (no hard ring); graticule fades toward the poles. |
| E | Soft point cores | PASS — `pow(1-2d,3)` feathered cores, no hard discs (A/B vs classic linear). |
| F | Boot reveal plays once → settles; reduced-motion instant | PASS — burst caught the pole-to-pole sweep + settle; reduced-motion re-run (`reduced=true`, `p=2600`) renders the full globe with **no** sweep. |
| G | Parity / no regression | PASS — `globeParticles`/`dpr`/`quality` unchanged; `fps` ≥ baseline; LITE budget held. |
| H | Discipline | PASS — grep: no new `WebGLRenderTarget`, no new composer (the `EffectComposer` refs are the pre-existing SP1 bloom dev-flag), no particle-count change. |

**Final tuned knobs (§11):** limb `pow 4.0`; limb night-floor `0.05` (tuned from `0.12`); limb `CAP 0.5`; limb day-bias `smoothstep(-0.25,0.30)`; terminator band `smoothstep(-0.35,0.28)` at `uElev=1`; day-limb cool lift `0.18`; dusk warm `0.16` (unchanged); dissolve `pow(...,3)` half-width `R*0.011`; soft-point exponent `3.0`; reveal `1.8s` ease-out-cubic; reveal curl `0.06`; leading-band `0.6`.

**Notes for downstream:**
- **Dev-only throttling artifact:** background-tab rAF throttling + the `dt` clamp (0.033) stretches the 1.8s reveal to tens of seconds when the tab isn't OS-foreground; a real foreground tab at 60fps completes it in 1.8s. Not a code issue.
- `?globe=classic` remains the A/B + rollback switch.
- SP3 (scan-and-tag interactivity) inherits the deferred brief levers: emitter clustering, coordinate callouts, reticle/graticule leaders.

**Decision: SP2 COMPLETE.** The globe is graded to the v3 visual language — a rimless additive cyan hologram over a real Earth-at-night with a terminator-biased cool limb, softened two-tone terminator, dissolved band/graticule edges, soft point cores, and a booting-up scan-reveal. Next = SP3 (interactivity) or SP4 (postprocessing polish), each its own spec→plan→build.
