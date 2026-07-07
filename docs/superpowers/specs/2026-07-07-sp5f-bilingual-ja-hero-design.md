# SP5f — Bilingual: JP-as-content hero (L5) (Design + record)

**Date:** 2026-07-07 · **Branch:** `v3-build` · **Program:** SP5, slice f (Type-3 / Bilingual) · Follows [[SP5e type tracking]].
**Source:** `type-elevation-brief.md` levers 5+6 · **Rules:** `design-language-v3` §5.

## §1 — Decisions (owner-delegated autonomous run)

- **L5 built. L6 (vertical kanji index) deferred.** A vertical `縦書き` section number would duplicate the existing `[ 0X ]` section indices already in every `.sec-label` — ornamental duplication, exactly the "one signal at a time / don't over-Japanese" the brief warns against. Same judgment as the deferred `.readout` class. Recorded, not lost.
- **Face = Zen Kaku Gothic New** (angular architectural signage; heavy weights). Chosen over a mincho for **coherence with the instrument voice** while still being maximally distinct from the rounded `--font-jp` (M PLUS Rounded 1c) accent, which the brief calls "wrong for a hero." Tunable to a dramatic mincho (e.g. Shippori Mincho) if the owner wants more filmic contrast.
- **Zero JS, zero new content.** The toggle already sets `html[lang="ja"]` and per-element `.is-jp` (`js/app.js:120,129`), and every headline already carries authored `data-ja`. L5 is pure CSS reacting to that state, over existing authentic JP — no invented owner prose.
- **Doubles as a bug-fix:** JP text in the Hanken-family headlines was rendering in an ugly system fallback; L5 lifts it onto a real JP display face.

## §2 — Change set

- **Font load** (`index.html:12`): `+ &family=Zen+Kaku+Gothic+New:wght@500;700`.
- **Token** (`css/site.css:31`): `--font-ja-hero: 'Zen Kaku Gothic New', var(--font-jp);`.
- **L5 rules** (after `.contact h2 em`): in `html[lang="ja"]`, `.about-lead` → `--font-ja-hero` w500 / `letter-spacing:0.01em` / `line-height:1.28`; `.contact h2` → w700 / `0.02em` / `1.15`; `.hero-kicker span` → `letter-spacing:0.14em` (JP glyphs don't want the 0.35em Latin caps tracking). JP metrics (positive tracking, looser leading) replace the tight Latin recipe.
- **Version:** `site.css?v=3.13` → `?v=3.14`.

## §3 — Decision record — SP5f COMPLETE (2026-07-07)

**Commit:** *(this commit)* — Zen Kaku Gothic New face + `--font-ja-hero` + `html[lang="ja"]` headline rules + `?v`→3.14. CSS + font-load + `?v`; **no `js/`**.

**Gates PASS.** Browser (`localhost:8080`, `?v=3.14`, toggled to 日本): the About lead **「東京を拠点とする開発者・写真家。」renders in Zen Kaku Gothic New** (weight 500) — clean architectural JP that **owns the frame**, clearly a real display face (not the old system fallback), distinct from the rounded accent; nav swaps to 作品/写真/制作/連絡, toggle reads 日本/EN. `.contact h2` (「一緒に作りましょう。」) shares the identical mechanism at w700. **EN mode unaffected** — the rules are scoped to `html[lang="ja"]`, so `lang="en"` cannot match (CSS-guaranteed). **NEXT:** HUD P5 (graticule).