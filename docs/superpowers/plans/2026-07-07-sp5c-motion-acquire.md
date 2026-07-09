# SP5c — Motion: acquiring reticle + readout boot-up — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the cursor *acquire* targets (cyan reticle that tightens with inset lock-on ticks) and boot the one numeric readout from an `88` placeholder.

**Architecture:** Pure CSS (`css/site.css`, cursor `.is-hot`) + one HTML text change (`index.html`, the `[data-count]` placeholder) + a `?v` bump. **No JS files touched.**

**Tech Stack:** Hand-authored CSS/HTML; no build/test runner. Verify = grep-gates + browser eyeball + diff-scope (SP1–SP5b method).

## Global Constraints

*(Verbatim from `docs/superpowers/specs/2026-07-07-sp5c-motion-acquire-design.md`.)*
- **CSS + HTML only.** Touch only `css/site.css` (cursor `:157-164`) and `index.html` (`:136` + the `?v`). **No `js/`**, no `V.fx`/`boot.mjs` bump.
- **Cursor ring → cyan** (one-ink); **`.cursor-label` stays amber**; keep `.is-down`/`.is-text` as-is.
- **Cache-bust:** `site.css?v=3.10` → `?v=3.11`.

---

### Task 1: L2 acquiring reticle + L6 readout placeholder

**Files:** Modify `css/site.css:157-164`; `index.html:136`.

- [ ] **Step 1: RED gate** — current amber-grow + `0+` present.
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website"
grep -n 'is-hot .cursor-ring { width: 56px' css/site.css     # amber-grow present
grep -n 'data-count="100" data-suffix="+" aria-hidden="true">0+<' index.html
```
Expected (RED): both present.

- [ ] **Step 2: Redesign `.is-hot` (tighten + cyan + inset ticks).** Replace:
```css
.cursor.is-hot .cursor-ring { width: 56px; height: 56px; border-color: var(--amber); }
.cursor.is-hot .cursor-ring::before,
.cursor.is-hot .cursor-ring::after {
  content: ''; position: absolute; width: 7px; height: 7px;
  border-color: var(--amber); border-style: solid;
}
.cursor.is-hot .cursor-ring::before { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
.cursor.is-hot .cursor-ring::after { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }
```
with:
```css
.cursor.is-hot .cursor-ring { width: 28px; height: 28px; border-color: var(--cyan); }
.cursor.is-hot .cursor-ring::before,
.cursor.is-hot .cursor-ring::after {
  content: ''; position: absolute; width: 8px; height: 8px;
  border-color: var(--cyan); border-style: solid;
}
.cursor.is-hot .cursor-ring::before { top: 2px; left: 2px; border-width: 1px 0 0 1px; }
.cursor.is-hot .cursor-ring::after { bottom: 2px; right: 2px; border-width: 0 1px 1px 0; }
```

- [ ] **Step 3: Seed the readout placeholder.** In `index.html:136`, replace `aria-hidden="true">0+</span>` with `aria-hidden="true">88+</span>` (leave the `.sr-only`>100+ sibling untouched).

- [ ] **Step 4: GREEN gate.**
```bash
grep -nE 'cursor.is-hot .cursor-ring' css/site.css | grep -E '56px|var\(--amber\)' || echo "EMPTY ✓ — no amber-grow in is-hot"
grep -n 'is-hot .cursor-ring { width: 28px; height: 28px; border-color: var(--cyan)' css/site.css   # cyan tighten present
grep -n 'aria-hidden="true">88+<' index.html                                                          # placeholder present
grep -n 'sr-only">100+<' index.html                                                                   # sr value intact
```
Expected: no `56px`/`--amber` in is-hot; cyan-tighten line present; `88+` visible; `100+` sr-only intact.

- [ ] **Step 5: Commit**
```bash
git add css/site.css index.html
git commit -m "feat(sp5c): acquiring reticle (cyan tighten + inset ticks) + readout 88 placeholder"
```

---

### Task 2: Cache-bust, browser eyeball, decision record

**Files:** Modify `index.html:13`; complete spec §8.

- [ ] **Step 1: Bump version** — `index.html:13` `css/site.css?v=3.10` → `?v=3.11`.

- [ ] **Step 2: Scope gate (E)** — `git diff --name-only <spec-commit>` = `css/site.css` + `index.html` only; **no `js/`**.

- [ ] **Step 3: Eyeball (D)** — serve, hard-reload:
```bash
python3 -m http.server 8080 >/tmp/sp5c-server.log 2>&1 &
```
Hover a nav link / button / gallery tile → the reticle **tightens to a cyan lock-on with inset corner ticks** (not an amber grow); press → clamps further; the `data-cursor` **label stays amber**; confirm the cyan reticle still reads over a bright gallery photo (mix-blend:difference). Scroll the About stat into view → shows **`88+`** then **counts up to `100+`**. Tune the tighten/tick geometry if the acquire reads weak. `kill %1` when done.

- [ ] **Step 4: Decision record** — fill spec §8 (commits, gates A–F, eyeball notes, any geometry tune).

- [ ] **Step 5: Commit**
```bash
git add index.html docs/superpowers/specs/2026-07-07-sp5c-motion-acquire-design.md
git commit -m "feat(sp5c): bump site.css?v 3.10->3.11 + acceptance record — SP5c COMPLETE"
```

---

## Self-Review

**Spec coverage** (§4): L2 cursor redesign → T1 S2 ✓; L6 placeholder → T1 S3 ✓; `?v` → T2 S1 ✓; no-JS asserted by Global Constraints + gate E ✓. Gates A/B→T1 S4 (+ label untouched), C→T1 S4, D→T2 S3, E→T2 S2, F→T2 S1/2. ✓

**Placeholder scan:** exact before/after in every step; §8 fill specified. ✓

**Type consistency:** no new identifiers; `--cyan`/`--amber` existing tokens; the cyan-tighten string in T1 S2 matches the gate in T1 S4. ✓
