/* fetch-font-sources.mjs — pull the upstream OFL source faces that
 * tools/build-fonts.mjs subsets from.
 *
 * These TTFs are ~11MB and are NOT committed; only the generated WOFF2 subsets
 * and both OFL license files are. Run this once before `npm run fonts:build`.
 *
 * Sources are the upstream google/fonts OFL directories. Every file is verified
 * after download: the family/weight is read back out of the font's own name and
 * OS/2 tables, and the embedded license string must say SIL Open Font License.
 * A face whose metadata does not match is rejected rather than silently subset —
 * shipping the wrong weight would change the locked type design invisibly.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = process.env.FONT_SRC || join(ROOT, '.fontsrc');
const BASE = 'https://raw.githubusercontent.com/google/fonts/main/ofl';

const SOURCES = [
  { file: 'MPLUSRounded1c-Regular.ttf', url: `${BASE}/mplusrounded1c/MPLUSRounded1c-Regular.ttf`, family: 'Rounded Mplus 1c', weight: 400 },
  { file: 'MPLUSRounded1c-Medium.ttf', url: `${BASE}/mplusrounded1c/MPLUSRounded1c-Medium.ttf`, family: 'Rounded Mplus 1c', weight: 500 },
  { file: 'ZenKakuGothicNew-Medium.ttf', url: `${BASE}/zenkakugothicnew/ZenKakuGothicNew-Medium.ttf`, family: 'Zen Kaku Gothic New', weight: 500 },
  { file: 'ZenKakuGothicNew-Bold.ttf', url: `${BASE}/zenkakugothicnew/ZenKakuGothicNew-Bold.ttf`, family: 'Zen Kaku Gothic New', weight: 700 },
];

/* The M+ family ships its license under the mplus1p directory upstream; the
   Zen Kaku family under its own. Both cover the faces fetched above. */
const LICENSES = [
  { file: 'MPLUSRounded1c-OFL.txt', url: `${BASE}/mplus1p/OFL.txt` },
  { file: 'ZenKakuGothicNew-OFL.txt', url: `${BASE}/zenkakugothicnew/OFL.txt` },
];

async function download(url, path) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  writeFileSync(path, Buffer.from(await response.arrayBuffer()));
}

/** Read family/weight/license straight out of the downloaded binary. */
function inspect(path) {
  const script = `
import json, sys
from fontTools.ttLib import TTFont
f = TTFont(sys.argv[1], lazy=True)
n = f['name']
print(json.dumps({
  'family': (n.getDebugName(16) or n.getDebugName(1) or '').strip(),
  'weight': f['OS/2'].usWeightClass,
  'license': (n.getDebugName(13) or '')[:80],
}))`;
  return JSON.parse(execFileSync('python3', ['-c', script, path], { encoding: 'utf8' }));
}

async function main() {
  mkdirSync(DEST, { recursive: true });
  for (const { file, url } of LICENSES) {
    await download(url, join(DEST, file));
    console.log(`[fetch-fonts] ${file}`);
  }
  for (const source of SOURCES) {
    const path = join(DEST, source.file);
    await download(source.url, path);
    const meta = inspect(path);
    if (meta.family !== source.family || meta.weight !== source.weight) {
      throw new Error(
        `[fetch-fonts] ${source.file} is ${meta.family} ${meta.weight}, expected ${source.family} ${source.weight}`
      );
    }
    if (!/SIL Open Font License/i.test(meta.license)) {
      throw new Error(`[fetch-fonts] ${source.file} does not declare the SIL Open Font License`);
    }
    console.log(`[fetch-fonts] ${source.file} — ${meta.family} ${meta.weight}, OFL verified`);
  }
  console.log(`[fetch-fonts] sources ready in ${DEST}; now run \`npm run fonts:build\``);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(error => {
    console.error(String(error.message || error));
    process.exit(1);
  });
}

export { SOURCES, LICENSES, DEST, existsSync };
