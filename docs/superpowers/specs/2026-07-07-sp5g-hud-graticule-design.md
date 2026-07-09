# SP5g — HUD: graticule substrate (P5) (Design + record)

**Date:** 2026-07-07 · **Branch:** `v3-build` · **Program:** SP5, slice g (HUD-2) · Follows [[SP5f bilingual]], continues [[SP5b HUD discipline]].
**Source:** `hud-elevation-brief.md` P5 · **Rules:** `design-language-v3` §3 + §0.

## §1 — Decision (owner-delegated autonomous run)

P5 is the brief's "highest-risk add" only because a naive full-viewport `::before` overlay needs z-index juggling against the WebGL scene and every data layer. **Lower-risk realization taken:** the brief specifies P5 as *localized* substrates behind data-dense regions (`.stat-row`, `.gallery-grid`, `.lb-stage`), reusing the `.boot-grid` gradient recipe. Painting it as the container's own **`background-image`** (not a pseudo-element) puts it behind all content by definition — **zero z-index risk**, no interaction with the scene's own grid floor. Dimmed to `0.04α` (well below `--line` = `0.16` and below the data), near-black-preserving.

**P6 (slashed numerals) already shipped in [[SP5d type numerals]]** (`tabular-nums slashed-zero`) — not repeated here.

## §2 — Change set (CSS-only + `?v`)

New rule after `.stat-row` (`css/site.css`):
```css
.stat-row, .gallery-grid, .lb-stage {
  background-image:
    linear-gradient(rgba(57, 240, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(57, 240, 255, 0.04) 1px, transparent 1px);
  background-size: 34px 34px;
}
```
**Version:** `site.css?v=3.14` → `?v=3.15`.

## §3 — Decision record — SP5g COMPLETE (2026-07-07)

**Commit:** *(this commit)* — persistent graticule substrate on the 3 data regions + `?v`→3.15. CSS-only + `?v`; **no `js/`**, no markup.

**Gates PASS.** Browser (`localhost:8080`, `?v=3.15`, Gallery section): zooming a tile gap shows the **faint horizontal graticule lines rendering** against the dark — present but barely-there, the "oscilloscope graticule the whole HUD grammar descends from." Darks preserved (0.04α does not lift the near-black floor); it sits **behind** the tiles/stats as a background (no z-index interaction, no scene conflict). Visible where the container background shows (gaps, stat-row margins, lightbox stage) and hidden under opaque media — exactly "well below the data." **NEXT:** HUD P8 (worn-hardware deck/lightbox).