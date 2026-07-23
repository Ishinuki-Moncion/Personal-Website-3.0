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

  assert.match(index, /src="js\/boot\.mjs\?v=31"/);
  assert.match(boot, /bg: '7\.0'/);
  assert.match(boot, /boot: '3\.2'/);
  assert.match(boot, /cursor: '3\.2'/);
  assert.match(boot, /app: '4\.4'/);
  assert.match(boot, /probe: '1'/);
  assert.match(boot, /import\('\.\/scene-bootstrap\.mjs\?v=1'\)/);
  assert.match(probe, /from '\.\/quality-policy\.mjs\?v=1'/);
  assert.match(background, /from '\.\/quality-policy\.mjs\?v=1'/);
});
