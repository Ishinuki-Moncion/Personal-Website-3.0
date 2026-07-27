import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSiteFile = relativePath => readFile(
  new URL(`../../${relativePath}`, import.meta.url),
  'utf8'
);

test('Package A production modules use the complete approved cache tuple', async () => {
  const [index, boot, background, probe] = await Promise.all([
    readSiteFile('index.html'),
    readSiteFile('js/boot.mjs'),
    readSiteFile('js/background.js'),
    readSiteFile('js/gpu-probe.mjs')
  ]);

  assert.match(index, /src="js\/boot\.mjs\?v=32"/);
  assert.match(boot, /bg: '7\.0'/);
  assert.match(boot, /boot: '3\.2'/);
  assert.match(boot, /cursor: '3\.2'/);
  assert.match(boot, /app: '4\.4'/);
  assert.match(boot, /probe: '1'/);
  assert.match(boot, /import\('\.\/scene-bootstrap\.mjs\?v=1'\)/);
  assert.match(probe, /from '\.\/quality-policy\.mjs\?v=1'/);
  assert.match(background, /from '\.\/quality-policy\.mjs\?v=1'/);
});

/* The audit log claimed a unit regression "locks the complete cache graph". It
   did not: css/site.css, js/effects.js and js/rivulet.mjs carried no assertion,
   so any of them could be edited without a cache-bust and returning visitors
   would keep running the stale copy indefinitely — the exact class of bug the
   tuple exists to prevent, and one this branch nearly shipped when boot.mjs was
   rewritten while index.html still asked for ?v=31. Every versioned reference
   the site actually serves is pinned here. */
test('every versioned reference the site serves is pinned', async () => {
  const [index, boot, background] = await Promise.all([
    readSiteFile('index.html'),
    readSiteFile('js/boot.mjs'),
    readSiteFile('js/background.js')
  ]);

  assert.match(index, /href="css\/site\.css\?v=3\.32"/, 'css/site.css must carry its cache token');
  assert.match(boot, /fx: '3\.8'/, 'js/effects.js version must stay pinned');
  assert.match(background, /import\('\.\/rivulet\.mjs\?v=1'\)/, 'js/rivulet.mjs must carry its cache token');

  /* Nothing may be served unversioned: catch a new asset added without a token. */
  const unversioned = [...index.matchAll(/(?:href|src)="((?:css|js)\/[^"?]+\.(?:css|m?js))"/g)].map(m => m[1]);
  assert.deepEqual(unversioned, [], 'these first-party assets are served without a cache-bust token');
});
