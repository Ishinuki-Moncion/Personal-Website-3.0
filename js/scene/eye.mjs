/* The eye (design 2026-11-26, sections 4 and 14.4): one drawn satellite riding the scene's EXISTING orbit ring
   (globe.mjs, ORBIT_R), never a second ring. A body, two solar panels with grid lines and a dish, about 32 css px
   end to end on desktop tiers and 24 on phones, drawn in one quad in screen space: no model, no texture.

   Lit by the real sun (the globe's own uSun, world space): the panels brighten with the phase, strongest when the
   sun is behind the viewer. In the Earth's shadow (sky-math inEarthShadow: a cylinder of one Earth radius behind
   it) the eye goes dark but for one small amber status light: the night shift of section 4. The Projects section
   puts it there (in front of the Earth over the antisolar point).

   Its only motion of its own is the drift: one orbit in EYE_PERIOD_S, prograde with the Earth's turn. It starts
   (and under reduced motion stays) at the point of its ring nearest Tokyo. Behind the Earth it dims to a ghost, as
   the far-side dots do. It fades in as the Earth assembles. The lite tier draws a point only (amber in shadow).
   Whether it is night in Tokyo comes from the globe's own sun (globe.tokyoIsNight). */
import * as THREE from 'three';
import { GLSL_GLOBE, ORBIT_R } from './globe.mjs?v=5';
import { TOKYO, latLonToXYZ } from './data/places.mjs?v=2';
import { inEarthShadow } from './sky-math.mjs?v=1';

export const EYE_PERIOD_S = 120;
const OMEGA = (2 * Math.PI) / EYE_PERIOD_S;   // rad/s
const GHOST = 0.22;                            // its strength behind the Earth
const SIZE = 18;                               // glyph px, half the quad (the glyph spans about 32 of them)
export const EYE_SPAN = { desktop: 32, phone: 24 };   // css px end to end

export function createEye({ globe, detail = true }) {
  const lin = hex => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r, c.g, c.b); };
  const U = {
    uEye: { value: new THREE.Vector3() }, uTan: { value: new THREE.Vector3(1, 0, 0) },
    uA: { value: 0 }, uDetail: { value: detail ? 1 : 0 }, uSize: { value: SIZE }, uScale: { value: 1 },
    uPanel: { value: 1 }, uShade: { value: 0 },
    uRes: globe.U.uRes, uDpr: globe.U.uDpr, uExposure: globe.U.uExposure,
    uVP: { value: new THREE.Matrix4() },               // the orbit camera's view-projection (step 2)
    cHot: { value: lin('#b4f7ff') }, cSignal: { value: lin('#39f0ff') }, cIce: { value: lin('#9fe9f7') }, cEvent: { value: lin('#ff9e2c') },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      uniform vec3 uEye, uTan; uniform vec2 uRes; uniform float uDpr, uSize, uScale, uA; uniform mat4 uVP;
      varying vec2 vP;
      void main(){
        vec4 c = uVP * vec4(uEye, 1.0);
        vec4 c1 = uVP * vec4(uEye + uTan * 0.05, 1.0);
        vec2 s0 = c.xy / c.w * uRes * 0.5, s1 = c1.xy / c1.w * uRes * 0.5;
        vec2 d = s1 - s0; d = dot(d, d) > 1e-8 ? normalize(d) : vec2(1.0, 0.0);
        vec2 nrm = vec2(-d.y, d.x);
        c.xy += (d * position.x + nrm * position.y) * uSize * uScale * uDpr / (uRes * 0.5) * c.w;
        vP = position.xy * uSize;                  // glyph px in the eye's frame (x along the ring); css px * uScale
        gl_Position = uA < 0.002 ? vec4(2.0, 2.0, 2.0, 1.0) : c;
      }`,
    fragmentShader: GLSL_GLOBE + /* glsl */`
      uniform float uA, uDetail, uPanel, uShade, uScale; uniform vec3 cHot, cSignal, cIce, cEvent;
      varying vec2 vP;
      float box(vec2 p, vec2 h, float aa){ vec2 q = abs(p) - h; return 1.0 - smoothstep(-aa, aa, max(q.x, q.y)); }
      void main(){
        float aa = 0.5 / uScale;                                   // about half a css px of soft edge
        // the panels' axis is 55 degrees off the ring's direction, so they never merge with its line
        vec2 p = mat2(0.574, 0.819, -0.819, 0.574) * vP;
        float body = box(p, vec2(2.3, 1.9), aa);
        // two wings, 4.2 to 15.2 px out, each four cells along and two across: bright cells, dark grid lines
        float wx = abs(p.x) - 4.2, wing = box(vec2(wx - 5.5, p.y), vec2(5.5, 2.7), aa);
        float lu = abs(fract(wx / 2.75) - 0.5) * 2.75;             // distance to the nearest cross line (px)
        float cells = smoothstep(0.25, 0.75, 1.375 - lu) * smoothstep(0.2, 0.6, abs(p.y));
        float strut = box(vec2(abs(p.x) - 3.25, p.y), vec2(0.95, 0.3), aa);
        // the dish: a cup on the body's far side, open outward, on a short feed
        vec2 dq = p - vec2(0.0, 6.4);
        float cup = (1.0 - smoothstep(0.3, 0.3 + 2.0 * aa, abs(length(dq) - 2.7))) * (1.0 - smoothstep(-0.2, 0.6, dq.y));
        float feed = box(p - vec2(0.0, 2.9), vec2(0.32, 1.0), aa);
        float r2 = dot(vP, vP);
        float glint = exp(-r2 / 0.9);
        float lit = (1.0 - uShade);
        vec3 c;
        if (uDetail > 0.5) {
          c = cSignal * wing * (0.18 + 0.82 * cells) * (0.25 + 0.95 * uPanel) * 0.95
            + cHot * (body * (0.45 + 0.55 * uPanel) * 0.9 + glint * 1.2 * uPanel)
            + cIce * (cup + feed + strut) * (0.35 + 0.65 * uPanel) * 0.8;
          c *= lit;
          c += cHot * body * 0.05 * uShade;                         // the body's outline is just there in the dark
        } else {
          c = cHot * (exp(-r2 / 0.9) * 2.4 + exp(-r2 / 6.0) * 0.12) * lit;   // lite: a point
        }
        // the status light: one small amber point, on in the shadow
        vec2 lq = p - vec2(-1.1, -0.8);
        c += cEvent * (exp(-dot(lq, lq) / 1.1) * 3.0 + exp(-dot(lq, lq) / 9.0) * 0.25) * uShade;   // about 2 css px, a faint halo
        gl_FragColor = vec4(toSRGB(tonemap(c * uA)), 1.0);
      }`,
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  U.uScale.value = 1;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false; mesh.renderOrder = 11;   // after the orbit ring

  // ---------------------------------------------------------------- where it is
  const orbit = globe.orbit, camera = globe.baseCamera;   // step 2: drawn as the orbit camera sees it
  const local = new THREE.Vector3(), world = U.uEye.value, tan = U.uTan.value;
  const tmp = new THREE.Vector3(), invOrbit = new THREE.Matrix4(), view = new THREE.Vector3();
  const tokyoObj = new THREE.Vector3(...latLonToXYZ(TOKYO.lat, TOKYO.lon));
  let angle = 0, clock = 0, alpha = 0, behind = false, drawFade = 1, shadow = false, phone = false;
  /** The angle on the ring nearest Tokyo, with the Earth where it is now. */
  function nearestTokyo() {
    orbit.updateMatrixWorld(true);
    tmp.copy(tokyoObj).applyMatrix4(globe.earth.matrixWorld);
    tmp.applyMatrix4(invOrbit.copy(orbit.matrixWorld).invert());
    return Math.atan2(tmp.z, tmp.x);
  }
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  /** Sunlight on the eye, from the globe's own sun (world space, as the eye). */
  function light() {
    const s = globe.U.uSun.value;
    shadow = inEarthShadow([world.x, world.y, world.z], [s.x, s.y, s.z]);
    const d = world.dot(s);
    const perp = Math.hypot(world.x - s.x * d, world.y - s.y * d, world.z - s.z * d);
    U.uShade.value = d < 0 ? 1 - smooth(0.96, 1.04, perp) : 0;       // soft only at the shadow's edge
    view.copy(camera.position).sub(world).normalize();
    U.uPanel.value = 0.5 + 0.5 * view.dot(s);                         // the phase: 1 with the sun behind the viewer
  }
  function placeOnRing() {
    U.uVP.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    local.set(Math.cos(angle) * ORBIT_R, 0, Math.sin(angle) * ORBIT_R);
    world.copy(local).applyMatrix4(orbit.matrixWorld);
    // prograde: the angle decreases, so the ring tangent is -(d/d angle)
    tan.set(Math.sin(angle), 0, -Math.cos(angle)).transformDirection(orbit.matrixWorld);
    // behind the Earth: the segment to the camera passes through the unit sphere (soft at the limb, as sphereVis)
    const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
    const dx = world.x - cx, dy = world.y - cy, dz = world.z - cz;
    const t = Math.max(0, Math.min(1, -(cx * dx + cy * dy + cz * dz) / (dx * dx + dy * dy + dz * dz)));
    const dist = Math.hypot(cx + dx * t, cy + dy * t, cz + dz * t);
    const v = Math.max(0, Math.min(1, (dist - 0.985) / (1.003 - 0.985)));
    const vis = v * v * (3 - 2 * v);
    behind = vis < 0.5;
    U.uScale.value = phone ? EYE_SPAN.phone / EYE_SPAN.desktop : 1;   // 32 css px on desktop, 24 on phones
    light();
    const reveal = globe.reveal();
    const fade = Math.max(0, Math.min(1, (reveal - 0.35) / 0.65));
    alpha = fade * fade * (3 - 2 * fade) * (GHOST + (1 - GHOST) * vis) * drawFade;
    U.uA.value = alpha;
  }

  /** Park at the point nearest Tokyo (the start, and the only place it is under reduced motion). */
  function park() { angle = nearestTokyo(); placeOnRing(); }
  /** drift: false under reduced motion, and while the journey is steering it. */
  function update(dt, drift = true) {
    clock += dt;
    if (drift) angle -= OMEGA * dt;
    placeOnRing();
  }
  /* Step 2: the eye guides. The journey moves it along its ring to the point in front of the Earth (over the
     place the view faces) as part of each move; it drifts only when nothing is asking it to move. */
  /** The ring angle nearest the viewer: the point that sits over whatever faces the camera. */
  function frontAngle() {
    orbit.updateMatrixWorld(true);
    tmp.copy(camera.position).applyMatrix4(invOrbit.copy(orbit.matrixWorld).invert());
    return Math.atan2(tmp.z, tmp.x);
  }
  function setAngle(a) { angle = a; placeOnRing(); }
  /** The draw set's share of the cross-fade (the ring level has no eye). */
  function setFade(f) { drawFade = f; }
  /** A phone composition draws the eye at 24 css px instead of 32. */
  function setPhone(on) { phone = Boolean(on); }
  /** Half the glyph's span on screen (css px): the overlay sizes its hit target and label offset from it. */
  const halfSpan = () => (phone ? EYE_SPAN.phone : EYE_SPAN.desktop) / 2;
  const screen = { x: 0, y: 0 };
  function onScreen() { return globe.projectBase(world, screen); }
  /** lat/lon of the point on the Earth under the eye. */
  const under = () => globe.geoOf(tmp.copy(world).normalize());

  return {
    mesh, park, update, onScreen, under, frontAngle, setAngle, setFade, setPhone, halfSpan,
    angle: () => angle, alpha: () => alpha, behind: () => behind, shadow: () => shadow,
    debug() {
      const g = under(); const s = onScreen();
      return {
        visible: alpha > 0.05, behind, alpha: +alpha.toFixed(3), lat: +g.lat.toFixed(3), lon: +g.lon.toFixed(3),
        tokyoIsNight: globe.tokyoIsNight(), angle: +(angle * 180 / Math.PI).toFixed(4), t: +clock.toFixed(4),
        world: [world.x, world.y, world.z].map(v => +v.toFixed(5)), x: +s.x.toFixed(1), y: +s.y.toFixed(1),
        periodS: EYE_PERIOD_S, ring: { radius: ORBIT_R, rotation: [orbit.rotation.x, orbit.rotation.y, orbit.rotation.z] },
        // 14.4: sunlight
        shadow, lit: !shadow, statusLight: U.uShade.value > 0.5, shade: +U.uShade.value.toFixed(3), panel: +U.uPanel.value.toFixed(3),
        sun: [globe.U.uSun.value.x, globe.U.uSun.value.y, globe.U.uSun.value.z].map(v => +v.toFixed(5)),
        spanPx: phone ? EYE_SPAN.phone : EYE_SPAN.desktop, detail: detail,
      };
    },
  };
}
