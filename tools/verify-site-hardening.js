const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const app = read('js/app.js');
const background = read('js/background.js');
const css = read('css/site.css');

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
  'ESM chain is live with no dead global Three.js build (v3.2 law)',
  /"three":\s*"\.\/js\/vendor\/three-0\.158\.0\/three\.module\.min\.js"/.test(index) &&
    /"three\/addons\/":\s*"\.\/js\/vendor\/three-0\.158\.0\/examples\/jsm\/"/.test(index) &&
    /<script type="module" src="js\/boot\.mjs\?v=\d+"><\/script>/.test(index) &&
    !index.includes('three.global.min.js') &&
    !fs.existsSync(path.join(root, 'js/vendor/three.global.min.js')),
  'import-map + versioned boot.mjs is the only Three.js path; the 651KB global build must stay deleted and unreferenced'
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
    /class="scene-glass"/.test(index) &&
    /class="scene-droplets"/.test(index) &&
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*--scene-glass-base/.test(css),
  'index.html should declare the decorative glass/droplet layers and CSS should keep the reduced-motion glass fallback'
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

check('atmosphere sits below main content',
  /\.scene-atmosphere\s*\{[^}]*z-index:\s*0\b/.test(css),
  '.scene-atmosphere must render beneath main so content is not tinted');

check('depth rain renders as camera-space parallax particle layers',
  /makeDepthRain/.test(background) && /depth-rain/.test(background) &&
    /rain-layer-/.test(background) && /camera\.add\(group\)/.test(background) &&
    /reduced \? null : makeDepthRain\(\)/.test(background),
  'rain must be the WebGL particle system (GITS particulation), reduced-motion disabled — never CSS line-rain');

check('weather layer has lightning, lens droplets, reactive rain, and idle cinematics',
  /sheet-lightning/.test(background) && /updateLightning/.test(background) &&
    /drawImage\(src/.test(background) && /rainShear/.test(background) && /idleK/.test(background) &&
    /render\(\);\s*\n\s*if \(droplets\) droplets\.update/.test(background),
  'lightning, shear, idle dolly wired — and droplets MUST sample after render() (lens reads this frame\'s buffer)');

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

check('globe carries live terminator, city lights, holo-scan shell, and celestial events',
  /uSunDir/.test(background) && /'city', gcity/.test(background) &&
    /holo-scan-shell/.test(background) && /orbit-satellite/.test(background) &&
    /shooting-star/.test(background) && /warp = 1; sceneState\.lockT = 1;/.test(background) &&
    !/earth-atmosphere-rim/.test(background),
  'night-side shader, sologram scan shell (NOT the rejected realistic rim), events, and reveal beat must be wired');

check('wave 3: transit halo + scan-and-tag are wired; scan tag speaks JetBrains Mono (Rajdhani retired, v32c)',
  /TRANSIT_LOOP/.test(background) && /tokyo-transit-loop/.test(background) &&
    /__scanPlace/.test(background) && /scan-tag-assembly/.test(background) &&
    /GALLERY_PLACES/.test(background) && /'500 22px "JetBrains Mono", monospace'/.test(background) &&
    !/Rajdhani/.test(background) && !/Rajdhani/.test(index),
  'Soliton transit loop and particle-assembled scan tags stay; Rajdhani must NOT appear anywhere — one instrument voice (JetBrains Mono)');

check('scene exposes a live fps gauge for QA gates',
  /fpsEMA/.test(background) && /fps: Math\.round\(fpsEMA\)/.test(background),
  '__sceneDebug().fps must report the rolling frame rate');

check(
  'page copy explains the Dallas to Tokyo geography',
  /class="geo-trail"/.test(index) &&
    /Dallas[\s\S]*Tokyo/.test(index),
  'regular page content should explain the same geography as the globe'
);

/* ---- v3.2 law pins (2026-07-08 addendum; update-with-feature, never delete) ---- */

check(
  'v3.2 law: deep-black floor tokens pinned (no teal floor regression)',
  /--void:\s*#05060a/.test(css) &&
    /--void-2:\s*#080a10/.test(css) &&
    /--void-deep:\s*#030407/.test(css) &&
    /--panel-solid:\s*rgba\(7,\s*9,\s*14,\s*0\.92\)/.test(css) &&
    !/0a1416/i.test(css) &&
    !/0a1416/i.test(index),
  'site.css :root must keep the #05060a deep-black family; no #0a1416 teal floor token may return in css or index.html'
);

check(
  'v3.2 law: teal shadow crush stays neutralised in the scene grade',
  /uTealAmt:\s*\{\s*value:\s*0\.0\s*\}/.test(background),
  'background.js gradePass must keep uTealAmt at 0.0 — shadows sink to true black, no teal cast'
);

check(
  'v3.2 law: photos dim at rest, full on demand',
  /\.shot \.media \{[^}]*brightness\(\.58\) saturate\(\.45\) contrast\(1\.05\)/.test(css) &&
    /\.shot:hover \.media, \.shot:focus-visible \.media \{ transform: scale\(1\.12\); filter: none; \}/.test(css) &&
    /\.about-portrait \.media \{[^}]*brightness\(\.58\) saturate\(\.45\) contrast\(1\.05\)/.test(css),
  'gallery tiles + about portrait keep the v3.1f rest grade; hover/focus-visible lifts the filter entirely (lightbox stays unfiltered)'
);

check(
  'v3.2 law: amber starfield signature present (owner timeline)',
  /const fieldAmber = makeField\(quality\.fieldCounts\[1\], AMBER, 36, 0\.06, 0\.8\);/.test(background) &&
    /scene\.add\(fieldCyan, fieldAmber, fieldDeep\);/.test(background),
  'the cyan+amber two-temperature starfield is the owner signature exception to the warm budget — AMBER field at alpha .8 must stay'
);

check(
  'v3.2 law: scene palette is cyan/amber, complete — no alert red',
  /softAmber: 0xffd9a0/.test(background) &&
    !/alert:\s*0xff3b5c/.test(background) &&
    !/SCENE_COLORS\.alert/.test(background),
  'SCENE_COLORS.alert was deleted by v3.2 ruling (red-on-failure rejected as a third-hue palette-law change); it must not return'
);

check('v32b: city lights cluster on coastlines — the uniform 11% freckle is retired',
  !/gcity\[i\] = Math\.random\(\) < 0\.11/.test(background) &&
    /cityCluster/.test(background) &&
    /const pCity = gedge\[i\]/.test(background),
  'gcity must be weighted by the gedge coastline signal and a low-frequency cluster field (lit night-side area < ~5%), never the uniform 11% freckle');

check('v32d: signals calmed — streaks retired, grid story-driven and de-ambered, rain tint beat-keyed, dead ping deleted',
  !/vertical-data-streaks/.test(background) &&
    !/__scenePing/.test(background) &&
    /new THREE\.GridHelper\(160, 70, 0x1a4a5a, 0x10303a\)/.test(background) &&
    /sceneState\.grid/.test(background) &&
    /rainTintK = 1;/.test(background) &&
    !background.includes('cx.fillRect(cv.width - 128 + i * 12'),
  'streaks, dead __scenePing and the callout barcode ticks must be gone; grid centre lines cool (0x1a4a5a family) with opacity driven by sceneState.grid (near-0 in gallery); rain tint keys to the projects ENTRY beat, not residency');

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
