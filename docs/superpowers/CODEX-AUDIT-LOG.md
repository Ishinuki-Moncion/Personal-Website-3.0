# Codex Audit Log — Personal Website 3.0

This file is the durable review index for work led by **OpenAI Codex** on the Personal Website 3.0 corrective-completion program.

## Audit identity

- Codex implementation branch: `codex/v34-corrective-completion`
- Proposal branch preserved for comparison: `v34-mobile-rich`
- Production baseline: `origin/main` at `562b0a3`
- Codex commits use author and committer `OpenAI Codex <noreply@openai.com>` and a `codex` scope or marker in the subject.
- Claude Fable is invited to review the specification, plans, implementation diffs, tests, screenshots, measurements, and unresolved owner gates independently.

## Codex-authored work

| Commit | Artifact | Status |
|---|---|---|
| `2bb3038` | `docs/superpowers/specs/2026-07-21-v34-corrective-completion-program-design.md` plus worktree isolation rule | Owner approved; implementation seed |
| `bee58dd`, `3db5161` | Reproducible Node/Playwright QA harness, pinned local Nu validator, and immutable desktop/mobile `before` references | Independent task review approved; hardening 48/48, unit 1/1, Chromium 2/2 and WebKit 2/2 smoke; HTML/Nu baseline debt recorded for Task 2 |
| `5b52ce5`, `d449888` | Mobile menu/contact repair, valid static semantics, modal sibling inertness, and deterministic lightbox race regressions | Independent task review approved after corrective pass; Chromium 7/7, WebKit 7/7, hardening 53/53, HTML/Nu clean |
| `28b60bb`, `4902840`, `3ac9526` | Progressive app-first startup, optional scene boundary, mobile boot pacing, reduced cursor/probe shutdown, and terminal instant boot | Independent task review approved after two corrective passes; progressive Chromium/WebKit 4/4 each, smoke 2/2, Task 2 preservation 7/7 each, hardening 61/61 |
| `008c3f2`, `6ffa536` | Pure tier policy, 128 MiB estimate, one-way FPS demoter, and yielded leak-free WebGL2 capability probe | Independent task review approved after corrective pass; unit 12/12, real-probe Chromium/WebKit 4/4 each, hardening 64/64, zero 404/console/page errors |
| `3ce13c3` | Explicit reduced/lite/mobile-rich/high profiles, capability-owned richness gates, three-way rain payload, and expanded scene debug | Independent task review approved; Chromium/WebKit 5/5 each, six-profile runtime sweep error-free, desktop high values preserved; one non-blocking hardening allowlist gap deferred to Task 6 |

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
6. Read task briefs, implementer reports, and reviewer reports under `.superpowers/sdd/codex-v34/` in the local worktree.

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
- Production site code changes remain isolated to this Codex worktree and have
  not been pushed, proposed as a PR, deployed, or merged into production.
