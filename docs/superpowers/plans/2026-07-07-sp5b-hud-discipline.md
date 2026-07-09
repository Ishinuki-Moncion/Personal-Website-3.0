# SP5b — HUD outline & accent discipline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the chrome read as one crisp instrument — demote all structural amber to muted so amber means *live* only, and convert filled state/hover chips to outlines.

**Architecture:** Pure CSS in `css/site.css` + a `?v` bump in `index.html`. No markup, no JS. Two edit clusters (P1 accent-demote, P4 fills→outlines) then verify.

**Tech Stack:** Hand-authored CSS; no build/test runner. Verify = grep-gates + browser eyeball + diff-scope (SP1–SP5a method).

## Global Constraints

*(Verbatim from `docs/superpowers/specs/2026-07-07-sp5b-hud-discipline-design.md`.)*
- **CSS-only.** Touch only `css/site.css` + the `?v` in `index.html`. No `js/`.
- **Amber survives only on genuine state:** `.live-tag`, `.nav-link.active` `[ ]` brackets, and the decorative hero `.amberline`/glitch drop-shadows (out of scope). Every *structural/ordinal* amber → `--muted`.
- **P2/P7 = deliberate no-change** (`.lb-corner` already L-brackets; `.shot`/`.tag` faint frames kept; `mix-blend:difference` kept). Do not touch them.
- **Cache-bust:** `site.css?v=3.9` → `?v=3.10` (Task 3).

---

### Task 1: P1 — demote structural amber → `--muted`

**Files:** Modify `css/site.css` (5 selectors: `:318`, `:366`, `:476`, `:532`, `:646`).

- [ ] **Step 1: RED gate** — structural amber present now.

Run:
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website"
grep -nE '\.mm-idx|\.sec-label \.idx|\.proj-idx|\.deck h4::before' css/site.css | grep 'var(--amber)'
grep -n 'color: var(--amber); text-transform: uppercase;' css/site.css   # geo-kicker
```
Expected (RED): `.mm-idx`, `.sec-label .idx`, `.proj-idx`, `.deck h4::before` all show `var(--amber)`; geo-kicker line present.

- [ ] **Step 2: `.mm-idx`** — replace:
```css
.mm-idx { font-family: var(--font-mono); font-size: 12px; color: var(--amber); letter-spacing: 0.1em;
```
with:
```css
.mm-idx { font-family: var(--font-mono); font-size: 12px; color: var(--muted); letter-spacing: 0.1em;
```

- [ ] **Step 3: `.sec-label .idx`** (drop the amber glow) — replace:
```css
.sec-label .idx { color: var(--amber); text-shadow: 0 0 10px rgba(255,158,44,0.5); }
```
with:
```css
.sec-label .idx { color: var(--muted); }
```

- [ ] **Step 4: `.geo-kicker`** — replace:
```css
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em;
  color: var(--amber); text-transform: uppercase;
```
with:
```css
  font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em;
  color: var(--muted); text-transform: uppercase;
```

- [ ] **Step 5: `.proj-idx`** — replace:
```css
.proj-idx { font-family: var(--font-mono); font-size: 12px; color: var(--amber); letter-spacing: 0.1em;
```
with:
```css
.proj-idx { font-family: var(--font-mono); font-size: 12px; color: var(--muted); letter-spacing: 0.1em;
```

- [ ] **Step 6: `.deck h4::before`** — replace:
```css
.deck h4::before { content: '◆'; color: var(--amber); font-size: 8px; }
```
with:
```css
.deck h4::before { content: '◆'; color: var(--muted); font-size: 8px; }
```

- [ ] **Step 7: GREEN gate** — only genuine-state amber remains.

Run:
```bash
grep -nE 'var\(--amber\)' css/site.css
```
Expected: matches only `.live-tag` (`:522`, `:524-525`) and `.nav-link::before/::after` (`:251`/`:253`) — the P1-keep set. **None** of `.mm-idx`/`.sec-label .idx`/`.geo-kicker`/`.proj-idx`/`.deck h4::before`. Also: `grep -n 'rgba(255,158,44,0.5)' css/site.css` → empty (the `.idx` glow is gone).

- [ ] **Step 8: Commit**
```bash
git add css/site.css
git commit -m "feat(sp5b): P1 demote 5 structural-amber marks -> muted (amber now = live-state only)"
```

---

### Task 2: P4 — fills → outlines

**Files:** Modify `css/site.css` (`.live-tag` `:522`, `.tag:hover` `:542`, `.pill` `:615-623`, `.seg button.on` `:656`).

- [ ] **Step 1: RED gate** — filled chips present now.
```bash
grep -nE '\.seg button\.on \{ color: var\(--void\); background: var\(--cyan\)|\.pill::before|background: rgba\(57,240,255,0.1\)' css/site.css
```
Expected (RED): `.seg button.on` filled, `.pill::before` fill, `.tag:hover` bg fill all present.

- [ ] **Step 2: `.seg button.on`** (filled → outline-active) — replace:
```css
.seg button.on { color: var(--void); background: var(--cyan); border-color: var(--cyan); }
```
with:
```css
.seg button.on { color: var(--cyan); background: transparent; border-color: var(--cyan); box-shadow: 0 0 14px rgba(57,240,255,0.22); }
```

- [ ] **Step 3: `.live-tag`** (add bracket-tag box) — replace:
```css
.live-tag { font-family: var(--font-mono); font-size: 10px; color: var(--amber);
  text-shadow: 0 0 10px rgba(255,158,44,0.7); display: inline-flex; align-items: center; gap: 5px; }
```
with:
```css
.live-tag { font-family: var(--font-mono); font-size: 10px; color: var(--amber);
  text-shadow: 0 0 10px rgba(255,158,44,0.7); display: inline-flex; align-items: center; gap: 5px;
  border: 1px solid var(--amber); border-radius: 2px; padding: 2px 7px; }
```

- [ ] **Step 4: `.tag:hover`** (drop fill) — replace:
```css
.tag:hover { background: rgba(57,240,255,0.1); border-color: var(--cyan); }
```
with:
```css
.tag:hover { border-color: var(--cyan); }
```

- [ ] **Step 5: `.pill`** (remove slide-up fill → outline-hover) — replace:
```css
.pill { font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.04em; color: var(--cyan);
  border: 1px solid var(--line); border-radius: 75px; padding: 11px 24px;
  transition: color .3s var(--ease-out), border-color .3s var(--ease-out), box-shadow .3s var(--ease-out);
  position: relative; overflow: hidden; cursor: none; }
.pill span { position: relative; z-index: 1; }
.pill::before { content: ''; position: absolute; inset: 0; background: var(--cyan);
  transform: translateY(101%); transition: transform .4s var(--ease-out); }
.pill:hover { color: var(--void); border-color: var(--cyan); box-shadow: 0 0 28px rgba(57,240,255,0.4); }
.pill:hover::before { transform: translateY(0); }
```
with:
```css
.pill { font-family: var(--font-mono); font-size: 13px; letter-spacing: 0.04em; color: var(--cyan);
  border: 1px solid var(--line); border-radius: 75px; padding: 11px 24px;
  transition: color .3s var(--ease-out), border-color .3s var(--ease-out), box-shadow .3s var(--ease-out);
  position: relative; cursor: none; }
.pill:hover { color: var(--cyan); border-color: var(--cyan); box-shadow: 0 0 28px rgba(57,240,255,0.4); }
```

- [ ] **Step 6: GREEN gate**
```bash
grep -nE '\.pill::before|background: rgba\(57,240,255,0.1\)|color: var\(--void\); background: var\(--cyan\)' css/site.css || echo "EMPTY ✓ — no fills"
grep -n 'border: 1px solid var(--amber); border-radius: 2px' css/site.css   # live-tag bracket-tag present
```
Expected: first grep EMPTY (no `.pill::before`, no `.tag:hover` fill, no filled `.seg button.on`); second grep → the `.live-tag` border line.

- [ ] **Step 7: Commit**
```bash
git add css/site.css
git commit -m "feat(sp5b): P4 fills->outlines — seg outline-active, live-tag bracket-tag, tag/pill outline-hover"
```

---

### Task 3: Cache-bust, browser eyeball, decision record

**Files:** Modify `index.html:13`; complete `docs/superpowers/specs/2026-07-07-sp5b-hud-discipline-design.md` §8.

- [ ] **Step 1: Bump version** — in `index.html:13` replace `css/site.css?v=3.9` with `css/site.css?v=3.10`.

- [ ] **Step 2: Scope gate (F)**
```bash
git diff --name-only 3db1477   # since the spec commit
```
Expected: `css/site.css` + `index.html` only; no `js/`.

- [ ] **Step 3: Eyeball (E)** — serve, hard-reload, look:
```bash
python3 -m http.server 8080 >/tmp/sp5b-server.log 2>&1 &
```
Confirm: section labels `[ 0N ]` + `.geo-kicker` + project/menu indices read **muted grey**, not amber; the deck's active segment (DECRYPT / EN) reads as a **cyan outline + glow**, clearly distinct from inactive; `LIVE` (Work section) is a **boxed amber tag** with its pulsing dot; contact **pills** hover as outline+glow (no fill sweep, text stays cyan); the only amber on screen is `LIVE` + the active nav `[ ]`. Globe/scene unchanged. `kill %1` when done.

- [ ] **Step 4: Decision record** — fill §8 with commits, gate A–G results, eyeball notes, any `--muted`→`--cyan` fallback or seg-glow tune.

- [ ] **Step 5: Commit**
```bash
git add index.html docs/superpowers/specs/2026-07-07-sp5b-hud-discipline-design.md
git commit -m "feat(sp5b): bump site.css?v 3.9->3.10 + acceptance record — SP5b COMPLETE"
```

---

## Self-Review

**Spec coverage** (§4 change set): P1 five demotes → Task 1 Steps 2-6 ✓; P4 four conversions (seg/live-tag/tag/pill) → Task 2 Steps 2-5 ✓; `?v` → Task 3 Step 1 ✓; P2/P7 no-change asserted by Global Constraints + gate F ✓. Gates A→T1S7, B/C/D→T2S6, E→T3S3, F→T3S2, G→T3S1/2. ✓

**Placeholder scan:** every step has exact before/after; §8 fill specified. ✓

**Type consistency:** no new identifiers; `--muted`/`--cyan`/`--amber` are existing tokens; the `.live-tag` border string in Task 2 Step 3 matches the gate in Step 6. ✓
