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
- Production site code changes remain isolated to this Codex worktree and have
  not been pushed, proposed as a PR, deployed, or merged into production.
