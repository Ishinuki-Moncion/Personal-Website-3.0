import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSiteFile = relativePath => readFile(
  new URL(`../../${relativePath}`, import.meta.url),
  'utf8'
);

/* A duplicated key is valid to JSON.parse — the last one silently wins — so an
   `alumniOf` block pasted twice parsed fine, validated fine, passed the browser
   assertions that read the parsed object, and shipped. Nothing in the suite
   could see it, because everything downstream reads the PARSED value. This
   reads the raw text instead, which is the only place the duplicate exists. */
test('structured data declares no key twice', async () => {
  for (const page of ['index.html', 'ja/index.html']) {
    const html = await readSiteFile(page);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
    assert.ok(blocks.length > 0, `${page} should carry structured data`);
    for (const [index, block] of blocks.entries()) {
      JSON.parse(block);   // still has to be valid JSON
      /* Walk the raw text, tracking one key-set per open object so that a key
         repeated inside the SAME object is caught while the same key appearing
         in sibling objects (every "@type", every "name") is not. */
      const duplicates = [];
      const openObjects = [];
      for (const token of block.matchAll(/[{}]|"((?:\\.|[^"\\])*)"\s*:/g)) {
        if (token[0] === '{') { openObjects.push(new Set()); continue; }
        if (token[0] === '}') { openObjects.pop(); continue; }
        const current = openObjects[openObjects.length - 1];
        if (!current) continue;
        if (current.has(token[1])) duplicates.push(token[1]);
        current.add(token[1]);
      }
      assert.deepEqual(
        duplicates,
        [],
        `${page} block ${index + 1} declares a key more than once — JSON.parse keeps only the last, so this is invisible to every other check`
      );
    }
  }
});

test('Package A production modules use the complete approved cache tuple', async () => {
  const [index, boot, background, probe] = await Promise.all([
    readSiteFile('index.html'),
    readSiteFile('js/boot.mjs'),
    readSiteFile('js/background.js'),
    readSiteFile('js/gpu-probe.mjs')
  ]);

  assert.match(index, /src="js\/boot\.mjs\?v=36"/);
  assert.match(boot, /bg: '7\.6'/);
  assert.match(boot, /boot: '3\.3'/);
  assert.match(boot, /cursor: '3\.2'/);
  assert.match(boot, /app: '4\.6'/);
  assert.match(boot, /probe: '6'/);
  assert.match(boot, /import\('\.\/scene-bootstrap\.mjs\?v=1'\)/);
  assert.match(probe, /from '\.\/quality-policy\.mjs\?v=5'/);
  assert.match(background, /from '\.\/quality-policy\.mjs\?v=5'/);
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

  assert.match(index, /href="css\/site\.css\?v=3\.34"/, 'css/site.css must carry its cache token');
  assert.match(boot, /fx: '3\.8'/, 'js/effects.js version must stay pinned');
  assert.match(background, /import\('\.\/rivulet\.mjs\?v=1'\)/, 'js/rivulet.mjs must carry its cache token');

  /* Nothing may be served unversioned: catch a new asset added without a token. */
  const unversioned = [...index.matchAll(/(?:href|src)="((?:css|js)\/[^"?]+\.(?:css|m?js))"/g)].map(m => m[1]);
  assert.deepEqual(unversioned, [], 'these first-party assets are served without a cache-bust token');
});
