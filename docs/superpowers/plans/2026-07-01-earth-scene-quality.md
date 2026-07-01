# Earth Scene Quality Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Three.js earth scene so it is sharper, more personal, diagnosable, and still lightweight.

**Architecture:** Keep the static no-build architecture and improve `js/background.js` in place. Add helper boundaries inside the existing IIFE, then connect section changes from `js/effects.js` through a tiny optional scene API.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, generated global Three.js r158 vendor build, browser canvas textures, `agent-browser` for visual verification.

## Global Constraints

- Do not add a build step.
- Do not add npm dependencies.
- Keep `index.html` usable from `file://`.
- Do not fetch live data or external scene assets at runtime.
- Keep `#scene-root` decorative and `aria-hidden="true"`.
- Preserve reduced-motion behavior with a meaningful static frame.
- Preserve LITE mode for coarse pointers and screens `max-width: 760px`.
- Fix or precisely identify the Three.js `computeBoundingSphere()` `NaN` warning before adding visual complexity.

---

## File Structure

- Modify `js/background.js`: scene diagnostics, structured place data, place nodes, coastline particle attribute, quality profile, focus API, render-loop updates.
- Modify `js/effects.js`: call `window.__sceneFocus(active)` when the active section changes, guarded so the page works if the scene is unavailable.
- Do not modify `index.html` unless verification proves a script load or metadata issue blocks the scene upgrade.
- Do not modify `css/site.css` for this pass unless visual QA proves the scene overlaps fixed chrome.

## Task 1: Add Geometry Names And Finite-Value Diagnostics

**Files:**
- Modify: `js/background.js:32-69`
- Modify: `js/background.js:103-134`
- Modify: `js/background.js:155-158`
- Modify: `js/background.js:164-168`
- Modify: `js/background.js:221-233`
- Modify: `js/background.js:272-280`

**Interfaces:**
- Produces: `makeGeometry(name, values, itemSize) -> THREE.BufferGeometry`
- Produces: `setFiniteAttribute(geometry, attrName, values, itemSize) -> THREE.BufferAttribute`
- Produces: custom geometries with stable `.name` values

- [ ] **Step 1: Add helper functions after `patchShader()`**

Add this code after the existing `patchShader` function:

```javascript
  function setFiniteAttribute(geometry, attrName, values, itemSize) {
    for (let i = 0; i < values.length; i++) {
      if (!Number.isFinite(values[i])) {
        console.error('[scene] non-finite geometry value', {
          geometry: geometry.name || '(unnamed)',
          attribute: attrName,
          index: i,
          value: values[i],
        });
        return null;
      }
    }
    const attr = new THREE.BufferAttribute(values, itemSize);
    geometry.setAttribute(attrName, attr);
    return attr;
  }

  function makeGeometry(name, values, itemSize) {
    const geometry = new THREE.BufferGeometry();
    geometry.name = name;
    if (!setFiniteAttribute(geometry, 'position', values, itemSize)) return null;
    return geometry;
  }

  function nameObject(object, name) {
    object.name = name;
    if (object.geometry && !object.geometry.name) object.geometry.name = name + ':geometry';
    if (object.material && !object.material.name) object.material.name = name + ':material';
    return object;
  }
```

- [ ] **Step 2: Update `makeField()` to use named geometry**

Replace the geometry setup in `makeField(count, color, spread, size, op)` with:

```javascript
    const geo = new THREE.BufferGeometry();
    geo.name = 'field-' + color.toString(16);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * spread;
    if (!setFiniteAttribute(geo, 'position', pos, 3)) return new THREE.Group();
```

Change the return line to:

```javascript
    return nameObject(new THREE.Points(geo, mat), geo.name);
```

- [ ] **Step 3: Name all custom geometries**

Update custom geometry creation sites so each has a stable name:

```javascript
  const globeGeo = makeGeometry('earth-land-particles', gp, 3);
  if (!globeGeo) return;
  setFiniteAttribute(globeGeo, 'phase', gph, 1);
```

```javascript
    const g = makeGeometry('earth-graticule-lines', new Float32Array(segs), 3);
    if (!g) return;
```

```javascript
  const markGeo = makeGeometry('tokyo-marker-point', new Float32Array(TOKYO.toArray()), 3);
  if (!markGeo) return;
```

```javascript
  const arcGeo = makeGeometry('dallas-to-tokyo-arc', arcPts, 3);
  if (!arcGeo) return;
```

```javascript
  const cometGeo = makeGeometry('journey-comet-point', new Float32Array(3), 3);
  if (!cometGeo) return;
```

```javascript
  const streakGeo = makeGeometry('vertical-data-streaks', sp, 3);
  if (!streakGeo) return;
```

- [ ] **Step 4: Name added objects**

Wrap scene object creation with `nameObject`, for example:

```javascript
  spin.add(nameObject(new THREE.Points(globeGeo, globeMat), 'earth-land-particles'));
```

Apply the same pattern to graticule, Tokyo marker, arc line, comet, halo, orbital ring, grid, and streaks.

- [ ] **Step 5: Run a static syntax check**

Run:

```bash
node --check js/background.js
```

Expected: no syntax errors.

- [ ] **Step 6: Browser-check the original warning**

Run a local server:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open:

```bash
agent-browser open http://127.0.0.1:4173
agent-browser console --clear
agent-browser reload
agent-browser wait --load networkidle
agent-browser console
```

Expected: no `THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN` warning. If the warning remains, console output must include scene object names from the new diagnostics before moving to Task 2.

- [ ] **Step 7: Commit**

```bash
git add js/background.js
git commit -m "chore: add scene geometry diagnostics"
```

## Task 2: Introduce Structured Place Data

**Files:**
- Modify: `js/background.js:161-233`

**Interfaces:**
- Produces: `PLACES`
- Produces: `placeVector(place, radius)`
- Produces: `placeById(id)`
- Consumes: `toV3(lat, lon, r)`

- [ ] **Step 1: Add place constants before Tokyo marker setup**

Insert after the graticule block:

```javascript
  const PLACES = [
    {
      id: 'dallas',
      label: 'DALLAS',
      detail: '32.7767N 96.7970W - ORIGIN',
      lat: 32.7767,
      lon: -96.7970,
      color: 0xffd9a0,
      size: 0.14,
      primary: false,
    },
    {
      id: 'tokyo',
      label: 'TOKYO',
      detail: '35.6762N 139.6503E - CURRENT',
      lat: 35.6762,
      lon: 139.6503,
      color: AMBER,
      size: 0.22,
      primary: true,
    },
  ];

  const placeById = id => PLACES.find(place => place.id === id) || PLACES[1];
  const placeVector = (place, radius) => toV3(place.lat, place.lon, radius);
```

- [ ] **Step 2: Replace standalone Tokyo and Dallas vectors**

Replace:

```javascript
  const TOKYO = toV3(35.6762, 139.6503, R);
```

With:

```javascript
  const TOKYO_PLACE = placeById('tokyo');
  const DALLAS_PLACE = placeById('dallas');
  const TOKYO = placeVector(TOKYO_PLACE, R);
```

Replace:

```javascript
  const DALLAS = toV3(32.7767, -96.797, R);
```

With:

```javascript
  const DALLAS = placeVector(DALLAS_PLACE, R);
```

- [ ] **Step 3: Keep the arc behavior unchanged**

Run:

```bash
node --check js/background.js
```

Expected: no syntax errors.

- [ ] **Step 4: Browser-check Dallas-to-Tokyo arc still renders**

Run the local server and open the site. Reboot the sequence from the control deck or clear session storage in the console:

```bash
agent-browser eval "sessionStorage.removeItem('daikie-booted'); location.reload();"
agent-browser wait --load networkidle
agent-browser screenshot /private/tmp/earth-task2-hero.png
agent-browser console
```

Expected: the hero globe renders, the Dallas-to-Tokyo arc appears, and console has no new errors.

- [ ] **Step 5: Commit**

```bash
git add js/background.js
git commit -m "refactor: structure earth scene places"
```

## Task 3: Render Dallas And Tokyo As Place Nodes

**Files:**
- Modify: `js/background.js:161-204`
- Modify: `js/background.js:369-375`

**Interfaces:**
- Consumes: `PLACES`, `placeVector(place, R)`
- Produces: `placeNodesById`
- Produces: `setFocusedPlace(id, intensity)`

- [ ] **Step 1: Add a place node builder**

Replace the single Tokyo marker setup with:

```javascript
  const placeNodesById = {};

  function makePlaceNode(place) {
    const point = placeVector(place, R);
    const geo = makeGeometry(place.id + '-place-point', new Float32Array(point.toArray()), 3);
    if (!geo) return null;
    const mat = new THREE.PointsMaterial({
      color: place.color,
      size: place.size,
      transparent: true,
      opacity: place.primary ? 0.95 : 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const node = nameObject(new THREE.Points(geo, mat), place.id + '-place-node');
    node.userData.place = place;
    node.userData.baseOpacity = mat.opacity;
    spin.add(node);
    placeNodesById[place.id] = node;
    return node;
  }

  PLACES.forEach(makePlaceNode);
```

Keep `TOKYO` for rings and arc math.

- [ ] **Step 2: Add focus state**

Add near `let ping = 0;`:

```javascript
  let focusedPlaceId = 'tokyo';
  let focusFlash = 0;

  function setFocusedPlace(id, intensity) {
    focusedPlaceId = placeById(id).id;
    focusFlash = Math.max(focusFlash, intensity || 1);
  }
```

- [ ] **Step 3: Pulse focused place nodes in the render loop**

Add after the Tokyo node pulse block:

```javascript
    if (focusFlash > 0.01) focusFlash *= Math.pow(0.9, f);
    else focusFlash = 0;
    for (const id in placeNodesById) {
      const node = placeNodesById[id];
      const isFocused = id === focusedPlaceId;
      const base = node.userData.baseOpacity || 0.5;
      node.material.opacity = base + (isFocused ? focusFlash * 0.35 : 0);
      node.material.size = node.userData.place.size * (1 + (isFocused ? focusFlash * 0.35 : 0));
    }
```

- [ ] **Step 4: Verify both nodes are visible enough**

Run:

```bash
node --check js/background.js
agent-browser reload
agent-browser wait --load networkidle
agent-browser screenshot /private/tmp/earth-task3-nodes.png
agent-browser console
```

Expected: Tokyo remains prominent; Dallas is a quieter origin point and does not distract from the hero copy.

- [ ] **Step 5: Commit**

```bash
git add js/background.js
git commit -m "feat: add personal place nodes to earth scene"
```

## Task 4: Add Coastline Particle Classification

**Files:**
- Modify: `js/background.js:89-134`

**Interfaces:**
- Consumes: `landAt(lon, lat)`
- Produces: `landEdgeAt(lon, lat) -> 0 | 1`
- Produces: `edge` BufferAttribute on `earth-land-particles`

- [ ] **Step 1: Add `landEdgeAt()` after `landAt()`**

```javascript
  const LAND_STEP_LON = 360 / MW;
  const LAND_STEP_LAT = 180 / MH;
  const landEdgeAt = (lon, lat) => {
    if (!landAt(lon, lat)) return 0;
    return (
      !landAt(lon + LAND_STEP_LON, lat) ||
      !landAt(lon - LAND_STEP_LON, lat) ||
      !landAt(lon, lat + LAND_STEP_LAT) ||
      !landAt(lon, lat - LAND_STEP_LAT)
    ) ? 1 : 0;
  };
```

- [ ] **Step 2: Add edge attribute generation**

Change:

```javascript
  const gp = new Float32Array(GLOBE_N * 3), gph = new Float32Array(GLOBE_N);
```

To:

```javascript
  const gp = new Float32Array(GLOBE_N * 3), gph = new Float32Array(GLOBE_N), gedge = new Float32Array(GLOBE_N);
```

Inside the accepted land point block, after `gph[i] = ...`, add:

```javascript
    gedge[i] = landEdgeAt(lon, lat);
```

After `setFiniteAttribute(globeGeo, 'phase', gph, 1);`, add:

```javascript
  setFiniteAttribute(globeGeo, 'edge', gedge, 1);
```

- [ ] **Step 3: Update globe shader for edge emphasis**

Replace the globe vertex shader with:

```javascript
    vertexShader: `
      attribute float phase;
      attribute float edge;
      uniform float uTime, uPx;
      varying float vA;
      varying float vEdge;
      varying float vFacing;
      void main() {
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vec3 worldNormal = normalize((modelMatrix * vec4(normalize(position), 0.0)).xyz);
        vec3 viewDir = normalize(cameraPosition - worldPos);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vA = 0.55 + 0.45 * sin(uTime * 2.2 + phase);
        vEdge = edge;
        vFacing = smoothstep(-0.15, 0.65, dot(worldNormal, viewDir));
        gl_PointSize = (2.4 + 1.4 * vA + edge * 1.2) * uPx * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
```

Replace the globe fragment shader with:

```javascript
    fragmentShader: `
      varying float vA;
      varying float vEdge;
      varying float vFacing;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 base = mix(vec3(0.224, 0.941, 1.0), vec3(1.0, 0.62, 0.17), vEdge * 0.35);
        float facingAlpha = mix(0.18, 1.0, vFacing);
        float alpha = vA * (1.0 - d * 2.0) * (0.75 + vEdge * 0.25) * facingAlpha;
        gl_FragColor = vec4(base, alpha);
      }`,
```

- [ ] **Step 4: Verify coastlines are sharper without becoming noisy**

Run:

```bash
node --check js/background.js
agent-browser reload
agent-browser wait --load networkidle
agent-browser screenshot /private/tmp/earth-task4-coastlines.png
agent-browser console
```

Expected: land silhouettes read sharper than before, especially Japan and coastlines; back-side particles are dimmer than front-facing particles; console has no new errors.

- [ ] **Step 5: Commit**

```bash
git add js/background.js
git commit -m "feat: emphasize earth coastline particles"
```

## Task 5: Add Scene Focus API And Section Integration

**Files:**
- Modify: `js/background.js:262-264`
- Modify: `js/effects.js:119-125`

**Interfaces:**
- Produces: `window.__sceneFocus(sectionId)`
- Consumes: `window.__scenePing()`
- Consumes: `setFocusedPlace(id, intensity)`

- [ ] **Step 1: Add focus mapping in `js/background.js`**

Replace:

```javascript
  window.__scenePing = () => { ping = 1; };
```

With:

```javascript
  const sectionFocus = {
    home: 'tokyo',
    about: 'dallas',
    work: 'tokyo',
    gallery: 'tokyo',
    projects: 'dallas',
    contact: 'tokyo',
  };
  window.__scenePing = () => { ping = 1; };
  window.__sceneFocus = sectionId => {
    const placeId = sectionFocus[sectionId] || 'tokyo';
    setFocusedPlace(placeId, sectionId === 'home' ? 1.2 : 0.8);
    if (sectionId === 'home') {
      arcN = 0;
      arcArm = 0;
      arcGeo.setDrawRange(0, 0);
    }
  };
```

- [ ] **Step 2: Call focus API from `js/effects.js`**

In `frame()`, inside the existing `if (active !== lastActive)` block, after the `window.__scenePing()` call, add:

```javascript
      if (window.__sceneFocus) window.__sceneFocus(active);
```

The block should read:

```javascript
    if (active !== lastActive) {
      lastActive = active;
      const now = performance.now();
      if (window.__scenePing && now - lastPing > 600) { lastPing = now; window.__scenePing(); }
      if (window.__sceneFocus) window.__sceneFocus(active);
    }
```

- [ ] **Step 3: Verify guarded integration**

Run:

```bash
node --check js/background.js
node --check js/effects.js
agent-browser reload
agent-browser wait --load networkidle
agent-browser scroll down 900
agent-browser wait 500
agent-browser scroll down 900
agent-browser wait 500
agent-browser console
```

Expected: no console errors while scrolling through sections.

- [ ] **Step 4: Commit**

```bash
git add js/background.js js/effects.js
git commit -m "feat: connect page sections to earth scene focus"
```

## Task 6: Make The Callout Follow Focused Place

**Files:**
- Modify: `js/background.js:182-204`
- Modify: `js/background.js:369-375`

**Interfaces:**
- Consumes: `focusedPlaceId`
- Consumes: `placeById(id)`
- Produces: `drawCallout(place)`

- [ ] **Step 1: Replace hardcoded callout text drawing**

Inside the `callout` IIFE, replace `draw()` with:

```javascript
    function draw(place) {
      const target = place || TOKYO_PLACE;
      const cx = cv.getContext('2d');
      cx.clearRect(0, 0, cv.width, cv.height);
      cx.font = '500 24px "JetBrains Mono", monospace';
      cx.fillStyle = '#ff9e2c';
      cx.shadowColor = 'rgba(255,158,44,0.7)';
      cx.shadowBlur = 12;
      cx.fillText(target.detail, 8, 38);
      tex.needsUpdate = true;
    }
```

Return both sprite and draw function:

```javascript
    return { sprite: sp, draw };
```

Update references from `callout.material` and `callout.position` to `callout.sprite.material` and `callout.sprite.position`. This includes the reduced-motion branch, which should set:

```javascript
    callout.sprite.material.opacity = 0.85;
```

- [ ] **Step 2: Update callout when focus changes**

Inside `setFocusedPlace`, after setting `focusedPlaceId`, add:

```javascript
    if (callout && callout.draw) callout.draw(placeById(focusedPlaceId));
```

- [ ] **Step 3: Move the callout toward the focused place in the loop**

Replace:

```javascript
    callout.material.opacity = facing * facing * 0.9;
```

With:

```javascript
    const focusedPlace = placeById(focusedPlaceId);
    const focusedVector = placeVector(focusedPlace, R);
    const focusedAngle = Math.atan2(focusedVector.z, focusedVector.x);
    const focusedFacing = Math.max(0, Math.sin(focusedAngle - spin.rotation.y));
    callout.sprite.position.copy(focusedVector).multiplyScalar(1.22).add(new THREE.Vector3(0, 0.45, 0));
    callout.sprite.material.opacity = focusedFacing * focusedFacing * (focusedPlace.primary ? 0.9 : 0.55);
```

- [ ] **Step 4: Verify callout behavior**

Run:

```bash
node --check js/background.js
agent-browser reload
agent-browser wait --load networkidle
agent-browser eval "window.__sceneFocus && window.__sceneFocus('projects')"
agent-browser wait 500
agent-browser screenshot /private/tmp/earth-task6-dallas-callout.png
agent-browser eval "window.__sceneFocus && window.__sceneFocus('contact')"
agent-browser wait 500
agent-browser screenshot /private/tmp/earth-task6-tokyo-callout.png
agent-browser console
```

Expected: Dallas callout appears subtler than Tokyo; Tokyo remains the default dominant callout.

- [ ] **Step 5: Commit**

```bash
git add js/background.js
git commit -m "feat: focus earth callout by place"
```

## Task 7: Add Explicit Quality Profiles

**Files:**
- Modify: `js/background.js:12-20`
- Modify: `js/background.js:66-68`
- Modify: `js/background.js:273`

**Interfaces:**
- Produces: `quality`
- Consumes: `quality.globeParticles`, `quality.fieldCounts`, `quality.streaks`, `quality.dpr`

- [ ] **Step 1: Add quality profile function near media queries**

Replace current `LITE`, `dpr`, and `GLOBE_N` setup with:

```javascript
  const LITE = coarse || small;
  function getQualityProfile() {
    if (reduced) return {
      name: 'reduced',
      dpr: 1,
      globeParticles: 2600,
      fieldCounts: [360, 180, 120],
      streaks: 12,
    };
    if (LITE) return {
      name: 'lite',
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      globeParticles: 2600,
      fieldCounts: [1100, 520, 360],
      streaks: 22,
    };
    return {
      name: 'high',
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      globeParticles: 7000,
      fieldCounts: [2600, 1200, 900],
      streaks: 40,
    };
  }
  const quality = getQualityProfile();
  const dpr = quality.dpr;
  let w = innerWidth, h = innerHeight;
  const R = 3.2;
  const GLOBE_N = quality.globeParticles;
```

- [ ] **Step 2: Use field counts from profile**

Replace field construction with:

```javascript
  const fieldCyan = makeField(quality.fieldCounts[0], CYAN, 46, 0.05, 0.9);
  const fieldAmber = makeField(quality.fieldCounts[1], AMBER, 36, 0.06, 0.8);
  const fieldDeep = makeField(quality.fieldCounts[2], 0x6fb7ff, 70, 0.035, 0.5);
```

- [ ] **Step 3: Use streak count from profile**

Replace:

```javascript
  const SN = LITE ? 22 : 40; const sp = new Float32Array(SN * 6);
```

With:

```javascript
  const SN = quality.streaks; const sp = new Float32Array(SN * 6);
```

- [ ] **Step 4: Verify all profiles**

Run:

```bash
node --check js/background.js
agent-browser set viewport 1440 900
agent-browser set media dark
agent-browser reload
agent-browser wait --load networkidle
agent-browser screenshot /private/tmp/earth-task7-desktop.png
agent-browser set viewport 390 844
agent-browser reload
agent-browser wait --load networkidle
agent-browser screenshot /private/tmp/earth-task7-mobile.png
agent-browser set media dark reduced-motion
agent-browser reload
agent-browser wait --load networkidle
agent-browser screenshot /private/tmp/earth-task7-reduced.png
agent-browser console
```

Expected: desktop, mobile, and reduced-motion paths render nonblank, correctly framed scenes with no new console errors.

- [ ] **Step 5: Commit**

```bash
git add js/background.js
git commit -m "refactor: define earth scene quality profiles"
```

## Task 8: Final Verification And Handoff Notes

**Files:**
- Modify: `docs/superpowers/plans/2026-07-01-earth-scene-quality.md` only if execution findings require notes.

**Interfaces:**
- Consumes: completed Tasks 1-7
- Produces: final verification evidence in the implementing session's final response

- [ ] **Step 1: Static syntax checks**

Run:

```bash
node --check js/background.js
node --check js/effects.js
```

Expected: both commands pass with no syntax errors.

- [ ] **Step 2: Serve the site**

Run:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Expected: server starts on `http://127.0.0.1:4173`.

- [ ] **Step 3: Browser runtime verification**

Run:

```bash
agent-browser open http://127.0.0.1:4173
agent-browser console --clear
agent-browser reload
agent-browser wait --load networkidle
agent-browser console
```

Expected: no scene JavaScript errors and no `computeBoundingSphere()` `NaN` warning.

- [ ] **Step 4: Desktop visual verification**

Run:

```bash
agent-browser set viewport 1440 900
agent-browser set media dark
agent-browser reload
agent-browser wait --load networkidle
agent-browser screenshot /private/tmp/earth-final-desktop.png
```

Expected: hero earth is visible, globe is not clipped awkwardly, Dallas/Tokyo story remains legible, and nav does not overlap critical scene labels.

- [ ] **Step 5: Mobile visual verification**

Run:

```bash
agent-browser set viewport 390 844
agent-browser reload
agent-browser wait --load networkidle
agent-browser screenshot /private/tmp/earth-final-mobile.png
```

Expected: LITE scene renders nonblank, nav remains usable, and globe does not crowd hero text.

- [ ] **Step 6: Reduced-motion visual verification**

Run:

```bash
agent-browser set media dark reduced-motion
agent-browser reload
agent-browser wait --load networkidle
agent-browser screenshot /private/tmp/earth-final-reduced.png
```

Expected: static frame shows the globe, Tokyo focus, and Dallas-to-Tokyo journey without animation.

- [ ] **Step 7: Local vitals smoke test**

Run:

```bash
agent-browser vitals http://127.0.0.1:4173/ --json
```

Expected: CLS remains `0`. LCP and FCP should remain fast on the local static server; investigate if either becomes clearly worse than the pre-plan baseline of roughly `116ms`.

- [ ] **Step 8: Final commit**

```bash
git status --short
git add js/background.js js/effects.js
git commit -m "feat: upgrade personal earth scene"
```

Expected: commit succeeds and `git status --short` is clean.
