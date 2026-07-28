/* Generates robots.txt and sitemap.xml from the pages that actually exist.
 *
 * Derived rather than hand-maintained: a sitemap listing a page that 404s, or
 * omitting one that ships, is worse than having none — it teaches a crawler that
 * the file is unreliable. The page list comes from the same content module the
 * case studies are generated from, so the two cannot disagree.
 *
 * The Japanese page is deliberately EXCLUDED while its wording is unreviewed:
 * it carries a noindex directive, and listing a noindex URL in a sitemap is a
 * direct contradiction. It joins the sitemap when the owner approves the wording.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CASE_STUDIES } from '../content/case-studies.mjs';
import { ORIGIN, JAPANESE_WORDING_APPROVED } from './build-locale.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function sitemapEntries() {
  const entries = [
    { loc: `${ORIGIN}/`, priority: '1.0' },
    ...CASE_STUDIES.map(study => ({ loc: `${ORIGIN}/case/${study.slug}/`, priority: '0.8' })),
  ];
  if (JAPANESE_WORDING_APPROVED) entries.push({ loc: `${ORIGIN}/ja/`, priority: '0.9' });
  return entries;
}

export function renderSitemap(entries) {
  const urls = entries.map(entry => `  <url>
    <loc>${entry.loc}</loc>
    <priority>${entry.priority}</priority>
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/* robots.txt is only ever fetched from the ORIGIN ROOT. This site is published at
   a GitHub Pages PROJECT path (…github.io/Personal-Website-3.0/), so a robots.txt
   committed here is served at /Personal-Website-3.0/robots.txt — which no crawler
   requests — while the file that actually governs crawling lives at
   ishinuki-moncion.github.io/robots.txt and belongs to a different repository.
   Two consequences the first version got wrong:
     1. root-relative Disallow paths here would have been wrong even if fetched,
        because the real paths are /Personal-Website-3.0/tests/ etc.;
     2. the file cannot be relied on at all at this URL.
   It is still emitted — correctly path-prefixed — because it becomes live and
   correct the moment the site moves to a custom domain or a user-site root, and
   because the sitemap reference is harmless. Crawl control that must work TODAY
   is expressed as per-page meta robots (see tools/build-locale.mjs), which is
   path-independent. */
export function renderRobots() {
  const base = new URL(ORIGIN).pathname.replace(/\/$/, '');
  return `# ${ORIGIN}
# NOTE: served at ${base}/robots.txt on GitHub Pages project hosting, where
# crawlers do not look for it. Authoritative only if this site moves to an
# origin root. Per-page <meta name="robots"> is what governs crawling today.
User-agent: *
Allow: /

# Verification artefacts and development tooling are not content.
Disallow: ${base}/tests/
Disallow: ${base}/shots/
Disallow: ${base}/docs/

Sitemap: ${ORIGIN}/sitemap.xml
`;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const files = [
    ['robots.txt', renderRobots()],
    ['sitemap.xml', renderSitemap(sitemapEntries())],
  ];
  let drifted = 0;
  for (const [name, body] of files) {
    const path = join(ROOT, name);
    if (checkOnly) {
      const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
      if (current !== body) { drifted++; console.error(`[build-discovery] DRIFT: ${name}`); }
      continue;
    }
    writeFileSync(path, body);
    console.log(`[build-discovery] ${name}`);
  }
  if (checkOnly) {
    if (drifted) { console.error('[build-discovery] run `npm run build:discovery`'); process.exit(1); }
    console.log('[build-discovery] robots.txt and sitemap.xml match their source');
  } else {
    console.log(`[build-discovery] ${sitemapEntries().length} URL(s); ja/ ${JAPANESE_WORDING_APPROVED ? 'included' : 'withheld pending owner wording review'}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
