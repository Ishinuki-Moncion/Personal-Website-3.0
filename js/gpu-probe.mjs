import { RICH_THRESHOLD_MS } from './quality-policy.mjs?v=3';

const CACHE_KEY = 'v34.tierProbe';
const FRAMES = 10;
const WARMUP = 2;
const BUDGET_MS = 1500;

const VERTEX_RAIN = `#version 300 es
  precision highp float;
  uniform float uSeed;
  const vec2 QUAD[6] = vec2[6](
    vec2(-1.0, -1.0), vec2(1.0, -1.0), vec2(-1.0, 1.0),
    vec2(-1.0, 1.0), vec2(1.0, -1.0), vec2(1.0, 1.0)
  );
  void main() {
    float k = float(gl_InstanceID);
    vec2 center = vec2(
      fract(sin(k * 12.9898 + uSeed) * 43758.5453),
      fract(sin(k * 78.2330 + uSeed) * 43758.5453)
    ) * 2.0 - 1.0;
    vec2 streak = QUAD[gl_VertexID] * vec2(0.0035, 0.055);
    gl_Position = vec4(center + streak, 0.0, 1.0);
  }`;

const FRAGMENT_RAIN = `#version 300 es
  precision highp float;
  out vec4 color;
  void main() { color = vec4(0.02, 0.08, 0.10, 0.04); }`;

const VERTEX_BLUR = `#version 300 es
  precision highp float;
  out vec2 vUv;
  const vec2 TRIANGLE[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  void main() {
    vec2 position = TRIANGLE[gl_VertexID];
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

const FRAGMENT_BLUR = `#version 300 es
  precision highp float;
  in vec2 vUv;
  uniform sampler2D uTex;
  uniform vec2 uDir;
  out vec4 color;
  void main() {
    color = texture(uTex, vUv) * 0.4;
    for (int tap = 1; tap <= 2; tap++) {
      color += texture(uTex, vUv + uDir * float(tap)) * 0.15;
      color += texture(uTex, vUv - uDir * float(tap)) * 0.15;
    }
  }`;

export async function resolveTier(env = browserEnv()) {
  if (env.reduced()) return null;
  if (!env.coarse()) return null;
  const forced = env.forced();
  if (forced) return { tier: forced === 'rich' ? 'mobile-rich' : 'lite', score: null, forced: true, reason: 'forced', cleaned: true };
  const cached = env.cacheRead(CACHE_KEY);
  if (cached?.tier === 'mobile-rich' || cached?.tier === 'lite') {
    return {
      tier: cached.tier,
      score: Number.isFinite(cached.score) ? cached.score : null,
      forced: false,
      reason: 'cache',
      cleaned: true
    };
  }
  let result;
  try { result = await runProbe(env); }
  catch { result = { tier: 'lite', score: null, forced: false, reason: 'error', cleaned: true }; }
  /* v3.4e: cache only a MEASUREMENT. `budget`, `error` and `no-webgl2` describe a
     transient condition, not the hardware — and the probe yields on
     requestAnimationFrame, which stops entirely while a tab is hidden. So
     backgrounding the tab for a moment during the ~200ms probe produced a
     `budget` timeout and pinned a capable iPhone to lite for the WHOLE session,
     including every subsequent navigation.

     That also made the owner calibration protocol unreliable: a packet could
     record lite for a device that never actually measured slow. Not caching a
     non-measurement means the next navigation simply measures again, which is
     the correct behaviour for a condition that has probably passed. A genuinely
     slow device still measures slow every time and still lands on lite. */
  if (result.reason === 'measured') env.cacheWrite(CACHE_KEY, result);
  return result;
}

function browserEnv() {
  return {
    reduced: () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarse: () => matchMedia('(hover: none), (pointer: coarse)').matches,
    forced() {
      const value = new URLSearchParams(location.search).get('tier');
      return value === 'rich' || value === 'lite' ? value : null;
    },
    cacheRead(key) {
      try { return JSON.parse(sessionStorage.getItem(key) || 'null'); }
      catch { return null; }
    },
    cacheWrite(key, value) {
      try { sessionStorage.setItem(key, JSON.stringify(value)); }
      catch { /* storage can be unavailable in privacy modes */ }
    },
    now: () => performance.now(),
    nextFrame: () => new Promise(resolve => requestAnimationFrame(resolve)),
    createCanvas() {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      return canvas;
    }
  };
}

async function runProbe(env) {
  let gl = null;
  let loseContext = null;
  let result = { tier: 'lite', score: null, forced: false, reason: 'no-webgl2', cleaned: false };
  const shaders = [];
  const programs = [];
  const buffers = [];
  const textures = [];
  const framebuffers = [];

  try {
    const canvas = env.createCanvas();
    canvas.width = 512;
    canvas.height = 512;
    gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance'
    });

    if (gl) {
      loseContext = gl.getExtension('WEBGL_lose_context');
      const rain = createProgram(gl, VERTEX_RAIN, FRAGMENT_RAIN, shaders, programs);
      const blur = createProgram(gl, VERTEX_BLUR, FRAGMENT_BLUR, shaders, programs);

      const buffer = retain(gl.createBuffer(), buffers, 'buffer');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      const targets = [
        createTarget(gl, textures, framebuffers),
        createTarget(gl, textures, framebuffers)
      ];
      const pixel = new Uint8Array(4);
      const times = [];
      const started = env.now();

      for (let iteration = 0; iteration < FRAMES + WARMUP; iteration++) {
        if (iteration > 0) await env.nextFrame();
        if (env.now() - started >= BUDGET_MS) {
          result = { tier: 'lite', score: null, forced: false, reason: 'budget', cleaned: false };
          break;
        }

        const frameStarted = env.now();
        drawRain(gl, rain, iteration);
        drawBlurPasses(gl, blur, targets);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        const frameFinished = env.now();

        if (frameFinished - started >= BUDGET_MS) {
          result = { tier: 'lite', score: null, forced: false, reason: 'budget', cleaned: false };
          break;
        }
        if (iteration >= WARMUP) times.push(frameFinished - frameStarted);
      }

      if (times.length === FRAMES) {
        const score = Math.round(median(times) * 100) / 100;
        result = {
          tier: score <= RICH_THRESHOLD_MS ? 'mobile-rich' : 'lite',
          score,
          forced: false,
          reason: 'measured',
          cleaned: false
        };
      }
    }
  } finally {
    if (gl) {
      deleteRetained(framebuffers, value => gl.deleteFramebuffer(value));
      deleteRetained(textures, value => gl.deleteTexture(value));
      deleteRetained(buffers, value => gl.deleteBuffer(value));
      deleteRetained(programs, value => gl.deleteProgram(value));
      deleteRetained(shaders, value => gl.deleteShader(value));
      try { loseContext?.loseContext(); } catch { /* cleanup is best effort */ }
    }
    result.cleaned = true;
  }

  return result;
}

function createProgram(gl, vertexSource, fragmentSource, shaders, programs) {
  const vertex = createShader(gl, gl.VERTEX_SHADER, vertexSource, shaders);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource, shaders);
  const program = retain(gl.createProgram(), programs, 'program');
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'GPU probe program link failed');
  }
  return program;
}

function createShader(gl, type, source, shaders) {
  const shader = retain(gl.createShader(type), shaders, 'shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || 'GPU probe shader compile failed');
  }
  return shader;
}

function createTarget(gl, textures, framebuffers) {
  const texture = retain(gl.createTexture(), textures, 'texture');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

  const framebuffer = retain(gl.createFramebuffer(), framebuffers, 'framebuffer');
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  return { texture, framebuffer };
}

function drawRain(gl, program, iteration) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, 512, 512);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.useProgram(program);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeed'), iteration);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 600);
}

function drawBlurPasses(gl, program, targets) {
  gl.disable(gl.BLEND);
  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, 'uTex'), 0);
  for (let pass = 0; pass < 4; pass++) {
    const destination = targets[pass % 2];
    const source = targets[(pass + 1) % 2];
    gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
    gl.viewport(0, 0, 256, 256);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, source.texture);
    gl.uniform2f(gl.getUniformLocation(program, 'uDir'), pass % 2 ? 0 : 1 / 256, pass % 2 ? 1 / 256 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

function retain(resource, collection, label) {
  if (!resource) throw new Error(`GPU probe could not create ${label}`);
  collection.push(resource);
  return resource;
}

function deleteRetained(collection, remove) {
  for (let index = collection.length - 1; index >= 0; index--) {
    try { remove(collection[index]); } catch { /* continue releasing the rest */ }
  }
}

function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}
