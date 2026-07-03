# Type & Bilingual — Elevation Brief (2026-07-03)

Source rules: `design-language-v3` §5 (Typography & Bilingual) + §0 (The Spine). Study: `2026-07-03-type-visual-study.md`.
Hand-off artifact for a later spec→plan→build. This is the *what/why*, not the build — every lever is anchored to real `css/site.css` lines so the implementer starts from truth. `(new)` marks code that does not exist yet.

## Current state

The type system already carries the right instincts; the elevation is to **formalize and close small gaps**, not to rebuild.

- **Three font roles are tokenized** (`css/site.css:28-30`): `--font-display: 'Hanken Grotesk'` (reading voice), `--font-mono: 'JetBrains Mono'` (chrome voice), `--font-jp: 'M PLUS Rounded 1c'` (bilingual accent).
- **Reading voice** = Hanken, sentence-case, weight **200**, negative tracking. Body default `css/site.css:43-47`; every hero/section head is one recipe: `.mm-label` (`321`), `.hero h1` (`410`), `.about-lead` (`463`), `.heading-xl` (`507`), `.row-title` (`528`), `.contact h2` (`612`); sentence-case prose `.hero-sub` (`429`), `.about-bio p` (`469`), `.row-desc`/`.row-sub` (`531-532`).
- **Chrome voice** = JetBrains Mono, `text-transform: uppercase`, wide tracking, 9–13px, applied across ~30 label/tag/coord selectors: `.hero-kicker` (`406`, 10–12px / 0.35em), `.mm-tag` (`302`, 10px / 0.24em), `.sec-label` (`366`, 11px / 0.22em), `.nav-link` (`249`, 11px / 0.18em), `.stat .l` (`501`, 10px / 0.16em), `.scroll-hud a` (`345`, 9px / 0.16em), `.seg button` (`653`, 9px / 0.08em), `.brand .name`/`.pill` (`245`/`616`, 13px / 0.04em), etc.
- **The split is currently clean** — no prose is set in mono, no label in the reading voice — with **one crossing**: `.stat .n` numerals are set in `--font-display` (Hanken), not the mono/instrument voice (`css/site.css:499`).
- **Tabular figures are set**, but via the modern `font-variant-numeric: tabular-nums` (not `font-feature-settings`), on a hand-picked comma-selector list: `.clock, .stat .n, .lb-pos, .gallery-count, .proj-year, .row-date, .coord, .mm-coord` (`css/site.css:698-699`).
- **JP is present in exactly one role** — `.mm-ja` (`css/site.css:323-324`): `--font-jp`, `clamp(13px,3vw,17px)`, muted, `letter-spacing:0.1em`, `margin-left:auto` (pushed to the margin as a hover-lit companion). `--font-jp` appears **nowhere else**. Numeric indices `.mm-idx` (`319`) and `.proj-idx` (`533`) are Latin/Arabic, horizontal, mono-amber.
- **Label+value inversion already exists in two places** — `.stat`: value `.n` (`499`, clamp 34–56px, cyan, weight 200) over label `.l` (`501`, 10px tracked-caps muted); and `.geo-kicker` (`476`, 10px amber label) over `.geo-line` (`480`, clamp 18–28px cyan value). It is not yet a reusable pattern.

**Confirmed gap (grep):** the only `font-variant-numeric`/`font-feature-settings` declaration in the entire file is line `699`. There is **no `slashed-zero`, no `zero`/`ss0x`/`cv0x` feature, no explicit `"tnum"` opt-in** anywhere.

## Target intent

- Keep the **two registers strictly apart** — mono tracked-caps for chrome/labels, sentence-case Hanken for reading/narrative, never crossed; resolve the single numeral crossing so instrument numbers read as machine output. (ref: type/002; ref: type/001)
- Make **numeric readouts unmistakably tabular and unambiguous** — fixed-width digits that never reflow, plus a disambiguated (slashed/dotted) zero and distinct 1/l/I, on every coord, stat, clock and live-ticking value. (ref: type/003)
- Promote **label+value inversion to a first-class pattern** — tiny tracked-caps label, value 2–4× larger and brighter; the number is the hero, carried by size/weight/luminance, not color. (ref: type/001)
- Make **tracking a monotonic function of smallness** — the tiniest 9–10px caps ride widest (~0.2–0.35em), larger caps back toward ~0.1em, one published scale instead of ad-hoc per-selector values. (ref: type/001)
- Give JP **two distinct, deliberate modes**: JP-as-accent (the muted `.mm-ja` margin companion, never louder than its Latin partner) *and* an as-yet-unbuilt JP-as-content mode (compressed, high-contrast, owning the frame, in the one signal hue) — plus a small **vertical index tag** option (a 縦書き section number beside a horizontal EN heading). (ref: type/005; ref: type/006; ref: type/008)
- Keep micro-text as **texture, not content** — faint, monospaced, clearly subordinate density that never has to be parsed. (ref: type/007)

## Concrete code levers

1. **Lever — add a slashed/dotted zero to the tabular declaration (the real gap).** `css/site.css:698-699` sets `font-variant-numeric: tabular-nums` but no zero disambiguation. Change to `font-variant-numeric: tabular-nums slashed-zero;` and `(new)` add an explicit opt-in on the mono root — e.g. `.mono, [class*="coord"] { font-feature-settings: "tnum" 1, "zero" 1; }` — so the instrument face never renders an ambiguous `0`/`O`. Verify the loaded faces expose the features: JetBrains Mono ships a dotted zero by default (mono is already fixed-width, so `tabular-nums` is a near-no-op there), but **Hanken Grotesk numerals have no guaranteed slashed zero** — and Hanken is exactly where tabular actually bites (see lever 2). `(new)` verification: confirm `zero`/`tnum` are present in the self-hosted/subset builds of both faces.

2. **Lever — resolve the one register crossing at `.stat .n`.** `css/site.css:499` sets the big stat numerals in `--font-display` (Hanken, weight 200) — a reading-voice face doing an instrument-voice job. This is the single element in the `698` tabular list whose `tabular-nums` does real work (all the others are already mono, where it is redundant). Decide deliberately: either (a) keep Hanken for the thin oversized-numeral aesthetic but guarantee `tabular-nums slashed-zero` and treat it as a sanctioned exception, or (b) move `.stat .n` to `--font-mono` to match "coords, indices, stats and clocks live in the mono voice." Document the choice; do not leave it implicit. (ref: type/003)

3. **Lever — publish a size→tracking scale and apply it (tracking proportional to smallness).** Today 9px labels alone span 0.08em (`.seg button` `653`) → 0.16em (`.scroll-hud a` `345`) → 0.25em (`.sys-online` `444`) — same size, ~3× tracking spread, non-monotonic. `(new)` add tokens on `:root` near `css/site.css:28` — e.g. `--track-9:0.28em; --track-10:0.22em; --track-11:0.16em; --track-13:0.05em;` — and swap the literal `letter-spacing` values across the chrome selectors (`245, 249, 302, 345, 366, 406, 444, 501, 559, 616, 645, 650, 653, 681`) to reference them, so tracking becomes a pure function of size. The current 0.04–0.35em range is already in-band per the study; this makes it consistent. (ref: type/001)

4. **Lever — extract label+value inversion into one reusable pair.** `.stat` (`css/site.css:499-501`) and `.geo-*` (`476-483`) each hand-roll the same "small tracked-caps label over big bright value" shape. `(new)` factor a `.readout` / `.readout .lbl` + `.readout .val` pattern (label: mono, tracked-caps, `--muted`, 9–10px; value: 2–4× larger, brighter, `tabular-nums slashed-zero`) and reuse it wherever a coord/stat/clock currently sets label and value at the *same* small size (e.g. the `.mm-foot` clock/coord cluster `328-332`, `.lb-meta` `591`). The number should always out-weigh its label. (ref: type/001)

5. **Lever — add a JP-as-content mode distinct from `.mm-ja`.** `--font-jp` (M PLUS Rounded 1c) is used **only** by the muted-accent `.mm-ja` (`css/site.css:323-324`); a rounded gothic is right for a quiet companion but wrong for a hero. `(new)` add a `.ja-hero` class (compressed/high-contrast, `line-height:1` tight, `letter-spacing:0` or negative, large, in the one signal hue per §0) for the rare moment JP should own the frame — and `(new)` pair it with a **different, angular/compressed or mincho display face** (M PLUS Rounded stays the accent face). Keep `.mm-ja` muted and never louder than its Latin partner. (ref: type/006; ref: type/005)

6. **Lever — offer a vertical JP index tag beside horizontal EN headings.** The numeric indices `.mm-idx` (`css/site.css:319`) and `.proj-idx` (`533`) are horizontal Latin. `(new)` add a `.idx-ja` variant using `writing-mode: vertical-rl` with a kana/kanji section number (e.g. `第03話` / `〇三`), set small and muted in the mono-amber index slot, as an accent beside the EN heading — the study's episode-tag pattern. One restrained motif, not a pile of ornament. (ref: type/008)

7. **Lever — audit tabular coverage for live/columnar numerics not yet in the list.** `.boot-pct` (`css/site.css:219`, a count-up %) and the amber indices `.mm-idx`/`.proj-idx` (`319`/`533`) are not in the `698` selector list. Add any live-ticking or column-aligned numeral to the tabular+slashed-zero declaration; leave purely decorative micro-text as faint mono texture (`.tag` `540`, edge codes) untouched — texture, never content. (ref: type/003; ref: type/007)

## Before / after

- **Numbers stop wobbling and stop lying.** Coords, clocks and stat counters hold column width as digits tick, and a `0` can never be misread as `O` — the readouts feel like instrument output, not typeset text.
- **The two voices visibly separate.** Chrome reads as a consistently-tracked mono grid (tightest just where it should be), reading copy stays a calm sentence-case Hanken — a viewer feels "control layer vs. content layer" without being told.
- **Japanese gains range.** Today JP only whispers in the margin; after, it can also *shout* once (a compressed hero or a vertical index tag) in the signal hue — authenticity and drama on demand, still disciplined.

## Out of scope / risks

- **No new type in the build phase without a font-loading check.** A `.ja-hero` display face and any `zero`/`tnum` reliance mean new/verified webfont subsets; confirm the features survive subsetting before shipping (this brief flags it; the build phase owns it). `[WORKING]` on exact face choice — no measured spec.
- **`slashed-zero` face support is unverified.** The property is correct and currently absent (real gap), but whether the *shipped* Hanken/JetBrains builds expose `zero` is a build-phase verification, not an assumption to encode blindly.
- **Tracking-token swap is mechanical but wide** — it touches ~14 selectors; risk is cosmetic drift, so land it behind a visual diff, not blind.
- **Don't over-Japanese.** JP-as-content and the vertical tag are *rare* accents; per type/005/type/008 and §0 restraint, one signal at a time — resist sprinkling kana as decoration.
- **Numeral face decision (lever 2) is a taste call**, not a bug — record the rationale either way so it isn't silently re-crossed later.
- **Out of scope:** JS scramble/decrypt timing and count-up motion (owned by the motion brief); color token values (color brief); this brief governs faces, tracking, figures, and the bilingual register only.
