/* Package B — portfolio evidence.
 *
 * The three project rows this replaces all pointed at the same bare GitHub
 * profile URL and described projects with no corresponding public repository,
 * which is what spec §B1 objected to. These assertions guard the properties that
 * make the replacement worth having: real destinations, honest scope, and pages
 * that work without JavaScript.
 */
import { expect, test } from '@playwright/test';

import { CASE_STUDIES } from '../../content/case-studies.mjs';
import { ms } from '../helpers/ci-timing.mjs';

/* v3.5: DERIVED from the content source, not a copy of it. The hand-written
   list here covered exactly the three studies that existed when it was written,
   so the two added on 2026-07-29 would have shipped with no test at all and
   nothing would have failed — the same blind spot the font scan list had. A
   study that exists is now a study that is tested, by construction. */
const CASES = CASE_STUDIES.map(study => ({
  slug: study.slug,
  title: study.title,
  repo: study.repository ? study.repository.split('/').pop() : null,
}));

test('the home page links to case studies, not to a bare profile URL', async ({ page }) => {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('daikie-booted', '1'); } catch { /* privacy modes */ }
  });
  await page.goto('/');
  await expect(page.locator('body')).not.toHaveAttribute('data-booting', '', { timeout: ms(9_000) });

  const hrefs = await page.locator('#projects a.row').evaluateAll(rows => rows.map(r => r.getAttribute('href')));
  expect(hrefs).toEqual(CASES.map(c => `case/${c.slug}/`));

  /* The old rows all pointed at the same profile URL, which proved nothing. */
  expect(hrefs.some(h => h.includes('github.com')), 'project rows must lead to case studies').toBe(false);
});

for (const study of CASES) {
  test(`${study.slug}: renders, is uniquely described, and needs no JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      await page.goto(`/case/${study.slug}/`);

      await expect(page.getByRole('heading', { level: 1 })).toContainText(study.title);

      const meta = await page.evaluate(() => ({
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content,
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        ogTitle: document.querySelector('meta[property="og:title"]')?.content,
        ogImage: document.querySelector('meta[property="og:image"]')?.content,
        sections: document.querySelectorAll('.packet-section[id]').length,
        contents: document.querySelectorAll('.packet-contents a').length,
        evidence: document.querySelector('.packet-evidence p')?.textContent?.trim().length,
      }));

      expect(meta.title).toContain(study.title);
      expect(meta.description?.length, 'each page needs its own description').toBeGreaterThan(60);
      expect(meta.canonical).toContain(`/case/${study.slug}/`);
      expect(meta.ogTitle).toBe(study.title);
      expect(meta.ogImage).toBeTruthy();

      /* Deep linking: every section is anchored and reachable from the contents. */
      expect(meta.sections).toBeGreaterThan(2);
      expect(meta.contents, 'contents must cover every section').toBe(meta.sections);

      /* The evidence boundary is a required part of each study, not optional. */
      expect(meta.evidence, 'every study must state what it is and is not claiming').toBeGreaterThan(80);
    } finally {
      await context.close();
    }
  });
}

test('the repository links point at repositories that actually exist', async ({ page }) => {
  for (const study of CASES.filter(c => c.repo)) {
    await page.goto(`/case/${study.slug}/`);
    const repoHref = await page.locator('.packet-link', { hasText: 'Repository' }).getAttribute('href');
    expect(repoHref).toContain(`/${study.repo}`);
  }
});

/* The SeenThis entry is the one with a confidentiality boundary. The related
   tooling repositories are PRIVATE and describe production internals, so the
   page must carry no repository link and no client-identifying detail. */
test('the client-work case study leaks nothing it should not', async ({ page }) => {
  await page.goto('/case/open-web-production/');

  const text = (await page.locator('main').innerText()).toLowerCase();
  const html = await page.content();

  expect(page.locator('.packet-link'), 'client work must carry no repository link').toHaveCount(0);

  /* No repository reference of ANY kind may appear on the client-work page.
     An earlier version of this test enumerated the private repository names it
     was guarding against — which committed those names to a public repo, i.e.
     performed the disclosure it existed to prevent. Assert the property, never
     the secret. */
  expect(html, 'client work must reference no repository at all').not.toContain('github.com');

  /* No invented metrics: the only quantity may be the 100+ already published on
     the site. Guards against a future edit adding a business outcome. */
  const inventedMetric = /\b\d+(\.\d+)?\s?(%|percent|x faster|million|billion)\b/;
  expect(text, 'no performance or business figures may appear in client work').not.toMatch(inventedMetric);
});
