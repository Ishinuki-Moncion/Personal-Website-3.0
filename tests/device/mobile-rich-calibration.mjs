const CACHE_KEY = 'v34.tierProbe';
const SAMPLE_COUNT = 5;
const requestedWindow = new URLSearchParams(location.search).get('fpsWindowMs');
const parsedWindow = requestedWindow === null ? NaN : Number(requestedWindow);
const FPS_WINDOW_MS = Number.isFinite(parsedWindow)
  ? Math.max(250, Math.min(15_000, parsedWindow))
  : 15_000;
const frame = document.querySelector('#site');
const runButton = document.querySelector('#run');
const clearButton = document.querySelector('#clear');
const copyButton = document.querySelector('#copy');
const exportButton = document.querySelector('#export');
const status = document.querySelector('#status');
const packetView = document.querySelector('#packet');
let packet = null;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const median = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

function setStatus(message) {
  status.textContent = message;
}

async function waitFor(check, timeout = 15_000) {
  const deadline = performance.now() + timeout;
  while (performance.now() < deadline) {
    const value = check();
    if (value) return value;
    await wait(50);
  }
  throw new Error('Calibration iframe did not become ready before timeout');
}

async function loadIndependentSample(index) {
  sessionStorage.removeItem(CACHE_KEY);
  frame.src = `/?sceneDebug=1&calibrationSample=${index}-${Date.now()}`;
  await new Promise((resolveLoad, rejectLoad) => {
    const timer = setTimeout(() => rejectLoad(new Error('Calibration iframe load timed out')), 15_000);
    frame.addEventListener('load', () => { clearTimeout(timer); resolveLoad(); }, { once: true });
  });
  const sample = await waitFor(() => {
    const probe = frame.contentWindow.__TIER_PROBE;
    const scene = frame.contentWindow.__SCENE_STATUS;
    if (!scene) return null;
    return probe || { tier: 'not-probed', score: null, reason: 'not-eligible', forced: false, cleaned: true };
  });
  const canvas = await waitFor(() => frame.contentDocument.querySelector('#scene-root canvas'), 5_000).catch(() => null);
  let contextLosses = 0;
  canvas?.addEventListener('webglcontextlost', () => { contextLosses++; });
  return {
    raw: {
      tier: sample.tier ?? null,
      score: Number.isFinite(sample.score) ? sample.score : null,
      reason: sample.reason ?? null,
      forced: Boolean(sample.forced),
      cleaned: sample.cleaned !== false
    },
    readContextLosses: () => contextLosses
  };
}

function totalRenderCount() {
  const counts = frame.contentWindow.__sceneDebug?.().renderCounts;
  return counts ? counts.direct + counts.postfx : null;
}

async function measureFps(reducedMotion) {
  if (reducedMotion) {
    return {
      applicable: false,
      reason: 'reduced-motion-static-scene',
      durationMs: 0,
      sampleCount: 0,
      min: null,
      median: null
    };
  }
  const readings = [];
  const started = performance.now();
  let previousCount = totalRenderCount();
  while (performance.now() - started < FPS_WINDOW_MS) {
    await wait(Math.min(250, Math.max(0, FPS_WINDOW_MS - (performance.now() - started))));
    const currentCount = totalRenderCount();
    const fps = frame.contentWindow.__sceneDebug?.().fps;
    if (Number.isFinite(currentCount) && Number.isFinite(previousCount) &&
        currentCount > previousCount && Number.isFinite(fps)) {
      readings.push(fps);
    }
    previousCount = currentCount;
  }
  if (!readings.length) {
    return {
      applicable: false,
      reason: 'render-loop-did-not-advance',
      durationMs: Math.round(performance.now() - started),
      sampleCount: 0,
      min: null,
      median: null
    };
  }
  return {
    applicable: true,
    reason: null,
    durationMs: Math.round(performance.now() - started),
    sampleCount: readings.length,
    min: readings.length ? Math.min(...readings) : null,
    median: readings.length ? median(readings) : null
  };
}

async function copyPacket() {
  if (!packet) return;
  const json = JSON.stringify(packet, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    setStatus('COPIED // evidence packet is on the clipboard');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = json;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    copyButton.focus();
    setStatus('COPIED // fallback clipboard path used');
  }
}

function exportPacket() {
  if (!packet) return;
  const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `mobile-rich-calibration-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
  setStatus('EXPORTED // evidence packet saved');
}

clearButton.addEventListener('click', () => {
  sessionStorage.removeItem(CACHE_KEY);
  setStatus(`CLEARED // only ${CACHE_KEY}`);
});

copyButton.addEventListener('click', copyPacket);
exportButton.addEventListener('click', exportPacket);

runButton.addEventListener('click', async () => {
  runButton.disabled = true;
  clearButton.disabled = true;
  copyButton.disabled = true;
  exportButton.disabled = true;
  packet = null;
  packetView.textContent = '{}';
  try {
    const samples = [];
    let activeSample;
    for (let index = 1; index <= SAMPLE_COUNT; index++) {
      setStatus(`PROBE ${index}/${SAMPLE_COUNT} // clearing only ${CACHE_KEY}`);
      activeSample = await loadIndependentSample(index);
      samples.push({ index, ...activeSample.raw });
    }
    const win = frame.contentWindow;
    const reducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setStatus(reducedMotion
      ? 'FPS POLICY // reduced-motion scene is static; FPS is not applicable'
      : `FPS WINDOW // ${(FPS_WINDOW_MS / 1_000).toFixed(FPS_WINDOW_MS % 1_000 ? 2 : 0)} seconds, keep this tab foregrounded`);
    const fps = await measureFps(reducedMotion);
    packet = {
      schema: 'codex-v34-owner-calibration/1',
      capturedAt: new Date().toISOString(),
      selectionPolicy: {
        forcedTier: false,
        userAgentRole: 'diagnostic-label-only',
        userAgentUsedForTierSelection: false,
        cacheKeyClearedBetweenSamples: CACHE_KEY
      },
      probes: samples,
      fps15s: fps,
      contextLossCount: activeSample.readContextLosses(),
      environment: {
        viewport: { width: win.innerWidth, height: win.innerHeight },
        devicePixelRatio: win.devicePixelRatio,
        reducedMotion,
        userAgentLabel: win.navigator.userAgent
      }
    };
    packetView.textContent = JSON.stringify(packet, null, 2);
    copyButton.disabled = false;
    exportButton.disabled = false;
    setStatus(fps.applicable
      ? `COMPLETE // FPS min ${fps.min} · median ${fps.median} · losses ${packet.contextLossCount}`
      : `COMPLETE // FPS not applicable (${fps.reason}) · losses ${packet.contextLossCount}`);
  } catch (error) {
    setStatus(`ERROR // ${error.message}`);
  } finally {
    runButton.disabled = false;
    clearButton.disabled = false;
  }
});
