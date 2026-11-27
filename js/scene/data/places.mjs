/* Places the next scene draws. TOKYO and DALLAS are the site's own anchors (the base and the route's origin).
   PHOTO_PLACES are the gallery's twelve photographs at the places the owner gave on 2026-11-26
   (docs/rebuild/gallery-places.md, the source of truth). None has coordinates: every place is an AREA, so
   lat/lon is the centre of the named area, never the spot a photograph was taken, and `accuracy` is
   'area'. Photographs in the same area share one mark (AREAS). The old guessed captions are not used.
   City lights are in cities.mjs (baked from Natural Earth). */
export const TOKYO = { id: 'tokyo', lat: 35.6762, lon: 139.6503, en: 'TOKYO', jp: '東京' };
export const DALLAS = { id: 'dallas', lat: 32.7767, lon: -96.7970, en: 'DALLAS', jp: 'ダラス' };

/* One mark per area. km: the radius of the "about here" circle (a wider circle = less sure). */
export const AREAS = [
  { id: 'colorado-springs', name: 'Colorado Springs', region: 'us', lat: 38.8339, lon: -104.8214, km: 110 },
  { id: 'denver', name: 'Denver', region: 'us', lat: 39.7392, lon: -104.9903, km: 110 },
  { id: 'new-york', name: 'New York', region: 'us', lat: 40.7128, lon: -74.0060, km: 130 },
  { id: 'dallas', name: 'Dallas', region: 'us', lat: 32.7767, lon: -96.7970, km: 130 },
  { id: 'shibuya', name: 'Shibuya, Tokyo', region: 'jp', lat: 35.6618, lon: 139.7041, km: 60 },
  { id: 'kyoto', name: 'Kyoto', region: 'jp', lat: 35.0116, lon: 135.7681, km: 80 },
  { id: 'fukuoka', name: 'Fukuoka', region: 'jp', lat: 33.5904, lon: 130.4017, km: 80 },
  // uncertain between Kagoshima and "very south" of the island: centred on the south of Kyushu, drawn wider
  { id: 'southern-kyushu', name: 'Southern Kyushu', region: 'jp', lat: 31.65, lon: 130.80, km: 160 },
];
const AREA = Object.fromEntries(AREAS.map(a => [a.id, a]));

/* Keyed by gallery file, in the order of gallery-places.md. */
const PHOTOS = [
  ['gallery-07.jpg', 'Colorado Springs, Colorado', 'colorado-springs'],
  ['gallery-03.jpg', 'Southern Kyushu', 'southern-kyushu'],
  ['gallery-08.jpg', 'Colorado Springs, Colorado', 'colorado-springs'],
  ['gallery-16.jpg', 'New York', 'new-york'],
  ['gallery-04.jpg', 'Shibuya, Tokyo', 'shibuya'],
  ['gallery-13.jpg', 'Kyoto', 'kyoto'],
  ['gallery-01.jpg', 'Kinkaku-ji, Kyoto', 'kyoto'],
  ['gallery-02.jpg', 'Kyoto', 'kyoto'],
  ['gallery-05.jpg', 'Dallas, Texas', 'dallas'],
  ['gallery-09.jpg', 'Colorado Springs, Colorado', 'colorado-springs'],
  ['gallery-10.jpg', 'Denver, Colorado', 'denver'],
  ['gallery-11.jpg', 'Fukuoka', 'fukuoka'],
];
export const PHOTO_PLACES = PHOTOS.map(([file, name, area]) => {
  const a = AREA[area];
  return Object.freeze({ file, name, region: a.region, lat: a.lat, lon: a.lon, accuracy: 'area', area });
});
for (const a of AREAS) a.files = PHOTO_PLACES.filter(p => p.area === a.id).map(p => p.file);

/** +Y north; Tokyo and Dallas land where the live scene puts them. */
export function latLonToXYZ(lat, lon, r = 1) {
  const p = (90 - lat) * Math.PI / 180, q = (lon + 180) * Math.PI / 180;
  return [-r * Math.sin(p) * Math.cos(q), r * Math.cos(p), r * Math.sin(p) * Math.sin(q)];
}
/** The inverse of latLonToXYZ for a direction (any length). */
export function xyzToLatLon(x, y, z) {
  const r = Math.hypot(x, y, z) || 1;
  const lat = 90 - Math.acos(Math.max(-1, Math.min(1, y / r))) * 180 / Math.PI;
  let lon = Math.atan2(z, -x) * 180 / Math.PI - 180;
  if (lon < -180) lon += 360;
  return { lat, lon };
}
