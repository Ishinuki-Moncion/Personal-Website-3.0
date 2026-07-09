# SP4 — Postprocessing Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the lush postprocessing stack — turn SP1's alpha-preserving selective bloom ON by default (high tier), then append two hand-rolled r158 `ShaderPass`es to `finalComposer` (a color-grade, then a chromatic-aberration), each copying `mixPass`'s alpha contract, all in display-referred sRGB after `OutputPass` — plus an all-tier teal-black CSS floor.

**Architecture:** All engine edits live inside the one existing `if (bloomEnabled) {…}` block in `js/background.js` (`:1603-1697`). No new composer, no version bump, no new dependency — `POST.ShaderPass` is already exposed (`boot.mjs:14`) and `mixPass` (`:1630-1657`) is the working template. The grade + CA passes are drop-in `POST.ShaderPass(new THREE.ShaderMaterial({…}), 'tDiffuse')`, both `NoBlending`, both appended **after** `OutputPass` so they operate on tone-mapped sRGB display values (the composer's ping-pong targets are HalfFloat **linear** — the in-repo `// RGBA8` comment at `:1623` is wrong and gets fixed). The SP1 corner-pixel probe is extended into a ship-gate that proves CA never touches alpha, then deleted for production. A companion CSS re-hue moves the ~88% base field from blue-black to teal-black (all-tier, `css/site.css`).

**Tech Stack:** three.js r158 (vendored ESM, global `window.THREE` + `window.POST`), vanilla JS, GLSL1 fragment shaders, no build.

**Spec:** `docs/superpowers/specs/2026-07-04-sp4-postprocessing-design.md` (committed `10a153e`). Exact GLSL preserved in `docs/superpowers/research/2026-07-04-sp4-shader-reference.md` (committed `6bf7bf1`) — reproduced verbatim below, do **not** re-derive.

## Global Constraints

- **Pure no-build.** No version bump of three, no new dependency, no new render target/composer. Everything is two more `ShaderPass`es appended to the existing `finalComposer`.
- **Transparent canvas — every pass** (`premultipliedAlpha:true`): each new pass MUST set `.material.blending = THREE.NoBlending` (`ShaderMaterial` defaults to `NormalBlending`) and write `gl_FragColor.a = <un-offset centre>.a`. CA reads R/B at `±off`, **G + alpha at the un-offset centre tap** → a pixel just outside the silhouette whose offset tap lands inside still reads alpha 0 (no colored ghost). This is the SP1 gate #2 invariant, extended.
- **Grade + CA go AFTER `OutputPass`, in display-referred sRGB.** Composer targets are RGBA16F **linear** (`EffectComposer.js:27` forces `HalfFloatType`). `OutputPass` does the only linear→sRGB encode; the two custom passes omit `<colorspace_fragment>` so three does not re-encode them → they write display-sRGB to the canvas verbatim. **Clamp graded rgb to `[0,1]`** before output.
- **No neutral-white state.** Primary lever is upstream — keep emitter *source* intensities in `[0,1]`, lead B/G with R low. The grade is the backstop (highlight-gain amber whisper, shadow teal crush). **Amber scarce** (~1–6% of frame, warm:cool ~1:8+); cyan leads.
- **Auto-gated, no new gating.** Grade + CA live inside `if (bloomEnabled)` (`quality.name === 'high' && !reduced && window.POST`), appended to `finalComposer`. When bloom is off (LITE / reduced / no `POST`), `render()` falls back to direct `renderer.render` (`:1729-1731`) — no composer, no post. Bloom stays **high-tier only**.
- **No SP2/SP3 regression:** the generic dark-swap traverse (`:1665-1682`) already blacks out the SP2 limb + `holo-scan-shell` during the bloom pass and restores them (verify). The SP2 globe reveal blooms via the already-tagged `earth-land-particles` (verify). The SP3 reticle + all HUD chrome are **DOM** — physically untouchable by the WebGL post chain.
- **Rain-droplet regression watch:** `droplets.update(dt)` (`:1882`) samples "this frame's buffer" after `render()`. SP4 makes the composer the DEFAULT high-tier path for the first time — confirm the rain lenses sample the composited (graded, CA'd) frame, not a stale/direct buffer.
- **Dev cache:** hard-reload (Cmd+Shift+R) to pick up `background.js` / `site.css` during a task. Deploy cache-busts: `js/boot.mjs` `V.bg` (currently `'3.8'`) for JS, `index.html:13` `css/site.css?v=` (currently `3.7`) for CSS — bumped in the tasks that need them.
- **Verify** each task: `node --check js/background.js` → local static server + Chrome hard-reload at `?sceneDebug=1&cb=sp4tN` → drive via claude-in-chrome `javascript_tool` + `read_page`/screenshots. `window.__sceneDebug()` must stay at parity (`quality:'high'`, `globeParticles:7000`, dpr ≤ 2). The ship gate is the `readPixels` probe, not a unit test — this is a WebGL scene.

**Key facts (verified in source):**
- Gate `:1599-1600` `const bloomEnabled = BLOOM_SPIKE && quality.name === 'high' && !reduced && !!(window.POST && window.POST.EffectComposer);`
- `window.POST = { EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass }` — statically imported at `boot.mjs:14`, exists before any scene code. `POST.ShaderPass` is available.
- `mixPass` template (`:1630-1657`): custom `ShaderMaterial`, `needsSwap=true`, `.material.blending = THREE.NoBlending` (`:1657`), writes `vec4(base.rgb + bloom.rgb, base.a)` (`:1650`). Its `textureID` is `'baseTexture'` (custom); the new passes use the **default** `'tDiffuse'`.
- `finalComposer` chain today (`:1660-1663`): `RenderPass → mixPass → OutputPass`. `renderBloomThenFinal` (`:1677-1682`) = `traverse(darken) → bloomComposer.render() → traverse(restore) → finalComposer.render()`. `render` (`:1729`) routes to it on high tier; all call sites (`:1751,1755,1725,1881`) inherit it.
- Probe `window.__bloomProbe` (`:1687-1696`): `renderBloomThenFinal()` then `gl.readPixels` corner(1,1) + centre. Extended in Task 2, deleted in Task 5.
- Resize `:1706` `if (bloomComposer) { bloomComposer.setSize(w,h); finalComposer.setSize(w,h); }` — `EffectComposer.setSize` loops all passes; the radial CA uses **no** `resolution` uniform, so nothing new to wire.
- High profile (`getQualityProfile`, `:16-52`): `dpr:min(dpr,2)`, `globeParticles:7000`. `LITE = coarse || small` (`:15`) stays bloom-OFF.
- CSS base field: `--void:#05060a` (`site.css:7`) on `html`/`body`, `--void-2:#080a10` (`:8`), boot overlay `#030407` (`:184`), `<meta theme-color content="#05060a">` (`index.html:8`).

---

### Task 0: Productionize the SP1 bloom (ON by default; retire dev scaffolding; fix the wrong comment)

**Files:** Modify `js/background.js` — the bloom-gate + parse (`:1596-1600`), the empty-sel guard (`:1609-1618`), the wrong RGBA8 comment (`:1623`).

**Interfaces — Produces:** `bloomEnabled` now true on high tier with no query flag; `?bloom=1`/`?emptySel=1` removed. No signature changes downstream (`renderBloomThenFinal`, `render`, `__bloomProbe` unchanged this task).

- [ ] **Step 1: Drop the dev-flag parse + gate term.** Replace (`:1596-1600`):

```js
  const bloomParams  = new URLSearchParams(location.search);
  const BLOOM_SPIKE  = bloomParams.get('bloom') === '1';
  const bloomEmptySel = bloomParams.get('emptySel') === '1';   // gate #3 A/B: tag nothing
  const bloomEnabled = BLOOM_SPIKE && quality.name === 'high' && !reduced &&
                       !!(window.POST && window.POST.EffectComposer);
```

with:

```js
  // SP4: bloom is ON by default (high tier). The ?bloom=1 spike flag is retired.
  const bloomEnabled = quality.name === 'high' && !reduced &&
                       !!(window.POST && window.POST.EffectComposer);
```

- [ ] **Step 2: Remove the empty-sel A/B guard, keep the tagging body.** Replace (`:1609-1618`):

```js
    if (!bloomEmptySel) {
      [fieldCyan, fieldAmber, tokyoRing, pingRing, comet].forEach(o => { o.userData.bloom = true; });
      tokyoHalo.glow.userData.bloom = true;                       // glow Sprite (makeGlowSprite, 497)
      tokyoHalo.rings.forEach(r => { r.userData.bloom = true; }); // ring meshes/line (487-491)
      // Inline-added objects (no variable handle) — tag by their nameObject() name:
      //   globe Points  background.js:260  'earth-land-particles'
      //   arc   Line    background.js:816  'dallas-to-tokyo-arc'
      const bloomByName = new Set(['earth-land-particles', 'dallas-to-tokyo-arc']);
      scene.traverse(o => { if (bloomByName.has(o.name)) o.userData.bloom = true; });
    }
```

with (same body, wrapper removed):

```js
    [fieldCyan, fieldAmber, tokyoRing, pingRing, comet].forEach(o => { o.userData.bloom = true; });
    tokyoHalo.glow.userData.bloom = true;                       // glow Sprite (makeGlowSprite, 497)
    tokyoHalo.rings.forEach(r => { r.userData.bloom = true; }); // ring meshes/line (487-491)
    // Inline-added objects (no variable handle) — tag by their nameObject() name:
    //   globe Points  background.js:260  'earth-land-particles'
    //   arc   Line    background.js:816  'dallas-to-tokyo-arc'
    const bloomByName = new Set(['earth-land-particles', 'dallas-to-tokyo-arc']);
    scene.traverse(o => { if (bloomByName.has(o.name)) o.userData.bloom = true; });
```

- [ ] **Step 3: Fix the wrong color-space comment.** Replace (`:1623`):

```js
    bloomComposer = new POST.EffectComposer(renderer);   // no type arg -> RGBA8 target (mobile-safe)
```

with:

```js
    bloomComposer = new POST.EffectComposer(renderer);   // no type arg -> HalfFloatType RGBA16F LINEAR target (EffectComposer.js:27)
```

- [ ] **Step 4: Syntax + dead-flag scan.** Run:

```bash
node --check js/background.js && grep -nE "BLOOM_SPIKE|bloomEmptySel|bloomParams|['\"?]bloom=1" js/background.js
```

Expected: `node --check` prints nothing (exit 0); the `grep` prints **nothing** (all dev flags gone).

- [ ] **Step 5: Browser — bloom on by default.** Start a static server in the project root if one isn't running (`python3 -m http.server 8080`). Hard-reload `http://localhost:8080/?sceneDebug=1&cb=sp4t0`. Via `javascript_tool`:
  - `window.__sceneDebug()` → `quality:'high'`, `globeParticles:7000`, dpr ≤ 2 (parity).
  - `window.__bloomProbe()` → `{corner:[…,0], centre:[…,>0]}` (corner alpha 0 = transparent; centre alpha > 0 = live read). **With NO `?bloom=1` in the URL** — proves it's on by default.
  - Screenshot: the cyan emitters (fields, Tokyo ring/halo, arc/comet, globe land particles) visibly glow; the CSS field shows through transparent regions; no console errors.

- [ ] **Step 6: Commit.**

```bash
git add js/background.js && git commit -m "feat(sp4): productionize bloom — ON by default (high tier), retire ?bloom spike flag, fix RGBA8->HalfFloat comment

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 1: Color-grade `ShaderPass` (analytic lift/gamma/gain + teal-black crush, after `OutputPass`)

**Files:** Modify `js/background.js` — define `gradePass` after the `mixPass` block (before `// (d) finalComposer`, ~`:1658`); append it to `finalComposer` after the `OutputPass` line (`:1663`).

**Interfaces — Consumes:** `POST.ShaderPass`, `THREE.ShaderMaterial`, `THREE.Vector3`, `THREE.NoBlending`. **Produces:** module-scope `gradePass` (uniforms `uLift/uGamma/uGain/uTeal/uTealAmt/uSat` — retuned in Task 4); `finalComposer` chain becomes `RenderPass → mixPass → OutputPass → gradePass`.

- [ ] **Step 1: Define `gradePass`.** Insert immediately after the `mixPass` block — i.e. after the line `mixPass.material.blending = THREE.NoBlending;   // NOT transparent=true — overwrite the stale target` and before the `// (d) finalComposer` comment:

```js
    // (c2) gradePass — analytic lift/gamma/gain + teal-black shadow crush + gentle
    //      saturation, in DISPLAY-referred sRGB (runs AFTER OutputPass). NoBlending,
    //      alpha straight through. Uniforms retuned in browser (SP4 Task 4).
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

- [ ] **Step 2: Append `gradePass` to `finalComposer`.** Find (`:1663`):

```js
    finalComposer.addPass(new POST.OutputPass());   // REQUIRED: composer strips on-screen sRGB otherwise
```

and add the grade pass immediately after it:

```js
    finalComposer.addPass(new POST.OutputPass());   // REQUIRED: composer strips on-screen sRGB otherwise
    finalComposer.addPass(gradePass);               // SP4: grade tone-mapped sRGB display values, keep .a
```

- [ ] **Step 3: Syntax.** Run: `node --check js/background.js` → exit 0, no output.

- [ ] **Step 4: Browser — grade renders, alpha preserved.** Hard-reload `?sceneDebug=1&cb=sp4t1`. Via `javascript_tool`:
  - `window.__bloomProbe()` → `corner:[…,0]` still (grade passed `src.a` through — alpha intact), `centre:[…,>0]`.
  - Screenshot: shadows read teal-black (not blue-black), the electric-cyan emitters stay saturated (not tinted toward teal), no crushed/banded artifacts, no console errors. **The look is not final** (bloom+grade tuned together in Task 4) — this step only proves the grade applies and is alpha-safe.
  - Sanity `window.__sceneDebug()` parity unchanged.

- [ ] **Step 5: Commit.**

```bash
git add js/background.js && git commit -m "feat(sp4): color-grade ShaderPass — lift/gamma/gain + teal-black crush in display sRGB, after OutputPass

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Chromatic-aberration `ShaderPass` (last) + extend the probe → ship gate

**Files:** Modify `js/background.js` — define `caPass` after `gradePass`; append it to `finalComposer` (last); replace `window.__bloomProbe` (`:1687-1696`) with `window.__postProbe`.

**Interfaces — Consumes:** `gradePass`, `caPass`, `renderBloomThenFinal`, `renderer`. **Produces:** `caPass` (uniform `uAmount`, retuned in Task 4); `finalComposer` chain becomes `RenderPass → mixPass → OutputPass → gradePass → caPass` (caPass is the canvas writer); `window.__postProbe()` → `{W,H,corner,centre,drawn,alphaDiff,diffX}` (`drawn` = coarse-grid count of alpha>0 pixels — a position-independent live-read, since the globe is offset and a single centre pixel is unreliable); `window.__post` = `{bloom, grade, ca}` dev tuning handle (Task 4 uses it; Task 5 strips it).

- [ ] **Step 1: Define `caPass`.** Insert immediately after `gradePass.material.blending = THREE.NoBlending;` (from Task 1):

```js
    // (c3) caPass — radial chromatic aberration ("worn projected glass" fringe),
    //      display-space, LAST in the chain. R/B sampled at ±radial offset; G AND
    //      alpha at the un-offset CENTRE tap => undrawn pixels stay alpha 0 (no ghost).
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

- [ ] **Step 2: Append `caPass` to `finalComposer` (last).** Find (from Task 1):

```js
    finalComposer.addPass(gradePass);               // SP4: grade tone-mapped sRGB display values, keep .a
```

and add caPass immediately after it:

```js
    finalComposer.addPass(gradePass);               // SP4: grade tone-mapped sRGB display values, keep .a
    finalComposer.addPass(caPass);                  // SP4: lens fringe, centre-alpha, LAST -> writes canvas
```

- [ ] **Step 3: Replace the probe with the ship-gate `__postProbe`.** Replace the entire block (`:1687-1696`, including its `// (f)` comment):

```js
    // (f) Gate #2 probe — one synchronous frame + readPixels BEFORE the browser composites
    //     (reliable without preserveDrawingBuffer). corner alpha must be 0; centre alpha
    //     proves the read is live (globe drawn). Also readable from an external driver.
    window.__bloomProbe = () => {
      renderBloomThenFinal();
      const gl = renderer.getContext();
      const rd = (x, y) => { const p = new Uint8Array(4);
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p); return [...p]; };
      const out = { corner: rd(1, 1),
        centre: rd(gl.drawingBufferWidth >> 1, gl.drawingBufferHeight >> 1) };
      console.log('[bloomProbe] ' + JSON.stringify(out));
      return out;
    };
```

with:

```js
    // (f) SP4 SHIP-GATE probe — extends SP1's corner/centre readPixels to the full
    //     grade+CA chain. THE new assertion (alphaDiff): toggling caPass must change
    //     alpha at ZERO pixels — proves CA reads the CENTRE (un-offset) alpha, so no
    //     colored ghost bleeds into transparent space. Deleted for production (Task 5).
    window.__postProbe = () => {
      const gl = renderer.getContext();
      const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, cy = H >> 1;
      const rd = (x, y) => { const p = new Uint8Array(4);
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p); return [...p]; };
      const rowA = () => { const p = new Uint8Array(W * 4);
        gl.readPixels(0, cy, W, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
        const a = new Uint8Array(W); for (let i = 0; i < W; i++) a[i] = p[i * 4 + 3]; return a; };
      // Exaggerate the CA offset so any offset-alpha bug becomes unmissable, then restore.
      const amt0 = caPass.material.uniforms.uAmount.value;
      caPass.material.uniforms.uAmount.value = 0.02;
      caPass.enabled = false; renderBloomThenFinal(); const aOff = rowA();   // alpha row, CA OFF
      caPass.enabled = true;  renderBloomThenFinal(); const aOn  = rowA();   // alpha row, CA ON
      caPass.material.uniforms.uAmount.value = amt0;
      let alphaDiff = 0, diffX = -1;
      for (let i = 0; i < W; i++) if (aOn[i] !== aOff[i]) { alphaDiff++; if (diffX < 0) diffX = i; }
      renderBloomThenFinal();   // leave a normally-CA'd frame on screen for the reads below
      // live-read: the globe is offset (coreGroup x=+3), so a single centre pixel is unreliable.
      // One full readPixels + a coarse grid count -> drawn>0 proves a live render (not a cleared buffer).
      const full = new Uint8Array(W * H * 4);
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, full);
      let drawn = 0; const S = 20;
      for (let y = 0; y < H; y += S) for (let x = 0; x < W; x += S) if (full[(y * W + x) * 4 + 3] > 0) drawn++;
      const out = { W, H, corner: rd(1, 1), centre: rd(W >> 1, cy), drawn, alphaDiff, diffX };
      console.log('[postProbe] ' + JSON.stringify(out));
      return out;
    };
    // SP4 dev tuning handle — Task 4 live-tunes these (all read live each frame);
    // stripped in Task 5 alongside __postProbe. bloomComposer.passes: [0]=RenderPass, [1]=UnrealBloomPass.
    window.__post = { bloom: bloomComposer.passes[1], grade: gradePass, ca: caPass };
```

- [ ] **Step 4: Syntax + reference scan.** Run:

```bash
node --check js/background.js && grep -rnE "__bloomProbe" js/ && echo "STALE_REF" || echo "NO_STALE_REF"
```

Expected: `node --check` exit 0; the `grep` finds no `__bloomProbe` → prints `NO_STALE_REF` (the only reference was the block just replaced).

- [ ] **Step 5: Browser — THE SHIP GATE.** Hard-reload `?sceneDebug=1&cb=sp4t2`. Via `javascript_tool`, `const p = window.__postProbe()`:
  - **Criterion 1 (transparency):** `p.corner[3] === 0` — undrawn corner is transparent. Screenshot confirms the CSS field is *visibly* behind the canvas (NOT a black/teal rectangle).
  - **Criterion 2 (live read):** `p.drawn > 0` — scene rendered, not a cleared buffer (robust: the globe is offset right, so a single centre pixel is unreliable; `drawn` counts alpha>0 over a coarse full-frame grid). `p.centre` is kept as informational only.
  - **Criterion 3 (centre-alpha discipline — the new CA failure mode):** `p.alphaDiff === 0` — toggling caPass (even at the exaggerated 0.02 offset) changes alpha at **zero** pixels. If `alphaDiff > 0`, CA is reading alpha from an offset tap → **fix the shader, do NOT ship** (same bar SP1 held).
  - Screenshot: a subtle radial R/B fringe that grows toward the corners (sharp at centre); no colored halo/ghost ringing the globe silhouette; no console errors.
- [ ] **Step 6: Stability sweep.** Still on `?sceneDebug=1&cb=sp4t2`, re-run `window.__postProbe()` and screenshot in each state — criteria 1–3 must hold in all:
  - During the SP2 boot reveal (reload and probe within the first ~1.8 s while `uReveal` ramps).
  - After a debounced window resize (resize the Chrome window, wait > 200 ms, probe — both composers `setSize` at `:1706`).
  - After a WebGL context loss/restore: `const e = renderer.getContext().getExtension('WEBGL_lose_context'); e.loseContext(); setTimeout(()=>e.restoreContext(), 100);` then probe once restored.
  - With SP3 pointer interaction active (move the pointer over the globe so the reticle is up, then probe) — confirm the DOM reticle is crisp (post can't touch it).
- [ ] **Step 7: Commit.**

```bash
git add js/background.js && git commit -m "feat(sp4): chromatic-aberration ShaderPass (last) + __postProbe ship-gate (alphaDiff centre-alpha proof)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: CSS teal-black floor (all-tier companion)

**Files:** Modify `css/site.css` (`:7` `--void`, `:8` `--void-2`, `:184` boot overlay), `index.html` (`:8` `theme-color`, `:13` `site.css?v=`).

**Interfaces — Produces:** the ~88% base field is re-hued blue-black → teal-black (~`#0a1416`, hue ~190°) on every tier, independent of the high-tier grade. No JS/selector changes.

- [ ] **Step 1: Re-hue the base tokens.** In `css/site.css`, replace (`:7-8`):

```css
  --void: #05060a;
  --void-2: #080a10;
```

with:

```css
  --void: #0a1416;    /* teal-black floor (SP4): hue ~190, matches the high-tier grade shadow */
  --void-2: #0e1a1d;
```

- [ ] **Step 2: Re-hue the boot overlay.** In `css/site.css`, find (`:184`):

```css
  position: fixed; inset: 0; z-index: 9000; background: #030407;
```

and change only the color:

```css
  position: fixed; inset: 0; z-index: 9000; background: #050e10;
```

- [ ] **Step 3: Re-hue `theme-color` + bump the CSS cache-bust.** In `index.html`, replace (`:8`):

```html
<meta name="theme-color" content="#05060a" />
```

with:

```html
<meta name="theme-color" content="#0a1416" />
```

and bump the stylesheet version (`:13`) so deployed clients pull the new CSS:

```html
<link rel="stylesheet" href="css/site.css?v=3.8" />
```

- [ ] **Step 4: Browser — teal-black floor, all tiers.** Hard-reload `?cb=sp4t3` (no `sceneDebug` needed). Screenshot the base field (a scroll region with no canvas emitters) — it reads teal-black, not blue-black; the boot overlay (reload to catch it) is teal-black; nothing looks washed or mismatched; no console errors. Emulate LITE via a narrow window (< 760px) and confirm the floor is on-brand teal-black **without** a grade (the grade is high-tier only).
- [ ] **Step 5: Commit.**

```bash
git add css/site.css index.html && git commit -m "design(sp4): all-tier teal-black CSS floor — --void/--void-2/boot/theme-color re-hued, bump site.css v

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Tune bloom + grade together (the aesthetic gate)

**Files:** Modify `js/background.js` — `BLOOM_STRENGTH / BLOOM_RADIUS / BLOOM_THRESHOLD` (`:1605`) and the `gradePass` uniform defaults (Task 1). This is an in-browser tuning loop; the deliverable is the final tuned constants + a decision on the SP2 limb.

**Interfaces — Consumes:** the working grade+CA chain (Tasks 1–2), `window.__postProbe`, `window.__sceneDebug`. **Produces:** final tuned `BLOOM_*` + grade uniforms committed; a recorded decision on `earth-limb-shell` bloom (default: untagged).

- [ ] **Step 1: Establish the tuning backdrop.** Server up; hard-reload `?sceneDebug=1&cb=sp4t4`. Screenshot two states as the baseline: boot (during the reveal) and steady-state (after ~5 s). Note where the current defaults miss the design language: **teal-black floor**, **cyan leads**, **amber scarce (~1–6%, warm:cool ≥ 1:8)**, **no neutral-white emitter core**, ~88% deep shadow.
- [ ] **Step 2: Tune live, then bake.** Adjust via the `window.__post` handle (Task 2) — all read live, so the running rAF loop applies each change on the **next frame** (no reload, no manual `render()` call); screenshot after a beat. Handles: bloom `window.__post.bloom.strength` / `.radius` / `.threshold` (all live per `UnrealBloomPass.render()`); grade `window.__post.grade.material.uniforms.uLift/uGamma/uGain/uTeal/uTealAmt/uSat.value`; CA `window.__post.ca.material.uniforms.uAmount.value`. Targets:
  - Resolve the **composite-vs-direct brightness offset** — the composited HalfFloat+OutputPass high-tier path is the new default; make it read at the intended brightness (not blown out, not muddy) vs the old direct look.
  - Emitter cores glow **saturated**, never clip to `(1,1,1)` — verify with `window.__postProbe()`: no neutral-white centre. If a core reads white, lower `BLOOM_STRENGTH`/raise `BLOOM_THRESHOLD` or trim that emitter's source intensity, don't rely on the grade.
  - Shadows sit at teal-black; the cyan `#39f0ff` emitters are **not** tinted toward teal; the amber highlight-gain lean is a whisper (warm accent stays scarce).
  - When satisfied, **bake** the console values into source: replace `:1605`

    ```js
    const BLOOM_STRENGTH = 0.9, BLOOM_RADIUS = 0.5, BLOOM_THRESHOLD = 0.6;   // spike-tunable (gate #4)
    ```

    with the tuned literals (comment updated, e.g. `// SP4-tuned vs the composited HalfFloat buffer + grade`), and update the `gradePass` uniform defaults (Task 1) to the tuned vectors.
- [ ] **Step 3: SP2 limb decision.** With bloom tuned, judge in-browser whether the terminator reads flat. **Default: leave `earth-limb-shell` untagged** (atmospheric haze, not an emitter core — must not blow to white). Only if it reads flat, add `'earth-limb-shell'` to the `bloomByName` set (Task 0 body) and **re-verify** the limb peak stays sub-white and cyan-tinted. Record the decision either way.
- [ ] **Step 4: Verify + regression sweep.** `node --check js/background.js` → exit 0. Hard-reload `?sceneDebug=1&cb=sp4t4b`:
  - `window.__postProbe()` → criteria 1–3 still hold (tuning must not break alpha or introduce a neutral-white core).
  - `window.__sceneDebug()` → `fps` ≥ 58 sustained (two extra full-screen passes add ~0.5–1.5 ms; confirm no frame-rate cliff), parity `quality:'high'`/`7000`.
  - Rain-droplet watch: scroll to a rain-heavy section, confirm the droplet lenses refract the **composited** (graded, CA'd) frame — no stale/undistorted or double-rendered look.
  - SP2/SP3 regression: the limb + `holo-scan-shell` do not glow in the bloom pass (dark-swap intact); the SP2 reveal sweep glows; the SP3 DOM reticle stays crisp with no apparent smear.
  - Screenshot boot + steady-state — both read on-brand.
- [ ] **Step 5: Commit.**

```bash
git add js/background.js && git commit -m "polish(sp4): tune bloom + grade together vs composited buffer — final BLOOM_* + grade uniforms; limb decision

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Strip the probe + acceptance record + SP4 COMPLETE

**Files:** Modify `js/background.js` (delete `window.__postProbe`; bump nothing there), `js/boot.mjs` (`V.bg` bump), the spec (append `## §11 — Build results`).

**Interfaces — Produces:** production `background.js` with no dev probe; `V.bg` bumped so deployed clients pull SP4; spec's acceptance record + owner debts.

- [ ] **Step 1: Final ship-gate confirmation (before deleting the probe).** Server up; hard-reload `?sceneDebug=1&cb=sp4t5`. Run `window.__postProbe()` one last time — record `{corner, drawn, alphaDiff}` for the acceptance table (criteria 1–3 PASS). This is the last use of the probe.
- [ ] **Step 2: Delete the dev hooks.** Remove the entire `window.__postProbe = () => {…};` block (the `// (f)` comment through the closing `};`) **and** the two-line `window.__post = {…}` tuning handle that follows it, both added in Task 2. Nothing else references them.
- [ ] **Step 3: Syntax + scan.** Run:

```bash
node --check js/background.js && grep -nE "__postProbe|__bloomProbe|window\.__post\b" js/background.js && echo "STALE" || echo "CLEAN"
```

Expected: `node --check` exit 0; grep prints nothing → `CLEAN`.

- [ ] **Step 4: Bump the JS cache-bust.** In `js/boot.mjs`, find `const V = { bg: '3.8', boot: '3.1', cursor: '3.1', fx: '3.3', app: '3.4' };` and bump `bg` to `'3.9'` so deployed clients pull the SP4 `background.js`.
- [ ] **Step 5: Browser — production sanity.** Hard-reload `?sceneDebug=1&cb=sp4t5b` (a plain load too, no query). Confirm: bloom on (high tier), grade + CA applied, `window.__postProbe` is now `undefined`, `window.__sceneDebug()` parity, no console errors.
- [ ] **Step 6: Record.** Append `## §11 — Build results` to `docs/superpowers/specs/2026-07-04-sp4-postprocessing-design.md`: the spike gate table (criteria 1–4 + evidence), final tuned `BLOOM_*` + grade uniforms + CA `uAmount`, the `earth-limb-shell` decision, the commit list, `SP4 COMPLETE` decision record, and the carried-forward owner debts (SP3: verify 12 photo→city labels, author project/district geo; SP4: the CSS floor may fold into SP5 grading; event-gated CA pulse + per-section temperature are the motion brief's).
- [ ] **Step 7: Commit.**

```bash
git add js/background.js js/boot.mjs docs/superpowers/specs/2026-07-04-sp4-postprocessing-design.md
git commit -m "feat(sp4): strip __postProbe + bump V.bg + acceptance record — SP4 COMPLETE

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 8: Finish.** Invoke superpowers:finishing-a-development-branch → present integration options (the branch stays `v3-build` per the Plan C program; do not merge to `main` without owner direction).

---

## Self-review notes

- **Spec coverage:** §1 productionize bloom → Task 0 (+ tuning Task 4); §2 CA pass → Task 2; §3 grade pass → Task 1; §4 chain order (grade+CA after OutputPass) → Tasks 1–2; §5 hard constraints (NoBlending, centre-alpha, no-neutral-white, regression) → Tasks 1–2 + Task 4 sweep; §6 required spike → Task 2 (`__postProbe`) + Task 5 final confirm; §8 build anchors → Tasks 0–2; §9 CSS teal-black floor → Task 3. §7 out-of-scope (pmndrs/r168, 3D-LUT, event-gated CA pulse, per-section temperature) → untouched, recorded in Task 5.
- **Line-anchor drift:** Task 0 edits `:1596-1623`, shifting later lines. Every subsequent insertion is anchored on an **exact code string** (e.g. `finalComposer.addPass(new POST.OutputPass()); …`, the `mixPass.material.blending` line), not a raw line number — so the edits land correctly regardless of drift. Apply tasks in order.
- **Type/name consistency:** `gradePass` (Task 1) and `caPass` (Task 2) are referenced by those exact names in their `finalComposer.addPass` calls and in `__postProbe` (`caPass.material.uniforms.uAmount`, `caPass.enabled`). Both use the default `tDiffuse` textureID (`POST.ShaderPass(mat)` with no 2nd arg), unlike `mixPass`'s `'baseTexture'`. `__postProbe` replaces `__bloomProbe` (Task 2) and is deleted (Task 5) — no dangling references (grep-gated in Tasks 2, 5).
- **Alpha discipline (the whole point):** every new pass sets `.material.blending = THREE.NoBlending` and writes alpha from the **un-offset centre** tap. The ship gate is `alphaDiff === 0` — a direct, content-independent proof that CA never moves alpha. Criteria 1 & 3 are hard-fail (SP4 does not ship until corrected).
- **No placeholders:** all GLSL is reproduced verbatim from the vetted `handrolled-ca-grade` reference (`docs/superpowers/research/2026-07-04-sp4-shader-reference.md`); the one genuinely in-browser-only step (Task 4 aesthetic tuning) gives concrete starting constants, exact live-tune handles, and measurable acceptance targets rather than "tune to taste".
- **Ordering rationale:** correctness first (Tasks 0–2: renders + alpha-safe, gated by the probe), then the all-tier floor (Task 3) so the aesthetic tuning (Task 4) happens against the final backdrop, then production cleanup (Task 5). A reviewer can reject Task 4's *look* while keeping Tasks 0–2's *correctness*.
