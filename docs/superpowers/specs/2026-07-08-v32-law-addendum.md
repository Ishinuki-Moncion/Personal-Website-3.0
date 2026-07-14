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

## v32n re-measure (2026-07-10, remediation redo, working tree on e6c654e)
Method (same shape as §8 row 6): devtools `performance_start_trace` (reload:true), emulation 412×823 DPR 1.75 mobile+touch, 4× CPU, Slow 4G, single tab, localhost python http.server. Same-session **A/B vs HEAD e6c654e via git stash/pop**, ≥3 runs per build, medians.
**Finding: LCP under this harness is bimodal by HTTP-cache regime, on BOTH builds** — fast regime (document ~55 ms latency): new-build LCP **254/257/259 ms (median 257)** vs old-build 258 ms; slow regime (document re-download ~595 ms under Slow 4G; LCP keys on a different node, 123 vs 93): old 754/755/1071/1628, new 1304/1317/1317. The regime switch tracks session time / file-mtime cache invalidation (stash/pop touches mtimes; python http.server always re-serves HTML 200), not the build — the old build drifts 754→1628 monotonically within its own block. **The only clean like-for-like is the warm fast regime: new 257 vs old 258 ms — parity, no regression.** No cross-regime or cross-session comparison is claimed; §8 row 6's LCP 492 ms (2026-07-08) is a different session and is not directly comparable. Static payload delta of v32n (exact, `wc -c` vs HEAD): background.js +3020 B, app.js +1488 B, site.css +320 B = **+4828 B, zero new assets/requests**.

## v3.2r close-out measurements (2026-07-10, Task 16R, branch v32-remediation, HEAD 2fd4734, tree clean)

**Build:** bg 5.5 / app 4.1 / `site.css?v=3.28` / `boot.mjs?v=22` (cache-busts confirmed loading on the measured page). Harness **41/41, exit 0**. This section supersedes the reverted Opus close-out (52b167a) in full; every number below is fresh and reproducible with `node tools/frame-luminance.mjs`.

**Method (per §8b, deviations noted):** `http://127.0.0.1:8765/index.html`, all stale QA tabs closed first, ONE tab for the whole session. Viewport **1440×743 CSS px @ DPR 2** via device-metrics emulation (native `resize_page(1440,900)` yielded 749 inner on this window chrome; emulation pins the exact §8b frame geometry — captures are 2880×1486 px, byte-geometry-identical to the §8b set). **Fresh hard-reload (`ignoreCache`) before EVERY capture** (a stricter regime than §8b's one-reload/five-frames — each frame is an independent boot), 11 s settle after boot and 11 s after each section scroll. Scroll landing verified per capture: hero `scrollTo(0,0)` → scrollY 0 (verified === 0 before all 5 hero captures); `#gallery` scrollIntoView → scrollY 3310, top 74.25 px; `#projects` → scrollY 6707.5, top 74.09 px (§8b recorded 3410/6807.5 — the v32o About padding reclaim shortened the page by ~100 px; the 74 px `scroll-margin-top` anchor is identical). Statistic = per-metric **median of 5**, spreads reported. Frames (git-ignored): `docs/superpowers/gates/v32/closeout-r-{hero,projects,gallery}-{1..5}.png`. **Zero console messages across every session** (close-out captures, rain A/B, mobile sweep, desktop sweep, reduced-motion).

### Luminance vs §8b (baseline of record)

| Section | mean (median) | mean spread | p50 (median) | p50 spread | p95 (median) | p95 spread | warmShare (median) | warmShare spread |
|---|---|---|---|---|---|---|---|---|
| hero | **18.54** | 18.50–18.78 | **8** | 8–8 | **77** | 77–80 | **0.0086** | 0.0084–0.0093 |
| projects | **21.96** | 18.89–22.03 | **7** | 7–7 | **114** | 91–115 | **0.0028** | 0.0027–0.0030 |
| gallery | **38.21** | 37.50–38.23 | **9** | 9–9 | **120** | 120–120 | **0.0015** | 0.0013–0.0015 |

### Verdict vs the plan Step-2 letter criterion (mean AND warmShare ≤ §8b)

- **FAILS the letter criterion at hero:** mean 18.54 vs 18.43 (+0.11 — below variance resolution, inside the §8b per-frame spread 15.90–18.99, not citable as a real change); **warmShare 0.0086 vs 0.0027 — 3.2× as medians, but see the matched-phase check:** §8b's own 11 s frame (`rebase-hero-1`, HEAD 8474267, pre-v32m) read warm **0.0090**, and the Opus-era build's 11 s frame (`closeout-hero-1`, 0365883) read **0.0090** — at the 11 s phase the hero warm beat is UNCHANGED across three builds (10/10 frames ≈ 0.009 across four sessions). The median rise is the fresh-reload-per-capture regime sampling that phase 5/5 where §8b sampled it 1/5. The letter fail stands as written; the warm beat itself predates v32m.
- **FAILS the letter criterion at projects:** mean 21.96 vs 20.61 (+1.35 — above the §8b per-frame σ ≈ 1.17 and consistent across 4/5 frames at 21.93–22.03, so likely a real rise; still inside the baseline's own per-frame spread 19.59–22.89); warmShare 0.0028 vs 0.0089 **passes decisively** (−69%).
- **FAILS the letter criterion at gallery, on its face only:** mean 38.21 vs 37.76 (+0.45 — below the §8b per-frame σ ≈ 0.72 and inside the baseline spread 37.10–38.94; NOT resolvable as a real change, reported because the criterion compares medians as written); warmShare 0.0015 vs 0.0020 passes.
- **The deep-black floor held everywhere: p50 = 8 / 7 / 9, identical to the §8b medians, zero spread across all 15 frames.** The rises live in the emissive tail (p95 hero 77 vs 70, projects 114 vs 101, both inside baseline spreads; gallery saturated at 120 = 120), not the floor.
- All three failures are routed to the owner as **GATE-PILE item 11**. Causal attribution, per section: the HERO warm fail is a sampling-phase artifact of the measurement regime, not a build change (matched-phase parity above — pre-v32m baseline already carried the 11 s warm beat); the PROJECTS mean rise is consistent with the v32m acquire holding the lit Dallas nearside through the settle window (a post-baseline owner-commissioned add); the GALLERY fail is below resolution. Interpretations flagged as such; the failures are the measured fact. No criterion was renamed or averaged away.

### Hero rain isolation A/B (the sanctioned method; binding T12 note honored)

Same page, same session, matched settle (post-11 s), **5 interleaved pairs**: the 3 `rain-layer-*` children of the `depth-rain` group toggled `visible=false/true` per pair via a captured scene reference (render-loop writes `group.visible` and `material.opacity` each frame, so child-visibility is the loop-proof lever; `sceneState` itself is module-scoped with no setter — deviation from the note's literal `sceneState.rain=0`, same rendered effect: zero rain particles drawn; the 2D droplet glass overlay, also rain-keyed, stayed live in BOTH arms). Frames: `closeout-r-rainAB-{on,off}-{1..5}.png` (1440×743 @ DPR2).

| pair | on mean | off mean | Δ (on−off) |
|---|---|---|---|
| 1 | 18.88 | 18.66 | +0.22 |
| 2 | 18.84 | 19.03 | −0.19 |
| 3 | 18.59 | 18.93 | −0.34 |
| 4 | 18.93 | 18.94 | −0.01 |
| 5 | 19.19 | 19.10 | +0.09 |

Medians: on **18.88**, off **18.94**, pairwise Δ median **−0.01** (range −0.34…+0.22). **Result: the hero depth-rain rest contribution to frame mean is below measurement resolution — indistinguishable from zero at N=5 interleaved pairs**, dominated by event-phase variance (warmShare swung 0.0021–0.0086 across these frames combined — on-arm 0.0021–0.0086, off-arm 0.0021–0.0081 — confirming the warm events are halo/beat pulses, not rain). Consistent with T12's finding (rest contribution ≈ 0.1 < per-frame σ). Accordingly, NO hero rain delta — including the reverted close-out's sub-resolution claims — is cited as fact anywhere in this close-out.

### Mobile close-out

- **Sweep at 390×844 @ DPR2 mobile+touch (hard reload, 11 s settle):** hero composed (globe in-frame below the header, name legible on the dim limb — `closeout-r-mobile-hero.png`); About callout clear of the 80 px band (band clean while gated; facing-open panel top ~85–88 CSS px, mid-fade under the v32n header gate — `closeout-r-mobile-callout{,-2}.png`); touch photo parity live (exactly one `.lit` tile, nearest-centre d=52 px, filter `none` vs rest grade `brightness(0.58) saturate(0.45) contrast(1.05)`); lightbox opened the lit tile's own image (gallery-03, complete=true, focus → `.lb-close`, aria-hidden=false/inert=false) and closed clean (aria-hidden=true, inert=true) — `closeout-r-mobile-lightbox.png`. Zero console messages.
- **Perf:** the claim of record is the **v32n re-measure block above** (T14R's method-stated warm-regime A/B: new 257 vs old 258 ms — parity). One fresh confirmation trace at its stated emulation (412×823 @ DPR 1.75 mobile+touch, 4× CPU, Slow 4G, warm cache): **LCP 464 ms** on LCP node 93 (the warm-regime node; TTFB 0.8 ms, document latency ~61 ms = fast/warm regime marker) — same order as the 257/258 ms parity pair (sub-half-second warm regime, nowhere near the ~1300 ms slow regime); single-trace spread within a regime was already documented at ±hundreds of ms in the v32n block, so no tighter claim is made from one run. **CLS 0.21** (measured; inside T14R's observed 0.04–0.32 band across both builds).

### Full sweep (desktop 1440×900 @ DPR2 + mobile + reduced-motion)

- Section walk home→about→work→gallery→projects→contact: the boxed **state-word fired exactly once per section change** (about / work / gallery / projects / contact; home excluded), observed via a class MutationObserver on `.state-flash` — one signal per lock.
- **Contact downlink:** LOS-gated as designed — on entry Tokyo sat at the limb (downlink armed, not fired); ~25 s later Tokyo rotated into facing with focus ring + amber hub bloom (`closeout-r-contact-downlink.png` → `closeout-r-contact-downlink-2.png`). The full 東京/TOKYO "SIGNAL ONLINE" callout-text verification of record is T13R's.
- **Story beat:** DALLAS callout observed live (mid-fade, limb-adjacent) on a random projects entry (`closeout-r-projects-beat.png`); the engineered nearside/farside pair of record is `m2-projects-dallas-{nearside,farside}.png` (T13R).
- **Lightbox desktop:** VT-path open/close clean (gallery-07, focus → `.lb-close`, aria/inert correct both ways).
- **Reduced-motion (matchMedia initScript override, `?sceneDebug=1` page):** SCENE=REDUCED, spinY constant over 1.5 s (static frame), page revealed, zero console — `closeout-r-reduced-static.png`.
- Zero console errors/warnings in every state.

### Pointers to amended criteria (already of record, restated for the close-out)

1. **Focus-bias cap:** the plan-pinned `BIAS_MAX_RADS_PER_SEC = 0.12` was a spec defect (measured −0.054 rad/s reverse). Amended spec (task-13r-report, "Plan-amendment note"): cap MUST be < 0.066 (shipped 0.055), forward-only by construction, slew-limited (≤0.005 rad/s per frame), cap value harness-pinned.
2. **Lightbox luminance (plan Step 9g):** "frame mean < §8b hero baseline" superseded — unmeetable with the law-protected unfiltered photograph. Amended proof: same-frame scrim A/B (0.985 → 51.35 vs 0.96 → 51.53, Δ −0.18) + p50 floor (15 < 18.43). Recorded in task-15r-report and GATE-PILE item 6.
3. **Step-2 net-light letter criterion:** NOT amended — it fails as written at hero (warmShare, resolvable), projects (mean, likely real), gallery (mean, below resolution), and the failures are routed to the owner as GATE-PILE item 11.

## v3.3 close-out measurements (2026-07-14, Task v33g, branch v33-rain, HEAD e56d7cb, tree clean)

**Build:** bg 6.0 / app 4.3 / fx 3.8 / `site.css?v=3.30` / `boot.mjs?v=29` / `rivulet.mjs?v=1` (cache-busts confirmed loading on the measured page). Harness **48/48, exit 0**; `node --check` clean on background/app/effects (script) + boot.mjs/rivulet.mjs (ESM). RIVULET_GATE **ON** (the shipped state) for every capture. Campaign byte ledger: 11 files changed, 3830 insertions(+), 131 deletions(−) — `git diff --stat b3d4067..HEAD` (vendored GPUComputationRenderer 11821 B; js/rivulet.mjs 13564 B).

**Method (per §8b/v3.2r, reproduced):** `http://127.0.0.1:8765/index.html`, ONE tab, stale QA tabs closed. Viewport 1440×743 CSS px @ DPR 2 via device-metrics emulation (2880×1486 captures). Fresh hard-reload (`ignoreCache`) before EVERY capture; 11 s settle post-boot and post-scroll; scroll landing verified per capture (hero scrollY 0; `#gallery` scrollY 3310, top 74.3 px; `#projects` scrollY 6707.5, top 74.1 px — all visits identical, unchanged from the v33a/v33f ledgers). Median of 5 per metric, spreads reported; `node tools/frame-luminance.mjs`. Frames (git-ignored): `docs/superpowers/gates/v33/closeout-v33-*.png`. Zero console messages across every session.

### Luminance vs the v33a pre-campaign baseline (primary) and the v3.2r close-out (provenance)

| Section | mean (median) | mean spread | p50 | p50 spread | p95 | p95 spread | warmShare | warm spread |
|---|---|---|---|---|---|---|---|---|
| hero | 19.10 | 19.03…21.73 | 8 | 8 (all 5) | 85 | 79…99 | 0.0074 | 0.0025…0.0079 |
| projects | 19.83 | 19.81…20.10 | 7 | 7 (all 5) | 92 | 91…93 | 0.0041 | 0.0037…0.0080 |
| gallery | 38.91 | 37.21…38.99 | 9 | 9 (all 5) | 120 | 120 (all 5, saturated) | 0.0018 | 0.0017…0.0040 |

### Letter-criterion verdicts (as measured; below-resolution marked, never cited)

- **§4.1 floors: PASS.** p50 exactly hero 8 / projects 7 / gallery 9 — held in all 15 frames individually, zero spread.
- **§4.2 cross-build (hero mean must not rise beyond resolution): PASS** — 19.10 vs baseline 19.19 (Δ −0.09, below resolution, hero σ 0.4–1.2). hero p95 85 vs 86 (−1, below resolution); hero warmShare 0.0074 vs 0.0083 (−0.0009, below resolution). One high frame (hero-2: 21.73 / p95 99) caught a live scene event, absorbed by the median, reported in the spread.
- **projects vs baseline:** mean 19.83 vs 20.22 (−0.39, below resolution σ ≈ 1.17); p95 92 vs 95 (inside the baseline's own spread 78…96); warmShare 0.0041 vs 0.0049 (−0.0008, below resolution). The baseline's recorded fresh/restored phase bimodality (16.76-class first visit) did not reproduce here — all five close-out visits read in one class (19.81…20.10); reported as measured.
- **gallery vs baseline:** mean 38.91 vs 38.54 — **+0.37 on its face, below resolution (σ ≈ 0.72), inside the baseline spread (37.38…39.14), NOT citable as a real change**; no letter criterion attaches to gallery mean under §4.1/§4.2; noted in GATE-PILE item 3 for completeness only. p95 saturated 120 = 120; warmShare 0.0018 vs 0.0042 (fell).
- **§4.2 rain Δ: FAIL as written** (median +0.20 > 0, below resolution) — routed to GATE-PILE item 3 with the variance analysis (next section).
- v3.2r close-out provenance context (hero 18.54/8/77/0.0086 · projects 21.96/7/114/0.0028 · gallery 38.21/9/120/0.0015): vs that older build this close-out reads hero +0.56 mean / +8 p95, projects −2.13 mean / −22 p95, gallery +0.70 mean — cross-session, cross-build numbers, provenance only, never letter-judged (the binding baseline is v33a's same-campaign, same-procedure set).

### Rain isolation A/B re-run (§4.2 at close-out)

| pair | mean ON | mean OFF | Δ (on−off) |
|---|---|---|---|
| 1 | 18.70 | 17.85 | +0.85 |
| 2 | 19.00 | 18.95 | +0.05 |
| 3 | 19.04 | 18.92 | +0.12 |
| 4 | 19.09 | 18.89 | +0.20 |
| 5 | 19.09 | 18.87 | +0.22 |

— medians: on 19.04, off 18.89, pairwise Δ median **+0.20** (bar: ≤ 0; v3.2r context −0.01). **The letter FAILS as written; the median sits inside the hero per-frame spread (σ 0.4–1.2) → below resolution, unresolvable as a rain-attributable rise, never cited as fact — routed to GATE-PILE item 3 with the variance analysis: all five deltas are positive (unlike v33a's sign-flipping set), a systematic sign consistent with a within-pair time-since-boot phase confound — the OFF frame of every pair was captured 22–28 s after its ON frame (capture-file mtimes; the in-page sample instants were not timestamped, so finer per-arm offsets are estimates), and the p95 gap (ON 86 vs OFF 79 medians) plus the warmShare gap (ON 0.0074–0.0080 vs OFF 0.0021–0.0026 in pairs 2–5) track the boot-seeded amber beats' monotonic decay across that window — a warm-channel signature the cyan rain (uCyan `0xbfeaff`, B > R) is structurally incapable of producing under the R > B + 20 probe.** p50 = 8 in all 10 frames. Note: desktop 2D canvas retired behind RIVULET_GATE; the rivulet pass stayed live in both arms (rain-keyed, sanctioned isolation). Method note of record: at this HEAD the v33a transient scene hook latches the FIRST rendered scene — now the rivulet GPGPU compute scene, not the main scene — so the re-run latches the first scene containing `rain-streaks` instead (same transient hook, one predicate added; recorded as a v33g deviation).

### Rivulet grabpass (M10) numbers of record

Coverage readback max 0.013300 (law ≤ 0.05); fps medians enabled 71 / disabled 73 (Task-6 same-session gate PASSED at ≥ −2 fps; this close-out spot-check 74 — readings 75/74/73/74/74 at hero rest, 30 s settle, quiet machine, cross-session so report-only); interleaved pass-on/off hero Δ median +0.08 (Task 6). Taste verdict → GATE-PILE item 1.

### Mobile + reduced-motion sweeps

390×844 @ DPR 2 mobile+touch sweep: scene alive (canvas 585×1266), M3 LITE glass live (`.scene-droplets` canvas exactly 585 px), zero rivulet/GPUComputationRenderer requests (19 scripts, all pre-existing), walked hero → gallery → contact, zero console; capture `closeout-v33-mobile-hero.png`. Reduced-motion (matchMedia initScript override, `?sceneDebug=1` page): SCENE=REDUCED static frame — spinY bit-identical over 1.5 s, page revealed (body opacity 1), droplets null (canvas inert at 300×150 defaults), no rivulet fetch, zero console; capture `closeout-v33-reduced-static.png`. Desktop section-walk (1440×743): the boxed state-word fired exactly ONCE per section change (about/work/gallery/projects/contact — 5 fires, home excluded; `.state-flash` class MutationObserver), lightbox open/close clean (aria-hidden/inert correct both ways, focus → `.lb-close`, gallery-07 loaded complete), contact downlink observed LOS-gated (armed on entry; 120 s occluded with no fire while Tokyo sat behind the disc, then fired +409 ms after re-entry with Tokyo facing — 56 visible frames, peak opacity 0.445).

### Gate pile

Assembled at `docs/superpowers/gates/v33/GATE-PILE.md` (git-ignored, 7 items per spec §8). The campaign stops here — no push, no PR, until the owner rules.
