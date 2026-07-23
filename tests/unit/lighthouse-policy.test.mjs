import test from 'node:test';
import assert from 'node:assert/strict';
import {
  desktopPasses,
  displayMetrics,
  medianMetrics,
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
