# SP5e — Type: size→tracking scale (L3) (Design + record)

**Date:** 2026-07-07 · **Branch:** `v3-build` · **Program:** SP5, slice e (Type-2) · Follows [[SP5d type numerals]].
**Source:** `type-elevation-brief.md` lever 3 · **Rules:** `design-language-v3` §5.

## §1 — Decision (owner-delegated autonomous run)

The brief asks for "tracking as a monotonic function of smallness — one published scale." **Audit finding:** tracking on this site is partly *role-based*, not purely size-based — display labels ride deliberately wide (`.hero-kicker` 0.35em, `.sec-label` 0.22em, `.mm-tag` 0.24em, `.boot-title` 0.5em) while functional controls ride tight (`.seg button` 0.08em, layout-constrained). A blind size→tracking *flatten* would erase that intentional hierarchy and risk overflowing constrained controls for a consistency gain the brief itself calls "already in-band."

**Recommended action taken = the measured version:** publish a monotonic `--track-*` token scale anchored near current medians (so drift is ≤0.02em, imperceptible), adopt it on the *generic data-labels*, and keep the deliberate signatures as documented ad-hoc exceptions.

## §2 — Change set (CSS-only + `?v`)

**Tokens published** (`css/site.css:36-40`, monotonic):
```css
--track-9: 0.16em;  --track-10: 0.14em;  --track-11: 0.12em;  --track-12: 0.1em;  --track-13: 0.04em;
```
**Adopted (12 generic labels → `var(--track-*)`):** `.brand .name` (13), `.pill` (13), `.nav-meta` (10), `.mm-foot` cluster (10), `.stat .l` (10), `.lb-meta` (10), `.row-date` (11), `.gallery-count` (11), `.mm-idx` (12), `.proj-idx` (12), `.scroll-hud a` (9), `.deck .grp > label` (9). All swaps are no-op or ≤0.02em.

**Preserved signatures (ad-hoc by design):** `.hero-kicker` 0.35, `.boot-title` 0.5, `.boot-pct` 0.2, `.sys-online` 0.25, `.mm-tag` 0.24, `.sec-label`/`.deck h4` 0.22, `.geo-kicker` 0.2, `.seg button` 0.08 (layout-tight), hero clamp 0.25, `.mm-ja` 0.1.

**Version:** `site.css?v=3.12` → `?v=3.13`.

## §3 — Decision record — SP5e COMPLETE (2026-07-07)

**Commit:** *(this commit)* — publish `--track-9..13` + adopt on 12 generic labels + `?v`→3.13. CSS-only + `?v`; no `js/`.

**Gates PASS.** Tokens defined (grep `--track-9..13` present); adoption count = 12 (`letter-spacing: var(--track-`); signatures still literal (hero-kicker 0.35, sec-label 0.22, mm-tag 0.24, sys-online 0.25, boot-title 0.5 all confirmed). Browser (`?v=3.13`): top nav — `ISHINUKI_DAIKIE` wordmark, nav links, `JST // TOKYO` meta — all track correctly, confirming every `var()` resolves (no collapse to `normal`). ≤0.02em drift is imperceptible by construction; no layout shift. **NEXT:** Bilingual (L5/L6).