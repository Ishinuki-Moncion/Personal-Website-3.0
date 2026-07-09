# SP5d — Type: numerals & readouts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make every numeric readout read as mono instrument output with a disambiguated (slashed) zero — move the one Hanken numeral (`.stat .n`) into the JetBrains Mono voice, add `slashed-zero` to the site's one tabular declaration, and close its coverage (`.geo-line`, `.boot-pct`).

**Architecture:** Pure CSS (`css/site.css`) — two edits (the `.stat .n` face at `:498`, the tabular declaration at `:693-695`) — plus one HTML `?v` bump (`index.html:13`). **No JS files touched.** The `.stat`/`.geo` label→value inversions already have distinct label/value elements, so unifying their recipe is CSS-only (no new class, no markup).

**Tech Stack:** Hand-authored CSS/HTML; no build/test runner. Verify = grep-gates + browser eyeball + diff-scope (SP1–SP5c method).

## Global Constraints

*(Verbatim from `docs/superpowers/specs/2026-07-07-sp5d-type-numerals-design.md` §0/§3.)*
- **CSS + HTML only.** Touch only `css/site.css` and `index.html` (the `?v` bump). **No `js/`**, no `V.fx`/`boot.mjs` bump.
- **`.stat .n` → JetBrains Mono, weight 400** (200 is not loaded; drop the `--font-display` override so it inherits `--font-mono` from `.stat` `:497`). Line `:499` (color/line-height/text-shadow) unchanged.
- **Slashed zero via the standard property:** `font-variant-numeric: tabular-nums slashed-zero;` on the one tabular declaration. **Fallback** (only if it does not visibly render on JetBrains Mono in the eyeball): escalate that selector to `font-feature-settings: "tnum" 1, "zero" 1;`.
- **Ordinals `.mm-idx`/`.proj-idx` are deliberately NOT added** to the tabular list (decorative ordinals, not data readouts).
- **Cache-bust:** `site.css?v=3.11` → `?v=3.12`.

---

### Task 1: L2 face crossing + L1/P6 slashed-zero + L4/L7 coverage

**Files:** Modify `css/site.css:498` and `css/site.css:693-695`.

- [ ] **Step 1: RED gate — confirm current state.**
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website"
grep -n 'stat .n { font-family: var(--font-display)' css/site.css   # Hanken crossing present
grep -n 'font-variant-numeric: tabular-nums;' css/site.css          # no slashed-zero yet (line 695)
grep -c 'font-variant-numeric' css/site.css                          # 1 (the only decl)
grep -n 'geo-line' css/site.css | grep -c 'font-variant'             # 0 (geo-line not covered)
```
Expected (RED): first two present; count = `1`; last = `0`.

- [ ] **Step 2: Edit A — `.stat .n` → mono (`css/site.css:498`).** Replace the first line of the `.stat .n` rule:
```css
.stat .n { font-family: var(--font-display); font-weight: 200; font-size: clamp(34px, 4vw, 56px);
```
with (drop the `--font-display` override → inherits `--font-mono` from `.stat`; weight 200→400):
```css
.stat .n { font-weight: 400; font-size: clamp(34px, 4vw, 56px);
```
Leave line `:499` (`color: var(--cyan); line-height: 1; text-shadow: 0 0 24px rgba(57,240,255,0.3); }`) untouched.

- [ ] **Step 3: Edit B — tabular declaration (`css/site.css:693-695`).** Replace:
```css
/* numeric readouts hold width (clock, counters, positions, dates) */
.clock, .stat .n, .lb-pos, .gallery-count, .proj-year, .row-date,
.coord, .mm-coord { font-variant-numeric: tabular-nums; }
```
with (add `.geo-line` [L4] + `.boot-pct` [L7]; `tabular-nums` → `tabular-nums slashed-zero` [L1/P6]; comment updated):
```css
/* numeric readouts: hold width + disambiguated (slashed) zero — instrument figures */
.clock, .stat .n, .geo-line, .lb-pos, .gallery-count, .proj-year, .row-date,
.coord, .mm-coord, .boot-pct { font-variant-numeric: tabular-nums slashed-zero; }
```

- [ ] **Step 4: GREEN gate — confirm new state.**
```bash
grep -n 'stat .n { font-weight: 400' css/site.css                    # mono-inherit + w400 present
grep -n 'stat .n { font-family' css/site.css || echo "EMPTY ✓ — override removed"
grep -n 'tabular-nums slashed-zero' css/site.css                     # slashed-zero present
grep -n '.coord, .mm-coord, .boot-pct { font-variant-numeric' css/site.css   # boot-pct in list
grep -n '.clock, .stat .n, .geo-line,' css/site.css                  # geo-line in list
grep -c 'font-variant-numeric' css/site.css                          # still 1 (only decl)
```
Expected (GREEN): `font-weight: 400` line present; `.stat .n { font-family` EMPTY; slashed-zero + both new selectors present; count still `1`.

- [ ] **Step 5: Commit**
```bash
git add css/site.css
git commit -m "feat(sp5d): .stat .n Hanken→mono w400 + tabular decl slashed-zero (+.geo-line/.boot-pct coverage)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Cache-bust, scope gate, browser eyeball, decision record

**Files:** Modify `index.html:13`; complete spec §8.

- [ ] **Step 1: Bump version — `index.html:13`.** `css/site.css?v=3.11` → `?v=3.12`.
```bash
grep -n 'site.css?v=3.12' index.html   # present after edit
```

- [ ] **Step 2: Scope gate (E).**
```bash
git diff --name-only e0f1f87            # = css/site.css + index.html only; no js/
git diff e0f1f87 -- index.html | grep -E '^\+' | grep -v '?v=3.12'   # index.html change = ?v only (no markup lines)
```
Expected: two files; the only added index.html line is the `?v=3.12` link.

- [ ] **Step 3: Eyeball (D) — serve + hard-reload.**
```bash
python3 -m http.server 8080 >/tmp/sp5d-server.log 2>&1 &
```
Open `http://localhost:8080/?v=3.12`, hard-reload. Scroll the **About** section into view:
  - The stat numerals (`100+` etc.) render in **JetBrains Mono** (mono, wider, even strokes — not the old thin Hanken), and the **`0` is visibly slashed/dotted** (compare against an `O` in nearby caps).
  - The stat **counts up without column-width wobble** (digits hold width as they tick).
  - The **boot `%`** (reload to catch the boot overlay) and the **geo line** hold width; any `0` in them reads slashed.
  - **Reading copy** (about-lead, bios) stays **Hanken** sentence-case — unchanged.
  - Globe / scene / HUD accents unchanged.

  **If the slashed zero does NOT render** on JetBrains Mono → apply the §3.2 fallback: change the tabular selector's declaration to `font-feature-settings: "tnum" 1, "zero" 1;` (keep `font-variant-numeric: tabular-nums slashed-zero;` too), reload, re-check. Record if applied.

  **If mono weight 400 reads too heavy** at 34–56px → drop the stat `font-size` clamp slightly, or add a lighter JetBrains Mono cut to `index.html:12` (`wght@...;300;400...`) and set `.stat .n { font-weight: 300 }`. Record any tune. `kill %1` when done.

- [ ] **Step 4: Decision record.** Fill spec §8 (feature commits, gates A–F results, eyeball notes, whether the slashed-zero fallback or a weight tune was applied, NEXT pointer).

- [ ] **Step 5: Commit**
```bash
git add index.html docs/superpowers/specs/2026-07-07-sp5d-type-numerals-design.md
git commit -m "feat(sp5d): bump site.css?v 3.11->3.12 + acceptance record — SP5d COMPLETE

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage** (§4): Edit 1 `.stat .n`→mono → T1 S2 ✓; Edit 2 slashed-zero + `.geo-line`/`.boot-pct` → T1 S3 ✓; Edit 3 `?v` → T2 S1 ✓. Gates: A (slashed-zero + coverage) → T1 S4; B (`--font-display` gone) → T1 S4; C (boot-pct/geo-line in, ordinals out) → T1 S4 (+ ordinals never added); D (eyeball + both fallbacks) → T2 S3; E (scope) → T2 S2; F (`?v`) → T2 S1. ✓

**Placeholder scan:** exact before/after in every edit step; exact greps with expected output; §8 fill enumerated; both fallbacks (slashed-zero, weight) spelled out with concrete code, not "handle if needed." ✓

**Type consistency:** no new identifiers; `--font-mono`/`--font-display` are existing tokens; the `tabular-nums slashed-zero` string and the `.stat .n { font-weight: 400` string in T1 S2/S3 match their GREEN-gate greps in T1 S4 verbatim. Scope-gate SHA `e0f1f87` = the committed design spec. ✓
