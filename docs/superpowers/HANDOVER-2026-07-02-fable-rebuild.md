# HANDOVER — Fable 5 Whole-Task Rebuild (Cyberpunk Tightened Slice)

## Objective
Rebuild the ENTIRE tightened cyberpunk slice (plan Tasks 1–7) FROM SCRATCH on **Fable 5**, on THIS branch (`fable/cyberpunk-threejs-pass`), using the committed spec + plan. The prior Opus/Sonnet build is preserved on `claude/cyberpunk-threejs-pass` purely for **cross-reference** — after Fable's rebuild, diff the two branches to see the differences/improvements.

## Starting state of THIS branch (clean rebuild base)
- `fable/cyberpunk-threejs-pass` @ `afeca1b`.
- Contains: the original rain/glass overlay (`2d4c9a6` — the buggy *frozen-rain* version the plan's Task 1 revises), the ratified spec, and the execution plan. NO tightened Task 1–4 code.
- Verified clean: `node --check js/background.js` OK; `node tools/verify-site-hardening.js` = 7/7.
- Therefore the plan's Task 1 ("revise the `2d4c9a6` overlay") and every later anchor are VALID from here — execute the plan verbatim.

## What Fable executes (verbatim, full rigor)
- Plan (Tasks 1→7): `docs/superpowers/plans/2026-07-01-cyberpunk-threejs-tightened-execution.md`
- Spec (definition of done): `docs/superpowers/specs/2026-07-01-cyberpunk-threejs-tightened-slice-design.md`
- Process: `superpowers:subagent-driven-development` — ONE implementer at a time (Tasks 2–5 all edit `background.js`), per-task spec+quality review, then final whole-branch review → `superpowers:finishing-a-development-branch`.
- Model: **Fable 5** for implementers + reviewers (per user).
- SDD scripts: `~/.claude/plugins/cache/superpowers-dev/superpowers/6.0.3/skills/subagent-driven-development/scripts/` (`task-brief`, `review-package`, `sdd-workspace`).

## Cross-reference (the point of keeping both branches)
- Reference build: `claude/cyberpunk-threejs-pass` — Tasks 1–4 committed + Opus-reviewed clean: `10cbdd3` (rain rebuild + layering + CSS-var ownership + CRT-toggle), `36c12fe` (scene-state + event rain multiplier + cooldown + signal-lock), `4b0c324` (font-safe sprites), `8f0bf58` (emissive halo). Task 5 was paused at the spend limit.
- To compare after Fable builds: `git diff claude/cyberpunk-threejs-pass fable/cyberpunk-threejs-pass -- js/ css/ index.html`.
- The prior build's implementer/reviewer reports + the paused Task-5 attempt live in `.superpowers/sdd/` (git-ignored, present in the working dir): `task-*-report.md`, `review-*.diff`, `task-5-opus-partial-attempt.diff`. Reference only — NOT trusted work; Fable builds its own.

## Hard-won gotchas from the prior build (bake in — they are WHY the plan is shaped this way; static `node --check` catches NONE of these)
- **Rain must FALL:** the `2d4c9a6` overlay's rain is a visual no-op (90deg gradient is invariant in Y, animated on Y). Task 1 rebuilds with a 180deg gradient animated via `transform: translateY()`, translate distance == tile height (seamless loop). Confirm motion in a browser (Task 7).
- **Atmosphere below content:** seat `.scene-atmosphere` at `z-index: 0` (below `main`) so the hero name + gallery photos are not tinted.
- **No per-frame `:root` writes:** JS sets ONLY `--scene-rain-mul`, write-on-change (cache guard); CSS owns base opacity + the `@media` fallbacks. Never reintroduce a per-frame `setAtmosphereVars`.
- **No tofu labels:** `makeCanvasSprite` must redraw on `document.fonts.ready`; the label `drawFn` must guard `p || label` (construction calls `redraw(undefined)`).
- **Halo is not a spinner:** `spinGroup` (rings/ticks/packet) rotates; `staticGroup` (glow/labels) does NOT; each label gated by its OWN facing angle (only 1–2 legible at once); packet event-gated (`p > 0.03`), no perpetual orbit.
- **`tokyoA0` scope:** pass it INTO `updateTokyoHalo` — a dangling reference is a runtime `ReferenceError` that blanks the scene and `node --check` won't catch it.
- **Callout:** heading `isTokyo ? '東京 / ' + target.label : target.label` (NO "DALLAS / DALLAS"); Tokyo status shows live JST via `toLocaleTimeString(..., { timeZone: 'Asia/Tokyo' })`.
- **T6 verifier:** when carrying over the ORIGINAL plan's atmosphere check, UPDATE it: `--scene-rain-opacity` → `--scene-rain-base`, and the reduced-motion regex → `.scene-rain::before, .scene-rain::after { animation: none; }` (animation moved to the pseudo-elements), else it's a stale FAILING assert.
- **T7 tuning (browser only):** rain visibly falls + sparse (not cross-hatching the CRT into a test pattern); halo/label brightness (additive `RingGeometry` may read hot); the primary TOKYO label may read DIM at dead-centre (lever: `lf*lf` exponent or per-priority floor); old `tokyoRing` + new halo ring read as concentric; content untinted; Scanlines/CRT toggle also dims atmosphere; reduced-motion + mobile/LITE (~390×844) + `file://` all OK.

## Design decisions already ratified (do not relitigate)
a) no new Three.js deps (true post-processing is a later escape hatch). b) rain restrained (~0.17 base). c) labels balanced/district + live JST. d) debug-only readouts + fold atmosphere into the CRT/scan toggle. e) portfolio-only. Concept: clean foreground + emissive living Tokyo signal-scape + a signal-lock beat on home/contact.

## Notes
- `.superpowers/sdd/progress.md` reflects the PRIOR Opus build; THIS doc is authoritative for the Fable rebuild.
- GateGuard hook is active (fact-forcing on first Bash + on Write/Edit): present the 4 facts, then retry.
- Git identity is the repo's local default (`daikieishinuki@Daikies-MacBook-Pro.local`); set `user.email` before pushing to GitHub if that matters.
