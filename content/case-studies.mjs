/* Case-study content. Facts only.
 *
 * Spec 2026-07-21 §3: "Do not invent portfolio claims, client names, private
 * campaign details, metrics, dates, or outcomes. Use only facts already present
 * in the repository or public repositories."
 *
 * Every claim below traces to one of:
 *   - this repository's committed code, tests, measurements or design records;
 *   - a public repository on github.com/Ishinuki-Moncion (verified 2026-07-27);
 *   - the existing site copy, which the owner authored.
 *
 * Deliberately absent: business outcomes, client names, traffic or revenue
 * figures, team sizes, and any claim about work done under NDA. The SeenThis
 * entry carries NO repository link — the related tooling repositories are
 * private and describe production internals.
 *
 * TWO ENTRIES DESCRIBE PRIVATE REPOSITORIES (added 2026-07-29, owner-approved).
 * Neither carries a link, and neither may ever acquire one while the source is
 * private. They are written from the parts their own NOTICE licenses to the
 * author — © 2026 Daikie Ishinuki, MIT: the plugin, its scripts and parity
 * checks, the setup, the tests and the specs. That NOTICE explicitly excludes,
 * and forbids copying into any public or client-facing artifact: extracted
 * client brand systems, templates, shipped or shipped-adjacent creative, the
 * vendored production kit and gallery corpus, and real campaign or brand names.
 * None of it appears here. Neither do colleague names, internal repository or
 * skill names, or any per-client finding. What is described is the shape of the
 * engineering, which is the author's own work to describe.
 */

export const PROFILE = {
  name: 'Ishinuki Daikie',
  origin: 'https://ishinuki-moncion.github.io/Personal-Website-3.0',
  github: 'https://github.com/Ishinuki-Moncion',
};

export const CASE_STUDIES = [
  {
    slug: 'daikieos',
    index: '01',
    title: 'daikieOS — Personal Website 3.0',
    kicker: 'Engineering case study',
    year: '2026',
    summary:
      'A zero-build portfolio whose centrepiece is a real-time WebGL scene, engineered so that losing the scene costs the scene and nothing else.',
    description:
      'How a zero-build, no-framework portfolio runs a real-time WebGL scene as progressive enhancement — measured device tiering, a bounded postprocessing budget, and a site that stays usable when every optional module fails.',
    repository: 'https://github.com/Ishinuki-Moncion/Personal-Website-3.0',
    stack: ['JavaScript (ES modules)', 'three.js r158', 'GLSL', 'Playwright', 'Lighthouse'],
    role: 'Sole designer and engineer.',
    evidence:
      'Everything below is verifiable in the public repository: the code, the test suite that constrains it, and the design records that explain why each decision was made.',
    sections: [
      {
        heading: 'Context',
        body: [
          'A portfolio for a developer and photographer needs to do two things that pull against each other: prove engineering capability, and load fast enough that nobody leaves before it has proved anything.',
          'The site ships no build step. The browser receives the same ES modules that are committed, resolved through an import map. There is no bundler, no framework, and no runtime dependency beyond a vendored copy of three.js.',
        ],
      },
      {
        heading: 'Constraint: the scene is optional',
        body: [
          'The WebGL scene is the most expensive thing on the page and the least essential. So it is treated as progressive enhancement rather than as the application: navigation, language switching, the gallery, the lightbox and the contact action all initialise before it and never depend on it.',
          'That is enforced, not asserted. The browser suite aborts individual module requests — three.js, the scene module, the scene failure boundary itself, and the purely decorative custom-cursor module — and requires that the page still reveals, still scrolls, and still answers every essential interaction.',
        ],
      },
      {
        heading: 'Deciding what a device can afford',
        body: [
          'Render quality is decided by measurement, never by identity. User-agent strings, GPU renderer strings and device-memory hints are all excluded on principle: they describe what a device claims to be, not what it can currently do.',
          'Instead a short WebGL2 probe runs after first paint, draws an instanced workload representative of the real scene, and uses a synchronous pixel read as a completion fence so the timing reflects GPU work rather than command submission. It yields between iterations so it cannot block the main thread, and releases every buffer, texture, framebuffer, shader and program by identity before losing its temporary context — on success, on allocation failure, on read failure, on timeout, and on exception.',
          'Reduced motion wins over all of it and never runs the probe at all.',
        ],
      },
      {
        heading: 'Spending a memory budget you can actually compute',
        body: [
          'Postprocessing is where a mobile GPU runs out of memory. The attachment cost is computed before anything is allocated — half-float colour targets, multisample storage plus its resolve texture, and the bloom mip chain — and compared against a fixed budget. Over budget, the scene fails closed to direct rendering rather than allocating and hoping.',
          'A resize is an allocation point too, not just boot: growing a window reallocates every target at the new size, so the budget is re-evaluated there and fails closed the same way.',
        ],
      },
      {
        heading: 'When the measurement was wrong',
        body: [
          'A sustained-low-framerate watchdog demotes the scene once per session: it disposes the postprocessing chain, drops a live device-pixel-ratio cap that survives rotation, switches to direct rendering, and never re-promotes.',
          'Getting that right required disposing resources the upstream library does not — three.js r158 omits one internal bloom material from its own dispose method, so it is registered and released explicitly, and every reference is severed afterwards so nothing stays reachable through a retained debug handle.',
        ],
      },
      {
        heading: 'Rendering identically in two engines',
        body: [
          'The scene once looked correct in Chrome and washed out in Safari. The cause was compositing, not shading: canvases composite as premultiplied alpha, and WebKit clamps colour channels to the alpha channel while Chromium passes out-of-range values through. An additive scene routinely produces colour above its own alpha, so every glow and every low-alpha raindrop was being crushed on iOS.',
          'Clearing the buffer at full alpha, in linear space, makes every composited pixel valid premultiplied colour — and both engines then display identical bytes.',
        ],
      },
      {
        heading: 'Delivery is not design',
        body: [
          'The two Japanese typefaces were loaded from a third-party CDN behind a render-blocking stylesheet, on the recorded assumption that subsetting Japanese was impractical. Measurement disproved it: the committed pages use fewer than 200 distinct CJK codepoints, so both faces subset to well under 60KB each — around a 98% reduction.',
          'Because the Japanese fallback stack was a Latin face, Japanese text painted in a system font and then reflowed when the CDN face arrived. One wrong assumption was therefore producing two failing metrics at once. Self-hosting content-driven subsets fixed both, changed nothing about the type design, and removed the last third-party origin from the page.',
        ],
        metrics: {
          caption: 'Production-network Lighthouse, mobile, median of three cold runs',
          rows: [
            ['Performance', '60', '94'],
            ['First Contentful Paint', '4185 ms', '1503 ms'],
            ['Largest Contentful Paint', '4859 ms', '2327 ms'],
            ['Cumulative Layout Shift', '0.172', '0.059'],
          ],
        },
      },
      {
        heading: 'What I would do differently',
        body: [
          'The structural checks that guard this codebase match source text rather than behaviour. They are effective at preventing a safety gate from being quietly deleted, but they fail on correct refactors and they read like behavioural coverage when they are not. I would separate the two concerns explicitly.',
          'The deterministic performance gate blocked the third-party font request to make runs repeatable — which also removed the single largest real-world cost from the measurement. A gate that excludes the dominant production variable measures a site nobody receives. Both modes are now run, and the honest one is the one that has to pass.',
        ],
      },
    ],
  },

  {
    slug: 'tokyo-data-globe',
    index: '02',
    title: 'Tokyo Data Globe',
    kicker: 'Scene and interaction case study',
    year: '2026',
    summary:
      'A particle Earth built from land-only points, with a great-circle arc that draws itself Dallas to Tokyo. Plain three.js, no build step.',
    description:
      'A standalone three.js scene lab: a land-only particle Earth, a pulsing Tokyo node, and a self-drawing great-circle arc — built with no build step so the scene stays the only variable.',
    repository: 'https://github.com/Ishinuki-Moncion/tokyo-data-globe',
    demo: 'https://ishinuki-moncion.github.io/tokyo-data-globe/',
    stack: ['JavaScript', 'three.js', 'GLSL', 'Natural Earth data'],
    role: 'Sole designer and engineer.',
    evidence:
      'Public repository with a live demo. The scene is a single readable module, deliberately — the repository README maps every tunable to the line that owns it.',
    sections: [
      {
        heading: 'Why a separate lab',
        body: [
          'The globe is the centrepiece of the portfolio, which makes it the worst place to experiment. This repository exists so the scene can be changed in isolation, with no page choreography, no scroll coupling and no boot sequence in the way.',
          'It runs from any static server with no build step, so the scene is the only variable.',
        ],
      },
      {
        heading: 'An Earth made only of land',
        body: [
          'The globe is a particle field rather than a textured sphere. Points are accepted or rejected against a land mask baked from Natural Earth 110m land polygons into a 384×192 equirectangular bitmask, embedded in the source and decoded once at startup.',
          'That keeps the silhouette recognisable at a glance while leaving the oceans genuinely empty — the shape reads as coastline rather than as a texture.',
        ],
      },
      {
        heading: 'Motion that costs nothing per frame',
        body: [
          'The particle breathing is computed in the vertex shader from a single time uniform. Nothing is uploaded per frame: there is no buffer rewrite, no per-point CPU work, and the cost is independent of the particle count.',
          'The Dallas to Tokyo arc is a spherical interpolation between two coordinates, revealed by advancing the geometry draw range rather than by rebuilding it. The timebase is scaled by real elapsed time, so the motion is frame-rate independent.',
        ],
      },
      {
        heading: 'Behaving when the browser stops cooperating',
        body: [
          'The render loop pauses when the tab is hidden and resumes without duplicating itself. A lost WebGL context is handled rather than left to freeze the canvas.',
          'Reduced motion renders a single meaningful static frame — Tokyo rotated to face the camera and the arc fully drawn — rather than an empty or arbitrary one. The still frame has to tell the same story as the animation.',
        ],
      },
    ],
  },

  {
    slug: 'open-web-production',
    index: '03',
    title: 'Open-Web Campaign Production',
    kicker: 'Practice case study — SeenThis Japan, Tokyo',
    year: 'March 2025 — present',
    summary:
      'Technical Producer building and converting advertising creative into open-web display formats in HTML, CSS and JavaScript.',
    description:
      'Technical Producer at SeenThis Japan, Tokyo: building and converting advertising creative into open-web display formats, across more than 100 campaign lifecycles.',
    stack: ['HTML', 'CSS', 'JavaScript', 'Premiere', 'Photoshop'],
    role: 'Technical Producer, SeenThis Japan — Tokyo.',
    /* Deliberate: no repository link, no client names, no campaign details, no
       performance or business figures. The related tooling repositories are
       private and describe production internals. */
    evidence:
      'This entry is written at the level of practice rather than of any individual campaign. Client work is not mine to publish, so no client, creative, metric or campaign detail appears here. The only quantity stated — more than 100 campaign lifecycles — is the figure already published on this site.',
    sections: [
      {
        heading: 'The work',
        body: [
          'Advertising creative arrives as design and video, and has to leave as display formats that run on the open web: real HTML, CSS and JavaScript, inside strict size budgets, across a matrix of placements and devices that the creative was not designed for.',
          'Since March 2025 I have taken more than 100 campaign lifecycles through that process end to end, from creation to execution.',
        ],
      },
      {
        heading: 'What the constraint teaches',
        body: [
          'Display advertising is an unusually honest performance environment. The weight budget is fixed and small, the runtime is somebody else\'s page, and there is no opportunity to ask a visitor to wait. Every kilobyte has to justify itself against the thing it renders.',
          'Working inside that budget at volume is where most of my instinct for delivery cost comes from — the habit of measuring what a page actually ships rather than what it appears to ship, and of treating asset delivery as a separate discipline from design.',
        ],
      },
      {
        heading: 'Volume as a design problem',
        body: [
          'At one campaign the interesting question is the creative. At a hundred it is the process: what is genuinely per-campaign, what is the same every time, and what only looks the same until it fails.',
          'That pressure is what pushed me toward building tooling for the repetitive parts, and toward the view that a production pipeline should make the correct result the easy one rather than relying on care at every step.',
        ],
      },
    ],
  },

  {
    slug: 'night-shift-studio',
    index: '04',
    title: 'Night-Shift Studio',
    kicker: 'Engineering case study — internal tooling',
    year: '2026',
    summary:
      'An unattended overnight production pipeline: hand over the order at night, and by morning there is a board of checked creative directions and an honest account of what could not be verified.',
    description:
      'Designing an agent pipeline to run unattended overnight — a generated second edition kept honest by a parity check, a permission model built so an unsupervised run cannot stall, and a system-wide rule that nothing it operates on is ever published, sent or deleted.',
    stack: ['Python', 'Claude Code plugin', 'pytest', 'Bash'],
    role: 'Sole author of the original work.',
    /* No repository link, and none may be added: the source is private, and its
       NOTICE forbids copying the excluded client material into any public
       artifact. Everything below is drawn from the MIT-licensed original work. */
    evidence:
      'The source is private and stays private, because it carries extracted client brand systems and shipped creative that are not mine to license. What I can describe is my own work inside it — the plugin, its scripts and parity checks, the tests and the design records — so this entry is about engineering decisions rather than about anything produced with them. No client, brand, campaign or colleague appears here, and no figure is claimed.',
    sections: [
      {
        heading: 'Context',
        body: [
          'Campaign production at volume splits into three kinds of work: the part that is genuinely creative, the part that is identical every time, and the part that only looks identical until it quietly fails. The third kind is what costs evenings.',
          'This system takes the order that arrives in the morning and runs the mechanical part of it overnight, unattended. The result waiting the next day is a board of checked directions together with a report of what it could not confirm — because a pipeline that hides its uncertainty is worse than one that does nothing.',
        ],
      },
      {
        heading: 'The interesting problem was two editions, not one',
        body: [
          'The system needs to run in two situations: on a machine with full access to its upstream dependencies, and on a machine with none. The obvious answer is to keep a second copy with those dependencies vendored in.',
          'That answer had already failed three times. Two hand-maintained trees with overlapping content drifted every time: a stale registry of skills, a dependency frozen at an old pin, and a template fix that landed in one tree and never reached the other. Each was silent, and each was found late.',
          'So the second edition is not maintained — it is generated from the first by a build script, never hand-edited, and a parity check asserts the two still agree. The failure mode changed from "someone forgets" to "the check fails", which is the only version of this problem I know how to keep solved. One of the tests exists purely to stop stray files drifting into the generated tree.',
        ],
      },
      {
        heading: 'Designing for nobody being there',
        body: [
          'Unattended is a specific engineering constraint, not just a schedule. An agent that pauses for a confirmation at two in the morning has not run; it has waited. So installation registers a permission allowlist ahead of time, precisely so the overnight run reaches the end without a prompt it cannot answer.',
          'The same reasoning applies to missing dependencies. One upstream is required and the run aborts naming it; another is optional, and its absence degrades the run rather than stopping it — but the report says so explicitly. Setup verifies the machine and reports ready, partially ready, or needs attention, rather than claiming success and failing later.',
        ],
      },
      {
        heading: 'Nothing publishes',
        body: [
          'The strongest constraint in the system is a negative one: no component publishes to the CMS, sends a message, or deletes anything it did not create. It reads, it produces, it reports.',
          'That rule is written down as outranking everything else — if something is found that violates it, fixing that comes before whatever else was in progress. Automation that runs while nobody is watching earns trust by the size of the blast radius it cannot reach, and the cheapest way to bound it is to never grant the capability in the first place.',
        ],
      },
      {
        heading: 'What is enforced by tests',
        body: [
          'The checks that matter are the ones about output being wrong in ways a person would not notice: a build over its weight budget, an asset that was modified when it should have been passed through untouched, and files appearing in the generated edition that were never in the source.',
          'The documentation is tested too. Version references in the docs are asserted against the thing they describe, because the failure this project kept hitting was never a broken program — it was a true instruction that had quietly stopped being true.',
        ],
      },
      {
        heading: 'How it was built',
        body: [
          'Each stage began as a dated design record before any of it was written, and the records were kept as written rather than edited to match what shipped — including an audit that went back over completed work and a remediation plan produced after the first end-to-end run met reality.',
          'Keeping superseded records intact matters more than it sounds. A document rewritten to agree with the present is no longer evidence of anything; the value of a dated record is precisely that it says what was believed at the time.',
        ],
      },
    ],
  },

  {
    slug: 'tokyo-apartment-hunt',
    index: '05',
    title: 'Tokyo Apartment Hunt',
    kicker: 'Engineering case study — personal tool',
    year: '2026',
    summary:
      'A self-running apartment search that does the looking on a schedule and reduces the human job to two things: adjust the criteria, and read the results.',
    description:
      'A scheduled personal search pipeline with a bilingual, server-rendered interface that runs only on the machine that owns it — no hosted service, no account, and a local server that shuts itself down when the last tab closes.',
    stack: ['Python', 'Server-rendered HTML', 'Scheduled automation'],
    role: 'Sole designer and engineer.',
    /* Private repository — a personal search over third-party listing sites.
       No link, and no listing, price, address or site name appears here. */
    evidence:
      'Built for my own apartment search in Tokyo. The repository is private and no listing data, price, address or source site is described here — what is worth writing down is the design, not the search.',
    sections: [
      {
        heading: 'The problem is repetition, not searching',
        body: [
          'Looking for an apartment in Tokyo under a fixed budget, in specific wards, near specific stations, is not a hard search. It is the same search, run again every day, for weeks — and the cost is entirely in remembering to run it and in noticing what changed since yesterday.',
          'So the design goal was to remove the human from the repetition without removing them from the decision: a scheduled run does the whole pipeline and produces a digest. Adjusting the criteria and looking at the results is the entire remaining job.',
        ],
      },
      {
        heading: 'A local tool, deliberately',
        body: [
          'This runs on one machine and serves one person. It is not a hosted service, there is no account, and no data leaves the laptop — which for a search tied to where somebody is about to live is the correct default rather than a limitation.',
          'The front door is a double-clickable launcher that opens a browser page. The local server picks a free port if its default is already taken, and shuts itself down a few minutes after the last tab closes — never mid-run. Software that runs on your own machine should not need to be remembered about, or manually stopped.',
        ],
      },
      {
        heading: 'Bilingual, and rendered as one language',
        body: [
          'The interface is Japanese and English, and the choice persists. It is rendered server-side in the selected language and delivered as that language — rather than shipping both and toggling in the browser, or handing the page to a machine translator.',
          'That matters for a housing search specifically. Japanese listing vocabulary is precise, and terms of the trade — deposit and key money, the guarantor arrangement, the stove type, the move-in window — do not survive being approximated. Where a term is a term, it stays in Japanese in both renderings.',
        ],
      },
      {
        heading: 'Comparing, and watching change',
        body: [
          'Results are a filterable table with a seen state, so a listing already dismissed stays dismissed on later runs. Favourites open into a side-by-side ledger grouped by what actually decides these choices: cost, commute and location, and the property itself — including the parts that are easy to miss until move-in.',
          'Because every run is retained, the tool also shows its own history: how prices and availability have moved over time. A single run tells you what is on the market; the series tells you whether waiting is working, which is the question you actually have.',
        ],
      },
    ],
  },
];
