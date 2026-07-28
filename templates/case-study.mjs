/* Deterministic case-study page template.
 *
 * Standard library only, no template engine, no client runtime. The generated
 * page needs no JavaScript to be readable: prose, links and metadata are all
 * static, and the only script is the shared site chrome.
 *
 * The visual form is the restrained CASE_PACKET the spec asks for — the same
 * instrument language as the home page, with far fewer effects and no WebGL
 * scene, because the job of this page is to be read.
 */

/* Single source for the shared stylesheet token: hard-coding it here put a
   second copy outside the cache-version pin, so the two could drift apart. */
export const SITE_CSS_VERSION = '3.34';

const escape = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** Stable anchor slug so every section is deep-linkable. */
export const anchorFor = heading => heading
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

function renderMetrics(metrics) {
  if (!metrics) return '';
  const rows = metrics.rows
    .map(([label, before, after]) => `
        <tr>
          <th scope="row">${escape(label)}</th>
          <td>${escape(before)}</td>
          <td>${escape(after)}</td>
        </tr>`)
    .join('');
  return `
      <figure class="packet-metrics">
        <table>
          <caption>${escape(metrics.caption)}</caption>
          <thead><tr><th scope="col">Metric</th><th scope="col">Before</th><th scope="col">After</th></tr></thead>
          <tbody>${rows}
          </tbody>
        </table>
      </figure>`;
}

function renderSection(section) {
  const id = anchorFor(section.heading);
  const paragraphs = section.body.map(text => `        <p>${escape(text)}</p>`).join('\n');
  return `
      <section class="packet-section" id="${id}">
        <h2><a class="anchor" href="#${id}">${escape(section.heading)}</a></h2>
${paragraphs}${renderMetrics(section.metrics)}
      </section>`;
}

/* Template literals leave trailing whitespace wherever a conditional block
   collapses to '' (the SeenThis entry has no repository link, so its links
   paragraph disappears and leaves an indented blank line). Normalising here
   makes the whole class of lint error structurally impossible rather than
   something each new conditional has to remember. */
const tidy = html => html.split('\n').map(line => line.replace(/\s+$/, '')).join('\n');

export function renderCaseStudy(study, profile) {
  const canonical = `${profile.origin}/case/${study.slug}/`;
  const links = [
    study.repository ? `<a class="packet-link" href="${escape(study.repository)}" rel="noopener" target="_blank">Repository ↗</a>` : '',
    study.demo ? `<a class="packet-link" href="${escape(study.demo)}" rel="noopener" target="_blank">Live demo ↗</a>` : '',
  ].filter(Boolean).join('\n          ');

  const contents = study.sections
    .map(section => `<li><a href="#${anchorFor(section.heading)}">${escape(section.heading)}</a></li>`)
    .join('\n            ');

  return tidy(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${escape(study.title)} — ${escape(profile.name)}</title>
<meta name="description" content="${escape(study.description)}" />
<link rel="canonical" href="${escape(canonical)}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escape(study.title)}" />
<meta property="og:description" content="${escape(study.description)}" />
<meta property="og:url" content="${escape(canonical)}" />
<meta property="og:image" content="${escape(profile.origin)}/images/og.png" />
<meta property="og:image:alt" content="daikieOS — ${escape(profile.name)}, developer and photographer, Tokyo" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escape(study.title)}" />
<meta name="twitter:description" content="${escape(study.description)}" />
<meta name="twitter:image" content="${escape(profile.origin)}/images/og.png" />
<meta name="twitter:image:alt" content="daikieOS — ${escape(profile.name)}, developer and photographer, Tokyo" />
<link rel="icon" href="../../favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="../../images/apple-touch-icon.png" />
<link rel="stylesheet" href="../../css/site.css?v=${SITE_CSS_VERSION}" />
<link rel="stylesheet" href="../../css/case.css?v=1" />
</head>
<body class="packet-body">
<a class="skip-link" href="#packet-main">Skip to content</a>

<header class="packet-head">
  <a class="packet-home" href="../../">← <span>${escape(profile.name)}</span></a>
  <span class="packet-idx" translate="no">CASE_${escape(study.index)}</span>
</header>

<main class="packet" id="packet-main">
  <article>
    <p class="packet-kicker">${escape(study.kicker)}</p>
    <h1>${escape(study.title)}</h1>
    <p class="packet-summary">${escape(study.summary)}</p>

    <dl class="packet-meta">
      <div><dt>Period</dt><dd>${escape(study.year)}</dd></div>
      <div><dt>Role</dt><dd>${escape(study.role)}</dd></div>
      <div><dt>Stack</dt><dd>${study.stack.map(escape).join(' · ')}</dd></div>
    </dl>

    ${links ? `<p class="packet-links">
          ${links}
        </p>` : ''}

    <aside class="packet-evidence">
      <h2>Evidence boundary</h2>
      <p>${escape(study.evidence)}</p>
    </aside>

    <nav class="packet-contents" aria-label="Sections">
      <h2>Contents</h2>
      <ol>
            ${contents}
      </ol>
    </nav>
${study.sections.map(renderSection).join('\n')}
  </article>

  <p class="packet-foot">
    <a href="../../#projects">← All case studies</a>
    <a href="../../#contact">Start a conversation →</a>
  </p>
</main>
</body>
</html>
`);
}
