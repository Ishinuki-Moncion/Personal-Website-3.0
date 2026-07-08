# v3.2 law addendum — the corpus re-trued (deep black is law)

**Date:** 2026-07-08. **Author:** Fable 5 (v3.2 Slice 1 / commit v32a), per `2026-07-07-v32-elevation-campaign-design.md` §1.1–1.5.
**Why this document exists:** the design corpus still legislates the rejected teal floor (design-language-v3 §6/§8; north-star line ~10 names `#0a1416`). Those passages are **SUPERSEDED** on floor + palette by this addendum. The old files stay unedited as history; THIS file plus the harness pins in `tools/verify-site-hardening.js` are the law of record. House rule: pins are updated with features, never deleted.

## 1. Floor tokens (law)
The floor is the deep-black family, verbatim from `css/site.css :root` as built (v3.1a):

| Token | Value | Role |
|---|---|---|
| `--void` | `#05060a` | page floor; matches scene fog `THREE.FogExp2(0x05060a, 0.05)` |
| `--void-2` | `#080a10` | raised surfaces (tile beds) |
| `--void-deep` | `#030407` | deepest overlay-scrim floor |
| `--panel-solid` | `rgba(7, 9, 14, 0.92)` | chrome panel bed |

`#0a1416` and the whole v3.0 teal-floor family (`#0e1a1d`, `#050e10`, `uTealAmt > 0`, teal-tinted `uLift`) are **banned as floor values**. Scene grade law: `uTealAmt: { value: 0.0 }` and neutral negative lift `uLift (-0.02,-0.02,-0.02)` — shadows sink to true black. Pinned: floor-token pin + uTealAmt pin.

## 2. Amber starfield = owner signature (warm-budget exception)
Owner decision 2026-07-07: the cyan+amber two-temperature starfield is the site's signature, restored to its original timeline values after v3.1 briefly cooled it. As built in `js/background.js`:
`const fieldAmber = makeField(quality.fieldCounts[1], AMBER, 36, 0.06, 0.8);` — 1200 particles on the high tier, AMBER at alpha .8, added via `scene.add(fieldCyan, fieldAmber, fieldDeep)`.
This field is **exempt** from the ~1–6% warm budget (reference: `docs/superpowers/research/2026-07-03-color-visual-study.md` [DATA] budgets). Everywhere else, amber = event. Pinned.

## 3. Photos dim at rest, full on demand (law)
As built (v3.1f — one notch deeper than the v3.1 spec's `.62/.55` draft; the as-built value is the law):
- Rest grade on `.shot .media` **and** `.about-portrait .media`: `filter: brightness(.58) saturate(.45) contrast(1.05)`.
- Hover / `:focus-visible` lifts the filter **entirely** (`filter: none`) — acquisition is binary, not graded.
- The lightbox is the full-color payoff: no filter on the lightbox image, ever.
- Transition `.45s var(--ease-out)`, covered by the global reduced-motion kill-switch. Pinned.

## 4. Pinned negatives (do-not-repropose)
1. **Teal floor** — rejected by owner 2026-07-07; deep space black is the identity.
2. **All-cool starfield** — killed the signature; the amber field is law (§2).
3. **Uniform lift with tinted shadows** — tinted lift reads as haze on the black floor; grade must crush neutral.
4. **Signal density regressions** — always-on packets, scroll pings, perpetual spinners; one signal per section-change.
5. **Perpetual arc re-arm** — the arc+comet fires once per story trigger, never on an idle timer.
6. **5-label halo** — halo labels are capped at 2 (東京 + one secondary).

## 5. Closed deferrals (moved from "deferred" → CLOSED; rationale kept)
1. **Motion L4 ghost-echo** — a second motion voice on acquisitions; violates scarcity.
2. **Motion L5 per-letter** — per-letter decrypt everywhere reads as animation for its own sake; the boxed state-word owns section-change.
3. **Motion L7 idle** — no new idle animation, ever (reduced-motion law + calm).
4. **Hue-jump / glitch / CA-pulse** — chromatic events break the two-hue palette law.
5. **Composition L4 named-cells as built things** — the Swiss third zone stays a composition *guide*, not a rendered feature; the original over-framing warning stands.

## 6. New rulings
1. **NO AUDIO, ever.** Not a deferral — a law. Recorded so it never resurfaces as an additive temptation.
2. **`SCENE_COLORS.alert` deleted** (was `alert: 0xff3b5c`, dead since birth — zero call sites). The scene palette is cyan/amber (+`softAmber` tint, +`terminal` legacy), **complete, by law**. Red-on-failure was considered in the v3.2 brainstorm and REJECTED as a third-hue palette-law change. Pinned so it cannot return.
3. **Dead global Three.js build deleted** (`js/vendor/three.global.min.js`, 651,447 B). The ESM chain (import-map + versioned `boot.mjs`) is the only Three.js path. `tools/build-three-global.cjs` remains as provenance; its output is banned from the serve chain. Pinned.

## 7. Measurement law: the frame-luminance tool
`node tools/frame-luminance.mjs <image.png>` → `{"mean":0-255,"p50":…,"p95":…,"warmShare":0-1}` (Rec.709 luma stats; `warmShare` = fraction of pixels with R > B+20). Zero deps; decodes 8-bit RGB/RGBA non-interlaced PNG (devtools screenshot format).
**Any v3.2 claim of "net light drops"** — slice 2 (dither/floor), slice 4 rain lever A, slice 4 photo halo — **must be proven** against the §8 baselines: same URL, same viewport, same wait-for-scene procedure (§8 method notes).

## 8. Performance + luminance baselines (v32a, measured)
Method: site served at `http://127.0.0.1:8765` (python3 http.server); Chrome devtools MCP; hero shot at 1440×900 after a 5s scene-settle wait post-navigation. Mobile perf baseline via a Chrome devtools **performance trace** (`performance_start_trace`, reload) under mobile emulation (4× CPU, Slow 4G, 412×823 DPR 1.75) — this MCP's `lighthouse_audit` excludes the performance category (it routes perf to traces), so there is **no Lighthouse 0–100 perf score**; LCP + byte weight are the reproducible levers slice 4 re-measures identically. Localhost numbers are for **relative** comparison, not absolute field truth.

| # | Metric | How measured | Value |
|---|---|---|---|
| 1 | `js/vendor` payload (after vendor delete) | `du -sh js/vendor` | **760K** (was 1.4M — the 651,447 B global build removed) |
| 2 | vendor breakdown | `du -sh js/vendor/*` | `es-module-shims-1.10.0.min.js` **64K** · `three-0.158.0/` **696K** |
| 3 | `images/` total / `thumbs/` / `tiles/` | `du -sh images images/thumbs images/tiles` | **6.9M** / **116K** / **904K** |
| 4 | gallery JPG min/max | `ls -laS images/gallery-*.jpg` | min **113,475 B** `gallery-16.jpg` · max **948,938 B** `gallery-08.jpg` |
| 5 | thumbs/tiles referenced? | grep (see §9) | **YES, both live** — `index.html:215–226` inline `images/thumbs/*`; `js/app.js:154` (thumbs), `:170` (tiles) |
| 6 | Mobile perf (devtools trace, 4× CPU / Slow 4G): perf score / LCP / total byte weight | `performance_start_trace` reload on `http://127.0.0.1:8765/index.html` | perf score **n/a** (this MCP's `lighthouse_audit` excludes performance) · **LCP 492 ms** (TTFB 0.7 ms + 491 ms render delay; keys on the boot overlay — fine, slice 4 re-measures identically) · CLS 0.35 · initial byte weight **~1353 KB encoded / ~1696 KB decoded** across 34 requests (script 867 KB = three.js + boot chain, css 299 KB, fonts 164 KB) |
| 7 | Hero frame luminance @1440×900 (DPR 2 → 2880×1486 capture): mean / p50 / p95 / warmShare | `node tools/frame-luminance.mjs docs/superpowers/gates/v32/a-hero-baseline-before.png` | **mean 15.41 · p50 8 · p95 26 · warmShare 0.0014** (deep-black floor at p50=8; warm 0.14% = starfield amber + Tokyo halo) |

## 9. Corrections of record
- The v3.2 campaign spec §1.4 says "`shots/thumbs/` and `shots/tiles/`" — the real directories are **`images/thumbs/`** and **`images/tiles/`**, both live (row 5 above). `shots/` is QA screenshots only, no subdirectories, never served by the site.
- The v3.2 campaign spec preamble quotes the photos-dim rule at `.62/.55` — as built it is `.58/.45` (v3.1f, "one notch deeper for the black floor"). This addendum records the as-built value as law (§3).

## 10. Enforcement
Six pins in `tools/verify-site-hardening.js` (harness total: 27):
`ESM chain is live with no dead global Three.js build (v3.2 law)` · `v3.2 law: deep-black floor tokens pinned` · `v3.2 law: teal shadow crush stays neutralised` · `v3.2 law: photos dim at rest, full on demand` · `v3.2 law: amber starfield signature present` · `v3.2 law: scene palette is cyan/amber, complete — no alert red`.

- **Fonts ruling (v32j):** Latin instrument faces (Hanken Grotesk 200/400, JetBrains Mono 400/500) are self-hosted woff2 in `fonts/`; JP faces (Zen Kaku Gothic New, M PLUS Rounded 1c) STAY on the Google Fonts CDN — JP glyph subsetting impractical to self-host (recorded exception).

## §8b Re-baseline of record (2026-07-08, HEAD 8474267, post-v32l)

**Why:** the §8 luminance rows do not reproduce on current code (Task 12 review: §8 row 7 hero mean 15.41 / p95 26 / warmShare 0.0014 vs identical-procedure re-captures at mean ~18.6–19 / p95 ~83 / warm ~0.008) — the original v32a capture is suspected to have caught a pre-reveal frame, and 13 tasks of visual drift have landed since; **§8 is kept for provenance, §8b is now the baseline of record for Tasks 14/15/16.**

**Procedure (reproduce exactly):** `http://127.0.0.1:8765/index.html` (python3 http.server from repo root), cache-busts at HEAD: `boot.mjs?v=16` / `site.css?v=3.26`. All stale QA tabs closed first (GPU contention corrupts readings); ONE tab for the whole session; fresh page + hard reload (`ignoreCache`). Viewport **1440×743 CSS px @ DPR 2** → 2880×1486 PNG captures (`resize_page(1440,900)` clips to 743 inner height under window chrome — whatever height you get, hold it constant). **11 s settle** after boot and after each section scroll; scroll landing verified via `evaluate_script` before every capture (hero `scrollTo(0,0)` → scrollY 0; `#gallery` → scrollY 3410, top 74 px; `#projects` → scrollY 6807.5, top 74 px). **N=5 frames per section**, scripted 2 s inter-frame wait (effective spacing ~13–16 s incl. capture overhead — widens event-phase sampling). Statistic = **per-metric median of the 5**; `node tools/frame-luminance.mjs <png>`. Frames kept (git-ignored): `docs/superpowers/gates/v32/rebase-{hero,projects,gallery}-{1..5}.png`. Zero console messages for the entire session.

| Section | mean (median) | mean spread | p50 (median) | p50 spread | p95 (median) | p95 spread | warmShare (median) | warmShare spread |
|---|---|---|---|---|---|---|---|---|
| hero | **18.43** | 15.90–18.99 | **8** | 7–8 | **70** | 63–80 | **0.0027** | 0.0021–0.0090 |
| projects | **20.61** | 19.59–22.89 | **7** | 7–7 | **101** | 91–120 | **0.0089** | 0.0032–0.0103 |
| gallery | **37.76** | 37.10–38.94 | **9** | 9–9 | **120** | 120–120 | **0.0020** | 0.0017–0.0042 |

**Variance law for future gates:** per-frame readings are event-phase-sensitive — measured per-frame σ on mean is ~0.4–1.2 (hero σ 1.11 incl. one event frame, 0.40 without it; projects 1.17; gallery 0.72), and warmShare swings **3–4× frame-to-frame** when a halo-pulse / rain warm-beat is caught (hero-1 read warm 0.0090 vs section median 0.0027 — an event frame, kept in the set deliberately). Therefore future gates MUST compare **medians of ≥5 interleaved-or-matched frames**, or isolate the effect under test via an `evaluate_script` A/B toggle (rain/effect on-off on the same frame phase) — **never single frames**. Gallery p95 saturates at 120 (photo bright tail) — use mean as the sensitive gallery metric.

## §8c — v32n perf re-measure (2026-07-08, Task 14, mobile portrait globe branch)

Method: matched §8 row 6 (devtools **performance trace**, `performance_start_trace` reload; `lighthouse_audit` still excludes performance). Emulation: **390×844 DPR 3, mobile+touch, 4× CPU, Slow 4G**, `boot.mjs?v=19` / `site.css?v=3.27`, single clean tab, hard reload. This is the viewport the new portrait branch targets (the §8 baseline used 412×823 DPR 1.75 — LCP/bytes are localhost-relative levers, not absolute field truth; byte weight is viewport-independent).

| Metric | §8 Task-1 baseline | v32n re-measure | Δ |
|---|---|---|---|
| LCP | 492 ms | **247 ms** | −245 ms (faster; keys on boot overlay — relative) |
| CLS | 0.35 | **0.23** | −0.12 |
| encoded byte weight | ~1353 KB / 34 req | **~1447 KB / 36 req** | +94 KB (see attribution) |
| — script | 867 KB | 882.4 KB | +15 KB (three.js unchanged; accumulated scene JS Tasks 2–13 + ~0.6 KB Task 14) |
| — images (13 thumbs) | 299 KB | 299.1 KB | ±0 (unchanged) |
| — fonts | 164 KB | 180 KB | +16 KB (JP glyph subset grew with Task i Japanese headlines) |
| — css | — | 54.4 KB | +0.3 KB Task 14 |

**Attribution / gate verdict:** Task 14 ships **~2.1 KB uncompressed net across the 3 browser files** (`background.js` +557 B, `app.js` +1259 B, `site.css` +325 B; zero new assets/requests — the 2 extra requests + +94 KB are cumulative drift since the Task-1 baseline, dominated by the JP font subset and 12 tasks of scene JS, NOT this task). Task-14 contribution ≈ **0.15%** of total — far inside the ~5% gate; LCP/CLS improved. **PASS.**
