# Scene QA Protocol

Every visual wave/feature passes these gates before commit. No gate, no commit.

## Gate 1 — Statics (automated, blocking)

```bash
node --check js/background.js && node --check js/app.js && node --check js/effects.js
node tools/verify-site-hardening.js   # must pass 100%; every feature ADDS a check that pins its invariant
git diff --check
```

## Gate 2 — Live browser (automated via DevTools MCP, blocking)

Served page with `?sceneDebug=1`:
- Console: zero errors/warnings after 15s soak.
- `__sceneDebug().fps` ≥ 55 (desktop-high, after 10s settle); ≥ 40 (LITE 390×844).
  CAVEAT (learned 2026-07-02): Chrome quarter-rate throttles rAF for occluded/
  battery-saver windows even when `visibilityState === 'visible'` — a false FAIL
  reads as metronomic ~33ms deltas. Tiebreaker: a 1.2s PerformanceObserver
  `longtask` probe. Zero long tasks at low fps = throttled environment (gate
  passes on the last un-throttled measurement); many long tasks = real
  regression (gate fails, profile the hot path).
- `__sceneDebug()` fields sane (quality tier as expected; no NaNs).
- Screenshot at settled home + one feature-exercising state; visually compare
  against the design language doc (docs/superpowers/specs/2026-07-02-design-language-sologram-noir.md).

## Gate 3 — Degradation matrix (per wave, blocking)

- Reduced motion (matchMedia override reload): meaningful static frame, no
  animated systems running, new feature disabled or static per its spec.
- LITE (390×844 touch emulation): tier budgets applied, layout uncrowded.
- file://: loads, console clean.

## Gate 4 — Independent review (per wave)

Dispatch a fresh reviewer subagent on the wave's commit range with this doc +
the design-language doc; findings triaged before the next wave starts.
Severity rubric: Critical blocks immediately; Important blocks next wave;
Minor goes to the polish ledger.

## Gate 5 — Owner's eye (per wave, final)

The owner looks at the live site. Taste verdicts are recorded in the ledger
(accepted / rejected / tune). Rejected directions get added to the design
language doc so they stay dead.
