/* v3.3f — rivulet-glass grabpass (M10, behind RIVULET_GATE in background.js).
   A 64×64 GPGPU drop-state sim (gravity, hang-and-burst runs, collision-merge,
   evaporation — the raindrop-fx model, spec §3.6 / research R3) splatted as
   additive metaball kernels whose smooth-field sums produce real menisci;
   normals derive from the field gradient and REFRACT the already-rendered
   graded frame — a true grabpass, zero texture uploads. Slots after gradePass,
   before caPass: drops refract the graded world and still receive the lens
   fringe. Fetched ONLY on the high tier with the gate ON — LITE/reduced never
   load this module (HALO_GATE discipline).
   RESTRAINT LAWS (harness-pinned by value):
   - DROP_COUNT <= 200 (the GLSL define below is the pinned source of truth;
     the JS DROP_COUNT const must stay equal).
   - uCoverageMax <= 0.05: the spec's "spawn throttles against the running
     coverage sum" is enforced BY CONSTRUCTION — a GPU-side running sum needs a
     readback/reduction, so instead every radius is clamped to
     rMax = sqrt(0.9 * uCoverageMax * min(aspect,2) / (DROP_COUNT * PI)), which
     bounds the worst-case iso-surface footprint (SUPPORT 2.2 / ISO 0.5 puts
     the visible edge at ~1.0 r) at <= 0.9 * uCoverageMax of frame area for
     every aspect. coverage() below is the QA readback that proves it live.
   - 0.22 luma clamp: a drop may never ADD more luminance over the base frame
     than the 2D bead's 0.22-alpha lens sample was allowed (v3.1f law, GPU form). */

import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

const SIM_SIZE = 64;        // sim texture is 64×64; only the first DROP_COUNT texels live
const DROP_COUNT = 200;     // MUST equal the GLSL "#define DROP_COUNT" below (pinned there)

const SIM_FRAG = `
  // texel: x = screen u [0,1], y = screen v [0,1] (GL: 0 = bottom),
  // z = vy while running (respawn countdown in s while dead),
  // w = radius as a fraction of frame height (0 = dead)
  uniform float uDt;
  uniform float uTime;
  uniform float uSpawn;        // sceneState.rain presence (0..1) gates respawn
  uniform float uCoverageMax;  // PINNED <= 0.05 — footprint bound, enforced via rMax
  uniform float uAspect;

  #define DROP_COUNT 200
  #define PI 3.14159265359

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    float idx = floor(gl_FragCoord.y) * resolution.x + floor(gl_FragCoord.x);
    vec4 d = texture2D(textureDrops, uv);
    if (idx >= float(DROP_COUNT)) { gl_FragColor = vec4(0.0); return; }

    // Coverage law: iso footprint sits at ~1.0 r, so total coverage
    // <= DROP_COUNT * PI * rMax^2 / uAspect <= 0.9 * uCoverageMax, every aspect.
    float rMax = sqrt(0.9 * uCoverageMax * min(uAspect, 2.0) / (float(DROP_COUNT) * PI));
    float rMin = 0.18 * rMax;
    float hSeed = hash(idx * 7.13);

    if (d.w <= 0.0) {                        // DEAD: countdown, then rain-gated respawn
      d.z -= uDt;
      if (d.z <= 0.0 && uSpawn > 0.05) {
        d.x = 0.04 + 0.92 * hash(idx * 3.7 + floor(uTime * 4.0));
        d.y = 0.25 + 0.73 * hash(idx * 9.1 + floor(uTime * 4.0) * 1.3);
        d.w = rMax * (0.30 + 0.35 * hash(idx * 12.9898 + floor(uTime * 7.0)));
        d.z = 0.0;                           // sitting
      }
      gl_FragColor = d; return;
    }

    if (d.z <= 0.0) {                        // SITTING: condense toward burst
      d.w = min(d.w + uDt * rMax * (0.010 + 0.020 * hSeed), rMax);
      if (d.w >= rMax * (0.62 + 0.36 * hSeed)) d.z = 0.008;   // burst: the run begins
    } else {                                 // RUNNING: hang-and-burst stick/slip
      float episode = hash(idx * 31.7 + floor(uTime * (0.7 + 0.8 * hSeed)));
      if (episode < 0.38) d.z *= pow(0.001, uDt);             // hang: stall hard
      else d.z = min(d.z + uDt * 0.35, 0.55);                 // burst: gravity pulls
      d.y -= d.z * uDt;                                       // run DOWN the glass
      d.x += sin(uTime * (3.0 + 4.0 * hSeed) + idx) * 0.012 * uDt * step(0.02, d.z);
      d.w -= uDt * rMax * 0.045;                              // shed mass / evaporate
    }

    // collision-merge: the larger absorbs, area-conserving; the survivor
    // briefly accelerates (the M3 idiom, GPU-side). Deterministic tie-break.
    for (int j = 0; j < DROP_COUNT; j++) {
      if (float(j) == idx) continue;
      vec2 juv = (vec2(mod(float(j), resolution.x), floor(float(j) / resolution.x)) + 0.5) / resolution.xy;
      vec4 o = texture2D(textureDrops, juv);
      if (o.w <= 0.0) continue;
      vec2 dd = (o.xy - d.xy) * vec2(uAspect, 1.0);
      if (length(dd) < 0.75 * (d.w + o.w)) {
        if (d.w > o.w || (d.w == o.w && idx < float(j))) {
          d.w = min(rMax, sqrt(d.w * d.w + o.w * o.w));   // absorb: area-conserving, rMax-clamped
          d.z = max(d.z, 0.03);                            // survivor jolts forward
        } else {
          d.w = 0.0; d.z = 2.0 + 6.0 * hash(idx + uTime);  // absorbed: die, queue respawn
          gl_FragColor = d; return;
        }
      }
    }

    if (d.y < -0.04 || d.w < rMin) { d.w = 0.0; d.z = 2.0 + 6.0 * hash(idx * 1.7 + uTime); }
    gl_FragColor = d;
  }
`;

const SPLAT_VERT = `
  attribute float aId;
  uniform sampler2D uDrops;
  uniform float uAspect;
  varying vec2 vP;               // kernel space, units of r; support radius SUPPORT
  #define SIM_W 64.0
  #define SUPPORT 2.2
  void main() {
    vec2 juv = (vec2(mod(aId, SIM_W), floor(aId / SIM_W)) + 0.5) / SIM_W;
    vec4 d = texture2D(uDrops, juv);
    vP = position.xy * SUPPORT;
    if (d.w <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }   // dead: degenerate, no fragments
    vec2 halfExt = vec2(d.w * SUPPORT / uAspect, d.w * SUPPORT);  // r is a height-fraction; x aspect-corrected
    vec2 c = d.xy * 2.0 - 1.0;
    gl_Position = vec4(c + position.xy * halfExt * 2.0, 0.0, 1.0);
  }
`;

const SPLAT_FRAG = `
  varying vec2 vP;
  #define SUPPORT 2.2
  void main() {
    float d2 = dot(vP, vP) / (SUPPORT * SUPPORT);
    if (d2 >= 1.0) discard;
    float k = 1.0 - d2;
    gl_FragColor = vec4(k * k * k, 0.0, 0.0, 1.0);   // Wyvill metaball kernel, additive — sums = menisci
  }
`;

const PASS_FRAG = `
  uniform sampler2D tDiffuse;
  uniform sampler2D tField;
  uniform vec2 uTexel;        // 1 / field-target size
  uniform float uRefract;     // refraction offset scale; taste-tune DOWN only
  varying vec2 vUv;
  const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
  #define ISO 0.5
  void main() {
    vec4 base = texture2D(tDiffuse, vUv);
    float h = texture2D(tField, vUv).r;
    if (h < ISO) { gl_FragColor = base; return; }   // outside every meniscus: frame untouched
    float hx = texture2D(tField, vUv + vec2(uTexel.x, 0.0)).r - texture2D(tField, vUv - vec2(uTexel.x, 0.0)).r;
    float hy = texture2D(tField, vUv + vec2(0.0, uTexel.y)).r - texture2D(tField, vUv - vec2(0.0, uTexel.y)).r;
    vec2 grad = vec2(hx, hy);
    float edge = smoothstep(ISO, ISO + 0.18, h);           // soft meniscus rim
    vec2 offs = -grad * uRefract * edge;                    // lens: sample away from the thick centre
    vec3 refr = texture2D(tDiffuse, clamp(vUv + offs, vec2(0.001), vec2(0.999))).rgb;
    refr = mix(vec3(dot(refr, LUMA)), refr, 0.5) * 0.9;     // v3.2l worn-glass law carried into GLSL: saturate(0.5) brightness(0.9)
    vec3 col = mix(base.rgb, refr, edge);
    col += vec3(0.92, 0.98, 1.0) * 0.14 * edge * pow(clamp(0.5 - hy * 10.0, 0.0, 1.0), 4.0);  // upper-rim glint
    // THE LAW (0.22 glint clamp, GPU form): added luma over the base frame is
    // capped at 0.22 x the refracted sample's luma — a drop over the black
    // void can never read as a bright smudge (the v3.1f failure).
    float lBase = dot(base.rgb, LUMA);
    float lRefr = dot(refr, LUMA);
    float lOut  = dot(col, LUMA);
    float lCap  = lBase + 0.22 * lRefr;
    if (lOut > lCap) col *= lCap / max(lOut, 1e-4);
    gl_FragColor = vec4(col, base.a);   // centre-tap alpha — the caPass convention
  }
`;

export function initRivulet({ renderer, finalComposer, caPass, sceneState }) {
  const gpuCompute = new GPUComputationRenderer(SIM_SIZE, SIM_SIZE, renderer);
  const tex0 = gpuCompute.createTexture();
  const data = tex0.image.data;
  for (let i = 0; i < DROP_COUNT; i++) {   // stagger the first condensation wave
    data[i * 4 + 0] = Math.random();
    data[i * 4 + 1] = Math.random();
    data[i * 4 + 2] = 0.5 + i * 0.04 + Math.random();   // respawn countdown (s)
    data[i * 4 + 3] = 0;                                 // dead until the countdown lands
  }
  const dropsVar = gpuCompute.addVariable('textureDrops', SIM_FRAG, tex0);
  gpuCompute.setVariableDependencies(dropsVar, [dropsVar]);
  const simU = dropsVar.material.uniforms;
  simU.uDt = { value: 0 };
  simU.uTime = { value: 0 };
  simU.uSpawn = { value: 0 };
  simU.uCoverageMax = { value: 0.05 };   // PINNED by value (harness v3.3f) — never raise
  simU.uAspect = { value: 1 };
  const err = gpuCompute.init();
  if (err !== null) {
    console.warn('[scene] rivulet sim init failed — desktop glass off this session:', err);
    return null;
  }

  const sizeV = new THREE.Vector2();
  renderer.getSize(sizeV);
  const fieldRT = new THREE.WebGLRenderTarget(
    Math.max(2, Math.ceil(sizeV.x / 2)), Math.max(2, Math.ceil(sizeV.y / 2)),
    { type: THREE.HalfFloatType, format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });

  const quad = new THREE.PlaneGeometry(2, 2);
  const inst = new THREE.InstancedBufferGeometry();
  inst.index = quad.index;
  inst.setAttribute('position', quad.attributes.position);
  inst.setAttribute('uv', quad.attributes.uv);
  const ids = new Float32Array(DROP_COUNT);
  for (let i = 0; i < DROP_COUNT; i++) ids[i] = i;
  inst.setAttribute('aId', new THREE.InstancedBufferAttribute(ids, 1));
  inst.instanceCount = DROP_COUNT;
  const splatMat = new THREE.ShaderMaterial({
    uniforms: { uDrops: { value: null }, uAspect: { value: 1 } },
    vertexShader: SPLAT_VERT, fragmentShader: SPLAT_FRAG,
    blending: THREE.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false,
  });
  const splatMesh = new THREE.Mesh(inst, splatMat);
  splatMesh.frustumCulled = false;
  const fieldScene = new THREE.Scene();
  fieldScene.add(splatMesh);
  const fieldCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const pass = new ShaderPass(new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      tField:   { value: fieldRT.texture },
      uTexel:   { value: new THREE.Vector2(1 / fieldRT.width, 1 / fieldRT.height) },
      uRefract: { value: 0.05 },   // taste constant, tune DOWN only (fringe artifacts); not a law value
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: PASS_FRAG,
  }));
  pass.material.blending = THREE.NoBlending;   // overwrite the ping-pong target (house convention)
  finalComposer.insertPass(pass, finalComposer.passes.indexOf(caPass));   // after gradePass, before caPass

  const prevClear = new THREE.Color();
  const api = {
    pass,
    enabled: true,
    setEnabled(on) { api.enabled = !!on; pass.enabled = !!on; },   // perf-true off: update() also early-returns
    sim: simU,
    update(dt) {
      if (!api.enabled) return;
      renderer.getSize(sizeV);
      const fw = Math.max(2, Math.ceil(sizeV.x / 2)), fh = Math.max(2, Math.ceil(sizeV.y / 2));
      if (fieldRT.width !== fw || fieldRT.height !== fh) {
        fieldRT.setSize(fw, fh);
        pass.material.uniforms.uTexel.value.set(1 / fw, 1 / fh);
      }
      const aspect = sizeV.x / Math.max(1, sizeV.y);
      simU.uAspect.value = aspect;
      splatMat.uniforms.uAspect.value = aspect;
      simU.uDt.value = Math.min(dt, 0.05);
      simU.uTime.value += dt;
      simU.uSpawn.value = sceneState.rain;
      gpuCompute.compute();
      splatMat.uniforms.uDrops.value = gpuCompute.getCurrentRenderTarget(dropsVar).texture;
      const prevRT = renderer.getRenderTarget();
      renderer.getClearColor(prevClear);
      const prevAlpha = renderer.getClearAlpha();
      renderer.setRenderTarget(fieldRT);
      renderer.setClearColor(0x000000, 0);
      renderer.render(fieldScene, fieldCam);          // autoClear wipes the target to transparent black first
      renderer.setRenderTarget(prevRT);
      renderer.setClearColor(prevClear, prevAlpha);
    },
    coverage() {   // QA readback (NEVER called per-frame): iso-footprint fraction of frame area
      const rt = gpuCompute.getCurrentRenderTarget(dropsVar);
      const buf = new Float32Array(SIM_SIZE * SIM_SIZE * 4);
      renderer.readRenderTargetPixels(rt, 0, 0, SIM_SIZE, SIM_SIZE, buf);
      renderer.getSize(sizeV);
      const aspect = sizeV.x / Math.max(1, sizeV.y);
      let s = 0;
      for (let i = 0; i < DROP_COUNT; i++) { const r = buf[i * 4 + 3]; s += Math.PI * r * r / aspect; }
      return s;
    },
  };
  // Plain-URL A/B + kill lever (luminance captures are banned from ?sceneDebug=1
  // — the overlay changes pixels). House precedent: __sceneWarp/__sceneFocus are
  // unconditional globals; THIS one exists only when the gate is on and the
  // module actually loaded, so HALO_GATE discipline holds.
  window.__rivulet = api;
  return api;
}
