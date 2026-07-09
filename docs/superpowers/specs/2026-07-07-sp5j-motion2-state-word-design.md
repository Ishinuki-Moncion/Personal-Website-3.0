# SP5j — Motion-2: boxed state-word on section lock (L3) (Design + record)

**Date:** 2026-07-07 · **Branch:** `v3-build` · **Program:** SP5, slice j (Motion-2) · Follows [[SP5i composition]], continues [[SP5c motion]].
**Source:** `motion-elevation-brief.md` levers 3/4/5/7 · **Rules:** `design-language-v3` §4 + §0.

## §1 — Decision (owner-delegated autonomous run)

First **JS-touching** slice of SP5. The motion brief's governing law (Lever 1) is *animate the focus only*, and it flags **over-animation as the primary risk**. So this slice builds the **signature beat** and defers the rest on that principle:

- **L3 — boxed state-word on section lock — BUILT.** The "next-biggest beat" (per SP5c). At each section lock, one bracketed keyword snaps in at the lower field, holds, then fades — reusing the boot OK/LIVE keyword grammar at runtime as an outline box. **Transient** (attaches to the one thing that changed), not idle → does not risk Lever 1. Reduced-gated; skips `home` so the hero cue is never covered.
- **L7 — idle-jitter — DEFERRED (already satisfied).** The "never fully settles / live instrument" quality L7 targets is **already provided perpetually by the living WebGL scene** (globe rotation, rain, drifting particles, the ticking JST clock). A DOM idle-jitter would be a *second* ambient motion competing with the scene — a direct Lever 1 violation ("signal turns to noise the moment two idle things move at once"). Consciously not added.
- **L4 — chromatic ghost-echo — DEFERRED.** Polish-on-polish on the scramble; the brief rates it lower and flags it as a top over-animation risk. The decrypt already reads well.
- **L5 — per-letter stagger — DEFERRED.** The existing 70 ms group cascade is correct; per-letter is a marginal finer-grain option, not a fix.

(SP5c already delivered Lever 2 acquiring-reticle and Lever 6 boot-from-88.)

## §2 — Change set (JS + CSS + markup + version bumps)

- **DOM** (`index.html`, after `.frame-hud`): `<div class="state-flash" aria-hidden="true"></div>`.
- **CSS** (`css/site.css`): `.state-flash` fixed lower-center outline box (mono tracked-caps cyan, `box-shadow` glow, hidden) + `.state-flash.show { animation: stateFlash 1.9s }` keyframes (snap-in from +7px/0.5em tracking → hold → fade).
- **JS** (`js/effects.js`): `flashState(id)` helper (`reduced`-gated, `!== 'home'`, textContent + reflow-restart of `.show`), called from the existing `if (active !== lastActive)` section-lock block.
- **Versions:** `boot.mjs` `V.fx` `3.3` → `3.4` (busts `effects.js`); `index.html` `boot.mjs?v=1` → `?v=2` (so the new `V.fx` is read); `site.css?v=3.17` → `?v=3.18`.

## §3 — Decision record — SP5j COMPLETE (2026-07-07)

**Commit:** *(this commit)* — state-word DOM + CSS + effects.js hook + `V.fx`/`boot.mjs?v`/`site.css?v` bumps.

**Gates PASS.** Browser (`localhost:8080`, `?v=3.18`, `boot.mjs?v=2`): scrolling into a section fires the boxed keyword — **`ABOUT`, `WORK`, …** — in a cyan outline box at the lower centre, snapping in then holding/fading; `home` correctly shows nothing. **Console: zero errors/exceptions** on load and through the section-lock path — the ESM chain (`boot.mjs → effects.js?v=3.4`) loads clean; scene, JST clock, reveals, counters all still run. Fires only on `active` change (naturally rationed, like the scene-ping) → Lever 1 held; ~90%+ of the frame holds still. Reduced-motion: `flashState` early-returns under `reduced`. **NEXT:** finalize — push + report. Deferred beats (L4/L5/L7) recorded above.