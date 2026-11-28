/* EB2, the aurora's pure parts (no three.js): where the two auroral ovals lie and when they can be seen. aurora.mjs
   draws from the same numbers (its shader is built from these constants), and tests/unit/scene-aurora.test.mjs pins them.
   Vectors are object-space unit vectors in the globe's frame (data/places.mjs latLonToXYZ). */
import { latLonToXYZ } from './data/places.mjs?v=2';

/** The geomagnetic poles (north, south). */
export const POLES = [{ lat: 80.7, lon: -72.7 }, { lat: -80.7, lon: 107.3 }];
/** Degrees: the oval's radius round its centre, and the centre's push from the pole toward the night side. The band
    then lies OVAL_R + OVAL_SHIFT (23) from the pole at local midnight and OVAL_R - OVAL_SHIFT (17) at noon. */
export const OVAL_R = 20, OVAL_SHIFT = 3;
/** Sun elevations (degrees) of the darkness rule: full at DARK_FULL and below, gone at DARK_GONE and above. */
export const DARK_FULL = -8, DARK_GONE = -1;

const DEG = Math.PI / 180;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const comb = (a, ka, b, kb) => [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];

/** The pole as a unit vector: which = 0 north, 1 south. */
export const poleVec = which => latLonToXYZ(POLES[which].lat, POLES[which].lon);

/** The oval's frame for a sun direction: its centre C and the tangent axes (t1 points to local midnight). The shader
    builds the same frame. */
export function ovalFrame(pole, sun) {
  const s = norm(sun);
  let e = comb(s, -1, pole, dot(s, pole));                     // -sun, less its part along the pole
  e = Math.hypot(...e) > 1e-6 ? norm(e) : norm(cross(pole, [0, 1, 0]));
  const C = norm(comb(pole, Math.cos(OVAL_SHIFT * DEG), e, Math.sin(OVAL_SHIFT * DEG)));
  const t1 = norm(comb(e, 1, C, -dot(e, C))), t2 = cross(C, t1);
  return { C, t1, t2 };
}
/** The point of the oval at angle a (0 = local midnight, PI = noon), offset by dDeg across the band (+ equatorward). */
export function ovalPoint(frame, a, dDeg = 0) {
  const th = (OVAL_R + dDeg) * DEG;
  const r = comb(frame.t1, Math.cos(a), frame.t2, Math.sin(a));
  return norm(comb(frame.C, Math.cos(th), r, Math.sin(th)));
}
/** Angular distance (degrees) between two unit vectors. */
export const angleDeg = (a, b) => Math.acos(Math.max(-1, Math.min(1, dot(norm(a), norm(b))))) / DEG;

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** How dark the sky is over a point, 0..1, from the sun's elevation there (sin(elevation) = ground . sun). */
export const darkness = sinElev => 1 - smooth(Math.sin(DARK_FULL * DEG), Math.sin(DARK_GONE * DEG), sinElev);
