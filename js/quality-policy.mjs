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

/* The sustained-FPS watchdog answers two different questions, so it uses two
   different bars.

   'mobile-rich' is a PROMOTION a device earned by measurement. Falling below
   45fps means it did not deserve it, and handing back the extra is cheap.

   'high' is the desktop default and carries the locked art direction, so it is
   demoted only when the page is not working at all — a far lower bar. 20fps
   sustained for four seconds is not a dip during a heavy scroll; it is a
   machine that cannot present this scene. Software rasterisation measured 3-7.

   A tier absent from this map is never watched: 'lite' and 'reduced' are
   already the floor, and there is nothing below them to demote to. */
export const DEMOTE_BELOW_FPS = { 'mobile-rich': 45, high: 20 };

export function classifyTier({ reduced, coarse, small, forced, probeTier, probeReason, probeDemoted, score }) {
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
  /* Owner decision 2026-07-29: the desktop rescue is the sustained-FPS watchdog,
     not a boot-time probe. Probing here would put ~200ms of GPU work on a
     critical path whose LCP is already over its 2500ms gate at ~2700ms, to
     answer a question the render loop answers for free a few seconds later.

     So `probeDemoted` is how a desktop reaches 'lite': the watchdog demotes the
     live session (see DEMOTE_BELOW_FPS) and persists that verdict, and the next
     load in the session starts lite instead of spending four more seconds
     discovering the same thing. It is a MEASUREMENT of this machine running
     this page — the same class of evidence as the probe, taken later and for
     nothing.

     The reason/score arms below stay because a desktop CAN carry a probe
     verdict: `?tier=` forcing, and a cached result from a hybrid device that
     reported a coarse pointer earlier in the session. Both are cheap reads. */
  if (probeDemoted) return 'lite';
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
/* The gap that separates "the loop was not running" from "the loop is running
   badly". Both look identical from a (fps, timestamp) pair, so this constant is
   where the ambiguity is resolved, and it must sit ABOVE the slowest real frame:
   set to 1s it re-created the very defect the clamp had — a desktop measured at
   1.3fps (770ms frames) restarted its window on almost every sample and could
   never be rescued, while a machine at 48fps was rescued in four seconds.
   Three seconds is longer than any frame a browser still presenting will take,
   and shorter than a suspension worth discounting. The honest limit: a device
   below ~0.33fps never accumulates a window at all — it is beyond what changing
   tier would rescue, and pretending otherwise would just re-open the A2 hole. */
export function createFpsDemoter({ threshold = 45, holdSeconds = 4, maxGapSeconds = 3, onDemote }) {
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
