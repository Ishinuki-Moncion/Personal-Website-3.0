const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const app = read('js/app.js');
const background = read('js/background.js');
const css = read('css/site.css');
const effects = read('js/effects.js');
const bootModule = read('js/boot.mjs');
const boot = read('js/boot.js');
const cursor = read('js/cursor.js');
const sceneBootstrap = read('js/scene-bootstrap.mjs');
const qualityPolicy = read('js/quality-policy.mjs');
const gpuProbe = read('js/gpu-probe.mjs');

const checks = [];

function cssBlockBody(source, headerPattern) {
  headerPattern.lastIndex = 0;
  const match = headerPattern.exec(source);
  if (!match) return '';
  const open = source.indexOf('{', match.index + match[0].length);
  if (open < 0) return '';

  let depth = 1;
  let quote = '';
  let comment = false;
  for (let i = open + 1; i < source.length; i++) {
    const char = source[i];
    const next = source[i + 1];
    if (comment) {
      if (char === '*' && next === '/') { comment = false; i++; }
      continue;
    }
    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '/' && next === '*') { comment = true; i++; continue; }
    if (char === '"' || char === "'") { quote = char; continue; }
    if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  return '';
}

function cssRuleBody(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return cssBlockBody(source, new RegExp('(?:^|\\n)\\s*' + escaped + '\\s*(?=\\{)'));
}

function cssBlockBodies(source, headerPattern) {
  const flags = headerPattern.flags.replace(/[gy]/g, '') + 'g';
  const matcher = new RegExp(headerPattern.source, flags);
  const blocks = [];
  let match;
  while ((match = matcher.exec(source))) {
    const tail = source.slice(match.index);
    const body = cssBlockBody(tail, new RegExp('^' + headerPattern.source, flags.replace('g', '')));
    if (body) blocks.push(body);
  }
  return blocks;
}

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
  'essential DOM modules initialize before the optional scene',
  ['app.js', 'effects.js', 'cursor.js', 'boot.js'].every(name => bootModule.indexOf(name) >= 0) &&
    bootModule.indexOf('window.__TIER_PROBE = null') < bootModule.indexOf('app.js') &&
    bootModule.indexOf('window.__CURSOR_ACTIVE = false') < bootModule.indexOf('app.js') &&
    bootModule.indexOf('app.js') < bootModule.indexOf('effects.js') &&
    bootModule.indexOf('effects.js') < bootModule.indexOf('cursor.js') &&
    bootModule.indexOf('cursor.js') < bootModule.indexOf('boot.js') &&
    bootModule.indexOf('boot.js') < bootModule.indexOf('scene-bootstrap.mjs'),
  'boot.mjs must initialize observable sentinels, then app/effects/cursor/boot, before importing scene-bootstrap.mjs'
);

check(
  'scene bootstrap waits for a double-rAF paint boundary and reports status',
  /requestAnimationFrame\(\(\) => requestAnimationFrame\(resolve\)\)/.test(bootModule) &&
    /window\.__SCENE_STATUS/.test(bootModule) &&
    /new CustomEvent\('scene:ready'/.test(bootModule),
  'boot.mjs must yield two animation frames before scene startup and publish window.__SCENE_STATUS plus scene:ready'
);

check(
  'scene startup is isolated behind try/catch with a clean unavailable fallback',
  /export async function bootstrapScene/.test(sceneBootstrap) &&
    /try\s*\{/.test(sceneBootstrap) && /catch \(error\)/.test(sceneBootstrap) &&
    /await import\(`\.\/background\.js\?v=\$\{version\}`\)/.test(sceneBootstrap) &&
    /document\.body\.dataset\.scene = 'unavailable'/.test(sceneBootstrap) &&
    /return \{ ok: false,/.test(sceneBootstrap),
  'scene-bootstrap.mjs must contain scene imports and turn failures into an explicit unavailable status'
);

check(
  'mobile boot uses the 1500ms coarse cap and scaled timer helpers',
  /const coarse = matchMedia\('\(hover: none\), \(pointer: coarse\)'\)\.matches/.test(boot) &&
    /const pace = coarse \? 0\.42 : 1/.test(boot) &&
    /const hardCap = coarse \? 1500 : 9000/.test(boot) &&
    /const later = \(fn, ms\)/.test(boot) && /const repeat = \(fn, ms\)/.test(boot) &&
    /Math\.max\(0, hardCap - performance\.now\(\)\)/.test(boot) &&
    /setTimeout\(finish, capDelay\)/.test(boot),
  'boot.js must scale the sequence on coarse pointers while retaining a navigation-relative 1500ms safety cap'
);

check(
  'reduced motion disables both the cursor RAF and GPU probing',
  /window\.__CURSOR_ACTIVE = false/.test(cursor) &&
    /if \(!reduced && !coarse\) initCursor\(\)/.test(cursor) &&
    /window\.__CURSOR_ACTIVE = true/.test(cursor) &&
    /if \(!reduced\) \{[\s\S]*gpu-probe\.mjs/.test(sceneBootstrap) &&
    /body,[\s\S]*\.boot-skip,[\s\S]*cursor: auto/.test(css) &&
    /\.cursor, \.cursor-dot, \.cursor-label \{ display: none !important; \}/.test(css),
  'reduced motion must skip cursor initialization and probe import while CSS restores native cursors and hides all custom cursor nodes'
);

check(
  'v3.4 policy keeps tier classification, attachment budget, and demotion pure',
  /export const RICH_THRESHOLD_MS = 4\.5/.test(qualityPolicy) &&
    /export function classifyTier/.test(qualityPolicy) &&
    /if \(reduced\) return 'reduced'/.test(qualityPolicy) &&
    /score <= RICH_THRESHOLD_MS \? 'mobile-rich' : 'lite'/.test(qualityPolicy) &&
    /export function estimatePostFxBytes/.test(qualityPolicy) &&
    /export function createFpsDemoter/.test(qualityPolicy) &&
    !/window|document|navigator|matchMedia|sessionStorage/.test(qualityPolicy),
  'quality-policy.mjs must stay deterministic and browser-independent with the measured 4.5ms threshold, memory estimator, and one-way demoter'
);

check(
  'v3.4 probe eligibility and cache paths allocate no WebGL resources',
  (() => {
    const resolver = (gpuProbe.match(/export async function resolveTier[\s\S]*?\n\}/) || [''])[0];
    return /if \(env\.reduced\(\)\) return null/.test(resolver) &&
      /if \(!env\.coarse\(\)\) return null/.test(resolver) &&
      /const forced = env\.forced\(\)/.test(resolver) &&
      /const cached = env\.cacheRead\(CACHE_KEY\)/.test(resolver) &&
      /result = await runProbe\(env\)/.test(resolver) &&
      resolver.indexOf('env.forced()') < resolver.indexOf('runProbe(env)') &&
      resolver.indexOf('env.cacheRead(CACHE_KEY)') < resolver.indexOf('runProbe(env)') &&
      !/createCanvas|getContext|createShader|createProgram|createBuffer|createTexture|createFramebuffer/.test(resolver) &&
      /const CACHE_KEY = 'v34\.tierProbe'/.test(gpuProbe) &&
      /sessionStorage\.getItem\(key\)/.test(gpuProbe) &&
      /sessionStorage\.setItem\(key, JSON\.stringify\(value\)\)/.test(gpuProbe);
  })(),
  'reduced and fine-pointer visits must return null before override/cache/probe work; forced and valid cache hits must resolve before lazy canvas/WebGL allocation'
);

check(
  'v3.4 probe earns tier by yielded fenced scene-shaped measurement, never identity',
  /const FRAMES = 10/.test(gpuProbe) &&
    /const WARMUP = 2/.test(gpuProbe) &&
    /const BUDGET_MS = 1500/.test(gpuProbe) &&
    /FRAMES \+ WARMUP/.test(gpuProbe) &&
    /document\.createElement\('canvas'\)/.test(gpuProbe) &&
    (gpuProbe.match(/canvas\.(?:width|height) = 512/g) || []).length >= 2 &&
    /if \(iteration > 0\) await env\.nextFrame\(\)/.test(gpuProbe) &&
    /drawArraysInstanced\(gl\.TRIANGLES, 0, 6, 600\)/.test(gpuProbe) &&
    /viewport\(0, 0, 512, 512\)/.test(gpuProbe) &&
    /for \(let pass = 0; pass < 4; pass\+\+\)/.test(gpuProbe) &&
    /viewport\(0, 0, 256, 256\)/.test(gpuProbe) &&
    /readPixels\(0, 0, 1, 1/.test(gpuProbe) &&
    /env\.now\(\) - started >= BUDGET_MS/.test(gpuProbe) &&
    /frameFinished - started >= BUDGET_MS/.test(gpuProbe) &&
    /median\(times\)/.test(gpuProbe) &&
    !/userAgent|deviceMemory|hardwareConcurrency|WEBGL_debug_renderer_info|UNMASKED_(?:VENDOR|RENDERER)/.test(gpuProbe),
  'the probe must measure ten frames after two warmups with yielded rAF boundaries, one 512px rain draw, four 256px blur passes, readback fencing, before/after budget checks, and no identity sniffing'
);

check(
  'v3.4 probe finally deletes every retained WebGL resource before losing context',
  (() => {
    const cleanup = (gpuProbe.match(/finally \{[\s\S]*?result\.cleaned = true;\n  \}/) || [''])[0];
    const methods = ['deleteFramebuffer', 'deleteTexture', 'deleteBuffer', 'deleteProgram', 'deleteShader', 'loseContext'];
    return methods.every(method => cleanup.includes(method)) &&
      methods.every((method, index) => index === 0 || cleanup.indexOf(methods[index - 1]) < cleanup.indexOf(method)) &&
      /result\.cleaned = true/.test(cleanup);
  })(),
  'runProbe() must use finally to release framebuffer, texture, buffer, program, and shader resources, then call WEBGL_lose_context once and mark the result cleaned'
);

check(
  'instant boot becomes terminal before synchronously publishing completion',
  /function instant\(\) \{\s*if \(done\) return;\s*done = true;\s*clear\(\);\s*body\.removeAttribute\('data-booting'\);\s*boot\.remove\(\);\s*document\.dispatchEvent\(new Event\('boot:done'\)\);\s*\}/.test(boot),
  'boot.js instant() must guard and set done, clear timers, remove boot state and UI, then synchronously dispatch boot:done'
);

check(
  'the catastrophic watchdog is independent of scene status',
  /setTimeout\(reveal, 10000\)/.test(index) &&
    !index.includes('__SCENE_STATUS'),
  'the inline watchdog should depend only on boot state and remain a ten-second entry-module fallback'
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
  'mobile navigation is a named inert modal until opened',
  /<nav class="nav"[^>]*aria-label="Primary navigation"/.test(index) &&
    /<div class="mobile-menu"[^>]*id="mobileMenu"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-label="Site navigation"[^>]*\binert\b/.test(index) &&
    /<nav class="mm-links"[^>]*aria-label="Mobile navigation"/.test(index) &&
    /mmenu\.inert\s*=\s*!open/.test(app) &&
    /setOverlaySiblingsInert\(mmenu, true\)/.test(app) &&
    /setOverlaySiblingsInert\(mmenu, false\)/.test(app),
  'the primary and mobile nav landmarks need unique names; the mobile menu starts inert and inerts its siblings while open'
);

check(
  'gallery controls have static accessible names',
  (index.match(/<button class="shot[^>]*aria-label="View photograph [^"]+ full screen"/g) || []).length === 12 &&
    /aria-label="View photograph 1 — NAGANO \/\/ 長野 full screen"/.test(index),
  'all 12 gallery buttons need their final accessible names in static HTML before app.js runs'
);

check(
  'work and project row titles are section headings',
  (() => {
    const work = (index.match(/<section class="work"[\s\S]*?<\/section>/) || [''])[0];
    const projects = (index.match(/<section class="projects"[\s\S]*?<\/section>/) || [''])[0];
    return (work.match(/<h3 class="row-title">/g) || []).length === 3 &&
      (projects.match(/<h3 class="row-title">/g) || []).length === 3;
  })(),
  'the three Work rows and three Project rows each need h3 titles beneath their section h2'
);

check(
  'mobile menu is scrollable on short screens',
  (() => {
    const menu = cssRuleBody(css, '.mobile-menu');
    const shortHeight = cssBlockBody(css,
      /@media\s*\(max-height:\s*520px\)\s*and\s*\(max-width:\s*820px\)\s*(?=\{)/);
    const shortMenu = cssRuleBody(shortHeight, '.mobile-menu');
    const shortHead = cssRuleBody(shortHeight, '.mm-head');
    return /overflow-y:\s*auto/.test(menu) &&
      /-webkit-overflow-scrolling:\s*touch/.test(menu) &&
      /display:\s*block/.test(shortMenu) &&
      /position:\s*sticky/.test(shortHead);
  })(),
  'the menu needs momentum scrolling plus a short-height layout with a sticky close header'
);

check(
  'contact signal row fits 400px and narrower viewports',
  (() => {
    const signal = cssRuleBody(css, '.signal-row');
    const address = cssRuleBody(css, '.signal-row .signal-addr');
    const narrow = cssBlockBodies(css, /@media\s*\(max-width:\s*400px\)\s*(?=\{)/)
      .find(body => cssRuleBody(body, '.signal-row') && cssRuleBody(body, '.signal-row .signal-tick')) || '';
    const narrowSignal = cssRuleBody(narrow, '.signal-row');
    const narrowTick = cssRuleBody(narrow, '.signal-row .signal-tick');
    return /max-width:\s*100%/.test(signal) && /flex-wrap:\s*wrap/.test(signal) &&
      /min-width:\s*0/.test(address) && /overflow-wrap:\s*anywhere/.test(address) &&
      /display:\s*grid/.test(narrowSignal) &&
      /grid-template-columns:\s*auto minmax\(0, 1fr\)/.test(narrowSignal) &&
      /grid-column:\s*2/.test(narrowTick);
  })(),
  'the signal row needs a wrapping baseline and a two-column max-width-400 grid with the copied tick in column 2'
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

// v3.3c — droplet-glass v2 (spec §3.3/§6): the O(n^2) bead merge is area-
// conserving and clamped at the pre-merge radius envelope (MERGE_R_MAX = the
// runAt ceiling 5 + 2.5) so peak glass coverage cannot rise; running drops shed
// 1-3 trail beads gated on the SAME cap; the 24/12 bead cap is UNCHANGED.
// Emitter bokeh is the recorded CUT (correction of record #2) — do not add it.
check('v3.3c — droplet glass merges and trails, cap unchanged',
  /const cap = LITE \? 12 : 24;/.test(background) &&
    /const MERGE_R_MAX = 7\.5/.test(background) &&
    /Math\.min\(MERGE_R_MAX, Math\.sqrt\(keep\.r \* keep\.r \+ gone\.r \* gone\.r\)\)/.test(background) &&
    /d\.trail > 0 && d\.y > d\.trailAt && drops\.length < cap/.test(background),
  'area-conserving MERGE_R_MAX-clamped merge pair-check + cap-gated trail spawn present; cap = LITE ? 12 : 24 unchanged');

// v3.3d — M5: hero choreography is Element.animate() with a tracked cancel-before-
// start set; the setTimeout ladders and the wall-clock settle sweep are retired.
// The scramble engine's two nets are pinned POSITIVE — they serve the lang swap
// and the one-shot coord decrypt, surfaces M5 does not touch (correction #3).
check('v3.3d — hero choreography is WAAPI with structural interruption safety',
  /\.animate\(/.test(app) &&
    /anims\.forEach\(a => a\.cancel\(\)\)/.test(app) &&
    /const HERO_BEATS = \{/.test(app) &&
    !/heroSettleTimer/.test(app) &&
    !/settleHero/.test(app) &&
    !/setTimeout\(typeSub, 700\)/.test(app) &&
    /__scrToken/.test(effects) &&
    /dur \+ 400/.test(effects),
  'hero entrance is WAAPI (tracked anims[], cancel-before-start, fill-owned end states); ladders + settle timer gone; scramble token guard + wall-clock net survive in effects.js');

// v3.3e — M6: parallax + progress ride the compositor behind @supports; effects.js
// mirrors the identical CSS.supports check and stands down its per-frame writes
// (never double-driven). The JS fallback formula is pinned POSITIVE — it stays the
// truthful no-SDA path. Reduced-motion gets the explicit animation: none the
// .001ms kill cannot provide (progress-driven playback ignores duration).
check('v3.3e — scroll-driven animations behind @supports with a truthful JS fallback',
  /@supports \(animation-timeline: view\(\)\)/.test(css) &&
    /animation-timeline: view\(\);/.test(css) &&
    /animation-timeline: scroll\(root\);/.test(css) &&
    /@keyframes v33ParallaxDrift/.test(css) &&
    /@keyframes v33ProgressGrow/.test(css) &&
    /CSS\.supports\('animation-timeline: view\(\)'\)/.test(effects) &&
    /if \(progress && !SDA\)/.test(effects) &&
    /if \(!reduced && !SDA\)/.test(effects) &&
    /\(-center \* speed\)\.toFixed\(1\)/.test(effects) &&
    /\[data-parallax\], \.scroll-progress \{ animation: none !important; \}/.test(css),
  'one @supports block owns SDA parallax (view()) + progress (scroll(root)); effects.js gates both writes on the mirrored boot-time check and keeps the fallback formula; migrated elements get animation:none under reduced-motion');

// v3.3f — the rivulet grabpass is the gated M10 splurge (HALO_GATE discipline:
// RIVULET_GATE false must allocate/fetch NOTHING; the gate ships TRUE for the
// owner's live verdict — a kill-flip is an owner-gated pin update). Restraint
// numbers pinned by VALUE: uCoverageMax <= 0.05, DROP_COUNT <= 200, refraction
// luma clamp keyed to the 0.22 glint law. The desktop 2D droplet canvas
// retires BEHIND the gate; LITE keeps the M3 beads.
const rivuletPath = path.join(root, 'js/rivulet.mjs');
const rivulet = fs.existsSync(rivuletPath) ? fs.readFileSync(rivuletPath, 'utf8') : '';
const rivCovMatch = rivulet.match(/uCoverageMax\s*=\s*\{\s*value:\s*([0-9.]+)\s*\}/);
const rivCov = rivCovMatch ? Number(rivCovMatch[1]) : NaN;
const rivDropMatch = rivulet.match(/#define DROP_COUNT (\d+)/);
const rivDrops = rivDropMatch ? Number(rivDropMatch[1]) : NaN;
check('v3.3f — rivulet grabpass is gated, clamped, and the desktop 2D canvas is retired behind it',
  /const RIVULET_GATE = true/.test(background) &&
    /if \(RIVULET_GATE && quality\.name === 'high'\) return null;/.test(background) &&
    /RIVULET_GATE && quality\.name === 'high' && !reduced/.test(background) &&
    /import\('\.\/rivulet\.mjs\?v=/.test(background) &&
    fs.existsSync(path.join(root, 'js/vendor/three-0.158.0/examples/jsm/misc/GPUComputationRenderer.js')) &&
    rivCov > 0 && rivCov <= 0.05 &&
    rivDrops > 0 && rivDrops <= 200 &&
    /lBase \+ 0\.22 \* lRefr/.test(rivulet) &&
    /insertPass\(pass, finalComposer\.passes\.indexOf\(caPass\)\)/.test(rivulet) &&
    /NoBlending/.test(rivulet) && /base\.a/.test(rivulet),
  'RIVULET_GATE=true ships the splurge; dynamic import gated on const + high tier + !reduced; droplets IIFE early-returns on high tier (LITE keeps M3 glass); vendored GPUComputationRenderer on disk; uCoverageMax ' + rivCov + ' <= 0.05 and DROP_COUNT ' + rivDrops + ' <= 200 by value; luma clamp keyed to 0.22; pass NoBlending + centre-tap alpha, inserted after grade before CA');

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
