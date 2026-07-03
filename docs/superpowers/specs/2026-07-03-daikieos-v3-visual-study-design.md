# daikieOS v3 — Concept-Art Visual Study (Study-First Design)

**Date:** 2026-07-03
**Status:** Ratified design (brainstorming output) — awaiting spec review before planning.
**Type:** Research / visual-study methodology + deliverables spec.
**Supersedes:** nothing. **Extends** `docs/superpowers/research/` and
`docs/superpowers/specs/2026-07-02-design-language-sologram-noir.md`.

---

## 1. Objective

Build **one complete, vision-grounded visual study** across every surface of the
site, distilled into a **daikieOS Visual Language v3** and a set of concrete
**elevation briefs** — *before any code changes*.

The study is how we learn the concept-art boundaries we can push — globe, rain,
UI, UX, typography, color, composition — so the next build **elevates with
intent** instead of repeating a remembered vibe. We think like a concept artist
first (reference → principle → language → brief), then execute with the best
code in a later phase.

## 2. Why — the failure this is built to *not* repeat

The previous research attempt is preserved in `docs/superpowers/research/` and it
failed in specific, diagnosable ways. This plan is shaped as the direct inverse
of each one:

| Past failure | This plan's inversion |
|---|---|
| Produced **prose, not pictures** — the dossier *describes* BR2049/GITS/MGS/CP2077 in words and tiers most of it `EXTRACTED` (quoted, unverified). You cannot learn concept art from text. | **Vision-grounded.** Real frames are captured to disk and *looked at*; every principle traces to a pinned image. `EXTRACTED` is upgraded to `VERIFIED` by actually seeing. |
| A **fragile, all-or-nothing agent fan-out** that died to a spend limit. | **Bounded, resumable, single-threaded.** Each surface is a self-contained checkpoint; the on-disk board survives any interruption. |
| **No visual artifacts** — nothing on disk to design against; every build since was designed from memory of a vibe. | **A persistent reference board** (`refs/<surface>/`) is a first-class deliverable. |
| Leaned on **web search** — wrong tool for visual material (the library README itself notes "frame-by-frame reference study rather than search"). | **Capture-and-study**, not search-and-summarize. Search only *discovers* candidate URLs. |

## 3. Scope

**In scope (this phase):** the seven surfaces below, a deliberately broadened
reference net, and the five deliverables in §7.

**Out of scope (this phase):** writing or altering any site code. The elevation
briefs are the hand-off; a **later elevation phase** executes them, each surface
getting its own spec → plan → build. This boundary is intentional — the user
chose "full study first."

## 4. The seven surfaces

1. **Globe** — the centerpiece: holographic planet, terminator, city emitters,
   scan shell, satellites, downlink.
2. **Rain & weather** — depth rain, rain-on-glass droplets, sheet lightning,
   atmosphere.
3. **HUD / UI chrome** — nav, frame corners, section labels, control deck, boot
   sequence, scroll HUD, lightbox.
4. **Motion / UX** — easing, stagger, decrypt/typewriter, custom cursor,
   transitions, micro-interactions — the *feel*.
5. **Typography & bilingual** — EN/JP pairing, technical grids, FUI type.
6. **Color & grade** — the noir teal/amber script, neon-on-dark, value structure.
7. **Composition & layout** — grid, negative space, information hierarchy,
   framing devices.

## 5. Reference net — *what types of visuals to reference*

**Principle: keep the noir spine, broaden the influences.** The last build
echoed a single canon (BR2049 / GITS / MGS / CP2077) and read as derivative of
it. We keep that canon as the **spine** but deliberately tap under-used veins so
the result elevates rather than repeats. The breadth *is* the point.

Per surface, the reference domains + the principles to extract:

### 5.1 Globe
- **Film FUI:** BR2049 (Territory Studio), Ghost in the Shell (1995 + 2017)
  solograms, Prometheus/Alien holo-tables, MCU holo-globes (Cantina Creative),
  The Expanse tactical displays, Oblivion.
- **Game maps/holos:** MGSV iDroid, Destiny Director, Cyberpunk 2077 map, Elite
  Dangerous galaxy map, XCOM Geoscape, Helldivers galactic war, Watch Dogs ctOS.
- **Real viz:** NASA Eyes on the Earth, CesiumJS demos, NASA Worldview/GIBS,
  GOES/Himawari satellite imagery, ISS/flight-radar globes, day-night terminator.
- **Concept/motion:** ArtStation "holographic globe / hologram UI / sci-fi map";
  GMUNK, Ash Thorp, Territory Studio, Cantina Creative portfolios.
- **Extract:** how holograms *read* (scanlines, additive glow, edge falloff,
  parallax, wireframe vs filled, ground-glow emitters, color temperature),
  terminator rendering, label legibility at density.

### 5.2 Rain & weather
- **Cinematography:** BR2049 + Blade Runner (1982) rain, Se7en, noir rain
  lighting (Deakins refs).
- **Anime:** Makoto Shinkai (Garden of Words, Weathering With You) rain and
  rain-on-glass.
- **VFX/photo:** Houdini rain/particle reels, macro rain-on-glass, windshield /
  lens droplet refraction studies.
- **Games:** Death Stranding timefall, Cyberpunk 2077 / GTA rain shaders,
  screen-space rain-on-glass.
- **Extract:** depth layering, droplets refracting the frame behind them, streak
  vs particle, motivated sheet lightning, atmospheric perspective, wet-glass bead.

### 5.3 HUD / UI chrome
- **FUI studios/designers:** Territory Studio, Ash Thorp, GMUNK, Cantina
  Creative, Perception, Jayse Hansen; the *Interface In Game* archive.
- **Game UI:** Cyberpunk 2077 (scan/braindance), Destiny, Halo, Death Stranding,
  Deus Ex, MGSV, Alien: Isolation, Observer.
- **Real instruments:** aerospace / mission-control panels, aircraft HUD, camera
  EVF overlays, oscilloscopes, Teenage Engineering hardware.
- **Extract:** corner brackets, tick systems, mono-grid alignment, data-label
  grammar, bracket tags, live readouts, *restraint* (how much is "on"), hierarchy.

### 5.4 Motion / UX
- **Motion design:** FUI animation reels, decrypt/scramble text, terminal boot
  sequences, glitch/chromatic transitions, particle-assembly (CP2077 scan tag).
- **Web interaction:** Awwwards / Codrops / cargo for tactile interactions;
  magnetic cursors; reveal choreography.
- **Extract:** easing curves, stagger rhythm, "system responding" feedback,
  cursor states, reveal timing, and — critically — *when not to animate*.

### 5.5 Typography & bilingual
- Japanese graphic & sci-fi typography; technical/monospace grids;
  Rajdhani / JetBrains / Space Mono in FUI; katakana/kanji as texture; Swiss
  international style; military stencil; anime title cards; game menu type.
- **Extract:** EN/JP pairing, weight contrast, tracking, mono grids, JP as
  accent/texture vs content, technical numerals.

### 5.6 Color & grade
- BR2049 color script (teal / amber / orange), noir neon-on-dark, cyberpunk key
  art, film-grab palettes, ArtStation color scripts.
- **Extract:** value structure (how dark the darks sit), accent discipline (amber
  signal on a cyan field), neon bloom, grade consistency, contrast ratios.

### 5.7 Composition & layout
- Swiss/editorial grid, FUI screen composition, negative space in noir framing,
  HUD information layout, brutalist web, film framing stills.
- **Extract:** grid, negative space, focal hierarchy, framing devices (corner
  HUD), eye-path, density vs breathing room.

## 6. Method — autonomous, cost-smart, resumable

Per surface, in order:

1. **Discover** with WebSearch / WebFetch (cheap text) → exact image + source-page
   URLs. Interactive MCP browser is a **sparing fallback**, only for JS-gated
   galleries with no direct image URL.
2. **Capture** with `curl` straight to `refs/<surface>/` — essentially free,
   *zero vision tokens*. Write a one-line sidecar per image (source URL, why,
   first-read principle).
3. **Downscale** with macOS-native `sips -Z 1400` (built in, no install, free) so
   each image is cheap to view.
4. **Study** by `Read`-ing only the curated keepers — the analyst decides how
   many enter context, so vision cost is deliberate and bounded.
5. **Extract** principles into the surface's research entry, each tagged with a
   confidence tier and pinned to its image.

**Operational settings (ratified):**
- **Guard rails:** the fact-forcing GateGuard hook is disabled for this work
  (`ECC_GATEGUARD=off` or `ECC_DISABLED_HOOKS`), because the phase is
  capture-heavy and the gate fires on every Bash/Write/Edit.
- **No ultracode / multi-agent.** The binding constraint is the vision-token cost
  of studying images; parallel agents don't reduce it (they inflate it), and a
  fan-out is what died last time. **Max, single-threaded.**
- **Caps per surface:** ~25 images captured / ~10 studied at full vision (tunable
  per surface), plus a **running cost checkpoint** noted at each surface boundary.

## 7. Deliverables

1. **Reference board on disk** — `docs/superpowers/research/refs/<surface>/`,
   curated + tagged with source and rationale.
2. **Seven per-surface study entries** —
   `docs/superpowers/research/2026-07-03-<surface>-visual-study.md`, each with
   pinned images + extracted principles + confidence tiers.
3. **daikieOS Visual Language v3** — the distilled spine + per-surface rules, each
   rule *traced to a pinned reference*. Updates the design-language doc;
   supersessions noted per the library README, never silently deleted.
4. **Seven elevation briefs** —
   `docs/superpowers/specs/2026-07-03-<surface>-elevation-brief.md`, each wiring a
   principle to a concrete code lever (globe material/shader, rain particle
   system, HUD chrome, motion curves) with target intent + before/after.
5. **A north-star** — one written description (and, if a single frame captures it,
   one pinned key-art reference) of the target *feel* the whole site renders
   toward.

## 8. Confidence tiers (reused from the library)

**[VERIFIED]** adversarially checked · **[EXTRACTED]** quoted from a primary
source, unchecked · **[DATA]** measured values · **[WORKING]** practitioner
judgment, no source yet. Every principle that will drive a visual decision
carries a tier and a source.

## 9. Sequence & checkpoints

Globe → Rain → HUD → Motion → Type → Color → Composition — each a resumable
checkpoint that commits its `refs/` + study entry before the next begins. After
all seven: **synthesis** into the v3 visual language, the seven elevation briefs,
and the north-star.

## 10. Guardrails, cost, ethics

- **Spend-safe by construction:** per-surface caps + cost checkpoints; capture is
  free, only deliberate `Read`s cost vision tokens; on-disk board is durable, so
  an interruption never loses work.
- **Ethics:** references are private, on-disk *study aids*. We extract principles
  and build our own work; we do not ship anyone else's art. `refs/` may be
  git-ignored if we prefer not to commit third-party images — decided at write
  time (see open questions).
- **Library discipline:** extends `docs/superpowers/research/` per its README;
  one topic per dated file; corrections noted, entries never silently deleted.

## 11. Definition of done

- For each of the seven surfaces: `refs/<surface>/` populated to cap, keepers
  studied, and a study entry written with tiered, image-pinned principles.
- daikieOS Visual Language v3 written, every rule traced to a pinned reference.
- Seven elevation briefs written, each with concrete code levers + before/after
  intent.
- North-star written.
- Board + docs committed; running cost noted at each checkpoint.

## 12. Risks & open questions

- **Reference quality/sourcing:** some domains (film frames, hologram motion
  timing) are scarce or paywalled. *Mitigation:* multiple source types per
  surface; fall back to frame-study of trailers/stills; mark thin areas honestly
  with tiers.
- **Token-cost creep:** studying too many images. *Mitigation:* hard caps +
  checkpoints; curate on disk (free) before Reading (costed).
- **Taste drift:** breadth could dilute the identity. *Mitigation:* the noir
  spine is fixed; breadth serves it, and the north-star is the anchor the owner
  signs off on.
- **Open — commit `refs/`?** Decide at write time whether third-party reference
  images are committed or git-ignored (durability vs. not committing others'
  art). Default proposal: git-ignore the raw images, commit the study entries +
  low-res contact-sheet crops we make ourselves.

## 13. Connection to the later elevation phase

The seven elevation briefs are the bridge. When the study is done and the
north-star is signed off, each surface is elevated in its own cycle
(spec → plan → build → verify), executing its brief against the v3 language and
the pinned board. No surface is touched in *this* phase.
