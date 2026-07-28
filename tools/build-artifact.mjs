/* Package D — the production deploy artifact.
 *
 * GitHub Pages publishes whatever is in the branch. This repository contains a
 * great deal that is NOT the website: 651MB of design research and gate
 * screenshots under docs/, the Playwright and Lighthouse suites, the shots/
 * directory, the build tooling, the source content modules, and a backup copy of
 * the v1 site. Publishing the branch publishes all of it.
 *
 * So the artifact is ALLOWLISTED, never denylisted. A denylist fails open — the
 * next file someone adds ships by default, and nobody notices until it is public.
 * An allowlist fails closed: anything not named here is simply absent, and
 * `--check` reports what was excluded so the omission is a decision rather than
 * an accident.
 *
 *   node tools/build-artifact.mjs           # write dist/
 *   node tools/build-artifact.mjs --check   # report only, touch nothing
 *
 * The allowlist deliberately mirrors tests/helpers/server-policy.mjs, which
 * defines the same public surface for the QA server. A test asserts the two
 * agree, so the thing we serve in CI is the thing we would deploy.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

/** Individual files that are part of the site. */
export const ARTIFACT_FILES = [
  'index.html',
  '404.html',
  'favicon.svg',
  'robots.txt',
  'sitemap.xml',
];

/** Directories shipped whole. */
export const ARTIFACT_DIRS = [
  'case',      // generated case studies
  'ja',        // generated Japanese locale
  'css',
  'fonts',     // subsets + their OFL licence files
  'images',
  'js',        // includes js/vendor/three-0.158.0
];

/** Never shipped, even if it appears inside an allowlisted directory. */
export const ARTIFACT_EXCLUDE = [
  /(^|\/)\.DS_Store$/,
  /(^|\/)\.gitkeep$/,
  /\.map$/,                       // source maps are debugging aids, not content
  /(^|\/)jp-subset-manifest\.json$/, // build metadata; the fonts themselves ship
];

const excluded = path => ARTIFACT_EXCLUDE.some(pattern => pattern.test(path));

function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(base, full);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (!excluded(rel)) out.push(full);
  }
  return out;
}

export function collectArtifact() {
  const files = [];
  for (const name of ARTIFACT_FILES) {
    const path = join(ROOT, name);
    if (existsSync(path)) files.push(path);
  }
  for (const name of ARTIFACT_DIRS) {
    const path = join(ROOT, name);
    if (existsSync(path)) files.push(...walk(path, ROOT));
  }
  return files.map(f => relative(ROOT, f)).sort();
}

/** Everything at the repository root that the artifact deliberately leaves behind. */
export function collectOmitted() {
  const shipped = new Set([...ARTIFACT_FILES, ...ARTIFACT_DIRS]);
  return readdirSync(ROOT, { withFileTypes: true })
    .map(e => e.name)
    .filter(name => !name.startsWith('.') && name !== 'dist' && !shipped.has(name))
    .sort();
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const files = collectArtifact();
  const omitted = collectOmitted();

  const bytes = files.reduce((n, f) => n + statSync(join(ROOT, f)).size, 0);
  console.log(`[artifact] ${files.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`[artifact] omitted from the deploy: ${omitted.join(', ')}`);

  /* Fail loudly rather than shipping a site missing its generated pages. */
  const required = ['index.html', 'ja/index.html', 'sitemap.xml', 'case/daikieos/index.html'];
  const missing = required.filter(r => !files.includes(r));
  if (missing.length) {
    console.error(`[artifact] MISSING required file(s): ${missing.join(', ')} — run \`npm run build\``);
    process.exit(1);
  }

  /* Nothing outside the allowlist may reach the artifact. */
  const leaked = files.filter(f => {
    const top = f.split('/')[0];
    return !ARTIFACT_FILES.includes(f) && !ARTIFACT_DIRS.includes(top);
  });
  if (leaked.length) {
    console.error(`[artifact] LEAK: ${leaked.join(', ')}`);
    process.exit(1);
  }

  if (checkOnly) {
    console.log('[artifact] allowlist satisfied; nothing written');
    return;
  }

  rmSync(DIST, { recursive: true, force: true });
  for (const file of files) {
    const target = join(DIST, file);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(join(ROOT, file), target);
  }
  console.log(`[artifact] wrote dist/ (${files.length} files)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
