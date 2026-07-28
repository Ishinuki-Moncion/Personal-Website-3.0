/* Package C — crawlable Japanese page and discovery surface. */
import { expect, test } from '@playwright/test';

test('the Japanese page is a real page, not a client-side text swap', async ({ browser }) => {
  /* JavaScript disabled: the whole point of a static locale page is that its
     meaning does not depend on a runtime toggle. */
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('/ja/');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');

    const state = await page.evaluate(() => ({
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      alternates: [...document.querySelectorAll('link[rel="alternate"][hreflang]')]
        .map(l => `${l.getAttribute('hreflang')}:${l.getAttribute('href')}`).sort(),
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
      ogLocale: document.querySelector('meta[property="og:locale"]')?.getAttribute('content'),
      navText: document.querySelector('.nav-link')?.textContent?.trim(),
    }));

    expect(state.canonical, 'the Japanese page must be its own canonical').toContain('/ja/');
    expect(state.ogLocale).toBe('ja_JP');

    /* Reciprocal, and exactly one of each — duplicate hreflang is a conflicting
       annotation, not a stronger one. */
    expect(state.alternates).toHaveLength(3);
    expect(state.alternates.some(a => a.startsWith('ja:'))).toBe(true);
    expect(state.alternates.some(a => a.startsWith('x-default:'))).toBe(true);

    /* Japanese wording is an explicit owner gate. Until it is approved the page
       must not be indexable, or an unreviewed translation is published as
       finished work. */
    expect(state.robots, 'unreviewed translation must be noindex').toContain('noindex');

    /* Rendered Japanese, present in the served HTML with no script running. */
    expect(state.navText).not.toBe('Work');
  } finally {
    await context.close();
  }
});

test('the Japanese page loads its assets from one level up', async ({ page }) => {
  const missing = [];
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('favicon')) missing.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('/ja/');
  await page.waitForTimeout(1500);
  /* The transform rewrites href/src AND inline background-image url(); missing
     the latter left every gallery thumbnail and the portrait blank while the
     English page looked perfectly fine. */
  expect(missing, 'no asset may 404 from the nested locale path').toEqual([]);
});

test('the English page advertises its Japanese alternate', async ({ page }) => {
  await page.goto('/');
  const alternates = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(l => l.getAttribute('hreflang')).sort()
  );
  expect(alternates).toEqual(['en', 'ja', 'x-default']);
});

test('robots.txt and sitemap.xml are served and agree with each other', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  const robotsBody = await robots.text();
  expect(robotsBody).toContain('Sitemap:');
  expect(robotsBody, 'verification artefacts are not content').toMatch(/Disallow: \S*\/tests\//);

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');

  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  expect(locs.length).toBeGreaterThan(3);

  /* A sitemap that lists a noindex URL contradicts itself. */
  expect(locs.some(loc => loc.endsWith('/ja/')), 'a noindex page must not be listed').toBe(false);

  /* Every listed case study must actually resolve. */
  for (const loc of locs.filter(l => l.includes('/case/'))) {
    const path = new URL(loc).pathname.replace('/Personal-Website-3.0', '');
    expect((await request.get(path)).status(), `${loc} is listed but does not resolve`).toBe(200);
  }
});

test('structured data describes the person and the site with stable identity', async ({ page }) => {
  await page.goto('/');
  const graph = await page.evaluate(() =>
    [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent))
  );
  const nodes = graph.flatMap(entry => entry['@graph'] ?? [entry]);
  const person = nodes.find(n => n['@type'] === 'Person' && n['@id']);
  const website = nodes.find(n => n['@type'] === 'WebSite');

  expect(person, 'a Person node with a stable @id must exist').toBeTruthy();
  expect(person.sameAs?.length, 'sameAs should link verifiable profiles').toBeGreaterThan(1);
  expect(website?.publisher?.['@id'], 'WebSite must reference the Person by @id').toBe(person['@id']);

  /* Every code node must point at a repository that the case studies also cite. */
  for (const code of nodes.filter(n => n['@type'] === 'SoftwareSourceCode')) {
    expect(code.codeRepository).toMatch(/^https:\/\/github\.com\/Ishinuki-Moncion\//);
    expect(code.author['@id']).toBe(person['@id']);
  }
});
