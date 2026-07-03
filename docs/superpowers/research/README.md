# Research Library

The living evidence base for this site's design decisions. The design language
(`../specs/2026-07-03-design-language-v3.md` — which supersedes the v2
`2026-07-02-design-language-sologram-noir.md`) must be defensible against what's
in here; anything built should trace to an entry.

## Index

- `2026-07-02-reference-dossier.md` — the founding dossier: BR2049 screen
  graphics (VERIFIED), GITS solograms, MGS tactical UI data, CP2077 scan
  grammar, Sony futurism (thin). Confidence tiers inside.
- **2026-07-03 concept-art visual study** — a seven-surface reference board
  (**109 curated frames → 98 tier-tagged, image-pinned principles**). Raw frames
  are git-ignored (`refs/<surface>/`); provenance + principles live in each entry:
  - `2026-07-03-globe-visual-study.md` — 13 frames / 15 principles (calibration surface)
  - `2026-07-03-rain-visual-study.md` — 13 frames / 15 principles
  - `2026-07-03-hud-visual-study.md` — 19 frames / 15 principles
  - `2026-07-03-motion-visual-study.md` — 17 frames / 14 principles (temporal)
  - `2026-07-03-type-visual-study.md` — 18 frames / 14 principles
  - `2026-07-03-color-visual-study.md` — 14 frames / 14 principles (measured **[DATA]** via PIL)
  - `2026-07-03-composition-visual-study.md` — 15 frames / 15 principles
  Synthesized into `../specs/2026-07-03-design-language-v3.md`, seven
  `../specs/2026-07-03-<surface>-elevation-brief.md` (principle → code lever), and
  `../specs/2026-07-03-north-star.md` (owner sign-off anchor).
- **`2026-07-03-threejs-capability-ceiling.md`** — the *technical* feasibility base
  for the **Plan C** build (bloom / shaders / interactivity in vanilla Three.js,
  UMD-global r158, no build). Five parallel research streams, tier-tagged and
  link-sourced. Key finding: shaders + interactivity are **pure-no-build**;
  official bloom is jsm-only *and* breaks the transparent canvas, so **bloom is a
  strategy fork** — hand-rolled additive (Path 1, recommended) vs import-map
  official post (Path 2). Grounds the forthcoming Plan-C design doc.

## How to add research

1. One topic per file, named `YYYY-MM-DD-<topic>.md`.
2. Every claim that drives a visual decision carries a source URL and a
   confidence tier: **[VERIFIED]** (adversarially checked), **[EXTRACTED]**
   (quoted from a primary source, unchecked), **[DATA]** (measured values),
   or **[WORKING]** (practitioner judgment, no source yet).
3. When a claim is acted on, cite the file/tier in the code comment or commit.
4. When new evidence contradicts the design language, update the design
   language and note the supersession here — the library only grows; entries
   are corrected, never silently deleted.

## Open debts

- **v2 → v3 supersession (2026-07-03):** the sologram-noir design language is
  superseded by `../specs/2026-07-03-design-language-v3.md`, grounded in the
  seven-surface study. Several dossier **[EXTRACTED]** intuitions are now
  cross-checked **[VERIFIED]** against real references — the near-black
  "light-is-an-event" base, the cool-instrument / warm-signal split, rimless
  additive holograms, the HUD corner-bracket / graticule / tabular-numeral
  grammar, and "animate the focus only." Color went further to **[DATA]**
  (PIL-measured value floor ~88% of frame below quarter-grey, 1–6% warm-accent
  budget, stable teal-black base ≈`#0c1f22` distinct from emitter cyan `#39f0ff`).
- **Measurement debt persists:** only the color surface produced [DATA]; globe /
  rain / hud / motion / type / composition principles remain [EXTRACTED]/[WORKING]
  (no pixel-measurement pass). Hologram/motion timing data is still wanted
  (film/game motion specs are scarce — frame-by-frame study needed).
- **Blocked sources (curl):** `interfaceingame.com` and `artstation.com` page
  HTML are Cloudflare-gated (403); `fandom.com` 402s WebFetch. Consequences:
  game-UI layout, hand-painted color-scripts, and the MGS iDroid globe are
  under-sampled; the MCP-browser screenshot fallback is available but was left
  unspent. Named frame gaps: true sheet-lightning, rain-through-hologram,
  Drive-neon grade, a bilingual game-menu (e.g. Ghost of Tsushima).
- The founding dossier's remaining [EXTRACTED] tier still awaits full
  re-verification; the Sony-futurism thread is the weakest and should be
  researched properly before any wave leans on it.
