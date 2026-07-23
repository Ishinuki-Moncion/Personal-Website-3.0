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

export function mobilePasses(values) {
  return values.performance >= 80 && values.LCP <= 2500 && values.CLS <= 0.10 && values.TBT <= 200;
}

export function desktopPasses(values) {
  return values.performance >= 85 && values.LCP <= 2500 && values.CLS <= 0.10;
}
