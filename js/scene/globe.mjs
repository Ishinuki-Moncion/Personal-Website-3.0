/* The next scene's globe: an additive cyan hologram (D11), ported from docs/rebuild/prototypes/globe/.
   Meshes, in draw order: body (graticule + limb; writes depth so the far side of every line and
   marker is hidden) · land dots · atmosphere · surface markers · ticks and Tokyo pillar · arc ·
   halo sprites · Tokyo halo rings · orbit ring. Everything that moves is a uniform: no per-frame
   buffer uploads and no per-frame allocations.
   The arc and the Tokyo pulse fire when the Earth assembles (the arrival), never on a timer.
   Step 1b: city lights from Natural Earth (data/cities.mjs), relief from a baked mask (data/relief-mask.mjs),
   the photo places as open "about here" circles (data/places.mjs AREAS: no pins, no ticks), the Tokyo
   core capped at amber, and turnTo() for the eye and the place buttons.
   Step 2 (the journey, story.mjs): the pose can be driven (drive, setPose, poseFor), the camera can come
   closer (setZoom: the Japan and Tokyo stand-ins), seen through the ring as through a lens (uLens), and the
   whole draw set fades (uFade) for the cross-fade between levels; baseCamera keeps the orbit view for the eye.
   Step F1a (design 14.1, 14.2): the Earth at higher fidelity. The first view is unchanged in data (the coarse mask,
   the city table); after it, setDetail() swaps in the fine dots (detail.mjs), night lights from the two images,
   the coastline, the ocean's glint and coastal lift, cross-faded over DETAIL_S. Japan faces the viewer at rest
   (a slow sway, no full idle turn). Tokyo's ring, bracket and pillar are gone: the eye's footprint (one thin
   circle round Japan, drawn with the coasts in one line mesh) frames the archipelago, Tokyo is one small point. */
import * as THREE from 'three';
import { makeLandLookup } from './data/land-mask.mjs?v=1';
import { makeReliefLookup } from './data/relief-mask.mjs?v=1';
import { TOKYO, DALLAS, AREAS, latLonToXYZ, xyzToLatLon } from './data/places.mjs?v=2';
import { sunSubpoint } from './sky-math.mjs?v=1';

const DEG = Math.PI / 180;
export const INTRO_S = 1.2;            // the Earth assembles inside the ring over this long
export const ORBIT_R = 1.45;           // the orbit ring's radius (Earth radii); the eye rides it
const ARC_START = 0.55, ARC_DUR = 1.6;  // after the assembly starts
const PULSE_AT = 0.75;
/* City lights: each place lights the land dots within (CITY_KM + CITY_KM_W * weight) km of it, by
   (CITY_I + (1 - CITY_I) * weight) at its centre, falling off as (1 - d/R)^3; a dot glows 1 - exp(-CITY_GAIN * sum).
   Tuned so the Tokyo-Osaka belt reads as one belt on the rich tier (its dots 0.45-0.97, inland Honshu 0.2-0.3). */
const CITY_KM = 90, CITY_KM_W = 180, CITY_I = 0.2, CITY_GAIN = 3.0;
/* F1a. JAPAN: the footprint's centre and the rest pose's target. FOOT_DEG: the footprint's angular radius (about
   150 css px across at orbit on 1440 x 900; it frames Hokkaido to Okinawa). DETAIL_S: the detail's cross-fade. */
export const JAPAN = { lat: 36.6, lon: 137.6 };
export const FOOT_DEG = 14;
export const DETAIL_S = 1.2;
const TOKYO_MARK = 0.0085, MARK_Q = 2.4;     // Tokyo's point: disc radius (Earth radii) and its quad's reach
const LIGHT_GAIN = 7.0;                     // night lights: glow = 1 - exp(-gain * linear light)
/* The Japan tile's three dot sets open on sp, the css px between neighbouring tile cells: the near set over NEAR_OPEN,
   the zoom-only set over ZOOM_OPEN (smoothstep edges); the far set always stands. The dot shader and
   __sceneDebug().detail.tile read the same numbers. */
export const TILE_NEAR_OPEN = [0.62, 1.2], TILE_ZOOM_OPEN = [1.2, 2.4];
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const glf = v => v.toFixed(2);
const SWAY_SPIN = 8 * Math.PI / 180, SWAY_TILT = 2.5 * Math.PI / 180, SWAY_S = 32;   // the idle sway round the rest pose
const IDLE_MAX = (2 * Math.PI) / 180;       // rad/s: the idle never moves faster than the old full turn did
/* MAX blending: the small Tokyo pieces (markers, pillar, halo sprites) were additive and stacked into a
   neutral-white core over the hot city dots (measured 254,255,255). Blended by MAX they can light the
   dark around a dot but never push a hot core past its own amber (#ffd9a0 at most). */
const maxBlend = m => Object.assign(m, { blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation });

/* Colours: hex is sRGB, THREE.Color converts to linear; shaders compress, then encode sRGB by hand.
   Hot cores stay in hue (no neutral-white state). */
const lin = hex => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };

const GLSL_COMMON = /* glsl */`
uniform float uExposure;
// hue-preserving roll-off: compress by the brightest channel, so a hot cyan stays cyan
vec3 tonemap(vec3 c){ c = max(c, 0.0); float m = max(max(c.r, c.g), c.b); return m > 1e-5 ? c * ((1.0 - exp(-m * uExposure)) / m) : c; }
vec3 toSRGB(vec3 c){ c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(vec3(0.0031308), c)); }
// 1 when the segment camera->p clears the unit sphere, soft near the limb
float sphereVis(vec3 cam, vec3 p){
  vec3 d = p - cam; float t = clamp(dot(-cam, d) / dot(d, d), 0.0, 1.0);
  return smoothstep(0.985, 1.003, length(cam + d * t));
}
`;
/* Fragment shaders only (gl_FragCoord). Step 2: below orbit the Earth is seen through the ring, as through a
   lens, so nothing of the zoomed globe is drawn past the ring's disc (uLens: centre and radius in device px,
   w = how much the lens is on, 0 at orbit). uFade is this draw set's share of the cross-fade between levels. */
export const GLSL_GLOBE = GLSL_COMMON + /* glsl */`
uniform vec4 uLens; uniform float uFade;
float globeK(){
  float d = length(gl_FragCoord.xy - uLens.xy);
  return mix(1.0, 1.0 - smoothstep(uLens.z - 1.5, uLens.z + 0.5, d), uLens.w) * uFade;
}
`;

/** footDim: how much the land outside the footprint dims (0 = none: the lite tier keeps today's Earth). */
export function createGlobe({ candidates, sunHour = null, footDim = 0 }) {
  const C = {
    ice: lin('#9fe9f7'), teal: lin('#0e5f6e'), deep: lin('#6fb7ff'),
    signal: lin('#39f0ff'), signalHot: lin('#b4f7ff'), event: lin('#ff9e2c'), eventHot: lin('#ffd9a0'),
  };
  const col = v => ({ value: v });
  // every globe material shares the lens and the draw set's fade
  const pick = (obj, ...keys) => { const o = { uLens: obj.uLens, uFade: obj.uFade }; for (const k of keys) o[k] = obj[k]; return o; };

  const U = {
    uLens: { value: new THREE.Vector4(0, 0, 1e5, 0) }, uFade: { value: 1 },
    uDotK: { value: 1 },                                // dot size compensation below orbit (1 at orbit)
    uMarkK: { value: 1 },                               // the Tokyo marks' size compensation below orbit (1 at orbit)
    uTime: { value: 0 }, uReveal: { value: 0 }, uExposure: { value: 1.45 },
    uSun: { value: new THREE.Vector3(1, 0, 0) },
    uHover: { value: -1 },
    uFocus: { value: new THREE.Vector4(0, 1, 0, 0) },   // xyz object-space unit vector, w = acquired (0|1)
    uPulse0: { value: -100 },                           // clock time of the last Tokyo pulse trigger
    uDpr: { value: 1 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uZoom: { value: 0 },
    uPx: { value: 1 / 300 },                            // object units per css px at the globe (1 / disc radius)
    // F1a
    uObjPx: { value: 300 },                             // device px per object unit on the facing surface (disc radius x dpr x zoom)
    uFootN: { value: new THREE.Vector3(...latLonToXYZ(JAPAN.lat, JAPAN.lon)) },   // the footprint's centre (object space)
    uFootK: { value: new THREE.Vector3(Math.cos(FOOT_DEG * DEG), Math.cos(3 * FOOT_DEG * DEG), footDim) },   // full inside, falls off to 3x, dim
    uFootA: { value: 1 },                               // the footprint circle: 1 at orbit, 0 below it
    uOcean: { value: 0 },                               // the ocean's glint and coastal lift (0 until the detail lands)
  };
  /* Placeholders until the detail lands: the shaders sample them from the first frame (one program per material
     kind, so the swap compiles nothing). */
  const blank = () => { const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); t.needsUpdate = true; return t; };
  const TX = { land: { value: blank() }, lightsW: { value: blank() }, lightsJ: { value: blank() } };

  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 50);
  const root = new THREE.Group();        // added to the scene: follow group + orbit ring
  /* T2a: the cursor follow (next.mjs, FOLLOW_*): a small turn about the screen's own axes, on top of the story's
     pose and outside it (pose() and the story never see it). The orbit ring and the eye hang from root, so they
     stay where they are; the stars never read the Earth's pose. */
  const followGroup = new THREE.Group();
  const tiltGroup = new THREE.Group();   // X tilt (north toward the viewer)
  const earth = new THREE.Group();       // Y spin; every globe mesh lives in object (earth) space
  tiltGroup.add(earth); followGroup.add(tiltGroup); root.add(followGroup);
  const meshes = [];
  /* screen: the study drew the globe in its own canvas and screen-blended the rain (with the ring and the
     floor) over it. The meshes that cross the ring and the floor reflections (body, dots, atmosphere,
     orbit) are screen-blended over the backdrop here, src * (1 - dst) + dst, so a hot cyan over a hot
     amber does not add up to white; the small Tokyo pieces (markers, ticks, arc, sprites, halo rings)
     stay additive, as they were among themselves in the study. Measured against the study's still
     frame: mean |diff| 0.39/255 (all additive: 0.67), neutral-white pixels 145 (study 146; all additive 203). */
  const add = (mesh, order, { parent = earth, screen = false } = {}) => {
    mesh.frustumCulled = false; mesh.renderOrder = order; parent.add(mesh); meshes.push(mesh);
    if (screen) Object.assign(mesh.material, { blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneMinusDstColorFactor, blendDst: THREE.OneFactor });
    return mesh;
  };

  // ---------------------------------------------------------------- body: graticule + thin limb (hologram)
  const bodyMat = new THREE.ShaderMaterial({
    uniforms: { ...pick(U, 'uSun', 'uExposure', 'uReveal', 'uDpr', 'uOcean'), uLand: TX.land, cSignal: col(C.signal), cIce: col(C.ice) },
    vertexShader: /* glsl */`
      varying vec3 vW; varying vec3 vN; varying vec3 vO;
      void main(){
        vO = position;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * position);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: GLSL_GLOBE + /* glsl */`
      uniform vec3 uSun, cSignal, cIce; uniform float uReveal, uDpr, uOcean; uniform sampler2D uLand;
      varying vec3 vW; varying vec3 vN; varying vec3 vO;
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vW);
        float ndl = dot(n, uSun); float ndv = clamp(dot(n, v), 0.0, 1.0);
        float day = smoothstep(-0.10, 0.65, ndl);
        float term = exp(-pow(ndl / 0.32, 2.0));                 // the limb is brightest toward the terminator
        // hologram: nothing but light. A thin cyan edge, weighted to the silhouette.
        vec3 c = cSignal * (0.025 + 0.10 * day + 0.12 * term) * pow(1.0 - ndv, 10.0) * uReveal;
        vec3 o = normalize(vO);
        float lat = degrees(asin(clamp(o.y, -1.0, 1.0)));
        float lon = degrees(atan(o.z, -o.x));
        // F1a, the oceans (once the detail has landed): a soft glint where the real sun meets the sea, and a faint
        // lift along coasts; both by day only, so the night-side sea stays black
        if (uOcean > 0.001) {
          vec2 lm = texture2D(uLand, vec2(fract(lon / 360.0 + 1.0), (90.0 - lat) / 180.0)).rg;
          float sea = 1.0 - smoothstep(0.35, 0.65, lm.r);
          float sp = max(dot(reflect(-uSun, n), v), 0.0);
          float glint = pow(sp, 48.0) * 0.16 + pow(sp, 6.0) * 0.022;
          float lift = lm.g * 0.035;
          c += (cIce * glint + cSignal * lift) * sea * day * smoothstep(0.0, 0.25, ndl) * uOcean * uReveal;
        }
        vec3 outc = toSRGB(c);
        // graticule, 30 deg, composited in display space: a crisp 1 css-px core with a short falloff
        float px = length(fwidth(o)) * 57.29578 / 1.41421;       // degrees per device pixel
        float dLat = abs(fract(lat / 30.0 + 0.5) - 0.5) * 30.0;
        float dLon = abs(fract(lon / 30.0 + 0.5) - 0.5) * 30.0 * cos(radians(lat));
        float poles = 1.0 - smoothstep(72.0, 86.0, abs(lat));
        float w = px * uDpr;                                      // degrees per css pixel
        float eLat = dLat / w, eLon = dLon / w;
        float coreL = max(1.0 - smoothstep(0.35, 0.95, eLat), (1.0 - smoothstep(0.35, 0.95, eLon)) * poles);
        float glowL = max(exp(-eLat * 0.9), exp(-eLon * 0.9) * poles);
        float k = (0.70 + 0.30 * pow(1.0 - ndv, 1.5)) * uReveal;
        outc += vec3(0.224, 0.941, 1.0) * (coreL * 0.30 + glowL * 0.055) * k;
        gl_FragColor = vec4(outc * globeK(), 1.0);
      }`,
    // additive but still writing depth, so the far side of every line and marker is hidden
    transparent: false, depthWrite: true, blending: THREE.AdditiveBlending,
  });
  add(new THREE.Mesh(new THREE.SphereGeometry(1, 160, 112), bodyMat), 2, { screen: true });

  // ---------------------------------------------------------------- land lattice (Fibonacci sphere, dots on land)
  const N = Math.max(1000, Math.round(candidates));
  const land = makeLandLookup(), relief = makeReliefLookup();
  const spacing = Math.sqrt(4 * Math.PI / N);
  /* The city table (data/cities.mjs, 9.8 KB gzipped) is not in the first view: the first frame draws the land
     with no city lights, and setCities() lights the coarse dots once the table arrives (next.mjs: straight after
     the first frame on the lite tier; on the others only if the detail, which carries the real night lights,
     fails to load). The table sits in 10-degree buckets: a dot looks only at its own bucket and the eight around
     it (the widest light, Tokyo's, reaches 2.3 degrees), so ~800 places cost about what ~100 did. */
  const BK = 10, BLON = 36, BLAT = 18;
  function cityLightAt(buckets, x, y, z, lat, lon) {
    let city = 0;
    const by = Math.min(BLAT - 1, Math.floor((lat + 90) / BK)), bx = Math.min(BLON - 1, Math.floor((lon + 180) / BK));
    const span = Math.abs(lat) > 75 ? BLON >> 1 : 1;
    for (let j = Math.max(0, by - 1); j <= Math.min(BLAT - 1, by + 1); j++) {
      for (let k = -span; k <= span; k++) {
        const cell = buckets[j * BLON + ((bx + k + BLON) % BLON)];
        for (let c = 0; c < cell.length; c++) {
          const q = cell[c], dp = x * q[0] + y * q[1] + z * q[2];
          if (dp <= q[5]) continue;                         // cheap reject before the acos
          const f = 1 - Math.acos(Math.min(1, dp)) / q[4]; city += q[3] * f * f * f;
        }
      }
    }
    return city > 0.02 ? 1 - Math.exp(-city * CITY_GAIN) : 0;
  }
  let citiesSet = false;
  /** Light the coarse dots from the city table: list = [[name, lat, lon, weight], ...] (data/cities.mjs cities()). */
  function setCities(list) {
    const buckets = Array.from({ length: BLON * BLAT }, () => []);
    for (const [, la, lo, w] of list) {
      const p = latLonToXYZ(la, lo), rad = (CITY_KM + CITY_KM_W * w) / 6371;
      const bx = Math.min(BLON - 1, Math.floor((lo + 180) / BK)), by = Math.min(BLAT - 1, Math.floor((la + 90) / BK));
      buckets[by * BLON + bx].push([p[0], p[1], p[2], CITY_I + (1 - CITY_I) * w, rad, Math.cos(rad)]);
    }
    const pos = dotGeo.getAttribute('aPos').array, aux = dotGeo.getAttribute('aAux');
    for (let i = 0; i < coarseCount; i++) {
      const x = pos[i * 4], y = pos[i * 4 + 1], z = pos[i * 4 + 2];
      const lat = Math.asin(Math.max(-1, Math.min(1, y))) / DEG;
      let lon = Math.atan2(z, -x) / DEG - 180; if (lon < -180) lon += 360;
      aux.array[i * 3] = cityLightAt(buckets, x, y, z, lat, lon);
    }
    aux.needsUpdate = true;
    citiesSet = true;
  }
  const isLand = (lon, lat) => land(((lon + 540) % 360) - 180, Math.max(-89.9, Math.min(89.9, lat)));
  const tmpPos = new Float32Array(N * 4), tmpAux = new Float32Array(N * 3), tmpGeo = new Float32Array(N * 2);
  let count = 0, coarseBox = 0;
  const GA = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), th = i * GA;
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    const lat = Math.asin(y) / DEG;
    let lon = Math.atan2(z, -x) / DEG - 180; if (lon < -180) lon += 360;
    if (!isLand(lon, lat)) continue;
    const k = 1 / Math.max(0.15, Math.cos(lat * DEG));
    let coast = false;
    for (let a = 0; a < 8 && !coast; a++) {
      const ca = Math.cos(a * Math.PI / 4), sa = Math.sin(a * Math.PI / 4);
      if (!isLand(lon + 1.2 * ca * k, lat + 1.2 * sa)) coast = true;
    }
    const hill = relief(lon, lat);                          // inside a mountain range: a little larger and brighter
    tmpPos.set([x, y, z, spacing * (coast ? 0.52 : 0.43) * (hill ? 1.12 : 1)], count * 4);
    tmpAux[count * 3] = 0; tmpAux[count * 3 + 1] = (Math.sin(i * 12.9898) * 43758.5453 % 1) * 6.2832; tmpAux[count * 3 + 2] = hill;
    tmpGeo[count * 2] = (lon + 180) / 360; tmpGeo[count * 2 + 1] = (90 - lat) / 180;
    if (lat >= 24 && lat <= 46 && lon >= 122 && lon <= 146) coarseBox++;
    count++;
  }
  const coarseCount = count;
  const quad = geo => {
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]); return geo;
  };
  const dotGeo = quad(new THREE.InstancedBufferGeometry());
  dotGeo.setAttribute('aPos', new THREE.InstancedBufferAttribute(tmpPos.slice(0, count * 4), 4));
  dotGeo.setAttribute('aAux', new THREE.InstancedBufferAttribute(tmpAux.slice(0, count * 3), 3));
  dotGeo.setAttribute('aGeo', new THREE.InstancedBufferAttribute(tmpGeo.slice(0, count * 2), 2));
  dotGeo.instanceCount = count;
  /* One dot shader for the coarse set (the first view: city-table lights in aAux.x) and the fine set (the detail:
     lights from the two images, sizes from their own spacing). Both materials carry the same source, so three.js
     links one program for the two; the fine set adds no compile when it lands.
     Fine dots (uFine 1) are drawn at their true size (radius x device px per unit) but never under MIN_R device
     px; below that the dot's light is scaled by (true / drawn)^2, so a field of sub-pixel dots reads as an even tone
     at orbit instead of piling up into a blown-out blob, and becomes a halftone as the view comes closer. */
  const dotMaterial = fine => new THREE.ShaderMaterial({
    uniforms: {
      ...pick(U, 'uSun', 'uExposure', 'uReveal', 'uTime', 'uFocus', 'uZoom', 'uDotK', 'uObjPx', 'uFootN', 'uFootK'),
      uLightsW: TX.lightsW, uLightsJ: TX.lightsJ, uDprD: U.uDpr, uFine: { value: fine ? 1 : 0 }, uMeshA: { value: fine ? 0 : 1 },
      uFarK: { value: 5 },   // the tile's far dots at orbit: radius x the tile cells across a block (5, the phone 10)
      cIce: col(C.ice), cTeal: col(C.teal), cDeep: col(C.deep), cEvent: col(C.event), cEventHot: col(C.eventHot), cHot: col(C.signalHot),
    },
    vertexShader: /* glsl */`
      attribute vec4 aPos; attribute vec3 aAux;   // x city light (coarse), y flicker phase, z relief (0|1)
      attribute vec2 aGeo;                        // u, v on the world's equirectangular images (row 0 = 90N)
      uniform vec3 uSun, cIce, cTeal, cDeep, cEvent, cHot, uFootN, uFootK; uniform float uTime, uReveal, uZoom, uDotK, uObjPx, uFine, uMeshA; uniform vec4 uFocus;
      uniform sampler2D uLightsW, uLightsJ; uniform float uDprD, uFarK;
      varying vec2 vUv; varying vec3 vCol; varying float vGlow; varying float vQuad; varying float vA;
      void main(){
        vec3 n = aPos.xyz;
        vec3 nw = normalize(mat3(modelMatrix) * n);
        vec3 cw = (modelMatrix * vec4(n, 1.0)).xyz;
        float ndv = dot(nw, normalize(cameraPosition - cw));
        float ndl = dot(nw, uSun);
        bool far = ndv < 0.0;
        // assembly: a latitude sweep north -> south; behind it every dot settles onto the surface
        // along its normal from a short distance out, growing from nothing
        float edge = mix(1.25, -1.6, uReveal);
        float rev = clamp((n.y - edge) / 0.45, 0.0, 1.0); rev = rev * rev * (3.0 - 2.0 * rev);
        float night = 1.0 - smoothstep(-0.16, 0.03, ndl);
        float tw = 1.0 - 0.15 * (0.5 + 0.5 * sin(uTime * 1.3 + aAux.y));   // the scarce city-light flicker
        float city = aAux.x;
        if (uFine > 0.5 && !far) {
          // night lights from the images (stored level / 15; linear light is its square); the Japan image in its box
          vec2 j = vec2((aGeo.x * 360.0 - 302.0) / 24.0, (aGeo.y * 180.0 - 44.0) / 22.0);
          bool inJ = j.x >= 0.0 && j.x <= 1.0 && j.y >= 0.0 && j.y <= 1.0;
          float lv = inJ ? textureLod(uLightsJ, j, 0.0).r : textureLod(uLightsW, aGeo, 0.0).r;
          city = 1.0 - exp(-${LIGHT_GAIN.toFixed(1)} * lv * lv);
          city = city > 0.02 ? city : 0.0;
        }
        float glow = far ? 0.0 : city * night * tw;
        float lit = uFocus.w * step(0.99972, dot(n, uFocus.xyz));
        float q = (glow > 0.002 || lit > 0.5) ? 2.2 : 1.0;
        float zk = uFine > 0.5 ? mix(1.0, 0.62, uZoom) : mix(1.0, 0.62, uZoom) * uDotK;
        float r = aPos.w * rev * (0.8 + 0.25 * glow * glow + (glow > 0.002 ? 0.0 : 0.2)) * (far ? 0.75 : 1.0) * (1.0 + 0.5 * lit) * zk;
        vA = uMeshA;
        if (uFine > 0.5) {
          /* The tile's level of detail (aAux.x: 0 the world; 0.25 the tile's far set, one cell per half-degree block;
             0.5 its near set, every second cell each way; 1 its zoom-only set, the rest). At orbit the tile's cells
             are under a pixel apart, and even one in four of them read as a sharper patch over Japan and Korea
             beside the half-degree world. So only the far set stands there, at uFarK times the radius (the tile
             cells across its block, 5; 10 on the phone's one-degree world: the world's dot size, as it stands for
             its block); the near set arrives first as the view comes down (openB, at twice
             the radius: it stands for four), then the zoom-only set as the cells open into a halftone (open), and
             every set ends at its own radius. sp: css px between neighbouring tile cells (0.1 degree = 0.0017453 rad). */
          float sp = 0.0017453 * uObjPx / uDprD;
          float open = smoothstep(${glf(TILE_ZOOM_OPEN[0])}, ${glf(TILE_ZOOM_OPEN[1])}, sp);
          float openB = smoothstep(${glf(TILE_NEAR_OPEN[0])}, ${glf(TILE_NEAR_OPEN[1])}, sp);
          if (aAux.x > 0.75) vA *= open;
          else if (aAux.x > 0.375) { vA *= openB; r *= mix(2.0, 1.0, open); }
          else if (aAux.x > 0.125) r *= mix(mix(uFarK, 2.0, openB), 1.0, open);
          // never larger than 1.7 css px: the coarser world beside the tile stays a halftone below orbit
          float rpx = min(r * uObjPx, 1.7 * uDprD), rd = max(rpx, 0.75);
          r = rpx / uObjPx;
          vA *= min(1.0, 1.15 * (rpx * rpx) / (rd * rd));   // a sub-pixel dot keeps its light, not its size (2.2 as first built: too pale by day)
          r *= rd / max(rpx, 1e-6);
          q = (glow > 0.002 && rd > 1.6) ? 2.2 : 1.0;     // a lit fine dot gets its halo only once it is a real halftone dot
        }
        vec3 ref = abs(n.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 t = normalize(cross(ref, n)); vec3 b = cross(n, t);
        vec3 p = n * (1.0015 + 0.30 * (1.0 - rev)) + (t * position.x + b * position.y) * r * q;
        vUv = position.xy * q; vQuad = q;
        // day: pale ice deepening to teal toward the terminator; night: dim teal
        float dayT = smoothstep(0.0, 0.7, ndl);
        vec3 dayCol = mix(cTeal * 1.25, cIce * 0.55, dayT);
        vec3 nightCol = cTeal * 0.30;
        vec3 base = mix(nightCol, dayCol, smoothstep(-0.10, 0.10, ndl));
        // the one sanctioned cyan->warm transition: a narrow dusk band at the terminator, on the land
        float dusk = exp(-pow((ndl + 0.03) / 0.065, 2.0));
        base = mix(base, cEvent * 0.42, dusk * 0.75);
        base *= 1.0 + 0.30 * aAux.z;                                                  // relief: the same dot, a little brighter
        base *= far ? 0.0 : mix(0.75, 1.55, pow(1.0 - clamp(ndv, 0.0, 1.0), 2.2));   // light gathers at the silhouette
        // F1a: full brightness inside the eye's footprint, falling off smoothly outside it (Japan is the brightest
        // land by its distance from the footprint's centre, never by a border)
        base *= 1.0 - uFootK.z * (1.0 - smoothstep(uFootK.y, uFootK.x, dot(n, uFootN)));
        if (far) base = mix(cTeal * 0.55, cDeep * 0.30, 0.5) * 0.14 * (0.5 + 0.5 * smoothstep(-1.0, -0.2, ndv)) * 1.6 * (1.0 - uZoom);
        base += cHot * lit * 1.4;
        vCol = base * mix(0.35, 1.0, rev); vGlow = glow;
        gl_Position = (r < 1e-5 || vA < 0.002) ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: GLSL_GLOBE + /* glsl */`
      uniform vec3 cEvent, cEventHot;
      varying vec2 vUv; varying vec3 vCol; varying float vGlow; varying float vQuad; varying float vA;
      void main(){
        float d = length(vUv);
        if (d > vQuad) discard;
        float aa = fwidth(d) * 0.75;
        float disc = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, d);
        vec3 c = vCol * disc;
        float e = vGlow;
        c += cEvent * e * 2.1 * disc;
        c += cEventHot * e * e * e * 2.6 * (1.0 - smoothstep(0.0, 0.7, d));
        c += cEvent * e * e * 0.30 * exp(-d * d * 1.1) * (1.0 - smoothstep(vQuad * 0.6, vQuad, d));
        c += vCol * 0.10 * exp(-d * d * 1.5) * step(1.5, vQuad) * (1.0 - smoothstep(vQuad * 0.6, vQuad, d));
        gl_FragColor = vec4(toSRGB(tonemap(c)) * vA * globeK(), 1.0);
      }`,
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  });
  const dotMat = dotMaterial(false);
  const dotMesh = add(new THREE.Mesh(dotGeo, dotMat), 3, { screen: true });
  let fineMesh = null, fineDots = null, detailK = 0, detailOn = false;   // the fine set, once it has landed

  // ---------------------------------------------------------------- atmosphere (back-face shell): cyan only, thin, edge-weighted
  const atmoMat = new THREE.ShaderMaterial({
    uniforms: { ...pick(U, 'uSun', 'uExposure', 'uReveal'), cSignal: col(C.signal), cHot: col(C.signalHot) },
    vertexShader: /* glsl */`
      varying vec3 vW;
      void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: GLSL_GLOBE + /* glsl */`
      uniform vec3 uSun, cSignal, cHot; uniform float uReveal;
      varying vec3 vW;
      void main(){
        vec3 dir = normalize(vW - cameraPosition);
        vec3 cp = cameraPosition + dir * dot(-cameraPosition, dir);   // closest approach to the centre
        float h = length(cp);
        float a = clamp((1.045 - h) / 0.045, 0.0, 1.0);
        float g = pow(a, 4.0) * 0.55 + pow(a, 14.0) * 0.55;           // short falloff + thin hot limb
        float ndl = dot(cp / h, uSun);
        float day = smoothstep(-0.06, 0.4, ndl);
        float term = exp(-pow(ndl / 0.28, 2.0));
        vec3 c = cSignal * g * (0.06 + 0.55 * day + 0.55 * term);
        // F1a, the sun: a thin line of atmosphere on the sunlit edge (the last 0.4% of the radius, day side only)
        c += cHot * smoothstep(0.990, 0.9985, h) * (1.0 - smoothstep(1.0, 1.004, h)) * smoothstep(0.05, 0.6, ndl) * 0.9;
        gl_FragColor = vec4(toSRGB(tonemap(c * 0.55)) * uReveal * globeK(), 1.0);
      }`,
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  add(new THREE.Mesh(new THREE.SphereGeometry(1.065, 128, 64), atmoMat), 4, { screen: true });

  // ---------------------------------------------------------------- markers (data)
  const v3 = (p, r = 1) => new THREE.Vector3(p[0] * r, p[1] * r, p[2] * r);
  const xyz = pl => latLonToXYZ(pl.lat, pl.lon);
  const TOKYO_OBJ = v3(xyz(TOKYO), 1.02);

  // ---------------------------------------------------------------- surface markers (discs, one-shot pulse rings, area circles)
  /* Types: 0 Tokyo core disc · 1 pulse ring · 2 Dallas disc · 3 a photo AREA: an open circle the size of
     "about here" (its km radius, never under MARK_MIN_PX css px so it still reads as a circle), no pin,
     no tick, nothing at a spot. Hover/focus (uHover = the mark's id) brightens it.
     The orbit level draws the American areas only (plan, step 1b): the Japanese ones belong to the Japan
     map (step 3), and at this scale they would sit on Tokyo's and Osaka's hot cores (a cyan line on an
     amber core reads near-white) where Tokyo's own mark is the one mark on Japan. */
  const MARK_MIN_PX = 4;
  const marks = AREAS.filter(a => a.region === 'us').map((a, i) => ({ ...a, area: a.id, id: i + 2, obj: v3(xyz(a), 1.003) }));
  {
    const rows = [];
    const row = (p, size, c, type, phase, id) => rows.push([...p, size, c.x, c.y, c.z, type, phase, id]);
    const tk = xyz(TOKYO), dl = xyz(DALLAS);
    row(tk, TOKYO_MARK, C.eventHot, 0, 0, 0);   // F1a: one small amber point (its quad, MARK_Q x, under 12 px across)
    row(tk, 0.04, C.event, 1, 0, 0);            // the arrival's two one-shot pulses, kept inside the footprint
    row(tk, 0.04, C.event, 1, 0.35, 0);
    row(dl, 0.0085, C.event, 2, 0, 1);
    marks.forEach(mk => row(xyz(mk), mk.km / 6371, C.signal, 3, 0, mk.id));
    const g = quad(new THREE.InstancedBufferGeometry());
    const a = (k, s, e) => new THREE.InstancedBufferAttribute(new Float32Array(rows.flatMap(r => r.slice(s, e))), k);
    g.setAttribute('aPos', a(4, 0, 4)); g.setAttribute('aCol', a(4, 4, 8)); g.setAttribute('aMeta', a(2, 8, 10));
    g.instanceCount = rows.length;
    const m = new THREE.ShaderMaterial({
      uniforms: { ...pick(U, 'uTime', 'uExposure', 'uReveal', 'uHover', 'uPulse0', 'uZoom', 'uPx', 'uDpr', 'uMarkK'), uMinPx: { value: MARK_MIN_PX } },
      vertexShader: /* glsl */`
        attribute vec4 aPos; attribute vec4 aCol; attribute vec2 aMeta;
        uniform float uTime, uReveal, uHover, uPulse0, uZoom, uPx, uMinPx, uMarkK;
        varying vec2 vUv; varying vec3 vCol; varying float vType; varying float vA;
        void main(){
          vec3 n = aPos.xyz; float s = aPos.w * mix(1.0, 0.4, uZoom); float a = 1.0;
          if (aCol.w == 1.0) {   // fires once per trigger (arrival, acquisition), never on a timer
            float ph = (uTime - uPulse0) / 1.5 - aMeta.x;
            a = ph < 0.0 || ph > 1.0 ? 0.0 : pow(1.0 - ph, 1.7);
            s *= 0.12 + 0.88 * clamp(ph, 0.0, 1.0);
          }
          float hov = abs(aMeta.y - uHover) < 0.5 ? 1.0 : 0.0;
          if (aCol.w == 2.0) s *= 1.0 + 0.9 * hov;
          if (aCol.w == 3.0) s = max(s, uMinPx * uPx);
          if (aCol.w == 0.0) s = aPos.w * uMarkK;   // F1a: Tokyo stays one small point below orbit too
          vec3 ref = abs(n.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
          vec3 t = normalize(cross(ref, n)); vec3 b = cross(n, t);
          float q = aCol.w == 1.0 ? 1.0 : (aCol.w == 3.0 ? 1.35 : ${MARK_Q.toFixed(2)});
          vec3 p = n * 1.003 + (t * position.x + b * position.y) * s * q;
          vUv = position.xy * q; vCol = aCol.rgb * (1.0 + (aCol.w == 3.0 ? 1.3 : 1.0) * hov); vType = aCol.w; vA = a * smoothstep(0.6, 1.0, uReveal);
          gl_Position = a < 0.001 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: GLSL_GLOBE + /* glsl */`
        uniform float uDpr;
        varying vec2 vUv; varying vec3 vCol; varying float vType; varying float vA;
        void main(){
          float d = length(vUv); float aa = fwidth(d);
          vec3 c;
          if (vType == 1.0) {
            float w = max(aa * 1.3, 0.02);
            c = vCol * (1.0 - smoothstep(0.0, w, abs(d - 0.96))) * 1.4 + vCol * 0.10 * (1.0 - smoothstep(0.0, 1.0, d));
          } else if (vType == 3.0) {
            // a thin open circle (about 1 css px), a faint wash inside it: an area, not a point
            float hw = 0.5 * uDpr * aa;
            float line = 1.0 - smoothstep(hw, hw + aa, abs(d - 1.0));
            c = vCol * (line * 1.25 + 0.07 * (1.0 - smoothstep(0.85, 1.0, d)));
          } else {
            float disc = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, d);
            c = vCol * disc * (vType == 0.0 ? 6.0 : 2.2) + vCol * exp(-d * d * 1.6) * 0.45;
          }
          gl_FragColor = vec4(toSRGB(tonemap(c * vA)) * globeK(), 1.0);
        }`,
      transparent: true, depthWrite: false,
    });
    add(new THREE.Mesh(g, maxBlend(m)), 5);
  }

  // ---------------------------------------------------------------- Dallas -> Tokyo arc: draws on once, then rests as a faint line
  const ARC_A = v3(xyz(DALLAS)), ARC_B = v3(xyz(TOKYO));
  const ARC_W = Math.acos(ARC_A.dot(ARC_B)), ARC_S = Math.sin(ARC_W);
  function arcPoint(t, out) {
    const ka = Math.sin((1 - t) * ARC_W) / ARC_S, kb = Math.sin(t * ARC_W) / ARC_S, lift = 1.003 + 0.22 * Math.sin(Math.PI * t);
    return out.set((ARC_A.x * ka + ARC_B.x * kb) * lift, (ARC_A.y * ka + ARC_B.y * kb) * lift, (ARC_A.z * ka + ARC_B.z * kb) * lift);
  }
  let arcMat;
  {
    const SEG = 220, pos = [], nxt = [], side = [], tt = [], idx = [];
    const p = new THREE.Vector3(), q = new THREE.Vector3();
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG; arcPoint(t, p);
      if (i < SEG) arcPoint(t + 1 / SEG, q); else { arcPoint(t - 1 / SEG, q); q.set(2 * p.x - q.x, 2 * p.y - q.y, 2 * p.z - q.z); }
      for (const s of [-1, 1]) { pos.push(p.x, p.y, p.z); nxt.push(q.x, q.y, q.z); side.push(s); tt.push(t); }
      if (i < SEG) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aNext', new THREE.Float32BufferAttribute(nxt, 3));
    g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(tt, 1));
    g.setIndex(idx);
    arcMat = new THREE.ShaderMaterial({
      uniforms: { ...pick(U, 'uExposure', 'uReveal', 'uZoom'), uDraw: { value: 0 }, uHeadK: { value: 0 }, cEvent: col(C.event), cEventHot: col(C.eventHot) },
      vertexShader: /* glsl */`
        attribute vec3 aNext; attribute float aSide; attribute float aT; uniform float uZoom;
        varying float vSide; varying float vT;
        void main(){
          vec3 w = (modelMatrix * vec4(position, 1.0)).xyz, wn = (modelMatrix * vec4(aNext, 1.0)).xyz;
          vec3 tg = normalize(wn - w); vec3 sd = normalize(cross(tg, normalize(cameraPosition - w)));
          w += sd * aSide * 0.0042 * mix(1.0, 0.3, uZoom);
          vSide = aSide; vT = aT;
          gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
        }`,
      fragmentShader: GLSL_GLOBE + /* glsl */`
        uniform float uDraw, uHeadK, uReveal; uniform vec3 cEvent, cEventHot;
        varying float vSide; varying float vT;
        void main(){
          if (vT > uDraw) discard;
          float x = abs(vSide);
          float core = 1.0 - smoothstep(0.15, 1.0, x);
          float ends = smoothstep(0.0, 0.04, vT) * smoothstep(1.0, 0.96, vT);
          float d = uDraw - vT;
          float head = exp(-d * 9.0) * uHeadK;
          vec3 c = cEvent * (0.16 * ends * uReveal + 2.4 * head) * core + cEventHot * pow(head, 3.0) * 1.6 * core;
          gl_FragColor = vec4(toSRGB(tonemap(c)) * globeK(), 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    add(new THREE.Mesh(g, arcMat), 7);
  }

  // ---------------------------------------------------------------- additive halo sprites (Tokyo, Dallas, arc head)
  const headObj = new THREE.Vector3(), headAmp = { value: 0 };
  {
    const rows = [
      [...v3(xyz(DALLAS), 1.004).toArray(), 0.05, C.event.x, C.event.y, C.event.z, 1],
      [0, 0, 0, 0.07, C.eventHot.x, C.eventHot.y, C.eventHot.z, 2],
    ];
    const g = quad(new THREE.InstancedBufferGeometry());
    g.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(rows.flatMap(r => r.slice(0, 4))), 4));
    g.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(rows.flatMap(r => r.slice(4, 8))), 4));
    g.instanceCount = rows.length;
    const m = new THREE.ShaderMaterial({
      uniforms: { ...pick(U, 'uExposure', 'uReveal', 'uMarkK'), uHead: { value: headObj }, uHeadAmp: headAmp },
      vertexShader: GLSL_COMMON + /* glsl */`
        attribute vec4 aPos; attribute vec4 aCol; uniform vec3 uHead; uniform float uHeadAmp, uReveal, uMarkK;
        varying vec2 vUv; varying vec3 vCol; varying float vA;
        void main(){
          vec3 c = aCol.w == 2.0 ? uHead : aPos.xyz;
          vec4 w = modelMatrix * vec4(c, 1.0);
          float vis = sphereVis(cameraPosition, w.xyz);
          float a = aCol.w == 2.0 ? uHeadAmp : (aCol.w == 0.0 ? 0.66 : 0.7);
          vec4 mv = viewMatrix * w; mv.xy += position.xy * aPos.w * uMarkK;
          vUv = position.xy; vCol = aCol.rgb; vA = a * vis * smoothstep(0.5, 1.0, uReveal);
          gl_Position = vA < 0.001 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
        }`,
      fragmentShader: GLSL_GLOBE + /* glsl */`
        varying vec2 vUv; varying vec3 vCol; varying float vA;
        void main(){
          float d = length(vUv);
          float f = exp(-d * d * 9.0) * 0.9 + exp(-d * d * 60.0) * 1.4 + exp(-d * 4.5) * 0.12;
          f *= 1.0 - smoothstep(0.8, 1.0, d);
          gl_FragColor = vec4(toSRGB(tonemap(vCol * f * vA * 0.9)) * globeK(), 1.0);
        }`,
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    });
    add(new THREE.Mesh(g, maxBlend(m)), 8);
  }

  // ---------------------------------------------------------------- F1a: thin lines on the surface: the eye's footprint and the coasts
  /* One mesh, instanced segments drawn as screen-space ribbons of a fixed css width, depth-tested against the body so
     the far side is hidden like the other lines. kind 0: the footprint (one thin cyan circle round Japan, no fill;
     gone below orbit), 1: the world coast (Japan's width, at the strength the Japan coast falls to outside the
     footprint, so the whole world's outline reads alike), 2: the Japan coast (brighter inside the footprint, falling
     off to the world's strength outside it). The first view draws the footprint alone; the coasts join it when the detail lands (not on lite). */
  const FOOT_SEG = 120;
  const footSegs = new Float32Array(FOOT_SEG * 7);
  {
    const n0 = new THREE.Vector3(...latLonToXYZ(JAPAN.lat, JAPAN.lon));
    const t = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), n0).normalize(), b = new THREE.Vector3().crossVectors(n0, t);
    const ca = Math.cos(FOOT_DEG * DEG), sa = Math.sin(FOOT_DEG * DEG), R = 1.0015;
    const at = (k, o) => { const a = (k / FOOT_SEG) * Math.PI * 2; const p = n0.clone().multiplyScalar(ca).addScaledVector(t, Math.cos(a) * sa).addScaledVector(b, Math.sin(a) * sa).multiplyScalar(R); footSegs.set([p.x, p.y, p.z], o); };
    for (let k = 0; k < FOOT_SEG; k++) { at(k, k * 7); at(k + 1, k * 7 + 3); footSegs[k * 7 + 6] = 0; }
  }
  const lineGeo = segs => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0], 3));   // x: which end, y: which side
    g.setIndex([0, 2, 1, 1, 2, 3]);
    const buf = new THREE.InstancedInterleavedBuffer(segs, 7);
    g.setAttribute('aA', new THREE.InterleavedBufferAttribute(buf, 3, 0));
    g.setAttribute('aB', new THREE.InterleavedBufferAttribute(buf, 3, 3));
    g.setAttribute('aKind', new THREE.InterleavedBufferAttribute(buf, 1, 6));
    g.instanceCount = segs.length / 7;
    return g;
  };
  const lineMat = new THREE.ShaderMaterial({
    uniforms: { ...pick(U, 'uExposure', 'uReveal', 'uRes', 'uDpr', 'uFootN', 'uFootK', 'uFootA', 'uZoom'), cSignal: col(C.signal), cIce: col(C.ice) },
    vertexShader: /* glsl */`
      attribute vec3 aA, aB; attribute float aKind;
      uniform vec2 uRes; uniform float uDpr, uFootA, uReveal; uniform vec3 uFootN, uFootK;
      varying float vD; varying float vK; varying float vHw;
      void main(){
        vec4 ca = projectionMatrix * modelViewMatrix * vec4(aA, 1.0), cb = projectionMatrix * modelViewMatrix * vec4(aB, 1.0);
        vec2 sa = ca.xy / ca.w * uRes * 0.5, sb = cb.xy / cb.w * uRes * 0.5;
        vec2 d = sb - sa; vec2 dir = dot(d, d) > 1e-8 ? normalize(d) : vec2(1.0, 0.0); vec2 nrm = vec2(-dir.y, dir.x);
        vec4 c = position.x > 0.5 ? cb : ca;
        vec3 p = position.x > 0.5 ? aB : aA;
        float core = aKind < 0.5 ? 0.55 : 0.45;       // half the line's width, css px
        float hw = core * uDpr + 1.0;                                          // device px, with room for the edge's AA
        c.xy += nrm * position.y * hw / (uRes * 0.5) * c.w;
        vD = position.y * hw; vHw = core * uDpr;
        // brightness: the footprint (gone below orbit), the world coast, the Japan coast by the footprint's falloff down to the world's
        float f = smoothstep(uFootK.y, uFootK.x, dot(normalize(p), uFootN));
        vec3 nw = normalize(mat3(modelMatrix) * p);
        vec3 w = (modelMatrix * vec4(p, 1.0)).xyz;
        float face = smoothstep(0.0, 0.2, dot(nw, normalize(cameraPosition - w)));
        vK = (aKind < 0.5 ? 0.85 * uFootA : (aKind < 1.5 ? 0.58 : mix(0.58, 0.75, f))) * face * smoothstep(0.6, 1.0, uReveal);
        gl_Position = vK < 0.002 ? vec4(2.0, 2.0, 2.0, 1.0) : c;
      }`,
    fragmentShader: GLSL_GLOBE + /* glsl */`
      uniform vec3 cSignal, cIce;
      varying float vD; varying float vK; varying float vHw;
      void main(){
        float a = 1.0 - smoothstep(vHw - 0.5, vHw + 0.5, abs(vD));
        vec3 c = mix(cSignal, cIce, 0.35) * a * vK;
        gl_FragColor = vec4(toSRGB(tonemap(c)) * globeK(), 1.0);
      }`,
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
  });
  const lines = add(new THREE.Mesh(lineGeo(footSegs), lineMat), 5, { screen: true });
  let coastCount = 0;

  // ---------------------------------------------------------------- orbit ring: a thin tilted ellipse at 1.45 R, screen-space neon ribbon
  let orbit;
  {
    const SEG = 320, R = 1.45, pos = [], nxt = [], side = [], idx = [];
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * Math.PI * 2, b = ((i + 1) / SEG) * Math.PI * 2;
      for (const s of [-1, 1]) { pos.push(Math.cos(a) * R, 0, Math.sin(a) * R); nxt.push(Math.cos(b) * R, 0, Math.sin(b) * R); side.push(s); }
      if (i < SEG) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aNext', new THREE.Float32BufferAttribute(nxt, 3));
    g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
    g.setIndex(idx);
    const m = new THREE.ShaderMaterial({
      uniforms: { ...pick(U, 'uExposure', 'uReveal', 'uRes', 'uDpr', 'uZoom'), cSignal: col(C.signal), cHot: col(C.signalHot) },
      vertexShader: /* glsl */`
        attribute vec3 aNext; attribute float aSide;
        uniform vec2 uRes; uniform float uDpr;
        varying float vD; varying float vNear;
        void main(){
          vec4 c0 = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vec4 c1 = projectionMatrix * modelViewMatrix * vec4(aNext, 1.0);
          vec2 s0 = c0.xy / c0.w * uRes * 0.5, s1 = c1.xy / c1.w * uRes * 0.5;
          vec2 dir = normalize(s1 - s0); vec2 nrm = vec2(-dir.y, dir.x);
          float hw = 7.0 * uDpr;                         // quad half-width, device px
          c0.xy += nrm * aSide * hw / (uRes * 0.5) * c0.w;
          vD = aSide * hw / uDpr;                        // css px from the centre line
          vNear = (modelViewMatrix * vec4(position, 1.0)).z - (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).z;
          gl_Position = c0;
        }`,
      fragmentShader: GLSL_GLOBE + /* glsl */`
        uniform vec3 cSignal, cHot; uniform float uReveal, uZoom;
        varying float vD; varying float vNear;
        void main(){
          float d = abs(vD);
          float core = 1.0 - smoothstep(0.25, 0.85, d);           // ~1.1 css px hot line
          float glow = exp(-d * 0.9) * 0.16 + exp(-d * 0.3) * 0.025;   // soft but short: no haze
          float k = mix(0.55, 1.0, smoothstep(-1.2, 1.2, vNear)) * smoothstep(0.3, 1.0, uReveal) * (1.0 - smoothstep(0.0, 0.5, uZoom));
          vec3 c = (cSignal * (core * 0.55 + glow) + cHot * core * 0.12) * k;
          gl_FragColor = vec4(toSRGB(tonemap(c)) * globeK(), 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    orbit = add(new THREE.Mesh(g, m), 10, { parent: root, screen: true });   // in the scene, not the earth: it does not spin with the land
    orbit.rotation.set(0.075, 0, -0.06);           // nearly edge-on, a slight roll
  }

  // ---------------------------------------------------------------- sun from the real date (or a fixed hour)
  const sunObj = new THREE.Vector3();
  const sunLive = sunHour == null;
  /* The real sun is the almanac's (sky-math sunSubpoint, about 0.01 degree), in the frame the stars use, so the
     day/night line, the eye's shadow and the sky agree. Until F1 this was a mean-time hour angle with a sine
     declination and no equation of time: up to 4 degrees west or east of the true sun through the year (1.86
     at the March 2024 equinox). A fixed hour (the ?sun= switch) keeps that simple form: it is a test dial. */
  function setSun(h) {
    let lat, lon;
    if (h == null) ({ lat, lon } = sunSubpoint(Date.now()));
    else {
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - Date.UTC(today.getUTCFullYear(), 0, 0)) / 86400000);
      lat = 23.44 * Math.sin(2 * Math.PI * (dayOfYear - 81) / 365.25);
      lon = 180 - (h * 60) / 4; lon = ((lon + 540) % 360) - 180;
    }
    const p = latLonToXYZ(lat, lon); sunObj.set(p[0], p[1], p[2]).normalize();
  }
  setSun(sunLive ? null : ((sunHour % 24) + 24) % 24);

  // ---------------------------------------------------------------- composition
  /* F1a (design 14.2): at rest Japan faces the viewer at the centre of the disc. The idle turn is a slow sway of a
     few degrees round that pose (SWAY_*), no longer a full turn every 180 s, so Japan never leaves the view. */
  const japanV = v3(xyz(JAPAN));
  const BASE_SPIN = Math.atan2(-japanV.x, japanV.z);
  const BASE_TILT = Math.max(-0.6, Math.min(1.0, JAPAN.lat * DEG));
  let spin = BASE_SPIN, tilt = BASE_TILT, vel = 0, swayT = 0;
  const L = { w: 1, h: 1, cx: 0, cy: 0, r: 1, dpr: 1 };
  /* The descent. The orbit camera sits at D0, where the whole Earth fills the disc. Going down a level brings the
     camera closer AND widens its lens, so the Earth's edge stays on the ring at every level and the Earth is always
     seen as a ball: the ground under the viewer swells toward them and the rest curves away to the edge (a dolly
     zoom). As first built (step 2) the camera came closer through the same narrow lens: the ring then showed a
     patch about 13 degrees across, which has no visible curve, and Japan and Tokyo read as flat maps (the owner,
     2026-11-26: "shouldn't it be spherical since the globe is for earth?").
     Z stays what it was to every caller: the magnification of the ground under the viewer, 1 at orbit. Japan is
     3.6 (the camera about 820 km up) and Tokyo 5.4 (about 350 km, the height of the space station): story.mjs.
     baseCamera stays at orbit: the eye is drawn with it, so the satellite keeps its size and place over the view
     while the Earth comes up under it. */
  const baseCamera = new THREE.PerspectiveCamera(22, 1, 0.1, 50);
  let D0 = 8, zoomZ = 1;
  const ZOOM_FULL = 8;                  // the zoom at which the prototype's compensation (uZoom) is complete
  function placeCamera() {
    /* On a lens that keeps the Earth's edge on the ring, the ground under the viewer is magnified by
       sqrt((d + 1) / (d - 1)) at distance d (in Earth radii, from the centre). Relative to orbit that is Z, which
       gives d for a Z. The lens is then the one that puts the edge (asin(1 / d) off the axis) on the ring, the same
       formula resize() uses for the orbit view; the near plane follows the camera down. */
    const m0 = Math.sqrt((D0 + 1) / (D0 - 1)), K = (m0 * zoomZ) * (m0 * zoomZ);
    const dist = zoomZ <= 1.0001 ? D0 : (K + 1) / (K - 1);
    const ndcR = L.r / (L.h / 2);
    camera.position.set(0, 0, dist);
    camera.near = Math.max(0.002, (dist - 1) * 0.25);
    camera.fov = 2 * Math.atan(Math.tan(Math.asin(1 / dist)) / ndcR) / DEG;
    camera.updateProjectionMatrix();
    const sx = (L.cx / L.w) * 2 - 1, sy = 1 - (L.cy / L.h) * 2;
    camera.projectionMatrix.elements[8] = -sx; camera.projectionMatrix.elements[9] = -sy;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    camera.updateMatrixWorld();
    const on = Math.min(1, Math.max(0, (zoomZ - 1) / 0.05));
    U.uLens.value.set(L.cx * L.dpr, (L.h - L.cy) * L.dpr, L.r * L.dpr, on);
    U.uZoom.value = Math.min(1, Math.max(0, Math.log(zoomZ) / Math.log(ZOOM_FULL)));
    U.uDotK.value = Math.pow(zoomZ, -0.45);
    U.uMarkK.value = Math.pow(zoomZ, -0.85);
    U.uObjPx.value = L.r * L.dpr * zoomZ;
    U.uFootA.value = 1 - Math.min(1, Math.max(0, (zoomZ - 1.05) / 0.75));   // below orbit the ring frames the view: the footprint fades out by 1.8x
  }
  /** Z = 1 at orbit. */
  function setZoom(z) { const v = Math.max(1, z); if (v !== zoomZ) { zoomZ = v; placeCamera(); } }
  function resize({ w, h, cx, cy, r, dpr }) {
    Object.assign(L, { w, h, cx, cy, r, dpr });
    const ndcR = r / (h / 2), tanHalf = Math.tan(22 * DEG / 2);   // the whole-Earth lens
    const dist = 1 / Math.sin(Math.atan(ndcR * tanHalf));
    D0 = dist;
    camera.aspect = w / h;
    camera.fov = 2 * Math.atan(Math.tan(Math.asin(1 / dist)) / ndcR) / DEG;
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    const sx = (cx / w) * 2 - 1, sy = 1 - (cy / h) * 2;
    camera.projectionMatrix.elements[8] = -sx; camera.projectionMatrix.elements[9] = -sy;   // off-axis: shift, no tilt
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    camera.updateMatrixWorld();
    baseCamera.copy(camera);
    baseCamera.projectionMatrix.copy(camera.projectionMatrix);
    baseCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    baseCamera.updateMatrixWorld();
    U.uDpr.value = dpr; U.uRes.value.set(Math.round(w * dpr), Math.round(h * dpr));
    U.uPx.value = 1 / Math.max(1, r);
    placeCamera();
  }

  // ---------------------------------------------------------------- a turn on request (the eye, a place button): face a point, hold, then idle again
  const TURN_HOLD = 4;                  // s after the turn lands (or the hold is released) before the idle turn resumes
  let turn = null;                      // { spin, tilt, lat, lon, landed, holdUntil }
  let held = false;
  const wrapPi = a => Math.atan2(Math.sin(a), Math.cos(a));
  /** Turn the Earth so the point at lat/lon faces the viewer. cut: at once (reduced motion). */
  function turnTo(lat, lon, { cut = false } = {}) {
    const p = latLonToXYZ(lat, lon);
    const s = Math.atan2(-p[0], p[2]);
    const t = Math.max(-0.6, Math.min(1.0, lat * DEG));
    turn = { spin: spin + wrapPi(s - spin), tilt: t, lat, lon, landed: false, holdUntil: Infinity };
    vel = 0;
    if (cut) { spin = turn.spin; tilt = turn.tilt; turn.landed = true; turn.holdUntil = clock + TURN_HOLD; pose(); }
  }
  /** While held (a focused place button), the Earth stays where the last turn put it. */
  function hold(on) { held = on; if (!on && turn && turn.landed) turn.holdUntil = clock + TURN_HOLD; }
  /* Step 2: the journey drives the pose. While driven, the requested turn and the idle turn stand down and
     the story writes spin and tilt every frame; let go, the idle turn eases in again from where it is. */
  let driven = false;
  function drive(on) { if (on === driven) return; driven = on; if (on) turn = null; else vel = 0; }
  function setPose(s, t) { spin = s; tilt = t; }
  /** T2a: the cursor follow, radians. yaw > 0 turns the face to the right on screen, pitch > 0 up. Applied at the
      next pose(), every frame (update). */
  function setFollow(yaw, pitch) { followGroup.rotation.set(-pitch, yaw, 0, 'YXZ'); }
  /** spin and tilt that face lat/lon to the viewer (spin unwrapped to the one nearest `near`). */
  function poseFor(lat, lon, near = spin) {
    const p = latLonToXYZ(lat, lon);
    const s = Math.atan2(-p[0], p[2]);
    return { spin: near + wrapPi(s - near), tilt: Math.max(-0.6, Math.min(1.0, lat * DEG)) };
  }
  function pose() {
    earth.rotation.y = spin; tiltGroup.rotation.x = tilt;
    root.updateMatrixWorld(true);
    U.uSun.value.copy(sunObj).applyMatrix3(nm3.setFromMatrix4(earth.matrixWorld)).normalize();   // world space
  }

  // ---------------------------------------------------------------- frame
  let clock = 0, sunT = 0, introAt = null;     // introAt: clock time the Earth began assembling (null = settled)
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const headTmp = new THREE.Vector3(), nm3 = new THREE.Matrix3();
  /** Start the assembly now (the arrival): reveal 0 -> 1 over INTRO_S, then the arc and the Tokyo pulse, once. */
  function assemble() { introAt = clock; U.uPulse0.value = clock + PULSE_AT; arcMat.uniforms.uDraw.value = 0; }
  /** Settle at once: Earth revealed, arc at rest, no pulse. */
  function settle() { introAt = null; U.uReveal.value = 1; U.uExposure.value = 1.45; arcMat.uniforms.uDraw.value = 1; arcMat.uniforms.uHeadK.value = 0; headAmp.value = 0; }
  /** Hold unrevealed (the ring moment). */
  function hide() { introAt = -1; U.uReveal.value = 0; U.uExposure.value = 1.45 * 0.35; arcMat.uniforms.uDraw.value = 0; }
  function update(dt) {
    clock += dt;
    U.uTime.value = clock;
    if (sunLive && (sunT += dt) > 60) { sunT = 0; setSun(null); }
    if (introAt != null && introAt >= 0) {
      const t = clock - introAt;
      const k = Math.min(1, t / INTRO_S);
      U.uReveal.value = easeOut(k);
      U.uExposure.value = 1.45 * (0.35 + 0.65 * easeOut(k));
      const ph = (t - ARC_START) / ARC_DUR;
      const head = Math.max(0, Math.min(1, ph)); const hs = head * head * (3 - 2 * head);
      arcMat.uniforms.uDraw.value = ph <= 0 ? 0 : hs;
      const hk = ph <= 0 ? 0 : ph <= 1 ? Math.min(1, ph * 6) : Math.max(0, 1 - (ph - 1) * ARC_DUR / 0.45);
      arcMat.uniforms.uHeadK.value = hk;
      if (hk > 0) { arcPoint(hs, headTmp); headObj.copy(headTmp); headAmp.value = hk * 0.9; } else headAmp.value = 0;
      if (ph > 1 && hk <= 0) introAt = null;     // the arc has landed and rests: nothing left to drive
    }
    if (driven) {
      // the story has set spin and tilt for this frame
    } else if (turn) {
      // a requested turn: ease onto the point (about a second), hold while asked and TURN_HOLD after, then let go
      const k = 1 - Math.exp(-dt * 4.2);
      spin += (turn.spin - spin) * k; tilt += (turn.tilt - tilt) * k;
      if (!turn.landed && Math.abs(turn.spin - spin) < 0.002 && Math.abs(turn.tilt - tilt) < 0.002) { turn.landed = true; turn.holdUntil = clock + TURN_HOLD; }
      if (turn.landed && !held && clock >= turn.holdUntil) turn = null;
    } else {
      // F1a: the idle sway round the Japan-facing rest pose, eased in from wherever the Earth was left
      swayT += dt;
      const ts = BASE_SPIN + SWAY_SPIN * Math.sin((2 * Math.PI * swayT) / SWAY_S);
      const tt = BASE_TILT + SWAY_TILT * Math.sin((2 * Math.PI * swayT) / (SWAY_S * 1.37));
      /* eased, and never faster than the old idle turn (2 degrees a second): a view left elsewhere (a take-over,
         a double-click below orbit) drifts home no faster than it drifted before */
      const k = 1 - Math.exp(-dt * 0.6), cap = IDLE_MAX * dt;
      spin += Math.max(-cap, Math.min(cap, wrapPi(ts - spin) * k));
      tilt += Math.max(-cap, Math.min(cap, (tt - tilt) * k));
    }
    if (fineMesh && detailK < 1) {
      // the detail's cross-fade: the fine set comes up as the coarse one goes down; then the coarse set is not drawn
      detailK = Math.min(1, detailK + dt / DETAIL_S);
      setDetailK(detailK);
    }
    pose();
    const visible = U.uReveal.value > 0.0005 && U.uFade.value > 0.002;
    tiltGroup.visible = visible; orbit.visible = visible && U.uZoom.value < 0.5;   // the orbit ring is gone by uZoom 0.5
  }

  // Tokyo on screen (css px) and how much it faces the viewer: the weather lights its amber strand with it
  const pv = new THREE.Vector3(), nv = new THREE.Vector3(), camW = new THREE.Vector3();
  function tokyo(out) {
    pv.copy(TOKYO_OBJ).applyMatrix4(earth.matrixWorld);
    nv.copy(pv).normalize();
    camW.copy(camera.position).sub(pv).normalize();
    out.facing = nv.dot(camW);
    out.wx = pv.x; out.wy = pv.y; out.wz = pv.z;
    pv.project(camera);
    out.x = (pv.x * 0.5 + 0.5) * L.w; out.y = (0.5 - pv.y * 0.5) * L.h;
    return out;
  }

  // ---------------------------------------------------------------- for the eye and the labels
  /* Night in Tokyo from the same sun the land is lit by: the sun below the horizon there (refraction's
     0.833 deg included). */
  const SUNSET = Math.sin(-0.833 * DEG);
  const tokyoN = v3(xyz(TOKYO)).normalize();
  const tokyoIsNight = () => sunObj.dot(tokyoN) < SUNSET;
  const inv = new THREE.Matrix4(), gv = new THREE.Vector3();
  /** lat/lon of the point on the Earth under a world-space direction. */
  function geoOf(world) {
    inv.copy(earth.matrixWorld).invert();
    gv.copy(world).transformDirection(inv);
    return xyzToLatLon(gv.x, gv.y, gv.z);
  }
  const toCam = new THREE.Vector3();
  /** The point of the Earth that faces the viewer. */
  const facing = () => geoOf(toCam.copy(camera.position).normalize());
  /** A world point on screen (css px). */
  function project(world, out) {
    pv.copy(world).project(camera);
    out.x = (pv.x * 0.5 + 0.5) * L.w; out.y = (0.5 - pv.y * 0.5) * L.h;
    return out;
  }
  /** A world point on screen (css px) as the orbit camera sees it (the eye). */
  function projectBase(world, out) {
    pv.copy(world).project(baseCamera);
    out.x = (pv.x * 0.5 + 0.5) * L.w; out.y = (0.5 - pv.y * 0.5) * L.h;
    return out;
  }
  /** Inside the lens (always true at orbit). */
  const inLens = (x, y) => U.uLens.value.w < 0.5 || Math.hypot(x - L.cx, y - L.cy) <= L.r;
  /** Every area mark on screen: x, y (css px), r (css px), facing (> 0 on the near side), inLens. */
  const markScreen = marks.map(mk => ({ id: mk.id, area: mk.area, x: 0, y: 0, r: 0, facing: 0, inLens: true }));
  const mw = new THREE.Vector3();
  function placeMarks() {
    for (let i = 0; i < marks.length; i++) {
      const mk = marks[i], o = markScreen[i];
      mw.copy(mk.obj).applyMatrix4(earth.matrixWorld);
      nv.copy(mw).normalize(); camW.copy(camera.position).sub(mw).normalize();
      o.facing = nv.dot(camW);
      project(mw, o);
      o.r = Math.max(MARK_MIN_PX, (mk.km / 6371) * L.r);
      o.inLens = inLens(o.x, o.y);
    }
    return markScreen;
  }
  const setHover = id => { U.uHover.value = id == null ? -1 : id; };
  /** The point of the Earth under a screen point (css px), or null off the Earth or outside the lens. */
  const ray = new THREE.Vector3(), hit = new THREE.Vector3();
  function pickAt(x, y) {
    if (!inLens(x, y) || U.uFade.value < 0.5) return null;
    ray.set((x / L.w) * 2 - 1, 1 - (y / L.h) * 2, 0.5).unproject(camera).sub(camera.position).normalize();
    const o = camera.position, b = o.dot(ray), c = o.lengthSq() - 1, disc = b * b - c;
    if (disc < 0) return null;
    hit.copy(ray).multiplyScalar(-b - Math.sqrt(disc)).add(o);
    return geoOf(hit);
  }

  // ---------------------------------------------------------------- F1a: the detail, once it has landed
  function setDetailK(k) {
    dotMat.uniforms.uMeshA.value = 1 - k;
    fineMesh.material.uniforms.uMeshA.value = k;
    dotMesh.visible = k < 1;
    U.uOcean.value = k;
  }
  /** Swap in the detail built by detail.mjs: { dots, landTex, coast, lightsW, lightsJ }. fade: cross-fade over DETAIL_S
      (false: at once, for the still frame). The coarse set stays in memory, hidden, so a lost detail is never a hole. */
  function setDetail({ dots, landTex, coast, lightsW, lightsJ }, { fade = true } = {}) {
    const g = quad(new THREE.InstancedBufferGeometry());
    g.setAttribute('aPos', new THREE.InstancedBufferAttribute(dots.pos, 4));
    g.setAttribute('aAux', new THREE.InstancedBufferAttribute(dots.aux, 3));
    g.setAttribute('aGeo', new THREE.InstancedBufferAttribute(dots.geo, 2));
    g.instanceCount = dots.count;
    const tex = (img, wrap) => {
      const t = new THREE.Texture(img);
      Object.assign(t, { flipY: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: wrap, wrapT: THREE.ClampToEdgeWrapping, colorSpace: THREE.NoColorSpace });
      t.needsUpdate = true;
      return t;
    };
    TX.lightsW.value = tex(lightsW, THREE.RepeatWrapping);
    TX.lightsJ.value = tex(lightsJ, THREE.ClampToEdgeWrapping);
    const lt = new THREE.DataTexture(landTex.data, landTex.width, landTex.height, THREE.RGFormat, THREE.UnsignedByteType);
    Object.assign(lt, { flipY: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, unpackAlignment: 1 });
    lt.needsUpdate = true;
    TX.land.value = lt;
    if (coast) {
      const all = new Float32Array(footSegs.length + coast.seg.length);
      all.set(footSegs, 0); all.set(coast.seg, footSegs.length);
      const old = lines.geometry; lines.geometry = lineGeo(all); old.dispose();
      coastCount = coast.count;
    }
    const fineMat = dotMaterial(true);
    fineMat.uniforms.uFarK.value = dots.block ?? 5;
    fineMesh = add(new THREE.Mesh(g, fineMat), 3, { screen: true });
    fineDots = dots;
    detailK = fade ? 0 : 1;
    setDetailK(detailK);
  }
  /** The footprint on screen (css px): centre, radius (the largest distance of its circle from the centre) and alpha. */
  const fpC = new THREE.Vector3(), fpP = new THREE.Vector3(), fpOut = { x: 0, y: 0 }, fp = { x: 0, y: 0, r: 0, alpha: 0, facing: 0 };
  function footprint() {
    fpC.copy(japanV).multiplyScalar(Math.cos(FOOT_DEG * DEG) * 1.0015).applyMatrix4(earth.matrixWorld);
    project(fpC, fpOut); fp.x = fpOut.x; fp.y = fpOut.y;
    let r = 0;
    for (let k = 0; k < FOOT_SEG; k += 6) {
      fpP.set(footSegs[k * 7], footSegs[k * 7 + 1], footSegs[k * 7 + 2]).applyMatrix4(earth.matrixWorld);
      project(fpP, fpOut); r = Math.max(r, Math.hypot(fpOut.x - fp.x, fpOut.y - fp.y));
    }
    fp.r = r;
    nv.copy(japanV).applyMatrix4(earth.matrixWorld).normalize(); camW.copy(camera.position).normalize();
    fp.facing = nv.dot(camW);
    fp.alpha = U.uFootA.value * smoothstep01((fp.facing - 0.1) / 0.3) * smoothstep01((U.uReveal.value - 0.6) / 0.4) * U.uFade.value;
    return fp;
  }
  const smoothstep01 = x => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
  /** Japan's centre on screen and its offset from the disc's centre in disc radii. */
  const jp = { x: 0, y: 0, off: 0 }, jw = new THREE.Vector3();
  function japan() {
    jw.copy(japanV).applyMatrix4(earth.matrixWorld); project(jw, jp);
    jp.off = Math.hypot(jp.x - L.cx, jp.y - L.cy) / Math.max(1, L.r);
    return jp;
  }
  /** Tokyo's point across (css px): its quad's full reach at the current zoom. */
  const tokyoMarkPx = () => 2 * TOKYO_MARK * MARK_Q * U.uMarkK.value * L.r * zoomZ;
  /** Land dots inside the Japan tile's box: the drawn set (coarse until the detail lands). */
  const japanBoxDots = () => (fineDots ? fineDots.boxCount : coarseBox);
  /** How many of the tile's dots facing the viewer fall inside a screen rectangle (css px): the label test. */
  /** The tile's three dot sets as the dot shader opens them now: each set's dot count and its opacity weight
      (far always 1; near and zoom from sp, the css px between neighbouring tile cells). null before the detail lands. */
  let tileCounts = null;
  function tileSets() {
    if (!fineDots) return null;
    if (!tileCounts) {
      tileCounts = { far: 0, near: 0, zoom: 0 };
      for (let i = fineDots.worldCount; i < fineDots.count; i++) {
        const k = fineDots.aux[i * 3];
        if (k > 0.75) tileCounts.zoom++; else if (k > 0.375) tileCounts.near++; else if (k > 0.125) tileCounts.far++;
      }
    }
    const sp = 0.0017453 * U.uObjPx.value / U.uDpr.value;
    return { sp: +sp.toFixed(3), counts: { ...tileCounts }, farK: fineMesh?.material.uniforms.uFarK.value ?? null, far: 1,
      near: +smooth(TILE_NEAR_OPEN[0], TILE_NEAR_OPEN[1], sp).toFixed(3), zoom: +smooth(TILE_ZOOM_OPEN[0], TILE_ZOOM_OPEN[1], sp).toFixed(3) };
  }
  const tw = new THREE.Vector3(), to = { x: 0, y: 0 };
  function tileDotsIn(x0, y0, x1, y1) {
    if (!fineDots) return null;
    let n = 0;
    const p = fineDots.pos;
    for (let i = fineDots.worldCount; i < fineDots.count; i++) {
      tw.set(p[i * 4], p[i * 4 + 1], p[i * 4 + 2]).applyMatrix4(earth.matrixWorld);
      if (tw.dot(camW.copy(camera.position).sub(tw)) <= 0) continue;
      project(tw, to);
      if (to.x >= x0 && to.x <= x1 && to.y >= y0 && to.y <= y1) n++;
    }
    return n;
  }

  return {
    // F1a
    setDetail, footprint, japan, tokyoMarkPx, japanBoxDots, tileDotsIn, relief,
    detail: () => ({ landed: fineMesh !== null, k: +detailK.toFixed(3), dots: fineDots?.count ?? 0, coarse: coarseCount, coast: coastCount, tile: tileSets() }),
    root, camera, baseCamera, meshes, U, count: coarseCount, dotsDrawn: () => (fineDots && detailK >= 1 ? fineDots.count : coarseCount), candidates: N, resize, update, assemble, settle, hide, tokyo, reveal: () => U.uReveal.value, layout: L,
    setCities, citiesSet: () => citiesSet, orbit, earth, sun: sunObj, tokyoIsNight, geoOf, facing, project, projectBase, marks, placeMarks, setHover, turnTo, hold,
    turning: () => (turn ? { lat: turn.lat, lon: turn.lon, landed: turn.landed } : null),
    // step 2: the journey
    drive, setPose, poseFor, setZoom, pick: pickAt, inLens, setFollow,
    /** The view, for the tests: the camera's distance from the Earth's centre (Earth radii), its lens (degrees,
        vertical) and where the Earth's edge falls on screen (css px from the disc's centre: the ring's radius). */
    view: () => { const d = camera.position.z; return { dist: d, fov: camera.fov, limbPx: (Math.tan(Math.asin(1 / d)) / Math.tan(camera.fov * DEG / 2)) * (L.h / 2), ringPx: L.r }; },
    pose: () => ({ spin, tilt }), zoom: () => zoomZ, hero: () => ({ spin: BASE_SPIN, tilt: BASE_TILT }),
    setFade(a) { U.uFade.value = a; }, fade: () => U.uFade.value,
  };
}
