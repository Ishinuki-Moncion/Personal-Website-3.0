# Composition — Elevation Brief (2026-07-03)

Source rules: design-language-v3 §7 (Composition & Layout) + §0 (The Spine). Study: `2026-07-03-composition-visual-study.md`. Code grounded in `index.html` + `css/site.css` (read at this date; line anchors below).

> This is the *what/why*, not the build. Every lever cites a real `index.html`/`css/site.css` line; proposed structure that does not yet exist is marked **(new)**. The headline finding: the site's **grid skeleton and measure caps already match v3** — the deltas are about *rhythm* (one focal element per viewport), *luminance arbitration* (one first-read, not many bloomed peers), and *cellular framing* (named thin-rule cells, a Swiss third zone, and letterbox media), not about re-gridding.

---

## Current state

**Container / monument.** One shell wraps every section: `.shell { width: min(1440px,100%); margin: 0 auto; padding-inline: clamp(20px,4vw,40px); }` (`css/site.css:363`, `--shell` at `css/site.css:32`), sitting on `main { position: relative; z-index: 1; }` (`css/site.css:361`). The globe/scene lives behind everything as a full-viewport fixed layer: `#scene-root { position: fixed; inset: 0; z-index: 0; }` (`css/site.css:80`), authored in `index.html:31`. So dead-center is already structurally owned by the globe monument, and content floats above it.

**Section grids (the Swiss skeleton).** Four asymmetric grids, all matching the study's measured ratios:
- `.about-grid { grid-template-columns: 1.1fr 0.9fr; align-items: start; }` (`css/site.css:466`) — study cites ~1.1fr/0.9fr.
- `.work-grid { grid-template-columns: 7fr 5fr; align-items: baseline; }` (`css/site.css:519`) — study cites 7fr/5fr.
- `.proj-grid { grid-template-columns: auto 7fr 4fr; }` (`css/site.css:520`).
- `.gallery-grid { grid-template-columns: repeat(3, 1fr); }` (`css/site.css:560`, responsive fallbacks `:561`/`:562`) — study cites 3-col gallery-grid.

**Measure caps (letterbox-of-text).** Every text column is capped: hero-sub `max-width: 46ch` (`css/site.css:429`), geo-copy `68ch` (`css/site.css:484`), row-desc `42ch` (`css/site.css:532`), about-lead `17ch` (`css/site.css:464`), proj-tech `24ch` (`css/site.css:537`), contact-lead `13ch` (`css/site.css:613`), geo-trail `max-width: 780px` (`css/site.css:472`). Study cites hero-sub 46ch / geo-copy 68ch / row-desc 42ch verbatim.

**Chrome framing (already peripheral).** Viewport corner brackets `.frame-hud .tl/.tr/.bl/.br` pinned to the four corners at 18px (`css/site.css:128–139`, markup `index.html:37`); the section index/progress rail `.scroll-hud { position: fixed; top: 50%; right: 18px; }` (`css/site.css:339`); the corner-anchored `.hero-foot { position: absolute; bottom…; left…; }` (`css/site.css:435`); the top `.nav` (`index.html:47`, `css/site.css:232`); the bottom-right `.scene-debug` (`css/site.css:84`). Center stays reserved for subject.

**Negative space (already generous).** Section vertical rhythm: `.about { padding-block: clamp(96px,16vw,200px); }` (`css/site.css:462`), `.work,.projects { padding-block: clamp(72px,11vw,150px); }` (`css/site.css:509`), `.gallery` same (`css/site.css:556`), `.contact { padding-block: clamp(100px,16vw,220px); }` (`css/site.css:611`). Hero is a full-height void: `.hero { height: 100svh; min-height: 620px; …justify-content: center; }` (`css/site.css:404`), left-aligned (no `align-items: center`) — asymmetric by default.

**Oversized display type.** `.heading-xl` clamps 44→120px (`css/site.css:507`), `.contact-lead` 44→150px (`css/site.css:613`), hero `h1` (`css/site.css:410`), `.about-lead` 30→72px (`css/site.css:463`) — type already carries focal weight.

**Thin rules + bloom (the seed of cellular framing).** Section dividers exist as separators: `.row { border-top: 1px solid var(--line); }` (`css/site.css:511`), `.geo-trail` top+bottom rules (`css/site.css:473`), `.sec-label .rule` flex hairline (`css/site.css:369`), portrait corner-brackets `.about-portrait .pcorner` (`css/site.css:492`), lightbox `.lb-corner` (`css/site.css:590`). Luminance is spent broadly: persistent blooms on `.geo-line` (`css/site.css:482`), `.stat .n` (`css/site.css:500`), `.about-lead` (`css/site.css:465`), plus hover blooms on `.row-title` (`css/site.css:530`) and `.shot` (`css/site.css:565`).

---

## Target intent

Each bullet is the v3 feel; deltas are where the current code falls short of it.

- **Negative-space-first — one focal element per viewport in a dark void** (ref: composition/005). Default every viewport to void with a single subject; never a filled canvas. *Aligns:* section `padding-block` (`css/site.css:462`,`:509`,`:556`,`:611`) and the full-height hero void (`css/site.css:404`) already breathe. *Delta:* the About viewport stacks four peers at once — `.about-lead` + the 2-col `.about-grid` (bio + portrait) + `.geo-trail` + `.stat-row` (`css/site.css:462–497`) — so no single element dominates a viewport; the eye has no one place to land.

- **Focal hierarchy is driven by luminance — the brightest region wins the eye first** (ref: composition/005). On a near-black base, make the intended first-read the single highest-luminance mark and hold the rest dim. *Delta:* multiple elements glow at rest simultaneously — `.geo-line` bloom (`css/site.css:482`), `.stat .n` bloom (`css/site.css:500`), `.about-lead` glow (`css/site.css:465`) — competing bright peers flatten the hierarchy the rule depends on.

- **Push chrome/labels to the margins; reserve the centre for the subject** (ref: composition/012). *Aligns strongly:* `.frame-hud` corners (`css/site.css:128`), `.scroll-hud` right rail (`css/site.css:339`), `.hero-foot` corner block (`css/site.css:435`), top `.nav` — chrome is already peripheral and center is clear for the globe. This rule is essentially satisfied; hold it as a constraint, do not overlay new labels on center content.

- **Deliberate symmetry — asymmetric default, dead-center reserved for the globe/hero monument** (ref: composition/010). *Aligns:* content grids are all asymmetric (`css/site.css:466`,`:519`,`:520`) and the hero text is off-center-left (`css/site.css:404`, no `align-items: center`), while the one dead-center element is the globe `#scene-root` (`css/site.css:80`). Keep the globe as the sole Kubrick-symmetric monument; keep every foreground grid asymmetric so nothing else competes for the centre axis.

- **Density is legitimate only when gridded** (ref: composition/007). *Aligns:* the `.gallery-grid` 3-col field (`css/site.css:560`) and the row grids (`css/site.css:519`,`:520`) seat their density on an aligned grid ringed by section padding. *Minor delta:* `.stat-row` is a free `display: flex` (`css/site.css:497`), the one dense cluster not seated on the section grid.

- **Thin-rule named cells + Swiss 3-zone single-accent grid** (ref: composition/017, composition/018). Structure layout as an instrument: hairline rules dividing *named* cells (the web cousin of the HUD corner bracket) over a 3-zone Swiss grid keyed to one accent. *Delta:* today's rules are *separators*, not *named cells* — `.row` is a top-bordered strip (`css/site.css:511`), `.geo-trail` a bordered band (`css/site.css:473`), with no cell label/bracket chassis. And the Swiss grid is only *2-zone* (`.about-grid` 1.1fr/0.9fr, `css/site.css:466`); there is no third right-meta margin column. Accent discipline is close but unbudgeted: amber recurs across `.sec-label .idx` (`css/site.css:367`), `.geo-kicker` (`css/site.css:477`), `.proj-idx` (`css/site.css:533`), `.live-tag` (`css/site.css:523`) — needs to read as a single ~1–6% signal per view, not a scatter.

- **Letterbox / measure discipline** (ref: composition/018). *Aligns:* the text measure caps are already exactly on-spec (`css/site.css:429`,`:484`,`:532`) — the textual form of sparse-subject-in-void; keep them. *Delta:* media is *portrait*, not letterbox — `.shot { aspect-ratio: 4 / 5; }` (`css/site.css:563`) and `.about-portrait { aspect-ratio: 3 / 4; }` (`css/site.css:485`) — so the site never borrows the wide 2.20–2.35:1 horizontal breathing room the study's hero frames get from anamorphic framing.

- **One focal point = one break in an otherwise uniform gridded field** (ref: composition/001). *Delta:* the `.gallery-grid` is perfectly uniform `repeat(3,1fr)` (`css/site.css:560`) with every `.shot` equal (`css/site.css:563`); there is no designated single disruptor to punctuate the field and anchor the eye.

---

## Concrete code levers

Each lever names a real anchor; **(new)** marks structure to be authored.

1. **Luminance arbitration — one first-read per viewport.** lever: gate the resting blooms so exactly one element glows per section and the rest hold dim until focused. Dim/remove the persistent `text-shadow` on `.stat .n` (`css/site.css:500`) and `.about-lead` (`css/site.css:465`), letting `.geo-line`'s bloom (`css/site.css:482`) stay as the About section's single high-luminance mark; convert competing glows to hover/`.seen`-scoped so they light only on focus (mirror the existing `.row:hover .row-title` pattern at `css/site.css:530`). (ref: composition/005 · [VERIFIED])

2. **One focal element per viewport — sequence, don't stack.** lever: give the About block's four peers vertical breathing so each owns its own scroll-viewport rather than co-habiting one. Increase inter-block rhythm around `.geo-trail` (`css/site.css:471`) and `.stat-row` (`css/site.css:497`, currently `margin-top: 36px`), or scroll-reveal them in sequence via the existing `.clip-reveal`/`.seen` machinery (`css/site.css:388`) so only one is lit at a time. (ref: composition/005 · [VERIFIED])

3. **Thin-rule *named* cells (HUD ledger framing).** lever **(new)**: promote separator rules to a bracketed cell chassis — add corner-bracket pseudo-elements + a tiny tracked-mono cell label to `.row` (`css/site.css:511`) and `.geo-trail` (`css/site.css:471`), reusing the corner-bracket idiom already proven at `.frame-hud` (`css/site.css:128`) and `.about-portrait .pcorner` (`css/site.css:492`). Each dense block becomes a *named cell*, not a floating strip. (ref: composition/017 · [EXTRACTED])

4. **Swiss third zone — a right-meta margin column.** lever **(new)**: extend the 2-zone `.about-grid` (`css/site.css:466`) toward a 3-zone rhythm (`content / gutter / meta`) — e.g. a narrow right column carrying coordinates/section-meta in tracked mono, echoing the `.scroll-hud` meta rail (`css/site.css:339`). Keeps structure (not color) doing the work per the single-accent rule. (ref: composition/018 · [EXTRACTED])

5. **Accent budget — one signal per view.** lever: audit amber occurrences so a section shows a single ~1–6% warm signal, not several — the recurring amber at `.sec-label .idx` (`css/site.css:367`), `.geo-kicker` (`css/site.css:477`), `.proj-idx` (`css/site.css:533`), `.live-tag` (`css/site.css:523`) should reduce to one asserted mark per viewport, the rest demoted to cyan/muted. (ref: composition/018 · [EXTRACTED]; §0.3 accent-budget · [DATA])

6. **Letterbox media band.** lever **(new)**: add a wide, short featured-media variant (constrained max-width + generous vertical padding, ~2.2:1) for the hero/gallery lead, overriding the portrait `.shot { aspect-ratio: 4 / 5; }` (`css/site.css:563`) for a single featured tile — borrow the anamorphic horizontal breathing the study frames get. Keep the text measure caps (`css/site.css:429`,`:484`,`:532`) untouched; they already satisfy the measure half of this rule. (ref: composition/018 · [WORKING]; composition/005 · [WORKING])

7. **One break in the gallery field.** lever **(new)**: let a single `.shot` span two columns/rows (`grid-column: span 2`) inside the uniform `.gallery-grid` (`css/site.css:560`) so one image is the focal disruptor and the rest read as repetition/texture. Pairs with lever 6 (the break can be the letterbox tile). (ref: composition/001 · [EXTRACTED])

8. **Seat the one loose dense cluster on the grid.** lever: align `.stat-row` (`css/site.css:497`, currently free `flex`) to the section grid columns so its density is gridded per the rule rather than free-floating. (ref: composition/007 · [EXTRACTED])

9. **Hold the monument.** lever (guard, not change): keep `#scene-root` (`css/site.css:80`) as the sole dead-center symmetric element and keep all foreground grids asymmetric (`css/site.css:466`,`:519`,`:520`); do not center-align any content block that would compete with the globe for the centre axis. (ref: composition/010 · [EXTRACTED])

---

## Before / after

- **Before:** scrolling About, a viewer meets four glowing peers at once (lead, bio, portrait, geo-trail, stats) with three of them bloomed — the eye has no single landing point. **After:** one bright first-read per viewport on a darker bed; the others resolve as you reach them.
- **Before:** thin rules read as generic dividers; the layout feels like stacked cards. **After:** bracketed, labelled cells over a 3-zone Swiss grid read as one instrument panel — the web echo of the HUD.
- **Before:** the gallery is a flat, uniform tile grid of portrait crops. **After:** one wide letterbox break anchors the field, the rest become deliberate repetition — cinematic instead of catalogued.

---

## Out of scope / risks

- **Out of scope:** the HUD chrome grammar itself (corner-bracket/leader/graticule) — owned by the HUD brief; here we only *reuse* its bracket idiom for section cells. Color tokens/accent hues — owned by the Color brief; this brief only *budgets* accent area, it does not re-pick amber. Globe rendering — owned by the Globe brief; here it is treated purely as the fixed centre monument.
- **Risk — over-framing:** adding bracket chassis to every cell (lever 3) can tip from "instrument" into "noise," violating §0.5 restraint; apply cellular framing to the few dense blocks only, not every element.
- **Risk — luminance regression:** dimming resting blooms (lever 1) must not crush legibility on the near-black base; keep the demoted marks at readable value, only remove the *glow*, not the fill.
- **Risk — responsive collapse:** the new third Swiss zone (lever 4) and the gallery break (lever 7) must degrade cleanly at the existing breakpoints (`.about-grid` 1-col at `css/site.css:502`, `.gallery-grid` at `css/site.css:561`/`:562`) or they reintroduce clutter on narrow viewports.
- **Note (no delta):** measure caps and the chrome-to-margins framing are already on-spec; changing them risks regressing an alignment, so they are explicitly *keep* items, not levers.
