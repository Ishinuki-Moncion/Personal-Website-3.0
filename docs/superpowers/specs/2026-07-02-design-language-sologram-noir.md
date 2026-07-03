> **Superseded by `2026-07-03-design-language-v3.md` (2026-07-03).** Kept for history per the research-library rule (corrections noted, never deleted).

# Design Language — "Sologram Noir" (v2)

The aesthetic north star for daikieOS. v2 is grounded in the deep-research
dossier at `docs/superpowers/research/2026-07-02-reference-dossier.md`
(confidence-tiered, sourced) — every visual decision on this site should be
defensible against this doc, and this doc against the dossier.

## The world in one line

**Precision instruments projected as light, floating in wet neon darkness.**

## Researched principles (and how they bind us)

1. **"Grunge, retro-tech, dystopian, functionality, clarity"** (Villeneuve's
   brief to Territory for BR2049). Two material registers coexist:
   - *The instrument register* (Wallace Corp): minimal, geometric, precise.
     → Our HUD frames, callout, verifier-grade typography, thin rules.
   - *The world register* (K's spinner): warped, ghosted, colour-degraded.
     → Our atmosphere: rain, haze, flicker, interference.
   A clean element must be an INSTRUMENT; a dirty element must be WEATHER.
   Nothing gets to be "clean nature" — that reads as space documentary, which
   the owner explicitly rejected (the fresnel atmosphere rim, removed).

2. **Solograms** (GITS 2017): holograms are "neon-lit solid light in Z-space" —
   particle-built, volumetric, alive. Light IS information here.
   → The Tokyo halo, labels, callout, scan shell are *projections*: additive,
   ghosted (RGB fringe), occasionally interfered (frame dropouts), never flat
   stickers. If an element cannot flicker, it isn't a hologram.

2b. **Tactical instruments** (Metal Gear Solid, owner reference): the Soliton
   radar, codec frequency readouts (140.85), iDroid's particulate blue
   holograms, waveform meters, and alert-state punctuation. This is the
   *military-precision* voice of the instrument register: sweeps, frequencies,
   coordinates, status lines that feel operational rather than decorative.
   → Our halo scan sweep, callout status line, and any future readouts speak
   codec: terse, monospaced, frequency-and-coordinate flavored. The signal-lock
   beat is our "alert state" — one deliberate spike, then discipline.

2c. **Scan-and-tag grammar** (Cyberpunk 2077, owner reference): the Kiroshi
   optics language — the world gets *scanned*, and scanned things acquire
   bracket-tags, floating readouts, and threat/status glyphs; transitions may
   glitch confidently (one hard tick, not noise soup). Palette stays ours
   (cyan/amber, not acid yellow); what we take is the interaction grammar:
   → hovering/focusing anything meaningful (gallery photo, project, district)
   should read as *scanning* it — bracket-tag snaps on, readout types in,
   a single glitch tick on acquisition. This is the Wave-3 interaction model.

3. **Light must be motivated.** Every glow has an emitter: Tokyo, the halo
   projector, lightning, city lights, neon. No ambient white, no unmotivated
   bloom.

4. **Darkness is the canvas.** ~80% of any frame stays near-black (#05060a).
   Wow comes from motion, depth, and light placement — never from raising
   overall brightness.

5. **Palette** (unchanged, now doctrine): void #05060a · neon cyan #39f0ff ·
   deep cyan #1c6f7a · amber #ff9e2c · soft amber #ffd9a0 · magenta/pink only
   inside holographic fringing · alert red and terminal green as micro-accents.

6. **Imperfection = life, but restraint = expensive** (v2 correction, VERIFIED
   research). Deakins on Joi: "I was always arguing for less" — pixelation
   tests were rejected as "too fussy"; the canon's most convincing hologram
   artifacts are *subtle transparency against highlights + matched lighting*.
   And in BR2049's grammar, heavy warping/ghosting/degradation encodes AGE and
   LOW STATUS — our Tokyo instruments are high-status and must artifact
   *rarely and quietly*. Bounded: fringe ghosts ≤ ~0.25 alpha at ≤1px-scale
   offsets; dropouts single-frame, ≲0.4/s per element; never strobe.

7. **The future's artifact is particulation** (v2, GITS solograms): holograms
   are particle systems of light in Z-space. Build-ins, acquisitions, and
   scan-tags should ASSEMBLE FROM PARTICLES (our globe already speaks this
   language) rather than glitch into existence.

8. **Holograms light their world** (v2, Pink Joi): holo elements are motivated
   emitters — glow-cast onto nearby scene elements is canon-correct.

9. **Tactical palette anchors** (v2, MGS data): instrument-panel family
   #0f394c field / #b2f5fd active, hue discipline 193–201; alert red
   (#BD2B25 family) is semantically loaded — hostile/alert ONLY. HUD
   numeral/tag face: Rajdhani (free Google Font, CP2077's shipped UI face);
   data lines stay monospace; JP glyphs first-class.

## Standing tests for any new visual

- Could this exist as a projection or weather in the world above? If neither,
  cut it.
- Does it read at 0.17-style restraint, earning attention through motion
  rather than luminance?
- Does it degrade to something meaningful under reduced-motion and LITE?
- Does the console stay clean and fps ≥ 55 desktop / ≥ 40 LITE with it live?

## Rejected directions (do not resurrect)

- Realistic atmospheric rim ("orbital photography") — owner-rejected 2026-07-02.
- Full-screen CRT/scanline overlay — owner-rejected 2026-07-02.
- Uniform-velocity texture rain ("lines") — replaced by parallax particles.
