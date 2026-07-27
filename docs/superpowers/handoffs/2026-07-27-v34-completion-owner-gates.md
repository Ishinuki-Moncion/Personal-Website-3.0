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
