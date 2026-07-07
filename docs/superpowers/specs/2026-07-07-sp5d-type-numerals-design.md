# SP5d — Type: numerals & readouts (Design)

**Date:** 2026-07-07 · **Branch:** `v3-build` · **Program:** SP5 (cross-site v3 grading / motion), slice d (Type)
**Source brief:** `docs/superpowers/specs/2026-07-03-type-elevation-brief.md` · **Rules:** `design-language-v3` §5 (Typography & Bilingual) + §0 Spine. Follows [[SP5a color]], [[SP5b HUD discipline]], [[SP5c motion]].

---

## §0 — Context & scope

Fourth SP5 slice. The Type brief is 7 levers; this slice takes the **numerals & readouts** cluster — the highest-payoff, lowest-risk half, and the natural finish to SP5c's readout boot-up:

- **L1 / HUD-P6 — disambiguated (slashed) zero** on the one tabular declaration.
- **L2 — resolve the single register crossing:** `.stat .n` (the big About numeral) moves from the Hanken reading voice to the JetBrains Mono instrument voice.
- **L4 / HUD-P3 — unify the readout recipe:** the two hand-rolled label→value inversions (`.stat`, `.geo`) share one mono + tabular + slashed-zero value recipe.
- **L7 — close tabular coverage:** add the live count-up `.boot-pct` to the tabular+slashed-zero list.

**Slice shape = CSS-only + a `?v` bump** — the same proven shape as SP5a/b/c. **No markup changes, no `js/`.** (The `.stat`/`.geo` inversions already have distinct label/value elements, so unifying their recipe is pure CSS — no new class, no DOM edit.)

**Deferred (recorded, not lost):** L3 size→tracking scale (its own tiny mechanical slice, touches ~14 chrome selectors); L5/L6 Japanese-as-content hero + vertical index tag (a Bilingual slice — needs a new JP display face + font-load decision); a first-class `.readout` *class* + label+value+**unit** triad (P3's unit slot — deferred until a real new readout justifies the markup, YAGNI); the **Rajdhani** canvas-HUD face coherence (`js/background.js:1140` draws the canvas HUD in Rajdhani — a 4th instrument face, but on the canvas layer, not CSS; a later pass, not this one).

## §1 — Current state (audited 2026-07-07, post-SP5c)

- **Font tokens** (`css/site.css:28-30`): `--font-display: 'Hanken Grotesk'` (reading voice), `--font-mono: 'JetBrains Mono'` (chrome/instrument voice), `--font-jp: 'M PLUS Rounded 1c'` (bilingual accent).
- **Font load** (`index.html:12`, Google Fonts CSS2): `Hanken Grotesk:wght@200;400`, `JetBrains Mono:wght@400;500`, `M PLUS Rounded 1c:wght@400;500`, `Rajdhani:wght@500;600`. **JetBrains Mono loaded weights = 400, 500 only** (no 200/300). Rajdhani is loaded for the **canvas** HUD (`js/background.js:1140`), asserted by `tools/verify-site-hardening.js:148-152` — **not** a stray load; leave it.
- **The one tabular declaration** (`css/site.css:693-695`) — the *only* `font-variant-numeric` in the file:
  ```css
  /* numeric readouts hold width (clock, counters, positions, dates) */
  .clock, .stat .n, .lb-pos, .gallery-count, .proj-year, .row-date,
  .coord, .mm-coord { font-variant-numeric: tabular-nums; }
  ```
  **No `slashed-zero`, no `font-feature-settings`, no explicit `zero`/`tnum` anywhere** (grep-confirmed).
- **The register crossing** (`css/site.css:497-499`): `.stat { font-family: var(--font-mono); }` but `.stat .n { font-family: var(--font-display); font-weight: 200; font-size: clamp(34px, 4vw, 56px); color: var(--cyan); line-height: 1; text-shadow: 0 0 24px rgba(57,240,255,0.3); }`. **`.stat .n` is the single member of the tabular list not already mono** — hence the single place `tabular-nums` does real work and the single place a slashed zero would depend on the (unverified, possibly-absent) Hanken `zero` feature. Its label is `.stat .l` (`:500`, 10px / 0.16em tracked-caps muted).
- **The second inversion** (`css/site.css:474-482`): `.geo-kicker` (10px / 0.2em tracked-caps `--muted` label) over `.geo-line` (`clamp(18px,2vw,28px)` cyan mono value, uppercase, bloom). **`.geo-line` is NOT in the tabular list** — the recipe is not yet unified.
- **The live count-up** (`css/site.css:218`): `.boot-pct` (the boot bar's `000→100` %), inherits `--font-mono` from `.boot` (`:186`), **not** in the tabular list.
- **Ordinals** `.mm-idx` (`:318`), `.proj-idx` (`:533`): mono, `--muted` (demoted in SP5b), column-aligned list ordinals — decorative, not data readouts.

## §2 — Target intent (type brief §"Target intent" + north-star)

Numeric readouts read as **instrument output, not typeset text**: fixed-width digits that never reflow, and a disambiguated `0` that can never be misread as `O`, on every coord / stat / clock / live value. The two type registers stay strictly apart — mono tracked-caps for chrome/instrument, sentence-case Hanken for reading — with the one numeral crossing (`.stat .n`) resolved into the instrument voice. Label→value inversion is a consistent recipe: tiny tracked-caps label, value larger/brighter, the number always out-weighing its label. (ref: type/003, type/001, type/002)

## §3 — Decisions (owner-approved, 2026-07-07)

1. **L2 `.stat .n` → JetBrains Mono** (owner pick, 2026-07-07). The site's one live-*counting* readout (the About stat, which SP5c just booted from `88+`) reads as machine output; this unifies the instrument voice, resolves the register crossing, and — decisively — **guarantees the unambiguous zero from the code face** instead of betting on an unverified Hanken feature. What we give up (the thin oversized Hanken numeral) is the "typeset text" aesthetic §0/north-star deliberately moves away from. **Weight:** since JetBrains Mono 200 isn't loaded, set an explicit **400** (200 would silently render 400 anyway). *Reversible one-liner; final weight/size confirmed live (SP5c-style tune). If 400 at 34–56px reads too heavy, adding a lighter JetBrains Mono cut is a one-line font-load follow-up — flagged, not done here.*
2. **L1/P6 slashed-zero on the tabular declaration, not per-selector `font-feature-settings`.** `font-variant-numeric: tabular-nums slashed-zero` is the clean modern idiom and covers every listed readout at once. Because all listed numerals are now mono, the feature is face-guaranteed. *Fallback (recorded): if the browser doesn't visibly render the slashed zero on JetBrains Mono, escalate that selector to an explicit `font-feature-settings: "tnum" 1, "zero" 1`. Verified live (gate D).*
3. **L4 = recipe unification via grouped CSS, not a `.readout` class.** The two inversions (`.stat`, `.geo`) already have label/value elements and already invert (value ≫ label in size/luminance). "Extract the pattern" here = **add `.geo-line` to the shared tabular+slashed-zero value recipe** so both readout values match. A first-class `.readout` class + P3 unit triad is YAGNI until a *new* readout exists — deferred. *(This is the one place the build chooses lazy over literal; owner-approved.)*
4. **L7 = add `.boot-pct` only.** It is a genuine live count-up readout (mono via `.boot`). **Ordinals `.mm-idx`/`.proj-idx` are deliberately excluded** — they are decorative section/list ordinals, not data readouts (a slashed `0` in "03" over-instruments them); leave as texture per the brief's "micro-text stays texture."

## §4 — Concrete change set

**Edit 1 — L2: `.stat .n` → mono (`css/site.css:498`).** Drop the `--font-display` override (it then inherits `--font-mono` from `.stat` `:497`) and change weight `200`→`400`. Line `:499` (color / line-height / text-shadow) unchanged.
```css
/* before */
.stat .n { font-family: var(--font-display); font-weight: 200; font-size: clamp(34px, 4vw, 56px);
/* after  */
.stat .n { font-weight: 400; font-size: clamp(34px, 4vw, 56px);
```

**Edit 2 — L1/P6 + L4 + L7: the tabular declaration (`css/site.css:693-695`).** Add `.geo-line` (L4) and `.boot-pct` (L7) to the selector list; change `tabular-nums` → `tabular-nums slashed-zero` (L1/P6); update the comment.
```css
/* before */
/* numeric readouts hold width (clock, counters, positions, dates) */
.clock, .stat .n, .lb-pos, .gallery-count, .proj-year, .row-date,
.coord, .mm-coord { font-variant-numeric: tabular-nums; }
/* after */
/* numeric readouts: hold width + disambiguated (slashed) zero — instrument figures */
.clock, .stat .n, .geo-line, .lb-pos, .gallery-count, .proj-year, .row-date,
.coord, .mm-coord, .boot-pct { font-variant-numeric: tabular-nums slashed-zero; }
```

**Edit 3 — cache-bust (`index.html:13`).** `css/site.css?v=3.11` → `?v=3.12`. (No JS touched → `V.fx`/`boot.mjs` unchanged.)

## §5 — Register & accent continuity

The split stays clean: after this slice **no numeral is set in the reading voice** — coords, stats, clocks, positions, dates, the boot % and the geo line all live in the mono instrument voice with tabular + slashed-zero; Hanken keeps only reading/narrative copy. No color, HUD-accent, or motion behaviour changes (the count-up timing is `js/effects.js`' `runCounter`, untouched). This is a type-register grade, continuous with the SP5a color floor and SP5b one-ink discipline.

## §6 — Acceptance criteria & verify

No CSS test runner (SP1–SP5c method) → **grep-gates + browser eyeball + diff-scope.**

- **A · slashed-zero present.** The tabular declaration reads `font-variant-numeric: tabular-nums slashed-zero;` and its selector list contains `.geo-line` and `.boot-pct`. `grep`-confirm it is still the only `font-variant-numeric` in the file.
- **B · crossing resolved.** `.stat .n` (`:498`) no longer sets `font-family: var(--font-display)`; it sets `font-weight: 400`. `grep`-confirm no `--font-display` remains in the `.stat .n` block.
- **C · coverage.** `.boot-pct` and `.geo-line` appear in the tabular list; `.mm-idx`/`.proj-idx` do **not** (deliberate).
- **D · eyeball (browser, `?v=3.12`).** About stats render as **mono numerals** with a **clearly slashed/dotted `0`** (compare `0` vs `O`); the stat **counts up without column-width wobble**; the boot % and geo line hold width; reading copy (bios, leads) stays Hanken sentence-case; globe/scene unchanged. *If the slashed zero does not render on JetBrains Mono → apply the §3.2 `font-feature-settings` fallback.* *If mono weight 400 reads too heavy at 34–56px → tune size or add a lighter cut (§3.1).*
- **E · scope.** `git diff --name-only` = `css/site.css` + `index.html` only; **index.html change = the `?v` bump only** (no markup); **no `js/`**.
- **F · cache-bust.** `site.css?v=3.12`.

## §7 — Out of scope / risks

**Out of scope:** L3 tracking-scale; L5/L6 Japanese-as-content + vertical index; a `.readout` class + P3 unit triad; the Rajdhani canvas-HUD face; `js/*` (count-up timing, cursor); color/HUD-accent values; the ordinals `.mm-idx`/`.proj-idx`.

**Risks:**
- **`slashed-zero` face support.** The property is correct and currently absent (real gap). JetBrains Mono is a code face and should expose `zero`; but whether the *shipped* Google-served build renders a visibly slashed/dotted zero is a live check, not an assumption — verify in gate D, fallback in §3.2. This is the one build-time unknown.
- **Mono stat weight.** 400 at `clamp(34px,4vw,56px)` will read heavier/wider than the old Hanken 200. Tune size, or add a lighter JetBrains Mono cut, live (reversible). Do not let the number read as a heavy terminal slug if the About section wants delicacy.
- **`tabular-nums` on `.geo-line`.** If `.geo-line` is pure text (no digits), `tabular-nums` is a harmless no-op and `slashed-zero` never triggers — no regression; the unification is still correct intent.
- **Reduced-motion / a11y.** Static-text change only; `runCounter` already honors `reduced`; `.sr-only` counter value (`100+`) untouched. Nothing new animates.

## §8 — Decision record — SP5d (to be completed at build)

*(Fill on completion: feature commits, gates A–F results, eyeball notes, whether the slashed-zero fallback or a mono-weight tune was applied, and the NEXT pointer.)*
