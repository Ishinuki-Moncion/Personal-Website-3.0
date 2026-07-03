# Three.js Capability Ceiling — Plan C (2026-07-03)

Establishes what's actually reachable for **bloom / custom shaders / interactivity**
on *this* site — vanilla Three.js as a **UMD global (r158)**, no bundler, no build
step, additive holograms over a **transparent (`alpha:true`) canvas**. Feeds the
daikieOS **Plan C** design: deepen the ONE Tokyo data-globe into a spectacular,
*interactive* instrument (bloom + richer shaders + scan-and-tag) without
fragmenting into multiple scenes.

Produced by five parallel research streams (bloom · shaders · interactivity ·
prior-art · integration-spine). Every load-bearing claim is tier-tagged.
Confidence: **[VERIFIED]** cross-checked ≥2 sources · **[EXTRACTED]** one primary
source · **[WORKING]** reasoned judgment. Full link tables per stream live in the
session transcript; the consolidated high-value links are in §References.

---

## 0. The decisive constraint (read this first)

Two independent streams (bloom, integration) reached the identical wall:

- `examples/js` global addons were **removed in r148**; at **r158** the composer
  and passes (`EffectComposer`, `RenderPass`, `UnrealBloomPass`, `OutputPass`)
  exist **only as `examples/jsm` ES modules**. There is **no vanilla-global path
  to the official composer at r158.** [VERIFIED]
- pmndrs `postprocessing` (the "nicer" composer) ships **ESM/CJS only, no UMD**,
  and its current release **peer-deps `three ≥0.168` — which excludes r158**
  (using it means *also* upgrading three). [VERIFIED]
- **`UnrealBloomPass` breaks a transparent canvas**: its blur shader hardcodes
  output alpha `= 1.0`, so the composite writes **opaque black** and the
  CSS-gradient-behind-the-canvas look is destroyed. Issue #14104 is closed
  *"not planned"*; a maintainer states bloom "does not support transparent
  backgrounds… no way to fix with the current approach." [VERIFIED]
- The site's vendored **r158 UMD build is itself a dead-end** — `build/three.js`
  (UMD) was **removed upstream at r160/r161**. Staying UMD-global forever
  forecloses any future three upgrade. [VERIFIED]

**Consequence.** Bloom is not "add a pass." It is a *strategy choice*, because the
official pass is (a) unreachable from a global build without restructuring how the
site loads JS, and (b) actively hostile to our transparent canvas even if reached.
**Shaders and interactivity have no such wall — they are almost entirely
pure-global.** So the wall is *only* around postprocessing.

*(Repo nuance: `tools/build-three-global.cjs` already generates the vendored
`three.global.min.js` from `three.module.min.js` — so a node build step for the
**vendor lib** already exists; the "no build" property the owner values is about
**app code** staying classic `<script>`s dropped on a host.)*

---

## 1. Bloom — the ceiling & the recommendation

- **Do not adopt `EffectComposer` + `UnrealBloomPass`.** jsm-only (§0), ~**13
  fullscreen passes/frame** at full res (1 bright-pass + 10 blur + composite +
  add), HalfFloat targets at canvas×DPR — **5–15+ ms on mobile at DPR 1.5–2** —
  *and* it breaks the transparent canvas. Wrong tool on three axes at once.
  [VERIFIED cost from r158 source; VERIFIED transparency break]
- **The site already does "fake bloom":** additive glow-sprites + additive point
  clouds + additive lines over the transparent canvas (~15 layers today). It
  works and is ~free. [VERIFIED — repo]
- **Recommended — hand-rolled half-res SELECTIVE additive bloom (pure core THREE):**
  render just the emissive/tagged layer into a **half-res `WebGLRenderTarget`**,
  **dual-Kawase blur** it (1.5–3× cheaper than separable Gaussian, designed for
  bloom, favored on low-power GPUs), then draw the blurred target **additively on
  top** of the normal scene with `renderer.autoClear=false`. Uses only
  `WebGLRenderTarget` + `ShaderMaterial` + fullscreen-quad + `setRenderTarget` —
  **all in the global; no jsm, no build.** It **sidesteps the transparency bug
  entirely** because the only draw touching the real framebuffer is an *additive*
  blit — the exact model the site's holograms already composite successfully. Use
  `RGBA8` (not HalfFloat) for the bloom target for max mobile compatibility.
  Tier-gate: full on `high`, quarter-res or off on `lite`, off under
  `reduced-motion`. Est. added cost ~0.5–2 ms desktop / ~0–1.5 ms lite. [WORKING
  — foundational, not yet prototyped; primitives VERIFIED in-repo]
- **What real bloom buys over fake sprites:** coherent light-bleed on the **thin
  shader-drawn features** (day/night terminator, scan rings, graticule) and the
  **point cloud** — which per-object sprites structurally cannot do. This is the
  genuine cohesion win; it's where "light is an event" gets its halo. [WORKING]
- **DOM-side alternative (even cheaper, zero WebGL risk):** a second stacked
  element with CSS `filter: blur()` + `mix-blend-mode: screen` — real glow, done
  in the DOM, transparency free. Worth pricing against the FBO pass. [WORKING]

**Verdict:** a spectacular, mobile-safe, **no-build selective glow is reachable.**
A full-frame HDR UnrealBloom pipeline is **not** reachable without changing the JS
load model, and would fight the transparent canvas even then.

---

## 2. Custom shaders — all PURE no-build, and the highest-value lever

`ShaderMaterial` + `onBeforeCompile` are pure strings → **inherently no-build**,
and the globe already uses both. This is the safest, richest lane. Priority order
(impact ÷ cost):

1. **Fresnel cool-limb shell** — one back-side sphere (`R*1.02`, `BackSide`,
   additive), rim alpha `pow(1.0 - dot(normal,viewDir), 3–6)`, **biased toward
   `uSunDir`** so it ignites at the terminator and dies on the night limb. Reuses
   the existing `uSunDir` uniform. *Replaces the flat canvas-gradient sprite halo
   — the single biggest read-per-line-of-code.* NOTE: the current `vFacing` is
   center-weighted (inverse fresnel); a real limb needs `1.0 - dot(...)`.
   [VERIFIED]
2. **Two-tone soft terminator + night-gated cities** — widen/soften the
   terminator to a band, cool the day limb, keep the scarce warm dusk arc, gate
   amber cities strictly to `vNight`. Elevates what's already there, free.
   [VERIFIED]
3. **Rimless dissolve — radial alpha-falloff** on rings/graticule so bands melt
   into additive scatter instead of ending at a hard geometry edge; softer point
   core (`pow(1.0 - d, 3.0)`). Free. [VERIFIED]
4. **Bounded curl-wobble in the vertex shader** — pure `snoise(pos + uTime)`
   displacement ~0.5–1% of R; cheap organic life, no FBO. (True GPGPU flow-field
   is FBO/jsm = a build cost — skip for land-locked points.) [VERIFIED]
5. **Dissolve / scan-reveal on lock** — `onBeforeCompile`-inject `cnoise` vs a
   `uProgress` uniform (`discard` below the front, bright edge band at the front)
   driven by the existing `lockT`. Diegetic "scanning… acquired." Injection is
   pure; the glowing edge reads best *with* the §1 bloom pass. [VERIFIED]
6. **Rare scanlines / RGB-fringe** — as a **modulation (multiply/darken), never
   additive**, gated behind a rare `uGlitch` pulse (95% of the time clean). The
   "high-status artifact." True screen-space chromatic aberration is a post pass
   (needs §5). [VERIFIED scanlines; PASS for full-screen CA]

**Additive blow-out survival kit (cross-cutting, over near-black):** additive Σ
clips to white → design so most pixels stay dark and few stack; **channel
discipline** — cool instrument leads **B/G, keep R low**; the only place R rises is
the scarce warm dusk/city emitter. **Modulate, don't add, for texture** (scanlines/
fringe). Weight brightness *down* by facing & depth. Every glow term gets a low cap
+ a `pow()` to stay thin. If the §1 bloom pass lands, keep all *source* intensities
in ~[0,1] — bloom is a blow-out multiplier. [VERIFIED/WORKING]

---

## 3. Interactivity — all vanilla-global (this is fully reachable)

Raycasting, GPU picking, screen-projection, and every scan-and-tag CSS/JS block
ship on the UMD global. Only `CSS2DRenderer`, `OrbitControls`, and `three-mesh-bvh`
need a build — **all three are avoided** in the recommended model.

- **Don't raycast the particle cloud.** `Points.threshold` is a single global
  world-unit scalar that ignores per-point size (issue #5105), is O(n) per cast,
  and breaks under scroll-dolly. **Instead: an invisible proxy `Mesh` sphere at
  Earth radius** — raycast that, hit `.point` → normalize → lat/lon → nearest
  district. Discrete targets (Dallas/Tokyo nodes, district/station dots as one
  `InstancedMesh` → `instanceId`, the arc via an invisible fatter tube proxy)
  become their own small pickables. A handful of objects → sub-ms per-move cast.
  [VERIFIED]
- **GPU color-picking is the documented escalation** (ID→color, render to a 1×1
  scissored target, `readRenderTargetPixels` with Y-flip) for pixel-exact Points/
  arc picking or shader-animated targets — at the cost of a synchronous readback
  stall; throttle it. Not needed at our target density. [VERIFIED]
- **One `hover → focus → select` state machine**, id-cached so the scan fires once
  per acquisition; raycast **only on throttled `pointermove`**, drive the animated
  transition in rAF. [VERIFIED]
- **Bidirectional DOM↔3D:** hand-rolled `worldToScreen` (`Vector3.project(camera)`
  → pixels; hide when `z>1` or far-side via `dir·cam`) places a DOM HUD label over
  the focused node; DOM rows carry `data-*-id` and call the **same** `focus(id)`.
  Prefer this over `CSS2DRenderer` (jsm) — zero deps + control over *when* labels
  appear. [VERIFIED]
- **`scanTag(target)` as one shared primitive:** bracket snaps on → corner ticks →
  one glitch tick → readout types in → sweep line. DOM/CSS overlay for crisp text.
  Invoked identically from a 3D hover or a DOM row hover. [EXTRACTED]
- **Touch/LITE:** gate on `matchMedia('(hover:hover) and (pointer:fine)')`. Coarse
  → collapse to **tap-to-tag** (`pointerup` + ~10px move-threshold vs. the orbit
  drag), latch the readout, tap-away to release; ~44px hitboxes; trim glitch/sweep
  for the mobile budget. [VERIFIED]
- **Keep the existing custom gyro/dolly controls — do not add OrbitControls.**

---

## 4. Prior-art board (the "stash") — ranked to our additive-noir particle globe

**Drop-in beside r158 (ship UMD/script-tag builds):**
- **three-globe** (vasturiano) — reusable `ThreeGlobe()` object; **Points, Arcs,
  Rings (propagating scan-pulses), Particles, Labels, Custom** layers;
  `setPointOfView(camera)`. Maps 1:1 onto our terminator/arc/scan ambitions. Ships
  npm **and** script-tag/UMD. [VERIFIED]
- **globe.gl** (vasturiano) — standalone UMD wrapper over three-globe; has an
  `emit-arcs-on-click` interaction example. [EXTRACTED]

**Lift the code, not the repo (plain-three techniques in bundled repos):**
- **GitHub globe** — the engineering write-up is a technique bible: **halo = custom
  shader on the BACKSIDE of a 1.15× sphere** (cheaper than a bloom pass), ~12k
  circles via `InstancedMesh` gated by a PNG alpha mask, arcs = `CubicBezierCurve3`
  + `TubeGeometry` animated by **`setDrawRange()`** (6%/frame ease-out), **raycast
  hover** for metadata, 4-tier FPS degradation, moiré-kill distance fade.
  [VERIFIED] · reusable code: `janarosmonaliev/github-globe`. [EXTRACTED]
- **Stripe globe** — **per-dot `countryId` passed into the fragment shader** for
  per-dot twinkle/tag = *literally the scan-and-tag mechanism* ("instrument only
  the focus" — light one tagged point without touching the rest); arcs via d3
  `geoInterpolate` + `setDrawRange`. [VERIFIED]
- **Codrops "Cyberpunk-inspired Three.js Scene"** — **vanilla three.js**, our exact
  aesthetic: stacked **`BloomEffect` (mipmapBlur) + `ChromaticAberrationEffect` +
  hue/sat grade** on near-black. Uses **pmndrs `postprocessing`** (⇒ import-map +
  three-upgrade path, see §5). The lush "award-site" reference. [VERIFIED]
- **ektogamat `threejs-vanilla-holographic-material`** — one-file Fresnel rim +
  scanlines + glitch + additive; "works best with bloom." Dial fresnel down for
  our rimless read. [VERIFIED]

**Technique-only (cannot import):**
- **COBE** — gorgeous, but a **5KB custom-WebGL** globe (Spherical-Fibonacci in a
  fragment shader) that **owns its own GL context — NOT three.js**, no `Object3D`
  to `scene.add`. Borrow the *look* (dense dot field, tight rim glow, drag-inertia),
  re-implement in a `Points` shader. [VERIFIED]
- **Google `dataarts/webgl-globe`** (archived, ancient three.js), **GMUNK** (film
  FUI — dot-grid scaffold, scarce unified accent = our instrument look). [VERIFIED/
  EXTRACTED]

**Top borrowables mapped to us:** scan-and-tag = Stripe per-dot ID→shader + §1
selective bloom; cheap holo halo = GitHub backside-sphere shader + §2 Fresnel rim;
arc reveal = `setDrawRange()` + `TubeGeometry` + `geoInterpolate`; scan-pulse rings
= three-globe Rings layer.

---

## 5. Integration spine + r158 risk (only relevant IF we adopt official post)

If Plan C ever needs official jsm passes, the **recommended path is (a):** a
**vendored import-map + a `window.THREE = THREE` shim + a tiny `boot.mjs`** that
`import()`s the (byte-identical) existing scene files. This is *still "no-build"*
(native ES modules, files dropped on a host), leaves `background.js`/`effects.js`/
etc. **unchanged** (they keep reading `window.THREE`), keeps a **single** THREE
instance, and is the **only** option that also unblocks upgrading past r158.
Fallback **(c):** hand-port ~9 pass files to a `window.POST` global (keeps the
classic-script model 100%, but you own the ports forever). Reject **(d) a bundler**
(kills "drop files on a host") and **(e) pmndrs-UMD** (doesn't exist). [VERIFIED]

**r158 risk list (highest first), for the composer path only:**
1. **Transparent-canvas × bloom = opaque black** — the gate for official post.
   Needs RGBA target + `clearAlpha 0` + a `transparent:true` final pass + patching
   UnrealBloom's opaque composite. [VERIFIED]
2. **Missing `OutputPass` → dark/washed colors** — a composer removes the on-screen
   sRGB conversion (r155+); `OutputPass` must end the chain. [VERIFIED]
3. **Additive glow shifts behind a composer** — accumulation moves from
   sRGB-encoded default-framebuffer to **linear HalfFloat** target; same materials
   look brighter/hue-shifted. All bloom tuning must be redone against the
   composited look. [WORKING]
4. **Load-order trap** — deferred module vs classic-script timing; solved by the
   `boot.mjs` dynamic-`import()` sequence in path (a). [VERIFIED]

**Already-fine (no action):** color management is *already* active at r158 defaults
(the current on-screen render **is** the color-managed reference — don't disable
it); `useLegacyLights` is **N/A** (scene has no lights); `ShaderMaterial.
forceSinglePass`/Points-UV deltas are low/no impact (additive, order-independent).
[VERIFIED]

---

## 6. Synthesis — recommended build strategy for Plan C

The research collapses the space to **two coherent paths**, and they differ *only*
in the bloom/postprocessing decision — shaders (§2) and interactivity (§3) are
pure-global and identical in both:

- **Path 1 — Pure-global (recommended default).** Ship all §2 shader elevations +
  all §3 interactivity, and get bloom via the **hand-rolled half-res selective
  additive pass** (§1) or the DOM blur+screen trick. **Zero change to how the site
  loads JS**, no build, sidesteps the transparency bug, mobile-safe. Downside:
  "just bloom" — no easy chromatic-aberration/color-grade stack, and you own a
  small custom pass.
- **Path 2 — Import-map + official post (the bigger swing).** Adopt §5 path (a),
  then either three's own r158 `UnrealBloomPass` (must solve transparency) or —
  for the lush Codrops-cyberpunk **bloom + CA + grade** stack — pmndrs
  `postprocessing` (which *also* forces a three upgrade past r158). Richer,
  more "award-site," but real added risk (transparency, glow re-tune, load-order,
  version churn) and it restructures `index.html`.

**Recommendation:** **Path 1 now.** It banks ~90% of the "wow" (the Fresnel limb,
two-tone terminator, rimless dissolve, scan-and-tag interactivity, selective glow)
at near-zero architectural risk and keeps the site's defining drop-on-a-host
simplicity. Keep **Path 2 fully documented and ready** (§5) as a deliberate
escalation if, after seeing hand-rolled bloom in place, we decide we want the
HDR-threshold selective bloom or the CA/grade stack — that upgrade also becomes the
moment we move off the dead-end r158 UMD build.

---

## 7. Open debts / measurement gaps

- **No perf numbers are measured** — all ms figures are estimates/[EXTRACTED] from
  third parties. A profiling pass on the real scene (desktop + a mid phone) should
  precede committing bloom.
- **The hand-rolled bloom pass is not prototyped** — [WORKING]. First build step
  should be a spike proving the additive half-res blit preserves canvas
  transparency on the actual page.
- **three-globe / globe.gl loading *beside* an existing r158 UMD global is
  unverified** — they ship UMD, but two-THREE-instance / version-match needs a
  smoke test before relying on them (we may only borrow techniques, not the lib).
- **pmndrs-on-older-three** ("some pre-6.36 release supports r158") is [WORKING],
  not confirmed — if Path 2 via pmndrs is ever chosen, pin & verify.
- Interactivity/shader ms costs are [WORKING] for *our* particle counts; revisit
  under LITE.

---

## References (consolidated, highest-value — all surfaced via WebSearch/WebFetch)

| link | establishes | tier |
|---|---|---|
| github.com/mrdoob/three.js/wiki/Migration-Guide | r152 ColorManagement default; r155 `OutputPass` for post; r153 HalfFloat composer target; r148 examples/js removal context | [VERIFIED] |
| discourse.threejs.org/t/the-examples-js-directory-will-be-removed-with-r148/45349 | `examples/js` removed r148 → passes are jsm-only at r158 | [VERIFIED] |
| github.com/mrdoob/three.js/issues/14104 | UnrealBloomPass breaks `alpha:true` (opaque black); closed "not planned" | [VERIFIED] |
| discourse.threejs.org/t/unrealbloompass-makes-background-black/38994 | maintainer: bloom "does not support transparent backgrounds" | [EXTRACTED] |
| github.com/mrdoob/three.js/pull/25435 · issues/27763 | UMD `build/three.js` removed r160/r161 → r158 UMD is a dead-end | [VERIFIED] |
| blog.frost.kiwi/dual-kawase/ · Intel fast-blur investigation | dual-Kawase 1.5–3× cheaper than Gaussian, ideal for bloom | [VERIFIED] |
| threejs.org/examples/webgl_postprocessing_unreal_bloom_selective.html | official selective bloom (2 composers, dark-swap, additive merge) | [EXTRACTED] |
| github.com/pmndrs/postprocessing (+ wiki Build-Setup) | better composer but ESM-only, no UMD; peer three ≥0.168 | [VERIFIED] |
| discourse.threejs.org/t/how-to-create-an-atmospheric-glow-effect-...-globe/32852 | Fresnel BackSide atmosphere shell, light-weighted rim GLSL | [VERIFIED] |
| threejs-journey.com/lessons/hologram-shader | Fresnel + scanlines + vertex glitch ShaderMaterial | [VERIFIED] |
| tympanus.net/codrops/2025/02/17/implementing-a-dissolve-effect-...-three-js/ | dissolve via onBeforeCompile + cnoise + uProgress + edge bloom | [VERIFIED] |
| thebookofshaders.com/07/ · blog.maximeheckel.com (particles) | SDF radial falloff / soft point glow (`pow(1-d,3)`) | [VERIFIED] |
| sangillee.com/2024-06-07-create-realistic-earth-with-shaders/ | day/night terminator + fresnel earth shader | [VERIFIED] |
| threejs.org/docs/#api/en/core/Raycaster + examples/webgl_interactive_raycasting_points | Raycaster API; `params.Points.threshold` semantics | [VERIFIED] |
| github.com/mrdoob/three.js/issues/5105 | Points raycast ignores per-point size (why proxy-mesh wins) | [VERIFIED] |
| threejs.org/examples/webgl_interactive_cubes_gpu.html | canonical GPU color-picking (ID→color, readRenderTargetPixels, Y-flip) | [VERIFIED] |
| manu.ninja/webgl-three-js-annotations/ · ramijames.com (html overlays) | `worldToScreen` project math + far-side occlusion; CSS2DRenderer = jsm | [VERIFIED] |
| github.com/vasturiano/three-globe · vasturiano/globe.gl | reusable globe object, UMD build, Rings/Arcs/Particles/Points layers | [VERIFIED] |
| github.blog/engineering/...how-we-built-the-github-globe/ | backside-shader halo, InstancedMesh circles, setDrawRange arcs, raycast hover | [VERIFIED] |
| stripe.com/blog/globe | per-dot countryId→fragment-shader tag (= scan-and-tag mechanism) | [VERIFIED] |
| github.com/shuding/cobe (+ shud.in/thoughts/cobe) | custom-WebGL globe (NOT three.js) — look-only, cannot import | [VERIFIED] |
| tympanus.net/codrops/2023/03/22/cyberpunk-inspired-three-js-scene-...  | vanilla-three bloom+CA+grade stack (pmndrs postprocessing) | [VERIFIED] |
| github.com/ektogamat/threejs-vanilla-holographic-material | one-file Fresnel+scanline+glitch additive holo material | [VERIFIED] |
| sbcode.net/threejs/importmap/ · web.dev/blog/import-maps-in-all-modern-browsers | import-map + `three/addons/` pattern; Baseline 2023 (Safari 16.4+) | [VERIFIED] |

*Related: this ceiling grounds the seven 2026-07-03 elevation briefs (esp. globe)
and `../specs/2026-07-03-design-language-v3.md`; the Plan-C design doc will cite
back to specific §s here.*
