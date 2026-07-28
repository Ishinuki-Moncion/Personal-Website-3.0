const METRIC_KEYS = ['performance', 'FCP', 'LCP', 'CLS', 'TBT'];

function metric(lhr, id) {
  const value = lhr.audits[id]?.numericValue;
  if (!Number.isFinite(value)) throw new Error(`Lighthouse audit ${id} has no numeric value`);
  return value;
}

export function extractMetrics(lhr) {
  const performance = (lhr.categories.performance.score ?? 0) * 100;
  if (!Number.isFinite(performance)) throw new Error('Lighthouse performance score is not finite');
  return {
    performance,
    FCP: metric(lhr, 'first-contentful-paint'),
    LCP: metric(lhr, 'largest-contentful-paint'),
    CLS: metric(lhr, 'cumulative-layout-shift'),
    TBT: metric(lhr, 'total-blocking-time')
  };
}

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function medianMetrics(runs) {
  return Object.fromEntries(
    METRIC_KEYS.map(key => [key, median(runs.map(run => run[key]))])
  );
}

export function displayMetrics(values) {
  return {
    performance: Number(values.performance.toFixed(2)),
    FCP: Number(values.FCP.toFixed(1)),
    LCP: Number(values.LCP.toFixed(1)),
    CLS: Number(values.CLS.toFixed(5)),
    TBT: Number(values.TBT.toFixed(1))
  };
}

/* CLS measures where boxes end up, not how fast they were painted, so it holds
   on any machine. Every other gate here is a paint or main-thread measurement
   and only means something somewhere with a GPU to paint with. Keeping that
   distinction as data lets a runner enforce what it can actually measure and
   report — never silently drop — the rest. */
export const LAYOUT_METRICS = ['CLS'];

const MOBILE_BOUNDS = [
  ['performance', values => values.performance >= 80],
  ['LCP', values => values.LCP <= 2500],
  ['CLS', values => values.CLS <= 0.10],
  ['TBT', values => values.TBT <= 200]
];

const DESKTOP_BOUNDS = [
  ['performance', values => values.performance >= 85],
  ['LCP', values => values.LCP <= 2500],
  ['CLS', values => values.CLS <= 0.10]
];

const failuresFor = (bounds, values) => bounds.filter(([, holds]) => !holds(values)).map(([name]) => name);

export const mobileFailures = values => failuresFor(MOBILE_BOUNDS, values);
export const desktopFailures = values => failuresFor(DESKTOP_BOUNDS, values);

export function mobilePasses(values) {
  return mobileFailures(values).length === 0;
}

export function desktopPasses(values) {
  return desktopFailures(values).length === 0;
}
