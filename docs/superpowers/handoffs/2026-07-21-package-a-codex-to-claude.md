# Package A Codex to Claude Code Handoff

**Status:** WIP stopping point, not a Package A completion claim  
**Prepared:** 2026-07-23 by OpenAI Codex  
**Owner direction:** Continue the remaining work in Claude Code

## Repository identity

- Repository: `/Users/daikieishinuki/Claude Code Projects/Personal Website`
- Codex worktree: `/Users/daikieishinuki/Claude Code Projects/Personal Website/.worktrees/codex-v34-corrective-completion`
- Branch: `codex/v34-corrective-completion`
- Task 8 WIP implementation commit: `69e6a31`
- Proposal branch retained for comparison: `v34-mobile-rich`
- Production baseline: `origin/main` at `562b0a3`
- No Codex commit has been pushed, proposed as a PR, merged, deployed, or used
  to change GitHub Pages settings.

Review both ranges:

```bash
git diff v34-mobile-rich...codex/v34-corrective-completion
git diff origin/main...codex/v34-corrective-completion
```

The binding program and active Package A plan are:

- `docs/superpowers/specs/2026-07-21-v34-corrective-completion-program-design.md`
- `docs/superpowers/plans/2026-07-21-package-a-mobile-foundation-richness.md`

## Completed and independently reviewed

Tasks 1 through 7 are complete on this branch. The durable decisions, commit
ranges, test evidence, and reviewer outcomes are indexed in
`docs/superpowers/CODEX-AUDIT-LOG.md`.

The latest fully reviewed implementation is Task 7:

- `c4e2b81` deterministic demotion and GPU disposal
- `bba3e92` disposed postprocessing graph severing
- `b90e106` explicit Three r158 Unreal high-pass material disposal
- `792b3d8` Codex audit-log closure

Its final independent review found no open findings. It verified 13/13 named
resources disposed exactly once, empty retained graphs, a live DPR cap of 1.5
through rotation, persisted lite fallback, and clean Chromium/WebKit behavior.

## Task 8 WIP retained in `69e6a31`

The WIP commit intentionally does not use the plan's final Task 8 subject and
must not be treated as reviewed or complete.

Retained work:

- `tests/browser/site-matrix.spec.mjs`
  - nine required viewports;
  - reduced-motion, aborted scene imports, null WebGL, forced tiers, Japanese,
    no-JS, clipboard success/denial, touch swipe, context loss, visibility,
    repeated navigation, session cache, rotation, and Chromium `file://`;
  - exact GitHub, LinkedIn, and Instagram destination allowlist;
  - zero page/console error assertions in the viewport rows.
- `tests/performance/lighthouse-mobile.mjs`
  - three cold mobile runs and a sorted median;
  - a real Lighthouse `desktopConfig` passed as the third API argument;
  - assertions that the desktop report is actually desktop;
  - temporary report output only;
  - Chrome and server cleanup with SIGTERM then SIGKILL fallback.
- `tests/device/mobile-rich-calibration.html` and `.mjs`
  - five unforced probes;
  - 15-second FPS minimum/median;
  - context-loss, viewport, DPR, reduced-motion, and diagnostic UA fields;
  - copy/export of one JSON packet;
  - explicit clearing of only `v34.tierProbe`;
  - UA is labeling only and never a tier-selection input.
- `tests/helpers/serve.mjs`
  - configurable host for actual-device testing;
  - gzip response fidelity.
- `package.json`
  - `serve:device`, `qa:matrix`, and `qa:perf`.
- `js/app.js`
  - the only retained production-code change in Task 8;
  - restores signal-row focus after an asynchronous Clipboard API rejection
    uses the textarea fallback.

No Task 8 change remains in `index.html`, `css/site.css`, `js/background.js`,
fonts, or the locked desktop visual composition.

## Fresh stopping-point evidence

Run on 2026-07-23 after all rejected experiments were removed:

```text
npm run test:unit
  PASS 13/13

npm run test:hardening
  PASS, exit 0

node --check js/app.js
node --check tests/browser/site-matrix.spec.mjs
node --check tests/performance/lighthouse-mobile.mjs
node --check tests/device/mobile-rich-calibration.mjs
git diff --check
  PASS

npx playwright test tests/browser/site-matrix.spec.mjs \
  --project=chromium --project=webkit --grep clipboard
  PASS 4/4
```

The last full retained Chromium matrix completed 26/26. A fresh full WebKit
matrix after the final cleanup is still pending.

## Open performance blocker

The corrected runner produces a real desktop pass but the mobile simulated LCP
gate is still red:

```text
mobile cold #1: performance 91, FCP 1728ms, LCP 2927ms, CLS 0.0595, TBT 162ms
mobile cold #2: performance 92, FCP 1727ms, LCP 2852ms, CLS 0.0635, TBT 118ms
mobile cold #3: performance 92, FCP 1727ms, LCP 2926ms, CLS 0.0418, TBT 122ms
mobile median:  performance 92, FCP 1727ms, LCP 2926ms, CLS 0.0595, TBT 122ms

true desktop: performance 100, FCP 402ms, LCP 601ms, CLS 0.0394, TBT 9ms
```

Required mobile thresholds are performance >=80, LCP <=2500ms, CLS <=0.10,
and TBT <=200ms. Only mobile LCP remains red. The LCP element is
`body > main#main > section#home > h1`.

There is an important measurement discrepancy to adjudicate: observed mobile
FCP/LCP in the Lighthouse reports is about 125-150ms, while Lighthouse's
Lantern simulation reports about 2.9s. Do not weaken the written threshold or
add a Lighthouse-query bypass. Determine whether the simulation's dependency
model represents a production risk or whether the plan's measurement method
needs an explicit, reviewed correction.

### Rejected experiments already tried

All of these were removed completely:

- a plain Hanken preload: no meaningful LCP change;
- a 6.5 KiB exact-glyph Hanken hero subset: exact metrics, no LCP change;
- partial critical CSS plus asynchronous full CSS: LCP 2777ms and CLS 0.7321;
- complete CSS inlining: LCP 3002ms;
- suppressing 890 coarse-startup hero title mutations: LCP remained 2927ms;
- mobile optional-font work began at the usage boundary and was removed
  without being retained or accepted.

The first uncompressed local server result was also false evidence. Adding gzip
reduced the site stylesheet transfer from 60,498 bytes to about 15,468 bytes
and moved the meaningful baseline to the values above.

## Required continuation

1. Inspect `69e6a31` as WIP before changing it.
2. Run the full WebKit matrix:

   ```bash
   npm run qa:matrix -- --project=webkit
   ```

3. Reproduce the current performance result:

   ```bash
   npm run qa:perf
   ```

4. Resolve or formally adjudicate the mobile Lantern LCP discrepancy without
   changing thresholds merely to make the test pass.
5. Request an independent Task 8 review and correct all findings.
6. Only after Task 8 is actually green, perform Task 9:
   - burn the planned cache versions;
   - run the complete battery;
   - update this handoff and the audit log;
   - stop at the owner-device gate.

Do not use the plan's final Task 8 or Task 9 commit subjects until their
acceptance criteria are genuinely met.

## Owner-device gate

Package A must not be called shipped until the owner returns actual-iPhone
evidence. The exact loop is:

```bash
npm run serve:device
```

Open this on the iPhone:

```text
http://<Mac-LAN-IP>:4173/tests/device/mobile-rich-calibration.html
```

Collect and return three JSON packets:

1. normal/cold;
2. Low Power Mode;
3. warm/thermal.

Also record visual quality, rotation, background/restore, and context-loss
verdicts. `RICH_THRESHOLD_MS = 4.5` remains provisional until at least five
unforced cold scores and the 15-second owner-device result are reviewed.

## Claude review prompts

- Recheck probe cleanup by object identity on success and failure.
- Recheck the 128 MiB postprocessing arithmetic before allocation.
- Recheck mobile-rich demotion, direct-render continuation, persistence, and
  complete disposal/reference severing.
- Recheck live DPR behavior after rotation and resize.
- Recheck reduced-motion and no-WebGL independence from essential DOM behavior.
- Recheck that `sceneDebug` injection is query-gated.
- Recheck that desktop high-tier composition and final typography remain
  unchanged.
- Recheck the calibration tool's no-tier-forcing and UA-diagnostic-only rules.

## Prohibitions still in force

- No push.
- No PR.
- No merge.
- No deployment or GitHub Pages setting change.
- No claim that Package A, mobile-rich, or the website program is complete.

