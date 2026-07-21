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

export function createFpsDemoter({ threshold = 45, holdSeconds = 4, onDemote }) {
  let lowSeconds = 0;
  let demoted = false;
  return {
    sample(fps, dt) {
      if (demoted) return;
      lowSeconds = fps < threshold ? lowSeconds + dt : 0;
      if (lowSeconds >= holdSeconds) { demoted = true; onDemote(); }
    },
    get demoted() { return demoted; },
    get lowSeconds() { return lowSeconds; }
  };
}
