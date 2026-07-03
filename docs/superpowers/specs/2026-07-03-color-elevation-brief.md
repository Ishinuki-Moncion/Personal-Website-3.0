# Color — Elevation Brief (2026-07-03)

Source rules: design-language-v3 §6 (Color & Grade) + §0 Spine laws 1–4. Study: `2026-07-03-color-visual-study.md` (P1, P2, P5, P9, P13, P14).

This brief is the *what/why* for the site's base grade and accent discipline — not the build. Every lever cites a real `file:line`; proposed hexes carry their measured hue/luminance so the re-hue is auditable. New tokens are marked **(new)**.

---

## Current state

The whole color system is a small token block in `css/site.css:6–33`, mirrored by literals in the WebGL scene (`js/background.js`).

**Base-field family (the near-black the site sits on) — all read BLUE-black:**
- `--void: #05060a` — `css/site.css:7`. The canonical field; painted as `background: var(--void)` on `html`/`body` (`:39`, `:45`) and reused as the reveal-wipe fill (`:388`), scrolled-nav gradient (`:238`), and as *foreground* text on cyan chips (`::selection :57`, `.pill:hover :623`, `.seg button.on :657`). Measured hue ≈ **228° (blue)**, luminance ≈ L6.
- `--void-2: #080a10` — `css/site.css:8` (gallery tile bed `:564`). Hue ≈ 225° (blue), L≈10.
- `--panel: rgba(8,10,16,.55)` / `--panel-solid: rgba(7,9,14,.92)` — `css/site.css:9–10`. Same blue-black, translucent.
- Boot / overlay floors, even darker blue-black: `.boot { background:#030407 }` `css/site.css:184` (hue ≈ 228°, L≈4); `.mobile-menu rgba(3,4,7,.97)` `:289`; `.lightbox rgba(2,3,6,.96)` `:582`.
- Scene fog literal: `scene.fog = new THREE.FogExp2(0x05060a, 0.05)` — `js/background.js:65`. The atmospheric haze is the **same blue-black** as `--void`.

**Emitter + signal (these are correct, keep):**
- `--cyan: #39f0ff` — `css/site.css:11`; mirrored `CYAN = 0x39f0ff` `js/background.js:7`. A **bright electric emitter**, hue ≈ 184°, L≈86.
- `--amber: #ff9e2c` — `css/site.css:13`; `AMBER = 0xff9e2c` `js/background.js:7`. Warm signal.
- Dims/glows: `--cyan-dim #1c6f7a` `:12`, `--amber-dim #7a4d14` `:14`, `--bloom-cyan` `:20`, `--bloom-amber` `:21` (both same-hue additive shadows — correct mechanism).

**Already-teal deep tones (proof the base is the outlier):** the instrument layer is *not* blue-black — `DL.instrumentField = 0x0f394c` (hue ≈ 199°, teal) `js/background.js:859` and the synthwave grid's second color `0x10303a` (hue ≈ 192°, teal) `:1321`. The dark teal the film grade calls for **already exists in the scene**; only the base field, fog, and boot floors are blue.

**Accent spread (over-budget in two places):** amber is mostly disciplined as point marks (nav brackets `css/site.css:252–255`, `.live-tag` `:523–526`, `.sec-label .idx` `:367`, cursor-label `:171`), but two layers wash amber across large area *in the same frame as cyan*:
- `.scene-glass` — `css/site.css:113–116`: a full-viewport layer carrying **both** a cyan radial `rgba(57,240,255,.12)` and an amber radial `rgba(255,158,44,.10)`.
- `.about-portrait .duo` — `css/site.css:488–489`: `linear-gradient(160deg, rgba(57,240,255,.28), rgba(255,158,44,.12))` at `mix-blend-mode:color` over the entire portrait — the largest in-frame teal+amber dapple on the site.

---

## Target intent

The v3 grade is a **teal-black cyber-noir at the value floor**, where the base is a stable, desaturated member of the teal family (distinct from the bright emitter), the warm accent is a metered ~1–6% of frame, and any sense of "glow" comes from bloom and atmospheric fog rather than a lifted base.

- Base sits at the value floor and reads **teal-black, not blue-black** — the field's hue lands in the film's measured teal band (~185–195°), held down, never lifted to a comfortable grey UI. (ref: color/002 · [DATA]; ref: color/013 · [DATA])
- The base is a **separate desaturated dark-teal token** from the electric emitter cyan — same hue family, but the base is dark+desaturated and is *never* produced by tinting with `--cyan #39f0ff`. (ref: color/013 · [DATA])
- **One temperature per view.** Cyan carries the instrument; amber is a metered signal at ~1–6% of frame area; "teal AND orange" is a cut across the edit, never an in-frame dapple. (ref: color/004 · [DATA]; ref: color/010 · [VERIFIED])
- **Light lives in the air, not the midtones.** Separation and mood come from a bloomed same-hue core+halo and an atmospheric fog in the base hue that deepens with distance — not from raising the base toward grey. (ref: color/005 · [DATA]; ref: color/013 · [DATA]; ref: color/009 · [EXTRACTED])

---

## Concrete code levers

Four token-level levers, one per target from study P14. Each gives current value → proposed value at a real `file:line`.

**(a) Crush the base to a TEAL-black floor.** The base is already near-black in luminance; the elevation is the **hue** (blue → teal) at the same floor, plus holding it down.
- Lever: re-hue `--void: #05060a` → **`#0c1f22`** — `css/site.css:7`. Blue-black (hue ~228°, L6) → teal-black (hue ~188°, L~27), squarely inside the film's measured teal base band (study P9: #08080b–#1b2b2e). If a darker true-floor variant is wanted, use `#0a1416` (hue ~190°, L~18, below the P1 ~L20 ceiling).
- Companion re-hues (same swap, keep them a family): `--void-2: #080a10` → **`#0e181a`** `css/site.css:8`; `--panel`/`--panel-solid` `:9–10` → teal-black rgba of the same base.
- (ref: color/002 · [DATA])

**(b) Split the base from the emitter with a dedicated dark-teal base token (new).** The emitter (`#39f0ff`, hue ~184°) and the base (hue ~188°) share a hue family — the split is **value + saturation**, so the rule is: never derive the base from `--cyan`.
- Lever: introduce **`--base: #0c1f22` (new)** and **`--base-deep: #071417` (new, hue ~190°, L~10)** in the `:root` block `css/site.css:6–33`; repoint the field literals at them — `--void`/`--void-2` alias `--base`; the boot/overlay floors `.boot #030407` `css/site.css:184`, `.mobile-menu rgba(3,4,7,.97)` `:289`, `.lightbox rgba(2,3,6,.96)` `:582` point at `--base-deep`. `--cyan #39f0ff` `:11` stays the emitter, untouched.
- (ref: color/013 · [DATA])

**(c) Enforce the ~1–6% accent-area budget (no new token — an audit + two area fixes).** Keep amber as point-emitters; remove the two area washes that put warm and cool at comparable area in one frame.
- Lever: in `.scene-glass` drop (or gate to a rare state) the amber radial `rgba(255,158,44,.10)` → single-temperature cyan atmosphere — `css/site.css:116`.
- Lever: in `.about-portrait .duo` change `linear-gradient(160deg, rgba(57,240,255,.28), rgba(255,158,44,.12))` → a **single-temperature** cyan duotone (drop the amber stop) — `css/site.css:489`.
- Governance: document "warm-bearing area ≤ ~6% per viewport; switch temperature at section boundaries, not within a frame." The existing point-amber marks (`:252–255`, `:367`, `:523–526`, `:171`) are within budget — leave them.
- (ref: color/004 · [DATA]; ref: color/010 · [VERIFIED])

**(d) Let bloom + atmospheric fog carry the color instead of raising midtones.** Base tokens go *down* (crushed teal-black from levers a/b); the lift comes from the emitter/bloom/fog layers that already exist.
- Lever: re-hue the scene fog `FogExp2(0x05060a, …)` → **`0x0a1a1d`** (teal-black, matches `--base`) — `js/background.js:65`. This makes the volumetric haze carry the base hue (the "grade lives in the air" mechanism), optionally nudging density 0.05 → ~0.06 so distance deepens in-hue.
- Lever: keep `--bloom-cyan` `css/site.css:20` and `--bloom-amber` `:21` as the *only* source of "glow"; do **not** lighten `--void`/`--void-2` to fake ambient light. The `.scene-glass` cyan radial (`:113–115`) is retained as the CSS atmospheric layer that carries color at low opacity.
- (ref: color/005 · [DATA]; ref: color/013 · [DATA])

---

## Before / after

- **Before:** the field reads as a cool blue-black; deep tones sit at hue ~228° while the instrument grid is already teal (~192–199°) — a subtle hue mismatch between base and instruments. Amber leaks across the portrait and the atmospheric glass, so two temperatures share the frame.
- **After:** the whole field is one crushed teal-black at the value floor, fused with the already-teal instrument layer into a single graded world; cyan and amber never share a frame at comparable area; the only light in the dark comes from bloomed emitter cores and an in-hue fog. The change reads as "the black got its color right," not as a brightness change.

---

## Out of scope / risks

**Out of scope (owned by other briefs / phases):** the amber signal hue `#ff9e2c` itself (kept as-is); globe emitter/atmosphere re-hue (globe brief); rain droplet/streak colors `RAIN_CYAN/RAIN_AMBER` `js/background.js:1134` (rain brief); the *cadence* of temperature switching at boundaries (motion brief); green "living/other" third accent `terminal: 0x8dffb3` `js/background.js:56` (kept rare, not touched here).

**Risks:**
- `--void` is consumed ~10 places including as a **foreground** on cyan chips (`::selection :57`, `.pill:hover :623`, `.seg button.on :657`). Re-hueing to teal-black stays dark and safe there, but do it as a **token swap**, not a literal-by-literal search, and eyeball those three chips for contrast.
- The proposed `#0c1f22` is a *re-hue at the floor*, slightly **higher luminance** (L~27) than today's `#05060a` (L6) — it is not a darkening. Confirm it still reads near-black on the target displays; drop to `#0a1416` (L~18) if the field feels lifted.
- Changing the `FogExp2` hue shifts how additively-blended scene points read against the haze (`js/background.js` uses AdditiveBlending for halo/field points, e.g. `:458`). Re-check the globe halo and starfield after the fog re-hue.
- `[DATA]` tokens are PIL-measured off compressed, already-graded film frames (study "Thin areas") — reliable as *relative* hue/value structure (teal family, floor luminance, area ratios), not colorimetric spec. Treat `#0c1f22` as a target center, tune by eye on-device.
