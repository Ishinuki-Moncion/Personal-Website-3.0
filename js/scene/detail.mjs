/* The Earth's detail (step F1a, design section 14.1): loaded after the first view, never before it.
   next.mjs imports this module only once the first frame has been drawn and the page is idle; it then
   fetches the baked data (data/land-05, land-japan, coast-world, coast-japan, lights and the two night-light
   images) and builds what the globe draws from it, in slices, so no slice holds the main thread long.

   Everything here except loadDetail() is pure (no DOM, no three.js), so the unit tests run it in Node.

   What is built:
   - fine land dots: the world from the 0.5-degree grid, thinned along each row by cos(latitude) (an error
     diffusion along the row, so the kept dots are evenly spaced and the density is even over the sphere);
     inside the Japan tile's box the tile's own 0.1-degree cells replace the world's, so nothing is drawn
     twice. The phone tier takes every other row and half the columns of the world (a 1-degree world: a
     quarter of the desktop's dots), and the same tile. No cell is sorted by country.
   - a small land texture (720 x 360, two bytes a cell): R = land, G = land blurred over about 1.5 degrees,
     for the ocean's glint and the faint lift along coasts in the body shader.
   - coast segments: every line of the world coast and the Japan coast as object-space segments. */

const DEG = Math.PI / 180;
export const BOX = { west: 122, east: 146, south: 24, north: 46 };   // the Japan tile (data/land-japan.mjs)
export const inBox = (lat, lon) => lat >= BOX.south && lat <= BOX.north && lon >= BOX.west && lon <= BOX.east;
/* The seam. The tile's box has edges that cross land (46 N through Russia, 122 E through China); a hard switch from
   the tile's dots to the world's shows there as a straight line. So the two sets cross over across FEATHER degrees
   inside the box: tileShare is the tile's share of a dot's area at a point (0 outside the box, 1 deeper than
   FEATHER in), and the world keeps the rest. */
export const FEATHER = 2.5;
export function tileShare(lat, lon) {
  const d = Math.min(lat - BOX.south, BOX.north - lat, lon - BOX.west, BOX.east - lon);
  if (d <= 0) return 0;
  if (d >= FEATHER) return 1;
  const t = d / FEATHER;
  return t * t * (3 - 2 * t);
}

/* The same mapping as data/places.mjs latLonToXYZ, inlined so this module needs no import. */
function xyz(lat, lon, r, out, o) {
  const p = (90 - lat) * DEG, q = (lon + 180) * DEG;
  out[o] = -r * Math.sin(p) * Math.cos(q); out[o + 1] = r * Math.cos(p); out[o + 2] = r * Math.sin(p) * Math.sin(q);
}
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

/** Fetch every detail file once. Rejects if any one fails (the caller keeps the scene as it is). */
export async function loadDetail() {
  const image = name => new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onerror = () => reject(new Error('detail image'));
    img.onload = () => (typeof img.decode === 'function' ? img.decode().then(() => resolve(img), () => resolve(img)) : resolve(img));
    img.src = new URL(`./data/${name}?v=1`, import.meta.url).href;
  });
  const [land05, japan, coastW, coastJ, lights, lightsW, lightsJ] = await Promise.all([
    import('./data/land-05.mjs?v=1'), import('./data/land-japan.mjs?v=1'),
    import('./data/coast-world.mjs?v=1'), import('./data/coast-japan.mjs?v=1'), import('./data/lights.mjs?v=1'),
    image('lights-world.png'), image('lights-japan.png'),
  ]);
  return { land05, japan, coastW, coastJ, lights, lightsW, lightsJ };
}

/** A slicer: resolves at once while the slice has time left, otherwise after yielding to the page. */
export function slicer(budgetMs = 6) {
  let t0 = performance.now();
  return () => {
    if (performance.now() - t0 < budgetMs) return null;
    return new Promise(resolve => setTimeout(resolve, 0)).then(() => { t0 = performance.now(); });
  };
}

/** The fine land dots. relief(lon, lat) -> 0|1 (data/relief-mask.mjs). Returns typed arrays for the globe's dot mesh:
    pos (x, y, z, radius) per dot, aux (city light 0, flicker phase, relief), geo (u, v on the world's equirectangular
    images, row 0 = north), and the counts. */
export async function buildFineDots({ land05, japan }, { phone = false, relief = () => 0, pause = () => null } = {}) {
  const { LAND05_W: W5, LAND05_H: H5, LAND05_B64 } = land05;
  const { LAND_JAPAN_W: WJ, LAND_JAPAN_H: HJ, LAND_JAPAN_B64 } = japan;
  const b5 = atob(LAND05_B64), bj = atob(LAND_JAPAN_B64);
  const bit = (bits, i) => (bits.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
  const land5 = (x, y) => (y < 0 || y >= H5) ? 0 : bit(b5, y * W5 + (((x % W5) + W5) % W5));
  const landJ = (x, y) => (x < 0 || y < 0 || x >= WJ || y >= HJ) ? 1 : bit(bj, y * WJ + x);
  const cell5 = 180 / H5, cellJ = (BOX.north - BOX.south) / HJ;
  const step = phone ? 2 : 1;                              // phone: a 1-degree world
  const cap = Math.ceil((W5 * H5) / (step * step)) + WJ * HJ;
  const pos = new Float32Array(cap * 4), aux = new Float32Array(cap * 3), geo = new Float32Array(cap * 2);
  let n = 0;
  /* kind (aux.x): 0 the world; 0.5 the tile's orbit set (every second cell each way: it stands for four cells
     until the view comes down); 1 the tile's zoom-only set (the other three in four, which arrive as a halftone
     opens). scale: the seam's feather (below), as a share of the dot's area. */
  const push = (lat, lon, spacing, coast, i, kind = 0, scale = 1) => {
    xyz(lat, lon, 1, pos, n * 4);
    const hill = relief(lon, lat) ? 1 : 0;
    pos[n * 4 + 3] = spacing * (coast ? 0.52 : 0.43) * (hill ? 1.12 : 1) * Math.sqrt(scale);
    aux[n * 3] = kind; aux[n * 3 + 1] = hash(i, 7.3) * 6.2832; aux[n * 3 + 2] = hill;
    geo[n * 2] = (lon + 180) / 360; geo[n * 2 + 1] = (90 - lat) / 180;
    n++;
  };
  // the world, thinned by cos(latitude) along each row
  for (let y = 0; y < H5; y += step) {
    const lat = 90 - (y + step / 2) * cell5;
    const keep = Math.cos(lat * DEG) / step;
    let acc = hash(y, 1.7);
    for (let x = 0; x < W5; x += 1) {
      acc += keep;
      if (acc < 1) continue;
      acc -= 1;
      if (!land5(x, y)) continue;
      const lon = -180 + (x + 0.5) * (360 / W5);
      const out = 1 - tileShare(lat, lon);                 // the tile draws its box; the two sets cross over at its edge
      if (out < 0.04) continue;
      const jl = (hash(x, y) - 0.5) * 0.5 * step * cell5, jo = (hash(y, x) - 0.5) * 0.5 * step * cell5;
      const coast = !land5(x - step, y) || !land5(x + step, y) || !land5(x, y - step) || !land5(x, y + step);
      push(lat + jl, lon + jo / Math.max(0.2, Math.cos(lat * DEG)), step * cell5 * DEG, coast, y * W5 + x, 0, out);
    }
    const p = pause(); if (p) await p;
  }
  const worldCount = n;
  // the Japan tile: every land cell, a third of a cell of jitter so the grid makes no moire at orbit
  for (let y = 0; y < HJ; y++) {
    const lat = BOX.north - (y + 0.5) * cellJ;
    const spacing = cellJ * DEG * Math.sqrt(Math.cos(lat * DEG));
    for (let x = 0; x < WJ; x++) {
      if (!bit(bj, y * WJ + x)) continue;
      const lon = BOX.west + (x + 0.5) * cellJ;
      const share = tileShare(lat, lon);
      if (share < 0.04) continue;
      const coast = !landJ(x - 1, y) || !landJ(x + 1, y) || !landJ(x, y - 1) || !landJ(x, y + 1);
      const kind = (x & 1) === 0 && (y & 1) === 0 ? 0.5 : 1;
      push(lat + (hash(x, y + 9) - 0.5) * 0.33 * cellJ, lon + (hash(y, x + 9) - 0.5) * 0.33 * cellJ, spacing, coast, 1e6 + y * WJ + x, kind, share);
    }
    if ((y & 7) === 7) { const p = pause(); if (p) await p; }
  }
  return { pos: pos.slice(0, n * 4), aux: aux.slice(0, n * 3), geo: geo.slice(0, n * 2), count: n, worldCount, tileCount: n - worldCount, boxCount: n - worldCount };
}

/** The land texture: 720 x 360, RG, R = land (255), G = land blurred (box, radius 3 cells each way). */
export async function buildLandTexture({ land05 }, { pause = () => null } = {}) {
  const { LAND05_W: W, LAND05_H: H, LAND05_B64 } = land05;
  const bits = atob(LAND05_B64);
  const land = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) land[i] = (bits.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
  const R = 3, tmp = new Float32Array(W * H), out = new Uint8Array(W * H * 2);
  for (let y = 0; y < H; y++) {
    let s = 0;
    for (let k = -R; k <= R; k++) s += land[y * W + ((k + W) % W)];
    for (let x = 0; x < W; x++) {
      tmp[y * W + x] = s;
      s += land[y * W + ((x + R + 1) % W)] - land[y * W + ((x - R + W) % W)];
    }
  }
  { const p = pause(); if (p) await p; }
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      let s = 0;
      for (let k = -R; k <= R; k++) s += tmp[Math.max(0, Math.min(H - 1, y + k)) * W + x];
      const i = y * W + x;
      out[i * 2] = land[i] * 255;
      out[i * 2 + 1] = Math.round((s / ((2 * R + 1) * (2 * R + 1))) * 255);
    }
  }
  return { data: out, width: W, height: H };
}

/** Coast segments in object space at radius r: seg = (ax, ay, az, bx, by, bz, kind) per segment.
    kind 1 = the world coast (faint), 2 = the Japan coast (brighter inside the footprint). */
export function buildCoastSegments({ coastW, coastJ }, { r = 1.0015 } = {}) {
  const lines = [[coastW.decodeCoastWorld(), 1], [coastJ.decodeCoastJapan(), 2]];
  let total = 0;
  for (const [{ offsets }] of lines) total += offsets[offsets.length - 1];
  const seg = new Float32Array(total * 7), a = new Float32Array(3), b = new Float32Array(3);
  let n = 0;
  for (const [{ coords, offsets }, kind] of lines) {
    for (let k = 0; k + 1 < offsets.length; k++) {
      for (let p = offsets[k]; p + 1 < offsets[k + 1]; p++) {
        const lon0 = coords[2 * p], lat0 = coords[2 * p + 1], lon1 = coords[2 * p + 2], lat1 = coords[2 * p + 3];
        if (lon0 === lon1 && lat0 === lat1) continue;
        if (Math.abs(lon1 - lon0) > 180) continue;        // a line crossing the antimeridian: no segment across the map
        if (kind === 1 && (inBox(lat0, lon0) || inBox(lat1, lon1))) continue;   // the Japan coast draws the tile's box
        xyz(lat0, lon0, r, a, 0); xyz(lat1, lon1, r, b, 0);
        seg.set(a, n * 7); seg.set(b, n * 7 + 3); seg[n * 7 + 6] = kind;
        n++;
      }
    }
  }
  return { seg: seg.slice(0, n * 7), count: n };
}
