# Animation Framework Options — Research (2026-07-10)

Owner ask: *"explore frameworks like anime.js and GSAP to improve flow and animations."*
Scope: honest evaluation of GSAP 3.15 / anime.js 4.5 / Motion 12 / native platform
against THIS site's bespoke rAF motion system. Research only — no code changed.

Tier tags follow the library convention: **[DATA]** = self-measured here,
**[EXTRACTED]** = published in a primary source (quoted/linked), **[WORKING]** = my
inference from a code read, not yet profiled live.

---

## 0. Executive answer

**The reported scroll-globe jank is not a missing framework — it is a missing
low-pass filter on `scrollN` inside the scene loop the site already owns.**
ScrollTrigger's celebrated `scrub: 1` behaviour *is* that filter; the site's own
loop already applies the identical one-pole ease to nine other state channels
(`sceneState.halo/rain/labels/...` at `background.js:2055-2063`) — just not to the
three scroll-coupled camera/spin channels. Adopting a 46 KB-gz framework to obtain
a 4-line filter would be an integration mismatch: a WebGL scene driven by its own
dt-clocked rAF loop can only ever consume a framework's scroll machinery as a
smoothed scalar provider.

Where a framework *would* genuinely help is not the globe but the **DOM
choreography layer** (`app.js`): the hero entrance is a web of `setTimeout`s with
three hand-built safety nets that exist only because bespoke timing has no
lifecycle semantics. That is a real, bounded win — and anime.js v4 (import-map
native, single 29 KB-gz self-hostable ESM file, manual-tick engine) fits this
site's no-bundler ESM architecture strictly better than GSAP (whose ESM files
ship unminified — the practical no-bundler GSAP is UMD globals, ~109 KB gz if you
self-host its ESM source instead).

Recommendation: **fix the jank bespoke (small), take CSS scroll-driven animations
as progressive enhancement (small), and only revisit anime.js if the owner still
wants richer choreography after feeling the fixed version.** Details in §5–6.

---

## 1. What the site's motion system actually is — code inventory [DATA]

Read in full: `js/effects.js` (193 ln), `js/app.js` (494 ln), `js/background.js`
(2 203 ln, scroll/scene portions), `index.html` import map.

| Subsystem | File | Mechanism | Clock |
|---|---|---|---|
| Scene loop (globe, rain, camera, stories) | `background.js:2038-2187` | always-on rAF, dt-clamped (`min(dt, 0.033)`), visibility-guarded re-entry | **its own rAF chain** |
| Scroll frame (reveals, parallax, nav, section detect, state-word) | `effects.js:117-155` | scroll-event → rAF-throttled `frame()` | on-demand rAF |
| Hero entrance (3 variants), typewriter, lang swap | `app.js:45-110` | `setTimeout` ladders (`li*230`, `700`, settle at `2800`) + `setInterval` (26 ms typewriter) | wall clock |
| `window.scramble` text decrypt | `effects.js:25-51` | per-call rAF chain + token guard + wall-clock settle fallback | one-shot rAF |
| Counters | `effects.js:77-88` | one-shot rAF chain, hand-rolled cubic ease-out | one-shot rAF |
| Tile upgrades / touch-lit tile | `app.js:185-236` | scroll-event → rAF-throttled rect checks | on-demand rAF |
| Reveals / stagger / state-word visuals | `css/site.css` | CSS transitions + class adds (incl. the `void offsetWidth` reflow-restart hack, `effects.js:16`) | compositor |
| Lightbox morph | `app.js:289-305` | **View Transitions API** (already native) | compositor |

Total site-authored JS: **~53 KB gz** (background 39.5 + app 7.4 + effects 3.4 +
boot 1.8 + cursor 0.9). Three.js r158 module: **161 KB gz**. Zero animation
dependencies. Vendor pattern: self-hosted ESM + import map + es-module-shims
(`index.html:398-405`).

Interpolation vocabulary in use: one-pole lerps (`x += (target-x)*k*f`),
smoothstep, cubic ease-out, and the CSS custom eases (`--ease-out`, `--ease-io`).
The scene's section stories are *state-target* driven (set target, loop eases
toward it) — this is a **continuous dynamics model, not a tween model**. That
distinction matters for everything below: tween libraries animate *from A to B
over a duration*; this scene has no durations, it has attractors. Frameworks are
grammatically wrong for its core.

## 2. Root cause of the scroll-globe jank [WORKING — code read, not yet profiled]

The scene loop consumes `scrollN = scrollY / maxScroll` **raw** in some channels
and **smoothed** in others, in the same composite:

| Channel | Line | Coupling |
|---|---|---|
| Globe spin | `background.js:2097` | `spinBase = t*0.22 + scrollN*2.4` — **raw, instant** |
| Camera dolly | `:2181` | `camera.position.z = 10 - scrollN*4 - …` — **raw, instant** |
| Look-at target | `:2182` | `camera.lookAt(0, scrollN*1.5, 0)` — **raw, instant** |
| Grid streaming | `:2091` | `(t*6 + scrollN*70) % 4` — **raw**, and ×70 gain |
| Camera height | `:2180` | `+= (… + scrollN*3 … - y) * 0.04` — **smoothed**, τ≈0.4 s |

Arithmetic: on a typical desktop page (maxScroll ≈ 6 000 px) one non-animated
scroll step (Safari wheel notch, scrollbar drag, PageDown ≈ 120–900 px) moves
`scrollN` by 0.02–0.15 **in a single frame** → the globe snaps up to
2.4×0.15 ≈ 0.36 rad (≈ 20°), the dolly snaps 0.6 units, the grid phase jumps —
while `camera.position.y` lags behind at 0.04/frame. Three channels snap, one
lags: the composite **shears**, which reads as jank. (The code comment at
`:2095-2096` says "ABSOLUTE so smooth-scroll can't make it jumpy" — absolute
phase is right, but absolute does not require unfiltered.)

**The fix is the idiom the same function already uses nine times**
(`:2055-2063`): keep one `smoothScrollN` state, ease it toward `scrollN` each
frame (`+= (scrollN - smoothScrollN) * min(1, 0.1*f)` — tune 0.08–0.14 ≈
ScrollTrigger `scrub: 0.5–1`), and feed the four raw channels from it. ~4 lines,
0 bytes of dependency, and by construction it cannot violate the one-signal law
(it changes no signal count, only removes discontinuities). `effects.js`'s DOM
side needs nothing: reveals/nav are threshold events, and the CSS-transition
parallax elements are already compositor-smoothed.

This is exactly what ScrollTrigger's `scrub: <seconds>` does — "softens the link
between the animation and the scrollbar so that it takes ~1 second to catch up"
**[EXTRACTED]** ([ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)).
For a full-viewport fixed-canvas scene there is nothing else of ScrollTrigger's
feature set (DOM pinning, enter/leave toggles, batch) that the site's design
uses: the honest trade is **46 KB gz for a filter the codebase already knows how
to write**.

## 3. Candidates — 2026 state

### 3.1 GSAP 3.15 (current npm `latest` 3.15.0 [DATA])

- **Licensing — resolved.** Webflow acquired GreenSock (Oct 2024); since GSAP
  3.13 (Apr 2025) the entire library **including every formerly-paid Club plugin
  (ScrollTrigger, ScrollSmoother, SplitText, ScrambleText, MorphSVG…) is 100 %
  free, commercial use included** [EXTRACTED]
  ([Webflow announcement](https://webflow.com/updates/gsap-becomes-free),
  [gsap.com/pricing](https://gsap.com/pricing/),
  [GSAP GitHub](https://github.com/greensock/GSAP)). The 3.15 file headers say
  "Subject to the terms at https://gsap.com/standard-license" — standard license,
  no charge [DATA — read from the 3.15.0 dist header].
- **Size [DATA, measured from jsDelivr + gzip -9]:**
  - UMD minified dist: core **28.3 KB gz** (72.9 raw), ScrollTrigger **18.0 KB gz**
    (44.6 raw), ScrollSmoother 5.5 KB gz. Core+ST = **46.3 KB gz ≈ 87 % of the
    site's entire authored JS**.
  - ESM without a bundler: GSAP's npm ESM files are extension-full relative
    imports (`import … from "./gsap-core.js"`) so they *do* work via import map
    [DATA — inspected `index.js`/`ScrollTrigger.js` 3.15.0] — **but they ship
    unminified**: core+CSSPlugin ≈ 69 KB gz, +ScrollTrigger+Observer ≈ 109 KB gz
    total [DATA]. So the no-bundler menu is: (a) UMD globals via classic
    `<script>` — breaks the site's ESM discipline; (b) self-hosted unminified ESM
    — 2.4× the payload; (c) minify it yourself — a build step, which the
    architecture forbids; (d) a third-party ESM CDN (esm.sh) — a runtime
    dependency on someone else's infrastructure for a GitHub Pages site. None is
    clean. **This is GSAP's real cost here, more than the license ever was.**
- **ScrollTrigger for the scroll-globe:** for a fixed canvas you'd create one
  dummy trigger spanning the page with `scrub: 1` and read `self.progress` in
  `onUpdate` → store a scalar → the Three loop consumes it. Codrops' 2025-26
  Three.js+GSAP tutorials use exactly this shape, and the ecosystem answer to
  "who renders" is *GSAP's ticker drives everything* — Lenis + ScrollTrigger +
  `renderer.render` all inside `gsap.ticker.add(...)` with `lagSmoothing(0)`
  [EXTRACTED] ([Codrops cinematic 3D scroll, Nov 2025](https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/),
  [Codrops WebGL gallery, Feb 2026](https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/),
  [GSAP forum: ScrollTrigger and ThreeJS](https://gsap.com/community/forums/topic/25016-scrolltrigger-and-threejs/)).
  I.e. adopting ScrollTrigger *properly* means re-parenting the scene loop under
  GSAP's clock — see §4c.
- **ScrollSmoother — recommend against regardless.** It re-parents page content
  into a transformed wrapper; `position: fixed` elements stop being
  viewport-relative (the site's nav, scroll-HUD, state-word, lightbox, and the
  canvas itself are all fixed) [EXTRACTED]
  ([GSAP ScrollSmoother docs](https://gsap.com/docs/v3/Plugins/ScrollSmoother/),
  [fixed-positioning pain writeup](https://medium.com/@terencegrover/smooth-scrolling-with-gsap-overcoming-fixed-positioning-challenges-dbce33b08d49),
  [GSAP forum mobile issues](https://gsap.com/community/forums/topic/44902-unique-problems-with-scrollsmoother-on-mobile/)).
  Smooth-scroll in general degrades AT/keyboard predictability
  ([SitePoint on scrolljacking](https://www.sitepoint.com/scrolljacking-accessibility/));
  the same reasoning applies to Lenis (5.3 KB gz [DATA]) — noted because every
  2026 GSAP-scroll tutorial assumes it, and rejected for the same fixed-element
  and input-integrity reasons.
- **Overlap bonus:** ScrambleTextPlugin (now free) is functionally the site's
  `window.scramble`; SplitText matches the hero per-char stagger. Adopting GSAP
  without retiring those ~90 bespoke lines would violate the retire-one law.

### 3.2 anime.js v4 (current npm `latest` 4.5.0 [DATA])

- **v4 (Mar 2025 rewrite) is ESM-first and — uniquely among the three — documents
  the no-bundler import-map path as a first-class install**: the official docs
  publish an `importmap` block mapping `animejs` and 15 subpaths to
  `dist/modules/*` files [EXTRACTED]
  ([anime.js module imports docs](https://animejs.com/documentation/getting-started/module-imports/),
  [v4.0.0 release](https://github.com/juliangarnier/anime/releases/tag/v4.0.0)).
- **Size [DATA]:** single self-hostable minified ESM `lib/anime.esm.min.js` =
  **29.1 KB gz** (84 raw). The "10 KB core / 3 KB WAAPI" marketing numbers are
  tree-shaken bundler subsets [EXTRACTED]
  ([animejs npm](https://www.npmjs.com/package/animejs)); without a bundler you
  ship either the 29 KB file or a hand-picked subset of the (unminified)
  `dist/modules` graph.
- **Features relevant here:** `createTimeline` with position syntax (would
  replace the `setTimeout` ladders), `onScroll()` ScrollObserver with
  enter/leave + sync modes (ScrollTrigger-lite), `animejs/text` splitter
  (hero per-char), spring/physics easings, `engine.timeUnit`.
- **Clock: solvable cleanly.** The v4 engine exposes manual driving —
  `engine.update()` from an external loop, plus `pauseOnDocumentHidden`, `fps`,
  `speed` [EXTRACTED] ([engine docs](https://animejs.com/documentation/engine)).
  The site's scene loop could remain the **only** rAF owner and tick anime's
  DOM tweens from inside it — no second clock, no ordering nondeterminism.
- Fit verdict: if any framework enters this codebase, it is this one — import-map
  native, one vendored file next to `three-0.158.0/`, engine subordinate to the
  existing loop. Cost is still +29 KB gz (+55 % of authored JS) and it does
  nothing for the globe that §2's four lines don't.

### 3.3 Motion 12 / motion.dev (formerly Framer Motion; vanilla build)

- Hybrid engine: drives DOM animation through WAAPI and scroll-linking through
  the native **ScrollTimeline** where available — "the only animation library
  that runs scroll-linked animations on the browser's native ScrollTimeline …
  fully hardware-accelerated" [EXTRACTED]
  ([motion.dev/docs/scroll](https://motion.dev/docs/scroll),
  [motion.dev](https://motion.dev/), [GSAP-vs-Motion](https://motion.dev/docs/gsap-vs-motion)).
- The famous small numbers (2.6 KB mini `animate`, 5.1 KB `scroll`) **require
  bundler tree-shaking**; the browser-ready dist is **46.2 KB gz** [DATA], or you
  take esm.sh as a runtime dependency.
- Misfit twice over: its core value (compositor-accelerated *DOM* animation)
  duplicates what the site already gets from plain CSS transitions, and its
  crown jewel (ScrollTimeline) cannot drive a WebGL scene's JS loop — a Three
  scene can't run on the compositor. Not a candidate for this site.

### 3.4 Native platform (the zero-KB column)

- **CSS scroll-driven animations** (`animation-timeline: scroll()/view()`):
  Chrome/Edge shipped (since 115, refined by 135); **Safari 26.0 shipped
  Sep 2025** (threaded in 26.4); **Firefox stable still behind
  `layout.css.scroll-driven-animations.enabled` as of Fx 152 (Jun 2026)**, on in
  Nightly, named Interop 2026 priority; ≈ 82.6 % global — close to but **not yet
  Baseline** [EXTRACTED]
  ([MDN guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations),
  [caniuse](https://caniuse.com/mdn-css_properties_animation-timeline_scroll),
  [2026 status writeup](https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026)).
  Progressive-enhancement fit is excellent for the site's `data-parallax` DOM
  drift and view-based reveals (`@supports (animation-timeline: view())`, JS
  fallback stays). Bonus: `view()` runs off real intersection geometry on the
  compositor, sidestepping the scaled-preview-iframe distrust that made this
  codebase avoid IntersectionObserver (`effects.js:2-3`). Note Firefox's quirk:
  a non-zero `animation-duration` is still required for SDA to apply.
- **View Transitions**: already load-bearing in this site (lightbox morph,
  `app.js:289-305`). Extending same-document VT to other swaps (lang toggle?) is
  design work, not a framework decision.
- **`Element.animate()` / WAAPI**: available everywhere the site runs; if the
  hero choreography wants real lifecycle semantics (cancel/finish/composite)
  without any dependency, WAAPI already provides them — worth remembering
  before reaching for 29 KB.

## 4. The three key questions, answered

### (a) What specific rough edges would a framework fix?

Genuine (all in the DOM layer, none on the globe):

1. **Choreography lifecycle.** The hero entrance is `setTimeout` ladders plus
   *three* hand-built safety nets (`heroSettleTimer` @ `app.js:25-43,108-109`,
   scramble token guard @ `effects.js:29-36`, wall-clock settle fallback @
   `effects.js:49`) that exist because bespoke timing has no
   overwrite/kill/finish semantics. Re-running the entrance from the deck
   mid-flight works only because of those nets. A timeline
   (`gsap.timeline().to(...,"<0.23")` / anime `createTimeline`) makes
   interruption-safety structural and tuning declarative. **This is the real
   "flow" win the owner is smelling.**
2. **Sequencing legibility/tunability.** Beat positions become data
   (`"+=0.23"`) instead of scattered magic numbers across files.
3. **Easing vocabulary.** Springs/soft overshoot for micro-moments (deck open,
   state-word snap) beyond hand-rolled cubics — though the design language's
   instrument-restraint may not even want them.
4. *(GSAP-specific)* `ScrambleTextPlugin`/`SplitText` replace ~90 bespoke lines
   — but the bespoke versions are tuned (JP glyph set, per-char settle) and
   working.

**Not fixed by a framework — the owner's actual complaint:** the scroll-globe
jank is inside the WebGL loop (§2). ScrollTrigger-style scrubbing genuinely
helps *DOM* scroll scenes; for a scene that owns its rAF and integrates dt, the
framework degrades to a smoothed-scalar provider, and the scalar smoothing is a
4-line bespoke idiom this file already uses nine times. Pinning — ScrollTrigger's
other superpower — is a layout tool for scrolling DOM; this site's canvas is
already fixed, i.e. permanently "pinned" by construction. **Integration
mismatch confirmed.**

Also not fixed: the mixed smoothed/raw coupling (§2) is a *design* decision a
framework can't make for you; `maxScroll`/iOS-URL-bar handling already exists
(`background.js:1750-1751,1975-1981`); reveals/nav are threshold events that
need no tween engine.

### (b) Bundle cost vs the zero-dependency discipline — and the retirement ledger

| Candidate | Browser-ready cost (gz) [DATA] | vs 53 KB authored JS | vs 161 KB Three |
|---|---|---|---|
| Bespoke fix (§2) | +0 KB | — | — |
| CSS SDA | +0 KB JS (CSS only) | — | — |
| anime.js 4.5 ESM min | +29.1 KB | +55 % | +18 % |
| GSAP core+ST (UMD, globals) | +46.3 KB | +87 % | +29 % |
| GSAP core+CSS+ST (ESM, unminified) | +109 KB | +206 % | +68 % |
| Motion 12 dist | +46.2 KB | +87 % | +29 % |

Warm-LCP note: all of these can load `defer`/module (off the LCP critical path),
so the ~257 ms budget survives — the cost lands on parse/long-task time on the
LITE tier and on the *discipline* itself.

Retirement ledger the don't-add-without-retiring law demands (if a framework
lands): the `setTimeout` entrance ladders + all three safety nets (~60 ln), the
counter tween (~12 ln), the scramble engine (~30 ln, GSAP-ScrambleText case
only), the typewriter `setInterval` (~10 ln), the state-word reflow hack (~5 ln).
Best case ≈ 120 lines (~1.5 KB gz) retired against 29–46 KB added — **the ledger
never balances on bytes; it can only balance on maintainability**, and only if
the bespoke code is actually deleted, not shadowed.

### (c) Who owns the clock?

Today: one always-on rAF (scene), plus on-demand rAF chains and wall-clock
timers. The scene loop is dt-clamped, visibility-guarded against double-chains
(`background.js:2189-2202`) — it is the site's de-facto master clock.

Three integration modes, best-to-worst for this codebase:

1. **Site loop stays master; framework becomes a pure tween evaluator.**
   anime.js: `engine.update()` ticked from inside `loop()` [EXTRACTED, §3.2].
   GSAP: remove the internal ticker driver and call
   [`gsap.updateRoot(time)`](https://gsap.com/docs/v3/GSAP/gsap.updateRoot()/)
   manually — supported, but documented as an advanced escape hatch, and
   ScrollTrigger internals still assume the ticker. **Only this mode preserves
   the current architecture's guarantees** (single clock, dt-clamp, one place to
   pause on hidden).
2. **Framework becomes master** (`gsap.ticker.add(render)`; delete the bespoke
   loop): the ecosystem-blessed shape (§3.1 Codrops refs) — a real refactor of
   `background.js`'s most battle-hardened section (visibility re-entry, context
   loss, reduced static frame), for zero visual gain.
3. **Two clocks coexist** (GSAP ticker for DOM, scene rAF for WebGL): easiest
   and commonest, but DOM-tween vs scene-frame ordering is nondeterministic
   within a frame, and any value both clocks touch (camera, spin, opacity
   channels) risks double-driving — this is exactly the crack the ONE-SIGNAL
   law's "attaches to the one thing that changed" grammar would slip through.
   Motion is a special case: its clock is the compositor (WAAPI/ScrollTimeline)
   — it can't contend with the scene loop, but also can't be synchronized to it.

## 5. Options

### Option A — No framework: bespoke scrub + choreography truing (cost: S)
Add `smoothScrollN` one-pole filter (§2) feeding spin/dolly/lookAt/grid; audit
that every scroll-coupled channel is either threshold-event or filtered.
Optionally rebuild the hero `setTimeout` ladders on WAAPI (`el.animate`) for
free lifecycle semantics — zero bytes. Laws: fully compliant; nothing added,
jank retired. Risk: none beyond tuning taste (pick the scrub constant against
the LITE tier).

### Option B — CSS scroll-driven animations as progressive enhancement (cost: S)
Move `data-parallax` drift and view-reveals to `animation-timeline: view()/scroll()`
behind `@supports`, keeping the JS fallback for Firefox-stable until it flips
its flag (Interop 2026). Retires JS main-thread work for ~83 % of visitors.
Laws: compliant — retires a layer (per-frame JS transforms) for the ones it adds.
Risk: dual code paths until Firefox ships; must keep the `.seen` fallback truthful.

### Option C — anime.js v4.5 for DOM choreography only (cost: M)
Vendor `anime.esm.min.js` (29.1 KB gz) beside `three-0.158.0/`, add to the
import map, drive via `engine.update()` from the existing scene loop (mode 1);
rebuild hero/typewriter/counters as timelines and DELETE the ladders + safety
nets. The globe keeps its bespoke dynamics untouched. Laws: +29 KB against
~120 retired lines — bytes-ledger negative, must be justified purely on
choreography maintainability; one-signal safe if and only if the engine stays
subordinate (mode 1) and no scene channel is ever tweened from DOM code.

### Option D — GSAP 3.15 core + ScrollTrigger (cost: L)
Now genuinely free (all plugins, commercial OK). But without a bundler the ESM
path costs 109 KB gz or the UMD path costs the ESM discipline; ScrollTrigger's
value collapses to a smoothed scalar for a fixed canvas; and doing it "properly"
re-parents the clock (mode 2) into GSAP's ticker — the largest-blast-radius
refactor on the board for the same pixels Option A produces. ScrollSmoother:
rejected outright (fixed-element breakage across nav/HUD/lightbox/canvas, AT
cost). Laws: bundle-discipline and retire-one both strained; one-signal at risk
under mode-3 coexistence.

## 6. Recommendation

**A first, D-the-CSS-one (Option B) second; no framework now.** The owner's
"flow" complaint decomposes into (i) scroll-shear in the scene — a 4-line filter
the scene loop already knows how to express, and (ii) entrance choreography
stiffness — where the honest bespoke answer (WAAPI) also costs zero bytes. If,
after feeling A+B, the owner still wants a richer timeline vocabulary, **anime.js
v4 (Option C) is the only candidate that respects this architecture** —
import-map-native, single vendored file, engine tickable from the site's own
loop. GSAP's 2026 story (fully free, ScrollTrigger/ScrambleText included) is
real and no longer license-gated, but on a no-bundler, fixed-canvas,
own-clock site it is the wrong shape; it is the right tool for the scrolling-DOM
sites the tutorials are written about.

---

## Sources

- GSAP free / Webflow: https://webflow.com/updates/gsap-becomes-free · https://gsap.com/pricing/ · https://github.com/greensock/GSAP
- ScrollTrigger docs: https://gsap.com/docs/v3/Plugins/ScrollTrigger/ · ScrollSmoother: https://gsap.com/docs/v3/Plugins/ScrollSmoother/ · `gsap.updateRoot`: https://gsap.com/docs/v3/GSAP/gsap.updateRoot()/
- GSAP+Three clock patterns: https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/ · https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/ · https://gsap.com/community/forums/topic/25016-scrolltrigger-and-threejs/
- ScrollSmoother/smooth-scroll hazards: https://medium.com/@terencegrover/smooth-scrolling-with-gsap-overcoming-fixed-positioning-challenges-dbce33b08d49 · https://gsap.com/community/forums/topic/44902-unique-problems-with-scrollsmoother-on-mobile/ · https://www.sitepoint.com/scrolljacking-accessibility/
- anime.js v4: https://animejs.com/documentation/getting-started/module-imports/ · https://animejs.com/documentation/engine · https://github.com/juliangarnier/anime/releases/tag/v4.0.0 · https://www.npmjs.com/package/animejs
- Motion: https://motion.dev/ · https://motion.dev/docs/scroll · https://motion.dev/docs/gsap-vs-motion · https://www.npmjs.com/package/motion
- CSS scroll-driven animations status: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations · https://caniuse.com/mdn-css_properties_animation-timeline_scroll · https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026
- All byte sizes: self-measured [DATA] 2026-07-10 via jsDelivr fetch + `gzip -9` (gsap@3.15.0, animejs@4.5.0, motion@12.42.2, lenis@1) and local `gzip -9` of this repo's `js/*`.
