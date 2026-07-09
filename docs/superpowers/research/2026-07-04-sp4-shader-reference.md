# SP4 shader reference — hand-rolled r158 CA + color-grade (durable copy)

> Preserved from the `understand-sp4-postprocessing` research workflow (its /tmp output is ephemeral).
> For the SP4 build: the design is in `../specs/2026-07-04-sp4-postprocessing-design.md`; the EXACT
> chromatic-aberration + color-grade GLSL is in the "handrolled-ca-grade" section below (§1 CA, §2 grade).
> The synthesis (decision, chain order, spike, anchors) follows for completeness.

---

# PART A — Exact CA + color-grade GLSL (handrolled-ca-grade research map)

I have everything I need — the vendored r158 source, the exact SP1 chain, and the renderer/target facts. Here is the feasibility determination.

---

**YES — CA + color-grade ship as hand-rolled r158 `ShaderPass`es preserving the transparent canvas, no r168/pmndrs needed; the single load-bearing caveat is COLOR SPACE: the composer's ping-pong targets are HalfFloat *linear* (the repo's `// RGBA8` comment at `background.js:1623` is wrong — vendored `EffectComposer.js:27` forces `HalfFloatType`), so put the grade AFTER `OutputPass` to grade in tone-mapped sRGB display values, keep every pass `NoBlending`, and have CA read the CENTRE (un-offset) alpha so undrawn pixels stay 0.**

# SP4 Verdict: FEASIBLE-WITH-CARE

It is a near-verbatim reuse of the pattern SP1 already proved (`mixPass`: custom `ShaderMaterial` + `NoBlending` + `gl_FragColor.a = base.a`). `ShaderPass` (vendored `ShaderPass.js`) accepts any `ShaderMaterial`, so two more passes drop straight into `finalComposer`. Nothing here needs r168 or pmndrs. The "care" is four things you must get right, none risky: (1) grade color space, (2) centre-alpha in CA, (3) `NoBlending` on both, (4) the HalfFloat-linear reality vs the misleading in-repo comment.

Grounding facts I confirmed in the vendored r158 source and `background.js`:
- Renderer: `{ antialias:true, alpha:true, powerPreference:'high-performance' }`, defaults `premultipliedAlpha:true`, `outputColorSpace = SRGBColorSpace`, `toneMapping = NoToneMapping` (none set explicitly). High tier dpr = `min(dpr,2)`.
- Both composers built `new POST.EffectComposer(renderer)` with **no** target arg → default `HalfFloatType` RGBA16F targets, `colorSpace` linear. On-screen chain today = `RenderPass → mixPass(NoBlending) → OutputPass`.
- `OutputPass` (`OutputShader.js`) does tone-map(`.rgb`) + `sRGBTransferOETF`, and `sRGBTransferOETF` preserves `.a` → OutputPass is alpha-safe wherever it sits.
- Custom `ShaderMaterial` passes do **NOT** auto-encode to `outputColorSpace` (that is exactly why OutputPass is "REQUIRED", `background.js:1663`). This is what makes a post-OutputPass grade safe from double-encoding.
- `Pass` defaults `clear=false`, `needsSwap=true`; the write buffer is a recycled ping-pong target holding **stale** data → `NoBlending` is mandatory to overwrite, not blend.

---

## 1. Chromatic aberration `ShaderPass` (alpha-preserving)

Radial offset (lens feel: sharp centre, fringed corners). Sample R and B at ± the offset, G at centre, and **pass through the centre-tap alpha**.

```js
const caPass = new POST.ShaderPass(new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    uAmount:  { value: 0.0035 },     // edge fringe, uv units; tune 0.002..0.006
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uAmount;
    varying vec2 vUv;
    void main(){
      vec2  dir = vUv - 0.5;                 // radial from centre; 0 at centre (no normalize -> no NaN)
      float d   = length(dir);
      vec2  off = dir * (uAmount * d);       // |off| = uAmount * d^2  -> lens falloff
      float r = texture2D(tDiffuse, vUv + off).r;
      vec4  c = texture2D(tDiffuse, vUv).rgba;   // CENTRE tap: green + the alpha we keep
      float b = texture2D(tDiffuse, vUv - off).b;
      gl_FragColor = vec4(r, c.g, b, c.a);   // <-- centre alpha => undrawn stays 0
    }
  `,
}));
caPass.material.blending = THREE.NoBlending;   // overwrite stale ping-pong target
```

**Alpha (critical):** confirmed — read `tDiffuse.a` at the **un-offset** uv and write it as `gl_FragColor.a`, exactly like SP1's `mixPass`. This does two things at once given `premultipliedAlpha:true` (alpha-0 regions are premultiplied black, rgb 0):
- Undrawn pixels: centre alpha 0 → transparent, CSS gradient shows through.
- A pixel just *outside* the silhouette whose offset R-tap lands *inside* still gets alpha 0 → the browser discards its rgb → **no coloured ghost bleeds into transparent space.** Offsetting alpha instead would smear the silhouette over the gradient — don't.
- A pixel just *inside* whose offset tap lands *outside* reads that channel as 0 → benign edge darkening = the fringe you want.

**NoBlending:** yes, required (stale write buffer).

## 2. Color-grade `ShaderPass` (alpha-preserving, display-referred)

Analytic lift/gamma/gain + teal-black crush + saturation. No asset needed; exact. GLSL1, drop-in.

```js
const gradePass = new POST.ShaderPass(new THREE.ShaderMaterial({
  uniforms: {
    tDiffuse: { value: null },
    uLift:    { value: new THREE.Vector3(-0.02, 0.006, 0.020) }, // teal shadows: R down, G/B up
    uGamma:   { value: new THREE.Vector3( 1.00, 1.00, 1.04) },   // mids
    uGain:    { value: new THREE.Vector3( 1.05, 1.00, 0.97) },   // highlights lean amber (signal)
    uTeal:    { value: new THREE.Vector3( 0.00, 0.020, 0.030) }, // shadow floor colour
    uTealAmt: { value: 0.6 },
    uSat:     { value: 1.06 },                                   // keep cyan lead / amber pop
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 uLift, uGamma, uGain, uTeal;
    uniform float uTealAmt, uSat;
    varying vec2 vUv;
    const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
    void main(){
      vec4 src = texture2D(tDiffuse, vUv);
      vec3 c = src.rgb;

      // (1) lift/gamma/gain (ASC-CDL-ish). Lift weighted by (1-c) => tints shadows
      //     toward teal-black WITHOUT washing highlights.
      c = c * uGain + uLift * (1.0 - c);
      c = clamp(c, 0.0, 1.0);
      c = pow(c, 1.0 / uGamma);

      // (2) crush blacks toward a teal-black floor, strongest in shadows
      float luma   = dot(c, LUMA);
      float shadow = 1.0 - smoothstep(0.0, 0.35, luma);
      c = mix(c, max(c, uTeal), shadow * uTealAmt);

      // (3) gentle saturation
      c = mix(vec3(dot(c, LUMA)), c, uSat);

      gl_FragColor = vec4(clamp(c, 0.0, 1.0), src.a);   // alpha straight through
    }
  `,
}));
gradePass.material.blending = THREE.NoBlending;
```

**Optional small 3D-LUT** (teal-orange from a colorist) — stay in GLSL1 with a **2D-strip** `THREE.DataTexture` (layout: N tiles → `(N*N)×N`, e.g. 16→256×16). Add uniforms `uLut`(sampler2D, `.colorSpace = NoColorSpace`, `magFilter/minFilter = LinearFilter`) + `uLutSize`(float), then apply `c = lut2D(c);` before the alpha write:

```glsl
uniform sampler2D uLut; uniform float uLutSize;   // texture = (N*N) x N
vec3 lut2D(vec3 c){
  c = clamp(c, 0.0, 1.0);
  float N = uLutSize;
  float bi = c.b * (N - 1.0);
  float b0 = floor(bi), b1 = min(b0 + 1.0, N - 1.0), f = bi - b0;
  float u = (0.5 + c.r * (N - 1.0)) / (N * N);   // red within tile, half-texel inset (no bleed)
  float v = (0.5 + c.g * (N - 1.0)) / N;         // green
  vec3 s0 = texture2D(uLut, vec2(b0 / N + u, v)).rgb;
  vec3 s1 = texture2D(uLut, vec2(b1 / N + u, v)).rgb;
  return mix(s0, s1, f);                          // trilinear via B interpolation
}
```
(Verify against your LUT export's layout.) The `Data3DTexture`/`sampler3D` route is cleaner on WebGL2 but forces `glslVersion: THREE.GLSL3` on the material — avoid it here to keep one GLSL1 pass.

**Alpha:** `src.a` passed straight through; **NoBlending** required.

## 3. Insertion order — after `OutputPass`

Append both to the existing `finalComposer`, after `OutputPass`:

```js
finalComposer.addPass(new POST.RenderPass(scene, camera));
finalComposer.addPass(mixPass);                 // SP1: adds bloom.rgb, keeps base.a (LINEAR)
finalComposer.addPass(new POST.OutputPass());   // tone-map + sRGB; now NOT last -> renderToScreen=false (auto)
finalComposer.addPass(gradePass);               // grades tone-mapped sRGB DISPLAY values
finalComposer.addPass(caPass);                  // LAST -> renderToScreen=true (auto) -> canvas
```

Why after, not before:
- **Grade wants display-referred sRGB 0..1.** Intermediate targets are HalfFloat **linear** (bloom sums can be >1). Lift/gamma/gain + teal-black crush are colorist controls tuned for display space; in linear the gamma knob feels wrong and the black-crush barely registers (linear blacks ≈ 0). After OutputPass they operate on exactly the values a LUT/teal-orange look expects.
- **No double sRGB encode.** `EffectComposer.isLastEnabledPass` auto-sets `renderToScreen`: OutputPass (mid-chain) does the *only* Linear→sRGB; gradePass and caPass are custom `ShaderMaterial` passes → three.js does **not** re-encode their output to `outputColorSpace`, so caPass writes the already-sRGB pixels to the canvas verbatim. (Same mechanism that makes OutputPass mandatory in the first place.)
- **CA is a display/lens artifact** → belongs on the final displayed pixels, last.
- **Alpha survives every hop:** OutputPass preserves `.a`; gradePass/caPass pass it through; all `NoBlending`.
- **Free resize:** `EffectComposer.setSize` loops all passes, and `finalComposer.setSize` already runs in the resize handler (`background.js:1706`) — the two new passes are covered automatically. Insert into `finalComposer`; do **not** spin a third composer.

Alternative (purist single-encode): `… mixPass → gradePass → caPass → OutputPass`, grading in linear HDR. Only prefer this if the grade is a subtle curve rather than lift/gamma/gain; for the teal-black colorist look, after-OutputPass is materially easier to dial.

## 4. r158-specific gotchas

1. **HalfFloat, not RGBA8 (the big one).** Vendored `EffectComposer.js:27` forces `HalfFloatType`; the `// RGBA8 (mobile-safe)` comment at `background.js:1623` is inaccurate. Upside: HDR headroom, no 8-bit banding in the grade, additive bloom >1 survives. Cost: RGBA16F is 2× bandwidth of RGBA8 at dpr2 (the real perf driver). Action: flag/fix that comment so nobody grades in the wrong space assuming 8-bit sRGB targets.
2. **Custom passes never auto-convert color space** (r155+ color management). A pass added after OutputPass outputs verbatim — correct here, but means you must be color-space-explicit; three won't "fix" it.
3. **Additive-glow-in-linear.** `mixPass` adds bloom in linear (physically right). Grading after OutputPass means you grade the tone-mapped/sRGB result, not the raw HDR sum — predictable. (Note `toneMapping = NoToneMapping` today, so OutputPass only sRGB-encodes and bloom highlights clip to white at 8-bit screen; grade sees clamped 0..1.)
4. **Premultiplied alpha** (`premultipliedAlpha:true`): matching SP1's straight-through alpha write keeps compositing consistent; centre-alpha gating in CA prevents color leak into transparent regions (see §1).
5. **NoBlending on both** (stale ping-pong buffer) and **`ShaderMaterial` defaults to NormalBlending** — easy to forget; must override, as SP1 does.
6. Clamp graded rgb `>= 0` before output — HalfFloat stores negatives, and a teal lift can push channels below 0.

## 5. Performance — 2 extra full-screen passes at dpr2

- Fill: at ~1440×900 logical × dpr2 ≈ 5.2M px/pass → ~10.4M invocations/frame for the two, each cheap (CA = 3 taps + ALU; grade = 1 tap + ALU, +1 tap with LUT). On Apple-silicon/discrete GPU expect **~0.5–1.5 ms combined**; both are far lighter than `UnrealBloomPass` (5-level mip down/up + threshold) already in the chain. RGBA16F bandwidth (not ALU) dominates.
- Gating: ride the **exact existing gate** — `BLOOM_SPIKE && quality.name === 'high' && !reduced && window.POST` (`background.js:1599`). CA/grade are only meaningful when the composer chain exists, so gate them to the same condition; they inherit `prefers-reduced-motion` via `reduced`. CA offset magnitude doesn't change fill, so keep it subtle for aesthetics, not perf. If profiling on integrated GPUs bites, cap the post-chain at dpr ≤ 1.5 via `composer.setPixelRatio` — not needed initially.

## Top pitfall

**Grading in the wrong color space.** The intermediate targets are HalfFloat **linear** (repo comment says RGBA8 — it's wrong). Put the color-grade **after** `OutputPass` so lift/gamma/gain/teal-black act on tone-mapped sRGB display values; rely on custom passes not re-encoding (so no double sRGB), keep every pass `THREE.NoBlending`, and make CA read the **centre** (un-offset) alpha so the transparent canvas — and thus the CSS gradient behind it — is preserved exactly.

Reference: chain lives in `/Users/daikieishinuki/Claude Code Projects/Personal Website/js/background.js:1660-1663` (`finalComposer`); vendored passes in `/Users/daikieishinuki/Claude Code Projects/Personal Website/js/vendor/three-0.158.0/examples/jsm/postprocessing/`.

---

# PART B — Full SP4 synthesis (design brief)

Verification complete. The one load-bearing conflict between the two hand-rolled maps is now settled against the vendored source. Here is the brief.

---

# SP4 DESIGN BRIEF — Postprocessing Polish (bloom productionized + chromatic aberration + color-grade)

**Target:** cyber-noir WebGL globe/portfolio, Three.js r158 (vendored ESM), transparent additive canvas over a CSS gradient. **Foundation:** SP1 PROVED alpha-preserving selective bloom (behind `?bloom=1`); SP2 shaded the globe (cool limb + boot reveal); SP3 added DOM-HUD pointer interaction. **This brief seeds the SP4 spec.**

**One-line thesis:** Ship SP1's bloom on-by-default (high tier), then append two hand-rolled `ShaderPass`es to `finalComposer` — a color-grade and a chromatic-aberration pass — **after `OutputPass`, in display-referred sRGB**, each copying `mixPass`'s alpha contract (`NoBlending`, write `vec4(transformed.rgb, base.a)`). No version bump, no new dependency, no rewrite of the proven bloom block.

---

## 1. THE STRATEGIC FORK — RESOLVED: hand-rolled r158 `ShaderPass`

**RECOMMENDATION: Build CA + color-grade as two hand-rolled r158 `ShaderPass`es. Do NOT upgrade to r168 + pmndrs `postprocessing`.** All four maps converge on this; the r168/pmndrs map is decisive against the upgrade.

| Axis | r158 hand-rolled (**CHOSEN**) | r168 + pmndrs (rejected) |
|---|---|---|
| Transparency (the #1 risk SP1 exists to have retired) | **Inherits SP1's PROVEN alpha-0 pattern** (`mixPass`, gate #2 passed) | **Re-opens it** — documented-fragile: issue [#133](https://github.com/pmndrs/postprocessing/issues/133) yields a "blackish glow" on transparent bg (the exact failure mode), alpha absent from README, regressions across 6.33/6.38 ([#286](https://github.com/pmndrs/postprocessing/issues/286), [#529](https://github.com/pmndrs/postprocessing/issues/529)) |
| Infra | **None** — `POST.ShaderPass` already exposed; `mixPass` (1630-1657) is itself a hand-authored inline `ShaderPass` = the template | Full re-vendor + import-map bump + `window.POST` rewrite + vendoring the pmndrs bundle (and any LUT asset) |
| Proven bloom block | **Kept verbatim** | **Rewritten** (two-composer dark-swap → `SelectiveBloomEffect`), then re-tuned + re-gated + re-spiked |
| Unique pmndrs win | — | Merged single `EffectPass` (sub-ms on this few-effect scene) + mipmap-bloom softness. **Both immaterial here**; pmndrs prefers HalfFloat which costs *more* on mobile, where bloom is already OFF |
| CA + grade effort | 2 small inline passes (~15 + ~20 GLSL lines) | Built-in effects (no GLSL) — the only genuine ergonomic win, and it does not outweigh the transparency regression |

**pmndrs would only be worth it** if SP4's ambition grew into a genuinely multi-effect HDR stack where merged-pass perf mattered AND you first re-ran the corner-pixel spike to *prove* alpha-0 (which the evidence says may fail). For the stated scope — CA + grade on already-proven bloom — none of that holds.

**Longevity caveat (decouple, do not bundle into SP4):** r158 UMD is a dead-end (`build/three.js` removed ~r160/r161). A future three bump is eventually prudent — but SP1's ESM import-map already unblocks it *independently* of pmndrs. If/when you bump three for longevity, keep the hand-rolled passes. Do not couple a version bump to SP4.

---

## 2. SP4 SCOPE — sized to ONE spec → plan → build

### IN SCOPE

**(a) Productionize the SP1 bloom.**
- **Ship ON by default (high tier):** at `background.js:1599`, drop the `BLOOM_SPIKE &&` term. Keep `quality.name === 'high' && !reduced && !!(window.POST && window.POST.EffectComposer)`. Retire dev scaffolding: `BLOOM_SPIKE`/`bloomEmptySel` parse (1597-1598), the `if (!bloomEmptySel)` guard (1609), and `__bloomProbe` (1687-1696) — but *keep* the probe's logic transplanted into the SP4 spike harness (see §5) before deleting it.
- **Tier stays high-only by design:** LITE (`coarse || small`, line 15) stays bloom-OFF — the two-composer path ≈ 2× scene render, and mobile bandwidth is the real cost driver. Do not widen tiers in SP4.
- **Re-tune** `BLOOM_STRENGTH / RADIUS / THRESHOLD` (1605) **against the composited HalfFloat buffer and the finished grade** — bloom and grade are tuned together (there is a composite-vs-direct brightness offset to resolve). Governing constraint: keep every emitter *source* intensity in `[0,1]` (bloom is a blow-out multiplier); cool instruments lead B/G with R low so the additive sum does not reach neutral white.
- **SP2 reveal — already integrated, verify only.** The globe Points `earth-land-particles` is bloom-tagged (1616-1617), so the globe glows as the `uReveal` sweep brightens it during boot. Tagging is static and orthogonal to the reveal uniform — no wiring needed; just confirm the reveal-sweep glow reads well at the tuned strength.
- **SP2 limb — DECISION: keep `earth-limb-shell` OUT of the bloom set by default.** It is atmospheric haze, not an emitter core; bloom instruments "only the focus," and the globe brief warns the terminator must not blow out to white (cap limb peak alpha, keep cyan-tinted). During in-browser tuning, *evaluate* a gentle limb bloom only if the terminator reads flat — and if added, tag it and re-verify the peak stays sub-white and cyan. The generic traverse-based dark-swap (1670-1673) already correctly blacks out the limb and `holo-scan-shell` during the bloom pass, so no SP2/SP3 object needs new exclusion wiring.

**(b) Chromatic-aberration `ShaderPass`** — radial, edge-weighted "worn projected glass" fringe. Subtle and always-on-at-low-magnitude is acceptable (matches §6.8 "the grade lives in the air, deepens toward the edges"); an optional stepped sub-second *pulse* on transition/acquisition events is a nice-to-have. Critical alpha rule: read R/B at ±radial offset, **G and alpha at the un-offset centre tap**, write `vec4(r, c.g, b, c.a)`. Magnitude ceiling: ≤ ~1px offset, fringe ghosts ≤ ~0.25 alpha, **never strobe**. Full shader in the `handrolled-ca-grade` map §1.

**(c) Color-grade `ShaderPass`** — analytic lift/gamma/gain + teal-black shadow crush + gentle saturation, **in display-referred sRGB** (see §4). Look targets (from `grade-brief`): crush blacks toward **teal-black** (`#0a1416`–`#0c1f22`, hue ~185–195°); **protect** the electric-cyan emitter `#39f0ff` (never tint the base with it — separate token); keep amber scarce (~1–6% of frame). Full shader in `handrolled-ca-grade` map §2.

### DEFERRED / OUT OF SCOPE

- **pmndrs / r168 upgrade** — §1.
- **3D-LUT (`.cube`) grade** — the analytic lift/gamma/gain + teal crush hits the target without a vendored LUT asset. A 2D-strip `DataTexture` LUT is a documented escalation (`handrolled-ca-grade` §2) only if a colorist later supplies a look; keep it GLSL1.
- **Event-gated CA `uGlitch` pulse tied to named scene beats** — the *hook* can be stubbed, but the acquisition/transition event choreography belongs to the motion surface. Ship the subtle always-on CA; leave loud pulses as a tunable.
- **Per-section temperature switching** (§6.3 "one temperature per section") — the grade pass exposes uniforms, but the *cadence* of cool↔warm switching at section boundaries is the motion brief's job, not SP4's.
- **DOM chromatic ghost-echo** (§4.3) — a CSS text effect, unrelated to this post-pass CA.
- **Widening bloom/grade to LITE** — see §3 gating.

---

## 3. HARD CONSTRAINTS

1. **Preserve the transparent canvas — non-negotiable, every pass.** Each new pass is `THREE.NoBlending` (overwrite the stale ping-pong target, never blend over its prior-frame ghost) and writes `gl_FragColor.a = <un-offset centre>.a` — exactly `mixPass` (1650, 1657). CA must read alpha at the **centre** tap, never the offset taps, or a pixel just outside the silhouette whose R-tap lands inside would drag color into transparent space and reintroduce the ghost gate #2 guards against.
2. **No neutral-white state (§6.7).** Even blow-outs stay tinted + desaturated. The **primary** lever is upstream, not the grade: keep bloom *source* intensities in `[0,1]` and lead cool channels B/G with R low so the additive sum never reaches `(1,1,1)` — saturation math cannot re-tint an already-neutral white core. The grade is the *backstop* (highlight gain leans faintly amber; shadow crush is teal); tune `BLOOM_THRESHOLD`/emitter intensities so cores glow saturated rather than clip.
3. **Keep amber scarce** — warm accent ~1–6% of frame, warm:cool ~1:8 to 1:60+; the highlight-gain amber lean is a whisper, not a wash. Cyan leads.
4. **CA subtle, and OFF the crisp chrome.** The SP3 reticle and all HUD chrome are DOM — the WebGL post chain physically cannot touch them (confirmed: `hud.ret` is a CSS-positioned DOM element, never in `scene.traverse`, never rendered by either composer). This is a free win: bloom/CA/grade the 3D scene freely; the interactive chrome stays crisp by construction.
5. **Reduced-motion + LITE gating is automatic.** CA + grade live *inside* the `if (bloomEnabled)` block and are appended to `finalComposer`, so they exist only when the composer exists. When bloom is off (LITE / `prefers-reduced-motion` / `window.POST` absent), `render()` falls back to direct `renderer.render` (1729-1731) — no composer, no CA, no grade. No separate gating to build.
   - **Tier-consistency note (important):** the dominant ~88% near-black field is the **CSS gradient behind the transparent canvas**, which is all-tier by construction and independent of the grade. The post-grade only tints *drawn* scene pixels on high tier. So the teal-black base reads correctly on every tier via CSS. **Companion action:** the design migration note flags the base literals `#05060a`/`#030407` as blue-black — verify/re-hue the **CSS gradient** to teal-black (`~#0a1416`) so LITE/reduced users get the on-brand floor without a grade. Keep this to the CSS gradient (all-tier, trivial); do not build a second grade path for LITE.
6. **Must not regress SP2/SP3.** SP2 limb + `holo-scan-shell` correctly dark-swap to black in the bloom pass (no glow) and restore — verify unchanged. SP2 reveal blooms via the already-tagged globe — verify. SP3 DOM reticle is untouchable by post — verify the fringe never appears to smear the projected reticle region (it can't, but confirm on-page). SP3 pointer interaction mutates uniforms/opacity on existing objects, orthogonal to static bloom tagging.
7. **Performance.** Two extra full-screen passes at dpr≤2: CA = 3 taps + ALU, grade = 1 tap + ALU. Est. ~0.5–1.5 ms combined on Apple-silicon/discrete — far lighter than the `UnrealBloomPass` already in the chain (SP1 gate #7 measured bloom at 60fps, no measurable cost). Note the SP1 "free" measurement was **already on RGBA16F targets** (see §4), so these two ALU-cheap passes add to an already-measured-free chain. Bandwidth (RGBA16F at dpr2), not ALU, dominates — validate on a real mid-tier device (SP1 gate #7 caveat). Fallback if integrated GPUs bite: cap the post-chain at `composer.setPixelRatio(≤1.5)` — not needed initially.

---

## 4. CHAIN ORDER — grade + CA go **AFTER** `OutputPass` (display-referred sRGB)

**This resolves the one real conflict between the maps. I verified it against the vendored source.**

- The `bloom-current` map proposed inserting CA/grade *between* `mixPass` (1662) and `OutputPass` (1663) — i.e. grading in linear space — because it trusted the in-repo comment at `background.js:1623` (`"no type arg -> RGBA8 target (mobile-safe)"`).
- **That comment is factually WRONG.** Vendored `EffectComposer.js:27` unconditionally does `new WebGLRenderTarget(..., { type: HalfFloatType })`. The composer's ping-pong targets are **RGBA16F linear**, not RGBA8 sRGB. **Fix this comment as part of SP4** so no one grades in the wrong space assuming 8-bit sRGB targets.

Because the targets are linear HalfFloat, the `handrolled-ca-grade` map is correct: **grade after `OutputPass`.**

### The exact final `finalComposer` pass order

```
finalComposer.addPass(new POST.RenderPass(scene, camera));  // 1661  unchanged
finalComposer.addPass(mixPass);                             // 1662  bloom.rgb ADD, keep base.a  (LINEAR)
finalComposer.addPass(new POST.OutputPass());               // 1663  tone-map + sRGB OETF; now NOT last
finalComposer.addPass(gradePass);                           // NEW   crush/tint in sRGB, keep .a
finalComposer.addPass(caPass);                              // NEW, LAST  lens fringe, centre-alpha, keep .a -> canvas
```

### Why after, not before — color-space reasoning

1. **The grade is a display-referred colorist control specified in sRGB hex.** Lift/gamma/gain, the teal-black floor (`#0a1416`), and the `smoothstep(0, 0.35, luma)` shadow mask are all defined on display values in `[0,1]`. In linear HalfFloat (where bloom sums exceed 1 and blacks sit near 0), the gamma knob feels wrong and the black-crush catches a completely different pixel population. The target colors are literally sRGB hex — grade where those hex live.
2. **No double sRGB encode — the enabling fact (verified).** `OutputPass` (mid-chain now, `renderToScreen` auto-flips false) does the *only* linear→sRGB conversion. `gradePass` and `caPass` are custom `ShaderMaterial`s whose fragment shaders do **not** include `<colorspace_fragment>`, so three does **not** re-encode their output to `outputColorSpace` — `caPass` writes its already-sRGB pixels to the canvas verbatim. This is the identical mechanism that makes `OutputPass` "REQUIRED" in the first place (the composer strips on-screen sRGB otherwise; comment at 1663). Confirmed against the render path.
3. **CA is a lens/display artifact** → belongs on the final displayed pixels, outermost.
4. **Alpha survives every hop:** `OutputPass`'s `sRGBTransferOETF` touches only `.rgb`; `gradePass` passes `src.a`; `caPass` writes centre `c.a`; all three `NoBlending`.
5. **Tone-map note:** `toneMapping = NoToneMapping` today, so `OutputPass` only sRGB-encodes; additive bloom cores clip toward white at the 8-bit canvas. The grade sees sRGB values that may exceed 1 in cores (OutputPass renders to a HalfFloat intermediate since it's no longer last) — **clamp graded rgb to `[0,1]`** before output (HalfFloat stores negatives; a teal lift can push a channel below 0).

### CA-vs-grade ordering (the last two) — tunable, no color/alpha consequence

Both are post-`OutputPass`, display-space, `NoBlending`, alpha-safe — so which is last is **purely aesthetic**. Default: **CA last** (the lens fringe is the outermost physical surface, and it inherits the graded tint). If the grade later grows a radial vignette/haze (§6.8 "grade lives in the air"), swap to grade-last so the vignette darkens the fringe at the edges. Ship CA-last; leave the swap as a one-line tunable.

**Rejected alternative** (`mixPass → gradePass → caPass → OutputPass`, grading in linear HDR): only viable for a subtle curve, not the hex-specified teal-black colorist look. Rejected.

---

## 5. KEY RISKS + REQUIRED SPIKE

**REQUIRED SPIKE — extend SP1's corner-pixel gate to the full CA+grade chain, on the real page.** This is the gate that lets SP4 ship; do it before deleting `__bloomProbe`. Transplant the `1687-1696` probe (sync frame + `gl.readPixels`) to run with `gradePass` + `caPass` in `finalComposer`.

Pass/fail criteria:
1. **Undrawn corner alpha ≈ 0** AND the CSS gradient is *visibly* behind the canvas (not a black/teal rectangle) — the transparency invariant.
2. **Centre pixel alpha > 0** (globe drawn) — proves the read is live, not a cleared buffer.
3. **CA silhouette-edge sub-test (the new failure mode CA introduces that bloom did not):** a pixel just *outside* the globe silhouette whose CA R-offset tap lands *inside* must still read **alpha 0** → no colored ghost bleeds into transparent space. This directly validates the centre-alpha discipline (§3.1). If this fails, CA is reading alpha from an offset tap — fix the shader, do not ship.
4. **Stability across states:** steady state, during the SP2 boot reveal, after a debounced resize (both composers `setSize`, 1706), through a WebGL context-loss/restore (1724-1727), and with SP3 pointer interaction active.

If the spike fails criteria 1 or 3, SP4 does not ship until the alpha write is corrected — same bar SP1 held.

**Other risks:**
- **Grading in the wrong color space** (the top pitfall) — mitigated by §4 (grade after OutputPass) + fixing the wrong `RGBA8` comment at 1623.
- **`ShaderMaterial` defaults to `NormalBlending`** — easy to forget; both new passes MUST set `.material.blending = THREE.NoBlending`, as `mixPass` does (1657).
- **Rain-droplet interaction (regression-watch, verify in spike):** `droplets.update(dt)` at **1881-1882** samples "THIS frame's buffer" *after* `render()`. Under `?bloom=1` this already coexists with the composer, but SP4 makes the composer the **default** high-tier path for the first time — confirm the rain lenses still sample the composited (graded, CA'd) frame correctly and don't double-render or read a stale/direct buffer. Not expected to break; must be observed, not assumed.
- **`OutputPass` no longer last:** flipping `renderToScreen` from OutputPass to `caPass` is automatic (`EffectComposer.isLastEnabledPass`), but verify no code path assumed OutputPass writes the canvas.

---

## 6. CONCRETE BUILD ANCHORS — `js/background.js` (all line numbers verified against the file)

The entire feature is one `if (bloomEnabled) {…}` block, **1603-1697**.

| What SP4 touches | Lines | Action |
|---|---|---|
| **Gate** | **1599-1600** | Delete `BLOOM_SPIKE &&`. Keep `quality.name === 'high' && !reduced && !!(window.POST && window.POST.EffectComposer)`. |
| Dev-flag parse | 1597-1598 | Delete `BLOOM_SPIKE` / `bloomEmptySel`. |
| Empty-sel guard | 1609 | Remove the `if (!bloomEmptySel)` wrapper (keep the tagging body 1610-1617). |
| **Bloom tunables** | **1605** | Re-tune `BLOOM_STRENGTH / RADIUS / THRESHOLD` against the composited buffer + grade. |
| Emitter tagging | 1610-1617 | Verify set; DECISION on `earth-limb-shell` (§2a) — default leave untagged. |
| **WRONG comment** | **1623** | Fix `"RGBA8 (mobile-safe)"` → HalfFloat/RGBA16F linear (verified `EffectComposer.js:27`). |
| `mixPass` (the template) | 1630-1657 | Unchanged — copy its alpha contract (`NoBlending` 1657; `vec4(rgb, base.a)` 1650) into the new passes. |
| **`finalComposer` chain** | **1660-1663** | Append `gradePass` then `caPass` **after** `OutputPass` (1663). See §4. |
| Dark-swap / sequencing | 1665-1682 | Unchanged — generic traverse already covers SP2/SP3 objects. |
| `__bloomProbe` | 1687-1696 | Transplant into the SP4 spike harness (§5), then delete for production. |
| **Resize** | **1706** | No new wiring — `finalComposer.setSize` propagates to all appended passes automatically (a CA pass with an explicit `resolution` uniform would need a `setSize` override; the radial-offset CA in `handrolled-ca-grade` §1 uses none, so nothing to add). |
| **`render()` indirection** | **1729-1731** | Unchanged — `renderBloomThenFinal` already routes the composer path; all 4 call sites inherit it. |
| `render()` call sites | reduced one-shot **1751**, fonts.ready re-present **1755**, contextrestored **1725**, main loop **1881** | No change — they route through the `const render` at 1729. |

**Reference shader bodies (do not re-derive):** CA pass → `handrolled-ca-grade` map §1; color-grade pass → §2; both are drop-in GLSL1 `POST.ShaderPass(new THREE.ShaderMaterial({…}), 'tDiffuse')` (default `textureID` is `tDiffuse`, unlike `mixPass`'s custom `'baseTexture'`).

**Adjacent files (context, not edited by SP4's core):** `index.html` (import-map 344-345) and `js/boot.mjs` (`window.POST`) stay as-is — no new passes to vendor, `POST.ShaderPass` is already exposed. The CSS-gradient teal-black re-hue companion (§3.5) lives in the site CSS, not `background.js`.