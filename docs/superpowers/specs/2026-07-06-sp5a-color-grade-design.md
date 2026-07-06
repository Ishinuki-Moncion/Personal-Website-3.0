# SP5a — Color: finish the teal-black grade (Design)

**Date:** 2026-07-06 · **Branch:** `v3-build` · **Program:** SP5 (cross-site v3 grading / motion)
**Source brief:** `docs/superpowers/specs/2026-07-03-color-elevation-brief.md` · **Rules:** `design-language-v3` §6 (Color & Grade) + §0 Spine laws 1–4 · **North star:** non-negotiable #1 "near-black, one graded world."

---

## §0 — Context: SP5 is a program; this is its first slice

The memory scoped **SP5** as "cross-site v3 grading / motion." On inspection that is **five elevation briefs carrying ~35 concrete code levers** (color, HUD, type, motion, composition) — a program the size of SP1–SP4 combined, not one spec. Owner decision (2026-07-06): **build SP5 one brief at a time**, each its own spec→plan→build like SP1–SP4, **starting with Color** — it closes the #1 north-star non-negotiable, it is ~half-done already, it is the lowest-risk (CSS token work), and it establishes the *accent-budget* discipline that the HUD and composition slices later enforce structurally.

This doc is **SP5a — Color**. Later slices (SP5b HUD, SP5c Type, SP5d Motion, SP5e Composition) are out of scope here.

**Already shipped by SP4** (not re-spec'd here): `--void #0a1416`, `--void-2 #0e1a1d`, `.boot #050e10`, and `<meta theme-color> #0a1416` are all already teal-black. Roughly half the color brief's levers are done.

## §1 — Current state (the audit)

A complete grep of blue-black literals across `css/`, `index.html`, and `js/` — this is what the teal-black floor still misses:

| # | Anchor | Now (blue-black) | Brief lever |
|---|--------|------------------|-------------|
| 1 | `--panel` — `css/site.css:9` | `rgba(8,10,16,.55)` — **dead (unused anywhere)** | (a) delete |
| 2 | `--panel-solid` — `css/site.css:10` | `rgba(7,9,14,.92)` | (a) re-hue |
| 3 | `.mobile-menu` — `css/site.css:289` | `rgba(3,4,7,.97)` | (a) re-hue deep |
| 4 | `.lightbox` — `css/site.css:582` | `rgba(2,3,6,.96)` | (a) re-hue deep |
| 5 | `.scene-glass` amber radial — `css/site.css:116` | `rgba(255,158,44,.10)` | (c) drop |
| 6 | `.about-portrait .duo` — `css/site.css:489` | cyan→**amber** duotone | (c) drop amber |

**Two findings that shape scope:**
- **`--panel` is a dead token** — `grep 'var(--panel[^-]'` over `css/ index.html js/` returns nothing. Only `--panel-solid` is consumed (`:272 .mobile-menu`-inner, `:634`/`:641 .deck`, `:682 .pill`). Delete `--panel` (YAGNI).
- **The scene fog is inert.** `js/background.js:67` sets `scene.fog = FogExp2(0x05060a,…)`, but every material is `fog:false` and the comment at `:120` states fog is off (a manual smoothstep depth-fade replaces it). Re-hueing that literal (color brief lever d) is a **visual no-op** → deferred (see §6).

## §2 — Target intent (from the color brief)

The v3 grade is a **teal-black cyber-noir at the value floor**: the base is a stable, desaturated member of the teal family (distinct from the bright emitter `--cyan #39f0ff`), the warm accent is a metered ~1–6% of frame area, and any "glow" comes from bloom/atmosphere, never from lifting the base toward grey. After SP4, `--void` already *is* that base; SP5a finishes the floors that SP4 didn't reach and removes the two area-washes that put warm and cool at comparable area in one frame.

## §3 — Approved decisions (owner, 2026-07-06)

1. **Token architecture = add `--void-deep`.** Introduce one new token `--void-deep: #050e10` (the teal value SP4 already put on `.boot`) as the deepest overlay-scrim floor; re-hue `--panel-solid` teal-black; delete dead `--panel`. Chosen over the brief's `--base`/`--base-deep` rename (redundant — `--void` already *is* the base post-SP4) and over a bare literal-swap (leaves floors as scattered literals, not a named discipline).
2. **About portrait `.duo` → cyan-only duotone.** Drop the amber stop; the portrait tints cool cyan with a gentle falloff. This is the **one visibly different area** on the site.
3. **Scope = CSS-only.** `css/site.css` + the `?v` bump in `index.html`. `js/background.js` is untouched; the inert fog literal is deferred.

## §4 — Concrete change set

Nine edits across two files (`css/site.css`, `index.html`). Exact `before → after`; values chosen to keep the whole floor one teal family (hue ~187–193°) at the value floor.

**Token block (`css/site.css:6–33`):**
- **Delete** `--panel: rgba(8,10,16,.55);` `:9` — dead.
- **Re-hue** `--panel-solid: rgba(7,9,14,.92)` → `rgba(8,20,22,.92)` `:10` — teal-black chrome-panel bed (deck/menu-inner/pill); rgb tracks `--void` (10,20,22).
- **Add** `--void-deep: #050e10;` near `:8` — new deepest-floor token (= former `.boot` literal; teal-black, hue ~193°, L~11).

**Floor repoints:**
- `.boot` `:184` `background: #050e10` → `background: var(--void-deep);` — tokenize; **zero visual change** (value identical).
- `.mobile-menu` `:289` `background: rgba(3,4,7,.97)` → `rgba(5,14,16,.97)` — teal-black deep (= `--void-deep` rgb @ .97).
- `.lightbox` `:582` `background: rgba(2,3,6,.96)` → `rgba(5,14,16,.96)` — teal-black deep (= `--void-deep` rgb @ .96).

  *(Rationale for rgba literals over `color-mix(in srgb, var(--void-deep) 97%, transparent)`: the scrims must never silently fall to `transparent` on a browser lacking `color-mix` — a see-through lightbox/menu is a real failure. The literal rgb mirrors `--void-deep` by construction, so they stay a family. `color-mix` is the token-referencing upgrade if ever wanted, with that fallback caveat.)*

**Accent-budget area fixes (lever c):**
- `.scene-glass` `:113–116` — **remove the amber radial** (line 116), keeping the neutral glass-glint (`:114`, `rgba(233,241,244,.07)` — a specular glint, not a warm wash) and the cyan radial (`:115`). Result: single-temperature cyan atmosphere.
- `.about-portrait .duo` `:489` — `linear-gradient(160deg, rgba(57,240,255,.28), rgba(255,158,44,.12))` → `linear-gradient(160deg, rgba(57,240,255,.28), rgba(57,240,255,.06))` — cyan-only duotone under the existing `mix-blend-mode: color`; the low-alpha second stop preserves the dimensional falloff. Exact second-stop alpha is tunable in-browser.

**Cache-bust:**
- `index.html:13` `css/site.css?v=3.8` → `?v=3.9`.

## §5 — Accent-budget governance (documented, not enforced this slice)

**Rule of record:** warm-bearing *area* ≤ ~6% per viewport; switch temperature at section boundaries, not within a frame (§0.3, color/004 · [DATA]). After the two area-washes are removed, the remaining amber is all **point marks**, within budget, and is **not** touched here: nav active-brackets (`:252–255`), `.live-tag` (`:523–526`), `.sec-label .idx` (`:367`), `.geo-kicker` (`:475–477`), `.proj-idx` (`:533`), cursor label (`:171`), `.geo-trail` hairline (`:473`). Whether some of those *point* marks should further demote to cyan is the **HUD brief P1 / composition lever 5** question — a later slice, deliberately out of scope so the color slice stays a clean floor-and-area pass.

## §6 — Scope boundary & deferrals

- **CSS-only.** No `js/*` touched; `V.bg`/scene version unchanged; the SP4 scene ship-gate is **not** re-triggered.
- **Fog re-hue deferred** (`background.js:67` `0x05060a`). Inert (all materials `fog:false`). Fold into the next scene touch if ever; lever (d)'s guard half — "don't lift `--void` to fake ambient light" — is already honored (we lower/re-hue floors, never lift).

## §7 — Acceptance criteria & verify

No CSS unit runner exists (consistent with SP1–SP4) → verify = **grep-gates + browser eyeball + diff-scope**.

- **A · No blue-black literal remains.** `grep -nEi '#05060a|#030407|rgba\(3, ?4, ?7|rgba\(2, ?3, ?6|rgba\(7, ?9, ?14|rgba\(8, ?10, ?16' css/site.css` → empty.
- **B · `--void-deep` defined once, referenced by `.boot`;** menu/lightbox scrims are `rgb(5,14,16)`.
- **C · `--panel` gone;** `grep 'var(--panel[^-]'` over `css/ index.html js/` → empty (already true; must stay true).
- **D · No amber area-wash.** `.scene-glass` and `.about-portrait .duo` blocks contain no `rgba(255,158,44`; the point-amber marks in §5 are unchanged (grep-diff).
- **E · Eyeball (browser).** Lightbox + mobile menu + deck read teal-black, not blue, over the globe; About portrait reads cool cyan (the intended change); the three chips that use `--void` as *foreground* (`::selection :57`, `.pill:hover :623`, `.seg button.on :657`) stay legible (`--void` itself is unchanged, so no new risk — confirm anyway).
- **F · Scene untouched.** `git diff --name-only` shows only `css/site.css` + `index.html`; `js/background.js` absent.
- **G · Cache-bust.** `site.css?v=3.9`.

## §8 — Out of scope / risks

**Out of scope:** the fog re-hue (§6); structural point-amber demotion (HUD P1 / composition lever 5); the amber signal hue `#ff9e2c` itself (kept); rain/globe emitter colors (other briefs); the four remaining SP5 briefs.

**Risks:**
- **`--void`-as-foreground chips** (`::selection`, `.pill:hover`, `.seg button.on`): `--void` is *not* changed in SP5a, so these are literally unchanged — re-confirm legibility only because we're in the neighborhood. Low.
- **`.about-portrait .duo` cyan value is a taste tune** — `.06` falloff stop is a starting point; tune on-device.
- **The `.scene-glass` glint** (`rgba(233,241,244,.07)`) is intentionally **kept** (neutral specular glass-glint at ~1.5% effective opacity, not a warm/white *state*) — noted so a later audit doesn't "fix" it.
- **`[DATA]` tokens are PIL-measured off graded film frames** — reliable as *relative* hue/value structure, not colorimetric spec; treat all hexes as tune-by-eye targets.

## §9 — Decision record

*(to be completed on build)* — commits, grep-gate results A–G, eyeball notes, any value tunes.
