/* Night lights for the next scene: the companion of lights-world.png and lights-japan.png (this module holds no payload;
   the scene loads the PNGs as images). BAKED by tools/build-scene-data.mjs, do not edit by hand.
   Source: NASA Black Marble 2016, 3 km grayscale (NASA Visible Earth image 144897, public domain), BlackMarble_2016_3km_gray.jpg converted losslessly to BlackMarble_2016_3km_gray.png with sips, fetched 2026-11-26; see SOURCES.md.
   Equirectangular, row 0 = the box's north edge, column 0 = its west edge. Black level T = 8: the 90th percentile
   of the map's values over land (land from land-05.mjs), clamped to 8..40. Lit = max(0, value - T), area-averaged
   onto each grid, then level = round(15 * sqrt(average / (255 - T))), clamped to 0..15, stored as a 4-bit
   grayscale PNG whose pixel value is the level. Level 1 (0.4% of full light, not visible) is stored as 0. */
export const LIGHTS_BLACK_LEVEL = 8;
export const LIGHTS_LEVELS = 15;
export const LIGHTS_WORLD = { file: 'lights-world.png', width: 1440, height: 720, box: { west: -180, east: 180, south: -90, north: 90 } };
export const LIGHTS_JAPAN = { file: 'lights-japan.png', width: 480, height: 440, box: { west: 122, east: 146, south: 24, north: 46 } };

/** A stored level (0..15) back to linear light 0..1, a fraction of the brightest the map holds above T. */
export function lightLevelToLinear(level) {
  const t = Math.max(0, Math.min(LIGHTS_LEVELS, level)) / LIGHTS_LEVELS;
  return t * t;
}
