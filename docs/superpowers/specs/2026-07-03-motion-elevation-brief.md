# Motion — Elevation Brief (2026-07-03)

Source rules: `design-language-v3` §4 (Motion) + §0 (Spine). Study: `2026-07-03-motion-visual-study.md`.
This is the *what/why* hand-off for a later spec→plan→build; it names concrete code levers but writes no code.
Refs are board frames `(ref: motion/NNN · [TIER])`; anchors are `file:LINE` in the current tree.

**Headline:** the motion layer is already broadly on-idiom — mono decrypt, cubic ease-out, a 0.18 lerp cursor, rationed pings, and a live clock are all present and correct. The elevation is **not** "add more motion." It is (1) adopt *animate-the-focus-only* as the governing acceptance test, then (2) spend a small number of new beats — an **acquiring** cursor, a **boxed state-word**, a **chromatic ghost-echo**, **88→value** boot fields, and one **never-settling** idle mark — reusing grammar the code already has.

---

## Current state

**`js/effects.js` — scroll engine, reveals, scramble, counters, clock.**
- `reduced` motion guard read once at `effects.js:6`; mono glyph set at `effects.js:7`.
- `window.scramble()` decrypt `effects.js:13-39`: 700 ms default, per-char random settle `0.2–1.0` of progress (`effects.js:20`), in-place glyph swap with no reflow (`effects.js:29`), token-guarded + wall-clock safety net.
- Stagger: `[data-stagger]` children get `--d = i*0.07s` — a **70 ms** group cascade (`effects.js:46`).
- Counters `effects.js:57-68`: 1400 ms count-up (`effects.js:61`) eased by cubic ease-out `1 - Math.pow(1-p,3)` (`effects.js:64`) — this is already Power3.easeOut in effect.
- Reveals fire **once** at `top < vh*0.92` then `splice` out (`effects.js:75`); counters trigger at `vh*0.85` (`effects.js:79`).
- Section change pings the scene with a **600 ms cooldown** (`effects.js:124`) + `__sceneFocus` (`effects.js:121-126`).
- Live JST clock, `setInterval 1000`, skips while `document.hidden` (`effects.js:137-147`).

**`js/cursor.js` — HUD reticle cursor.**
- Coarse-pointer/no-hover early return (`cursor.js:4`); dot follows pointer instantly (`cursor.js:17`).
- Ring trails by a per-frame lerp `rx += (mx-rx)*0.18` (`cursor.js:48`).
- Hover toggles `is-hot` / `is-text` (`cursor.js:31-32`); press toggles `is-down` (`cursor.js:22-23`); label from `[data-cursor]` (`cursor.js:33-34`); target set `SEL` at `cursor.js:13`.
- Magnetic pull on `[data-magnetic]`: element translated `0.28` of the offset (`cursor.js:53`), cleared on `pointerout` (`cursor.js:44`).

**`js/boot.js` — cinematic boot.**
- `reduced`/already-booted short-circuit to `instant()` (`boot.js:107`); 9 s hard cap (`boot.js:108`).
- 8-line SEQ `boot.js:17-26` with `<ok>OK</ok>` (`boot.js:19`) and `<warn>LIVE</warn>` (`boot.js:24`) tags rendered to `.ok` / `.warn` spans by `html()` (`boot.js:28-31`).
- One decrypt line: 14 frames × 38 ms ≈ 532 ms (`boot.js:53-62`).
- Progress ramp `+7` per 34 ms to 100, then `SYSTEM ONLINE` (`boot.js:76-80`), interim clamp at 96 (`boot.js:85`).

---

## Target intent

The v3 §4 feel, each pinned to a studied frame:

- **Ration motion as a scarce signal — animate only the thing that changed; hold the field dead still.** The governing law of this surface. (ref: motion/008 · [VERIFIED])
- **The cursor is an *acquiring reticle*: on hover it tightens/snaps (ring clamps, ticks inset), it does not merely recolor.** (ref: motion/002 · [VERIFIED]) — cross-checked with the scope/rangefinder frames (ref: motion/010 · [VERIFIED]; motion/011 · [VERIFIED])
- **Acknowledge a state change with ONE boxed keyword that snaps in then holds — never a sentence or toast.** (ref: motion/002 · [VERIFIED]; motion/005 · [EXTRACTED]; motion/017 · [VERIFIED])
- **Render a fast/refreshing value as a 2–3-copy chromatic ghost-echo (lead + channel-split ghosts), not a Gaussian blur.** (ref: motion/002 · [VERIFIED]; motion/003 · [VERIFIED])
- **Entrances ease OUT, exits ease IN, on a tight stagger; per-letter text can go far finer (~14 ms/letter, ~500 ms/char, Power3).** (ref: motion/001 · [EXTRACTED])
- **Boot numeric fields from a placeholder to their value (`88`/`--`/`LOAD` → resolve), so first paint reads "powering on," not "empty."** (ref: motion/016 · [EXTRACTED]; motion/018 · [EXTRACTED])
- **"Live" is sold by never fully settling — one idle mark perpetually micro-moves, respecting `prefers-reduced-motion`.** (ref: motion/007 · [EXTRACTED])
- **Decrypt/scramble resolves glyph-by-glyph in a mono face with no reflow.** (ref: motion/006 · [EXTRACTED]) — *already satisfied; recorded for traceability.*

---

## Concrete code levers

Each lever is tagged **[on-idiom → tune]** (the code is already correct; keep/refine) or **[new/delta]** (a real change). Ordered by the brief's priorities.

- **Lever 1 — Governing law: animate the focus only.** **[on-idiom → enforce, no new code]** The rationing primitives already exist: scene-ping 600 ms cooldown (`effects.js:124`), reveal-once `splice` (`effects.js:75`), reduced-motion short-circuit (`effects.js:6`, `boot.js:107`). Delta = make this the **acceptance test** every lever below must pass: no new beat may idle-animate chrome, background, or every card — it must attach to the one thing that changed. (ref: motion/008 · [VERIFIED])

- **Lever 2 — Acquiring-reticle cursor (tighten/snap, not recolor).** **[new/delta]** `is-hot` is already toggled on hover (`cursor.js:31`), but today the reticle's response is color only (CSS). Add an *acquire* beat: on `is-hot`, clamp the ring tighter (e.g. scale ~0.82 + corner-tick inset), a further clamp on `is-down` (`cursor.js:22`), and pair the study's `1.08`/`0.92` hover/leave scale. Cleanest as an `is-hot` CSS transform, or a scale factor folded into the ring transform in `frame()` (`cursor.js:47-56`). Keep the 0.18 lerp (`cursor.js:48`) unchanged. (ref: motion/002 · [VERIFIED]; motion/014 · [EXTRACTED])

- **Lever 3 — One boxed state-word, extending boot's OK/LIVE grammar to runtime.** **[new/delta — reuse existing grammar]** `boot.js:28-31` already converts `<ok>…</ok>` / `<warn>…</warn>` into `.ok` / `.warn` bracket spans, but only during boot. Reuse that exact grammar at runtime: at the section-change point (`effects.js:121-126`) flash one boxed word (`SYNCED` / `LIVE` / the section id) that snaps in then holds; optionally on primary/magnetic hover in `cursor.js`. One verb in a bracket — the outline is the signal, never a filled chip or a sentence. Gate on `reduced` (`effects.js:6`). (ref: motion/002 · [VERIFIED]; motion/017 · [VERIFIED])

- **Lever 4 — Chromatic ghost-echo on fast values.** **[new/delta]** No ghost-echo primitive exists. When a value changes fast — `scramble()` at speed (`effects.js:13-39`) or a counter mid-run (`effects.js:57-68`) — render a short stack of 2–3 offset, channel-split copies (one lead + red/blue ghosts a few px off), removed on settle. Cleanest as a toggled CSS text-shadow / duplicate layer during the animation window, not a Gaussian smear. Reserve strictly for genuinely fast change (Lever 1). (ref: motion/002 · [VERIFIED]; motion/003 · [VERIFIED])

- **Lever 5 — Tighter per-letter stagger option + Power3 pairing.** **[on-idiom → tune]** The 70 ms group cascade (`effects.js:46`) is correct for cards/reveals — keep it. Counters already ease-out cubic (`effects.js:64`) = Power3.easeOut — keep. Delta: for **per-letter** text reveals (a finer grain than the group), offer ~14 ms/letter + ~500 ms/char with entrance Power3.easeOut / exit Power3.easeIn — a *new fine-grain path*, not a change to the existing 70 ms. (ref: motion/001 · [EXTRACTED])

- **Lever 6 — Boot fields from `88`/`--` to value.** **[new/delta — both halves exist, unwired]** `boot.js:76-80` ramps the progress bar; `effects.js:57-68` counts `[data-count]` up. Delta: seed each `[data-count]` display at `88` / `--` / `LOAD` at first paint (before `runCounter` fires at `effects.js:79`), then resolve to the real value on reveal — so a cold field reads "powering on," not "0". (ref: motion/016 · [EXTRACTED]; motion/018 · [EXTRACTED])

- **Lever 7 — One idle mark that never fully settles.** **[new/delta, guarded]** The live clock (`effects.js:137-147`) is the seed. Delta: let a *single* idle telemetry mark perpetually micro-move — jitter the last digit of a readout, or scroll a 1-px trace — strictly behind the `reduced` guard (`effects.js:6`) and the `document.hidden` skip the clock already uses (`effects.js:142`). One mark, never the whole field (Lever 1). (ref: motion/007 · [EXTRACTED])

**Validated, no change (recorded so the rule traces to code):**
- Mono in-place decrypt — `effects.js:13-39` + `boot.js:53-62` already resolve glyph-by-glyph with no reflow. (ref: motion/006 · [EXTRACTED])
- Cursor lerp `0.18` sits in the study's 0.15–0.2 band — keep the constant (`cursor.js:48`). (ref: motion/014 · [EXTRACTED])
- Magnetic pull `0.28` matches the demo (`cursor.js:53`); optional refinement — also nudge the ring toward the element centre for the mutual-attraction read. (ref: motion/015 · [EXTRACTED])

---

## Before / after

- **Before:** the cursor only recolors on hover; state changes are silent; fast values would blur; `[data-count]` fields pop from 0; nothing lives at idle except the JST clock.
- **After:** the cursor *acquires* — the ring clamps tighter and ticks snap inward over a target; at the instant a section locks, one boxed word (`LIVE` / `SYNCED`) blinks in and holds; a rapidly-updating value smears into a 2–3-copy chromatic ghost; readouts boot from `88`→value; one trace never quite settles. The page reads as a **live instrument** — and, because Lever 1 governs, ~90 %+ of the frame still holds dead-still.

---

## Out of scope / risks

- **No timing is `[DATA]`.** Every curve and threshold here is `[EXTRACTED]` (published in a source) or `[WORKING]` (inferred from a still) — treat all numbers (0.82 clamp, 14 ms, 2–3 ghosts) as **tunable in-browser**, not fixed law (study §Thin areas).
- **Over-animation is the primary risk.** Ghost-echo (Lever 4) and idle jitter (Lever 7) most easily violate Lever 1 and the reduced-motion contract — every new beat must attach to *the one thing that changed* and honor `reduced` (`effects.js:6`, `boot.js:8`). Signal turns to noise the moment two idle things move at once.
- **Spring/overshoot feel is unresolved `[WORKING]`** — no source published spring constants; don't add springs speculatively (study §Thin areas).
- **Deferred, named-not-built:** hue-jump escalation amber→red (ref: motion/004 · [EXTRACTED]) belongs with color/state work; a stepped-`steps()` glitch primitive (ref: motion/012 · [EXTRACTED]) is transition/error-only; directional paired section reveals with a 3–4° tilt settle (ref: motion/001 · [EXTRACTED]) are a reveal-engine rewrite. All out of scope for this JS-motion-layer pass.
- **No `background.js` / CSS-token work here** — this brief is the `effects.js` / `cursor.js` / `boot.js` motion layer only.
