# Earth Scene Quality Upgrade Design

## Purpose

Improve the existing Three.js earth scene without turning the portfolio into a heavy WebGL app. The earth is already the strongest visual idea on the site: a land-mask particle globe, Tokyo marker, Dallas-to-Tokyo arc, background data fields, and scroll-driven camera motion. The upgrade should make that scene feel more premium, more personal, and easier to maintain.

This is planning only. Runtime code changes happen later after this document and the implementation plan are reviewed.

## Current Context

The site is a static portfolio that can be opened directly from `file://` and also served by a simple static server. The Three.js scene lives in `js/background.js` as a single IIFE loaded after `js/vendor/three.min.js` from `index.html`.

The current earth uses:

- A baked 384x192 base64 land bitmask in `js/background.js`.
- Random land-only particle sampling for the globe.
- A custom shader using a per-particle phase attribute for breathing motion.
- Hardcoded Tokyo and Dallas coordinates.
- A Dallas-to-Tokyo great-circle arc and comet.
- A Tokyo callout rendered into a canvas texture.
- LITE and reduced-motion branches for lower-capability devices.

Known issue from review: the browser console reports a Three.js `computeBoundingSphere()` warning about a geometry with `NaN` positions. A source-level reproduction of the obvious generated arrays found no non-finite values, so implementation must diagnose the live object before adding visual complexity.

## Recommended Approach

Use an in-place quality upgrade inside `js/background.js`, with small helper boundaries inside the existing IIFE. Do not split the scene into ES modules yet, because the current site has no bundler and must keep working from `file://`.

Rejected alternatives:

- Full module split now: cleaner long-term, but risky because multiple module scripts and asset loading behavior can diverge under `file://`.
- Live geographic data fetches: interesting, but unnecessary and fragile for a portfolio hero.
- Heavier interactive globe UI: high novelty, but it would compete with the portfolio content.

## Scope

### Keep

- Particle land-mask earth.
- Dallas-to-Tokyo journey story.
- Tokyo as the primary node.
- Reduced-motion static frame.
- LITE mode for phone/tablet/coarse pointers.
- Current cyberpunk editorial visual language.

### Add

- Named scene objects and geometry diagnostics so console warnings identify the object.
- A small structured place model for Dallas and Tokyo instead of scattered constants.
- A focused place-node system: Tokyo remains primary, Dallas becomes a quieter journey origin node.
- Coastline/edge particle classification so land masses read sharper.
- A section-focus API (`window.__sceneFocus(sectionId)`) so page sections can cue subtle scene emphasis.
- Dynamic place callout text based on the focused place, with Tokyo as the default.
- Quality profile constants for high, balanced, lite, and reduced-motion paths.

### Do Not Add

- No live network data.
- No new npm dependency.
- No build step.
- No external land-mask file that requires `fetch`.
- No user-facing controls beyond the existing control deck.
- No globe mouse picking or clickable WebGL UI in this pass.

## Scene Behavior

Home and boot should still emphasize the Dallas-to-Tokyo journey. Tokyo remains the primary visual anchor. Dallas appears as a smaller amber-white origin node and participates in the journey arc, but it should not distract from Tokyo.

Section focus should be subtle:

- `home`: replay or emphasize the journey arc and Tokyo endpoint.
- `about`: pulse both Dallas and Tokyo once to support the "by way of Dallas" story.
- `work`: pulse Tokyo.
- `gallery`: reduce callout intensity and let the photos dominate.
- `projects`: pulse Dallas lightly as an origin point for earlier work.
- `contact`: pulse Tokyo and show the Tokyo callout.

If the section-focus API is unavailable, page behavior must remain unchanged.

## Visual Quality Requirements

- Coastline particles should be slightly brighter or larger than interior land particles.
- Back-side particles should fade enough to read as a sphere, not a flat cloud.
- Callouts should appear only when the relevant node faces the camera.
- The arc should remain readable but not permanently dominate the hero.
- The reduced-motion frame must render as a meaningful static composition with the journey visible.

## Performance Requirements

- Keep desktop globe particles near the current `7000` count unless profiling shows safe headroom.
- Keep LITE globe particles near the current `2600` count.
- Cap DPR as the current code does: no more than `2` desktop and `1.5` LITE.
- No per-frame buffer rebuilds for land particles.
- Per-frame updates should remain limited to transforms, uniforms, opacity, and the comet position.

## Error Handling And Diagnostics

Implementation must add a development-safe geometry validation layer:

- Every custom `BufferGeometry` gets a stable `.name`.
- Every custom numeric attribute is checked for finite values before it is attached.
- If a non-finite value is found, log the geometry name, attribute name, index, and value.
- If Three.js still emits a bounding-sphere warning, the console should include enough scene object names to identify the source in one run.

Production behavior should fail soft: skip the broken optional geometry if possible, but never block the rest of the page.

## Accessibility And UX Boundaries

The scene remains decorative and `#scene-root` stays `aria-hidden="true"`. Any new visual information about Dallas/Tokyo should also be represented in regular page content where it matters, not only in WebGL.

This plan does not implement the previously identified modal/menu accessibility fixes. Those should be handled separately so the WebGL work stays scoped.

## Verification Requirements

After implementation, verify:

- Static file preview still works from `file://`.
- Static server preview works with `python3 -m http.server`.
- Browser console has no Three.js `NaN` geometry warning.
- Desktop screenshot: hero globe remains framed and readable.
- Mobile screenshot: LITE scene remains nonblank and does not crowd nav.
- Reduced-motion screenshot: static earth and journey still communicate the story.
- Light performance pass: local vitals stay roughly in the same class as before and CLS remains `0`.

## Execution Stop Point

Stop after writing and reviewing the implementation plan. Do not edit runtime files until the user explicitly approves execution.
