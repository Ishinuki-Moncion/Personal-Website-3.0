# v3.2 — Elevation campaign: law → subtract → truth → signature

**Date:** 2026-07-07. **Author:** Fable 5, from a 7-lane ultracode survey (85 findings: design corpus, research library, CSS/HTML craft, scene JS, a11y/content, live browser walk, history/ledger) + synthesis + adversarial critic.
**Owner decisions taken in brainstorm:** (1) pass is FULLY AUTONOMOUS — no owner-data dependencies; photo→city verification and per-project geo remain recorded debts; (2) contact email ships OBFUSCATED (JS-assembled, never in raw HTML source), click-to-copy; (3) bilingual verdict = FULL TRANSLATE of display headlines (Claude drafts JP, owner judges on screenshots); (4) shape = **Approach A: campaign with early exits** — four slices in risk order; each slice boundary is a shippable stopping point; (5) owner delegated per-section design approval ("approve yourself"); screenshot gates collected for end-of-pass review.
**Standing law (unchanged):** deep space black #05060a floor; scarcity — never add a layer without retiring one; amber is an event (~1–6% warm budget) except the kept amber-starfield signature; one signal per section-change; photos dim at rest / full on demand; no push/PR to main without owner sign-off.

---

## Slice 1 — LAW (do first; protects every later slice)

**1.1 v3.2 law addendum** (this doc's companion section, or standalone `…-v32-law-addendum.md`): re-true the corpus, which still legislates the rejected teal floor (design-language-v3 §6/§8; north-star line ~10). Record as law:
- Deep-black token family (`--void #05060a`, `--void-2 #080a10`, `--void-deep #030407`, panel bed `rgba(7,9,14,.92)`) — the floor.
- Amber starfield = owner signature exception to the warm budget.
- Photos dim-at-rest rule (brightness .62 / saturate .55 / contrast 1.05; full on hover/focus; lightbox full color).
- **Pinned negatives** (do-not-repropose): teal floor; all-cool starfield; uniform lift with tinted shadows; signal density regressions; perpetual arc re-arm; 5-label halo.
- **Closed deferrals** (moved from "deferred" to "closed", rationale kept): Motion L4 ghost-echo, L5 per-letter, L7 idle; hue-jump / glitch / CA-pulse; Composition L4 named-cells as built-things (Swiss third zone stays a composition guide, not a feature).
- **New rulings:** NO AUDIO, ever (recorded so it never resurfaces as an additive temptation). DELETE dead `SCENE_COLORS.alert` — the palette is cyan/amber, complete, by law (red-on-failure was considered and rejected as a third-hue palette-law change).

**1.2 Harness pins** in `tools/verify-site-hardening.js` (house rule: update checks with features, never delete):
- `--void: #05060a` present in site.css; no `#0a1416` floor tokens.
- `uTealAmt: 0.0` (or equivalent) in background.js grade pass.
- Photo rest-filter rule present in site.css.
- Amber starfield signature present (`fieldAmber` / owner-timeline colors).
- ESM chain intact (import-map + boot.mjs versioned) with **no reference to the dead global build**.

**1.3 Delete dead vendor:** `js/vendor/three.global.min.js` (651KB, unused — ESM chain is live; harness line ~11 still reads it → update that check in the same commit).

**1.4 Performance baseline (measured, recorded in the addendum):** payload census (js/vendor currently ~1.4MB incl. the dead file; gallery JPGs 113KB–949KB; confirm whether `shots/thumbs/` and `shots/tiles/` are actually referenced), plus a throttled-mobile load metric (Lighthouse or devtools trace at 390px: LCP, total transfer). Slice 4 re-measures against this.
**1.5 Frame-luminance histogram check (seed):** a small tool (screenshot → mean/percentile luminance + warm-pixel share) so slice-2/4 "net light drops" claims are provable. Research color-study [DATA] budgets are the reference targets.

## Slice 2 — SUBTRACT (blacker, quieter, crisper; zero new elements)

**2.1 Cluster the city lights** (globe brief lever 1, oldest unbuilt lever): `js/background.js` ~line 208 — replace `gcity[i] = Math.random() < 0.11` uniform freckle with coastline-weighted clustering (reuse computed `gedge` + a low-frequency cluster field). Lit night-side area target < ~5%. Re-weights existing particles only. **Bloom landmine rule:** any touched material gets a type-correct dark-swap (undefined-uniform class of bug bit twice: v31f slabs, v31g squares). Harness pin added.
**2.2 One instrument voice — retire Rajdhani:** `background.js` ~line 1151 is the single remaining Rajdhani draw; JetBrains Mono is already in its fallback stack. Swap the string; update harness check 19 (~lines 148–152) same commit; drop Rajdhani from the Google Fonts URL (index.html ~line 12). Eyeball the 26px scan-tag (JBM is narrower); **before/after screenshot → owner gate**.
**2.3 Finish calm-the-signals (scene leftovers outside story-system governance):**
- Delete the 40 static cyan streaks (duplicate the starfield's job).
- GridHelper permanent amber center lines → `0x10303a` family; wire grid opacity into sceneState (near-0 in gallery).
- Projects rain tint: key to entry beat (~2s decay) instead of section residency — the last "amber as wallpaper" leak.
- Delete dead `__scenePing` (zero callers since v31c) and the legacy barcode ticks.
**2.4 Black floor without bands:** ±0.5/255 hash dither in the final CA pass (deep-black gradients are the worst banding case); `samples = 4` (MSAA) on the high-tier composer targets — currently the best machines get the worst line quality while LITE renders cleaner; re-read `devicePixelRatio` in the debounced resize handler.

## Slice 3 — TRUTH (honesty, access, and the world beyond the viewport)

**3.1 Contact return path:** one instrument row under the Contact headline — `SIGNAL // <address>` in JetBrains Mono ledger grammar, address assembled by JS at runtime (obfuscated per owner; never in raw HTML), click-to-copy with confirm tick. ~10 lines CSS in the existing readout idiom; handler in app.js.
**3.2 Real EXIF:** extract actual camera metadata from `shots/` files (EXIF verified present in at least some) → bake per-photo `data-meta`; stripped files fall back to in-voice `EXIF//REDACTED`. Kill the universal fabricated "ƒ/2.8 · 1/250s". Derive lightbox meta + `alt`/`aria-label` from existing `data-title` (city labels unverified — recorded debt, not fabricated further).
**3.3 Keyboard/ARIA truth:** `visibility:hidden` + `inert` on closed lightbox and deck (~22 ghost tab stops inside `aria-hidden` containers); `tabindex="-1"` on the aria-hidden scroll-hud's live links; generalize the lightbox Tab trap to the mobile menu; deck: disclosure semantics instead of false `aria-modal`; add `:focus-visible` parity to every hover-only acquisition selector (`.shot`, `.row`, `.nav-link` brackets). **Tokenized z-ladder** (`--z-*` scale) fixing the confirmed boot-under-lightbox defect.
**3.4 lang truth + JP full-translate:** `lang="ja"` on JP fragments; dynamic toggle label semantics. Display headlines translate for real — drafts: Work → 「作品」, Through the lens → 「レンズ越しに」, Selected Work → 「代表作」 (Zen Kaku Gothic New, existing scale rules; final wording = **owner screenshot gate**).
**3.5 Beyond the viewport:**
- OG/Twitter/canonical meta + apple-touch-icon; **designed 1200×630 og-image** in the daikieOS grammar (composed as an HTML art-board, screenshotted, optimized).
- `404.html` — one self-contained file, "SIGNAL LOST // 404" frame + return path, inline critical styles, no JS dependency.
- `<noscript>` fallback + boot-chain resilience so one vendor 404 cannot brick the site behind a permanent black boot screen.
- Print stylesheet: hide canvas/scene, light-on-white ledger + contact.
- JSON-LD `ImageObject` for the gallery (photos are CSS backgrounds → invisible to image search; JSON-LD chosen over an `<img>` refactor as least-invasive; choice recorded).
- Fonts: self-host Latin woff2s (retires Google Fonts CDN dependency); Zen Kaku Gothic New self-hosted **only if** glyph-subsetting is practical (site JP glyph set is small and enumerable) — else it stays on CDN and the exception is recorded here.
**3.6 Instrument micro-fidelity (critic-scoped):** About stat `+` → muted unit span (births the sanctioned `.readout` pattern from the P3 deferral); `.lb-pos` compact `01/12`; minute-aligned JST callout redraw; decrypt-on-reveal placeholders **hero coordinates only**, one-time at boot (no idle loop; staggered = no signal storm).

## Slice 4 — SIGNATURE (highest risk last, behind pinned harness + histogram tool)

**4.1 Rain only where there is light** (rain brief Lever A — the one never-executed research surface): a few screen-space falloff light-wells at projected emitter positions (Tokyo halo, place nodes, lightning reach), evaluated per plane not per drop; terminal opacity = `baseOp × vis × beat × motivation`. Retires the flat per-section veil — rain becomes spatial. Fold in the recorded one-liner: `drawDrop` lens sample through `ctx.filter saturate(~0.5) brightness(~0.9)` (worn-glass beads). LITE degradation branch required. **Hard constraint: net frame luminance DROPS, proven by the 1.5 histogram tool.** Bloom dark-swap rule applies. Levers B/C/G (reflections, splashes, mist) stay deferred.
**4.2 Guarantee the beat:** eased focus-bias on `spin.rotation.y` during the storyCooldown window so the focused place faces camera when its beat fires — **subliminal-slow constraint explicit: no perceptible lurch; the boxed state-word remains the section's one signal.** About's Tokyo beat keys to arc arrival (`arcN >= ARC_SEG`) instead of the desynced ~650ms timer; the downlink beat REPLACES the duplicated lockT beat (setTimeout plumbing deleted).
**4.3 The globe survives the phone:** aspect-aware composition branch below ~700px (smaller sphere high behind the name or FOV/offset shift) so sphere + Tokyo callout are in-frame at 390px — **with luminance-under-text discipline designed in** (dim or offset the sphere region under the name; do not recreate the bright-globe-under-text defect). Touch photo parity: on coarse pointers the tile nearest viewport center gets the existing focus grade — one tile at a time (one-signal rule). Perf re-measure vs 1.4 baseline; LITE path honored.
**4.4 Lightbox = the one light event:** surround scrim sinks toward true black (darker than today) — ships. Photo ambient halo (average-color DOM glow) — **owner screenshot gate only, with histogram-proven net-luminance-down; this is the pass's only new-emissive-layer candidate.** Fix confirmed thumb-strip clipping (`justify-content:center` + `overflow-x:auto` clips leading thumbs < ~800px → safe-center pattern). Optional view-transition morph as progressive enhancement (fade fallback).
**4.5 Ledger composition truing (clean halves ship; rail gated):** Work section — globe eases left/deeper when `focus='work'` (reuse About portrait-dim move) so text never sits on bright sphere; About — reclaim ~200px dead void. The per-row stack rail (L3 fragment) is **gated**: build the minimal typographic version (aligned column, NO drawn rail) as an A/B screenshot vs none; the L3 deferral's own over-framing warning stands.

## Screenshot-gate pile (end-of-pass owner review, one session)
1. Scan-tag: Rajdhani (before) vs JetBrains Mono (after). 2. Photo halo on/off (with luminance numbers). 3. Stack rail: minimal typographic vs none. 4. Gallery feature tile 8:5 vs ~2.2:1 anamorphic + last-tile span-2 bookend keep/drop. 5. JP headline wording. 6. Anything an implementer flags as taste-ambiguous during the pass.

## Verification (house QA-PROTOCOL, per slice)
`node --check` background.js/effects.js/app.js; `node tools/verify-site-hardening.js` — all checks green including new pins (update-with-feature, never delete); live hard-reload with bumped `?v=` at 1440×900 AND 390×844, zero console errors; reduced-motion still static; per-slice section screenshots archived for the gate review; slice 4 re-runs the perf + histogram measurements against slice-1 baselines.

## Commit plan
One commit per move: `feat(v32a)` law addendum + harness pins + vendor delete + baselines; `feat(v32b)` city clustering; `feat(v32c)` Rajdhani retirement; `feat(v32d)` calm-the-signals leftovers; `feat(v32e)` dither/MSAA/DPR; `feat(v32f)` contact row; `feat(v32g)` EXIF truth; `feat(v32h)` keyboard/ARIA + z-ladder; `feat(v32i)` lang + JP headlines; `feat(v32j)` beyond-the-viewport (meta/og/404/noscript/print/JSON-LD/fonts); `feat(v32k)` micro-fidelity; `feat(v32l)` rain lever A; `feat(v32m)` story beats; `feat(v32n)` mobile globe + touch parity; `feat(v32o)` lightbox + ledger truing. Co-author trailer per house style. Cache-bust `?v=` with each user-facing slice. **No push, no PR to main, until owner signs off on the gate pile.**

## Recorded debts & exclusions (unchanged by this pass)
Photo→city label verification + per-project geo/districts (owner-data; the SP3 interrogation path stays content-starved for projects); GALLERY_PLACES placeholder coords; rain levers B/C/G; photo halo & stack rail if gates reject; `<img>` gallery refactor (JSON-LD chosen instead); Zen Kaku self-host if subsetting impractical.
