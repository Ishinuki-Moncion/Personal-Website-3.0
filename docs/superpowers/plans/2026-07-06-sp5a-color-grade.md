# SP5a — Color: finish the teal-black grade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the v3 teal-black grade on the DOM surface — re-hue the last blue-black floors SP4 didn't reach and remove the two amber area-washes — so the whole site reads as one graded teal-black night with a metered warm accent.

**Architecture:** Pure CSS token/value work in `css/site.css`, plus a cache-bust `?v` bump in `index.html`. Add one floor token (`--void-deep`), delete one dead token (`--panel`), re-hue the remaining blue literals into the teal base family, and drop amber from the two large-area layers. No JavaScript, no scene changes.

**Tech Stack:** Hand-authored CSS custom properties; no build step, no preprocessor, no test runner. Verification is grep-gates + a browser eyeball (the SP1–SP4 method).

## Global Constraints

*(Every task's requirements implicitly include this section. Values copied verbatim from `docs/superpowers/specs/2026-07-06-sp5a-color-grade-design.md`.)*

- **CSS-only.** Touch only `css/site.css` and the `?v` in `index.html`. Do **not** touch `js/background.js`, do **not** bump `V.bg`, do **not** re-trigger the SP4 scene ship-gate.
- **Teal base family only.** Every re-hued floor lands in hue ~187–193° at the value floor. The base is **never** derived by tinting with `--cyan #39f0ff`.
- **Point-amber marks are OUT of scope** — nav active-brackets (`:252–255`), `.live-tag` (`:523–526`), `.sec-label .idx` (`:367`), `.geo-kicker` (`:475–477`), `.proj-idx` (`:533`), cursor label (`:171`), `.geo-trail` hairline (`:473`). Leave every one unchanged; the HUD/composition slices own them.
- **No CSS test runner** → verify = grep-gates + browser eyeball + `git diff --name-only` scope-check.
- **Cache-bust:** `css/site.css?v=3.8` → `?v=3.9` (once, in Task 3).

---

### Task 1: Teal-black floors (tokens + overlay scrims)

**Files:**
- Modify: `css/site.css:8-10` (token block: add `--void-deep`, delete `--panel`, re-hue `--panel-solid`)
- Modify: `css/site.css:184` (`.boot` → tokenize)
- Modify: `css/site.css:289` (`.mobile-menu` scrim)
- Modify: `css/site.css:582` (`.lightbox` scrim)

**Interfaces:**
- Produces: CSS custom property `--void-deep: #050e10` on `:root`, consumed by `.boot` (this task) and available site-wide. No JS/HTML consumes it.

- [ ] **Step 1: Write the failing gate** — confirm the blue-black floors are present *now* (RED).

Run:
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website"
grep -nE 'rgba\(8, ?10, ?16|rgba\(7, ?9, ?14|rgba\(3,4,7|rgba\(2,3,6' css/site.css
```
Expected (RED): four matches — `:9` `--panel`, `:10` `--panel-solid`, `:289` `.mobile-menu`, `:582` `.lightbox`.

- [ ] **Step 2: Edit the token block** — add `--void-deep`, delete dead `--panel`, re-hue `--panel-solid`.

In `css/site.css`, replace:
```css
  --void-2: #0e1a1d;
  --panel: rgba(8, 10, 16, 0.55);
  --panel-solid: rgba(7, 9, 14, 0.92);
```
with:
```css
  --void-2: #0e1a1d;
  --void-deep: #050e10;  /* SP5a: deepest overlay-scrim floor (teal-black, = former .boot value) */
  --panel-solid: rgba(8, 20, 22, 0.92);  /* SP5a: teal-black chrome panel bed (was blue rgba(7,9,14)) */
```

- [ ] **Step 3: Tokenize `.boot`** — point it at the new token (identical value → zero visual change).

In `css/site.css:184`, replace:
```css
  position: fixed; inset: 0; z-index: 9000; background: #050e10;
```
with:
```css
  position: fixed; inset: 0; z-index: 9000; background: var(--void-deep);
```

- [ ] **Step 4: Re-hue the `.mobile-menu` scrim** — blue-black → teal-black deep.

In `css/site.css:289`, replace:
```css
.mobile-menu { position: fixed; inset: 0; z-index: 9300; background: rgba(3,4,7,0.97);
```
with:
```css
.mobile-menu { position: fixed; inset: 0; z-index: 9300; background: rgba(5,14,16,0.97);
```

- [ ] **Step 5: Re-hue the `.lightbox` scrim** — blue-black → teal-black deep.

In `css/site.css:582`, replace:
```css
.lightbox { position: fixed; inset: 0; z-index: 9500; background: rgba(2,3,6,0.96);
```
with:
```css
.lightbox { position: fixed; inset: 0; z-index: 9500; background: rgba(5,14,16,0.96);
```

- [ ] **Step 6: Run the gates** — floors are teal, dead token gone (GREEN).

Run:
```bash
grep -nE 'rgba\(8, ?10, ?16|rgba\(7, ?9, ?14|rgba\(3,4,7|rgba\(2,3,6|#05060a|#030407' css/site.css   # gate A (blue floors)
grep -nE 'var\(--panel[^-]' css/site.css index.html js/*.js                                             # gate C (dead --panel)
grep -nE -- '--void-deep|var\(--void-deep\)' css/site.css                                               # gate B (new token)
```
Expected:
- Gate A → **empty** (no blue-black floor literals remain).
- Gate C → **empty** (nothing references the deleted `--panel`).
- Gate B → **two lines**: the `--void-deep:` definition and the `.boot` `var(--void-deep)` reference.

- [ ] **Step 7: Commit**

```bash
git add css/site.css
git commit -m "feat(sp5a): teal-black floors — add --void-deep, drop dead --panel, re-hue panel/menu/lightbox scrims"
```

---

### Task 2: Accent-budget area-washes (scene-glass + portrait)

**Files:**
- Modify: `css/site.css:113-116` (`.scene-glass` — drop the amber radial)
- Modify: `css/site.css:489` (`.about-portrait .duo` — cyan-only duotone)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: no new tokens/classes; pure value edits.

- [ ] **Step 1: Write the failing gate** — confirm both amber area-washes are present *now* (RED).

Run:
```bash
grep -nE 'rgba\(255, ?158, ?44' css/site.css
```
Expected (RED): amber appears at `:116` (`.scene-glass` radial), `:489` (`.about-portrait .duo`), and the point-marks that must **stay** — `:173` (cursor label), `:367` (`.sec-label .idx`), `:412` (hero amberline), `:419`/`:421` (glitch drop-shadows), `:473` (`.geo-trail` hairline), `:524` (`.live-tag`). Only `:116` and `:489` get removed.

- [ ] **Step 2: Drop the amber radial from `.scene-glass`** — leave the neutral glass-glint and the cyan radial; the cyan radial's trailing comma becomes a semicolon.

In `css/site.css:113-116`, replace:
```css
  background:
    linear-gradient(105deg, transparent 0 42%, rgba(233, 241, 244, 0.07) 46%, transparent 52%),
    radial-gradient(circle at 74% 34%, rgba(57, 240, 255, 0.12), transparent 30%),
    radial-gradient(circle at 18% 76%, rgba(255, 158, 44, 0.10), transparent 28%);
```
with:
```css
  background:
    linear-gradient(105deg, transparent 0 42%, rgba(233, 241, 244, 0.07) 46%, transparent 52%),
    radial-gradient(circle at 74% 34%, rgba(57, 240, 255, 0.12), transparent 30%);
```

- [ ] **Step 3: Make the portrait `.duo` cyan-only** — drop the amber stop; a low-alpha cyan second stop preserves the falloff under the existing `mix-blend-mode: color`.

In `css/site.css:489`, replace:
```css
  background: linear-gradient(160deg, rgba(57,240,255,0.28), rgba(255,158,44,0.12)); pointer-events: none; }
```
with:
```css
  background: linear-gradient(160deg, rgba(57,240,255,0.28), rgba(57,240,255,0.06)); pointer-events: none; }
```

- [ ] **Step 4: Run the gate** — no amber area-wash remains; point-marks intact (GREEN).

Run:
```bash
grep -nE 'rgba\(255, ?158, ?44' css/site.css
```
Expected: matches at `:173, :367, :412, :419, :421, :473, :524` (the point-marks — **unchanged**), and **no match at the former `:116` or `:489`**. Confirm `.scene-glass` and `.about-portrait .duo` blocks carry no amber.

- [ ] **Step 5: Commit**

```bash
git add css/site.css
git commit -m "feat(sp5a): kill the 2 amber area-washes — scene-glass single-temp cyan, About portrait cyan-only duotone"
```

---

### Task 3: Cache-bust, browser verify, decision record

**Files:**
- Modify: `index.html:13` (`?v` bump)
- Modify: `docs/superpowers/specs/2026-07-06-sp5a-color-grade-design.md` (fill §9)

**Interfaces:**
- Consumes: the completed Task 1 + Task 2 edits.
- Produces: shipped `?v=3.9`; a completed decision record.

- [ ] **Step 1: Bump the stylesheet version.**

In `index.html:13`, replace:
```html
<link rel="stylesheet" href="css/site.css?v=3.8" />
```
with:
```html
<link rel="stylesheet" href="css/site.css?v=3.9" />
```

- [ ] **Step 2: Scope-check the diff (gate F)** — only the two intended files changed.

Run:
```bash
git diff --name-only HEAD~2   # the two feature commits
```
Expected: exactly `css/site.css` and (after this step) `index.html`. **`js/background.js` must NOT appear.** `V.bg` unchanged.

- [ ] **Step 3: Browser eyeball (gate E)** — serve and look.

Run a static server and open the page (reuse the SP1–SP4 dev method; hard-reload `Cmd+Shift+R` to defeat the `?v` cache):
```bash
python3 -m http.server 8080 >/dev/null 2>&1 &
# open http://localhost:8080/ , hard-reload
```
Confirm by eye:
1. Open the **lightbox** (click a gallery photo) and the **mobile menu** (narrow viewport) — both scrims read **teal-black**, not blue, over the globe.
2. The **control deck** panel (`.deck`, `--panel-solid`) reads teal-black.
3. The **About portrait** reads **cool cyan** (no warm lower-right tint) — the one intended aesthetic change.
4. The three cyan chips that use `--void` as *foreground* still read legibly: text selection (`::selection`), a hovered `.pill`, an active `.seg button.on`. (`--void` is unchanged this slice, so this is a confirmation, not a risk.)
5. Globe/scene/rain look identical to before (untouched).

Stop the server when done: `kill %1`.

- [ ] **Step 4: Fill the decision record.**

In `docs/superpowers/specs/2026-07-06-sp5a-color-grade-design.md` §9, replace the `*(to be completed on build)*` stub with: the three feature commit SHAs, the gate A–G results (pass/fail + any grep output), the browser eyeball notes, and any value tune applied to the `.duo` second-stop alpha.

- [ ] **Step 5: Commit**

```bash
git add index.html docs/superpowers/specs/2026-07-06-sp5a-color-grade-design.md
git commit -m "feat(sp5a): bump site.css?v 3.8->3.9 + acceptance record — SP5a COMPLETE"
```

---

## Self-Review

**Spec coverage** (against `2026-07-06-sp5a-color-grade-design.md` §4 change set — 9 edits):
1. Delete `--panel` → Task 1 Step 2 ✓
2. Re-hue `--panel-solid` → Task 1 Step 2 ✓
3. Add `--void-deep` → Task 1 Step 2 ✓
4. `.boot` → `var(--void-deep)` → Task 1 Step 3 ✓
5. `.mobile-menu` scrim → Task 1 Step 4 ✓
6. `.lightbox` scrim → Task 1 Step 5 ✓
7. `.scene-glass` drop amber → Task 2 Step 2 ✓
8. `.about-portrait .duo` cyan-only → Task 2 Step 3 ✓
9. `?v` bump → Task 3 Step 1 ✓
Gates A–G (spec §7): A/B/C → Task 1 Step 6; D → Task 2 Step 4; E → Task 3 Step 3; F → Task 3 Step 2; G → Task 3 Steps 1–2. All covered. Deferrals (fog, point-amber) are asserted as *no-change* by the Global Constraints + gate F, not by a task. ✓

**Placeholder scan:** no TBD/TODO in tasks; every code step shows exact before/after; §9 fill (Task 3 Step 4) specifies exactly what to write. ✓

**Type consistency:** the only produced identifier is `--void-deep` — spelled identically in its definition (Task 1 Step 2), its `.boot` reference (Task 1 Step 3), and gate B (Task 1 Step 6). ✓
