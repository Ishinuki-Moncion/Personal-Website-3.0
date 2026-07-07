# SP5b — HUD: outline & accent discipline (Design)

**Date:** 2026-07-07 · **Branch:** `v3-build` · **Program:** SP5 (cross-site v3 grading / motion), slice b
**Source brief:** `docs/superpowers/specs/2026-07-03-hud-elevation-brief.md` · **Rules:** `design-language-v3` §3 (HUD & Chrome) + §0 Spine laws 2/5/6 · Follows [[SP5a color]].

---

## §0 — Context & scope

SP5b is the second SP5 slice. HUD is the largest brief (8 P-levers + 2 secondary), so it is itself decomposed. **This slice = the outline & accent discipline: P1 + P2 + P4 + P7** — "one crisp instrument: amber only means live, brackets imply, outlines signal, nothing persistent fills." Owner-delegated decisions (2026-07-07, auto-approval).

**Deferred to later HUD sub-slices** (out of scope here): P3 label+value+unit triad, P6 slashed numerals, and the Type brief's `.readout` pattern (one "numerals & readouts" slice, has its own font-feature `zero` support dependency); P5 graticule substrate (brief's own "highest-risk add"); P8 worn-hardware deck/lb-stage (substantial rework); the secondary reticle/void levers (reticle overlaps the Motion slice's `cursor.js`).

## §1 — Current state (audited 2026-07-07, post-SP5a; lines shifted ~−1/−2 from the brief)

**P1 · structural amber (to demote):**
- `.mm-idx` `:318` — `color: var(--amber)` (mobile-menu list ordinal)
- `.sec-label .idx` `:366` — `color: var(--amber)` + `text-shadow` amber glow (section `[ 01 ]` ordinal)
- `.geo-kicker` `:474` — amber kicker label ("ROUTE // PERSONAL VECTOR")
- `.proj-idx` `:532` — `color: var(--amber)` (project list ordinal)
- `.deck h4::before` `:646` — `content:'◆'; color: var(--amber)` (deck header bullet)

**P1-keep (genuine state, stays amber):** `.live-tag` `:522`, `.nav-link.active` brackets `.nav-link::before/::after` `:251`/`:253` (amber `[ ]`, opacity-revealed on `:hover`/`.active` `:255-257`).

**P2 · boxes:**
- `.lb-corner` `:589` — **already L-brackets.** CSS `border: 1px solid var(--line-strong)`, markup `index.html:293-296` strips two borders per corner inline (`border-right:0;border-bottom:0` etc). The brief's "closed 30px box ×4" is stale. **No work.**
- `.shot` `:562` — `border: 1px solid var(--line)` (faint gallery-tile frame). `.tag` `:539` — `border: 1px solid var(--line)` (faint skill-tag). Both faint, not heavy boxes; kept (composition brief treats the gallery as a deliberate gridded field).

**P4 · fills:**
- `.seg button.on` `:656` — `color: var(--void); background: var(--cyan); border-color: var(--cyan)` — **filled cyan state chip** (deck DECRYPT/RISE/GLITCH + EN/日本語 toggles).
- `.live-tag` `:522-524` — amber text + pulsing `.dot`, **no box** (markup `index.html:161`: `<span class="live-tag"><span class="dot"></span>LIVE</span>`).
- `.tag:hover` `:542` — `background: rgba(57,240,255,0.1)` (transient cyan fill).
- `.pill` `:615-623` — cyan slide-up fill via `::before` + `.pill:hover { color: var(--void) }` (text inverts onto the fill); 3 social links, `index.html:276-278`.

**P7 · projection/blend:** `mix-blend-mode: difference` on `.cursor` `:145` and `.scroll-hud` `:341`. (`.about-portrait .duo :487` is `mix-blend-mode: color` — SP5a's, not chrome.)

## §2 — Target intent (HUD brief §3 + §0)

One ink (cyan), one accent (amber) reserved for asserted/live state only; imply frames with brackets, never close the box; assert state with an outline tag, never a filled chip; keep projection texture on the content layer, chrome crisp. The elevation is *discipline*, not a rebuild.

## §3 — Decisions (owner-delegated, 2026-07-07)

1. **P1 demote target = `--muted`** (not `--cyan`). The five marks are subordinate ordinals/kicker/bullet — labels, not values. `--muted` matches the site's muted-label/cyan-value convention (`.stat .l`), preserves luminance hierarchy (adds no new bright cyan competitor), and maximises amber rarity. Drop the amber `text-shadow` on `.sec-label .idx`. *(Fallback if any mark reads dead on-device: `--cyan`. Recorded, not expected.)*
2. **P2 = no forced change.** `.lb-corner` already L-brackets; `.shot`/`.tag` faint frames kept deliberately. Documented so a later pass doesn't "fix" a non-problem.
3. **P4 = convert the two persistent-state fills + both transient hover-fills to outlines**, for a consistent "no fills" instrument read: `.seg button.on` → outline-active; `.live-tag` → amber bracket-tag; `.tag:hover` → border-brighten; `.pill` → outline-hover (remove slide-up fill, text stays cyan).
4. **P7 = keep `difference`.** It is load-bearing — it keeps the reticle/rail visible across both the near-black field and bright media. Converting to crisp-cyan+shadow risks legibility regressions for no discipline gain in this slice. Guard-rail only: do not add new `difference` to chrome; revisit only if the eyeball shows inversion harm.

## §4 — Concrete change set

CSS-only (`css/site.css`) + a `?v` bump (`index.html`). No markup changes (the `.live-tag` box is pure CSS on the existing span).

**P1 — demote structural amber → `--muted` (5 edits):**
- `.mm-idx` `:318` `color: var(--amber)` → `var(--muted)`.
- `.sec-label .idx` `:366` `color: var(--amber); text-shadow: 0 0 10px rgba(255,158,44,.5)` → `color: var(--muted); text-shadow: none`.
- `.geo-kicker` `:474` amber `color` → `var(--muted)` (confirm exact prop at build).
- `.proj-idx` `:532` `color: var(--amber)` → `var(--muted)`.
- `.deck h4::before` `:646` `color: var(--amber)` → `var(--muted)`.

**P4 — fills → outlines (4 edits):**
- `.seg button.on` `:656` `color: var(--void); background: var(--cyan); border-color: var(--cyan)` → `color: var(--cyan); background: transparent; border-color: var(--cyan)` (active reads as a bright cyan outline vs the faint inactive border; add a faint `box-shadow` cyan glow if active/inactive contrast is weak — decide at build against the inactive `.seg button` base).
- `.live-tag` `:522` → add `border: 1px solid var(--amber); border-radius: 2px; padding: 2px 7px`, transparent bg; keep the pulsing `.dot` + `LIVE`. The **outline** now carries the live state (amber is correct here).
- `.tag:hover` `:542` — remove `background: rgba(57,240,255,0.1)`; keep `border-color: var(--cyan)` (border-brighten only).
- `.pill` `:615-623` — remove `.pill::before` and `.pill:hover::before`; change `.pill:hover { color: var(--void) }` → `color: var(--cyan)` (stays cyan; keep `border-color: var(--cyan)` + the box-shadow glow); drop the now-unneeded `overflow: hidden` and `.pill span { z-index }` scaffolding.

**Version:** `index.html` `site.css?v=3.9` → `?v=3.10`.

## §5 — Accent-budget continuity

This slice finishes what SP5a's color budget started: after P1, the only amber on the site is asserted state — `.live-tag` (now boxed) + `.nav-link.active` `[ ]` brackets + the deliberate hero `.amberline`/glitch drop-shadows (`:411`/`:418`/`:420`, decorative signal marks, out of scope) + the `--amber`/`--bloom-amber` token defs. No structural/ordinal amber remains.

## §6 — Acceptance criteria & verify

No CSS test runner (SP1–SP5a method) → **grep-gates + browser eyeball + diff-scope**.

- **A · structural amber demoted.** `grep -nE 'color: var\(--amber\)' css/site.css` → matches only `.live-tag` (and any genuine-state mark); the 5 demoted selectors no longer resolve to `--amber`. `.sec-label .idx` carries no amber `text-shadow`.
- **B · no filled state chip.** `.seg button.on` has `background: transparent` (no `background: var(--cyan)`); grep confirms.
- **C · live-tag is a bracket-tag.** `.live-tag` block contains `border: 1px solid var(--amber)`.
- **D · pill outline-only.** No `.pill::before`; `.pill:hover` no longer sets `color: var(--void)`.
- **E · eyeball (browser).** Section labels/kickers/indices read cyan-muted, not amber; the deck's active segment reads as a cyan **outline** (distinct from inactive); `LIVE` is a boxed amber tag with its pulsing dot; social pills hover as outline+glow (no fill sweep); the only amber left on screen is `LIVE` + the active nav `[ ]`. Globe/scene unchanged.
- **F · scope.** `git diff --name-only` = `css/site.css` + `index.html` only; no `js/`.
- **G · cache-bust.** `site.css?v=3.10`.

## §7 — Out of scope / risks

**Out of scope:** P3/P6/Type readouts, P5 graticule, P8 worn-hardware, secondary reticle/void (all later slices); `js/*` (motion/cursor is the Motion slice); the amber hue itself.

**Risks:**
- **`--muted` too quiet (P1).** Ordinals may read dead on some displays — eyeball gate E; fallback `--cyan` recorded. Do not let the demotion make section labels illegible.
- **seg active/inactive contrast (P4).** Outline-active must stay clearly distinct from the faint inactive border — check the inactive `.seg button` base at build; add a faint cyan glow if needed.
- **pill hover feel (P4).** Removing the slide-up fill changes a polished affordance; the replacement (border-brighten + existing glow, text stays cyan) must still read as a clear hover — eyeball.
- **Reduced-motion / a11y preserved.** `.live-tag` dot pulse already respects the site's reduced-motion; the border add is static. `:focus-visible` and `.sr-only` semantics untouched.

## §8 — Decision record — SP5b COMPLETE (2026-07-07)

Built inline via executing-plans. **3 feature commits on `v3-build`:**
- `4acc727` — Task 1 (P1): demote 5 structural-amber marks → `--muted` (`.mm-idx`, `.sec-label .idx` +dropped its amber glow, `.geo-kicker`, `.proj-idx`, `.deck h4::before`).
- `d163244` — Task 2 (P4): `.seg button.on` filled-cyan → outline-active (cyan border + text + `0 0 14px` glow); `.live-tag` → amber bracket-tag (`border:1px solid var(--amber); border-radius:2px; padding:2px 7px`); `.tag:hover` fill dropped → border-brighten; `.pill` slide-up fill removed → outline-hover (text stays cyan; dead `::before`/`overflow`/`.pill span` scaffolding removed).
- *(this commit)* — Task 3: `site.css?v` 3.9→3.10 + this record.

**Gates A–G all PASS.**
- **A** — the 5 targeted marks no longer resolve to `--amber`; `.sec-label .idx` glow (`rgba(255,158,44,0.5)`) gone.
- **B** — no filled chip (`.seg button.on { … background: var(--cyan) }`, `.pill::before`, `.tag:hover` fill all absent). **C** — `.live-tag` carries `border: 1px solid var(--amber)`. **D** — no `.pill::before`; `.pill:hover` no longer sets `color: var(--void)`.
- **E** (browser, `localhost:8080`, `?v=3.10`) — Work section: `[ 02 ]` reads **muted grey**, `LIVE` is a **boxed amber bracket-tag** with pulsing dot, tags are cyan outlines. Deck: `◆` **muted**; active `DECRYPT`/`EN` read as **lit cyan outlines + glow**, clearly distinct from faint inactive; no filled chips. Only on-screen amber = `LIVE` + active-nav `[ WORK ]`. Globe/scene unchanged. Pills verified by code (fill removed, hover→cyan+glow) + parity with the confirmed seg pattern.
- **F** — code scope = `css/site.css` + `index.html` only (no `js/`). **G** — `site.css?v=3.10`.

**No fallback needed:** `--muted` reads clearly on-device (section ordinals stay legible, subordinate to the cyan name); the `0 0 14px rgba(57,240,255,0.22)` seg-glow gives enough active/inactive contrast — no tune applied.

**Additional amber found, deliberately LEFT (out of this slice's P1 scope, recorded for a future pass):** `.amber` utility `:69`; cursor hot-state (`:157/161/170` — Motion slice owns `cursor.js`); boot `.warn` `:214` (boot state); `.mm-close:hover`/`.lb-close:hover` `:305/:595` (close-affordance hovers); `.scroll-hud .tick` amber→cyan gradient `:354` (progress-rail — arguably structural, candidate for a later demote); `.sys-online` `:443` ("● SYS//ONLINE" status — kept as a live-status assertion); `.glitch.fire::after` `:452` (decorative hero glitch). None is a structural *ordinal*; all are state/affordance/decorative or owned by another slice.

**NEXT SP5 slices:** HUD sub-slices still open — **numerals & readouts + Type** (P3+P6+`.readout`, has font-feature `zero` dependency), **P5 graticule**, **P8 worn-hardware**; plus **Motion** and **Composition** briefs. Owner picks order. Still nothing pushed to origin.
