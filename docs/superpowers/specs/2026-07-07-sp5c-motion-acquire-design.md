# SP5c — Motion: the acquiring reticle (+ readout boot-up) (Design)

**Date:** 2026-07-07 · **Branch:** `v3-build` · **Program:** SP5, slice c (Motion)
**Source brief:** `docs/superpowers/specs/2026-07-03-motion-elevation-brief.md` · **Rules:** `design-language-v3` §4 (Motion) + §0. Follows [[SP5a color]], [[SP5b HUD discipline]].

---

## §0 — Context & scope

Motion is 5 new "beats" + a governing law. This slice = the two highest-payoff, lowest-risk beats, tight and safe (first slice to touch behaviour, and cost is high this session):

- **L2 — Acquiring reticle** (the signature motion beat; turns out to be **CSS**, since `cursor.js` only toggles classes and the visual response lives on `.cursor-ring`).
- **L6 — Readout boots from a placeholder** (turns out to be a pure **HTML** text change — see §3).

Governed by **L1 (animate the focus only)** — both beats attach to the one thing that changed (the hovered target / the revealed readout); the field stays still.

**Deferred to a Motion-2 slice:** L3 boxed state-word on section lock (new DOM element + `effects.js` hook — the next-biggest beat), L4 chromatic ghost-echo, L5 per-letter stagger, L7 idle-jitter.

## §1 — Current state (audited 2026-07-07)

- **Cursor** (`css/site.css:144-166`): `.cursor` positioned by `cursor.js` (0.18 lerp), `mix-blend:difference`. On `.is-hot` the ring **grows** 34→**56px** and turns **amber**, with amber corner ticks appearing at the *outer* box corners (`:157-164`). `.is-down` clamps `scale(0.8)` (`:166`). `.is-text` = thin cyan I-beam (`:165`). `.cursor-label` = amber, `data-cursor` text (`:167-174`). `cursor.js:4` early-returns on coarse pointers (no cursor on touch).
- **Counter** (`js/effects.js:57-68` `runCounter`): counts `[data-count]` `0→target` over 1400 ms, cubic ease-out, on reveal (`:79`, at `vh*0.85`); respects `reduced` (`:60` → sets target immediately). Markup `index.html:136`: `<span data-count="100" data-suffix="+" aria-hidden="true">0+</span><span class="sr-only">100+</span>` — the visible span initialises at **`0+`**. It is the **only** `[data-count]` on the site. (The clock already boots from `JST --:--:--`; the boot bar already ramps `000→100` — so "powering on" is otherwise already present.)

## §2 — Target intent (motion brief §4 + §0)

The cursor's native metaphor is an *acquiring reticle* — on hover it tightens/snaps (ring clamps, ticks inset), it does not merely recolor (ref: motion/002). Numeric readouts boot from a placeholder (`88`/`--`) so first read is "powering on," not "empty" (ref: motion/016). Ration motion to the focus (L1).

## §3 — Decisions (owner-approved scope, 2026-07-07)

1. **L2 target = tighten + cyan + inset ticks.** The current "grow + amber" is the opposite of acquire, and amber-on-every-hover is the biggest remaining accent-budget violation (SP5b deferred the cursor to "motion scope" — this slice owns it). Demote the ring **amber→cyan** (one-ink, per SP5a/b), make `.is-hot` **tighten** (34→~28px) with the corner ticks snapping **inward** (lock-on) in cyan; keep the `.is-down` clamp; keep `.cursor-label` **amber** (the one transient action-signal in the acquire). Exact geometry tuned in-browser. *(Reversible if the amber ring is preferred — recorded.)*
2. **L6 = HTML-only.** With a single `[data-count]`, seed the placeholder by changing the visible span's initial text `0+`→`88+`; the `.sr-only` "100+" (screen-reader value) is unchanged. On reveal, `runCounter` resolves it (counts `0→100`). No JS change, no `V.fx` bump — lowest risk.

## §4 — Concrete change set

**L2 — `css/site.css:157-164`** (redesign `.is-hot`; leave `.is-text :165` and `.is-down :166` as-is):
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
(34→28 tighten; amber→cyan; ticks 7→8px and inset `-1px`→`+2px` so they snap *inward*.)

**L6 — `index.html:136`**: change the visible counter span's text `0+` → `88+`:
```html
<span data-count="100" data-suffix="+" aria-hidden="true">88+</span>
```

**Version:** `index.html` `site.css?v=3.10` → `?v=3.11`. (No JS touched → `V.fx`/`boot.mjs` unchanged.)

## §5 — Acquire, and the focus-only law

Both beats obey L1: the acquire attaches to the hovered target (one reticle), the boot-up to the revealed readout — nothing new idles or animates the field. Reduced-motion: the cursor is hover-only (`cursor.js:4` returns on coarse pointers, and reduced users don't get pointer-hover motion beyond the existing lerp — unchanged); the `88` placeholder is **static text** (no animation), and `runCounter` already honors `reduced` (`:60`). No new motion runs under `prefers-reduced-motion`.

## §6 — Acceptance criteria & verify

No JS/CSS test runner → grep-gates + browser eyeball + diff-scope.

- **A · cursor acquires in cyan, not amber.** `.cursor.is-hot .cursor-ring` sets `border-color: var(--cyan)` and width `28px` (not `56px`/`--amber`); the is-hot tick rules are `var(--cyan)`. `grep`-confirm no `--amber` remains in the `.cursor.is-hot` block.
- **B · label still amber.** `.cursor-label` (`:170`) unchanged (`var(--amber)`).
- **C · readout placeholder.** `index.html:136` visible span reads `88+`; `.sr-only` still `100+`.
- **D · eyeball (browser).** Hover a link/button → the reticle **tightens to a cyan lock-on with inset corner ticks** (not an amber grow); press → clamps further; the data-cursor **label stays amber**. The About stat shows **`88+`** at rest and **counts up to `100+`** when scrolled into view. Field otherwise still. Globe/scene unchanged.
- **E · scope.** `git diff --name-only` = `css/site.css` + `index.html` only; **no `js/`**.
- **F · cache-bust.** `site.css?v=3.11`.

## §7 — Out of scope / risks

**Out of scope:** L3/L4/L5/L7 (Motion-2); any `js/*` change; the `.cursor-label` hue; touch cursors (`cursor.js:4` already opts them out).

**Risks:**
- **Acquire reads too subtle (28px vs 34px resting).** The tighten is small; the *inset cyan ticks* carry most of the "lock-on" read — verify in-browser and enlarge the tighten / ticks if weak (gate D). Geometry is tune-by-eye.
- **`mix-blend:difference` on `.cursor`** (`:145`, kept per SP5b P7): cyan ring under difference stays visible on the dark field and inverts over bright media — same as before the hue change; no new issue, but confirm the cyan reticle reads on a gallery photo during the eyeball.
- **`88+`→count start at `0+`.** On reveal `runCounter`'s first frame shows `0+` before counting up — a one-frame "reset" that reads as the readout resolving; acceptable and idiomatic (instrument self-test → read). Not a bug.

## §8 — Decision record

*(to be completed on build)* — commits, gate A–F results, eyeball notes, any cursor-geometry tune.
