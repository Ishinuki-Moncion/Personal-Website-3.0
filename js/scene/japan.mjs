/* The Japan level (LV1, 2026-11-28; LV1c, the ink globe): each level is an era. EARTH is the future, the cyan hologram;
   JAPAN is feudal, an old painted globe: indigo paper wrapped on the ball, cream brush ink, gold. The Earth stays a
   ball here, seen through the ring's own lens as the hologram is (its edge on the ring), and everything is drawn ON it:
   it turns with the Earth's pose and the cursor follow (update() copies the Earth's world matrix every frame).
   next.mjs loads this module the first time the visitor heads for the Japan level (or shows the intent to: a pointer
   over, or focus on, the level buttons), never before.

   LV1c (the owner, 2026-11-28, on the flat sheet of LV1b: "Japan map looks dry and boring ... The old map zoom was more
   interesting since it wasn't flat and had surroundings"):
   - THE BALL. The paper is not a screen disc but the sphere itself: each pixel of the ring casts its ray onto the unit
     ball (paperBase), so the paper is shaded as a ball (darker toward the limb, a soft rim of light at it), carries
     faint ruled lines every 5 degrees as an old chart does (bending with the ball), takes the real sun (globe uSun: a
     deeper indigo by night, a warm band at dusk) and, by night, flecks of gold leaf where the night-light pictures the
     hologram uses are bright (lights-japan.png in the box, lights-world.png outside).
   - THE SURROUNDINGS. Every coast of the Japan box (Korea, the Russian coast and Sakhalin, China, Taiwan's tip) is
     drawn in the same brush at a lower strength (inkStrength: 1 for Japan, falling with the distance from the
     level's place for the neighbours), and beyond the box the world coast (passed in by next.mjs on the tiers that
     load the detail), the same rule carrying on, so the box's edge is no seam. Land takes the lighter-paper wash
     everywhere (the globe's land texture; the Japan tile inside the box), Japan's a little stronger.
   - THINGS THAT STAND UP. Mountains are small upright ink mounds standing on the ball, placed every frame from the
     Earth's pose (the cursor follow included): over most of the ball a peak stands toward the map's projected north,
     as a picture map stands its peaks, shorter where the ground is seen from straight above; toward the limb, where
     the ground is seen from the side, it turns to stand out along the surface's normal at its full height (PEAK_ABOVE,
     PEAK_TURN), so it is never drawn standing into the ball. Rows along the ranges of data/japan-map.mjs RANGES, single
     volcanoes from PEAKS, and the neighbours' ranges from data/relief-mask.mjs; Fuji larger, with a pale cap.
   - LIFE. The Tokaido, the Sanyo and the Tohoku trunk lines in red-brown, each with a travelling light; three faint
     air routes out of Tokyo that rise off the ball, each with a slow light; the season's drifters.

   LV1d (2026-11-28, on the approved ink globe):
   - PEAKS as brush marks: about half as many in Japan and larger (a range reads as a range), each two strokes of the
     brush from the summit, the firm one down the flank toward the real sun (vSun, from uSun in the vertex shader) over
     a dry wash, the other lighter and lifting off before the foot; the neighbours' sparser and smaller; Fuji the
     tallest, capped. North-south ridges stagger their marks so they never stack.
   - THE SEA: the Kuroshio and the Oyashio (data/japan-map.mjs CURRENTS) as a few long, fine lines each, swelling and
     breaking, the breaks drifting along them (uFlow; still under reduced motion); a small compass rose in thin gold,
     flat on the ball low on the Pacific side (COMPASS; not on a phone's ring).
   - THE SUN: the night/day turn and the dusk's warmth are narrow bands on the real day/night line (DAY_RAMP, DUSK_HW).
   - Fixes: SEOUL over the Yellow Sea; the Sapporo and Naha air routes dropped (they ran beside the Tohoku line and the
     Kuroshio): one route, to Fukuoka.
   LV1e (2026-11-28): TODAY'S CLOUDS as floating brush clouds (placeClouds, setClouds): the Earth level's own field
   (clouds.mjs, never fetched twice; none when it is stale or missing) drawn as small curl-cloud glyphs where it is
   high, lifted a little off the paper with a soft shadow under each, away from the sun; over land only in the field's
   top band, rarely over Japan; drifting slowly east; still under reduced motion. (Two earlier tries, a blurred wash and
   outlined masses, read as fog and as extra land: gone.)

   Draw calls when shown: the paper (one quad over the ring), the ink (one instanced mesh: coasts, dabs, roads,
   stations, peaks, the air route, the currents, the compass, the seal), the clouds' shadows and the clouds (two
   instanced meshes, only with fresh cloud data), the season's drifters; and on the lite tier (no land texture) the
   Japan wash's triangles as before.

   The draw-in, once per page: the paper fades in with the level, then the coast grows along its length (about 1.2 s),
   the wash and (by night) the gold come up, then the roads, the peaks rise, the air routes, the seal. After that only
   the travelling lights, the gold's glint as the ball turns, and the drifters move. Under reduced motion it is simply
   there.

   Everything above createJapanMap() is pure (no DOM, no three.js): tests/unit/japan-brush.test.mjs runs it in Node. */
import { TOKAIDO, SEA_LEG, SANYO, TOHOKU, HANEDA, AIR, PEAKS, RANGES, FUJI, MIST, LABELS, NEAR_LABELS, CURRENTS, COMPASS } from './data/japan-map.mjs?v=1';
import { decodeCoastJapan } from './data/coast-japan.mjs?v=1';
import { makeLandLookup } from './data/land-mask.mjs?v=1';

const DEG = Math.PI / 180;
const R_MAP = 1.0015;                    // on the surface, as the coast lines (detail.mjs)
export const CREAM = '#efe6d2';
export const SEAL = '#c8372d';
/** The trunk lines' red-brown (bengara, as an old road map draws its highways): kept short of the seal's red. */
export const ROAD = '#a8613f';
/** The gold: the leaf of the night side, the ruled lines, the mist (if a band returns). */
export const GOLD = '#e2b55a';
export const MIST_K = 0.19, MIST_HW = 7, FLECK_K = 0.55, FLECK_EVERY = 18;
/* Widths and marks are for the desktop disc (1440 x 900: 279 css px of radius); setScale scales them by the disc. */
export const REF_R = 279;
/** Below this share of the desktop disc the peaks and the air routes are not drawn (a phone's ring): they would be specks. */
export const PEAKS_MIN_SCALE = 0.75;

export const STYLE = { coast: 0, dab: 1, road: 2, station: 3, seal: 5, mist: 7, peak: 8, air: 9, current: 10, compass: 11 };

/* ---------------------------------------------------------------- Japan and the neighbours (the draft's rule, 3b)
   A line belongs to the neighbours when its centroid lies north-west of the line through (33.0N 126.0E), (35.3N
   130.2E), (43.0N 134.5E), (46.0N 141.0E) (end segments extended), or north of 45.7N east of 141.6E (Sakhalin); and
   the boxes for the Chinese islands south of 33N, Taiwan, and Jeju with Korea's southern islands. LV1c: the rule no
   longer hides the neighbours; it says how strongly they are drawn (inkStrength). */
const BORDER = [[33.0, 126.0], [35.3, 130.2], [43.0, 134.5], [46.0, 141.0]];
export function borderLon(lat) {
  let i = 0;
  while (i < BORDER.length - 2 && lat > BORDER[i + 1][0]) i++;
  const [la0, lo0] = BORDER[i], [la1, lo1] = BORDER[i + 1];
  return lo0 + ((lat - la0) / (la1 - la0)) * (lo1 - lo0);
}
export function isNeighbour(lat, lon) {
  if (lat > 45.7 && lon > 141.6) return true;
  if (lat < 33.0 && lat > 26.0 && lon < 124.0) return true;
  if (lat < 25.4 && lon < 122.6) return true;
  if (lat >= 33.0 && lat < 34.0 && lon < 127.5) return true;
  return lon < borderLon(lat);
}
/** The Japan tile's box (data/land-japan.mjs, data/coast-japan.mjs). */
export const BOX = { west: 122, east: 146, south: 24, north: 46 };
export const inBox = (lat, lon) => lat > BOX.south && lat < BOX.north && lon > BOX.west && lon < BOX.east;
const arcDeg = (la0, lo0, la1, lo1) => {
  const s = Math.sin(la0 * DEG) * Math.sin(la1 * DEG) + Math.cos(la0 * DEG) * Math.cos(la1 * DEG) * Math.cos((lo1 - lo0) * DEG);
  return Math.acos(Math.min(1, Math.max(-1, s))) / DEG;
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** The level's place (story.mjs LEVELS.japan.place): the neighbours fall off with their distance from it. */
export const JAPAN_C = { lat: 38.2, lon: 137.9 };
/** The neighbours' strength: NEAR_K[0] within NEAR_FALL[0] degrees of the level's place, falling to NEAR_K[1] by NEAR_FALL[1]. */
export const NEAR_K = [0.52, 0.3], NEAR_FALL = [6, 20];
export const nearK = (lat, lon) => NEAR_K[0] + (NEAR_K[1] - NEAR_K[0]) * smooth(NEAR_FALL[0], NEAR_FALL[1], arcDeg(lat, lon, JAPAN_C.lat, JAPAN_C.lon));
/** How strongly the ink is laid at a point: 1 for Japan, the neighbours' falling strength elsewhere (inside the box by
    the border rule, outside it always), so the strength runs on across the box's edge. */
export const inkStrength = (lat, lon) => (inBox(lat, lon) && !isNeighbour(lat, lon) ? 1 : nearK(lat, lon));

/* ---------------------------------------------------------------- the coast, prepared for a brush (pure)
   Degrees on a local plane: x = lon * kx (the cosine of the line's latitude; Japan's middle latitude for the box), y = lat. */
const KX = Math.cos(36 * DEG);
/** A line at least this across (degrees, its box's diagonal) is drawn as a stroke. */
export const LINE_MIN = 0.42;
/** Between DAB_MIN and LINE_MIN it may be a dab; under DAB_MIN it is left out. */
export const DAB_MIN = 0.13;
/** No two dabs nearer than this (degrees); no dab nearer than DAB_CLEAR to a drawn coast. */
export const DAB_GAP = 0.5;
export const DAB_CLEAR = 0.2;
/** Douglas-Peucker tolerance before smoothing (degrees): about a third of a css px is kept on the desktop. */
export const SIMPLIFY = 0.065;
/** The world coast is drawn for lines with a point within this many degrees of the level's place (the visitor may turn). */
export const WORLD_CAP = 55;

function simplify(pts, tol) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length); keep[0] = 1; keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i0, i1] = stack.pop();
    const [ax, ay] = pts[i0], [bx, by] = pts[i1];
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    let worst = -1, at = -1;
    for (let i = i0 + 1; i < i1; i++) {
      const [px, py] = pts[i];
      let t = L2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
      t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (d > worst) { worst = d; at = i; }
    }
    if (worst > tol) { keep[at] = 1; stack.push([i0, at], [at, i1]); }
  }
  return pts.filter((_, i) => keep[i]);
}
/** One pass of Chaikin's corner cutting: a brush's line has no corners sharper than its own width. */
function chaikin(pts, closed) {
  if (pts.length < 3) return pts.slice();
  const out = closed ? [] : [pts[0]];
  const n = pts.length, last = n - 1;
  for (let i = 0; i < last; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
  }
  if (closed) out.push(out[0]); else out.push(pts[n - 1]);
  return out;
}
/** The world coast outside the box, as [[lon, lat], ...] runs: a line entering the box ends on its edge (found by
    bisection), one leaving it starts there, so it meets the box's own coast; a line crossing the antimeridian splits. */
export function worldOutsideBox(world, cap = WORLD_CAP) {
  const { coords, offsets } = world;
  const runs = [];
  const edge = (ox, oy, ix, iy) => {   // out (ox, oy) to in (ix, iy): the point where it crosses the box's edge
    let a = 0, b = 1;
    for (let k = 0; k < 24; k++) { const m = (a + b) / 2; if (inBox(oy + (iy - oy) * m, ox + (ix - ox) * m)) b = m; else a = m; }
    return [ox + (ix - ox) * a, oy + (iy - oy) * a];
  };
  for (let k = 0; k + 1 < offsets.length; k++) {
    const p0 = offsets[k], p1 = offsets[k + 1];
    let near = false;
    for (let p = p0; p < p1 && !near; p++) if (arcDeg(coords[2 * p + 1], coords[2 * p], JAPAN_C.lat, JAPAN_C.lon) <= cap) near = true;
    if (!near) continue;
    let run = [];
    const flush = () => { if (run.length >= 2) runs.push(run); run = []; };
    for (let p = p0; p < p1; p++) {
      const lon = coords[2 * p], lat = coords[2 * p + 1], inside = inBox(lat, lon);
      if (p > p0) {
        const plon = coords[2 * p - 2], plat = coords[2 * p - 1], pin = inBox(plat, plon);
        if (Math.abs(lon - plon) > 180) flush();
        else if (!pin && inside) { run.push(edge(plon, plat, lon, lat)); flush(); }
        else if (pin && !inside) run = [edge(lon, lat, plon, plat)];
      }
      if (!inside) run.push([lon, lat]);
    }
    flush();
  }
  return runs;
}

/** The coast as the brush draws it: { strokes: [{ pts: [[lon, lat]], closed, len, extent, k, world }], dabs: [{ lat, lon, size, k }], stats }.
    The box's coast (Japan at full strength, the neighbours at theirs) and, when given, the world coast outside the box. */
export function prepareCoast(coast = decodeCoastJapan(), { world = null } = {}) {
  const { coords, offsets } = coast;
  const lines = [], small = [];
  const stats = { lines: offsets.length - 1, neighbours: 0, worldLines: 0, strokes: 0, dabs: 0, dropped: 0, points: 0 };
  const take = (src, world) => {
    let cl = 0, co = 0;
    for (const [lon, lat] of src) { co += lon; cl += lat; }
    cl /= src.length; co /= src.length;
    const k = world ? nearK(cl, co) : inkStrength(cl, co);
    const kx = world ? Math.max(0.2, Math.cos(cl * DEG)) : KX;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const pts = src.map(([lon, lat]) => { x0 = Math.min(x0, lon * kx); x1 = Math.max(x1, lon * kx); y0 = Math.min(y0, lat); y1 = Math.max(y1, lat); return [lon * kx, lat]; });
    const extent = Math.hypot(x1 - x0, y1 - y0);
    const [f, l] = [src[0], src[src.length - 1]];
    const closed = f[0] === l[0] && f[1] === l[1];
    if (extent >= LINE_MIN) { lines.push({ pts, closed, extent, k, kx, world }); if (k < 1) stats.neighbours++; if (world) stats.worldLines++; }
    else if (extent >= DAB_MIN) small.push({ lat: (y0 + y1) / 2, lon: (x0 + x1) / 2 / kx, extent, k });
    else stats.dropped++;
  };
  for (let k = 0; k + 1 < offsets.length; k++) {
    const p0 = offsets[k], p1 = offsets[k + 1];
    if (p1 - p0 < 2) { stats.dropped++; continue; }
    const src = [];
    for (let p = p0; p < p1; p++) src.push([coords[2 * p], coords[2 * p + 1]]);
    take(src, false);
  }
  if (world) for (const run of worldOutsideBox(world)) take(run, true);
  const strokes = lines.map(({ pts, closed, extent, k, kx, world: w }) => {
    let s = simplify(pts, SIMPLIFY);
    s = chaikin(s, closed);
    let len = 0;
    for (let i = 0; i + 1 < s.length; i++) len += Math.hypot(s[i + 1][0] - s[i][0], s[i + 1][1] - s[i][1]);
    stats.points += s.length;
    return { pts: s.map(([x, y]) => [x / kx, y]), closed, len, extent, k, world: w };
  }).filter(s => s.pts.length >= 2 && s.len > 0);
  stats.strokes = strokes.length;
  // the dabs: the largest first, each kept only clear of the coast and of the dabs already kept (a coarse grid for the test)
  const grid = new Map(), G = 1;
  const key = (x, y) => `${Math.floor(x / G)},${Math.floor(y / G)}`;
  for (const s of strokes) for (const [lon, lat] of s.pts) { const x = lon * KX, kk = key(x, lat); if (!grid.has(kk)) grid.set(kk, []); grid.get(kk).push(x, lat); }
  const near = (x, y, d) => {
    for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) {
      const c = grid.get(`${Math.floor(x / G) + gx},${Math.floor(y / G) + gy}`);
      if (c) for (let i = 0; i < c.length; i += 2) if (Math.abs(c[i] - x) < d && Math.abs(c[i + 1] - y) < d && Math.hypot(c[i] - x, c[i + 1] - y) < d) return true;
    }
    return false;
  };
  const dabs = [];
  small.sort((a, b) => b.extent - a.extent);
  for (const d of small) {
    const x = d.lon * KX, y = d.lat;
    if (near(x, y, DAB_CLEAR)) { stats.dropped++; continue; }
    if (dabs.some(o => Math.hypot(o.lon * KX - x, o.lat - y) < DAB_GAP)) { stats.dropped++; continue; }
    dabs.push({ lat: d.lat, lon: d.lon, size: d.extent, k: d.k });
  }
  stats.dabs = dabs.length;
  return { strokes, dabs, stats };
}

/* ---------------------------------------------------------------- the land's wash (pure): ear clipping
   The lite tier has no land texture: there the inside of each closed coast of Japan is triangulated, so Japan still
   takes its wash. Returns index triples into pts (the last point of a closed ring repeats the first and is left out). */
export function earClip(pts) {
  const n0 = pts.length - (pts.length > 2 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1] ? 1 : 0);
  if (n0 < 3) return [];
  let area = 0;
  for (let i = 0; i < n0; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n0]; area += x0 * y1 - x1 * y0; }
  const idx = [];
  for (let i = 0; i < n0; i++) idx.push(area > 0 ? i : n0 - 1 - i);   // counter-clockwise
  const cross = (a, b, c) => (pts[b][0] - pts[a][0]) * (pts[c][1] - pts[a][1]) - (pts[b][1] - pts[a][1]) * (pts[c][0] - pts[a][0]);
  const inside = (p, a, b, c) => cross(a, b, p) >= 0 && cross(b, c, p) >= 0 && cross(c, a, p) >= 0;
  const tris = [];
  let guard = 0;
  while (idx.length > 3 && guard < n0 * 2) {
    guard++;
    let cut = false;
    for (let i = 0; i < idx.length; i++) {
      const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length];
      if (cross(a, b, c) <= 1e-12) continue;   // reflex or flat: not an ear
      let ok = true;
      for (const p of idx) {
        if (p === a || p === b || p === c) continue;
        if (inside(p, a, b, c)) { ok = false; break; }
      }
      if (!ok) continue;
      tris.push(a, b, c); idx.splice(i, 1); cut = true; break;
    }
    if (!cut) {
      // no clean ear (a smoothed coast can touch itself at a narrow strait): cut the most convex corner anyway
      let best = 0, bestX = -Infinity;
      for (let i = 0; i < idx.length; i++) {
        const x = cross(idx[(i + idx.length - 1) % idx.length], idx[i], idx[(i + 1) % idx.length]);
        if (x > bestX) { bestX = x; best = i; }
      }
      tris.push(idx[(best + idx.length - 1) % idx.length], idx[best], idx[(best + 1) % idx.length]); idx.splice(best, 1);
    }
  }
  if (idx.length === 3) tris.push(idx[0], idx[1], idx[2]);
  return tris;
}

/* ---------------------------------------------------------------- the peaks (pure)
   Rows of small upright peaks along RANGES' ridges (one about every PEAK_STEP degrees, the middle of a range the
   tallest), Japan's other high volcanoes (PEAKS of PEAK_SINGLE_M metres or more, clear of the rows) as single peaks, and
   the neighbours' ranges from the relief mask (one peak in a cell, on land, within PEAK_CAP degrees of the level's
   place) at the neighbours' strength. h: the peak's height and w its half width at its foot, map px; k its strength. */
/* LV1d (2026-11-28): fewer and larger in Japan (about half LV1c's count: a range reads as a range of brush marks, not
   a field of pyramids), sizes varied; the neighbours sparser and smaller (one cell in NEAR_KEEP of the relief kept, one
   or two marks in it). */
export const PEAK_STEP = 0.62, PEAK_H = [13, 21], PEAK_SINGLE_M = 2000, PEAK_CAP = 24, NEAR_PEAK_H = [5.5, 8.5], PEAK_HALF = 0.5, NEAR_KEEP = 0.3, PEAK_STAGGER = 0.16;
/** Fuji's mark: its height and half width, map px; the tallest of all, and capped with snow. */
export const FUJI_PX = 27, FUJI_HALF = 23;
/** A peak seen from straight above stands at PEAK_ABOVE of its height (from the side, its full height); it stands toward
    the map's north on screen until the ground is seen this much from the side (the sine of the view's angle to the
    normal), then turns to stand out along the normal by PEAK_TURN[1]. */
export const PEAK_ABOVE = 0.78, PEAK_TURN = [0.93, 0.995];
const RELIEF_W = 384, RELIEF_H = 192;
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export function buildPeaks({ relief = null, land = makeLandLookup() } = {}) {
  const out = [];
  const fuji = PEAKS.find(p => p.name === FUJI);
  out.push({ lat: fuji.lat, lon: fuji.lon, h: FUJI_PX, w: FUJI_HALF, k: 1, fuji: true, range: -1 });
  RANGES.forEach((range, ri) => {
    for (const ridge of range.ridges) {
      const cum = [0];
      for (let i = 0; i + 1 < ridge.length; i++) cum.push(cum[i] + arcDeg(ridge[i][0], ridge[i][1], ridge[i + 1][0], ridge[i + 1][1]));
      const len = cum[cum.length - 1], n = Math.max(2, Math.round(len / PEAK_STEP) + 1);
      for (let j = 0; j < n; j++) {
        const d = len * (j + 0.5) / n;
        let i = 0; while (i < ridge.length - 2 && cum[i + 1] < d) i++;
        const t = (d - cum[i]) / Math.max(1e-9, cum[i + 1] - cum[i]);
        let lat = ridge[i][0] + (ridge[i + 1][0] - ridge[i][0]) * t, lon = ridge[i][1] + (ridge[i + 1][1] - ridge[i][1]) * t;
        /* LV1d: a ridge running north and south would stack its marks one on another (each stands toward the north);
           they are staggered east and west instead, as a painter staggers a range */
        const dl = Math.abs(ridge[ridge.length - 1][0] - ridge[0][0]), dn = Math.abs(ridge[ridge.length - 1][1] - ridge[0][1]) * Math.cos(lat * DEG);
        if (dl > dn) lon += (j % 2 ? 1 : -1) * PEAK_STAGGER / Math.cos(lat * DEG);
        const sd = ri * 31 + j * 7.3, mid = Math.sin(Math.PI * (j + 0.5) / n);
        const h = PEAK_H[0] + (PEAK_H[1] - PEAK_H[0]) * (0.25 + 0.75 * mid) * (0.55 + 0.45 * hash(sd));
        out.push({ lat: lat + (hash(sd + 1) - 0.5) * 0.12, lon: lon + (hash(sd + 2) - 0.5) * 0.16, h, w: h * PEAK_HALF * (0.8 + 0.45 * hash(sd + 3)), k: 1, fuji: false, range: ri });
      }
    }
  });
  const clear = (lat, lon, d) => out.every(p => arcDeg(lat, lon, p.lat, p.lon) >= d);
  PEAKS.forEach((p, i) => {
    if (p.name === FUJI || p.m < PEAK_SINGLE_M || !clear(p.lat, p.lon, 0.6)) return;
    const h = PEAK_H[0] * 0.95 + Math.min(1, (p.m - PEAK_SINGLE_M) / 1300) * 3.5;
    out.push({ lat: p.lat, lon: p.lon, h, w: h * PEAK_HALF, k: 1, fuji: false, range: -2 - i });
  });
  if (relief) {
    for (let cy = 0; cy < RELIEF_H; cy++) {
      const lat0 = 90 - (cy + 0.5) * 180 / RELIEF_H;
      if (Math.abs(lat0 - JAPAN_C.lat) > PEAK_CAP) continue;
      for (let cx = 0; cx < RELIEF_W; cx++) {
        const lon0 = -180 + (cx + 0.5) * 360 / RELIEF_W;
        if (!relief(lon0, lat0)) continue;
        // a range, not a lone cell: at least two of the eight cells around are relief too
        let around = 0;
        for (const [dy, dx] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) around += relief(lon0 + dx * 360 / RELIEF_W, lat0 - dy * 180 / RELIEF_H);
        if (around < 3) continue;
        const sd = cy * 977 + cx * 13.1;
        if (hash(sd + 9) >= NEAR_KEEP) continue;   // LV1d: sparser: one cell in about three
        // a small group: one or two peaks in a short row, the first the taller
        const ang = hash(sd + 5) * Math.PI, n = hash(sd + 6) > 0.55 ? 2 : 1;
        const lat1 = lat0 + (hash(sd) - 0.5) * 0.4, lon1 = lon0 + (hash(sd + 1) - 0.5) * 0.5;
        for (let j = 0; j < n; j++) {
          const o = (j - (n - 1) / 2) * 0.42, lat = lat1 + Math.sin(ang) * o * 0.6, lon = lon1 + Math.cos(ang) * o / Math.max(0.3, Math.cos(lat1 * DEG));
          if (arcDeg(lat, lon, JAPAN_C.lat, JAPAN_C.lon) > PEAK_CAP) continue;
          if (inBox(lat, lon) && !isNeighbour(lat, lon)) continue;   // Japan's own are the rows and the volcanoes
          let onLand = land(lon, lat);
          for (const [dy, dx] of [[0.45, 0], [-0.45, 0], [0, 0.55], [0, -0.55]]) onLand = onLand && land(lon + dx, lat + dy);
          if (!onLand) continue;
          const h = (NEAR_PEAK_H[0] + (NEAR_PEAK_H[1] - NEAR_PEAK_H[0]) * hash(sd + 2 + j)) * (j === 0 ? 1 : 0.8);
          out.push({ lat, lon, h, w: h * PEAK_HALF * (0.9 + 0.3 * hash(sd + 3 + j)), k: nearK(lat, lon) * 0.95, fuji: false, range: -100 });
        }
      }
    }
  }
  return out;
}

/* ---------------------------------------------------------------- the instances (pure)
   One instance, FLOATS floats:
     aA (3)  object point A          aB (3)  object point B (a station's tick: the road's next point; glyphs: A)
     aO (4)  glyphs: screen offsets of their two ends from A, map px (css px at the desktop disc), y up; a peak: its
             half width and height, map px
     aS (4)  sA, sB (where the segment lies along its brush stroke, 0..1), the stroke's length in degrees, a seed
     aT (3)  style, the draw-in's start (s), its duration (s)
     aW (3)  the brush's fullness at A and at B (strokes), or a glyph's size (a peak: 1 for Fuji); the quad's reach (map px)
     aX (4)  the ink's strength (1 Japan), the line's id (0 Tokaido, 1 Sanyo, 2 Tohoku, 3.. the air routes), the line's
             length in degrees (for its light), the colour (0 cream, 1 the roads' red-brown) */
export const FLOATS = 24;
/** The brush's angle (degrees from east, on the map): strokes across it are fullest. */
export const NIB = 40;
/** A coast is drawn as brush strokes of about this many degrees each: the brush lands, runs, lifts, and lands again. */
export const STROKE_DEG = 7.5;
function xyz(lat, lon, out, o = 0, r = R_MAP) {
  const p = (90 - lat) * DEG, q = (lon + 180) * DEG;
  out[o] = -r * Math.sin(p) * Math.cos(q); out[o + 1] = r * Math.cos(p); out[o + 2] = r * Math.sin(p) * Math.sin(q);
}
/** The brush's fullness for a stroke heading (radians on the local plane): 0.55 along the brush's angle, 1 across it. */
export const nibFactor = a => 0.55 + 0.45 * Math.abs(Math.sin(a - NIB * DEG));

/* The draw-in's timetable, seconds from the map's first showing. */
export const COAST_S = 1.2;
export const ROAD_AT = 1.15, ROAD_S = 0.6;
export const PEAKS_AT = 1.6, PEAKS_S = 0.7;
export const AIR_AT = 2.0, AIR_S = 0.6;
export const SEAL_AT = 2.25, SEAL_S = 0.18;
/** The air routes rise off the ball by this (Earth radii) at their middle for a 10-degree route, more for a longer one. */
export const AIR_LIFT = 0.006, AIR_SEG = 40;
/* LV1d: the sea. The currents (data/japan-map.mjs CURRENTS) come in with the coast's second half; their lines are at
   most CURRENT_K of the cream, and their swells drift along them at FLOW_DEG degrees a second (about 3 css px a second
   on the desktop's ring), each line a little faster or slower; under reduced motion they stand still. The compass
   rose comes up with the seal. */
export const CURRENT_AT = 0.7, CURRENT_S = 1.1, CURRENT_K = 0.28, FLOW_DEG = 0.11, CURRENT_STEP = 0.35;
export const COMPASS_AT = 2.25, COMPASS_S = 0.5;
/** The flow's clock in a still frame (reduced motion): fixed, so the still frame never changes. */
export const FLOW_STILL = 0;

/** A road's length along its stations (degrees), a sea leg left out. */
function roadDeg(stations, seaLeg = -1) { let t = 0; for (let i = 0; i + 1 < stations.length; i++) if (i !== seaLeg) t += arcDeg(stations[i].lat, stations[i].lon, stations[i + 1].lat, stations[i + 1].lon); return t; }
/** The Tokaido's length along its stations (degrees), the sea leg left out: the travelling light's scale. */
export const ROAD_DEG = roadDeg(TOKAIDO, SEA_LEG);
export const SANYO_DEG = roadDeg(SANYO), TOHOKU_DEG = roadDeg(TOHOKU);
/** The roads in the order of their ids, and when each starts to draw (the Sanyo from Kyoto when the Tokaido arrives there). */
export const ROADS = [
  { name: 'Tokaido', stations: TOKAIDO, seaLeg: SEA_LEG, deg: ROAD_DEG, at: ROAD_AT },
  { name: 'Sanyo', stations: SANYO, seaLeg: -1, deg: SANYO_DEG, at: ROAD_AT + ROAD_S * 0.9 },
  { name: 'Tohoku', stations: TOHOKU, seaLeg: -1, deg: TOHOKU_DEG, at: ROAD_AT + 0.05 },
];

/** LV1d: the currents' lines (pure): for each current its course smoothed (two passes of Chaikin on a local plane),
    then `lines` fine lines side by side `gap` degrees apart, each with a slow sway of its own and its own start and end
    (the middle one the longest and strongest), resampled about every CURRENT_STEP degrees. Each: { name, pts: [[lat,
    lon]], deg (its length), seed, k (its strength, 0..1), speed (its drift, a share of FLOW_DEG) }. */
export function currentLines(currents = CURRENTS) {
  const out = [];
  currents.forEach((cur, ci) => {
    const lat0 = cur.course.reduce((s, p) => s + p[0], 0) / cur.course.length, kx = Math.cos(lat0 * DEG);
    let pl = cur.course.map(([la, lo]) => [lo * kx, la]);
    pl = chaikin(chaikin(pl, false), false);
    const cum = [0];
    for (let i = 0; i + 1 < pl.length; i++) cum.push(cum[i] + Math.hypot(pl[i + 1][0] - pl[i][0], pl[i + 1][1] - pl[i][1]));
    const L = cum[cum.length - 1];
    const at = d => {
      let i = 0; while (i < pl.length - 2 && cum[i + 1] < d) i++;
      const t = (d - cum[i]) / Math.max(1e-9, cum[i + 1] - cum[i]);
      const x = pl[i][0] + (pl[i + 1][0] - pl[i][0]) * t, y = pl[i][1] + (pl[i + 1][1] - pl[i][1]) * t;
      const dx = pl[i + 1][0] - pl[i][0], dy = pl[i + 1][1] - pl[i][1], dl = Math.hypot(dx, dy) || 1;
      return [x, y, -dy / dl, dx / dl];
    };
    for (let j = 0; j < cur.lines; j++) {
      const sd = ci * 101 + j * 17.3, mid = j === Math.floor(cur.lines / 2);
      const off = (j - (cur.lines - 1) / 2) * cur.gap;
      const d0 = L * (mid ? 0.01 : 0.04 + 0.12 * hash(sd)), d1 = L * (mid ? 0.99 : 0.96 - 0.14 * hash(sd + 1));
      const n = Math.max(2, Math.round((d1 - d0) / CURRENT_STEP) + 1), pts = [];
      for (let q = 0; q < n; q++) {
        const d = d0 + (d1 - d0) * q / (n - 1), [x, y, nx, ny] = at(d);
        const o = off + 0.13 * Math.sin(d * 1.1 + sd) + 0.06 * Math.sin(d * 2.9 + sd * 1.7);
        pts.push([y + ny * o, (x + nx * o) / kx]);
      }
      let deg = 0;
      for (let q = 0; q + 1 < pts.length; q++) deg += arcDeg(pts[q][0], pts[q][1], pts[q + 1][0], pts[q + 1][1]);
      out.push({ name: cur.name, pts, deg, seed: 1200 + sd, k: mid ? 1 : 0.72, speed: FLOW_DEG * (0.85 + 0.3 * hash(sd + 2)) });
    }
  });
  return out;
}

export function buildMap({ coast = decodeCoastJapan(), world = null, prepared = prepareCoast(coast, { world }), relief = null, land = undefined } = {}) {
  const { strokes, dabs } = prepared;
  const peaks = buildPeaks({ relief, ...(land ? { land } : {}) });
  let cap = dabs.length + peaks.length + 64 + AIR.length * AIR_SEG;
  for (const c of currentLines()) cap += c.pts.length;
  for (const r of ROADS) cap += r.stations.length * 2;
  for (const s of strokes) cap += s.pts.length;
  const buf = new Float32Array(cap * FLOATS);
  const a = new Float32Array(3), b = new Float32Array(3);
  let n = 0;
  const push = (A, B, o, sA, sB, len, seed, style, start, dur, w0, w1, reach, x0 = 1, x1 = 0, x2 = 0, x3 = 0) => {
    const k = n * FLOATS;
    buf.set(A, k); buf.set(B, k + 3);
    buf[k + 6] = o[0]; buf[k + 7] = o[1]; buf[k + 8] = o[2]; buf[k + 9] = o[3];
    buf[k + 10] = sA; buf[k + 11] = sB; buf[k + 12] = len; buf[k + 13] = seed;
    buf[k + 14] = style; buf[k + 15] = start; buf[k + 16] = dur;
    buf[k + 17] = w0; buf[k + 18] = w1; buf[k + 19] = reach;
    buf[k + 20] = x0; buf[k + 21] = x1; buf[k + 22] = x2; buf[k + 23] = x3;
    n++;
  };
  const Z4 = [0, 0, 0, 0];
  const stats = { strokes: 0, coastLines: 0, neighbourLines: 0, worldLines: 0, coastStrokes: 0, coastSegments: 0, dabs: 0, roads: 0, roadPieces: 0, stations: 0,
    peaks: 0, nearPeaks: 0, fuji: 0, airRoutes: 0, seals: 0, washTriangles: 0, mist: 0, roadDeg: 0, currents: 0, currentNames: 0, compass: 0 };
  const wash = [];

  // ---- the coast: each line grows along its length over COAST_S, in brush strokes of about STROKE_DEG
  const maxLen = Math.max(...strokes.map(s => s.len));
  strokes.forEach((st, k) => {
    const { pts, closed } = st;
    const m = pts.length;
    const lead = 0.12 * (1 - Math.min(1, st.len / maxLen) ** 0.3);
    const T0 = lead, TD = COAST_S - lead - 0.02;
    /* per point: the heading (two either side) and how calm the coast is there (chord over path, four either side): a
       calm coast takes the brush's full swell, an intricate one a lighter touch, so bays never fill in */
    const kx = st.world ? Math.max(0.2, Math.cos(pts[0][1] * DEG)) : KX;
    const at = i => (closed ? pts[((i % (m - 1)) + (m - 1)) % (m - 1)] : pts[Math.max(0, Math.min(m - 1, i))]);
    const dist = (p, q) => Math.hypot((q[0] - p[0]) * kx, q[1] - p[1]);
    const head = new Float32Array(m), calm = new Float32Array(m);
    for (let i = 0; i < m; i++) {
      const p0 = at(i - 2), p1 = at(i + 2);
      head[i] = Math.atan2(p1[1] - p0[1], (p1[0] - p0[0]) * kx);
      let path = 0;
      for (let j = i - 4; j < i + 4; j++) path += dist(at(j), at(j + 1));
      const ratio = path > 0 ? dist(at(i - 4), at(i + 4)) / path : 1;
      calm[i] = Math.min(1, Math.max(0, (ratio - 0.5) / 0.42));
    }
    const isle = 0.55 + 0.45 * Math.min(1, Math.max(0, (st.extent - LINE_MIN) / 2.2));   // a small island: a lighter touch
    const cum = [0];
    for (let i = 0; i + 1 < m; i++) cum.push(cum[i] + arcDeg(pts[i][1], pts[i][0], pts[i + 1][1], pts[i + 1][0]));
    const len = cum[m - 1];
    const nS = Math.max(1, Math.round(len / STROKE_DEG));
    let area = 0;
    for (let i = 0; i + 1 < m; i++) area += pts[i][0] * kx * pts[i + 1][1] - pts[i + 1][0] * kx * pts[i][1];
    const landSide = closed && area < 0 ? -1 : 1;   // counter-clockwise: the land is on the left
    const bounds = [0];
    for (let q = 1; q < nS; q++) bounds.push(len * (q + 0.36 * (hash(k * 31 + q) - 0.5)) / nS);
    bounds.push(len);
    let q = 0;
    for (let i = 0; i + 1 < m; i++) {
      const d = cum[i + 1] - cum[i];
      if (d <= 0) continue;
      const mid = (cum[i] + cum[i + 1]) / 2;
      while (q < nS - 1 && mid > bounds[q + 1]) q++;
      const b0 = bounds[q], sl = bounds[q + 1] - b0;
      xyz(pts[i][1], pts[i][0], a); xyz(pts[i + 1][1], pts[i + 1][0], b);
      const w = j => nibFactor(head[j]) * (0.3 + 0.7 * calm[j] * calm[j]) * isle;
      // the reach's sign says which side the land is on (screen left of the stroke: +), for the wash's bleed at the coast
      push(a, b, Z4, Math.max(0, (cum[i] - b0) / sl), Math.min(1, (cum[i + 1] - b0) / sl), sl, hash(k * 7 + q) * 97, STYLE.coast,
        T0 + TD * (b0 / len), TD * (sl / len), w(i), w(i + 1), 9.0 * landSide, st.k);
      stats.coastSegments++;
    }
    stats.coastStrokes += nS; stats.coastLines++; stats.strokes += nS;
    if (st.k < 1) stats.neighbourLines++;
    if (st.world) stats.worldLines++;
    // Japan's wash for the lite tier (the other tiers wash every land from the land texture)
    if (closed && st.k >= 1) {
      const plane = pts.map(([lon, lat]) => [lon * KX, lat]);
      const tris = earClip(plane);
      for (const i of tris) wash.push(pts[i][1], pts[i][0]);
      stats.washTriangles += tris.length / 3;
    }
  });
  // ---- the dabs: one touch of the brush each, as the coast passes
  dabs.forEach((d, i) => {
    xyz(d.lat, d.lon, a);
    const r = (1.1 + 1.3 * Math.min(1, (d.size - DAB_MIN) / (LINE_MIN - DAB_MIN))) * (d.k < 1 ? 0.8 : 1);
    push(a, a, [-0.01, 0, 0.01, 0], 0, 1, 0.1, 300 + i * 7.3, STYLE.dab, 0.35 + 0.7 * hash(i + 50), 0.2, r, 0, r + 1.6, d.k);
    stats.dabs++; stats.strokes++;
  });

  // ---- the trunk lines: thin red-brown lines (the Tokaido broken across its sea leg), each drawn as one journey
  const speed = ROAD_DEG / ROAD_S;
  ROADS.forEach((road, id) => {
    const S = road.stations, total = road.deg;
    const at = []; { let c = 0; for (let i = 0; i < S.length; i++) { at.push(c); if (i + 1 < S.length && i !== road.seaLeg) c += arcDeg(S[i].lat, S[i].lon, S[i + 1].lat, S[i + 1].lon); } }
    const pieces = road.seaLeg >= 0 ? [[0, road.seaLeg], [road.seaLeg + 1, S.length - 1]] : [[0, S.length - 1]];
    for (const [i0, i1] of pieces) {
      const len = at[i1] - at[i0], start = road.at + at[i0] / speed, dur = Math.max(0.05, len / speed);
      for (let i = i0; i < i1; i++) {
        xyz(S[i].lat, S[i].lon, a); xyz(S[i + 1].lat, S[i + 1].lon, b);
        // w0, w1: where the segment lies along the whole road (0 at its start .. 1 at its end), for the travelling light
        push(a, b, Z4, (at[i] - at[i0]) / len, (at[i + 1] - at[i0]) / len, len, 400 + id * 10 + i0, STYLE.road, start, dur, at[i] / total, at[i + 1] / total, 6.0, 1, id, total, 1);
      }
      stats.roadPieces++; stats.strokes++;
    }
    // the stations: a small dot for about every other one, as the road reaches it; the two ends a little larger, in cream
    S.forEach((t, i) => {
      const end = i === 0 || i === S.length - 1, when = road.at + at[i] / speed;
      if (!end && i % 2 === 1) return;
      if (id > 0 && i === 0) return;   // the Sanyo starts at Kyoto, the Tohoku at Nihonbashi: the Tokaido's ends
      xyz(t.lat, t.lon, a);
      push(a, a, [-0.01, 0, 0.01, 0], 0, 1, 0.1, 500 + id * 100 + i, STYLE.dab, when, 0.1, end ? 2.0 : 0.85, 1, end ? 3.6 : 2.4, 1, 0, 0, end ? 0 : 1);
      stats.stations++; stats.strokes++;
    });
    stats.roads++;
  });
  stats.roadDeg = +ROAD_DEG.toFixed(3);

  // ---- the air routes: great circles out of Haneda, lifted off the ball, faint, each with a light (ids 3..)
  AIR.forEach((dest, j) => {
    const A0 = [0, 0, 0], B0 = [0, 0, 0];
    xyz(HANEDA.lat, HANEDA.lon, A0, 0, 1); xyz(dest.lat, dest.lon, B0, 0, 1);
    const om = Math.acos(Math.min(1, A0[0] * B0[0] + A0[1] * B0[1] + A0[2] * B0[2])), so = Math.sin(om);
    const deg = om / DEG, lift = AIR_LIFT * Math.sqrt(deg / 10);
    const pt = (t, out) => {
      const ka = Math.sin((1 - t) * om) / so, kb = Math.sin(t * om) / so, r = R_MAP + lift * Math.sin(Math.PI * t);
      out[0] = (A0[0] * ka + B0[0] * kb) * r; out[1] = (A0[1] * ka + B0[1] * kb) * r; out[2] = (A0[2] * ka + B0[2] * kb) * r;
    };
    const start = AIR_AT + 0.12 * j;
    for (let i = 0; i < AIR_SEG; i++) {
      pt(i / AIR_SEG, a); pt((i + 1) / AIR_SEG, b);
      push(a, b, Z4, i / AIR_SEG, (i + 1) / AIR_SEG, deg, 600 + j * 7, STYLE.air, start, AIR_S, i / AIR_SEG, (i + 1) / AIR_SEG, 6.0, 1, 3 + j, deg, 0);
    }
    stats.airRoutes++; stats.strokes++;
  });

  // ---- the peaks: each rises from its foot as the draw-in reaches it, west to east
  peaks.forEach((p, i) => {
    xyz(p.lat, p.lon, a);
    const start = p.fuji ? PEAKS_AT + PEAKS_S - 0.2 : PEAKS_AT + (PEAKS_S - 0.35) * smooth(122, 146, p.lon);
    push(a, a, [p.w, p.h, 0, 0], 0, 0, p.h, 700 + i * 3.7, STYLE.peak, start, 0.35, p.fuji ? 1 : 0, 0, 0, p.k);
    stats.peaks++; if (p.k < 1) stats.nearPeaks++; if (p.fuji) stats.fuji++;
  });

  // ---- the sea: mist bands (none today: data/japan-map.mjs MIST); the code stays so a band can be tried again
  MIST.forEach((band, i) => {
    const [lat, lon0, lon1] = band;
    const steps = Math.max(2, Math.ceil((lon1 - lon0) / 0.5));
    const len = arcDeg(lat, lon0, lat, lon1);
    for (let j = 0; j < steps; j++) {
      const l0 = lon0 + (lon1 - lon0) * j / steps, l1 = lon0 + (lon1 - lon0) * (j + 1) / steps;
      xyz(lat, l0, a); xyz(lat, l1, b);
      push(a, b, Z4, j / steps, (j + 1) / steps, len, 950 + i * 5, STYLE.mist, COAST_S * 0.5, 0.9, 1, 1, MIST_HW * 1.6 + 2);
    }
    stats.mist++; stats.strokes++;
  });

  // ---- LV1d: the currents: each a few fine lines side by side along its course, each its own length
  for (const line of currentLines()) {
    const { pts, deg, seed, k: lk, speed } = line;
    let c = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
      const d = arcDeg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      xyz(pts[i][0], pts[i][1], a); xyz(pts[i + 1][0], pts[i + 1][1], b);
      push(a, b, Z4, c / deg, (c + d) / deg, deg, seed, STYLE.current, CURRENT_AT + 0.15 * hash(seed), CURRENT_S, lk, speed, 3.0);
      c += d;
    }
    stats.currents++; stats.strokes++;
  }
  stats.currentNames = CURRENTS.length;
  // ---- LV1d: the compass rose, flat on the ball: aB its east and aO its north, scaled to its radius (object units)
  {
    const { lat, lon, r } = COMPASS, e = [0, 0, 0], nn = [0, 0, 0], q0 = [0, 0, 0];
    xyz(lat, lon, a); xyz(lat, lon + 0.01, e); xyz(lat + 0.01, lon, nn);
    const unit = v => { const L = Math.hypot(v[0], v[1], v[2]); return v.map(x => x / L); };
    const E = unit([e[0] - a[0], e[1] - a[1], e[2] - a[2]]), N = unit([nn[0] - a[0], nn[1] - a[1], nn[2] - a[2]]);
    const rr = r * DEG * R_MAP;
    for (let i = 0; i < 3; i++) { q0[i] = E[i] * rr; }
    push(a, q0, [N[0] * rr, N[1] * rr, N[2] * rr, 0], 0, 1, 0.1, 977, STYLE.compass, COMPASS_AT, COMPASS_S, 1, 0, 0);
    stats.compass++; stats.strokes++;
  }

  // ---- the seal: beside Edo's end of the road, to its lower right, over the bay's mouth
  { const T = TOKAIDO[0]; xyz(T.lat, T.lon, a); push(a, a, [17 - 0.01, -15, 17 + 0.01, -15], 0, 1, 0.1, 901, STYLE.seal, SEAL_AT, SEAL_S, 10.5, 0, 12.5); stats.seals++; stats.strokes++; }

  const washPos = new Float32Array(wash.length / 2 * 3);
  for (let i = 0; i < wash.length / 2; i++) xyz(wash[2 * i], wash[2 * i + 1], washPos, i * 3);
  let end = 0;
  for (let i = 0; i < n; i++) end = Math.max(end, buf[i * FLOATS + 15] + buf[i * FLOATS + 16]);
  return { inst: buf.slice(0, n * FLOATS), count: n, stats, wash: washPos, drawSeconds: end };
}

/* ---------------------------------------------------------------- the mesh
   createJapanMap({ THREE, globe, GLSL, tile }): GLSL is globe.mjs GLSL_GLOBE (the lens); tile the Japan land tile's
   module (data/land-japan.mjs) where the tier has the detail (null on lite). The mesh is added to the scene by the
   caller, not to the globe's groups (they are hidden when the hologram's share is 0), and update() copies the Earth's
   world matrix, the cursor follow included, onto it every frame. */
const GLSL_NOISE = /* glsl */`
  float h1(float n){ return fract(sin(n) * 43758.5453); }
  float vn(float x){ float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h1(i), h1(i + 1.0), f); }
  float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), f.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), f.x), f.y); }
`;
/* The paper (LV1c): indigo-dyed paper (aizome) wrapped on the ball. paperBase() casts this pixel's ray onto the unit
   sphere and returns the paper there: deep indigo falling darker toward the limb, the dye's mottle and long fibres fixed
   to the ball and the sheet's tooth on the screen, the land's lighter wash, the sun (night deeper, a warm dusk band, the
   day side a little lifted) and a thin rim of light at the limb. paperLines() adds what needs the pixel's footprint
   (derivatives): the ruled lines and the night's gold leaf; only the paper itself draws them, and the ink, composited
   over paperBase() by the Max blend, never hides them where it is faint. */
export const PAPER_CENTRE = '#0d1638', PAPER_RIM = '#060a1a';
/** The night side's tint (a share of the day's paper), the dusk band's warmth, the rim's light. */
export const NIGHT_TINT = [0.34, 0.4, 0.62], DUSK = [0.085, 0.04, 0.012], RIM = [0.1, 0.36, 0.42];
/** LV1d: the day/night line. The paper turns from night to day across gNdl DAY_RAMP (the sine of the sun's height: about
    7 degrees of arc, so the turn is a band, not a cast over the whole ball), and the dusk's warmth is a band DUSK_HW
    wide (a Gaussian's width, in the same sine) centred on the line itself. */
export const DAY_RAMP = [-0.07, 0.06], DUSK_HW = 0.045;
/** The ruled lines: every GRAT_DEG degrees, at GRAT_K of the gold (the tenth-degree lines a little stronger). */
export const GRAT_DEG = 5, GRAT_K = 0.075;
/** The gold leaf: dust in cells of LEAF_DEG degrees (up to LEAF_K of them lit where the lights are brightest), cut squares in cells three times that where they are bright; a faint warm light (LEAF_GLOW) under them. */
export const LEAF_DEG = 0.075, LEAF_K = 0.75, LEAF_GLOW = 0.35;
const glslRGB = hex => { const n = parseInt(hex.slice(1), 16); return `vec3(${((n >> 16) / 255).toFixed(5)}, ${(((n >> 8) & 255) / 255).toFixed(5)}, ${((n & 255) / 255).toFixed(5)})`; };
const glslV = v => `vec3(${v.map(x => x.toFixed(4)).join(', ')})`;
/** The paper's share of the ring (the floor shows through a little at BALL_K), and how far past the ring's line it reaches (under the ring's glow, so no dark seam shows between them). */
const BALL_K = 0.97, BALL_IN = 1.5;
/** The land's wash: its strength (of the cream) at most for Japan, the neighbours' share of it at their nearest, and
    when it comes up in the draw-in. */
export const WASH_K = 0.16, WASH_NEAR = 0.62, WASH_AT = 0.5, WASH_S = 0.9;
/* JP1 (2026-11-28): THE PLATE. A picture painted offline from real elevation and sea depth (tools/build-japan-plate.mjs:
   images/plate/japan-plate-*.avif, equirectangular over PLATE) replaces, inside its region, the paper's colour, its land
   wash and the coast's brush, the islets, the peaks and the currents; it is still shaded as a ball (its limb, the sun,
   the dusk, the rim) and the ruled lines and the gold are drawn over it live. Its last PLATE_FEATHER degrees blend into
   the procedural paper, so no seam shows. It loads with the level on the tiers with the detail (the phone takes the
   2048 px one), fades in over PLATE_IN s (with the draw-in's wash), and a failed load leaves the procedural map. */
export const PLATE = { west: 100, east: 170, south: 10, north: 60 }, PLATE_FEATHER = 2, PLATE_IN = 1.2, PLATE_NIGHT_INK = 0.8;
const GLSL_PLATE_EDGE = /* glsl */`
  float plateIn(float lat, float lon){
    float e = min(min(lon - ${PLATE.west.toFixed(1)}, ${PLATE.east.toFixed(1)} - lon), min(lat - ${PLATE.south.toFixed(1)}, ${PLATE.north.toFixed(1)} - lat));
    return smoothstep(0.0, ${PLATE_FEATHER.toFixed(1)}, e);
  }
`;
const GLSL_PAPER = /* glsl */`
  uniform vec2 uRes; uniform float uDpr, uWash, uTileOn, uPlateOn;
  uniform mat4 uClipToWorld; uniform mat3 uObjRot; uniform vec3 uSun, uJapanC, cCream, cGold;
  uniform sampler2D uLand, uTile, uLightsW, uLightsJ, uPlate;
  ${GLSL_PLATE_EDGE}
  float paperMask(){
    float d = length(gl_FragCoord.xy - uLens.xy), e = uLens.z + ${BALL_IN.toFixed(1)} * uDpr;
    return (1.0 - smoothstep(e - 1.5 * uDpr, e, d)) * uFade * ${BALL_K.toFixed(2)};
  }
  vec3 gN; float gNdl, gNdv, gLat, gLon, gU; vec2 gPG, gTJ;
  vec3 paperBase(){
    vec2 ndc = gl_FragCoord.xy / uRes * 2.0 - 1.0;
    vec4 a = uClipToWorld * vec4(ndc, -1.0, 1.0), b = uClipToWorld * vec4(ndc, 1.0, 1.0);
    vec3 ro = cameraPosition, rd = normalize(b.xyz / b.w - a.xyz / a.w);
    float B = dot(ro, rd), C = dot(ro, ro) - 1.0, D = max(B * B - C, 0.0);
    vec3 n = normalize(ro + rd * (-B - sqrt(D)));          // the ball under this pixel (at the limb: its edge)
    gN = n; gNdv = clamp(-dot(n, rd), 0.0, 1.0); gNdl = dot(n, uSun);
    vec3 o = uObjRot * n;                                   // the Earth's own frame
    gLat = degrees(asin(clamp(o.y, -1.0, 1.0)));
    float q = degrees(atan(o.z, -o.x));                     // lon + 180, as globe.mjs reads it
    gU = fract(q / 360.0 + 1.0);
    gLon = q - 180.0; if (gLon < -180.0) gLon += 360.0;
    gPG = vec2((gLon - 138.0) * cos(radians(gLat)), gLat);   // degrees on a plane local to Japan (no shear there): the dye, fibres and leaf fixed to the ball
    gTJ = vec2((gLon - 122.0) / 24.0, (46.0 - gLat) / 22.0);   // the Japan box's pictures
    float rr = 1.0 - gNdv;
    vec3 c = mix(${glslRGB(PAPER_CENTRE)}, ${glslRGB(PAPER_RIM)}, smoothstep(0.08, 0.98, rr));
    float cloud = vn2(gPG / 2.4 + 3.1) * 0.6 + vn2(gPG / 0.9 + 8.7) * 0.4;      // the dye taken a little unevenly
    float fibre = vn2(vec2(gPG.x * 1.9, gPG.y * 22.0) + 17.0);                // long fibres, laid along the parallels
    float grain = vn2(gl_FragCoord.xy / uDpr * 0.9 + 5.0);                    // the sheet's tooth, about a css px
    c *= 1.0 + 0.16 * (cloud - 0.5) + 0.07 * (fibre - 0.5) + 0.12 * (grain - 0.5);
    // JP1: the plate, as the paper is shaded toward the limb, with the sheet's tooth
    float pin = uPlateOn * uWash * plateIn(gLat, gLon);
    vec3 pc = texture2D(uPlate, vec2((gLon - ${PLATE.west.toFixed(1)}) / ${(PLATE.east - PLATE.west).toFixed(1)}, (${PLATE.north.toFixed(1)} - gLat) / ${(PLATE.north - PLATE.south).toFixed(1)})).rgb;
    pc *= mix(1.0, ${(0.45).toFixed(2)}, smoothstep(0.08, 0.98, rr)) * (1.0 + 0.1 * (grain - 0.5));
    // the land's wash: the world's land texture, the Japan tile inside its box (feathered over its last degree)
    float lw = texture2D(uLand, vec2(gU, (90.0 - gLat) / 180.0)).r;
    vec2 tl = texture2D(uTile, clamp(gTJ, 0.0, 1.0)).rg;
    float inT = uTileOn * smoothstep(0.0, 0.045, min(min(gTJ.x, 1.0 - gTJ.x), min(gTJ.y, 1.0 - gTJ.y)));
    float land = smoothstep(0.3, 0.7, mix(lw, tl.r, inT));
    float jp = smoothstep(0.3, 0.7, tl.g) * inT;
    float far = smoothstep(${NEAR_FALL[0].toFixed(1)}, ${NEAR_FALL[1].toFixed(1)}, degrees(acos(clamp(dot(o, uJapanC), -1.0, 1.0))));
    float nk = mix(${NEAR_K[0].toFixed(3)}, ${NEAR_K[1].toFixed(3)}, far) / ${NEAR_K[0].toFixed(3)};
    float wk = land * ${WASH_K.toFixed(3)} * mix(${WASH_NEAR.toFixed(3)} * nk, 1.0, jp);
    float wg = vn2(gPG * 40.0) * 0.55 + vn2(gPG * 40.0 + 7.0) * 0.45;
    float wc = vn2(gPG / 1.3 + 3.0) * 0.6 + vn2(gPG / 0.45) * 0.4;           // large soft blotches, as an ink wash dries
    c = mix(c, toSRGB(cCream), clamp(wk * (0.5 + 0.35 * wg) * (0.35 + 1.25 * wc) * uWash, 0.0, 1.0));
    c = mix(c, pc, pin);
    // the sun: night a deeper indigo, the day side a little lifted, a soft warm band along the day/night line (LV1d)
    float day = smoothstep(${DAY_RAMP[0].toFixed(3)}, ${DAY_RAMP[1].toFixed(3)}, gNdl);
    c *= mix(${glslV(NIGHT_TINT)}, vec3(1.0), day);
    // JP1: the plate's cream ink (the coast, the shores) keeps most of its strength by night, as the live brush did
    float inkP = pin * smoothstep(0.3, 0.78, dot(pc, vec3(0.3, 0.5, 0.2)));
    c = mix(c, pc * ${PLATE_NIGHT_INK.toFixed(2)}, inkP * (1.0 - day));
    c *= 1.0 + 0.22 * smoothstep(0.05, 0.9, gNdl);
    c += ${glslV(DUSK)} * exp(-pow(gNdl / ${DUSK_HW.toFixed(3)}, 2.0)) * (0.4 + 0.6 * gNdv);
    // the rim of light at the limb: the curve reads
    c += ${glslV(RIM)} * pow(rr, 16.0);
    return c + (h2(gl_FragCoord.xy) - 0.5) / 255.0;                           // a dither: no steps in the fall
  }
  /** The ground under a map mark here, as the paper's draw left it (without its ruled lines and gold). */
  vec3 paperUnder(){ return paperBase() * paperMask(); }
  /** The ruled lines and the night's gold leaf, over paperBase()'s c (the paper's own draw only: it needs derivatives). */
  vec3 paperLines(vec3 c){
    float pxc = length(fwidth(gN)) * 57.29578 / 1.41421 * uDpr;              // degrees per css px here
    float fwG = length(fwidth(gPG));                                          // (both taken before any branch)
    float lk = 1.0 - smoothstep(0.09, 0.32, pxc);                             // where the lines crowd toward the limb they fade
    float dLat = abs(fract(gLat / ${GRAT_DEG.toFixed(1)} + 0.5) - 0.5) * ${GRAT_DEG.toFixed(1)};
    float dLon = abs(fract(gLon / ${GRAT_DEG.toFixed(1)} + 0.5) - 0.5) * ${GRAT_DEG.toFixed(1)} * cos(radians(gLat));
    float d10 = abs(fract(gLat / ${(2 * GRAT_DEG).toFixed(1)} + 0.5) - 0.5) * ${(2 * GRAT_DEG).toFixed(1)};
    float lLat = 1.0 - smoothstep(0.25, 0.95, dLat / pxc), lLon = (1.0 - smoothstep(0.25, 0.95, dLon / pxc)) * (1.0 - smoothstep(70.0, 84.0, abs(gLat)));
    float tenLat = 1.0 - smoothstep(0.25, 0.95, d10 / pxc);                 // every other parallel a little stronger
    float line = max(max(lLat * 0.75, tenLat), lLon * 0.85);
    c = mix(c, toSRGB(cGold), line * ${GRAT_K.toFixed(3)} * lk * uWash * (0.6 + 0.4 * smoothstep(-0.1, 0.25, gNdl)));
    // the gold leaf by night, from the night-light pictures (stored level / 15; linear light its square)
    bool inJ = gTJ.x >= 0.0 && gTJ.x <= 1.0 && gTJ.y >= 0.0 && gTJ.y <= 1.0;
    float lv = inJ ? texture2D(uLightsJ, gTJ).r : texture2D(uLightsW, vec2(gU, (90.0 - gLat) / 180.0)).r;
    float city = 1.0 - exp(-7.0 * lv * lv);
    city = city > 0.03 ? city : 0.0;
    float night = 1.0 - smoothstep(-0.14, 0.04, gNdl);
    float k = night * uWash;
    if (k < 0.002 || city <= 0.0) return c;
    // a faint warm light where the cities are (added, so it never browns the indigo)
    c += vec3(0.11, 0.085, 0.04) * city * k * ${LEAF_GLOW.toFixed(2)};
    /* the leaf, as a screen's gold is laid: fine dust (sunago) wherever the lights are, and larger cut squares
       (kirigane) only where they are bright; each catches the light as the ball turns (the cursor follow) */
    float glint = 0.0, cover = 0.0;
    for (int L = 0; L < 2; L++) {
      float cell = L == 0 ? ${LEAF_DEG.toFixed(3)} : ${(LEAF_DEG * 3).toFixed(3)};
      vec2 g = gPG / cell + float(L) * 31.7, ci = floor(g), f = fract(g);
      float hc = h2(ci + 17.0);
      float want = L == 0 ? city * ${LEAF_K.toFixed(2)} : pow(city, 1.6) * 0.5;
      if (hc >= want) continue;
      vec2 c0 = vec2(0.22 + 0.56 * h2(ci + 3.1), 0.22 + 0.56 * h2(ci + 7.7));
      float ang = h2(ci + 1.3) * 3.1416;
      vec2 dq = mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * (f - c0);
      float sz = L == 0 ? 0.16 + 0.1 * h2(ci + 9.2) : 0.15 + 0.13 * h2(ci + 9.2);
      float aa = max(fwG / cell * 0.7, 1e-4);
      float leaf = 1.0 - smoothstep(sz - aa, sz + aa, max(abs(dq.x), abs(dq.y) * 1.15));
      float px = cell / max(pxc, 1e-5);                                          // css px a cell
      leaf *= smoothstep(L == 0 ? 1.3 : 2.4, L == 0 ? 2.4 : 4.0, px);           // too small to read: left out near the limb
      float gl = 0.5 + 0.5 * sin(hc * 41.0 + dot(gN, vec3(23.0, 17.0, 11.0)) * (L == 0 ? 6.0 : 3.0));
      if (leaf > cover) { cover = leaf; glint = gl; }
    }
    vec3 gold = mix(toSRGB(cGold), vec3(0.98, 0.9, 0.66), glint * glint * glint);
    return mix(c, gold, clamp(cover * k * (0.7 + 0.3 * glint), 0.0, 1.0));
  }
`;
/* The travelling lights (the orchestrator's change to the brief, 2026-11-28; LV1c: one on each trunk line and each air
   route): after the draw-in, a slow light runs a line from its start to its end every `every` s, taking `run` s, from
   `phase` s on; never under reduced motion. The Tokaido's is the first (Edo to Kyoto every LIGHT_EVERY s); the others
   run at the Tokaido's speed, the air routes' lights slower and rarer. */
export const LIGHT_EVERY = 9, LIGHT_RUN = 4.5, LIGHT_DELAY = 0.8;
export const LIGHTS = [
  { line: 'Tokaido', phase: 0, every: LIGHT_EVERY, run: LIGHT_RUN },
  { line: 'Sanyo', phase: 4.5, every: 12, run: LIGHT_RUN * SANYO_DEG / ROAD_DEG },
  { line: 'Tohoku', phase: 1.5, every: 12, run: LIGHT_RUN * TOHOKU_DEG / ROAD_DEG },
  { line: 'air: Fukuoka', phase: 9, every: 18, run: 8 },
];
/** A light's place along its line (0 start .. 1 end) this long after the draw-in ended, or -1 between runs. */
export function lightAt(t, { phase = 0, every = LIGHT_EVERY, run = LIGHT_RUN } = {}) {
  const u = t - LIGHT_DELAY - phase;
  if (u < 0) return -1;
  const c = u % every;
  return c <= run ? c / run : -1;
}
/* The season (LV1b, 2026-11-28): a few small things drift slowly inside the ring, by Japan's own date (Asia/Tokyo,
   whatever the visitor's zone: Japan keeps no summer time, so it is UTC+9 all year):
     spring  20 March to 20 April        cherry petals, pale pink
     summer  21 April to 14 September   fireflies: tiny warm lights that fade in and out, hardly moving
     autumn  15 September to 10 December maple leaves, red to orange
     winter  11 December to 19 March    snow, small white flecks
   DRIFT_DESK of them on the desktop, DRIFT_PHONE on a phone's ring; a crossing takes DRIFT_CROSS s. One instanced
   draw, its places worked out in the vertex shader from one clock (no per-frame allocation). Under reduced motion they
   are placed and still. ?sceneDebug=1&season=spring|summer|autumn|winter picks one. */
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const DRIFT_DESK = 11, DRIFT_PHONE = 6, DRIFT_MAX = 12;
export const DRIFT_CROSS = [20, 40];
/** The season on Japan's calendar at the instant t (ms since the epoch, or a Date). */
export function seasonOf(t = Date.now()) {
  const j = new Date(+t + 9 * 3600e3);
  const md = (j.getUTCMonth() + 1) * 100 + j.getUTCDate();
  if (md >= 320 && md <= 420) return 'spring';
  if (md >= 421 && md <= 914) return 'summer';
  if (md >= 915 && md <= 1210) return 'autumn';
  return 'winter';
}
/** Per drifter (pure): its start in the ring's box (-1..1 each way), a seed, and its speed (ring radii a second) so a
    crossing of the ring takes DRIFT_CROSS s. An R2 sequence: any first n of them are spread over the ring. */
export function driftSeeds(n = DRIFT_MAX) {
  const out = new Float32Array(n * 4), g = 1.32471795724474602596, a1 = 1 / g, a2 = 1 / (g * g);
  for (let i = 0; i < n; i++) {
    out[i * 4] = ((0.5 + a1 * (i + 1)) % 1) * 2 - 1;
    out[i * 4 + 1] = ((0.5 + a2 * (i + 1)) % 1) * 2 - 1;
    out[i * 4 + 2] = hash(i * 13.7 + 2.1) * 100;
    const cross = DRIFT_CROSS[0] + (DRIFT_CROSS[1] - DRIFT_CROSS[0]) * hash(i * 5.3 + 0.7);
    out[i * 4 + 3] = 2 / cross;
  }
  return out;
}
/* LV1e (2026-11-28): today's clouds as floating brush clouds. The real cloud field (the Earth level's own, never fetched
   again) is drawn the way the globe draws mountains: as small glyphs in the same hand, each a little curl-cloud of
   Japanese painting (two or three overlapping curled strokes and a base stroke with a hooked end), lifted a little off
   the paper (CLOUD_LIFT, Earth radii: they shift against the map as the ball turns) with a soft shadow on the paper
   under it, offset away from the real sun. Placed on a jittered grid (CLOUD_CELL degrees, no rows) where the field is
   high: over the sea from CLOUD_LEVEL, over land only in its top band (CLOUD_TOP: cold ground reads as cloud in the
   infrared picture), over Japan's own land rarely (CLOUD_JAPAN_TOP, and one cell in CLOUD_JAPAN_KEEP), so the coast and
   the names stay the first read. Width CLOUD_W map px by the density there, cream at CLOUD_K by the density. They
   drift with the westerlies at CLOUD_WIND degrees a second, each over CLOUD_LIFE degrees before it fades and returns;
   still under reduced motion. At most CLOUD_MAX glyphs (about 35 in view on the desktop), CLOUD_PHONE of them on a phone.
   Two instanced draws (the shadows, the glyphs); none without fresh data. */
export const CLOUD_LEVEL = 0.875, CLOUD_TOP = 0.94, CLOUD_JAPAN_TOP = 0.955, CLOUD_JAPAN_KEEP = 0.35, CLOUD_CELL = 2.5, CLOUD_CAP = 34;
export const CLOUD_W = [26, 56], CLOUD_K = [0.42, 0.55], CLOUD_MAX = 110, CLOUD_PHONE = 0.33, CLOUD_LIFT = 0.0055;
export const CLOUD_WIND = 0.006, CLOUD_LIFE = 2.0, CLOUD_SHADOW = 0.36;
/** The cloud glyphs (pure): sample(lat, lon) the cloud field 0..1, land(lon, lat) the land mask. Each glyph { lat, lon,
    f (the field there), w (its width, map px), seed, where: 'sea' | 'land' | 'japan' }, in a random order (any first n
    are spread over the field), at most `max`. */
export function placeClouds(sample, { land = makeLandLookup(), max = CLOUD_MAX } = {}) {
  const out = [];
  for (let lat = JAPAN_C.lat - CLOUD_CAP; lat <= JAPAN_C.lat + CLOUD_CAP; lat += CLOUD_CELL) {
    const ky = Math.round(lat * 10), step = CLOUD_CELL / Math.max(0.35, Math.cos(lat * DEG));
    for (let lon = JAPAN_C.lon - CLOUD_CAP / Math.max(0.35, Math.cos(lat * DEG)); lon <= JAPAN_C.lon + CLOUD_CAP / Math.max(0.35, Math.cos(lat * DEG)); lon += step) {
      const sd = ky * 31.7 + Math.round(lon * 10) * 0.137;
      const la = lat + (hash(sd) - 0.5) * CLOUD_CELL * 0.8, lo = lon + (hash(sd + 1) - 0.5) * step * 0.8;
      if (Math.abs(la) > 62 || arcDeg(la, lo, JAPAN_C.lat, JAPAN_C.lon) > CLOUD_CAP) continue;
      const f = sample(la, lo);
      if (!(f >= CLOUD_LEVEL)) continue;
      const onLand = land(lo, la), japan = onLand && inBox(la, lo) && !isNeighbour(la, lo);
      if (japan && (f < CLOUD_JAPAN_TOP || hash(sd + 2) >= CLOUD_JAPAN_KEEP)) continue;
      if (onLand && !japan && f < CLOUD_TOP) continue;
      const d = smooth(CLOUD_LEVEL, 0.97, f);
      out.push({ lat: la, lon: lo, f, w: CLOUD_W[0] + (CLOUD_W[1] - CLOUD_W[0]) * d * (0.8 + 0.2 * hash(sd + 3)), seed: hash(sd + 4) * 100, where: japan ? 'japan' : onLand ? 'land' : 'sea', prio: hash(sd + 5) });
    }
  }
  out.sort((a, b) => a.prio - b.prio);
  return out.slice(0, max);
}
/* LV1f (2026-11-28, a sceneDebug trial: ?sceneDebug=1&jclouds=a|b|c|g|0; with no switch the glyphs above, as before).
   Three looks drawn from the same real field, each one screen quad over the paper (fieldLook in createJapanMap):
     a  marbled ink (suminagashi): JA_LEVELS nested hair lines of the field, no fill, breathing slowly
     b  gold-leaf bands as on a folding screen: placeBands fits each large dense mass with two or three level bands
     c  brush lines: JC_LEVELS contours as a dry, thick-thin brush stroke, broken where the field's edge is soft */
export const JCLOUD_STYLES = ['g', 'a', 'b', 'c', '0'];
export const JA_LEVELS = [0.855, 0.87, 0.885, 0.9, 0.915, 0.93], JA_K = [0.3, 0.45], JF_SPAN = 2;
export const JC_LEVELS = [0.87, 0.91], JC_K = 0.38;
export const JB_LEVEL = 0.9, JB_LAND = 0.97, JB_CELL = 0.5, JB_MIN = 40, JB_MAX = 24, JB_MASSES = 6, JB_H = [0.22, 0.38], JB_LEAF = 0.55, JB_K = 0.58;
/** The gold bands (pure): sample(lat, lon) the field 0..1. On a plane local to Japan (x = (lon - 138) cos lat, y = lat,
    degrees; JB_CELL cells) the dense cells (sea from JB_LEVEL, other land from JB_LAND, never within a degree of
    Japan's own land) are grouped into masses; each of the JB_MASSES largest (at least JB_MIN cells) takes two or three
    stacked level bands, each the longest run of its row, so their lengths step as the mass does. Each band
    { x0, x1, y, h (half height), mass } in those degrees, the largest mass's first. */
export function placeBands(sample, { land = makeLandLookup(), names = [...LABELS, ...NEAR_LABELS] } = {}) {
  // a name's ground (about 30 css px a degree on the desktop's ring; a name about two degrees long), kept clear of the leaf
  const nameAt = names.map(l => {
    const c = Math.max(0.35, Math.cos(l.lat * DEG)), pl = l.place || [24, 0], la = l.lat - pl[1] / 30;
    const a = l.lon + pl[0] / 30 / c, len = (l.name.length * 7 + 10) / 30 / c;
    return l.side === 'l' ? [la, a - len - 0.5 / c, a + 0.5 / c] : [la, a - 0.5 / c, a + len + 0.5 / c];
  });
  const C = JB_CELL, R = CLOUD_CAP, nx = Math.round(2 * R / C), ny = nx;
  const at = (i, j) => ({ x: -R + (i + 0.5) * C, y: JAPAN_C.lat - R + (j + 0.5) * C });
  const lonOf = (x, y) => 138 + x / Math.max(0.35, Math.cos(y * DEG));
  const dense = new Uint8Array(nx * ny), jp = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const { x, y } = at(i, j), lon = lonOf(x, y);
    if (Math.abs(y) > 62 || arcDeg(y, lon, JAPAN_C.lat, JAPAN_C.lon) > R) continue;
    const onLand = land(lon, y);
    if (onLand && inBox(y, lon) && !isNeighbour(y, lon)) { jp[j * nx + i] = 1; continue; }
    const f = sample(y, lon);
    dense[j * nx + i] = f >= (onLand ? JB_LAND : JB_LEVEL) ? 1 : 0;
  }
  // a degree's margin round Japan's land
  const pad = Math.ceil(1 / C);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (!jp[j * nx + i]) continue;
    for (let b = -pad; b <= pad; b++) for (let a = -pad; a <= pad; a++) {
      const ii = i + a, jj = j + b;
      if (ii >= 0 && jj >= 0 && ii < nx && jj < ny) dense[jj * nx + ii] = 0;
    }
  }
  // the masses (4-connected)
  const id = new Int32Array(nx * ny).fill(-1), masses = [];
  for (let s = 0; s < nx * ny; s++) {
    if (!dense[s] || id[s] >= 0) continue;
    const cells = [s]; id[s] = masses.length;
    for (let k = 0; k < cells.length; k++) {
      const c = cells[k], i = c % nx, j = (c - i) / nx;
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ii = i + a, jj = j + b, t = jj * nx + ii;
        if (ii >= 0 && jj >= 0 && ii < nx && jj < ny && dense[t] && id[t] < 0) { id[t] = masses.length; cells.push(t); }
      }
    }
    masses.push(cells);
  }
  const big = masses.map((cells, m) => ({ cells, m })).filter(o => o.cells.length >= JB_MIN).sort((a, b) => b.cells.length - a.cells.length).slice(0, JB_MASSES);
  const out = [];
  big.forEach(({ cells, m }, rank) => {
    let j0 = ny, j1 = -1;
    for (const c of cells) { const j = Math.floor(c / nx); j0 = Math.min(j0, j); j1 = Math.max(j1, j); }
    const rows = j1 - j0 + 1, n = rows >= 9 ? 3 : 2;
    const h = Math.min(JB_H[1], Math.max(JB_H[0], rows * C / n * 0.16));
    // stacked as one cloud about the mass's middle row, a band's height and a little apart; the middle the longest
    const STEP = n === 3 ? [[0.18, 0.66], [0, 1], [-0.14, 0.8]] : [[0, 1], [0.2, 0.64]];   // offset (a share of the run), length
    let jm = 0; for (const c of cells) jm += Math.floor(c / nx); jm /= cells.length;
    const dj = (1.7 * h) / C;   // overlapping a little: the stack reads as one stepped cloud, as on a screen
    // each row's longest run of this mass's cells; the stack's length is the longest of them, its middle their mean
    const runs = [];
    for (let k = 0; k < n; k++) {
      const j = Math.min(j1, Math.max(j0, Math.round(jm + (k - (n - 1) / 2) * dj)));
      let best = [0, -1], run = 0;
      for (let i = 0; i <= nx; i++) {
        if (i < nx && id[j * nx + i] === m) { run++; if (run > best[1] - best[0] + 1) best = [i - run + 1, i]; }
        else run = 0;
      }
      if (best[1] >= 0) runs.push({ k, j, x0: at(best[0], j).x - C * 0.5, x1: at(best[1], j).x + C * 0.5 });
    }
    if (!runs.length) return;
    const len = Math.max(...runs.map(r => r.x1 - r.x0)) - 2 * h, mid = runs.reduce((s, r) => s + (r.x0 + r.x1) / 2, 0) / runs.length;
    const lo = Math.min(...runs.map(r => r.x0)) + h, hi = Math.max(...runs.map(r => r.x1)) - h;
    for (const r of runs) {
      const [off, sh] = STEP[r.k], c = mid + off * len * 0.5;
      let x0 = Math.max(lo, c - len * sh / 2), x1 = Math.min(hi, c + len * sh / 2);   // never past the mass
      const y = at(0, r.j).y, cy = Math.max(0.35, Math.cos(y * DEG));
      for (const [la, w, e] of nameAt) {   // a name on the band's line: the band keeps its longer side of it
        if (Math.abs(y - la) > h + 0.45) continue;
        const nw = (w - 138) * cy - h - 0.25, ne = (e - 138) * cy + h + 0.25;
        if (ne <= x0 || nw >= x1) continue;
        if (nw - x0 >= x1 - ne) x1 = Math.min(x1, nw); else x0 = Math.max(x0, ne);
      }
      if (x1 - x0 < 2.5) continue;
      out.push({ x0, x1, y, h: h * (r.k === (n - 1) / 2 || (n === 2 && r.k === 0) ? 1 : 0.8), mass: rank });
    }
  });
  return out.slice(0, JB_MAX);
}
/** The still frame's clock for the drifters (reduced motion): a moment when the fireflies are lit. */
export const DRIFT_STILL_T = 37.0;

/* The names (data/japan-map.mjs LABELS, then NEAR_LABELS): DOM text in the page's mono face, out of the accessibility
   tree as the scene's other labels are, placed each frame beside their point (the side the data names, else the other
   side, else hidden: never touching each other or the ring). They come up over LABEL_IN s once the draw-in is done and
   fade with the level. The neighbours' names are fainter, placed after the six (they give way), never on a phone. On a
   small ring (a phone) only TOKYO is shown. */
export const LABEL_IN = 0.6, LABEL_K = 0.6, LABEL_K_TOKYO = 0.85, LABEL_K_NEAR = 0.34;
export function boxesClash(a, b, gap = 4) { return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap; }
/** A leader is drawn when the name stands further than this off its dot (map px), at LEADER_K of the name's strength. */
export const LEADER_MIN = 7, LEADER_K = 0.55;
/** A name's box (css px, y down) for its dot at (x, y): its near end at the dot plus LABELS place (map px, times uk),
    running left ('l') or right ('r') from there, its middle on that line. */
export function nameBox(l, x, y, uk, w, h) {
  const ax = x + l.place[0] * uk, ay = y + l.place[1] * uk;
  return { x: l.side === 'l' ? ax - w : ax, y: ay - h / 2, w, h };
}
/** The leader from a dot at (x, y) toward its name's box (null when the name stands close): start, angle (deg), length. */
export function leaderLine(l, x, y, uk, box) {
  if (Math.hypot(l.place[0], l.place[1]) < LEADER_MIN) return null;
  const tx = Math.max(box.x - 2, Math.min(box.x + box.w + 2, x)), ty = Math.max(box.y - 2, Math.min(box.y + box.h + 2, y));
  const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy);
  if (d < 6) return null;
  const s = 3 / d;   // clear of the dot
  return { x: x + dx * s, y: y + dy * s, a: Math.atan2(dy, dx) / DEG, len: d - 3 };
}
export function insideRing(bx, cx, cy, r, pad = 8) {
  for (const [x, y] of [[bx.x, bx.y], [bx.x + bx.w, bx.y], [bx.x, bx.y + bx.h], [bx.x + bx.w, bx.y + bx.h]]) if (Math.hypot(x - cx, y - cy) > r - pad) return false;
  return true;
}
/** The Japan tile as a texture's bytes (pure): R = land, G = Japan's own land (not the neighbours'), row 0 = 46N. */
export function tileBytes({ LAND_JAPAN_W: W, LAND_JAPAN_H: H, LAND_JAPAN_B64: B64, LAND_JAPAN_WEST: west, LAND_JAPAN_NORTH: north }) {
  const bits = atob(B64), out = new Uint8Array(W * H * 2), cell = 0.1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!((bits.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1)) continue;
    out[i * 2] = 255;
    out[i * 2 + 1] = isNeighbour(north - (y + 0.5) * cell, west + (x + 0.5) * cell) ? 0 : 255;
  }
  return { data: out, width: W, height: H };
}
export function createJapanMap({ THREE, globe, GLSL, still = false, built = buildMap(), season = null, now = () => Date.now(), tile = null, landTexture = false, cloudStyle = 'g' }) {
  const jStyle = JCLOUD_STYLES.includes(cloudStyle) ? cloudStyle : 'g';   // LV1f: the trial's switch (sceneDebug only)
  const lin3 = hex => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };   // linear; the shader encodes sRGB
  const blank = () => { const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); t.needsUpdate = true; return t; };
  let tileTex = null;
  if (tile) {
    const tb = tileBytes(tile);
    tileTex = new THREE.DataTexture(tb.data, tb.width, tb.height, THREE.RGFormat, THREE.UnsignedByteType);
    Object.assign(tileTex, { flipY: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, unpackAlignment: 1 });
    tileTex.needsUpdate = true;
  }
  const blankPlate = blank();   // JP2: the plate's stand-in until it lands (and after a refused upload)
  const jc = [0, 0, 0]; xyz(JAPAN_C.lat, JAPAN_C.lon, jc, 0, 1);
  const tex = globe.tex || {};
  // the paper's uniforms, shared by every material that composites over it
  const P = {
    uLens: globe.U.uLens, uFade: { value: 0 }, uExposure: globe.U.uExposure, uRes: globe.U.uRes, uDpr: globe.U.uDpr, uSun: globe.U.uSun,
    uClipToWorld: { value: new THREE.Matrix4() }, uObjRot: { value: new THREE.Matrix3() }, uJapanC: { value: new THREE.Vector3(...jc) },
    uLand: tex.land || { value: blank() }, uLightsW: tex.lightsW || { value: blank() }, uLightsJ: tex.lightsJ || { value: blank() },
    uTile: { value: tileTex || blank() }, uTileOn: { value: tileTex ? 1 : 0 }, uWash: { value: still ? 1 : 0 },
    uPlate: { value: blankPlate }, uPlateOn: { value: 0 },
    cCream: { value: lin3(CREAM) }, cGold: { value: lin3(GOLD) },
  };
  const U = {
    ...P, uClock: { value: still ? 1e4 : 0 }, uK: { value: 1 }, uPeaks: { value: 1 }, uFlow: { value: FLOW_STILL },
    cSeal: { value: lin3(SEAL) }, cRoad: { value: lin3(ROAD) }, uRoadL: { value: new THREE.Vector3(-1, -1, -1) }, uAirL: { value: new THREE.Vector3(-1, -1, -1) },
  };
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0], 3));
  g.setIndex([0, 2, 1, 1, 2, 3]);
  const ib = new THREE.InstancedInterleavedBuffer(built.inst, FLOATS);
  g.setAttribute('aA', new THREE.InterleavedBufferAttribute(ib, 3, 0));
  g.setAttribute('aB', new THREE.InterleavedBufferAttribute(ib, 3, 3));
  g.setAttribute('aO', new THREE.InterleavedBufferAttribute(ib, 4, 6));
  g.setAttribute('aS', new THREE.InterleavedBufferAttribute(ib, 4, 10));
  g.setAttribute('aT', new THREE.InterleavedBufferAttribute(ib, 3, 14));
  g.setAttribute('aW', new THREE.InterleavedBufferAttribute(ib, 3, 17));
  g.setAttribute('aX', new THREE.InterleavedBufferAttribute(ib, 4, 20));
  g.instanceCount = built.count;
  const m = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      attribute vec3 aA, aB, aT, aW; attribute vec4 aO, aS, aX;
      uniform vec2 uRes; uniform float uDpr, uClock, uK, uPeaks; uniform vec3 uSun;
      varying vec2 vL; varying float vLen; varying vec4 vS; varying vec3 vT; varying vec3 vW; varying float vSide, vLand; varying vec4 vX; varying vec2 vSun;
      varying float vPlate;
      ${GLSL_PLATE_EDGE}
      float facing(vec3 p){
        vec3 nw = normalize(mat3(modelMatrix) * p), w = (modelMatrix * vec4(p, 1.0)).xyz;
        return smoothstep(0.0, 0.2, dot(nw, normalize(cameraPosition - w)));
      }
      void main(){
        float st = aT.x; int sty = int(st + 0.5);
        vec4 ca = projectionMatrix * modelViewMatrix * vec4(aA, 1.0), cb = projectionMatrix * modelViewMatrix * vec4(aB, 1.0);
        vec2 hv = uRes * 0.5 / (uDpr * uK);                // map px per clip unit: every width and mark scales with uK
        vec2 sa = ca.xy / ca.w * hv, sb = cb.xy / cb.w * hv, pa, pb, p;
        bool geo = sty == 0 || sty == 2 || sty == 7 || sty == 9 || sty == 10;
        float prog = clamp((uClock - aT.y) / max(aT.z, 1e-3), 0.0, 1.0);
        vS = aS; vW = aW; vX = aX; vLand = sign(aW.z); vSide = 0.0; vSun = vec2(-1.0, 1.0);
        { vec3 pp = normalize(geo && position.x > 0.5 ? aB : aA);   // JP1: inside the plate's region (feathered as the paper)
          float plon = degrees(atan(pp.z, -pp.x)) - 180.0; if (plon < -180.0) plon += 360.0;
          vPlate = plateIn(degrees(asin(clamp(pp.y, -1.0, 1.0))), plon); }
        if (sty == 8) {
          /* a peak standing on the ball. A picture map stands its peaks up toward the map's north; on a ball seen from
             above that is the projected north, and toward the limb, where the ground is seen from the side, a peak
             stands out from the ball along its normal (it turns to the normal's direction there, by the shorter way).
             Seen from above it is shorter (PEAK_ABOVE of its height), from the side its full height; smaller as it
             lies further from the eye. Both directions are taken across the line of sight (the part toward the eye
             would only push a mark out from the view's centre, as a wide lens leans every tower outward). */
          vec3 nO = normalize(aA), nth = vec3(0.0, 1.0, 0.0) - nO * nO.y;
          nth = dot(nth, nth) > 1e-8 ? normalize(nth) : vec3(1.0, 0.0, 0.0);
          vec3 wA = (modelMatrix * vec4(aA, 1.0)).xyz, toCam = cameraPosition - wA;
          float dist = length(toCam); vec3 vd = toCam / dist;
          vec3 nW = normalize(mat3(modelMatrix) * nO), tW = normalize(mat3(modelMatrix) * nth);
          float cn = dot(nW, vd), side = sqrt(max(0.0, 1.0 - cn * cn));
          vec4 cN = projectionMatrix * viewMatrix * vec4(wA + (tW - dot(tW, vd) * vd) * 0.003, 1.0);
          vec4 cR = projectionMatrix * viewMatrix * vec4(wA + (nW - cn * vd) * 0.003, 1.0);
          vec2 sN = cN.xy / cN.w * hv - sa, sR = cR.xy / cR.w * hv - sa;
          float aN = atan(sN.y, sN.x), aR = dot(sR, sR) > 1e-12 ? atan(sR.y, sR.x) : aN;
          float dA = mod(aR - aN + 3.14159265, 6.2831853) - 3.14159265;
          float ang = aN + dA * smoothstep(${PEAK_TURN[0].toFixed(2)}, ${PEAK_TURN[1].toFixed(2)}, side);
          vec2 up = vec2(cos(ang), sin(ang)), nr = vec2(-up.y, up.x);
          float dk = clamp(pow((length(cameraPosition) - 1.0) / dist, 0.55), 0.38, 1.0);
          float grow = prog * prog * (3.0 - 2.0 * prog);
          float H = aO.y * dk * mix(${PEAK_ABOVE.toFixed(2)}, 1.0, pow(side, 6.0)) * grow, hw = aO.x * dk, mg = 1.5;
          float along = position.x > 0.5 ? H + mg : -mg, acr = position.y * (hw * 1.25 + mg);
          p = sa + up * along + nr * acr;
          vL = vec2(along, acr); vLen = H; vW = vec3(hw, aW.x, H);
          /* LV1d: the real sun lights one flank: its direction across the line of sight, on screen, against the mark's
             across axis (+: the nr side); by night (the ground's own sun angle) both flanks fall to the shade */
          vec3 sx = uSun - dot(uSun, vd) * vd;
          vec4 cS = projectionMatrix * viewMatrix * vec4(wA + sx * 0.003, 1.0);
          vec2 sS = cS.xy / cS.w * hv - sa;
          float ls = dot(sS, nr) / max(length(sS), 1e-6);
          vSun = vec2(abs(ls) > 0.12 ? sign(ls) : -1.0, smoothstep(-0.12, 0.3, dot(nW, uSun)));
        } else if (sty == 11) {
          /* LV1d: the compass rose, lying flat on the ball: its corners on the tangent plane (aB east, aO north, object
             units), so it turns and foreshortens with the Earth */
          vec2 q = vec2(position.x * 2.0 - 1.0, position.y) * 1.25;
          vec4 cq = projectionMatrix * modelViewMatrix * vec4(aA + aB * q.x + aO.xyz * q.y, 1.0);
          p = cq.xy / cq.w * hv;
          vL = q; vLen = 1.0;
        } else {
          if (geo) { pa = sa; pb = sb; }
          else if (sty == 3) {                                 // a station's tick: across the road, on screen
            vec2 dd = sb - sa; vec2 dr = dot(dd, dd) > 1e-8 ? normalize(dd) : vec2(1.0, 0.0);
            vec2 nr = vec2(-dr.y, dr.x); pa = sa - nr * aW.x; pb = sa + nr * aW.x;
          }
          else { pa = sa + aO.xy; pb = sa + aO.zw; }
          vec2 d = pb - pa; float L = length(d);
          vec2 dir = L > 1e-4 ? d / L : vec2(1.0, 0.0), nrm = vec2(-dir.y, dir.x);
          float R = abs(aW.z);
          float along = position.x > 0.5 ? L + R : -R;
          p = pa + dir * along + nrm * position.y * R;
          vL = vec2(along, position.y * R); vLen = L;
          // the heavy side: toward the lower right on screen (y up), where a loaded brush's belly lies
          vSide = dot(nrm, normalize(vec2(0.62, -0.78)));
        }
        float face = geo ? (position.x > 0.5 ? facing(aB) : facing(aA)) : facing(aA);
        vT = vec3(st, prog, face);
        vec4 c = geo && position.x > 0.5 ? cb : ca;
        bool off = face < 0.002 || prog <= 0.0 || ((sty == 8 || sty == 9 || sty == 11) && uPeaks < 0.5);
        gl_Position = off ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(p / hv * c.w, c.z, c.w);
      }`,
    fragmentShader: GLSL + GLSL_NOISE + GLSL_PAPER + /* glsl */`
      uniform vec3 cSeal, cRoad, uRoadL, uAirL; uniform float uFlow;
      varying vec2 vL; varying float vLen; varying vec4 vS; varying vec3 vT; varying vec3 vW; varying float vSide, vLand; varying vec4 vX; varying vec2 vSun;
      varying float vPlate;
      void main(){
        float st = vT.x, prog = vT.y; int sty = int(st + 0.5);
        vec2 fwL = fwidth(vL);                           // (taken before any branch: the compass's pixel)
        float along = vL.x, across = vL.y;
        float t = clamp(along / max(vLen, 1e-4), 0.0, 1.0);
        float s = mix(vS.x, vS.y, t);                    // where along the stroke (0..1)
        float len = abs(vS.z), seed = vS.w;
        float sd = s * len;                              // degrees along the stroke
        float dist = along < 0.0 ? length(vL) : (along > vLen ? length(vec2(along - vLen, across)) : abs(across));
        vec3 col = vX.w > 0.5 ? cRoad : cCream; float k = 0.0;
        if (sty == 5) {                                  // the seal: a rounded square, its red a little uneven as a stamp's is
          col = cSeal;
          float hs = vW.x, rc = hs * 0.24;
          vec2 q = abs(vL) - vec2(hs - rc);
          float sdf = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rc;
          k = 1.0 - smoothstep(-0.5, 0.5, sdf);
          float frame = smoothstep(-hs * 0.24, -hs * 0.19, sdf) * (1.0 - smoothstep(-hs * 0.13, -hs * 0.08, sdf));   // a carved line inside its edge
          k *= 1.0 - 0.8 * frame;
          k *= 0.78 + 0.22 * vn2(vL * 0.7 + seed);
          k *= 1.0 - 0.35 * smoothstep(0.55, 0.8, vn2(vL * 0.35 + seed * 2.0));   // where the stamp took less ink
        } else if (sty == 3) {                           // a station's tick
          k = (1.0 - smoothstep(0.05, 0.75, dist)) * 0.7;
        } else if (sty == 11) {
          /* LV1d: the compass rose in thin gold: a ring, the four long points and four short ones in outline, each
             point's one half filled faintly as an old chart's rose is, and a small mark beyond north */
          col = cGold;
          vec2 q = vL; float px = max(max(fwL.x, fwL.y), 1e-4);    // q's units per device-ish px
          float r = length(q);
          float ringL = 1.0 - smoothstep(0.35, 1.0, abs(r - 0.62) / px);
          float ringL2 = (1.0 - smoothstep(0.35, 1.0, abs(r - 0.69) / px)) * 0.5;
          float line = max(ringL * 0.8, ringL2), fill = 0.0;
          for (int i = 0; i < 2; i++) {
            float ca = i == 0 ? 1.0 : 0.70710678, sa2 = i == 0 ? 0.0 : 0.70710678;
            vec2 u = mat2(ca, -sa2, sa2, ca) * q;                   // the long cross, then the short one at 45 degrees
            float R = i == 0 ? 1.0 : 0.52, b = i == 0 ? 0.15 : 0.1;
            for (int j = 0; j < 2; j++) {
              vec2 v = j == 0 ? u : vec2(u.y, -u.x);
              float f = abs(v.x) / b + abs(v.y) / R;
              float d = (f - 1.0) / length(vec2(1.0 / b, 1.0 / R));
              line = max(line, (1.0 - smoothstep(0.35, 1.0, abs(d) / px)) * (i == 0 ? 1.0 : 0.75));
              fill = max(fill, (1.0 - smoothstep(-0.5, 0.5, d / px)) * step(0.0, v.x * sign(v.y + 1e-5)) * (i == 0 ? 0.32 : 0.22));
            }
          }
          float nMark = 1.0 - smoothstep(0.03, 0.03 + px, length(q - vec2(0.0, 1.13)));
          k = max(max(line * 0.62, fill), nMark * 0.6) * (1.0 - smoothstep(1.16, 1.24, r)) * prog;
          k *= (0.85 + 0.15 * vn2(q * 9.0 + seed)) * 0.75;   // LV1d review: a quarter dimmer
        } else if (sty == 8 && vW.y > 0.5) {
          /* Fuji: wider, its flanks curving in to a flat top, with a pale cap; the face toward the real sun washed pale */
          float hw = vW.x, H = max(vW.z, 0.3), y = along, x = across;
          float ty = clamp(y / H, 0.0, 1.0);
          float xx = x - (h1(seed) - 0.5) * 0.35 * hw * ty;
          float hx = hw * (0.12 + 0.88 * pow(1.0 - ty, 1.8));
          float dd = (abs(xx) - hx) * 0.7;
          float inY = step(-0.3, y) * (1.0 - smoothstep(H - 0.3, H + 0.4, y));
          float inside = (1.0 - smoothstep(-0.45, 0.45, dd)) * inY;
          float foot = smoothstep(0.0, 0.3, ty + 0.04);
          float lit = 1.0 - smoothstep(-0.5, 0.5, -vSun.x * xx);
          float face = inside * mix(0.16, mix(0.22, 0.5, vSun.y), lit) * foot;
          float w = mix(0.75, 0.42, ty);
          float lineW = (1.0 - smoothstep(w - 0.45, w + 0.45, abs(dd))) * inY * foot * (xx * vSun.x > 0.0 ? 1.0 : 0.55);
          float top = (1.0 - smoothstep(-0.4, 0.4, abs(y - H) - 0.25)) * step(abs(xx), hw * 0.13);
          k = max(max(face, lineW * 0.95), top * 0.9);
          float capAt = 0.6 + 0.07 * sin(xx * 1.9 + seed);
          k = max(k, inside * smoothstep(capAt - 0.04, capAt + 0.04, ty) * 0.9);
          k *= 0.82 + 0.18 * vn2(vec2(x * 0.9, y * 0.6) + seed);
          k *= vX.x;
        } else if (sty == 8) {
          /* LV1d: a peak as two strokes of the brush, as an ink painter draws a hill: the brush lands at the summit and
             runs down each flank, the two flanks uneven (each its own spread and curve, the summit off centre). The
             flank toward the real sun is the firm stroke, its face washed pale with the brush's dry tooth; the other is
             a lighter, shorter stroke over a face left nearly bare, with a few dry streaks. Each stroke thins and breaks
             up toward the foot (the ragged dry edge), and the foot dissolves into the paper. */
          float hw = vW.x, H = max(vW.z, 0.3), y = along, x = across;
          float ty = clamp(y / H, 0.0, 1.0);
          float sx = (h1(seed) - 0.5) * 0.25 * hw;                    // the summit off centre
          float sp0 = 0.8 + 0.4 * h1(seed + 1.0), sp1 = 0.8 + 0.4 * h1(seed + 2.0);   // each flank's spread
          float cu0 = 0.75 + 0.6 * h1(seed + 3.0), cu1 = 0.75 + 0.6 * h1(seed + 4.0);  // each flank's curve
          float wob = (vn(ty * 4.0 + seed) - 0.5) * 0.12 * hw;
          float xl = sx - hw * sp0 * pow(1.0 - ty, cu0) + wob, xr = sx + hw * sp1 * pow(1.0 - ty, cu1) + wob;
          float sinT = H / sqrt(H * H + hw * hw);
          float dl = (xl - x) * sinT, dr = (x - xr) * sinT;            // + outside each flank (css px)
          float inY = step(-0.3, y) * (1.0 - smoothstep(H - 0.2, H + 0.5, y));
          float inside = (1.0 - smoothstep(-0.45, 0.45, max(dl, dr))) * inY;
          float foot = smoothstep(0.0, 0.32, ty + 0.03);
          bool litR = vSun.x > 0.0;                                     // the sun's side: the + (right) flank or the left
          float dLit = litR ? dr : dl, dSh = litR ? dl : dr;
          float g = vn2(vec2(y * 1.3 + seed, x * 0.35)) * 0.7 + vn2(vec2(y * 3.1, x * 1.1 + seed)) * 0.3;   // the dry tooth, along the strokes
          // the firm stroke down the lit flank: full at the summit, thinning and breaking up toward the foot
          float wl = mix(0.45, 1.0, ty);
          float sL = (1.0 - smoothstep(wl - 0.45, wl + 0.45, abs(dLit + wl * 0.35))) * inY;
          sL *= smoothstep(0.55 * pow(1.0 - ty, 2.0) - 0.07, 0.55 * pow(1.0 - ty, 2.0) + 0.07, g);
          // the light stroke down the shaded flank: thinner, lifting off before the foot
          float ws = mix(0.3, 0.6, ty);
          float sS2 = (1.0 - smoothstep(ws - 0.45, ws + 0.45, abs(dSh + ws * 0.3))) * inY * smoothstep(0.1, 0.3, ty);
          sS2 *= smoothstep(0.35 + 0.3 * (1.0 - ty) - 0.07, 0.42 + 0.3 * (1.0 - ty), g);
          /* the faces: no hard line between them. The lit face is a dry wash laid in from its flank stroke, fading toward
             the far flank (less by night); the shaded face a faint wash and a few dry streaks */
          float span = max(xr - xl, 0.5);
          float fromLit = clamp((litR ? xr - x : x - xl) / span, 0.0, 1.0);   // 0 at the lit flank .. 1 at the other
          float wash = inside * mix(0.16, 0.46, vSun.y) * (1.0 - smoothstep(0.1, 0.75, fromLit)) * smoothstep(0.15, 0.55, g + 0.15 * ty) * foot;
          wash = max(wash, inside * 0.07 * foot);
          float streak = inside * smoothstep(0.45, 0.8, fromLit) * 0.15 * smoothstep(0.62, 0.8, vn2(vec2(x * 0.9 + seed, y * 0.22))) * foot;
          k = max(max(sL * mix(0.7, 0.95, vSun.y), sS2 * 0.72) * foot, max(wash, streak));
          k *= vX.x;
        } else if (sty == 7) {
          /* a mist band of a folding screen (suyari-gasumi) over the open sea (none today: MIST is empty) */
          col = cGold;
          float pxDeg = vLen / max((vS.y - vS.x) * len, 1e-5);
          float bandPx = len * pxDeg, x = s * bandPx;
          float endIn = min(x, bandPx - x);
          float hw = ${MIST_HW.toFixed(1)} * (0.85 + 0.25 * vn(x / 46.0 + seed));
          float endK = smoothstep(0.0, 26.0, endIn);
          float hwE = hw * (0.45 + 0.55 * endK);
          float body = (1.0 - smoothstep(hwE * 0.78, hwE, abs(across + 0.6 * (vn(x / 60.0 + seed * 2.0) - 0.5)))) * endK;
          k = ${MIST_K.toFixed(3)} * body * (0.8 + 0.2 * vn(x / 19.0 + seed * 3.0));
          if (along < 0.0 || along > vLen) k = 0.0;
        } else if (sty == 1) {                           // a dab (an islet, a station): a blot, uneven at its rim
          float ang = atan(vL.y, vL.x);
          float r = vW.x * (0.85 + 0.3 * vn(ang * 1.6 + seed));
          k = (1.0 - smoothstep(r - 0.5, r + 0.5, length(vL))) * 0.95 * vX.x;
        } else {
          float pr = 0.72 * vn(sd * 0.3 + seed) + 0.28 * vn(sd * 0.95 + seed * 1.3);   // the brush's pressure
          float hw, a = 0.97, dry, side = 0.0;
          if (sty == 0) {                                // the coast: the neighbours' a lighter, thinner brush
            float nib = mix(vW.x, vW.y, t);
            float body = 0.25 + 0.75 * smoothstep(0.12, 0.88, pr);
            float pool = 1.0 + 0.45 * exp(-s * 16.0) + 0.2 * exp(-(1.0 - s) * 40.0);
            float lift = mix(0.05, 1.0, smoothstep(0.0, 0.2, 1.0 - s));
            float land = smoothstep(0.0, 0.02, s) * 0.5 + 0.5;
            hw = max(0.28, 2.9 * body * nib * pool * lift * land * mix(0.5, 1.0, vX.x));
            side = vSide;
            dry = 0.03 + 0.5 * pow(s, 1.6) * pow(1.0 - pr, 1.5) + 0.12 * (1.0 - vX.x);
            a = 0.97 * vX.x;
          } else if (sty == 2) {                         // a trunk line: thin and even, red-brown
            hw = 0.5 * mix(0.9, 1.1, pr); a = 0.9; dry = 0.04;
          } else if (sty == 10) {
            /* LV1d: a current: a long, fine, flowing line, its strength coming and going in long swells that drift
               along it with the water (uFlow: the drift's clock, s; vW.y the line's speed, degrees a second; it stands still under reduced motion), its ends tapering */
            float fl = sd - uFlow * vW.y;
            float sw = vn(fl * 0.55 + seed) * 0.65 + vn(fl * 1.7 + seed * 2.3) * 0.35;
            hw = mix(0.28, 0.62, smoothstep(0.3, 0.8, sw)) * (0.6 + 0.4 * smoothstep(0.0, 0.15, min(s, 1.0 - s)));
            a = ${CURRENT_K.toFixed(3)} * smoothstep(0.44, 0.68, sw) * smoothstep(0.0, 0.1, s) * smoothstep(0.0, 0.14, 1.0 - s) * vW.x;
            dry = 0.12;
          } else {                                       // an air route: a faint dashed line off the ball
            hw = 0.36; dry = 0.0;
            float pxDeg = vLen / max((vS.y - vS.x) * len, 1e-5);
            a = 0.36 * smoothstep(0.3, 0.42, fract(sd * pxDeg / 7.0)) * smoothstep(0.0, 0.08, s) * smoothstep(0.0, 0.08, 1.0 - s);
          }
          float u = across * sign(side + 1e-4);          // + toward the heavy side
          float hs = abs(side);
          float hwH = hw * (1.0 + 0.22 * hs), hwL = hw * (1.0 - 0.3 * hs) * (1.0 + 0.3 * (vn(sd * 6.0 + seed * 3.1) - 0.5));
          float centre = (hwH - hwL) * 0.5;
          float hh = 0.5 * (hwH + hwL), off = u - centre;
          float edge = along < 0.0 || along > vLen ? dist - hh : abs(off) - hh;
          k = (1.0 - smoothstep(-0.5, 0.5, edge)) * a;
          float toLight = clamp(-off / max(hh, 0.3), 0.0, 1.0) * hs;
          float grain = vn2(vec2(sd * 3.0 + seed, across * 1.3 + seed * 0.37)) * 0.75 + vn2(vec2(sd * 11.0, across * 2.6)) * 0.25;
          float thr = dry + 0.45 * toLight * toLight;
          k *= smoothstep(thr - 0.06, thr + 0.06, grain);
          k *= mix(0.8, 1.0, clamp(0.5 + off / max(hh, 0.3), 0.0, 1.0));
          if (sty == 0 && along >= 0.0 && along <= vLen) {   // the wash bleeds a little stronger just inside the coast
            float uL = across * vLand - hh;
            k = max(k, 0.075 * vX.x * smoothstep(-0.3, 0.8, uL) * exp(-max(uL, 0.0) / 3.5));
          }
          if (sty == 2 || sty == 9) {                    // the line's travelling light
            float id = vX.y;
            float Lp = id < 0.5 ? uRoadL.x : (id < 1.5 ? uRoadL.y : (id < 2.5 ? uRoadL.z : (id < 3.5 ? uAirL.x : (id < 4.5 ? uAirL.y : uAirL.z))));
            if (Lp >= 0.0) {
              float gR = mix(vW.x, vW.y, t);
              float pxPerDeg = vLen / max((vS.y - vS.x) * len, 1e-5);
              float ap = (gR - Lp) * vX.z * pxPerDeg;
              float glow = exp(-(ap * ap + across * across) / (sty == 2 ? 7.0 : 5.0)) * (sty == 2 ? 1.0 : 0.8);
              col = mix(col, cCream, clamp(glow * 1.5, 0.0, 1.0));
              k = max(k, glow);
            }
          }
        }
        if (sty != 11) k *= prog >= 1.0 ? 1.0 : 1.0 - smoothstep(prog - 0.015, prog, s);   // the draw-in's moving tip (the compass fades in)
        k *= vT.z;                                                                  // (the ink keeps its strength by night: the paper carries the night)
        /* JP1: the plate draws the coast and the islets in its region, its relief stands for the peaks and its sea floor
           for the currents: those marks give way as it fades in (the stations' dabs, vW.y 1, stay) */
        if (sty == 0 || (sty == 1 && vW.y < 0.5)) k *= 1.0 - uPlateOn * vPlate;
        if (sty == 7 || sty == 8 || sty == 10) k *= 1.0 - uPlateOn;
        if (k < 0.004) discard;
        // over the paper: the Max blend then keeps the strongest mark where two overlap, never their sum
        gl_FragColor = vec4(mix(paperUnder(), toSRGB(col), clamp(k * globeK(), 0.0, 1.0)), 1.0);
      }`,
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation,   // joints and crossings never add up
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false; mesh.renderOrder = 6;
  mesh.matrixAutoUpdate = false; mesh.matrixWorldAutoUpdate = false;
  mesh.visible = false;
  /* The paper: one quad over the ring, each pixel finding the ball under it (paperBase) and adding the ruled lines and
     the gold (paperLines). The hologram is drawn additively, so the floor would show through: the paper is laid at
     BALL_K, reaching BALL_IN css px past the ring's line, under its glow. A child of the map: it shows only with it. */
  const ball = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: P,
    vertexShader: /* glsl */`uniform vec4 uLens; uniform vec2 uRes; void main(){ gl_Position = vec4((uLens.xy + position.xy * (uLens.z + 2.0)) / uRes * 2.0 - 1.0, 0.0, 1.0); }`,
    fragmentShader: GLSL + GLSL_NOISE + GLSL_PAPER + /* glsl */`
      void main(){
        float m = paperMask();
        if (m < 0.004) discard;
        vec3 c = paperLines(paperBase());
        gl_FragColor = vec4(c * m, m);
      }`,
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  }));
  ball.frustumCulled = false; ball.renderOrder = 1.5;
  mesh.add(ball);
  /* The lite tier has no land texture: there Japan's wash is its own triangles, the cream at about WASH_K with a paper
     grain, inside the coast; the other tiers wash every land in the paper itself */
  let washMesh = null;
  if (!landTexture) {
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(built.wash, 3));
    washMesh = new THREE.Mesh(wg, new THREE.ShaderMaterial({
      uniforms: P,
      vertexShader: /* glsl */`varying vec3 vO; void main(){ vO = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: GLSL + GLSL_NOISE + GLSL_PAPER + /* glsl */`
        varying vec3 vO;
        void main(){
          float g = vn2(vO.xy * 2400.0) * 0.55 + vn2(vO.yz * 2400.0 + 7.0) * 0.45;
          float cloud = vn2(vO.xz * 60.0 + 3.0) * 0.6 + vn2(vO.xy * 24.0) * 0.4;
          float k = ${WASH_K.toFixed(3)} * (0.5 + 0.35 * g) * (0.35 + 1.25 * cloud) * uWash;
          gl_FragColor = vec4(mix(paperUnder(), toSRGB(cCream), clamp(k * globeK(), 0.0, 1.0)), 1.0);
        }`,
      transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation,
    }));
    washMesh.frustumCulled = false; washMesh.renderOrder = 5.5; washMesh.matrixAutoUpdate = false; washMesh.matrixWorldAutoUpdate = false;
    mesh.add(washMesh);
  }
  /* The season's drifters: in front of the map, small and faint, faded out before the ring's rim */
  const seasonName = SEASONS.includes(season) ? season : seasonOf(now());
  const sg = new THREE.InstancedBufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3));
  sg.setIndex([0, 1, 2, 2, 1, 3]);
  sg.setAttribute('aD', new THREE.InstancedBufferAttribute(driftSeeds(DRIFT_MAX), 4));
  sg.instanceCount = DRIFT_DESK;
  const UD = { uT: { value: still ? DRIFT_STILL_T : 0 }, uShow: { value: still ? 1 : 0 } };
  const drift = new THREE.Mesh(sg, new THREE.ShaderMaterial({
    uniforms: { uLens: globe.U.uLens, uFade: U.uFade, uExposure: globe.U.uExposure, uRes: globe.U.uRes, uDpr: globe.U.uDpr, uK: U.uK, uT: UD.uT, uShow: UD.uShow },
    defines: { SEASON: SEASONS.indexOf(seasonName) },
    vertexShader: /* glsl */`
      attribute vec4 aD;
      uniform vec4 uLens; uniform vec2 uRes; uniform float uDpr, uK, uT;
      varying vec2 vQ; varying float vA, vHue;
      float hh(float n){ return fract(sin(n) * 43758.5453); }
      void main(){
        float seed = aD.z, sp = aD.w, t = uT + seed * 7.0;
        vec2 v; float size, ang, flip = 1.0, sway;
        #if SEASON == 0
          v = vec2(0.55, -0.83) * sp; size = 6.5; sway = 0.05;           // petals: down and across, fluttering
          ang = seed + t * 0.55; flip = 0.3 + 0.7 * abs(cos(t * 0.8 + seed));
        #elif SEASON == 1
          v = vec2(0.0); size = 1.75; sway = 0.03; ang = 0.0;           // fireflies: hardly moving, low over the sea
        #elif SEASON == 2
          v = vec2(0.3, -0.95) * sp; size = 6.5; sway = 0.07;            // maple leaves: falling, turning slowly
          ang = seed + t * 0.35; flip = 0.45 + 0.55 * abs(cos(t * 0.5 + seed));
        #else
          v = vec2(0.08, -1.0) * sp; size = 2.2 + 0.6 * hh(seed); sway = 0.025; ang = 0.0;   // snow
        #endif
        #if SEASON == 1
          /* below the map's middle, over the sea: south of Tokyo, or under Kyushu and Shikoku (where the sky's stars are not) */
          float hx = -0.4 + (aD.x * 0.5 + 0.5), hy = aD.y * 0.5 + 0.5;
          vec2 p = vec2(hx, hx < 0.1 ? -0.62 - 0.1 * hy : -0.2 - 0.48 * hy);
        #else
          vec2 p = mod(aD.xy + v * t + 1.15, 2.3) - 1.15;                 // wraps outside the ring, never in it
        #endif
        p += sway * vec2(sin(t * 0.37 + seed), 0.6 * cos(t * 0.29 + seed * 1.7));
        float r = length(p);
        vA = 1.0 - smoothstep(0.78, 0.93, r);                             // gone before the rim
        #if SEASON == 1
          float ph = fract(t / (5.5 + 3.0 * hh(seed + 1.0)));               // each its own slow pulse: on, then dark a while
          vA *= smoothstep(0.0, 0.12, ph) * (1.0 - smoothstep(0.42, 0.6, ph));   // lit about half the time
        #endif
        vHue = hh(seed + 3.0);
        float px = size * uK * uDpr * (0.85 + 0.3 * hh(seed + 2.0));
        #if SEASON == 1
          px *= 4.0;                                                       // room for the glow
        #endif
        vQ = position.xy;
        vec2 c = position.xy * vec2(flip, 1.0) * px;
        c = mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * c;
        vec2 dev = uLens.xy + p * uLens.z + c;
        gl_Position = vA < 0.002 ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(dev / uRes * 2.0 - 1.0, 0.0, 1.0);
      }`,
    fragmentShader: GLSL + /* glsl */`
      uniform float uShow;
      varying vec2 vQ; varying float vA, vHue;
      void main(){
        vec2 q = vQ; float k; vec3 c;
        #if SEASON == 0
          q.x /= 0.62;                                                     // a cherry petal: an oval with its notch
          float d = length(q * vec2(1.0, 0.95) + vec2(0.0, 0.08));
          k = 1.0 - smoothstep(0.8, 1.0, d);
          k *= smoothstep(-0.05, 0.12, (0.72 + 1.3 * abs(vQ.x)) - vQ.y);
          c = mix(vec3(0.93, 0.70, 0.76), vec3(0.98, 0.88, 0.90), smoothstep(-0.8, 0.6, vQ.y));
          k *= 0.6;
        #elif SEASON == 1
          float r2 = dot(q, q);
          k = exp(-r2 * 9.0) * 1.0 + exp(-r2 * 2.6) * 0.4 * (1.0 - smoothstep(0.7, 1.0, sqrt(r2)));   // a 4 px core, a 14 px glow
          c = vec3(1.0, 0.851, 0.541);                                     // #ffd98a: warm, never a star's white
        #elif SEASON == 2
          float a = atan(q.x, q.y), r = length(q);                          // a maple leaf: five lobes, a short stem
          float lobe = pow(abs(cos(a * 2.5)), 2.2);
          float edge = (0.36 + 0.56 * lobe + 0.04 * abs(sin(a * 17.5))) * (1.0 - 0.28 * smoothstep(1.9, 2.6, abs(a))) - 0.25 * smoothstep(2.75, 3.14, abs(a));
          k = 1.0 - smoothstep(edge - 0.07, edge + 0.03, r);
          k = max(k, (1.0 - smoothstep(0.03, 0.08, abs(q.x))) * step(q.y, -0.2) * step(-0.92, q.y));   // the stem
          float vein = (1.0 - smoothstep(0.0, 0.05, abs(sin(a * 2.5)) * r)) * step(r, edge - 0.08) * step(0.08, r);
          k *= 1.0 - 0.35 * vein;
          c = mix(vec3(0.72, 0.17, 0.10), vec3(0.86, 0.46, 0.16), vHue);
          k *= 0.62;
        #else
          k = (1.0 - smoothstep(0.35, 1.0, length(q))) * 0.55;            // snow: a soft fleck
          c = vec3(0.93, 0.95, 0.98);
        #endif
        k *= vA * uShow * globeK();
        if (k < 0.004) discard;
        #if SEASON == 1
          gl_FragColor = vec4(c * k, k * 0.35);                            // a light: nearer to adding than covering
        #else
          gl_FragColor = vec4(c * k, k);
        #endif
      }`,
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  }));
  drift.frustumCulled = false; drift.renderOrder = 6.5;
  mesh.add(drift);
  /* LV1e: the floating brush clouds (placeClouds): two instanced draws sharing one buffer, the shadows on the paper
     first, then the glyphs lifted off it. Both take the Earth's matrix each frame (update). None until setClouds. */
  const cbuf = new Float32Array(CLOUD_MAX * 8);
  const cg = new THREE.InstancedBufferGeometry();
  cg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3));
  cg.setIndex([0, 1, 2, 2, 1, 3]);
  const cib = new THREE.InstancedInterleavedBuffer(cbuf, 8);
  cg.setAttribute('aC', new THREE.InterleavedBufferAttribute(cib, 4, 0));   // lat, lon, width (map px), seed
  cg.setAttribute('aD', new THREE.InterleavedBufferAttribute(cib, 4, 4));   // the field there, shape (0..1), -, -
  cg.instanceCount = 0;
  const UC = { uT: { value: 0 }, uSun: globe.U.uSun, uRes: globe.U.uRes, uDpr: globe.U.uDpr, uK: U.uK, uFade: U.uFade, uWash: U.uWash, uLens: globe.U.uLens, uExposure: globe.U.uExposure, cCream: U.cCream };
  const cloudVS = shadow => /* glsl */`
      attribute vec4 aC, aD;
      uniform vec2 uRes; uniform float uDpr, uK, uT, uFade, uWash; uniform vec3 uSun;
      varying vec2 vQ; varying float vA, vSeed, vF, vShape, vSunK;
      void main(){
        // the drift with the westerlies: each glyph over CLOUD_LIFE degrees, fading at either end of its run
        float ph = fract(uT * ${(CLOUD_WIND / CLOUD_LIFE).toFixed(6)} + aC.w * 0.0731);
        float lat = aC.x, lon = aC.y + (ph - 0.5) * ${CLOUD_LIFE.toFixed(2)};
        float p = radians(90.0 - lat), q = radians(lon + 180.0);
        vec3 n = vec3(-sin(p) * cos(q), cos(p), sin(p) * sin(q));
        vec3 nW = normalize(mat3(modelMatrix) * n);
        vec3 wc = (modelMatrix * vec4(n * ${(R_MAP + (0)).toFixed(4)}, 1.0)).xyz;
        float sunH = dot(nW, uSun);
        #ifdef SHADOW
          vec3 st = uSun - nW * sunH;                                   // away from the sun, along the ground
          wc += (length(st) > 1e-4 ? -normalize(st) : vec3(0.0)) * ${(CLOUD_LIFT * 1.0).toFixed(4)};
        #else
          wc += nW * ${CLOUD_LIFT.toFixed(4)};                          // lifted off the paper
        #endif
        vec3 toCam = cameraPosition - wc; float dist = length(toCam);
        float face = smoothstep(0.12, 0.4, dot(nW, toCam / dist));
        vec4 c = projectionMatrix * viewMatrix * vec4(wc, 1.0);
        vec2 hv = uRes * 0.5 / (uDpr * uK);
        float dk = clamp(pow((length(cameraPosition) - 1.0) / dist, 0.55), 0.45, 1.0);
        float W = aC.z * dk;
        vec2 half_ = vec2(0.62, 0.42) * W;
        vQ = position.xy * half_ / W;                                    // glyph units: the width is 1
        vSeed = aC.w; vF = aD.x; vShape = aD.y;
        vSunK = smoothstep(-0.12, 0.3, sunH);
        vA = face * smoothstep(0.0, 0.12, ph) * smoothstep(0.0, 0.12, 1.0 - ph) * uFade * uWash;
        vec2 s = c.xy / c.w * hv + position.xy * half_;
        gl_Position = vA < 0.002 ? vec4(2.0, 2.0, 2.0, 1.0) : vec4(s / hv * c.w, 0.0, c.w);
      }`;
  const cloudFS = GLSL + GLSL_NOISE + /* glsl */`
      uniform vec3 cCream;
      varying vec2 vQ; varying float vA, vSeed, vF, vShape, vSunK;
      /* an arc of the brush from angle a0 to a1 (radians, a0 < a1, within -pi..pi), fuller in its middle */
      float arcK(vec2 p, vec2 c, float r, float a0, float a1, float w, float aa){
        vec2 d = p - c; float th = atan(d.y, d.x);
        float t = clamp((th - a0) / (a1 - a0), 0.0, 1.0);
        float inA = step(a0, th) * step(th, a1);
        float ww = w * (0.45 + 0.75 * sin(3.14159 * t));
        return inA * (1.0 - smoothstep(ww - aa, ww + aa, abs(length(d) - r)));
      }
      /* the curl at an arc's end (angle ae on the circle c, r): it turns on inward round a circle of half the radius
         through the end point, over about three quarters of a turn, thinning as it closes */
      float curlK(vec2 p, vec2 c, float r, float ae, float w, float aa){
        vec2 e = vec2(cos(ae), sin(ae)), hc = c + e * r * 0.55;
        vec2 d = p - hc; float rr = r * 0.45;
        float th = atan(d.x * e.y - d.y * e.x, d.x * e.x + d.y * e.y);   // the angle from the end point, rotated so it starts at 0
        float t = -th / 4.4;                                             // turning on (counterclockwise seen from the lobe)
        t = th <= 0.0 ? t : -1.0;
        float rad = rr * (1.0 - 0.35 * clamp(t, 0.0, 1.0));
        float ww = w * (1.0 - 0.6 * clamp(t, 0.0, 1.0));
        return step(0.0, t) * step(t, 0.75) * (1.0 - smoothstep(ww - aa, ww + aa, abs(length(d) - rad)));
      }
      void main(){
        vec2 q = vQ; float sd = vSeed;
        if (vShape > 0.5) q.x = -q.x;                                     // half of them mirrored
        #ifdef SHADOW
          float k = (1.0 - smoothstep(0.25, 1.0, length(q / vec2(0.5, 0.26)))) * ${CLOUD_SHADOW.toFixed(2)} * vSunK * vA;
          if (k < 0.004) discard;
          gl_FragColor = vec4(0.0, 0.0, 0.0, k);
        #else
          float aa = 0.022, w = 0.03;                                    // about a css px at the glyph's width
          bool three = fract(sd * 1.37) > 0.4;
          vec3 l0 = three ? vec3(-0.24, -0.03, 0.16) : vec3(-0.15, -0.02, 0.2);
          vec3 l1 = three ? vec3(0.0, 0.07, 0.21) : vec3(0.13, 0.04, 0.17);
          vec3 l2 = vec3(0.23, -0.04, 0.14);
          float k = 0.0, body = 0.0;
          k = max(k, arcK(q, l0.xy, l0.z, 0.35, 2.9, w, aa));
          k = max(k, arcK(q, l1.xy, l1.z, 0.15, 2.75, w * 1.1, aa));
          if (three) k = max(k, arcK(q, l2.xy, l2.z, -0.2, 2.6, w, aa));
          // each lobe's left end curls inward (the curl-cloud's spiral): a half circle inside it, turning on the same way
          k = max(k, curlK(q, l0.xy, l0.z, 2.9, w * 0.75, aa));
          k = max(k, curlK(q, l1.xy, l1.z, 2.75, w * 0.75, aa));
          if (three) k = max(k, curlK(q, l2.xy, l2.z, 2.6, w * 0.7, aa));
          // the last lobe's end curls in: a small hook turning back under it
          vec3 lz = three ? l2 : l1; float ae = three ? -0.2 : 0.15;
          vec2 pe = lz.xy + lz.z * vec2(cos(ae), sin(ae)), hc = pe - 0.4 * lz.z * vec2(cos(ae), sin(ae));
          k = max(k, arcK(q, hc, 0.4 * lz.z, -2.6, ae, w * 0.8, aa));
          // the base stroke under the lobes, lifting at its right end, its left end hooked up and in
          float bx = clamp((q.x + 0.46) / 0.9, 0.0, 1.0);
          float by = -0.17 + 0.03 * sin(q.x * 5.0 + sd) + 0.04 * bx * bx;
          float bw = w * (0.35 + 0.8 * sin(3.14159 * bx));
          k = max(k, step(-0.46, q.x) * step(q.x, 0.44) * (1.0 - smoothstep(bw - aa, bw + aa, abs(q.y - by))));
          k = max(k, arcK(q, vec2(-0.43, -0.1), 0.07, -1.6, 2.4, w * 0.8, aa));
          // a faint body inside the lobes and above the base, so the glyph floats over what is under it
          body = max(max(step(length(q - l0.xy), l0.z), step(length(q - l1.xy), l1.z)), three ? step(length(q - l2.xy), l2.z) : 0.0);
          body *= step(by, q.y) * step(q.x, 0.44) * step(-0.46, q.x);
          // the brush's dry tooth
          float g = vn2(q * 38.0 + sd) * 0.7 + vn2(q * 90.0 + sd * 1.7) * 0.3;
          k *= smoothstep(0.12, 0.3, g + 0.1);
          float K = mix(${CLOUD_K[0].toFixed(2)}, ${CLOUD_K[1].toFixed(2)}, smoothstep(${CLOUD_LEVEL.toFixed(3)}, 0.97, vF));
          float a = max(k * K, body * 0.1) * mix(0.45, 1.0, vSunK) * vA * globeK();
          if (a < 0.004) discard;
          gl_FragColor = vec4(toSRGB(cCream) * a, a);
        #endif
      }`;
  const mkCloud = shadow => {
    const cm = new THREE.Mesh(cg, new THREE.ShaderMaterial({
      uniforms: UC, defines: shadow ? { SHADOW: 1 } : {}, vertexShader: cloudVS(shadow), fragmentShader: cloudFS,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: shadow ? THREE.ZeroFactor : THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    }));
    cm.frustumCulled = false; cm.renderOrder = shadow ? 6.2 : 6.3; cm.matrixAutoUpdate = false; cm.matrixWorldAutoUpdate = false; cm.visible = false;
    mesh.add(cm);
    return cm;
  };
  const cloudShadow = mkCloud(true), cloudGlyph = mkCloud(false);
  let cloudGlyphs = [], cloudPhone = false;
  const cloudCount = () => (cloudPhone ? Math.ceil(cloudGlyphs.length * CLOUD_PHONE) : cloudGlyphs.length);
  /* LV1f: the trial looks a, b, c (JCLOUD_STYLES): one quad over the ring, each pixel finding the ball under it
     (paperBase) and reading the field there (a B-spline of the texture: no texel kinks in the lines). Composited over
     the paper and under the ink, so the coasts and marks stay on top; faded round the names (uNames, css px). */
  const NAME_MAX = 24, BAND_MAX = JB_MAX;
  const UF = {
    ...P, uCloud: { value: blank() }, uCloudPx: { value: new THREE.Vector2(1 / 1024, 1 / 512) }, uT: UC.uT, uK: U.uK, uPeaks: U.uPeaks,
    uNames: { value: Array.from({ length: NAME_MAX }, () => new THREE.Vector4()) }, uNameN: { value: 0 },
    uBands: { value: Array.from({ length: BAND_MAX }, () => new THREE.Vector4()) }, uBandN: { value: 0 },
    cLeaf: { value: lin3('#e8c26a') },
  };
  let bandsAll = [], bandsPhone = 0;
  const fieldFS = GLSL + GLSL_NOISE + GLSL_PAPER + /* glsl */`
      uniform sampler2D uCloud; uniform vec2 uCloudPx; uniform float uT, uK, uPeaks, uNameN, uBandN; uniform vec3 cLeaf;
      uniform vec4 uNames[${NAME_MAX}]; uniform vec4 uBands[${BAND_MAX}];
      // the field, a cubic B-spline over four bilinear taps
      float fieldAt(vec2 uv){
        vec2 px = uCloudPx * ${JF_SPAN.toFixed(1)};                       // on a lattice JF_SPAN texels apart: the 8-bit steps smoothed out
        vec2 st = uv / px - 0.5, i = floor(st), f = st - i;
        vec2 w0 = (1.0 - f) * (1.0 - f) * (1.0 - f) / 6.0, w1 = (4.0 - 6.0 * f * f + 3.0 * f * f * f) / 6.0;
        vec2 w2 = (1.0 + 3.0 * f + 3.0 * f * f - 3.0 * f * f * f) / 6.0, w3 = f * f * f / 6.0;
        vec2 g0 = w0 + w1, g1 = w2 + w3;
        vec2 h0 = (i - 0.5 + w1 / g0) * px, h1 = (i + 1.5 + w3 / g1) * px;
        return g0.y * (g0.x * texture2D(uCloud, vec2(h0.x, h0.y)).r + g1.x * texture2D(uCloud, vec2(h1.x, h0.y)).r)
             + g1.y * (g0.x * texture2D(uCloud, vec2(h0.x, h1.y)).r + g1.x * texture2D(uCloud, vec2(h1.x, h1.y)).r);
      }
      // 0 on a name's box (and 9 css px round it), 1 clear of them
      float namesClear(){
        vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr; float k = 1.0;
        for (int i = 0; i < ${NAME_MAX}; i++) {
          if (float(i) >= uNameN) break;
          vec4 b = uNames[i]; vec2 d = max(b.xy - p, p - b.zw);
          k = min(k, smoothstep(1.0, 9.0, max(d.x, d.y)));
        }
        return k;
      }
      void main(){
        float m = paperMask() / ${BALL_K.toFixed(2)};
        vec3 base = paperBase();
        float lon = gLon - uT * 0.004;                                  // the field drifts east, slowly (still under reduced motion)
        vec2 uv = vec2(fract((lon + 180.0) / 360.0 + 1.0), (90.0 - gLat) / 180.0);
        float f = fieldAt(uv);
        vec2 gr = vec2(dFdx(f), dFdy(f));
        float gl = max(length(gr), 1e-6);                               // field per device px
        float dpd = max(length(fwidth(gPG)) * 0.7071, 1e-6);            // degrees per device px
        // the ground: land and Japan's own land (as the paper reads them)
        float lw = texture2D(uLand, vec2(gU, (90.0 - gLat) / 180.0)).r;
        vec2 tl = texture2D(uTile, clamp(gTJ, 0.0, 1.0)).rg;
        float inT = uTileOn * smoothstep(0.0, 0.045, min(min(gTJ.x, 1.0 - gTJ.x), min(gTJ.y, 1.0 - gTJ.y)));
        float land = smoothstep(0.3, 0.7, mix(lw, tl.r, inT)), jp = smoothstep(0.3, 0.7, tl.g) * inT;
        float sunK = smoothstep(-0.12, 0.3, gNdl);
        #if JSTYLE == 2
          float edge = smoothstep(0.05, 0.3, gNdv) * m * uWash * namesClear();   // flat leaf never crowds at the limb
        #else
          float edge = smoothstep(0.12, 0.5, gNdv) * m * uWash * namesClear();   // lines crowd there: gone before it
        #endif
        vec3 col = toSRGB(cCream); float a = 0.0;
        #if JSTYLE == 1
          // a: marbled ink, nested hair lines, the inner a little stronger; each breathes on its own slow clock
          float hw = 0.36 * uDpr;                                       // half a line: about 0.72 css px wide
          for (int i = 0; i < ${JA_LEVELS.length}; i++) {
            if (uPeaks < 0.5 && i < 2) continue;                        // a phone's ring keeps the four inner rings
            float L = 0.0;
            ${JA_LEVELS.map((v, i) => `if (i == ${i}) L = ${v.toFixed(3)};`).join(' ')}
            L += 0.005 * sin(uT * 0.05 + float(i) * 1.9);
            float wv = hw * (0.8 + 0.45 * vn2(gPG * 0.9 + float(i) * 5.1));   // the pull of the ink: a little thicker here and there
            float ln = 1.0 - smoothstep(max(wv - 0.5, 0.0), wv + 0.6, abs(f - L) / gl);
            // room to breathe: where the rings crowd (a sharp cloud edge) every other one gives way, then the next
            float gap = 0.015 / gl / uDpr;                              // css px to the next ring
            ln *= i == ${JA_LEVELS.length - 1} ? 1.0 : smoothstep(mod(float(i), 2.0) < 0.5 ? 6.0 : 3.0, mod(float(i), 2.0) < 0.5 ? 9.0 : 5.0, gap);
            a = max(a, ln * mix(${JA_K[0].toFixed(2)}, ${JA_K[1].toFixed(2)}, float(i) / ${(JA_LEVELS.length - 1).toFixed(1)}));
          }
          a *= mix(1.0, 0.5, land) * (1.0 - 0.55 * jp) * mix(0.75, 1.0, sunK);
        #elif JSTYLE == 2
          // b: gold leaf, level bands with rounded ends; leaf squares, a brighter rim, a glint that moves as the ball turns
          vec2 p = gPG + vec2(uT * 0.003, 0.0);
          float d = 1e3; float bid = 0.0;
          for (int i = 0; i < ${BAND_MAX}; i++) {
            if (float(i) >= uBandN) break;
            vec4 B = uBands[i];
            float e = length(vec2(p.x - clamp(p.x, B.x, B.y), p.y - B.z)) - B.w;
            if (e < d) { d = e; bid = float(i); }
          }
          d += 0.035 * (vn(p.x * 2.6 + bid * 4.1) - 0.5) + 0.015 * (vn(p.x * 9.0 + bid) - 0.5);   // the cut edge, by hand: never ruled
          float dd = d / dpd;                                           // device px, negative inside
          float cover = 1.0 - smoothstep(-0.6, 0.6, dd);
          float rim = (1.0 - smoothstep(0.6 * uDpr, 2.2 * uDpr, -dd)) * cover;
          vec2 lc = p / ${JB_LEAF.toFixed(2)};                             // the leaf: squares laid edge to edge, each its own tone
          vec2 ci = floor(lc), fr = fract(lc);
          float tone = h2(ci);
          // the seams: where two leaves overlap, a hair-thin brighter line (the leaf doubled)
          float seam = 1.0 - smoothstep(0.3 * uDpr * dpd / ${JB_LEAF.toFixed(2)}, 0.9 * uDpr * dpd / ${JB_LEAF.toFixed(2)}, min(min(fr.x, 1.0 - fr.x), min(fr.y, 1.0 - fr.y)));
          float glint = pow(0.5 + 0.5 * sin(tone * 37.0 + dot(gN, vec3(19.0, 13.0, 7.0))), 8.0);
          float tooth = vn2(p * 45.0 + bid * 3.0);                      // the leaf's own fine crinkle, about two css px, fixed to the ball
          col = toSRGB(cLeaf) * (0.92 + 0.05 * tone + 0.07 * (tooth - 0.5) + 0.06 * seam) + vec3(0.1, 0.085, 0.04) * glint * 0.6 + vec3(0.12, 0.1, 0.05) * rim;
          a = cover * (${JB_K.toFixed(2)} + 0.12 * rim + 0.12 * (1.0 - sunK)) * (1.0 - jp);   // by night the leaf holds the light (no dimming: dimmed gold reads brown)
        #else
          // c: brush lines, thick-thin by the stroke's direction (the brush held at 45 degrees), dry at the edge, broken where the edge is soft
          vec2 tg = vec2(-gr.y, gr.x) / gl;
          float nib = 0.42 + 0.58 * abs(dot(tg, vec2(0.7071, -0.7071)));
          float gdeg = gl / dpd;                                        // field per degree: a sharp cloud edge or a soft one
          for (int i = 0; i < ${JC_LEVELS.length}; i++) {
            if (uPeaks < 0.5 && i == 0) continue;
            float L = ${JC_LEVELS[0].toFixed(3)}; if (i == 1) L = ${JC_LEVELS[1].toFixed(3)};
            L += 0.004 * sin(uT * 0.05 + float(i) * 2.3);
            float gate = smoothstep(0.004, 0.014, gdeg) * smoothstep(0.22, 0.42, vn2(gPG * 0.55 + float(i) * 7.3));
            float hw = 1.3 * uDpr * uK * nib * (0.25 + 0.75 * gate);
            float s = abs(f - L) / gl;
            float k = (1.0 - smoothstep(hw - 0.6, hw + 0.6, s)) * smoothstep(0.05, 0.3, gate);
            float grain = vn2(gPG * 26.0 + float(i) * 3.0) * 0.7 + vn2(gPG * 70.0) * 0.3;
            float thr = 0.08 + 0.3 * (1.0 - gate) + 0.25 * smoothstep(0.5, 1.0, s / max(hw, 0.5));
            k *= smoothstep(thr - 0.07, thr + 0.07, grain);
            a = max(a, k * (${JC_K.toFixed(2)} + 0.04 * float(i)));
          }
          a *= mix(1.0, 0.3, land) * (1.0 - 0.6 * jp) * mix(0.75, 1.0, sunK);   // over land a stroke reads as a river or a border: faint there
        #endif
        a = clamp(a * edge * globeK(), 0.0, 1.0);
        if (a < 0.004) discard;
        gl_FragColor = vec4(col * a, a);
      }`;
  let fieldLook = null;
  if (jStyle === 'a' || jStyle === 'b' || jStyle === 'c') {
    fieldLook = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: UF, defines: { JSTYLE: { a: 1, b: 2, c: 3 }[jStyle] },
      vertexShader: /* glsl */`uniform vec4 uLens; uniform vec2 uRes; void main(){ gl_Position = vec4((uLens.xy + position.xy * (uLens.z + 2.0)) / uRes * 2.0 - 1.0, 0.0, 1.0); }`,
      fragmentShader: fieldFS,
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    }));
    fieldLook.frustumCulled = false; fieldLook.renderOrder = 5.8; fieldLook.visible = false;
    mesh.add(fieldLook);
  }
  let clock = still ? 1e4 : 0, drawing = false, drawn = still, draws = 0, after = 0, labelK = still ? 1 : 0, phone = false;
  // ---- the names
  const labelsRoot = document.createElement('div');
  labelsRoot.className = 'scene-map-labels';
  labelsRoot.setAttribute('aria-hidden', 'true');
  Object.assign(labelsRoot.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 'var(--z-content)', overflow: 'hidden' });
  const sceneRoot = document.getElementById('scene-root');
  (sceneRoot?.parentNode || document.body).insertBefore(labelsRoot, sceneRoot ? sceneRoot.nextSibling : null);
  /* LV1b: a name stands off its dot by its own offset (LABELS place, map px, scaled with the map), on the sea or clear
     inland, so it never sits on the coast, the road, the seal or another name; where it stands well off, a short thin
     leader runs from the dot toward it. The dot, the leader and the name are three elements (only the name is
     [data-map-label]). On a phone's ring only TOKYO is shown. */
  const mk = (tag, css) => { const e = document.createElement(tag); Object.assign(e.style, { position: 'absolute', left: '0', top: '0', opacity: '0', visibility: 'hidden', willChange: 'transform, opacity', pointerEvents: 'none', ...css }); labelsRoot.appendChild(e); return e; };
  const labels = [...LABELS, ...NEAR_LABELS.map(l => ({ ...l, near: true }))].map(L => {
    const dot = L.side === 'seal' ? null : mk('span', { width: L.near ? '2px' : '3px', height: L.near ? '2px' : '3px', borderRadius: '50%', background: CREAM });
    const lead = L.side === 'seal' ? null : mk('span', { width: '1px', height: '1px', background: CREAM, transformOrigin: '0 50%' });
    const el = mk('div', {
      whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: L.near ? '9px' : '10px', lineHeight: '1', letterSpacing: 'var(--track-label)',
      textTransform: 'uppercase', fontVariantLigatures: 'none', color: CREAM,
    });
    el.dataset.mapLabel = L.name.toLowerCase();
    if (L.near) el.dataset.mapNear = '1';
    el.textContent = L.name;
    const o = [0, 0, 0]; xyz(L.lat, L.lon, o);
    return { ...L, near: !!L.near, el, dot, lead, obj: new THREE.Vector3(o[0], o[1], o[2]), w: 0, h: 0, shown: false, want: false, at: { x: 0, y: 0 }, box: { x: 0, y: 0, w: 0, h: 0 }, line: null, tx: '', dtx: '', ltx: '', op: '' };
  });
  const wv = new THREE.Vector3(), sp = { x: 0, y: 0 }, nv = new THREE.Vector3(), cv = new THREE.Vector3();
  const placed = [];
  function placeLabels() {
    const k = U.uFade.value * labelK;
    const L = globe.layout, uk = U.uK.value;
    phone = L.r < 160;
    placed.length = 0;
    for (const l of labels) {
      l.want = false;
      if (k < 0.01 || (phone && l.side !== 'seal')) continue;
      if (!l.w) { l.el.style.visibility = 'visible'; l.w = l.el.offsetWidth; l.h = l.el.offsetHeight; l.el.style.visibility = 'hidden'; }
      wv.copy(l.obj).applyMatrix4(globe.earth.matrixWorld);
      if (l.near) {   // a neighbour's name only on the near side, well in from the limb
        nv.copy(wv).normalize(); cv.copy(globe.camera.position).sub(wv).normalize();
        if (nv.dot(cv) < 0.25) continue;
      }
      globe.project(wv, sp);
      l.at.x = sp.x; l.at.y = sp.y;
      let ok = null;
      if (l.side === 'seal') {
        for (const [bx, by] of [[sp.x + (17 + 10.5 + 5) * uk, sp.y + 15 * uk - l.h / 2], [sp.x + 17 * uk - l.w / 2, sp.y + (15 + 10.5 + 4) * uk]]) {
          const box = { x: bx, y: by, w: l.w, h: l.h };
          if (!insideRing(box, L.cx, L.cy, L.r) || placed.some(p => boxesClash(p, box))) continue;
          ok = box; break;
        }
      } else {
        const box = nameBox(l, sp.x, sp.y, uk, l.w, l.h);
        if (insideRing(box, L.cx, L.cy, L.r, l.near ? 14 : 8) && !placed.some(p => boxesClash(p, box))) ok = box;
      }
      if (!ok) continue;
      placed.push(ok); l.box = ok; l.want = true;
      l.line = l.side === 'seal' ? null : leaderLine(l, sp.x, sp.y, uk, ok);
    }
    for (const l of labels) {
      const show = l.want;
      l.shown = show;
      const base = l.side === 'seal' ? LABEL_K_TOKYO : (l.near ? LABEL_K_NEAR : LABEL_K);
      const op = show ? String(+(base * k).toFixed(3)) : '0';
      if (op !== l.op) {
        l.op = op; const vis = show ? 'visible' : 'hidden';
        l.el.style.opacity = op; l.el.style.visibility = vis;
        if (l.dot) { l.dot.style.opacity = op; l.dot.style.visibility = vis; }
        if (l.lead) { l.lead.style.opacity = show ? String(+(base * k * LEADER_K).toFixed(3)) : '0'; l.lead.style.visibility = show && l.line ? 'visible' : 'hidden'; }
      }
      if (!show) continue;
      const tx = `translate(${l.box.x.toFixed(1)}px, ${l.box.y.toFixed(1)}px)`;
      if (tx !== l.tx) { l.tx = tx; l.el.style.transform = tx; }
      if (l.dot) { const d = `translate(${(l.at.x - (l.near ? 1 : 1.5)).toFixed(1)}px, ${(l.at.y - (l.near ? 1 : 1.5)).toFixed(1)}px)`; if (d !== l.dtx) { l.dtx = d; l.dot.style.transform = d; } }
      if (l.lead) {
        const ln = l.line, s = ln ? `translate(${ln.x.toFixed(1)}px, ${(ln.y - 0.5).toFixed(1)}px) rotate(${ln.a.toFixed(2)}deg) scaleX(${ln.len.toFixed(1)})` : '';
        if (s !== l.ltx) { l.ltx = s; l.lead.style.visibility = ln ? 'visible' : 'hidden'; if (ln) l.lead.style.transform = s; }
      }
    }
  }
  const total = built.drawSeconds;
  const setClock = c => { U.uClock.value = c; U.uWash.value = still ? 1 : Math.min(1, Math.max(0, (c - WASH_AT) / WASH_S)); };
  setClock(clock);
  const lights = new Float32Array(LIGHTS.length).fill(-1);
  let plateT = 0, plate = null;   // JP1: the plate's texture once it has loaded, and its fade-in (0..1)
  const plateK = () => { const t = Math.min(1, plateT); return t * t * (3 - 2 * t); };
  return {
    /** JP1: the plate has loaded (an Image or ImageBitmap of the equirectangular picture over PLATE): it fades in over
        PLATE_IN s (at once when still). */
    setPlate(img) {
      const t = new THREE.Texture(img);
      Object.assign(t, { flipY: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, anisotropy: 4 });
      if ('colorSpace' in t) t.colorSpace = THREE.NoColorSpace || '';   // the picture's bytes are the paper's sRGB values, as the shader writes them
      t.needsUpdate = true;
      P.uPlate.value = t;
      plate = { width: img.width, height: img.height };
      plateT = still ? 1 : 0;
      P.uPlateOn.value = plateK();
      return t;
    },
    /** JP2: back to the procedural map (the caller found the plate's upload refused by WebGL). */
    clearPlate() {
      const t = P.uPlate.value;
      P.uPlate.value = blankPlate; P.uPlateOn.value = 0; plate = null; plateT = 0;
      if (t && t !== blankPlate) t.dispose();
    },
    /** JP2, sceneDebug only: draw the plate's region from an empty (black) picture, its fade unchanged, so a test can see
        what of the procedural map is still drawn there; false restores the picture. */
    debugBlankPlate(on) {
      if (!plate) return null;
      if (on && P.uPlate.value !== blankPlate) { plate.tex = P.uPlate.value; P.uPlate.value = blankPlate; }
      if (!on && plate.tex) { P.uPlate.value = plate.tex; plate.tex = null; }
      return P.uPlate.value === blankPlate;
    },
    plate: () => (plate ? { width: plate.width, height: plate.height, on: +P.uPlateOn.value.toFixed(3), blank: P.uPlate.value === blankPlate } : null),
    mesh, stats: built.stats, count: built.count, drawSeconds: total,
    /** a: the draw set's share times the stage's strength. */
    setFade(a) { U.uFade.value = a; mesh.visible = a > 0.002; },
    fade: () => U.uFade.value,
    /** Every width and mark as a share of the desktop's (the disc's radius over REF_R); the peaks and air routes only where they stay clean. */
    setScale(r) {
      U.uK.value = Math.min(1.2, Math.max(0.55, r / REF_R)); U.uPeaks.value = r / REF_R >= PEAKS_MIN_SCALE ? 1 : 0;
      sg.instanceCount = r / REF_R >= PEAKS_MIN_SCALE ? DRIFT_DESK : DRIFT_PHONE;
      cloudPhone = r / REF_R < PEAKS_MIN_SCALE; cg.instanceCount = cloudCount();   // LV1e: a phone's ring takes a third of the clouds
      UF.uBandN.value = cloudPhone ? bandsPhone : bandsAll.length;                    // LV1f: a phone's ring, the three largest masses' bands
    },
    scale: () => U.uK.value,
    peaks: () => U.uPeaks.value > 0.5,
    /** Per frame, after the globe has posed the Earth. The draw-in starts the first time the map shows, once. */
    update(dt) {
      const ew = globe.earth.matrixWorld;
      mesh.matrix.copy(ew); mesh.matrixWorld.copy(ew);
      if (washMesh) washMesh.matrixWorld.copy(ew);
      cloudShadow.matrixWorld.copy(ew); cloudGlyph.matrixWorld.copy(ew);   // LV1e: the clouds turn with the ball
      const cam = globe.camera;
      P.uClipToWorld.value.multiplyMatrices(cam.matrixWorld, cam.projectionMatrixInverse);
      P.uObjRot.value.setFromMatrix4(ew).transpose();
      if (!drawn && !drawing && U.uFade.value > 0.05) { drawing = true; draws++; }
      if (drawing) { clock += dt; if (clock >= total) { drawing = false; drawn = true; clock = 1e4; } }
      setClock(clock);
      if (plate && plateT < 1) { plateT += dt / PLATE_IN; P.uPlateOn.value = plateK(); }
      if (drawn && !still) { after += dt; labelK = Math.min(1, labelK + dt / LABEL_IN); }
      if (!still) { UD.uT.value += dt; UD.uShow.value = labelK; U.uFlow.value += dt; UC.uT.value += dt; }   // LV1e: the clouds' drift too
      for (let i = 0; i < LIGHTS.length; i++) lights[i] = drawn && !still ? lightAt(after, LIGHTS[i]) : -1;
      U.uRoadL.value.set(lights[0], lights[1], lights[2]); U.uAirL.value.set(lights[3] ?? -1, lights[4] ?? -1, lights[5] ?? -1);   // LV1d: two air routes (ids 3, 4)
      placeLabels();
      if (fieldLook) {   // LV1f: the names' boxes, so the trial's clouds clear them
        let n = 0;
        for (const l of labels) if (l.shown && n < NAME_MAX) { UF.uNames.value[n++].set(l.box.x, l.box.y, l.box.x + l.box.w, l.box.y + l.box.h); }
        UF.uNameN.value = n;
      }
    },
    /** Skip the draw-in (reduced motion). */
    finish() { drawing = false; drawn = true; clock = 1e4; setClock(clock); if (plate) { plateT = 1; P.uPlateOn.value = 1; } },
    progress: () => (drawn ? 1 : Math.min(1, clock / total)),
    drawing: () => drawing,
    draws: () => draws,
    /** The Tokaido's light (0..1 along it, -1 between runs); lights(): every line's. */
    light: () => lights[0],
    lights: () => LIGHTS.map((L, i) => ({ line: L.line, at: +lights[i].toFixed(4) })),
    /** What the paper is: a ball (the ray cast onto the sphere), with or without the land texture and the gold's pictures. */
    paper: () => ({ kind: 'sphere', landTexture, tile: !!tileTex, liteWash: !!washMesh, wash: +U.uWash.value.toFixed(3) }),
    /** LV1d: today's clouds as ink wash on the paper: the Earth level's own field (clouds.mjs), never fetched again here;
        null (or never called) leaves the paper clear. */
    setClouds(field) {
      cloudGlyphs = [];
      const img = field?.image;
      if (fieldLook) { fieldLook.visible = false; bandsAll = []; bandsPhone = 0; UF.uBandN.value = 0; }
      if (img?.data && img.width && img.height && jStyle !== '0') {
        const { data, width: fw, height: fh } = img;
        const sample = (lat, lon) => {
          const x = ((Math.floor((lon + 180) / 360 * fw) % fw) + fw) % fw, y = Math.min(fh - 1, Math.max(0, Math.floor((90 - lat) / 180 * fh)));
          return data[y * fw + x] / 255;
        };
        if (jStyle === 'g') cloudGlyphs = placeClouds(sample);
        else {   // LV1f: the trial's looks read the texture itself
          UF.uCloud.value = field; UF.uCloudPx.value.set(1 / fw, 1 / fh);
          if (jStyle === 'b') {
            bandsAll = placeBands(sample);
            bandsAll.forEach((b, i) => UF.uBands.value[i].set(b.x0, b.x1, b.y, b.h));
            bandsPhone = bandsAll.filter(b => b.mass < 3).length;
            UF.uBandN.value = cloudPhone ? bandsPhone : bandsAll.length;
          }
          fieldLook.visible = jStyle !== 'b' || bandsAll.length > 0;
        }
      }
      cloudGlyphs.forEach((c, i) => { cbuf.set([c.lat, c.lon, c.w, c.seed, c.f, hash(c.seed + 7) > 0.5 ? 1 : 0, 0, 0], i * 8); });
      cib.needsUpdate = true;
      cg.instanceCount = cloudCount();
      cloudShadow.visible = cloudGlyph.visible = cloudGlyphs.length > 0;
    },
    /** LV1e: the floating brush clouds: on, how many glyphs, how many drawn (a phone a third), how many face the viewer
        inside the ring now, where they stand (sea, land's top band, Japan), and the drift clock (s). */
    clouds() {
      const n = cg.instanceCount, L = globe.layout, o = [0, 0, 0];
      let inView = 0;
      for (let i = 0; i < n; i++) {
        const c = cloudGlyphs[i]; xyz(c.lat, c.lon, o, 0, 1);
        wv.set(o[0], o[1], o[2]).applyMatrix4(globe.earth.matrixWorld);
        nv.copy(wv).normalize(); cv.copy(globe.camera.position).sub(wv).normalize();
        if (nv.dot(cv) < 0.12) continue;
        globe.project(wv, sp);
        if (Math.hypot(sp.x - L.cx, sp.y - L.cy) < L.r * 0.95) inView++;
      }
      const where = w => cloudGlyphs.slice(0, n).filter(c => c.where === w).length;
      if (jStyle !== 'g') return { on: !!fieldLook?.visible, style: jStyle, bands: bandsAll.map(b => [+b.x0.toFixed(1), +b.x1.toFixed(1), +b.y.toFixed(1), +b.h.toFixed(2), b.mass]), bandsDrawn: UF.uBandN.value, drift: +UC.uT.value.toFixed(3) };   // LV1f
      return { on: cloudGlyphs.length > 0, style: 'glyph', glyphs: cloudGlyphs.length, drawn: n, inView, sea: where('sea'), land: where('land'), japan: where('japan'), drift: +UC.uT.value.toFixed(3) };
    },
    /** LV1d: the currents' drift clock (s): it runs with the page, and stands still under reduced motion. */
    flow: () => U.uFlow.value,
    /** LV1d: the compass rose's centre on screen (css px) and whether it is drawn (the desktop's ring; never a phone's). */
    compassAt() {
      const o = [0, 0, 0]; xyz(COMPASS.lat, COMPASS.lon, o);
      wv.set(o[0], o[1], o[2]).applyMatrix4(globe.earth.matrixWorld);
      nv.copy(wv).normalize(); cv.copy(globe.camera.position).sub(wv).normalize();
      globe.project(wv, sp);
      return { x: +sp.x.toFixed(1), y: +sp.y.toFixed(1), shown: mesh.visible && U.uPeaks.value > 0.5 && nv.dot(cv) > 0.05 };
    },
    /** The season's drifters: which, and how many are drawn. */
    season: () => seasonName,
    drifters: () => sg.instanceCount,
    driftClock: () => UD.uT.value,
    labels: () => labels.map(l => ({ name: l.name, near: l.near, shown: l.shown, box: l.shown ? [Math.round(l.box.x), Math.round(l.box.y), Math.round(l.box.w), Math.round(l.box.h)] : null, dot: l.shown ? [+l.at.x.toFixed(1), +l.at.y.toFixed(1)] : null, leader: l.shown && !!l.line })),
    labelsRoot,
  };
}
