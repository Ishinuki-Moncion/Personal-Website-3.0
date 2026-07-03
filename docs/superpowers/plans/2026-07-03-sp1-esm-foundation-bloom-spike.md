# SP1 — ES-Module Foundation + Alpha-Preserving Bloom Spike — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the site's JS loading from classic `<script>` globals to an import-map + ES-module `boot.mjs`, then spike alpha-preserving *official* selective bloom over the transparent canvas — proving Plan C's Path-2 spine and de-risking the #1 technical unknown.

**Architecture:** A new `tools/vendor-three-esm.cjs` copies the same pinned `three@0.158.0` ESM build + a 10-file jsm postprocessing graph + `es-module-shims` into `js/vendor/`. `index.html` drops the global `<script>` and loads an import-map + a single `boot.mjs` that publishes `window.THREE`/`window.POST` (static imports, evaluated first) then sequentially dynamic-imports the five unchanged scene IIFEs. Bloom is a flag-gated (`?bloom=1`, high-tier only) two-composer dark-material-swap block inside `background.js` whose `NoBlending` mixPass keeps `base.a` so undrawn pixels stay alpha 0.

**Tech Stack:** Static HTML/CSS/vanilla JS (no bundler, no framework). `three@0.158.0` ESM build + `examples/jsm` postprocessing addons. `es-module-shims@1.10.0` (self-hosted import-map polyfill). Node.js (build-time vendor tool + `node --check` validity). Python 3 `http.server` (local static serving). Chrome DevTools (network/console/screenshot gates).

## Global Constraints

- No-build / drop-on-host is preserved — the site still ships as static files; the vendor tool runs at build time only, never at runtime.
- three stays **r158** — NO version upgrade in SP1 (the r168 + pmndrs move is SP4).
- The 5 scene files (`background.js`, `boot.js`, `cursor.js`, `effects.js`, `app.js`) ship **BYTE-IDENTICAL** except the flagged bloom block appended inside `background.js`.
- The transparent `alpha:true` canvas MUST be preserved — undrawn pixels stay alpha 0 and the CSS gradient shows through.
- Site must be served over **http(s)** — ES modules + import-maps are blocked under `file://`.
- Vendor `three` + `es-module-shims` **LOCALLY** — no CDN references in shipped HTML/JS.
- `?v=` cache-busting is preserved — scene-file versions move verbatim into `boot.mjs` `import()` strings; `boot.mjs` and the shim carry `?v=1`.
- Delete the old `js/vendor/three.global.min.js` `<script>` (index.html:337) in the same edit that adds the import-map — never two THREE instances (R1).
- Commits made while executing this plan append the trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` (the `git commit -m` examples below omit it for brevity).

### Flagged under-specifications (design gaps) → concrete choices made here

1. **Where three is sourced from** (no node_modules): `npm pack three@0.158.0 es-module-shims@1.10.0` into a temp dir, extract, point the vendor tool at the unpacked package. npm packages are immutable, so this is byte-identical to the r158 that produced today's global — the design's single-source-of-truth intent. Build-time fetch only; zero runtime CDN.
2. **Bloom params** (unspecified): `strength=0.9, radius=0.5, threshold=0.6`, named consts, tunable at gate #4.
3. **Dark-swap material** (official uses one opaque black `MeshBasicMaterial`, unsafe for our Sprites and it would introduce occlusion our additive scene never had): use a black `MeshBasicMaterial` **and** a black `SpriteMaterial`, both `depthWrite:false`.
4. **Halo tag scope** ("glow sprite + rings"): tag `tokyoHalo.glow` + `tokyoHalo.rings[]` only; exclude the canvas text labels / transit / packet to avoid frame wash.
5. **es-module-shims dist filename**: `dist/es-module-shims.js` (already minified in the published package) → vendored as `es-module-shims-1.10.0.min.js`.
6. **Gate #2 alpha sampling** (post-composite `readPixels` is unreliable without `preserveDrawingBuffer`): expose `window.__bloomProbe()` that renders one frame then `readPixels` synchronously (valid before compositing), plus a screenshot-composite check for "gradient visible."
7. **Gate #3 determinism** (animated scene, no frame seeding): A/B `?bloom=0` vs `?bloom=1&emptySel=1` (empty selection ⇒ bloom contributes 0 ⇒ composite must equal direct render); gross signal (global darkening / ghost trails), corroborated by `__bloomProbe().centre` RGB.
8. **Bloom-block insertion point** (design says only "in background.js"): immediately after `let resizeTm;` (line 1343), before the resize handler, so the `let bloomComposer` declarations precede the resize (1350) and render (1373) references.
9. **Foundation commit boundary**: T2 stages the edits and runs `node --check`; the single foundation commit lands in **T3** only after browser gate #1 is green (design §4 step 4 sequences verify→commit).

---

## T1 — Vendor the r158 ESM assets (`tools/vendor-three-esm.cjs`)

**Files:** Create `tools/vendor-three-esm.cjs` · Produces `js/vendor/three-0.158.0/three.module.min.js`, `js/vendor/three-0.158.0/examples/jsm/postprocessing/{EffectComposer,Pass,RenderPass,ShaderPass,MaskPass,UnrealBloomPass,OutputPass}.js`, `js/vendor/three-0.158.0/examples/jsm/shaders/{CopyShader,LuminosityHighPassShader,OutputShader}.js`, `js/vendor/es-module-shims-1.10.0.min.js` · Leaves `js/vendor/three.global.min.js` on disk (R12).

**Interfaces:** Consumes — a locally-unpacked `three@0.158.0` package dir + an `es-module-shims@1.10.0` dist file (CLI args, mirroring `build-three-global.cjs`'s path-arg mechanism). Produces — the vendored ESM tree the import-map in T2 resolves against; the transitive-import closure is asserted here so a missing addon fails before any browser load (R3).

- [ ] **Create `tools/vendor-three-esm.cjs`** with this exact content:

```js
#!/usr/bin/env node
/* Vendors the r158 ES-module build + the minimal jsm postprocessing graph for
   the daikieOS Path-2 foundation (SP1). Mirrors tools/build-three-global.cjs:
   it does NOT fetch — it COPIES from a locally-supplied three@0.158.0 package
   (the same immutable npm-published r158 that produced js/vendor/three.global.min.js)
   plus a locally-supplied es-module-shims@1.10.0 dist file. Obtain both with npm
   pack (build-time only; nothing here ships a CDN reference):
     mkdir -p /tmp/sp1 && npm pack three@0.158.0 es-module-shims@1.10.0 --pack-destination /tmp/sp1
     ( cd /tmp/sp1 && tar -xf three-0.158.0.tgz && mv package three && \
       tar -xf es-module-shims-1.10.0.tgz && mv package esms )
   then run:
     node tools/vendor-three-esm.cjs /tmp/sp1/three /tmp/sp1/esms/dist/es-module-shims.js
   Re-run only the closure check against the existing vendor dir with:
     node tools/vendor-three-esm.cjs --check
*/
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const OUT_ROOT = path.join(REPO, 'js', 'vendor');
const THREE_DIR = path.join(OUT_ROOT, 'three-0.158.0');
const SHIMS_OUT = path.join(OUT_ROOT, 'es-module-shims-1.10.0.min.js');

// Complete r158 transitive closure for the official jsm composer (design §1e).
const JSM = [
  'postprocessing/EffectComposer.js',
  'postprocessing/Pass.js',
  'postprocessing/RenderPass.js',
  'postprocessing/ShaderPass.js',
  'postprocessing/MaskPass.js',
  'postprocessing/UnrealBloomPass.js',
  'postprocessing/OutputPass.js',
  'shaders/CopyShader.js',
  'shaders/LuminosityHighPassShader.js',
  'shaders/OutputShader.js',
];

function fail(msg) { console.error('ERROR: ' + msg); process.exit(1); }

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('  + ' + path.relative(REPO, dest));
}

/* Transitive-import-closure check: every RELATIVE import in a vendored addon
   must resolve to another vendored file. Bare 'three' / 'three/...' specifiers
   are import-map-resolved and skipped. Catches a missing addon before a runtime
   404 (R3). */
function closureCheck() {
  const jsmRoot = path.join(THREE_DIR, 'examples', 'jsm');
  if (!fs.existsSync(jsmRoot)) fail('vendor dir missing: ' + jsmRoot + ' (run the copy step first)');
  const files = JSM.map(rel => path.join(jsmRoot, rel));
  const importRe = /\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let bad = 0, checked = 0;
  for (const file of files) {
    if (!fs.existsSync(file)) { console.error('MISSING vendored file: ' + path.relative(REPO, file)); bad++; continue; }
    const src = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = importRe.exec(src))) {
      const spec = m[1] || m[2];
      if (spec === 'three' || spec.startsWith('three/')) continue;
      if (!spec.startsWith('.')) continue;
      const target = path.resolve(path.dirname(file), spec);
      checked++;
      if (!fs.existsSync(target)) {
        console.error('BROKEN import in ' + path.relative(REPO, file) + ' -> ' + spec +
          ' (expected ' + path.relative(REPO, target) + ')');
        bad++;
      }
    }
  }
  if (bad) fail(bad + ' vendored file/import problem(s) — the addon graph is incomplete.');
  console.log('closure check OK: ' + files.length + ' addon files present, ' + checked + ' relative imports all resolve.');
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--check') { closureCheck(); return; }

  const [threeRoot, shimsFile] = args;
  if (!threeRoot || !shimsFile) {
    fail('Usage: node tools/vendor-three-esm.cjs <three-0.158.0-package-dir> <es-module-shims.js>\n' +
         '       node tools/vendor-three-esm.cjs --check');
  }

  // 1. ESM core build — single source of truth with the retiring global.
  const buildSrc = path.join(path.resolve(threeRoot), 'build', 'three.module.min.js');
  if (!fs.existsSync(buildSrc)) fail('not found: ' + buildSrc + ' (arg1 must be an unpacked three package root)');
  const buildTxt = fs.readFileSync(buildSrc, 'utf8');
  if (!/REVISION\s*=\s*["']158["']/.test(buildTxt)) {
    fail('three build is not r158 (REVISION="158" not found) — pin mismatch, refusing to vendor.');
  }
  copyFile(buildSrc, path.join(THREE_DIR, 'three.module.min.js'));

  // 2. minimal jsm graph.
  const jsmSrcRoot = path.join(path.resolve(threeRoot), 'examples', 'jsm');
  for (const rel of JSM) {
    const src = path.join(jsmSrcRoot, rel);
    if (!fs.existsSync(src)) fail('not found: ' + src + ' (three package incomplete?)');
    copyFile(src, path.join(THREE_DIR, 'examples', 'jsm', rel));
  }

  // 3. es-module-shims, self-hosted (no CDN).
  const shimsSrc = path.resolve(shimsFile);
  if (!fs.existsSync(shimsSrc)) fail('not found: ' + shimsSrc);
  copyFile(shimsSrc, SHIMS_OUT);

  // 4. prove the closure now, before any browser load (R3).
  closureCheck();
  console.log('vendored three r158 ESM + ' + JSM.length + '-file jsm graph + es-module-shims into js/vendor/.');
}

main();
```

- [ ] **Validate the tool parses.** Run `node --check tools/vendor-three-esm.cjs`. Expected: no output, exit 0.
- [ ] **Fetch the pinned packages (build-time only).** Run:
  ```sh
  mkdir -p /tmp/sp1 && npm pack three@0.158.0 es-module-shims@1.10.0 --pack-destination /tmp/sp1
  ( cd /tmp/sp1 && tar -xf three-0.158.0.tgz && mv package three && \
    tar -xf es-module-shims-1.10.0.tgz && mv package esms )
  ```
  Expected: two `.tgz` files downloaded; `/tmp/sp1/three/build/three.module.min.js` and `/tmp/sp1/esms/dist/es-module-shims.js` exist (verify with `ls /tmp/sp1/three/build/three.module.min.js /tmp/sp1/esms/dist/es-module-shims.js`).
- [ ] **Run the vendor tool.** Run `node tools/vendor-three-esm.cjs /tmp/sp1/three /tmp/sp1/esms/dist/es-module-shims.js`. Expected: `+ js/vendor/three-0.158.0/three.module.min.js`, ten `+ js/vendor/three-0.158.0/examples/jsm/...` lines, `+ js/vendor/es-module-shims-1.10.0.min.js`, then `closure check OK: 10 addon files present, N relative imports all resolve.` (N ≈ 10) and the final `vendored ...` line.
- [ ] **Confirm the tree on disk.** Run `find js/vendor/three-0.158.0 -type f | sort`. Expected exactly 11 files: `three.module.min.js` + 7 `postprocessing/*.js` + 3 `shaders/*.js`.
- [ ] **Re-run the standalone closure check** (independently re-runnable, no re-copy). Run `node tools/vendor-three-esm.cjs --check`. Expected: `closure check OK: 10 addon files present, N relative imports all resolve.`
- [ ] **Syntax-check every vendored module.** Run `for f in js/vendor/three-0.158.0/three.module.min.js js/vendor/three-0.158.0/examples/jsm/**/*.js; do node --check "$f" || echo "FAIL $f"; done`. Expected: no `FAIL` lines.
- [ ] **Capture the CLASSIC reference baseline** (index.html is still unedited, so this is today's build). Serve and screenshot for the gate #1 side-by-side in T3:
  ```sh
  python3 -m http.server 8000 >/tmp/sp1-http.log 2>&1 &
  ```
  Open `http://localhost:8000/` in Chrome, let the boot arc finish (~4 s), take a full-page screenshot to `/tmp/sp1-classic.png`, and a second at a calm post-boot moment to `/tmp/sp1-classic-2.png`. Note in the log that console is error-free. Leave the server running for later tasks (or restart it as needed). Expected: two reference PNGs saved; scene renders (globe + halo + arc) with no console errors.
- [ ] **Commit.** Run `git add tools/vendor-three-esm.cjs js/vendor/three-0.158.0 js/vendor/es-module-shims-1.10.0.min.js && git commit -m "build(sp1): vendor three r158 ESM + jsm postprocessing graph + es-module-shims (Path-2 foundation)"`. (Vendoring only adds files; the classic build still runs unchanged, so this commit is independently safe.)

---

## T2 — Restructure `index.html` tail + create `js/boot.mjs`

**Files:** Modify `index.html` (lines 337–343 only; `<head>` untouched) · Create `js/boot.mjs` · The five scene files stay byte-identical.

**Interfaces:** Produces — `window.THREE` (from the static `import * as THREE`) and `window.POST.{EffectComposer,RenderPass,ShaderPass,UnrealBloomPass,OutputPass}`, both assigned before the scene `import()`s run. Consumes — the vendored tree from T1 via the import-map (`three` → `three.module.min.js`, `three/addons/` → `examples/jsm/`). The `background.js:9` guard `if (!mount || !window.THREE) return;` sees `window.THREE` populated (load-order is a data dependency inside one module — R4 structurally eliminated).

- [ ] **Create `js/boot.mjs`** with this exact content (design §1b; scene `?v=` values verbatim from index.html:339–343 — bg 3.8, boot 3.1, cursor 3.1, fx 3.3, app 3.4):

```js
/* daikieOS ES-module foundation (SP1).
   Static imports evaluate BEFORE any body statement -> window.THREE + window.POST
   exist first; sequential dynamic import() runs the 5 scene IIFEs in original
   order, each strictly after the shim assignments. */

import * as THREE from 'three';
window.THREE = THREE;

import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';
window.POST = { EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass };

// Same order + ?v= as the old classic <script> tags (index.html:339-343).
const V = { bg: '3.8', boot: '3.1', cursor: '3.1', fx: '3.3', app: '3.4' };
await import(`./background.js?v=${V.bg}`);
await import(`./boot.js?v=${V.boot}`);
await import(`./cursor.js?v=${V.cursor}`);
await import(`./effects.js?v=${V.fx}`);
await import(`./app.js?v=${V.app}`);
```

- [ ] **Validate `boot.mjs` parses** (module syntax incl. top-level await). Run `node --check js/boot.mjs`. Expected: no output, exit 0.
- [ ] **Replace the `index.html` tail.** Edit: replace exactly lines 337–343 —
  old_string:
  ```html
  <script src="js/vendor/three.global.min.js?v=158.0.1"></script>
  <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
  <script src="js/background.js?v=3.8"></script>
  <script src="js/boot.js?v=3.1"></script>
  <script src="js/cursor.js?v=3.1"></script>
  <script src="js/effects.js?v=3.3"></script>
  <script src="js/app.js?v=3.4"></script>
  ```
  new_string (design §1a):
  ```html
  <!-- Import-map fallback for Safari <16.4 / Firefox <108. Loads async; no-ops on
       engines with native import-map + module support. Self-hosted, CSP-clean. -->
  <script async src="js/vendor/es-module-shims-1.10.0.min.js?v=1"></script>

  <script type="importmap">
  {
    "imports": {
      "three": "./js/vendor/three-0.158.0/three.module.min.js",
      "three/addons/": "./js/vendor/three-0.158.0/examples/jsm/"
    }
  }
  </script>

  <script>document.getElementById('year').textContent = new Date().getFullYear();</script>

  <script type="module" src="js/boot.mjs?v=1"></script>
  ```
- [ ] **Confirm the global `<script>` is gone and no classic scene tags remain** (R1/R4). Run `grep -nE "three\.global\.min\.js|src=\"js/(background|boot|cursor|effects|app)\.js" index.html`. Expected: no matches (the only `three.global.min.js` reference now lives in `tools/verify-site-hardening.js`, which is intentional — R12).
- [ ] **Confirm all five scene files still `node --check` clean** (byte-identical, module-safe — design §1d). Run `for f in background boot cursor effects app; do node --check js/$f.js || echo "FAIL $f"; done`. Expected: no `FAIL` lines.
- [ ] **Deliverable:** edits staged and syntactically valid. **Do NOT commit yet** — the foundation is committed in T3 only after browser gate #1 passes (design §4 step 4).

---

## T3 — FOUNDATION CHECKPOINT (acceptance gate #1) + commit the foundation milestone

**Files:** none (verification) → then commit `index.html` + `js/boot.mjs`.

**Interfaces:** Consumes — the running import-map build over http. Produces — a green foundation gate and the independently-shippable foundation commit (this stands regardless of the bloom outcome; the additive fallback needs no `window.POST`).

- [ ] **Serve over http** (modules are blocked under `file://` — R11). If the T1 server is not running: `python3 -m http.server 8000 >/tmp/sp1-http.log 2>&1 &`. Confirm with `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/index.html` → `200`.
- [ ] **Gate #1a — static addon graph resolves (zero 404 for every vendored URL the import-map targets).** Run:
  ```sh
  base=http://localhost:8000/js/vendor/three-0.158.0
  for f in three.module.min.js \
    examples/jsm/postprocessing/EffectComposer.js examples/jsm/postprocessing/Pass.js \
    examples/jsm/postprocessing/RenderPass.js examples/jsm/postprocessing/ShaderPass.js \
    examples/jsm/postprocessing/MaskPass.js examples/jsm/postprocessing/UnrealBloomPass.js \
    examples/jsm/postprocessing/OutputPass.js examples/jsm/shaders/CopyShader.js \
    examples/jsm/shaders/LuminosityHighPassShader.js examples/jsm/shaders/OutputShader.js; do
    printf "%s %s\n" "$(curl -s -o /dev/null -w '%{http_code}' "$base/$f")" "$f"; done
  curl -s -o /dev/null -w "%{http_code} es-module-shims\n" http://localhost:8000/js/vendor/es-module-shims-1.10.0.min.js
  ```
  Expected: every line begins `200`.
- [ ] **Gate #1b — boots via `boot.mjs`, zero runtime 404s, single THREE, zero console errors.** Open `http://localhost:8000/` in Chrome DevTools. In the Network panel, confirm no request has status ≥ 400 (especially no addon or scene-file 404 — this is the runtime proof of the transitive closure the tool asserted statically; R3/R9). In the Console, run:
  ```js
  console.log('THREE?', typeof window.THREE, 'REVISION', window.THREE && window.THREE.REVISION,
              'POST keys', window.POST && Object.keys(window.POST));
  ```
  Expected: `THREE? object REVISION 158 POST keys (5) ['EffectComposer','RenderPass','ShaderPass','UnrealBloomPass','OutputPass']`; Console has **zero** errors and no duplicate-THREE / multiple-instances warning.
- [ ] **Gate #1c — visual parity vs the classic build.** Let the boot arc finish (~4 s); take a full-page screenshot to `/tmp/sp1-esm.png`. Compare against `/tmp/sp1-classic.png` from T1: same globe point-cloud, same Tokyo halo (glow + rings + labels), same Dallas→Tokyo arc + comet, same reveals. (Scene is animated, so this is a perceptual composition match, not pixel-exact — the parity signal is "all elements present, same layout/colours, boot sequence runs.") Expected: ESM build is indistinguishable from the classic reference; cursor, boot, effects, and reveals all behave identically.
- [ ] **Gate #1d — regression harness still green** (R12 — it asserts the on-disk global, which we kept). Run `node tools/verify-site-hardening.js`. Expected: all checks `PASS`, exit 0.
- [ ] **Commit the foundation milestone** (independently shippable, before any bloom). Run `git add index.html js/boot.mjs && git commit -m "feat(sp1): ESM import-map + boot.mjs foundation; retire three.global <script> (single THREE, zero-404 addon graph)"`.

---

## T4 — Bloom spike behind `?bloom=1` (high-tier only) in `background.js`

**Files:** Modify `js/background.js` — one inserted block after `let resizeTm;` (line 1343), one edit inside the resize handler (line 1350), one edit to the `render` binding (line 1373). No other file changes.

**Interfaces:** Consumes — `window.POST.{EffectComposer,RenderPass,ShaderPass,UnrealBloomPass,OutputPass}`, `THREE`, and the emitter handles `fieldCyan`(144)/`fieldAmber`(145)/`tokyoRing`(470)/`pingRing`(471)/`comet`(823)/`tokyoHalo`(572, `.glow` Sprite + `.rings[]`), plus the inline-named globe `earth-land-particles`(260) and arc `dallas-to-tokyo-arc`(816). Produces — the `render` binding (composer-conditional; R7), the `BLOOM` userData flag on tagged emitters, and `window.__bloomProbe()` (gate #2 instrument). Bloom is inert unless `?bloom=1` **and** `quality.name === 'high'` **and** `!reduced` **and** `window.POST` present (design §2d tier gating).

- [ ] **Insert the bloom-spike block.** Edit `background.js`: anchor on `let resizeTm;` immediately followed by the resize handler —
  old_string:
  ```js
  let resizeTm;
  addEventListener('resize', () => {
  ```
  new_string (the anchor line, then the full block, then the original handler line):
  ```js
  let resizeTm;

  /* ------------------------------------------------------------------ *
   *  SP1 BLOOM SPIKE — dev flag ?bloom=1, high tier only (design §2).  *
   *  Two-composer selective DARK-MATERIAL-SWAP (NOT camera.layers, R8),*
   *  alpha-preserving via a NoBlending mixPass (R2). Fully decoupled:   *
   *  composers stay null unless enabled; render() falls back to the     *
   *  direct path everywhere else (R7). Inert by default.                *
   * ------------------------------------------------------------------ */
  const bloomParams  = new URLSearchParams(location.search);
  const BLOOM_SPIKE  = bloomParams.get('bloom') === '1';
  const bloomEmptySel = bloomParams.get('emptySel') === '1';   // gate #3 A/B: tag nothing
  const bloomEnabled = BLOOM_SPIKE && quality.name === 'high' && !reduced &&
                       !!(window.POST && window.POST.EffectComposer);
  let bloomComposer = null, finalComposer = null, renderBloomThenFinal = null;

  if (bloomEnabled) {
    const POST = window.POST;
    const BLOOM_STRENGTH = 0.9, BLOOM_RADIUS = 0.5, BLOOM_THRESHOLD = 0.6;   // spike-tunable (gate #4)

    // (a) Tag emitters — userData.bloom keeps their real material through the dark pass.
    //     Source intensities already sit in [0,1]; bloom is a blow-out multiplier (R14).
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
    // Explicitly EXCLUDED (design §2c "instrument only the focus"): fieldDeep starfield,
    // depth-rain, holo-scan-shell, satellite, transit/stations/packet, halo text labels.

    // (b) bloomComposer — renders ONLY tagged emitters (rest swapped to black), off-screen.
    bloomComposer = new POST.EffectComposer(renderer);   // no type arg -> RGBA8 target (mobile-safe)
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(new POST.RenderPass(scene, camera));
    bloomComposer.addPass(new POST.UnrealBloomPass(
      new THREE.Vector2(w, h), BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD));

    // (c) mixPass — ADD glow rgb, KEEP base alpha, NoBlending overwrite (design §2b — THE fix).
    const mixPass = new POST.ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture:  { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `,
        fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          varying vec2 vUv;
          void main() {
            vec4 base  = texture2D( baseTexture,  vUv );
            vec4 bloom = texture2D( bloomTexture, vUv );
            gl_FragColor = vec4( base.rgb + bloom.rgb, base.a );
          }
        `,
      }),
      'baseTexture'
    );
    mixPass.needsSwap = true;
    mixPass.material.blending = THREE.NoBlending;   // NOT transparent=true — overwrite the stale target

    // (d) finalComposer — full REAL scene + ADD glow + restore on-screen sRGB (R6).
    finalComposer = new POST.EffectComposer(renderer);
    finalComposer.addPass(new POST.RenderPass(scene, camera));
    finalComposer.addPass(mixPass);
    finalComposer.addPass(new POST.OutputPass());   // REQUIRED: composer strips on-screen sRGB otherwise

    // (e) Dark-material-swap (official pattern; depthWrite:false preserves the scene's
    //     real no-occlusion property since every emitter is additive/depthWrite:false).
    const darkMat    = new THREE.MeshBasicMaterial({ color: 0x000000, depthWrite: false });
    const darkSprite = new THREE.SpriteMaterial({ color: 0x000000, depthWrite: false });
    const matCache = new Map();
    const darken = o => {
      if (o.userData.bloom) return;
      if (o.isSprite) { matCache.set(o, o.material); o.material = darkSprite; }
      else if (o.isMesh || o.isPoints || o.isLine) { matCache.set(o, o.material); o.material = darkMat; }
    };
    const restore = o => { const m = matCache.get(o); if (m) { o.material = m; matCache.delete(o); } };

    renderBloomThenFinal = () => {
      scene.traverse(darken);
      bloomComposer.render();      // bright emitters only -> bloom texture
      scene.traverse(restore);
      finalComposer.render();      // real scene + ADD bloom.rgb, keep base.a -> screen
    };

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
  }

  addEventListener('resize', () => {
  ```
- [ ] **Wire composer resize** (R7 sibling — keep both composers matched to the canvas). Edit `background.js`, anchor inside the resize handler —
  old_string:
  ```js
      renderer.setSize(w, h);
      maxScroll = Math.max(1, document.body.scrollHeight - innerHeight);
  ```
  new_string:
  ```js
      renderer.setSize(w, h);
      if (bloomComposer) { bloomComposer.setSize(w, h); finalComposer.setSize(w, h); }
      maxScroll = Math.max(1, document.body.scrollHeight - innerHeight);
  ```
- [ ] **Rebind `render` composer-conditionally** (R7 — `render` is a `const` with 4 call sites at 1369/1393/1397/1515; do not reassign). Edit `background.js` —
  old_string:
  ```js
  const render = () => renderer.render(scene, camera);
  ```
  new_string:
  ```js
  const render = (bloomEnabled && renderBloomThenFinal)
    ? () => renderBloomThenFinal()               // high-tier + ?bloom=1: dark-swap -> bloom -> final
    : () => renderer.render(scene, camera);        // reduced / LITE / spike-off: direct path
  ```
  (This automatically routes the reduced static frame at 1393, the fonts.ready re-present at 1397, the context-restore redraw at 1369, and the main-loop draw at 1515 through the same binding — bloomComposer is null in every non-high/non-flag case, so they all take the direct path.)
- [ ] **Validate `background.js` still parses.** Run `node --check js/background.js`. Expected: no output, exit 0.
- [ ] **Confirm default-off / decoupling.** Run `grep -nE "bloomEnabled|renderBloomThenFinal|NoBlending|__bloomProbe|userData.bloom" js/background.js | head`. Expected: the block is present; `bloomEnabled` requires `?bloom=1` so the committed default is inert (no behaviour change without the flag).
- [ ] **Commit.** Run `git add js/background.js && git commit -m "feat(sp1): flag-gated alpha-preserving selective bloom spike (?bloom=1, high tier) — two-composer dark-swap + NoBlending mixPass"`.

---

## T5 — Run acceptance gates 2–7, capture the perf baseline, decision point

**Files:** none (verification) → then record the perf baseline + decision by editing the design doc §3 and committing.

**Interfaces:** Consumes — the running build over http with `?bloom=1` (+ `?sceneDebug=1`, `?emptySel=1` as noted). Produces — a pass/fail record for gates 2–7, the first real `fpsEMA` numbers, and the SP1 decision (pass ⇒ done; gates 2–4 fail ⇒ documented hand-rolled additive fallback, NOT built here).

- [ ] **Serve + open the spike.** Ensure the server runs (`python3 -m http.server 8000 &`), open `http://localhost:8000/?bloom=1&sceneDebug=1` in Chrome on a desktop viewport. Confirm the Console shows zero errors and `window.__bloomProbe` is defined (`typeof window.__bloomProbe === 'function'`). If undefined, you are not on the high tier or the flag is missing — check `quality.name` via `window.__sceneDebug().tier`/console and viewport width (LITE = coarse pointer or ≤760 px disables bloom by design).
- [ ] **Gate #2 — Transparency (THE gate).** In the Console run `window.__bloomProbe()`. **Pass:** the returned `corner` is `[0,0,0,0]` (undrawn corner alpha = 0) AND `centre[3] > 0` (globe region drawn — proves the read is live, not a cleared buffer). Then confirm the CSS gradient is visibly behind: take a full-page screenshot and sample a top-left corner pixel (e.g. via the DevTools screenshot + an eyedropper, or `document.elementFromPoint(4,4)` then read the page's `--scene-*` gradient) — it MUST be the page gradient colour, **not** `rgb(0,0,0)`. **Fail (either part):** the `NoBlending` fix didn't hold → **abort to fallback** (see decision step). One-liner alternative for the buffer sample if not using `__bloomProbe`:
  ```js
  (() => { const gl = document.querySelector('#scene-root canvas').getContext('webgl2');
    const p = new Uint8Array(4); gl.readPixels(1,1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);
    console.log('corner RGBA', [...p]); })();  // run inside a rAF tick; expect alpha 0
  ```
- [ ] **Gate #3 — Visual parity (bloom contributes nothing).** Open two tabs: (A) `http://localhost:8000/?bloom=0` (direct render = today's build) and (B) `http://localhost:8000/?bloom=1&emptySel=1` (full composite path, empty selection ⇒ bloom texture = 0 ⇒ mixPass adds 0). At a calm post-boot moment, screenshot both to `/tmp/sp1-parityA.png` and `/tmp/sp1-parityB.png` and compare. **Pass:** brightness/colour match with no global darkening (OutputPass sRGB restored — R6) and no ghost trails in the transparent margins (NoBlending overwrote the stale target — R2). Objective corroboration: in tab B run `window.__bloomProbe().centre` and compare its RGB to tab A's centre pixel (from its screenshot) — within a small tolerance. **Fail:** missing-OutputPass wash or stale-buffer ghost → fix before continuing.
- [ ] **Gate #4 — Selective bloom visible.** On `?bloom=1` (full selection), visually confirm the tagged emitters — globe point-cloud, Tokyo focus/ping rings, halo glow + rings, Dallas→Tokyo arc + comet, cyan/amber fields — show halo bleed, while `fieldDeep` starfield, depth-rain, and DOM overlays do **not** bloom. **Pass:** focus glows, background does not wash. **Fail:** retag (adjust the tag set in the block) or, if bright objects behind a dark-swapped particle get culled, add `depthTest:false` to `darkMat`/`darkSprite`; if the near-black fog (`0x05060a`) adds haze, null `scene.fog` inside `renderBloomThenFinal` around the `bloomComposer.render()` and restore after. Re-tune `BLOOM_STRENGTH/RADIUS/THRESHOLD` as needed.
- [ ] **Gate #5 — Droplet lens intact.** With `?bloom=1`, scroll/hover to trigger the rain-on-glass droplets; confirm they still refract the scene. The final pass renders to screen synchronously inside `render()` **before** `droplets.update(dt)` (background.js:1515→1516), and there is no `preserveDrawingBuffer`, so the lens samples this frame's composited buffer. **Pass:** droplets refract correctly. **Fail:** composer not rendering to screen in the same sync `render()`.
- [ ] **Gate #6 — Fallback paths render via the composer-conditional binding (R7).** (a) Reduced: open `?bloom=1` with OS "reduce motion" on → confirms the single static frame renders (bloom disabled by `!reduced`, direct path). (b) fonts.ready re-present: hard-reload cold-cache on `?bloom=1` → labels are crisp (no tofu), proving the 1397 `render()` fired. (c) Context restore: in DevTools run `document.querySelector('#scene-root canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()` then `.restoreContext()` → the scene redraws (1369 in reduced, or loop restart otherwise). **Pass:** all three produce a frame. **Fail:** fix the render binding.
- [ ] **Gate #7 — Perf budget (capture the FIRST real numbers).** On `?bloom=1&sceneDebug=1` (desktop), let it run ~15 s, then read `window.__sceneDebug().fps` = **post-bloom** EMA. Reload on `?bloom=0&sceneDebug=1`, run ~15 s, read `.fps` = **pre-bloom** baseline. Repeat on a mid-tier phone if available, else DevTools device emulation + 4× CPU throttle as a first proxy. **Pass:** high-tier desktop post-bloom stays within the pre-bloom baseline's usable range; LITE (bloom-off by design) unaffected. Record both numbers.
- [ ] **Decision point + record.** If gates 2–7 pass → **SP1 complete**: alpha-preserving selective bloom is proven on the r158 jsm Path-2 foundation (r168 + pmndrs CA/color-grade escalation stays documented + de-risked for SP4). If gates **2–4 fail unrecoverably** → do **NOT** build the fallback in SP1; the ES-module foundation is already banked at T3 (it needs no `window.POST`). Document the outcome by appending a "Spike results" line under design §3 (pre/post `fpsEMA`, gate pass/fail, and — on failure — a pointer to research §1's hand-rolled half-res RGBA8 additive-bloom fallback for a later sub-project). Then run `git add docs/superpowers/specs/2026-07-03-sp1-esm-foundation-bloom-spike-design.md && git commit -m "docs(sp1): record bloom spike acceptance results + fpsEMA baseline; SP1 decision"`.

---

## Self-check appendix — design risks R1–R14 → mitigating task/step

| Risk | Mitigated by |
|---|---|
| **R1** two THREE instances | T2 — replace index.html tail deletes the `three.global.min.js` `<script>` in the same edit; T3 gate #1b asserts single THREE (`REVISION 158`, no dup-class warning). |
| **R2** NoBlending mixPass ghost in alpha-0 regions | T4 step (c) `mixPass.material.blending = THREE.NoBlending` + fragment keeps `base.a`; T5 gate #2 (corner alpha 0) and gate #3 (no ghost trails). |
| **R3** addon import graph incomplete → 404 | T1 `closureCheck()` (in-tool + `--check`) asserts every relative import resolves; T3 gate #1a (curl matrix) + #1b (runtime zero-404). |
| **R4** load-order trap if a scene file stayed a classic `<script>` | T2 — all scene loading is `boot.mjs` sequential `await import()`; the grep step confirms no classic scene tags remain. |
| **R5** addon cache-bust query corrupts URLs | T1 versions by **directory** (`three-0.158.0/`); T2 import-map targets `three`/`three/addons/` carry **no** `?v=` query. |
| **R6** missing OutputPass → washed/dark colours | T4 step (d) `finalComposer.addPass(new POST.OutputPass())` terminates the chain; T5 gate #3 catches a regression. |
| **R7** `render` is `const`, 4 call sites | T4 — composer-conditional binding at definition (1373) + resize `setSize` (1350); T5 gate #6 exercises reduced/fonts/restore paths. |
| **R8** `camera.layers` per-frame reset trap | T4 step (e) uses **dark-material-swap**, not `camera.layers`. |
| **R9** top-level `await` stalls on a dynamic-import 404 | T1 closure check + T3 gate #1 verify every path before declaring the foundation done; single `V` map in `boot.mjs`. |
| **R10** `.mjs` served as `application/octet-stream` | T2 ships `es-module-shims` (fetch-evals modules as a sidestep) + entry named `boot.mjs` with `type="module"`; T3 serve-check confirms load. |
| **R11** `file://` dev workflow dies | Global Constraint "served over http(s)" + T3 first step uses `python3 -m http.server`. |
| **R12** `verify-site-hardening.js` asserts the retired global | T1 keeps `js/vendor/three.global.min.js` on disk; T3 gate #1d runs the harness green; retire the check when the global is fully removed (post-SP1). |
| **R13** pmndrs alpha-0 unproven | Out of SP1 scope; noted in the T5 decision record (escalation path — gate with the same corner-pixel test in SP4). |
| **R14** additive glow shifts against the composited buffer | T4 keeps source intensities in `[0,1]`, high-tier only; T5 gate #3 (parity) + gate #4 (tunable strength/radius/threshold); LITE unaffected. |
