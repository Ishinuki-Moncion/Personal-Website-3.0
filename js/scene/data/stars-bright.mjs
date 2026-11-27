/* Bright stars for the next scene, V 3.5 or brighter: 288 stars, sorted by V ascending, ties by the database's id. BAKED by
   tools/build-scene-data.mjs, do not edit by hand. Source: the HYG database, version 4.1 (astronexus), hygdata_v41.csv, CC BY-SA 4.0, fetched 2026-11-26; see SOURCES.md.
   LICENCE OF THIS TABLE: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0,
   https://creativecommons.org/licenses/by-sa/4.0/). It is adapted from the HYG database (astronexus,
   https://github.com/astronexus/HYG-Database, now kept at https://codeberg.org/astronexus/hyg): a subset
   by magnitude, with each star's position, magnitude and colour index re-encoded as below, the Sun left
   out, and the companions the database lists a second time left out (dropCountedCompanions in the tool).
   Nothing else was changed.
   Positions are the database's values for epoch and equinox 2000.0; no proper motion or precession is applied.
   Six bytes per star, stored field by field (n = the count): n RA uint16 little-endian, then n Dec int16
   little-endian, then n V uint8, then n B-V uint8. RA = round(RA hours / 24 * 65536) mod 65536; Dec =
   round(Dec degrees / 90 * 32767); V = round((V + 1.5) * 32) clamped to 0..255; B-V = round((B-V + 0.5) * 100)
   clamped to 0..255, with B-V = 0.6 where the database has none (0 stars here). */
export const STARS_BRIGHT_COUNT = 288;
export const STARS_BRIGHT_B64 = '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';

/** { ra, dec, mag, bv } as Float32Arrays: ra and dec in radians (J2000), V magnitude, B-V colour index. */
export function decodeStarsBright() {
  const bin = atob(STARS_BRIGHT_B64), n = STARS_BRIGHT_COUNT;
  const ra = new Float32Array(n), dec = new Float32Array(n), mag = new Float32Array(n), bv = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let d = bin.charCodeAt(2 * n + 2 * i) | (bin.charCodeAt(2 * n + 2 * i + 1) << 8);
    if (d >= 32768) d -= 65536;
    ra[i] = ((bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8)) / 65536) * 2 * Math.PI;
    dec[i] = (d / 32767) * (Math.PI / 2);
    mag[i] = bin.charCodeAt(4 * n + i) / 32 - 1.5;
    bv[i] = bin.charCodeAt(5 * n + i) / 100 - 0.5;
  }
  return { ra, dec, mag, bv };
}
