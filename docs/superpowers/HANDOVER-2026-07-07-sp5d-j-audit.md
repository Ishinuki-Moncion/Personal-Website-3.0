# HANDOVER — SP5d→SP5j audit dossier (2026-07-07)

**For:** an independent auditor (Fable 5). **Author:** Claude Opus 4.8, autonomous run.
**Branch:** `v3-build` @ `e0bac9f` (pushed to `origin/v3-build`, working tree clean).
**Scope of this handover:** the final seven slices of the SP5 program (the cross-site v3 grading/motion pass). SP1–SP5c are prior work (see `memory/v3-build-plan.md`); they are **not** the subject of this audit.

---

## 0. TL;DR for the auditor

In one run I built the last 7 SP5 slices — the remaining three elevation-brief surfaces (**Type, Bilingual, Composition**) plus the deferred **HUD** and **Motion** beats. All CSS/HTML except the last slice, which is the program's **first JS change**. Everything is committed, pushed, and was verified live in-browser; `tools/verify-site-hardening.js` passes 20/20 and the console is error-free.

**Your job:** confirm (a) correctness / no regressions, (b) fidelity to the elevation briefs + north-star, (c) that the **deferral decisions** below were the right calls, and (d) taste. This doc + each slice's spec `§Decision record` should let you audit without re-deriving anything.

---

## 1. Commit ledger (audit these, oldest→newest)

```
e0f1f87  design(sp5d)  Type numerals — spec
a183608  plan(sp5d)    Type numerals — 2-task plan
c632c7e  feat(sp5d)    .stat .n Hanken→JetBrains Mono w400 + tabular decl slashed-zero (+.geo-line/.boot-pct)
aebd506  feat(sp5d)    ?v 3.11→3.12 + acceptance record — SP5d COMPLETE
61ee498  feat(sp5e)    L3 tracking scale — --track-9..13 + adopt on 12 labels
7760bc1  feat(sp5f)    Bilingual L5 — JP-as-content hero (Zen Kaku Gothic) on html[lang=ja]
1991be0  feat(sp5g)    HUD P5 — graticule substrate (0.04α, background not overlay)
64f48d3  feat(sp5h)    HUD P8 — deck worn-hardware (bezel + L-corners + header rail)
1b61300  feat(sp5i)    Composition — L1 luminance + L6/7 cinematic gallery break
e0bac9f  feat(sp5j)    Motion-2 L3 — boxed state-word on section lock (JS)
```
`git diff 64ac5ca e0bac9f` = the entire audit surface. Per-file: `css/site.css` (all slices), `index.html` (`?v` bumps + markup for state-flash / gallery feature-class / font-load / `boot.mjs?v`), `js/effects.js` + `js/boot.mjs` (SP5j only), and 7 specs + 1 plan under `docs/superpowers/specs/`.

**Version end-state:** `css/site.css?v=3.18`, `js/boot.mjs?v=2`, `boot.mjs` `V.fx=3.4`.

---

## 2. Per-slice audit dossier

Each slice has a full spec with a `§Decision record` at `docs/superpowers/specs/2026-07-07-sp5{d..j}-*.md`. Summary + what to scrutinize:

### SP5d — Type: numerals & readouts  (`c632c7e`,`aebd506`)
- **Did:** `.stat .n` (big About stat) Hanken→**JetBrains Mono** w400 (dropped `--font-display` override → inherits mono from `.stat`); the file's one tabular declaration → `tabular-nums slashed-zero`, adding `.geo-line` + `.boot-pct` to its selector list.
- **Audit:** confirm the slashed/dotted `0` actually renders (I verified it does on the Google-served JetBrains Mono, so the documented `font-feature-settings` fallback was NOT applied — check you agree it renders). Confirm ordinals `.mm-idx`/`.proj-idx` are *excluded* (intentional — a slashed 0 in "03" over-instruments). Taste: is mono-400 the right weight for the stat, or too heavy vs the old thin Hanken? (tunable).

### SP5e — Type: size→tracking scale (L3)  (`61ee498`)
- **Did:** published `--track-9:0.16 / -10:0.14 / -11:0.12 / -12:0.1 / -13:0.04em` (monotonic), adopted on 12 generic labels; kept 8 "signature" trackings ad-hoc (hero-kicker 0.35, sec-label 0.22, mm-tag 0.24, sys-online 0.25, boot-title 0.5, geo-kicker 0.2, seg-button 0.08, mm-ja).
- **Audit — this is a JUDGMENT CALL to evaluate:** the brief asked for tracking as a pure function of size; I did a **measured** adoption instead (≤0.02em drift), deliberately NOT flattening the signatures, on the argument that tracking here is partly *role-based* (display-labels-wide vs functional-tight) and a blind flatten would erase that + risk overflowing `.seg button`. Decide whether you'd have flattened harder.

### SP5f — Bilingual: JP-as-content hero (L5)  (`7760bc1`)
- **Did:** added **Zen Kaku Gothic New** (font-load `wght@500;700`) + `--font-ja-hero`; `html[lang="ja"]` rules restyle `.about-lead`/`.contact h2`/`.hero-kicker span` with JP metrics. Pure CSS on the existing `html[lang="ja"]` state (set by `js/app.js:129`); uses only authored `data-ja` content.
- **Audit:** toggle to 日本 and confirm the headlines render in Zen Kaku (not a fallback) and EN mode is untouched. Two decisions to weigh: (1) **face choice** — Zen Kaku (angular signage) for coherence vs a mincho for filmic drama (tunable); (2) **L6 vertical kanji index DEFERRED** as ornamental duplication of the existing `[ 0X ]` — agree/disagree? Also flag: it fixed a latent bug (JP headlines were falling back to an ugly system font).

### SP5g — HUD: graticule substrate (P5)  (`1991be0`)
- **Did:** faint 0.04α, 34px oscilloscope grid behind `.stat-row` / `.gallery-grid` / `.lb-stage`, as the container **`background-image`** (not a `::before` overlay → no z-index risk, no conflict with the WebGL grid floor).
- **Audit:** confirm it does NOT lift the near-black floor (north-star non-negotiable #1) and is only visible where the container background shows (gaps/margins). Note P6 (slashed numerals) was already delivered in SP5d.

### SP5h — HUD: worn-hardware deck (P8)  (`64f48d3`)
- **Did:** `.deck` flat full-border → faint bezel + **L-corner brackets (2 opposite corners, pseudo-elements)** + a header model-rail (`.deck h4::after`). Lightbox stage already framed via `.lb-corner`.
- **Audit:** open the deck (gear, bottom-left) and judge whether the corner brackets read strongly enough (I kept them `--line-strong`, restrained — could go brighter). Confirm the SP5b outline-active seg states are unaffected.

### SP5i — Composition  (`1b61300`)
- **Did:** **L1 luminance** — removed `.stat .n`'s resting `text-shadow` glow (one fewer bloom competing with the About headline; mono reads crisp). **L6+7** — first gallery tile gets `class="shot feature"` + `.shot.feature { grid-column: span 2; aspect-ratio: 8/5 }` = one wide cinematic break.
- **Audit:** the responsive claim is the risk — confirm the feature tile degrades cleanly at the 880px and 400px `.gallery-grid` breakpoints (I reasoned `grid-column: span 2` clamps by spec but did NOT resize-test live — **please resize-test this**). Deferred structural levers (L3 named-cells, L4 Swiss-3rd-zone, L8 seat-stat-row) on cascade/over-framing risk — agree?

### SP5j — Motion-2: boxed state-word (L3)  (`e0bac9f`) — the JS slice
- **Did:** new `.state-flash` DOM + snap-in outline-box CSS (`@keyframes stateFlash` 1.9s) + `js/effects.js` `flashState(id)` called from the existing `if (active !== lastActive)` section-lock block. Fires one boxed section word (`ABOUT`/`WORK`/…); **reduced-gated + skips 'home'**. Bumped `V.fx` 3.3→3.4 AND `boot.mjs?v` 1→2 (both required — the latter so the browser re-reads the new `V.fx`).
- **Audit — most important, it's the JS change:** (1) confirm zero console errors + the ESM chain loads (`boot.mjs?v=2 → effects.js?v=3.4`). (2) Confirm `prefers-reduced-motion` truly suppresses it (`flashState` early-returns on `reduced`). (3) Behaviour question: during a fast flick-scroll it re-fires per section boundary (restarts the anim) — I judged that acceptable (rationed like the scene-ping, no cooldown added); decide if it needs a cooldown. (4) Placement/word choice: bottom-centre, shows the section id — is that redundant with the nav active-state? (tunable). **Deferred L4 ghost-echo / L5 per-letter / L7 idle-jitter** — L7's "never settles" is already provided by the living WebGL scene (a DOM idle-jitter would be a 2nd ambient motion, violating Lever 1); L4/L5 are polish + top over-animation risk. Evaluate that reasoning.

---

## 3. How to run & verify

```bash
cd "…/Personal Website"
python3 -m http.server 8080          # then open http://localhost:8080/?v=3.18
node tools/verify-site-hardening.js   # expect 20/20 PASS
```
- **Hard-reload** (Cmd+Shift+R) to bust the `?v`/`boot.mjs?v` cache when editing.
- **Interactive surfaces to exercise:** the **EN / 日本** toggle (top-right) → SP5f; the **gear** (bottom-left) opens the deck → SP5h; scroll section-to-section → SP5j state-word fires; scroll into About → SP5d stats + slashed zero; scroll to Gallery → SP5i feature tile + SP5g graticule (in gaps).
- **Reduced-motion pass:** run with `prefers-reduced-motion: reduce` and confirm no new motion (state-word suppressed; JP/graticule/deck are static).
- **Responsive pass:** resize through the 880px + 400px breakpoints — watch the gallery feature tile (SP5i) and the deck.

---

## 4. Deferred by design (evaluate whether these were right — they are NOT bugs)

| Deferred | Slice | Rationale given |
|---|---|---|
| Motion L4 ghost-echo / L5 per-letter / L7 idle-jitter | SP5j | L7 already met by the living WebGL scene; L4/L5 polish + over-animation risk (brief's #1 risk) |
| Bilingual L6 vertical kanji index | SP5f | Ornamental duplication of the existing `[ 0X ]` section indices |
| Composition L3 named-cells / L4 Swiss-3rd-zone / L8 seat-stat-row | SP5i | Structural, responsive-cascade + over-framing risk |
| Type `.readout` class + P3 unit-triad | SP5d | YAGNI — only 2 existing readouts, no new consumer |

These mirror the restraint the briefs themselves ask for (§0.5, "don't over-Japanese," "over-animation is the primary risk"). If the auditor disagrees, they're cheap follow-on slices.

---

## 5. Known tunables / open questions (owner's taste, flag don't "fix")
- **Mono stat weight** (SP5d) — 400; could load a lighter JetBrains Mono cut for delicacy.
- **JP hero face** (SP5f) — Zen Kaku Gothic New; swappable to a mincho (e.g. Shippori Mincho) for more filmic drama.
- **State-word** (SP5j) — placement (bottom-centre) + word (section id); possibly redundant with nav.
- **Coherence note:** DOM instrument voice = **JetBrains Mono**, canvas HUD voice = **Rajdhani** (`js/background.js:1140`). Two instrument faces. Out of scope for the CSS type slices; a candidate future unification pass.

---

## 6. OUT OF AUDIT SCOPE — owner-data debts (not mine or the auditor's to fix)
1. **Verify the 12 gallery photo→city labels** (`GALLERY_PLACES`, `js/background.js:1110`). NOTE: I checked — the photos carry **no GPS/location EXIF** (stripped on web export), so this can't be auto-verified; only the owner (who shot them) can confirm each photo↔city. The *coordinates* in the mapping are all correct for their named cities; only the photo→city *assignment* is unverified.
2. **Author project/work/district geo** (coords + URLs) to make them globe-selectable (SP3 mechanism is already built). Owner confirms: projects are majority **Dallas / US-based**; a new project is pending and will be supplied later.

---

## 7. State & next steps
- `v3-build` is pushed and clean but **still off `main`** — no PR opened (owner's call). Natural next step: PR `v3-build → main` once the audit clears.
- Full program narrative + all prior-slice SHAs: `memory/v3-build-plan.md`.
- North-star to audit *against the feeling, not the rule count*: `docs/superpowers/specs/2026-07-03-north-star.md`.

🤖 Handover generated by Claude Opus 4.8 (1M context)
