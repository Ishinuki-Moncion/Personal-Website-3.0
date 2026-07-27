/* Browser-level guard for the self-hosted Japanese subsets.
 *
 * tests/unit/font-coverage.test.mjs proves the SHIPPED BYTES cover the needed
 * codepoints. This proves the BROWSER actually uses them: a subset can be present,
 * correctly hashed, and still never applied — a wrong @font-face path, a
 * unicode-range that excludes the text, or a family-name mismatch all degrade
 * silently to a system JP face. On a Mac that looks fine to the author, so only an
 * explicit measurement catches it.
 */
import { expect, test } from '@playwright/test';

const JP_SAMPLE = '東京作品概要';

test('Japanese text is rendered by the self-hosted subset, not a system fallback', async ({ page }) => {
  await page.goto('/');

  /* The face is fetched lazily, only once the browser needs a glyph it covers,
     so poll rather than assuming it has settled by document.fonts.ready.

     FontFace.family is NOT normalized across engines: WebKit returns it with the
     CSS quoting intact ('"M PLUS Rounded 1c"') while Chromium strips the quotes.
     A bare === comparison therefore passes on Chromium and fails on Safari — the
     engine that matters most here — so unquote before comparing. */
  await expect
    .poll(
      () => page.evaluate(() =>
        [...document.fonts].some(face =>
          face.family.replace(/^["']|["']$/g, '') === 'M PLUS Rounded 1c' &&
          face.weight === '400' &&
          face.status === 'loaded'
        )
      ),
      { message: 'the preloaded M PLUS 400 subset never reached status "loaded"' }
    )
    .toBe(true);

  const result = await page.evaluate(sample => {
    /* Deliberately NOT a width comparison. CJK ideographs are uniformly
       full-width (1em advance) in every Japanese font, so measureText returns an
       identical value for the real face and for any system fallback — verified:
       both measured exactly 240px at 40px. Rasterising and comparing pixels is
       the only measurement that can tell the two apart. */
    const raster = family => {
      const canvas = document.createElement('canvas');
      canvas.width = 260;
      canvas.height = 56;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#000';
      context.font = `400 40px ${family}`;
      context.textBaseline = 'top';
      context.fillText(sample, 0, 4);
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const withFace = raster('"M PLUS Rounded 1c", sans-serif');
    const fallback = raster('sans-serif');
    let differing = 0;
    let inked = 0;
    for (let i = 0; i < withFace.length; i += 4) {
      if (withFace[i] < 128) inked++;
      if (withFace[i] !== fallback[i]) differing++;
    }
    return {
      claimsGlyphs: document.fonts.check('400 16px "M PLUS Rounded 1c"', sample),
      differingPixels: differing,
      inkedPixels: inked,
    };
  }, JP_SAMPLE);

  expect(result.claimsGlyphs, 'M PLUS Rounded 1c must claim the JP sample glyphs').toBe(true);
  /* Guards against a blank raster trivially "differing" from another blank one. */
  expect(result.inkedPixels, 'the sample must actually draw glyphs, not tofu-free blank').toBeGreaterThan(500);
  expect(
    result.differingPixels,
    'the subset rasterises identically to the system fallback — it is not being applied'
  ).toBeGreaterThan(200);
});

test('the English page fetches no third-party font and never loads the ja-only face', async ({ page }) => {
  const fontRequests = [];
  page.on('request', request => {
    const url = request.url();
    if (/\.woff2?(\?|$)/.test(url)) fontRequests.push(url);
  });

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const thirdParty = fontRequests.filter(url => !url.includes('127.0.0.1') && !url.startsWith('data:'));
  expect(thirdParty, 'no webfont may come from a third-party origin').toEqual([]);

  /* Zen Kaku Gothic New is scoped to html[lang="ja"] (css/site.css), so an English
     page that fetches it is wasting ~39KB on glyphs it will never paint. */
  const zenKaku = fontRequests.filter(url => url.includes('zen-kaku'));
  expect(zenKaku, 'Zen Kaku is ja-only and must stay unfetched on the English page').toEqual([]);

  expect(
    fontRequests.some(url => url.includes('mplus-rounded-1c-400')),
    'the preloaded M PLUS 400 subset should be fetched'
  ).toBe(true);
});

test('switching to Japanese loads the ja display face and still renders real glyphs', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  await page.locator('.lang-btn').first().click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await page.evaluate(() => document.fonts.ready);

  const zenKakuUsable = await page.evaluate(() =>
    document.fonts.check('700 16px "Zen Kaku Gothic New"', '作品')
  );
  expect(zenKakuUsable, 'the ja display face must cover the headings it styles').toBe(true);
});
