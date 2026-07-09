# Globe — Visual Study (2026-07-03)

Part of the daikieOS v3 visual study — spec §5.1, plan Task 1 (calibration surface).
Board: `refs/globe/` (git-ignored raw frames). Provenance below is authoritative.

## Acceptance (Definition of Done for this entry)
- [x] >= 12 images kept in refs/globe/ after curation (13 kept)
- [x] >= 8 principles, each with a [TIER] + (ref: NNN-label) + source URL (15 principles)
- [x] thin/uncertain areas marked honestly with tier

## Method note (calibration surface)
This is the calibration run for the whole study. **Method validated:** `curl` fetches real art hosts
(`territorystudio.com/wp-content`, `images.squarespace-cdn.com`, `svs.gsfc.nasa.gov`) with a browser UA —
no hotlink blocks; `sips -Z 1400` downscales; `Read` studies. **Blocked hosts:** `fandom.com` returns
HTTP 402 to WebFetch (can't enumerate its pages) — the MGS iDroid globe is therefore an open gap (below).
Watermark-free holographic-Earth *renders* are scarce (stock-site walled), so the board leans on NASA
(real Earth-at-night = the site globe's literal ground truth) + film FUI solograms (GITS, BR2049) for the
"how a hologram reads" half. No parallel fan-out; single-threaded per the plan.

## Boards studied (provenance — survives even though raw images are git-ignored)
| file | source URL | why it's here |
|------|-----------|---------------|
| 002-br-nav-geo.jpg | https://territorystudio.com/project/blade-runner-2049/ | top-down tactical map: central reticle, radial leader lines to targets, left-rail label list, faint graticule, chromatic aberration on cyan-on-black |
| 004-nasa-rotate-globe.png | https://svs.gsfc.nasa.gov/30878/ | Earth-at-night **sphere** — thin cool atmospheric limb + city-light emitters on a near-black globe. The site globe's ground truth. |
| 005-nasa-global-night.png | https://svs.gsfc.nasa.gov/30876/ | equirectangular Earth-at-night — emitter *distribution*: warm pinpoints clustered on coasts/rivers, interiors dark |
| 006-gits-hologlobe-spherical.jpg | https://territorystudio.com/project/ghost-in-the-shell/ | sologram = additive particle assembly; densest at silhouette, downward particle-rain trail |
| 007-gits-hologlobe-content.jpg | https://territorystudio.com/project/ghost-in-the-shell/ | holo (ship) on a hot elliptical projector base; brightness gradients bottom-up; dark field |
| 008-gits-hologlobe-aesthetic.jpg | https://www.hudsandguis.com/home/2017/4/17/ghostintheshell-fui | holo + corner-bracket tags + condensed-mono coordinate string ("198.855125A/21", "tokobrny") — label grammar |
| 009-gits-holo-crimescene.jpg | https://territorystudio.com/project/ghost-in-the-shell/ | volumetric human holos reconstructed as particles over a red floor grid; warning glyph; ceiling data bars |
| 011-gits-lab-holo.jpg | https://www.hudsandguis.com/home/2017/4/17/ghostintheshell-fui | **cool** cyan handheld holo readout: small wireframe sphere + green tabular values over a darkened scene |
| 012-gits-hologlobe-coroner.jpg | https://www.hudsandguis.com/home/2017/4/17/ghostintheshell-fui | (actual content: neon street) architectural-scale solograms compositing *additively/translucently* over signage |
| 013-gits-orbital-scan.jpg | https://www.hudsandguis.com/home/2017/4/17/ghostintheshell-fui | holo ship + bracket-box tags + particle "terrain" grid receding to horizon + coordinate readout |
| 015-gits-spherical-data.jpg | https://www.hudsandguis.com/home/2017/4/17/ghostintheshell-fui | holo particle terrain + targeting bracket box + heavy RGB chromatic split; screen-imperfect texture |
| 016-br-location-tracking.png | https://territorystudio.com/project/blade-runner-2049/ | (actual content: bezelled monitor scan, "KD6-3.7") cyan-graded live image under thin data strip + labeled hardware buttons |
| 017-br-vegas-scanner.png | https://territorystudio.com/project/blade-runner-2049/ | rugged handheld field instrument; analog magenta-phosphor radar readout on a grid — future-as-worn-hardware |

## Principles
Tier legend: [VERIFIED] cross-checked across ≥3 board refs · [EXTRACTED] read directly off one primary reference · [DATA] measured pixel value · [WORKING] practitioner judgment/extrapolation, no measurement.

1. [EXTRACTED] Keep the globe's base **near-black and the light scarce** — lit information (city emitters) occupies well under ~5% of the sphere's area; land reads as deep desaturated indigo, ocean nearly black. Light is an event, not a fill. (ref: 004-nasa-rotate-globe, 005-nasa-global-night; src: https://svs.gsfc.nasa.gov/30878/)
2. [EXTRACTED] City-light **emitters cluster** as warm white→amber pinpoints and filaments along coastlines and rivers, following real geography (Europe / E-Asia / E-US dense; Sahara, oceans, interiors dark) — never an even wash. Emitter placement should be clustered and geographic, not uniform. (ref: 005-nasa-global-night; src: https://svs.gsfc.nasa.gov/30876/)
3. [EXTRACTED] The lit globe carries a **thin cool atmospheric limb** — a bright blue-scatter rim only ~1–2% of the radius, brightest toward the day/terminator side and fading to nothing on the deep-night limb. Render atmosphere as an edge-weighted rim, not a uniform halo. (ref: 004-nasa-rotate-globe; src: https://svs.gsfc.nasa.gov/30878/)
4. [EXTRACTED] Solograms read as **additive particle assemblies** — thousands of discrete glowing points forming the volume, densest at surfaces/silhouette, sparser inside, with a faint downward "particle rain" bleeding off the form. Model holo fills as particle density, not a solid shaded mesh. (ref: 006-gits-hologlobe-spherical, 007-gits-hologlobe-content; src: https://territorystudio.com/project/ghost-in-the-shell/)
5. [EXTRACTED] The **projector base is the brightest element** — a hot elliptical pool of light directly beneath the hologram with visible up-cast; the form dims with height. Anchor a hologram to a bright ground source and gradient it dark-at-top → hot-at-base. (ref: 007-gits-hologlobe-content; src: https://territorystudio.com/project/ghost-in-the-shell/)
6. [VERIFIED] **No hard rim.** A holo silhouette dissolves into particulate scatter and additive bloom across its outer band; legibility comes from internal density, not an outline. Cross-checked across three solograms — none uses a fresnel edge line. For daikieOS: replace any hard fresnel rim on the holo-scan shell with an additive edge-falloff into scatter. (ref: 006-gits-hologlobe-spherical, 007-gits-hologlobe-content, 008-gits-hologlobe-aesthetic; src: https://territorystudio.com/project/ghost-in-the-shell/)
7. [EXTRACTED] Holo objects are tagged with **thin corner-bracket boxes + a coordinate/ID string** in condensed mono, set small and **offset from the subject by a leader gap** — the tag frames the object, never overlaps it. (ref: 008-gits-hologlobe-aesthetic, 013-gits-orbital-scan; src: https://www.hudsandguis.com/home/2017/4/17/ghostintheshell-fui)
8. [EXTRACTED] **Label the focus only.** The tactical map lights one active reticle + a short left-rail list; the rest of the field is unlabeled grid. Restraint is the effect — a globe densely labelled everywhere reads as noise. (ref: 002-br-nav-geo; src: https://territorystudio.com/project/blade-runner-2049/)
9. [EXTRACTED] Data sits on a **faint graticule** (fine tick/cell mesh, well below the data in brightness) with **radial leader lines from a central reticle** out to targets. Ground the globe's overlays on a low-contrast grid + focus-anchored radial leaders. (ref: 002-br-nav-geo; src: https://territorystudio.com/project/blade-runner-2049/)
10. [VERIFIED] Holo frames carry deliberate **chromatic aberration** (R/G/B split at high-contrast edges) + a **scanline/grid texture** — the projection is imperfect, not clean vector. Cross-checked across three FUI frames. A subtle channel split + scanline sells "projected", not "rendered". (ref: 002-br-nav-geo, 013-gits-orbital-scan, 015-gits-spherical-data; src: https://www.hudsandguis.com/home/2017/4/17/ghostintheshell-fui)
11. [EXTRACTED] **Two holo temperatures, kept apart:** warm amber/orange for volumetric "living" solograms; cool cyan/green for handheld/UI data readouts. The site's cyan holo-scan shell + amber city-emitter split is period-accurate to this language — cool = instrument, warm = content; don't let them bleed. (ref: 008-gits-hologlobe-aesthetic, 011-gits-lab-holo; src: https://www.hudsandguis.com/home/2017/4/17/ghostintheshell-fui)
12. [EXTRACTED] Handheld/monitor readouts render data as a **thin cyan wireframe + green tabular values over a darkened live image**, framed by a **physical bezel with labeled buttons** — the data is a light overlay; the real scene shows through beneath. (ref: 011-gits-lab-holo, 016-br-location-tracking; src: https://territorystudio.com/project/blade-runner-2049/)
13. [EXTRACTED] Instruments read as **worn analog hardware** — even a "radar" is a magenta-phosphor CRT-ish screen on a grid, housed in a rugged case, not flat-glass app UI. The future here is tactile and aged. (ref: 017-br-vegas-scanner; src: https://territorystudio.com/project/blade-runner-2049/)
14. [WORKING] Holograms **composite additively and stay translucent** over whatever is behind them (street solograms read through to signage) — they add light, never occlude. The globe's holo shell should be an additive, see-through layer over the dark scene, not an opaque sphere. (ref: 012-gits-hologlobe-coroner; src: https://www.hudsandguis.com/home/2017/4/17/ghostintheshell-fui)
15. [WORKING] Synthesis for daikieOS globe: **dark scarce-light base (P1) + clustered amber emitters (P2) + thin cool limb (P3) + rimless additive cyan shell (P6) + focus-only bracket/coordinate labels (P7–P9) + chromatic/scanline projection texture (P10)**, holding the cool-shell / warm-signal temperature split (P11). This is the globe's target read; each clause traces to a ref above. (ref: 004-nasa-rotate-globe, 008-gits-hologlobe-aesthetic)

## Thin areas / open questions
- **No [DATA] measurements.** Edge-falloff %, scanline pitch, and emitter sizes are all qualitative ([EXTRACTED]/[WORKING]); a [DATA] pass would need a pixel picker on a holo edge. Consistent with the library's known "hologram timing/measurement" open debt — not invented here.
- **MGS iDroid globe is a gap.** The canonical game holographic globe lives behind `fandom.com` (HTTP 402 to WebFetch). If the elevation brief needs a real interactive-holo-globe read, capture it via the MCP-browser screenshot fallback (sparingly) or an alternate host.
- **ArtStation / direct game screenshots untested** this surface — curl-fetchability of `cdn*.artstation.com` and `interfaceingame.com` not yet proven (deferred to HUD surface, where they're primary).
- **Label legibility at density** observed qualitatively (few-at-once) but not counted; a real "how many labels legible simultaneously" number remains open.
- Terminator day/night *rendering over time* is inferred from a single still (004); motion/timing of the terminator sweep is a temporal question for the motion surface, not measured here.
