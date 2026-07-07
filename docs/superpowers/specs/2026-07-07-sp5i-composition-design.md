# SP5i — Composition: luminance arbitration + cinematic break (Design + record)

**Date:** 2026-07-07 · **Branch:** `v3-build` · **Program:** SP5, slice i (Composition) · Follows [[SP5h hud worn-hardware]].
**Source:** `composition-elevation-brief.md` · **Rules:** `design-language-v3` §7 + §0.

## §1 — Decision (owner-delegated autonomous run)

The brief's headline: the grid skeleton and measure caps **already match v3** — the real deltas are *rhythm* and *luminance arbitration*, not re-gridding. Given the cascade risk of layout changes, this slice takes the **two high-value, low-risk levers** and defers the structural ones.

- **Lever 1 (luminance arbitration) — done, scoped.** Removed the strongest competing resting bloom, `.stat .n`'s `0 0 24px` halo. The SP5d mono stats read *cleaner* crisp (instrument output shouldn't glow), and it removes a bright peer competing with the About headline. Kept `.about-lead` (already faint 0.1α — the headline first-read) and `.geo-line` (its own viewport's mark) — "remove the glow, not the fill; don't crush legibility."
- **Lever 6+7 (one cinematic break) — done.** The first gallery tile becomes a wide letterbox feature; the rest read as deliberate repetition.
- **Lever 5 (accent budget) — already delivered in [[SP5b HUD discipline]]** (structural amber demoted to muted). Not repeated.
- **Deferred (structural, higher-risk):** L3 thin-rule *named cells* (bracket chassis + labels — brief's own over-framing risk), L4 Swiss third-zone right-meta column (responsive-collapse risk), L8 seat `.stat-row` on the grid (marginal). Recorded per the brief's restraint guidance.
- **L9 guard held:** `#scene-root` globe stays the sole dead-center monument; no foreground block center-aligned.

## §2 — Change set (CSS + one markup class + `?v`)

- **L1** (`css/site.css`, `.stat .n`): drop `text-shadow: 0 0 24px rgba(57,240,255,0.3)`.
- **L6+7** (`css/site.css`, after the gallery breakpoints): `.shot.feature { grid-column: span 2; aspect-ratio: 8 / 5; }` — 8:5 keeps the feature's height ≈ its 4:5 row-mate so row one stays even; `span 2` clamps to available columns at the 2-col/1-col breakpoints (CSS spec) → responsive-safe.
- **Markup** (`index.html:213`): first `.shot` (IMG_01, gallery-07) → `class="shot feature"`.
- **Version:** `site.css?v=3.16` → `?v=3.17`.

## §3 — Decision record — SP5i COMPLETE (2026-07-07)

**Commit:** *(this commit)* — L1 glow removal + L6/7 gallery feature break + `?v`→3.17. CSS + one markup class; **no `js/`**.

**Gates PASS.** Browser (`localhost:8080`, `?v=3.17`, Gallery): the first tile renders as a **wide cinematic letterbox feature** (the mountain panorama across two columns) beside a normal portrait tile, **row-one heights even**, the rest of the field uniform below — the single focal break the brief's "one break in the uniform field" calls for. No layout breakage; `grid-column: span 2` degrades cleanly at the 880px/400px breakpoints by CSS clamp. L1: `.stat .n` glow removed — the mono stats read as crisp instrument output, one fewer resting bloom competing (verified subtractive; fill/legibility intact). Globe monument + asymmetric foreground grids held. **NEXT:** Motion-2 (the last build slice).