# SP2 — Globe Shader Elevation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grade the Tokyo data-globe to the v3 visual language via pure no-build GLSL — a terminator-biased cool scatter limb, softened two-tone terminator, rimless edge-dissolve, softer point cores, and a one-time boot-up scan-reveal — all additive + `discard`, transparent-canvas-safe.

**Architecture:** All edits land in one file, `js/background.js`. A `?globe=classic` flag (`GLOBE_ELEV` boolean, default `true`) gates the elevation so the pre-SP2 look is one URL param away for A/B + rollback. Two shared uniforms (`uReveal`, `uElev`) live on `globeMat.uniforms` and are referenced by the new limb-shell / scan-band / graticule materials, so one write updates all of them. The elevation deltas are baked into the shaders gated by `uElev` (land shader) or by construction branch (shell vs sprite, ShaderMaterial vs MeshBasic); the reveal is inert until its loop-drive lands in the final task.

**Tech Stack:** three.js r158 (vendored ESM, global `window.THREE`), vanilla JS (one IIFE, no bundler), GLSL ES 1.00 (matching the existing land `ShaderMaterial`), no build step.

**Spec:** `docs/superpowers/specs/2026-07-03-sp2-globe-shader-elevation-design.md` (committed `f74349d`).

## Global Constraints

- **No-build shaders only:** pure `THREE.ShaderMaterial` + GLSL **ES 1.00** (`varying`/`attribute`/`gl_FragColor`, no `in`/`out`, no `#version`), matching the land shader at `js/background.js:213-259`. No `onBeforeCompile` for the globe. No bundler.
- **Transparent canvas is sacred:** every new material is `blending: THREE.AdditiveBlending` + `depthWrite: false`, and uses `discard`/alpha only. **Never** emit opaque alpha (`= 1.0` forced), **never** route the globe through a composer/bloom pass. (Additive never decreases alpha and never fills undrawn pixels → corners stay alpha 0 by construction.)
- **Additive blow-out survival kit:** most pixels stay dark; lead B/G and keep R low — R only rises for the warm dusk/city emitter; cap every glow term with a `pow()` + a low ceiling; keep source intensities in ~[0,1].
- **No new render targets, no new post passes, no particle-count change** (`GLOBE_N` / `quality.globeParticles` untouched).
- **Cool/warm never bleed:** cyan is the instrument shell/graticule/limb; amber is city/dusk, gated strictly to `vNight`.
- **Reduced-motion = instant final state:** `uReveal` defaults to `1`; the reveal drive runs only in the animated loop (which reduced-motion skips).
- **Ships ON by default;** `?globe=classic` sets `GLOBE_ELEV = false` and restores the pre-SP2 look (halo sprite, `MeshBasic` scan band, `uElev = 0`, no reveal).
- **Dev cache gotcha (from SP1):** scene files keep a fixed `?v=` in `boot.mjs`, so the browser caches them — **hard-reload (Cmd+Shift+R)** to pick up `js/background.js` edits in-browser; bump `?v=` on deploy.
- **No unit-test runner.** Per-task verification = `node --check js/background.js` (syntax) + a Chrome spot-check (local http server, hard-reload, observe the change, read `window.__sceneDebug()` for fps/particle parity, screenshot). Final task runs the full gate sweep A–H + A/B screenshots.

**Colour constants (GLSL vec3, for reference):** emitter cyan `#39f0ff` → `vec3(0.224, 0.941, 1.0)`; instrument active `#b2f5fd` → `vec3(0.698, 0.961, 0.992)`; warm dusk `vec3(1.0, 0.5, 0.25)`; city amber `vec3(1.0, 0.72, 0.35)`.

**Shared browser-verify preamble (used by several tasks):**
```bash
# start a local server once (background); serves the repo at :8000
python3 -m http.server 8000 >/dev/null 2>&1 &
```
Then in Chrome (claude-in-chrome tools): create a tab, navigate to the URL below, **hard-reload** (key: Cmd+Shift+R) to bust the fixed `?v=` cache, wait ~3s for the scene, screenshot, and read telemetry.
- Elevated (default): `http://localhost:8000/?sceneDebug=1&cb=sp2t<N>`
- Classic A/B: `http://localhost:8000/?sceneDebug=1&globe=classic&cb=sp2t<N>`
- Telemetry: evaluate `window.__sceneDebug && window.__sceneDebug()` → object with `quality`, `dpr`, `globeParticles`, `fps`, `reduced`, `lite`. Parity gate: `globeParticles` and `dpr` identical to classic; `fps` ≥ 58 on a high-tier desktop.
(`cb=` differs per task so same-URL navigations refetch `index.html`; the `?v=` on `background.js` still needs the hard-reload.)

---

### Task 0: Elevation flag + shared uniforms

**Files:**
- Modify: `js/background.js:16` (add `GLOBE_ELEV` next to `sceneDebug`)
- Modify: `js/background.js:215` (add `uReveal` + `uElev` to `globeMat.uniforms`)

**Interfaces:**
- Produces: `const GLOBE_ELEV` (boolean, `true` unless `?globe=classic`). `globeMat.uniforms.uReveal` (`{value:1}`) and `globeMat.uniforms.uElev` (`{value: GLOBE_ELEV?1:0}`) — shared references consumed by Tasks 1, 2, 3, 4.

- [ ] **Step 1: Add the flag.** In `js/background.js`, find (`:16`):

```js
  const sceneDebug = new URLSearchParams(location.search).get('sceneDebug') === '1';
```

Replace with:

```js
  const sceneDebug = new URLSearchParams(location.search).get('sceneDebug') === '1';
  // SP2 globe shader elevation — ON by default; ?globe=classic restores the pre-SP2 look (A/B + rollback).
  const GLOBE_ELEV = new URLSearchParams(location.search).get('globe') !== 'classic';
```

- [ ] **Step 2: Add the shared uniforms.** Find (`:215`):

```js
    uniforms: { uTime: { value: 0 }, uPx: { value: dpr }, uSunDir: { value: new THREE.Vector3(1, 0, 0) } },
```

Replace with:

```js
    uniforms: {
      uTime: { value: 0 }, uPx: { value: dpr }, uSunDir: { value: new THREE.Vector3(1, 0, 0) },
      uReveal: { value: 1 },              // 0→1 boot reveal; 1 = fully shown (reduced-motion default)
      uElev: { value: GLOBE_ELEV ? 1 : 0 },  // 1 = v3 elevation, 0 = classic; land shader mixes on this
    },
```

- [ ] **Step 3: Syntax check.** Run: `node --check js/background.js` — Expected: no output, exit 0.

- [ ] **Step 4: Browser parity.** Start the server (preamble). Load elevated + classic URLs (`cb=sp2t0`), hard-reload each, screenshot. Expected: **no visible change vs current** in either (uniforms unused so far); `__sceneDebug()` `globeParticles` = 7000 (desktop high), identical elevated vs classic; `fps` ≥ 58.

- [ ] **Step 5: Commit.**

```bash
git add js/background.js
git commit -m "feat(sp2): globe elevation flag + shared uReveal/uElev uniforms

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 1: Cool scatter limb shell (component ①)

Replaces the uniform halo `Sprite` with an additive back-side Fresnel shell parented to `spin` (geographic frame, so the day-bias tracks `uSunDir`). Classic keeps the sprite.

**Files:**
- Modify: `js/background.js:838-855` (halo IIFE — hide sprite + build shell when elevated)
- Modify: `js/background.js:1597` (loop — animate sprite only in classic)

**Interfaces:**
- Consumes: `GLOBE_ELEV`, `globeMat.uniforms.uSunDir`, `globeMat.uniforms.uReveal` (Task 0), `R`, `LITE`, `spin`, `nameObject`.
- Produces: scene object `earth-limb-shell` (driven entirely by shared uniforms; no later task references it by name).

- [ ] **Step 1: Hide sprite + add the shell.** Find the halo IIFE end (`:852-855`):

```js
    sp.scale.setScalar(7.5);
    coreGroup.add(sp);
    return sp;
  })();
```

Replace with:

```js
    sp.scale.setScalar(7.5);
    coreGroup.add(sp);
    return sp;
  })();

  /* (f0) SP2 cool limb — replaces the uniform halo sprite with a terminator-biased
     back-side Fresnel scatter shell (rim brightest toward the sun, dying on the night
     limb). Parented to `spin` so normalize(position) shares uSunDir's geographic frame.
     Additive + depthWrite:false → cannot fill undrawn pixels (canvas stays transparent). */
  if (GLOBE_ELEV) {
    halo.visible = false;                                  // sprite off; shell is the atmosphere now
    const segW = LITE ? 24 : 48, segH = LITE ? 16 : 32;
    const limbMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      uniforms: { uSunDir: globeMat.uniforms.uSunDir, uReveal: globeMat.uniforms.uReveal },
      vertexShader: `
        varying vec3 vNormalV;
        varying vec3 vViewDirV;
        varying vec3 vSphereDir;
        void main() {
          vSphereDir = normalize(position);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormalV = normalize(normalMatrix * normal);
          vViewDirV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uSunDir;
        uniform float uReveal;
        varying vec3 vNormalV;
        varying vec3 vViewDirV;
        varying vec3 vSphereDir;
        void main() {
          float rim = pow(1.0 - abs(dot(vNormalV, vViewDirV)), 4.0);   // edge-weighted limb
          float day = smoothstep(-0.25, 0.30, dot(vSphereDir, uSunDir)); // 1 day/terminator, 0 night
          float yN = vSphereDir.y * 0.5 + 0.5;
          float front = mix(-0.15, 1.15, uReveal);                     // boot sweep; 1.15 = fully lit at rest
          float reveal = 1.0 - smoothstep(front, front + 0.15, yN);
          float band = smoothstep(front - 0.12, front, yN) * (1.0 - smoothstep(front, front + 0.12, yN));
          float a = min(rim * mix(0.12, 1.0, day) * reveal, 0.5) + band * 0.25 * day;
          gl_FragColor = vec4(vec3(0.224, 0.941, 1.0), a);             // cyan; additive scales RGB by a
        }`,
    });
    spin.add(nameObject(new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, segW, segH), limbMat), 'earth-limb-shell'));
  }
```

- [ ] **Step 2: Gate the sprite's breathing to classic.** Find (`:1597`):

```js
    halo.material.opacity = 0.10 + 0.05 * (Math.sin(t * 1.5) * 0.5 + 0.5);
```

Replace with:

```js
    if (!GLOBE_ELEV) halo.material.opacity = 0.10 + 0.05 * (Math.sin(t * 1.5) * 0.5 + 0.5);
```

- [ ] **Step 3: Syntax check.** Run: `node --check js/background.js` — Expected: no output, exit 0.

- [ ] **Step 4: Browser — limb is terminator-biased (Gate B) + transparency (Gate A).** Server up. Load elevated `?sceneDebug=1&cb=sp2t1`, hard-reload, wait ~3s, screenshot.
  - Expected: a **thin cyan limb** hugs the globe silhouette, visibly **brighter on one arc** (day/terminator side) and fading on the opposite (night) limb — NOT a uniform ring. The old broad soft halo glow is gone.
  - Gate A (transparency): screenshot a **corner** far from the offset globe — it shows the CSS page background, not black. Confirm via `evaluate_script`: `(()=>{const c=document.querySelector('#scene-root canvas');const t=document.createElement('canvas');t.width=t.height=1;const x=t.getContext('2d');x.drawImage(c,0,0,1,1,0,0,1,1);return Array.from(x.getContext&&x.getImageData(0,0,1,1).data);})()` → top-left pixel alpha ≈ 0 / matches background (not opaque black).
  - Load classic `?globe=classic&cb=sp2t1` → the old soft cyan halo sprite is back, no tight limb. `__sceneDebug()` fps ≥ 58 both.

- [ ] **Step 5: Commit.**

```bash
git add js/background.js
git commit -m "feat(sp2): cool scatter limb shell replaces the uniform halo sprite

Terminator-biased back-side Fresnel shell on spin (geographic frame); classic
keeps the sprite via ?globe=classic. Additive + depthWrite:false.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Land shader elevation — terminator + cool day-limb + soft points (components ② & ④, + inert reveal hooks)

Rewrites the land `ShaderMaterial` vertex + fragment (`js/background.js:216-258`). Adds `uElev`-gated widened terminator, cool day-limb lift, and `pow` soft-point cores; also bakes the `uReveal` sweep terms **inert** (they no-op at the default `uReveal = 1` and only come alive in Task 4). At `uElev = 0` the output is byte-for-byte the current look.

**Files:**
- Modify: `js/background.js:216-239` (vertex shader)
- Modify: `js/background.js:240-258` (fragment shader)

**Interfaces:**
- Consumes: `globeMat.uniforms.uElev`, `globeMat.uniforms.uReveal` (Task 0).
- Produces: varyings `vReveal`, `vBand` (consumed only within this shader; Task 4 drives `uReveal`).

- [ ] **Step 1: Replace the vertex shader.** Find (`:216-239`, the `vertexShader: \`...\`,` block):

```js
    vertexShader: `
      attribute float phase;
      attribute float edge;
      attribute float city;
      uniform float uTime, uPx;
      uniform vec3 uSunDir;
      varying float vA;
      varying float vEdge;
      varying float vFacing;
      varying float vNight;
      varying float vCity;
      void main() {
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vec3 worldNormal = normalize((modelMatrix * vec4(normalize(position), 0.0)).xyz);
        vec3 viewDir = normalize(cameraPosition - worldPos);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vA = 0.55 + 0.45 * sin(uTime * 2.2 + phase);
        vEdge = edge;
        vFacing = smoothstep(-0.15, 0.65, dot(worldNormal, viewDir));
        vNight = 1.0 - smoothstep(-0.18, 0.12, dot(normalize(position), uSunDir));
        vCity = city;
        gl_PointSize = (2.4 + 1.4 * vA + edge * 1.2 + city * vNight * 1.1) * uPx * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
```

Replace with:

```js
    vertexShader: `
      attribute float phase;
      attribute float edge;
      attribute float city;
      uniform float uTime, uPx;
      uniform vec3 uSunDir;
      uniform float uReveal, uElev;
      varying float vA;
      varying float vEdge;
      varying float vFacing;
      varying float vNight;
      varying float vCity;
      varying float vReveal;
      varying float vBand;
      void main() {
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vec3 worldNormal = normalize((modelMatrix * vec4(normalize(position), 0.0)).xyz);
        vec3 viewDir = normalize(cameraPosition - worldPos);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vA = 0.55 + 0.45 * sin(uTime * 2.2 + phase);
        vEdge = edge;
        vFacing = smoothstep(-0.15, 0.65, dot(worldNormal, viewDir));
        // Terminator: uElev widens+softens the day/night band (classic edges at uElev=0).
        float sun = dot(normalize(position), uSunDir);
        vNight = 1.0 - smoothstep(mix(-0.18, -0.35, uElev), mix(0.12, 0.28, uElev), sun);
        vCity = city;
        // Boot-up scan-reveal (inert at uReveal=1): pole->pole sweep, per-point curl dither.
        float yN = normalize(position).y * 0.5 + 0.5;
        float front = mix(-0.15, 1.15, uReveal);
        float curl = fract(sin(dot(position, vec3(12.9898, 78.233, 37.719))) * 43758.5453) * 0.06;
        vReveal = 1.0 - smoothstep(front, front + 0.15, yN + curl);
        vBand = smoothstep(front - 0.12, front, yN + curl) * (1.0 - smoothstep(front, front + 0.12, yN + curl));
        gl_PointSize = (2.4 + 1.4 * vA + edge * 1.2 + city * vNight * 1.1) * uPx * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
```

- [ ] **Step 2: Replace the fragment shader.** Find (`:240-258`, the `fragmentShader: \`...\`,` block):

```js
    fragmentShader: `
      varying float vA;
      varying float vEdge;
      varying float vFacing;
      varying float vNight;
      varying float vCity;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 base = mix(vec3(0.224, 0.941, 1.0), vec3(1.0, 0.62, 0.17), vEdge * 0.35);
        vec3 col = mix(base * 0.62, base * 1.18, vNight);
        col = mix(col, vec3(1.0, 0.72, 0.35), vCity * vNight * 0.85);
        float dusk = vNight * (1.0 - vNight) * 4.0;
        col += vec3(1.0, 0.5, 0.25) * dusk * 0.16;
        float facingAlpha = mix(0.18, 1.0, vFacing);
        float alpha = vA * (1.0 - d * 2.0) * (0.75 + vEdge * 0.25) * facingAlpha;
        alpha *= mix(0.9, 1.0 + vCity * 0.6, vNight);
        gl_FragColor = vec4(col, alpha);
      }`,
```

Replace with:

```js
    fragmentShader: `
      uniform float uElev;
      varying float vA;
      varying float vEdge;
      varying float vFacing;
      varying float vNight;
      varying float vCity;
      varying float vReveal;
      varying float vBand;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 base = mix(vec3(0.224, 0.941, 1.0), vec3(1.0, 0.62, 0.17), vEdge * 0.35);
        vec3 col = mix(base * 0.62, base * 1.18, vNight);
        col = mix(col, vec3(1.0, 0.72, 0.35), vCity * vNight * 0.85);
        float dusk = vNight * (1.0 - vNight) * 4.0;
        col += vec3(1.0, 0.5, 0.25) * dusk * 0.16;
        // Elevated: cool cyan lift on the DAY limb (day side + near silhouette); gated by uElev.
        float dayLimb = (1.0 - vNight) * (1.0 - vFacing);
        col += vec3(0.10, 0.55, 0.75) * dayLimb * 0.18 * uElev;
        // Elevated: softer point core (pow) vs classic linear falloff.
        float core = mix(1.0 - d * 2.0, pow(max(1.0 - d * 2.0, 0.0), 3.0), uElev);
        float facingAlpha = mix(0.18, 1.0, vFacing);
        float alpha = vA * core * (0.75 + vEdge * 0.25) * facingAlpha;
        alpha *= mix(0.9, 1.0 + vCity * 0.6, vNight);
        // Boot-up reveal (inert at uReveal=1: vReveal=1, vBand=0): mask + bright leading band.
        alpha *= vReveal;
        col += vec3(0.3, 0.95, 1.0) * vBand * 0.6;
        gl_FragColor = vec4(col, alpha);
      }`,
```

- [ ] **Step 3: Syntax check.** Run: `node --check js/background.js` — Expected: no output, exit 0.

- [ ] **Step 4: Browser — terminator + soft points (Gates C, E).** Server up. Load elevated `?sceneDebug=1&cb=sp2t2`, hard-reload, screenshot; load classic `?globe=classic&cb=sp2t2`, screenshot; compare.
  - Expected elevated vs classic: the day→night gradient is **wider/softer**; the day-side limb carries a faint **cool cyan** lift; land points read **softer/rounder** (feathered cores, no hard-edged discs). The warm city/dusk amber is unchanged and still only on the night side (no cyan/amber bleed).
  - `__sceneDebug()`: `globeParticles` unchanged (7000), fps ≥ 58 both. No console errors (shader compiled).

- [ ] **Step 5: Commit.**

```bash
git add js/background.js
git commit -m "feat(sp2): land shader elevation — widened terminator, cool day-limb, soft point cores

uElev-gated (classic = byte-identical); bakes inert uReveal sweep terms for Task 4.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Rimless dissolve — scan band + graticule (component ③)

Converts the holo-scan ring and the graticule to additive `ShaderMaterial`s with radial / polar alpha falloff so their hard geometry edges melt into scatter. Both share `uReveal` so they fade in with the boot. Classic keeps the originals.

**Files:**
- Modify: `js/background.js:295-298` (graticule material)
- Modify: `js/background.js:864-871` (holo-scan `mat`)
- Modify: `js/background.js:1554` (loop — scan-band opacity via uniform when elevated)

**Interfaces:**
- Consumes: `GLOBE_ELEV`, `globeMat.uniforms.uReveal`, `R`, `DL.instrumentActive`, `CYAN`.
- Produces: `holoScan.material.uniforms.uOpacity` (elevated only), consumed by the loop.

- [ ] **Step 1: Graticule falloff.** Find (`:295-298`):

```js
    const g = makeGeometry('earth-graticule-lines', new Float32Array(segs), 3);
    if (!g) return;
    spin.add(nameObject(new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      color: CYAN, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending })), 'earth-graticule-lines'));
```

Replace with:

```js
    const g = makeGeometry('earth-graticule-lines', new Float32Array(segs), 3);
    if (!g) return;
    // Elevated: fade lines toward the poles (soften the meridian pinch) + fade in on boot.
    const gratMat = GLOBE_ELEV
      ? new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uReveal: globeMat.uniforms.uReveal },
          vertexShader: `
            uniform float uReveal;
            varying float vFade;
            void main() {
              float pole = abs(normalize(position).y);
              vFade = (1.0 - smoothstep(0.7, 1.0, pole)) * uReveal;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
          fragmentShader: `
            varying float vFade;
            void main() { gl_FragColor = vec4(vec3(0.224, 0.941, 1.0), 0.07 * vFade); }`,
        })
      : new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending });
    spin.add(nameObject(new THREE.LineSegments(g, gratMat), 'earth-graticule-lines'));
```

- [ ] **Step 2: Scan-band radial falloff.** Find (`:864-871`):

```js
  const holoScan = (function () {
    const mat = new THREE.MeshBasicMaterial({ color: DL.instrumentActive, transparent: true,
      opacity: 0.1, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
    const m = nameObject(new THREE.Mesh(new THREE.RingGeometry(R * 0.99, R * 1.012, 96), mat), 'holo-scan-shell');
    m.rotation.x = Math.PI / 2;
    coreGroup.add(m);
    return m;
  })();
```

Replace with:

```js
  const holoScan = (function () {
    // Elevated: dissolve the ring's crisp inner/outer edge into a radial additive falloff
    // (band center R*1.001, half-width R*0.011) so the sweeping band melts into scatter.
    const mat = GLOBE_ELEV
      ? new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          uniforms: { uOpacity: { value: 0.1 } },
          vertexShader: `
            varying float vR;
            void main() { vR = length(position.xy); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: `
            uniform float uOpacity;
            varying float vR;
            void main() {
              float a = pow(1.0 - clamp(abs(vR - ${(R * 1.001).toFixed(4)}) / ${(R * 0.011).toFixed(4)}, 0.0, 1.0), 3.0);
              gl_FragColor = vec4(vec3(0.698, 0.961, 0.992), a * uOpacity);
            }`,
        })
      : new THREE.MeshBasicMaterial({ color: DL.instrumentActive, transparent: true,
          opacity: 0.1, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
    const m = nameObject(new THREE.Mesh(new THREE.RingGeometry(R * 0.99, R * 1.012, 96), mat), 'holo-scan-shell');
    m.rotation.x = Math.PI / 2;
    coreGroup.add(m);
    return m;
  })();
```

- [ ] **Step 3: Drive scan-band opacity via the uniform when elevated.** Find (`:1554`):

```js
    holoScan.material.opacity = 0.09 + 0.03 * Math.sin(t * 9.7);      // projector shimmer, instrument-quiet
```

Replace with:

```js
    // projector shimmer, instrument-quiet; elevated drives a uniform + fades in with the boot reveal
    if (GLOBE_ELEV) holoScan.material.uniforms.uOpacity.value = (0.09 + 0.03 * Math.sin(t * 9.7)) * globeMat.uniforms.uReveal.value;
    else holoScan.material.opacity = 0.09 + 0.03 * Math.sin(t * 9.7);
```

- [ ] **Step 4: Syntax check.** Run: `node --check js/background.js` — Expected: no output, exit 0.

- [ ] **Step 5: Browser — edges dissolve (Gate D).** Server up. Load elevated `?sceneDebug=1&cb=sp2t3`, hard-reload, watch the latitude scan sweep + graticule; load classic for A/B.
  - Expected elevated: the sweeping holo-scan band has **no crisp inner/outer edge** — it bleeds into additive scatter; the graticule **fades toward the poles** instead of pinching to a hard point. Classic: the band shows its hard ring edges, graticule at flat 0.07.
  - `__sceneDebug()` fps ≥ 58; no console errors.

- [ ] **Step 6: Commit.**

```bash
git add js/background.js
git commit -m "feat(sp2): rimless dissolve — radial-falloff scan band + polar-fade graticule

ShaderMaterials share uReveal (fade in on boot); classic keeps MeshBasic/LineBasic.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Boot-up scan-reveal drive (component ⑤)

Brings the inert `uReveal` terms (baked in Tasks 1–3) to life: a real-time accumulator eases `uReveal` `0→1` over ~1.8s on load, so the globe assembles pole-to-pole and settles. Runs only when elevated + animated; reduced-motion keeps the default `uReveal = 1` (instant).

**Files:**
- Modify: `js/background.js:1524` (loop state — add `revealT`)
- Modify: `js/background.js:1530` (loop — ease `uReveal` before render)

**Interfaces:**
- Consumes: `GLOBE_ELEV`, `dt`, `globeMat.uniforms.uReveal` (shared → also drives shell, scan band, graticule).

- [ ] **Step 1: Add the accumulator.** Find (`:1524`):

```js
  let raf, running = true, t = 0, last = performance.now(), debugTick = 0;
```

Replace with:

```js
  let raf, running = true, t = 0, last = performance.now(), debugTick = 0;
  let revealT = 0;   // SP2 boot reveal: real-time accumulator (pauses with the loop when hidden)
```

- [ ] **Step 2: Drive the reveal.** Find (`:1530`):

```js
    t += dt * 0.3;
```

Replace with:

```js
    t += dt * 0.3;
    if (GLOBE_ELEV) {   // boot-up scan-reveal: ease-out cubic over ~1.8s, then inert at 1
      revealT += dt;
      const rr = Math.min(1, revealT / 1.8);
      globeMat.uniforms.uReveal.value = 1.0 - Math.pow(1.0 - rr, 3.0);
    }
```

- [ ] **Step 3: Syntax check.** Run: `node --check js/background.js` — Expected: no output, exit 0.

- [ ] **Step 4: Browser — reveal plays + settles (Gate F).** Server up. Load elevated `?sceneDebug=1&cb=sp2t4`, hard-reload, and **watch the first ~2s**: land points ignite pole-to-pole behind a bright cyan scan front, the limb kindles, then the globe settles to the calm steady state. Take an early screenshot (~0.6s) mid-reveal and a settled one (~4s).
  - Reduced-motion check: emulate `prefers-reduced-motion` (Chrome DevTools MCP `emulate`, or load in a reduced-motion context) → the globe appears **fully assembled immediately**, no sweep.
  - Classic `?globe=classic&cb=sp2t4`: no reveal (loads fully shown). `__sceneDebug()` fps ≥ 58 settled.

- [ ] **Step 5: Commit.**

```bash
git add js/background.js
git commit -m "feat(sp2): boot-up scan-reveal drive — uReveal ease-out over ~1.8s

Assembles land points + limb + scan band pole-to-pole on load; reduced-motion stays instant.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Acceptance sweep + decision record

Run all gates against the finished globe, capture A/B evidence, tune-by-eye pass, and append results to the spec.

**Files:**
- Modify: `docs/superpowers/specs/2026-07-03-sp2-globe-shader-elevation-design.md` (append a `## §14 — Build results` section)

- [ ] **Step 1: Full gate sweep.** Server up. For each, load the URL, hard-reload, and record pass/fail with a screenshot:
  - **Gate A (transparency):** elevated corner pixel alpha ≈ 0 (drawImage 1×1 probe from Task 1 Step 4) — undrawn corner shows page background, not opaque black.
  - **Gate B (limb terminator-biased):** day-side limb arc brighter than night-side; not uniform.
  - **Gate C (terminator softened, no bleed):** wider day→night band; amber only on night side.
  - **Gate D (edges dissolve):** scan band + graticule have no hard edges.
  - **Gate E (soft points):** feathered point cores.
  - **Gate F (reveal):** plays once, settles; reduced-motion = instant.
  - **Gate G (parity):** `__sceneDebug()` `globeParticles`/`dpr` identical elevated vs classic; `fps` ≥ 58 high-tier desktop.
  - **Gate H (discipline):** grep confirms no new render target / composer / particle-count change: `grep -nE "WebGLRenderTarget|EffectComposer|globeParticles *=" js/background.js` → only the pre-existing SP1 bloom refs (dev-flag) and the tier definitions; nothing new from SP2.

- [ ] **Step 2: Tune-by-eye pass.** Against `refs/globe/004-nasa-rotate-globe.png` (the pinned key-art), adjust any of the open knobs that read wrong: limb `pow` exponent / `CAP` (Task 1 fragment), terminator band edges / cool-limb amount (Task 2), dissolve exponent (Task 3), reveal duration `1.8` / curl `0.06` (Tasks 2 & 4). Re-run `node --check` + a browser screenshot after any change. Commit tuning separately if changed:

```bash
git add js/background.js && git commit -m "polish(sp2): tune globe limb/terminator/reveal by eye vs refs/globe/004

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3: Record results.** Append `## §14 — Build results` to the spec with: the gate table (A–H pass/fail + evidence), the final tuned knob values, the environment (tier/dpr/particles/fps), and a `SP2 COMPLETE` decision line. (This mirrors SP1's design §3.1 results block.)

- [ ] **Step 4: Commit the record.**

```bash
git add docs/superpowers/specs/2026-07-03-sp2-globe-shader-elevation-design.md
git commit -m "docs(sp2): acceptance results + SP2 COMPLETE decision record

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 5: Finish the branch.** Announce and use superpowers:finishing-a-development-branch to verify the tree, present merge/PR options, and execute the owner's choice.

---

## Notes for the implementer

- **Edit by text-match, not line number.** Later tasks insert lines, so the cited line numbers drift; every step gives the exact `old_string` to match. Apply tasks in order (0→5) — Task 1's shell and Task 3's materials reference uniforms added in Task 0, and Task 4 drives terms baked in Tasks 1–3.
- **Hard-reload every browser check** (Cmd+Shift+R) — `background.js` keeps a fixed `?v=` and the browser caches it; a soft reload runs stale code (this bit SP1).
- **Additive non-premultiplied convention:** write `gl_FragColor = vec4(colorRGB, alpha)` and let `AdditiveBlending` (`SRC_ALPHA, ONE`) scale RGB by alpha — do NOT pre-multiply (matches the land shader).
- **If a shader fails to compile,** the object goes black/invisible and the console logs a GLSL error with a line number — read it; the most common cause is a redeclared built-in (`position`/`normal`/`uv`/`modelViewMatrix` are auto-injected for `ShaderMaterial` — never declare them).
