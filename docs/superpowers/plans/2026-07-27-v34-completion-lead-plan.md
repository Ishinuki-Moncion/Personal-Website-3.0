# v3.4 Completion — Lead Plan

**Date:** 2026-07-27
**Branch:** `v34-completion` (branched from `codex/v34-corrective-completion` @ `dfc282e`)
**Lead:** Claude (Opus 5)
**Supersedes execution of:** nothing. This plan *continues* the owner-approved
`2026-07-21-v34-corrective-completion-program-design.md`. Where it deviates from that
spec, the deviation is stated explicitly with its reason and the owner decision that
authorised it.

## 1. Position

Codex completed **Package A only** (Tasks 1–9) and handed it over for independent audit.
Packages **B, C, D are not started**. This plan covers the audit outcome, its remediation,
and B/C/D through to the owner gate.

Codex's own headline claims were independently reproduced and are **honest**:

- `npm run qa:all` → 97 passed, 1 intentional WebKit skip. Reproduced exactly.
- Unit 21/21, hardening 70/70. Reproduced exactly.

That matters, because this project has previously shipped false documentation claims
(v3.2 T16). Codex's *numbers* hold up. What did not hold up is the **meaning** of some
of those green tests, and one documented performance figure.

## 2. Deviations from the approved spec

Two, both owner-approved on 2026-07-27:

### D1. Japanese font self-hosting pulled forward from Package C3 into Package A

The spec placed self-hosting in C3. `css/site.css` carried a recorded exception —
*"JP glyph subsetting impractical to self-host"* — and Codex's handoff deferred the whole
question as "typography is locked". **Measurement falsified the premise.** The committed
pages use 85 distinct CJK codepoints; both faces subset at ~98.4% reduction. Delivery is
not design: self-hosting the same faces changes zero pixels.

This was not cosmetic. It was the single largest real-user defect on the site, and one
root cause behind two failing metrics — the render-blocking CDN stylesheet (LCP) and the
Latin fallback in `--font-jp` causing JP text to paint in system Hiragino and reflow (CLS).

**Status: shipped** (`1c30c53`, `f734827`). See §4.

### D2. `ja/index.html` is generated *from* the canonical `index.html`, not from content JSON

The spec (C1) specified `content/en.json` + `content/ja.json` + `templates/home.mjs`
generating **both** pages. That would turn the hand-authored, heavily design-commented
`index.html` into a build artifact, moving the inline design rationale into templates and
rebuilding a composition that is under an explicit visual lock.

All 19 `data-en` strings already carry a paired `data-ja` — the translation data is
complete and colocated in the markup. So the lower-risk architecture is: `index.html`
stays canonical and hand-authored; a deterministic transform emits `ja/index.html` by
applying the `data-ja` values, rewriting `lang`, canonical, hreflang and OG metadata.

One source of truth per string, so translation drift is structurally impossible rather
than merely tested for, and the runtime EN/JA toggle improves with the same edit.

## 3. Audit outcome (Task 1)

Six-dimension adversarial audit, Opus 5, each dimension independently verified by a
second agent instructed to refute. Auditors ran the suites themselves rather than
reading test names.

**Confirmed defects to remediate.** Each was re-verified by me against the source before
being accepted here; the ones marked ★ I found or confirmed independently.

| # | Sev | Defect | Site |
|---|---|---|---|
| A1 ★ | Important | 128 MiB postFX budget is evaluated only at boot; `sizeComposers` reallocates on resize with no re-check. iPad in Split View passes at 55.6 MiB, then expanding allocates 152.6 MiB — 2.7× over the gate that exists to prevent exactly this. | `background.js:2511` |
| A2 ★ | Important | `webglcontextrestored` restarts the loop without resetting `last`. Every other resume path resets it (2472, and 2785 with the comment "don't lerp across the hidden gap"). After a context loss the first frame reports `elapsed ≈ 10s`, which alone satisfies the 4-second sustained-low-FPS rule — **a context loss instantly and permanently demotes any device to lite for the session.** | `background.js:2529` |
| A3 ★ | Important | The real `fpsEMA` → demoter seam has never executed. Production samples real FPS only when `tier !== 'rich'`, and the sole demotion test uses `?tier=rich`, so the demoter only ever sees the injected constant. Task 7's "deterministic demotion" is proven for the injected path only. | `background.js:2612` |
| A4 ★ | Important | `probe.cleaned` is an unconditional literal — set in `finally` outside the `if (gl)` guard, hardcoded on every other return. No reachable path returns `false`, so every assertion on it is guaranteed true. | `gpu-probe.mjs:180` |
| A5 ★ | Important | `deterministic FPS injection stays behind sceneDebug` is vacuous twice over: `?tier=lite` never enables `sceneDebug` anyway, and the assertion runs before `boot.mjs` (top-level-await, does not block `load`) has imported the scene. Deleting the production guard leaves it green. | `mobile-rich.spec.mjs:258` |
| A6 | Important | Calibration's "UA never decides tier" asserts hard-coded string literals from the harness back at itself. Adding UA-based tier selection to `background.js` leaves it green. | `site-matrix.spec.mjs:250` |
| A7 | Minor | `estimatePostFxBytes` omits depth attachments, under-counting real attachment memory ~1.5×. Under-counting is the dangerous direction for a gate. | `quality-policy.mjs:17` |
| A8 | Minor | Transient probe verdicts (`budget`, `error`, `no-webgl2`) are cached to sessionStorage. Backgrounding the tab mid-probe stops rAF → `budget` → a capable iPhone is pinned to lite for the whole session. Directly affects the owner calibration protocol. | `gpu-probe.mjs:72` |
| A9 | Minor | A degenerate all-zero probe score reads as "fastest possible GPU" and promotes to mobile-rich. `performance.now()` is clamped to 1ms on WebKit and 100ms under `resistFingerprinting`. | `gpu-probe.mjs:163` |
| A10 | Minor | Lighthouse performance is compared against a value Lighthouse already rounded to 2 decimals, so a true 79.5 reports PASS at the ≥80 gate. The handoff calls this boundary-tested. | `lighthouse-policy.mjs:10` |
| A11 | Minor | The desktop visual gate compares **only** scene-hidden layout PNGs. Full-scene and state captures are written but never compared, so a palette, bloom-strength or scene-composition change passes the "visual lock" silently. | `compare-reference.mjs:7` |
| A12 | Minor | The safe-area test substring-matches the whole file. Commenting the rule out, or declaring the `env()` values into unused custom properties, leaves it green. | `calibration-surface.test.mjs:14` |
| A13 | Minor | The clipboard test compares the copied value against the page's own rendered value — both sides originate from the same `addr` variable, so nothing pins the actual address. | `site-matrix.spec.mjs:386` |
| A14 | Minor | "rotation preserves the live DPR cap" never re-reads `effectiveDprCap` after rotation; it asserts only `rendererDpr <= 1.75`, which a cap collapsing to 1 also satisfies. | `site-matrix.spec.mjs:558` |
| A15 | Minor | The 128 MiB fail-closed branch is reachable in production but has no executable test — only the within-budget side is asserted. | `mobile-rich.spec.mjs:121` |
| A16 | Minor | Probe timeout and `no-webgl2` exit paths are untested; the harness even carries an unused `readMs` knob intended for it. | `quality-policy.test.mjs:48` |

**Corrected documentation claim.** The handoff records `qa:perf:network` at mobile
performance 70 / CLS 0.05902. Three independent cold runs measured **performance 60 /
CLS 0.17235** (stable to 5 decimal places across all three). 0.172 fails the ≤0.10 gate.
The published figure understated a failing metric.

**Methodological finding.** `qa:perf` blocks Google Fonts to make runs repeatable. That
also removes the late font swap that *caused* the CLS, so the green release gate
structurally could not observe the site's largest real-user defect. A deterministic gate
that excludes the dominant production variable is measuring a site nobody receives. With
the fonts self-hosted this is now moot — the two modes converge — but the gate design
should not be repeated.

**Not defects.** The adversarial verifiers refuted a number of candidate findings; those
are not carried here. Codex's probe cleanup is genuinely rigorous: `retain()` is called in
the same expression as every `create()`, so there is no create-before-retain leak window,
and allocation-failure, shader/link-failure, `readPixels`-throw, mid-draw-throw and
budget-timeout paths all delete every object by identity with the correct delete method
before losing the context. Demotion is provably one-shot. The 128 MiB gate *is* evaluated
before any allocation on the boot path. Disposal covers the Three r158 `UnrealBloomPass`
high-pass material that upstream `dispose()` omits.

## 4. Completed

### Task 3 — Japanese font self-hosting ✅ `1c30c53`, `f734827`

Production-network Lighthouse, median of three cold runs:

| | before | after | gate |
|---|---|---|---|
| performance | 60 | **92** | ≥80 ✅ |
| FCP | 4185ms | **1430ms** | — |
| LCP | 4859ms | **2327ms** | ≤2500 ✅ |
| CLS | 0.1724 | **0.0588** | ≤0.10 ✅ |
| TBT | 154ms | 248ms | ≤200 ⚠ |
| desktop | 98 | **100**, zero failing audits | ≥85 ✅ |

Delivered: `tools/build-fonts.mjs` (content-driven subsetting, so the glyph set grows with
the copy), `tools/fetch-font-sources.mjs` (verifies family/weight/OFL out of each binary),
4 WOFF2 subsets + 2 OFL licenses, 5 unit tests, 3 browser tests across both engines.
Sources gitignored. Desktop layout unchanged (worst section 0.086% vs the 0.5% gate).

TBT is carried to Task 8 — see §5.

## 5. Remaining work

### Task 2 — Remediate A1–A16
Red-green per fix. Every fix lands with a regression test that was **observed failing
first**; the vacuous-test findings (A5, A6, A12, A13, A14) are remediated by making the
test able to fail, proven by the deletion the auditor named.

### Task 8 — Mobile TBT
Re-measure on an unloaded machine **first** — both existing runs were taken under six
concurrent Opus agents, and TBT is the metric most distorted by host CPU contention. If
it confirms, chunk scene construction at natural seams so no single task exceeds 50ms
(a 304ms task contributes 254ms of TBT; the same work in sub-50ms slices contributes 0).
Final composition must be unchanged under the visual lock.

### Task 4 — Package B: portfolio evidence
Three case studies replacing three project rows that currently all link to a bare profile
URL and describe projects with **no corresponding public repository** — confirming the
spec's §B1 complaint. Verified against the live account:
- `Personal-Website-3.0` — public. Deep engineering material in the 70-file docs corpus.
- `tokyo-data-globe` — public, live demo, substantive README.
- SeenThis Japan — NDA-safe aggregate, **no repository link**: the related
  the owner's related employer-tooling repositories are PRIVATE and describe
  production internals. Neither their names nor their contents may appear in
  public content, so this entry carries no repository link at all.

### Task 5 — Package C: bilingual, semantic media, discovery
Per D2. Plus semantic `picture`/`img` for gallery photographs, JSON-LD, `robots.txt`,
`sitemap.xml`, hreflang. Japanese wording ships marked **pending owner review**.

### Task 6 — Package D: artifact allowlist, CI, final sweep

### Task 7 — Whole-branch review + owner gate handoff

## 6. Owner gates (cannot be closed autonomously)

1. **iPhone calibration** — `RICH_THRESHOLD_MS = 4.5` is provisional. Note A8: backgrounding
   the tab mid-probe poisons the cached verdict, so the calibration protocol needs that fix
   before the packets are meaningful.
2. **12 photo-to-city labels** — owner data.
3. **Japanese wording approval.**
4. **Push / PR / Pages settings / deploy.**
5. `tokyo-data-globe` has **no license file** — worth adding before it is cited as portfolio evidence.
