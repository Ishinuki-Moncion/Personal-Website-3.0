/* The next scene's weather, ported from docs/rebuild/prototypes/rain/ as composed in prototypes/hero/:
   one full-screen backdrop (night sky, wet floor with the globe's reflection broken into strands, the
   ripple field, the live floor grid, the projector pool and beam, the ring's rim and halo), then
   ripples, splashes and streaks. Closed-form: positions are computed in the vertex shaders from a
   seed and the clock; every frame only writes uniforms.

   World: metres, camera at the origin looking down +z, ground plane at y = -CAM_H. Projection is a
   pinhole with a vertical lens shift, so the horizon is a level line without tilting the verticals:
   ndc = (x / (z·t·aspect), y / (z·t) + shift).

   F2 (design 14.5, the water): puddles are fewer and larger with clear edges, the drawn ripple rings are quieter,
   and the streaks are thin and tapered and catch the disc, the ring and the beam.
   The floor's reflection stays computed (globeRefl: the globe's rim and Tokyo's spot). A true mirror was built in
   F2 (globe.root drawn into one target and sampled here) and cut in its review: the globe floats well above the
   floor, so its mirror image falls almost wholly below the screen, and what remained on screen was the reflection
   of the Earth's dark underside. It cost 0.4 to 0.7 ms a frame, nine draw calls and 3.7 KB for a darker puddle.

   The ring (decision D16, "Ring, then Earth"): uSolid is how much of the disc is the opaque dark body
   of the rain study (1 while the page arrives as the pure ring, 0 once the hologram Earth is inside).
   The backdrop paints that body itself, so in one context nothing drawn later has to cover anything. */
import * as THREE from 'three';

const CAM_H = 1.6;                                  // camera height above the wet ground (m)
const TAN = Math.tan((50 / 2) * Math.PI / 180);     // 50 degree vertical field of view
const Z0 = 2, Z1 = 40;                              // rain volume depth
const FOCAL = 12;                                   // focal plane (m)
// AWAY_GLOW and AWAY_RAIN, today's room light, are GLSL constants in COMMON (7.0 and 0.13); lightDebug reports them
const AWAY_GLOW = 7.0, AWAY_RAIN = 0.13;
/* TRIAL T2, the middle sections' light, three variants the owner chooses from (?light=a|b|c, next.mjs). Hues from his
   photographs of Tokyo Bay at dusk (docs/rebuild/references/owner-bay/, patch averages); the strengths are the
   scene's own, set low so the copy wins: sky/band are linear multipliers of the colour, floor how much of it the wet
   floor mirrors, rain how much the rain and the ripple rings catch. bandW: the afterglow's height (NDC). */
export const LIGHTS = {
  a: { name: 'teal dusk', sky: '#6da3a8', band: '#d99c8a', skyK: 0.035, bandK: 0.2, bandW: 0.07, floorK: 1.3, rainK: 0.05, veil: 2.2 },
  b: { name: 'ember', sky: '#bc6d52', band: '#ef7c3e', skyK: 0.012, bandK: 0.21, bandW: 0.07, floorK: 1.3, rainK: 0.05, veil: 2.2 },
  c: { name: 'cyan', sky: '#2f8fa8', band: '#5cc9de', skyK: 0.03, bandK: 0.18, bandW: 0.07, floorK: 1.3, rainK: 0.05, veil: 0, dim: 1.0, feather: false },
};
/* With a variant lit, the floor under the copy is lit too and the veil has more to take away: it is stronger (veil,
   a factor on the section's veil, capped at 1) and its edge is a wide smoothstep ramp (fourteen cells, 112 css px,
   against today's four): neighbouring boxes on a row merge into one soft dimming and the light gives way round the
   copy instead of a dark card being cut out of it. */
export const LIGHT_FEATHER = [0.013, 0.049, 0.104, 0.175, 0.259, 0.352, 0.45, 0.55, 0.648, 0.741, 0.825, 0.896, 0.951, 0.987];

const COMMON = /* glsl */`
precision highp float;
uniform vec2 uRes; uniform float uTan, uAspect, uShift, uCamH;
uniform vec3 uGlobe; uniform float uGlobeR; uniform vec2 uGlobeS; uniform float uGlobeSR;
uniform vec2 uMirS; uniform vec3 uTokyo; uniform vec2 uTokyoS; uniform vec2 uTokyoQ; uniform float uMirTokyoX;
uniform float uTime, uGround, uHaze, uDropK, uReflK, uSolid, uGrid, uPool, uTokyoK;
// Step L2: the stage's strength (next.mjs), 0..1: the disc's own light on the floor and the rain follows it; the sky, the
// rain and the floor themselves stay
uniform float uStage;
// TRIAL, the open layout: uAway, 0..1, is how far the Earth has gone (next.mjs). With its light gone the room keeps a
// light of its own: the haze along the whole horizon comes up, the wet floor mirrors it, and the rain catches it.
uniform float uAway;
const float AWAY_GLOW = 7.0, AWAY_RAIN = 0.13;
uniform vec2 uPoolC; uniform float uBeam, uBeamK, uRim, uEdge; uniform vec3 uRimMode; uniform vec3 uSunQ;
// The floor moves with the camera (next.mjs, motion): uCam = lean (m, the camera swung sideways round the globe), travel (m, the
// ground gone by), scale (the ground seen from lower down); uCamV = the travel's speed (m/s), the same for the rain
uniform vec3 uCam; uniform vec2 uCamV;
// the projector cone: vertical, from the pool on the floor (radius 0.1 R) to the globe's equator (radius R)
float coneK(vec3 p, out float fy) {
  fy = (p.y + uCamH) / max(uGlobe.y + uCamH, 0.1);
  float rad = uGlobeR * mix(0.10, 1.0, clamp(fy, 0.0, 1.0));
  float hd = length(p.xz - uGlobe.xz);
  return (1.0 - smoothstep(rad * 0.72, rad * 1.04, hd)) * step(0.0, fy) * (1.0 - smoothstep(0.95, 1.1, fy));
}
// tokens, linearised: --signal #39f0ff, --signal-hot #b4f7ff, --event #ff9e2c, --event-hot #ffd9a0
const vec3 CYAN  = vec3(0.0395, 0.8714, 1.0);
const vec3 HOT   = vec3(0.4564, 0.9301, 1.0);
const vec3 AMBER = vec3(1.0, 0.3419, 0.0252);
const vec3 AMBERHOT = vec3(1.0, 0.6939, 0.3515);
const vec3 VOID_D = vec3(0.0196, 0.0235, 0.0392);  // --void #05060a, display space
const vec3 BODY_D = vec3(0.031, 0.039, 0.059);     // the ring's dark disc (--ink-2), display space

vec2 proj(vec3 p) { return vec2((p.x - uCam.x * (1.0 - p.z / max(uGlobe.z, 0.1))) / (p.z * uTan * uAspect), p.y / (p.z * uTan) + uShift); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec4 hash42(vec2 p) { vec4 p4 = fract(vec4(p.xyxy) * vec4(0.1031, 0.1030, 0.0973, 0.1099)); p4 += dot(p4, p4.wzxy + 33.33); return fract((p4.xxyz + p4.yzzw) * p4.zywx); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
vec3 encode(vec3 c) {               // roll hot values off by the brightest channel (hue kept: no neutral white), then sRGB
  c = max(c, 0.0); float m = max(max(c.r, c.g), c.b);
  c = m > 1e-6 ? c * ((1.0 - exp(-m)) / m) : c;
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
// screen distance from the disc centre in disc radii
float discDist(vec2 nd) { return length(vec2((nd.x - uGlobeS.x) * uAspect, nd.y - uGlobeS.y)) / uGlobeSR; }
// TRIAL T2, the middle sections' light (?light=a|b|c, LIGHTS below): with the Earth away, a dusk of the owner's Tokyo Bay
// photographs: a sky colour that thins upward and a low afterglow band at the horizon, both mirrored by the wet floor.
// uLit is 0 with no variant chosen: every term of it is then multiplied out and the scene is today's.
uniform float uLit, uBandW; uniform vec3 uSkyC, uBandC; uniform vec4 uLightK;   // uLightK: sky, band, floor, rain
vec3 duskSky(float h, float x) {
  h = max(h, 0.0);
  float uneven = 0.65 + 0.7 * vnoise(vec2(x * 0.8 + 2.3, 0.5));   // the afterglow is uneven along the horizon (fixed)
  vec3 sky = uSkyC * uLightK.x * (0.3 + 0.7 * exp(-h * 2.0));
  vec3 band = uBandC * uLightK.y * uneven * (0.7 * exp(-h / uBandW) + 0.4 * exp(-h / (uBandW * 3.5)));
  return sky + band;
}
`;
const FRAG_OUT = 'layout(location = 0) out highp vec4 fragColor;\n';

export function createWeather({ streaks: nStreaks, ripples: nRipples, beam, still }) {
  const U = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTan: { value: TAN }, uAspect: { value: 1 }, uShift: { value: -0.24 }, uCamH: { value: CAM_H },
    uGlobe: { value: new THREE.Vector3(0, 0, 14) }, uGlobeR: { value: 3 },
    uGlobeS: { value: new THREE.Vector2(0.3, 0.1) }, uGlobeSR: { value: 0.56 },
    uMirS: { value: new THREE.Vector2(0.3, -1.1) },
    uTokyo: { value: new THREE.Vector3() }, uTokyoS: { value: new THREE.Vector2() },
    uTokyoQ: { value: new THREE.Vector2(-0.42, 0.46) }, uMirTokyoX: { value: 0 },
    uTime: { value: 0 }, uGround: { value: 1 }, uHaze: { value: 1 }, uDropK: { value: 1 },
    uSpeed: { value: 1.25 }, uShutter: { value: still ? 1 / 250 : 1 / 50 }, uWind: { value: 0.2 },
    uCam: { value: new THREE.Vector3(0, 0, 1) }, uCamV: { value: new THREE.Vector2(0, 0) },
    uZN: { value: 4.5 }, uFocal: { value: FOCAL }, uAperture: { value: 0.1 },
    uReflK: { value: 1 },
    uStage: { value: 1 }, uAway: { value: 0 },           // step L2: the stage's strength (the disc and everything of it)
    uMaxW: { value: 1e4 },          // widest streak, device px (heavy rain: soft, wide near drops)
    uSolid: { value: 1 },           // the ring's opaque disc: 1 = pure ring (arrival), 0 = the hologram Earth inside
    uGrid: { value: 1 }, uPool: { value: 1 }, uTokyoK: { value: 1 },
    uPoolC: { value: new THREE.Vector2(0, 14) }, uBeam: { value: beam ? 1 : 0 }, uBeamK: { value: 1 },
    uRim: { value: 0 },             // the study's ring (hot core + falloff + halo) round the disc, strength
    uSunQ: { value: new THREE.Vector3(1, 0, 0) },   // F1a: the sun's direction on screen (x, y, unit) and how much of it lies across the view (z)
    uRimMode: { value: new THREE.Vector3(1, 1, 0) },   // x: the inner limb light, y: the amber Tokyo point, z: ring pushed out (device px)
    uEdge: { value: 1 },            // the floor's mirrored halo falls off past the ring's sides
    // T2 (trial): the middle sections' light; uLit 0 = none chosen, today's scene exactly
    uLit: { value: 0 }, uBandW: { value: 0.05 }, uSkyC: { value: new THREE.Vector3() }, uBandC: { value: new THREE.Vector3() },
    uLightK: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
  const meshes = [];
  const add = (geo, mat, order) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; meshes.push(m); return m; };

  // ---------------------------------------------------------------- backdrop: sky, wet ground, beam, ring
  const backdropMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, uniforms: U, depthTest: false, depthWrite: false,
    vertexShader: /* glsl */`
      out vec2 vNdc;
      void main() { vNdc = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: COMMON + FRAG_OUT + /* glsl */`
      in vec2 vNdc;
      // the globe's light blurred by a rough mirror: w = rim width in disc radii
      vec3 globeRefl(vec2 q, float w) {
        float r = length(q);
        float d = r - 1.0;
        float rim = exp(-d * d / (w * w));
        vec3 c = mix(CYAN, HOT, 0.35 * rim) * rim * 1.25;
        float o = max(d, 0.0);
        float side = mix(1.0, exp(-max(abs(q.x) - 1.15, 0.0) * 3.0), uEdge);
        c += CYAN * (0.06 * exp(-o * 5.0) + 0.015 * exp(-o * 1.4)) * uHaze * side;
        vec2 tq = vec2(uTokyoQ.x, -uTokyoQ.y);
        float dt = length((q - tq) * vec2(1.0, 0.9));
        c += AMBER * (exp(-dt * dt / (w * w * 0.35)) * 1.5 + exp(-dt * 7.0) * 0.18) * uTokyoK;
        return c;
      }
      // procedural ripple normals (xz), two layers of cells, one impact per cell per ~1.1 s
      vec2 rippleField(vec2 p, float t) {
        vec2 acc = vec2(0.0);
        for (int l = 0; l < 2; l++) {
          float s = l == 0 ? 1.6 : 2.7;
          vec2 pp = p * s + float(l) * vec2(0.37, 0.61);
          vec2 cell = floor(pp); vec2 f = fract(pp);
          vec4 h = hash42(cell + float(l) * 17.0);
          float per = 0.85 + 0.5 * h.w;
          float a = fract(t / per + h.z);
          vec2 dv = f - (0.25 + 0.5 * h.xy);
          float d = length(dv);
          float x = d - a * 0.27;
          float wv = sin(x * 58.0) * exp(-x * x * 260.0) * (1.0 - a) * (1.0 - a);
          acc += dv / (d + 1e-3) * wv;
        }
        return acc;
      }
      void main() {
        vec2 n = vNdc;
        float dyH = n.y - uShift;
        float gx = abs((n.x - uGlobeS.x) * uAspect);
        vec3 hCol = mix(vec3(0.16, 0.36, 0.5), CYAN, 0.45);
        float under = 0.3 + 1.3 * exp(-gx * 1.5 / max(uGlobeSR, 0.2));
        under = mix(under, 0.85, uAway);            // TRIAL: away, the glow runs the whole horizon, not under the globe
        float awayK = 1.0 + AWAY_GLOW * uAway;
        vec3 col;
        if (dyH >= 0.0 || uGround < 0.5) {
          // night sky: void (the base below), lifted a touch toward the horizon (city haze)
          col = hCol * 0.0007 * exp(-max(dyH, 0.0) * 2.5) * uHaze * awayK;
          col += hCol * (exp(-abs(dyH) * 26.0) * 0.005 + exp(-abs(dyH) * 120.0) * 0.012) * under * uHaze * uGround * awayK;
          if (uLit * uAway > 0.0) col += duskSky(dyH, n.x * uAspect) * uAway * uLit;   // T2: the dusk over the horizon
        } else {
          // ---- wet ground
          float z = uCamH / (-dyH * uTan);
          vec3 G = vec3(n.x * z * uTan * uAspect, -uCamH, z);
          G.x += uCam.x * (1.0 - z / max(uGlobe.z, 0.1));   // the lean: the camera swings round the globe
          vec2 gp = G.xz;
          vec2 fw = fwidth(gp);
          // the ground itself: travelled over (y), and seen from lower down (a scale about the globe's foot)
          vec2 gq = (gp - uPoolC) * uCam.z + uPoolC + vec2(0.0, uCam.y);
          float detail = clamp(1.4 - max(fw.x, fw.y) * 9.0, 0.0, 1.0);   // drop detail where a pixel covers too much ground
          // F2: puddles fewer and larger, with clear edges (anti-aliased over about a pixel at any distance)
          float pn = vnoise(gq * vec2(0.25, 0.15) + 3.1) * 0.62 + vnoise(gq * vec2(0.8, 0.4) + 7.7) * 0.38;
          float pfw = max(fwidth(pn), 0.003);
          float pud = smoothstep(0.575 - pfw, 0.575 + pfw, pn);
          float rimL = max(1.0 - abs(pn - 0.575) / (pfw * 1.6), 0.0) * detail;   // the thin bright line at a puddle's edge
          vec2 rn = rippleField(gq, uTime) * (0.6 + 0.4 * uDropK) * detail;
          float mr = (vnoise(gq * 26.0) - 0.5) * detail + (vnoise(gq * 7.0) - 0.5) * 0.6;
          float wob = vnoise(vec2(gq.y * 2.2, gq.x * 0.6)) - 0.5;
          // mirrored light: a sharp mirror in the puddles, long vertical streaks on the damp ground between
          float stretch = mix(8.0, 1.25, pud);
          vec2 q = vec2((n.x - uMirS.x) * uAspect, -(n.y - uMirS.y)) / uGlobeSR;
          q.x += (wob * 0.11 + mr * 0.05) * (1.0 - 0.75 * pud) + rn.x * mix(0.25, 0.5, pud);
          q.y = q.y / stretch + rn.y * mix(0.05, 0.12, pud);
          float w = mix(0.17, 0.045, pud);
          vec3 refl = globeRefl(q, w);
          float strands = mix(0.25 + 1.35 * vnoise(vec2(G.x * 6.5 + wob * 2.0, log(z) * 2.6)), 1.0, pud);
          strands *= 0.75 + 0.5 * vnoise(vec2(G.x * 1.3, log(z) * 9.0));   // horizontal breaks
          float cosT = uCamH / length(G);
          float F = 0.02 + 0.98 * pow(1.0 - cosT, 5.0);
          float refK = (0.18 + 1.05 * F) * mix(0.5, 1.15, pud) * strands * uReflK;
          // the tarmac itself: near black, micro texture, a pool of diffuse light under the disc
          vec3 alb = vec3(0.0011, 0.0013, 0.0017) * (1.0 + mr * 0.8) * (1.0 - 0.5 * pud);
          vec3 toL = uGlobe - G; float dl2 = dot(toL, toL);
          vec3 pool = CYAN * 0.075 * (uGlobeR * uGlobeR / dl2) * max(toL.y / sqrt(dl2), 0.0) * (1.0 - 0.6 * pud) * (1.0 - 0.8 * uPool) * uStage;
          // glints: grains of wet aggregate catching the smear
          vec2 gc = floor(gq * 55.0);
          float glint = step(0.994, hash12(gc)) * detail * (0.5 + 0.5 * sin(uTime * 7.0 + hash12(gc + 3.0) * 40.0));
          vec3 wide = globeRefl(vec2(q.x * 0.55, q.y), 0.6);
          col = alb + pool + refl * refK * (1.0 + 0.8 * rimL) + wide * glint * 0.8 * (1.0 - pud) * uStage;
          // ripple crests in puddles pick up the light column
          col += mix(CYAN, HOT, 0.3) * length(rn) * pud * 0.06 * under * uStage;
          // the wet sheen: the whole surface mirrors the lit haze over the horizon
          col += hCol * 0.0025 * F * under * mix(0.45, 1.0, pud) * strands * uHaze * (1.0 - 0.5 * uPool) * awayK;
          col += hCol * glint * 0.03 * uAway * (1.0 - pud);   // TRIAL: the damp ground still glints
          // the projector pool: a hot elliptical pool of light on the wet ground right under the globe
          if (uPool > 0.5) {
            vec2 pd = (gp - uPoolC) / uGlobeR + rn * 0.05 + vec2(mr, wob) * 0.04;
            float d2 = dot(pd, pd);
            float poolK = (1.0 - 0.35 * pud) * (0.75 + 0.5 * strands);
            col += (CYAN * (1.25 * exp(-d2 / 0.035) + 0.30 * exp(-d2 / 0.28) + 0.05 * exp(-d2 / mix(1.6, 0.6, uEdge))) + HOT * 0.55 * exp(-d2 / 0.008)) * poolK * uStage;
          }
          // the live site's neon floor grid, painted on the wet ground and broken by the ripples
          if (uGrid > 0.5) {
            vec2 gg = vec2(gq.x, gq.y) / 0.52 + rn * 0.22 + vec2(mr, 0.0) * 0.03;
            vec2 fwg = fwidth(gg);
            vec2 dl = abs(fract(gg - 0.5) - 0.5) / max(fwg, 1e-4);
            float ln = max((1.0 - smoothstep(0.4, 1.2, dl.x)) * smoothstep(0.012, 0.05, 1.0 / max(fwg.x, 1e-4) * 0.004),
                           (1.0 - smoothstep(0.4, 1.2, dl.y)) * smoothstep(2.5, 9.0, 1.0 / max(fwg.y, 1e-4)));
            float gk = ln * exp(-z / 22.0) * (1.0 - 0.45 * pud) * (0.8 + 0.4 * strands);
            col += mix(CYAN, HOT, 0.15) * gk * 0.020;
          }
          // distance fog + horizon glow; the far floor returns to the black floor
          float fogK = 1.0 - exp(-z / 24.0);
          vec3 fogC = hCol * 0.0035 * under * uHaze * awayK;
          col = mix(col, fogC, fogK * 0.9);
          col += hCol * (exp(-abs(dyH) * 26.0) * 0.005 + exp(-abs(dyH) * 120.0) * 0.012) * under * uHaze * awayK;
          // T2: the wet floor mirrors the dusk. A point hm below the horizon shows the sky hm above it; the damp ground
          // smears that into long vertical streaks (sharper in the puddles), the ripples bend it and the water's own
          // swell breaks it into dashes. Drawn after the fog: the far water is where the afterglow lies brightest.
          if (uLit * uAway > 0.0) {
            float hm = -dyH;
            float sB = mix(6.0, 1.5, pud);
            float hq = max(hm + rn.y * mix(0.03, 0.08, pud) + (wob * 0.025 + mr * 0.012) * (1.0 - pud), 0.0) / sB;
            float xq = n.x * uAspect + rn.x * 0.35 + wob * 0.18;
            float brk = smoothstep(0.35, 0.75, vnoise(vec2(G.x * 2.2 + wob * 1.5, z * 1.6)));
            float ln0 = vnoise(vec2(G.x * 4.5 + wob * 2.0, log(z) * 2.2));
            float lane = mix(0.15 + 1.4 * ln0 * ln0, 1.0, 0.6 * pud);
            float rk = (0.06 + 0.95 * F) * mix(0.55, 1.25, pud) * mix(0.2, 1.0, brk) * lane;
            rk *= mix(0.5, 1.0, smoothstep(2.0, 10.0, z));   // the near water stays dark (bay-3), its puddles only tinted
            rk *= 1.0 - 0.45 * exp(-hm * 30.0);               // a darker line of far water under the horizon, as in the photographs
            col += duskSky(hq, xq) * rk * uLightK.z * uAway * uLit;
            col += uBandC * uLightK.y * length(rn) * pud * 0.3 * uLightK.z * uAway * uLit;   // ripple crests pick up the band
          }
        }
        // the beam body, seen from the front: evaluated on the vertical plane through the globe's centre,
        // thickest on its axis, with a faint low-frequency mist drifting upward
        if (uBeam > 0.5) {
          vec3 Pb = vec3(n.x * uGlobe.z * uTan * uAspect, (n.y - uShift) * uGlobe.z * uTan, uGlobe.z);
          float fy; float k = coneK(Pb, fy);
          float rad = uGlobeR * mix(0.10, 1.0, clamp(fy, 0.0, 1.0));
          float x = clamp(length(Pb.xz - uGlobe.xz) / rad, 0.0, 1.0);
          float thick = sqrt(max(1.0 - x * x, 0.0));
          float mist = vnoise(vec2(Pb.x * 0.9, Pb.y * 0.7 - uTime * 0.22)) * 0.6 + vnoise(vec2(Pb.x * 2.3 + 4.0, Pb.y * 1.6 - uTime * 0.41)) * 0.4;
          float base = mix(1.0, 0.35, clamp(fy, 0.0, 1.0));
          col += CYAN * k * thick * base * (0.005 + 0.014 * mist * mist) * uBeamK;
        }
        // the disc: while the page arrives as the pure ring it is the study's opaque dark body;
        // once the Earth is inside, the hologram is drawn over the open sky
        vec2 q = vec2((n.x - uGlobeS.x) * uAspect, n.y - uGlobeS.y) / uGlobeSR;
        float pxR = uGlobeSR * uRes.y * 0.5;           // pixels per disc radius
        float r = length(q);
        float cover = 1.0 - smoothstep(-0.8, 0.8, (r - 1.0) * pxR);
        col *= 1.0 - cover * uSolid;
        // the ring round the disc: a hot core, a falloff and a wide halo. uRimMode.x adds the study's inner limb
        // light (the pure ring), uRimMode.y its amber Tokyo point; uRimMode.z pushes the ring just off the limb with
        // a steeper inside edge once the Earth is inside, so it never lands on the amber limb dots (cyan over
        // amber would add up to white)
        float dpx = (r - 1.0) * pxR - uRimMode.z;
        float side = 0.72 + 0.28 * dot(q / max(r, 1e-4), normalize(vec2(0.55, 0.83)));
        vec3 rc = mix(CYAN, HOT, 0.85) * exp(-dpx * dpx / 1.4) * 3.2;
        rc += CYAN * (dpx > 0.0 ? exp(-dpx / 5.0) : exp(dpx / mix(0.9, 2.2, uRimMode.x))) * 0.9;
        float out1 = max(r - 1.0, 0.0);
        rc += CYAN * (0.10 * exp(-out1 * 8.0) + 0.016 * exp(-out1 * 2.2) + 0.002 * exp(-out1 * 0.8)) * uHaze * step(1.0, r);
        rc += CYAN * 0.10 * pow(clamp(r, 0.0, 1.0), 14.0) * cover * uRimMode.x;
        // F1a, the sun: the ring brightens on the sun's side by at most a quarter, and is never dimmer than before anywhere
        float sunLift = 1.0 + 0.25 * max(0.0, dot(q / max(r, 1e-4), uSunQ.xy)) * uSunQ.z;
        col += rc * side * uRim * sunLift;
        float dt = length(q - uTokyoQ) * pxR;
        col += (AMBERHOT * exp(-dt * dt / 2.6) * 4.0 + AMBER * (exp(-dt / 6.0) * 0.45 + exp(-dt / 30.0) * 0.035 * uHaze)) * uTokyoK * uRimMode.y;
        // the study screen-blended this layer over a canvas holding the void (or, inside the pure ring, the
        // ring's dark body); the same blend, in display space, in one pass
        vec3 outc = encode(col);
        vec3 base = mix(VOID_D, BODY_D, cover * uSolid);
        outc += base * (1.0 - outc);
        outc += (hash12(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;   // dither the gradients
        fragColor = vec4(outc, 1.0);
      }`,
  });
  add(new THREE.PlaneGeometry(2, 2), backdropMat, 0);

  // ---------------------------------------------------------------- instancing helpers
  function seeds(count, salt) {
    // deterministic, so every reload and every still frame is the same photograph
    let s = 0x9e3779b9 ^ salt;
    const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; };
    const a = new Float32Array(Math.max(1, count) * 4);
    for (let i = 0; i < a.length; i++) a[i] = rnd();
    return new THREE.InstancedBufferAttribute(a, 4);
  }
  function quadGeometry(x0, x1) {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([x0, -1, 0, x1, -1, 0, x1, 1, 0, x0, 1, 0], 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    return g;
  }
  const additive = {
    glslVersion: THREE.GLSL3, uniforms: U, transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  };

  // ---------------------------------------------------------------- ripples + splashes (share one seed buffer)
  const rippleSeeds = seeds(nRipples, 0x51);
  const RIPPLE_CHUNK = /* glsl */`
    in vec4 aSeed;
    uniform float uZN;
    // one impact per instance per cycle; position re-rolled each cycle from (seed, cycle index)
    void impact(out vec2 c, out float a, out float per, out vec4 h) {
      per = 0.9 * (0.8 + 0.4 * aSeed.w);
      float tc = uTime / per + aSeed.z;
      float k = floor(tc); a = fract(tc);
      h = hash42(vec2(aSeed.x * 137.0 + k * 1.37, aSeed.y * 91.0 - k * 0.71));
      float z = uZN * pow(40.0 / uZN, pow(h.x, 1.25));
      c = vec2((h.y * 2.0 - 1.0) * z * uTan * uAspect * 1.04, z);
      c.y = max(c.y - uCamV.x * a * per, 0.3);   // a ring on the water goes by with the ground for as long as it lives
    }
    // how much of the light an impact at c catches: the mirrored column, the pool, Tokyo's strand
    vec3 impactLight(vec2 c, out float vis) {
      vec3 P = vec3(c.x, -uCamH, c.y);
      vec2 sn = proj(P);
      float col = exp(-max(abs((sn.x - uMirS.x) * uAspect) / uGlobeSR - 0.8, 0.0) * 4.5);
      float dd = length(P - uGlobe) / uGlobeR;
      float pool = 1.0 / (1.0 + dd * dd * 1.5);
      float amb = exp(-abs((sn.x - uMirTokyoX) * uAspect) / uGlobeSR * 7.0) * uTokyoK;
      float fog = exp(-c.y / 26.0);
      vis = uGround * (c.y > uGlobe.z ? mix(0.5 * (1.0 - uSolid), 1.0, smoothstep(0.98, 1.05, discDist(sn))) : 1.0);
      return (mix(CYAN, HOT, 0.25) * (0.02 + (0.8 * col * uHaze + 0.25 * pool) * uStage) + AMBER * amb * 0.7
        + uBandC * uLightK.w * 0.8 * uAway * uLit) * fog * vis;   // T2: away, a ring on the water catches the dusk
    }
  `;
  const rippleGeo = quadGeometry(-1, 1);
  rippleGeo.setAttribute('aSeed', rippleSeeds);
  rippleGeo.instanceCount = nRipples;
  add(rippleGeo, new THREE.ShaderMaterial({
    ...additive,
    vertexShader: COMMON + RIPPLE_CHUNK + /* glsl */`
      out vec2 vL; out float vRc; out float vW; out vec3 vCol; out vec2 vLd;
      void main() {
        vec2 c; float a, per; vec4 h; impact(c, a, per, h);
        float Rm = mix(0.09, 0.24, h.z) * uDropK;
        vec3 wp = vec3(c.x + position.x * Rm, -uCamH, c.y + position.y * Rm);
        vec2 nd = proj(wp);
        gl_Position = vec4(nd * wp.z, 0.0, wp.z);   // w = depth: perspective-correct varyings, true ellipses
        vL = position.xy * Rm;
        vRc = Rm * (1.0 - pow(1.0 - a, 2.4));
        vW = 0.005 + 0.016 * a;
        float vis; vec3 L = impactLight(c, vis);
        vCol = L * pow(1.0 - a, 1.5) * smoothstep(0.0, 0.05, a) * 0.45;   // F2: quieter (was 0.8); the rings read by bending the reflection
        vLd = normalize(uGlobe.xz - c);
      }`,
    fragmentShader: COMMON + FRAG_OUT + /* glsl */`
      in vec2 vL; in float vRc; in float vW; in vec3 vCol; in vec2 vLd;
      void main() {
        float r = length(vL);
        float w = max(vW, fwidth(r) * 0.9);            // never thinner than ~1 px, energy kept
        float e = vW / w;
        float x1 = (r - vRc) / w, x2 = (r - vRc * 0.6) / w;
        float ring = (exp(-x1 * x1) + 0.25 * exp(-x2 * x2)) * e;
        float facing = dot(vL / max(r, 1e-4), vLd);
        float lit = 0.25 + 1.5 * pow(max(facing, 0.0), 2.0) + 0.35 * pow(max(-facing, 0.0), 3.0);
        fragColor = vec4(encode(vCol * ring * lit), 1.0);
      }`,
  }), 11);

  const splashGeo = quadGeometry(-1, 1);
  splashGeo.setAttribute('aSeed', rippleSeeds);
  splashGeo.instanceCount = nRipples;
  add(splashGeo, new THREE.ShaderMaterial({
    ...additive,
    vertexShader: COMMON + RIPPLE_CHUNK + /* glsl */`
      out vec2 vL; out vec3 vCol;
      void main() {
        vec2 c; float a, per; vec4 h; impact(c, a, per, h);
        float tt = a * per;
        vL = position.xy; vCol = vec3(0.0);
        if (tt > 0.12 || c.y > 9.0 || uGround < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        float s = tt / 0.12;
        vec3 wp = vec3(c.x + (h.w - 0.5) * 0.02 * s, -uCamH + 0.055 * sin(3.14159 * s) * (0.5 + h.z) * uDropK, c.y);
        vec2 px = (proj(wp) * 0.5 + 0.5) * uRes;
        float size = (1.0 + 4.0 / c.y) * uRes.y / 900.0;
        px += position.xy * vec2(size, size * 1.8) * 1.6;
        gl_Position = vec4(px / uRes * 2.0 - 1.0, 0.0, 1.0);
        float vis; vec3 L = impactLight(c, vis);
        vCol = (L * 2.2 + HOT * 0.06 * vis) * (1.0 - s * s);
      }`,
    fragmentShader: COMMON + FRAG_OUT + /* glsl */`
      in vec2 vL; in vec3 vCol;
      void main() { fragColor = vec4(encode(vCol * exp(-dot(vL, vL) * 2.6)), 1.0); }`,
  }), 12);

  // ---------------------------------------------------------------- streaks
  const streakGeo = quadGeometry(0, 1);
  streakGeo.setAttribute('aSeed', seeds(nStreaks, 0x7a));
  streakGeo.instanceCount = nStreaks;
  add(streakGeo, new THREE.ShaderMaterial({
    ...additive,
    vertexShader: COMMON + /* glsl */`
      in vec4 aSeed;   // x lateral, y depth, z phase, w drop size
      uniform float uSpeed, uShutter, uWind, uFocal, uAperture, uMaxW;
      out vec2 vLocal; out float vLen; out float vR; out float vSoft; out vec3 vCol;
      void main() {
        vec4 h2 = hash42(aSeed.xy * 311.0);
        float z = sqrt(mix(${(Z0 * Z0).toFixed(1)}, ${(Z1 * Z1).toFixed(1)}, aSeed.y));   // pdf proportional to z
        float dmm = mix(0.8, 4.0, aSeed.w * aSeed.w) * uDropK;                              // drop diameter, mm
        float vt = (9.65 - 10.3 * exp(-0.6 * dmm)) * uSpeed;                                 // terminal velocity, m/s
        float halfH = z * uTan;
        float yTop = (1.0 - uShift) * halfH + 0.7;
        float yScr = (-1.0 - uShift) * halfH - 0.4;
        float yBot = mix(yScr, max(-uCamH, yScr), uGround);
        float L = yTop - yBot;
        float fallen = mod(aSeed.z * L + vt * uTime, L);
        float age = fallen / vt;
        float shear = 1.0 + 5.0 / z;
        float vx = uWind * 2.6 * shear * (0.85 + 0.3 * h2.x);
        float W = z * uTan * uAspect * 1.12 + 0.6;
        float x = mod(aSeed.x * 2.0 * W + vx * age, 2.0 * W) - W;
        vec3 head = vec3(x, yTop - fallen, z);
        vec3 tail = head - vec3(vx, -vt, -uCamV.y) * uShutter * 1.35;
        vec2 nh = proj(head), nt = proj(tail);
        vec2 ph = (nh * 0.5 + 0.5) * uRes, pt = (nt * 0.5 + 0.5) * uRes;
        // depth of field: circle of confusion grows with |1/z - 1/f|; far side kept tighter
        float ppm = uRes.y / (2.0 * halfH);
        float dPx = dmm * 0.001 * ppm;
        float coc = uAperture * abs(1.0 / z - 1.0 / uFocal) * uRes.y * (z > uFocal ? 0.2 : 1.0);
        coc *= h2.z < 0.14 ? 1.0 : 0.22;   // F2: a few soft near drops stay; the rest are thin streaks
        float w = min(min(sqrt(dPx * dPx + coc * coc), uRes.y * 0.05), uMaxW);
        float energy = 1.0;
        if (w < 1.0) { energy = w; w = 1.0; }                        // sub-pixel: keep 1 px, dim instead
        energy *= pow(max(dPx, 1.0) / w, 0.85);                       // spread the same light over the blur
        energy *= 1.0 + 1.6 * smoothstep(7.0, 2.0, z);                // near drops are bigger in the frame
        // light caught from the globe: world falloff + forward scatter for drops in front of the rim
        float dC = max(length(head - uGlobe) - uGlobeR, 0.0) / uGlobeR;
        float sd = discDist(nh);
        float front = step(z, uGlobe.z);
        float catchC = 1.25 * exp(-dC * 2.6) + 0.045 / (1.0 + dC * dC * 4.0);   // rain far from the light is barely there (keeps the name clear)
        catchC += front * (1.4 * exp(-abs(sd - 1.0) * 3.2) + 0.30 * exp(-max(sd - 1.0, 0.0) * 1.2));
        catchC += front * (1.0 - uSolid) * (0.55 * (1.0 - smoothstep(0.8, 1.0, sd)) + 0.9 * exp(-abs(sd - 1.0) * 9.0));   // F2: backlit by the Earth and the ring
        catchC *= (0.6 + 0.4 * uHaze) * uStage;   // L2: the disc's light on the rain goes with the disc
        catchC += AWAY_RAIN * uAway;              // TRIAL: away, the rain catches the room's own light
        float fyB; float inBeam = uBeam * uStage * coneK(head, fyB);
        catchC += inBeam * (1.5 + 1.2 * (1.0 - clamp(fyB, 0.0, 1.0)));   // rain you only see where the projector shines
        float dT = length(head - uTokyo) / uGlobeR;
        float sdT = length(vec2((nh.x - uTokyoS.x) * uAspect, nh.y - uTokyoS.y)) / uGlobeSR;
        float catchA = (1.1 * exp(-dT * 5.0) + front * 0.9 * exp(-sdT * 5.0)) * uTokyoK;
        vec3 col = mix(CYAN, HOT, smoothstep(0.9, 2.6, catchC)) * catchC + AMBER * catchA + vec3(0.30, 0.42, 0.52) * 0.012;
        col += uBandC * uLightK.w * uAway * uLit;   // T2: away, the rain catches the dusk
        float occl = front > 0.5 ? 1.0 : mix(0.45 * (1.0 - uSolid), 1.0, smoothstep(0.97, 1.04, sd));   // the ring's body hides drops behind it; the hologram dims them
        float far = mix(1.0, 0.35, smoothstep(14.0, 40.0, z));
        vCol = col * occl * far * energy * (0.55 + 0.9 * h2.y) * 0.17;
        vec2 seg = ph - pt; float len = length(seg);
        vec2 dir = len > 1e-4 ? seg / len : vec2(0.0, 1.0);
        vec2 perp = vec2(-dir.y, dir.x);
        float r = 0.5 * w + 1.0;
        float al = position.x;
        vec2 p = mix(pt, ph, al) + dir * (al * 2.0 - 1.0) * r + perp * position.y * r;
        vLocal = vec2(al * len + (al * 2.0 - 1.0) * r, position.y * r);
        vLen = len; vR = 0.5 * w; vSoft = 0.35 + 0.42 * w;
        gl_Position = vec4(p / uRes * 2.0 - 1.0, 0.0, 1.0);
      }`,
    fragmentShader: COMMON + FRAG_OUT + /* glsl */`
      in vec2 vLocal; in float vLen; in float vR; in float vSoft; in vec3 vCol;
      void main() {
        float a = clamp(vLocal.x, 0.0, vLen);
        float d = length(vec2(vLocal.x - a, vLocal.y));
        // F2: thin streaks taper from a bright head (the end nearest the drop) to a fading tail; the soft near drops stay round
        float t = a / max(vLen, 1e-3);
        float thin = 1.0 - smoothstep(2.0, 5.0, vR);
        float rr = vR * mix(1.0, 0.45 + 0.55 * t, thin);
        float cov = 1.0 - smoothstep(rr - vSoft, rr + 0.5, d);        // capsule: soft-edged bokeh when wide
        float rimB = 1.0 + 0.25 * smoothstep(vR * 0.35, vR, d) * smoothstep(3.0, 8.0, vR);   // bokeh edge, lens-like
        fragColor = vec4(encode(vCol * cov * rimB * mix(1.0, 0.12 + 1.5 * t * t, thin)), 1.0);
      }`,
  }), 13);

  // ---------------------------------------------------------------- layout (the globe's disc and the horizon)
  const geo = { w: 1, h: 1, aspect: 1, shift: 0, sx: 0, sy: 0, sr: 0.5, R: 3, portrait: false };
  /** w, h css px; dpr; disc { cx, cy, r } css px; horizon 0..1 from the top; reflK the reflection cap. */
  function place({ w, h, dpr, disc, horizon, reflCap = 1 }) {
    U.uRes.value.set(Math.round(w * dpr), Math.round(h * dpr));
    const aspect = w / h, portrait = h > w;
    U.uAspect.value = aspect;
    const shift = 1 - 2 * horizon;
    U.uShift.value = shift;
    const sx = 2 * disc.cx / w - 1, sy = 1 - 2 * disc.cy / h, sr = 2 * disc.r / h;
    // the globe floats over its projector pool: the ground point under its centre sits 40% (30% portrait)
    // down the ground band, and the globe never sinks into the floor
    const yPool = shift + (-1 - shift) * (portrait ? 0.30 : 0.40);
    let zG = CAM_H / (TAN * Math.max(0.02, shift - yPool));
    const under = shift + sr - sy;
    if (under > 0) zG = Math.min(zG, (CAM_H * 0.85) / (TAN * under));
    const C = U.uGlobe.value.set(sx * zG * TAN * aspect, (sy - shift) * zG * TAN, zG);
    const R = sr * zG * TAN;
    U.uGlobeR.value = R;
    U.uGlobeS.value.set(sx, sy);
    U.uGlobeSR.value = sr;
    U.uPoolC.value.set(C.x, C.z);
    const mz = C.z, my = -2 * CAM_H - C.y;   // the globe mirrored in the floor
    U.uMirS.value.set(C.x / (mz * TAN * aspect), my / (mz * TAN) + shift);
    Object.assign(geo, { w, h, aspect, shift, sx, sy, sr, R, portrait });
    U.uZN.value = CAM_H / (TAN * (1 + shift));
    U.uAperture.value = portrait ? 0.075 : 0.1;
    base.refl = (portrait ? 0.6 : 1) * reflCap;
    base.beam = portrait ? 0.45 : 1;
    U.uReflK.value = base.refl * U.uStage.value;
    U.uBeamK.value = base.beam * U.uStage.value;   // phones: the beam passes behind the type, keep the column quiet there
    placeTokyo();
  }
  function placeTokyo() {
    const q = U.uTokyoQ.value, C = U.uGlobe.value, R = geo.R;
    const T = U.uTokyo.value.set(C.x + R * q.x, C.y + R * q.y, C.z - R * Math.sqrt(Math.max(0, 1 - q.x * q.x - q.y * q.y)));
    U.uTokyoS.value.set(T.x / (T.z * TAN * geo.aspect), T.y / (T.z * TAN) + geo.shift);
    U.uMirTokyoX.value = geo.sx + q.x * geo.sr / geo.aspect;
  }
  /** Tokyo's place on the disc (disc radii, y up) and how much its light counts (0..1). */
  function setTokyo(qx, qy, k) { U.uTokyoQ.value.set(qx, qy); U.uTokyoK.value = k; placeTokyo(); }
  /** solid: the ring's dark body 0..1; rim: ring strength; outPx: the ring pushed off the limb (device px). */
  /** F1a: the sun in world space (y up, x right on screen): the ring lifts on its side. */
  function setSun(x, y) { const l = Math.hypot(x, y); U.uSunQ.value.set(l > 1e-6 ? x / l : 1, l > 1e-6 ? y / l : 0, Math.min(1, l)); }
  /** Step L2: the stage's strength, 0..1 (next.mjs): the disc's reflection on the floor, its pool, its beam and its light
      on the rain and the ripples follow it. The ring, its body and Tokyo's point come in through setRing and setTokyo. */
  const base = { refl: 1, beam: 1 };
  function setStage(k) {
    if (U.uStage.value === k) return;
    U.uStage.value = k; U.uReflK.value = base.refl * k; U.uBeamK.value = base.beam * k;
  }
  /** TRIAL, the open layout: how far the Earth has gone, 0..1; the room's own light comes up with it. */
  function setAway(a) { U.uAway.value = a; }
  /** T2: how much of the light is on, 0..1 (next.mjs lowers it evenly where a section's text needs it, in place of boxes). */
  function setLit(k) { U.uLit.value = lightKey ? Math.max(0, Math.min(1, k)) : 0; }
  /** T2 (trial): the middle sections' light, a key of LIGHTS or null (today's scene). */
  let lightKey = null;
  function setLight(key) {
    const L = key ? LIGHTS[key] : null;
    lightKey = L ? key : null;
    U.uLit.value = L ? 1 : 0;
    const lin = hex => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };   // sRGB hex to the linear working space
    U.uSkyC.value.set(...(L ? lin(L.sky) : [0, 0, 0]));
    U.uBandC.value.set(...(L ? lin(L.band) : [0, 0, 0]));
    U.uLightK.value.set(L?.skyK ?? 0, L?.bandK ?? 0, L?.floorK ?? 0, L?.rainK ?? 0);
    U.uBandW.value = L?.bandW ?? 0.05;
  }
  function lightDebug() {
    const L = lightKey ? LIGHTS[lightKey] : null;
    return { variant: lightKey, lit: U.uLit.value, away: +U.uAway.value.toFixed(4), sky: L?.sky ?? null, band: L?.band ?? null,
      k: U.uLightK.value.toArray().map(v => +v.toFixed(4)), bandW: U.uBandW.value, glow: AWAY_GLOW, rain: AWAY_RAIN };
  }
  function setRing(solid, rim, outPx) { U.uSolid.value = solid; U.uRim.value = rim; U.uRimMode.value.set(solid, solid, outPx); }

  // ---------------------------------------------------------------- clock: the wind leans, with slow gusts
  let time = still ? 9.35 : 0, windNow = 0.2;
  function update(dt) {
    if (still) { U.uTime.value = time; U.uWind.value = 0.2; return; }
    time += dt;
    if (time > 3600) time -= 3600;
    const gust = 0.16 * Math.sin(time * 0.29) + 0.09 * Math.sin(time * 0.71 + 1.3) + 0.04 * Math.sin(time * 1.9 + 0.4);
    U.uWind.value = windNow + gust * (0.5 + 0.8 * Math.abs(windNow));
    U.uTime.value = time;
  }

  return { meshes, U, streaks: nStreaks, ripples: nRipples, place, setTokyo, setRing, setSun, setStage, setAway, setLight, setLit, lightDebug, update };
}
