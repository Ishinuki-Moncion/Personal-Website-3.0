# v3.4 Completion — Owner Gate Handoff

**Date:** 2026-07-27
**Branch:** `v34-completion` (worktree `.worktrees/codex-v34-corrective-completion`)
**Base:** `codex/v34-corrective-completion` @ `dfc282e`, itself on `origin/main` @ `562b0a3`
**Remote actions taken:** none. No push, PR, merge, Pages change, or deploy.

## 1. What changed, in one page

Codex's Package A was audited by 12 independent agents (6 finders, 6 adversarial
verifiers). **37 raw findings → 25 confirmed**, 12 refuted. All 1 Critical and all
6 Important findings are fixed, each with a regression test observed failing
before the fix and passing after.

Packages **B** and most of **C** are now built. **D** is not started.

### Verification, clean machine

| Gate | Result |
|---|---|
| Unit | 27/27 |
| Hardening | 70/70 |
| Browser (chromium + webkit) | see §6 |
| HTML Validate + W3C Nu | clean, across `index.html`, `404.html`, `ja/index.html`, 3 case pages |
| **Lighthouse, production network** | **PASS** — first time |

Production-network mobile Lighthouse, median of three cold runs:

| | Codex baseline | Now | Gate |
|---|---|---|---|
| Performance | 60 | **94** | ≥80 |
| First Contentful Paint | 4185 ms | **1503 ms** | — |
| Largest Contentful Paint | 4859 ms | **2327 ms** | ≤2500 |
| Cumulative Layout Shift | 0.172 | **0.059** | ≤0.10 |
| Total Blocking Time | 154 ms | **190 ms** | ≤200 |

Note the baseline column: the handoff Codex wrote recorded performance 70 and
CLS 0.059. Three independent cold runs measured 60 and 0.172 — a failing metric
published as a passing-looking one.

## 2. The defects that mattered

Each was reproduced before being fixed, and each passed every gate Package A
shipped with.

1. **Critical — a double-tap killed the whole page.** `setOverlaySiblingsInert`
   re-saved each sibling's *current* inert value on every acquisition, so a
   second lightbox open during the 250 ms decode window recorded `true` as the
   baseline. Closing then "restored" the entire page to inert: navigation,
   gallery, contact, menu and skip-link dead until a reload. Reachable by an
   impatient double-tap on a globe photo marker.
2. **The gallery lightbox rendered every photograph at 35% of its area** — the
   thumbnail's dimensions hardcoded onto the element that displays the full
   photograph, with the two portrait shots letterboxed into a landscape box.
3. **Reduced motion removed the mouse pointer** from the gallery, lightbox and
   contact button. The restoration named the right selectors but lost on CSS
   source order, so enabling an accessibility accommodation removed the cursor.
4. **`boot.mjs` was still a serial chain** — a failed fetch of the *decorative*
   cursor module stopped the page from ever revealing.
5. **Two boot deadlines ran on different clocks**, so an ordinary cold-cache
   desktop visit permanently latched the CSS force-reveal and killed the
   scroll choreography.
6. **The WebKit smoke gate was ~17% flaky**, so the documented "97 passed" was
   not reproducible by anyone following the verification contract.
7. **The postFX memory budget was boot-only** — a resize reallocated straight
   through it — and a **WebGL context loss demoted any device to lite
   permanently**, because the restore path was the one resume path that forgot
   to reset its timebase.

## 3. Gates only you can close

### 3.1 iPhone calibration — blocks shipping mobile-rich

`RICH_THRESHOLD_MS = 4.5` is still provisional. From the worktree:

```bash
npm run serve:device
```

Open on the actual iPhone: `http://<Mac-LAN-IP>:4173/tests/device/mobile-rich-calibration.html`

Return three exported JSON packets — normal/cold, Low Power Mode, warm/thermal —
plus verdicts on visual quality, rotation and safe areas, background/restore, and
context-loss/restore.

**One caveat found in the audit that affects this protocol:** a transient probe
result (`budget`, `error`, `no-webgl2`) is cached to `sessionStorage`. If you
background the tab mid-probe, rAF stops, the probe times out, and that verdict
pins the whole session to lite on a device that would have measured rich. Clear
`v34.tierProbe` between cold runs, and don't background the tab during a probe.

### 3.2 Japanese wording — blocks indexing `ja/`

`ja/index.html` is generated and crawlable but carries `noindex` until you approve
the wording. It is deliberately withheld from `sitemap.xml`, because listing a
noindex URL contradicts the directive.

To approve: review the `data-ja` strings in `index.html`, then set
`JAPANESE_WORDING_APPROVED = true` in `tools/build-locale.mjs` and run
`npm run build`.

Only 21 strings currently render in Japanese — nav, section labels, headings,
stats and the new conversion copy. The body prose is still English on both pages.
Extending it means adding `data-ja` to those elements; the transform and the
runtime toggle both pick it up with no further work.

### 3.3 Photo-to-city labels — owner data

The 12 gallery photographs carry city labels that have never been verified
against where they were actually taken. Nothing here can confirm them, and
guessing from image content is explicitly out of bounds.

### 3.4 `tokyo-data-globe` has no licence file

It is now cited as portfolio evidence from a public case study. Worth adding a
licence before that page is public.

### 3.5 Push / PR / Pages / deploy

Unchanged and untouched. Everything above is local.

**Read this before pushing.** An earlier commit on this branch
(`5bd1d15`) contains a test that hard-coded the names of the two PRIVATE
employer-tooling repositories, as a list of strings it was asserting must NOT
appear on the public case study. The current tree no longer contains them — the
test now asserts the property instead of enumerating the secret — but the names
are still reachable in that commit's objects.

Nothing has been pushed, so this is entirely recoverable. Options, in order of
preference:

1. Squash or rebase this branch before pushing (it is a linear 14-commit branch
   with no dependents), which removes the strings from history entirely.
2. Decide the repository names are not sensitive — they are names, not contents —
   and push as-is.

That judgement is yours; it depends on whether the repository *names* are
themselves considered confidential at SeenThis. I have not rewritten history,
because doing so unilaterally to a branch you may have inspected is not my call.

## 4. Deliberately not done

- **Package C2 — semantic `picture`/`img` for the gallery.** The photographs are
  still CSS background images. Converting them touches the locked gallery
  composition and is best done together with §3.3, since alt text depends on
  knowing what each photograph shows.
- **Package D — deploy artifact allowlist and CI.** Not started. The QA server's
  path allowlist (`tests/helpers/server-policy.mjs`) is a working model for the
  artifact allowlist.
- **Scene-construction chunking.** TBT passes at 190 ms but with only 10 ms of
  margin; Lighthouse attributes it to a single 304 ms task in scene construction.
  Splitting it into sub-50 ms slices would contribute 0 to TBT. Headroom work,
  not a gate failure.
- **18 confirmed Minor findings** remain open; several were closed incidentally.

## 5. Two things worth knowing about this codebase

**The 70 hardening checks are source-shape regexes, not behavioural tests.** They
match code as literal text. That makes them excellent anti-tamper locks — a
safety gate cannot be quietly deleted — but they fail on correct refactors, and
"hardening 70/70" reads like behavioural coverage when it is not.

**The deterministic Lighthouse gate blocked the third-party font request** to make
runs repeatable, which also removed the single largest real-world cost from the
measurement. A gate that excludes the dominant production variable measures a
site nobody receives. With the fonts self-hosted the two modes now converge, but
the pattern is worth not repeating.

## 6. Reproducing

```bash
cd .worktrees/codex-v34-corrective-completion
npm ci
npm run build        # fonts, case studies, ja/, robots + sitemap
npm run qa:all       # unit + drift checks + hardening + HTML + browser
npm run qa:perf:network
```

`npm run build` is idempotent; `qa:static` fails if any generated file has
drifted from its source.

## 7. Next session — exactly where to resume

Everything below survives a context compaction. Start here.

### 7.1 State

Branch `v34-completion` @ `5187e5e`, clean tree, 14 commits ahead of Codex's
`dfc282e`. Last verified battery: unit 27/27, hardening 70/70, browser **151
passed + 1 intentional skip, 0 failures**, production-network Lighthouse **PASS**.
Nothing pushed.

### 7.2 Open work, in priority order

**Package D is DONE** — `tools/build-artifact.mjs` (85 files, 8.34 MB,
allowlisted), `tests/unit/artifact.test.mjs`, `.github/workflows/ci.yml`.
**Japanese is DONE** — 43 rendered strings, localised metadata and JSON-LD.

What actually remains:

1. **Package C2 — semantic `picture`/`img` for the 12 gallery photographs.**
   Still the largest open item, and still coupled to §3.3: the spec requires alt
   text that "describes visible content, not only a city label or ordinal", which
   cannot be written without looking at each photograph and knowing what it
   shows. Do it in the same pass as confirming the city labels.
2. **Scene-construction chunking** — TBT headroom only. Passes at 190/200 ms;
   one 304 ms task in scene init is the whole margin.
3. **Remaining Minor findings** (against my own work). The full
   text with file:line and reproduction is in the workflow journal:
   `~/.claude/projects/-Users-daikieishinuki-Claude-Code-Projects-Personal-Website/8486d76f-cf10-4446-bee8-63ae5bf4b2ab/subagents/workflows/wf_848bc4bd-447/journal.jsonl`
   The ones worth doing:
   - `robots.txt`/`sitemap.xml` are never fetched at a GitHub Pages *project*
     path (`/Personal-Website-3.0/`), and the `Disallow:` paths are wrong for it.
     Either move to a user-site root or drop the file and rely on meta robots.
   - `ja/index.html` keeps English `<title>`, `description` and `og:` copy, and
     its JSON-LD still asserts `inLanguage: "en"`.
   - `tools/build-locale.mjs` `applyJapaneseText` drops element content when an
     attribute *after* `data-ja` contains a `>`. No current input triggers it.
   - The sr-only copy hint ships in English on the Japanese page with no `lang`.
   - The case-study anchor `#` is announced by screen readers, contradicting its
     own comment.
   - Three weak tests: the sticky-CLOSE test never scrolls the menu; the
     `claimsGlyphs` assertion is vacuous; the cache-version test cannot detect
     the stale-asset regression its comment claims it prevents.
3. **Package C2** (semantic `picture`/`img`) — blocked on §3.3 photo labels.
4. **Scene-construction chunking** — TBT headroom only, passes at 190/200ms.

### 7.3 Audit journals

Both reviews' full findings, verdicts and reproductions are on disk:

- Codex Package A audit (37 raw / 25 confirmed): `.../workflows/wf_72ce0f47-405/journal.jsonl`
- Review of this branch's own work (26 raw / 18 confirmed): `.../workflows/wf_848bc4bd-447/journal.jsonl`

### 7.4 Operational note

Do not run two `npm run qa:all` batteries concurrently — the second dies instantly
on `port 4173 is already used`. And any wait-loop condition must match failure as
well as success (`passed|failed|Error:`); a success-only pattern against an
errored run polls forever. That mistake cost 8 hours of idle background polling
in the session that produced this branch.
