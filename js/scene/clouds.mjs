/* The live clouds (CL2; the owner chose look c of the CL1 trial, 2026-11-28): the cloud field as weather-chart
   contours, two or three thin cyan iso-lines with a faint fill inside the densest band.
   The data is one small JPEG inside images/live/clouds.json (clouds-data.mjs reads it and applies the age rule;
   next.mjs loads it after the first frame, never on the lite tier). Here the picture is drawn up to a fixed 1024 x 512
   working field and blurred, wrapping across the date line so no seam shows there. A known limit: the map is infrared,
   so cold high ground reads as cloud (Tibet). Lowering it by the relief mask was tried and dropped (CL2): the damped
   edges drew contour loops along the mountain ranges, invented weather.
   The layer hangs from the globe's earth group (it turns with the Earth and the cursor follow), is lit by the globe's
   sun (a dim blue-grey night side, never a hole), assembles and hides with uReveal, is seen through the lens and fades
   with the draw set, fades out between zoom 1.6 and 2.6 (the Japan and Tokyo levels are clear) and toward the poles
   from 60 to 72 degrees (the source mirrors its polar data there). On a small Earth (the phone) the outer line goes. */
import * as THREE from 'three';
import { GLSL_GLOBE } from './globe.mjs?v=7';

const FW = 1024, FH = 512;          // the working field (the trial's r4 look was tuned at this size)
const ZOOM_IN = 1.6, ZOOM_OUT = 2.6;
const lin = hex => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };

/* Box blur along rows (wrapping: the date line) or columns (clamped: the poles are faded anyway). */
function boxBlur(src, w, h, r, horizontal) {
  const out = new Float32Array(src.length), n = 2 * r + 1;
  if (horizontal) {
    for (let y = 0; y < h; y++) {
      const row = y * w; let s = 0;
      for (let k = -r; k <= r; k++) s += src[row + ((k + w) % w)];
      for (let x = 0; x < w; x++) {
        out[row + x] = s / n;
        s += src[row + ((x + r + 1) % w)] - src[row + ((x - r + w) % w)];
      }
    }
  } else {
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += src[Math.min(h - 1, Math.max(0, k)) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = s / n;
        s += src[Math.min(h - 1, y + r + 1) * w + x] - src[Math.max(0, y - r) * w + x];
      }
    }
  }
  return out;
}

function decode(jpg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('clouds: the picture did not decode'));
    img.src = `data:image/jpeg;base64,${jpg}`;
  });
}

/** The heavy-blurred field as a one-channel texture, and how long its build held the main thread (ms, after decode). */
async function buildField(jpg) {
  const img = await decode(jpg);
  const t0 = performance.now();
  const cv = document.createElement('canvas'); cv.width = FW; cv.height = FH;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
  cx.drawImage(img, 0, 0, FW, FH);
  const px = cx.getImageData(0, 0, FW, FH).data;
  let f = new Float32Array(FW * FH);
  for (let i = 0; i < FW * FH; i++) f[i] = (px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114) / 255;
  for (let i = 0; i < 3; i++) f = boxBlur(boxBlur(f, FW, FH, 4, true), FW, FH, 4, false);
  const data = new Uint8Array(FW * FH);
  for (let i = 0; i < FW * FH; i++) data[i] = Math.round(Math.min(1, Math.max(0, f[i])) * 255);
  const t = new THREE.DataTexture(data, FW, FH, THREE.RedFormat, THREE.UnsignedByteType);
  Object.assign(t, { flipY: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping, unpackAlignment: 1, colorSpace: THREE.NoColorSpace });
  t.needsUpdate = true;
  return { tex: t, ms: performance.now() - t0 };
}

/** Build the layer from a read clouds file ({ jpg }) and hang it from the globe's earth. Resolves once it is built. */
export async function createClouds({ globe, data }) {
  const { tex, ms: buildMs } = await buildField(data.jpg);
  const G = globe.U;
  const U = {
    uLens: G.uLens, uFade: G.uFade, uExposure: G.uExposure, uReveal: G.uReveal, uSun: G.uSun, uDpr: G.uDpr, uObjPx: G.uObjPx,
    uCloud: { value: tex }, uZoomK: { value: 1 },
    /* the fill lies over the sea only (cold winter ground reads as cloud in the infrared map: a wash over the land would
       be invented weather). The land is the body's own uLand (a 1x1 black placeholder until the detail lands, swapped
       in place), and uOcean is 0 until then, so the fill waits for the detail; the lines never do. */
    uLand: globe.meshes.find(m => m.material.uniforms?.uLand)?.material.uniforms.uLand ?? { value: null }, uOcean: G.uOcean,
    cDay: { value: lin('#5fd8ea') }, cNight: { value: lin('#4a86a6').multiplyScalar(0.8) },
  };
  const m = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      varying vec3 vO; varying vec3 vW; varying vec3 vN;
      void main(){
        vO = position;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * position);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: GLSL_GLOBE + /* glsl */`
      uniform sampler2D uCloud, uLand; uniform vec3 uSun, cDay, cNight; uniform float uReveal, uZoomK, uDpr, uObjPx, uOcean;
      // land 0..1, feathered over about a degree: the centre and four taps a degree away (east-west widened by latitude)
      float landNear(vec2 uv, float lat){
        vec2 e = vec2(1.0 / 360.0 / max(cos(radians(lat)), 0.2), 1.0 / 180.0);
        float s = 2.0 * texture2D(uLand, uv).r
                + texture2D(uLand, uv + vec2(e.x, 0.0)).r + texture2D(uLand, uv - vec2(e.x, 0.0)).r
                + texture2D(uLand, uv + vec2(0.0, e.y)).r + texture2D(uLand, uv - vec2(0.0, e.y)).r;
        return smoothstep(0.30, 0.70, s / 6.0);
      }
      varying vec3 vO; varying vec3 vW; varying vec3 vN;
      void main(){
        vec3 o = normalize(vO);
        float lat = degrees(asin(clamp(o.y, -1.0, 1.0)));
        vec2 uv = vec2(fract(degrees(atan(o.z, -o.x)) / 360.0 + 1.0), (90.0 - lat) / 180.0);
        vec3 nw = normalize(vN);
        float ndv = clamp(dot(nw, normalize(cameraPosition - vW)), 0.0, 1.0);
        // the assembly: the globe's own latitude sweep
        float edge = mix(1.25, -1.6, uReveal);
        float rev = clamp((o.y - edge) / 0.45, 0.0, 1.0); rev = rev * rev * (3.0 - 2.0 * rev);
        float k = (1.0 - smoothstep(60.0, 72.0, abs(lat))) * rev * uReveal * uZoomK * smoothstep(0.02, 0.30, ndv);
        vec3 lc = mix(cNight, cDay, smoothstep(-0.12, 0.30, dot(nw, uSun)));
        float f = texture2D(uCloud, uv).r;
        float w = max(fwidth(f), 1e-5);
        float hw = 0.32 * uDpr;                      // half a line, device px: about 0.65 css px wide
        float big = smoothstep(150.0, 240.0, uObjPx / uDpr);   // a small Earth keeps the two inner lines
        float line = 0.0;
        for (int i = 0; i < 3; i++) {
          if (i == 0 && big < 0.01) continue;
          float L = i == 0 ? 0.64 : (i == 1 ? 0.76 : 0.86);
          float dpx = abs(f - L) / w;
          line = max(line, (1.0 - smoothstep(max(hw - 0.5, 0.0), hw + 0.6, dpx)) * (i == 0 ? 0.35 * big : (i == 1 ? 0.6 : 0.9)));
        }
        float fill = smoothstep(0.84, 0.93, f) * 0.07 * uOcean * (1.0 - landNear(uv, lat));
        gl_FragColor = vec4(toSRGB(tonemap(lc * (line * 0.6 + fill) * k)) * globeK(), 1.0);
      }`,
    transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneMinusDstColorFactor, blendDst: THREE.OneFactor,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.006, 192, 128), m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3.5;        // after the land dots, before the atmosphere
  globe.earth.add(mesh);

  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  return {
    mesh,
    update() {
      U.uZoomK.value = 1 - smooth(ZOOM_IN, ZOOM_OUT, globe.zoom());
      mesh.visible = U.uZoomK.value > 0.002;
    },
    /** lines: how many iso-lines are drawn now (0 when the layer is faded out). */
    lines: () => (!mesh.visible ? 0 : (U.uObjPx.value / U.uDpr.value > 150 ? 3 : 2)),
    zoomK: () => U.uZoomK.value,
    buildMs: +buildMs.toFixed(1),
    /** LV1d: the blurred field itself, so the Japan level's ink globe washes the same clouds in (japan.mjs setClouds)
        without a second fetch or build. Read only: this layer's own drawing is unchanged. */
    field: tex,
  };
}
