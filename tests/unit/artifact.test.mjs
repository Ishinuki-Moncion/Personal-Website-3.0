/* Package D — the deploy artifact must contain the site and nothing else.
 *
 * The risk this guards is quiet: GitHub Pages publishes whatever is on the
 * branch, and this repository carries 651MB of design research, gate
 * screenshots, both test suites, the build tooling and a backup of the v1 site.
 * A denylist would fail open — the next directory someone adds ships by default.
 * These assertions pin the allowlist and, critically, keep it in agreement with
 * the QA server's public surface so CI serves what deployment would publish.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { ARTIFACT_DIRS, ARTIFACT_FILES, collectArtifact, collectOmitted } from '../../tools/build-artifact.mjs';
import { isAllowedSitePath } from '../helpers/server-policy.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('the artifact contains every page the site actually serves', () => {
  const files = collectArtifact();
  for (const required of [
    'index.html', '404.html', 'robots.txt', 'sitemap.xml', 'favicon.svg',
    'ja/index.html',
    'case/daikieos/index.html',
    'case/tokyo-data-globe/index.html',
    'case/open-web-production/index.html',
  ]) {
    assert.ok(files.includes(required), `artifact is missing ${required}`);
  }
  /* The self-hosted faces and their licences ship together — an OFL font
     redistributed without its licence is a licence violation, not a nit. */
  assert.ok(files.some(f => f.endsWith('mplus-rounded-1c-400.woff2')), 'JP subset missing');
  assert.ok(files.filter(f => /^fonts\/OFL-.*\.txt$/.test(f)).length === 2, 'both OFL licences must ship with the fonts');
});

test('the artifact excludes everything that is not the website', () => {
  const files = collectArtifact();
  const forbidden = ['docs/', 'tests/', 'tools/', 'templates/', 'content/', 'shots/', 'node_modules/', '.superpowers/', '.fontsrc/'];
  for (const prefix of forbidden) {
    const leaked = files.filter(f => f.startsWith(prefix));
    assert.deepEqual(leaked, [], `${prefix} must not reach the deploy artifact`);
  }
  /* The v1 backup is a real page that would be publicly reachable if shipped. */
  assert.ok(!files.some(f => f.includes('backup')), 'the v1 backup HTML must not ship');
  /* Build metadata is not content. */
  assert.ok(!files.some(f => f.endsWith('jp-subset-manifest.json')), 'font build metadata must not ship');
});

test('the omitted set is explicit, so an exclusion is a decision not an accident', () => {
  const omitted = collectOmitted();
  for (const expected of ['docs', 'tests', 'tools', 'templates', 'content', 'shots', 'package.json']) {
    assert.ok(omitted.includes(expected), `${expected} should be reported as deliberately omitted`);
  }
});

/* If these two disagree, CI serves a different site than deployment publishes —
   and every browser test becomes evidence about a page nobody will receive. */
test('the artifact allowlist and the QA server allowlist describe the same site', () => {
  for (const file of ARTIFACT_FILES) {
    assert.ok(isAllowedSitePath('/' + file), `QA server refuses to serve shipped file /${file}`);
  }
  for (const dir of ARTIFACT_DIRS) {
    assert.ok(isAllowedSitePath(`/${dir}/probe.txt`), `QA server refuses to serve shipped directory /${dir}/`);
  }
  /* And the reverse: the server must not expose a root the artifact omits.
     tests/device/ is the one sanctioned exception — the owner calibration
     harness is served locally for the on-device gate and never deployed. */
  const servedButUnshipped = ['/docs/x', '/shots/x', '/tools/x', '/content/x', '/templates/x'];
  for (const path of servedButUnshipped) {
    assert.ok(!isAllowedSitePath(path), `${path} is served in QA but never deployed`);
  }
});

test('every artifact file actually exists on disk', () => {
  for (const file of collectArtifact()) {
    assert.ok(existsSync(join(ROOT, file)), `${file} is listed but absent`);
  }
});
