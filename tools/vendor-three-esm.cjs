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
  // Pin-verify via the package's own package.json (robust: the minifier renames
  // the REVISION const, so grepping the minified build for REVISION="158" is
  // unreliable — the string survives only as e.g. `Kt="158" ... Kt as REVISION`).
  const pkgPath = path.join(path.resolve(threeRoot), 'package.json');
  if (!fs.existsSync(pkgPath)) fail('no package.json at ' + path.resolve(threeRoot) + ' (arg1 must be an unpacked three package root)');
  const pkgVer = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  if (pkgVer !== '0.158.0') fail('three package is ' + pkgVer + ', expected 0.158.0 — pin mismatch, refusing to vendor.');
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
