/* The sky's arithmetic (design 14.3 and 14.4), with no imports at all so Node's unit tests load it as is.

   Frames. The scene's Earth-fixed frame is the one js/scene/data/places.mjs latLonToXYZ defines (y to the
   north pole, longitude 0 at -x... see latLonToVec below, the same formula). The sun (globe.mjs) is placed in
   it by latitude and east longitude; so are the stars here: a star of right ascension RA and declination Dec
   stands over the point of latitude Dec and east longitude RA - GMST. Turning the "equatorial" frame (the same
   formula with longitude = RA) by -GMST about the polar axis gives the Earth-fixed one, so the stars share the
   sun's frame and turn with the Earth's pose exactly as the land does.

   Positions are J2000 with no precession (about 0.37 degree by 2026): well inside what a screen shows. */

export const DEG = Math.PI / 180;

/** Julian date of a UTC instant in milliseconds since 1970 (Date.now()). */
export const julianDate = msUtc => msUtc / 86400000 + 2440587.5;

/** Greenwich mean sidereal time in degrees, 0..360 (the short formula, good to well under a second of time). */
export function gmstDeg(msUtc) {
  const g = (280.46061837 + 360.98564736629 * (julianDate(msUtc) - 2451545.0)) % 360;
  return g < 0 ? g + 360 : g;
}

const wrap180 = d => { let x = ((d + 180) % 360 + 360) % 360 - 180; if (x === -180) x = 180; return x; };

/** Where a star stands over the Earth: { lat, lon } in degrees (lon east, -180..180). ra, dec in radians. */
export function starLatLon(ra, dec, gmst) {
  return { lat: dec / DEG, lon: wrap180(ra / DEG - gmst) };
}

/** The scene's Earth-fixed direction for a latitude and east longitude in degrees (places.mjs latLonToXYZ). */
export function latLonToVec(lat, lon) {
  const p = (90 - lat) * DEG, q = (lon + 180) * DEG;
  return [-Math.sin(p) * Math.cos(q), Math.cos(p), Math.sin(p) * Math.sin(q)];
}

/** Rows of the 3x3 rotation that takes the equatorial frame (longitude = RA) to the Earth-fixed one: longitude
    minus GMST, a turn about the polar (y) axis. Row-major, for THREE.Matrix3.set(...rows.flat()). */
export function siderealRows(gmst) {
  const c = Math.cos(gmst * DEG), s = Math.sin(gmst * DEG);
  return [[c, 0, -s], [0, 1, 0], [s, 0, c]];
}

/** The sub-solar point from the low-precision solar position of the Astronomical Almanac (about 0.01 degree), in
    the same frame: { lat, lon } in degrees. A reference for the tests, which check the scene's own sun against it. */
export function sunSubpoint(msUtc) {
  const n = julianDate(msUtc) - 2451545.0;
  const L = (280.460 + 0.9856474 * n) * DEG, g = (357.528 + 0.9856003 * n) * DEG;
  const lam = L + (1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * DEG;
  const eps = (23.439 - 0.0000004 * n) * DEG;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  return starLatLon(ra, dec, gmstDeg(msUtc));
}

/** Is a point in the Earth's shadow? p: its position in Earth radii (Earth at the origin), s: the unit vector to
    the sun (both in one frame). A cylinder of radius 1 behind the Earth (the umbra of a sun at infinity). */
export function inEarthShadow(p, s) {
  const d = p[0] * s[0] + p[1] * s[1] + p[2] * s[2];
  if (d >= 0) return false;
  return Math.hypot(p[0] - s[0] * d, p[1] - s[1] * d, p[2] - s[2] * d) < 1;
}

/* Magnitude to a drawn point. The range is compressed: from Sirius (-1.46) to 5.5 the real flux falls by 600x;
   here the size falls from 7 to 2.2 css px and the strength from 1 to 0.62, so Sirius is a star, not a blob,
   and 5.5 is still a point on the high tier. (As first built, 4.2 to 1.6 and 1 to 0.34: on the page the sky read
   as empty behind the rain, and no constellation could be picked out. Tuned on captures in the F1 review.) */
export const MAG_BRIGHT = -1.5, MAG_FAINT = 5.5;
export const SIZE_PX = [7.0, 2.2];       // css px, diameter: brightest, faintest
export const ALPHA = [1.0, 0.62];
const magT = m => Math.min(1, Math.max(0, (m - MAG_BRIGHT) / (MAG_FAINT - MAG_BRIGHT)));
/** css px diameter for a V magnitude (monotonic, inside SIZE_PX). */
export const magToSize = m => SIZE_PX[0] + (SIZE_PX[1] - SIZE_PX[0]) * Math.pow(magT(m), 0.7);
/** strength 0..1 for a V magnitude (monotonic, inside ALPHA). */
export const magToAlpha = m => ALPHA[0] + (ALPHA[1] - ALPHA[0]) * Math.pow(magT(m), 0.85);

/* B-V to colour, between the scene's existing tokens, in display space: hot stars take --signal-hot (#b4f7ff),
   sun-like ones --text-1 (#eef2f5), cool ones --event-hot (#ffd9a0). No new colour value. */
const hex = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
export const STAR_STOPS = [[-0.3, hex('#b4f7ff')], [0.45, hex('#eef2f5')], [1.6, hex('#ffd9a0')]];
/** Display-space [r, g, b] for a B-V colour index: red rises and blue falls monotonically with B-V. */
export function bvToColor(bv) {
  const S = STAR_STOPS;
  if (bv <= S[0][0]) return S[0][1].slice();
  if (bv >= S[S.length - 1][0]) return S[S.length - 1][1].slice();
  let i = 0; while (bv > S[i + 1][0]) i++;
  const t = (bv - S[i][0]) / (S[i + 1][0] - S[i][0]);
  return S[i][1].map((v, k) => v + (S[i + 1][1][k] - v) * t);
}

