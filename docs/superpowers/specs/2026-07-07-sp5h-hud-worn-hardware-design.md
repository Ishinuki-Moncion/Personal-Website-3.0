# SP5h — HUD: worn-hardware deck (P8) (Design + record)

**Date:** 2026-07-07 · **Branch:** `v3-build` · **Program:** SP5, slice h (HUD-3) · Follows [[SP5g hud graticule]].
**Source:** `hud-elevation-brief.md` P8 · **Rules:** `design-language-v3` §3 + §0 ("worn projected glass").

## §1 — Decision (owner-delegated autonomous run)

P8 is the brief's "substantial rework," done **restrained**. Audit finding: the **lightbox stage already wears its combiner frame** via `.lb-corner` (four 30px L-brackets, markup + `css/site.css`), so P8's lightbox half is already met. The work concentrates on the **control deck** (`.deck`), which currently reads as a flat card (plain 1px full border).

**Recommended action taken:** give the deck the worn-hardware read with the lowest-risk, CSS-only moves (pseudo-elements, no markup) — demote the flat full border to a faint bezel, add crisp **L-corner brackets** (two opposite corners, echoing `.lb-corner`), and extend the `◆ CONTROL DECK` header into a **model-rail**. Skipped literal "screws" (kitsch risk) — the bezel + brackets + rail already deliver "instrument, not card." Chrome stays crisp; the content layer is untouched (per P7 guard-rail).

## §2 — Change set (CSS-only + `?v`)

After `.deck h4::before` (`css/site.css`):
```css
.deck { border-color: var(--line); }                 /* demote full border → faint bezel */
.deck::before, .deck::after {                         /* crisp L-corner brackets */
  content: ''; position: absolute; width: 13px; height: 13px;
  border: 0 solid var(--line-strong); pointer-events: none;
}
.deck::before { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
.deck::after  { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }
.deck h4::after { content: ''; flex: 1; height: 1px;  /* header model-rail */
  background: linear-gradient(90deg, var(--line-strong), transparent); }
```
**Version:** `site.css?v=3.15` → `?v=3.16`.

## §3 — Decision record — SP5h COMPLETE (2026-07-07)

**Commit:** *(this commit)* — deck worn-hardware read (bezel demote + L-corners + header rail) + `?v`→3.16. CSS-only + `?v`; **no `js/`**, no markup.

**Gates PASS.** Browser (`localhost:8080`, `?v=3.16`, deck opened): the header now carries a **fading model-rail** extending right from "◆ CONTROL DECK"; **L-corner brackets** sit at the top-left and bottom-right; the full border is demoted to a faint bezel — together the panel reads as **bracketed instrument hardware**, no longer a uniform flat card, and echoes the lightbox `.lb-corner` frame. Segmented controls (DECRYPT/RISE/GLITCH, EN/日本語) and their SP5b outline-active states unchanged; darks preserved. **NEXT:** Composition (negative-space layout grade).