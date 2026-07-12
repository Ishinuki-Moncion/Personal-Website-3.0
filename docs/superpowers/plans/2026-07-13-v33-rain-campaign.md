# v3.3 Rain Campaign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the rain as one instanced velocity-stretched GPU batch, make the whole scene answer its lightning as one event, elevate the droplet glass (merge + trails), move hero choreography to WAAPI and scroll effects to CSS scroll-driven animations, ship the gated rivulet-glass grabpass splurge, and close out with the full measurement suite — all on branch `v33-rain`, no push, no PR.

**Architecture:** Two independent lanes on the shipped v3.2r tree: the scene lane (Tasks 1–3, 6: `js/background.js` + the new `js/rivulet.mjs` postFX module) and the DOM lane (Tasks 4–5: `js/app.js` + `js/effects.js` + `css/site.css`), each task a shippable stopping point, closed out by a docs-only measurement task (Task 7). Every task is harness-RED-first against `tools/verify-site-hardening.js`, carries its own live-verify gates, and lands as exactly one commit.

**Tech Stack:** Vanilla ES modules + Three.js r158 (vendored, import-map; `GPUComputationRenderer` vendored in Task 6), WebGL2 GLSL (InstancedBufferGeometry, ShaderMaterial, EffectComposer passes), Web Animations API, CSS scroll-driven animations (`animation-timeline`) behind `@supports`, Node harness (`tools/verify-site-hardening.js`, `tools/frame-luminance.mjs`), chrome-devtools MCP for live gates, python3 http.server on 127.0.0.1:8765.

**Spec of record (BINDING):** `docs/superpowers/specs/2026-07-13-v33-rain-campaign-design.md`. Branch `v33-rain` @ `b3d4067` (verified: all `file:LINE` anchors in this plan checked against that tree at assembly time). Owner scope verdict: Package M + M10 rider, STAGED — settled, do not re-litigate. Framework verdict: NO framework — settled.

## Global Constraints

Copied from the spec — every task's requirements implicitly include every line:

- **Deep-black floor `#05060a` family** (standing law).
- **Section p50 luminance floors 8/7/9 (hero/projects/gallery)** — any capture set violating a floor fails the task outright (a build error, not gate-pile material) (§4.1).
- **Scarcity — never add a layer without retiring one** (§1.1 retirement pairings are law, pinned negatively in the harness).
- **Amber is an event (~1–6% warm budget) except the amber-starfield signature.**
- **One signal per section-change** (§1.2: a signal is counted by its source; all lightning couplings consume the ONE `env` envelope; `wordT` drives NOTHING but the uFlash suppression gate).
- **Photos dim at rest / full on demand. NO AUDIO.**
- **No push/PR without owner sign-off** — the campaign stops at the v33g gate pile.
- **Harness pins updated with features, never deleted**; every commit: harness exit 0, count strictly ≥ previous, `node --check` on all touched JS (§6).
- **Bloom dark-swap (§1.3):** any new scene object MUST have a type-correct invisible dark-swap in the bloom pass; rain stays excluded from the bloom emitter set; the v33a bloom-isolation capture pair is MANDATORY — a shipped M4 without it archived is a failed task.
- **Reduced motion (§1.5):** `depthRain` stays null under reduced (`reduced ? null : makeDepthRain()` at `background.js:639` — pinned, untouched); M5 keeps `runHero()`'s reduced short-circuit byte-identical; M6 SDA elements need explicit `animation: none` in the reduced block (the `.001ms` kill cannot stop progress-driven playback).
- **Measurement prohibitions (§1.4):** never single frames — medians of ≥5 fresh-hard-reload frames or interleaved same-frame A/B toggles; no below-resolution delta is ever cited as fact (report it, mark it unresolvable, route letter-fails to the gate pile); viewport + DPR recorded per capture; ONE tab per session, stale QA tabs closed; zero console messages is part of every gate; gallery p95 saturates at 120 — mean is the sensitive gallery metric.
- **Measurement contract (§4 common procedure):** `http://127.0.0.1:8765/index.html`; viewport 1440×743 CSS px @ DPR 2 (2880×1486 captures); fresh hard-reload (`ignoreCache`) before every capture; 11 s settle post-boot and post-scroll; scroll landing verified via `evaluate_script`; median-of-5 + spreads; `node tools/frame-luminance.mjs <png>`; frames git-ignored under `docs/superpowers/gates/v33/`; **fpsEMA readings are a SEPARATE `?sceneDebug=1` session** — luminance captures stay on the plain URL, never mixed.
- **Version / cache-bust burn rule (§7):** any `?v=` ever published from main is BURNED; every touched user-facing file bumps monotonically from branch HEAD in the same commit; before assigning, confirm the value never appeared in main's history. Chain of record for this campaign: v33a → `V.bg '5.7'`/`boot.mjs?v=24` · v33b → `'5.8'`/`?v=25` · v33c → `'5.9'`/`?v=26` · v33d → `V.app '4.3'`/`?v=27` · v33e → `V.fx '3.8'`/`site.css?v=3.30`/`?v=28` · v33f → `V.bg '6.0'`/`?v=29`/`rivulet.mjs?v=1` · v33g → no bumps. (Projections under the read-current-and-increment rule — the CURRENT value at each task's HEAD is binding, the projection is not.)
- **Commit format (§8):** one commit per task, subject verbatim from §8, trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`, **no push**.
- **Harness count chain:** 42 (at b3d4067) → 43 (v33a) → 44 (v33b) → 45 (v33c) → 46 (v33d) → 47 (v33e) → 48 (v33f) → 48 (v33g, docs only).
- **Binding-intent rule (from the v3.2 plan, applies to every old_string):** if an old_string drifted because an earlier task edited that region, re-derive against current source preserving the stated intent — never skip. (Every cross-task collision known at assembly time is already reconciled inline below.)

## File map

| File | Tasks that touch it | Responsibility |
|---|---|---|
| `js/background.js` | 1, 2, 3, 6 | the scene: rain batch, lightning couplings, droplet glass, rivulet gate/import/hook |
| `js/rivulet.mjs` | 6 (create) | GPGPU rivulet sim + metaball splat + refraction ShaderPass (high tier only, gated) |
| `js/vendor/three-0.158.0/examples/jsm/misc/GPUComputationRenderer.js` | 6 (vendor) | byte-exact r158 addon |
| `js/app.js` | 4 | hero WAAPI sequencer |
| `js/effects.js` | 5 | SDA handoff const + stood-down JS writes (fallback retained) |
| `css/site.css` | 5 | `@supports (animation-timeline: view())` block + reduced-motion kill line |
| `js/boot.mjs`, `index.html` | 1–6 | version chain per §7 |
| `tools/verify-site-hardening.js` | 1–6 | RED-first pins per task (§6) |
| `.gitignore` | 1 | `docs/superpowers/gates/v33/` ignore line |
| `docs/superpowers/specs/2026-07-08-v32-law-addendum.md` | 7 | `## v3.3 close-out measurements` appendix |

## Assembly reconciliations & campaign-wide rulings

Reconciliations applied at assembly (the fragments' declared interfaces now match exactly; the affected steps below already carry the fix):

1. **Task 6 Step 7 old_string re-derived against the post-Task-1 tree:** Task 1 inserts the `__bloomIso`/`__bloomResume` sceneDebug hook between `renderBloomThenFinal = () => {…};` and the postFX block's closing `}` — the v33f fragment's original anchor (`renderBloomThenFinal` closure + `}`) no longer exists after Task 1. The reconciled anchor is the tail of Task 1's hook (`window.__bloomResume …`).
2. **Task 6 Step 16 concretized:** "re-run v33a's bloom-isolation procedure" now names Task 1's exact levers — `window.__bloomIso(rainVisible, hold)` / `window.__bloomResume()` on `?sceneDebug=1`, gate = FNV-1a **digest equality** (not PNG byte-compare, which is DOM-contaminated — the ruling Task 1 records).
3. **Task 7 Step 6 concretized:** the "rain-streaks visibility lever" is Task 1's transient `onBeforeRender` scene-capture hook + `window.__scn.getObjectByName('rain-streaks').visible` — the snippet is reproduced verbatim in Task 7 so its implementer needs no other task.
4. **Task 2 Consumes names `uBeat` exactly** (the fragment said "name per v33a's fragment, e.g. uBeat" — Task 1 defines `uBeat`).
5. **Version + harness-count chains cross-checked** across all four fragments — already mutually consistent (no fix needed): boot `?v=` 24→25→26→27→28→29; counts 43→44→45→46→47→48.
6. **All single-fragment old_strings verified verbatim against `b3d4067`** (makeDepthRain `:495–534`, updateDepthRain `:1324–1371`, shear `:2072–2073`, darken/bloom `:1937–1951`, emitter tags `:1772/:1778`, lightning `:1114–1125/:1135`, limb `:960/:985`, droplets `:646–752`, sceneState `:1515/:1549/:2057`, app.js `:22–110`, effects.js `:6/:95/:120–130`, site.css `:43–44/:397/:442–448/:928–929`, index.html `:28/:62/:73/:170/:438`, boot.mjs `:17`, harness `:110–114/:307–312` + the `const failed` anchor and its `fs/path/root/background/app/effects/css` scope).

Campaign-wide spec rulings (task-local rulings live inside their tasks):

- **C3 limb catch ships on BOTH tiers** (Task 2 Step 9 note): spec §3.2 C3 sets no tier gate (contrast C1, which the spec tier-gates explicitly), the limb shell exists on LITE, and the catch is event-gated (rest-identical). §3.2 acceptance 5's "LITE visually unchanged except the (kept) flat flash beat" is read as rest-state invariance plus the named flash-event exceptions. Flagged to the coordinator.
- **Task 2 during-flash captures run on `?sceneDebug=1` with the overlay `display:none`d** (deviation-with-mitigation, recorded per capture set): §4.3's `__forceFlash` hook exists only there, while §4 wants luminance on the plain URL. Both arms share the hidden-overlay state; the pair is interleaved; the overlay contributes zero pixels. Flagged to the coordinator.
- **Task 4 beat parity is judged on beat SPACING at ±1 frame**, with the uniform ≤2-frame-earlier start recorded: the spec both retires the double-rAF kicks (§1.1) and asks for ±1-frame totals (§3.4 acceptance 1) — the kicks WERE ~2 frames of the total. Ruling recorded in `d-beats`, carried to gate-pile notes. Flagged to the coordinator.
- **Task 6 coverage law enforced by construction** (radius clamp `rMax` derived from `uCoverageMax`, worst-case footprint ≤ 0.9 × 0.05 at every aspect) instead of the spec's "spawn throttles against the running coverage sum" (a GPU running sum needs a per-frame readback/reduction — the mechanism changes, the guarantee is stronger); `coverage()` is the live QA readback proving it. Flagged to the coordinator.
- **Task 6's `window.__rivulet` exists on the plain URL** (not sceneDebug-gated, unlike every other QA hook): the §4.2-style luminance A/B is banned from `?sceneDebug=1`, and the lever must exist where the captures run. It exists ONLY when the gate is on and the module loaded, so HALO_GATE discipline holds. Flagged to the coordinator.

---

### Task 1 (v33a): ONE instanced rain batch — velocity stretch, per-drop wells, GPU recycle (M4)

Spec anchors (BINDING): §1.1 row v33a, §1.3, §1.4, §1.5, §3.1, §4.1–§4.4, §6, §7, §8 item 1. Research: `docs/superpowers/research/2026-07-10-rain-liquid-sim-options.md` R1. All `js/background.js` line anchors are against `v33-rain` @ `b3d4067`.

**Files:** Modify: `js/background.js` (makeDepthRain + its comment block `:495–534` → instanced rebuild + hoisted law consts; rain state line `:1292` + `RAIN_CYAN`/comment/consts block `:1296–1312`; `setWell` tail `:1321–1323`; `updateDepthRain` `:1324–1371`; loop shear line `:2072–2073`; bloom block tail `:1945–1951` for the `__bloomIso` QA hook), `js/boot.mjs` (`:17` — `V.bg '5.6'→'5.7'`), `index.html` (`:438` — `boot.mjs?v=23→24`), `.gitignore` (append `docs/superpowers/gates/v33/`). Test: `tools/verify-site-hardening.js` (rewrite checks at `:110–114` and `:307–312`; append one new check above the `const failed` anchor at `:379`). Create: `docs/superpowers/gates/v33/` (git-ignored capture archive), `.superpowers/sdd/v33/task-v33a-report.md` (measurement ledger; git-ignored, never committed).

**Interfaces:**
Consumes (shipped tree only — v33a is the head of the campaign chain): `sceneState.rain/haloPulse/lockT/halo` (`:1458+`, `:2057–2069`), `rainShear` scroll-shear ease (`:2072`), `updateLightning()` env → `flash` (`:1135–1153`, call at `:2074`), `setWell`/`rainWells`/`_wellP` projection machinery (`:1312–1323`), `focusedPlaceId`/`focusFlash` (`:1381–1390`), `darken`/`restore`/`bloomComposer`/`renderBloomThenFinal` (`:1937–1950`), `nameObject` (`:104`), `LITE`/`quality`/`reduced`/`sceneDebug` (`:12–19`), `rainTintK` arm (`:1521`), harness `check()` idiom + biasCap by-value idiom (`tools/verify-site-hardening.js:15–17`, `:318–328`).
Produces (spec-verbatim symbols): instanced mesh named **`'rain-streaks'`** inside the surviving `'depth-rain'` camera-parented group; **`uWells`** (`vec4[3]` = screen-xy NDC, strength, camera-z — Task 2's C2 rides well 3's per-drop falloff); **`uWind`** (the one instantaneous wind float — the lean); **`WELL_XY_SIGMA` = 0.25** (the one new tunable, tune DOWN only, uniform `uWellXY`); `MOTIV_FLOOR` 0.16 / `MOTIV_CAP` 0.80 / `RAIN_LITE_VEIL` 0.55 carried into uniforms **`uMotivFloor`/`uMotivCap`/`uLiteVeil`** at the same values; `WELL_DEPTH_SIGMA` 6.0 carried as **`uWellZ`**; the carried `beat` expression seat in `updateDepthRain` — `const beat = 0.85 + sceneState.haloPulse * 0.5 + sceneState.lockT * 0.45 + (flash || 0) * 1.3;` VERBATIM (Task 2 edits exactly this line for C2/`LITE_FLASH_BEAT`); harness check **`v3.3a — rain is ONE instanced batch; the Points planes and the CPU loop are retired`** (count 42→43); the pre-campaign baseline capture set `base-{hero,projects,gallery}-{1..5}.png` (Task 7's comparison anchor).
Produces (plan-defined): uniforms `uT` (rain-time = `rainSway`), `uWindT` (x-drift clock, CPU accumulator `rainWindT += wind * dt`), `uBeat`, `uVis`, `uTint`, `uCyan`/`uAmber` (carried 0xbfeaff / 0xffd2a0), `uWellGain` (loop-never-written pools-A/B lever, folded INSIDE the well summation so the pinned `min(uMotivCap, uMotivFloor + m)` shape survives); instanced attributes `aSeed`/`aSpeed`/`aDrop`/`aRect`/`aLayer`; sceneDebug-gated QA hooks `window.__rainShear(v)` (forced-shear hold for the lean captures), `window.__bloomIso(rainVisible, hold)` + `window.__bloomResume()` (bloom-target isolation digest + frozen-frame screenshot; Task 6 re-runs these); gates dir `docs/superpowers/gates/v33/` + its `.gitignore` line.

**Context (the defect and the shape of the fix).** Rain today is three `THREE.Points` planes (`:508–530`) whose streak texture bakes a ~10° slant (`makeStreakTexture` `:1030–1046`: `x0 = 64 + 8 → x1 = 64 − 8`) while the wind+shear velocity vector leans past 30° under full shear (`wind = 0.10 ± 0.05·sin + clamp(rainShear, ±0.6)`, `:1340`) — drops slide sideways without leaning, the scene's one visible cheapness tell (R1). A CPU loop walks all 470 drops every frame (`:1346–1358`) and the v3.2l motivation wells are evaluated per PLANE (`:1360–1368`), so whole sheets brighten on average instead of drops brightening inside light pools. The rebuild: ONE `InstancedBufferGeometry` quad batch (470 high / 210 LITE — the exact `:501–506` per-layer params ride as instance attributes), fall + recycle closed-form in the vertex shader (`y = mod(seedY − speed·uT, 2·halfH) − halfH`), quads stretched along the TRUE velocity vector, wells per DROP, terminal opacity `baseOp × vis × beat × motivation` carried verbatim into GLSL. Net scene objects −2; the CPU walk is deleted; `makeStreakTexture` SURVIVES with the shooting star (`:1059`) as its single caller (spec correction of record #1 — only the rain call site `:522` dies). Bloom law §1.3: the mesh is `isMesh`, so the existing `darken()` swap to `darkMat` (`:1927`, `:1941`) is type-correct — a `MeshBasicMaterial` on `InstancedBufferGeometry` renders `instanceCount` copies of the RAW base quad (instance attrs ignored), so the base quad is parked at z = −8 (mid-band, never at the camera plane where w→0) and contributes nothing at opacity 0. Mandatory: the bloom-target capture pair, archived. No flag (§5: strict replacements don't get flags; revert = `git revert`). Reduced motion: `reduced ? null : makeDepthRain()` (`:639`) is untouched and pinned.

- [ ] **Step 1: harness RED-FIRST — rewrite the two pinned checks + add the v33a check.** Three edits to `tools/verify-site-hardening.js`.
Edit 1 — old_string:
```js
check('depth rain renders as camera-space parallax particle layers',
  /makeDepthRain/.test(background) && /depth-rain/.test(background) &&
    /rain-layer-/.test(background) && /camera\.add\(group\)/.test(background) &&
    /reduced \? null : makeDepthRain\(\)/.test(background),
  'rain must be the WebGL particle system (GITS particulation), reduced-motion disabled — never CSS line-rain');
```
new_string:
```js
check('depth rain renders as camera-space parallax particle layers',
  /makeDepthRain/.test(background) && /depth-rain/.test(background) &&
    /'rain-streaks'/.test(background) && /camera\.add\(group\)/.test(background) &&
    /reduced \? null : makeDepthRain\(\)/.test(background),
  'rain must be the WebGL instanced streak batch (GITS particulation), camera-parented, reduced-motion disabled — never CSS line-rain');
```
Edit 2 — old_string:
```js
check('v3.2l — rain is motivated light, not a flat veil',
  /MOTIV_FLOOR/.test(background) && /MOTIV_CAP/.test(background) &&
    /baseOp \* vis \* beat \* motivation/.test(background) &&
    /saturate\(0\.5\) brightness\(0\.9\)/.test(background) &&
    !/rain: 0\.6,/.test(background),
  'per-plane motivation term (rain brief Lever A), worn-glass droplet filter, and the retired flat hero veil');
```
new_string:
```js
// v3.3a — the v3.2l motivation law moved into GLSL; pinned BY VALUE (biasCap idiom):
// floor/cap/veil parse from the consts and must hold 0.16 / 0.80 / 0.55 exactly.
const motivFloor = Number((background.match(/const MOTIV_FLOOR = ([0-9.]+)/) || [])[1]);
const motivCap = Number((background.match(/const MOTIV_CAP\s*=\s*([0-9.]+)/) || [])[1]);
const liteVeil = Number((background.match(/const RAIN_LITE_VEIL = ([0-9.]+)/) || [])[1]);
check('v3.2l — rain is motivated light, not a flat veil',
  motivFloor === 0.16 && motivCap === 0.8 && liteVeil === 0.55 &&
    /uMotivFloor: \{ value: MOTIV_FLOOR \}/.test(background) &&
    /uMotivCap: \{ value: MOTIV_CAP \}/.test(background) &&
    /uLiteVeil: \{ value: RAIN_LITE_VEIL \}/.test(background) &&
    /min\(uMotivCap, uMotivFloor \+ m\)/.test(background) &&
    /saturate\(0\.5\) brightness\(0\.9\)/.test(background) &&
    !/rain: 0\.6,/.test(background),
  'the motivation law lives in the rain shader now (v3.3a): FLOOR 0.16 / CAP 0.80 / LITE veil 0.55 pinned by value, min(uMotivCap, uMotivFloor + m) per drop, worn-glass droplet filter kept, flat hero veil stays retired');
```
Edit 3 — insert ABOVE the `const failed = checks.filter(item => !item.pass);` anchor:
```js
// v3.3a — M4 retirement law (§1.1): ONE instanced batch replaces the three Points
// planes; the CPU walk and the rain streak-sprite call sites are deleted symbols
// (negative pins). Dark-swap safety pinned as real code shapes: the base quad is
// parked at z=-8 (never the camera plane) and the type-correct Mesh swap branch
// survives. Rain stays OUT of the bloom emitter set (the exact emitter-tag lines
// are pinned AND the rain mesh local must never be bloom-tagged). WELL_XY_SIGMA
// tunes DOWN only.
const wellXY = Number((background.match(/const WELL_XY_SIGMA = ([0-9.]+)/) || [])[1]);
check('v3.3a — rain is ONE instanced batch; the Points planes and the CPU loop are retired',
  /InstancedBufferGeometry/.test(background) &&
    /nameObject\(new THREE\.Mesh\(geo, mat\), 'rain-streaks'\)/.test(background) &&
    /uWells/.test(background) && /uWind/.test(background) && /uWindT/.test(background) &&
    /mod\(aSeed\.y - aSpeed \* uT, 2\.0 \* aRect\.y\) - aRect\.y/.test(background) &&
    /mesh\.renderOrder = 3/.test(background) &&
    /mesh\.frustumCulled = false/.test(background) &&
    /base\.translate\(0, 0, -8\)/.test(background) &&
    /else if \(o\.isMesh \|\| o\.isLine\) \{ matCache\.set\(o, o\.material\); o\.material = darkMat; \}/.test(background) &&
    /\[fieldCyan, fieldAmber, tokyoRing, comet\]\.forEach\(o => \{ o\.userData\.bloom = true; \}\);/.test(background) &&
    /const bloomByName = new Set\(\['earth-land-particles', 'dallas-to-tokyo-arc'\]\);/.test(background) &&
    !/mesh\.userData\.bloom/.test(background) &&
    wellXY > 0 && wellXY <= 0.25 &&
    !/rain-layer-/.test(background) &&
    !/makeStreakTexture\(d\.len, d\.head\)/.test(background) &&
    !/ud\.speeds/.test(background) &&
    !/p\[i \* 3 \+ 1\] < -ud\.halfH/.test(background),
  'one InstancedBufferGeometry mesh named rain-streaks with GPU mod-recycle, per-drop wells (uWells) and true-velocity lean (uWind/uWindT); dark-swap-safe base quad at z=-8 under the type-correct Mesh swap; rain absent from the bloom emitter set; WELL_XY_SIGMA ' + wellXY + ' in (0, 0.25]; the three Points layers, the rain sprite call site, and the ud.speeds CPU walk are deleted');
```
Verify: `node tools/verify-site-hardening.js; echo "exit=$?"` → exactly **3 FAIL** lines (`depth rain renders…`, `v3.2l — rain is motivated light…`, `v3.3a — rain is ONE instanced batch…`), 40 PASS, `exit=1`. RED confirmed — now implement to green.

- [ ] **Step 2: gates archive dir + ignore line.** `mkdir -p "docs/superpowers/gates/v33"`. Then Edit `.gitignore` — old_string:
```
# v3.2 gate screenshots (owner end-of-pass review artifacts; heavy PNGs, not site assets)
docs/superpowers/gates/v32/
```
new_string:
```
# v3.2 gate screenshots (owner end-of-pass review artifacts; heavy PNGs, not site assets)
docs/superpowers/gates/v32/

# v3.3 gate screenshots (same class: owner review artifacts, git-ignored — spec §4)
docs/superpowers/gates/v33/
```
Verify: `git check-ignore -v docs/superpowers/gates/v33/x.png` → prints the new rule (create no file; check-ignore works on the path pattern).

- [ ] **Step 3: replace makeDepthRain — the instanced batch.** One Edit in `js/background.js`. old_string (the `:495–534` block, verbatim):
```js
  /* Depth rain — camera-space particle layers with per-drop speed jitter and
     gusting wind (dossier: GITS solograms are particle systems of light in
     Z-space; parallax + variation is what separates weather from "lines").
     Hidden under reduced motion — a frozen rain frame reads as glitch. */
  function makeDepthRain() {
    const aspect = w / h;
    const defs = LITE
      ? [{ n: 80, size: 0.26, speed: [4.5, 6.5], op: 0.32, z: [-5, -9], len: 0.7, head: 0.85 },
         { n: 130, size: 0.16, speed: [2.4, 3.8], op: 0.22, z: [-8, -14], len: 0.45, head: 0.7 }]
      : [{ n: 70, size: 0.4, speed: [8, 14], op: 0.5, z: [-4, -7], len: 0.8, head: 0.9 },
         { n: 150, size: 0.24, speed: [4.2, 7.5], op: 0.36, z: [-6, -11], len: 0.55, head: 0.8 },
         { n: 250, size: 0.15, speed: [2.2, 4.2], op: 0.24, z: [-9, -16], len: 0.35, head: 0.65 }];
    const group = new THREE.Group(); group.name = 'depth-rain';
    const layers = defs.map((d, li) => {
      const halfH = Math.tan(31 * Math.PI / 180) * (-d.z[1]) + 1.5;
      const halfW = halfH * aspect + 1;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(d.n * 3);
      const spd = new Float32Array(d.n);
      for (let i = 0; i < d.n; i++) {
        pos[i * 3] = (Math.random() * 2 - 1) * halfW;
        pos[i * 3 + 1] = (Math.random() * 2 - 1) * halfH;
        pos[i * 3 + 2] = d.z[0] + Math.random() * (d.z[1] - d.z[0]);
        spd[i] = d.speed[0] + Math.random() * (d.speed[1] - d.speed[0]);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = nameObject(new THREE.Points(geo, new THREE.PointsMaterial({
        map: makeStreakTexture(d.len, d.head), size: d.size, sizeAttenuation: true,
        transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending, color: 0xbfeaff,
      })), 'rain-layer-' + li);
      pts.userData = { speeds: spd, halfW, halfH, baseOp: d.op, zMid: (d.z[0] + d.z[1]) / 2 };  // v3.2l: camera-space mid-depth for the per-plane well falloff
      pts.renderOrder = 3;
      group.add(pts);
      return pts;
    });
    scene.add(camera);
    camera.add(group);
    return { group, layers };
  }
```
new_string (law consts hoisted here — `makeDepthRain()` runs at `:639`, long before the old const seat at `:1307`, so leaving them there would TDZ-crash the uniform init; values unchanged, harness re-pins by value):
```js
  /* v3.2l motivation-law constants + the v3.3a well shape — hoisted above
     makeDepthRain (the factory runs long before the rain-update block; the
     shader uniforms initialize from these, TDZ otherwise). Values are LAW
     (harness-pinned by value). */
  const MOTIV_FLOOR = 0.16;      // rain never fully dies while a section calls for weather (0.22→0.16: hero mean read +0.3 over baseline at 0.22 — retuned per the luminance gate)
  const MOTIV_CAP   = 0.80;      // motivated rain always sits BELOW the retired flat-veil peaks
  const RAIN_LITE_VEIL = 0.55;   // LITE: single flat veil ≤ every old per-section value
  const WELL_DEPTH_SIGMA = 6.0;  // camera-Z reach of an emitter's light, world units
  const WELL_XY_SIGMA = 0.25;    // v3.3a: screen-xy reach of a well, NDC units — the ONE new tunable (tune DOWN only, under the luminance A/B gate)
  /* Depth rain — v3.3a: ONE instanced velocity-stretched streak batch (R1).
     470 quads high tier / 210 LITE in a single draw call, camera-parented so
     the sheet rides the view (dossier: GITS solograms are particle systems
     of light in Z-space). The three THREE.Points planes, their baked streak
     sprites, and the per-frame CPU walk are RETIRED: fall + recycle are
     closed-form in the vertex shader, the lean is the TRUE fall+wind vector
     (streaks lean ~30° under full shear instead of sliding under a baked 10°
     sprite), and the v3.2l motivation wells are evaluated PER DROP. Hidden
     under reduced motion — a frozen rain frame reads as glitch. */
  function makeDepthRain() {
    const aspect = w / h;
    const defs = LITE
      ? [{ n: 80, size: 0.26, speed: [4.5, 6.5], op: 0.32, z: [-5, -9], len: 0.7, head: 0.85 },
         { n: 130, size: 0.16, speed: [2.4, 3.8], op: 0.22, z: [-8, -14], len: 0.45, head: 0.7 }]
      : [{ n: 70, size: 0.4, speed: [8, 14], op: 0.5, z: [-4, -7], len: 0.8, head: 0.9 },
         { n: 150, size: 0.24, speed: [4.2, 7.5], op: 0.36, z: [-6, -11], len: 0.55, head: 0.8 },
         { n: 250, size: 0.15, speed: [2.2, 4.2], op: 0.24, z: [-9, -16], len: 0.35, head: 0.65 }];
    const group = new THREE.Group(); group.name = 'depth-rain';
    const total = defs.reduce((sum, d) => sum + d.n, 0);   // 470 high / 210 LITE
    const base = new THREE.PlaneGeometry(1, 1);
    base.translate(0, 0, -8);   // dark-swap safety (v3.1g law): the bloom pass renders the RAW quads under MeshBasicMaterial (instance attrs ignored, all quads collapse onto the base geometry) — park them mid-band, never at the camera plane where w -> 0
    const geo = new THREE.InstancedBufferGeometry();
    geo.name = 'rain-streaks:geometry';
    geo.setIndex(base.getIndex());
    geo.setAttribute('position', base.getAttribute('position'));
    geo.setAttribute('uv', base.getAttribute('uv'));
    geo.instanceCount = total;
    const seed = new Float32Array(total * 3);   // spawn x, spawn y, camera-space z (constant per drop)
    const spd = new Float32Array(total);        // world units / s
    const drop = new Float32Array(total * 4);   // streak len, streak width, baseOp, head alpha
    const rect = new Float32Array(total * 2);   // layer band halfW, halfH — the mod-wrap range
    const layer = new Float32Array(total);      // 0/1/2 — layer 0 takes the projects amber event tint
    let k = 0;
    defs.forEach((d, li) => {
      const halfH = Math.tan(31 * Math.PI / 180) * (-d.z[1]) + 1.5;
      const halfW = halfH * aspect + 1;
      const spdMid = (d.speed[0] + d.speed[1]) / 2;
      for (let i = 0; i < d.n; i++, k++) {
        seed[k * 3] = (Math.random() * 2 - 1) * halfW;
        seed[k * 3 + 1] = (Math.random() * 2 - 1) * halfH;
        seed[k * 3 + 2] = d.z[0] + Math.random() * (d.z[1] - d.z[0]);
        const s = d.speed[0] + Math.random() * (d.speed[1] - d.speed[0]);
        spd[k] = s;
        drop[k * 4] = d.size * d.len * (s / spdMid);   // streak length ∝ speed × layer len — equals the old d.size×d.len sprite streak at mid speed
        drop[k * 4 + 1] = d.size * 0.085;              // ≈ the retired sprite's 9px/128px double-stroke footprint
        drop[k * 4 + 2] = d.op;
        drop[k * 4 + 3] = d.head;
        rect[k * 2] = halfW; rect[k * 2 + 1] = halfH;
        layer[k] = li;
      }
    });
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 3));
    geo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(spd, 1));
    geo.setAttribute('aDrop', new THREE.InstancedBufferAttribute(drop, 4));
    geo.setAttribute('aRect', new THREE.InstancedBufferAttribute(rect, 2));
    geo.setAttribute('aLayer', new THREE.InstancedBufferAttribute(layer, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uT: { value: 0 },       // rain-time (rainSway) — pauses with visibility, exactly like the retired CPU walk
        uWind: { value: 0.1 },  // instantaneous wind+shear — the LEAN (spec §3.1: the one wind float)
        uWindT: { value: 0 },   // ∫wind dt (rainWindT) — the x DRIFT clock; a wind change must not teleport drops
        uBeat: { value: 0.85 }, uVis: { value: 0 }, uTint: { value: 0 },
        uCyan: { value: new THREE.Color(0xbfeaff) },    // carried rain body color (old :521-527)
        uAmber: { value: new THREE.Color(0xffd2a0) },   // layer-0 projects-entry event tint (RAIN_AMBER carried)
        uWells: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
        uMotivFloor: { value: MOTIV_FLOOR },
        uMotivCap: { value: MOTIV_CAP },
        uLiteVeil: { value: RAIN_LITE_VEIL },
        uWellXY: { value: WELL_XY_SIGMA },
        uWellZ: { value: WELL_DEPTH_SIGMA },
        uWellGain: { value: 1 },   // QA-only pools lever: the loop NEVER writes it, so an evaluate_script zero sticks (uWells itself is loop-written every frame)
      },
      vertexShader: `
        attribute vec3 aSeed;
        attribute float aSpeed;
        attribute vec4 aDrop;
        attribute vec2 aRect;
        attribute float aLayer;
        uniform float uT, uWind, uWindT, uBeat, uVis, uTint;
        uniform vec3 uCyan, uAmber;
        #ifdef WELLS
        uniform vec4 uWells[3];
        uniform float uMotivFloor, uMotivCap, uWellXY, uWellZ, uWellGain;
        #else
        uniform float uLiteVeil;
        #endif
        varying vec2 vQuad;
        varying float vAlpha, vHead, vFogDepth;
        varying vec3 vColor;
        void main() {
          // GPU recycle — the CPU per-drop walk is retired: fall + drift are
          // closed-form in rain-time, mod-wrapped over the layer band.
          float x = mod(aSeed.x - aSpeed * uWindT, 2.0 * aRect.x) - aRect.x;
          float y = mod(aSeed.y - aSpeed * uT, 2.0 * aRect.y) - aRect.y;
          vec4 mvC = modelViewMatrix * vec4(x, y, aSeed.z, 1.0);
          vFogDepth = -mvC.z;
          // velocity stretch: lean = atan(wind) off vertical, length rides |v|
          // — the baked-10°-sprite cheapness tell is gone.
          vec2 dir = normalize(vec2(-uWind, -1.0));
          vec2 perp = vec2(-dir.y, dir.x);
          float stretch = length(vec2(uWind, 1.0));
          vec2 off = perp * (position.x * aDrop.y) + dir * (position.y * aDrop.x * stretch);
          gl_Position = projectionMatrix * vec4(mvC.xy + off, mvC.z, 1.0);
          vQuad = vec2(position.x * 2.0, position.y + 0.5);   // x: -1..1 across the streak, y: 0 tail -> 1 head
          #ifdef WELLS
          vec4 pC = projectionMatrix * mvC;
          vec2 ndc = pC.xy / max(pC.w, 1e-4);
          float m = 0.0;
          for (int i = 0; i < 3; i++) {   // per-DROP wells: v3.2l depth falloff carried × NEW screen-xy falloff
            vec2 dxy = ndc - uWells[i].xy;
            m += uWells[i].z * uWellGain
               * exp(-abs(aSeed.z - uWells[i].w) / uWellZ)
               * exp(-dot(dxy, dxy) / (uWellXY * uWellXY));
          }
          float motivation = min(uMotivCap, uMotivFloor + m);
          #else
          float motivation = uLiteVeil;   // LITE: flat veil — the well branch is not even compiled
          #endif
          vAlpha = aDrop.z * uVis * uBeat * motivation;   // the v3.2l terminal-opacity law (baseOp × vis × beat × motivation), per DROP now
          vHead = aDrop.w;
          vColor = mix(uCyan, uAmber, uTint * 0.85 * (1.0 - step(0.5, aLayer)));   // old :1345 tint carried — layer 0 only
        }
      `,
      fragmentShader: `
        varying vec2 vQuad;
        varying float vAlpha, vHead, vFogDepth;
        varying vec3 vColor;
        void main() {
          // head/tail profile — the retired makeStreakTexture ramp (:1035-1039),
          // analytic: 0 at tail -> 0.45×head at 55% -> head at 90% -> 0 at the tip.
          float t = vQuad.y;
          float prof = t < 0.55 ? 0.45 * (t / 0.55)
                     : (t < 0.9 ? mix(0.45, 1.0, (t - 0.55) / 0.35)
                                : 1.0 - (t - 0.9) / 0.1);
          float lateral = 1.0 - smoothstep(0.25, 1.0, abs(vQuad.x));   // soft edges ≈ the 4px core inside the 9px stroke
          // FogExp2 carried: the retired PointsMaterial had fog:true, dimming far
          // planes toward the #05060a void; additive contribution rides alpha,
          // so the dim rides alpha. density 0.05 -> 0.05^2 = 0.0025.
          float fog = exp(-0.0025 * vFogDepth * vFogDepth);
          float a = vAlpha * vHead * prof * lateral * fog;
          if (a < 0.003) discard;
          gl_FragColor = vec4(vColor, a);
        }
      `,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      defines: LITE ? {} : { WELLS: '' },
    });
    const mesh = nameObject(new THREE.Mesh(geo, mat), 'rain-streaks');
    mesh.renderOrder = 3;
    mesh.frustumCulled = false;   // instances span the whole frustum band; the base quad's bounds are meaningless
    group.add(mesh);
    scene.add(camera);
    camera.add(group);
    return { group, mesh, mat };
  }
```
(No verify yet — `node --check` passes only after Step 5 removes the now-duplicate consts at the old seat.)

- [ ] **Step 4: rain state + wells store their NDC seat.** Three Edits in `js/background.js`.
Edit 1 — old_string:
```js
  let rainSway = 0, rainShear = 0, lastScrollY2 = 0, rainTintK = 0;
```
new_string:
```js
  let rainSway = 0, rainShear = 0, lastScrollY2 = 0, rainTintK = 0, rainWindT = 0;   // v3.3a: rainWindT = ∫wind dt — the GPU x-drift clock
  let shearHold = null;   // v3.3a QA lever (lean captures): forced-shear hold; settable ONLY via the sceneDebug hook below — null on every real page
  if (sceneDebug) window.__rainShear = v => { shearHold = (typeof v === 'number') ? Math.max(-0.6, Math.min(0.6, v)) : null; return shearHold; };
```
Edit 2 — old_string (the `:1296–1312` block: retired colors + the per-plane comment + the four consts, which moved up in Step 3):
```js
  const RAIN_CYAN = new THREE.Color(0xbfeaff), RAIN_AMBER = new THREE.Color(0xffd2a0);
  /* v3.2l — rain lever A (rain brief, the one never-built research surface):
     rain is bright only where motivated light reaches it. ≤3 screen-space
     falloff wells at projected emitter positions — Tokyo halo (the city IS
     the lamp), the focused place node, and lightning while it flashes —
     evaluated per PLANE, never per drop:
        terminal opacity = baseOp × vis × beat × motivation
     `vis` (sceneState.rain) is now a simple presence envelope (see
     sectionStories); density/art-direction moved into the wells. LITE skips
     all projection math: one flat veil (RAIN_LITE_VEIL). No new scene
     objects/materials — the bloom dark-swap set is untouched. */
  const MOTIV_FLOOR = 0.16;      // rain never fully dies while a section calls for weather (0.22→0.16: hero mean read +0.3 over baseline at 0.22 — retuned per the luminance gate)
  const MOTIV_CAP   = 0.80;      // motivated rain always sits BELOW the retired flat-veil peaks
  const RAIN_LITE_VEIL = 0.55;   // LITE: single flat veil ≤ every old per-section value
  const WELL_DEPTH_SIGMA = 6.0;  // camera-Z reach of an emitter's light, world units
  const TOKYO_HALO_LOCAL = TOKYO.clone().multiplyScalar(1.08);   // halo group's spin-local seat (:526)
  const rainWells = [{ s: 0, z: 0 }, { s: 0, z: 0 }, { s: 0, z: 0 }];
```
new_string:
```js
  /* v3.2l — rain lever A, ELEVATED PER-DROP by v3.3a: rain is bright only
     where motivated light reaches it. ≤3 screen-space falloff wells at
     projected emitter positions — Tokyo halo (the city IS the lamp), the
     focused place node, and lightning while it flashes — now evaluated per
     DROP in the rain vertex shader (uWells); this block only projects the
     wells and uploads uniforms. `vis` (sceneState.rain) stays the presence
     envelope; LITE still skips all projection math (uLiteVeil, in-shader).
     The law consts live above makeDepthRain now (uniform init reads them). */
  const TOKYO_HALO_LOCAL = TOKYO.clone().multiplyScalar(1.08);   // halo group's spin-local seat (:526)
  const rainWells = [{ x: 0, y: 0, s: 0, z: 0 }, { x: 0, y: 0, s: 0, z: 0 }, { x: 0, y: 0, s: 0, z: 0 }];
```
Edit 3 — old_string:
```js
    well.s = strength * (1 - THREE.MathUtils.smoothstep(edge, 0.9, 1.5)); // screen-space falloff as the emitter leaves frame
    well.z = _wellC.z;
  }
```
new_string:
```js
    well.s = strength * (1 - THREE.MathUtils.smoothstep(edge, 0.9, 1.5)); // screen-space falloff as the emitter leaves frame
    well.z = _wellC.z;
    well.x = _wellN.x; well.y = _wellN.y;   // v3.3a: the NDC seat rides to the GPU as uWells[i].xy
  }
```

- [ ] **Step 5: rewrite updateDepthRain — the CPU walk dies here.** One Edit in `js/background.js`. old_string (the whole `:1324–1371` function, verbatim):
```js
  function updateDepthRain(dt, flash) {
    if (!depthRain) return;
    const vis = sceneState.rain;
    depthRain.group.visible = vis > 0.02;
    if (!depthRain.group.visible) return;
    if (!LITE) {   // wells: 1 Tokyo halo, 2 focused place node, 3 lightning reach while active
      _wellP.copy(TOKYO_HALO_LOCAL); spin.localToWorld(_wellP);
      setWell(rainWells[0], _wellP, sceneState.halo * (0.30 + sceneState.haloPulse * 0.25 + sceneState.lockT * 0.20));
      _wellP.copy(focusedPlaceId === 'dallas' ? DALLAS : TOKYO); spin.localToWorld(_wellP);
      setWell(rainWells[1], _wellP, 0.15 + focusFlash * 0.20);
      if (lightning && lightning.t > 0) {
        _wellP.copy(lightning.sp.position); camera.localToWorld(_wellP);   // sprite is a camera child (:1093)
        setWell(rainWells[2], _wellP, (flash || 0) * 0.9);
      } else rainWells[2].s = 0;
    }
    rainSway += dt;
    const wind = 0.10 + Math.sin(rainSway * 0.6) * 0.05 + Math.max(-0.6, Math.min(0.6, rainShear));
    const beat = 0.85 + sceneState.haloPulse * 0.5 + sceneState.lockT * 0.45 + (flash || 0) * 1.3;
    // v3.2d: tint keys to the projects ENTRY beat (armed in __sceneFocus) and
    // decays over ~2s — amber is an event, never section-residency wallpaper.
    if (rainTintK > 0) rainTintK = Math.max(0, rainTintK - dt * 0.5);
    depthRain.layers[0].material.color.copy(RAIN_CYAN).lerp(RAIN_AMBER, rainTintK * 0.85);
    depthRain.layers.forEach(pts => {
      const p = pts.geometry.attributes.position.array;
      const ud = pts.userData;
      for (let i = 0; i < ud.speeds.length; i++) {
        const s = ud.speeds[i] * dt;
        p[i * 3 + 1] -= s;
        p[i * 3] -= s * wind;
        if (p[i * 3 + 1] < -ud.halfH) {
          p[i * 3 + 1] += ud.halfH * 2;
          p[i * 3] = (Math.random() * 2 - 1) * ud.halfW;
        }
      }
      pts.geometry.attributes.position.needsUpdate = true;
      // v3.2l terminal opacity = baseOp × vis × beat × motivation (per PLANE, not per drop)
      let motivation = RAIN_LITE_VEIL;               // LITE: flat veil, zero projection math on phones
      if (!LITE) {
        let m = 0;
        for (let wi = 0; wi < 3; wi++) {
          const wl = rainWells[wi];
          if (wl.s > 0) m += wl.s * Math.exp(-Math.abs(ud.zMid - wl.z) / WELL_DEPTH_SIGMA);
        }
        motivation = Math.min(MOTIV_CAP, MOTIV_FLOOR + m);
      }
      pts.material.opacity = ud.baseOp * vis * beat * motivation;
    });
  }
```
new_string:
```js
  function updateDepthRain(dt, flash) {
    if (!depthRain) return;
    const vis = sceneState.rain;
    depthRain.group.visible = vis > 0.02;
    if (!depthRain.group.visible) return;
    const U = depthRain.mat.uniforms;
    if (!LITE) {   // wells: 1 Tokyo halo, 2 focused place node, 3 lightning reach while active
      _wellP.copy(TOKYO_HALO_LOCAL); spin.localToWorld(_wellP);
      setWell(rainWells[0], _wellP, sceneState.halo * (0.30 + sceneState.haloPulse * 0.25 + sceneState.lockT * 0.20));
      _wellP.copy(focusedPlaceId === 'dallas' ? DALLAS : TOKYO); spin.localToWorld(_wellP);
      setWell(rainWells[1], _wellP, 0.15 + focusFlash * 0.20);
      if (lightning && lightning.t > 0) {
        _wellP.copy(lightning.sp.position); camera.localToWorld(_wellP);   // sprite is a camera child (:1093)
        setWell(rainWells[2], _wellP, (flash || 0) * 0.9);
      } else rainWells[2].s = 0;
      for (let wi = 0; wi < 3; wi++) {   // v3.3a: wells ride to the GPU — per-DROP falloff in the vertex shader
        const wl = rainWells[wi];
        U.uWells.value[wi].set(wl.x, wl.y, wl.s, wl.z);
      }
    }
    rainSway += dt;
    const wind = 0.10 + Math.sin(rainSway * 0.6) * 0.05 + Math.max(-0.6, Math.min(0.6, rainShear));
    rainWindT += wind * dt;   // v3.3a: the shader's x-drift clock — GPU advection needs ∫wind dt, not wind
    const beat = 0.85 + sceneState.haloPulse * 0.5 + sceneState.lockT * 0.45 + (flash || 0) * 1.3;
    // v3.2d: tint keys to the projects ENTRY beat (armed in __sceneFocus) and
    // decays over ~2s — amber is an event, never section-residency wallpaper.
    if (rainTintK > 0) rainTintK = Math.max(0, rainTintK - dt * 0.5);
    /* v3.3a: the per-drop CPU walk is RETIRED — advection, recycle, and the
       v3.2l terminal opacity (baseOp × vis × beat × motivation) all live in
       the rain shader. This loop's only remaining rain work is well
       projection + these uniform writes. THE A/B LAW (§3.1): the loop writes
       ONLY group.visible and uniforms — NEVER mesh.visible, which stays the
       loop-proof isolation lever for every luminance gate. */
    U.uT.value = rainSway;
    U.uWind.value = wind;
    U.uWindT.value = rainWindT;
    U.uVis.value = vis;
    U.uBeat.value = beat;
    U.uTint.value = rainTintK;
  }
```
NOTE for Task 2 (cross-ref): the `const beat = …` line above is carried VERBATIM including `+ (flash || 0) * 1.3` — Task 2's C2 retires that literal (high tier goes directional via well 3; LITE re-homes under `LITE_FLASH_BEAT`). Do not touch it here.
Then Edit the loop's shear line — old_string:
```js
    rainShear += ((scrollY - lastScrollY2) * 0.0025 - rainShear) * Math.min(1, 0.12 * f);
    lastScrollY2 = scrollY;
```
new_string:
```js
    rainShear += ((scrollY - lastScrollY2) * 0.0025 - rainShear) * Math.min(1, 0.12 * f);
    if (shearHold !== null) rainShear = shearHold;   // v3.3a QA hold — always null outside ?sceneDebug=1
    lastScrollY2 = scrollY;
```
Verify: `grep -n "rain-layer-\|ud\.speeds\|makeStreakTexture(d\.len\|RAIN_CYAN\|depthRain\.layers" js/background.js` → **no output** (all deleted symbols gone; `makeStreakTexture` itself still present at its definition and the shooting-star call site — confirm with `grep -n "makeStreakTexture" js/background.js` → exactly 2 hits: the function and `makeStreakTexture(0.9, 0.9)`).

- [ ] **Step 6: the §1.3 bloom-isolation QA hook (sceneDebug-gated, inert otherwise).** One Edit in `js/background.js` — old_string:
```js
    renderBloomThenFinal = () => {
      scene.traverse(darken);
      bloomComposer.render();      // bright emitters only -> bloom texture
      scene.traverse(restore);
      finalComposer.render();      // real scene + ADD bloom.rgb, keep base.a -> screen
    };
  }
```
new_string:
```js
    renderBloomThenFinal = () => {
      scene.traverse(darken);
      bloomComposer.render();      // bright emitters only -> bloom texture
      scene.traverse(restore);
      finalComposer.render();      // real scene + ADD bloom.rgb, keep base.a -> screen
    };

    /* v3.3a QA hook — bloom-target isolation (§1.3, the v3.1g law with a test).
       sceneDebug-gated (the __sceneDebug/__scanPlace precedent; allocates
       nothing on real pages). Renders the BLOOM composer alone to the canvas,
       optionally freezing the loop so the frame survives for a screenshot,
       and returns an FNV-1a digest of the presented pixels (same-task
       drawImage from renderer.domElement — the droplets IIFE's proven read
       path, immune to DOM overlay contamination). The v33a acceptance pair:
       digest(rain visible) MUST equal digest(rain hidden) — the instanced
       mesh dark-swaps to darkMat and stamps nothing in the bloom buffer. */
    if (sceneDebug) {
      const digestCv = document.createElement('canvas');
      window.__bloomIso = (rainVisible, hold) => {
        const rainMesh = scene.getObjectByName('rain-streaks');
        if (rainMesh) rainMesh.visible = rainVisible !== false;
        if (hold && running) { running = false; cancelAnimationFrame(raf); }
        scene.traverse(darken);
        bloomComposer.renderToScreen = true;
        bloomComposer.render();
        bloomComposer.renderToScreen = false;
        scene.traverse(restore);
        const el = renderer.domElement;
        digestCv.width = el.width; digestCv.height = el.height;
        const g2 = digestCv.getContext('2d', { willReadFrequently: true });
        g2.drawImage(el, 0, 0);
        const px = g2.getImageData(0, 0, digestCv.width, digestCv.height).data;
        let hsh = 0x811c9dc5;
        for (let i = 0; i < px.length; i++) { hsh ^= px[i]; hsh = Math.imul(hsh, 0x01000193); }
        return 'rain=' + (rainVisible !== false) + ' digest=' + (hsh >>> 0).toString(16);
      };
      window.__bloomResume = () => {
        const rainMesh = scene.getObjectByName('rain-streaks');
        if (rainMesh) rainMesh.visible = true;
        if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
        return 'resumed';
      };
    }
  }
```
(`running`/`raf`/`last`/`loop` are declared later in the module — referenced only at call time, after the IIFE has fully executed; the hook only exists when `bloomEnabled`, which already implies `!reduced` and high tier. Task 6 inserts its gated dynamic import directly after this hook — the reconciled anchor is this block's tail.)

- [ ] **Step 7: syntax + harness GREEN.** `node --check js/background.js` → silent, exit 0. `node --check tools/verify-site-hardening.js` → silent. `node tools/verify-site-hardening.js; echo "exit=$?"` → **43 PASS, 0 FAIL, exit=0** (`node tools/verify-site-hardening.js | grep -c PASS` → `43`). All 40 untouched legacy checks green, the two rewritten checks green, the new v33a check green.

- [ ] **Step 8: version bumps (§7 chain — background.js touch → V.bg 5.7 → boot.mjs?v=24).** Edit `js/boot.mjs` — old_string:
```js
const V = { bg: '5.6', boot: '3.1', cursor: '3.1', fx: '3.7', app: '4.2' };
```
new_string:
```js
const V = { bg: '5.7', boot: '3.1', cursor: '3.1', fx: '3.7', app: '4.2' };
```
Edit `index.html` — old_string:
```html
<script type="module" src="js/boot.mjs?v=23"></script>
```
new_string:
```html
<script type="module" src="js/boot.mjs?v=24"></script>
```
`node --check js/boot.mjs` → silent (touched JS, §6). Burn-rule guard (§7): `git log -p main -- js/boot.mjs | grep -c "bg: '5.7'"` → `0` and `git log -p main -- index.html | grep -c "boot.mjs?v=24"` → `0` (grep exits 1 on zero matches — the printed `0` is the pass). `site.css` is untouched by v33a → no css bump.

- [ ] **Step 9: live smoke — the new build boots clean.** Ensure the server: `curl -sI http://127.0.0.1:8765/index.html | head -1` → `HTTP/1.0 200 OK` (else start `python3 -m http.server 8765` from the repo root, in background). chrome-devtools: ONE tab, close stale QA tabs. Navigate `http://127.0.0.1:8765/index.html`, hard reload (ignoreCache). (a) `list_console_messages` → **zero** messages (any `THREE.WebGLProgram` shader-compile warning = task failure, fix before proceeding). (b) `evaluate_script`: `performance.getEntriesByType('resource').some(r => r.name.includes('background.js?v=5.7'))` → `true` (new cache-bust live). (c) Visual: rain streaks fall over the hero, near layer sparse/bright, far dense/dim (the ≥2-depth-plane read survives in one draw call). (d) Watch ~30 s: drops recycle seamlessly (no popping band at the frame bottom — the mod-wrap works), gentle lean wobble with the wind sine.

- [ ] **Step 10: acceptance 2 — the LEAN capture pair.** Session on `http://127.0.0.1:8765/index.html?sceneDebug=1` (the `__rainShear` hold hook only exists here; lean is a geometry read, not a luminance read — the debug overlay rides both frames identically). Viewport 1440×743 CSS @ DPR 2 via device-metrics emulation; verify `evaluate_script`: `[innerWidth, innerHeight, devicePixelRatio]` → `[1440, 743, 2]`. Hard reload, 11 s settle at hero. (a) Capture → `docs/superpowers/gates/v33/a-lean-rest.png`. (b) `evaluate_script`: `window.__rainShear(0.6)` → returns `0.6`; wait 1 s (the hold pins `rainShear` at the clamp every frame). (c) Capture → `docs/superpowers/gates/v33/a-lean-shear.png`. (d) `window.__rainShear(null)` → `null`. Measure on zoomed crops of any near-plane streak (read two endpoint pixel coords, angle = atan2(Δx, Δy) from vertical): rest wind = 0.10±0.05 → expected lean ≈ 3–9°; held shear → wind ≈ 0.65–0.75 → expected ≈ 33–37°. **Gate: ≥ 20° lean difference between the pair.** Record both measured angles in the task report.

- [ ] **Step 11: acceptance 3 — the POOLS pair (wells on/off, loop-proof).** Plain URL `http://127.0.0.1:8765/index.html`, same viewport, hard reload, 11 s settle at hero. Capture the scene reference via the v3.2r transient hook — `evaluate_script`:
```js
(() => { const T = window.THREE, p = T.Object3D.prototype, orig = p.onBeforeRender;
  p.onBeforeRender = function (r, s) { window.__scn = s; p.onBeforeRender = orig; };
  return 'hooked'; })()
```
wait 300 ms, then `window.__scn ? 'captured' : 'missed'` → `'captured'`. (a) Capture wells-ON → `docs/superpowers/gates/v33/a-pools-on.png`. (b) `evaluate_script`: `window.__scn.getObjectByName('rain-streaks').material.uniforms.uWellGain.value = 0` (uWellGain is the loop-never-written lever — a direct `uWells` zero would be overwritten next frame); wait 0.3 s. (c) Capture wells-OFF → `docs/superpowers/gates/v33/a-pools-off.png`. (d) Restore: `…uWellGain.value = 1`. **Gate (qualitative, archived — no invented ratios):** in the ON frame, rain inside the Tokyo-halo footprint reads brighter than the dark-field corner; in the OFF frame the field is uniform at the floor (motivation = 0.16 everywhere). Note the pair in the task report.

- [ ] **Step 12: acceptance 1 — the MANDATORY bloom-target isolation pair (§1.3).** Session on `?sceneDebug=1`, same viewport, hard reload, 11 s settle. Sequence (the loop stays FROZEN between the two calls so scene state cannot move — the ONLY difference is rain visibility):
  1. `evaluate_script`: `window.__bloomIso(true, true)` → returns `rain=true digest=<A>`; the canvas now shows the bloom buffer alone. Capture → `docs/superpowers/gates/v33/a-bloomiso-on.png`.
  2. `evaluate_script`: `window.__bloomIso(false, true)` → returns `rain=false digest=<B>`. Capture → `docs/superpowers/gates/v33/a-bloomiso-off.png`.
  3. `evaluate_script`: `window.__bloomResume()` → `'resumed'` (rain visible restored, loop restarted).
**Gate: digest A === digest B, exactly** — pixel-identical bloom target with the rain mesh visible vs hidden (no stamped holes, no dark squares; the archived pair is the visual record). `list_console_messages` → zero messages/warnings across the whole session. **A shipped M4 without this archived pair is a failed task (spec §1.3).** If digests differ: STOP, debug the dark swap (suspects: base quad depth, material type in `darken()`), re-run; do not proceed to luminance gates on a failing pair.

- [ ] **Step 13: §4.1 — pre-campaign baseline + after-set, SAME session (the v32n stash method).** This is the campaign's baseline of record (spec §0: cross-session comparison is what burned the original §8 rows — the v3.2r close-out numbers are provenance context only). Procedure per §4 common contract, reproduced exactly: ONE tab, plain URL `http://127.0.0.1:8765/index.html`; viewport 1440×743 CSS @ DPR 2 via device-metrics emulation (captures are 2880×1486 — verify the first PNG's geometry); **fresh hard-reload (ignoreCache) before EVERY capture**; 11 s settle post-boot and 11 s post-scroll; scroll landing verified via `evaluate_script` before every capture (hero `scrollTo(0,0)` → `scrollY === 0`; `#gallery` and `#projects` via `scrollIntoView()` → element `getBoundingClientRect().top ≈ 74 px`, record the exact scrollY); zero console messages for the session; viewport + DPR + cache-busts recorded per capture set.
  1. **Baseline arm (pre-M4 @ b3d4067):** `git stash` (stashes all Step 1–8 edits; the served tree reverts to `boot.mjs?v=23` / bg 5.6 — confirm via the resource entries after the first reload). For each section hero → projects → gallery, 5 captures each (reload → settle → scroll → settle → verify → capture) → `docs/superpowers/gates/v33/base-{hero,projects,gallery}-{1..5}.png`.
  2. `git stash pop` (working tree restored — verify `git stash list` empty and `node tools/verify-site-hardening.js` exits 0 again).
  3. **After arm (v33a build):** same 15-capture procedure → `docs/superpowers/gates/v33/a-{hero,projects,gallery}-{1..5}.png`.
  4. `for f in docs/superpowers/gates/v33/base-*.png docs/superpowers/gates/v33/a-*.png; do echo "$f: $(node tools/frame-luminance.mjs "$f")"; done` → build the per-metric **median-of-5 + spread** table (mean/p50/p95/warmShare × 3 sections × 2 builds) in the task report.
**Gates:** (a) **p50 floors hold in the after-set: hero 8 / projects 7 / gallery 9** — any violating capture set fails the task outright (a build error, not gate-pile material). (b) Hero mean (after) must not rise beyond resolution vs baseline (documented per-frame spread: hero σ ≈ 0.4–1.2, projects ≈ 1.17, gallery ≈ 0.72 — deltas inside spread are marked *below resolution*, never cited as real, §1.4).

- [ ] **Step 14: §4.2 — the interleaved rain A/B (the letter criterion, bar = −0.01).** Same session, after-build serving. Fresh hard reload, 11 s settle at hero, then all pairs on the same page (matched settle, the v3.2r regime). Re-capture the scene reference (Step 11's transient hook) if the reload cleared `window.__scn`. 5 interleaved pairs, i = 1..5: (a) `window.__scn.getObjectByName('rain-streaks').visible = true` → wait 2 s → capture `a-rainAB-on-{i}.png`; (b) `….visible = false` → wait 0.3 s → capture `a-rainAB-off-{i}.png`; (c) restore `visible = true`. (The loop writes only `group.visible` + uniforms, never `mesh.visible` — the toggle is loop-proof and sticky; the 2D droplet glass stays live in BOTH arms per §4.2 — isolating only the WebGL rain is the sanctioned method.) Run frame-luminance on all 10; per-pair Δ = mean(on) − mean(off). **Gate: median pairwise Δ ≤ 0.** A Δ in (0, resolution) FAILS the letter and routes to the gate pile with the variance analysis attached (v3.2r precedent) — never silently passed. Record the 5-row pair table + medians in the task report. Finish: `delete window.__scn`, mesh visible true.

- [ ] **Step 15: §4.4 — fpsEMA gate (SEPARATE session; the debug overlay changes pixels, so this never mixes with luminance captures).** New session on `http://127.0.0.1:8765/index.html?sceneDebug=1` (close the previous QA tab; ONE tab). (a) **After arm:** hard reload → hero at rest → 30 s settle → 5 readings of `window.__sceneDebug().fps` at 2 s spacing → median. (b) **Baseline arm (same session):** `git stash` → hard reload → 30 s settle → 5 readings → median → `git stash pop`. **Gate: median(after) ≥ median(baseline) − 2 fps**, same machine, same session. Record both 5-reading sets. (Structurally the after-arm should win: the 470-drop CPU walk is gone and 3 draw calls became 1.)

- [ ] **Step 16: LITE + reduced-motion sweeps (§1.5, §3.1 LITE bounds).**
  (a) **LITE visual:** device emulation 390×844 @ DPR 2, mobile + touch, plain URL, hard reload, 11 s. Rain alive (210 instances, 2-layer read), no wells (flat veil — uniform field), zero console. Capture → `docs/superpowers/gates/v33/a-mobile-hero.png`. Quick sanity on `?sceneDebug=1`: `window.__sceneDebug().lite` → `true`, `.fps` healthy.
  (b) **Reduced motion:** emulate `prefers-reduced-motion: reduce`, plain URL, hard reload → static frame renders, **no rain at all** (`depthRain` stays null via the pinned `reduced ? null : makeDepthRain()` — M4 does not resurrect it), zero console. Clear the emulation after.
  (c) **LITE perf trace (v32n method, warm regime only):** emulation 412×823 @ DPR 1.75 mobile + touch, 4× CPU throttle, Slow 4G. ≥3 `performance_start_trace(reload: true)` runs on the after-build → LCP values; `git stash` → ≥3 runs on baseline → `git stash pop`. Compare **warm-regime medians only** (document latency ~55–60 ms is the warm marker; discard cold-regime runs — cross-regime comparisons are banned per the v32n finding). **Gate: warm-regime LCP parity with baseline (the 257 ms class).** Record all runs + regime markers.

- [ ] **Step 17: byte ledger + task report.** Ledger (§4.4): `for f in js/background.js tools/verify-site-hardening.js js/boot.mjs index.html .gitignore; do echo "$f: $(git show b3d4067:$f | wc -c) -> $(wc -c < $f)"; done` → record deltas. Write `.superpowers/sdd/v33/task-v33a-report.md` (git-ignored ledger, house v32r-report shape): procedure notes (viewport/DPR/cache-busts per set, scroll landings), the §4.1 medians + spreads table (both arms), the §4.2 pair table + median Δ + letter verdict, lean angles, pools pair note, bloom digests A/B, fps medians, LCP runs + regime markers, byte ledger, and every deviation or below-resolution note (§1.4 wording: report as measured, mark unresolvable, route letter-fails to the gate pile).

- [ ] **Step 18: commit.** `git add js/background.js js/boot.mjs index.html tools/verify-site-hardening.js .gitignore` (gates PNGs and the sdd report are ignored — verify `git status` shows exactly these 5 files staged). Commit with the spec §8 message verbatim as the subject, the §4.4 byte ledger as the body, and the house trailer:
```
feat(v33a): instanced velocity-stretched rain — per-drop wells, GPU recycle; Points planes + CPU loop retired

Byte ledger (wc -c vs b3d4067): background.js <delta> B, verify-site-hardening.js <delta> B, boot.mjs +0/-0 (version only), index.html (version only), .gitignore +<delta> B.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```
(`<delta>` fields are Step 17's measured numbers — replace before committing; a commit with the literal placeholder is a task failure.) Verify: `git log -1 --format=%B` shows the exact subject + trailer; `node tools/verify-site-hardening.js` exit 0 at the committed tree; working tree clean except ignored artifacts.

#### Task-1 spec rulings (resolved here, recorded for the executor — each cross-checked against the spec at assembly)

1. **Pools A/B lever (`uWellGain`) — ACCEPTED against §3.1 acceptance 3:** the spec says "toggling uWells strengths → 0 via evaluate_script", but §3.1's own A/B-lever law makes uniforms the loop's channel — `uWells` is loop-written every frame, so a direct zero cannot stick. A `uWellGain` uniform (init 1) that the loop NEVER writes, folded inside the well summation, preserves the §6-pinned `min(uMotivCap, uMotivFloor + m)` shape verbatim; `uWellGain = 0` ≡ all strengths 0, loop-proof.
2. **Forced shear for the lean pair — ACCEPTED against §3.1 acceptance 2:** `rainShear` is module-scoped and decays (τ ≈ 0.13 s), and the page is far too short to sustain the 240 px/frame scroll velocity the ±0.6 clamp needs. The sceneDebug-gated `window.__rainShear(v)` hold hook is the exact `__forceFlash` idiom spec §4.3 itself sanctions. Lean captures run on `?sceneDebug=1`; lean is a geometry read, and the overlay rides both frames identically.
3. **"Pixel-identical" bloom proof — ACCEPTED against §1.3:** `readRenderTargetPixels` on the 4×-MSAA HalfFloat composer targets is platform-fragile, and screenshot byte-compare is contaminated by DOM chrome. `__bloomIso` renders the bloom composer to screen with the loop frozen and digests `renderer.domElement` via same-task `drawImage`/`getImageData` — FNV-1a digest equality is the proof; the two screenshots are the archived visual record.
4. **x-drift needs ∫wind dt, not wind:** the spec names ONE wind float (`uWind`) — that drives the lean, and it stays the single instantaneous float. Positioning drops by `seedX − speed·uWind·uT` would teleport the whole field sideways whenever wind changes; `uWindT` (CPU accumulates `rainWindT += wind * dt`) is the drift clock, mod-wrapped like y.
5. **Fog parity:** the retired `PointsMaterial` defaulted `fog: true` (`FogExp2(0x05060a, 0.05)` dims far planes toward the void); a fog-less ShaderMaterial would brighten the dense far layer and poison the §4.2 A/B. The FogExp2 retention factor `exp(−(0.05·depth)²)` is carried analytically on alpha (equivalent under additive blending).
6. **Const hoist (TDZ):** `MOTIV_FLOOR`/`MOTIV_CAP`/`RAIN_LITE_VEIL`/`WELL_DEPTH_SIGMA` lived at the old update-block seat (`:1307–1310`), but `makeDepthRain()` executes at `:639` and its uniform inits read them. Hoisted above the factory, values unchanged, harness re-pins them by value.
7. **"Uniforms at the same values":** the JS consts stay the single source of truth; uniforms initialize from them (`uMotivFloor: { value: MOTIV_FLOOR }`) — both the by-value consts and the init shape are pinned, stronger than baking literals into GLSL.
8. **`.gitignore`:** spec §4 archives under `docs/superpowers/gates/v33/` (git-ignored) but only `gates/v32/` is ignored today; v33a is the campaign's first archiving task, so it adds the line.
9. **Streak width had no spec number:** width = `d.size × 0.085` (the retired sprite's 9 px double-stroke over a 128 px canvas, soft-edged by the lateral smoothstep); length calibrated so a mid-speed drop's streak equals the old `d.size × d.len` exactly — the old look is the neutral point, speed/shear stretch is the new information.
10. **Amber tint carried as a mix, not a material color:** old code lerped `layers[0].material.color`; one batch has one material, so the tint is `uTint` (= `rainTintK`) mixed per-instance in the vertex shader, gated to `aLayer == 0` — same `× 0.85` factor, same decay, same `:1521` arm (untouched).

---

### Task 2 (v33b): The scene answers its lightning — C-bundle C1+C2+C3+C4+C5 (M2)

Spec anchors (BINDING): §1.2, §3.2, §4.1, §4.3, §6, §7, §8 item 2. Line anchors are pre-v33a (`b3d4067`); where Task 1 rewrote a region, the step says so and the anchors below are already reconciled against the state Task 1 leaves behind.

**Files:** Modify: `js/background.js` (limb-shell block ~:955–990 → uFlashLimb; lightning sprite gradient :1120–1126 → C5; `updateLightning` :1135–1153 → §4.3 hold hook; the Task-1 hoisted law-const block above makeDepthRain → `LITE_FLASH_BEAT`; Task 1's carried beat line in `updateDepthRain` → C2 retirement; sceneState init :1458–1468 + `__sceneFocus` :1514–1515 + decay :2057 → `wordT`; getSceneDebug :1544–1560 → probes; droplets IIFE :646–753 → C4 glint; composer handles :1764 + gradePass :1834–1873 → `uFlash`; loop :2074/:2128/:2188 → drives), `js/boot.mjs` (:17 `bg: '5.7'` → `'5.8'`), `index.html` (`boot.mjs?v=24` → `?v=25`). Test: `tools/verify-site-hardening.js` (append ONE check above the `const failed =` anchor).

**Interfaces:**
- **Consumes (from Task 1 — spec-guaranteed carries; re-anchor lines against the post-Task-1 tree):** the `'rain-streaks'` instanced mesh under the `'depth-rain'` group; `uWells` (vec4[3]: screen-xy, strength, camera-z — well 3 = lightning at strength `(flash || 0) * 0.9` via the carried `setWell(rainWells[2], …)`); the beat line carried VERBATIM per spec §3.1 — `const beat = 0.85 + sceneState.haloPulse * 0.5 + sceneState.lockT * 0.45 + (flash || 0) * 1.3;` — still CPU-computed inside `updateDepthRain` and uploaded to the rain material as **`uBeat`** (this task edits only the CPU expression, never the uniform); the carried loop call site `updateDepthRain(dt, updateLightning(dt));` (old :2074, untouched by Task 1); the `const RAIN_LITE_VEIL = 0.55;` const at its Task-1 hoisted seat (above makeDepthRain); harness at Task 1's full-green count (43 = 42 legacy with 2 rewritten in place + 1 new); version state `V.bg '5.7'` / `boot.mjs?v=24`.
- **Produces (later tasks + Task 7 rely on):** `sceneState.wordT` (state-word suppression envelope: armed home-excluded in `__sceneFocus`, decay `dt / 1.9`, drives NOTHING but the uFlash gate); `const LIGHTNING_GRADE_LIFT = 0.08` (C1 kill switch = set `0.0`; law 0 < lift ≤ 0.10, pinned by value); `const LITE_FLASH_BEAT = 1.3`; `uFlash` gradePass uniform + `gradeUniforms` module-scope handle (null on LITE/reduced); `uFlashLimb` shared uniform object (limb catch, tier-agnostic, event-gated); loop-local `flash` (the single envelope every coupling consumes — Task 6's loop-hook anchor deliberately avoids the lines this creates); `droplets.update(dt, flash)` two-arg signature + IIFE-scoped `glintFlash` (Tasks 3 and 6 must preserve both); sceneDebug-gated QA hook `window.__forceFlash(hold, lift, x)` — `hold` truthy pins the envelope at its first peak (env ≈ 0.883), `lift === false` is the §4.3 control arm (uFlash forced 0, envelope/sprite/rain live), numeric `x` sets the strike's `sp.position.x`; debug probes `wordT` and `uFlash` in `__sceneDebug()`; harness check `v3.3b — the scene answers its lightning as ONE event` (count → 44); archived gates under `docs/superpowers/gates/v33/`: `b-c5-before.png`/`b-c5-after.png`, `b-flash-p95-{on,off}-{1..5}.png`, `b-direction-*.png` + patch crops, `b-onesignal.txt`.

- [ ] **Step 1: preflight — confirm the Task-1 carries this task edits.** Run:
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website"
git log --oneline -1                          # expect the v33a commit at HEAD
node tools/verify-site-hardening.js | tail -1 # expect 0 failures, full green (43 expected)
grep -n "(flash || 0) \* 1.3" js/background.js        # expect exactly ONE hit (the carried beat line)
grep -n "updateDepthRain(dt, updateLightning(dt))" js/background.js   # expect ONE hit (loop call site)
grep -n "rain-streaks" js/background.js               # expect ≥1 hit (Task 1's mesh)
grep -c "wordT\|uFlash\|LITE_FLASH_BEAT\|LIGHTNING_GRADE_LIFT\|__forceFlash\|glintFlash" js/background.js  # expect 0
mkdir -p docs/superpowers/gates/v33
git check-ignore docs/superpowers/gates/v33 || echo "ADD docs/superpowers/gates/v33/ to .gitignore (Task 1 should have; if this prints, append the line beside docs/superpowers/gates/v32/)"
```
If any carry is missing, STOP and reconcile with the Task-1 report before editing.
- [ ] **Step 2: harness pin RED-FIRST.** In `tools/verify-site-hardening.js`, insert above the anchor line `const failed = checks.filter(item => !item.pass);` (and BELOW Task 1's check):
```js
// v3.3b — lightning is ONE event (spec §1.2/§3.2/§6): the whole-frame grade
// lift is pinned by VALUE (0 < lift <= 0.10, the biasCap idiom) and suppressed
// in its max(lockT, wordT) shape while the boxed state-word or the home/boot
// lock owns the frame; wordT arms home-excluded inside __sceneFocus and decays
// over the word's 1.9s CSS window; the limb catches the flash (uFlashLimb);
// the glass glints capped at 0.32 over a NEVER-raised 0.22 lens body (Toy Shop
// translucency law); LITE's surviving flat coupling is the named
// LITE_FLASH_BEAT; the old shared flat literal is retired (MUST-NOT-MATCH).
const gradeLiftMatch = background.match(/const LIGHTNING_GRADE_LIFT = ([0-9.]+)/);
const gradeLift = gradeLiftMatch ? Number(gradeLiftMatch[1]) : NaN;
check('v3.3b — the scene answers its lightning as ONE event',
  gradeLift > 0 && gradeLift <= 0.10 &&
    /1 - Math\.max\(sceneState\.lockT, sceneState\.wordT\)/.test(background) &&
    /if \(id === 'home'\) sceneState\.lockT = 1;[^\n]*\n\s*else sceneState\.wordT = 1;/.test(background) &&
    /sceneState\.wordT - dt \/ 1\.9/.test(background) &&
    /uFlashLimb/.test(background) &&
    /globalAlpha = 0\.22 \* a/.test(background) &&
    /Math\.min\(0\.32, 0\.2 \* a \* \(1 \+ glintFlash \* 0\.6\)\)/.test(background) &&
    /const LITE_FLASH_BEAT = 1\.3/.test(background) &&
    /LITE \? \(flash \|\| 0\) \* LITE_FLASH_BEAT : 0/.test(background) &&
    !/\(flash \|\| 0\) \* 1\.3/.test(background),
  'grade lift ' + gradeLift + ' must sit in (0, 0.10] and be word/lock-suppressed; wordT arms home-excluded in __sceneFocus and decays dt/1.9; limb catch present; glint hard-capped 0.32 over an unraised 0.22 lens body; LITE flash beat named; the old shared flat literal retired');
```
Run `node tools/verify-site-hardening.js` → expect EXACTLY one FAIL (`v3.3b — the scene answers its lightning as ONE event`), every prior check PASS, exit 1.
- [ ] **Step 3: the two consts.** Edit `js/background.js` — old_string:
```js
  /* Sheet lightning — a rare decaying double-flicker behind the globe; the
     rain flares with it (dossier: motivated light — the flash is an emitter).
     Off under reduced motion. */
  const lightning = (function () {
```
new_string:
```js
  /* Sheet lightning — a rare decaying double-flicker behind the globe; the
     rain flares with it (dossier: motivated light — the flash is an emitter).
     Off under reduced motion. */
  /* v3.3b — the scene answers its lightning (C-bundle, the Toy Shop parameter-
     plumbing move): ONE event — every coupling consumes the single decaying env
     returned by updateLightning(); zero new timers, zero new beats (§1.2).
     LIGHTNING_GRADE_LIFT doubles as the C1 kill switch (set 0.0); law of record
     0 < lift <= 0.10, harness-pinned by value. */
  const LIGHTNING_GRADE_LIFT = 0.08;
  const lightning = (function () {
```
Then old_string (at the Task-1 hoisted const seat above makeDepthRain — re-anchor by name if moved):
```js
  const RAIN_LITE_VEIL = 0.55;   // LITE: single flat veil ≤ every old per-section value
```
new_string:
```js
  const RAIN_LITE_VEIL = 0.55;   // LITE: single flat veil ≤ every old per-section value
  const LITE_FLASH_BEAT = 1.3;   // v3.3b C2: LITE's flat flash coupling (no wells compiled on phones); high tier answers lightning directionally via well 3
```
- [ ] **Step 4: `wordT` — init, arm, decay (three edits).** Init — old_string:
```js
    haloPulse: 0,
    shiftX: 0, shiftZ: 0,   // v3.2o: eased per-section globe offset (only work sets a target)
    lockT: 1,          // signal-lock timer (1 → 0), drives ring sweep + glow bloom; starts armed —
                       // boot IS the home entry (effects.js never emits an initial section focus)
  };
```
new_string:
```js
    haloPulse: 0,
    shiftX: 0, shiftZ: 0,   // v3.2o: eased per-section globe offset (only work sets a target)
    lockT: 1,          // signal-lock timer (1 → 0), drives ring sweep + glow bloom; starts armed —
                       // boot IS the home entry (effects.js never emits an initial section focus)
    wordT: 0,          // v3.3b: state-word suppression envelope (1 → 0 over the word's 1.9s CSS
                       // window) — drives NOTHING but the uFlash gate (§1.2: pure suppression, never a beat)
  };
```
Arm — old_string:
```js
    sceneState.haloPulse = Math.max(sceneState.haloPulse, story.intensity || 1);
    if (id === 'home') sceneState.lockT = 1;   // signal-lock beat (boot/home only)
```
new_string:
```js
    sceneState.haloPulse = Math.max(sceneState.haloPulse, story.intensity || 1);
    if (id === 'home') sceneState.lockT = 1;   // signal-lock beat (boot/home only)
    else sceneState.wordT = 1;                 // v3.3b: the boxed state-word owns every OTHER section change (effects.js:13 skips home) — wordT gates ONLY the grade lift (§1.2)
```
(Under reduced, `__sceneFocus` still fires but the loop never runs: `wordT` arms and never decays — harmless, `gradeUniforms` is null there and nothing reads it.) Decay — old_string:
```js
    if (sceneState.lockT > 0) sceneState.lockT = Math.max(0, sceneState.lockT - dt * 0.9);
```
new_string:
```js
    if (sceneState.lockT > 0) sceneState.lockT = Math.max(0, sceneState.lockT - dt * 0.9);
    if (sceneState.wordT > 0) sceneState.wordT = Math.max(0, sceneState.wordT - dt / 1.9);   // v3.3b: mirrors the word's 1.9s run (.state-flash.show, site.css:665)
```
- [ ] **Step 5: C1 uniform — handle, uniform entry, shader decl, lift application, handle assignment (five edits).** Handle — old_string:
```js
  let bloomComposer = null, finalComposer = null, renderBloomThenFinal = null;
```
new_string:
```js
  let bloomComposer = null, finalComposer = null, renderBloomThenFinal = null;
  let gradeUniforms = null;   // v3.3b: loop-visible handle for the uFlash drive — stays null on LITE/reduced (no grade pass there)
```
Uniform entry — old_string:
```js
        uTealAmt: { value: 0.0 },
        uSat:     { value: 1.06 },                                   // keep cyan lead / amber pop
      },
```
new_string:
```js
        uTealAmt: { value: 0.0 },
        uSat:     { value: 1.06 },                                   // keep cyan lead / amber pop
        uFlash:   { value: 0.0 },                                    // v3.3b C1: lightning exposure lift (LIGHTNING_GRADE_LIFT * env, word/lock-suppressed)
      },
```
Shader decl — old_string:
```js
        uniform sampler2D tDiffuse;
        uniform vec3 uLift, uGamma, uGain, uTeal;
        uniform float uTealAmt, uSat;
```
new_string:
```js
        uniform sampler2D tDiffuse;
        uniform vec3 uLift, uGamma, uGain, uTeal;
        uniform float uTealAmt, uSat, uFlash;
```
Lift application (pre-saturation, spec §3.2 C1: `c *= 1.0 + uFlash` before step (3)) — old_string:
```js
          // (3) gentle saturation
          c = mix(vec3(dot(c, LUMA)), c, uSat);
```
new_string:
```js
          // (v3.3b C1) lightning exposure lift — the whole frame breathes with the
          // strike, pre-saturation (Toy Shop's pre-tonemap add). 0 at rest; the
          // final clamp below keeps the write in range.
          c *= 1.0 + uFlash;

          // (3) gentle saturation
          c = mix(vec3(dot(c, LUMA)), c, uSat);
```
Handle assignment — old_string:
```js
    gradePass.material.blending = THREE.NoBlending;
```
new_string:
```js
    gradePass.material.blending = THREE.NoBlending;
    gradeUniforms = gradePass.material.uniforms;   // v3.3b: the loop drives uFlash per frame
```
- [ ] **Step 6: capture `flash` in the loop + C1 drive.** Old_string (carried verbatim through Task 1 — verified: Task 1 does not touch the call site):
```js
    updateDepthRain(dt, updateLightning(dt));
    updateScanTag(dt);
```
new_string:
```js
    const flash = updateLightning(dt);   // v3.3b: ONE event — every C-coupling consumes this single envelope (§1.2)
    updateDepthRain(dt, flash);
    /* C1 — the whole-frame grade lift, the only coupling with global reach:
       suppressed while the boxed state-word (wordT) or the home/boot signal-lock
       (lockT) owns the frame. forceFlashLift is the §4.3 sceneDebug control arm
       (always true in production). gradeUniforms is null on LITE/reduced. */
    if (gradeUniforms) gradeUniforms.uFlash.value = (forceFlashLift ? LIGHTNING_GRADE_LIFT : 0) *
      flash * Math.max(0, 1 - Math.max(sceneState.lockT, sceneState.wordT));
    updateScanTag(dt);
```
- [ ] **Step 7: `__forceFlash` hook (§4.3 pinned phase) + envelope hold.** Old_string:
```js
  function updateLightning(dt) {
    if (!lightning) return 0;
    const L = lightning;
    L.next -= dt;
```
new_string:
```js
  /* v3.3b §4.3 QA hook — sceneDebug-gated (the __sceneDebug/__scanPlace
     precedent; inert & unallocated on the plain URL). __forceFlash(hold, lift, x):
     hold truthy re-seeds L.t each frame so the dt*2.4 decay lands it at exactly
     5/6 => env = sin(pi/2) * (1 - 0.7/6) ≈ 0.883 — the envelope's first peak,
     held steady for the capture set. lift === false is the same-session control
     arm (uFlash forced 0; sprite + rain response stay live). Numeric x pins the
     strike's screen position for the directionality pair. */
  let forceFlashHold = false, forceFlashLift = true;
  if (sceneDebug) window.__forceFlash = (hold, lift, x) => {
    forceFlashHold = !!hold;
    forceFlashLift = lift !== false;
    if (lightning) {
      if (typeof x === 'number') lightning.sp.position.x = x;
      if (!hold) { lightning.t = 0; lightning.next = 5 + Math.random() * 10; }   // release: end now, natural flash soon
    }
  };
  function updateLightning(dt) {
    if (!lightning) return 0;
    const L = lightning;
    if (forceFlashHold) L.t = 5 / 6 + dt * 2.4;   // §4.3: decays to exactly 5/6 this frame — held first peak
    L.next -= dt;
```
(While held, `L.t > 0` blocks the natural re-trigger branch by construction.)
- [ ] **Step 8: debug probes.** Old_string:
```js
      lockT: Number(sceneState.lockT.toFixed(3)),
      fps: Math.round(fpsEMA),
```
new_string:
```js
      lockT: Number(sceneState.lockT.toFixed(3)),
      wordT: Number(sceneState.wordT.toFixed(3)),                                  // v3.3b: suppression-envelope probe (§4.3 gate)
      uFlash: gradeUniforms ? Number(gradeUniforms.uFlash.value.toFixed(4)) : 0,   // v3.3b: grade-lift probe (§4.3 gate)
      fps: Math.round(fpsEMA),
```
(`gradeUniforms` is a `let` declared later in the module — legal: `getSceneDebug` only runs after the whole IIFE has evaluated, same pattern as `fpsEMA`.)
- [ ] **Step 9: C3 limb catch — shared uniform, material entry, shader decl, rim term, loop drive (four edits + drive).** Shared uniform — old_string:
```js
  if (GLOBE_ELEV) {
    halo.visible = false;                                  // sprite off; shell is the atmosphere now
```
new_string:
```js
  const uFlashLimb = { value: 0 };   // v3.3b C3: lightning limb catch — loop-driven, 0 at rest (event-gated, decays with env)
  if (GLOBE_ELEV) {
    halo.visible = false;                                  // sprite off; shell is the atmosphere now
```
Material entry — old_string:
```js
      uniforms: { uSunDir: globeMat.uniforms.uSunDir, uReveal: globeMat.uniforms.uReveal },
```
new_string:
```js
      uniforms: { uSunDir: globeMat.uniforms.uSunDir, uReveal: globeMat.uniforms.uReveal, uFlashLimb },
```
Shader decl — old_string (the limb fragment's decl run; unique via the three varyings):
```js
        uniform vec3 uSunDir;
        uniform float uReveal;
        varying vec3 vNormalV;
        varying vec3 vViewDirV;
        varying vec3 vSphereDir;
```
new_string:
```js
        uniform vec3 uSunDir;
        uniform float uReveal, uFlashLimb;
        varying vec3 vNormalV;
        varying vec3 vViewDirV;
        varying vec3 vSphereDir;
```
Rim term — old_string:
```js
          float a = min(rim * mix(0.05, 1.0, day) * reveal, 0.5) + band * 0.25 * day;
```
new_string:
```js
          // v3.3b C3: the atmosphere catches the sheet flash (uFlashLimb = flash *
          // 0.25 * tokyoFacing) — at rest the uniform is 0 => output unchanged; the
          // existing 0.5 min-cap bounds the catch.
          float a = min(rim * (mix(0.05, 1.0, day) + uFlashLimb) * reveal, 0.5) + band * 0.25 * day;
```
Loop drive — old_string:
```js
    const tokyoFacing = Math.max(0, Math.sin(tokyoA0 - spin.rotation.y));
    updateTokyoHalo(f, focusedFacing, tokyoFacing);
```
new_string:
```js
    const tokyoFacing = Math.max(0, Math.sin(tokyoA0 - spin.rotation.y));
    uFlashLimb.value = flash * 0.25 * tokyoFacing;   // v3.3b C3: limb catch — rides the ONE flash envelope, 0 at rest
    updateTokyoHalo(f, focusedFacing, tokyoFacing);
```
(Tier ruling, recorded: the limb shell exists on LITE too (`segW = LITE ? 24 : 48`) and GLOBE_ELEV is the default path (`?globe=classic` is the query-flag rollback), so LITE's limb also catches the flash — event-gated only, rest-identical; spec §3.2 C3 sets no tier gate and the research matrix lists C3's LITE story as "works". The `?globe=classic` sprite path is untouched: `uFlashLimb` is simply never consumed there.)
- [ ] **Step 10: C4 glass glint — IIFE var, signature, glint line, call site (four edits).** Var — old_string:
```js
    const drops = [];
    let spawnIn = 1.4, skip = 0, fadeOut = 0;
```
new_string:
```js
    const drops = [];
    let spawnIn = 1.4, skip = 0, fadeOut = 0, glintFlash = 0;
```
Signature — old_string:
```js
    function update(dt) {
      if ((skip = 1 - skip)) return;                 // ~30fps is plenty for glass
```
new_string:
```js
    function update(dt, flash) {
      glintFlash = flash || 0;                       // v3.3b C4: the frame's lightning envelope — drives the specular dot ONLY, never body alpha
      if ((skip = 1 - skip)) return;                 // ~30fps is plenty for glass
```
Glint line — old_string:
```js
      ctx.fillStyle = 'rgba(235, 250, 255, ' + (0.2 * a).toFixed(3) + ')';   // v3.1f: highlight 0.55 -> 0.2 (whisper, not signal)
```
new_string:
```js
      /* v3.3b C4: the specular dot glints with lightning, hard-capped at 0.32
         (0.2 * 1.6 exactly). Toy Shop translucency law: the 0.22 body/lens sample
         cap above NEVER rises — drops go more transparent under lightning, never
         brighter-bodied. (v3.1f: highlight 0.55 -> 0.2, whisper not signal.) */
      ctx.fillStyle = 'rgba(235, 250, 255, ' + Math.min(0.32, 0.2 * a * (1 + glintFlash * 0.6)).toFixed(3) + ')';
```
Call site — old_string:
```js
    if (droplets) droplets.update(dt);   // after render: droplet lenses sample THIS frame's buffer
```
new_string:
```js
    if (droplets) droplets.update(dt, flash);   // after render: lenses sample THIS frame's buffer; flash drives the C4 glint
```
- [ ] **Step 11: C2 — retire the shared flat literal.** Old_string (the spec-guaranteed verbatim carry through Task 1; if Task 1's shipped line differs in comment only, re-anchor):
```js
    const beat = 0.85 + sceneState.haloPulse * 0.5 + sceneState.lockT * 0.45 + (flash || 0) * 1.3;
```
new_string:
```js
    /* v3.3b C2: the shared flat flash literal is RETIRED — the high tier answers
       lightning directionally through well 3 (uWells[2], strength flash * 0.9:
       near-strike drops over-brighten via the per-drop falloff, the far field
       barely reacts). LITE compiles no wells, so it keeps the flat coupling under
       its named const — without it phone rain would stop answering lightning. */
    const beat = 0.85 + sceneState.haloPulse * 0.5 + sceneState.lockT * 0.45 + (LITE ? (flash || 0) * LITE_FLASH_BEAT : 0);
```
- [ ] **Step 12: syntax gate + BEFORE-C5 capture.** `node --check js/background.js` → clean. Start the server if not running: `cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && python3 -m http.server 8765 &`. Chrome-devtools: `list_pages` → close every stale QA tab (ONE tab law); `new_page` → `http://127.0.0.1:8765/index.html?sceneDebug=1`; `resize_page` 1440×743; device-metrics emulation DPR 2 (captures must come out 2880×1486 — verify with `sips -g pixelWidth -g pixelHeight` on the first capture); wait 11 s post-boot; `evaluate_script`: `document.querySelector('.scene-debug').style.display = 'none'; window.__forceFlash(true, true, 0); 'held'` → wait 1 s → `evaluate_script`: `JSON.stringify({ uFlash: window.__sceneDebug().uFlash, wordT: window.__sceneDebug().wordT })` — expect `uFlash` ≈ 0.0707 (= 0.08 × 0.883; lockT/wordT are 0 after settle) — then `take_screenshot` → save `docs/superpowers/gates/v33/b-c5-before.png` (the OLD 3-stop gradient at the held peak, for the §3.2-acceptance-4 before/after pair).
- [ ] **Step 13: C5 — exponential flash gradient.** Old_string:
```js
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    grd.addColorStop(0, 'rgba(210,235,255,0.85)');
    grd.addColorStop(0.55, 'rgba(140,190,230,0.25)');
    grd.addColorStop(1, 'rgba(140,190,230,0)');
```
new_string:
```js
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    /* v3.3b C5 (rain brief Lever F pt 1): exponential falloff — 6 stops tracing
       0.85 * exp(-r / 0.28), a near-white core dissolving into blue-black,
       replacing the roughly-linear 3-stop ramp. Peak sprite opacity stays
       env * 0.24 in updateLightning below. */
    const grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    grd.addColorStop(0.00, 'rgba(235,245,255,0.85)');
    grd.addColorStop(0.15, 'rgba(205,230,250,0.50)');
    grd.addColorStop(0.30, 'rgba(170,210,240,0.29)');
    grd.addColorStop(0.50, 'rgba(140,190,230,0.14)');
    grd.addColorStop(0.70, 'rgba(120,170,215,0.07)');
    grd.addColorStop(1.00, 'rgba(110,150,200,0)');
```
- [ ] **Step 14: harness to GREEN + syntax.** `node --check js/background.js` → clean. `node tools/verify-site-hardening.js` → ALL PASS, exit 0, count = previous full-green + 1 (expected 44). Confirm the old literal is gone: `grep -c "(flash || 0) \* 1.3" js/background.js` → 0 (well 3's `* 0.9` remains — different literal, untouched).
- [ ] **Step 15: `wordT` single-consumer census (the §3.2-acceptance-3 in-code half).** `grep -n "wordT" js/background.js` → every hit must be one of: the sceneState init, the `else sceneState.wordT = 1;` arm, the `dt / 1.9` decay, the uFlash drive's `Math.max(sceneState.lockT, sceneState.wordT)`, the `__sceneDebug` probe, plus comments. ZERO hits inside `updateDepthRain`, `updateTokyoHalo`, any beat/well/halo/pulse expression — `wordT` drives nothing but the suppression gate (§1.2: arming any beat from it is a forbidden regression).
- [ ] **Step 16: version bumps + burn check.** Edit `js/boot.mjs` — old_string: `const V = { bg: '5.7', boot: '3.1', cursor: '3.1', fx: '3.7', app: '4.2' };` → new_string: `const V = { bg: '5.8', boot: '3.1', cursor: '3.1', fx: '3.7', app: '4.2' };` (values shown assume Task 1 shipped bg '5.7'/boot?v=24 per spec §7; re-anchor to actual branch HEAD values, bumping ONE step). Edit `index.html` — old_string: `<script type="module" src="js/boot.mjs?v=24"></script>` → new_string: `<script type="module" src="js/boot.mjs?v=25"></script>`. `node --check js/boot.mjs` → silent (touched JS, §6). Burn check: `git log -p main -- js/boot.mjs | grep "bg: '5.8'"` → empty, and `git log -p main -- index.html | grep "boot.mjs?v=25"` → empty (never served from main).
- [ ] **Step 17: live verify A — one-signal co-occurrence (§3.2 acceptance 3) + directionality (acceptance 4).** Fresh `navigate_page` → `http://127.0.0.1:8765/index.html?sceneDebug=1` (new `?v=` now live), 1440×743 @ DPR 2, 11 s settle, hide `.scene-debug` via `evaluate_script` as in Step 12.
  (a) **Co-occurrence:** `evaluate_script`: `window.__forceFlash(true, true, 0); window.__sceneFocus('about'); JSON.stringify({ t0: { wordT: __sceneDebug().wordT, uFlash: __sceneDebug().uFlash } })` — expect `wordT ≥ 0.95`, `uFlash ≤ 0.005` (suppressed while the word owns the frame). Wait 2.5 s → `evaluate_script`: `JSON.stringify({ t25: { wordT: __sceneDebug().wordT, uFlash: __sceneDebug().uFlash } })` — expect `wordT = 0`, `uFlash ≈ 0.0707` (the held envelope re-expresses after the word's 1.9 s window — "responds to a fresh flash again"). Save both JSON outputs verbatim to `docs/superpowers/gates/v33/b-onesignal.txt`. Companion (no smuggled channel): the Step-15 census is the structural proof; additionally read `__sceneDebug().halo`/`.rain` before and 1 s after a second `__sceneFocus('gallery')` — values evolve exactly as pre-M2 section changes do (story easing only; no step change beyond the story targets).
  (b) **Directionality:** `evaluate_script`: `window.__forceFlash(true, true, 14); 'x=+14'` → wait 1 s → `take_screenshot` → `b-direction-x14-on.png`. Then `window.__forceFlash(false)` → wait 1 s (env = 0) → `take_screenshot` → `b-direction-x14-off.png`. Repeat for `x = -14` → `b-direction-x-14-{on,off}.png`. Eye-read: near-strike rain flares hardest, far field barely reacts. Numeric fallback (spec-mandated if contested): the strike sprite is a camera child at camera-space (±14, 6, −30); with fov 62° and aspect 1440/743, NDC x = 14 / (30 · tan(31°) · 1.9381) ≈ 0.401 → CSS (1009, 248) → device-px centre (2018, 496); far-field mirror centre (862, 496). Crop 400×400-device-px patches: `sips -c 400 400 --cropOffset 296 1818 b-direction-x14-on.png --out b-dir-near-on.png` (and offset `296 662` for far; same for the off frame; use `magick in.png -crop 400x400+1818+296 out.png` if sips lacks `--cropOffset`), then `node tools/frame-luminance.mjs <patch>` on all four — REQUIRED: (near_on − near_off) mean Δ > (far_on − far_off) mean Δ. Record the four means beside the captures.
  (c) **AFTER-C5 capture:** `window.__forceFlash(true, true, 0)` → wait 1 s → `take_screenshot` → `b-c5-after.png` — pair with `b-c5-before.png`: near-white core, exponential dissolve, no hard mid-ring. `list_console_messages` → ZERO messages for the whole session.
- [ ] **Step 18: live verify B — during-flash p95 gate (§4.3, pinned phase, control arm same-session).** Same setup as Step 17 (sceneDebug URL is REQUIRED by the hook; the overlay is display:none'd before every capture so it contributes zero pixels — record this deviation-with-mitigation in the capture notes; rest-state medians in Step 19 stay on the plain URL per §4). For i = 1..5: fresh `navigate_page` (fresh boot) → 11 s settle → verify hero landing (`evaluate_script`: `scrollY` → 0) → hide overlay → `evaluate_script`: `window.__forceFlash(true, true, 0)` → wait 1 s → capture `b-flash-p95-on-<i>.png` → `evaluate_script`: `window.__forceFlash(true, false, 0)` (same held phase, lift zeroed — the control arm; confirm `__sceneDebug().uFlash === 0`) → capture `b-flash-p95-off-<i>.png`. Run `node tools/frame-luminance.mjs` on all 10; record per-arm medians of the 5 p95 values + the 5 pairwise (on−off) deltas + spreads. **Gates:** control-arm p95 median ≤ 110 ⇒ the with-lift arm MUST be ≤ 110 (task-fail otherwise: tune `LIGHTNING_GRADE_LIFT` DOWN, never the cap up, and re-run). Control-arm median > 110 ⇒ pre-existing flash luminance: route the control numbers to the gate pile (NOT a v33b task-fail) and gate the with-lift arm at ≤ control × 1.10. The interleaved pair doubles as the grade-lift isolation proof (only the lift moved between arms). Strike x = 0, viewport, DPR, and `?v=` recorded with the set.
- [ ] **Step 19: live verify C — rest-state invariance + LITE + reduced (§3.2 acceptance 1/5).** (a) PLAIN URL `http://127.0.0.1:8765/index.html`, 1440×743 @ DPR 2: for each of hero (scrollY 0) / projects / gallery (scroll landing verified via `evaluate_script`: `Math.abs(document.querySelector('#projects').getBoundingClientRect().top) < 2`, same for `#gallery`): 5 × fresh navigate → 11 s settle → capture → `frame-luminance` — per-section medians of mean/p50/p95/warm vs the Task-1 pre-campaign baseline set: p50 floors 8/7/9 HOLD (floor breach = task fail, §4.1); every delta within the documented per-frame spread is recorded as *below resolution*. All couplings multiply by `env` (= 0 at rest), so any real rest delta means a defect — find it before proceeding. (b) LITE: 390×844 mobile+touch emulation, fresh load, 30 s watch: rain runs, a natural flash (or `?sceneDebug=1` + `__forceFlash` in a throwaway tab, closed after) still beats the rain flat (LITE_FLASH_BEAT), glint dot visible on beads, LITE limb catch event-only (rest-identical — the Task-2 tier ruling), zero console. (c) Reduced-motion emulation, desktop: static frame renders clean (lightning/droplets are null; `flash` path never runs), zero console. (d) Byte ledger: `wc -c js/background.js tools/verify-site-hardening.js` — record deltas vs pre-task in `.superpowers/sdd/v33/byte-ledger.md`.
- [ ] **Step 20: commit.** `git add js/background.js js/boot.mjs index.html tools/verify-site-hardening.js` — commit EXACTLY:
```
feat(v33b): lightning is a scene parameter — grade lift (word/lock-suppressed), directional rain, limb catch, glint, exp falloff

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

#### Task-2 spec rulings (recorded)

1. **C3 ships on both tiers** — see "Assembly reconciliations & campaign-wide rulings" (spec §3.2 C3 sets no tier gate; acceptance 5 read as rest-state invariance + named flash-event exceptions).
2. **§4.3 captures on `?sceneDebug=1` with the overlay hidden** — deviation-with-mitigation, recorded per capture set (the `__forceFlash` hook only exists there; both arms share the hidden-overlay state; the pair is interleaved).
3. **Reduced-motion `wordT` arming is inert** — `__sceneFocus` fires under reduced but the loop never runs; `wordT` arms and never decays; `gradeUniforms` is null there and nothing reads it.

---

### Task 3 (v33c): Droplet-glass v2 — bead merge + trail beads, both tiers (M3, bokeh CUT)

Spec anchors (BINDING): §3.3, §4.1, §6, §7, §8 item 3, correction of record #2.

**Files:** Modify: `js/background.js` (droplets IIFE only, :646–753 pre-v33a numbering: consts beside `cap`/`REFRACT` :651–652, `spawn()` :664–671, sit→run transition :736, run branch :741–748, merge block inside `update()` after the decay fill :726–729, sceneDebug hooks before `return { update };` :752), `js/boot.mjs` (`bg: '5.8'` → `'5.9'`), `index.html` (`boot.mjs?v=25` → `?v=26`). Test: `tools/verify-site-hardening.js` (append ONE check above the `const failed =` anchor).

**Interfaces:**
- **Consumes (from Task 2, same IIFE — MUST survive untouched):** the two-arg `update(dt, flash)` signature + `glintFlash` assignment; the C4 glint line with its 0.32 cap; the 0.22 body cap; `const cap = LITE ? 12 : 24;` / `const REFRACT = !LITE;`; the harness at Task 2's full-green count (44); version state `V.bg '5.8'` / `boot.mjs?v=25`. From the spec: M3 ships LITE-INCLUSIVE on the shared IIFE — after Task 6 this becomes LITE's glass, and if the owner kills M10 at its gate, desktop reverts to exactly this M3-elevated canvas (the pre-built fallback). Bokeh is the CUT of record (correction #2): non-LITE-only, home scheduled for retirement by Task 6 — building it to delete it violates subtract-to-add; revivable only if M10 dies.
- **Produces:** `MERGE_R_MAX = 7.5` + `MERGE_TOUCH_K = 0.85` consts; the dead-flag O(n²) merge block (area-conserving `Math.min(MERGE_R_MAX, Math.sqrt(keep.r * keep.r + gone.r * gone.r))`); bead-object fields `trail`/`trailAt`/`dead` (stable hidden class — Task 6's LITE-scoped IIFE inherits them); the cap-gated trail spawn (`d.trail > 0 && d.y > d.trailAt && drops.length < cap`); sceneDebug-gated QA hooks `window.__spawnMergePair()` (two adjacent growing beads at frame centre — deterministic merge in ~1.5–2 s) and `window.__spawnRunner()` (one bead 0.3 s below its run threshold — deterministic trail beads through the REAL sit→run transition); harness check `v3.3c — droplet glass merges and trails, cap unchanged` (count → 45); archived gates `m3-merge-{1,2,3}.png`, `m3-trail-{1,2,3}.png`, `m3-merge-lite-{1,2,3}.png`, `m3-trail-lite-{1,2,3}.png`.

- [ ] **Step 1: preflight.** `node tools/verify-site-hardening.js` → full green (44 expected); `grep -n "MERGE_R_MAX\|__spawnMergePair\|__spawnRunner" js/background.js` → 0 hits; `grep -n "const cap = LITE ? 12 : 24;" js/background.js` → 1 hit; confirm Task 2's `update(dt, flash)` + `glintFlash` present (both untouched by this task).
- [ ] **Step 2: harness pin RED-FIRST.** Insert above the `const failed = checks.filter(item => !item.pass);` anchor (below the v3.3b check):
```js
// v3.3c — droplet-glass v2 (spec §3.3/§6): the O(n^2) bead merge is area-
// conserving and clamped at the pre-merge radius envelope (MERGE_R_MAX = the
// runAt ceiling 5 + 2.5) so peak glass coverage cannot rise; running drops shed
// 1-3 trail beads gated on the SAME cap; the 24/12 bead cap is UNCHANGED.
// Emitter bokeh is the recorded CUT (correction of record #2) — do not add it.
check('v3.3c — droplet glass merges and trails, cap unchanged',
  /const cap = LITE \? 12 : 24;/.test(background) &&
    /const MERGE_R_MAX = 7\.5/.test(background) &&
    /Math\.min\(MERGE_R_MAX, Math\.sqrt\(keep\.r \* keep\.r \+ gone\.r \* gone\.r\)\)/.test(background) &&
    /d\.trail > 0 && d\.y > d\.trailAt && drops\.length < cap/.test(background),
  'area-conserving MERGE_R_MAX-clamped merge pair-check + cap-gated trail spawn present; cap = LITE ? 12 : 24 unchanged');
```
Run `node tools/verify-site-hardening.js` → EXACTLY one FAIL (`v3.3c — droplet glass merges and trails, cap unchanged`), all prior PASS, exit 1.
- [ ] **Step 3: consts + spawn-field extension (two edits).** Consts — old_string:
```js
    const cap = LITE ? 12 : 24;
    const REFRACT = !LITE;
```
new_string:
```js
    const cap = LITE ? 12 : 24;
    const REFRACT = !LITE;
    const MERGE_R_MAX = 7.5;      // v3.3c: today's max bead radius (the runAt ceiling 5 + 2.5) — a merged survivor never exceeds the pre-merge spawn envelope
    const MERGE_TOUCH_K = 0.85;   // v3.3c: beads absorb when centre distance < 0.85 * summed radii (deep overlap, not a graze)
```
Spawn fields — old_string:
```js
      drops.push({
        x: 20 + Math.random() * (W - 40), y: 10 + Math.random() * H * 0.75,
        r: 1.4 + Math.random() * 2.2, grow: 0.12 + Math.random() * 0.5,
        runAt: 5 + Math.random() * 2.5, vy: 0, wob: Math.random() * 6.28,
        state: 'sit', age: 0, alpha: 0,
      });
```
new_string:
```js
      drops.push({
        x: 20 + Math.random() * (W - 40), y: 10 + Math.random() * H * 0.75,
        r: 1.4 + Math.random() * 2.2, grow: 0.12 + Math.random() * 0.5,
        runAt: 5 + Math.random() * 2.5, vy: 0, wob: Math.random() * 6.28,
        state: 'sit', age: 0, alpha: 0,
        trail: 0, trailAt: 0, dead: false,   // v3.3c: run-trail budget + merge flag (stable hidden class)
      });
```
- [ ] **Step 4: the merge block (one edit).** Old_string:
```js
      fadeOut = 40;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';         // prior frame decays → running wakes
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      for (let i = drops.length - 1; i >= 0; i--) {
```
new_string:
```js
      fadeOut = 40;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';         // prior frame decays → running wakes
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      /* v3.3c merge — O(n^2) pair check (n <= 24 => <= 276 pairs at this 30fps
         half-rate; works unchanged at n = 12 LITE). Overlapping beads absorb
         area-conserving (r^2 sum, clamped at MERGE_R_MAX = today's max radius) so
         total glass coverage can only FALL from a merge; the survivor pulls
         toward the absorbed bead, jitters, and briefly accelerates — the single
         most "liquid" read at this scale (Bebber/raindrop-fx playbook, R2). */
      if (drops.length > 1) {
        for (let i = 0; i < drops.length; i++) {
          const da = drops[i];
          if (da.dead) continue;
          for (let j = i + 1; j < drops.length; j++) {
            const db = drops[j];
            if (db.dead) continue;
            const dx = da.x - db.x, dy = da.y - db.y, rr = (da.r + db.r) * MERGE_TOUCH_K;
            if (dx * dx + dy * dy > rr * rr) continue;
            const keep = da.r >= db.r ? da : db, gone = keep === da ? db : da;
            keep.r = Math.min(MERGE_R_MAX, Math.sqrt(keep.r * keep.r + gone.r * gone.r));
            keep.x += (gone.x - keep.x) * 0.3;         // meniscus pull toward the absorbed bead
            keep.y += (gone.y - keep.y) * 0.3;
            keep.wob += (Math.random() - 0.5) * 2.4;   // survivor jitters...
            keep.vy = Math.min(120, keep.vy + 26);     // ...and briefly accelerates (run-speed ceiling held)
            keep.alpha = Math.max(keep.alpha, gone.alpha);
            gone.dead = true;
            if (gone === da) break;                    // da absorbed — stop pairing it
          }
        }
        for (let i = drops.length - 1; i >= 0; i--) if (drops[i].dead) drops.splice(i, 1);
      }
      for (let i = drops.length - 1; i >= 0; i--) {
```
- [ ] **Step 5: trail beads — run-transition init + run-branch spawn (two edits).** Transition — old_string:
```js
        if (d.state === 'sit') {
          d.r += d.grow * dt;
          if (d.r >= d.runAt) d.state = 'run';
          else if (d.age > 12) {
```
new_string:
```js
        if (d.state === 'sit') {
          d.r += d.grow * dt;
          if (d.r >= d.runAt) {
            d.state = 'run';
            d.trail = 1 + (Math.random() * 3 | 0);       // v3.3c: this run sheds 1-3 trail beads
            d.trailAt = d.y + 10 + Math.random() * 18;   // first bead lands 10-28px into the run
          }
          else if (d.age > 12) {
```
Run-branch spawn — old_string:
```js
        } else {
          d.vy = Math.min(d.vy + dt * 80, 120);
          d.wob += dt * 4.5;
          d.y += d.vy * dt;
          d.x += Math.sin(d.wob) * 0.22;
          d.r -= dt * 1.1;
          if (d.r <= 1.6 || d.y > H + 12) { drops.splice(i, 1); continue; }
        }
```
new_string:
```js
        } else {
          d.vy = Math.min(d.vy + dt * 80, 120);
          d.wob += dt * 4.5;
          d.y += d.vy * dt;
          d.x += Math.sin(d.wob) * 0.22;
          d.r -= dt * 1.1;
          /* v3.3c trail beads — the run sheds tiny STATIC beads along its wobble
             path (the hang-and-burst rivulet rhythm). Strictly smaller than the
             parent (parent-relative and clamped to [1.25, 2.2]), counted against
             the SAME cap, and retired by the existing machinery: age > 12 puts
             them straight into the sit-evaporation branch, and the
             destination-out decay above fades what they leave. Pushed at the
             array tail — this downward loop never revisits them this frame. */
          if (d.trail > 0 && d.y > d.trailAt && drops.length < cap) {
            d.trail--;
            d.trailAt = d.y + 14 + Math.random() * 22;
            drops.push({
              x: d.x - Math.sin(d.wob) * 1.5, y: d.y - d.r * 1.4,
              r: Math.min(2.2, Math.max(1.25, d.r * (0.2 + Math.random() * 0.15))),
              grow: 0, runAt: 99, vy: 0, wob: Math.random() * 6.28,
              state: 'sit', age: 12.5, alpha: 0.6,
              trail: 0, trailAt: 0, dead: false,
            });
          }
          if (d.r <= 1.6 || d.y > H + 12) { drops.splice(i, 1); continue; }
        }
```
- [ ] **Step 6: sceneDebug QA hooks (one edit).** Old_string:
```js
    return { update };
  })();
```
new_string:
```js
    /* v3.3c QA hooks — sceneDebug-gated (the __forceFlash/__scanPlace precedent;
       inert on the plain URL). __spawnMergePair(): two adjacent growing beads at
       frame centre — contact at (r1+r2)*0.85 >= 6.2 in ~1.5-2s, a deterministic
       merge for the archived 3-frame sequence. __spawnRunner(): one bead 0.3s
       below its run threshold — enters 'run' through the REAL transition (so the
       trail budget arms) and sheds trail beads on its way down. Both evict before
       pushing, so the cap is never exceeded. */
    if (sceneDebug) {
      window.__spawnMergePair = () => {
        while (drops.length > cap - 2) drops.shift();
        const x = W * 0.5, y = H * 0.4;
        drops.push({ x: x - 3.1, y, r: 3.4, grow: 0.2, runAt: 99, vy: 0, wob: 0,   state: 'sit', age: 0, alpha: 1, trail: 0, trailAt: 0, dead: false });
        drops.push({ x: x + 3.1, y, r: 3.2, grow: 0.2, runAt: 99, vy: 0, wob: 3.1, state: 'sit', age: 0, alpha: 1, trail: 0, trailAt: 0, dead: false });
      };
      window.__spawnRunner = () => {
        if (drops.length >= cap) drops.shift();
        drops.push({ x: W * 0.5, y: H * 0.25, r: 5.2, grow: 0.3, runAt: 5.3, vy: 0, wob: 1, state: 'sit', age: 0, alpha: 1, trail: 0, trailAt: 0, dead: false });
      };
    }
    return { update };
  })();
```
- [ ] **Step 7: syntax + harness GREEN + cap census.** `node --check js/background.js` → clean. `node tools/verify-site-hardening.js` → ALL PASS, exit 0, count = previous + 1 (expected 45). Cap assertion census: `grep -n "drops.push" js/background.js` → exactly 4 sites, each guarded: `spawn()` (`drops.length < cap` at its call), the trail spawn (`&& drops.length < cap` inline), and the two hooks (evict-before-push). No path can exceed `cap`.
- [ ] **Step 8: version bumps + burn check.** `js/boot.mjs` — old_string: `const V = { bg: '5.8', boot: '3.1', cursor: '3.1', fx: '3.7', app: '4.2' };` → new_string: `const V = { bg: '5.9', boot: '3.1', cursor: '3.1', fx: '3.7', app: '4.2' };`. `index.html` — old_string: `<script type="module" src="js/boot.mjs?v=25"></script>` → new_string: `<script type="module" src="js/boot.mjs?v=26"></script>`. `node --check js/boot.mjs` → silent. Burn check: `git log -p main -- js/boot.mjs | grep "bg: '5.9'"` → empty; `git log -p main -- index.html | grep "boot.mjs?v=26"` → empty.
- [ ] **Step 9: live verify — desktop merge + trail sequences (§3.3 acceptance).** Server up; ONE tab; `navigate_page` → `http://127.0.0.1:8765/index.html?sceneDebug=1`; 1440×743 @ DPR 2; 11 s settle; `evaluate_script`: `document.querySelector('.scene-debug').style.display = 'none'; window.__spawnMergePair(); 'seeded'`. Capture 3 frames: immediately → `m3-merge-1.png` (two beads), +1.5 s → `m3-merge-2.png` (contact/absorb), +2.5 s → `m3-merge-3.png` (one survivor, visibly larger, wobbled off-centre). Then `evaluate_script`: `window.__spawnRunner(); 'running'` → captures at +1 s / +2 s / +3 s → `m3-trail-{1,2,3}.png` — a wobbling run with 1–3 tiny static beads strung above it, each strictly smaller than the runner, fading via the canvas decay. `list_console_messages` → ZERO.
- [ ] **Step 10: live verify — LITE 390×844 (§3.3: works at n = 12).** Fresh `navigate_page` → same `?sceneDebug=1` URL at 390×844 mobile+touch emulation (LITE via `small`); repeat Step 9's two hook sequences → `m3-merge-lite-{1,2,3}.png`, `m3-trail-lite-{1,2,3}.png` (12-bead cap: the hooks' eviction keeps room). Zero console. Reduced-motion sanity (30 s, desktop): droplets IIFE is null under reduced — untouched path, static frame clean, zero console.
- [ ] **Step 11: rest medians (§4.1 — ≈ 0 by construction, verified anyway).** PLAIN URL, 1440×743 @ DPR 2: 5 × fresh navigate → hero, 11 s settle each → capture → `node tools/frame-luminance.mjs` — hero median of mean/p50/p95/warm vs the Task-1 pre-campaign baseline: p50 ≥ 8 holds; deltas within the hero per-frame spread (σ ≈ 0.4–1.2) are recorded *below resolution* (merging reduces live bead count; trail beads are smaller than their parents — any real rise is a defect). Byte ledger: `wc -c js/background.js tools/verify-site-hardening.js` deltas → `.superpowers/sdd/v33/byte-ledger.md`.
- [ ] **Step 12: commit.** `git add js/background.js js/boot.mjs index.html tools/verify-site-hardening.js` — commit EXACTLY:
```
feat(v33c): droplet glass v2 — bead merge + trail beads (both tiers; bokeh cut, recorded)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

---

### Task 4 (v33d): Hero choreography on WAAPI — ladders + settle net retired (M5)

Spec anchors (BINDING): §3.4, §1.5, §4.5, §6, §7, §8 item 4, correction of record #3. Not luminance-gated (§4.5): no emissive change, no §4.1/§4.2 captures. All anchors verified against `b3d4067` — Tasks 1–3 never touch `js/app.js`.

**Files:** Modify: `js/app.js` (settle net :22–43, `runDecrypt` :45–53, `runStagger` :55–72, `runChromatic` :74–86, `runHero` :100–110 — the deck seg wiring :459–467, `typeSub` :88–98, the glitch interval :487–493, and the boot fallbacks :478–483 are all UNTOUCHED), `js/boot.mjs` (:17 `V.app`), `index.html` (:438 `boot.mjs?v=`). Test: `tools/verify-site-hardening.js` (insert one check above the `const failed = checks.filter(item => !item.pass);` anchor).

**Interfaces:** Consumes: `window.scramble` + its two nets (`effects.js:25–51` — token guard `__scrToken` :29/:36, wall-clock cap `dur + 400` :49; they serve the lang swap `app.js:121–125` and the coord decrypt `effects.js:101–104` and MUST survive — pinned POSITIVE here); CSS custom eases `--ease-out`/`--ease-io` values (`site.css:43–44`); deck hero-seg buttons (`app.js:459–467`, re-run trigger for QA); CURRENT `boot.mjs?v=` left by Task 3 (expected 26). Produces: `HERO_BEATS` const object, `anims[]` tracked-Animation array, `seq(delayMs, fn)` marker-Animation sequencer, `EASE_OUT_CB`/`EASE_IO_CB` consts, the `anims.forEach(a => a.cancel())` cancel-before-start shape, harness check `v3.3d — hero choreography is WAAPI with structural interruption safety` (count → 46), `V.app = '4.3'`, gates artifacts `d-beats-pre.json`/`d-beats-post.json`/`d-endstate.txt`/`d-torture.txt`/`bytes-v33d.txt` under `docs/superpowers/gates/v33/`.

The hero entrance is `setTimeout` ladders (`app.js:48`, `:84`, `:106`) plus a wall-clock settle sweep (`heroSettleTimer`/`settleHero`, `:25–43`, `:108–109`) that exists only because bespoke timing has no cancel/finish/fill semantics (research doc §4a-1). M5 rebuilds the sequencing on `Element.animate()` — zero bytes of dependency (the settled framework verdict, spec header) — and deletes the net: interruption safety becomes structural (`runHero()` cancels every tracked `Animation` before starting; end states are owned by fill modes, never by inline styles). **Scope fence (binding, spec §3.4 + correction of record #3):** `window.scramble` and its two nets do NOT migrate (rAF-driven `textContent` has no WAAPI equivalent; they serve surfaces M5 does not touch); `typeSub`'s 26 ms typewriter does NOT migrate; the glitch interval, boot.js, cursor.js untouched; **no scene channel is ever driven from DOM choreography.**

Four parity rulings, resolved here and recorded (the executor follows these; each cross-checked against the spec at assembly):
1. **Old stagger runs opacity .55s / transform .8s in one transition pair** (`:64`); spec §3.4 says "one span.animate() per char … same curves". One Animation CAN carry both curves via property-specific keyframes: opacity's final keyframe at offset `550/800 = 0.6875`, both segments easing `--ease-out`. Exact, not approximate.
2. **"the `fire` class rides `animation.finished`"** (spec §3.4) — riding the WIPE's finished would move the fire beat from `li*200+560` to `li*180+850` (~290 ms late), violating acceptance-1 beat parity. Ruling: fire rides the finished promise of a dedicated zero-duration MARKER Animation at the original offset — it "rides `animation.finished`", just not the wipe's.
3. **The retired double-rAF kicks** (`:69–71`, `:83`) made old stagger/chromatic start ~2 frames late by construction. Deleting them (spec §1.1 retirement list) makes the new entrance start ≤2 frames EARLIER — irreconcilable with absolute ±1-frame totals. Ruling: acceptance-1 parity is judged on **beat SPACING** (line-to-line stagger, wipe duration, fire on/off offsets, sub beat) at ±1 frame; the uniform ≤2-frame earlier start is the retired kick's documented effect, recorded in `d-beats` and carried to the gate pile notes.
4. **Chromatic end state:** old `settleHero` cleared the inline `clipPath` at 2800 ms (computed `clip-path` returns to `none`). The wipe therefore uses `fill: 'backwards'` — clip applies during delay+run exactly as the old inline transition did, and on finish it ceases to apply → computed `none`, matching the old post-settle state. (The clip-release instant moves from 2800 ms to wipe-end ~1030 ms; visually inert for this title — caps-only text inside the `line-height: 0.82` box — recorded.)

- [ ] **Step 1: Harness pin FIRST (RED).** Insert above the `const failed = checks.filter(item => !item.pass);` anchor in `tools/verify-site-hardening.js` (below the v3.3c check):
```js
// v3.3d — M5: hero choreography is Element.animate() with a tracked cancel-before-
// start set; the setTimeout ladders and the wall-clock settle sweep are retired.
// The scramble engine's two nets are pinned POSITIVE — they serve the lang swap
// and the one-shot coord decrypt, surfaces M5 does not touch (correction #3).
check('v3.3d — hero choreography is WAAPI with structural interruption safety',
  /\.animate\(/.test(app) &&
    /anims\.forEach\(a => a\.cancel\(\)\)/.test(app) &&
    /const HERO_BEATS = \{/.test(app) &&
    !/heroSettleTimer/.test(app) &&
    !/settleHero/.test(app) &&
    !/setTimeout\(typeSub, 700\)/.test(app) &&
    /__scrToken/.test(effects) &&
    /dur \+ 400/.test(effects),
  'hero entrance is WAAPI (tracked anims[], cancel-before-start, fill-owned end states); ladders + settle timer gone; scramble token guard + wall-clock net survive in effects.js');
```
Run `node tools/verify-site-hardening.js` → the new check **FAILs** (`.animate(` absent, `settleHero` present), every prior check PASSes (45 expected).
- [ ] **Step 2: record the pre-change byte count.** `wc -c js/app.js` → note the number (used in Step 12's ledger).
- [ ] **Step 3: the sequencer replaces the settle net.** Edit `js/app.js` old_string:
```js
  /* SAFETY NET — force every hero line to its final, visible text. Called on a
     timer after each entrance so a throttled/interrupted rAF (offscreen tab,
     slow paint) can never leave the giant title blank. */
  let heroSettleTimer = null;
  function settleHero() {
    titleLines.forEach(line => {
      line.classList.remove('glitch', 'fire', 'scramble-on');
      line.style.clipPath = '';
      const chs = line.querySelectorAll('.ch');
      if (chs.length) {
        let txt = '';
        chs.forEach(s => { s.style.opacity = '1'; s.style.transform = 'none'; txt += s.textContent; });
        if (txt !== line.dataset.line) line.textContent = line.dataset.line;
      } else if (line.textContent !== line.dataset.line) {
        line.textContent = line.dataset.line;
      }
    });
    if (sub && sub.dataset.text && sub.textContent !== sub.dataset.text) {
      sub.textContent = sub.dataset.text;
      if (caret) caret.style.opacity = '0.4';
    }
  }
```
new_string:
```js
  /* v3.3d — WAAPI sequencer (M5). Every entrance beat is a tracked Animation on
     the document timeline: runHero() cancels the whole set before re-running, so
     interruption safety is STRUCTURAL (real cancel/finish/fill lifecycle) and the
     old wall-clock settle sweep is retired. End states are owned by fill modes,
     never by inline styles. Beats are the pre-M5 constants, named in one place. */
  const EASE_OUT_CB = 'cubic-bezier(0.16, 1, 0.3, 1)';  // = --ease-out (site.css:43)
  const EASE_IO_CB = 'cubic-bezier(0.65, 0, 0.35, 1)';  // = --ease-io  (site.css:44)
  const HERO_BEATS = {
    decryptLineMs: 230,                    // was setTimeout(li * 230)
    staggerLineMs: 280, staggerChMs: 45,   // was transitionDelay li*0.28s + ci*0.045s
    chromaticWipeMs: 180,                  // was transitionDelay li*0.18s
    chromaticFireStepMs: 200, chromaticFireBaseMs: 560, chromaticFireHoldMs: 1100,
    subMs: 700                             // was the 700ms sub setTimeout
  };
  let anims = [];
  /* seq(): a zero-duration marker Animation whose finished promise fires a beat.
     Cancellable like any Animation; cancel() REJECTS finished, so the rejection
     handler swallows it by design — torture runs must stay console-clean. */
  function seq(delayMs, fn) {
    const a = document.body.animate([], { delay: delayMs, duration: 0 });
    a.finished.then(fn, () => {});
    anims.push(a);
    return a;
  }
```
- [ ] **Step 4: `runDecrypt` on markers.** Edit `js/app.js` old_string:
```js
  function runDecrypt() {
    titleLines.forEach((line, li) => {
      clearLineStyles(line); line.textContent = '';
      setTimeout(() => {
        line.classList.add('scramble-on');
        window.scramble(line, line.dataset.line, { duration: 950 }).then(() => line.classList.remove('scramble-on'));
      }, li * 230);
    });
  }
```
new_string:
```js
  function runDecrypt() {
    titleLines.forEach((line, li) => {
      clearLineStyles(line); line.textContent = '';
      seq(li * HERO_BEATS.decryptLineMs, () => {
        line.classList.add('scramble-on');
        window.scramble(line, line.dataset.line, { duration: 950 }).then(() => line.classList.remove('scramble-on'));
      });
    });
  }
```
(The scramble engine itself — including its blank-title safety, the `dur + 400` wall-clock cap — is consumed unchanged.)
- [ ] **Step 5: `runStagger` — one Animation per char, both old curves.** Edit `js/app.js` old_string:
```js
  function runStagger() {
    titleLines.forEach((line, li) => {
      clearLineStyles(line); line.innerHTML = '';
      [...line.dataset.line].forEach((c, ci) => {
        const s = document.createElement('span');
        s.className = 'ch'; s.textContent = c;
        s.style.opacity = '0';
        s.style.transform = 'translateY(0.6em) rotateX(-55deg)';
        s.style.transformOrigin = 'bottom';
        s.style.transition = 'opacity .55s var(--ease-out), transform .8s var(--ease-out)';
        s.style.transitionDelay = (li * 0.28 + ci * 0.045) + 's';
        line.appendChild(s);
      });
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$('.hero h1 .ch').forEach(s => { s.style.opacity = '1'; s.style.transform = 'none'; });
    }));
  }
```
new_string:
```js
  function runStagger() {
    titleLines.forEach((line, li) => {
      clearLineStyles(line); line.innerHTML = '';
      [...line.dataset.line].forEach((c, ci) => {
        const s = document.createElement('span');
        s.className = 'ch'; s.textContent = c;
        line.appendChild(s);
        /* ONE Animation per char carrying BOTH pre-M5 curves via property-
           specific keyframes: opacity finishes at offset 550/800 = 0.6875
           (= the old .55s track inside the .8s transform track), both easing
           --ease-out. fill:'both' hides the char through its delay and owns
           the end state — zero inline styles, no double-rAF kick. */
        anims.push(s.animate([
          { offset: 0, easing: EASE_OUT_CB, opacity: 0,
            transform: 'translateY(0.6em) rotateX(-55deg)', transformOrigin: 'bottom' },
          { offset: 0.6875, opacity: 1 },
          { offset: 1, transform: 'none', transformOrigin: 'bottom' }
        ], { duration: 800, delay: li * HERO_BEATS.staggerLineMs + ci * HERO_BEATS.staggerChMs, fill: 'both' }));
      });
    });
  }
```
- [ ] **Step 6: `runChromatic` — wipe on `line.animate()`, fire on markers.** Edit `js/app.js` old_string:
```js
  function runChromatic() {
    titleLines.forEach((line, li) => {
      clearLineStyles(line);
      line.textContent = line.dataset.line;
      line.setAttribute('data-text', line.dataset.line);
      line.classList.add('glitch');
      line.style.clipPath = 'inset(0 100% 0 0)';
      line.style.transition = 'clip-path .85s var(--ease-io)';
      line.style.transitionDelay = (li * 0.18) + 's';
      requestAnimationFrame(() => requestAnimationFrame(() => { line.style.clipPath = 'inset(0 0 0 0)'; }));
      setTimeout(() => { line.classList.add('fire'); setTimeout(() => line.classList.remove('fire'), 1100); }, li * 200 + 560);
    });
  }
```
new_string:
```js
  function runChromatic() {
    titleLines.forEach((line, li) => {
      clearLineStyles(line);
      line.textContent = line.dataset.line;
      line.setAttribute('data-text', line.dataset.line);
      line.classList.add('glitch');
      /* Wipe fills BACKWARDS only: while it runs the line clips exactly as the
         pre-M5 inline transition did; on finish the clip ceases to apply, so
         computed clip-path returns to 'none' — the state the retired settle
         sweep used to restore by hand. */
      anims.push(line.animate(
        [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
        { duration: 850, delay: li * HERO_BEATS.chromaticWipeMs, easing: EASE_IO_CB, fill: 'backwards' }
      ));
      /* fire beat rides marker Animations at the pre-M5 offsets (li*200+560 on,
         +1100 off) — same wall-clock beats, now cancellable. */
      seq(li * HERO_BEATS.chromaticFireStepMs + HERO_BEATS.chromaticFireBaseMs, () => {
        line.classList.add('fire');
        seq(HERO_BEATS.chromaticFireHoldMs, () => line.classList.remove('fire'));
      });
    });
  }
```
- [ ] **Step 7: `runHero` — cancel-before-start, sub beat sequenced, net deleted.** Edit `js/app.js` old_string:
```js
  function runHero() {
    if (!hero) return;
    if (reduced) { titleLines.forEach(l => { clearLineStyles(l); l.textContent = l.dataset.line; }); typeSub(); return; }
    if (heroVariant === 'stagger') runStagger();
    else if (heroVariant === 'chromatic') runChromatic();
    else runDecrypt();
    setTimeout(typeSub, 700);
    // guaranteed settle — covers the longest variant (~1.7s) with margin
    clearTimeout(heroSettleTimer);
    heroSettleTimer = setTimeout(settleHero, 2800);
  }
```
new_string:
```js
  function runHero() {
    if (!hero) return;
    if (reduced) { titleLines.forEach(l => { clearLineStyles(l); l.textContent = l.dataset.line; }); typeSub(); return; }
    /* structural interruption safety: kill the previous entrance's whole
       Animation set before starting — no timer bookkeeping, no stale beats. */
    anims.forEach(a => a.cancel());
    anims = [];
    if (heroVariant === 'stagger') runStagger();
    else if (heroVariant === 'chromatic') runChromatic();
    else runDecrypt();
    seq(HERO_BEATS.subMs, typeSub);   // the 700ms sub beat, on the same timeline
  }
```
(The reduced short-circuit is byte-identical — spec acceptance 5. Under reduced, no `Animation` is ever created: `anims` stays empty and `seq` is never reached.)
- [ ] **Step 8: syntax + harness GREEN.** `node --check js/app.js` → silent exit 0. `grep -n "heroSettleTimer\|settleHero\|setTimeout(typeSub" js/app.js` → **no matches**. `node tools/verify-site-hardening.js` → exit 0, ALL GREEN, count = previous + 1 (46 expected; every pre-existing check untouched).
- [ ] **Step 9: version bumps (§7 burn rule).** `js/boot.mjs`: Edit old_string `app: '4.2'` → new_string `app: '4.3'` (app.js was untouched by Tasks 1–3, so '4.2' is still CURRENT; if drift occurred, bump CURRENT +0.1 instead). `index.html:438`: increment the CURRENT `boot.mjs?v=` by 1 (expected `26` → `27` after Tasks 1–3; read the live value with `grep -n "boot.mjs?v=" index.html` first). `node --check js/boot.mjs` → silent. Burn-rule guard: `git log main --oneline -S "app: '4.3'" -- js/boot.mjs` and `git log main --oneline -S "boot.mjs?v=27" -- index.html` → both EMPTY (the value never shipped from main).
- [ ] **Step 10: live verify A — beat parity + end-state equality, same-session pre/post (v32n stash method).** Serve if not already: `python3 -m http.server 8765` from repo root (background). ONE QA tab, stale tabs closed. Open `http://127.0.0.1:8765/index.html` at 1440×743 (`resize_page`), hard-reload with cache disabled, wait for boot (`evaluate_script`: `!document.body.hasAttribute('data-booting')` → `true`), then `localStorage.removeItem('daikie-hero')`.
  For each variant `V` in `decrypt`, `stagger`, `chromatic` — run the **arm snippet** (`evaluate_script`), replacing the first line's variant name per round:
```js
(() => {
  const V = 'decrypt';   // <- decrypt | stagger | chromatic per round
  window.__beats = {}; window.__t0 = performance.now();
  const lines = [...document.querySelectorAll('.hero h1 .line')];
  lines.forEach((l, i) => {
    new MutationObserver(() => {
      const on = l.classList.contains('fire');
      if (on && window.__beats['fireOn' + i] === undefined) window.__beats['fireOn' + i] = Math.round(performance.now() - window.__t0);
      if (!on && window.__beats['fireOn' + i] !== undefined && window.__beats['fireOff' + i] === undefined) window.__beats['fireOff' + i] = Math.round(performance.now() - window.__t0);
    }).observe(l, { attributes: true, attributeFilter: ['class'] });
  });
  (function poll() {
    const t = Math.round(performance.now() - window.__t0);
    lines.forEach((l, i) => {
      if (window.__beats['line' + i] !== undefined) return;
      const chs = l.querySelectorAll('.ch');
      const last = chs.length ? chs[chs.length - 1] : null;
      const cp = getComputedStyle(l).clipPath;
      const done = last
        ? (getComputedStyle(last).opacity === '1' && getComputedStyle(last).transform === 'none' && l.textContent === l.dataset.line)
        : (l.textContent === l.dataset.line && (cp === 'none' || cp === 'inset(0px)'));
      if (done) window.__beats['line' + i] = t;
    });
    const sub = document.querySelector('.hero-sub-text');
    if (window.__beats.sub === undefined && sub && sub.dataset.text && sub.textContent === sub.dataset.text)
      window.__beats.sub = t;
    if (t < 8000) requestAnimationFrame(poll);
  })();
  const deck = document.querySelector('.deck');
  if (!deck.classList.contains('open')) document.querySelector('.deck-toggle').click();
  document.querySelector('.seg[data-seg="hero"] button[data-val="' + V + '"]').click();
  return 'armed:' + V;
})()
```
  wait 9 s (`sleep 9`), then run the **read snippet**:
```js
(() => {
  const lines = [...document.querySelectorAll('.hero h1 .line')];
  const state = lines.map(l => ({
    text: l.textContent === l.dataset.line,
    cssText: l.style.cssText,
    opacity: getComputedStyle(l).opacity,
    transform: getComputedStyle(l).transform,
    clip: getComputedStyle(l).clipPath
  }));
  const chs = [...document.querySelectorAll('.hero h1 .ch')];
  const chOk = chs.every(s => getComputedStyle(s).opacity === '1' && getComputedStyle(s).transform === 'none');
  return JSON.stringify({ beats: window.__beats, state, chOk });
})()
```
  Save the three POST-build JSONs to `docs/superpowers/gates/v33/d-beats-post.json` (git-ignored dir; write via Bash heredoc). Then `git stash` (all v33d changes revert on disk), hard-reload the same tab (PRE build now served), repeat the three rounds → `docs/superpowers/gates/v33/d-beats-pre.json`, then `git stash pop`.
  **PASS criteria:** (a) end-state maps identical pre vs post for every variant — every line `text:true`, `cssText:''`, `opacity:'1'`, `transform:'none'`, `clip:'none'` post-settle, `chOk:true` on stagger; (b) beat SPACINGS: for every key present in both JSONs, `|post[key] − pre[key]|` compared on the DIFFERENCES between keys, within ±17 ms (1 frame). Expected values (formula → number, title lines "Ishinuki" = 8 ch, "Daikie" = 6 ch): decrypt `line0 ≈ 950`, `line1−line0 ≈ 230`; stagger `line0 ≈ 7·45+800 = 1115`, `line1 ≈ 280+5·45+800 = 1305`, spacing `≈ 190`; chromatic `line0 ≈ 850`, `line1−line0 ≈ 180`, `fireOn0 ≈ 560`, `fireOn1−fireOn0 ≈ 200`, `fireOffᵢ−fireOnᵢ ≈ 1100`; sub settle ≈ `700 + 26×112 ≈ 3610` (112-char sub), pre/post Δ ≤ 17 ms; (c) ABSOLUTE line beats on stagger/chromatic may sit up to ~33 ms (2 frames) EARLIER on post — the retired double-rAF kick, recorded in the JSON comparison note (ruling 3 above); decrypt and all fire/sub beats have no kick and must match absolutely within ±17 ms. Record the comparison verdict in `docs/superpowers/gates/v33/d-endstate.txt`.
- [ ] **Step 11: live verify B — interruption + hidden-tab torture, reduced-motion, mobile.**
  (a) **Interruption torture** (`evaluate_script`):
```js
(async () => {
  const deck = document.querySelector('.deck');
  if (!deck.classList.contains('open')) document.querySelector('.deck-toggle').click();
  const btns = [...document.querySelectorAll('.seg[data-seg="hero"] button')];
  for (let i = 0; i < 10; i++) { btns[i % btns.length].click(); await new Promise(r => setTimeout(r, 120)); }
  return 'tortured';
})()
```
  wait 6 s, re-run Step 10's read snippet → every line `text:true`, `cssText:''`, computed opacity `1`, transform `none`; `list_console_messages` → **zero errors** (a cancelled marker must never surface an unhandled `AbortError` — the `seq` rejection handler is the guard). Repeat the 10-click loop twice more; same result. Record to `docs/superpowers/gates/v33/d-torture.txt`.
  (b) **Hidden-tab torture:** click one variant button (entrance starts), immediately `new_page` → `about:blank` (QA tab now hidden), `sleep 5`, `select_page` back to the QA tab, wait 3 s, run the read snippet → all lines settled `text:true`, sub complete. `close_page` on the blank tab (one-tab discipline restored). Zero console errors.
  (c) **Reduced-motion:** emulate `prefers-reduced-motion: reduce` (chrome-devtools `emulate` — the v32 Task-12 approach), hard-reload, wait for boot, then `evaluate_script`:
```js
(() => {
  const h1 = document.querySelector('.hero h1');
  return JSON.stringify({
    text: [...h1.querySelectorAll('.line')].every(l => l.textContent === l.dataset.line),
    heroAnims: h1.getAnimations({ subtree: true }).length,
    bodyAnims: document.body.getAnimations().length,
    subDone: document.querySelector('.hero-sub-text').textContent.length > 0
  });
})()
```
  Expected `{"text":true,"heroAnims":0,"bodyAnims":0,"subDone":true}` — instant text, typeSub instant path, **zero animations created** (spec acceptance 5). Clear the emulation after.
  (d) **Mobile:** 390×844 hard-reload → entrance lands, zero console errors.
- [ ] **Step 12: byte ledger.** `wc -c js/app.js` → record `pre → post (Δ)` from Step 2 into `docs/superpowers/gates/v33/bytes-v33d.txt` (Task 7 consumes it; expected net negative or ~flat — ≈45–55 ladder/net lines retired per spec §3.4 against the sequencer block).
- [ ] **Step 13: Commit.** `git add js/app.js js/boot.mjs index.html tools/verify-site-hardening.js`; commit EXACTLY:
```
feat(v33d): hero choreography on WAAPI — ladders + settle net retired, interruption safety structural

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

---

### Task 5 (v33e): CSS scroll-driven animations behind @supports (M6)

Spec anchors (BINDING): §3.5, §1.5, §4.5, §6, §7, §8 item 5, correction of record #4. Not luminance-gated (§4.5). All anchors verified against `b3d4067` — Tasks 1–4 never touch `js/effects.js` or `css/site.css`.

**Files:** Modify: `js/effects.js` (SDA const after :6, progress write :120, parallax gate :123), `css/site.css` (reduced-motion block :442–448, `@supports` block appended at EOF after the `body.proj-rail` rules :928–929; the base `.scroll-progress` rule :397–400 is UNTOUCHED — it stays the truthful no-SDA base), `js/boot.mjs` (:17 `V.fx`), `index.html` (:28 css `?v=`, :438 `boot.mjs?v=`). Test: `tools/verify-site-hardening.js` (insert one check above the `const failed =` anchor).

**Interfaces:** Consumes: the censused migration surface — exactly ONE `data-parallax` element (`index.html:170`, `data-parallax="0.06"`, the about portrait) and `.scroll-progress` (`index.html:73`, CSS `site.css:397`); the JS drivers being stood down (`effects.js:120` width write, `:123–130` parallax formula — formula RETAINED as the no-SDA fallback); the fire-once reveal splice (`effects.js:95` — of record, does NOT migrate); CURRENT `boot.mjs?v=` left by Task 4 (expected 27). Produces: `SDA` boot-time const in effects.js (`CSS.supports('animation-timeline: view()')`), the `@supports (animation-timeline: view())` block, keyframes `v33ParallaxDrift`/`v33ProgressGrow`, the reduced-motion line `[data-parallax], .scroll-progress { animation: none !important; }`, harness check `v3.3e — scroll-driven animations behind @supports with a truthful JS fallback` (count → 47), `V.fx = '3.8'`, `site.css?v=3.30`, gates artifacts `e-parallax-sda-{enter,center,leave}.png`, `e-parallax-js-{enter,center,leave}.png`, `e-parallax-parity.json`, `e-no-double-drive.txt`, `e-reduced.txt`, `bytes-v33e.txt`.

M6 moves the two per-frame JS scroll writes to the compositor on SDA engines (~83% of visitors — research doc §3.4): the portrait parallax (`translate3d` write per scroll-frame) becomes `animation-timeline: view()`, the progress bar's layout `width` write becomes a `scaleX` transform on `animation-timeline: scroll(root)`. **Binding rulings restated (spec §3.5 + correction #4):** view reveals do NOT migrate — fire-once (`.seen` + splice, `effects.js:95`) is unexpressible in bidirectional SDA; replay-on-scroll-up would violate motion law §4.6; `checkReveals` stays the only reveal driver on ALL engines (the SDA-reveal alternative is REJECTED of record). Same for nav/section-detect/state-word (threshold events). The JS fallback stays byte-truthful — Firefox stable (flag off at Fx 152) takes today's path unchanged; the two sides never double-drive (one boot-time check, mirrored by the `@supports` condition). Reduced-motion needs explicit `animation: none` — the `.001ms` global kill cannot stop progress-driven playback (spec §1.5 ruling); the bar's static base is `scaleX(0)` so the reduced state is an EMPTY bar, never a full one.

Two recorded rulings the executor inherits (cross-checked against the spec at assembly):
1. **Reduced-motion behavior delta of record:** spec §1.5's acceptance ("zero transform/width change on the migrated elements") freezes the progress bar under reduced motion on SDA engines, while the Firefox JS fallback keeps its historical unguarded width write (`effects.js:120` has never been reduced-gated; spec §3.5 preserves "its existing reduced guard" — which covers parallax only). Ship the spec's letter; the cross-engine divergence is recorded in `e-reduced.txt` and routed to the gate pile (spec §8 item 5, taste-ambiguous).
2. **Parity positions and the JS fixed point:** the JS parallax reads back its own transform through `getBoundingClientRect` (`:127`), so its steady state is `T = −C₀·s/(1+s)` (s = 0.06), while the spec's exact keyframes produce `T = −C₀·s`. The difference `C₀·s²/(1+s)` is ≤ 0.8 px when the portrait centre sits at 80%/50%/20% of viewport height (C₀ ≤ 0.3·vh at vh = 743) — those ARE the acceptance's "entering / centered / leaving" positions — and only approaches ~2 px at the extreme cover edges, which are not comparison points. Keyframes stay the spec's verbatim form; the derivation and per-position deltas are recorded in `e-parallax-parity.json`.

- [ ] **Step 1: Harness pin FIRST (RED).** Insert above the `const failed = checks.filter(item => !item.pass);` anchor in `tools/verify-site-hardening.js` (below the v3.3d check):
```js
// v3.3e — M6: parallax + progress ride the compositor behind @supports; effects.js
// mirrors the identical CSS.supports check and stands down its per-frame writes
// (never double-driven). The JS fallback formula is pinned POSITIVE — it stays the
// truthful no-SDA path. Reduced-motion gets the explicit animation: none the
// .001ms kill cannot provide (progress-driven playback ignores duration).
check('v3.3e — scroll-driven animations behind @supports with a truthful JS fallback',
  /@supports \(animation-timeline: view\(\)\)/.test(css) &&
    /animation-timeline: view\(\);/.test(css) &&
    /animation-timeline: scroll\(root\);/.test(css) &&
    /CSS\.supports\('animation-timeline: view\(\)'\)/.test(effects) &&
    /if \(progress && !SDA\)/.test(effects) &&
    /if \(!reduced && !SDA\)/.test(effects) &&
    /\(-center \* speed\)\.toFixed\(1\)/.test(effects) &&
    /\[data-parallax\], \.scroll-progress \{ animation: none !important; \}/.test(css),
  'one @supports block owns SDA parallax (view()) + progress (scroll(root)); effects.js gates both writes on the mirrored boot-time check and keeps the fallback formula; migrated elements get animation:none under reduced-motion');
```
Run `node tools/verify-site-hardening.js` → new check **FAILs**, all prior PASS (46 expected). Record `wc -c js/effects.js css/site.css` (pre values for Step 9).
- [ ] **Step 2: the boot-time handoff const.** Edit `js/effects.js` old_string:
```js
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```
new_string:
```js
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* v3.3e — scroll-driven animations (M6): when the engine has SDA, CSS owns the
     parallax + progress transforms (site.css @supports block) and this file's
     per-frame writes stand down. ONE boot-time check, mirrored exactly by
     @supports (animation-timeline: view()) — the two sides never double-drive.
     View reveals do NOT migrate: fire-once (.seen + splice below) is
     unexpressible in bidirectional SDA — checkReveals stays the only reveal
     driver on every engine (ruling of record, v3.3 spec §3.5). */
  const SDA = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'));
```
- [ ] **Step 3: stand down the two JS writes on SDA engines.** Edit `js/effects.js` old_string:
```js
    if (progress) progress.style.width = (y / max * 100) + '%';
```
new_string:
```js
    if (progress && !SDA) progress.style.width = (y / max * 100) + '%';
```
Then Edit old_string:
```js
    if (!reduced) {
      for (const el of parallaxEls) {
```
new_string:
```js
    if (!reduced && !SDA) {
      for (const el of parallaxEls) {
```
(The loop body — the `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)` formula at `:126–128` — is NOT touched: it is the pinned no-SDA fallback. `checkReveals`, nav, section-detect all keep running unconditionally.)
- [ ] **Step 4: the @supports block (CSS side).** Edit `css/site.css` old_string:
```css
body.proj-rail .proj-end { flex-direction: column; align-items: flex-end; gap: 6px; }
body.proj-rail .proj-tech { text-align: right; max-width: none; min-width: 30ch; }
```
new_string:
```css
body.proj-rail .proj-end { flex-direction: column; align-items: flex-end; gap: 6px; }
body.proj-rail .proj-tech { text-align: right; max-width: none; min-width: 30ch; }

/* ============================================================
   v3.3e — scroll-driven animations (M6): parallax + progress on
   the compositor, progressive enhancement. js/effects.js mirrors
   this exact check (CSS.supports('animation-timeline: view()'))
   and stands down its per-frame writes — never double-driven.
   View reveals stay JS on ALL engines: fire-once (.seen + splice)
   is unexpressible in bidirectional SDA — ruling of record.
   Census: exactly ONE data-parallax element exists (the about
   portrait, speed 0.06); a future element with a different speed
   needs its own keyframes here or it silently gets neither driver.
   ============================================================ */
@supports (animation-timeline: view()) {
  [data-parallax="0.06"] {
    /* sign truth (spec §3.5): entering at the viewport bottom => center
       positive => translateY NEGATIVE. translate % resolves against the
       element's own box, so the JS formula maps exactly. Non-zero
       duration honors Firefox's SDA requirement; longhands sit AFTER
       the animation shorthand, which would otherwise reset them. */
    animation: v33ParallaxDrift 1ms linear both;
    animation-timeline: view();
    animation-range: cover 0% cover 100%;
  }
  .scroll-progress {
    width: 100%;
    transform: scaleX(0);   /* static base — under reduced-motion animation:none this leaves an EMPTY bar, never a full one */
    transform-origin: 0 50%;
    animation: v33ProgressGrow 1ms linear both;
    animation-timeline: scroll(root);
  }
  @keyframes v33ParallaxDrift {
    from { transform: translateY(calc((50vh + 50%) * -0.06)); }
    to   { transform: translateY(calc((50vh + 50%) * 0.06)); }
  }
  @keyframes v33ProgressGrow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
}
```
- [ ] **Step 5: explicit reduced-motion kill (the .001ms ruling).** Edit `css/site.css` old_string:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important;
    transition-duration: .001ms !important; scroll-behavior: auto !important; }
  [data-reveal] { opacity: 1 !important; transform: none !important; }
  .clip-reveal::after { display: none; }
  .clip-reveal img, .clip-reveal .media { transform: none !important; }
}
```
new_string:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important;
    transition-duration: .001ms !important; scroll-behavior: auto !important; }
  [data-reveal] { opacity: 1 !important; transform: none !important; }
  .clip-reveal::after { display: none; }
  .clip-reveal img, .clip-reveal .media { transform: none !important; }
  /* v3.3e — a scroll-driven animation is progress-driven: the .001ms duration
     kill above cannot stop it, so the migrated elements get an explicit none.
     The progress bar rests EMPTY (its SDA base is scaleX(0)) and the portrait
     rests untransformed — zero transform/width change on scroll (spec §1.5). */
  [data-parallax], .scroll-progress { animation: none !important; }
}
```
- [ ] **Step 6: syntax, harness GREEN, versions, fence checks.** `node --check js/effects.js` → exit 0. `node tools/verify-site-hardening.js` → ALL GREEN, count = previous + 1 (47 expected). Fence: `grep -n "reveals.splice" js/effects.js` → still exactly the `:95` splice (fire-once of record, unmigrated); `grep -c "animation-timeline" css/site.css` → 3 (condition + two longhands, all inside the ONE block). Versions (§7): `js/boot.mjs` Edit old_string `fx: '3.7'` → new_string `fx: '3.8'` (effects.js untouched by Tasks 1–4, so '3.7' is CURRENT; on drift bump CURRENT +0.1); `index.html` Edit old_string `<link rel="stylesheet" href="css/site.css?v=3.29" />` → new_string `<link rel="stylesheet" href="css/site.css?v=3.30" />` (css untouched by Tasks 1–4; on drift bump CURRENT +0.01); increment CURRENT `boot.mjs?v=` by 1 (expected `27` → `28` after Task 4). `node --check js/boot.mjs` → silent. Burn-rule guard: `git log main --oneline -S "site.css?v=3.30" -- index.html`, `git log main --oneline -S "fx: '3.8'" -- js/boot.mjs`, `git log main --oneline -S "boot.mjs?v=28" -- index.html` → all EMPTY.
- [ ] **Step 7: live verify A — computed-style parity, 3 positions, both arms in one Chrome session.** Serve + ONE tab discipline as Task 4 Step 10. Open `http://127.0.0.1:8765/index.html` at 1440×743, hard-reload (cache disabled), wait for boot + 2 s. Compute the three scroll targets (`evaluate_script`):
```js
(() => {
  const el = document.querySelector('[data-parallax]');
  const t = getComputedStyle(el).transform;
  const m42 = t === 'none' ? 0 : new DOMMatrixReadOnly(t).m42;
  const r = el.getBoundingClientRect();
  const topAbs = scrollY + r.top - m42, h = r.height, vh = innerHeight;
  return JSON.stringify({
    enter: Math.round(topAbs + h / 2 - vh * 0.8),
    center: Math.round(topAbs + h / 2 - vh * 0.5),
    leave: Math.round(topAbs + h / 2 - vh * 0.2)
  });
})()
```
  For EACH position (enter/center/leave): hard-reload → wait for boot → `evaluate_script` `window.scrollTo(0, <target>)` → wait 600 ms + 2 rAF → **Arm A (SDA) read**:
```js
(() => {
  const el = document.querySelector('[data-parallax]');
  const t = getComputedStyle(el).transform;
  const m42 = t === 'none' ? 0 : new DOMMatrixReadOnly(t).m42;
  const r = el.getBoundingClientRect();
  const bar = document.querySelector('.scroll-progress');
  const max = Math.max(1, document.body.scrollHeight - innerHeight);
  const c0 = r.top - m42 + r.height / 2 - innerHeight / 2;
  return JSON.stringify({
    scrollY, sdaY: +m42.toFixed(2), c0: +c0.toFixed(2),
    jsFixedPoint: +(-(c0 * 0.06) / 1.06).toFixed(2),
    barW: +bar.getBoundingClientRect().width.toFixed(2),
    barExpected: +(scrollY / max * innerWidth).toFixed(2),
    inlineStyleClean: el.getAttribute('style') === null || !/translate3d/.test(el.getAttribute('style'))
  });
})()
```
  `take_screenshot` → `docs/superpowers/gates/v33/e-parallax-sda-<pos>.png`. Then **Arm B (JS fallback, same position)** — strip the SDA rules and hand-iterate the fallback's own per-frame write to its fixed point (byte-identical expression to `effects.js:126–128`):
```js
(() => {
  for (const sh of [...document.styleSheets]) {
    try {
      const rr = sh.cssRules;
      for (let i = rr.length - 1; i >= 0; i--)
        if (rr[i].conditionText && rr[i].conditionText.includes('animation-timeline')) sh.deleteRule(i);
    } catch (e) {}
  }
  const el = document.querySelector('[data-parallax]');
  el.style.transform = '';
  const speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
  for (let k = 0; k < 6; k++) {
    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2 - innerHeight / 2;
    el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
  }
  const m42 = new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;
  return JSON.stringify({ scrollY, jsY: +m42.toFixed(2) });
})()
```
  `take_screenshot` → `docs/superpowers/gates/v33/e-parallax-js-<pos>.png`, then hard-reload before the next position (restores the SDA arm).
  **PASS criteria:** per position `|sdaY − jsY| ≤ 1` px (spec acceptance 1; `jsFixedPoint` in Arm A must also agree with `jsY` within rounding — the derivation check); sign truth — `sdaY < 0` at enter, `≈ 0` at center, `> 0` at leave; `|barW − barExpected| ≤ 1` px at every position; `inlineStyleClean: true` in every Arm A read (JS never wrote the portrait). Write all six JSONs + the ≤1 px verdicts to `docs/superpowers/gates/v33/e-parallax-parity.json`.
- [ ] **Step 8: live verify B — no-double-drive probe, reduced-motion sweep, mobile, Firefox arm.**
  (a) **No-double-drive (MutationObserver probe, spec acceptance 2):** fresh hard-reload, wait for boot, then:
```js
(async () => {
  window.__dd = { portrait: 0, bar: 0 };
  const p = document.querySelector('[data-parallax]');
  const b = document.querySelector('.scroll-progress');
  new MutationObserver(ms => { window.__dd.portrait += ms.length; }).observe(p, { attributes: true, attributeFilter: ['style'] });
  new MutationObserver(ms => { window.__dd.bar += ms.length; }).observe(b, { attributes: true, attributeFilter: ['style'] });
  for (const y of [0, 800, 1600, 2400, 3200, 1200, 0]) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 250));
  }
  return JSON.stringify({ dd: window.__dd, barMoving: b.getBoundingClientRect().width });
})()
```
  Expected `dd: {"portrait":0,"bar":0}` (effects.js wrote neither `style`) with `barMoving` having been > 0 mid-sweep (CSS is the driver — confirm via the Step-7 barW numbers). Archive the JSON → `docs/superpowers/gates/v33/e-no-double-drive.txt`.
  (b) **Reduced-motion sweep (spec §1.5 acceptance):** emulate `prefers-reduced-motion: reduce`, hard-reload, wait for boot; read `{ t: getComputedStyle(document.querySelector('[data-parallax]')).transform, w: document.querySelector('.scroll-progress').getBoundingClientRect().width }` at `scrollY = 0`, then `window.scrollTo(0, 2400)`, wait 600 ms, read again → both reads identical: transform `none`, width `0` — zero transform/width change. Record both reads + ruling-1's cross-engine note to `docs/superpowers/gates/v33/e-reduced.txt`. Clear the emulation.
  (c) **Mobile:** 390×844 hard-reload → zero console errors; progress bar tracks a short scroll (SDA path; same engine).
  (d) **Firefox arm (JS fallback on a real second engine):** `ls /Applications/Firefox.app 2>/dev/null` — if present, load the URL in Firefox manually, confirm portrait drifts on scroll + bar fills (today's JS path, byte-unchanged) and the console is clean; if absent, record "Firefox unavailable on this machine — no-SDA path exercised via the rule-stripped Arm B (Step 7) + the pinned fallback formula" in `e-parallax-parity.json`. Firefox stable's flag-off status (Fx 152) is why the fallback must stay truthful.
  (e) `list_console_messages` on the Chrome session → **zero messages**.
- [ ] **Step 9: byte ledger.** `wc -c js/effects.js css/site.css` → record `pre → post (Δ)` pairs into `docs/superpowers/gates/v33/bytes-v33e.txt`.
- [ ] **Step 10: Commit.** `git add js/effects.js css/site.css js/boot.mjs index.html tools/verify-site-hardening.js`; commit EXACTLY:
```
feat(v33e): scroll-driven animations behind @supports — parallax + progress to the compositor, JS fallback truthful

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

---

### Task 6 (v33f): Rivulet-glass grabpass (M10, behind `RIVULET_GATE`)

Spec anchors (BINDING): §1.1 row v33f, §3.6, §4.1, §4.2-style, §4.4, §5, §6, §7, §8 item 6. Line anchors are against `b3d4067`; every old_string below was chosen to AVOID lines Tasks 1–5 edit — except Step 7, whose anchor is reconciled against the state Task 1 leaves behind (noted inline). Version numbers inside steps are plan-time projections under the §7 monotonic chain (read-current-and-increment is binding, projections are not): expected at Task-6 start — `V.bg '5.9'`, `boot.mjs?v=28`, `site.css?v=3.30`, `V.app '4.3'`, `V.fx '3.8'`.

**Files:**
- Create: `js/rivulet.mjs` (new ES module, ~200 lines — sim + splat + pass; `.mjs` so `node --check` parses it as ESM, the `boot.mjs` precedent).
- Create: `js/vendor/three-0.158.0/examples/jsm/misc/GPUComputationRenderer.js` (vendored byte-exact from the r158 tag; new `misc/` dir — the vendored jsm set is currently `postprocessing/` + `shaders/` only).
- Modify: `js/background.js` — 4 edits: gate const + handle after `:639` (`const depthRain = reduced ? null : makeDepthRain();` — Task 1 rewrites `makeDepthRain()` internals but this line is harness-pinned and survives verbatim); droplets IIFE early-return at `:646–649` (Task 2's C4 edits `drawDrop`/`update` internals and Task 3 adds merge/trail INSIDE `update` — the IIFE's opening four lines are untouched by both); gated dynamic import inside the bloom block, anchored on the tail of Task 1's `__bloomIso` hook (RECONCILED — see Step 7); loop hook at `:2186–2187` (anchor deliberately EXCLUDES `:2188`, which Task 2 rewrites to `droplets.update(dt, flash)`).
- Modify: `js/boot.mjs` (`V.bg` bump), `index.html` (`boot.mjs?v=` bump), `tools/verify-site-hardening.js` (ONE new check above the `const failed = checks.filter(item => !item.pass);` anchor).

**Interfaces:**
- *Consumes:* `finalComposer` / `gradePass` / `caPass` and the chain order RenderPass→mixPass→OutputPass→gradePass→caPass (`background.js:1910–1917`; `insertPass` verified present in vendored EffectComposer `:70`); `quality.name` (`:49` — `'high'` implies `!LITE && !reduced`); `reduced` (`:12`); `renderer`; `sceneState.rain` (rain presence ≈1, drives spawn); the droplets IIFE opening shape (`:646–649`); import map `"three/addons/": "./js/vendor/three-0.158.0/examples/jsm/"` (`index.html:398–403`); Task 2's `uFlash`-bearing gradePass (coexists, untouched by this task); **from Task 1:** the `'rain-streaks'` mesh + its `evaluate_script` visibility lever, and the §1.3 bloom-isolation procedure `window.__bloomIso(rainVisible, hold)` / `window.__bloomResume()` on `?sceneDebug=1` (re-run here as acceptance 5, Step 16); the Task-1 pre-campaign baseline medians (context comparison); §7 version values at branch HEAD.
- *Produces:* `const RIVULET_GATE = true` (spec-named, `js/background.js`, scene-side); `let rivulet` handle + loop call `if (rivulet) rivulet.update(dt);`; `js/rivulet.mjs` exporting `initRivulet({ renderer, finalComposer, caPass, sceneState })` → api `{ pass, enabled, setEnabled(on), sim, update(dt), coverage() }`; **`window.__rivulet`** — the plain-URL A/B + kill lever (exists ONLY when the gate is on and the module loaded); vendored `js/vendor/three-0.158.0/examples/jsm/misc/GPUComputationRenderer.js`; pinned values `uCoverageMax = 0.05`, `#define DROP_COUNT 200`, luma-clamp shape `lBase + 0.22 * lRefr`; harness check `v3.3f — rivulet grabpass is gated, clamped, and the desktop 2D canvas is retired behind it` (count → 48); gates `f-rivulet-on.png`, `f-rivulet-fallback-canvas.png`, `f-sim-seq-{1..5}.png`, `f-limb-refraction.png`, `f-rivAB-{on,off}-{1..5}.png`, `f-bloomiso-on.png`/`f-bloomiso-off.png`. Task 7 consumes `window.__rivulet`, the ON/fallback capture pair, and this task's fps + coverage numbers.

**What and why (spec §3.6, R3):** the one proposal that earns the word "simulation" — a 64×64 GPGPU drop-state sim (gravity, hang-and-burst runs, collision-merge, evaporation: the raindrop-fx model) splatted as additive metaball kernels whose smooth-field sums produce real menisci; normals derive from the field gradient and **refract the already-rendered graded frame** — a true grabpass, zero texture uploads (never raindrop-fx's image-background API, which would force per-frame canvas re-upload). Slot: after `gradePass`, before `caPass` — drops refract the graded world and still receive the lens fringe. Alpha-preserving (centre-tap alpha, the caPass convention), `NoBlending`. Retirement pairing (§1.1): on the high tier with the gate ON, the droplets IIFE allocates/binds/draws NOTHING (HALO_GATE discipline); LITE keeps the M3-elevated canvas — the pre-built fallback if the owner kills M10 at its gate. Restraint numbers are LAW, pinned by value: ≤200 drops, `uCoverageMax = 0.05` (enforced **by construction** via the radius clamp derived from it — the campaign-wide ruling; `coverage()` is the live readback proof), refracted-sample added-luma clamp keyed to the 0.22 glint law.

- [ ] **Step 1: Harness pin FIRST (red).** In `tools/verify-site-hardening.js`, insert above the `const failed = checks.filter(item => !item.pass);` anchor (below the v3.3e check):
```js
// v3.3f — the rivulet grabpass is the gated M10 splurge (HALO_GATE discipline:
// RIVULET_GATE false must allocate/fetch NOTHING; the gate ships TRUE for the
// owner's live verdict — a kill-flip is an owner-gated pin update). Restraint
// numbers pinned by VALUE: uCoverageMax <= 0.05, DROP_COUNT <= 200, refraction
// luma clamp keyed to the 0.22 glint law. The desktop 2D droplet canvas
// retires BEHIND the gate; LITE keeps the M3 beads.
const rivuletPath = path.join(root, 'js/rivulet.mjs');
const rivulet = fs.existsSync(rivuletPath) ? fs.readFileSync(rivuletPath, 'utf8') : '';
const rivCovMatch = rivulet.match(/uCoverageMax\s*=\s*\{\s*value:\s*([0-9.]+)\s*\}/);
const rivCov = rivCovMatch ? Number(rivCovMatch[1]) : NaN;
const rivDropMatch = rivulet.match(/#define DROP_COUNT (\d+)/);
const rivDrops = rivDropMatch ? Number(rivDropMatch[1]) : NaN;
check('v3.3f — rivulet grabpass is gated, clamped, and the desktop 2D canvas is retired behind it',
  /const RIVULET_GATE = true/.test(background) &&
    /if \(RIVULET_GATE && quality\.name === 'high'\) return null;/.test(background) &&
    /RIVULET_GATE && quality\.name === 'high' && !reduced/.test(background) &&
    /import\('\.\/rivulet\.mjs\?v=/.test(background) &&
    fs.existsSync(path.join(root, 'js/vendor/three-0.158.0/examples/jsm/misc/GPUComputationRenderer.js')) &&
    rivCov > 0 && rivCov <= 0.05 &&
    rivDrops > 0 && rivDrops <= 200 &&
    /lBase \+ 0\.22 \* lRefr/.test(rivulet) &&
    /insertPass\(pass, finalComposer\.passes\.indexOf\(caPass\)\)/.test(rivulet) &&
    /NoBlending/.test(rivulet) && /base\.a/.test(rivulet),
  'RIVULET_GATE=true ships the splurge; dynamic import gated on const + high tier + !reduced; droplets IIFE early-returns on high tier (LITE keeps M3 glass); vendored GPUComputationRenderer on disk; uCoverageMax ' + rivCov + ' <= 0.05 and DROP_COUNT ' + rivDrops + ' <= 200 by value; luma clamp keyed to 0.22; pass NoBlending + centre-tap alpha, inserted after grade before CA');
```
Run `node tools/verify-site-hardening.js` → the new check prints `FAIL v3.3f — rivulet grabpass is gated…`, exit code 1, all prior checks PASS (record the prior PASS count N — expected 47 = 42 legacy + one each Tasks 1–5).
- [ ] **Step 2: vendor GPUComputationRenderer (r158 tag exactly).**
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website"
mkdir -p js/vendor/three-0.158.0/examples/jsm/misc
curl -fsSL -o js/vendor/three-0.158.0/examples/jsm/misc/GPUComputationRenderer.js \
  https://unpkg.com/three@0.158.0/examples/jsm/misc/GPUComputationRenderer.js
```
(unpkg `three@0.158.0` IS the r158 tag; fallback mirror if unpkg is down: `https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/misc/GPUComputationRenderer.js`.) Verify:
```bash
grep -c "class GPUComputationRenderer" js/vendor/three-0.158.0/examples/jsm/misc/GPUComputationRenderer.js   # expect: 1
grep -c "from 'three'" js/vendor/three-0.158.0/examples/jsm/misc/GPUComputationRenderer.js                   # expect: 1 (its ONLY import — resolves via the map)
wc -c js/vendor/three-0.158.0/examples/jsm/misc/GPUComputationRenderer.js                                    # record N bytes — goes in the commit message (spec §3.6)
shasum -a 256 js/vendor/three-0.158.0/examples/jsm/misc/GPUComputationRenderer.js                            # record for provenance
```
- [ ] **Step 3: create `js/rivulet.mjs`** — the complete module (sim, splat, pass, api). Full file:
```js
/* v3.3f — rivulet-glass grabpass (M10, behind RIVULET_GATE in background.js).
   A 64×64 GPGPU drop-state sim (gravity, hang-and-burst runs, collision-merge,
   evaporation — the raindrop-fx model, spec §3.6 / research R3) splatted as
   additive metaball kernels whose smooth-field sums produce real menisci;
   normals derive from the field gradient and REFRACT the already-rendered
   graded frame — a true grabpass, zero texture uploads. Slots after gradePass,
   before caPass: drops refract the graded world and still receive the lens
   fringe. Fetched ONLY on the high tier with the gate ON — LITE/reduced never
   load this module (HALO_GATE discipline).
   RESTRAINT LAWS (harness-pinned by value):
   - DROP_COUNT <= 200 (the GLSL define below is the pinned source of truth;
     the JS DROP_COUNT const must stay equal).
   - uCoverageMax <= 0.05: the spec's "spawn throttles against the running
     coverage sum" is enforced BY CONSTRUCTION — a GPU-side running sum needs a
     readback/reduction, so instead every radius is clamped to
     rMax = sqrt(0.9 * uCoverageMax * min(aspect,2) / (DROP_COUNT * PI)), which
     bounds the worst-case iso-surface footprint (SUPPORT 2.2 / ISO 0.5 puts
     the visible edge at ~1.0 r) at <= 0.9 * uCoverageMax of frame area for
     every aspect. coverage() below is the QA readback that proves it live.
   - 0.22 luma clamp: a drop may never ADD more luminance over the base frame
     than the 2D bead's 0.22-alpha lens sample was allowed (v3.1f law, GPU form). */

import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

const SIM_SIZE = 64;        // sim texture is 64×64; only the first DROP_COUNT texels live
const DROP_COUNT = 200;     // MUST equal the GLSL "#define DROP_COUNT" below (pinned there)

const SIM_FRAG = `
  // texel: x = screen u [0,1], y = screen v [0,1] (GL: 0 = bottom),
  // z = vy while running (respawn countdown in s while dead),
  // w = radius as a fraction of frame height (0 = dead)
  uniform float uDt;
  uniform float uTime;
  uniform float uSpawn;        // sceneState.rain presence (0..1) gates respawn
  uniform float uCoverageMax;  // PINNED <= 0.05 — footprint bound, enforced via rMax
  uniform float uAspect;

  #define DROP_COUNT 200
  #define PI 3.14159265359

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    float idx = floor(gl_FragCoord.y) * resolution.x + floor(gl_FragCoord.x);
    vec4 d = texture2D(textureDrops, uv);
    if (idx >= float(DROP_COUNT)) { gl_FragColor = vec4(0.0); return; }

    // Coverage law: iso footprint sits at ~1.0 r, so total coverage
    // <= DROP_COUNT * PI * rMax^2 / uAspect <= 0.9 * uCoverageMax, every aspect.
    float rMax = sqrt(0.9 * uCoverageMax * min(uAspect, 2.0) / (float(DROP_COUNT) * PI));
    float rMin = 0.18 * rMax;
    float hSeed = hash(idx * 7.13);

    if (d.w <= 0.0) {                        // DEAD: countdown, then rain-gated respawn
      d.z -= uDt;
      if (d.z <= 0.0 && uSpawn > 0.05) {
        d.x = 0.04 + 0.92 * hash(idx * 3.7 + floor(uTime * 4.0));
        d.y = 0.25 + 0.73 * hash(idx * 9.1 + floor(uTime * 4.0) * 1.3);
        d.w = rMax * (0.30 + 0.35 * hash(idx * 12.9898 + floor(uTime * 7.0)));
        d.z = 0.0;                           // sitting
      }
      gl_FragColor = d; return;
    }

    if (d.z <= 0.0) {                        // SITTING: condense toward burst
      d.w = min(d.w + uDt * rMax * (0.010 + 0.020 * hSeed), rMax);
      if (d.w >= rMax * (0.62 + 0.36 * hSeed)) d.z = 0.008;   // burst: the run begins
    } else {                                 // RUNNING: hang-and-burst stick/slip
      float episode = hash(idx * 31.7 + floor(uTime * (0.7 + 0.8 * hSeed)));
      if (episode < 0.38) d.z *= pow(0.001, uDt);             // hang: stall hard
      else d.z = min(d.z + uDt * 0.35, 0.55);                 // burst: gravity pulls
      d.y -= d.z * uDt;                                       // run DOWN the glass
      d.x += sin(uTime * (3.0 + 4.0 * hSeed) + idx) * 0.012 * uDt * step(0.02, d.z);
      d.w -= uDt * rMax * 0.045;                              // shed mass / evaporate
    }

    // collision-merge: the larger absorbs, area-conserving; the survivor
    // briefly accelerates (the M3 idiom, GPU-side). Deterministic tie-break.
    for (int j = 0; j < DROP_COUNT; j++) {
      if (float(j) == idx) continue;
      vec2 juv = (vec2(mod(float(j), resolution.x), floor(float(j) / resolution.x)) + 0.5) / resolution.xy;
      vec4 o = texture2D(textureDrops, juv);
      if (o.w <= 0.0) continue;
      vec2 dd = (o.xy - d.xy) * vec2(uAspect, 1.0);
      if (length(dd) < 0.75 * (d.w + o.w)) {
        if (d.w > o.w || (d.w == o.w && idx < float(j))) {
          d.w = min(rMax, sqrt(d.w * d.w + o.w * o.w));   // absorb: area-conserving, rMax-clamped
          d.z = max(d.z, 0.03);                            // survivor jolts forward
        } else {
          d.w = 0.0; d.z = 2.0 + 6.0 * hash(idx + uTime);  // absorbed: die, queue respawn
          gl_FragColor = d; return;
        }
      }
    }

    if (d.y < -0.04 || d.w < rMin) { d.w = 0.0; d.z = 2.0 + 6.0 * hash(idx * 1.7 + uTime); }
    gl_FragColor = d;
  }
`;

const SPLAT_VERT = `
  attribute float aId;
  uniform sampler2D uDrops;
  uniform float uAspect;
  varying vec2 vP;               // kernel space, units of r; support radius SUPPORT
  #define SIM_W 64.0
  #define SUPPORT 2.2
  void main() {
    vec2 juv = (vec2(mod(aId, SIM_W), floor(aId / SIM_W)) + 0.5) / SIM_W;
    vec4 d = texture2D(uDrops, juv);
    vP = position.xy * SUPPORT;
    if (d.w <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }   // dead: degenerate, no fragments
    vec2 halfExt = vec2(d.w * SUPPORT / uAspect, d.w * SUPPORT);  // r is a height-fraction; x aspect-corrected
    vec2 c = d.xy * 2.0 - 1.0;
    gl_Position = vec4(c + position.xy * halfExt * 2.0, 0.0, 1.0);
  }
`;

const SPLAT_FRAG = `
  varying vec2 vP;
  #define SUPPORT 2.2
  void main() {
    float d2 = dot(vP, vP) / (SUPPORT * SUPPORT);
    if (d2 >= 1.0) discard;
    float k = 1.0 - d2;
    gl_FragColor = vec4(k * k * k, 0.0, 0.0, 1.0);   // Wyvill metaball kernel, additive — sums = menisci
  }
`;

const PASS_FRAG = `
  uniform sampler2D tDiffuse;
  uniform sampler2D tField;
  uniform vec2 uTexel;        // 1 / field-target size
  uniform float uRefract;     // refraction offset scale; taste-tune DOWN only
  varying vec2 vUv;
  const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
  #define ISO 0.5
  void main() {
    vec4 base = texture2D(tDiffuse, vUv);
    float h = texture2D(tField, vUv).r;
    if (h < ISO) { gl_FragColor = base; return; }   // outside every meniscus: frame untouched
    float hx = texture2D(tField, vUv + vec2(uTexel.x, 0.0)).r - texture2D(tField, vUv - vec2(uTexel.x, 0.0)).r;
    float hy = texture2D(tField, vUv + vec2(0.0, uTexel.y)).r - texture2D(tField, vUv - vec2(0.0, uTexel.y)).r;
    vec2 grad = vec2(hx, hy);
    float edge = smoothstep(ISO, ISO + 0.18, h);           // soft meniscus rim
    vec2 offs = -grad * uRefract * edge;                    // lens: sample away from the thick centre
    vec3 refr = texture2D(tDiffuse, clamp(vUv + offs, vec2(0.001), vec2(0.999))).rgb;
    refr = mix(vec3(dot(refr, LUMA)), refr, 0.5) * 0.9;     // v3.2l worn-glass law carried into GLSL: saturate(0.5) brightness(0.9)
    vec3 col = mix(base.rgb, refr, edge);
    col += vec3(0.92, 0.98, 1.0) * 0.14 * edge * pow(clamp(0.5 - hy * 10.0, 0.0, 1.0), 4.0);  // upper-rim glint
    // THE LAW (0.22 glint clamp, GPU form): added luma over the base frame is
    // capped at 0.22 x the refracted sample's luma — a drop over the black
    // void can never read as a bright smudge (the v3.1f failure).
    float lBase = dot(base.rgb, LUMA);
    float lRefr = dot(refr, LUMA);
    float lOut  = dot(col, LUMA);
    float lCap  = lBase + 0.22 * lRefr;
    if (lOut > lCap) col *= lCap / max(lOut, 1e-4);
    gl_FragColor = vec4(col, base.a);   // centre-tap alpha — the caPass convention
  }
`;

export function initRivulet({ renderer, finalComposer, caPass, sceneState }) {
  const gpuCompute = new GPUComputationRenderer(SIM_SIZE, SIM_SIZE, renderer);
  const tex0 = gpuCompute.createTexture();
  const data = tex0.image.data;
  for (let i = 0; i < DROP_COUNT; i++) {   // stagger the first condensation wave
    data[i * 4 + 0] = Math.random();
    data[i * 4 + 1] = Math.random();
    data[i * 4 + 2] = 0.5 + i * 0.04 + Math.random();   // respawn countdown (s)
    data[i * 4 + 3] = 0;                                 // dead until the countdown lands
  }
  const dropsVar = gpuCompute.addVariable('textureDrops', SIM_FRAG, tex0);
  gpuCompute.setVariableDependencies(dropsVar, [dropsVar]);
  const simU = dropsVar.material.uniforms;
  simU.uDt = { value: 0 };
  simU.uTime = { value: 0 };
  simU.uSpawn = { value: 0 };
  simU.uCoverageMax = { value: 0.05 };   // PINNED by value (harness v3.3f) — never raise
  simU.uAspect = { value: 1 };
  const err = gpuCompute.init();
  if (err !== null) {
    console.warn('[scene] rivulet sim init failed — desktop glass off this session:', err);
    return null;
  }

  const sizeV = new THREE.Vector2();
  renderer.getSize(sizeV);
  const fieldRT = new THREE.WebGLRenderTarget(
    Math.max(2, Math.ceil(sizeV.x / 2)), Math.max(2, Math.ceil(sizeV.y / 2)),
    { type: THREE.HalfFloatType, format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });

  const quad = new THREE.PlaneGeometry(2, 2);
  const inst = new THREE.InstancedBufferGeometry();
  inst.index = quad.index;
  inst.setAttribute('position', quad.attributes.position);
  inst.setAttribute('uv', quad.attributes.uv);
  const ids = new Float32Array(DROP_COUNT);
  for (let i = 0; i < DROP_COUNT; i++) ids[i] = i;
  inst.setAttribute('aId', new THREE.InstancedBufferAttribute(ids, 1));
  inst.instanceCount = DROP_COUNT;
  const splatMat = new THREE.ShaderMaterial({
    uniforms: { uDrops: { value: null }, uAspect: { value: 1 } },
    vertexShader: SPLAT_VERT, fragmentShader: SPLAT_FRAG,
    blending: THREE.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false,
  });
  const splatMesh = new THREE.Mesh(inst, splatMat);
  splatMesh.frustumCulled = false;
  const fieldScene = new THREE.Scene();
  fieldScene.add(splatMesh);
  const fieldCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const pass = new ShaderPass(new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      tField:   { value: fieldRT.texture },
      uTexel:   { value: new THREE.Vector2(1 / fieldRT.width, 1 / fieldRT.height) },
      uRefract: { value: 0.05 },   // taste constant, tune DOWN only (fringe artifacts); not a law value
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: PASS_FRAG,
  }));
  pass.material.blending = THREE.NoBlending;   // overwrite the ping-pong target (house convention)
  finalComposer.insertPass(pass, finalComposer.passes.indexOf(caPass));   // after gradePass, before caPass

  const prevClear = new THREE.Color();
  const api = {
    pass,
    enabled: true,
    setEnabled(on) { api.enabled = !!on; pass.enabled = !!on; },   // perf-true off: update() also early-returns
    sim: simU,
    update(dt) {
      if (!api.enabled) return;
      renderer.getSize(sizeV);
      const fw = Math.max(2, Math.ceil(sizeV.x / 2)), fh = Math.max(2, Math.ceil(sizeV.y / 2));
      if (fieldRT.width !== fw || fieldRT.height !== fh) {
        fieldRT.setSize(fw, fh);
        pass.material.uniforms.uTexel.value.set(1 / fw, 1 / fh);
      }
      const aspect = sizeV.x / Math.max(1, sizeV.y);
      simU.uAspect.value = aspect;
      splatMat.uniforms.uAspect.value = aspect;
      simU.uDt.value = Math.min(dt, 0.05);
      simU.uTime.value += dt;
      simU.uSpawn.value = sceneState.rain;
      gpuCompute.compute();
      splatMat.uniforms.uDrops.value = gpuCompute.getCurrentRenderTarget(dropsVar).texture;
      const prevRT = renderer.getRenderTarget();
      renderer.getClearColor(prevClear);
      const prevAlpha = renderer.getClearAlpha();
      renderer.setRenderTarget(fieldRT);
      renderer.setClearColor(0x000000, 0);
      renderer.render(fieldScene, fieldCam);          // autoClear wipes the target to transparent black first
      renderer.setRenderTarget(prevRT);
      renderer.setClearColor(prevClear, prevAlpha);
    },
    coverage() {   // QA readback (NEVER called per-frame): iso-footprint fraction of frame area
      const rt = gpuCompute.getCurrentRenderTarget(dropsVar);
      const buf = new Float32Array(SIM_SIZE * SIM_SIZE * 4);
      renderer.readRenderTargetPixels(rt, 0, 0, SIM_SIZE, SIM_SIZE, buf);
      renderer.getSize(sizeV);
      const aspect = sizeV.x / Math.max(1, sizeV.y);
      let s = 0;
      for (let i = 0; i < DROP_COUNT; i++) { const r = buf[i * 4 + 3]; s += Math.PI * r * r / aspect; }
      return s;
    },
  };
  // Plain-URL A/B + kill lever (luminance captures are banned from ?sceneDebug=1
  // — the overlay changes pixels). House precedent: __sceneWarp/__sceneFocus are
  // unconditional globals; THIS one exists only when the gate is on and the
  // module actually loaded, so HALO_GATE discipline holds.
  window.__rivulet = api;
  return api;
}
```
- [ ] **Step 4: syntax-check the module (ESM).** `node --check js/rivulet.mjs` → exits 0, no output. (`.mjs` parses as ESM natively — a `.js` name would make `node --check` choke on the top-level imports.)
- [ ] **Step 5: background.js — gate const + handle.** Edit old_string (`:638–639`; the `reduced ? null : makeDepthRain()` line is harness-pinned and survives Task 1 verbatim):
```js
  const tokyoHalo = makeTokyoHalo();
  const depthRain = reduced ? null : makeDepthRain();
```
new_string:
```js
  const tokyoHalo = makeTokyoHalo();
  const depthRain = reduced ? null : makeDepthRain();

  /* v3.3f RIVULET_GATE — the M10 splurge: GPGPU rivulet-glass grabpass on the
     high tier (js/rivulet.mjs). HALO_GATE discipline: with the gate false,
     NOTHING is allocated, fetched, bound, or drawn — the dynamic import()
     (postFX block below) never fires and the 2D droplet canvas keeps desktop
     duty (the pre-built M3 fallback). Kill switch = flip to false + `?v=`
     bump (spec §5); ships TRUE for the owner's live taste verdict. */
  const RIVULET_GATE = true;
  let rivulet = null;   // rivulet api handle — set only by the gated dynamic import
```
- [ ] **Step 6: background.js — retire the desktop 2D canvas behind the gate.** Edit old_string (`:646–649` — Tasks 2/3 edit this IIFE's INTERNALS, never these opening lines):
```js
  const droplets = (function () {
    if (reduced) return null;
    const cv = document.querySelector('.scene-droplets');
    if (!cv) return null;
```
new_string:
```js
  const droplets = (function () {
    if (reduced) return null;
    /* v3.3f: with the rivulet grabpass live, the high tier retires this 2D
       canvas ENTIRELY — no context, no listener, no draws (retirement pairing,
       spec §1.1). LITE keeps the M3-elevated beads; a RIVULET_GATE kill-flip
       restores this IIFE on desktop unchanged. The .scene-droplets element and
       its CSS stay — they are LITE's home. */
    if (RIVULET_GATE && quality.name === 'high') return null;
    const cv = document.querySelector('.scene-droplets');
    if (!cv) return null;
```
- [ ] **Step 7: background.js — gated dynamic import (RECONCILED anchor: the tail of Task 1's `__bloomIso` hook — Task 1 inserted that hook between the `renderBloomThenFinal` closure and this block's closing brace, so the fragment-era anchor no longer exists).** Edit old_string:
```js
      window.__bloomResume = () => {
        const rainMesh = scene.getObjectByName('rain-streaks');
        if (rainMesh) rainMesh.visible = true;
        if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
        return 'resumed';
      };
    }
  }
```
new_string:
```js
      window.__bloomResume = () => {
        const rainMesh = scene.getObjectByName('rain-streaks');
        if (rainMesh) rainMesh.visible = true;
        if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
        return 'resumed';
      };
    }

    /* v3.3f — rivulet-glass grabpass (M10). Fetched ONLY here: gate + high
       tier — LITE/reduced never request the module or the vendored
       GPUComputationRenderer (HALO_GATE discipline; the LITE network log is a
       §4.4 gate). initRivulet slots the pass after gradePass, before caPass:
       drops refract the GRADED world and still receive the lens fringe. On a
       load/init failure the high tier runs glass-less this session (warn) —
       the sanctioned fallback is the RIVULET_GATE kill-flip, never a hybrid
       revive of the already-retired canvas. */
    if (RIVULET_GATE && quality.name === 'high' && !reduced) {
      import('./rivulet.mjs?v=1').then(mod => {
        rivulet = mod.initRivulet({ renderer, finalComposer, caPass, sceneState });
      }).catch(err => console.warn('[scene] rivulet module failed to load — desktop glass off this session', err));
    }
  }
```
(`caPass` is a const inside this same postFX block — the import call site MUST stay inside the block's closing brace, as placed here.)
- [ ] **Step 8: background.js — loop hook.** Edit old_string (`:2186–2187`; anchor EXCLUDES `:2188`, which Task 2 rewrites to `droplets.update(dt, flash)` — and the insertion keeps `render();` immediately before the droplets line, preserving the pinned `/render\(\);\s*\n\s*if \(droplets\) droplets\.update/` shape):
```js
    camera.lookAt(0, scrollNS * 1.5, 0);
    render();
```
new_string:
```js
    camera.lookAt(0, scrollNS * 1.5, 0);
    if (rivulet) rivulet.update(dt);   // v3.3f: sim step + metaball-field splat BEFORE render — the grabpass consumes this frame's drop field
    render();
```
- [ ] **Step 9: syntax + harness green.** `node --check js/background.js` → clean. `node tools/verify-site-hardening.js` → ALL PASS, count = N+1 (expected 48), exit 0. The pre-existing pins that MUST still match: `scene-droplets` (index check — element stays), `render();\n if (droplets) droplets.update` (weather check), `reduced ? null : makeDepthRain()` (rain check).
- [ ] **Step 10: version bumps (§7 — read-current-and-increment, then burn-check).** `js/boot.mjs`: bump the CURRENT `bg` one minor step (expected `bg: '5.9'` → `bg: '6.0'`). `index.html`: increment the CURRENT `boot.mjs?v=` by 1 (expected `?v=28` → `?v=29`). `js/rivulet.mjs` ships as `?v=1` (new file — Step 7 already bakes it). `node --check js/boot.mjs` → silent. Burn-check (values must never have been published from main):
```bash
git show main:js/boot.mjs | grep "const V"     # expect bg:'5.3' — '6.0' never served from main
git show main:index.html | grep "boot.mjs?v"   # expect v=20 — the new boot ?v never served from main
git grep -c rivulet main -- . || echo CLEAN    # expect CLEAN — rivulet.mjs never existed on main
```
- [ ] **Step 11: live verify — shipped state (gate ON), desktop.** Serve if dead (`python3 -m http.server 8765 --bind 127.0.0.1` from repo root). ONE tab, stale QA tabs closed. Device-metrics emulation **1440×743 CSS px @ DPR 2**; open `http://127.0.0.1:8765/index.html`, hard reload (`ignoreCache`), 11 s settle. Then:
  - (a) State assertions — `evaluate_script`:
```js
(() => { const c = document.querySelector('.scene-droplets');
  return JSON.stringify({ rivulet: !!window.__rivulet,
    passEnabled: window.__rivulet ? window.__rivulet.pass.enabled : null,
    canvasInert: c.width === 300 && c.height === 150 }); })()
```
  Expected: `{"rivulet":true,"passEnabled":true,"canvasInert":true}` (the canvas keeps its 300×150 attribute defaults — the IIFE never touched it).
  - (b) Network: `list_network_requests` → `rivulet.mjs?v=1` and `GPUComputationRenderer.js` both fetched, status 200.
  - (c) **Coverage readback (acceptance 1):** `evaluate_script` → `window.__rivulet.coverage()` — run 5×, ~10 s apart; EVERY reading ≤ **0.05** (record all 5 + the max).
  - (d) **Simulation read (acceptance 3):** watch up to ~60 s (runs begin ~15–40 s after boot); capture a 5-frame sequence ~0.5 s apart → `docs/superpowers/gates/v33/f-sim-seq-{1..5}.png` showing a hang-and-burst run (a bead stalling then jolting down with zigzag) and a collision-merge meniscus (a run necking into a sitting bead, then one survivor). Then one capture with drops over the globe limb → `f-limb-refraction.png` — the refracted content inside a drop is recognizably the scene (limb/halo light bent, not a generic shimmer).
  - (e) `list_console_messages` → **zero** errors/warnings.
- [ ] **Step 12: luminance gates (§4.1 floors + §4.2-style interleaved A/B; plain URL, never `?sceneDebug=1`).** All frames → `docs/superpowers/gates/v33/`, 1440×743 @ DPR 2, `node tools/frame-luminance.mjs <png>` per frame.
  - (a) **Interleaved pass-on/off, 5 pairs (the letter criterion):** per pair — fresh hard reload (`ignoreCache`) → 11 s settle → verify `scrollY === 0` via `evaluate_script` → capture `f-rivAB-on-i.png` → `window.__rivulet.setEnabled(false)` → wait 1 s → capture `f-rivAB-off-i.png` → `setEnabled(true)`. Δᵢ = mean(on) − mean(off). **Median pairwise Δ ≤ 0** (refraction redistributes, must not add). A Δ in (0, resolution) fails the letter → route to the gate pile with the variance analysis attached (v3.2r precedent) — never silently passed. (The desktop 2D canvas is retired in BOTH arms; isolating only the pass is the sanctioned method.)
  - (b) **Rest-state medians + floors:** 5 fresh-hard-reload captures each for hero (`scrollTo(0,0)`), `#projects`, `#gallery` (scroll landing verified per capture, 11 s settle) with the pass ON → per-metric medians + spreads. **p50 medians MUST be 8 / 7 / 9** — any violation fails the task outright (build error, not gate-pile). Report mean/warm deltas vs the Task-1 pre-campaign baseline as context, below-resolution rules applied (hero σ ≈ 0.4–1.2, projects ≈ 1.17, gallery ≈ 0.72).
- [ ] **Step 13: perf gate (§4.4 — SEPARATE `?sceneDebug=1` session, same session both arms, never cross-session).** Open `http://127.0.0.1:8765/index.html?sceneDebug=1`, hard reload, hero at rest, **30 s settle**. Arm A (enabled): 5 readings of `window.__sceneDebug().fps`, ≥3 s apart → median. Then `window.__rivulet.setEnabled(false)`, 30 s settle. Arm B (disabled): 5 readings → median. **Gate: median(enabled) ≥ median(disabled) − 2 fps.** Record both medians (Task 7 spot-checks against them). Re-enable.
- [ ] **Step 14: kill-flip verified live BOTH ways (acceptance: one-const kill).** In the working tree flip `const RIVULET_GATE = true` → `false` (NO commit; the harness v3.3f pin will FAIL while flipped — expected, it pins the shipped value). Hard reload the plain URL:
  - `evaluate_script`: `(() => { const c = document.querySelector('.scene-droplets'); return JSON.stringify({ rivulet: typeof window.__rivulet, canvasLive: c.width > 300 }); })()` → expected `{"rivulet":"undefined","canvasLive":true}` (the M3 canvas resumed desktop duty — its resize ran).
  - `list_network_requests` → **zero** requests for `rivulet.mjs` or `GPUComputationRenderer.js` (fetches NOTHING).
  - Wait ~20 s for beads, capture → `f-rivulet-fallback-canvas.png`. Zero console.
  - Flip back to `true`, hard reload, re-assert Step 11(a), capture → `f-rivulet-on.png` (this ON/fallback pair is GATE-PILE item 1). Re-run `node tools/verify-site-hardening.js` → 48/48.
- [ ] **Step 15: LITE + reduced-motion.** (a) Mobile emulation 390×844 @ DPR 2 mobile+touch, hard reload: `list_network_requests` → zero rivulet/GPUComputationRenderer requests (LITE never fetches — §4.4); `.scene-droplets` canvas LIVE (`c.width === 585` = 390 × DPR-cap 1.5 — the M3 beads keep the phone); zero console. (b) Reduced-motion (the v3.2r matchMedia initScript override method): scene static, droplets null via the PRE-EXISTING `reduced` return (`:647`), no rivulet load (`quality.name === 'reduced'`), zero console.
- [ ] **Step 16: bloom-isolation re-run (§1.3 with the pass on — acceptance 5; RECONCILED to Task 1's concrete procedure).** Session on `?sceneDebug=1`, 1440×743 @ DPR 2, hard reload, 11 s settle (the `__bloomIso` hook exists only here; the rivulet pass lives in `finalComposer` and must not perturb the bloom chain — `__bloomIso` renders `bloomComposer` alone, so the pass is bypassed by construction and any digest drift means the bloom chain itself was disturbed):
  1. `evaluate_script`: `window.__bloomIso(true, true)` → `rain=true digest=<A>`; capture → `docs/superpowers/gates/v33/f-bloomiso-on.png`.
  2. `evaluate_script`: `window.__bloomIso(false, true)` → `rain=false digest=<B>`; capture → `docs/superpowers/gates/v33/f-bloomiso-off.png`.
  3. `evaluate_script`: `window.__bloomResume()` → `'resumed'`.
**Gate: digest A === digest B, exactly** (the Task-1 criterion, re-proven with the rivulet pass installed). Zero console across the session. On mismatch: STOP, debug (suspect: the pass or its render-target juggling touched the bloom chain), re-run.
- [ ] **Step 17: byte ledger + commit.** Ledger: `wc -c js/rivulet.mjs "js/vendor/three-0.158.0/examples/jsm/misc/GPUComputationRenderer.js"` and `git diff --stat` for background.js — record in the task report; the vendored byte size goes in the commit body (spec §3.6). `git add js/rivulet.mjs js/vendor/three-0.158.0/examples/jsm/misc/GPUComputationRenderer.js js/background.js js/boot.mjs index.html tools/verify-site-hardening.js` and commit EXACTLY:
```
feat(v33f): rivulet-glass grabpass behind RIVULET_GATE — 64×64 GPGPU sim, metaball refraction; desktop 2D glass retired

Vendored three r158 examples/jsm/misc/GPUComputationRenderer.js: <measured N> bytes
(unpkg three@0.158.0 == the r158 tag; sha256 recorded in the task report).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```
(`<measured N>` is Step 17's `wc -c` output — replace before committing; a commit with the literal placeholder is a task failure.)

---

### Task 7 (v33g): Campaign close-out

Spec anchors (BINDING): §3.7, §4 (full contract), §8 (gate pile). No code files. No harness edits (the count of record stays at the Task-6 final — expected 48).

**Files:**
- Modify: `docs/superpowers/specs/2026-07-08-v32-law-addendum.md` (append `## v3.3 close-out measurements` at end of file, below the v3.2r close-out section).
- Modify (conditional): `.gitignore` (only if Task 1 did not already ignore `docs/superpowers/gates/v33/` — Step 2 checks).
- Create (git-ignored, NOT committed): `docs/superpowers/gates/v33/GATE-PILE.md` + the close-out capture set `closeout-v33-*.png`.

**Interfaces:**
- *Consumes:* the six feature commits v33a–f on `v33-rain`; the Task-1 pre-campaign baseline medians (`base-*.png` set) + Task 1's `'rain-streaks'` visibility lever (rain A/B re-run — the snippet is reproduced in Step 6, no cross-reading needed); `window.__rivulet` (Task 6); Task 6's fps medians + coverage readings + `f-rivulet-on.png`/`f-rivulet-fallback-canvas.png` pair; Task 2's during-flash capture set + p95 numbers + control-arm status; Task 5's parallax parity captures; the v3.2r close-out numbers (law addendum, provenance context); `tools/frame-luminance.mjs`; the §4 common procedure.
- *Produces:* law-addendum section `## v3.3 close-out measurements` (committed — the new measurement context of record); `docs/superpowers/gates/v33/GATE-PILE.md` with spec-§8 items (1)–(7) (git-ignored owner artifact); commit 7. **The campaign stops here — no push, no PR, until the owner rules on the pile.**

**What and why (spec §3.7):** measurements per the full §4 contract vs the Task-1 pre-campaign baseline (v3.2r numbers as inherited provenance), letter-criterion verdicts reported as-measured — v3.2r style: no renaming, no averaging away, below-resolution deltas marked unresolvable and never cited as fact — plus the gate-pile addendum for the owner's board verdict.

- [ ] **Step 1: preflight.** From repo root:
```bash
git status --porcelain          # expect: empty (tree clean)
git log --oneline -7            # expect: the six feat(v33a..v33f) commits atop b3d4067
node tools/verify-site-hardening.js; echo "exit=$?"   # expect: ALL PASS at the Task-6 count (expected 48), exit=0
node --check js/background.js && node --check js/app.js && node --check js/effects.js \
  && node --check js/boot.mjs && node --check js/rivulet.mjs && echo SYNTAX-CLEAN
```
Expect `SYNTAX-CLEAN` (background/app/effects parse as scripts; the two `.mjs` parse as ESM). Record the harness count — it is the number the addendum's build line cites.
- [ ] **Step 2: gates-dir ignore guard.** `git check-ignore -q docs/superpowers/gates/v33/x.png && echo IGNORED || echo ADD-IGNORE`. If `ADD-IGNORE` (Task 1 omitted it), edit `.gitignore` old_string:
```
# v3.2 gate screenshots (owner end-of-pass review artifacts; heavy PNGs, not site assets)
docs/superpowers/gates/v32/
```
new_string:
```
# v3.2 gate screenshots (owner end-of-pass review artifacts; heavy PNGs, not site assets)
docs/superpowers/gates/v32/

# v3.3 gate screenshots (same class)
docs/superpowers/gates/v33/
```
(`mkdir -p docs/superpowers/gates/v33` if missing. Expected outcome: `IGNORED` — Task 1 Step 2 added the line.)
- [ ] **Step 3: session hygiene + serve.** `python3 -m http.server 8765 --bind 127.0.0.1` from repo root if dead. ONE tab for the whole luminance session; close every stale QA tab first. Record in the report: viewport, DPR, and the live cache-busts (read them off `index.html` + `js/boot.mjs` at HEAD — expected `site.css?v=3.30`, `boot.mjs?v=29`, `V = { bg:'6.0', boot:'3.1', cursor:'3.1', fx:'3.8', app:'4.3' }`; cite ACTUAL values).
- [ ] **Step 4: desktop close-out captures (§8b/v3.2r procedure, reproduced exactly).** Device-metrics emulation **1440×743 CSS px @ DPR 2** (2880×1486 captures). For EACH of 15 captures: fresh hard reload (`ignoreCache`) → 11 s settle post-boot → scroll to the section → verify landing via `evaluate_script` (hero `scrollTo(0,0)` → `scrollY === 0`; `#gallery` and `#projects` via `scrollIntoView` — record the actual `scrollY` + element `top` px, they will differ from v3.2r's 3310/6707.5 if page height moved) → 11 s settle post-scroll → capture. Files: `docs/superpowers/gates/v33/closeout-v33-{hero,projects,gallery}-{1..5}.png`. Run `node tools/frame-luminance.mjs` on all 15; build the per-section medians + spreads table (mean / p50 / p95 / warmShare). Zero console messages across the session.
- [ ] **Step 5: floors verdict (§4.1 — build error, not gate-pile).** p50 medians MUST be exactly **hero 8 / projects 7 / gallery 9**. Any violation fails the close-out outright: STOP, bisect the offending task, fix before proceeding.
- [ ] **Step 6: rain gate re-run (§4.2 at v33g).** Same session, 5 interleaved pairs. First capture the scene reference via Task 1's transient hook (reproduced verbatim) — `evaluate_script`:
```js
(() => { const T = window.THREE, p = T.Object3D.prototype, orig = p.onBeforeRender;
  p.onBeforeRender = function (r, s) { window.__scn = s; p.onBeforeRender = orig; };
  return 'hooked'; })()
```
wait 300 ms, `window.__scn ? 'captured' : 'missed'` → `'captured'`. Per pair: fresh hard reload (re-hook after each reload) → 11 s settle → verify `scrollY === 0` → capture ON → `window.__scn.getObjectByName('rain-streaks').visible = false` → 1 s → capture OFF → `.visible = true`. Files `closeout-v33-rainAB-{on,off}-{1..5}.png`. Δᵢ = mean(on) − mean(off); **median pairwise Δ ≤ 0** (the current build's bar is −0.01). A Δ in (0, resolution) fails the letter → GATE-PILE item 3 with variance analysis. Note for the record: with `RIVULET_GATE` ON the desktop 2D canvas is retired, and the rivulet pass (rain-keyed) stays live in BOTH arms — the sanctioned isolation, exactly as v3.2r kept the droplet glass live in both arms.
- [ ] **Step 7: perf spot-check (§4.4).** SEPARATE `?sceneDebug=1` session: hard reload, hero at rest, 30 s settle, 5 readings of `window.__sceneDebug().fps` ≥3 s apart → median. Compare against Task 6's same-machine enabled-arm median as context (cross-session, so REPORT ONLY — the binding §4.4 gates already ran same-session inside Tasks 1 and 6; this is the spec's spot-check, not a letter gate). Record.
- [ ] **Step 8: mobile sweep (390×844 @ DPR 2 mobile+touch).** Hard reload, 11 s settle: scene alive; the M3 LITE glass live (`document.querySelector('.scene-droplets').width === 585`); `list_network_requests` → zero rivulet/GPUComputationRenderer requests; walk hero → gallery → contact; capture `closeout-v33-mobile-hero.png`; zero console.
- [ ] **Step 9: full desktop sweep + reduced-motion.** (a) Section walk home→about→work→gallery→projects→contact at 1440×743: the boxed state-word fires exactly ONCE per section change (class MutationObserver probe on `.state-flash`, the v3.2r method) — one signal per lock, with Task 2's `wordT` suppression live underneath; lightbox open/close clean (aria/inert both ways); contact downlink observed (LOS-gated — armed on entry, fires when Tokyo faces). (b) Reduced-motion (matchMedia initScript override, `?sceneDebug=1` page): SCENE=REDUCED, `spinY` constant over 1.5 s, page revealed, droplets null, no rivulet request, zero console → `closeout-v33-reduced-static.png`. Zero console in every state.
- [ ] **Step 10: letter-criterion verdicts (v3.2r style — honest, as measured).** Write the verdicts against BOTH reference sets: primary = the Task-1 pre-campaign baseline (same campaign, same procedure); provenance context = the v3.2r close-out (hero 18.54/8/77/0.0086 · projects 21.96/7/114/0.0028 · gallery 38.21/9/120/0.0015). Rules (§1.4): per-section mean/warmShare/p95 deltas reported exactly; anything inside the documented per-frame spread (hero σ ≈ 0.4–1.2, projects ≈ 1.17, gallery ≈ 0.72) is marked **below resolution — not citable as a real change**; the §4.2 rain Δ and §4.1 floors get explicit PASS/FAIL lines; every FAIL routes to GATE-PILE item 3 with its variance analysis; no criterion renamed, none averaged away.
- [ ] **Step 11: assemble the GATE-PILE.** Write `docs/superpowers/gates/v33/GATE-PILE.md` (git-ignored) with EXACTLY the spec-§8 minimum, numbered:
```markdown
# v3.3 GATE-PILE — owner verdicts required before push/PR

1. **M10 rivulet keep/kill.** ON vs fallback: `f-rivulet-on.png` vs
   `f-rivulet-fallback-canvas.png` (+ `f-sim-seq-{1..5}.png`, `f-limb-refraction.png`).
   Numbers: coverage max <measured> (≤ 0.05), fps enabled/disabled medians
   <measured>/<measured>, interleaved hero Δ median <measured>. The LITE
   double-implementation note: with the gate ON, desktop runs the GPU pass and
   LITE keeps the M3 canvas — two glass implementations alive, one per tier;
   the research's alternative (delete LITE glass entirely) stays a one-line
   owner call. Kill = RIVULET_GATE false + ?v= bump (fallback pre-built).
2. **M2 during-flash feel.** v33b's engineered-flash capture set + hero p95
   median <measured> vs the ≤110 cap; control-arm (uFlash=0) result <measured>
   and its routing per §4.3.
3. **Letter-criterion fails, as measured.** <Step-10 FAIL lines verbatim, with
   variance analysis; empty section if none — state "none" explicitly.>
4. **M6 parallax parity captures.** <v33e's archived computed-style parity set.>
5. **Taste-ambiguous flags from the implementers.** <collected from task
   reports — at minimum: v33e's reduced-motion cross-engine divergence
   (ruling 1) and v33d's beat-spacing ruling; state "none" explicitly if
   nothing else surfaced.>
6. **Deferred Package L reminder.** M7 wet-ground band + splash landings
   (carries the lightning-sprite retirement pairing), M8 grid-ripple, M9
   bloom-streak shafts — owner-sequenced, NOT closed; enhancement-brief owner
   questions 1–4 remain open.
7. **M1 scrub-feel constant (enhancement-brief open question 6).** Shipped
   τ ≈ 0.125 s (`dt * 8`, background.js) sits between the brief's taste options
   (≈ 0.14 vs cinematic ≈ 0.08) — owner picks live on the board; a retune is a
   one-const change, outside this campaign's build scope.
```
Every `<measured>`/`<...>` field is filled from this session's numbers/artifacts before the step is checked off — a surviving angle-bracket field is a task failure (`grep -c '<measured' docs/superpowers/gates/v33/GATE-PILE.md` → 0).
- [ ] **Step 12: append the law-addendum section.** At the END of `docs/superpowers/specs/2026-07-08-v32-law-addendum.md` (below `### Pointers to amended criteria…`), append — filling every `«…»` marker from the session before commit:
```markdown

## v3.3 close-out measurements (2026-«date», Task v33g, branch v33-rain, HEAD «sha», tree clean)

**Build:** bg «V.bg» / app «V.app» / fx «V.fx» / `site.css?v=«css»` / `boot.mjs?v=«boot»` / `rivulet.mjs?v=1` (cache-busts confirmed loading on the measured page). Harness **«N»/«N», exit 0**; `node --check` clean on background/app/effects (script) + boot.mjs/rivulet.mjs (ESM). RIVULET_GATE **ON** (the shipped state) for every capture. Campaign byte ledger: «git diff --stat b3d4067..HEAD summary line» (vendored GPUComputationRenderer «bytes» B; js/rivulet.mjs «bytes» B).

**Method (per §8b/v3.2r, reproduced):** `http://127.0.0.1:8765/index.html`, ONE tab, stale QA tabs closed. Viewport 1440×743 CSS px @ DPR 2 via device-metrics emulation (2880×1486 captures). Fresh hard-reload (`ignoreCache`) before EVERY capture; 11 s settle post-boot and post-scroll; scroll landing verified per capture (hero scrollY 0; `#gallery` scrollY «y», top «t» px; `#projects` scrollY «y», top «t» px). Median of 5 per metric, spreads reported; `node tools/frame-luminance.mjs`. Frames (git-ignored): `docs/superpowers/gates/v33/closeout-v33-*.png`. Zero console messages across every session.

### Luminance vs the v33a pre-campaign baseline (primary) and the v3.2r close-out (provenance)

| Section | mean (median) | mean spread | p50 | p50 spread | p95 | p95 spread | warmShare | warm spread |
|---|---|---|---|---|---|---|---|---|
| hero | «» | «» | «» | «» | «» | «» | «» | «» |
| projects | «» | «» | «» | «» | «» | «» | «» | «» |
| gallery | «» | «» | «» | «» | «» | «» | «» | «» |

### Letter-criterion verdicts (as measured; below-resolution marked, never cited)

«Step-10 verdict lines: §4.1 floors PASS/FAIL (p50 8/7/9); per-section mean/warm/p95 vs v33a baseline with resolution calls; every FAIL routed to GATE-PILE item 3.»

### Rain isolation A/B re-run (§4.2 at close-out)

«5-pair table on/off/Δ» — medians: on «», off «», pairwise Δ median «» (bar: ≤ 0; v3.2r context −0.01). «Result sentence, v3.2r-style.» Note: desktop 2D canvas retired behind RIVULET_GATE; the rivulet pass stayed live in both arms (rain-keyed, sanctioned isolation).

### Rivulet grabpass (M10) numbers of record

Coverage readback max «» (law ≤ 0.05); fps medians enabled «» / disabled «» (Task-6 same-session gate PASSED at ≥ −2 fps; this close-out spot-check «»); interleaved pass-on/off hero Δ median «» (Task 6). Taste verdict → GATE-PILE item 1.

### Mobile + reduced-motion sweeps

«390×844 sweep result: scene alive, M3 LITE glass live (canvas 585 px), zero rivulet requests, zero console; capture names.» «Reduced-motion: SCENE=REDUCED static frame, droplets null, no rivulet fetch, zero console; capture name.» «Desktop section-walk: state-word once per change, lightbox clean, downlink observed.»

### Gate pile

Assembled at `docs/superpowers/gates/v33/GATE-PILE.md` (git-ignored, 7 items per spec §8). The campaign stops here — no push, no PR, until the owner rules.
```
Then verify no marker survived: `grep -c '«' docs/superpowers/specs/2026-07-08-v32-law-addendum.md` → **0**.
- [ ] **Step 13: final green + commit.** `node tools/verify-site-hardening.js` → ALL PASS at the recorded count, exit 0 (docs commits must not move it). `git add docs/superpowers/specs/2026-07-08-v32-law-addendum.md` (plus `.gitignore` iff Step 2 edited it — confirm `git status --porcelain` shows ONLY these; the gates dir must be ignored, not staged) and commit EXACTLY:
```
docs(v33g): close-out — measurements vs pre-campaign baseline, letter verdicts, gate pile

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```
**STOP. No push. No PR.** The board waits for the owner's verdict on the 7-item pile.
