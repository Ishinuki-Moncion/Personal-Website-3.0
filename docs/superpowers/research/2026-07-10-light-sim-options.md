# Light Simulation with the Rain — Options Research (2026-07-10)

Owner ask: "light simulation… with the rain" — light interacting with the rain/scene.
This doc surveys the 2026 state of the art for five technique families, prices each
against this repo's actual architecture, and flags every hard-law risk. **Research
only — no code.** Confidence tiers per the library convention: **[VERIFIED]** /
**[EXTRACTED]** / **[DATA]** / **[WORKING]**.

Code anchors are against `js/background.js` at HEAD of `v3-build` (post-v3.2 campaign,
commit `52b167a` era). Companion briefs: `../specs/2026-07-03-rain-elevation-brief.md`
(Levers A–G) and `../specs/2026-07-03-motion-elevation-brief.md` (Lever 1, the
animate-the-focus-only law). Laws of record: `../specs/2026-07-08-v32-law-addendum.md`
(deep-black floor `#05060a`, section p50 luminance floors ~8/7/9, frame-luminance
measurement procedure).

---

## 0. What exists today (the substrate any option must compose with)

**[DATA — read from source]**

- **Rain**: 3 camera-space `THREE.Points` planes (70/150/250 drops high tier;
  2 planes, 80/130 on LITE) with additive streak sprites (`makeDepthRain()`,
  `background.js:499–534`). Terminal opacity per **plane** =
  `baseOp × vis × beat × motivation` (`background.js:1369`).
- **Motivated light wells (v3.2l)**: ≤3 screen-space falloff wells at projected
  emitter positions — Tokyo halo, focused place node, live lightning — evaluated
  per plane via camera-Z distance `exp(-|zMid - well.z| / 6.0)`, floor 0.16, cap 0.80
  (`background.js:1296–1371`). LITE skips all projection math (flat veil 0.55).
- **Sheet lightning**: one 64px radial-gradient additive sprite behind the globe,
  fires every ~30–72 s, decaying triple-flicker envelope; `updateLightning()` returns
  `env` as `flash`, which (a) feeds rain `beat` at weight 1.3 (`background.js:1341`)
  and (b) drives well #3 at strength `flash × 0.9` (`background.js:1336`).
- **Droplet glass**: 2D canvas beads that sample `renderer.domElement` inverted,
  desaturated, at `globalAlpha 0.22` — run **after** `render()` so they read the
  current frame (`background.js:672–694`, `background.js:2184`). This means the
  glass **already glints brighter during any bright event, for free**.
- **PostFX (high tier only)**: two-composer selective bloom — dark-material-swap →
  `bloomComposer` (RenderPass + UnrealBloom, emitters only, off-screen HalfFloat
  target) → `finalComposer` (RenderPass + alpha-preserving `mixPass` add +
  OutputPass + `gradePass` lift/gamma/gain/sat + `caPass` radial CA with dither)
  (`background.js:1755–1951`). **Two full scene renders per frame already.**
- **No THREE.Light anywhere. No depth writes anywhere** (every material is
  additive/`depthWrite:false`; the dark-swap comment at `background.js:1919–1926`
  states "this scene has no occluders by design"). **No shadow maps.** The vendored
  jsm set is minimal: EffectComposer/RenderPass/ShaderPass/UnrealBloomPass/
  OutputPass/MaskPass/Pass only (`js/vendor/three-0.158.0/examples/jsm/postprocessing/`).
- **Budgets**: warm LCP ~257 ms; hero/gallery/projects p50 luminance floors 8/7/9
  (law addendum §8b/§8c — held with zero spread across 15 frames); `fpsEMA` QA gate
  in the loop (`background.js:2042`).

**Architectural consequence [VERIFIED against source]:** any technique that needs
real lights, a populated depth buffer, or shadow maps (true SSR, shadow-marched
volumetrics, three-good-godrays) has **nothing to consume in this scene**. The
viable families are (1) screen-space passes that reuse the frames we already
render — especially the emitters-only bloom target, which is a ready-made
"light sources only" texture — and (2) per-particle/analytic responses driven by
the well data the CPU already computes.

---

## 1. Family A — Volumetric light shafts / godrays

### The two canonical approaches and their cost classes

**A-post: post-process radial godrays (Mitchell, GPU Gems 3 ch. 13).** Radial blur
in image space from the light's screen-space position over an occlusion/brightness
buffer, added back over the scene. "A radial blur in image space can simulate
volumetric light scattering at remarkably low cost" — the industry-standard cheap
shaft. **[EXTRACTED]**
Source: https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process

- three.js ships this as the r158 example `webgl_postprocessing_godrays`
  (https://threejs.org/examples/webgl_postprocessing_godrays.html) using
  `examples/jsm/shaders/GodRaysShader.js` — verified present at the r158 tag
  (https://github.com/mrdoob/three.js/blob/r158/examples/jsm/shaders/GodRaysShader.js).
  Structure **[VERIFIED — fetched r158 source]**: four shaders
  (DepthMask / Generate / Combine / FakeSun); the Generate pass does 6 taps per
  pass × 3 passes ≈ 216 effective taps, run at **1/4 resolution** with manual
  render-target management (it is *not* a single composer pass; the example
  orchestrates its own ping-pong). Sun position arrives as a screen-space uniform
  `vSunPositionScreenSpace` (xy + depth-fade z).
- Cost class: **one extra 1/4-res multi-pass blur + combine** — small, mobile-safe
  in its own example. Integration cost here is the manual RT plumbing plus keeping
  the alpha-preserving contract (the Combine shader would need the same
  centre-alpha treatment as `caPass`).
- Community equivalents: Andrew Berg's write-up of the same technique for three.js
  (https://medium.com/@andrew_b_berg/volumetric-light-scattering-in-three-js-6e1850680a41)
  **[EXTRACTED]**; Codrops' fake-shaft variants
  (https://tympanus.net/codrops/2022/06/27/volumetric-light-rays-with-three-js/).

**A-march: screen-space raymarched volumetrics.** March each pixel's view ray,
accumulate scattering, test occlusion against shadow maps / depth. Maxime Heckel's
2024–25 reference implementation **[EXTRACTED]**: per-light shadow map (512²
balances cost vs banding), ~250 raw steps reducible to **~50 steps with blue-noise
dithering + temporal rotation**, cost decoupled from scene complexity but still a
full-screen march per frame.
Source: https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/

- Packaged libraries: `three-good-godrays` **[VERIFIED — fetched README]** —
  screen-space raymarched godrays, requires the **pmndrs `postprocessing`
  library**, **enabled shadow maps** (Basic/PCF/PCFSoft/VSM), and real
  Point/Directional lights; knobs `density 1/128`, `maxDensity 0.5`,
  `raymarchSteps 60`, blur. three r0.125–r0.182 supported.
  (https://github.com/Ameobea/three-good-godrays). Sibling
  `three-volumetric-pass` (https://github.com/Ameobea/three-volumetric-pass) is
  the same author's fog-volume march.
- **Fit verdict: rejected.** This scene has zero `THREE.Light`s, zero shadow maps,
  an empty depth buffer, and a bespoke vanilla-EffectComposer alpha-preserving
  chain that a pmndrs-postprocessing dependency would fork or replace ("don't add
  a layer without retiring one" applies to architecture too). Cost class **large**
  with no consumable inputs. **[VERIFIED reasoning against source]**
- Note: the official `webgpu_volume_lighting` example
  (https://threejs.org/examples/webgpu_volume_lighting.html) is WebGPU/TSL-only —
  not applicable to the pinned r158 WebGL build. **[VERIFIED]**

**A-mesh: "good enough" cone volumetrics (Chapman 2013).** Not a post pass at all:
an open cone mesh, additive, depth-test-on/write-off, shader fades axially +
radially via view-space normal·view falloff, glow sprite hides the tip.
Computationally near-free; the classic mobile-safe light shaft. **[EXTRACTED]**
Source: http://john-chapman-graphics.blogspot.com/2013/01/good-enough-volumetrics-for-spotlights.html
— three.js port: https://github.com/jeromeetienne/threex.volumetricspotlight

### The bespoke option this architecture makes uniquely cheap

**A-bloomstreak (recommended shape): radial-streak pass over the existing
emitters-only bloom target.** `bloomComposer.renderTarget2.texture` is already an
"only the light sources, everything else black" buffer — exactly the input the
Mitchell technique spends its occlusion pre-pass producing. One new ShaderPass in
`finalComposer` (or folded into `mixPass`) that samples the bloom texture N times
(8–16 taps, unrolled) along `uv → uLightScreenPos` and adds the decayed sum,
strength driven by one uniform. Screen position comes from the same
world→screen projection `setWell()` already does per frame
(`background.js:1314–1323`). **Zero new scene renders, zero new render targets if
folded into mixPass; one 8–16-tap full-res (or half-res) pass.** Strength uniform
sits at 0 at rest and is keyed to `haloPulse`/`lockT`/`flash` — shafts exist only
during a beat, satisfying "light is an event." **[WORKING — original proposal,
grounded in the verified Mitchell/GodRaysShader pattern + this repo's verified
two-composer design]**

Law risks: the shaft must never idle-on (deep-black floor; ONE-SIGNAL — while the
shaft is live it *is* the globe-scene motion signal, so it must ride an existing
beat, not add a new one). p50 is safe by construction (event-gated, additive over
emitters only); p95 during the beat needs a frame-luminance check per the §8c
procedure.

---

## 2. Family B — Rain lit by light sources (per-particle response)

**Prior art [EXTRACTED]:** ATI Toy Shop / Tatarchuk & Isidoro, *Artist-Directable
Real-Time Rain Rendering in City Environments* (SIGGRAPH 2006 course ch. 3) —
still the canonical rain-lighting playbook, and the one modern engines cite:

- Rain streaks are shaded with a **normal map of raindrop shapes** and lit by
  scene lights with full reflection/refraction + Fresnel — "our approach does not
  require any preprocessing and can handle an arbitrary number of light sources."
- **The milk trick**: physically-correct rain is too faint; they bias raindrop
  colour/opacity toward white (film crews added milk to rain water) — brightness
  bias over correctness, i.e. exactly this site's `beat`/well gain approach.
- Splashes get **backlighting** so they "accurately respond to environment
  lights… raindrops splashing under street lights."
- Their heavy version is image-space composite rain (full-screen pass, multiple
  parallax layers in one fetch) — 5K–20K particles + composite, DX9 SM3.0 era.
  Sources: https://advances.realtimerendering.com/s2006/Tatarchuk-Rain.pdf ·
  https://advances.realtimerendering.com/s2006/Chapter3-Artist-Directable_Real-Time_Rain_Rendering_in_City_Environments.pdf ·
  R4 (Creus & Patow 2012) extends per-source raindrop illumination:
  https://www.sciencedirect.com/science/article/abs/pii/S0097849312001781

**Where today's build sits vs that bar [DATA]:** motivation is evaluated **per
plane** (`background.js:1359–1368`) — the whole 250-drop layer brightens as one.
The rain-brief's target ("rain lit only in pools where a lamp backlights it",
Lever A, ref rain/023) is only half-landed: pools exist in *depth*, not in
*screen space*.

**B1 — Per-drop well response in a vertex shader (the real elevation).** Swap the
three `PointsMaterial`s for one `ShaderMaterial` (same streak sprite, same additive
blend) whose vertex shader projects each drop (it already lives in camera space —
projection is one matrix multiply) and evaluates the ≤3 wells as `uniform vec4
uWells[3]` (screen xy, strength, camera-z) with the same exponential falloff,
writing a per-drop brightness varying. The CPU well math (`setWell`) stays exactly
as-is; the per-plane loop keeps ownership of `beat × vis`. ≤470 vertices on high
tier — vertex-shader ALU is negligible; LITE keeps the flat veil by not compiling
the well branch. Result: **actual pools of lit rain inside a plane** — under the
halo, inside a lightning's reach — with dark drops falling beside them, mirroring
rain/023 without raising the floor (MOTIV_FLOOR can then drop *below* 0.16 because
lit drops carry the read). Cost class **medium** (one material rewrite, no new
passes; the dark-swap set at `background.js:1927–1943` needs a matching
type-correct swap entry). **[WORKING — direct extension of v3.2l, prior art
Tatarchuk per-light raindrop shading]**

**B2 — Streak highlight keyed to wells.** Cheaper cosmetic layer on B1: scale the
drop's `gl_PointSize` and head-brightness by the same well weight (backlit drops
read as discrete bright beads, dark-field drops as thin streaks) — this is the
rain-brief's streak-vs-droplet distance call (Lever E / ref rain/016) executed by
light instead of by plane. Near-free once B1 exists. **[WORKING]**

Law risks: none structural — this *redistributes* the existing rain luminance
instead of adding any (net-luminance should fall or hold; verify with
`tools/frame-luminance.mjs` medians per §8c). Honors ONE-SIGNAL (no new signal —
same wells, finer grain). Respects LITE (no projection math on phones).

---

## 3. Family C — Lightning ↔ scene illumination coupling

**Prior art [EXTRACTED — Toy Shop, same course chapter]:** their lightning is a
**global brightness parameter piped into every material** ("1 additional texture
fetch plus a couple of ALUs… negligible cost"), added to illumination **before
tone mapping**; rain-specific couplings: lightning brightness **adjusts rain
opacity and glow amount**, and drops become more translucent during a strike
(`opacity × (1 − ½·lightningBrightness)`). Direction variety is faked by mixing
two pre-baked lightning lightmaps. The lesson: lightning coupling is a
*parameter-plumbing* problem, not a rendering problem — and this repo already has
the parameter (`flash` from `updateLightning()`, `background.js:1135–1153`).

Concrete couplings, cheapest first (all **[WORKING]**, all cost class **small**):

- **C1 — Flash → grade lift.** One uniform nudge in the existing `gradePass`
  (`background.js:1834–1873`): during `flash`, lift `uGain` (or add a scalar
  pre-sat exposure uniform) by ~`flash × 0.05–0.10` so the *whole frame* — globe
  limb, rain, HUD canvas glow — breathes with the strike, pre-graded like Toy
  Shop's pre-tonemap add. This is the single highest-leverage line in the family:
  the entire scene responds to light with zero new draws. Decays with the existing
  envelope (~1 s), so §8c medians (5 frames, ~13–16 s spacing) are statistically
  safe; still cap it and re-measure p95.
- **C2 — Directional rain response.** Already designed as rain-brief Lever F:
  replace the uniform `(flash||0) × 1.3` in `beat` (`background.js:1341`) with the
  lightning well's screen distance so near-strike drops over-brighten and far
  drops barely react. With B1 this comes free (well #3 is already the lightning);
  without B1 it stays per-plane and reads weaker.
- **C3 — Limb catch.** During `flash`, add `flash × k × tokyoFacing` to the
  atmosphere halo/limb opacity (`background.js:2156` non-elev path; `uReveal`-era
  shader uniform on GLOBE_ELEV) — the globe's atmosphere visibly catches the sheet
  flash. This is the *event-gated* version of Family D and probably the only
  limb-glow the luminance law will accept (see §4).
- **C4 — Glass glint.** Already free: the droplet lenses sample the post-flash
  frame (`background.js:2184`). Optional one-liner: scale bead highlight alpha
  (`background.js:703`) by `(1 + flash)` for a sharper glint. Toy Shop's
  translucency trick (drops more transparent under lightning) argues for *not*
  raising bead body opacity, only the specular dot.
- **C5 — Exponential flash gradient.** Rain-brief Lever F part 1 (sprite gradient
  at `background.js:1122–1125` → exponential falloff) — carried here unchanged.

Reference gap carried honestly: true sheet-lightning (in-cloud diffusion) remains
`[WORKING]` in the visual-study record (rain brief §risks); game-side practice
(Unreal/Unity storm tutorials, e.g.
https://dev.epicgames.com/community/learning/tutorials/kY3P/unreal-engine-lightning-vfx-step-by-step-guide-icvr-lightfall)
confirms flash-as-brief-directional-light-event but publishes no falloff numbers.

---

## 4. Family D — City-glow atmospheric scattering on the globe limb

**Standard technique [EXTRACTED]:** fresnel rim shading — back-side atmosphere
shell slightly larger than the globe, additive, intensity `pow(1 − dot(N, V), k)`
rising from limb toward centre; optionally day/night + Mie/Rayleigh terms.
Sources: three.js forum thread
https://discourse.threejs.org/t/how-to-create-an-atmospheric-glow-effect-on-surface-of-globe-sphere/32852 ·
Sangil Lee's earth-shader walkthrough
https://sangillee.com/2024-06-07-create-realistic-earth-with-shaders/ ·
Three.js Journey "Earth Shaders" lesson https://threejs-journey.com/lessons/earth-shaders ·
physically-based version: O'Neil, GPU Gems 2 ch. 16
https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-16-accurate-atmospheric-scattering

**City-glow variant [WORKING]:** modulate the rim term by angular proximity to
Tokyo's direction (the CPU already computes `tokyoFacing`,
`background.js:2124`) and tint that arc amber — the city's light pollution
leaking into the limb. Shader-only, cost class **small** (the scene already has a
`halo` sprite and, under GLOBE_ELEV, a custom globe shader to host the term).

**Law problem — this family is the dangerous one.** A limb glow is by nature
**ambient**: always-on brightness at the exact silhouette the deep-black floor is
measured against. Memory/campaign record shows a halo variant already **failed the
luminance gate and ships OFF** in v3.2. Recommendation: do not ship an idle city
glow. The acceptable forms are event-gated only: (a) C3's flash-catch limb, (b) a
brief limb warm-up during `lockT`/`haloPulse` beats (the city "surges" when the
signal locks). Any always-on term must clear the §8c p50/p95 gate at whisper
level, and precedent says it won't. **[VERIFIED against repo law docs]**

---

## 5. Family E — Screen-space caustics / wet reflection (SSR-lite for deck/panels)

**True SSR — rejected with reasons [VERIFIED].** three.js ships `SSRPass`
(https://threejs.org/examples/webgl_postprocessing_ssr.html); the strongest
community effect is 0beqz's `screen-space-reflections`
(https://github.com/0beqz/screen-space-reflections, pmndrs-postprocessing-based,
resolution-scalable because mobile cost is high). Both trace against the **depth
buffer + normals of opaque meshes**. This scene writes **no depth** (every
material `depthWrite:false`) and has no opaque meshes — SSR would march an empty
buffer and reflect nothing. Cost class **large**, output nil.

**The professional pattern that does fit [EXTRACTED — Toy Shop again]:** their
"wet reflections" are **not** SSR: bright objects are re-rendered as stretched
impostors into a **half-res HDR reflection buffer**, blurred **vertically only**
(Kawase-style) "to simulate warping due to raindrops," then sampled by ground
pixels with normal-based distortion — reflections elongate toward the viewer and
saturate for brighter sources. I.e. *flipped, vertically-smeared, dimmed copies of
the emitters* — which is, verbatim, rain-brief **Lever B**, already specced for
the 2D droplet canvas. Two implementation homes:

- **E1 — Canvas 2D smear (brief Lever B).** On the existing `.scene-droplets`
  canvas (already composited after render): for each of the ≤3 projected emitters
  (well positions are already in hand), draw a vertically-flipped, smeared,
  dimmed gradient streak in a bottom "wet deck" band; add splash wet-rings
  (Lever C) where near-plane drops cross it. Cost class **medium** (canvas
  fill-rate; LITE degrades first per the brief). No WebGL changes at all.
- **E2 — WebGL flip-smear pass.** A small ShaderPass sampling the *current frame*
  (or the bloom target for emitters-only purity) with `uv.y` mirrored + vertical
  smear taps, masked to the bottom band, added before grade. Reuses the bloom
  texture like A-bloomstreak; alpha-preserving like mixPass. Cost class **medium**.
  Better colour fidelity than E1; more plumbing.
- DOM panels (the SP5h worn-hardware deck) can't be sampled by either — a CSS
  `scaleY(-1)` + mask-gradient pseudo-reflection is possible but adds ambient
  luminance to the DOM layer; flag as owner-taste risk, default **skip**.

**Caustics [EXTRACTED, recommend skip]:** the real-time reference is Evan
Wallace's WebGL water caustics (light-projected mesh refraction, GLSL derivatives:
https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c);
screen-space fakes are animated caustic textures gated by light masks. This scene
has no water surface or receiving ground plane — caustics have no diegetic anchor,
and DON'T-ADD-A-LAYER says the wet read should come from reflections + splash
rings (which the rain study grounded: "reflections, not a gloss shader, make a
surface read wet", ref rain/011). **[VERIFIED against brief]**

---

## 6. Cost classes and law-compliance matrix

Cost classes: **S** = uniform/CPU tweak or ≤1 cheap draw · **M** = one new pass /
material rewrite / canvas layer · **L** = new RT infrastructure, raymarch, library
swap, extra scene renders.

| # | Option | Class | Deep-black floor | ONE-SIGNAL | Layer budget | LITE story |
|---|--------|-------|------------------|------------|--------------|------------|
| C1 | Flash → grade lift | S | event-decay, cap + re-measure p95 | rides existing flash beat | no new layer | works (grade is high-tier only → LITE unaffected) |
| C2/C5 | Directional lightning rain + exp gradient | S | redistributes, doesn't add | same beat | no new layer | skipped (wells off on LITE) |
| C3 | Flash-catch limb | S | event-gated only | same beat | no new layer | works (sprite path) |
| C4 | Glass glint on flash | S | negligible | same beat | no new layer | beads capped at 12 |
| B1 | Per-drop GPU well response | M | net luminance ↓ (floor can drop) | no new signal | replaces per-plane math | LITE keeps flat veil |
| B2 | Well-keyed streak highlights | S (after B1) | neutral | no new signal | no new layer | n/a |
| A-bloomstreak | Radial shafts from bloom target | M | 0 at rest, beat-gated | **is** the signal while live — must ride existing beats | reuses bloom target | high-tier only by construction |
| A-mesh | Chapman cone under halo | M | risk: reads ambient unless beat-gated | competes with halo pulse | new scene object — must retire one | possible but discouraged |
| E1 | Canvas wet-deck smear + splash rings | M | dim, bottom-band only; measure | static-ish (reflection ≠ motion signal) | new canvas draw — brief already retired the flat veil for it | degrades first (brief) |
| E2 | WebGL flip-smear pass | M | same as E1 | same | one new pass | high-tier only |
| A-post (official GodRaysShader) | vendored multi-pass | M/L | event-gating possible | same as A-bloomstreak | 3 new RT passes — heavier sibling of A-bloomstreak | no |
| A-march / three-good-godrays / three-volumetric-pass | raymarched volumetrics | L | — | — | needs lights+shadows+pmndrs: **rejected** | no |
| SSRPass / 0beqz SSR | true SSR | L | — | — | empty depth buffer: **rejected** | no |
| D-idle | Always-on city-glow limb | S | **fails precedent** (halo shipped OFF) | — | — | — |
| Caustics | screen-space caustic texture | M | ambient dapple risk | — | no diegetic anchor: **skip** | — |

---

## 7. Recommendation

Ship light simulation as **one system with three stages, all keyed to beats the
scene already owns** (lightning flash, haloPulse, lockT) — never a new ambient
layer:

1. **Stage 1 — C-bundle (small).** Flash→grade lift (C1), directional rain
   response + exponential flash gradient (C2/C5), flash-catch limb (C3), glint
   (C4). This is the Toy Shop parameter-plumbing move: the whole scene starts
   answering the lightning it already has. Biggest perceived-realism gain per
   line of code in this entire doc.
2. **Stage 2 — B1/B2 (medium).** Per-drop well response in a rain ShaderMaterial.
   Turns v3.2l's per-plane pools into true screen-space pools of lit rain — the
   rain brief's own stated end-state (Lever A, ref rain/023) — while *lowering*
   net luminance. Prerequisite for C2 reading properly.
3. **Stage 3 — A-bloomstreak (medium, gated).** One radial-streak pass over the
   existing emitters-only bloom target, strength 0 at rest, alive only during
   lock/pulse/flash. Godrays without new renders, targets, lights, or libraries.
   Prove with §8c luminance + fpsEMA before keeping.
4. **Wet-deck reflections (E1) remain the rain-brief's Lever B/C** — do them on
   the droplet canvas per the brief when that lever is scheduled; E2 is the
   upgrade path if canvas fidelity disappoints.
5. **Do not build**: raymarched volumetrics, three-good-godrays, SSRPass/0beqz
   SSR (no inputs to consume), always-on city-glow limb (luminance-law
   precedent), caustics (no diegetic anchor).

Measurement contract for every stage: §8c procedure (`tools/frame-luminance.mjs`,
5-frame medians, p50 must hold 8/7/9), `fpsEMA` on high tier, LITE untouched or
lighter, reduced-motion no-ops preserved.

---

## 8. Sources

- Mitchell, *Volumetric Light Scattering as a Post-Process*, GPU Gems 3 ch. 13 — https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process
- three.js r158 godrays example — https://threejs.org/examples/webgl_postprocessing_godrays.html · shader source at r158: https://github.com/mrdoob/three.js/blob/r158/examples/jsm/shaders/GodRaysShader.js
- Ameobea, *three-good-godrays* — https://github.com/Ameobea/three-good-godrays · forum thread: https://discourse.threejs.org/t/three-good-godrays-screen-space-godrays-for-three-js/43422 · *three-volumetric-pass*: https://github.com/Ameobea/three-volumetric-pass
- Heckel, *On Shaping Light: Real-Time Volumetric Lighting with Post-Processing and Raymarching for the Web* — https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/
- Berg, *Volumetric Light Scattering in three.js* — https://medium.com/@andrew_b_berg/volumetric-light-scattering-in-three-js-6e1850680a41
- Codrops, *Volumetric Light Rays with Three.js* — https://tympanus.net/codrops/2022/06/27/volumetric-light-rays-with-three-js/
- Chapman, *"Good Enough" Volumetrics for Spotlights* — http://john-chapman-graphics.blogspot.com/2013/01/good-enough-volumetrics-for-spotlights.html · three.js port: https://github.com/jeromeetienne/threex.volumetricspotlight
- three.js WebGPU volumetric lighting example (not applicable to r158) — https://threejs.org/examples/webgpu_volume_lighting.html
- Tatarchuk & Isidoro, *Artist-Directable Real-Time Rain Rendering in City Environments* (SIGGRAPH 2006 Advances course, ATI Toy Shop) — slides: https://advances.realtimerendering.com/s2006/Tatarchuk-Rain.pdf · chapter: https://advances.realtimerendering.com/s2006/Chapter3-Artist-Directable_Real-Time_Rain_Rendering_in_City_Environments.pdf · EG diglib mirror: https://diglib.eg.org/server/api/core/bitstreams/7f49ec3f-1a4e-4b9f-b1bf-80c0a9f11787/content
- Creus & Patow, *R4: Realistic Rain Rendering in Realtime* — https://www.sciencedirect.com/science/article/abs/pii/S0097849312001781
- three.js SSR example — https://threejs.org/examples/webgl_postprocessing_ssr.html · 0beqz, *screen-space-reflections* — https://github.com/0beqz/screen-space-reflections
- Atmosphere/limb glow: three.js forum — https://discourse.threejs.org/t/how-to-create-an-atmospheric-glow-effect-on-surface-of-globe-sphere/32852 · Lee, *Create a Realistic Earth with Shaders* — https://sangillee.com/2024-06-07-create-realistic-earth-with-shaders/ · Three.js Journey, *Earth Shaders* — https://threejs-journey.com/lessons/earth-shaders · O'Neil, GPU Gems 2 ch. 16 — https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-16-accurate-atmospheric-scattering
- Wallace, *Rendering Realtime Caustics in WebGL* — https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c
- Lightning VFX practice (directional-event framing, no published numbers) — https://dev.epicgames.com/community/learning/tutorials/kY3P/unreal-engine-lightning-vfx-step-by-step-guide-icvr-lightfall
