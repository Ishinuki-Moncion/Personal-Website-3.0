# daikieOS Visual Language v3

**The enforceable rule set for every surface of the site.** Synthesized from the seven-surface concept-art visual study (2026-07-03): a real, on-disk reference board of **109 curated frames** yielding **98 tier-tagged, image-pinned principles** across globe, rain, HUD, motion, type, color, and composition. Supersedes v2 ("Sologram Noir", `2026-07-02-design-language-sologram-noir.md`) — v2's intuitions were largely correct; v3 grounds them in studied references and, for color, in measured `[DATA]`.

**How to read this:** every rule is an instruction, cites its evidence as `(ref: <surface>/NNN · [TIER])`, and traces to a committed study entry (`docs/superpowers/research/2026-07-03-<surface>-visual-study.md`). Tiers: `[VERIFIED]` cross-checked across ≥3 refs · `[EXTRACTED]` read off one primary reference · `[DATA]` measured pixel value · `[WORKING]` practitioner judgment. **No rule without a ref.** The seven per-surface elevation briefs (`2026-07-03-<surface>-elevation-brief.md`) turn these rules into concrete code levers; this doc is the *what/why*, not the build.

---

## §0 — The Spine (the fixed noir identity)

daikieOS is a **living instrument rendered in a near-black cyber-noir night**: a dark, quiet field where light is scarce and every lit thing is an *event* — a cool cyan instrument reading the world, a warm amber signal when something matters, projected on imperfect glass and framed like a wide anamorphic shot. It is Territory-Studio FUI restraint over a NASA-real Earth-at-night, graded like Blade Runner and set like Swiss editorial. These six laws hold on **every** surface; the per-surface sections below are their local application:

1. **Near-black base; light is an event, not a fill.** ~80–99% of every frame sits in deep shadow; lit information is a small fraction. Never lift the darks to a comfortable "dark-grey UI." (ref: color/002 · [DATA]; globe/004 · [EXTRACTED]; rain/016 · [VERIFIED]; hud/010 · [VERIFIED]; composition/005 · [VERIFIED])
2. **One temperature per view — cool is the instrument, warm is the signal.** Cyan/teal carries UI, structure, and reading; amber (and a rare signal-red) marks asserted/active/alert state only. "Teal AND orange" is a **cut across the edit**, never an in-frame dapple. (ref: color/010 · [VERIFIED]; globe/008 · [EXTRACTED]; hud/007 · [VERIFIED]; motion/004 · [EXTRACTED])
3. **The accent is a budget, not a mood.** Warm signal occupies ~1–6% of a view's area; if warm and cool approach equal area, the noir is gone. Spend the accent like currency. (ref: color/002 · [DATA]; globe/008 · [EXTRACTED])
4. **Light is additive and rimless.** Emitters are a saturated core plus a soft same-hue halo lifting the surrounding near-black; holograms dissolve into particulate scatter at their edges. No hard fresnel rims, no flat colored rectangles, no complementary block behind text. (ref: globe/006 · [VERIFIED]; color/009 · [EXTRACTED]; rain/010 · [EXTRACTED])
5. **Restraint is the effect — instrument only the focus.** Label, animate, and light the one thing that matters; leave the field a quiet, faintly-instrumented void. A surface that fills its frame reads as noise, not signal. (ref: hud/010 · [VERIFIED]; motion/008 · [VERIFIED]; globe/002 · [EXTRACTED]; composition/005 · [VERIFIED])
6. **It is projected on worn glass, not printed on paper.** Chrome is framed by implied hardware (bezels, corner brackets, tick graticules); the *content/scan* layer carries scanlines, grain, and chromatic aberration while the interactive chrome stays crisp. (ref: hud/022 · [VERIFIED]; hud/003 · [WORKING]; globe/013 · [VERIFIED])

---

## §1 — Globe

1. **Keep the globe near-black with scarce, clustered emitters.** City light is warm pinpoints/filaments along real coastlines and rivers (Europe/E-Asia/E-US dense, interiors dark), never an even wash; lit area is well under ~5% of the sphere. (ref: globe/005 · [EXTRACTED])
2. **Render the atmosphere as a thin, edge-weighted cool limb** — a bright blue-scatter rim ~1–2% of the radius, brightest toward the terminator, fading to nothing on the deep-night limb; not a uniform halo. (ref: globe/004 · [EXTRACTED])
3. **The holo-scan shell has no hard rim** — its edge dissolves into additive cyan scatter and bloom; legibility comes from internal density, not an outline. Replace any fresnel hard rim on the shell with edge-falloff into scatter. (ref: globe/006 · [VERIFIED])
4. **Tag globe features with offset corner-bracket + condensed-mono coordinate strings**, framed beside the subject with a leader gap — the tag never overlaps what it names. (ref: globe/008 · [EXTRACTED])
5. **Label the focus only; seat overlays on a faint graticule with radial leaders from one reticle.** Most of the globe stays unlabeled grid; a globe labeled everywhere reads as noise. (ref: globe/002 · [EXTRACTED])
6. **Hold the cool-shell / warm-emitter split strictly** — cyan is the instrument shell, amber is the city/data signal; never let them bleed into each other. (ref: globe/008 · [EXTRACTED])
7. **The holo shell composites additively and stays translucent** over the dark scene behind it — it adds light, never occludes. (ref: globe/012 · [WORKING])

## §2 — Rain & Weather

1. **Render rain in ≥2 depth planes, never one uniform veil** — sparse high-contrast motion-blurred NEAR streaks over a dense hazy FAR wash, with ground splash/mist anchoring the bottom. (ref: rain/021 · [VERIFIED])
2. **Gate rain visibility on motivated light** — rain is bright only where a lamp/neon/window backlights it and vanishes into black elsewhere; a rain scene is mostly black with rain lit in pools, not a full-frame overlay. (ref: rain/023 · [VERIFIED])
3. **Streak vs. discrete droplet is a distance/shutter call** — elongated streaks for the far/fast wash, discrete round drops only for the near/slow/backlit plane; mix both across depth. (ref: rain/016 · [VERIFIED])
4. **A glass droplet is a lens** — it refracts an inverted, magnified, slightly-desaturated sample of the frame behind it (this is the site's Joi lens-droplet sampling the live frame — keep it sampling, inverted, desaturated). (ref: rain/018 · [VERIFIED])
5. **Sell wetness by reflection** — mirror every emitter as a soft vertically-smeared streak on the ground below it; reflections, not a gloss shader, make a surface read wet. (ref: rain/011 · [VERIFIED])
6. **Localized rainfall needs three parts** — implied source above, discrete backlit droplets in the shaft, and a splash/wet-ring at impact; without the landing it reads fake. (ref: rain/025 · [EXTRACTED])
7. **Lightning is a brief directional high-key event** — a near-white core with exponential falloff into the existing blue-black, clouds lit from the strike outward, not an even full-frame brighten. (ref: rain/020 · [EXTRACTED]; sheet-diffusion clause [WORKING])
8. **Far rain desaturates and hazes toward the scene's dominant hue** (atmospheric perspective) — never stays crisp to the horizon. (ref: rain/003 · [VERIFIED])

## §3 — HUD & Chrome

1. **One ink, one accent** — the whole HUD in a single hue over the dark, exactly one contrasting accent reserved for asserted state, on only a handful of marks. (ref: hud/007 · [VERIFIED])
2. **Frame with thin corner brackets, never a closed box** — imply the live area; the eye completes the rectangle. (ref: hud/007 · [VERIFIED])
3. **Set label + value + unit as a tight mono triad, value dominant** — abbreviate the label to glyphs/2–3 caps, hang the unit small, make the value the largest element. (ref: hud/021 · [VERIFIED])
4. **Assert live state with a bracket tag** — wrap a status word (LOCKED, LIVE) or value in a thin outline box; the outline is the signal, never a filled chip. (ref: hud/010 · [VERIFIED])
5. **Offset labels and bridge with a leader** — never overlap a label on its subject; connect with a thin/dotted leader into empty space. (ref: hud/007 · [EXTRACTED])
6. **Seat all data on a low-contrast tick/graticule substrate** — major divisions + subdivided minor ticks, dimmed well below the data (the literal root of the FUI grammar is the oscilloscope graticule). (ref: hud/022 · [VERIFIED])
7. **Tabular mono numerals — fixed-width, right-aligned, slashed capacities** (25/200), fixed decimals, so columns align digit-for-digit. (ref: hud/017 · [VERIFIED])
8. **Build the reticle from detached ticks with a gap at true centre** — legibility from arrangement, not stroke weight; never occlude the target. (ref: hud/010 · [VERIFIED])
9. **Instrument the void with a dim data-texture** (contour lines, an orbital web, a scrolling ticker), not flat black — measured space, dim enough that foreground marks dominate. (ref: hud/016 · [EXTRACTED])
10. **Ground the chrome in worn hardware at its edges** (bezel, combiner, labelled buttons) rather than a floating flat card. (ref: hud/003 · [VERIFIED])

## §4 — Motion

1. **Entrances ease OUT, exits ease IN, on a tight stagger** (published recipe: ~14 ms between siblings, ~500 ms/char, Power3) — arrive fast-then-settle, leave slow-then-accelerate. (ref: motion/001 · [EXTRACTED])
2. **Acknowledge a state change with ONE boxed keyword**, not a sentence or toast — a single verb in a bracket that snaps in then holds. (ref: motion/002 · [VERIFIED])
3. **Render a fast/refreshing value as a 2–3-copy chromatic ghost-echo**, not a Gaussian motion blur. (ref: motion/002 · [VERIFIED])
4. **Run scramble/decrypt in a mono face so glyphs settle in place with no reflow**, resolving left-weighted. (ref: motion/006 · [EXTRACTED])
5. **Trail the cursor by a per-frame lerp (~0.15–0.2 of the gap), not a timed tween** — lag on fast moves, catch up organically; scale ~1.08 on hover. (ref: motion/014 · [EXTRACTED])
6. **Animate the focus only; leave the field dead still** — this is *when not to animate*; ration motion as a scarce signal. (ref: motion/008 · [VERIFIED])
7. **Signal escalation with a hue jump (amber→red), not more motion** — a palette shift says "state changed" more cheaply and legibly. (ref: motion/004 · [EXTRACTED])
8. **"Live" is sold by never fully settling** — idle telemetry perpetually micro-moves (jitter last digits, scroll a 1-px trace), respecting `prefers-reduced-motion`. (ref: motion/007 · [EXTRACTED])
9. **Boot fields from a placeholder to a value** — initialize numerics as `88`/`LOAD`/`--` and resolve them (count-up/decrypt) so first paint reads "powering on." (ref: motion/016 · [EXTRACTED])
10. **The cursor's native metaphor is an acquiring reticle** — on hover it *acquires* (brackets snap inward / ring tightens), not merely recolors. (ref: motion/002 · [VERIFIED])

## §5 — Typography & Bilingual

1. **Two registers, kept strictly apart** — a tracked UPPERCASE mono voice for chrome/labels, a sentence-case reading voice for body/narrative; never cross them. (This is the site's JetBrains-Mono ↔ Hanken split.) (ref: type/002 · [VERIFIED])
2. **Pair label + value by inverting size/weight, not color** — tiny tracked-caps label, value 2–4× larger and brighter; the number is the hero. (ref: type/001 · [EXTRACTED])
3. **Tabular figures for anything columnar or live-ticking**, in a face with a disambiguated (slashed/dotted) zero and distinct 1/l/I. (ref: type/003 · [VERIFIED])
4. **Track labels wide and even; the smaller the label, the more tracking** (tiniest 9–10px caps ~0.2–0.35em, larger caps back toward 0.1em). (ref: type/001 · [VERIFIED])
5. **JP-as-content = compressed, edge-to-edge, max contrast, owns the frame**; JP-as-accent = a compact, muted companion beside the Latin hero (the site's `.mm-ja` margin role). (ref: type/006 · [VERIFIED]; type/008 · [EXTRACTED])
6. **When JP is loud, style kana as angular/brush display in the ONE signal hue** — never a body weight; use it as bold content, not ornament. (ref: type/009 · [EXTRACTED])
7. **Micro-text is texture, never content** — faint, monospaced, clearly subordinate "system-alive" density that never has to be parsed. (ref: type/003 · [EXTRACTED])
8. **Signal "Japan" with ONE restrained motif over disciplined Swiss type**, not a pile of ornament. (ref: type/020 · [WORKING])

## §6 — Color & Grade

Measured tokens (PIL on graded film frames — relative structure, not scene-referred spec):

| token | value | role | ref |
|---|---|---|---|
| base teal-black | ≈ `#0a1416`–`#0c1f22` (hue ~185–195°, very low value) | the near-black field, reused everywhere | color/013 · [DATA] |
| emitter cyan | `#39f0ff` (bright, electric) | instrument/emitter — **distinct from the base**, never used to tint the base | color/002 · [DATA] |
| signal amber | ≈ `#c37a2a`–`#ff9e2c` | warm accent, motivated point emitters only | color/004 · [DATA] |
| living green | ≈ `#263815` (rare) | third accent for "living/other/uncanny" only | color/008 · [EXTRACTED] |

1. **Base at the value floor — ~88% of frame below quarter-grey, highlights ≈0%, deepest silhouettes `#010101`.** Crush the darks; spend true white only on tiny emitters. (ref: color/002 · [DATA])
2. **Accent budget ~1–6% of frame area** — warm:cool runs ~1:8 (a hero warm element) to ~1:60+ (a few pinpoints), often literally zero. (ref: color/004 · [DATA])
3. **One temperature per section, switched at a boundary** — commit each view to cool or warm; the complementary palette is achieved across the edit, not in one screen. (ref: color/010 · [VERIFIED])
4. **Neon = a bloomed saturated core + additive same-hue halo on near-black** — a light source that fogs the air, never a hard colored rectangle. (ref: color/009 · [EXTRACTED])
5. **Key subjects/labels warm-on-cool + brighter for separation** — luminance and same-family glow do the work an outline or complementary block would. (ref: color/018 · [VERIFIED])
6. **Pin the cool base to ONE stable teal-cyan token and reuse it** — hue consistency is what fuses separate views into one graded world. (ref: color/013 · [DATA])
7. **No neutral-white state** — even bright/high-key moments stay tinted and desaturated (warm gold or cold grey), never sRGB paper-white. (ref: color/016 · [EXTRACTED])
8. **The grade lives in the air** — carry color partly as atmospheric haze/vignette in the base hue that deepens with distance and toward the edges. (ref: color/010 · [WORKING])

## §7 — Composition & Layout

1. **Negative space is the primary device** — default every section to generous dark void; one focal element per viewport, never a filled canvas. (ref: composition/005 · [VERIFIED])
2. **Focal hierarchy is driven by luminance** — the brightest region on the near-black base wins the eye first; make the intended first-read highest-luminance, hold the rest dim. (ref: composition/005 · [VERIFIED])
3. **Push chrome/labels to the margins and corners; reserve the centre for the subject** — frame content with peripheral data, never overlay it. (ref: composition/012 · [VERIFIED])
4. **One focal point = one break in an otherwise uniform gridded field** — repetition builds the field, a single event punctuates it. (ref: composition/001 · [EXTRACTED])
5. **Lead the eye with convergence** — one-point perspective / receding rhythm as arrows toward the first-read. (ref: composition/005 · [EXTRACTED])
6. **Choose symmetry deliberately** — asymmetric off-center against a void for tension (site default); reserve dead-center Kubrick symmetry for the globe/hero as the one monument. (ref: composition/010 · [EXTRACTED])
7. **Density is legitimate only when gridded** — seat dense data on an aligned grid ringed with breathing room; ungridded density is noise. (ref: composition/007 · [EXTRACTED])
8. **Structure layout with thin-rule cellular framing into named cells** (the web cousin of the HUD corner bracket) + a Swiss 3-zone grid keyed to one accent. (ref: composition/017 · [EXTRACTED]; composition/018 · [EXTRACTED])
9. **Oversized display type can be the composition** — let a giant header own the focal role over a dimmed bed, single accent only. (ref: composition/015 · [EXTRACTED])
10. **Hold measure discipline** — narrow text columns floating in wide empty margins (the textual form of sparse-subject-in-void); wide "letterbox" bands for hero/gallery media. (ref: composition/018 · [WORKING]; composition/005 · [WORKING])

---

## §8 — What changed from v2 (the elevations this study justifies)

v2 ("Sologram Noir") set the right *identity* from the deep-research dossier; v3 keeps that spine and sharpens it with studied references and measurement. Each change below is an elevation a later per-surface spec→plan→build will execute (details in the elevation briefs):

- **Color base is now measured, and split from the emitter.** v2 treated cyan as the site's blue. v3: the base is a *teal-black* at the value floor (≈`#0c1f22`, hue ~185–195°) and must be a **separate token** from the bright electric **emitter** cyan (`#39f0ff`). The current base literals `#05060a`/`#030407` read blue-black, not teal-black — crush and re-hue them. (ref: color/013 · [DATA])
- **The accent is now budgeted.** v3 sets an explicit ~1–6%-of-frame area budget for warm signal, and "one temperature per section, switched at boundaries" — a discipline v2 implied but never bounded. (ref: color/002 · [DATA])
- **The globe holo-shell loses its hard rim.** v3 mandates additive edge-falloff-into-scatter over any fresnel hard rim, and keeps the cool-shell / warm-emitter split from bleeding. (ref: globe/006 · [VERIFIED])
- **Rain gets gated on motivated light + reflections + splash landings.** v2 had depth rain and frame-sampling lens droplets (correct); v3 adds "rain is only bright where backlit," wet-ground emitter reflections, and a splash/wet-ring wherever localized rain lands. (ref: rain/023 · [VERIFIED]; rain/011 · [VERIFIED])
- **HUD grammar is now explicit and instrument-grounded.** v3 codifies the corner-bracket/leader/graticule/tabular-numeral/bracket-tag system from real instruments (F/A-18 HUD, oscilloscope) — and puts projection texture on the *content* layer while keeping chrome crisp. (ref: hud/022 · [VERIFIED]; hud/003 · [WORKING])
- **Motion gains measured timing and a restraint law.** v3 imports published GSAP timing (stagger ~14 ms, Power3 ease-out/in), the "one boxed keyword" state acknowledgment, the chromatic ghost-echo, and — most importantly — "animate the focus only." (ref: motion/001 · [EXTRACTED]; motion/008 · [VERIFIED])
- **Type formalizes the two-register split and the JP accent/content duality.** v3 pins the tracked-mono-vs-sentence-case rule, tabular figures, and the JP-as-accent (`.mm-ja`) vs JP-as-loud-content distinction. (ref: type/002 · [VERIFIED]; type/006 · [VERIFIED])
- **Composition adopts negative-space-first + luminance hierarchy + margin chrome + deliberate symmetry.** v3 makes "one focal element per viewport in a dark void, chrome to the margins, dead-center reserved for the globe monument" an explicit law. (ref: composition/005 · [VERIFIED]; composition/012 · [VERIFIED])

**Open debts carried forward** (from the study thin-areas): most non-color principles remain `[EXTRACTED]`/`[WORKING]` (no pixel-measurement pass — a standing library debt); `interfaceingame.com` and `artstation.com` page HTML are curl-blocked (game-UI and hand-painted color-scripts under-sampled; MCP-browser fallback available but unspent); MGS iDroid globe (fandom 402), true sheet-lightning, rain-through-hologram, and Drive-neon grade are named gaps. None blocks building; all are honest about confidence.
