# Design Language — "Sologram Noir"

The aesthetic north star for daikieOS, synthesized from the owner's references
(Blade Runner / "Sony cinematic futuristic") and researched source material:
Territory Studio's BR2049 screen-graphics language and GITS 2017's "sologram"
city. Every visual decision on this site should be defensible against this doc.

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

3. **Light must be motivated.** Every glow has an emitter: Tokyo, the halo
   projector, lightning, city lights, neon. No ambient white, no unmotivated
   bloom.

4. **Darkness is the canvas.** ~80% of any frame stays near-black (#05060a).
   Wow comes from motion, depth, and light placement — never from raising
   overall brightness.

5. **Palette** (unchanged, now doctrine): void #05060a · neon cyan #39f0ff ·
   deep cyan #1c6f7a · amber #ff9e2c · soft amber #ffd9a0 · magenta/pink only
   inside holographic fringing · alert red and terminal green as micro-accents.

6. **Imperfection = life.** Interference dropouts, projector shimmer, wander,
   gusts. Perfectly steady elements read as PNG, not projection. (Bounded:
   dropouts are single-frame and rare; never strobe, never loop visibly.)

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
