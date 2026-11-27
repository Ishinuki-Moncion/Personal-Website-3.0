/* The real night sky (design 14.3): the naked-eye stars (from the HYG database, CC BY-SA 4.0: data/SOURCES.md)
   where they stand at the scene's clock,
   in the frame of the sun and the land.

   - Positions: each star is stored as its equatorial direction (latitude = Dec, longitude = RA, through the
     scene's latLonToXYZ formula). One 3x3 per frame takes it to the screen: the sidereal turn (longitude minus
     GMST, so the star stands over the point of the Earth it really stands over; sky-math.mjs), then the Earth's
     REST pose (Japan facing the viewer), then the camera. Rotation only: the stars are at infinity (w = 0), so
     the zoom's dolly never moves or grows them, and no mouse parallax.
   - The sky belongs to the room, not to the globe: it does not turn when the Earth turns. As first built it
     followed the Earth's own pose, so the idle sway swung every star about 58 px each way all the time, and a
     drag or a change of section swept the whole sky across the copy (the owner, 2026-11-26: "should the stars
     move around so much like the background. I feel like its too distracting"). Now only the clock moves it:
     15 degrees an hour: about four pixels a minute at the edge of a 1440 px screen (measured), less nearer the middle.
   - The sky is seen through a wider lens than the Earth (SKY_FOV): through the Earth's own 22-degree lens the
     288 first-view stars would be five on screen. The axis is the disc's centre, as for the globe.
   - Brightness and size follow V magnitude, compressed (sky-math magToSize, magToAlpha); colour follows B-V
     between the scene's cool and warm tokens (bvToColor). No twinkle, no idle motion.
   - Hidden behind the disc while it is opaque (the Earth or the ring's dark body); dimmed in the ring's glare
     (a third of the disc's radius outside its edge, faint stars first); hidden below the floor's horizon.
   - One draw call. (A Milky Way band was built and removed in the F1 review: at 4 percent it could not be
     seen, and at 10 it still could not, yet it lifted the sky enough to fail the contrast gate on a nav link.)
   - The 288 brightest are in the first view (a static import); the rest load after the first frame (loadRest). */
import * as THREE from 'three';
import { decodeStarsBright } from './data/stars-bright.mjs?v=1';
import { gmstDeg, siderealRows, latLonToVec, magToSize, magToAlpha, bvToColor, DEG } from './sky-math.mjs?v=1';

export const SKY_FOV = 62;                 // degrees, vertical (the live site's starfield lens)
const FADE_S = 1.5;                        // the rest fades in over this long, by the clock (not by frames)
/* Named stars of the bright table (sorted by V, ties by HR), for the debug state and the tests. */
export const NAMED = { sirius: 0, vega: 4, rigel: 6, betelgeuse: 9 };

/** { pos, col, aux } arrays for a decoded table: equatorial direction, display colour, [diameter css px, strength, group]. */
function bake(t, n, group) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), aux = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const v = latLonToVec(t.dec[i] / DEG, t.ra[i] / DEG);
    pos.set(v, i * 3);
    col.set(bvToColor(t.bv[i]), i * 3);
    aux[i * 3] = magToSize(t.mag[i]); aux[i * 3 + 1] = magToAlpha(t.mag[i]); aux[i * 3 + 2] = group;
  }
  return { pos, col, aux };
}

const GLSL_SKY = /* glsl */`
  uniform mat3 uR; uniform mat4 uP; uniform vec2 uRes; uniform vec4 uDisc; uniform float uHorizon, uReveal;
  // TRIAL (the stars answer the camera's travel): uMove = how far forward the camera has gone, as a share of a
  // star's distance from the vanishing point; uVP = the floor's vanishing point (ndc), where the camera is heading
  uniform float uMove; uniform vec2 uVP;
  // a star's nearness from its drawn size (7 px for Sirius down to 2.2 px at magnitude 5.5): the bright ones count
  // as near and move most, the faint ones a quarter as much. That difference is what reads as depth.
  float nearOf(float size){ return 0.25 + 0.75 * clamp((size - 2.2) / 4.8, 0.0, 1.0); }
  // the disc's mask and the ring's glare at a device-px point: x = behind the opaque disc, y = glare factor 0..1
  vec2 discMask(vec2 px){
    float d = length(px - uDisc.xy) / max(uDisc.z, 1.0);
    return vec2(uDisc.w * (1.0 - smoothstep(0.995, 1.01, d)), smoothstep(1.0, 1.333, d));
  }
  float aboveFloor(vec2 px){ return smoothstep(uHorizon - 2.0, uHorizon + 8.0, px.y); }
`;

/** sizeK: a scale on every star's drawn size (phones: 0.8, where the sky runs behind the hero's body copy). */
/** rest: the Earth's rest pose { spin, tilt } (globe.hero()); the sky is seen as if the Earth always stood so. */
export function createStars({ restCount = 0, earth, camera, uReveal, sizeK = 1, rest = { spin: 0, tilt: 0 } }) {
  const bright = decodeStarsBright();
  let data = bake(bright, bright.ra.length, 0);
  const brightN = bright.ra.length;
  const R = new THREE.Matrix3();
  const P = new THREE.Matrix4();
  const U = {
    uR: { value: R }, uP: { value: P }, uRes: { value: new THREE.Vector2(1, 1) }, uDpr: { value: 1 },
    uDisc: { value: new THREE.Vector4(0, 0, 1, 0) }, uHorizon: { value: 0 }, uReveal, uRestA: { value: 0 }, uSizeK: { value: sizeK },
    uMove: { value: 0 }, uVP: { value: new THREE.Vector2(0, 0) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: GLSL_SKY + /* glsl */`
      attribute vec3 aCol; attribute vec3 aAux;
      uniform float uDpr, uRestA, uSizeK;
      varying vec3 vCol; varying float vA, vSpike, vScale;
      void main(){
        vec3 v = uR * position;
        vec4 c = uP * vec4(v, 0.0);                       // a direction: at infinity, rotation only
        vec2 ndc = c.xy / c.w;
        ndc = uVP + (ndc - uVP) * (1.0 + uMove * nearOf(aAux.x));   // TRIAL: forward spreads them, back closes them in
        vec2 px = (ndc * 0.5 + 0.5) * uRes;
        vec2 dm = discMask(px);
        float a = aAux.y * (1.0 - dm.x) * mix(0.08 + 0.35 * aAux.y * aAux.y, 1.0, dm.y) * aboveFloor(px);
        a *= (0.35 + 0.65 * uReveal) * (aAux.z > 0.5 ? uRestA : 1.0);
        vCol = aCol; vA = a;
        /* The sprite is vScale star-diameters wide: 2.4 for a plain star (core and halo), up to 6 for the few
           brightest, whose fine spikes need the room (first magnitude and brighter: about twenty in the whole sky). */
        vSpike = smoothstep(4.4, 6.4, aAux.x);
        vScale = 2.4 + 3.6 * vSpike;
        gl_PointSize = (c.w > 0.0 && a > 0.004) ? max(3.0, aAux.x * uSizeK * uDpr * vScale) : 0.0;   // never under 3 device px
        gl_Position = c.w > 0.0 ? vec4(ndc, 0.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vA, vSpike, vScale;
      void main(){
        vec2 pc = gl_PointCoord - 0.5;
        vec2 q = pc * vScale;                            // in star diameters: |q| = 0.5 is the star's own edge
        float r = length(q);
        /* As a lens draws a star: a solid core the size of the star (as first built the core was a fraction of a
           pixel and the sky read as empty), a soft halo around it, and on the brightest two fine crossed spikes. */
        float core = 1.0 - smoothstep(0.30, 0.58, r);
        float halo = 0.24 * exp(-r * r * 2.4);
        vec2 aq = abs(q);
        float spikes = vSpike * 0.42 * max(exp(-aq.x * 11.0 - aq.y * 1.5), exp(-aq.y * 11.0 - aq.x * 1.5));
        float edge = 1.0 - smoothstep(0.82, 1.0, max(abs(pc.x), abs(pc.y)) * 2.0);   // no square sprite edge
        float f = min(1.0, core + halo + spikes) * edge;
        if (f < 0.004) discard;
        gl_FragColor = vec4(mix(vCol, vec3(1.0), 0.5 * core), vA * f);
      }`,
    transparent: false, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const geoOf = d => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(d.pos, 3));
    g.setAttribute('aCol', new THREE.BufferAttribute(d.col, 3));
    g.setAttribute('aAux', new THREE.BufferAttribute(d.aux, 3));
    return g;
  };
  const mesh = new THREE.Points(geoOf(data), mat);
  mesh.frustumCulled = false; mesh.renderOrder = 1;
  let count = brightN;

  // ---------------------------------------------------------------- the lens and the frame
  const cam = new THREE.PerspectiveCamera(SKY_FOV, 1, 0.1, 10);
  const L = { w: 1, h: 1, dpr: 1 };
  /** The viewport (css px), the device pixel ratio and the disc's centre (css px): the sky's axis. */
  function resize(w, h, dpr, cx, cy) {
    Object.assign(L, { w, h, dpr });
    cam.aspect = w / h; cam.updateProjectionMatrix();
    const sx = (cx / w) * 2 - 1, sy = 1 - (cy / h) * 2;
    cam.projectionMatrix.elements[8] = -sx; cam.projectionMatrix.elements[9] = -sy;   // off-axis, as the globe
    P.copy(cam.projectionMatrix);
    U.uRes.value.set(Math.round(w * dpr), Math.round(h * dpr)); U.uDpr.value = dpr;
  }
  /** cx, cy, r in css px (y down); cover 0..1: how much of the disc is opaque (the Earth or the ring's body). */
  function setDisc(cx, cy, r, h, dpr, cover) { U.uDisc.value.set(cx * dpr, (h - cy) * dpr, r * dpr, cover); }
  /** The floor's horizon, as a share of the height from the top. */
  function setHorizon(horizon, h, dpr) { U.uHorizon.value = (1 - horizon) * h * dpr; }

  const sid = new THREE.Matrix3(), e3 = new THREE.Matrix3(), v3m = new THREE.Matrix3(), m4 = new THREE.Matrix4();
  let gmst = 0, restA = 0, fadeFrames = 0, fadeT0 = 0, fadeFrom = null, restState = restCount > 0 ? 'waiting' : 'none';
  /* The Earth's rest pose as a rotation: the tilt about x, then the spin about y (globe.mjs: tiltGroup.rotation.x,
     earth.rotation.y). debug().restError checks it against the Earth's own matrix when the Earth is at rest. */
  const eRest = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationX(rest.tilt).multiply(new THREE.Matrix4().makeRotationY(rest.spin)));
  /** Recompose the frame from the clock (the Earth's pose plays no part); advance the rest's fade. */
  function update(dt) {
    gmst = gmstDeg(Date.now());
    sid.set(...siderealRows(gmst).flat());
    v3m.setFromMatrix4(m4.extractRotation(camera.matrixWorldInverse));
    R.multiplyMatrices(v3m, eRest).multiply(sid);
    /* By the clock: the scene's step is capped at 50 ms a frame, so on a slow renderer a fade counted in steps
       took as long as thirty of its frames (the test browser draws in software: over 15 s, and the test failed). */
    if (restState === 'loaded' && restA < 1) { restA = Math.min(1, (performance.now() - fadeT0) / (FADE_S * 1000)); if (restA < 1) fadeFrames++; }
    U.uRestA.value = restA;
  }

  /** Load the fainter stars (after the first frame). reduced: land at full strength, no fade. onLanded is called
      once they are in (the still frame redraws then). A failure keeps the bright stars and logs nothing. */
  async function loadRest({ reduced = false, onLanded = () => {} } = {}) {
    if (restState !== 'waiting') return;
    restState = 'loading';
    try {
      const mod = await import('./data/stars-rest.mjs?v=1');
      const rest = mod.decodeStarsRest();
      const n = Math.min(restCount, rest.ra.length);
      const extra = bake(rest, n, 1);
      const all = {
        pos: new Float32Array((brightN + n) * 3), col: new Float32Array((brightN + n) * 3), aux: new Float32Array((brightN + n) * 3),
      };
      for (const k of ['pos', 'col', 'aux']) { all[k].set(data[k]); all[k].set(extra[k], brightN * 3); }
      const old = mesh.geometry;
      mesh.geometry = geoOf(all); old.dispose();
      data = all; count = brightN + n;
      restA = reduced ? 1 : 0; U.uRestA.value = restA;
      fadeFrom = restA; fadeT0 = performance.now();
      restState = 'loaded';
      onLanded();
    } catch {
      restState = 'failed';
    }
  }

  // ---------------------------------------------------------------- for the debug state and the tests
  const tv = new THREE.Vector3(), t4 = new THREE.Vector4();
  /** A star's screen position (css px, y down) through the frame the shader uses; front: in front of the lens. */
  function screenOf(i) {
    tv.set(data.pos[i * 3], data.pos[i * 3 + 1], data.pos[i * 3 + 2]).applyMatrix3(R);
    t4.set(tv.x, tv.y, tv.z, 0).applyMatrix4(P);
    if (t4.w <= 0) return { x: null, y: null, front: false };
    const near = 0.25 + 0.75 * Math.min(1, Math.max(0, (data.aux[i * 3] - 2.2) / 4.8)), k = 1 + U.uMove.value * near, vp = U.uVP.value;
    const nx = vp.x + (t4.x / t4.w - vp.x) * k, ny = vp.y + (t4.y / t4.w - vp.y) * k;   // as the shader
    return { x: +((nx * 0.5 + 0.5) * L.w).toFixed(2), y: +((0.5 - ny * 0.5) * L.h).toFixed(2), front: true };
  }
  function debug() {
    const named = {};
    for (const [name, i] of Object.entries(NAMED)) named[name] = { i, ra: +(bright.ra[i] / DEG).toFixed(4), dec: +(bright.dec[i] / DEG).toFixed(4), size: +data.aux[i * 3].toFixed(3), ...screenOf(i) };
    const sample = [];
    for (let i = 0; i < count; i += Math.max(1, Math.floor(count / 40))) { const s = screenOf(i); sample.push([s.x, s.y]); }
    /* the stars in the open sky: on screen, off the opaque disc, above the floor (brightest first) */
    const dk = U.uDisc.value, dpr = L.dpr, open = [];
    for (let i = 0; i < count; i++) {
      const s = screenOf(i);
      if (!s.front || s.x < 0 || s.x > L.w || s.y < 0 || s.y > L.h) continue;
      if (dk.w > 0.5 && Math.hypot(s.x - dk.x / dpr, (L.h - s.y) - dk.y / dpr) < dk.z / dpr) continue;
      if ((L.h - s.y) * dpr < U.uHorizon.value) continue;
      open.push(i);
    }
    return {
      count, bright: brightN, rest: count - brightN, restState, restA: +restA.toFixed(3), fadeFrames, fadeFrom,
      /* how far the Earth's rotation is from the rest pose the sky is drawn for (0 when the Earth is at rest) */
      restError: (() => { e3.setFromMatrix4(m4.extractRotation(earth.matrixWorld)); let d = 0; for (let i = 0; i < 9; i++) d = Math.max(d, Math.abs(e3.elements[i] - eRest.elements[i])); return +d.toFixed(6); })(),
      fov: SKY_FOV, gmst: +gmst.toFixed(4), move: +U.uMove.value.toFixed(5), vp: [+U.uVP.value.x.toFixed(3), +U.uVP.value.y.toFixed(3)],
      frame: R.elements.map(v => +v.toFixed(6)), named, sample,
      open: open.length, openBrightest: open.slice(0, 5).map(i => ({ i, ...screenOf(i), size: +data.aux[i * 3].toFixed(2) })),
    };
  }

  return {
    mesh, U, resize, setDisc, setHorizon, update, loadRest, debug,
    /** TRIAL: g, the camera's forward travel as the stars see it; vx, vy, the floor's vanishing point in ndc. */
    setMove(g, vx, vy) { U.uMove.value = g; U.uVP.value.set(vx, vy); },
    get count() { return count; },
  };
}
