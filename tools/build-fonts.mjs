/* build-fonts.mjs — content-driven Japanese webfont subsetting.
 *
 * WHY THIS EXISTS
 * css/site.css used to carry the note "JP glyph subsetting impractical", so both
 * Japanese faces were left on the Google Fonts CDN. That was measurably wrong:
 * the committed site uses well under 200 distinct CJK codepoints, while the CDN
 * ships the full faces as ~100 unicode-range shards behind a render-blocking
 * stylesheet. On Slow-4G that cost mobile LCP 4.86s and — because the JP fallback
 * stack is a Latin face, so JP text painted in system Hiragino and then reflowed —
 * a failing CLS of 0.172 (measured, 3/3 cold Lighthouse runs, 2026-07-27).
 *
 * This tool subsets the four OFL source faces down to the codepoints the site
 * actually uses and emits same-origin WOFF2 files, so nothing about the type
 * design changes — only its delivery.
 *
 * SOURCE FACES ARE NOT COMMITTED. They are ~11MB of TTF. Fetch them with:
 *   npm run fonts:fetch
 * or point FONT_SRC at a directory already holding:
 *   MPLUSRounded1c-Regular.ttf   MPLUSRounded1c-Medium.ttf
 *   ZenKakuGothicNew-Medium.ttf  ZenKakuGothicNew-Bold.ttf
 *
 * Requires Python fontTools + brotli (`pip install fonttools brotli`).
 *
 * The emitted fonts/jp-subset-manifest.json records the covered codepoints and
 * each output's sha256. tests/unit/font-coverage.test.mjs asserts that every
 * codepoint the committed pages need is covered AND that the committed WOFF2
 * files still hash to what the manifest claims — so adding Japanese prose without
 * rerunning this tool fails CI instead of shipping tofu.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.FONT_SRC || join(ROOT, '.fontsrc');
const OUT = join(ROOT, 'fonts');

/* Faces mirror the exact families/weights the retired Google Fonts request asked
   for (M PLUS Rounded 1c 400/500, Zen Kaku Gothic New 500/700). Changing this
   list changes rendered type, which is under the desktop visual lock. */
export const FACES = [
  { src: 'MPLUSRounded1c-Regular.ttf', out: 'mplus-rounded-1c-400.woff2', family: 'M PLUS Rounded 1c', weight: 400 },
  { src: 'MPLUSRounded1c-Medium.ttf', out: 'mplus-rounded-1c-500.woff2', family: 'M PLUS Rounded 1c', weight: 500 },
  { src: 'ZenKakuGothicNew-Medium.ttf', out: 'zen-kaku-gothic-new-500.woff2', family: 'Zen Kaku Gothic New', weight: 500 },
  { src: 'ZenKakuGothicNew-Bold.ttf', out: 'zen-kaku-gothic-new-700.woff2', family: 'Zen Kaku Gothic New', weight: 700 },
];

/* Pages whose literal bytes define "what the site needs". Scanning raw file text
   rather than parsed text is deliberate: it is a superset (tag names only add
   ASCII, which costs nothing) and it cannot miss a translated string hidden in a
   data-ja/aria-label/alt/content attribute. */
export const SCAN_FILES = [
  'index.html', '404.html', 'css/site.css', 'ja/index.html',
  /* Generated pages are scanned too: a case study written in Japanese would
     otherwise render in a system face with nothing failing. They are listed
     explicitly rather than globbed so the input set stays deterministic — and
     `npm run build` generates them BEFORE this tool runs, so the subset always
     reflects the pages actually committed. */
  'case/daikieos/index.html',
  'case/tokyo-data-globe/index.html',
  'case/open-web-production/index.html',
  'case/night-shift-studio/index.html',
  'case/tokyo-apartment-hunt/index.html',
];

/* Always-on floor, independent of today's copy. Kana are ~190 glyphs and a few KB;
   including them wholesale means routine Japanese copy edits do not silently
   depend on a font rebuild. CJK ideographs are NOT blanket-included — that is the
   whole point of subsetting — so new kanji do require a rebuild, which the
   coverage test enforces. */
function baselineCodepoints() {
  const set = new Set();
  const add = (lo, hi) => { for (let c = lo; c <= hi; c++) set.add(c); };
  add(0x20, 0x7e);       // ASCII printable
  add(0x00a0, 0x00ff);   // Latin-1 punctuation/accents
  add(0x2010, 0x2027);   // dashes, quotes, ellipsis
  add(0x2030, 0x205e);   // per-mille, primes, misc punctuation
  add(0x3000, 0x303f);   // CJK punctuation (、。「」・〜)
  add(0x3040, 0x309f);   // hiragana
  add(0x30a0, 0x30ff);   // katakana
  add(0xff01, 0xff5e);   // fullwidth forms
  add(0xffe0, 0xffe6);   // fullwidth symbols
  return set;
}

export function collectCodepoints(root = ROOT, files = SCAN_FILES) {
  const set = baselineCodepoints();
  const scanned = [];
  for (const rel of files) {
    const path = join(root, rel);
    if (!existsSync(path)) continue;
    scanned.push(rel);
    for (const ch of readFileSync(path, 'utf8')) {
      const cp = ch.codePointAt(0);
      if (cp > 0x1f) set.add(cp);
    }
  }
  return { codepoints: [...set].sort((a, b) => a - b), scanned };
}

/** Compact a sorted codepoint list into CSS-style unicode-range text. */
export function toRanges(codepoints) {
  const ranges = [];
  let start = null;
  let prev = null;
  for (const cp of codepoints) {
    if (start === null) { start = prev = cp; continue; }
    if (cp === prev + 1) { prev = cp; continue; }
    ranges.push([start, prev]);
    start = prev = cp;
  }
  if (start !== null) ranges.push([start, prev]);
  return ranges;
}

const hex = cp => cp.toString(16).toUpperCase().padStart(4, '0');
export const rangesToText = ranges =>
  ranges.map(([a, b]) => (a === b ? `U+${hex(a)}` : `U+${hex(a)}-${hex(b)}`)).join(', ');

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function main() {
  if (!existsSync(SRC)) {
    console.error(`[build-fonts] source faces not found at ${SRC}`);
    console.error('[build-fonts] run `npm run fonts:fetch` first, or set FONT_SRC.');
    process.exit(1);
  }
  const { codepoints, scanned } = collectCodepoints();
  const ranges = toRanges(codepoints);
  const unicodes = ranges.map(([a, b]) => (a === b ? hex(a) : `${hex(a)}-${hex(b)}`)).join(',');
  console.log(`[build-fonts] scanned ${scanned.join(', ')}`);
  console.log(`[build-fonts] ${codepoints.length} codepoints in ${ranges.length} ranges`);

  mkdirSync(OUT, { recursive: true });
  const entries = [];
  for (const face of FACES) {
    const input = join(SRC, face.src);
    if (!existsSync(input)) {
      console.error(`[build-fonts] missing source face: ${input}`);
      process.exit(1);
    }
    const output = join(OUT, face.out);
    execFileSync('python3', [
      '-m', 'fontTools.subset', input,
      `--unicodes=${unicodes}`,
      '--flavor=woff2',
      '--layout-features=kern,liga,palt,vert,vrt2,locl',
      '--notdef-outline',
      `--output-file=${output}`,
    ], { stdio: ['ignore', 'ignore', 'inherit'] });
    const bytes = statSync(output).size;
    entries.push({ ...face, bytes, sha256: sha256(output) });
    const before = statSync(input).size;
    console.log(
      `[build-fonts] ${face.out.padEnd(30)} ${(bytes / 1024).toFixed(1).padStart(7)} KB` +
      `  (from ${(before / 1024 / 1024).toFixed(1)} MB, ${(100 - (bytes / before) * 100).toFixed(2)}% smaller)`
    );
  }

  writeFileSync(join(OUT, 'jp-subset-manifest.json'), JSON.stringify({
    note: 'Generated by tools/build-fonts.mjs. Do not hand-edit — tests/unit/font-coverage.test.mjs verifies these hashes against the committed WOFF2 files.',
    generatedFrom: scanned,
    unicodeRange: rangesToText(ranges),
    codepointCount: codepoints.length,
    codepoints,
    faces: entries.map(({ out, family, weight, bytes, sha256: hash }) => ({ file: out, family, weight, bytes, sha256: hash })),
  }, null, 2) + '\n');

  /* Re-sync the declared unicode-range in css/site.css. It must equal the
     subsets' EXACT coverage: over-claiming advertises glyphs the file lacks, and
     the browser then renders tofu instead of falling through to a system JP
     face. Doing it here means the declaration cannot drift from the shipped
     bytes even by one edit — tests/unit/font-coverage.test.mjs pins the pair, but
     a tool that keeps them in step beats a test that reports they diverged. */
    const cssPath = join(ROOT, 'css/site.css');
  const css = readFileSync(cssPath, 'utf8');
  const rangeText = rangesToText(ranges);
  let synced = 0;
  const updated = css.replace(
    /(@font-face \{[^}]*url\('\.\.\/fonts\/(?:mplus-rounded-1c|zen-kaku-gothic-new)-\d+\.woff2'\)[^}]*unicode-range:\s*)([^;]+)(;)/g,
    (whole, head, current, tail) => {
      if (current.trim() === rangeText) return whole;
      synced++;
      return head + rangeText + tail;
    }
  );
  if (synced) {
    writeFileSync(cssPath, updated);
    console.log(`[build-fonts] re-synced unicode-range on ${synced} @font-face rule(s) in css/site.css`);
  }

  const total = entries.reduce((n, e) => n + e.bytes, 0);
  console.log(`[build-fonts] total committed webfont payload: ${(total / 1024).toFixed(1)} KB`);
}

/* Compare resolved filesystem paths, not URL strings: this repo lives under
   "Claude Code Projects/Personal Website", and import.meta.url percent-encodes
   those spaces while process.argv[1] does not — the naive string compare never
   matches and main() silently never runs. */
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
