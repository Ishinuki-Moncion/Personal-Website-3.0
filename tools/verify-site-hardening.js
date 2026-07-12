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
    /'rain-streaks'/.test(background) && /camera\.add\(group\)/.test(background) &&
    /reduced \? null : makeDepthRain\(\)/.test(background),
  'rain must be the WebGL instanced streak batch (GITS particulation), camera-parented, reduced-motion disabled — never CSS line-rain');

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

// v3.3a — the v3.2l motivation law moved into GLSL; pinned BY VALUE (biasCap idiom):
// floor/cap/veil parse from the consts and must hold 0.16 / 0.80 / 0.55 exactly.
const motivFloor = Number((background.match(/const MOTIV_FLOOR = ([0-9.]+)/) || [])[1]);
const motivCap = Number((background.match(/const MOTIV_CAP\s*=\s*([0-9.]+)/) || [])[1]);
const liteVeil = Number((background.match(/const RAIN_LITE_VEIL = ([0-9.]+)/) || [])[1]);
check('v3.2l — rain is motivated light, not a flat veil',
  motivFloor === 0.16 && motivCap === 0.8 && liteVeil === 0.55 &&
    /uMotivFloor: \{ value: MOTIV_FLOOR \}/.test(background) &&
    /uMotivCap: \{ value: MOTIV_CAP \}/.test(background) &&
    /uLiteVeil: \{ value: RAIN_LITE_VEIL \}/.test(background) &&
    /min\(uMotivCap, uMotivFloor \+ m\)/.test(background) &&
    /saturate\(0\.5\) brightness\(0\.9\)/.test(background) &&
    !/rain: 0\.6,/.test(background),
  'the motivation law lives in the rain shader now (v3.3a): FLOOR 0.16 / CAP 0.80 / LITE veil 0.55 pinned by value, min(uMotivCap, uMotivFloor + m) per drop, worn-glass droplet filter kept, flat hero veil stays retired');

// v3.2r — the focus-bias safety invariant is pinned by VALUE, not just by name:
// the added-rate cap must stay strictly below the autonomous spin rate (0.066
// rad/s), or the bias can freeze/reverse the globe during the state-word (the
// v3.2m 0.12 defect). A revert of the cap alone must fail this check.
const biasCapMatch = background.match(/const BIAS_MAX_RADS_PER_SEC = ([0-9.]+)/);
const biasCap = biasCapMatch ? Number(biasCapMatch[1]) : NaN;
check('v3.2m — story beats are guaranteed: arc-arrival sync, subliminal focus-bias, contact downlink',
  /BIAS_MAX_RADS_PER_SEC/.test(background) && /seqArrival/.test(background) &&
    !/storyTimer/.test(background) &&
    /celestial\.nextLink = 0/.test(background) &&
    biasCap > 0 && biasCap < 0.066 &&
    /if \(e > 0\) biasTarget = Math\.min\(BIAS_MAX_RADS_PER_SEC, e \* 0\.9\);/.test(background) &&
    /focusBiasRate \+= Math\.sign\(biasDr\) \* Math\.min\(Math\.abs\(biasDr\), BIAS_SLEW_RADS_PER_S2 \* dt\);/.test(background) &&
    /focusBias \+= focusBiasRate \* dt;/.test(background),
  'sequence beat keys to arc arrival (no 650ms timer); focus-bias cap ' + biasCap + ' must be in (0, 0.066) — strictly below the autonomous spin rate; the applied added-rate must be the forward-only slewed form (target clamp -> rate slew -> rate*dt integration); contact fires the LOS downlink');

// v3.2n — pins REAL code shapes (not comments): the portrait offset branch with
// its literal triple, the resize-handler re-aim (OFF = offsetFor()), the coarse-
// pointer .lit picker wired to scroll AND resize (an orientation flip without a
// scroll must re-pick, never leave a stale lit tile), and the .lit CSS grade.
// Deleting the portrait branch, the re-aim, or the touch-parity code fails this.
check('v3.2n — portrait globe branch + touch photo parity',
  /const offsetFor = /.test(background) && /0\.4, 3\.4, -7\.5/.test(background) &&
    /OFF = offsetFor\(\);/.test(background) &&
    /smoothstep\(topCss, 80, 100\)/.test(background) &&
    /pointer: coarse/.test(app) && /classList\.add\('lit'\)/.test(app) &&
    /classList\.remove\('lit'\)/.test(app) &&
    /addEventListener\('scroll', onLitScroll, \{ passive: true \}\);/.test(app) &&
    /addEventListener\('resize', onLitScroll, \{ passive: true \}\);/.test(app) &&
    /\.shot\.lit \.media/.test(css),
  'aspect-aware globe offset (sphere high behind the name, name on the dim limb) + portrait header gate (callout fades before entering the 80px nav band); one-at-a-time .lit focus grade, remove-before-add, re-checked on scroll AND resize/orientation');

// v3.2n — the SP3 global tap-select must yield to real UI: bail while the
// lightbox or mobile menu is open, and when the tap landed on an interactive
// element (else a phone tap on a tile/hero name both activates it AND fires a
// city-select — double-activation / navigation hijack / focus-restore breakage).
// The h1 arm is TOUCH-ONLY: a mouse arm would kill desktop click-select across
// the whole node region (the h1 block box invisibly spans it).
check('v3.2n — global tap-select yields to real UI (seam guard)',
  /lbGuard && lbGuard\.classList\.contains\('open'\)/.test(background) &&
    /classList\.contains\('menu-open'\)/.test(background) &&
    /e\.target\.closest\('a, button, input, \.shot, \.lightbox, \.mobile-menu, \.scroll-hud, nav, \.deck'\)/.test(background) &&
    /e\.pointerType !== 'mouse' && e\.target && e\.target\.closest && e\.target\.closest\('h1'\)/.test(background),
  'pointerup tap-select early-returns on open lightbox/menu and on taps over interactive or overlay DOM; h1 arm touch-only so desktop click-select survives');

check('v3.2o — lightbox is the one light event (deep scrim, safe-centred strip, gated halo/rail, work shift)',
  /rgba\(2,3,6,0\.985\)/.test(css) && /justify-content: flex-start/.test(css) &&
    /\.lb-thumb:first-child \{ margin-left: auto/.test(css) &&
    /const HALO_GATE = false/.test(app) && /const RAIL_GATE = false/.test(app) &&
    /startViewTransition/.test(app) && /shift: \[-1\.2, -2\.0\]/.test(background),
  'scrim sinks toward true black, strip safe-centres, halo/rail ship OFF behind gates, view-transition morph present, work globe eases left/deeper');

// v3.2r — the scene consumes SCRUBBED scroll (one-pole low-pass), never raw
// per-event scrollY: direct coupling made camera.z / spin / grid step visibly
// under load (owner-reported). Pins the filter shape, its anchored-load seed,
// and the scrubbed consumers; the raw spin coupling must stay retired.
check('v3.2r — scroll scrub: scene consumes low-passed scrollNS, not raw scrollN',
  /scrollNS \+= \(scrollN - scrollNS\) \* Math\.min\(1, dt \* 8\)/.test(background) &&
    /if \(scrollNS < 0\) scrollNS = scrollN;/.test(background) &&
    /spinBase = t \* 0\.22 \+ scrollNS \* 2\.4/.test(background) &&
    /camera\.position\.z = 10 - scrollNS \* 4/.test(background) &&
    /camera\.lookAt\(0, scrollNS \* 1\.5, 0\)/.test(background) &&
    !/spinBase = t \* 0\.22 \+ scrollN \* 2\.4/.test(background),
  'one-pole scrub (tau ~0.125s) sits between scrollY and every scene consumer — spin, camera dolly, lookAt');

// v3.3a — M4 retirement law (§1.1): ONE instanced batch replaces the three Points
// planes; the CPU walk and the rain streak-sprite call sites are deleted symbols
// (negative pins). Dark-swap safety pinned as real code shapes: the base quad is
// parked at z=-8 (never the camera plane) and the type-correct Mesh swap branch
// survives. Rain stays OUT of the bloom emitter set (the exact emitter-tag lines
// are pinned AND the rain mesh local must never be bloom-tagged). WELL_XY_SIGMA
// tunes DOWN only.
const wellXY = Number((background.match(/const WELL_XY_SIGMA = ([0-9.]+)/) || [])[1]);
check('v3.3a — rain is ONE instanced batch; the Points planes and the CPU loop are retired',
  /InstancedBufferGeometry/.test(background) &&
    /nameObject\(new THREE\.Mesh\(geo, mat\), 'rain-streaks'\)/.test(background) &&
    /uWells/.test(background) && /uWind/.test(background) && /uWindT/.test(background) &&
    /mod\(aSeed\.y - aSpeed \* uT, 2\.0 \* aRect\.y\) - aRect\.y/.test(background) &&
    /mesh\.renderOrder = 3/.test(background) &&
    /mesh\.frustumCulled = false/.test(background) &&
    /base\.translate\(0, 0, -8\)/.test(background) &&
    /else if \(o\.isMesh \|\| o\.isLine\) \{ matCache\.set\(o, o\.material\); o\.material = darkMat; \}/.test(background) &&
    /\[fieldCyan, fieldAmber, tokyoRing, comet\]\.forEach\(o => \{ o\.userData\.bloom = true; \}\);/.test(background) &&
    /const bloomByName = new Set\(\['earth-land-particles', 'dallas-to-tokyo-arc'\]\);/.test(background) &&
    !/mesh\.userData\.bloom/.test(background) &&
    wellXY > 0 && wellXY <= 0.25 &&
    !/rain-layer-/.test(background) &&
    !/makeStreakTexture\(d\.len, d\.head\)/.test(background) &&
    !/ud\.speeds/.test(background) &&
    !/p\[i \* 3 \+ 1\] < -ud\.halfH/.test(background),
  'one InstancedBufferGeometry mesh named rain-streaks with GPU mod-recycle, per-drop wells (uWells) and true-velocity lean (uWind/uWindT); dark-swap-safe base quad at z=-8 under the type-correct Mesh swap; rain absent from the bloom emitter set; WELL_XY_SIGMA ' + wellXY + ' in (0, 0.25]; the three Points layers, the rain sprite call site, and the ud.speeds CPU walk are deleted');

// v3.3b — lightning is ONE event (spec §1.2/§3.2/§6): the whole-frame grade
// lift is pinned by VALUE (0 < lift <= 0.10, the biasCap idiom) and suppressed
// in its max(lockT, wordT) shape while the boxed state-word or the home/boot
// lock owns the frame; wordT arms home-excluded inside __sceneFocus and decays
// over the word's 1.9s CSS window; the limb catches the flash (uFlashLimb);
// the glass glints capped at 0.32 over a NEVER-raised 0.22 lens body (Toy Shop
// translucency law); LITE's surviving flat coupling is the named
// LITE_FLASH_BEAT; the old shared flat literal is retired (MUST-NOT-MATCH).
const gradeLiftMatch = background.match(/const LIGHTNING_GRADE_LIFT = ([0-9.]+)/);
const gradeLift = gradeLiftMatch ? Number(gradeLiftMatch[1]) : NaN;
check('v3.3b — the scene answers its lightning as ONE event',
  gradeLift > 0 && gradeLift <= 0.10 &&
    /1 - Math\.max\(sceneState\.lockT, sceneState\.wordT\)/.test(background) &&
    /if \(id === 'home'\) sceneState\.lockT = 1;[^\n]*\n\s*else sceneState\.wordT = 1;/.test(background) &&
    /sceneState\.wordT - dt \/ 1\.9/.test(background) &&
    /uFlashLimb/.test(background) &&
    /globalAlpha = 0\.22 \* a/.test(background) &&
    /Math\.min\(0\.32, 0\.2 \* a \* \(1 \+ glintFlash \* 0\.6\)\)/.test(background) &&
    /const LITE_FLASH_BEAT = 1\.3/.test(background) &&
    /LITE \? \(flash \|\| 0\) \* LITE_FLASH_BEAT : 0/.test(background) &&
    !/\(flash \|\| 0\) \* 1\.3/.test(background),
  'grade lift ' + gradeLift + ' must sit in (0, 0.10] and be word/lock-suppressed; wordT arms home-excluded in __sceneFocus and decays dt/1.9; limb catch present; glint hard-capped 0.32 over an unraised 0.22 lens body; LITE flash beat named; the old shared flat literal retired');

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
