export const RICH_THRESHOLD_MS = 4.5;

export function classifyTier({ reduced, coarse, small, forced, probeTier, score }) {
  if (reduced) return 'reduced';
  if (coarse) {
    if (forced === 'rich') return 'mobile-rich';
    if (forced === 'lite') return 'lite';
    if (probeTier === 'mobile-rich' || probeTier === 'lite') return probeTier;
    return Number.isFinite(score) && score <= RICH_THRESHOLD_MS ? 'mobile-rich' : 'lite';
  }
  return small ? 'lite' : 'high';
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
