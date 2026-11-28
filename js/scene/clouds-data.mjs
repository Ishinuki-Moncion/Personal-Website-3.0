/* The live clouds' data rule (clouds.mjs draws them; next.mjs loads them). Pure: no DOM, no three.js, so the unit
   tests run it in Node.
   The file (images/live/clouds.json, refreshed by a timed job every 3 hours):
     { "v": 1, "t": "<ISO time the picture was fetched, UTC>", "w": W, "h": H, "jpg": "<base64 JPEG, equirectangular, white = cloud>" }
   A file older than MAX_AGE_H by the visitor's clock is stale: never show old weather as today's. A file from the
   future by more than FUTURE_SLACK_H (a wrong clock on either side) is treated as fresh only within that slack. */
export const MAX_AGE_H = 9;
export const FUTURE_SLACK_H = 1;
export const CLOUDS_URL = 'images/live/clouds.json';

/**
 * Read a parsed clouds file at `now` (ms since the epoch).
 * Returns { state: 'on' | 'stale' | 'missing', t, ageH, w, h, jpg, reason }. 'missing' covers a malformed file too.
 * ignoreAge (sceneDebug only): an old file still reads 'on' (renders, tests).
 */
export function readClouds(doc, now, { ignoreAge = false } = {}) {
  const miss = reason => ({ state: 'missing', t: null, ageH: null, w: 0, h: 0, jpg: null, reason });
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return miss('not an object');
  if (doc.v !== 1) return miss('unknown version');
  if (typeof doc.t !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z$/.test(doc.t)) return miss('t is not an ISO UTC time');
  const tm = Date.parse(doc.t);
  if (!Number.isFinite(tm)) return miss('t does not parse');
  const { w, h, jpg } = doc;
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 16 || h < 8 || w > 4096 || h > 2048 || w !== 2 * h) return miss('w and h are not a 2:1 picture');
  if (typeof jpg !== 'string' || jpg.length < 100 || !/^[A-Za-z0-9+/]+={0,2}$/.test(jpg) || !jpg.startsWith('/9j/')) return miss('jpg is not a base64 JPEG');
  const ageH = (now - tm) / 3_600_000;
  const fresh = ageH <= MAX_AGE_H && ageH >= -FUTURE_SLACK_H;
  return { state: fresh || ignoreAge ? 'on' : 'stale', t: doc.t, ageH: +ageH.toFixed(2), w, h, jpg, reason: fresh ? null : 'age' };
}
