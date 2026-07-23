# Package A — Codex to Claude Fable Audit Handoff

**Prepared:** 2026-07-23 by OpenAI Codex

**Status:** local implementation ready for independent audit; not shipped

**External gate:** actual owner-iPhone calibration and threshold decision

**Remote actions:** no push, PR, merge, deployment, or GitHub Pages change

## Repository identity

- Repository:
  `/Users/daikieishinuki/Claude Code Projects/Personal Website`
- Codex worktree:
  `/Users/daikieishinuki/Claude Code Projects/Personal Website/.worktrees/codex-v34-corrective-completion`
- Codex branch: `codex/v34-corrective-completion`
- Proposal branch retained for comparison: `v34-mobile-rich`
- Production baseline: `origin/main` at `562b0a3`
- All integrated branch commits are authored and committed as
  `OpenAI Codex <noreply@openai.com>`.

Review both ranges:

```bash
git diff v34-mobile-rich...codex/v34-corrective-completion
git diff origin/main...codex/v34-corrective-completion
```

Binding artifacts:

- `docs/superpowers/specs/2026-07-21-v34-corrective-completion-program-design.md`
- `docs/superpowers/plans/2026-07-21-package-a-mobile-foundation-richness.md`
- `docs/superpowers/CODEX-AUDIT-LOG.md`
- Local ignored task evidence: `.superpowers/sdd/task-1-report.md` through
  `.superpowers/sdd/task-9-report.md`
- Local ignored visual gate:
  `.superpowers/gates/codex-v34/package-a-reference/`

## Audit outcome in one page

Package A repairs the incomplete mobile implementation without redesigning the
locked desktop composition:

- essential menu, gallery, contact, and boot behavior no longer depends on a
  successful WebGL scene;
- mobile menu, contact, semantics, modal inertness, asynchronous lightbox
  races, clipboard denial, and reduced-motion paths are covered;
- coarse devices receive a measured, yielded WebGL2 probe rather than a
  user-agent decision;
- mobile-rich uses a 1.75 DPR cap, half-resolution bloom, zero bloom samples,
  two final samples, and a pre-allocation 128 MiB attachment gate;
- sustained low FPS demotes once to lite, disposes and severs the complete
  postFX graph, caps live DPR at 1.5 through resize, continues direct rendering,
  and persists the fallback for the session;
- the failure matrix covers nine viewports, touch/pointer classification,
  rotation, visibility, WebGL loss/restore, no-WebGL, aborted imports,
  reduced motion, Japanese, no JavaScript, clipboard paths, cache behavior,
  repeated navigation, and Chromium `file://`;
- the local owner calibration page performs five unforced probes and a
  15-second advancing-render FPS sample, exports one JSON packet, never uses UA
  for selection, and protects all four iPhone safe-area edges;
- the closed lightbox no longer parser-requests its first full gallery tile.
  It decodes the real full image only when opened, removing that hidden request
  from Lighthouse’s simulated critical path.

Tasks 1–9 received independent review. Task 8’s final re-review found no
Critical, Important, or Minor finding. Task 9’s initial review found an
unversioned renderer-policy import; its regression-backed correction received
final approval with no remaining finding. The detailed commit-by-commit ledger
and correction history are in `docs/superpowers/CODEX-AUDIT-LOG.md`.

## Verification contract

Run from the Codex worktree:

```bash
npm ci
npm run qa:all
npm run qa:matrix -- --project=chromium
npm run qa:matrix -- --project=webkit
npm run qa:perf
git diff --check
git status --short
```

Fresh 2026-07-23 close-out results:

- Unit: 21/21.
- Hardening: 70/70.
- `npm run qa:all`: 97 passed and one intentional WebKit skip.
- Chromium Task 8 matrix: 29/29.
- WebKit Task 8 matrix: 28 passed and one intentional Chromium-only `file://`
  skip.
- Context-loss support was available and passed in both engines; this was not
  an unsupported-engine skip.
- HTML Validate and pinned W3C Nu validation: pass.
- No page or unexpected console error in the viewport matrix.

Do not substitute `qa:perf:network` for `qa:perf`; they answer different
questions.

## Performance evidence

### Deterministic first-party release gate

`npm run qa:perf` blocks Google Fonts intentionally so the measurement is
repeatable and controlled by repository assets. It is not production-network
evidence. The fresh close-out median is:

```text
mobile:  performance 96
         FCP 1727.6ms
         LCP 2103.4ms
         CLS 0.04539
         TBT 135.5ms

desktop: performance 100
         FCP 397.8ms
         LCP 462.8ms
         CLS 0.0394
         TBT 10ms
```

Unchanged mobile gates: performance at least 80, LCP at most 2500ms, CLS at
most 0.10, and TBT at most 200ms. Desktop gates: performance at least 85, LCP
at most 2500ms, and CLS at most 0.10. Threshold evaluation uses raw values;
rounding is display-only and boundary-tested.

### Production-network diagnostic

`npm run qa:perf:network` was run once and is honestly red:

```text
mobile:  performance 70
         FCP 4175.4ms
         LCP 4857.9ms
         CLS 0.05902
         TBT 150ms

desktop: performance 97
         FCP 975.9ms
         LCP 1014.2ms
         CLS 0.00974
         TBT 0ms
```

The Slow-4G dependency graph is dominated by the live Google Fonts stylesheet
and multiple Japanese `M PLUS Rounded 1c` shards. Package A did not self-host,
subset, or change typography because desktop art direction and type are locked.
Treat self-hosting/subsetting or a carefully tested font-loading strategy as a
separate performance proposal; do not represent the current live-network run
as passing.

## Desktop visual lock

The ignored before/after reference gate contains 30 PNGs:

- six full-scene sections in each set;
- six scene-hidden layouts in each set;
- control deck, lightbox, and 390x844 mobile menu in each set.

Independent review opened all six full-scene pairs and approved the globe seat,
deep-black floor, rain language, cyan/amber bloom, typography, and layout.
Scene-hidden layout ratios were 0.014%–0.058%, below the 0.5% gate. Task 8
production changes are limited to deferred closed-lightbox loading and
clipboard-denial focus restoration; the final calibration safe-area change is
test-only UI.

## Claude Fable review prompts

Please independently check:

1. Probe cleanup by object identity on success, allocation failure,
   `readPixels` failure, and timeout; every resource must be deleted before the
   probe context is lost.
2. The 128 MiB postFX estimate before any composer allocation, including
   dimensions, DPR, sample counts, and fail-closed direct-render behavior.
3. Capability-versus-layout separation: mobile-rich keeps mobile input/layout
   while owning explicit rich renderer features; desktop high remains locked.
4. Demotion timing, one-way behavior, persisted lite result, live DPR cap after
   resize/rotation, direct-render continuation, and all 13 named postFX
   disposals exactly once.
5. Three r158 `UnrealBloomPass` ownership, especially the explicitly registered
   high-pass material that upstream `dispose()` omits.
6. Reference severing after disposal: no composer, pass, buffer, uniform,
   material, scene, camera, or render-target graph remains reachable through
   the retained debug handles.
7. Essential DOM independence during scene import failure, null WebGL,
   context loss, no JavaScript, reduced motion, and terminal instant boot.
8. Context-loss test validity: healthy startup first, stable render counts
   while lost, and advancing counts after restore in Chromium and WebKit.
9. Raw Lighthouse threshold comparisons, deterministic-versus-network labels,
   and the deferred lightbox request/decoded-source regressions.
10. QA server allowlist, dot-path and traversal rejection, weighted gzip,
    final-`realpath` containment, and symlink-escape regression.
11. Calibration semantics: UA is diagnostic only, five probes are unforced,
    reduced/static scenes report FPS not applicable, samples require advancing
    render counts, exported JSON is complete, and all safe-area edges are
    protected.
12. Desktop high-tier composition, typography, cache-version tuple, and the
    absence of unapproved push/deploy state.

## Exact owner-iPhone gate

From the Codex worktree:

```bash
npm run serve:device
```

Open on the actual iPhone:

```text
http://<Mac-LAN-IP>:4173/tests/device/mobile-rich-calibration.html
```

Return three exported JSON packets:

1. normal/cold;
2. Low Power Mode;
3. warm/thermal.

For the cold condition, clear only `v34.tierProbe` before each of at least five
unforced runs. Also record:

- visual-quality verdict against desktop intent;
- portrait-to-landscape rotation and safe-area verdict;
- background/restore verdict;
- context-loss/restore verdict;
- whether the selected tier remains usable for the full 15-second sample.

`RICH_THRESHOLD_MS = 4.5` is provisional until those five cold scores, all
three packets, and the 15-second results are reviewed. The owner must record an
explicit decision to keep or change it.

If the owner changes the threshold, make a new Codex calibration commit, rerun
unit/browser/performance gates, regenerate the review package, and update the
audit log before approval. If it is kept, record that decision in the audit
log. Until that decision and Claude Fable’s audit are returned, Package A may
be called automated-complete but mobile-rich must not be called shipped.

## Remote-action boundary

This handoff does not authorize a push, PR, merge, deployment, GitHub Pages
setting change, or production cutover. Those remain owner decisions.
