const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const app = read('js/app.js');
const background = read('js/background.js');
const three = read('js/vendor/three.min.js');

const checks = [];

function check(name, pass, detail) {
  checks.push({ name, pass, detail });
}

check(
  'favicon is declared and present',
  /<link\s+rel="icon"\s+href="favicon\.svg"\s+type="image\/svg\+xml"\s*\/?>/.test(index) &&
    fs.existsSync(path.join(root, 'favicon.svg')),
  'index.html should link favicon.svg and favicon.svg should exist'
);

check(
  'vendored Three.js does not emit the build deprecation warning',
  !three.includes('Scripts "build/three.js" and "build/three.min.js" are deprecated'),
  'remove the local vendor warning line or replace the vendor build'
);

check(
  'hidden dialogs are hidden from assistive tech by default',
  /<div class="lightbox"[^>]*aria-hidden="true"/.test(index) &&
    /<div class="deck"[^>]*aria-hidden="true"/.test(index),
  'lightbox and control deck should start with aria-hidden="true"'
);

check(
  'modal controls expose state changes',
  /lb\.setAttribute\('aria-hidden'/.test(app) &&
    /deck\.setAttribute\('aria-hidden'/.test(app) &&
    /deckToggle\.setAttribute\('aria-expanded'/.test(app),
  'app.js should update aria-hidden for modals and aria-expanded for the deck toggle'
);

check(
  'scene has section story definitions',
  /const sectionStories =/.test(background) &&
    /about:\s*\{[\s\S]*sequence:\s*\[\s*'dallas'\s*,\s*'tokyo'\s*\]/.test(background),
  'background.js should define story-mode section focus, including Dallas-to-Tokyo for about'
);

check(
  'scene exposes debug mode behind query flag',
  /sceneDebug/.test(background) &&
    /window\.__sceneDebug/.test(background) &&
    /scene-debug/.test(index),
  'scene debug mode should expose diagnostics only when requested'
);

check(
  'page copy explains the Dallas to Tokyo geography',
  /class="geo-trail"/.test(index) &&
    /Dallas[\s\S]*Tokyo/.test(index),
  'regular page content should explain the same geography as the globe'
);

const failed = checks.filter(item => !item.pass);
for (const item of checks) {
  const mark = item.pass ? 'PASS' : 'FAIL';
  console.log(`${mark} ${item.name}`);
  if (!item.pass) console.log(`  ${item.detail}`);
}

if (failed.length) {
  console.error(`\n${failed.length} site hardening check(s) failed.`);
  process.exit(1);
}
