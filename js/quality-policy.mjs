export const RICH_THRESHOLD_MS = 4.5;

/* Reasons the probe reports when it could not complete a trivial GPU workload
   AT ALL, as distinct from completing it slower than the phone-rich bar. Only
   these override the desktop profile — see classifyTier. */
export const INCAPABLE_PROBE_REASONS = ['no-webgl2', 'error', 'budget'];

/* A desktop ceiling, not a quality bar. RICH_THRESHOLD_MS (4.5) asks "is this
   phone fast enough for the rich tier"; this asks the much cruder "did this
   machine render at all". It sits an order of magnitude above the phone bar
   precisely so that ordinary desktops — including old integrated graphics,
   which land in the teens — never approach it. A machine needing 60ms for a
   workload a mid-range phone finishes in 4.5ms is rasterising in software, and
   the full scene will not merely be slow there, it will stop the page. */
export const DESKTOP_LITE_THRESHOLD_MS = 60;

export function classifyTier({ reduced, coarse, small, forced, probeTier, probeReason, score }) {
  if (reduced) return 'reduced';
  if (coarse) {
    if (forced === 'rich') return 'mobile-rich';
    if (forced === 'lite') return 'lite';
    if (probeTier === 'mobile-rich' || probeTier === 'lite') return probeTier;
    return Number.isFinite(score) && score <= RICH_THRESHOLD_MS ? 'mobile-rich' : 'lite';
  }
  if (small) return 'lite';
  if (forced === 'rich') return 'high';
  if (forced === 'lite') return 'lite';
  /* Desktop carries the locked art direction, so it stays 'high' wherever the
     machine can actually render it — a measured score merely slower than the
     phone bar is still 'high', and capable machines never reach this line.

     The override is deliberately the narrowest one that is unambiguous. A probe
     that could not obtain a WebGL2 context, threw, or exhausted its budget has
     not reported "slow"; it has reported that a trivial GPU workload did not
     finish. Handing the full scene to that machine does not degrade the page,
     it FREEZES it: measured on a GPU-less runner, the main thread stopped
     responding for 17 seconds at a single click, painting nothing and running
     no timers. Software rasterisation on a desktop is not exotic — VMs, remote
     desktops and stale drivers all land here.

     Measured, never identity: no UA, renderer string or deviceMemory (spec 3). */
  /* KNOWN GAP, deliberately not closed here (2026-07-28). The owner approved
     letting the measurement gate desktop, and these two constants encode what
     that decision should read — but js/gpu-probe.mjs:56 returns null for any
     non-coarse pointer, so no desktop ever HAS a probe result to read. Wiring
     one up means running the probe on the desktop critical path, and it yields
     across animation frames for ~200ms; desktop LCP is already over its 2500ms
     gate at ~2700ms. Buying desktop tiering with more LCP is a trade the owner
     should make deliberately, not one I should slip in while fixing CI.

     The cheaper alternative — letting the existing sustained-FPS watchdog
     demote 'high' as it already demotes 'mobile-rich' — costs nothing at boot
     and needs no probe, but it rescues a struggling desktop only after four
     seconds rather than before the first frame.

     Until then desktop keeps the locked profile unless explicitly overridden,
     which is exactly the behaviour that shipped before this branch. */
  return INCAPABLE_PROBE_REASONS.includes(probeReason) ||
    (Number.isFinite(score) && score > DESKTOP_LITE_THRESHOLD_MS)
    ? 'lite'
    : 'high';
}

export function estimatePostFxBytes({ width, height, dpr, finalSamples, bloomSamples, bloomScale }) {
  const bpp = 8;
  const pixels = width * height * dpr * dpr;
  const finalPair = 2 * pixels * bpp * (1 + finalSamples);
  const bloomPixels = pixels * bloomScale * bloomScale;
  const bloomPair = 2 * bloomPixels * bpp * (1 + bloomSamples);
  const bloomInternalsConservative = bloomPixels * bpp;
  return Math.ceil(finalPair + bloomPair + bloomInternalsConservative);
}

/* "Sustained for four seconds" is a WALL-CLOCK requirement, so the hold is
   measured from the first low sample rather than accumulated per frame.

   Accumulating per-frame deltas cannot express it, because every delta is
   ambiguous: a ten-second interval is either a device rendering at 0.1fps or a
   render loop that was not running at all (a lost context, a backgrounded tab).
   Counting it demotes a healthy device off one suspension — the v3.4b defect.
   Clamping each delta instead silently reinterprets the rule as a frame COUNT:
   under a 250ms clamp, "four seconds" became "sixteen frames", so a device
   rendering at 3fps needed 5.3s to be rescued while one at 60fps needed 4.0s.
   The slower the device, the longer it waited — backwards, and measurably so:
   a runner rendering 14 frames in 4.3s never demoted at all.

   Measuring the window from its first sample, and RESTARTING it whenever two
   samples are further apart than any real frame, resolves both. A suspension
   can contribute nothing, because it restarts the window rather than filling
   it; and while the loop is genuinely running the window advances in true
   seconds whatever the frame rate. It follows that reaching holdSeconds takes
   at least ceil(holdSeconds / maxGapSeconds) consecutive low samples, so no
   single frame can ever satisfy the rule on its own. */
export function createFpsDemoter({ threshold = 45, holdSeconds = 4, maxGapSeconds = 1, onDemote }) {
  let lowSince = null;
  let lastSample = null;
  let lowSeconds = 0;
  let demoted = false;
  return {
    /* `nowSeconds` is an absolute monotonic clock, not a delta. */
    sample(fps, nowSeconds) {
      if (demoted) return;
      const gap = lastSample === null ? Infinity : nowSeconds - lastSample;
      lastSample = nowSeconds;
      if (fps >= threshold) { lowSince = null; lowSeconds = 0; return; }
      if (lowSince === null || gap > maxGapSeconds) { lowSince = nowSeconds; lowSeconds = 0; return; }
      lowSeconds = nowSeconds - lowSince;
      if (lowSeconds >= holdSeconds) { demoted = true; onDemote(); }
    },
    get demoted() { return demoted; },
    get lowSeconds() { return lowSeconds; }
  };
}
