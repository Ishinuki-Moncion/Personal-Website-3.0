/* EB2, the aurora (the owner chose look a of the EB1 trial, 2026-11-28): two auroral ovals round the geomagnetic poles.
   On at the Earth on the tiers that load the detail, after the first frame (next.mjs; never on lite; ?aurora=0 turns it
   off for the tab). Its pure parts (where the ovals lie, when they can be seen) are aurora-math.mjs.
   Where: each oval is an offset circle round its geomagnetic pole (north 80.7N 72.7W, south 80.7S 107.3E), its centre
   pushed OVAL_SHIFT toward the night side, so the band sits about 23 degrees from the pole at midnight and 17 at noon;
   a slow fold wanders the line by a degree or so.
   When: only where the ground under it is dark, by the globe's own sun (object space): gone with the sun 1 degree below
   the horizon, full from 8 degrees below it; strongest round local midnight.
   Look: seen from orbit the oval is a soft glow ribbon (on a shell at RIB_R) with the rays as fine streaks across it;
   at the limb, curtains stand from BASE_R to TOP_R Earth radii with their rays, a soft hem and a ragged top, pale
   oxygen green with a faint violet only at the very top. Screen blended like the globe's other large layers (it can
   lift the dark, never push a lit pixel to white); depth tested against the body, so the far side is hidden.
   It hangs from the globe's earth group (it turns with the Earth and the cursor follow), uses the globe's uniforms
   (uReveal, the lens, the draw set's fade, uExposure), and fades out between zoom 1.6 and 2.6. Motion: the rays drift
   along the oval and the curtain breathes (tens of seconds); under reduced motion the clock is not advanced.
   One mesh, one draw call; update() writes three numbers, no allocation. */
import * as THREE from 'three';
import { GLSL_GLOBE } from './globe.mjs?v=6';
import { OVAL_R, OVAL_SHIFT, DARK_FULL, DARK_GONE, poleVec, ovalFrame, ovalPoint, darkness } from './aurora-math.mjs?v=1';

const SEG = 720;                       // segments round each oval
const BASE_R = 1.012, TOP_R = 1.09;    // the curtain's foot and top, Earth radii
/* R6 (the orchestrator's review): seen from above the curtains collapse to a line, so the oval is also a soft glow
   ribbon on a shell at RIB_R, RIB_HALF degrees either side of the line (a 6-8 degree band at half strength), with the
   rays as fine streaks across it (along the magnetic meridians). The curtains carry the height at the limb. */
const RIB_R = 1.02, RIB_HALF = 7.5, RIB_ROWS = 6;
const RIB_GAIN = 0.18;                 // the ribbon's strength (linear light, before the roll-off)
const TOP_MIX = 1.0;                   // how far the curtain's very top goes to the look's top colour
export const ZOOM_IN = 1.6, ZOOM_OUT = 2.6;
const SMALL_K = 1.7, SMALL_PX = 120, FULL_PX = 240;   // the curtain stands SMALL_K times taller on an Earth SMALL_PX css px in radius
const lin = hex => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };
const sinDeg = d => Math.sin(d * Math.PI / 180);

/* The look (EB1 look a): hem (the lower edge), mid and top colours, the overall gain and the desaturation. */
const LOOK = { hem: '#6dffb0', mid: '#9ce8cc', top: '#8e98e6', gain: 1.0, desat: 0.2 };

export function createAurora({ globe, still = false }) {
  const G = globe.U, L = LOOK;
  const geo = new THREE.BufferGeometry();
  {
    /* position: x = angle round the oval (0 = midnight), y = the curtain's 0 foot | 1 top, or the ribbon's -1 poleward
       edge .. 1 equatorward edge; z = which oval (0 north, 1 south) + 2 for the ribbon. One mesh, one draw call. */
    const pos = [], idx = [];
    let base = 0;
    for (let kind = 0; kind < 2; kind++) for (let o = 0; o < 2; o++) {
      const rows = kind === 0 ? 2 : RIB_ROWS;
      for (let i = 0; i <= SEG; i++) {
        const a = (i / SEG) * Math.PI * 2;
        for (let r = 0; r < rows; r++) pos.push(a, kind === 0 ? r : -1 + (2 * r) / (rows - 1), o + 2 * kind);
        if (i < SEG) for (let r = 0; r < rows - 1; r++) { const k = base + i * rows + r, n = k + rows; idx.push(k, k + 1, n, k + 1, n + 1, n); }
      }
      base += (SEG + 1) * rows;
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
  }
  const pole = which => new THREE.Vector3(...poleVec(which));
  const U = {
    uLens: G.uLens, uFade: G.uFade, uExposure: G.uExposure, uReveal: G.uReveal, uDpr: G.uDpr, uObjPx: G.uObjPx,
    uSunO: { value: globe.sun },                       // object space, the globe's own (setSun writes it in place)
    uPoleN: { value: pole(0) }, uPoleS: { value: pole(1) },
    uT: { value: 0 }, uZoomK: { value: 1 },
    cHem: { value: lin(L.hem) }, cMid: { value: lin(L.mid) }, cTop: { value: lin(L.top) }, uGain: { value: L.gain }, uDesat: { value: L.desat },
  };
  const m = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      uniform vec3 uSunO, uPoleN, uPoleS; uniform float uT, uReveal, uObjPx, uDpr;
      varying float vA; varying float vH; varying float vDark; varying float vSide; varying float vEdge; varying float vRev; varying float vSmall;
      varying float vKind; varying float vUp;
      const float DEG = 0.017453293;
      void main(){
        float a = position.x; float h = position.y;
        float kind = position.z > 1.5 ? 1.0 : 0.0;
        float oval = position.z - 2.0 * kind;
        vec3 P = oval < 0.5 ? uPoleN : uPoleS;
        // the night direction at the pole: away from the sun, in the pole's tangent plane
        vec3 e = -uSunO - dot(-uSunO, P) * P;
        e = dot(e, e) > 1e-6 ? normalize(e) : normalize(cross(P, vec3(0.0, 1.0, 0.0)));
        vec3 C = normalize(P * cos(${OVAL_SHIFT.toFixed(1)} * DEG) + e * sin(${OVAL_SHIFT.toFixed(1)} * DEG));
        vec3 t1 = normalize(e - dot(e, C) * C), t2 = cross(C, t1);
        // a slow fold along the line (degrees)
        float fold = 1.1 * sin(a * 5.0 + 0.7 + uT * 0.011) + 0.55 * sin(a * 11.0 + 2.1 - uT * 0.017) + 0.45 * sin(a * 23.0 + 4.0 + uT * 0.029) + 0.22 * sin(a * 47.0 + 1.0 - uT * 0.041);
        float th = (${OVAL_R.toFixed(1)} + fold + kind * h * ${RIB_HALF.toFixed(1)}) * DEG;
        vec3 g = normalize(C * cos(th) + (t1 * cos(a) + t2 * sin(a)) * sin(th));
        vKind = kind;
        /* a small Earth (the phone) stands its curtain taller, so it still reads: up to SMALL_K times at a disc of
           SMALL_PX css px or less, as drawn at ${FULL_PX} and over */
        float rcss = uObjPx / max(uDpr, 1.0);
        float tall = mix(1.0, ${SMALL_K.toFixed(2)}, 1.0 - smoothstep(${SMALL_PX.toFixed(1)}, ${FULL_PX.toFixed(1)}, rcss));
        vec3 p = kind > 0.5 ? g * ${RIB_R} : g * (${BASE_R} + (${TOP_R} - ${BASE_R}) * tall * h);
        vSmall = tall;
        // dark sky over the foot: gone with the sun DARK_GONE degrees from the horizon, full from DARK_FULL
        float ndl = dot(g, normalize(uSunO));
        vDark = 1.0 - smoothstep(${sinDeg(DARK_FULL).toFixed(5)}, ${sinDeg(DARK_GONE).toFixed(5)}, ndl);   // aurora-math darkness()
        vSide = 0.55 + 0.45 * (0.5 + 0.5 * cos(a));    // strongest round local midnight
        vA = a; vH = h;
        // the curtain seen edge-on carries a longer path of light: a little brighter, never a line
        vec3 tg = normalize(cross(g, t1 * -sin(a) + t2 * cos(a)));
        vec3 w = (modelMatrix * vec4(p, 1.0)).xyz;
        vec3 nw = normalize(mat3(modelMatrix) * tg);
        vEdge = 1.0 - abs(dot(nw, normalize(cameraPosition - w)));
        // how straight down the viewer looks on this stretch of the oval (1 overhead, 0 at the limb)
        vUp = abs(dot(normalize(mat3(modelMatrix) * g), normalize(cameraPosition - w)));
        // the globe's assembly sweep (north to south)
        float edge = mix(1.25, -1.6, uReveal);
        vRev = smoothstep(0.0, 1.0, clamp((g.y - edge) / 0.45, 0.0, 1.0));
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: GLSL_GLOBE + /* glsl */`
      uniform vec3 cHem, cMid, cTop; uniform float uT, uReveal, uZoomK, uGain, uDpr, uDesat;
      varying float vA; varying float vH; varying float vDark; varying float vSide; varying float vEdge; varying float vRev; varying float vSmall;
      varying float vKind; varying float vUp;
      const float TAU = 6.2831853;
      float hash(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
      // periodic value noise: x in cells, period n cells
      float pnoise(float x, float n){
        float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(hash(mod(i, n)), hash(mod(i + 1.0, n)), f);
      }
      void main(){
        if (vDark < 0.002) discard;
        float s = vA / TAU;                               // 0..1 round the oval
        // rays: fine noise along the oval, drifting; the finer octave goes as it nears a pixel
        float R1 = 180.0, R2 = 430.0;
        float x1 = s * R1 + uT * 0.06, x2 = s * R2 - uT * 0.11;
        float w2 = 1.0 - smoothstep(0.25, 0.6, fwidth(x2));
        float w1 = 1.0 - smoothstep(0.35, 0.8, fwidth(x1));
        float r1 = pnoise(x1, R1), r2 = pnoise(x2, R2);
        // a diffuse sheet under the rays: the curtain is a band of light, the rays its texture
        float rays = 0.18 + 0.82 * mix(0.45, pow(r1, 2.6) * 2.2, w1) * mix(1.0, 0.4 + 1.2 * r2, w2);
        // each ray stops at its own length: a ragged top (curtain) and a ragged poleward edge (ribbon)
        float topH = 0.35 + 0.65 * pnoise(s * 140.0 + uT * 0.03, 140.0) * (0.5 + 0.5 * pnoise(s * 30.0 - uT * 0.012, 30.0));
        // brightness wandering along the oval, and the slow breath
        float big = pnoise(s * 16.0 + uT * 0.009, 16.0) * pnoise(s * 6.0 - uT * 0.005 + 3.0, 6.0);
        float along = 0.2 + 1.6 * smoothstep(0.08, 0.6, big);
        float breath = 0.78 + 0.14 * sin(uT * TAU / 27.0) + 0.08 * sin(uT * TAU / 41.0 + 1.3);
        float smallK = mix(1.0, 1.35, (vSmall - 1.0) / ${(SMALL_K - 1).toFixed(2)});
        vec3 col; float k;
        if (vKind > 0.5) {
          /* the ribbon, seen from above: v = -1 poleward .. 1 equatorward. A soft band (about 7 degrees across at
             half strength), a little brighter toward its equator-side hem; the rays are streaks across it, some
             reaching further poleward than others. Weaker where the curtains stand at the limb. */
          float v = vH;
          float band = exp(-pow(v / 0.5, 2.0)) + 0.3 * exp(-pow((v - 0.25) / 0.3, 2.0));
          band *= 1.0 - smoothstep(0.6, 1.0, abs(v));
          float reach = 1.0 - smoothstep(-0.05 + 0.6 * topH, 0.2 + 0.6 * topH, -v);   // a streak's poleward end
          float streak = 0.4 + 0.6 * rays * mix(0.55, 1.0, reach);
          col = mix(cHem, cMid, smoothstep(0.1, -0.7, v));
          k = band * streak * mix(0.45, 1.0, smoothstep(0.15, 0.6, vUp)) * ${RIB_GAIN.toFixed(2)};
        } else {
          float vert = smoothstep(0.0, 0.16, vH) * (0.3 + 0.7 * exp(-vH * 2.0) + 0.8 * exp(-pow((vH - 0.12) / 0.07, 2.0)));   // no crisp foot: the ribbon carries the ground line
          vert *= 1.0 - smoothstep(topH * 0.15, topH + 0.1, vH);
          col = mix(cHem, cMid, smoothstep(0.05, 0.45, vH));
          col = mix(col, cTop, smoothstep(0.6, 1.0, vH) * ${TOP_MIX.toFixed(2)});
          // the curtains carry the height where it is seen (the limb); overhead they keep an eighth, the living edge
          k = rays * vert * (0.8 + 0.5 * vEdge) * (1.0 - 0.88 * smoothstep(0.35, 0.85, vUp)) * 1.15;
        }
        col = mix(col, vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))), uDesat);   // kept low in saturation for this scene
        k *= vDark * vSide * along * breath * uGain;
        vec3 c = col * k * smallK * uReveal * vRev * uZoomK;
        gl_FragColor = vec4(toSRGB(tonemap(c)) * globeK(), 1.0);
      }`,
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneMinusDstColorFactor, blendDst: THREE.OneFactor,
  });
  const mesh = new THREE.Mesh(geo, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 4.5;          // after the atmosphere, before the markers and the lines
  globe.earth.add(mesh);

  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  /* For the read-out (never per frame): how much of the oval the viewer can see is under a dark sky, 0..1. The two
     ovals' centre lines, sampled; a sample counts where its ground faces the camera. */
  const N = 180, wp = new THREE.Vector3(), cam = new THREE.Vector3();
  function dark() {
    let seen = 0, sum = 0;
    const s = [globe.sun.x, globe.sun.y, globe.sun.z];
    globe.camera.getWorldPosition(cam);
    for (let o = 0; o < 2; o++) {
      const f = ovalFrame(poleVec(o), s);
      for (let i = 0; i < N; i++) {
        const g = ovalPoint(f, (i / N) * Math.PI * 2);
        wp.set(g[0], g[1], g[2]).applyMatrix4(globe.earth.matrixWorld);
        const c = globe.earth.getWorldPosition(new THREE.Vector3());
        const n = wp.clone().sub(c).normalize();
        if (n.dot(cam.clone().sub(wp)) <= 0) continue;
        seen++; sum += darkness(g[0] * s[0] + g[1] * s[1] + g[2] * s[2]);
      }
    }
    return seen ? sum / seen : 0;
  }
  return {
    mesh,
    update(dt) {
      if (!still) U.uT.value += dt;
      U.uZoomK.value = 1 - smooth(ZOOM_IN, ZOOM_OUT, globe.zoom());
      mesh.visible = U.uZoomK.value > 0.002;
    },
    debug: () => ({ dark: +dark().toFixed(3), zoomK: +U.uZoomK.value.toFixed(3), visible: mesh.visible, t: +U.uT.value.toFixed(2) }),
  };
}
