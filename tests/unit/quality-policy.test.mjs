import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyTier,
  createFpsDemoter,
  estimatePostFxBytes,
  DEMOTE_BELOW_FPS,
  DESKTOP_LITE_THRESHOLD_MS,
  INCAPABLE_PROBE_REASONS,
  RICH_THRESHOLD_MS
} from '../../js/quality-policy.mjs';
import { resolveTier } from '../../js/gpu-probe.mjs';

test('reduced wins, and a narrow viewport is lite whatever the machine can do', () => {
  assert.equal(classifyTier({ reduced: true, coarse: true, small: true, forced: 'rich', probeTier: 'mobile-rich', score: 1 }), 'reduced');
  assert.equal(classifyTier({ reduced: false, coarse: false, small: true, forced: null, probeTier: null, score: 1 }), 'lite');
});

/* Desktop carries the locked art direction. It may only lose it when the probe
   reports that a trivial GPU workload did not finish at all — never because the
   machine merely measured slower than the phone-rich bar, and never from any
   form of device identity. */
test('desktop keeps the locked profile unless the probe could not complete', () => {
  const desktop = { reduced: false, coarse: false, small: false, forced: null };

  assert.equal(classifyTier({ ...desktop, probeReason: 'measured', score: 1 }), 'high');
  /* The phone bar is 4.5ms. Everything between it and the desktop ceiling is
     still 'high' — "slower than a good phone" is not "cannot render". */
  assert.equal(classifyTier({ ...desktop, probeReason: 'measured', score: 45 }), 'high');
  assert.equal(classifyTier({ ...desktop, probeReason: 'measured', score: DESKTOP_LITE_THRESHOLD_MS }), 'high');
  assert.ok(DESKTOP_LITE_THRESHOLD_MS >= 10 * RICH_THRESHOLD_MS, 'the ceiling must not collapse onto the phone bar');
  /* Past the ceiling the machine is rasterising in software: not slow, stopped. */
  assert.equal(classifyTier({ ...desktop, probeReason: 'measured', score: DESKTOP_LITE_THRESHOLD_MS + 0.01 }), 'lite');
  /* Coarse pointers keep their own, much stricter bar — the desktop ceiling
     must never leak into the phone decision. */
  assert.equal(classifyTier({ reduced: false, coarse: true, small: true, forced: null, probeReason: 'measured', score: 50 }), 'lite');
  /* probeTier is 'lite' for every non-rich outcome, so it must NOT be the
     signal here — reading it would demote most capable desktops. */
  assert.equal(classifyTier({ ...desktop, probeTier: 'lite', probeReason: 'measured', score: 9 }), 'high');
  assert.equal(classifyTier({ ...desktop, probeTier: 'lite', probeReason: 'cache', score: 9 }), 'high');
  /* No probe at all (module failed to load) is not evidence of incapacity. */
  assert.equal(classifyTier({ ...desktop, probeTier: undefined, probeReason: undefined, score: null }), 'high');

  for (const probeReason of INCAPABLE_PROBE_REASONS) {
    assert.equal(
      classifyTier({ ...desktop, probeTier: 'lite', probeReason, score: null }),
      'lite',
      `a desktop whose probe reported "${probeReason}" must not be handed the full scene`
    );
  }
  assert.deepEqual(INCAPABLE_PROBE_REASONS, ['no-webgl2', 'error', 'budget']);
});

/* The desktop rescue is the watchdog, not a boot-time probe: the live session is
   demoted after four sustained seconds, and the verdict persists so the next
   load starts lite instead of spending four more seconds rediscovering it. */
test('a desktop demoted by the watchdog starts its next load lite', () => {
  const desktop = { reduced: false, coarse: false, small: false, forced: null };
  assert.equal(classifyTier({ ...desktop, probeTier: 'lite', probeReason: 'cache', probeDemoted: true }), 'lite');
  /* Only a demotion counts. A plain cached 'lite' — a phone-tier measurement
     from a hybrid device that reported a coarse pointer earlier in the session
     — says nothing about this machine as a desktop. */
  assert.equal(classifyTier({ ...desktop, probeTier: 'lite', probeReason: 'cache', probeDemoted: false, score: 7.5 }), 'high');
  /* And a demoted desktop cannot be talked back up by a fast score. */
  assert.equal(classifyTier({ ...desktop, probeReason: 'measured', probeDemoted: true, score: 1 }), 'lite');
});

test('the watchdog bar is far lower for the locked desktop profile than for an earned promotion', () => {
  assert.deepEqual(DEMOTE_BELOW_FPS, { 'mobile-rich': 45, high: 20 });
  /* 'lite' and 'reduced' are the floor: nothing below to demote to, so they are
     not watched at all, and background.js keys the whole watchdog off this. */
  assert.equal(DEMOTE_BELOW_FPS.lite, undefined);
  assert.equal(DEMOTE_BELOW_FPS.reduced, undefined);
  assert.ok(
    DEMOTE_BELOW_FPS.high < DEMOTE_BELOW_FPS['mobile-rich'],
    'demoting the locked art direction must need worse evidence than surrendering a promotion'
  );
});

test('the desktop override is reachable by explicit request for local verification', () => {
  const desktop = { reduced: false, coarse: false, small: false, probeReason: 'measured', score: 1 };
  assert.equal(classifyTier({ ...desktop, forced: 'lite' }), 'lite');
  assert.equal(classifyTier({ ...desktop, forced: 'rich' }), 'high');
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

test('mobile-rich attachment estimate crosses the 128 MiB boundary between adjacent rows', () => {
  const profile = { width: 430, dpr: 1.75, finalSamples: 2, bloomSamples: 0, bloomScale: 0.5 };
  const atBoundary = estimatePostFxBytes({ ...profile, height: 1887 });
  const overBoundary = estimatePostFxBytes({ ...profile, height: 1888 });
  assert.equal(atBoundary, 134186929);
  assert.equal(overBoundary, 134258040);
  assert.ok(atBoundary <= 128 * 1024 * 1024, `${atBoundary} should fit the budget`);
  assert.ok(overBoundary > 128 * 1024 * 1024, `${overBoundary} should breach the budget`);
});

/* The second argument is an absolute clock in seconds, so a run is written as
   the timestamps at which frames were actually presented. */
function run(demoter, fps, from, to, step) {
  for (let at = from; at <= to + 1e-9; at += step) demoter.sample(fps, at);
}

test('demoter fires once after four sustained low-fps seconds and resets on recovery', () => {
  let calls = 0;
  const d = createFpsDemoter({ threshold: 45, holdSeconds: 4, onDemote: () => calls++ });
  run(d, 40, 0, 3.9, 0.1);
  assert.equal(calls, 0, 'must not fire before the window closes');
  d.sample(50, 4.0);                       // one good frame abandons the streak
  assert.equal(d.lowSeconds, 0);
  run(d, 40, 4.1, 7.9, 0.1);
  assert.equal(calls, 0, 'the recovered frame must have restarted the window');
  run(d, 40, 8.0, 8.3, 0.1);
  assert.equal(calls, 1);
  assert.equal(d.demoted, true);
  run(d, 20, 9, 30, 0.1);                  // one-way: never fires again
  assert.equal(calls, 1);
});

/* The v3.4b defect: a lost context resumes the loop with one frame carrying the
   whole missing interval. Counting that interval satisfied a four-second rule
   outright, so a single context loss — what mobile Safari does under memory
   pressure — permanently demoted any device for the session. */
test('an interval too long to be a frame restarts the window instead of filling it', () => {
  let calls = 0;
  const d = createFpsDemoter({ threshold: 45, holdSeconds: 4, onDemote: () => calls++ });
  run(d, 30, 0, 3.5, 0.1);                 // already a long low streak...
  d.sample(30, 13.5);                      // ...then a 10s gap: the loop was not running
  assert.equal(calls, 0, 'a suspension must contribute nothing, even mid-streak');
  assert.equal(d.lowSeconds, 0);
  run(d, 30, 13.6, 17.4, 0.1);             // 3.9s of real frames after the gap
  assert.equal(calls, 0);
  run(d, 30, 17.5, 17.6, 0.1);
  assert.equal(calls, 1, 'the window must still close on genuinely sustained low FPS');
});

/* The gap threshold must clear the slowest REAL frame, or it re-creates the
   defect it replaced. Measured: a desktop presenting this scene at 1.3fps —
   770ms between frames — restarted its window on almost every sample under a
   1s gap and could never be rescued, while a 48fps machine was rescued in four
   seconds. Slower device, later rescue: exactly backwards, again. */
function rescuedAt(fps, options = {}) {
  let at = null;
  let last = null;
  const d = createFpsDemoter({ threshold: 45, holdSeconds: 4, ...options, onDemote: () => { at = last; } });
  for (let frame = 0; frame <= Math.ceil(20 * fps); frame++) { last = frame / fps; d.sample(10, last); }
  return at;
}

test('a device rendering seconds per frame is still rescued', () => {
  /* 0.5fps means two-second frames. These rates are the whole point: they are
     the ones a 1s gap threshold silently abandoned, and they must be inside the
     rule, not outside it. */
  for (const fps of [0.5, 0.8, 1.3, 2, 5, 30]) {
    const at = rescuedAt(fps);
    assert.ok(at !== null, `${fps}fps was never rescued`);
    assert.ok(at <= 4 + 2 / fps, `${fps}fps was rescued at ${at}s, later than the four-second rule allows`);
  }
  /* And the discrimination that matters: the previous 1s threshold fails these
     outright, so this test cannot pass by accident if the constant regresses. */
  assert.equal(rescuedAt(0.5, { maxGapSeconds: 1 }), null);
  assert.equal(rescuedAt(0.8, { maxGapSeconds: 1 }), null);
});

/* Stated as a boundary rather than hidden: below one frame per maxGapSeconds
   every sample restarts the window, so the watchdog stops firing. That is the
   unavoidable cost of using the same signal to reject suspensions, and such a
   device is past what a tier change would rescue. */
test('the rescue has a documented floor at one frame per gap threshold', () => {
  assert.ok(rescuedAt(1 / 3 + 0.05) !== null, 'just inside the floor must still be rescued');
  assert.equal(rescuedAt(1 / 3 - 0.05), null, 'past the floor the watchdog knowingly stops');
});

/* The regression this replaced: clamping each delta to 250ms made four seconds
   mean sixteen frames, so a device at 3fps was rescued LATER than one at 60fps
   — and a CI runner that managed 14 frames in 4.3s was never rescued at all.
   Demotion must depend on elapsed time, not on how many frames fit in it. */
test('the hold is wall-clock, so a slow device demotes no later than a fast one', () => {
  const fire = () => { let at = null; return { at, mark: t => { if (at === null) at = t; }, get value() { return at; } }; };
  const observed = [60, 30, 6, 3.3].map(fps => {
    const seen = fire();
    let last = null;
    const d = createFpsDemoter({ threshold: 45, holdSeconds: 4, onDemote: () => seen.mark(last) });
    for (let frame = 0; frame <= Math.ceil(6 * fps); frame++) { last = frame / fps; d.sample(20, last); }
    return { fps, at: seen.value };
  });
  for (const { fps, at } of observed) {
    assert.ok(at !== null, `${fps}fps never demoted`);
    assert.ok(at < 4 + 2 / fps, `${fps}fps demoted at ${at}s, later than the four-second rule allows`);
  }
});

function makeProbeHarness({ throwOnRead = null, readMs = 4, failOnCreate = null } = {}) {
  let clock = 0;
  let readCalls = 0;
  let canvasCreates = 0;
  let contextRequests = 0;
  let yieldedFrames = 0;
  let rainDrawCalls = 0;
  let blurDrawCalls = 0;
  const cacheWrites = [];
  const eventLog = [];
  const resourceTypes = ['shader', 'program', 'buffer', 'texture', 'framebuffer'];
  const createAttempts = Object.fromEntries(resourceTypes.map(type => [type, 0]));
  const created = Object.fromEntries(resourceTypes.map(type => [type, []]));
  const deletions = [];

  const makeResource = type => {
    const attempt = ++createAttempts[type];
    if (failOnCreate?.type === type && failOnCreate.attempt === attempt) {
      eventLog.push({ type: 'create-failed', resourceType: type, attempt });
      return null;
    }
    const resource = Object.freeze({ type, id: attempt });
    created[type].push(resource);
    eventLog.push({ type: 'create', resourceType: type, resource });
    return resource;
  };

  const recordDelete = (resourceType, resource) => {
    const deletion = { type: 'delete', resourceType, resource };
    deletions.push(deletion);
    eventLog.push(deletion);
  };

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
    drawArraysInstanced() {
      rainDrawCalls++;
      eventLog.push({ type: 'draw-rain' });
    },
    drawArrays() {
      blurDrawCalls++;
      eventLog.push({ type: 'draw-blur' });
    },
    readPixels() {
      readCalls++;
      eventLog.push({ type: 'readback', call: readCalls });
      clock += readMs;
      if (readCalls === throwOnRead) throw new Error('injected readPixels failure');
    },
    deleteShader(resource) { recordDelete('shader', resource); },
    deleteProgram(resource) { recordDelete('program', resource); },
    deleteBuffer(resource) { recordDelete('buffer', resource); },
    deleteTexture(resource) { recordDelete('texture', resource); },
    deleteFramebuffer(resource) { recordDelete('framebuffer', resource); },
    getExtension(name) {
      if (name !== 'WEBGL_lose_context') return null;
      return { loseContext() { eventLog.push({ type: 'lose-context' }); } };
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
      eventLog.push({ type: 'yield', frame: yieldedFrames });
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
      rainDrawCalls,
      blurDrawCalls,
      readCalls,
      created: Object.fromEntries(resourceTypes.map(type => [type, [...created[type]]])),
      deletions: [...deletions],
      eventLog: [...eventLog]
    })
  };
}

function assertFullyCleaned(snapshot, expectedCreated) {
  assert.deepEqual(
    Object.fromEntries(Object.entries(snapshot.created).map(([type, resources]) => [type, resources.length])),
    expectedCreated
  );

  const allCreated = Object.entries(snapshot.created)
    .flatMap(([resourceType, resources]) => resources.map(resource => ({ resourceType, resource })));
  assert.equal(snapshot.deletions.length, allCreated.length, 'every deletion must correspond to one created resource');
  for (const { resourceType, resource } of allCreated) {
    const matching = snapshot.deletions.filter(deletion => deletion.resource === resource);
    assert.equal(matching.length, 1, `${resourceType} ${resource.id} must be deleted exactly once`);
    assert.equal(matching[0].resourceType, resourceType, `${resourceType} ${resource.id} used the wrong delete method`);
  }

  const loseIndices = snapshot.eventLog
    .map((event, index) => event.type === 'lose-context' ? index : -1)
    .filter(index => index >= 0);
  assert.equal(loseIndices.length, 1, 'context must be lost exactly once');
  const loseIndex = loseIndices[0];
  const deleteIndices = snapshot.eventLog
    .map((event, index) => event.type === 'delete' ? index : -1)
    .filter(index => index >= 0);
  assert.equal(deleteIndices.length, allCreated.length);
  assert.ok(deleteIndices.every(index => index < loseIndex), 'all deletes must happen before loseContext');
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
  assert.equal(snapshot.rainDrawCalls, 12);
  assert.equal(snapshot.blurDrawCalls, 48);
  assert.equal(snapshot.yieldedFrames, 11);
  assertFullyCleaned(snapshot, { shader: 4, program: 2, buffer: 1, texture: 2, framebuffer: 2 });
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
  assert.equal(snapshot.rainDrawCalls, 3);
  assert.equal(snapshot.blurDrawCalls, 12);
  assert.equal(snapshot.yieldedFrames, 2);
  assertFullyCleaned(snapshot, { shader: 4, program: 2, buffer: 1, texture: 2, framebuffer: 2 });
  /* v3.4e: only a MEASUREMENT is cached. This is a failure path (thrown
     readPixels / allocation failure), and its verdict describes a transient
     condition rather than the hardware — so caching it would pin the session on
     evidence that is not about the device. The probe simply re-measures next
     navigation. */
  assert.equal(snapshot.cacheWrites.length, 0);
});

test('partial target allocation failure deletes only already-created resources with their matching methods', async () => {
  const harness = makeProbeHarness({ failOnCreate: { type: 'texture', attempt: 2 } });

  const result = await resolveTier(harness.env);
  const snapshot = harness.snapshot();

  assert.deepEqual(result, {
    tier: 'lite',
    score: null,
    forced: false,
    reason: 'error',
    cleaned: true
  });
  assert.equal(snapshot.readCalls, 0);
  assert.equal(snapshot.rainDrawCalls, 0);
  assert.equal(snapshot.blurDrawCalls, 0);
  assert.equal(snapshot.yieldedFrames, 0);
  assertFullyCleaned(snapshot, { shader: 4, program: 2, buffer: 1, texture: 1, framebuffer: 1 });
  /* v3.4e: transient verdicts are not cached — see the note above. */
  assert.equal(snapshot.cacheWrites.length, 0);
});

test('reduced motion resolves to null having read nothing at all', async () => {
  assert.equal(await resolveTier({
    reduced: () => true,
    coarse: () => { throw new Error('coarse query must not run'); },
    forced: () => { throw new Error('forced override must not be read'); },
    cacheRead: () => { throw new Error('cache must not be read'); },
    cacheWrite: () => { throw new Error('cache must not be written'); },
    createCanvas: () => { throw new Error('canvas must not be created'); }
  }), null);
});

/* v3.4h changed this contract deliberately. A fine pointer now reads the two
   cheap sources — the URL override and the session cache — because that is how
   a desktop demoted by the sustained-FPS watchdog starts its next load already
   lite. What it must still never do is MEASURE: probing a desktop would put
   ~200ms of GPU work on a critical path whose LCP is already over budget. */
test('a fine pointer reads only the cheap sources and never measures', async () => {
  let cacheReads = 0;
  const common = {
    reduced: () => false,
    coarse: () => false,
    forced: () => null,
    cacheWrite: () => { throw new Error('a fine pointer must not write the cache'); },
    createCanvas: () => { throw new Error('a fine pointer must never probe'); }
  };

  assert.equal(await resolveTier({ ...common, cacheRead: () => { cacheReads++; return null; } }), null);
  assert.equal(cacheReads, 1, 'the cache must be consulted, since that is the whole point');

  /* The verdict a desktop is allowed to act on. */
  assert.deepEqual(
    await resolveTier({ ...common, cacheRead: () => ({ tier: 'lite', score: null, demoted: true }) }),
    { tier: 'lite', score: null, forced: false, reason: 'cache', demoted: true, cleaned: true }
  );
  /* And the one it is not: a phone-tier measurement says nothing about a
     desktop, so it must not arrive carrying a demotion. */
  assert.deepEqual(
    await resolveTier({ ...common, cacheRead: () => ({ tier: 'lite', score: 7.5 }) }),
    { tier: 'lite', score: 7.5, forced: false, reason: 'cache', demoted: false, cleaned: true }
  );
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
    tier: 'lite', score: 7.5, forced: false, reason: 'cache', demoted: false, cleaned: true
  });
  assert.equal(canvasCreates, 0);
});

test('valid cache hits normalize stale scores and discard untrusted fields', async () => {
  const cases = [
    {
      cached: { tier: 'mobile-rich' },
      expected: { tier: 'mobile-rich', score: null, forced: false, reason: 'cache', demoted: false, cleaned: true }
    },
    {
      cached: { tier: 'lite', score: Number.POSITIVE_INFINITY },
      expected: { tier: 'lite', score: null, forced: false, reason: 'cache', demoted: false, cleaned: true }
    },
    {
      cached: { tier: 'lite', score: '4.2' },
      expected: { tier: 'lite', score: null, forced: false, reason: 'cache', demoted: false, cleaned: true }
    },
    {
      cached: { tier: 'mobile-rich', score: 3.75, admin: true, reason: 'forged', cleaned: false },
      expected: { tier: 'mobile-rich', score: 3.75, forced: false, reason: 'cache', demoted: false, cleaned: true }
    },
    /* `demoted` is now read rather than discarded, so it has to be normalised
       like the rest: only a real boolean true counts. A desktop drops the
       locked art direction on this field, so a truthy string must not do it. */
    {
      cached: { tier: 'lite', score: null, demoted: 'yes' },
      expected: { tier: 'lite', score: null, forced: false, reason: 'cache', demoted: false, cleaned: true }
    },
    {
      cached: { tier: 'lite', score: null, demoted: true },
      expected: { tier: 'lite', score: null, forced: false, reason: 'cache', demoted: true, cleaned: true }
    }
  ];

  for (const { cached, expected } of cases) {
    const result = await resolveTier({
      reduced: () => false,
      coarse: () => true,
      forced: () => null,
      cacheRead: () => cached,
      createCanvas: () => { throw new Error('valid cache hit must not create a canvas'); }
    });
    assert.deepEqual(result, expected);
  }
});

test('invalid cached tiers do not bypass the measured probe', async () => {
  const harness = makeProbeHarness();

  const result = await resolveTier({
    ...harness.env,
    cacheRead: () => ({ tier: 'high', score: 1, injected: true })
  });

  assert.equal(result.reason, 'measured');
  assert.equal(harness.snapshot().canvasCreates, 1);
});
