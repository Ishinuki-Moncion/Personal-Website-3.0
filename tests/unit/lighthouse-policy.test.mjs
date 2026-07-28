import test from 'node:test';
import assert from 'node:assert/strict';
import {
  desktopFailures,
  desktopPasses,
  displayMetrics,
  LAYOUT_METRICS,
  medianMetrics,
  mobileFailures,
  mobilePasses
} from '../performance/lighthouse-policy.mjs';

const mobileBounds = {
  performance: 80,
  FCP: 0,
  LCP: 2500,
  CLS: 0.10,
  TBT: 200
};

const desktopBounds = {
  performance: 85,
  FCP: 0,
  LCP: 2500,
  CLS: 0.10,
  TBT: 0
};

test('mobile gates evaluate unrounded boundary values', () => {
  assert.equal(mobilePasses(mobileBounds), true);
  for (const failing of [
    { ...mobileBounds, performance: 79.999 },
    { ...mobileBounds, LCP: 2500.4 },
    { ...mobileBounds, CLS: 0.10004 },
    { ...mobileBounds, TBT: 200.4 }
  ]) {
    assert.equal(mobilePasses(failing), false, JSON.stringify(failing));
  }
});

test('desktop gates evaluate unrounded boundary values', () => {
  assert.equal(desktopPasses(desktopBounds), true);
  for (const failing of [
    { ...desktopBounds, performance: 84.999 },
    { ...desktopBounds, LCP: 2500.4 },
    { ...desktopBounds, CLS: 0.10004 }
  ]) {
    assert.equal(desktopPasses(failing), false, JSON.stringify(failing));
  }
});

/* The CI runner has no GPU, so it enforces only the layout gate and reports the
   paint gates as deferred. That relaxation is only defensible while it stays
   exactly this narrow: CLS is the one metric a software rasteriser still
   measures truthfully, and it must remain ENFORCED there — a runner that
   deferred CLS too would be gating on nothing at all. */
test('the layout gate is CLS alone, and it is a real gate on both form factors', () => {
  assert.deepEqual(LAYOUT_METRICS, ['CLS']);
  assert.deepEqual(mobileFailures({ ...mobileBounds, CLS: 0.10004 }), ['CLS']);
  assert.deepEqual(desktopFailures({ ...desktopBounds, CLS: 0.10004 }), ['CLS']);
  /* Everything a GPU-less machine cannot measure must be named as such, so a
     future edit cannot quietly move a metric out of enforcement by renaming it. */
  assert.deepEqual(
    mobileFailures({ performance: 0, FCP: 0, LCP: 9e9, CLS: 9, TBT: 9e9 }),
    ['performance', 'LCP', 'CLS', 'TBT']
  );
  assert.deepEqual(
    desktopFailures({ performance: 0, FCP: 0, LCP: 9e9, CLS: 9, TBT: 0 }),
    ['performance', 'LCP', 'CLS']
  );
});

test('failure lists and boolean gates cannot disagree', () => {
  for (const values of [
    mobileBounds,
    { ...mobileBounds, TBT: 200.4 },
    { ...mobileBounds, CLS: 0.10004, LCP: 2500.4 }
  ]) {
    assert.equal(mobilePasses(values), mobileFailures(values).length === 0, JSON.stringify(values));
  }
  for (const values of [desktopBounds, { ...desktopBounds, performance: 84.999 }]) {
    assert.equal(desktopPasses(values), desktopFailures(values).length === 0, JSON.stringify(values));
  }
});

test('median selection retains raw values and display formatting rounds only a copy', () => {
  const raw = medianMetrics([
    { performance: 79.999, FCP: 1727.51, LCP: 2500.4, CLS: 0.10004, TBT: 200.4 },
    { performance: 80.001, FCP: 1727.49, LCP: 2499.9, CLS: 0.09999, TBT: 199.9 },
    { performance: 80, FCP: 1727.5, LCP: 2500, CLS: 0.1, TBT: 200 }
  ]);
  assert.deepEqual(raw, {
    performance: 80,
    FCP: 1727.5,
    LCP: 2500,
    CLS: 0.1,
    TBT: 200
  });
  assert.deepEqual(displayMetrics({
    performance: 79.999,
    FCP: 1727.51,
    LCP: 2500.4,
    CLS: 0.10004,
    TBT: 200.4
  }), {
    performance: 80,
    FCP: 1727.5,
    LCP: 2500.4,
    CLS: 0.10004,
    TBT: 200.4
  });
});
