# v3.1 — Deep-black regrade + calm-the-signals (owner-directed corrective pass)

**Date:** 2026-07-07. **Author:** Fable 5 (auditor), from owner decisions after the SP5d-j audit.
**Owner verdict driving this:** reject the teal floor (wants the original deep space black); site has accumulated too many competing layers; photos clash with the noir frame. Decisions taken via explicit owner sign-off: (1) FULL black revert incl. scene grade, (2) photos dim-at-rest/full-on-demand, (3) calm-the-signals de-clutter (keep every system, restore scarcity).
**North-star unchanged** — this pass *strengthens* non-negotiables #1 (near-black), #2 (warm budget 1–6%), #4 (instrument only the focus).

## Slice A — deep-black floor (CSS + HTML)
In `css/site.css` `:root`:
- `--void: #0a1416` → `#05060a`
- `--void-2: #0e1a1d` → `#080a10`
- `--void-deep: #050e10` → `#030407`
- `--panel-solid: rgba(8,20,22,0.92)` → `rgba(7,9,14,0.92)`
Hardcoded scrims: `.mobile-menu` bg `rgba(5,14,16,0.97)` → `rgba(3,4,7,0.97)` (~:299); `.lightbox` bg `rgba(5,14,16,0.96)` → `rgba(2,3,6,0.96)` (~:628).
`index.html`: `<meta name="theme-color" content="#0a1416">` → `#05060a`; bump `css/site.css?v=3.18` → `3.19`.
Do NOT touch: `--cyan/--cyan-dim/--line/--line-strong`, any `rgba(57,240,255,…)`, favicon (already #05060a), `.scene-debug`/`.nav.scrolled` (already black), the SP5a amber-wash kills (stay dead).

## Slice B — neutralize the teal scene grade (background.js)
gradePass uniforms (~:1658-1698): `uTealAmt 0.6` → `0.0`; `uLift (-0.02, 0.006, 0.020)` → `(-0.02, -0.02, -0.02)`. Keep uGain/uSat/uGamma and the CA pass (amber-highlight signal look stays). Fog is already `0x05060a` — matches the new floor, leave it.
Version: bump `V.bg` in `js/boot.mjs` (`3.9`→`4.0`) AND `boot.mjs?v=2`→`3` in index.html.

## Slice C — calm the signals (background.js)
1. **Amber starfield → cool**: the 1200-particle amber field (~:146-149) is the #1 warm-budget violation. Re-color to cyan/blue family OR cut count to ≤200 with lower alpha (implementer's eye; goal = amber reads as event, not wallpaper).
2. **Arc+comet once per journey**: replace the ~12s perpetual re-arm (~:842-881, re-arm timer ~:1908) with once per section-story trigger (replay on About/`route:'replay'` focus is fine; no idle repeats).
3. **Halo labels 5 → 2** (東京 + one secondary; TOKYO_HALO_LABELS ~:371) and keep the callout panel from drifting: clamp/fade the callout when it detaches from the limb (grey-rectangle artifacts seen in audit).
4. **Hero rain 1.0 → ~0.6** in `sectionStories` (~:1325-1350); other sections keep current multipliers.
5. **One signal per section-change**: keep the SP5j state-word + `__sceneFocus`; drop the `__scenePing` amber ring-flash from the scroll handler in `js/effects.js` (~:136) (keep the function for deck/reboot use).
Version: same `V.bg` bump as Slice B; `V.fx` `3.4`→`3.5` for the effects.js edit.

## Slice D — photos join the world (CSS only)
- `.shot img` (and the tile `.media` if separate): at rest `filter: brightness(.62) saturate(.55) contrast(1.05); transition: filter .45s var(--ease-out)`. On `.shot:hover/:focus-visible img`: `filter: none`.
- `.about-portrait` media: same treatment at rest (keep existing duotone layer); hover restores.
- Lightbox stays FULL color (no filter) — that's the "full on demand" payoff.
- Respect reduced-motion (transition is covered by the global kill-switch; no new animation).

## Slice E — audit bug fixes
1. **Gallery mobile bug (CONFIRMED)**: inside the existing ≤400px media query add `.shot.feature { grid-column: auto; aspect-ratio: 4 / 5; }` — kills the implicit 2px track that collapses alternating tiles. Verify at 390px: all 12 tiles equal width.
2. **Orphan tile (desktop)**: 13 cells in 3 cols ends on a lone tile — ALSO make the LAST `.shot` span 2 at ≥881px (`.gallery-grid .shot:last-child { grid-column: span 2; aspect-ratio: 8/5 }`) so the grid closes on a second cinematic band (2+3+3+3+2 = symmetric). If it looks over-framed in the eyeball pass, drop this and leave the orphan.
3. **State-flash token nit**: `.state-flash` `letter-spacing: 0.28em` → `var(--track-11)`? NO — 0.28 is a deliberate signature wider than --track-11 (0.12); instead ADD it to the documented ad-hoc signature list comment at the tracking tokens.

## Verification gates (house QA-PROTOCOL)
- `node --check` on background.js + effects.js; `node tools/verify-site-hardening.js` **expect 20/20** (grep-pinned: check none of the edits break pinned regexes — esp. arc/TRANSIT_LOOP/halo checks; if a check pins the old behavior, update the check WITH the feature, never delete).
- Live: hard-reload `?v=3.19`, zero console errors; amber now scarce (Tokyo node + LIVE tag + arc-on-replay only); floor reads black not teal; photos dim at rest, alive on hover, full in lightbox; 390px gallery all-tiles-visible; reduced-motion still static.
- Screenshots per section for owner sign-off — owner judges against the *feeling*.

## Commit plan
One commit per slice (A→E), `feat(v31a)`…`feat(v31e)`, co-author trailer per house style. No PR to main until owner signs off on the regrade.
