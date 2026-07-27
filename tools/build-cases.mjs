/* Generates the case-study pages from content/case-studies.mjs.
 *
 * Standard library only. The output is committed static HTML — the site stays
 * build-free at runtime, and this tool exists purely so three pages that share a
 * structure cannot drift apart by hand-editing.
 *
 * `--check` regenerates into memory and fails on any difference, so CI can prove
 * the committed pages match their source without writing anything.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CASE_STUDIES, PROFILE } from '../content/case-studies.mjs';
import { renderCaseStudy } from '../templates/case-study.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function generate() {
  return CASE_STUDIES.map(study => ({
    path: join('case', study.slug, 'index.html'),
    html: renderCaseStudy(study, PROFILE),
  }));
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const pages = generate();
  let drifted = 0;

  for (const page of pages) {
    const absolute = join(ROOT, page.path);
    if (checkOnly) {
      const current = existsSync(absolute) ? readFileSync(absolute, 'utf8') : null;
      if (current !== page.html) {
        drifted++;
        console.error(`[build-cases] DRIFT: ${page.path} does not match content/case-studies.mjs`);
      }
      continue;
    }
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, page.html);
    console.log(`[build-cases] ${page.path.padEnd(38)} ${(page.html.length / 1024).toFixed(1)} KB`);
  }

  if (checkOnly) {
    if (drifted) {
      console.error(`[build-cases] ${drifted} page(s) out of date — run \`npm run build:cases\``);
      process.exit(1);
    }
    console.log(`[build-cases] ${pages.length} page(s) match their source`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
