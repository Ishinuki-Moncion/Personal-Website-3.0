# Codex Audit Log — Personal Website 3.0

This file is the durable review index for work led by **OpenAI Codex** on the Personal Website 3.0 corrective-completion program.

## Audit identity

- Codex implementation branch: `codex/v34-corrective-completion`
- Proposal branch preserved for comparison: `v34-mobile-rich`
- Production baseline: `origin/main` at `562b0a3`
- Codex commits use author and committer `OpenAI Codex <noreply@openai.com>` and a `codex` scope or marker in the subject.
- Claude Fable is invited to review the specification, plans, implementation diffs, tests, screenshots, measurements, and unresolved owner gates independently.

## Codex-authored work

Every commit below has author and committer
`OpenAI Codex <noreply@openai.com>`. “Approved” means an independent agent
review found no open Critical or Important finding.

| Commit | Task / purpose | Review state |
|---|---|---|
| `2bb3038` | Corrective-program specification and isolation rule | Owner approved |
| `3195220` | Package A plan and technical pre-flight | Approved after six Important plan corrections |
| `bee58dd` | Task 1 reproducible QA harness and immutable references | Corrected by `3db5161` |
| `3db5161` | Task 1 reference and structural-lint corrections | Approved |
| `b035730` | Task 1 reviewed closure; Task 2 validation refinement | Audit marker |
| `5b52ce5` | Task 2 mobile menu, contact, semantics, and modal baseline | Corrected by `d449888` |
| `d449888` | Task 2 lightbox async-race correction | Approved |
| `b015754` | Task 2 reviewed closure | Audit marker |
| `28b60bb` | Task 3 progressive app-first startup and optional WebGL | Corrected by `4902840` and `3ac9526` |
| `4902840` | Task 3 instant/reduced startup correction | Corrected by `3ac9526` |
| `3ac9526` | Task 3 terminal instant boot | Approved |
| `632a7ab` | Task 3 reviewed closure | Audit marker |
| `008c3f2` | Task 4 measured tier policy and leak-free yielded probe | Corrected by `6ffa536` |
| `6ffa536` | Task 4 cache normalization and resource proof | Approved |
| `7991c9f` | Task 4 reviewed closure | Audit marker |
| `3ce13c3` | Task 5 explicit capability profiles and mobile-rich payload | Approved; one Minor verifier gap assigned to Task 6 |
| `be14794` | Task 5 reviewed closure | Audit marker |
| `08add25` | Task 6 bounded mobile postprocessing | Approved; Task 5 Minor closed |
| `39c9349` | Task 6 reviewed closure | Audit marker |
| `c4e2b81` | Task 7 demotion and GPU disposal | Corrected by `bba3e92` and `b90e106` |
| `bba3e92` | Task 7 disposed-graph reference severing | Corrected by `b90e106` |
| `b90e106` | Task 7 Three r158 high-pass material disposal | Approved |
| `792b3d8` | Task 7 reviewed closure | Audit marker |
| `69e6a31` | Task 8 WIP failure/performance battery | Historical stopping point |
| `8620e62` | Task 8 stopping-point record | Historical audit marker |
| `ab5f3d2` | Task 8 deferred closed-lightbox image | Corrected simulated LCP blocker |
| `ae9da60` | Task 8 server, matrix, lifecycle, calibration, and Lighthouse review corrections | One Important iPhone safe-area finding remained |
| `783541d` | Task 8 iPhone calibration safe-area correction and regression | Approved with no Critical, Important, or Minor findings |
| Task 9 close-out commit (current branch tip) | Cache burns, final audit, and Claude Fable handoff | Initial review found one Important unversioned renderer-policy import; correction re-review approved with no findings |

Task reports and review diff packages are local, ignored evidence under
`.superpowers/sdd/`: `task-1-report.md` through `task-9-report.md`,
`review-3195220..3db5161.diff`, `review-b035730..d449888.diff`,
`review-b015754..3ac9526.diff`, `review-632a7ab..6ffa536.diff`,
`review-7991c9f..3ce13c3.diff`, `review-be14794..08add25.diff`,
`review-bba3e92..b90e106.diff`, and `review-792b3d8..ae9da60.diff`.
Task 8’s final safe-area re-review covered `ae9da60..783541d`.

This table is updated after each reviewed task. Every integrated commit on this
branch is authored and committed as `OpenAI Codex <noreply@openai.com>` so the
Git history clearly marks the work the owner asked Codex to lead. The task
reports separately name each implementer and reviewer contribution; Codex
remains responsible for the decisions, integration, and final verification.

## Review entry points

1. Read the corrective program specification.
2. Read the active package plan and its self-review section.
3. Compare `v34-mobile-rich...codex/v34-corrective-completion` for implementation-only changes.
4. Compare `origin/main...codex/v34-corrective-completion` for the full proposed program.
5. Read `.superpowers/sdd/progress.md` for task completion and review status.
6. Read task briefs, implementer reports, and reviewer diff packages under
   `.superpowers/sdd/` in the local worktree.

## Verification and evidence index

The close-out battery is:

```bash
npm run qa:all
npm run qa:matrix -- --project=chromium
npm run qa:matrix -- --project=webkit
npm run qa:perf
git diff --check
git status --short
```

The fresh 2026-07-23 close-out results are:

- `npm run qa:all`: 97 passed, one intentional WebKit skip for the
  Chromium-only `file://` case. This includes unit 21/21, hardening 70/70,
  HTML Validate, pinned W3C Nu, and both full browser projects.
- `npm run qa:matrix -- --project=chromium`: 29/29 passed.
- `npm run qa:matrix -- --project=webkit`: 28 passed, one intentional
  Chromium-only skip.
- `npm run qa:perf`: PASS. Mobile median performance 96, FCP 1727.6ms,
  LCP 2103.4ms, CLS 0.04539, TBT 135.5ms; desktop performance 100,
  FCP 397.8ms, LCP 462.8ms, CLS 0.0394, TBT 10ms.

`qa:perf` is explicitly a deterministic-first-party release gate. It blocks
Google Fonts so the result measures the repository-controlled graph and must
not be described as production-network evidence.

`npm run qa:perf:network` was also run once as separate diagnostic evidence.
It failed the unchanged mobile release thresholds at performance 70,
FCP 4175.4ms, LCP 4857.9ms, CLS 0.05902, and TBT 150ms. Its desktop reference
was performance 97 and LCP 1014.2ms. The dominant Slow-4G graph cost is the
live Google Fonts stylesheet and Japanese font shards. No typography or
desktop-composition change was made under Package A’s visual lock, and this
result is intentionally not represented as green.

The immutable visual evidence is local and ignored at
`.superpowers/gates/codex-v34/package-a-reference/`. It contains matching
`before/` and `after/` sets for all six full-scene sections, six scene-hidden
layouts, control deck, lightbox, and 390x844 mobile menu. Independent review
opened every full-scene pair, found the globe seat, deep-black floor, rain
language, cyan/amber bloom, typography, and layout visually comparable, and
measured scene-hidden layout ratios between 0.014% and 0.058%.

Open automated findings: none. Open external evidence: actual owner iPhone
normal/cold, Low Power, warm/thermal, rotation, background/restore,
context-loss, and visual-quality verdicts. `RICH_THRESHOLD_MS = 4.5` remains
provisional pending those packets and an explicit owner keep/change decision.
No push, PR, merge, deployment, or GitHub Pages setting change has occurred.

## Binding decisions

- Desktop art direction is locked; content and semantic changes may not silently redesign it.
- Essential DOM behavior must not depend on WebGL initialization.
- Existing mobile defects are fixed before enabling mobile-rich.
- The original `2026-07-16-v34-mobile-richness.md` plan is historical and must not be executed.
- Mobile-rich starts at DPR 1.75, half-resolution bloom, final samples 2, and no mobile rivulet.
- Demotion must dispose pass resources, retain a live DPR cap through resize, and have a deterministic behavioral test.
- Portfolio copy uses only verified facts; no client names or outcomes are invented.
- Japanese output requires an explicit owner-language gate before deployment.
- No push, PR, Pages setting change, or deployment occurs without owner approval.

## Current status

- Corrective specification: complete and owner approved.
- Isolated Codex branch/worktree: complete.
- Baseline verification: JavaScript syntax clean, `git diff --check` clean, hardening 48/48.
- Package A replacement implementation plan: complete; independent technical
  pre-flight closed six Important findings and returned clean.
- Task 1 QA foundation: complete on this branch. The immutable ignored
  `package-a-reference/before/` set contains six full-scene captures, six
  scene-hidden layout captures, control-deck, lightbox, and 390×844 mobile-menu
  states. Capture interactions run on fresh pages so scene-heavy section
  rendering cannot starve state actionability.
- Task 1 task review: spec compliant, quality approved, no open findings.
- Task 2 mobile and semantic baseline: complete. The initial review found two
  Important WebKit lightbox defects and one Minor hardening weakness; the
  corrective commit added request-token cancellation, activating-shot focus
  restoration, deterministic delayed-open coverage, and scoped CSS parsing.
  Re-review approved with no open findings.
- Task 3 progressive startup: complete. Review corrections hide the disabled
  reticle for reduced-motion fine pointers and make instant reduced/returning
  boots synchronous, terminal, and single-event. Essential menu, gallery, and
  contact behavior now survives scene import failure; final review approved
  with no open findings.
- Task 4 measured quality policy: complete. Reduced/fine/forced/cache paths are
  allocation-gated; real Chromium and WebKit probes produce finite measured
  results; every retained WebGL object is deleted by identity before one
  context loss. Cache results are normalized to the exact five-field contract.
  Final review approved with no open findings.
- Task 5 capability profiles: complete. Mobile-rich now owns rich renderer
  capabilities while remaining in mobile layout/input mode; desktop high keeps
  its locked values and behavior. Review approved with one Minor verifier
  allowlist blind spot, scheduled inside Task 6's existing hardening scope.
- Task 6 bounded postprocessing: complete. Mobile-rich uses half-resolution
  bloom with 0 bloom samples and a full-resolution final composer with 2
  samples; estimated attachment use must stay within 128 MiB before composer
  allocation or the scene fails closed to direct rendering. Desktop high stays
  full-resolution at 4/4 samples. Independent review instrumented both composer
  sizes and the zero-allocation breach path, reran Chromium/WebKit, verified all
  six layout ratios below 0.005, visually approved all six full-scene pairs,
  and returned no findings. The deferred Task 5 hardening gap is closed.
- Task 7 deterministic demotion and disposal: complete. A measured or
  debug-injected sustained low-FPS mobile-rich scene demotes once, caps live
  DPR at 1.5 through resize, switches to direct rendering, and persists a lite
  session result without rebuilding geometry. Initial review found retained
  composer/pass graphs; the first correction explicitly severed every pass,
  target, buffer, uniform, material, scene/camera, and composer reference after
  real disposal. Fresh re-review then found that pinned Three r158 omits the
  UnrealBloom high-pass material from its own `dispose()`; the second correction
  registered and disposed it explicitly. Final review verified 13/13 named
  resources exactly once, empty externally retained graphs in Chromium and
  WebKit, actual DSF 3 DPR at 1.5 before/after rotation, no errors, and no open
  findings.
- Task 8 full failure/performance battery: complete through `783541d`. Lantern
  graph forensics traced the prior simulated LCP failure to the parser-requested
  image source on the closed lightbox, not the visibly painted hero. Deferring
  that source until open lowered the deterministic mobile median below the
  unchanged 2500ms gate. Review corrections then hardened the LAN server,
  pointer matrix, context-loss proof, raw Lighthouse thresholds, lightbox
  decoding paths, reduced/static calibration semantics, and explicit
  deterministic-versus-production-network labeling. The final safe-area pass
  protects all four iPhone cutout edges. Chromium is green 29/29; WebKit is
  green 28 passed plus one intentional Chromium-only `file://` skip. Final
  independent review found no Critical, Important, or Minor finding.
- Task 9 Package A close-out: cache versions match the approved tuple;
  both production policy importers carry `?v=1`, and a unit regression locks
  the complete cache graph. The final audit and Claude Fable handoff are
  prepared. Independent re-review approved the correction with no Critical,
  Important, or Minor finding. Automated close-out remains distinct from the
  external owner-device threshold decision.
- Production site code changes remain isolated to this Codex worktree and have
  not been pushed, proposed as a PR, deployed, or merged into production.
