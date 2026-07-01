# Cyberpunk Three.js Future Work

## Purpose

This document captures potential next upgrades for the portfolio's Three.js earth scene before implementation starts. The goal is to push the scene further toward a Blade Runner-inspired, techno-Japanese cyberpunk atmosphere while preserving the current strengths: the particle earth, Dallas-to-Tokyo story, Tokyo focus, high-motion cyberpunk editorial style, and static no-build deployment.

This is planning only. Runtime code should not be changed from this document alone. Use it as the source of truth when writing the next implementation plan.

## Current Baseline

The current branch already upgraded the earth scene from a generic background into a personal visual system:

- Local generated global Three.js build, still usable from `file://`.
- Land-mask particle earth generated from baked local data, not network data.
- Dallas and Tokyo as structured places.
- Dallas-to-Tokyo great-circle route arc.
- Tokyo-focused callout drawn with a canvas texture.
- Section-aware scene focus through `window.__sceneFocus(sectionId)`.
- Quality profiles for desktop, lite, and reduced-motion modes.
- Geometry diagnostics and a debug overlay available through `?sceneDebug=1`.

The next pass should not replace this baseline. It should layer stronger mood, light, and story on top of it.

## North Star

The scene should feel like a wet Tokyo night seen through a futuristic navigation interface:

- Neon light should feel like it emits into air, not just colored geometry.
- The Tokyo endpoint should feel like a live signal hub.
- Japanese typography should feel embedded in the interface, not pasted on as decoration.
- The Dallas-to-Tokyo route should remain a personal narrative, not a random sci-fi effect.
- The page content must remain readable and primary.
- The scene must still feel premium, not noisy or game-like.

Useful aesthetic keywords:

- Neo-noir Tokyo.
- Holographic transit map.
- Rain on glass.
- Amber/cyan neon.
- Dense but controlled HUD microtype.
- Terminal signal diagnostics.
- Night-side earth with rim light.
- Camera shutter and exposure language for gallery moments.

Avoid:

- Generic purple sci-fi gradients.
- Random matrix-code curtains.
- Overcrowded HUD boxes.
- Full-screen text that competes with the hero title.
- Heavy live-data gimmicks that make the page fragile.
- Effects that only look good on desktop and collapse on mobile.

## Recommended Direction

The best next pass is a three-part visual upgrade:

1. Add lightweight post-processing atmosphere: bloom-like glow, vignette, film grain, subtle chromatic edge separation, and optional scan distortion.
2. Add a Tokyo holographic halo: rings, station ticks, district labels, local-time/status microcopy, and route pulses around the Tokyo node.
3. Add rain/glass atmosphere: foreground rain streaks, mist depth, and reflective scanlines that make the scene feel like it sits behind a pane of neon glass.

These three upgrades provide the largest mood improvement without turning the static portfolio into a heavy WebGL application.

## Design Principles

### Keep The Earth As The Anchor

The globe is the memorable object. New effects should support it, not bury it. If a feature makes the earth harder to read within three seconds, reduce its opacity, density, or frequency.

### Use Japanese Details With Specificity

Japanese labels should be concrete and restrained. Good candidates:

- `東京`
- `渋谷`
- `新宿`
- `秋葉原`
- `品川`
- `JST`
- `緯度`
- `経度`
- `信号`
- `接続`

The labels should act like coordinates, station names, or system status. They should not become decorative wallpaper.

### Prefer Procedural Local Data

The current site works without runtime network access. Keep that property. Use small local arrays for district labels, route ticks, and UI copy. If live data is ever added later, it should be optional and degrade to the local dataset.

### Intensify By Section

The scene already has section focus. The next version should use that architecture more deliberately:

- `home`: cinematic boot, Tokyo signal lock, route replay.
- `about`: Dallas-to-Tokyo story, two-node pulse, route explanation.
- `work`: data packets and production signal around Tokyo.
- `gallery`: exposure brackets, shutter sweeps, calmer callout.
- `projects`: quieter origin/archive mode, Dallas as an earlier-work node.
- `contact`: comms-ready lock, Tokyo local time, signal panel.

### Keep Motion Expensive Only When Worth It

Per-frame updates should remain cheap: uniforms, transforms, opacity, draw ranges, and a few particle positions. Avoid rebuilding large buffers every frame.

## Feature Candidates

## 1. Post-Processing Atmosphere

### What It Adds

A subtle cinematic pass that makes existing neon geometry feel luminous:

- Bloom-like glow around bright particles and route lines.
- Dark vignette at the viewport edges.
- Fine film grain/noise.
- Slight chromatic offset near high-contrast edges.
- Very light scanline shimmer.

### Why It Helps

Cyberpunk aesthetics depend heavily on light bleeding into dark air. The current colors are strong, but without a glow pass some elements still read as crisp computer graphics rather than wet neon.

### Implementation Options

#### Option A: No-dependency CSS and shader approach

Use CSS overlays and existing shader materials:

- Add CSS pseudo/DOM overlays for vignette, grain, and scanlines.
- Add glow through shader color/intensity and additive transparent geometry.
- Add duplicated larger, softer route/halo geometry for bloom-like light.

Pros:

- Keeps `file://` support simple.
- No new vendor examples or module imports.
- Lower risk.

Cons:

- Not true post-processing.
- Bloom will be approximate.

#### Option B: Vendor Three.js post-processing examples

Bundle `EffectComposer`, `RenderPass`, and `UnrealBloomPass` from the same Three revision.

Pros:

- Real bloom looks better.
- More scalable if future effects need composer passes.

Cons:

- More files and maintenance.
- Harder to preserve the simple global-script architecture.
- Needs careful browser verification under `file://`.

Recommendation: start with Option A. Only move to Option B if the visual result is not strong enough.

### Acceptance Criteria

- Neon reads as emitted light.
- Text and main content remain readable.
- No bloom-like layer covers the entire viewport.
- Reduced-motion mode shows a stable static composition with no flicker.
- Mobile does not lose contrast or frame rate.

## 2. Tokyo Holographic Halo

### What It Adds

A set of controlled holographic elements around the Tokyo node:

- One or two tilted rings orbiting the Tokyo vector.
- Short station ticks on the ring.
- Small canvas-text labels for Tokyo districts.
- Local status labels such as `JST`, `SIGNAL`, `LAT`, `LON`, and `TOKYO NODE`.
- Pulse packets that move around the ring when sections change.

### Why It Helps

The Tokyo node is already the endpoint of the personal route. A halo makes it feel like the active base of operations rather than just a marker dot.

### Data Model

Use a local array, not live data:

```javascript
const TOKYO_HALO_LABELS = [
  { id: 'tokyo', jp: '東京', en: 'TOKYO', angle: 0, priority: 1 },
  { id: 'shibuya', jp: '渋谷', en: 'SHIBUYA', angle: 42, priority: 2 },
  { id: 'shinjuku', jp: '新宿', en: 'SHINJUKU', angle: 112, priority: 2 },
  { id: 'akihabara', jp: '秋葉原', en: 'AKIHABARA', angle: 205, priority: 3 },
  { id: 'shinagawa', jp: '品川', en: 'SHINAGAWA', angle: 292, priority: 3 }
];
```

Priority controls which labels survive in LITE mode.

### Visual Treatment

- Rings: cyan with amber pulses, additive blending.
- Ticks: tiny radial bars, not full labels everywhere.
- Labels: canvas textures, very small, camera-facing, opacity-gated by facing angle.
- Motion: slow orbital drift, with a faster pulse only when the section changes.

### Acceptance Criteria

- Tokyo feels like a focal signal hub.
- Labels are readable only when they are meant to be readable.
- LITE mode keeps only Tokyo plus one or two status labels.
- The halo does not look like a decorative loading spinner.

## 3. Rain And Glass Atmosphere

### What It Adds

A foreground layer suggesting a wet city window:

- Thin vertical rain streaks.
- Occasional diagonal wind streaks.
- Low-opacity mist bands.
- Glass reflection lines that catch cyan/amber.
- Optional mouse/cursor parallax on the rain layer.

### Why It Helps

The scene currently feels like outer space and data. Rain/glass would pull it closer to Blade Runner and Tokyo street atmosphere without requiring literal city imagery.

### Implementation Options

#### Option A: CSS overlay

Use `::before` / `::after` overlays or a lightweight DOM layer with repeating gradients.

Pros:

- Very cheap.
- Easy to disable under reduced motion.
- Does not complicate Three.js.

Cons:

- Less depth-aware.
- Can look flat if overused.

#### Option B: Three.js line particles

Add rain as line segments in front of the camera, with depth and parallax.

Pros:

- More integrated with the scene.
- Can react to camera movement.

Cons:

- More per-frame motion.
- Needs strict density caps.

Recommendation: CSS overlay first, with optional Three.js rain only if the overlay feels too flat.

### Acceptance Criteria

- Rain is visible but subtle.
- It never crosses into fake "weather app" territory.
- It does not reduce title readability.
- Reduced-motion mode freezes or hides the animated streaks.

## 4. Japanese Transit-Map Geometry

### What It Adds

Thin neon route geometry inspired by Tokyo rail diagrams:

- Circular/loop route around Tokyo.
- Station ticks placed on the loop.
- Short branch lines toward other labels.
- Pulse traveling along the route when Work or Contact becomes active.

### Why It Helps

This gives the scene a specific techno-Japanese vocabulary. It reads as navigation infrastructure instead of generic sci-fi.

### Visual Rules

- Route lines should be thin.
- Use only a few loops, not a full map.
- Station ticks should be brighter than route lines.
- Pulses should be brief and event-driven.
- The design should hint at transit geometry, not copy a real route map.

### Acceptance Criteria

- It feels Tokyo-coded even without reading labels.
- It remains abstract enough to fit the global earth scene.
- It does not create visual confusion with the Dallas-to-Tokyo arc.

## 5. Section Story Upgrades

### What It Adds

More distinct scene behaviors per content section.

### Proposed Story Table

| Section | Scene Mood | Primary Effects |
| --- | --- | --- |
| `home` | Signal acquisition | Boot flicker, route replay, Tokyo lock |
| `about` | Personal vector | Dallas and Tokyo pulse, route explanation, lower camera speed |
| `work` | Production grid | Data packets, Tokyo halo activity, cyan field density |
| `gallery` | Camera mode | Exposure brackets, shutter sweep, muted labels |
| `projects` | Archive trace | Dallas origin pulse, amber history trail |
| `contact` | Comms ready | Tokyo local time, signal panel, callout stability |

### Technical Approach

Extend the existing `sectionStories` object instead of scattering conditionals through the animation loop.

Each story can define:

```javascript
{
  focus: 'tokyo',
  intensity: 1,
  halo: 'active',
  rain: 0.6,
  route: 'replay',
  labels: 'standard',
  camera: 'close'
}
```

Then the render loop interpolates toward the current story state.

### Acceptance Criteria

- Section changes feel intentional but not jarring.
- The scene does not restart constantly during scroll jitter.
- All effects fail soft if the scene is unavailable.

## 6. Night-Side Earth And City-Light Feel

### What It Adds

More depth on the globe:

- A stronger atmospheric rim.
- Back-side dimming so the sphere reads more three-dimensional.
- Tiny city-light specks near Japan and other land clusters.
- Slightly warmer light near the Tokyo side.

### Why It Helps

The current land particles are clear, but stronger light falloff and rim treatment would make the globe more cinematic.

### Implementation Notes

- Keep city lights procedural and sparse.
- Do not add external texture files in the first pass.
- Use existing land samples or a second low-count point set for city-light accents.
- Keep city-light counts very low on mobile.

### Acceptance Criteria

- The globe feels less flat.
- Japan/Tokyo region gets a premium highlight without making the globe look geographically inaccurate.
- No additional texture loading is required.

## 7. Holographic Callout Redesign

### What It Adds

An upgraded callout language for Tokyo and Dallas:

- Bracket corners.
- Tiny barcode or scan ticks.
- Bilingual label rows.
- Coordinate/status fields.
- Short flicker when the focused place changes.

### Example Content

Tokyo:

- `東京 / TOKYO`
- `BASE: JST`
- `SIGNAL: ONLINE`
- `LAT 35.6762`
- `LON 139.6503`

Dallas:

- `DALLAS`
- `ORIGIN VECTOR`
- `ROUTE: TOKYO`
- `LAT 32.7767`
- `LON -96.7970`

### Acceptance Criteria

- The callout looks designed, not like a debug label.
- It remains legible in the hero.
- It fades when facing away.
- It does not become the main visual object.

## 8. Control Deck And Debug Additions

### What It Adds

Optional controls and diagnostics for development:

- Show quality profile.
- Show active section story.
- Toggle rain.
- Toggle halo.
- Replay route.
- Force LITE simulation.

### Boundary

These should not become prominent user-facing controls. The portfolio should feel curated, not like a settings demo. If added, keep them behind the existing control deck or debug query flag.

### Acceptance Criteria

- Debug controls help development.
- Public page still feels polished with controls closed.
- No control is required to understand the site.

## Technical Architecture

## Preferred File Boundaries

The current project is static and no-build. Keep that constraint unless a later spec explicitly changes it.

Near-term:

- Keep runtime scene code in `js/background.js`.
- Add small internal helper groups inside the IIFE.
- Keep CSS atmospheric overlays in `css/site.css`.
- Keep HTML changes minimal, only if a new overlay root is needed.
- Keep all data local in JavaScript constants.

Possible later cleanup:

- Split scene logic into a standalone `tokyo-data-globe` project or mirrored module only if the user wants the globe to evolve separately again.
- Consider a build step only if post-processing examples or shader assets make manual vendoring too brittle.

## Suggested Internal Modules Within `background.js`

Even before a physical file split, organize the code conceptually:

- `quality`: quality profile and device capability decisions.
- `data`: places, Tokyo halo labels, route definitions.
- `geometry`: finite attribute helpers, line/point builders.
- `materials`: shader materials and sprite materials.
- `sprites`: canvas texture label/callout rendering.
- `story`: section story states and transitions.
- `effects`: rain, halo, packets, route pulses.
- `debug`: debug state and overlay rendering.

This keeps the file easier to reason about without changing deployment architecture.

## Runtime State

Add a single scene state object rather than spreading new globals:

```javascript
const sceneState = {
  section: 'home',
  focusPlaceId: 'tokyo',
  story: sectionStories.home,
  routeReplay: 0,
  haloPulse: 0,
  rainIntensity: quality.name === 'high' ? 0.65 : 0.35,
  reduced: REDUCED,
  lite: LITE
};
```

The render loop should read from this state and interpolate values. Section changes update the state, not individual materials directly.

## Public Scene APIs

Keep the existing optional API style:

- `window.__sceneFocus(sectionId)` - called by page section observer.
- `window.__sceneWarp()` - development route replay.
- `window.__sceneDebug()` - available only with `?sceneDebug=1`.

Potential additions:

- `window.__sceneMood(name)` - development-only mood override.
- `window.__sceneReplay(label)` - replay a named route or pulse.

Do not require page code to know Three.js internals.

## Quality Profiles

Each new effect needs a quality budget.

Desktop high:

- Full Tokyo halo labels.
- Rain overlay enabled.
- Transit pulses enabled.
- City-light accents enabled.
- Bloom-like glow layers enabled.

LITE:

- Fewer labels.
- Lower rain density.
- Fewer route pulses.
- No city-light particle field unless cheap.
- Lower opacity on overlays to avoid cluttering small screens.

Reduced motion:

- Static vignette and grain are acceptable.
- No moving rain.
- No pulsing route packets.
- Route and Tokyo lock should render in a meaningful still frame.

## Phased Implementation Plan

## Phase 0: Visual Benchmark And Guardrails

Purpose: avoid aesthetic drift and regressions.

Tasks:

- Capture current desktop, mobile, and reduced-motion screenshots.
- Capture debug state with `?sceneDebug=1`.
- Confirm console is clean.
- Record current file sizes for `js/background.js`, `css/site.css`, and vendor files.
- Decide whether the first pass uses no-dependency post-processing or vendored composer.

Exit criteria:

- Baseline evidence exists before visual changes.
- The scope for Phase 1 is locked.

## Phase 1: Atmosphere Without New Three Dependencies

Purpose: get the Blade Runner mood jump with low architectural risk.

Tasks:

- Add CSS/DOM vignette, grain, and scanline layer.
- Add subtle rain/glass overlay.
- Add glow duplicates for route/halo materials where needed.
- Tune opacity per quality profile.
- Disable animated overlay under reduced motion.

Exit criteria:

- The hero feels wetter, darker, and more neon.
- Page readability is still good.
- No new runtime dependency.

## Phase 2: Tokyo Holographic Halo

Purpose: make Tokyo feel like a live base signal.

Tasks:

- Add local `TOKYO_HALO_LABELS`.
- Add ring geometry anchored to the Tokyo vector.
- Add station ticks.
- Add camera-facing label sprites.
- Add event pulses triggered by section changes.
- Tune LITE and reduced-motion behavior.

Exit criteria:

- Tokyo has a clear cyberpunk interface identity.
- Labels feel intentionally placed.
- Mobile remains uncluttered.

## Phase 3: Transit Route Geometry

Purpose: add a techno-Japanese transit-map vocabulary.

Tasks:

- Add one abstract loop around Tokyo.
- Add branch ticks and small pulse packets.
- Connect Work and Contact sections to different pulse behavior.
- Ensure the Dallas-to-Tokyo route remains visually distinct.

Exit criteria:

- The scene reads more Tokyo-specific.
- Transit geometry supports the globe rather than competing with it.

## Phase 4: Story State Upgrade

Purpose: make each section feel curated.

Tasks:

- Replace ad hoc section behavior with a richer story state object.
- Add smooth interpolation between story settings.
- Add cooldowns to avoid repeated route replays during scroll jitter.
- Add debug overlay fields for current story, halo mode, and route mode.

Exit criteria:

- Section transitions feel cinematic but controlled.
- Debug mode makes state easy to inspect.

## Phase 5: Night-Side Earth And City-Light Detail

Purpose: improve depth and premium finish.

Tasks:

- Tune shader falloff for back-side dimming.
- Add atmospheric rim glow.
- Add sparse city-light particles near high-priority regions.
- Highlight Japan/Tokyo subtly.

Exit criteria:

- The globe feels more three-dimensional.
- Tokyo is emphasized without fake-looking geography.

## Phase 6: Optional True Post-Processing

Purpose: only if earlier phases cannot achieve enough neon glow.

Tasks:

- Evaluate vendoring Three examples from the same revision.
- Build or vendor `EffectComposer`, `RenderPass`, and a bloom pass.
- Verify `file://` behavior.
- Compare screenshot quality against the no-dependency approximation.
- Keep the simpler version if the improvement is not significant.

Exit criteria:

- True bloom only stays if it clearly improves the scene and does not compromise deployment simplicity.

## Implementation Risks

### Visual Noise

Risk: cyberpunk effects become clutter.

Mitigation:

- Add one visual system at a time.
- Keep opacity low by default.
- Use section intensity instead of leaving everything active all the time.

### Performance

Risk: mobile frame rate drops.

Mitigation:

- Gate every new effect by quality profile.
- Avoid per-frame buffer rebuilds.
- Cap label count in LITE mode.
- Use reduced-motion static frames.

### File Size And Maintainability

Risk: `js/background.js` becomes too large.

Mitigation:

- Add internal boundaries.
- Keep new data arrays small.
- Consider a later file split only after visual direction is proven.

### Accessibility

Risk: important location/story information exists only in WebGL.

Mitigation:

- Keep WebGL decorative with `aria-hidden`.
- Keep Dallas-to-Tokyo meaning in normal HTML content.
- Do not put required navigation or controls only inside the canvas.

### Aesthetic Drift

Risk: the site becomes generic sci-fi instead of the accepted cyberpunk editorial direction.

Mitigation:

- Preserve amber/cyan neon palette.
- Preserve the current earth and route story.
- Use Tokyo-specific transit/label details.
- Review screenshots after every phase.

## Verification Checklist

For each implemented phase:

- `node --check js/background.js`
- `node --check js/app.js` if touched.
- `node --check js/effects.js` if touched.
- `node tools/verify-site-hardening.js`
- `git diff --check`
- Browser check from `file://`.
- Browser check from local static server.
- Console check: no Three.js warnings or runtime errors.
- Desktop screenshot.
- Mobile screenshot.
- Reduced-motion screenshot.
- Confirm hero text remains readable.
- Confirm `?sceneDebug=1` still works.

## Decision Points Before Execution

Answer these before writing runtime code:

1. Should the first pass stay no-dependency, or should true Three.js post-processing be allowed?
2. How intense should the rain/glass effect be: barely-there atmosphere, clearly visible, or heavy neo-noir?
3. Should Japanese labels be mostly real Tokyo district labels, mostly system-status labels, or a balanced mix?
4. Should the control deck expose any of these effects publicly, or should they stay debug-only?
5. Should the future globe be kept only inside this portfolio, or should major scene work continue to mirror into the standalone globe project later?

## Recommended First Execution Slice

Do not implement everything at once. The highest-return first slice is:

1. Add no-dependency atmosphere: vignette, grain, scanline, rain/glass overlay.
2. Add a minimal Tokyo halo: two rings, station ticks, Tokyo label, one or two district labels.
3. Connect halo intensity to the existing section story system.
4. Verify desktop, mobile, reduced motion, and console.

This slice should be visually obvious, technically contained, and reversible if the aesthetic gets too loud.

Concrete execution handoff:

- `docs/superpowers/plans/2026-07-01-cyberpunk-threejs-claude-execution.md`

Use that plan when handing the work to Claude Code. It contains the exact context, file map, function contracts, data schemas, task order, stop conditions, and verification checklist for the first implementation slice.

## Out Of Scope For The Next Pass

- Live weather, train, satellite, or social data.
- Audio.
- Clickable WebGL UI.
- Large external texture packs.
- Full physical post-processing pipeline unless explicitly approved.
- Replacing the current earth scene with a different 3D concept.
- Rebuilding the site in a framework.

## Summary

The next upgrade should make the current earth scene feel less like a clean data globe and more like a Tokyo signal system behind rain-streaked neon glass. The practical path is to start with low-risk atmosphere, then add a Tokyo holographic halo, then deepen the section-specific story behaviors. True Three.js post-processing should remain optional until the no-dependency version has been tested visually.
