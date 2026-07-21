import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyTier,
  createFpsDemoter,
  estimatePostFxBytes
} from '../../js/quality-policy.mjs';
import { resolveTier } from '../../js/gpu-probe.mjs';

test('reduced wins and fine desktop never probes', () => {
  assert.equal(classifyTier({ reduced: true, coarse: true, small: true, forced: 'rich', probeTier: 'mobile-rich', score: 1 }), 'reduced');
  assert.equal(classifyTier({ reduced: false, coarse: false, small: false, forced: null, probeTier: 'lite', score: null }), 'high');
  assert.equal(classifyTier({ reduced: false, coarse: false, small: true, forced: null, probeTier: null, score: 1 }), 'lite');
});

test('coarse pointer earns rich only at the measured threshold', () => {
  assert.equal(classifyTier({ reduced: false, coarse: true, small: true, forced: null, probeTier: null, score: 4.5 }), 'mobile-rich');
  assert.equal(classifyTier({ reduced: false, coarse: true, small: true, forced: null, probeTier: null, score: 4.51 }), 'lite');
  assert.equal(classifyTier({ reduced: false, coarse: true, small: true, forced: 'rich', probeTier: null, score: null }), 'mobile-rich');
  assert.equal(classifyTier({ reduced: false, coarse: true, small: true, forced: null, probeTier: 'lite', score: 1 }), 'lite');
});

test('mobile-rich attachment estimate stays below 128 MiB at the largest phone gate', () => {
  const bytes = estimatePostFxBytes({ width: 430, height: 932, dpr: 1.75, finalSamples: 2, bloomSamples: 0, bloomScale: 0.5 });
  assert.ok(bytes <= 128 * 1024 * 1024, `${bytes} exceeds budget`);
});

test('demoter fires once after four cumulative low-fps seconds and resets on recovery', () => {
  let calls = 0;
  const d = createFpsDemoter({ threshold: 45, holdSeconds: 4, onDemote: () => calls++ });
  d.sample(40, 2); d.sample(50, 1); d.sample(40, 3.9);
  assert.equal(calls, 0);
  d.sample(40, 0.1); d.sample(20, 10);
  assert.equal(calls, 1);
  assert.equal(d.demoted, true);
});

function makeProbeHarness({ throwOnRead = null, readMs = 4 } = {}) {
  let clock = 0;
  let readCalls = 0;
  let canvasCreates = 0;
  let contextRequests = 0;
  let yieldedFrames = 0;
  let loseContextCalls = 0;
  let drawCalls = 0;
  const cacheWrites = [];
  const created = { shader: 0, program: 0, buffer: 0, texture: 0, framebuffer: 0 };
  const deleted = { shader: 0, program: 0, buffer: 0, texture: 0, framebuffer: 0 };

  const makeResource = type => ({ type, id: ++created[type] });
  const gl = {
    VERTEX_SHADER: 0x8B31,
    FRAGMENT_SHADER: 0x8B30,
    COMPILE_STATUS: 0x8B81,
    LINK_STATUS: 0x8B82,
    ARRAY_BUFFER: 0x8892,
    STATIC_DRAW: 0x88E4,
    FLOAT: 0x1406,
    TEXTURE_2D: 0x0DE1,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    LINEAR: 0x2601,
    CLAMP_TO_EDGE: 0x812F,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    FRAMEBUFFER: 0x8D40,
    COLOR_ATTACHMENT0: 0x8CE0,
    TRIANGLES: 0x0004,
    TRIANGLE_STRIP: 0x0005,
    BLEND: 0x0BE2,
    ONE: 1,
    TEXTURE0: 0x84C0,
    createShader: () => makeResource('shader'),
    shaderSource() {},
    compileShader() {},
    getShaderParameter: () => true,
    getShaderInfoLog: () => '',
    createProgram: () => makeResource('program'),
    attachShader() {},
    linkProgram() {},
    getProgramParameter: () => true,
    getProgramInfoLog: () => '',
    createBuffer: () => makeResource('buffer'),
    bindBuffer() {},
    bufferData() {},
    createTexture: () => makeResource('texture'),
    activeTexture() {},
    bindTexture() {},
    texParameteri() {},
    texImage2D() {},
    createFramebuffer: () => makeResource('framebuffer'),
    bindFramebuffer() {},
    framebufferTexture2D() {},
    viewport() {},
    useProgram() {},
    enableVertexAttribArray() {},
    vertexAttribPointer() {},
    getUniformLocation: () => ({}),
    uniform1i() {},
    uniform1f() {},
    uniform2f() {},
    enable() {},
    disable() {},
    blendFunc() {},
    drawArraysInstanced() { drawCalls++; },
    drawArrays() { drawCalls++; },
    readPixels() {
      readCalls++;
      clock += readMs;
      if (readCalls === throwOnRead) throw new Error('injected readPixels failure');
    },
    deleteShader() { deleted.shader++; },
    deleteProgram() { deleted.program++; },
    deleteBuffer() { deleted.buffer++; },
    deleteTexture() { deleted.texture++; },
    deleteFramebuffer() { deleted.framebuffer++; },
    getExtension(name) {
      if (name !== 'WEBGL_lose_context') return null;
      return { loseContext() { loseContextCalls++; } };
    }
  };

  const env = {
    reduced: () => false,
    coarse: () => true,
    forced: () => null,
    cacheRead: () => null,
    cacheWrite: (key, value) => cacheWrites.push({ key, value }),
    now: () => clock,
    async nextFrame() {
      yieldedFrames++;
      clock += 1;
    },
    createCanvas() {
      canvasCreates++;
      return {
        width: 0,
        height: 0,
        getContext(kind) {
          contextRequests++;
          assert.equal(kind, 'webgl2');
          return gl;
        }
      };
    }
  };

  return {
    env,
    snapshot: () => ({
      cacheWrites,
      canvasCreates,
      contextRequests,
      yieldedFrames,
      loseContextCalls,
      drawCalls,
      readCalls,
      created: { ...created },
      deleted: { ...deleted }
    })
  };
}

function assertFullyCleaned(snapshot) {
  assert.deepEqual(snapshot.deleted, snapshot.created);
  assert.ok(Object.values(snapshot.created).every(count => count > 0));
  assert.equal(snapshot.loseContextCalls, 1);
  assert.ok(snapshot.yieldedFrames > 0);
}

test('successful injected WebGL2 probe yields, measures rain and blur work, and deletes every resource', async () => {
  const harness = makeProbeHarness();

  const result = await resolveTier(harness.env);
  const snapshot = harness.snapshot();

  assert.deepEqual(result, {
    tier: 'mobile-rich',
    score: 4,
    forced: false,
    reason: 'measured',
    cleaned: true
  });
  assert.equal(snapshot.canvasCreates, 1);
  assert.equal(snapshot.contextRequests, 1);
  assert.equal(snapshot.readCalls, 12);
  assert.equal(snapshot.drawCalls, 60);
  assertFullyCleaned(snapshot);
  assert.equal(snapshot.cacheWrites.length, 1);
  assert.deepEqual(snapshot.cacheWrites[0].value, result);
});

test('thrown readPixels still yields, deletes every resource, loses context once, and reports cleaned', async () => {
  const harness = makeProbeHarness({ throwOnRead: 3 });

  const result = await resolveTier(harness.env);
  const snapshot = harness.snapshot();

  assert.deepEqual(result, {
    tier: 'lite',
    score: null,
    forced: false,
    reason: 'error',
    cleaned: true
  });
  assert.equal(snapshot.readCalls, 3);
  assertFullyCleaned(snapshot);
  assert.equal(snapshot.cacheWrites.length, 1);
  assert.deepEqual(snapshot.cacheWrites[0].value, result);
});

test('reduced and fine-pointer paths return null without canvas, cache, or probe work', async () => {
  let canvasCreates = 0;
  let cacheReads = 0;
  const common = {
    forced: () => { throw new Error('forced override must not be read'); },
    cacheRead: () => { cacheReads++; return null; },
    cacheWrite: () => { throw new Error('cache must not be written'); },
    createCanvas: () => { canvasCreates++; throw new Error('canvas must not be created'); }
  };

  assert.equal(await resolveTier({ ...common, reduced: () => true, coarse: () => { throw new Error('coarse query must not run'); } }), null);
  assert.equal(await resolveTier({ ...common, reduced: () => false, coarse: () => false }), null);
  assert.equal(canvasCreates, 0);
  assert.equal(cacheReads, 0);
});

test('forced and cached paths resolve without allocating WebGL resources', async () => {
  let canvasCreates = 0;
  const createCanvas = () => { canvasCreates++; throw new Error('canvas must not be created'); };

  assert.deepEqual(await resolveTier({
    reduced: () => false,
    coarse: () => true,
    forced: () => 'rich',
    cacheRead: () => { throw new Error('forced path must not read cache'); },
    createCanvas
  }), {
    tier: 'mobile-rich', score: null, forced: true, reason: 'forced', cleaned: true
  });

  assert.deepEqual(await resolveTier({
    reduced: () => false,
    coarse: () => true,
    forced: () => null,
    cacheRead: () => ({ tier: 'lite', score: 7.5 }),
    createCanvas
  }), {
    tier: 'lite', score: 7.5, forced: false, reason: 'cache', cleaned: true
  });
  assert.equal(canvasCreates, 0);
});
