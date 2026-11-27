/* The journey (design 2026-11-26, section 5; plan, step 2): each section of the page names a level and a view,
   and arriving at a section moves the camera there. In the open layout (SECTIONS, below) every section names
   the hero's own view, so scrolling moves nothing; the levels are the visitor's to choose (the controls).

   LEVELS are named things. Each has a zoom and its own draw set; a move cross-fades the draw sets at its
   midpoint (the dominant level switches when the move is half done, and every draw set eases to its share).
   Until steps 3 and 4 land, Japan and Tokyo are the orbit level's draw set seen from lower down: the camera
   descends and its lens widens, so the Earth stays a ball in the ring at every level (globe.mjs, placeCamera).
   They will get draw sets of their own there, drawn on the globe, and nothing else here changes. The ring level
   has no draw set: the Earth, the eye and the marks fade out, and the ring's dark body comes back (the
   arrival's pure ring); the rain and the floor stay.

   A move: a turn, then the descent (or the climb, then the turn), eased, about 1.5 s. Every channel is a
   two-stage critically damped spring (an S-shaped ease with continuous velocity), so a new section in the
   middle of a move retargets it from where it is, at the speed it has: nothing jumps. Reduced motion: every
   change is a cut (no travel, no cross-fade).

   The eye guides: in each move it travels along its ring to the point in front of the Earth, over the place
   the view faces; it drifts only when nothing asks it to move (the hero). The ring level: it is gone with the Earth.

   Taking over (controls.mjs): the visitor can change the level and turn or pan the view; after IDLE_MS with
   no input the view eases back to the section's own.

   Copy always wins: the veil (createVeil, below) dims the scene under the section's text, every frame,
   wherever that text sits; the hero is the approved composition and is left as it is. */
import * as THREE from 'three';
import { TOKYO, DALLAS, latLonToXYZ, xyzToLatLon } from './data/places.mjs?v=2';
import { EYE_PERIOD_S } from './eye.mjs?v=2';

export const IDLE_MS = 4000;
const LZ_FULL = Math.log(8);

/** The levels. depth orders the three the visitor can choose (orbit, japan, tokyo); no section names the ring now (it stays for the arrival's look and a caller's own table). */
export const LEVELS = {
  ring: { name: 'ring', depth: -1, zoom: 1, draw: null, word: null },
  orbit: { name: 'orbit', depth: 0, zoom: 1, draw: 'globe', word: 'ORBIT', label: 'EARTH' },
  japan: { name: 'japan', depth: 1, zoom: 3.6, draw: 'globe', word: 'JAPAN', label: 'JAPAN', place: { lat: 36.6, lon: 137.6 } },
  tokyo: { name: 'tokyo', depth: 2, zoom: 5.4, draw: 'globe', word: 'TOKYO', label: 'TOKYO', place: { lat: TOKYO.lat, lon: TOKYO.lon } },
};
export const LADDER = ['orbit', 'japan', 'tokyo'];

/* The sections (the open layout: the Earth is the opening and the closing shot). level: the view's level; look:
   where the Earth faces; eye: front (over the place), drift (the hero) or gone; veil: how much the scene dims
   under the copy (0 on the hero: the approved composition). The sections between keep the hero's view and
   level, so nothing of the scene changes while the Earth is out of sight (a change of level would push the
   floor); the close is the hero's own view again, Tokyo's light facing the visitor. */
const HERO_VIEW = { level: 'orbit', look: 'hero', eye: 'drift' };
export const SECTIONS = {
  /* veil 0.4, not 1: with the Earth gone there is only the room's low light under the copy, and a full veil cut
     dark boxes out of the glow along the horizon. Projects takes 0.75: its rows carry small muted lines (14 px on
     phones) that stood on the horizon's glow at 4.04:1 with 0.4 and 4.45:1 with 0.6 (qa:contrast, 2026-11-27) */
  home: { ...HERO_VIEW, veil: 0 }, about: { ...HERO_VIEW, veil: 0.4 }, work: { ...HERO_VIEW, veil: 0.4 },
  gallery: { ...HERO_VIEW, veil: 0.4 }, projects: { ...HERO_VIEW, veil: 0.75 }, contact: { ...HERO_VIEW, veil: 0 },
};
const SECTIONS_TABLE = SECTIONS;   // createStory's own SECTIONS shadows the export
const wrapPi = a => Math.atan2(Math.sin(a), Math.cos(a));
const OMEGA_EYE = (2 * Math.PI) / EYE_PERIOD_S;

/* One channel: two critically damped stages in series (a follows the target, b follows a; b is the output).
   Closed form per stage, so any dt is stable. */
function channel(x = 0, w = 8) { return { a: x, av: 0, b: x, bv: 0, w }; }
function stage(x, v, target, w, dt) {
  const d = x - target, e = Math.exp(-w * dt), k = v + w * d;
  return [target + (d + k * dt) * e, (v - w * k * dt) * e];
}
function stepChannel(c, target, dt) {
  [c.a, c.av] = stage(c.a, c.av, target, c.w, dt);
  [c.b, c.bv] = stage(c.b, c.bv, c.a, c.w, dt);
}
function setChannel(c, x, v = 0) { c.a = x; c.b = x; c.av = v; c.bv = v; }
const settled = (c, target, eps) => Math.abs(c.b - target) < eps && Math.abs(c.a - target) < eps && Math.abs(c.bv) < eps * 6;

export function createStory({ globe, eye, drawSets, still = false, onArrive = () => {}, onLevel = () => {}, sections = null }) {
  const SECTIONS = sections || SECTIONS_TABLE;   // a caller (a unit test) may pass a table of its own
  const routeMid = (() => {
    const a = latLonToXYZ(DALLAS.lat, DALLAS.lon), b = latLonToXYZ(TOKYO.lat, TOKYO.lon);
    return xyzToLatLon(a[0] + b[0], a[1] + b[1], a[2] + b[2]);
  })();
  const p0 = globe.pose();
  const C = {
    spin: channel(p0.spin, 9), tilt: channel(p0.tilt, 9), lz: channel(0, 8.5),
    eye: channel(eye.angle(), 7.5), solid: channel(0, 7.5), veil: channel(0, 8),
  };
  const alpha = Object.fromEntries(Object.keys(drawSets).map(k => [k, channel(1, 9)]));
  // the target view
  const T = { spin: p0.spin, tilt: p0.tilt, lz: 0, eye: 'drift', solid: 0, veil: 0, level: 'orbit', free: true };
  let section = 'home', dominant = 'orbit';
  let free = true;                 // the hero at rest: the globe's own idle turn and the eye's drift
  let move = null;                 // { cause, to, D0, switched, gateTurn, gateZoom }
  let takenOver = false, holding = false, idleTimer = 0;
  const stats = { moves: 0, cuts: 0, retargets: 0, userTurn: 0, lastPick: null, lastMoveS: null };

  // ---------------------------------------------------------------- views
  function lookAt(look) {
    if (look === 'hero') { const h = globe.hero(); return { spin: C.spin.b + wrapPi(h.spin - C.spin.b), tilt: h.tilt }; }
    if (look === 'stay') return { spin: C.spin.b, tilt: C.tilt.b };
    let g = null;
    if (look === 'route') g = routeMid;
    else if (look === 'night') { const s = globe.sun; g = xyzToLatLon(-s.x, -s.y, -s.z); }   // the antisolar point
    else if (LEVELS[look]?.place) g = LEVELS[look].place;
    else if (look && Number.isFinite(look.lat)) g = look;
    return g ? globe.poseFor(g.lat, g.lon, C.spin.b) : { spin: C.spin.b, tilt: C.tilt.b };
  }
  function sectionView(id) {
    const s = SECTIONS[id] || SECTIONS.home, L = LEVELS[s.level];
    const p = lookAt(s.look);
    Object.assign(T, { spin: p.spin, tilt: p.tilt, lz: Math.log(L.zoom), eye: s.eye, solid: L.draw ? 0 : 1, veil: s.veil, level: L.name, free: s.look === 'hero' });
  }
  const eyeTarget = () => { const f = eye.frontAngle(); return C.eye.b + wrapPi(f - C.eye.b); };
  const turnDist = () => Math.hypot(wrapPi(T.spin - C.spin.b), T.tilt - C.tilt.b);
  const distance = () => turnDist() + Math.abs(T.lz - C.lz.b) / LZ_FULL + Math.abs(T.solid - C.solid.b);

  // ---------------------------------------------------------------- moves and cuts
  function leaveFree() {
    if (!free) return;
    free = false;
    const p = globe.pose();
    setChannel(C.spin, p.spin); setChannel(C.tilt, p.tilt);
    setChannel(C.eye, eye.angle(), -OMEGA_EYE);   // it was drifting: carry its speed into the move
    globe.drive(true);
  }
  function setDominant(level) {
    if (level === dominant) return;
    dominant = level;
    onLevel(level);
  }
  function apply() {
    globe.setPose(C.spin.b, C.tilt.b);
    globe.setZoom(Math.exp(C.lz.b));
    if (T.eye === 'front' || (T.eye === 'gone' && !free)) eye.setAngle(C.eye.b);
    for (const [k, c] of Object.entries(alpha)) drawSets[k].set(Math.min(1, Math.max(0, c.b)));
  }
  function cut(cause) {
    leaveFree();
    move = null;
    setChannel(C.spin, T.spin); setChannel(C.tilt, T.tilt); setChannel(C.lz, T.lz);
    setChannel(C.solid, T.solid); setChannel(C.veil, T.veil);
    if (T.eye === 'front') setChannel(C.eye, eyeTarget());
    else if (T.eye === 'drift' && T.free) eye.park();   // reduced motion: the eye's one place is over Tokyo
    setDominant(T.level);
    for (const [k, c] of Object.entries(alpha)) setChannel(c, LEVELS[dominant].draw === k ? 1 : 0);
    stats.cuts++;
    apply();
    if (T.free && !takenOver) { free = true; globe.drive(false); }
    onArrive({ level: dominant, cause, section });
  }
  function startMove(cause) {
    if (still) { cut(cause); return; }
    leaveFree();
    if (move) stats.retargets++;
    stats.moves++;
    const D0 = distance();
    const descend = T.lz > C.lz.b + 1e-3, climb = T.lz < C.lz.b - 1e-3;
    move = { t: 0, cause, to: T.level, D0, switched: dominant === T.level, gateZoom: descend && turnDist() > 0.02, gateTurn: climb, turn0: turnDist(), lz0: C.lz.b };
  }
  function arrive() {
    const m = move;
    stats.lastMoveS = +m.t.toFixed(2);
    move = null;
    if (T.free && !takenOver) { free = true; globe.drive(false); }
    onArrive({ level: dominant, cause: m.cause, section });
  }

  // ---------------------------------------------------------------- per frame
  function update(dt) {
    if (free && !move) {
      // the hero at rest: follow the globe's idle turn so the next move starts where the Earth is
      const p = globe.pose();
      setChannel(C.spin, p.spin); setChannel(C.tilt, p.tilt); setChannel(C.eye, eye.angle(), -OMEGA_EYE);
      stepChannel(C.veil, T.veil, dt); stepChannel(C.solid, T.solid, dt);
      for (const [k, c] of Object.entries(alpha)) stepChannel(c, LEVELS[dominant].draw === k ? 1 : 0, dt);
      for (const [k, c] of Object.entries(alpha)) drawSets[k].set(Math.min(1, Math.max(0, c.b)));
      globe.setZoom(Math.exp(C.lz.b));
      return;
    }
    let spinT = T.spin, tiltT = T.tilt, lzT = T.lz;
    if (move) move.t += dt;
    if (move) {
      // a turn, then the descent; for a climb, the climb leads and the turn follows
      if (move.gateZoom && turnDist() > move.turn0 * 0.6) lzT = C.lz.a;
      else move.gateZoom = false;
      if (move.gateTurn && Math.abs(C.lz.b - T.lz) > Math.abs(move.lz0 - T.lz) * 0.6) { spinT = C.spin.a; tiltT = C.tilt.a; }
      else move.gateTurn = false;
    }
    stepChannel(C.spin, spinT, dt); stepChannel(C.tilt, tiltT, dt); stepChannel(C.lz, lzT, dt);
    stepChannel(C.solid, T.solid, dt); stepChannel(C.veil, T.veil, dt);
    const eyeT = T.eye === 'front' ? eyeTarget() : C.eye.b;
    if (T.eye === 'front') stepChannel(C.eye, eyeT, dt);
    if (move && !move.switched && (move.D0 < 2e-3 || 1 - distance() / move.D0 >= 0.5)) { move.switched = true; setDominant(move.to); }
    for (const [k, c] of Object.entries(alpha)) stepChannel(c, LEVELS[dominant].draw === k ? 1 : 0, dt);
    apply();
    if (move && move.switched && !move.gateZoom && !move.gateTurn
      && settled(C.spin, T.spin, 0.003) && settled(C.tilt, T.tilt, 0.003) && settled(C.lz, T.lz, 0.006)
      && settled(C.solid, T.solid, 0.006) && (T.eye !== 'front' || settled(C.eye, eyeT, 0.004))
      && Object.entries(alpha).every(([k, c]) => settled(c, LEVELS[dominant].draw === k ? 1 : 0, 0.004))) arrive();
  }

  // ---------------------------------------------------------------- the page's sections
  function focus(id) {
    const next = SECTIONS[id] ? id : 'home';
    if (next === section && !takenOver) return;   // the same section again: nothing to do
    section = next;
    takenOver = false; clearTimeout(idleTimer);
    leaveFree();
    sectionView(section);
    startMove('section');
  }

  // ---------------------------------------------------------------- taking over (controls.mjs)
  function armIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { if (holding) armIdle(); else if (takenOver) release(); }, IDLE_MS);
  }
  function takeOver({ level = null, lat = null, lon = null, why = 'controls' } = {}) {
    takenOver = true; armIdle();
    leaveFree();
    const L = LEVELS[level || T.level] || LEVELS.orbit;
    const p = Number.isFinite(lat) && Number.isFinite(lon) ? globe.poseFor(lat, lon, C.spin.b) : (level && L.place && level !== T.level ? lookAt(level) : { spin: C.spin.b, tilt: C.tilt.b });
    if (Number.isFinite(lat) && Number.isFinite(lon)) stats.lastPick = { lat: +lat.toFixed(3), lon: +lon.toFixed(3), why };
    const s = SECTIONS[section] || SECTIONS.home;
    Object.assign(T, { spin: p.spin, tilt: p.tilt, lz: Math.log(L.zoom), solid: L.draw ? 0 : 1, level: L.name, free: false, eye: s.eye === 'gone' ? 'front' : s.eye });
    startMove('takeover');
  }
  /** One level deeper (+1) or up (-1), centred on lat/lon when given, else on whatever faces the viewer. */
  function stepLevel(dir, at = null) {
    const i = LADDER.indexOf(T.level);
    const next = i < 0 ? 'orbit' : LADDER[Math.max(0, Math.min(LADDER.length - 1, i + dir))];
    if (next === T.level && !at) { takenOver = true; armIdle(); return false; }
    if (at) takeOver({ level: next, lat: at.lat, lon: at.lon, why: at.why || 'pick' });
    else takeOver({ level: next, ...globe.facing() });
    return true;
  }
  /** Turn (orbit) or pan (below orbit) by a screen distance in css px. immediate: follow a finger or a mouse. */
  function nudge(dx, dy, immediate = true) {
    leaveFree();
    takenOver = true; armIdle();
    if (move && immediate) move = null;   // a hand on the globe wins over a move in flight
    const k = 1 / (globe.layout.r * 1.1 * Math.exp(C.lz.b));   // radians per css px at the point that faces the viewer
    const ds = dx * k, dt = dy * k;
    stats.userTurn = +(stats.userTurn + Math.abs(ds) + Math.abs(dt)).toFixed(4);
    T.spin = (immediate ? C.spin.b : T.spin) + ds;
    T.tilt = Math.max(-1.3, Math.min(1.3, (immediate ? C.tilt.b : T.tilt) + dt));
    T.free = false;
    if (immediate) { setChannel(C.spin, T.spin); setChannel(C.tilt, T.tilt); apply(); }
    else if (!move) startMove('takeover');
  }
  /** Escape, or the idle timer: back to the section's own view. */
  function release() {
    clearTimeout(idleTimer);
    if (!takenOver) return;
    takenOver = false;
    leaveFree();
    sectionView(section);
    startMove('return');
  }
  function hold(on) { holding = on; if (!on && takenOver) armIdle(); }
  const moving = () => Boolean(move);

  return {
    LEVELS, focus, update, takeOver, stepLevel, nudge, release, hold,
    section: () => section, level: () => dominant, sectionLevel: () => (SECTIONS[section] || SECTIONS.home).level,
    viewLevel: () => T.level, takenOver: () => takenOver, moving, isFree: () => free && !move,
    solid: () => C.solid.b, veil: () => C.veil.b, eyeDrifts: () => free && !move && T.eye === 'drift',
    debug: () => ({
      level: dominant, sectionLevel: (SECTIONS[section] || SECTIONS.home).level, viewLevel: T.level, takenOver, moving: Boolean(move),
      zoom: +Math.exp(C.lz.b).toFixed(3), free, moves: stats.moves, cuts: stats.cuts, retargets: stats.retargets,
      userTurn: stats.userTurn, lastPick: stats.lastPick, lastMoveS: stats.lastMoveS, veil: +C.veil.b.toFixed(3), solid: +C.solid.b.toFixed(3),
      fade: Object.fromEntries(Object.entries(alpha).map(([k, c]) => [k, +c.b.toFixed(3)])),
    }),
  };
}

/* ---------------------------------------------------------------- copy always wins: the veil
   A full-screen pass drawn last: the page's own floor colour (--void #05060a) laid over the scene, with an
   alpha that is VEIL_MAX inside the section's text boxes (LARGE_K of it under large type; feathered over four
   cells) and only where the scene is
   bright: on and around the globe's disc and in its reflection column on the floor (full), and over the rest of
   the wet floor, whose grid and ripples are quieter (FLOOR_K of it). Over the plain night sky it does nothing (the
   copy is already the brighter thing there, and no dark card is drawn behind it); where
   the globe, the ring or the reflections pass under a paragraph they sink toward the floor colour, so the copy
   always wins. The text boxes are read from the page once per layout (resize, fonts, a change of the main
   column's size, and a moment after each section change, when its reveals have landed), kept in document
   coordinates, and drawn into a small mask (one texel per CELL css px) whenever the page scrolls. */
const CELL = 8;
const PAD_X = 12, PAD_Y = 8;
const VEIL_MAX = 0.86;
const FLOOR_K = 0.85;
const SKY_K = 0.85;                           // F1b: the sky under copy (the real stars), as the quiet floor
const LARGE_K = 0.45;                         // large type (24 px and up, or 18.66 px bold): this share of the veil
const FEATHER = [0.1, 0.24, 0.45, 0.72];      // the mask's soft edge, outermost cell first (four cells, 32 css px)
const VOID = [5 / 255, 6 / 255, 10 / 255];
const SKIP = '.sr-only, .scene-levels, .scene-targets, script, style, noscript, template';

export function createVeil() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const U = {
    tMask: { value: tex }, uK: { value: 0 }, uScale: { value: new THREE.Vector2(1, 1) }, cVoid: { value: new THREE.Vector3(...VOID) },
    uDisc: { value: new THREE.Vector3(0, 0, 1) }, uHorizon: { value: 0 },   // device px, gl_FragCoord space (y up)
  };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */`
      #define FLOOR_K ${FLOOR_K.toFixed(2)}
      #define SKY_K ${SKY_K.toFixed(2)}
      uniform sampler2D tMask; uniform float uK, uHorizon; uniform vec2 uScale; uniform vec3 cVoid, uDisc;
      varying vec2 vUv;
      void main(){
        vec2 p = gl_FragCoord.xy;
        float d = length(p - uDisc.xy) / uDisc.z;
        float disc = 1.0 - smoothstep(1.08, 1.6, d);                                     // the globe, the ring and its halo
        float floorK = 1.0 - smoothstep(uHorizon - 6.0, uHorizon + 6.0, p.y);            // the wet floor, below the horizon
        float column = floorK * (1.0 - smoothstep(0.85, 1.7, abs(p.x - uDisc.x) / uDisc.z));   // the globe's reflection on it
        // the rest of the floor (grid, ripples, glints) is quieter: FLOOR_K of the veil is enough there
        // F1b: the sky too (the real stars under a paragraph), at SKY_K; over plain void it changes nothing
        float m = texture2D(tMask, vec2(vUv.x * uScale.x, 1.0 - (1.0 - vUv.y) * uScale.y)).r * uK * max(max(max(disc, column), floorK * FLOOR_K), (1.0 - floorK) * SKY_K);
        gl_FragColor = vec4(cVoid * m, m);   // premultiplied: dst * (1 - m) + void * m
      }`,
    transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = 100; mesh.visible = false;

  let boxes = [];                  // [x, yDoc, w, h], css px
  let drawnY = NaN, drawnW = 0, drawnH = 0, any = false, queued = 0;
  /* Reading the copy's boxes forces a layout, so it never runs inside a frame: it is queued for idle time
     (measured: run inside the first frame that left the hero it cost 200 ms on the phone profile). Until it
     lands the mask keeps the boxes it has. */
  function collect() {
    queued = 0;
    const main = document.getElementById('main');
    boxes = [];
    if (main) {
      const per = new Map();
      const range = document.createRange();
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      const sy = scrollY;
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.nodeValue.trim()) continue;
        const el = n.parentElement;
        if (!el || el.closest(SKIP)) continue;
        range.selectNodeContents(n);
        const b = range.getBoundingClientRect();
        if (b.width < 2 || b.height < 2) continue;
        const u = per.get(el);
        if (u) { u[0] = Math.min(u[0], b.left); u[1] = Math.min(u[1], b.top + sy); u[2] = Math.max(u[2], b.right); u[3] = Math.max(u[3], b.bottom + sy); }
        else per.set(el, [b.left, b.top + sy, b.right, b.bottom + sy]);
      }
      for (const [el, [l, t, r, bt]] of per) {
        // large type stays readable on far less (it needs 3:1, not 4.5:1), so it takes a lighter veil and the
        // headings no longer cut blocks out of the ring
        const cs = getComputedStyle(el), px = parseFloat(cs.fontSize) || 0, bold = (parseInt(cs.fontWeight, 10) || 400) >= 700;
        const large = px >= 24 || (px >= 18.66 && bold);
        boxes.push([l - PAD_X, t - PAD_Y, r - l + 2 * PAD_X, bt - t + 2 * PAD_Y, large ? LARGE_K : 1]);
      }
    }
    drawnY = NaN;
    onCollect();
  }
  let onCollect = () => {};
  function invalidate() {
    if (queued) return;
    queued = typeof requestIdleCallback === 'function'
      ? requestIdleCallback(collect, { timeout: 600 })
      : setTimeout(collect, 60);
  }
  /** Draw the mask for this scroll position; true when it changed. */
  function paint(W, H) {
    const y = scrollY;
    if (y === drawnY && W === drawnW && H === drawnH) return false;
    const cw = Math.ceil(W / CELL) + 1, ch = Math.ceil(H / CELL) + 1;
    /* A change of size needs a new GPU texture: the renderer allocates fixed storage on the first upload (the
       scene's first frame primes the veil while the canvas still has its default 300 x 150), and a later
       upload of another size lands in a corner of the old storage, so the mask is drawn at the wrong scale
       (measured: the boxes at 0.6 of their x). dispose() makes the next upload allocate at the new size. */
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; tex.dispose(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch);
    ctx.globalCompositeOperation = 'lighten';   // the mask is the strongest box at each cell: overlaps never add up
    any = false;
    for (const [x, yd, w, h, k = 1] of boxes) {
      const top = yd - y;
      if (top > H + FEATHER.length * CELL || top + h < -FEATHER.length * CELL || x > W || x + w < 0) continue;
      const x0 = Math.floor(x / CELL), y0 = Math.floor(top / CELL);
      const x1 = Math.ceil((x + w) / CELL), y1 = Math.ceil((top + h) / CELL);
      // the feather: softer rings of cells from the outside in, then the box itself
      for (let i = 0; i <= FEATHER.length; i++) {
        const ring = FEATHER.length - i, v = Math.round(255 * k * (i < FEATHER.length ? FEATHER[i] : 1));
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x0 - ring, y0 - ring, x1 - x0 + 2 * ring, y1 - y0 + 2 * ring);
      }
      any = true;
    }
    U.uScale.value.set(W / (cw * CELL), H / (ch * CELL));
    tex.needsUpdate = true;
    drawnY = y; drawnW = W; drawnH = H;
    return true;
  }
  /** k: the section's veil (0..1); comp: the globe's disc and the horizon (css px); returns true when it changed. */
  function update(k, W, H, comp, dpr) {
    U.uK.value = VEIL_MAX * k;
    if (k < 0.002) {
      const was = mesh.visible; mesh.visible = false; return was;
    }
    U.uDisc.value.set(comp.cx * dpr, (H - comp.cy) * dpr, Math.max(1, comp.r * dpr));
    U.uHorizon.value = (1 - comp.horizon) * H * dpr;
    const changed = paint(W, H);
    const flip = any !== mesh.visible;
    mesh.visible = any;
    return changed || flip;
  }
  return {
    mesh, update, invalidate,
    /** Called once the copy's boxes have been read again (a still frame redraws then). */
    onCollect(fn) { onCollect = fn; },
    debug: (all = false) => ({ boxes: all ? boxes.map(b => b.slice(0, 4).map(v => Math.round(v))) : boxes.length, visible: mesh.visible, k: +U.uK.value.toFixed(3), drawnY }),
  };
}
