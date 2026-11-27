/* "Scene next", step 1: the composed hero (docs/rebuild/prototypes/hero/) in ONE WebGL context.
   The default scene; js/background.js mounts instead only when the page is opened with ?scene=live (sticky
   for the tab; ?scene=next clears it). js/scene-bootstrap.mjs owns __SCENE_STATUS, scene:ready and
   body[data-scene="unavailable"]; anything thrown here lands there.

   One renderer, one canvas, no post-processing. One scene drawn in this order:
     1. backdrop (opaque, full screen): night sky, wet floor with the globe's reflection strands, the
        ripple field, the floor grid, the projector pool and beam, the ring's dark body, rim and halo
     2. starfield (additive)
     3. globe (additive): body with graticule and limb (writes depth), land dots and city lights,
        atmosphere, markers, ticks, arc, halo sprites, Tokyo halo rings, orbit ring
     4. ripples, splashes, rain streaks (additive)
   The study stacked two canvases and screen-blended the rain canvas over the globe canvas. Here the
   backdrop reproduces that blend over the void in its last line and paints the ring's body itself;
   the globe meshes that cross the ring and the floor are screen-blended over it, the small Tokyo
   pieces and the rain are additive (globe.mjs says why, with the measurement).

   The arrival (D16, "Ring, then Earth"): the first frames are the pure ring in the rain; when the
   boot finishes (window.__sceneWarp, the boot's existing call) or at once when the boot is skipped,
   the Earth assembles inside it over INTRO_S and the scene settles with the globe inside the ring.
   Once per tab session. Under prefers-reduced-motion: the settled state as one still frame.

   Step 1b adds the eye (eye.mjs: one satellite on the existing orbit ring, the only thing that moves by
   itself), the photo-area marks, and their labels and keyboard buttons (overlay.mjs).

   Step F1b replaces the random starfield with the real sky (stars.mjs: the catalogue's stars where they stand at the
   scene's clock, turning only with the Earth's pose) and draws the eye larger, lit by
   the real sun (eye.mjs).

   Step 2 adds the journey (story.mjs: each section moves the view to its level, the state word names it, the
   veil keeps the copy brighter than the scene) and the controls (controls.mjs: the visitor can take over;
   the wheel and vertical swipes always stay the page's). */
import * as THREE from 'three';
import { classifyTier } from '../quality-policy.mjs?v=5';
import { composition, isPhone, pixelRatioFor, readHeroAnchors, PIXEL_BUDGET, STAGE } from './layout.mjs?v=1';
import { createGlobe, INTRO_S } from './globe.mjs?v=4';
import { createStars } from './stars.mjs?v=1';
import { createWeather } from './weather.mjs?v=1';
import { createEye } from './eye.mjs?v=3';
import { createOverlay } from './overlay.mjs?v=2';
import { createStory, createVeil, SECTIONS } from './story.mjs?v=2';
import { PHOTO_PLACES } from './data/places.mjs?v=2';

const scriptStart = performance.now();

/* Tiers differ by counts and pixel ratio only. Stars (F1b): every tier has the 288 brightest in the first view;
   restStars more load after it (high: all 2,564 to magnitude 5.5; phones stop at 4.5, the first 632; lite none,
   and it requests nothing). */
/* Tiers differ by counts and pixel ratio only. high = the study's desktop look; mobile-rich = its
   phone counts at 1.5x; lite = fewer dots and streaks, no beam, 1x. Every tier also obeys the pixel budget. */
/* F1a: detail = the Earth's detail loaded after the first view (detail.mjs): 'desktop' the 0.5-degree world, 'phone'
   a 1-degree world; both with the Japan tile, the coasts and the night-light images. The lite tier loads none. */
const PROFILES = {
  high: { candidates: 60000, restStars: 2564, streaks: 6000, ripples: 160, dprCap: 2, beam: true, detail: 'desktop' },
  'mobile-rich': { candidates: 22000, restStars: 632, streaks: 2400, ripples: 64, dprCap: 1.5, beam: true, detail: 'phone' },
  lite: { candidates: 12000, restStars: 0, streaks: 1200, ripples: 48, dprCap: 1, beam: false, detail: null },
};
const FOOT_DIM = 0.3;    // the land outside the eye's footprint dims by this much at most (not on lite)
const ARRIVED_KEY = 'scene.next.arrived';
const RING_IN = 0.45;    // s: the ring comes up from the first frame
const HOLD = 0.5;        // s after the arrival starts: the pure ring alone, before the Earth assembles
const RIM = 0.8;         // the ring's strength (the study's default)
/* T2a, the cursor follow (the owner's original site): the Earth looks at the mouse or pen, turning so its face moves
   toward the cursor, on top of where the story points it (follow(), in mountScene). */
/* The amount is the owner's (2026-11-27): 3.5 and 2.5 degrees "feels too little"; he chose three times that on a real screen. */
const FOLLOW_YAW = 10.5;     // degrees of turn (left-right) at orbit with the cursor half a viewport from the Earth's centre
const FOLLOW_PITCH = 7.5;    // degrees of tilt (up-down) at orbit, the same way; both are divided by the zoom below orbit
const FOLLOW_RATE = 3;       // 1/s: how fast it eases after the cursor, the floor's lean (LEAN_RATE)
const FOLLOW_EPS = 1e-4;     // degrees: nearer its target than this it lands on it exactly, so the scene comes to rest
const FOLLOW_BLEND_S = 0.6;  // s: it fades out under a drag and back in after the drag's take-over, over this long

export function mountScene({ probe = null } = {}) {
  const mount = document.getElementById('scene-root');
  if (!mount) throw new Error('#scene-root is missing');
  const query = new URLSearchParams(location.search);
  const sceneDebug = query.get('sceneDebug') === '1';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
  const small = matchMedia('(max-width: 760px)').matches;
  const tier = classifyTier({
    reduced, coarse, small,
    forced: query.get('tier'),
    probeTier: probe?.tier, probeReason: probe?.reason, probeDemoted: probe?.demoted === true,
    score: Number.isFinite(probe?.score) ? probe.score : null,
  });
  const still = tier === 'reduced';
  const profile = still ? PROFILES[coarse || small ? 'mobile-rich' : 'high'] : PROFILES[tier];
  const sunHour = sceneDebug && query.has('sun') && Number.isFinite(Number(query.get('sun'))) ? Number(query.get('sun')) : null;

  // ---------------------------------------------------------------- renderer (throws without WebGL2: the bootstrap reports it)
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance' });
  renderer.setClearColor(new THREE.Color('#05060a'), 1);
  renderer.info.autoReset = true;
  const canvas = renderer.domElement;

  const globe = createGlobe({ candidates: profile.candidates, sunHour, footDim: profile.detail ? FOOT_DIM : 0 });
  const stars = createStars({
    restCount: profile.restStars,
    earth: globe.earth, camera: globe.camera, uReveal: globe.U.uReveal, sizeK: profile.detail === 'phone' ? 0.8 : 1,
    rest: globe.hero(),   // the sky is the room's: it stays put when the Earth turns
  });
  const weather = createWeather({ streaks: profile.streaks, ripples: profile.ripples, beam: profile.beam, still });
  const eye = createEye({ globe, detail: tier !== 'lite' });   // lite: a point and its label
  globe.root.add(eye.mesh);
  const veil = createVeil();               // step 2: copy always wins (story.mjs)
  /* Step L1: ?sceneDebug=1&veil=0 switches the veil off, so tests and the contrast gate can show that the
     desktop layout no longer needs it. Without sceneDebug=1 the switch is ignored. */
  const veilOff = sceneDebug && query.get('veil') === '0';
  const veilK = () => (veilOff ? 0 : story.veil());
  /* Step L1: the eye's words for Tokyo, one source for its label and for the page's status line. */
  const eyeWords = () => (globe.tokyoIsNight() ? 'NIGHT OVER TOKYO' : 'DAY OVER TOKYO');
  const statusLine = document.querySelector('.sys-online');
  let statusNight = null;
  const scene = new THREE.Scene();
  const [backdrop, ...rain] = weather.meshes;
  scene.add(backdrop, stars.mesh, globe.root, ...rain, veil.mesh);

  // ---------------------------------------------------------------- step 2: the journey (story.mjs) and the controls (controls.mjs)
  /* The orbit level's draw set is the globe, the eye and the marks; the Japan and Tokyo stand-ins share it until
     steps 3 and 4 give them their own. The ring level draws none. */
  /* Step L2: the journey's share (drawA) is multiplied by the stage's strength (stage.k, below) wherever it is set. */
  let drawA = 1;
  const stage = { k: 1, y: 0, zone: [0, 0], bands: new Float64Array(0), n: 0, moving: [], measures: 0 };
  const drawSets = { globe: { set(a) { drawA = a; globe.setFade(a * stage.k); eye.setFade(a * stage.k); } } };
  let controls = null;
  const arrivals = [];
  /* The open layout. The owner, 2026-11-26: "The globe seems to be the main focus like this design. Maybe the
     globe is just there in the beginning and the end ... its just very weird to have everything to the left."
     The Earth is the opening and the closing shot: leaving the hero it passes up and out, growing as it comes
     (the visitor flies on under it); the sections between have the room alone and the page's full width; at
     the close it comes back down the same way. Its place follows a smoothed scroll position (presence, below);
     its strength also obeys the stage's rule, on every screen: never over the page's content. */
  const story = createStory({
    globe, eye, drawSets, still,
    onLevel(level) { controls?.setLevel(level); },
    onArrive({ level, cause, section }) {
      arrivals.push(`${section}:${level}:${cause}`); if (arrivals.length > 20) arrivals.shift();
      if (still) redraw();
    },
  });
  /* effects.js leaves the page's boxed state word to the scene, and the scene announces nothing: the journey
     keeps one view from the hero to the close, so no section arrives at a level of its own */
  window.__sceneOwnsStateWord = true;

  // ---------------------------------------------------------------- composition and size
  let W = 1, H = 1, DPR = 1;
  let comp = composition(innerWidth, innerHeight);
  const buffer = new THREE.Vector2();

  // ---------------------------------------------------------------- the stage
  /* Where the Earth stands (at the hero and the close), its STRENGTH, 0 to 1, follows the page: 1 while no text of the page (nor a photograph) is inside the stage's
     zone, the disc's box and a gap above and below it; going to 0 as the nearest copy moves into the zone from
     below or still sits in it from above. Over STAGE_FADE px of scroll, on a curve that is under a half by the time
     copy reaches the disc itself (24 px into the zone). The page's boxes are read at layout (on resize, when the
     fonts are ready, when #main changes size, as the gallery's photographs get theirs, and after a section's
     reveals): per frame the strength is arithmetic on scrollY over those page offsets, no DOM read. Everything of
     the disc follows it: the Earth, the ring and its body, the eye, the scene's labels, the level buttons, the disc's
     light on the rain and the floor, and the stars' mask behind the disc; the sky, the rain and the floor stay.
     It is a function of the scroll position, so it needs no easing and is the same under reduced motion. */
  const stageOn = document.documentElement.dataset.scene === 'next';
  const STAGE_DEAD = 3, STAGE_FADE = 64;
  const svhProbe = document.createElement('div');   // the stylesheet's svh, which the stage's radius is made of
  Object.assign(svhProbe.style, { position: 'fixed', left: '0', top: '0', width: '0', height: '100svh', visibility: 'hidden', pointerEvents: 'none' });
  mount.appendChild(svhProbe);
  const STAGE_SKIP = '.sr-only, .scene-levels, .scene-targets, script, style, noscript, template, [hidden]';
  const STAGE_MEDIA = 'img, video, .shot';   // photographs (the gallery's are buttons with a background image)
  function measureStage() {
    const main = document.getElementById('main');
    if (!stageOn || !main) { stage.n = 0; stage.moving = []; return; }
    stage.zone = [comp.cy - comp.r - STAGE.gap, comp.cy + comp.r + STAGE.gap];
    /* on desktop only what stands in the disc's own columns can be under it: the hero's and the close's copy keep
       to the left of the ring */
    /* (the disc at rest: as it leaves it grows wider than this, but by then it has risen clear of the copy beside it).
       The two ends' own copy is left out altogether there: the hero and the close are composed with their copy
       left of the ring (tests/browser/scene-open.spec.mjs holds that for the close), and the hero's name cannot be measured
       by its letters while its entrance scrambles them (a wide scramble counted as under the disc, and the Earth
       stayed hidden on the hero). */
    const xFilter = !comp.phone, x0 = comp.cx - comp.r - 12, x1 = comp.cx + comp.r + 12;
    const ENDS = '#home, #contact';
    const close = document.getElementById('contact');
    /* the close is complete where an anchor jump to Contact lands: the section's top less its scroll margin (64 to
       96 px on desktop, 0 on phones), so a jump from the nav finds the Earth in its place, not a tenth out */
    const closeMargin = close ? parseFloat(getComputedStyle(close).scrollMarginTop) || 0 : 0;
    PRES.closeAt = close ? Math.min(close.getBoundingClientRect().top + scrollY - closeMargin, document.documentElement.scrollHeight - innerHeight) : Infinity;
    const sy = scrollY, spans = [];
    /* where a box is laid out, not where a reveal paints it mid-way (translate 28 px, scale 0.94): undo the
       transform of its [data-reveal] ancestor, read once per element */
    const undo = new Map();
    const unreveal = el => {
      const r = el.closest('[data-reveal]');
      if (!r) return null;
      let u = undo.get(r);
      if (u === undefined) {
        const cs = getComputedStyle(r);
        u = null;
        if (cs.transform && cs.transform !== 'none') {
          const m = new DOMMatrixReadOnly(cs.transform), oy = parseFloat(cs.transformOrigin.split(' ')[1]) || 0;
          const d = Math.abs(m.d) > 1e-3 ? m.d : 1, top0 = r.getBoundingClientRect().top - oy * (1 - d) - m.f, O = top0 + oy;
          u = { d, f: m.f, O };
        }
        undo.set(r, u);
      }
      return u;
    };
    const add = (el, top, bottom, left = -Infinity, right = Infinity) => {
      if (xFilter && (right < x0 || left > x1)) return;
      const u = unreveal(el);
      if (u) { top = u.O + (top - u.f - u.O) / u.d; bottom = u.O + (bottom - u.f - u.O) / u.d; }
      if (bottom - top >= 2) spans.push(top + sy, bottom + sy);
    };
    const range = document.createRange();
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (!t.nodeValue.trim()) continue;
      const el = t.parentElement;
      if (!el || el.closest(STAGE_SKIP) || el.closest('[data-parallax]') || el.closest('.hero h1')) continue;
      if (xFilter && el.closest(ENDS)) continue;
      range.selectNodeContents(t);
      for (const b of range.getClientRects()) if (b.width >= 2) add(el, b.top, b.bottom, b.left, b.right);
    }
    const sub = main.querySelector('.hero-sub');   // the hero's sentence is drawn by a pseudo element
    if (sub && !xFilter) { const b = sub.getBoundingClientRect(); add(sub, b.top, b.bottom); }
    /* The hero's name, by its own box (the review of this step). Its lines are set at line-height 0.82, so the
       glyphs stand outside their line boxes, and its entrance gives each letter a box of its own while it
       scrambles: measured letter by letter in the middle of that, the band came out short (WebKit, 360 x 640:
       the Earth at 0.004 of its strength with the name over its centre). The element keeps two lines' height
       from the start (its min-height); a quarter of the type size more at each end covers the glyphs. */
    const heroName = main.querySelector('.hero h1');
    if (heroName) {
      const b = heroName.getBoundingClientRect(), pad = 0.25 * (parseFloat(getComputedStyle(heroName).fontSize) || 0);
      if (!xFilter) add(heroName, b.top - pad, b.bottom + pad);
    }
    for (const m of main.querySelectorAll(STAGE_MEDIA)) {
      if (m.closest('[data-parallax]') || (xFilter && m.closest(ENDS))) continue;
      const box = m.closest('.clip-reveal, picture') || m, b = box.getBoundingClientRect();
      if (b.width >= 2) add(box, b.top, b.bottom, b.left, b.right);
    }
    /* one sorted list of disjoint bands: what lies where down the page */
    const order = [];
    for (let i = 0; i < spans.length; i += 2) order.push(i);
    order.sort((a, b) => spans[a] - spans[b]);
    const bands = [];
    for (const i of order) {
      const t = spans[i], b = spans[i + 1], n = bands.length;
      if (n && t <= bands[n - 1] + 1) bands[n - 1] = Math.max(bands[n - 1], b);
      else bands.push(t, b);
    }
    /* a parallax element (the About portrait and its tag) drifts with the scroll by its speed, through the CSS
       timeline or effects.js, both the same line: translateY = speed * (scrollY + innerHeight / 2 - its laid-out
       centre). It is one moving band: its laid-out box, read back from the painted one at this scroll position. */
    stage.moving = [];
    for (const el of main.querySelectorAll('[data-parallax]')) {
      const k = reduced ? 0 : parseFloat(el.getAttribute('data-parallax')) || 0.1, hgt = el.offsetHeight;
      if (hgt < 2) continue;
      /* its laid-out place from the offsets, which no transform moves (the drift may not have been applied yet:
         effects.js writes it on the first scroll, a scroll timeline once it has resolved) */
      let top = 0;
      for (let e = el; e; e = e.offsetParent) top += e.offsetTop;
      const centre = top + hgt / 2;
      stage.moving.push({ k, top, bottom: top + hgt, centre, half: innerHeight / 2 });
    }
    stage.bands = Float64Array.from(bands);
    stage.n = bands.length / 2;
    stage.measures++;
  }
  let measureTimer = 0;
  const scheduleMeasure = () => { clearTimeout(measureTimer); measureTimer = setTimeout(() => { measureStage(); stageScrolled(); }, 120); };
  /** The stage's strength with the page scrolled to y (arithmetic only). */
  function stageAt(y) {
    if (!stage.n && !stage.moving.length) return 1;
    const zt = y + stage.zone[0] + PRES.dy, zb = y + stage.zone[1] + PRES.dy + PRES.dr * 2, B = stage.bands;   // the zone travels with the disc
    let lo = 0, hi = stage.n;   // the first band that ends below the zone's top (the bands are disjoint: their ends are sorted too)
    while (lo < hi) { const m = (lo + hi) >> 1; if (B[2 * m + 1] <= zt) lo = m + 1; else hi = m; }
    let depth = 0;
    for (let i = lo; i < stage.n && B[2 * i] < zb; i++) depth = Math.max(depth, Math.min(zb - B[2 * i], B[2 * i + 1] - zt));
    for (const m of stage.moving) {
      const d = m.k * (y + m.half - m.centre), top = m.top + d, bottom = m.bottom + d;
      if (bottom > zt && top < zb) depth = Math.max(depth, Math.min(zb - top, bottom - zt));
    }
    const t = Math.min(1, Math.max(0, (depth - STAGE_DEAD) / STAGE_FADE));
    return (1 - t) * (1 - t);
  }
  let labelsRoot = null, labelsK = -1;
  /** The page's side of the strength: the level buttons and the scene's labels (DOM writes only when it changes). */
  function applyStage() {
    controls?.setStrength(stage.k);
    const q = Math.round(stage.k * 100) / 100;
    if (labelsRoot && q !== labelsK) { labelsK = q; labelsRoot.style.opacity = q < 1 ? String(q) : ''; }
  }
  /* Where the Earth is, 0 (in its place) to 1 (gone above the top). */
  const PRES = { e: 0, y: scrollY, t: performance.now(), closeAt: Infinity, dy: 0, dr: 0 };
  const disc = { cx: comp.cx, cy: comp.cy, r: comp.r };
  const EXIT_GROW = 0.4, EXIT_RATE = 9, EXIT_LEAD = 1.08;
  function placeDisc(e) {
    const r = comp.r * (1 + EXIT_GROW * e);
    disc.cx = comp.cx; disc.r = r; disc.cy = comp.cy - e * (comp.cy + r + 0.06 * H);
    PRES.dy = disc.cy - disc.r - (comp.cy - comp.r); PRES.dr = disc.r - comp.r;
    globe.resize({ w: W, h: H, cx: disc.cx, cy: disc.cy, r: disc.r, dpr: DPR });
    weather.place({ w: W, h: H, dpr: DPR, disc: { ...comp, cx: disc.cx, cy: disc.cy, r: disc.r }, horizon: comp.horizon, reflCap: comp.reflCap });
  }
  /** Move the Earth to where the scroll puts it; returns its share from the path alone (it fades as it goes). */
  function presence() {
    const now = performance.now(), dt = Math.min(0.25, Math.max(0, (now - PRES.t) / 1000));
    PRES.t = now;
    PRES.y = still ? scrollY : PRES.y + (scrollY - PRES.y) * (1 - Math.exp(-dt * EXIT_RATE));
    if (Math.abs(scrollY - PRES.y) < 0.5) PRES.y = scrollY;
    /* the scroll it takes to leave: a little less than the distance it has to go, so it stays ahead of the page */
    const span = Math.max(0.35 * H, (comp.cy + comp.r * (1 + EXIT_GROW) + 0.06 * H) / EXIT_LEAD);
    const out = Math.min(1, Math.max(0, PRES.y / span));
    const back = Math.min(1, Math.max(0, (PRES.y - (PRES.closeAt - span)) / span));
    let e = 1 - Math.max(1 - out, back);
    if (still) e = e < 0.5 ? 0 : 1;   // reduced motion: there or not, no travel
    if (e !== PRES.e) { PRES.e = e; placeDisc(e); }
    return 1 - smooth(0.72, 1, e);
  }

  /* Reduced motion: the still frame is drawn again when the strength changes */
  let stageQueued = false;
  function stageScrolled() {
    if (!still) return;
    stage.y = scrollY;
    if (!started || stageQueued || lost) return;
    stageQueued = true;
    requestAnimationFrame(() => { stageQueued = false; if (!lost) { step(0); draw(); } });
  }

  function layout() {
    const w = innerWidth, h = innerHeight;
    const dpr = pixelRatioFor(w, h, profile.dprCap);
    const svh = svhProbe.getBoundingClientRect().height || h;
    comp = composition(w, h, isPhone(w, h) ? readHeroAnchors() : null, { stage: stageOn, svh });
    measureStage();
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h);
    renderer.getDrawingBufferSize(buffer);
    globe.resize({ w, h, cx: comp.cx, cy: comp.cy, r: comp.r, dpr });
    globe.U.uRes.value.copy(buffer);
    stars.resize(w, h, dpr, comp.cx, comp.cy);
    stars.setHorizon(comp.horizon, h, dpr);
    eye.setPhone(comp.phone);
    weather.place({ w, h, dpr, disc: comp, horizon: comp.horizon, reflCap: comp.reflCap });
    weather.U.uRes.value.copy(buffer);
    if (w !== W || h !== H) veil.invalidate();
    W = w; H = h; DPR = dpr;
    publishStage();
    controls?.place(comp, w, h);
    disc.cx = comp.cx; disc.cy = comp.cy; disc.r = comp.r; PRES.dy = 0; PRES.dr = 0;
    if (PRES.e > 0) placeDisc(PRES.e);   // a resize while the Earth is away keeps it away
  }
  /* Step L1: where the ring stands, for the page (css/site.css keeps its copy left of --stage-left). The same
     composition the scene draws with, so the page and the scene cannot disagree; until this first runs, the
     stylesheet computes the same numbers from the viewport. */
  function publishStage() {
    const s = document.documentElement.style, px = v => `${Math.round(v * 100) / 100}px`;
    s.setProperty('--stage-cx', px(comp.cx));
    s.setProperty('--stage-cy', px(comp.cy));
    s.setProperty('--stage-r', px(comp.r));
    s.setProperty('--stage-left', px(comp.cx - comp.r));
    s.setProperty('--stage-room', px(document.documentElement.clientWidth - comp.cx - comp.r));   // right of the ring, scrollbar excluded
  }

  // ---------------------------------------------------------------- the arrival: ring, then Earth
  let arrived = false;
  try { arrived = sessionStorage.getItem(ARRIVED_KEY) === '1'; } catch { /* privacy modes: arrive every load */ }
  let mode = still || arrived ? 'inside' : 'ring';
  const modeLog = [mode];
  let clock = 0, arrivalAt = -1, assembleAt = -1, rimIn = mode === 'inside' ? 1 : 0;
  const setMode = next => { if (next !== mode) { mode = next; modeLog.push(next); } };
  if (mode === 'inside') { arrived = true; globe.settle(); } else globe.hide();
  /* ?sceneDebug=1&arrival=hold keeps the pure ring until __sceneDebugArrive() (captures, tests). */
  const holdRing = sceneDebug && query.get('arrival') === 'hold';
  function startArrival(force = false) {
    if (mode !== 'ring' || (holdRing && force !== true)) return;
    arrivalAt = clock;
    setMode('arriving');
    try { sessionStorage.setItem(ARRIVED_KEY, '1'); } catch { /* the arrival simply runs again next load */ }
  }
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const tk = { x: 0, y: 0, facing: 0, wx: 0, wy: 0, wz: 0 };
  const EYE_FLASH_MS = 2500;               // the eye's label, once, at the end of the arrival
  let overlay = null, lastNight = null, lastMinute = -1;
  /* The floor moves with the camera (design 16; the owner, 2026-11-26: "everything moves with the scroll and mouse
     besides the floor and water and reflection. feels grounded and static"). The floor used to have a camera of its
     own that listened to nothing, and a grid that drifted by a clock. Now it has three causes and nothing idle:
       the level    going down pushes the camera in (PUSH_M metres for each e-fold of magnification: 3.3 m to Japan)
                    and brings the ground a little closer (GROUND_K);
       the scroll   the ground travels SCROLL_M metres for each css px scrolled and comes back exactly when the page
                    does: the ground is owed an exact distance and pays it off smoothly, which is the inertia;
       the pointer  the camera leans LEAN_M metres either way round the globe: the near ground shifts about 12 px on
                    a 1440 px screen, the far ground less, the globe not at all, the stars never. Mouse and pen only.
     Timed by the clock, not by scene steps (those are capped at 50 ms a frame, which is what made the stars' fade
     crawl on a slow renderer). Off under reduced motion; ?motion=0 turns it off for comparison. */
  const SCROLL_M = 0.007, PUSH_M = 2.6, LEAN_M = 0.085, GROUND_K = 0.12, PAY_RATE = 5, LEAN_RATE = 3;
  /* TRIAL (the owner, 2026-11-26: "Should the stars and the background galaxy move in the same direction as the
     floor. backwards and forwards? have that space movement feeling"). The stars become the farthest layer of the
     same camera move: going forward (down a level, down the page) they spread from the floor's vanishing point,
     going back they close in, and they return exactly. A star's share is its nearness (stars.mjs: bright = near):
     SKY_PUSH of its distance from the vanishing point for each e-fold of magnification (15% at Tokyo for the
     brightest), SKY_SCROLL for each metre of ground at first, easing toward SKY_SCROLL_MAX in all however long
     the page is (tanh: a long page must not thin the sky out). Doubled on the owner's word after the first
     trial ("Make it stronger"). Paid off with the floor, so the two move as one. Never the
     pointer, never the Earth's turning. ?skymove=0 turns it off; ?skymove=2 doubles it, to judge the amount. */
  const SKY_PUSH = 0.09, SKY_SCROLL = 0.005, SKY_SCROLL_MAX = 0.3;
  const motionOn = !still && query.get('motion') !== '0';
  const M = { lean: 0, ptr: 0, travel: 0, owed: 0, vel: 0, lastY: scrollY, lastLz: 0, t: performance.now(), sky: 0, skyM: 0, skyMOwed: 0, skyLz: 0, skyLzOwed: 0 };
  const skyK = motionOn ? Math.max(0, Math.min(4, Number(query.get('skymove') ?? 1) || 0)) : 0;
  if (motionOn) {
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'touch') M.ptr = Math.max(-1, Math.min(1, (e.clientX / Math.max(1, W)) * 2 - 1));
    }, { passive: true });
  }
  function motion() {
    if (!motionOn) return;
    const now = performance.now(), dt = Math.min(0.25, Math.max(0, (now - M.t) / 1000));
    M.t = now;
    const y = scrollY, lz = Math.log(globe.zoom());
    M.owed += (y - M.lastY) * SCROLL_M + (lz - M.lastLz) * PUSH_M;
    M.skyMOwed += (y - M.lastY) * SCROLL_M; M.skyLzOwed += lz - M.lastLz;   // the sky's own two followers: metres scrolled, e-folds pushed
    M.lastY = y; M.lastLz = lz;
    let pay = M.owed * (1 - Math.exp(-dt * PAY_RATE));
    if (Math.abs(M.owed - pay) < 0.002) pay = M.owed;          // the last two millimetres at once: it comes to rest
    M.owed -= pay; M.travel += pay;
    const kPay = 1 - Math.exp(-dt * PAY_RATE);
    let payM = M.skyMOwed * kPay, payLz = M.skyLzOwed * kPay;
    if (Math.abs(M.skyMOwed - payM) < 2e-3) payM = M.skyMOwed;
    if (Math.abs(M.skyLzOwed - payLz) < 2e-4) payLz = M.skyLzOwed;
    M.skyMOwed -= payM; M.skyM += payM; M.skyLzOwed -= payLz; M.skyLz += payLz;
    M.sky = skyK * (SKY_PUSH * M.skyLz + SKY_SCROLL_MAX * Math.tanh(M.skyM * SKY_SCROLL / SKY_SCROLL_MAX));
    stars.setMove(M.sky, 0, weather.U.uShift.value);
    M.vel = dt > 0 ? pay / dt : 0;
    const lean = M.ptr * LEAN_M;
    M.lean += (lean - M.lean) * (1 - Math.exp(-dt * LEAN_RATE));
    if (Math.abs(lean - M.lean) < 1e-4) M.lean = lean;
    weather.U.uCam.value.set(M.lean, M.travel, Math.exp(-GROUND_K * lz));
    weather.U.uCamV.value.set(M.vel, Math.max(-10, Math.min(10, M.vel)));
  }
  /* T2a: the Earth looks at the cursor (FOLLOW_*, top of the file). Measured from the Earth's centre on screen and
     normalised by half the viewport; below orbit the angles are divided by the zoom (the magnification of the ground
     under the viewer), so the face shifts about as far on screen at Japan and Tokyo as at orbit. A turn of the Earth's
     group about the screen's own axes (globe.setFollow), outside the story's pose: the story's targets and the
     stars' rest pose never see it; the orbit ring and the eye do not hang from it. Eased like the floor's lean and
     landing exactly, so the scene still comes to rest. A drag has priority: under its take-over the strength (k)
     goes to 0, and comes back over FOLLOW_BLEND_S once the take-over lapses or is released.
     Nothing at all on touch (a finger has no resting place), under reduced motion (no listener) and before any
     mouse or pen has moved: F.live stays false and the frame returns at once. While the Earth is away (presence.e
     at 1) it is zeroed once and then skipped; it blends back in when the Earth returns. */
  const DEG = Math.PI / 180;
  const F = { live: false, on: false, x: 0, y: 0, yaw: 0, pitch: 0, kLin: 1, k: 0, outYaw: 0, outPitch: 0, t: 0 };
  if (!still) {
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'touch') { F.x = e.clientX; F.y = e.clientY; F.live = true; }
    }, { passive: true });
  }
  function follow() {
    if (!F.live) return;
    if (PRES.e >= 1) {
      if (F.on) { F.on = false; F.yaw = F.pitch = F.outYaw = F.outPitch = F.k = F.kLin = 0; globe.setFollow(0, 0); }
      return;
    }
    const now = performance.now();
    let dt = 0;
    if (F.on) dt = Math.min(0.25, Math.max(0, (now - F.t) / 1000));
    F.on = true; F.t = now;
    const z = Math.max(1, globe.zoom());
    const nx = Math.max(-1, Math.min(1, (F.x - disc.cx) / Math.max(1, W / 2)));
    const ny = Math.max(-1, Math.min(1, (disc.cy - F.y) / Math.max(1, H / 2)));   // up is positive
    const ty = nx * FOLLOW_YAW / z, tp = ny * FOLLOW_PITCH / z;
    const a = 1 - Math.exp(-dt * FOLLOW_RATE);
    F.yaw += (ty - F.yaw) * a; if (Math.abs(ty - F.yaw) < FOLLOW_EPS) F.yaw = ty;
    F.pitch += (tp - F.pitch) * a; if (Math.abs(tp - F.pitch) < FOLLOW_EPS) F.pitch = tp;
    const handled = story.handled();
    F.kLin = Math.max(0, Math.min(1, F.kLin + (handled ? -dt : dt) / FOLLOW_BLEND_S));
    F.k = smooth(0, 1, F.kLin);
    F.outYaw = F.yaw * F.k; F.outPitch = F.pitch * F.k;
    globe.setFollow(F.outYaw * DEG, F.outPitch * DEG);
  }
  function step(dt) {
    clock += dt;
    if (rimIn < 1) rimIn = Math.min(1, clock / RING_IN);
    let solid = mode === 'inside' ? 0 : 1;
    if (mode === 'arriving') {
      if (assembleAt < 0 && clock >= Math.max(arrivalAt + HOLD, RING_IN)) { assembleAt = clock; globe.assemble(); }
      if (assembleAt >= 0) {
        const t = clock - assembleAt;
        solid = 1 - smooth(0, INTRO_S, t);
        if (t >= INTRO_S) { setMode('inside'); arrived = true; solid = 0; overlay?.flash('eye', EYE_FLASH_MS); }
      }
    }
    story.update(dt);
    stage.y = scrollY;
    const pathK = presence();
    stage.k = pathK * (stageOn ? stageAt(stage.y) : 1);
    globe.setFade(drawA * stage.k); eye.setFade(drawA * stage.k);
    eye.mesh.visible = drawA * stage.k > 0.002;   // at 0 the Earth is not drawn at all (the globe hides its own meshes)
    weather.setStage(stage.k);
    weather.setAway(smooth(0.25, 1, PRES.e));   // the room's own light as the Earth goes
    applyStage();
    follow();                // T2a: before the globe composes its pose for this frame
    globe.update(dt);
    eye.update(dt, !still && story.eyeDrifts());
    weather.update(dt);
    motion();
    stars.update(dt);
    solid = Math.max(solid, story.solid());   // the ring level brings the ring's dark body back (contact)
    const e = 1 - Math.pow(1 - rimIn, 3);
    weather.setRing(solid * stage.k, RIM * e * stage.k, 3 * DPR * (1 - solid));   // L2: the ring and its body go with the stage
    /* the disc is opaque wherever the Earth is drawn in it (it fills the disc at every level) or the ring's body is */
    stars.setDisc(disc.cx, disc.cy, disc.r, H, DPR, Math.max(solid * stage.k, Math.min(1, globe.reveal() * globe.fade())));
    globe.tokyo(tk);
    const qx = (tk.x - disc.cx) / disc.r, qy = -(tk.y - disc.cy) / disc.r;
    weather.setTokyo(qx, qy, smooth(0, 0.35, tk.facing) * globe.fade() * (globe.zoom() > 1.001 ? 1 - smooth(0.95, 1.1, Math.hypot(qx, qy)) : 1));
    weather.setSun(globe.U.uSun.value.x, globe.U.uSun.value.y);   // F1a: the ring lifts on the sun's side
    globe.footprint();
    veil.update(veilK(), W, H, comp, DPR);
    /* the status line under the hero (aria-hidden, as before) says what the eye says about Tokyo */
    const nightNow = globe.tokyoIsNight();
    if (statusLine && nightNow !== statusNight) { statusNight = nightNow; statusLine.textContent = `● ${eyeWords()}`; }
    if (overlay) {
      globe.placeMarks();
      const night = globe.tokyoIsNight();
      const minute = Math.floor(Date.now() / 60000);   // F1a: Tokyo's label carries the JST clock
      if (night !== lastNight || minute !== lastMinute) { lastNight = night; lastMinute = minute; overlay.names(); }
      overlay.update();
    }
  }

  // ---------------------------------------------------------------- loop
  let raf = 0, running = false, lost = false, needsLayout = false, last = 0, started = false;
  let fpsEMA = 60, frames = 0, drawCalls = 0, firstFrameAt = null;
  function draw() {
    /* The scene's first frame draws the veil too, at whatever strength it has (zero on the hero), so its program
       is first used here with the other fifteen, never in the frame that first leaves the hero: measured there,
       a 600 ms wait on the link status (getProgramInfoLog) on the phone profile. */
    const primeVeil = frames === 0 && !veil.mesh.visible;   // and restored after, so the veil's own state is unchanged
    if (primeVeil) veil.mesh.visible = true;
    renderer.render(scene, globe.camera);
    if (primeVeil) veil.mesh.visible = false;
    drawCalls = renderer.info.render.calls;
    frames++;
    if (firstFrameAt === null) { firstFrameAt = performance.now(); starsAtFirstFrame = stars.count; scheduleDetail(); scheduleRestStars(); scheduleLate(); }
  }

  // ---------------------------------------------------------------- F1a: the Earth's detail, after the first view
  /* Nothing of it is requested before the first frame. Once that frame is drawn and the page is idle, detail.mjs
     fetches the data and builds the fine set in slices (none holds the main thread long); the globe cross-fades to it
     over DETAIL_S (the still frame: at once, then one redraw). Any failure leaves the scene as it was, silently. */
  const detailState = { state: profile.detail ? 'waiting' : 'off', requestedAt: null, landedAt: null, framesAtLanded: null };
  function scheduleDetail() {
    if (!profile.detail || detailState.state !== 'waiting') return;
    detailState.state = 'scheduled';
    const go = () => { loadDetailNow(); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 250);
  }
  async function loadDetailNow() {
    detailState.state = 'loading';
    detailState.requestedAt = Math.round(performance.now());
    try {
      const D = await import('./detail.mjs?v=1');
      const mods = await D.loadDetail();
      detailState.state = 'building';
      const pause = D.slicer(6), rest = async () => { const p = pause(); if (p) await p; };
      const dots = await D.buildFineDots(mods, { phone: profile.detail === 'phone', relief: globe.relief, pause });
      await rest();
      const landTex = await D.buildLandTexture(mods, { pause });
      await rest();
      const coast = D.buildCoastSegments(mods);
      await rest();
      globe.setDetail({ dots, landTex, coast, lightsW: mods.lightsW, lightsJ: mods.lightsJ }, { fade: !still });
      detailState.state = 'landed';
      detailState.landedAt = Math.round(performance.now());
      detailState.framesAtLanded = frames;
      redraw();
    } catch {
      detailState.state = 'failed';   // the scene stays as it is today; nothing is logged
      loadCities();                   // and gets the city table's lights, as the lite tier has them
    }
  }
  /* F1 review: the first view's diet. Neither the controls (4.5 KB gzipped) nor the city table (9.8 KB) is needed
     to draw the first frame, so both load straight after it. The controls: always. The city table: on the lite
     tier, which keeps it; on the other tiers only if the detail, which carries the real night lights, fails. */
  const late = { controls: 'waiting', cities: 'waiting' };
  function loadControls() {
    if (late.controls !== 'waiting') return;
    late.controls = 'loading';
    import('./controls.mjs?v=2').then(m => {
      controls = m.createControls({ story, globe, overlay, onChange: redraw, follow: true });
      controls.place(comp, W, H);
      controls.setLevel(story.level());
      controls.setSection(story.section());
      controls.setStrength(stage.k);
      late.controls = 'loaded';
    }, () => { late.controls = 'failed'; });
  }
  function loadCities() {
    if (late.cities !== 'waiting') return;
    late.cities = 'loading';
    import('./data/cities.mjs?v=1').then(m => { globe.setCities(m.cities()); late.cities = 'loaded'; redraw(); }, () => { late.cities = 'failed'; });
  }
  function scheduleLate() {
    loadControls();
    if (!profile.detail) loadCities();
  }
  /* F1b: the fainter stars load after the first frame, when the page is idle; they fade in (stars.mjs), or under
     reduced motion land at once with exactly one redraw. */
  let restRedraws = 0, starsAtFirstFrame = null;
  function scheduleRestStars() {
    if (!(profile.restStars > 0)) return;
    const go = () => stars.loadRest({
      reduced: still,
      onLanded() { if (still) { const f0 = frames; redraw(); restRedraws += frames - f0; } },
    });
    if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 120);
  }
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const elapsed = Math.max(0, (now - last) / 1000); last = now;
    if (elapsed > 0) fpsEMA += (Math.min(1 / elapsed, 240) - fpsEMA) * 0.04;
    if (needsLayout) { needsLayout = false; layout(); }
    step(Math.min(elapsed, 0.05));
    draw();
  }
  function start() {
    if (still || running || lost || !started || document.hidden) return;
    running = true;
    last = performance.now();   // never lerp across a pause
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); raf = 0; }
  /* Reduced motion: one still frame, drawn again only when the picture would differ (a resize, a
     re-wrap that moves the phone composition, a restored context). */
  let stillKey = '';
  function stillFrame(force = false) {
    if (lost) return;
    layout();
    const key = `${canvas.width}x${canvas.height}/${comp.cx.toFixed(1)},${comp.cy.toFixed(1)},${comp.r.toFixed(1)},${comp.horizon.toFixed(4)}`;
    if (!force && key === stillKey) return;
    stillKey = key; step(0); draw();
  }

  // ---------------------------------------------------------------- hooks (the boot calls __sceneWarp; effects.js calls __sceneFocus)
  let veilTimer = 0;
  window.__sceneWarp = () => startArrival();
  window.__sceneFocus = id => {
    if (typeof id !== 'string') return;
    story.focus(id);
    controls?.setSection(story.section());
    /* the section's reveals land in about a second: read its copy's boxes again then */
    clearTimeout(veilTimer); veilTimer = setTimeout(() => { veil.invalidate(); redrawVeil(); scheduleMeasure(); }, 1200);
  };
  window.__scanPlace = () => {};
  /** The section in view, by effects.js's own rule (it only reports changes, and it may have run before the scene). */
  function sectionInView() {
    let active = 'home';
    for (const id of Object.keys(SECTIONS)) {
      const s = id !== 'home' && document.getElementById(id);
      if (s && s.getBoundingClientRect().top <= innerHeight * 0.4) active = id;
    }
    return scrollY < 80 ? 'home' : active;
  }

  // ---------------------------------------------------------------- the eye and the photo areas: labels, buttons, turns
  let lastTurn = null;
  const redraw = () => { if (still && started) stillFrame(true); };
  /* Reduced motion: the still frame follows the page only where the veil does (the copy moved under it). */
  let veilQueued = false;
  function redrawVeil() {
    if (!still || !started || veilQueued) return;
    veilQueued = true;
    requestAnimationFrame(() => { veilQueued = false; if (!lost && veil.update(veilK(), W, H, comp, DPR)) draw(); });
  }
  function turnTo(lat, lon, why) {
    lastTurn = { lat: +lat.toFixed(3), lon: +lon.toFixed(3), why };
    if (story.isFree()) globe.turnTo(lat, lon, { cut: still });   // reduced motion: a cut, never a travel
    else story.takeOver({ lat, lon, why });                      // away from the hero, a turn is a take-over
    redraw();
  }
  let hoverMark = null, focusMark = null;
  const markHover = () => globe.setHover(focusMark ?? hoverMark);
  function mountOverlay() {
    const eyePos = { x: 0, y: 0, hit: 16, pad: 14, live: false };
    const targets = [{
      key: 'eye',
      pos() {
        const s = eye.onScreen(); eyePos.x = s.x; eyePos.y = s.y; eyePos.live = eye.alpha() > 0.05;
        eyePos.hit = eye.halfSpan() + 4; eyePos.pad = eye.halfSpan() + 6;   // the drawn glyph is 32 css px (24 on phones)
        return eyePos;
      },
      lines: () => ['EYE', eyeWords()],
      tone: () => (globe.tokyoIsNight() ? 'event' : 'signal'),
      name: () => `The eye, a satellite: ${globe.tokyoIsNight() ? 'night' : 'day'} over Tokyo. Turn the Earth to the point under it`,
      activate() { const g = eye.under(); turnTo(g.lat, g.lon, 'eye'); },
    }];
    const screens = globe.placeMarks();
    globe.marks.forEach((mk, i) => {
      const n = mk.files.length, photos = `${n} PHOTO${n > 1 ? 'S' : ''}`;
      const p = { x: 0, y: 0, hit: 12, live: false };
      targets.push({
        key: `area:${mk.area}`,
        pos() { const s = screens[i]; p.x = s.x; p.y = s.y; p.hit = Math.max(12, s.r + 6); p.live = s.facing > 0.15 && s.inLens && globe.reveal() > 0.9 && globe.fade() > 0.5; return p; },
        lines: () => [mk.name, `AREA · ${photos}`],
        name: () => `${mk.name}: the area of ${n} photograph${n > 1 ? 's' : ''}. Turn the Earth to it`,
        focus(on) {
          focusMark = on ? mk.id : null; markHover();
          if (on) turnTo(mk.lat, mk.lon, 'place');
          globe.hold(on);
        },
        activate() { turnTo(mk.lat, mk.lon, 'place'); },
      });
    });
    /* F1a (design 14.2): Tokyo is one small point; its label stands outside the eye's footprint at the end of a short
       leader line, on the side away from the footprint's centre (over the sea east of Japan in the rest pose). It
       says what the live scene's callout says for Tokyo: its name and the JST clock. Not a control: no button. */
    const tokyoPos = { x: 0, y: 0, hit: 0, live: false }, tokyoBox = { x: 0, y: 0, x0: 0, y0: 0, x1: 0, y1: 0 };
    const LEADER_GAP = 14;
    targets.push({
      key: 'tokyo', button: false,
      pos() { tokyoPos.x = tk.x; tokyoPos.y = tk.y; return tokyoPos; },
      /* It stands only where the footprint is big enough to carry it (60 css px of radius: desktops). On a phone the
         footprint is about 42 px across and the label was larger than the thing it names, over the globe. */
      always: () => { const f = globe.footprint(); return f.alpha > 0.5 && f.r >= 60 && tk.facing > 0.3 && arrived; },
      place(w, h) {
        const f = globe.footprint();
        let dx = tk.x - f.x, dy = tk.y - f.y; const l = Math.hypot(dx, dy);
        if (l < 2) { dx = 0.9; dy = 0.44; } else { dx /= l; dy /= l; }
        /* phones: the level buttons hold the right edge beside the globe, so the label hangs straight below the
           footprint (over the sea south of Japan), centred under it; its top edge is the point nearest the centre */
        if (comp.phone) { dx = 0; dy = 1; }
        let ax = f.x + dx * (f.r + LEADER_GAP);
        const ay = f.y + dy * (f.r + LEADER_GAP);
        /* Step L1, review: left of the ring is the copy of the hero and the close. With Japan near the left limb
           the side away from the footprint's centre is the left, and the label stood in that copy, on a heading
           at 1024 x 768. There it stands on the other side of the footprint, over the globe. */
        if (!comp.phone && dx < 0 && ax - w < comp.cx - comp.r) { dx = -dx; ax = f.x + dx * (f.r + LEADER_GAP); }
        tokyoBox.x = comp.phone ? ax - w / 2 : (dx >= 0 ? ax : ax - w); tokyoBox.y = dy >= 0 ? ay : ay - h;
        tokyoBox.x0 = tk.x; tokyoBox.y0 = tk.y; tokyoBox.x1 = ax; tokyoBox.y1 = ay;
        return tokyoBox;
      },
      lines: () => ['TOKYO', `BASE: JST ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' })}`],
      tone: () => 'event',
      name: () => 'Tokyo',
      activate() {},
    });
    overlay = createOverlay({
      targets,
      onHover(key) { const i = targets.findIndex(t => t.key === key) - 1; hoverMark = i >= 0 ? globe.marks[i].id : null; markHover(); if (still) redraw(); },
    });
    lastNight = globe.tokyoIsNight();
    labelsRoot = document.querySelector('.scene-labels');
  }

  if (sceneDebug) {
    window.__sceneDebugArrive = () => startArrival(true);
    window.__sceneVeil = () => veil.debug(true);   // the copy boxes the veil dims (document css px)
    window.__sceneDebug = () => ({
      engine: 'next', quality: still ? 'reduced' : tier, tier, reduced, lite: tier === 'lite', still,
      dpr: Math.min(globalThis.devicePixelRatio || 1, profile.dprCap), rendererDpr: renderer.getPixelRatio(),
      renderPath: 'direct', fps: Math.round(fpsEMA), drawCalls, frames, running, programs: renderer.info.programs?.length ?? null,
      dots: globe.count, candidates: globe.candidates, streaks: weather.streaks, ripples: weather.ripples, stars: stars.count,
      beam: profile.beam, mode, arrived, modeLog: [...modeLog], section: story.section(),
      ...story.debug(), arrivals: [...arrivals], veilMask: veil.debug(), controls: controls?.debug() ?? null, late: { ...late }, cities: globe.citiesSet(),
      canvas: [canvas.width, canvas.height], pixels: canvas.width * canvas.height, pixelBudget: PIXEL_BUDGET,
      presence: { e: +PRES.e.toFixed(4), y: Math.round(PRES.y), closeAt: Math.round(PRES.closeAt), disc: { cx: Math.round(disc.cx), cy: Math.round(disc.cy), r: Math.round(disc.r) } },
      stageBands: (() => { const out = [], zt = scrollY + stage.zone[0] + PRES.dy, zb = scrollY + stage.zone[1] + PRES.dy + PRES.dr * 2; for (let i = 0; i < stage.n && out.length < 8; i++) if (stage.bands[2 * i + 1] > zt && stage.bands[2 * i] < zb) out.push([Math.round(stage.bands[2 * i]), Math.round(stage.bands[2 * i + 1])]); return { zone: [Math.round(zt), Math.round(zb)], in: out, moving: stage.moving.map(m => [Math.round(m.top), Math.round(m.bottom), m.k]) }; })(),
      stage: { strength: +stage.k.toFixed(4), zone: stage.zone.map(v => +v.toFixed(1)), phone: comp.phone, y: stage.y, bands: stage.n, measures: stage.measures },
      viewport: [W, H], layout: { cx: Math.round(comp.cx), cy: Math.round(comp.cy), r: Math.round(comp.r), phone: comp.phone, horizon: +comp.horizon.toFixed(3) },
      firstFrameMs: firstFrameAt === null ? null : Math.round(firstFrameAt - scriptStart),
      firstFrameAt: firstFrameAt === null ? null : Math.round(firstFrameAt),
      eye: { ...eye.debug(), label: overlay?.debug().eye ?? null },
      places: PHOTO_PLACES.map(p => ({ ...p })),
      marks: globe.placeMarks().map((s, i) => ({ area: s.area, name: globe.marks[i].name, region: globe.marks[i].region, files: [...globe.marks[i].files], x: +s.x.toFixed(1), y: +s.y.toFixed(1), r: +s.r.toFixed(2), facing: +s.facing.toFixed(3) })),
      labels: overlay?.debug() ?? null,
      view: (() => { const f = globe.facing(); return { lat: +f.lat.toFixed(3), lon: +f.lon.toFixed(3) }; })(),
      turn: globe.turning(), lastTurn,
      sky: { ...stars.debug(), restRedraws, atFirstFrame: starsAtFirstFrame },
      motion: { on: motionOn, lean: +M.lean.toFixed(4), travel: +M.travel.toFixed(3), owed: +M.owed.toFixed(3), vel: +M.vel.toFixed(2), pointer: +M.ptr.toFixed(3),
        sky: +M.sky.toFixed(5), skyOwed: +(Math.abs(M.skyMOwed) * SKY_SCROLL + Math.abs(M.skyLzOwed) * SKY_PUSH).toFixed(5), skyK },
      follow: { on: F.on, k: +F.k.toFixed(3) || 0, yaw: +F.outYaw.toFixed(3) || 0, pitch: +F.outPitch.toFixed(3) || 0 },
      lens: (() => { const v = globe.view(); return { dist: +v.dist.toFixed(5), fov: +v.fov.toFixed(3), limbPx: +v.limbPx.toFixed(2), ringPx: +v.ringPx.toFixed(2) }; })(),
      sun: (() => { const g = globe.geoOf(globe.U.uSun.value); return { lat: +g.lat.toFixed(3), lon: +g.lon.toFixed(3) }; })(),
      tokyo: { x: +tk.x.toFixed(1), y: +tk.y.toFixed(1), facing: +tk.facing.toFixed(3), world: [tk.wx, tk.wy, tk.wz].map(v => +v.toFixed(5)), markPx: +globe.tokyoMarkPx().toFixed(2) },
      // F1a
      dotsDrawn: globe.dotsDrawn(), japanBoxDots: globe.japanBoxDots(), detail: { ...detailState, ...globe.detail() },
      footprint: (() => { const f = globe.footprint(); return { x: +f.x.toFixed(1), y: +f.y.toFixed(1), r: +f.r.toFixed(2), alpha: +f.alpha.toFixed(3), drawn: f.alpha > 0.002 }; })(),
      japan: (() => { const j = globe.japan(); return { x: +j.x.toFixed(1), y: +j.y.toFixed(1), off: +j.off.toFixed(4) }; })(),
      pose: (() => { const p = globe.pose(), h = globe.hero(); return { spin: +p.spin.toFixed(4), tilt: +p.tilt.toFixed(4), heroSpin: +h.spin.toFixed(4), heroTilt: +h.tilt.toFixed(4) }; })(),
    });
    /** Tile dots facing the viewer inside a screen rectangle (css px); null before the detail lands. */
    window.__sceneDebugLandIn = (x0, y0, x1, y1) => globe.tileDotsIn(x0, y0, x1, y1);
    /** Run the scene's own clock forward by `seconds` in `dt` steps (no drawing) and report Japan's largest offset from
        the disc's centre, in disc radii: the rest-pose test reads scene time, never the wall clock. */
    window.__sceneDebugRun = (seconds, dt = 1 / 30) => {
      let worst = 0;
      for (let t = 0; t < seconds; t += dt) { step(dt); worst = Math.max(worst, globe.japan().off); }
      if (!still) draw();
      return +worst.toFixed(4);
    };
  }

  // ---------------------------------------------------------------- go: size, mount, compile, then the first frame
  layout();
  step(0);
  eye.park();          // the eye starts (and under reduced motion stays) at the point of its ring nearest Tokyo
  mountOverlay();
  step(0);
  mount.appendChild(canvas);
  { const first = sectionInView(); if (first !== 'home') { story.focus(first); controls?.setSection(story.section()); } }   // a page opened (or restored) below the hero
  if (typeof ResizeObserver === 'function') {
    const main = document.getElementById('main');
    if (main) new ResizeObserver(() => { veil.invalidate(); redrawVeil(); scheduleMeasure(); }).observe(main);
  }
  addEventListener('scroll', redrawVeil, { passive: true });
  addEventListener('scroll', stageScrolled, { passive: true });
  veil.onCollect(redrawVeil);
  veil.invalidate();
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; stop(); });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; if (still) { if (started) stillFrame(true); } else start(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  const relayout = () => { if (!still) needsLayout = true; else if (started) stillFrame(); };
  addEventListener('resize', relayout, { passive: true });
  document.fonts?.ready?.then(() => { veil.invalidate(); relayout(); redrawVeil(); });   // the copy may re-wrap once the fonts land: the phone composition and the veil read it
  if (!still) {
    if (mode === 'ring') {
      if (document.body.hasAttribute('data-booting')) document.addEventListener('boot:done', startArrival, { once: true });
      else startArrival();   // the boot was skipped or is over: arrive now
    }
  }
  /* Compile every program in parallel before the first frame (KHR_parallel_shader_compile where the
     driver has it), bounded and fail-open, as the live scene does. three r187 compiles hidden objects
     too, so the globe (hidden while the page arrives as the pure ring) is linked here, not mid-arrival:
     __sceneDebug().programs is the same while the ring is held and after the Earth has assembled
     (15 since step 1b: the eye is one more; 16 since step 2: the veil). */
  const begin = () => {
    if (started) return;
    started = true;
    if (still) stillFrame(); else start();
  };
  const precompile = typeof renderer.compileAsync === 'function'
    ? Promise.resolve().then(() => renderer.compileAsync(scene, globe.camera)).catch(() => {})
    : Promise.resolve();
  Promise.race([precompile, new Promise(resolve => setTimeout(resolve, 1500))]).then(begin);
  return { renderer, still, tier };
}
