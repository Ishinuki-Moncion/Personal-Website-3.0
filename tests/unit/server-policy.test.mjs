import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptsGzip,
  isAllowedSitePath
} from '../helpers/server-policy.mjs';

test('gzip negotiation honors weights and explicit exclusion', () => {
  assert.equal(acceptsGzip('br, gzip;q=1.0, deflate;q=0.5'), true);
  assert.equal(acceptsGzip('br;q=1, gzip;q=0'), false);
  assert.equal(acceptsGzip('GZIP;Q=0.25'), true);
  assert.equal(acceptsGzip('br, *;q=1'), true);
  assert.equal(acceptsGzip('br, *;q=0'), false);
  assert.equal(acceptsGzip(undefined), false);
});

test('site path policy exposes only explicit files and public roots', () => {
  for (const pathname of [
    '/',
    '/index.html',
    '/404.html',
    '/favicon.svg',
    '/css/site.css',
    '/fonts/hanken-grotesk-latin.woff2',
    '/images/gallery-07.jpg',
    '/js/app.js',
    '/js/vendor/three-0.158.0/three.module.min.js',
    '/tests/device/mobile-rich-calibration.html',
    '/tests/device/mobile-rich-calibration.mjs'
  ]) {
    assert.equal(isAllowedSitePath(pathname), true, `${pathname} should be public`);
  }

  for (const pathname of [
    '/.git',
    '/.gitignore',
    '/.superpowers/sdd/task-8-brief.md',
    '/node_modules/lighthouse/package.json',
    '/package-lock.json',
    '/css',
    '/tests',
    '/tests/browser/site-matrix.spec.mjs',
    '/js/../package.json',
    '/images/.hidden',
    '/js/%2e%2e/package.json'
  ]) {
    assert.equal(isAllowedSitePath(pathname), false, `${pathname} should not be public`);
  }
});
