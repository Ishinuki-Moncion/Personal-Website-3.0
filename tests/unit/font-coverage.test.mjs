/* Guards the self-hosted Japanese subsets (tools/build-fonts.mjs).
 *
 * The failure this prevents: someone adds Japanese copy to a committed page and
 * does not rerun `npm run fonts:build`. The new kanji are absent from the WOFF2
 * subsets, and because unicode-range then excludes them the browser falls through
 * to a system JP face — so the page does not visibly break in the author's own
 * Mac/iPhone testing, it just silently renders that run of text in the wrong
 * typeface. On a machine with no JP system font it renders as tofu.
 *
 * Deliberately verifies COVERAGE and HASHES, not byte-identity of the WOFF2
 * output: fontTools/brotli do not guarantee stable bytes across versions, so a
 * regenerate-and-diff check would fail on a routine toolchain bump while proving
 * nothing users can perceive.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { collectCodepoints, FACES, SCAN_FILES } from '../../tools/build-fonts.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(readFileSync(join(ROOT, 'fonts/jp-subset-manifest.json'), 'utf8'));
const covered = new Set(manifest.codepoints);

/** Codepoints that only a Japanese face can render — the Latin faces' unicode-range stops at U+FFFD. */
const needsJapaneseFace = cp =>
  (cp >= 0x3000 && cp <= 0x30ff) ||   // CJK punctuation, hiragana, katakana
  (cp >= 0x3400 && cp <= 0x4dbf) ||   // CJK ext A
  (cp >= 0x4e00 && cp <= 0x9fff) ||   // CJK unified ideographs
  (cp >= 0xf900 && cp <= 0xfaff) ||   // CJK compatibility ideographs
  (cp >= 0xff01 && cp <= 0xff60) ||   // fullwidth forms
  (cp >= 0xffe0 && cp <= 0xffe6);

/* SCAN_FILES is deliberately explicit rather than globbed, so the subset input
   stays deterministic. The cost of that choice is a blind spot: a case study
   added without touching the list is simply never scanned, and the coverage
   test below cannot notice because it reads the SAME list — both would agree,
   and both would be wrong. This is what makes the omission detectable.
   It bit for real: the two studies added 2026-07-29 generated their pages, and
   the subsets were rebuilt without either of them. */
test('the font scan list covers every case study that actually exists', () => {
  const onDisk = readdirSync(join(ROOT, 'case'), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => `case/${entry.name}/index.html`)
    .sort();
  const scanned = SCAN_FILES.filter(file => file.startsWith('case/')).sort();
  assert.deepEqual(
    scanned,
    onDisk,
    'a case study exists that tools/build-fonts.mjs never scans — its Japanese text would fall back to a system face with nothing failing'
  );
});

test('every Japanese codepoint on the committed pages is in the shipped subsets', () => {
  const { codepoints, scanned } = collectCodepoints(ROOT);
  assert.ok(scanned.includes('index.html'), 'index.html must be scanned');

  const missing = codepoints
    .filter(needsJapaneseFace)
    .filter(cp => !covered.has(cp));

  assert.deepEqual(
    missing.map(cp => `U+${cp.toString(16).toUpperCase()} ${String.fromCodePoint(cp)}`),
    [],
    'Japanese text was added without rerunning `npm run fonts:build` — these codepoints would fall back to a system face'
  );
});

test('committed WOFF2 subsets match the hashes their manifest declares', () => {
  assert.equal(manifest.faces.length, FACES.length);
  for (const face of manifest.faces) {
    const bytes = readFileSync(join(ROOT, 'fonts', face.file));
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      face.sha256,
      `${face.file} does not match its manifest hash — regenerate with \`npm run fonts:build\``
    );
    assert.equal(bytes.length, face.bytes, `${face.file} size drifted from the manifest`);
    assert.equal(bytes.subarray(0, 4).toString('latin1'), 'wOF2', `${face.file} is not a WOFF2 file`);
  }
});

test('site.css declares exactly the subsets unicode-range, for every Japanese face', () => {
  const css = readFileSync(join(ROOT, 'css/site.css'), 'utf8');
  for (const face of manifest.faces) {
    /* Anchor on the src url so each rule is matched independently — a rule whose
       unicode-range over-claims would advertise glyphs the file lacks, which is
       exactly how tofu reaches a user instead of a system-font fallback. */
    const rule = new RegExp(
      `@font-face\\s*\\{[^}]*url\\('\\.\\./fonts/${face.file.replace(/\./g, '\\.')}'\\)[^}]*\\}`
    ).exec(css);
    assert.ok(rule, `css/site.css has no @font-face rule for ${face.file}`);
    const declared = /unicode-range:\s*([^;]+);/.exec(rule[0]);
    assert.ok(declared, `${face.file} rule declares no unicode-range`);
    assert.equal(
      declared[1].trim(),
      manifest.unicodeRange,
      `${face.file} unicode-range drifted from the manifest — rerun \`npm run fonts:build\` and re-sync site.css`
    );
    assert.match(rule[0], /font-display:\s*swap/, `${face.file} must keep text visible while loading`);
  }
});

test('no third-party font origin remains in committed production files', () => {
  for (const rel of ['index.html', '404.html', 'css/site.css']) {
    const text = readFileSync(join(ROOT, rel), 'utf8');
    assert.doesNotMatch(text, /fonts\.googleapis\.com|fonts\.gstatic\.com/, `${rel} still reaches a Google Fonts origin`);
  }
});

test('both OFL license files ship with the fonts they cover', () => {
  for (const name of ['OFL-M-PLUS-Rounded-1c.txt', 'OFL-Zen-Kaku-Gothic-New.txt']) {
    const text = readFileSync(join(ROOT, 'fonts', name), 'utf8');
    assert.match(text, /SIL OPEN FONT LICENSE/i, `${name} is not an OFL license`);
  }
});
