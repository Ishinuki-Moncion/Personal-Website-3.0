# Personal Website 3.0 Corrective Completion Program

**Date:** 2026-07-21  
**Repository:** `Ishinuki-Moncion/Personal-Website-3.0`  
**Branch:** `v34-mobile-rich`  
**Status:** Owner-approved direction; written-spec review pending  
**Supersedes:** The execution assumptions in `2026-07-16-v34-mobile-richness-design.md` where this document is more specific. The original document remains the record of the owner's mobile-richness intent.

## 1. Goal

Complete Personal Website 3.0 without redesigning its accepted desktop art direction. The program repairs the current mobile and runtime baseline, safely delivers the mobile-rich experience, strengthens portfolio evidence, completes bilingual and semantic behavior, and makes deployment reproducible.

The finished site must communicate the same future-noir / Sony-cinematic identity while becoming faster to first paint, resilient without WebGL, usable at every common phone orientation, credible as a professional portfolio, and crawlable in both English and Japanese.

## 2. Decision summary

Three approaches were considered:

1. **One large rewrite.** Rebuild the static site, localization, case studies, tests, and mobile renderer together. This offers a clean architecture but puts the accepted desktop composition at unnecessary risk and makes regressions difficult to isolate.
2. **Staged corrective program — selected.** Establish tests and repair the baseline first; then implement mobile richness; then add evidence and localization; then harden deployment. Each package is independently reviewable and preserves a working site.
3. **Mobile-only patch.** Implement the existing v3.4 plan and defer content, semantics, and deployment. This is the fastest route to richer graphics but would ship known navigation, performance, accessibility, and portfolio-conversion defects.

The selected approach is staged because the desktop design is already approved, the current site is live, and the audit exposed defects in both the existing mobile baseline and the unimplemented v3.4 plan.

## 3. Non-negotiable constraints

- All work applies only to `/Users/daikieishinuki/Claude Code Projects/Personal Website` and `Ishinuki-Moncion/Personal-Website-3.0`.
- Preserve the accepted desktop composition, palette, typography, scene choreography, section order, and deep-black floor. No desktop redesign.
- The scene is progressive enhancement. Essential navigation, language, gallery, contact, and accessibility behavior must work if WebGL, shaders, imports, or the probe fail.
- Phones are the primary demonstration surface. Capable phones should receive an intentional rich experience, but no visual effect may override stability, accessibility, or thermal safety.
- Reduced motion wins over every quality decision and never runs a GPU probe.
- Device identity, user-agent strings, GPU renderer strings, `deviceMemory`, and allowlists never decide quality.
- `LITE` remains the input/layout signal for coarse pointers and narrow viewports. Render richness is a separate capability profile.
- Do not invent portfolio claims, client names, private campaign details, metrics, dates, or outcomes. Use only facts already present in the repository or public repositories.
- The email address remains runtime-assembled; it must not appear as plaintext in committed files. A conventional email action may also be assembled at runtime.
- No push, pull request, Pages setting change, domain purchase, repository archival, or GitHub-profile mutation occurs without an explicit owner gate.
- Every behavior change follows red-green-refactor. Browser-facing changes require real browser verification, not source assertions alone.

## 4. Program decomposition

The work is divided into four independently testable packages. Each package receives its own implementation plan and review cycle.

The existing `docs/superpowers/plans/2026-07-16-v34-mobile-richness.md` remains an audit record and must not be executed. Package A receives a replacement plan incorporating the corrected startup, cleanup, memory, demotion, and viewport requirements below.

### Package A — Baseline reliability, performance, and mobile richness

This package is the prerequisite for every other package.

#### A1. Reproducible test foundation

Add a minimal Node test package and committed browser tests. The production site remains static and build-free at runtime; Node exists only for verification, asset generation, and deployment packaging.

The matrix covers:

- Chromium and WebKit.
- Viewports: 320×568, 375×812, 390×844, 430×932, 667×375, 768×1024, 844×390, and 1440×900.
- Fine pointer, coarse pointer, reduced motion, no WebGL, forced lite, forced rich, Japanese locale, and `file://` fallback where supported.
- Keyboard focus, menu escape/restore, lightbox escape/restore, touch swipe, contact copy, internal anchors, external links, and zero console/page errors.

Structural hardening checks remain useful but do not substitute for behavioral tests.

#### A2. Existing mobile-baseline repairs

- The mobile menu owns its scroll chain. At short landscape heights all six destinations and the close control remain reachable.
- The signal/email control fits at 320px. It may wrap into two lines or use a stacked key/value layout; its border, address, copied state, and focus ring must remain visible.
- While the mobile menu is open it is exposed as a named modal navigation surface, background content is inert, focus remains inside it, Escape closes it, and focus returns to the burger.
- Work/project titles become semantic headings, gallery controls have static accessible names, the lightbox image has valid initial dimensions/source behavior, and the control deck has a valid heading/group structure.
- W3C HTML validation has no errors on production pages.

#### A3. WebGL independence and boot sequencing

Essential DOM behavior initializes independently of the scene. `boot.mjs` becomes a coordinator rather than a serial dependency chain.

The sequence is:

1. Parse the page and initialize essential application behavior.
2. Paint the boot surface or the reduced-motion page.
3. Yield at least one frame.
4. Resolve the render tier when eligible.
5. Initialize the scene inside an isolated failure boundary.
6. Reveal the page at the boot budget even if the scene is unavailable.

A scene failure may remove or freeze the canvas, but it may not disable navigation, localization, gallery controls, contact actions, or content reveal.

Mobile first-visit boot has a hard experience budget of 1.5 seconds after first paint. Desktop choreography may retain its current character, provided desktop performance and visual-regression gates hold. Returning visits and reduced-motion visits skip the cinematic delay.

#### A4. Corrected mobile-rich decision

The quality profiles are `reduced`, `lite`, `mobile-rich`, and `high`. Profiles contain explicit capabilities rather than scattered string comparisons:

- `postFX`
- `postFXSamples`
- `bloomScale`
- `dprCap`
- `wells`
- `labelPriority`
- `graticuleFull`
- `shellSegments`
- `beadCap`
- `refractBeads`
- `rivulet`

The probe remains measurement-based but changes in four ways:

1. It runs only after the first boot paint.
2. Probe iterations yield between measurements; they are not one uninterrupted synchronous loop.
3. Every exit uses `try/finally` to delete buffers, textures, framebuffers, shaders/programs, and explicitly lose the temporary context.
4. The stated budget is fail-late: a single synchronous GPU fence cannot be interrupted, so the implementation checks the budget before and after each yielded iteration and fails to lite after the current fence returns.

The starting mobile-rich payload is deliberately below desktop:

- DPR cap 1.75.
- 5,000 globe particles.
- Field counts 1,800 / 850 / 620.
- 320 three-layer rain quads with motivated wells.
- Full graticule, halo labels/ticks/rings, and 48×32 shell.
- Sixteen refracting 2D beads.
- Postprocessing on, with a half-resolution bloom chain and no MSAA on bloom targets.
- Final composer samples capped at 2.
- Mobile rivulet remains off for the first ship.

The DPR 1.75 and reduced bloom resolution intentionally revise the original DPR 2 / full-resolution composer proposal. Promotion must fit a documented postprocessing attachment budget of at most 128 MiB at 430×932 before depth, scene geometry, and textures. The implementation plan must include the arithmetic used to enforce that budget.

The threshold is calibrated on the owner’s actual iPhone. Emulated/software GL is never treated as calibration evidence.

#### A5. Runtime demotion

On `mobile-rich`, sustained `fpsEMA < 45` for four seconds demotes once for the session. Demotion:

- Switches to direct rendering.
- Changes a live `effectiveDprCap` to 1.5 so rotation/resize cannot restore the rich cap.
- Calls `dispose()` on composers and every retained postprocessing pass, including bloom-internal render targets, then clears references.
- Persists lite for the session.
- Never rebuilds geometry mid-frame and never re-promotes during the session.

Behavioral tests use a debug-only injected FPS source that is available only when `sceneDebug=1`. Tests must prove the four-second threshold, exactly-once behavior, direct-render switch, DPR persistence across resize, resource disposal, and session persistence.

#### A6. Performance and device gates

Required gates before owner review:

- Mobile Lighthouse median of three cold runs: performance ≥80, LCP ≤2.5s, CLS ≤0.10, TBT ≤200ms.
- Desktop Lighthouse: performance ≥85, LCP ≤2.5s, CLS ≤0.10.
- Mobile-rich holds ≥55 fps for 15 seconds on the owner device in normal conditions.
- Low Power Mode demotes cleanly without context loss or interaction failure.
- Warm/thermal, rotation, background/restore, repeated navigation, and second-visit session-cache tests pass.
- No unexpected `webglcontextlost`; a deliberately triggered loss recovers or falls back without disabling content.

### Package B — Portfolio evidence and conversion

This package improves what the existing design proves; it does not redesign the home page.

#### B1. Current proof set

Replace the three generic GitHub-profile project rows with three verifiable, current entries:

1. **daikieOS / Personal Website 3.0** — public repository and a detailed engineering case study.
2. **Tokyo Data Globe** — public repository and a focused scene/interaction case study.
3. **Open-Web Campaign Production at SeenThis Japan** — NDA-safe aggregate case study using only the existing facts: Technical Producer, HTML/CSS/JavaScript production, Tokyo, March 2025–present, and 100+ campaign lifecycles.

No case study claims business lift, named clients, performance improvements, team size, ownership level, or workflow details unless those facts are already documented and verifiable.

Each case study contains:

- Context and problem.
- Role and explicit evidence boundary.
- Constraints.
- Decisions and implementation.
- Verifiable artifacts or public repository links.
- Outcome using only documented facts.
- Reflection and next step.
- Unique title, description, canonical URL, and Open Graph image.

The visual form is a restrained `CASE_PACKET`: the current ledger/instrument language, fewer effects than the home page, readable prose, deep linking, and print support.

#### B2. Home-page conversion

Preserve the hero composition but sharpen the proposition to communicate Technical Producer + creative developer + Tokyo + high-performance open-web and interactive work. Add two restrained actions:

- `VIEW CASE STUDIES`
- `START A CONVERSATION`

Contact gains one concise sentence describing appropriate inquiries. Copy-to-clipboard remains; a runtime-assembled conventional email action is added. No contact form.

### Package C — Full bilingual, semantic media, and discovery

#### C1. Locale architecture

English and Japanese become stable, crawlable pages rather than a partial client-side text mode:

- English canonical at `/Personal-Website-3.0/`.
- Japanese canonical at `/Personal-Website-3.0/ja/`.
- Reciprocal `hreflang="en"`, `hreflang="ja"`, and `hreflang="x-default"`.
- Localized title, description, Open Graph metadata, headings, prose, controls, accessible names, case-study content, captions, and contact guidance.
- The language control navigates between equivalent URLs and includes its visible label in its accessible name.

Content lives in `content/en.json` and `content/ja.json`. Deterministic standard-library Node templates in `templates/home.mjs` and `templates/case-study.mjs`, orchestrated by `tools/build-site.mjs`, generate committed static HTML at `index.html`, `ja/index.html`, and the equivalent English/Japanese case-study paths. The generator adds no client runtime and no template-engine dependency. Generated pages preserve the current DOM/CSS hooks, require no client-side rendering for meaning, and remain usable with JavaScript disabled. CI rebuilds and fails on a dirty diff; structural-parity tests prevent translation drift.

Japanese translation may be generated initially, but it is marked as pending owner-language review before deployment. Unreviewed translation is not silently presented as owner-approved wording.

#### C2. Photography and semantic images

- Replace meaningful CSS-background photographs with semantic `picture`/`img` markup while preserving current crops and hover behavior.
- Supply width/height, lazy loading below the fold, decoding hints, responsive sources, and AVIF/WebP with JPEG fallback.
- Alt text describes visible content, not only a city label or ordinal.
- On-demand `FIELD_NOTES` provide place, visual description, EXIF where known, and a short editorial note. No new always-on overlay layer.
- The existing photo-to-city mapping remains an explicit owner-data gate; visual descriptions must not be used to guess location.

#### C3. Semantics and structured data

- Add accurate `Person` and `WebSite` JSON-LD with stable `@id` links and `sameAs` profiles.
- Retain and improve the photography `ItemList`/`ImageObject` data.
- Case studies receive appropriate `CreativeWork` or `SoftwareSourceCode` data only where accurate.
- Add `robots.txt`, `sitemap.xml`, `twitter:image:alt`, and localized discovery metadata.
- Self-host the required Japanese font subsets with their license files so normal page rendering does not depend on Google Fonts.

### Package D — Deployment hygiene, CI, and handoff

#### D1. Production artifact

GitHub Pages should publish an allowlisted artifact containing only runtime assets:

- Generated English/Japanese HTML.
- Case-study pages.
- `css/`, production `js/`, vendored runtime modules, fonts, optimized images, favicon/touch icons, `404.html`, `robots.txt`, and `sitemap.xml`.

The public artifact excludes backup HTML, QA screenshots, research, plans/specs, scratch files, and development tools. These may remain in the public source repository where appropriate, but they are not part of the website deployment.

#### D2. CI

A committed workflow runs:

- Syntax and hardening checks.
- Unit tests.
- HTML validation.
- Link and local-asset validation.
- Chromium/WebKit behavioral smoke tests.
- Reduced-motion and no-WebGL tests.
- Static generation drift check.
- Production-artifact allowlist check.

Pages deployment remains an owner-gated action. The workflow may be prepared on the feature branch, but switching repository Pages settings or deploying the artifact requires explicit approval.

#### D3. External owner gates

The following cannot be completed safely inside the website repository without a separate owner action:

- Purchase/select and configure a custom domain.
- Edit the GitHub account bio, website URL, and pinned repositories.
- Archive or relabel older public website repositories.
- Confirm the 12 photo-to-city assignments.
- Approve final Japanese wording.
- Approve the actual iPhone richness threshold and visual result.
- Push, open a PR, change Pages settings, or deploy.

The project must provide exact handoff instructions for each remaining external gate.

## 5. Error handling and fallback behavior

- A failed locale generation or validation fails CI; stale generated pages never deploy.
- A failed probe, blocked storage, missing WebGL2, shader compile/link failure, context loss, or probe cleanup failure selects lite or no-scene mode while leaving content interactive.
- If optimized image generation fails, the validated JPEG fallback remains usable; missing dimensions or missing alt text fail tests.
- Clipboard denial falls back to a runtime-created copy mechanism and preserves focus; the email action remains available.
- If JavaScript fails entirely, English content, navigation anchors, semantic gallery labels, contact guidance, and case-study links remain present.

## 6. Visual-regression law

Desktop is a locked reference, not a redesign target. Before Package A changes, capture reference frames at 1440×900 for home, about, work, gallery, projects, contact, menu/control states, and lightbox. Later captures use identical viewport, DPR, scroll position, locale, and settled scene phase where deterministic.

Acceptable desktop differences are limited to approved content changes, semantic markup with identical rendering, corrected accessibility states, and performance/boot sequencing that preserves the final settled composition. Any change to globe seat, palette, typography metrics, photograph crops, section spacing, scene story state, or postprocessing character requires a separate owner verdict.

## 7. Completion definition

The program is complete only when:

- Packages A–D have implementation plans, reviewed commits, and clean verification.
- Current mobile baseline defects are fixed across the full viewport matrix.
- Mobile-rich passes the corrected probe, memory, demotion, performance, and owner-device gates.
- Essential site behavior works with WebGL disabled and with JavaScript disabled where specified.
- Three evidence-rich case studies replace the generic project links without invented claims.
- English and Japanese pages are complete, crawlable, and structurally synchronized; Japanese wording has owner approval before deployment.
- Semantic images, HTML validation, structured data, sitemap, robots, and self-hosted fonts are complete.
- CI produces a clean allowlisted Pages artifact.
- Existing hardening checks and all new tests pass with zero browser errors.
- The final branch receives an independent whole-branch review with no open Critical or Important findings.
- The owner receives the remaining external-gate checklist and explicitly decides whether to push/deploy.

## 8. Implementation order

1. Package A1–A3: test foundation, current mobile fixes, WebGL independence, and boot performance.
2. Package A4–A6: corrected mobile-rich profile, postprocessing budget, demotion, and owner-device calibration.
3. Package B: case studies, project links, hero proposition, and contact conversion.
4. Package C: static locale generation, full Japanese content, semantic photography, metadata, and fonts.
5. Package D: artifact allowlist, CI, full regression sweep, final review, and owner handoff.

Mobile rivulet is not part of the first completion pass. It may be reconsidered only after the base mobile-rich configuration passes the normal, thermal, Low Power, and memory gates with clear headroom.
