const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const app = read('js/app.js');
const background = read('js/background.js');
const css = read('css/site.css');
const three = read('js/vendor/three.global.min.js');

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
  'vendored Three.js is a generated global build without the deprecated browser entry',
  /Generated from three@0\.158\.0\/build\/three\.module\.min\.js/.test(three) &&
    /globalThis\.THREE=/.test(three) &&
    !three.includes('Scripts "build/three.js" and "build/three.min.js" are deprecated'),
  'use the generated global build instead of the deprecated browser entry'
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
  'scene atmosphere overlay is declared and reduced-motion safe',
  /class="scene-atmosphere"[^>]*aria-hidden="true"/.test(index) &&
    /class="scene-rain"/.test(index) &&
    /class="scene-glass"/.test(index) &&
    /--scene-rain-base/.test(css) &&
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.scene-rain::before,\s*\.scene-rain::after\s*\{\s*animation:\s*none;/.test(css),
  'index.html should declare decorative rain/glass layers and CSS should disable animated rain for reduced motion'
);

check(
  'scene has richer cyberpunk story state',
  /const sceneState =/.test(background) &&
    /haloPulse/.test(background) &&
    /activeSection/.test(background) &&
    /route:\s*'replay'/.test(background) &&
    /sceneState\.callout/.test(background),
  'background.js should expose section, halo, rain, labels, and callout state for the upgraded scene'
);

check(
  'scene defines Tokyo holographic halo assets',
  /const TOKYO_HALO_LABELS =/.test(background) &&
    /jp:\s*'東京'/.test(background) &&
    /makeTokyoHalo/.test(background) &&
    /tokyo-holographic-halo/.test(background) &&
    /tokyo-halo-pulse-packet/.test(background),
  'background.js should define local Tokyo labels, halo geometry, and a pulse packet'
);

check(
  'scene debug exposes cyberpunk atmosphere state',
  /activeSection/.test(background) &&
    /halo:\s*Number/.test(background) &&
    /rain:\s*Number/.test(background) &&
    /labels:\s*Number/.test(background) &&
    /callout:\s*Number/.test(background),
  'window.__sceneDebug should include active section and atmosphere state when sceneDebug=1'
);

// Note: the plan's negative regex here was `!/animation:\s*sceneRainFall[\s\S]*background-position/`,
// but its unbounded [\s\S]* spans the whole stylesheet and trips on unrelated static
// `background-position: center` media styles hundreds of lines later. Scope the assert to the
// rain keyframes blocks themselves: each must animate translateY and never background-position.
check('rain animates via transform translateY (not a frozen background-position no-op)',
  /@keyframes sceneRainFall\b[\s\S]*translateY\(/.test(css) &&
    (css.match(/@keyframes sceneRainFall\d?\s*\{(?:[^{}]|\{[^{}]*\})*\}/g) || [])
      .every(block => /translateY\(/.test(block) && !/background-position/.test(block)),
  'css/site.css rain must fall via transform translateY on a 180deg-structured gradient');

check('atmosphere sits below main content',
  /\.scene-atmosphere\s*\{[^}]*z-index:\s*0\b/.test(css),
  '.scene-atmosphere must render beneath main so content is not tinted');

check('rain opacity is CSS-owned base * JS multiplier',
  /--scene-rain-base/.test(css) && /--scene-rain-mul/.test(css) &&
    /calc\(var\(--scene-rain-base\)\s*\*\s*var\(--scene-rain-mul/.test(css),
  'CSS must own base rain opacity; JS only sets the multiplier');

check('rain multiplier is written only on change (no per-frame :root writes)',
  /_rainMulWritten/.test(background) && /setRainMultiplier/.test(background) &&
    !/setAtmosphereVars/.test(background),
  'background.js must gate --scene-rain-mul writes and must not restore per-frame setAtmosphereVars');

check('canvas sprites redraw after fonts load (no tofu labels)',
  /makeCanvasSprite/.test(background) && /document\.fonts\.ready\.then/.test(background),
  'makeCanvasSprite must redraw on document.fonts.ready');

check('Tokyo halo is emissive with a glow sprite and a ring mesh',
  /makeGlowSprite/.test(background) && /RingGeometry/.test(background) &&
    /tokyo-halo-glow/.test(background) && /spinGroup/.test(background) && /staticGroup/.test(background),
  'halo needs a glow sprite, a RingGeometry ring, and separate spin/static sub-groups');

check('halo packet is event-gated, not a perpetual spinner',
  /tokyoHalo\.packet\.visible\s*=\s*p\s*>\s*0\.03/.test(background),
  'the pulse packet must be gated on haloPulse/lock, never always-on');

check('section focus is cooldown-guarded with a signal-lock',
  /storyCooldown/.test(background) && /sceneState\.lockT\s*=\s*1/.test(background),
  '__sceneFocus must guard re-arming and trigger the home/contact signal-lock');

check('callout heading is bilingual only for Tokyo (no DALLAS / DALLAS)',
  /isTokyo \? '東京 \/ ' \+ target\.label : target\.label/.test(background) &&
    /timeZone:\s*'Asia\/Tokyo'/.test(background),
  'callout must not print DALLAS / DALLAS and must show live JST');

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
