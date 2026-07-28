/* Generates ja/index.html from the canonical, hand-authored index.html.
 *
 * ARCHITECTURE (owner decision, 2026-07-27). The corrective spec §C1 called for
 * content/en.json + content/ja.json + templates/home.mjs generating BOTH pages.
 * That would turn index.html — hand-authored, carrying the inline design
 * rationale for a composition under an explicit visual lock — into a build
 * artifact. The owner chose the lower-risk path: index.html stays canonical, and
 * the Japanese page is a deterministic TRANSFORM of it.
 *
 * The consequence that matters: there is exactly ONE copy of each string, the
 * data-ja attribute already sitting next to its English original. Translation
 * drift is structurally impossible rather than merely tested for, and the
 * runtime EN/JA toggle improves with the same edit that improves the static page.
 *
 * The transform:
 *   1. html lang="en" -> "ja"
 *   2. every [data-en][data-ja] element renders its Japanese text
 *   3. canonical, og:url and og:locale point at the Japanese URL
 *   4. reciprocal hreflang links on BOTH pages
 *   5. asset paths become ../ relative, since the page lives one level down
 *
 * Japanese wording is NOT owner-approved. Until it is, the generated page
 * carries a robots noindex directive so an unreviewed translation cannot be
 * indexed as if it were finished. Removing that is a one-line owner gate.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ORIGIN = 'https://ishinuki-moncion.github.io/Personal-Website-3.0';

/* Set to true only when the owner has reviewed the Japanese wording. */
export const JAPANESE_WORDING_APPROVED = false;

const decode = value => value
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const encode = value => value
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Replace an element's text content with its data-ja value. */
function applyJapaneseText(html) {
  let applied = 0;
  const out = html.replace(
    /(<([a-z0-9]+)\b[^>]*\bdata-ja="([^"]*)"[^>]*>)([\s\S]*?)(<\/\2>)/gi,
    (whole, openTag, tag, japanese, inner, closeTag) => {
      /* Only substitute leaf text. An element containing markup (the contact
         headline wraps <em>) would lose that markup, so it is left to the
         runtime toggle rather than silently flattened here. */
      if (/</.test(inner)) return whole;
      applied++;
      return openTag + encode(decode(japanese)) + closeTag;
    }
  );
  return { html: out, applied };
}

export function buildJapanese(indexHtml) {
  let html = indexHtml;

  html = html.replace(/<html lang="en">/, '<html lang="ja">');
  const { html: translated, applied } = applyJapaneseText(html);
  html = translated;

  /* One level down: every relative asset reference needs ../
     This also (correctly) rewrites data-src, which app.js uses as the lightbox
     image URL. */
  html = html.replace(/((?:href|src)=")(?!https?:|data:|#|\/|\.\.\/)/g, '$1../');
  /* Inline background-image:url(...) is neither href nor src, so it is rewritten
     separately — missing it left every gallery thumbnail and the portrait
     blank on the Japanese page while the English page looked fine. */
  html = html.replace(/url\((['"]?)(?!https?:|data:|\/|\.\.\/)([^'")]+)\1\)/g, 'url($1../$2$1)');
  /* The import map is JSON inside a <script>, so neither of the rules above
     reaches it. Left unrewritten, every bare "three" specifier resolved against
     /ja/ and the whole scene 404'd — on the locale page only. */
  html = html.replace(
    /(<script type="importmap">)([\s\S]*?)(<\/script>)/,
    (whole, open, body, close) => open + body.replace(/"\.\//g, '"../') + close
  );

  /* Metadata must be Japanese too. A locale page that renders Japanese but
     serves an English <title>, description and og: copy is what a crawler and a
     share preview actually see — the page would be indexed, and shared, in the
     wrong language. Likewise the JSON-LD inLanguage. */
  const META_JA = {
    title: 'Ishinuki Daikie — 開発者 / 写真家、東京',
    description: '東京を拠点に、オープンウェブとインタラクティブ制作を手がける開発者・写真家。テクニカルプロデューサーとして100件を超えるキャンペーンを担当。',
  };
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${META_JA.title}</title>`);
  for (const [attr, key] of [['name="description"', 'description'], ['property="og:description"', 'description'],
                             ['property="og:title"', 'title'], ['name="twitter:title"', 'title'],
                             ['name="twitter:description"', 'description']]) {
    html = html.replace(new RegExp(`(<meta ${attr} content=")[^"]*(")`), `$1${META_JA[key]}$2`);
  }
  html = html.replace(/"inLanguage": "en"/g, '"inLanguage": "ja"');
  /* The @id values are shared identity anchors and must NOT be rewritten: both
     pages describe the SAME person and site, so duplicating the graph under new
     ids would assert two different people. Only url/inLanguage are locale-bound. */
  html = html.replace(/("url": ")([^"]*Personal-Website-3\.0)(\/")/g, '$1$2/ja$3');

  html = html.replace(
    /<link rel="canonical"[^>]*\/?>/,
    `<link rel="canonical" href="${ORIGIN}/ja/" />`
  );
  if (!/<link rel="canonical"/.test(html)) {
    html = html.replace('</head>', `<link rel="canonical" href="${ORIGIN}/ja/" />\n</head>`);
  }
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${ORIGIN}/ja/$2`);
  html = html.replace(/(<meta property="og:locale" content=")[^"]*(")/, '$1ja_JP$2');
  if (!/og:locale/.test(html)) {
    html = html.replace('</head>', '<meta property="og:locale" content="ja_JP" />\n</head>');
  }

  /* The alternates are inherited from the canonical page, which already carries
     them — adding a second copy would emit duplicate hreflang, which search
     engines treat as a conflicting annotation rather than a stronger one. */
  if (!/hreflang="ja"/.test(html)) {
    const alternates = [
      `<link rel="alternate" hreflang="en" href="${ORIGIN}/" />`,
      `<link rel="alternate" hreflang="ja" href="${ORIGIN}/ja/" />`,
      `<link rel="alternate" hreflang="x-default" href="${ORIGIN}/" />`,
    ].join('\n');
    html = html.replace('</head>', `${alternates}\n</head>`);
  }

  if (!JAPANESE_WORDING_APPROVED) {
    html = html.replace(
      '</head>',
      '<!-- Japanese wording is pending owner review (tools/build-locale.mjs).\n' +
      '     noindex until approved, so an unreviewed translation is not indexed\n' +
      '     as finished work. Flip JAPANESE_WORDING_APPROVED to remove this. -->\n' +
      '<meta name="robots" content="noindex, follow" />\n</head>'
    );
  }

  return { html, applied };
}

/** The English page must advertise the same reciprocal set. */
export function withAlternates(indexHtml) {
  if (/hreflang="ja"/.test(indexHtml)) return indexHtml;
  const alternates = [
    `<link rel="alternate" hreflang="en" href="${ORIGIN}/" />`,
    `<link rel="alternate" hreflang="ja" href="${ORIGIN}/ja/" />`,
    `<link rel="alternate" hreflang="x-default" href="${ORIGIN}/" />`,
  ].join('\n');
  return indexHtml.replace('</head>', `${alternates}\n</head>`);
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const indexPath = join(ROOT, 'index.html');
  const source = readFileSync(indexPath, 'utf8');

  const withLinks = withAlternates(source);
  if (withLinks !== source && !checkOnly) {
    writeFileSync(indexPath, withLinks);
    console.log('[build-locale] added reciprocal hreflang links to index.html');
  }

  const { html, applied } = buildJapanese(withLinks);
  const target = join(ROOT, 'ja', 'index.html');

  if (checkOnly) {
    const current = existsSync(target) ? readFileSync(target, 'utf8') : null;
    if (current !== html || withLinks !== source) {
      console.error('[build-locale] DRIFT: ja/index.html is out of date — run `npm run build:locale`');
      process.exit(1);
    }
    console.log(`[build-locale] ja/index.html matches its source (${applied} strings)`);
    return;
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, html);
  console.log(`[build-locale] ja/index.html — ${applied} strings rendered in Japanese`);
  console.log(`[build-locale] wording approved: ${JAPANESE_WORDING_APPROVED} ${JAPANESE_WORDING_APPROVED ? '' : '(page is noindex until reviewed)'}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
