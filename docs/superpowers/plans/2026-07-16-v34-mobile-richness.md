# v3.4 Mobile Richness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Touch devices earn a new `mobile-rich` tier by GPU measurement — full bloom/grade/CA, motivated per-drop rain, richer counts — with a runtime fps watchdog that demotes gracefully; weak phones keep today's `lite` tier untouched.

**Architecture:** A boot-time GPU probe (`js/gpu-probe.mjs`, awaited by `boot.mjs` before `background.js` imports) stashes `window.__TIER_PROBE`; `getQualityProfile()` consumes it and every capability gate keys off new profile flags instead of `quality.name === 'high'` string checks. The render loop gains a demote-once watchdog on the existing `fpsEMA` gauge. Rivulet-on-mobile is M2: this plan lands only its gate plumbing (default off).

**Tech Stack:** Vanilla ES modules, three.js r158 (vendored), the repo's static hardening harness (`tools/verify-site-hardening.js`), Playwright WebKit (already installed in the session scratchpad at `<scratchpad>/node_modules`) for behavioral verification.

**Spec:** `docs/superpowers/specs/2026-07-16-v34-mobile-richness-design.md` — the payload table in §3 is normative for every number below.

## Global Constraints

- Branch: `v34-mobile-rich` (exists, off main 562b0a3). Commit style: `feat(v34<letter>): …`, `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Owner taste laws: deep black floor (#05060a family), no new always-on layers, retirement pairing, provenance comments on every tuned constant (house style — read neighboring comments before writing yours).
- `reduced` beats everything; fine-pointer desktop `high` byte-identical after this campaign; `small`-without-`coarse` (narrow desktop window) keeps plain `lite`, never probes.
- Layout/input stays keyed off `LITE`/`coarse` (portrait seat, tap-select, hover-scan skip, halo scale 0.82 / glow 0.9 / label opacity 0.72 / spin 0.5 — all four halo dims are portrait-composition choices, NOT richness).
- No UA/deviceMemory/GPU-string sniffing anywhere. Probe measures; identity never decides.
- Every task ends with `node tools/verify-site-hardening.js` exiting 0 (48 checks at start, 52 at end).
- Playwright runs use the scratchpad install: `cd <scratchpad> && node <script>.mjs`, serving the repo with `python3 -m http.server 8931 --bind 127.0.0.1` from the repo root (kill it when the task ends). `<scratchpad>` = the session scratchpad directory printed in the system prompt.
- No `Date.now()` restrictions here (that's a Workflow-script rule, not page code).

## File Structure

- **Create** `js/gpu-probe.mjs` — the only file that measures or decides touch-tier; exports `resolveTier()`.
- **Modify** `js/boot.mjs` — await probe before the `background.js` import; stash `window.__TIER_PROBE`.
- **Modify** `js/background.js` — profile flags, gate flips, watchdog, sceneDebug fields. (Large file is house-normal; no restructuring.)
- **Modify** `tools/verify-site-hardening.js` — four new checks (one per structural guarantee).
- **Modify** `index.html` — cache-bust bump only (final task).

---

### Task 1: GPU probe module

**Files:**
- Create: `js/gpu-probe.mjs`
- Test: `tools/verify-site-hardening.js` (new check)

**Interfaces:**
- Produces: `export async function resolveTier()` → `Promise<{tier: 'mobile-rich'|'lite'|null, score: number|null, forced: boolean}>`. `tier: null` = not applicable (fine pointer or reduced motion) — callers must treat null as "keep existing behavior". `forced: true` = `?tier=` override; the watchdog (Task 6) must skip enforcement when forced.

- [ ] **Step 1: Write the failing harness check**

Append to `tools/verify-site-hardening.js` immediately after the last existing `check(...)` call (before the reporting loop at the bottom), and add `const probe = read('js/gpu-probe.mjs');` alongside the existing `read(...)` lines at the top — but since the file doesn't exist yet, read it lazily inside the check:

```js
check(
  'v3.4: touch tier is earned by measurement, never identity',
  (() => {
    try {
      const probe = read('js/gpu-probe.mjs');
      return /readPixels/.test(probe) &&                      // sync fence — real measurement
        /sessionStorage/.test(probe) &&                        // session cache
        /catch/.test(probe) && /tier:\s*'lite'/.test(probe) && // fail-safe posture
        !/userAgent|deviceMemory|hardwareConcurrency/.test(probe) && // no identity sniffing
        /pointer:\s*coarse|hover:\s*none/.test(probe) &&       // coarse-only eligibility
        /prefers-reduced-motion/.test(probe);                  // reduced never probes
    } catch { return false; }
  })(),
  'js/gpu-probe.mjs must measure (readPixels fence), cache (sessionStorage), fail safe to lite, never sniff identity, and gate on coarse+reduced'
);
```

- [ ] **Step 2: Run to verify it fails**

Run: `node tools/verify-site-hardening.js; echo "exit: $?"`
Expected: `FAIL v3.4: touch tier is earned by measurement, never identity` and `exit: 1` (the harness exits non-zero on any FAIL — confirm by reading its tail if unsure).

- [ ] **Step 3: Write the module**

Create `js/gpu-probe.mjs`:

```js
/* v3.4 — boot-time GPU probe (spec §2). Touch devices EARN mobile-rich by
   measurement: ~12 frames of scene-shaped work (instanced additive quads =
   rain, separable blur ping-pong = UnrealBloom) on an offscreen 512×512
   WebGL2 context, each frame fenced with a 1×1 readPixels so the timer sees
   real GPU completion, not command-queue submission. Median ms/frame ≤
   RICH_THRESHOLD_MS → mobile-rich. NO identity sniffing — userAgent lies,
   GPU strings are hidden on Apple, and allowlists rot; measurement ages
   gracefully as phones improve (owner: "everyone nowadays has really
   strong phones"). Fail-safe: ANY throw, timeout, or missing WebGL2 → lite.
   Fine pointer / reduced motion → tier null (not applicable, caller keeps
   existing behaviour). ?tier=rich|lite forces the answer for QA (Playwright
   WebKit's emulated GPU would otherwise fail-safe to lite) and sets
   forced:true so the watchdog stands down. */

const RICH_THRESHOLD_MS = 4.5;   // calibration provenance: Task 7 logs measured medians (Apple M-class WebKit ≈ 1-2ms, Playwright sw-GL > 10ms); owner's iPhone verdict may retune — move WITH a new measurement comment, never bare
const FRAMES = 12, WARMUP = 2;   // 10 measured frames; first 2 absorb shader compile + first-bind cost
const BUDGET_MS = 1500;          // spec §2: blow the budget → lite (a probe this slow IS the answer)
const CACHE_KEY = 'v34.tierProbe';

export async function resolveTier() {
  const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!coarse || reduced) return { tier: null, score: null, forced: false };

  const forcedParam = new URLSearchParams(location.search).get('tier');
  if (forcedParam === 'rich') return { tier: 'mobile-rich', score: null, forced: true };
  if (forcedParam === 'lite') return { tier: 'lite', score: null, forced: true };

  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (cached && (cached.tier === 'mobile-rich' || cached.tier === 'lite')) {
      return { tier: cached.tier, score: cached.score ?? null, forced: false };
    }
  } catch { /* storage blocked (private mode quirks) — probe anyway */ }

  let result;
  try {
    result = await runProbe();
  } catch {
    result = { tier: 'lite', score: null };   // fail-safe posture (spec §2)
  }
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch { }
  return { ...result, forced: false };
}

async function runProbe() {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 512;
  const gl = cv.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return { tier: 'lite', score: null };

  const quad = compile(gl, `#version 300 es
    layout(location=0) in vec2 aPos;
    uniform float uSeed;
    void main() {
      float k = float(gl_InstanceID);
      vec2 c = vec2(fract(sin(k * 12.9898 + uSeed) * 43758.5453),
                    fract(sin(k * 78.2330 + uSeed) * 43758.5453)) * 2.0 - 1.0;
      gl_Position = vec4(aPos * 0.05 + c, 0.0, 1.0);
    }`, `#version 300 es
    precision highp float;
    out vec4 o;
    void main() { o = vec4(0.02, 0.03, 0.05, 0.04); }`);
  const blur = compile(gl, `#version 300 es
    layout(location=0) in vec2 aPos;
    out vec2 vUv;
    void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`, `#version 300 es
    precision highp float;
    in vec2 vUv;
    uniform sampler2D uTex;
    uniform vec2 uDir;
    out vec4 o;
    void main() {
      o = texture(uTex, vUv) * 0.4;
      for (int i = 1; i <= 2; i++) {
        o += texture(uTex, vUv + uDir * float(i)) * 0.15;
        o += texture(uTex, vUv - uDir * float(i)) * 0.15;
      }
    }`);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const fbos = [makeTarget(gl, 256), makeTarget(gl, 256)];
  const px = new Uint8Array(4);
  const times = [];
  const t0 = performance.now();

  for (let f = 0; f < FRAMES; f++) {
    const fStart = performance.now();
    // pass 1: 600 instanced additive quads at 512² — rain-shaped fill cost
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, 512, 512);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(quad.prog);
    gl.uniform1f(quad.u.uSeed, f);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 600);
    // pass 2: 4 × separable blur ping-pong at 256² — bloom-chain-shaped cost
    gl.disable(gl.BLEND);
    gl.useProgram(blur.prog);
    for (let p = 0; p < 4; p++) {
      const dst = fbos[p % 2], src = fbos[(p + 1) % 2];
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
      gl.viewport(0, 0, 256, 256);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform2f(blur.u.uDir, p % 2 ? 0 : 1 / 256, p % 2 ? 1 / 256 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);   // the fence — forces completion
    if (f >= WARMUP) times.push(performance.now() - fStart);
    if (performance.now() - t0 > BUDGET_MS) return { tier: 'lite', score: null };
  }
  gl.getExtension('WEBGL_lose_context')?.loseContext();

  times.sort((a, b) => a - b);
  const score = times[Math.floor(times.length / 2)];
  return { tier: score <= RICH_THRESHOLD_MS ? 'mobile-rich' : 'lite', score: Math.round(score * 100) / 100 };
}

function compile(gl, vsSrc, fsSrc) {
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  const u = {};
  for (const name of ['uSeed', 'uDir', 'uTex']) u[name] = gl.getUniformLocation(prog, name);
  return { prog, u };
}

function makeTarget(gl, size) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return { tex, fbo };
}
```

- [ ] **Step 4: Run the harness to verify it passes**

Run: `node tools/verify-site-hardening.js; echo "exit: $?"`
Expected: `PASS v3.4: touch tier is earned by measurement, never identity`, all prior 48 PASS, `exit: 0`.

- [ ] **Step 5: Commit**

```bash
git add js/gpu-probe.mjs tools/verify-site-hardening.js
git commit -m "feat(v34a): GPU probe — touch tier earned by measurement, fail-safe to lite

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Boot wiring

**Files:**
- Modify: `js/boot.mjs:17-18`
- Test: `tools/verify-site-hardening.js` (new check)

**Interfaces:**
- Consumes: `resolveTier()` from Task 1.
- Produces: `window.__TIER_PROBE = {tier, score, forced}` — set BEFORE `background.js` executes; `{tier: null}` on fine-pointer/reduced. Task 3's `getQualityProfile` reads it.

- [ ] **Step 1: Write the failing harness check** (append after Task 1's check):

```js
check(
  'v3.4: probe resolves before the scene imports',
  (() => {
    const boot = read('js/boot.mjs');
    const probeIdx = boot.indexOf('__TIER_PROBE');
    const bgIdx = boot.indexOf("import(`./background.js");
    return probeIdx !== -1 && bgIdx !== -1 && probeIdx < bgIdx &&
      /await\s+resolveTier\(\)/.test(boot);
  })(),
  'boot.mjs must await resolveTier() into window.__TIER_PROBE before importing background.js'
);
```

- [ ] **Step 2: Run to verify it fails** — `node tools/verify-site-hardening.js` → FAIL on the new check, exit 1.

- [ ] **Step 3: Implement.** In `js/boot.mjs`, the current lines 17–18 are:

```js
const V = { bg: '6.1', boot: '3.1', cursor: '3.1', fx: '3.8', app: '4.3' };
await import(`./background.js?v=${V.bg}`);
```

Replace with:

```js
const V = { bg: '6.1', boot: '3.1', cursor: '3.1', fx: '3.8', app: '4.3' };
/* v3.4 — tier probe MUST resolve before background.js runs: getQualityProfile
   executes at module scope and reads window.__TIER_PROBE exactly once. The
   probe self-gates (fine pointer / reduced → tier null, ~0ms; session cache
   makes revisits free), so desktop pays nothing here. */
window.__TIER_PROBE = await (await import('./gpu-probe.mjs?v=1')).resolveTier();
await import(`./background.js?v=${V.bg}`);
```

(Do NOT bump `V.bg`/versions here — Task 8 owns the cache-bust so intermediate commits don't churn every version string.)

- [ ] **Step 4: Run harness** → new check PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add js/boot.mjs tools/verify-site-hardening.js
git commit -m "feat(v34b): boot awaits the tier probe before the scene imports

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Quality profiles with capability flags + postFX/DPR gates

**Files:**
- Modify: `js/background.js` — `getQualityProfile()` (lines ~20-49), `bloomEnabled` (~line 2011), composer `samples` (4 sites, ~2041-2044 and ~2167-2168), `DPR_CAP` (~line 2284)
- Test: `tools/verify-site-hardening.js` (new check)

**Interfaces:**
- Consumes: `window.__TIER_PROBE` (Task 2 shape).
- Produces: profile fields every later task keys off: `postFX: bool`, `postFXSamples: int`, `wells: bool`, `labelPriority: int`, `graticuleFull: bool`, `shellSegs: [w, h]`, `beadCap: int`, `refractBeads: bool`, `rivulet: bool`, `dprCap: number`. Also `quality.name` may now be `'mobile-rich'`.

- [ ] **Step 1: Write the failing harness check** (append):

```js
check(
  'v3.4: capability gates key off profile flags, not tier-name strings',
  (() => {
    const nameChecks = (background.match(/quality\.name === 'high'/g) || []).length;
    return nameChecks === 0 &&
      /postFX:\s*(true|false)/.test(background) &&
      /wells:\s*(true|false)/.test(background) &&
      /name:\s*'mobile-rich'/.test(background) &&
      /__TIER_PROBE/.test(background) &&
      /bloomEnabled = quality\.postFX/.test(background);
  })(),
  'background.js: zero quality.name===\'high\' gates; profiles carry postFX/wells flags; mobile-rich profile exists and consumes __TIER_PROBE'
);
```

- [ ] **Step 2: Run to verify it fails** → FAIL, exit 1.

- [ ] **Step 3: Implement.**

**(a)** Replace the whole `getQualityProfile()` body (current lines 20–49; the three existing return objects for reduced/lite/high were read in this session — extend, don't rewrite their existing values):

```js
  function getQualityProfile() {
    /* v3.4 — capability FLAGS, not name strings (spec §4): every gate keys
       off its field so the profile is the single decision point. LITE the
       const remains ONLY input/layout (tap-select, portrait seat, hover-scan,
       halo portrait dims). Touch devices consume the boot probe verdict
       (window.__TIER_PROBE, gpu-probe.mjs): measured mobile-rich gets the
       desktop LOOK at phone-tuned numbers — owner 2026-07-16: phones are the
       primary demo surface, "I want that wow factor". small-without-coarse
       (narrow desktop window) stays plain lite and never probes. */
    if (reduced) return {
      name: 'reduced', dpr: 1, dprCap: 1,
      globeParticles: 2600, fieldCounts: [360, 180, 120],
      haloLabels: 1, haloTicks: 8, haloRings: 1,
      postFX: false, postFXSamples: 0, wells: false, labelPriority: 1,
      graticuleFull: false, shellSegs: [24, 16],
      beadCap: 0, refractBeads: false, rivulet: false,
    };
    const probe = (coarse && window.__TIER_PROBE) || null;
    if (LITE && !(probe && probe.tier === 'mobile-rich')) return {
      name: 'lite', dpr: Math.min(window.devicePixelRatio || 1, 1.5), dprCap: 1.5,
      globeParticles: 2600, fieldCounts: [1100, 520, 360],
      haloLabels: 2, haloTicks: 12, haloRings: 1,
      postFX: false, postFXSamples: 0, wells: false, labelPriority: 1,
      graticuleFull: false, shellSegs: [24, 16],
      beadCap: 12, refractBeads: false, rivulet: false,
    };
    if (LITE) return {
      /* mobile-rich (spec §3 table) — phone-tuned, NOT desktop copies; each
         delta from high is a battery/fill-rate trade recorded here: samples
         2 (not 4) halves MSAA resolve cost at retina fill rates; 5000/1800/
         850/620 counts hold the density READ at 390-430pt widths; 320 rain
         quads with WELLS keeps the motivated-light law (v3.2l) on phones. */
      name: 'mobile-rich', dpr: Math.min(window.devicePixelRatio || 1, 2), dprCap: 2,
      globeParticles: 5000, fieldCounts: [1800, 850, 620],
      haloLabels: 5, haloTicks: 24, haloRings: 2,
      postFX: true, postFXSamples: 2, wells: true, labelPriority: 3,
      graticuleFull: true, shellSegs: [48, 32],
      beadCap: 16, refractBeads: true, rivulet: false,   // rivulet = M2 (spec §7), RIVULET_MOBILE_GATE ships false
    };
    return {
      name: 'high', dpr: Math.min(window.devicePixelRatio || 1, 2), dprCap: 2,
      globeParticles: 7000, fieldCounts: [2600, 1200, 900],
      haloLabels: 5, haloTicks: 24, haloRings: 2,
      postFX: true, postFXSamples: 4, wells: true, labelPriority: 3,
      graticuleFull: true, shellSegs: [48, 32],
      beadCap: 24, refractBeads: true, rivulet: RIVULET_GATE,
    };
  }
```

**(b)** `RIVULET_GATE` is currently declared at ~line 793, AFTER the profile runs. Move the const declaration up to sit beside `sceneDebug` (~line 16), keeping its full v3.3f comment block intact at the new location; leave `let rivulet = null;` where it is.

**(c)** The bloom gate (current text at ~2011):

```js
  const bloomEnabled = quality.name === 'high' && !reduced &&
                       !!(window.POST && window.POST.EffectComposer);
```

becomes:

```js
  const bloomEnabled = quality.postFX &&
                       !!(window.POST && window.POST.EffectComposer);
```

(`reduced` is subsumed: the reduced profile carries `postFX: false`.)

**(d)** All four composer sample assignments (`bloomComposer.renderTarget1.samples = 4;` etc. at ~2041-2044, and the `finalComposer` pair at ~2167-2168): replace the literal `4` with `quality.postFXSamples`, and update the v3.2e comment to note samples ride the profile (2 on mobile-rich, 4 on high).

**(e)** `DPR_CAP` (current text at ~2284): `const DPR_CAP = reduced ? 1 : LITE ? 1.5 : 2;` becomes `const DPR_CAP = quality.dprCap;   // v3.4: the profile is the single tier authority` — verify the resize path that consumes DPR_CAP still reads correctly.

- [ ] **Step 4: Run harness** → new check PASS (note: Task 5 flips the two remaining `quality.name === 'high'` sites — if the count isn't 0 yet, the check stays red; in that case flip those two sites in THIS task instead: the halo label filter at ~745 (`quality.name === 'high' ? 3 : 1` → `quality.labelPriority`) and the droplets gate at ~811 — no, the droplets gate is `RIVULET_GATE && quality.name === 'high'` → replace with `quality.rivulet` now; Tasks 4-5 then only touch counts/defines). All 51 PASS, exit 0.

- [ ] **Step 5: Desktop no-regression screenshot.** From repo root: `python3 -m http.server 8931 --bind 127.0.0.1 &`. In `<scratchpad>`, run a Playwright chromium-or-webkit desktop 1440×900 load of `http://127.0.0.1:8931/`, 15s settle, screenshot — compare visually against the v3.3h live-verification screenshot (globe glow, rain, floor). Expected: indistinguishable.

- [ ] **Step 6: Commit**

```bash
git add js/background.js tools/verify-site-hardening.js
git commit -m "feat(v34c): capability-flag profiles + mobile-rich tier; postFX/DPR gates ride the profile

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Rain — three-way defs + WELLS by flag

**Files:**
- Modify: `js/background.js` — rain defs (~line 539), shader defines (~line 673), wells update branch (~line 1600), beat coupling (~line 1622)
- Test: Playwright behavioral check (Step 4)

**Interfaces:**
- Consumes: `quality.wells` (Task 3).
- Produces: nothing new — later tasks don't touch rain.

- [ ] **Step 1: Implement the three-way defs.** Current (line ~539):

```js
    const defs = LITE
      ? [{ n: 80, size: 0.26, speed: [4.5, 6.5], op: 0.32, z: [-5, -9], len: 0.7, head: 0.85 },
         { n: 130, size: 0.16, speed: [2.4, 3.8], op: 0.22, z: [-8, -14], len: 0.45, head: 0.7 }]
      : [{ n: 70, size: 0.4, speed: [8, 14], op: 0.5, z: [-4, -7], len: 0.8, head: 0.9 },
         { n: 150, size: 0.24, speed: [4.2, 7.5], op: 0.36, z: [-6, -11], len: 0.55, head: 0.8 },
         { n: 250, size: 0.15, speed: [2.2, 4.2], op: 0.24, z: [-9, -16], len: 0.35, head: 0.65 }];
```

becomes (update the surrounding comment's "470 quads high tier / 210 LITE" arithmetic to "470 high / 320 mobile-rich / 210 lite"):

```js
    const defs = quality.name === 'mobile-rich'
      /* v3.4: 320 quads — high's THREE-layer depth structure (near/mid/far
         parallax is the wow read) at ~2/3 density; same z-bands and speed
         character so the lean/stretch law needs no retune. */
      ? [{ n: 50, size: 0.38, speed: [7.5, 13], op: 0.48, z: [-4, -7], len: 0.8, head: 0.9 },
         { n: 100, size: 0.23, speed: [4.0, 7.0], op: 0.35, z: [-6, -11], len: 0.55, head: 0.8 },
         { n: 170, size: 0.15, speed: [2.2, 4.2], op: 0.24, z: [-9, -16], len: 0.35, head: 0.65 }]
      : LITE
      ? [{ n: 80, size: 0.26, speed: [4.5, 6.5], op: 0.32, z: [-5, -9], len: 0.7, head: 0.85 },
         { n: 130, size: 0.16, speed: [2.4, 3.8], op: 0.22, z: [-8, -14], len: 0.45, head: 0.7 }]
      : [{ n: 70, size: 0.4, speed: [8, 14], op: 0.5, z: [-4, -7], len: 0.8, head: 0.9 },
         { n: 150, size: 0.24, speed: [4.2, 7.5], op: 0.36, z: [-6, -11], len: 0.55, head: 0.8 },
         { n: 250, size: 0.15, speed: [2.2, 4.2], op: 0.24, z: [-9, -16], len: 0.35, head: 0.65 }];
```

- [ ] **Step 2: Flip the three WELLS gates.**
- Line ~673: `defines: LITE ? {} : { WELLS: '' },` → `defines: quality.wells ? { WELLS: '' } : {},`
- Line ~1600: `if (!LITE) {   // wells: …` → `if (quality.wells) {   // wells: …` (keep the rest of the comment)
- Line ~1622: `(LITE ? (flash || 0) * LITE_FLASH_BEAT : 0)` → `(quality.wells ? 0 : (flash || 0) * LITE_FLASH_BEAT)` — and update the v3.3b C2 comment sentence "LITE compiles no wells" to "tiers without wells keep the flat coupling".

- [ ] **Step 3: Run harness** → all PASS (no new check; this task is behavioral).

- [ ] **Step 4: Behavioral verify.** Serve repo on :8931. In `<scratchpad>` write/run `v34-rain-check.mjs`: Playwright WebKit, viewport 390×844, `hasTouch: true`, load `http://127.0.0.1:8931/?tier=rich&sceneDebug=1`, wait 12s, assert via `page.evaluate`: `__sceneDebug()` returns `tier` absent for now but `quality` = `mobile-rich` is not yet exposed (Task 6 adds fields) — so assert instead: `lite: true` is GONE from the debug payload path — simpler: screenshot and confirm ≥3 distinct rain streaks visible in the sky quadrant (crop top-right 400×300, count pixels > rgb(80,80,80): expect > 150 lit pixels; the same crop under `?tier=lite` expects fewer). Also `?tier=lite` run: screenshot matches today's mobile look; zero `pageerror` in both.

Expected: rich run visibly rainier + zero console errors; lite run unchanged.

- [ ] **Step 5: Commit**

```bash
git add js/background.js
git commit -m "feat(v34d): motivated per-drop rain on mobile-rich — 320 quads, WELLS by capability flag

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Graticule, holo-scan shell, remaining count gates

**Files:**
- Modify: `js/background.js` — ringLats (~line 351), meridians (~line 359), shell segs (~line 1198); audit sweep
- Test: harness + Playwright screenshot

**Interfaces:**
- Consumes: `quality.graticuleFull`, `quality.shellSegs`, `quality.labelPriority`, `quality.beadCap`, `quality.refractBeads`, `quality.rivulet` (Task 3).

- [ ] **Step 1: Flip the gates.**
- ~351: `const ringLats = LITE ? [0, 30, -30] : [0, 30, -30, 60, -60];` → `const ringLats = quality.graticuleFull ? [0, 30, -30, 60, -60] : [0, 30, -30];`
- ~359: `if (!LITE) for (let m = 0; m < 6; m++) {` → `if (quality.graticuleFull) for (let m = 0; m < 6; m++) {`
- ~1198: `const segW = LITE ? 24 : 48, segH = LITE ? 16 : 32;` → `const [segW, segH] = quality.shellSegs;`
- Droplets IIFE (~814-815): `const cap = LITE ? 12 : 24;` → `const cap = quality.beadCap;` and `const REFRACT = !LITE;` → `const REFRACT = quality.refractBeads;` (the IIFE's early return already keys off `quality.rivulet` since Task 3).

- [ ] **Step 2: Full-file LITE audit.** Run `grep -n 'LITE' js/background.js` and confirm every remaining non-comment site is input/layout ONLY: seat (~194), halo scale (~694), glow (~711), size (~757), tap/hover (~1431, ~1546), spin rate (~1664), label opacity (~1681), veil consts (~524-525, still used by lite), debug field (~1810). Anything richness-flavored that remains → flip it to a flag and note it in the commit body. Do not flip the halo portrait dims (Global Constraints).

- [ ] **Step 3: Run harness** → all PASS. Serve + Playwright WebKit 390×844 `?tier=rich`: screenshot shows meridian lines on the globe (compare lite: only 3 flat rings). Zero pageerrors.

- [ ] **Step 4: Commit**

```bash
git add js/background.js
git commit -m "feat(v34e): graticule meridians, 48x32 shell, bead/refraction caps ride the profile on mobile-rich

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Demotion watchdog + sceneDebug surface

**Files:**
- Modify: `js/background.js` — render dispatch (~line 2330), the main loop (where `fpsEMA` updates), `getSceneDebug()` (~line 1783)
- Test: `tools/verify-site-hardening.js` (new check) + Playwright forced-demotion run

**Interfaces:**
- Consumes: `quality.name === 'mobile-rich'`, `window.__TIER_PROBE.forced`, existing `fpsEMA`, existing `bloomComposer`/`finalComposer`/`renderBloomThenFinal`.
- Produces: `__sceneDebug()` gains `{tier, probeScore, demoted}`; sessionStorage `v34.tierProbe` overwritten `{tier:'lite', demoted:true}` on demotion.

- [ ] **Step 1: Write the failing harness check** (append):

```js
check(
  'v3.4: mobile-rich demotes exactly once and the portrait seat survives richness',
  /demoted = true/.test(background) &&
    /richLowT/.test(background) &&
    /fpsEMA < 45/.test(background) &&
    /!demoted/.test(background) &&                    // the once-guard
    /LITE \? \[5\.8, 0\.35, -4\.5\]/.test(background) && // portrait seat still input/layout-keyed
    /tier:\s*quality\.name/.test(background),          // debug surface reports the tier
  'watchdog: fpsEMA<45 sustained -> demote once (strip postFX, DPR 1.5, session-sticky); seat stays LITE-keyed; __sceneDebug reports tier'
);
```

- [ ] **Step 2: Run to verify it fails** → FAIL, exit 1.

- [ ] **Step 3: Implement.**

**(a)** Render dispatch (current ~2330): the two-path constant

```js
    : () => renderer.render(scene, camera);        // reduced / LITE: direct path
```

Find the full assignment (it selects `renderBloomThenFinal` when composers exist) and restructure to a live flag:

```js
  /* v3.4 — usePost is a LIVE lever, not a boot constant: the watchdog strips
     postFX mid-session without touching geometry (spec §5: postFX + DPR are
     the cost; counts stay — approach B's rebuild-pop is exactly what we
     refused to ship). */
  let usePost = !!renderBloomThenFinal;
  const render = () => {
    if (usePost && renderBloomThenFinal) renderBloomThenFinal();
    else renderer.render(scene, camera);
  };
```

**(b)** Watchdog state + demote, placed with the loop's other `let` state (near `fpsEMA`, ~1782):

```js
  /* v3.4 demotion watchdog (spec §5) — mobile-rich only, probe can't see
     thermal throttle / Low Power Mode (iOS caps rAF at 30fps there → this
     trips within WATCHDOG_HOLD_S, by design, no special-casing). Demote
     ONCE per session, never re-promote: hysteresis flapping reads worse
     than a stable lite. ?tier= forces stand-down (QA determinism). */
  const WATCHDOG_FPS = 45, WATCHDOG_HOLD_S = 4;
  let richLowT = 0, demoted = false;
  function demoteTier() {
    demoted = true;
    usePost = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    try {
      if (bloomComposer) { bloomComposer.renderTarget1.dispose(); bloomComposer.renderTarget2.dispose(); }
      if (finalComposer) { finalComposer.renderTarget1.dispose(); finalComposer.renderTarget2.dispose(); }
    } catch { /* GPU memory back; passes' internal targets follow on GC */ }
    try { sessionStorage.setItem('v34.tierProbe', JSON.stringify({ tier: 'lite', score: null, demoted: true })); } catch { }
  }
```

**(c)** Inside the loop, immediately after the existing `fpsEMA` update line:

```js
    if (quality.name === 'mobile-rich' && !(window.__TIER_PROBE && window.__TIER_PROBE.forced) && !demoted) {
      if (fpsEMA < WATCHDOG_FPS) { richLowT += dt; if (richLowT >= WATCHDOG_HOLD_S) demoteTier(); }
      else richLowT = 0;
    }
```

**(d)** `getSceneDebug()` return object gains three fields (after `lite: LITE,`):

```js
      tier: quality.name,
      probeScore: (window.__TIER_PROBE && window.__TIER_PROBE.score) ?? null,
      demoted,
```

**(e)** Resize handler: find where composers `setSize` on resize; guard with `if (usePost)` so a demoted session doesn't resize disposed targets.

- [ ] **Step 4: Run harness** → new check PASS, 52/52, exit 0.

- [ ] **Step 5: Forced-demotion verify.** The watchdog stands down under `?tier=rich` (forced), so exercise it via evaluate: serve, Playwright WebKit 390×844 hasTouch, `?tier=rich&sceneDebug=1`, wait 8s, then `page.evaluate(() => { /* simulate sag */ })` cannot reach `fpsEMA` (closure) — instead assert the stand-down: 20s at `?tier=rich` → `__sceneDebug().demoted === false` and `tier === 'mobile-rich'`. Then a REAL-probe run (no `?tier=`): Playwright's software GL must score > 4.5ms → `__sceneDebug().tier === 'lite'` — this proves the fail-safe chain end-to-end. Zero pageerrors in both.

- [ ] **Step 6: Commit**

```bash
git add js/background.js tools/verify-site-hardening.js
git commit -m "feat(v34f): fps watchdog — mobile-rich demotes once (postFX off, DPR 1.5, session-sticky); sceneDebug reports tier/probe/demotion

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Full verification battery + threshold calibration log

**Files:**
- Create: `<scratchpad>/v34-verify.mjs` (throwaway; not committed)
- Modify: `js/gpu-probe.mjs` only if calibration moves `RICH_THRESHOLD_MS` (with provenance comment)

- [ ] **Step 1: Battery script.** Serve repo on :8931. `<scratchpad>/v34-verify.mjs` runs all five, printing PASS/FAIL each:
1. WebKit 390×844 hasTouch `?tier=rich&sceneDebug=1` 15s: `__sceneDebug()` → `tier==='mobile-rich'`, `demoted===false`; screenshot saved (owner exhibit A); zero pageerrors.
2. Same viewport `?tier=lite&sceneDebug=1`: `tier==='lite'`; screenshot (exhibit B) visually = today's mobile.
3. Same viewport, NO param: real probe on emulated GL → expect `tier==='lite'` (fail-safe proof); log the probe score from `__sceneDebug().probeScore`.
4. WebKit desktop 1440×900 (fine pointer): `tier==='high'`, screenshot = v3.3h look (rain+glow present, floor [0,1,6] at (20,500) via pngjs).
5. Reduced-motion run (`page.emulateMedia({ reducedMotion: 'reduce' })`, mobile viewport): `tier==='reduced'` — wait: reduced profile name is 'reduced'; assert that, and probe returned `tier:null` (no probe ran: `probeScore===null`).

- [ ] **Step 2: Run it; all five PASS.** Fix forward anything red before proceeding (systematic-debugging, not tweaks).

- [ ] **Step 3: Calibration provenance.** Record run 3's measured software-GL score and this Mac's WebKit score (run once with hasTouch on the Mac GPU — temporarily evaluate `resolveTier` in a desktop-hasTouch context, e.g. viewport 1024×768 hasTouch: expect ≤ ~2ms) into the `RICH_THRESHOLD_MS` comment in `js/gpu-probe.mjs` (replace the placeholder provenance clause with the two measured numbers). The 4.5ms line stays unless the measurements contradict it — if they do, move it WITH the numbers in the comment.

- [ ] **Step 4: Commit** (only if gpu-probe.mjs changed):

```bash
git add js/gpu-probe.mjs
git commit -m "feat(v34g): probe threshold provenance — measured medians recorded

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Cache-bust + close-out

**Files:**
- Modify: `js/boot.mjs` (V.bg, and the probe import version if it changed in Task 7), `index.html` (boot version)

- [ ] **Step 1: Bump versions.** `js/boot.mjs`: `bg: '6.1'` → `bg: '7.0'` (new campaign major, house pattern). `index.html`: `js/boot.mjs?v=30` → `?v=31`. If Task 7 edited gpu-probe.mjs, bump its import to `gpu-probe.mjs?v=2`.

- [ ] **Step 2: Final gates.** `node tools/verify-site-hardening.js` → 52/52, exit 0. Re-run Task 7's battery once more against the bumped versions (cache-bust regressions are exactly what it would catch). `git status` clean besides intended files.

- [ ] **Step 3: Commit**

```bash
git add js/boot.mjs index.html
git commit -m "feat(v34h): cache-bust — bg 7.0, boot v31; campaign gates green (52/52 + 5-run battery)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Owner gate.** Do NOT push or PR. Report to the owner with exhibits A/B (rich vs lite mobile screenshots): the ship gate is their on-device verdict (spec §6), and push/merge is owner-approved per action on this repo. M2 (rivulet port) is a separate plan, written only if M1's on-device verdict lands.

---

## Self-Review (completed at write time)

- **Spec coverage:** §2 probe → T1/T2; §3 payload table → T3 (profile numbers), T4 (rain), T5 (graticule/shell/beads); §4 flag refactor → T3 (+T5 audit); §5 watchdog → T6; §6 QA overrides/battery → T1 (`?tier=` in probe), T7; §7 M2 → gate plumbing in T3 (`rivulet:false` + RIVULET_MOBILE_GATE deferred to M2 plan) and T8 close-out note; §8 exclusions → Global Constraints. No gaps.
- **Placeholder scan:** none — every step carries code, exact anchors, or exact commands.
- **Type consistency:** `resolveTier()` shape `{tier, score, forced}` consistent T1→T2→T3→T6; profile field names identical in T3 definitions and T4/T5/T6 consumers; `usePost`/`demoted`/`richLowT` defined T6 where used; sessionStorage key `v34.tierProbe` identical T1/T6.
