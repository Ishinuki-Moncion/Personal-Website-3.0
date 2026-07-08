const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const app = read('js/app.js');
const background = read('js/background.js');
const css = read('css/site.css');
const effects = read('js/effects.js');

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
  /\.scene-atmosphere\s*\{[^}]*z-index:\s*var\(--z-scene\)/.test(css) &&
    /--z-scene:\s*0\b/.test(css),
  '.scene-atmosphere must render beneath main so content is not tinted (v32h: via the --z-scene token, pinned to 0)');

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

check('v32e: black-floor fidelity — CA-pass hash dither, MSAA composer targets, live DPR re-read',
  /fract\(sin\(dot\(gl_FragCoord\.xy, vec2\(12\.9898, 78\.233\)\)\) \* 43758\.5453\) \/ 255\.0/.test(background) &&
    /renderTarget1\.samples = 4/.test(background) &&
    /renderer\.getPixelRatio\(\) !== newDpr/.test(background),
  'the final CA pass must carry the ±0.5/255 hash dither, the high-tier composer ping-pong targets must be 4x multisampled, and the debounced resize handler must re-read devicePixelRatio');

check(
  'v32f: contact return path — signal row present, address assembled at runtime only',
  (() => {
    const addr = String.fromCharCode(105, 115, 104, 105, 110, 117, 107, 105, 100, 97, 105, 107, 105, 101, 64, 105, 99, 108, 111, 117, 100, 46, 99, 111, 109);
    return /class="signal-row"/.test(index) &&
      /String\.fromCharCode/.test(app) &&
      !index.includes(addr) && !app.includes(addr) && !css.includes(addr);
  })(),
  'contact needs the SIGNAL // row; the address must be JS-assembled, never plaintext in any committed file'
);

check(
  'v32g: gallery EXIF is real per-photo data, never the fabricated universal readout',
  !index.includes('ƒ/2.8 · 1/250s') &&
    index.includes('ƒ/16 · 1/50s · ISO 100 · 50mm') &&
    (index.match(/data-meta="/g) || []).length === 12 &&
    /EXIF\/\/REDACTED/.test(index) &&
    (index.match(/data-title="/g) || []).length === 12 &&
    /dataset\.meta/.test(app) &&
    /class="lb-exif"/.test(index),
  'every .shot bakes data-meta from mdls (stripped files = EXIF//REDACTED) + a data-title; the lightbox meta reads dataset.meta; the known-real gallery-03 bake (ƒ/16 · 1/50s · ISO 100 · 50mm) must stay pinned'
);

check(
  'v32h: z-ladder tokens exist, boot outranks the lightbox, closed overlays are inert',
  (() => {
    const g = n => { const m = css.match(new RegExp('--z-' + n + ':\\s*(\\d+)')); return m ? parseInt(m[1], 10) : NaN; };
    const order = g('scene') < g('content') && g('content') < g('scrollhud') && g('scrollhud') < g('nav') &&
      g('nav') < g('deck') && g('deck') < g('menu') && g('menu') < g('lightbox') && g('lightbox') < g('boot');
    return order && /class="lightbox"[^>]*\binert\b/.test(index) && /class="deck"[^>]*\binert\b/.test(index) &&
      /lb\.inert/.test(app) && /deck\.inert/.test(app) && /trapTab/.test(app) &&
      !/<div class="deck"[^>]*aria-modal/.test(index);
  })(),
  'the --z-* ladder must exist with boot above lightbox; closed lightbox/deck must be inert; deck uses disclosure semantics'
);

check(
  'v32i: JP fragments carry lang="ja" and display headlines full-translate',
  (index.match(/lang="ja"/g) || []).length >= 10 &&
    /<h2 class="heading-xl"[^>]*data-ja="作品"/.test(index) &&
    /data-ja="レンズ越しに"/.test(index) &&
    /data-ja="代表作"/.test(index) &&
    /Switch to Japanese/.test(app) &&
    /html\[lang="ja"\] \.heading-xl/.test(css),
  'always-JP text nodes need lang="ja"; Work/Through the lens/Selected Work translate via data-ja; the toggle label announces its target'
);

check(
  'v32j: the world beyond the viewport is real (meta/og/404/noscript/watchdog/print/JSON-LD/fonts)',
  (() => {
    const exists = f => fs.existsSync(path.join(root, f));
    return /property="og:image"/.test(index) && /rel="canonical"/.test(index) &&
      /name="twitter:card"/.test(index) && /rel="apple-touch-icon"/.test(index) &&
      /<noscript>/.test(index) && /application\/ld\+json/.test(index) &&
      /setTimeout\(reveal, 10000\)/.test(index) &&
      /body\.revealed \[data-reveal\]/.test(css) &&
      exists('404.html') && fs.readFileSync(path.join(root, '404.html'), 'utf8').includes('SIGNAL LOST // 404') &&
      exists('images/og.png') && exists('images/apple-touch-icon.png') &&
      /@media print/.test(css) && /@font-face/.test(css) &&
      exists('fonts/hanken-grotesk-latin.woff2') && exists('fonts/jetbrains-mono-latin.woff2') &&
      !/family=Hanken\+Grotesk/.test(index) && !/family=JetBrains\+Mono/.test(index);
  })(),
  'share/crawl/no-JS/print surfaces must exist; Latin faces self-hosted (JP faces stay on CDN — recorded law exception)'
);

check(
  'v32k: instrument micro-fidelity — readout unit, compact lb-pos, minute-aligned callout clock, one-shot coord decrypt',
  /class="readout-unit"/.test(index) && /\.readout-unit \{/.test(css) &&
    /padStart\(2, '0'\) \+ '\/' \+ String/.test(app) &&
    /alignCalloutClock/.test(background) && /60000 - \(Date\.now\(\) % 60000\)/.test(background) &&
    /coordEl/.test(effects) &&
    index.includes('class="coord" translate="no" lang="ja"'),
  'stat births the .readout pattern; lb-pos reads 01/12; the callout JST wakes on the minute; contact coords decrypt once on reveal; the whole-span .coord interface (translate="no" lang="ja") the decrypt consumes stays intact'
);

check('v3.2l — rain is motivated light, not a flat veil',
  /MOTIV_FLOOR/.test(background) && /MOTIV_CAP/.test(background) &&
    /baseOp \* vis \* beat \* motivation/.test(background) &&
    /saturate\(0\.5\) brightness\(0\.9\)/.test(background) &&
    !/rain: 0\.6,/.test(background),
  'per-plane motivation term (rain brief Lever A), worn-glass droplet filter, and the retired flat hero veil');

check('v3.2m — story beats are guaranteed: arc-arrival sync, subliminal focus-bias, contact downlink',
  /BIAS_MAX_RADS_PER_SEC/.test(background) && /seqArrival/.test(background) &&
    !/storyTimer/.test(background) &&
    /celestial\.nextLink = 0/.test(background),
  'sequence beat keys to arc arrival (no 650ms timer), spin carries a rate-capped focus bias, contact fires the LOS downlink');

check('v3.2n — portrait globe branch + touch photo parity',
  /offsetFor/.test(background) && /0\.8, 4\.5, -7\.5/.test(background) &&
    /pointer: coarse/.test(app) && /classList\.add\('lit'\)/.test(app) &&
    /\.shot\.lit \.media/.test(css),
  'aspect-aware globe offset (sphere high behind the name, name on the dim limb) and one-at-a-time .lit focus grade');

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
