/* The Japan level's drawn map (design section 3): the Tokaido road as its station towns in order, and Japan's
   principal mountains for the relief marks. TYPED IN from public facts on 2026-11-26, not baked from a file and not a
   survey: each place is the approximate centre of the present-day town or the summit, good to about 0.03 degree
   (3 km). On the map one pixel is about 5 km, so nothing here is a claim about an exact spot. See SOURCES.md.

   TOKAIDO: Nihonbashi in Edo (Tokyo), the fifty-three stations, Sanjo Ohashi in Kyoto: 55 places, east to west.
   Between Miya (41) and Kuwana (42) the road crossed the bay by boat (SEA_LEG): the line is drawn broken there.
   Names are romanised without macrons, as the site writes Tokyo and Kyoto. */
export const TOKAIDO = [
  ['Nihonbashi', 35.684, 139.774], ['Shinagawa', 35.622, 139.739], ['Kawasaki', 35.535, 139.705],
  ['Kanagawa', 35.473, 139.632], ['Hodogaya', 35.444, 139.596], ['Totsuka', 35.396, 139.530],
  ['Fujisawa', 35.343, 139.487], ['Hiratsuka', 35.327, 139.338], ['Oiso', 35.309, 139.314],
  ['Odawara', 35.251, 139.160], ['Hakone', 35.191, 139.026], ['Mishima', 35.119, 138.914],
  ['Numazu', 35.098, 138.860], ['Hara', 35.126, 138.797], ['Yoshiwara', 35.163, 138.686],
  ['Kanbara', 35.118, 138.602], ['Yui', 35.106, 138.565], ['Okitsu', 35.051, 138.522],
  ['Ejiri', 35.020, 138.484], ['Fuchu', 34.972, 138.381], ['Mariko', 34.950, 138.339],
  ['Okabe', 34.918, 138.283], ['Fujieda', 34.871, 138.257], ['Shimada', 34.833, 138.176],
  ['Kanaya', 34.820, 138.125], ['Nissaka', 34.796, 138.075], ['Kakegawa', 34.771, 138.016],
  ['Fukuroi', 34.750, 137.925], ['Mitsuke', 34.725, 137.858], ['Hamamatsu', 34.706, 137.731],
  ['Maisaka', 34.686, 137.611], ['Arai', 34.694, 137.561], ['Shirasuka', 34.688, 137.502],
  ['Futagawa', 34.724, 137.455], ['Yoshida', 34.769, 137.391], ['Goyu', 34.845, 137.317],
  ['Akasaka', 34.857, 137.307], ['Fujikawa', 34.911, 137.223], ['Okazaki', 34.957, 137.163],
  ['Chiryu', 35.008, 137.041], ['Narumi', 35.081, 136.951], ['Miya', 35.123, 136.909],
  ['Kuwana', 35.066, 136.693], ['Yokkaichi', 34.968, 136.626], ['Ishiyakushi', 34.908, 136.547],
  ['Shono', 34.886, 136.524], ['Kameyama', 34.853, 136.455], ['Seki', 34.852, 136.392],
  ['Sakashita', 34.889, 136.353], ['Tsuchiyama', 34.934, 136.283], ['Minakuchi', 34.967, 136.168],
  ['Ishibe', 35.007, 136.060], ['Kusatsu', 35.018, 135.960], ['Otsu', 35.006, 135.866],
  ['Sanjo Ohashi', 35.009, 135.772],
].map(([name, lat, lon]) => ({ name, lat, lon }));
/** The index of the station the sea crossing starts from (Miya); it lands at the next one (Kuwana). */
export const SEA_LEG = 41;

/* LV1c (2026-11-28): the two other trunk lines, drawn as the Tokaido is, each with a travelling light. TYPED IN from
   public facts, the present-day stations of each line (the Sanyo from Kyoto, where the Tokaido ends, through Osaka to
   Hakata; the Tohoku from Nihonbashi, where it begins, to Aomori), each good to about 0.02 degree: at about 27 px a
   degree a station is a point on a thin line, not a survey. Not every station: enough for the line's course. */
export const SANYO = [
  ['Kyoto', 34.985, 135.758], ['Shin-Osaka', 34.733, 135.500], ['Shin-Kobe', 34.707, 135.196],
  ['Nishi-Akashi', 34.666, 134.960], ['Himeji', 34.827, 134.690], ['Aioi', 34.805, 134.469],
  ['Okayama', 34.666, 133.918], ['Shin-Kurashiki', 34.579, 133.680], ['Fukuyama', 34.489, 133.362],
  ['Mihara', 34.401, 133.079], ['Higashi-Hiroshima', 34.401, 132.757], ['Hiroshima', 34.398, 132.475],
  ['Shin-Iwakuni', 34.164, 132.177], ['Tokuyama', 34.052, 131.804], ['Shin-Yamaguchi', 34.094, 131.396],
  ['Shin-Shimonoseki', 34.006, 130.950], ['Kokura', 33.887, 130.883], ['Hakata', 33.590, 130.421],
].map(([name, lat, lon]) => ({ name, lat, lon }));
export const TOHOKU = [
  ['Nihonbashi', 35.684, 139.774], ['Ueno', 35.714, 139.777], ['Omiya', 35.906, 139.624], ['Oyama', 36.315, 139.800],
  ['Utsunomiya', 36.559, 139.898], ['Nasushiobara', 36.932, 140.020], ['Shin-Shirakawa', 37.123, 140.188],
  ['Koriyama', 37.398, 140.388], ['Fukushima', 37.754, 140.459], ['Shiroishi-Zao', 38.003, 140.620],
  ['Sendai', 38.260, 140.882], ['Furukawa', 38.571, 140.967], ['Ichinoseki', 38.926, 141.138],
  ['Mizusawa-Esashi', 39.147, 141.186], ['Kitakami', 39.292, 141.122], ['Morioka', 39.702, 141.137],
  ['Iwate-Numakunai', 39.964, 141.219], ['Ninohe', 40.270, 141.301], ['Hachinohe', 40.509, 141.431],
  ['Shichinohe-Towada', 40.721, 141.158], ['Shin-Aomori', 40.827, 140.694],
].map(([name, lat, lon]) => ({ name, lat, lon }));
/* One air route out of Tokyo (Haneda), drawn as a faint arc that rises off the ball, with a slow light: to Fukuoka.
   The airport, typed in, good to about 0.01 degree. LV1d (2026-11-28): the route to Sapporo (New Chitose, 42.775 N
   141.692 E) is dropped: its great circle ran within a few px of the Tohoku line the whole way, and bowed out over the
   sea it would have crossed the Oyashio. The route to Naha (26.196 N 127.646 E) is dropped too: it ran beside the
   Kuroshio's lines south of Shikoku, and the two read as a pair of routes. */
export const HANEDA = { name: 'Haneda', lat: 35.549, lon: 139.780 };
export const AIR = [
  { name: 'Fukuoka', lat: 33.586, lon: 130.451 },
];

/* PEAKS: name, latitude, longitude, height in metres. Fuji first. */
export const PEAKS = [
  ['Fuji', 35.361, 138.727, 3776], ['Kita-dake', 35.674, 138.239, 3193], ['Hotaka', 36.289, 137.648, 3190],
  ['Yari', 36.342, 137.648, 3180], ['Akaishi', 35.461, 138.158, 3121], ['Ontake', 35.893, 137.480, 3067],
  ['Norikura', 36.106, 137.554, 3026], ['Tate-yama', 36.576, 137.620, 3015], ['Kiso-Koma', 35.789, 137.804, 2956],
  ['Shirouma', 36.759, 137.759, 2932], ['Yatsugatake', 35.971, 138.370, 2899], ['Haku-san', 36.155, 136.771, 2702],
  ['Asama', 36.406, 138.523, 2568], ['Nantai', 36.765, 139.491, 2486], ['Myoko', 36.891, 138.114, 2454],
  ['Hiuchi', 36.955, 139.285, 2356], ['Asahi-dake', 43.664, 142.854, 2291], ['Chokai', 39.099, 140.049, 2236],
  ['Tokachi', 43.418, 142.686, 2077], ['Poroshiri', 42.719, 142.683, 2052], ['Iwate', 39.853, 141.001, 2038],
  ['Kumotori', 35.855, 138.944, 2017], ['Gassan', 38.549, 140.027, 1984], ['Tanigawa', 36.837, 138.930, 1977],
  ['Ishizuchi', 33.768, 133.115, 1982], ['Tsurugi', 33.854, 134.094, 1955], ['Miyanoura', 30.336, 130.504, 1936],
  ['Hayachine', 39.558, 141.489, 1917], ['Omine', 34.174, 135.907, 1915], ['Yotei', 42.827, 140.811, 1898],
  ['Zao', 38.144, 140.440, 1841], ['Akagi', 36.560, 139.193, 1828], ['Bandai', 37.601, 140.072, 1816],
  ['Kuju', 33.086, 131.249, 1791], ['Daisen', 35.371, 133.546, 1729], ['Rishiri', 45.179, 141.242, 1721],
  ['Kirishima', 31.934, 130.862, 1700], ['Rausu', 44.076, 145.122, 1661], ['Iwaki', 40.656, 140.303, 1625],
  ['Aso', 32.884, 131.104, 1592], ['Hakkoda', 40.659, 140.877, 1585], ['Tanzawa', 35.474, 139.163, 1567],
  ['Akan', 43.386, 144.009, 1499], ['Unzen', 32.761, 130.299, 1483], ['Ibuki', 35.418, 136.406, 1377],
  ['Sakurajima', 31.585, 130.657, 1117], ['Kaimon', 31.180, 130.528, 924],
].map(([name, lat, lon, m]) => ({ name, lat, lon, m }));

/* RANGES (the level LV1, 2026-11-28): the main ranges as the map draws them, each as one short, dry brush ridge stroke
   along its crest, through the summits named in `through` (all of them in PEAKS); Fuji alone is drawn as a mark of
   its own. Ridge points are [lat, lon], typed in along the crests from the same public facts, good to about 0.1
   degree: a ridge is a brush stroke at about 25 px a degree, not a survey. Few and clear: six ranges. */
export const RANGES = [
  { name: 'Hida (the Northern Alps)', through: ['Shirouma', 'Tate-yama', 'Yari', 'Hotaka'],
    ridges: [[[36.78, 137.76], [36.58, 137.62], [36.34, 137.65], [36.15, 137.56]]] },
  { name: 'Akaishi (the Southern Alps)', through: ['Kita-dake', 'Akaishi'], ridges: [[[35.78, 138.22], [35.67, 138.24], [35.46, 138.16], [35.28, 138.08]]] },
  { name: 'Ou', through: ['Iwate', 'Zao'], ridges: [[[40.20, 140.92], [39.85, 141.00], [39.30, 140.82], [38.70, 140.58], [38.14, 140.44]]] },
  { name: 'Hidaka', through: ['Poroshiri'], ridges: [[[43.15, 142.56], [42.72, 142.68], [42.32, 143.02]]] },
  { name: 'Shikoku', through: ['Ishizuchi', 'Tsurugi'], ridges: [[[33.74, 133.00], [33.78, 133.40], [33.85, 134.09]]] },
  { name: 'Kyushu', through: ['Kuju', 'Aso', 'Kirishima'], ridges: [[[33.10, 131.25], [32.88, 131.10], [32.45, 131.12], [32.00, 130.88]]] },
];
/** Fuji, drawn as a mark of its own (PEAKS[0]). */
export const FUJI = 'Fuji';

/* MIST: long, soft, level bands over the open sea, as [lat, lon from, lon to] (each must lie wholly over the sea:
   tests/unit/japan-brush.test.mjs checks it against the land tile, a band's height either side). One on the Sea of
   Japan side, one on the Pacific (LV1b: longer, as a folding screen's bands are; two, not four, once they are gold). */
/* None are drawn (2026-11-28): on the indigo paper the gold came out as brown smears that read as a fault, in grey at
   11% and in gold at 19% alike. The code that draws a band stays, so a band can be tried again here. The two that were
   tried: [40.4, 132.6, 138.8] and [32.45, 134.4, 140.6]. */
export const MIST = [];

/* CURRENTS (LV1d, 2026-11-28): the two great currents off Japan's Pacific coast, each drawn as a few long, fine, flowing
   brush lines that drift slowly along their own length. Courses as [lat, lon], TYPED IN from the textbook picture of
   each current's mean axis (not a survey, and not today's meander), good to about half a degree, kept off every coast
   (tests/unit/japan-brush.test.mjs checks each course against the land mask with a margin):
   - the Kuroshio: north-east from east of Taiwan along the shelf edge of the East China Sea, out through the Tokara
     Strait, along the Pacific coast of Kyushu, Shikoku and Honshu south of Tokyo, and off Boso out to sea eastward;
   - the Oyashio: south-west from the Kurils' Pacific side, past eastern Hokkaido, down toward Sanriku (Tohoku).
   lines: how many strokes lie side by side; gap: their spacing (degrees across the course). */
export const CURRENTS = [
  { name: 'Kuroshio', lines: 3, gap: 0.32, course: [
    [23.6, 122.2], [24.5, 122.5], [25.4, 123.4], [26.5, 125.0], [27.6, 126.7], [28.6, 128.3], [28.95, 129.6], [29.6, 130.6],
    [30.3, 131.6], [31.3, 132.6], [32.2, 133.8], [32.75, 135.5], [33.15, 136.9], [33.5, 138.4], [33.5, 139.9], [33.9, 141.3], [34.4, 142.8], [35.0, 144.6],
    [35.4, 146.6], [35.7, 148.6]] },
  { name: 'Oyashio', lines: 2, gap: 0.3, course: [
    [46.6, 152.4], [45.6, 150.6], [44.5, 148.9], [43.4, 147.4], [42.4, 145.6], [41.4, 144.2], [40.4, 143.0], [39.4, 142.6],
    [38.4, 142.4], [37.6, 142.6]] },
];
/* The compass rose (LV1d): one small rose in thin gold on the Pacific side, low and clear of everything: lying flat
   on the ball (it turns and foreshortens with it), its north the map's north. r: its radius in degrees of arc. */
export const COMPASS = { lat: 29.8, lon: 143.0, r: 0.75 };

/* LABELS: six place names, Latin, drawn by the page in its mono face (never baked into the map). side: which way the
   name runs from its near end ('l' leftward, 'r' rightward; 'seal': Tokyo, beside the seal, with no dot of its own);
   place (LV1b): where that near end stands from the dot, [right, down] in map px (css px on the desktop's ring, scaled
   with the map), chosen on the rendered map so that no name touches the coast's ink, the road, the seal, another name
   or the ring: on the sea where the sea is near, else clear inland; past LEADER_MIN a thin leader runs to it. */
export const LABELS = [
  { name: 'SAPPORO', lat: 43.062, lon: 141.354, side: 'l', place: [-8, -17] },
  { name: 'SENDAI', lat: 38.268, lon: 140.872, side: 'r', place: [10, 10] },
  { name: 'TOKYO', lat: 35.684, lon: 139.774, side: 'seal' },
  { name: 'KYOTO', lat: 35.011, lon: 135.768, side: 'l', place: [0, -31] },
  { name: 'OSAKA', lat: 34.694, lon: 135.502, side: 'r', place: [23, 24] },
  { name: 'FUKUOKA', lat: 33.590, lon: 130.402, side: 'l', place: [-18, -8] },
];
/* NEAR_LABELS (LV1c): a few of the neighbours' cities, in the same small mono Latin at a lower strength, placed by the
   same rule after the six (so they give way to them): shown only where they stand clear, never on a phone. */
export const NEAR_LABELS = [
  { name: 'SEOUL', lat: 37.566, lon: 126.978, side: 'l', place: [-5, -8] },   // LV1d: over the Yellow Sea, clear of the east coast
  { name: 'BUSAN', lat: 35.180, lon: 129.076, side: 'r', place: [7, -7] },
  { name: 'VLADIVOSTOK', lat: 43.116, lon: 131.886, side: 'r', place: [6, 9] },
  { name: 'SHANGHAI', lat: 31.230, lon: 121.474, side: 'l', place: [-6, 0] },
  { name: 'TAIPEI', lat: 25.033, lon: 121.565, side: 'r', place: [7, 0] },
];
