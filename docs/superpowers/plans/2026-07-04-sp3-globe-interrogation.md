# SP3 — Globe Interrogation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline) or superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the Tokyo data-globe interrogatable with the pointer — hover a region → a reticle + live coordinate readout snaps to it; dwell → the existing scan-tag fires; tap → the region's content (gallery photo → lightbox; tokyo/dallas → scroll `#about`) — plus full keyboard/AT accessibility, touch, and reduced-motion.

**Architecture:** All edits in `js/background.js` (+ a small injected `<style>`). A new analytic-sphere raycast (`spin.worldToLocal`, dot-nearest over an `INTERROGABLE` table built from existing `PLACES`+`GALLERY_PLACES`) drives a hover→focus→select state machine. The reticle/coordinate/leader HUD is a DOM overlay that snaps to the acquired place's projected screen position (crisp, accessible). Focus reuses the existing 3D `scanTag`. Accessibility mirrors globe focus onto the already-wired gallery/project DOM controls.

**Tech Stack:** three.js r158 (global `window.THREE`), vanilla JS, DOM overlay HUD, no build.

**Spec:** `docs/superpowers/specs/2026-07-04-sp3-globe-interrogation-design.md` (committed `726149e`).

## Global Constraints

- **Pure no-build**; every new 3D mark (none planned — HUD is DOM) would be additive + `depthWrite:false`. **No new render targets/composers, no particle-count change, no SP2 shading regression.**
- **Pick through `spin`, never `coreGroup`** (`spin` owns `rotation.y` `:1681`; the `coreGroup.worldToLocal` at `:1032/:1041` is satellite math — do not copy).
- **Separate flipped-NDC pointer** `ptr` — the existing `mouse` (`:1440`) is not NDC (Y not flipped).
- **Animate the focus only:** hover reticle *snaps* (no easing/strobe); only the dwell scan-tag animates. Debounce hover ~90 ms, dwell ~400 ms.
- **Accessibility is mandatory**, gated `!reduced` (NOT `!LITE`). One polite `aria-live`. `:focus-visible`. `Escape` clears.
- **Wire only real content:** 12 gallery photos → lightbox; tokyo/dallas → `#about`; projects/work/districts NOT selectable.
- **Reduced-motion** (`reduced` `:12`): the loop never runs (early-return `:1616`), so no pick loop — DOM mirrors + `aria-live` still work. **Touch/`coarse`** (`:13`): no per-frame hover; tap = single pick → select.
- **Dev cache:** hard-reload (Cmd+Shift+R) to pick up `background.js`; bump `?v=` on deploy.
- **Verify:** `node --check` + local http server + Chrome. Interaction is timing-sensitive to automate, so expose test hooks (`window.__pick`, `window.__interrogateAt(clientX,clientY)`) and drive via `javascript_tool` + synthesized pointer events + screenshots.

**Key facts (verified in source):**
- `toV3(lat,lon,r)` (`:187`): `p=(90-lat)π/180, q=(lon+180)π/180; v=(-r·sin p·cos q, r·cos p, r·sin p·sin q)`.
- Hierarchy: `coreGroup` (offset `:159`) → `spin` (`:161`, `rotation.y` `:1681`); `R=3.2` (`:63`).
- `__scanPlace(lat,lon,en,jp)` (`:1168`, null under reduced) fires the 3D tag. `GALLERY_PLACES` (`:1110-1123`, 12 entries). Gallery DOM: `.gallery-grid .shot` with `data-src` matching `gallery-\d+` (`:1217-1218`).

---

### Task 0: Pick math + `INTERROGABLE` data + test hook (no UI)

**Files:** Modify `js/background.js` — insert after the `mouse`/`pointermove` block (`:1440`).

**Interfaces — Produces:** module-scope `ptr` (flipped NDC), `INTERROGABLE` (array of `{id,label,jp,lat,lon,kind,dir:Vector3,domRef?}`), `vecToLatLon(v)→{lat,lon}`, `pickPlace()→{place,lat,lon}|null`, `window.__pick`/`window.__interrogateAt` test hooks.

- [ ] **Step 1: Insert the pick core.** After `js/background.js:1440` (the `pointermove` line that sets `mouse`), add:

```js
  // ---- SP3 globe interrogation: analytic-sphere pick -> nearest place ----
  const ptr = { x: 0, y: 0, inside: false };   // TRUE flipped-NDC (mouse[:1440] is not NDC)
  addEventListener('pointermove', e => {
    ptr.x = (e.clientX / innerWidth) * 2 - 1;
    ptr.y = -(e.clientY / innerHeight) * 2 + 1;
    ptr.inside = true;
  });
  addEventListener('pointerleave', () => { ptr.inside = false; });

  // vecToLatLon = exact inverse of toV3 (:187)
  function vecToLatLon(v) {
    const n = _pk.copy(v).normalize();
    const lat = 90 - Math.acos(Math.max(-1, Math.min(1, n.y))) * 180 / Math.PI;
    let lon = Math.atan2(n.z, -n.x) * 180 / Math.PI - 180;
    if (lon < -180) lon += 360; else if (lon > 180) lon -= 360;
    return { lat, lon };
  }

  // INTERROGABLE = plumbing over existing data (no authored content)
  const INTERROGABLE = [];
  PLACES.forEach(p => INTERROGABLE.push({
    id: p.id, label: p.label, jp: p.id === 'tokyo' ? '東京' : '', lat: p.lat, lon: p.lon,
    kind: p.id === 'tokyo' ? 'tokyo' : 'dallas', dir: toV3(p.lat, p.lon, 1),
  }));
  for (const key in GALLERY_PLACES) {
    const g = GALLERY_PLACES[key];
    const el = document.querySelector('.gallery-grid .shot[data-src*="' + key + '"]');
    INTERROGABLE.push({ id: key, label: g.en, jp: g.jp, lat: g.lat, lon: g.lon,
      kind: 'photo', dir: toV3(g.lat, g.lon, 1), domRef: el });
  }

  const _ray = new THREE.Raycaster();
  const _sph = new THREE.Sphere();
  const _pk = new THREE.Vector3(), _hit = new THREE.Vector3(), _cw = new THREE.Vector3();
  const PICK_COS = Math.cos(8 * Math.PI / 180);   // ~8deg snap radius
  function pickPlace() {
    _ray.setFromCamera(ptr, camera);
    _sph.set(coreGroup.getWorldPosition(_cw), R);
    if (!_ray.ray.intersectSphere(_sph, _hit)) return null;   // pointer misses the globe
    spin.worldToLocal(_hit);                                   // through spin, NOT coreGroup
    const dir = _hit.normalize();
    let best = null, bestDot = PICK_COS;
    for (const it of INTERROGABLE) { const d = dir.dot(it.dir); if (d > bestDot) { bestDot = d; best = it; } }
    const ll = vecToLatLon(dir);
    return best ? { place: best, lat: ll.lat, lon: ll.lon } : null;
  }
  window.__pick = pickPlace;
  window.__interrogateAt = (cx, cy) => { ptr.x = (cx / innerWidth) * 2 - 1; ptr.y = -(cy / innerHeight) * 2 + 1; ptr.inside = true; return pickPlace(); };
```

- [ ] **Step 2: Syntax.** `node --check js/background.js` → `SYNTAX_OK`.
- [ ] **Step 3: Verify pick.** Server up; hard-reload `?sceneDebug=1&cb=sp3t0`. In `javascript_tool`: find Tokyo's node screen pos and pick it — `window.__pick` exists; calling `window.__interrogateAt(x,y)` over the globe returns an object with `place`/`lat`/`lon`. Sanity: pick near the globe centre resolves *some* place or null cleanly; no console errors; `__sceneDebug` parity (7000/dpr2/high). (Full hover UX lands Task 1.)
- [ ] **Step 4: Commit.**
```bash
git add js/background.js && git commit -m "feat(sp3): analytic-sphere pick + INTERROGABLE table + vecToLatLon (no UI)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 1: Hover reticle HUD (DOM overlay) + `interrogate()` in the loop

**Files:** Modify `js/background.js` — add HUD builder near Task 0 code; call `interrogate()` after `render()` (`:1740`).

**Interfaces — Consumes:** `pickPlace`, `camera`, `coreGroup`, `spin`, `R`, `coarse`. **Produces:** `interrogate(dt)`, DOM `#globe-hud` (reticle+coord+leader) & `#globe-live` (aria-live), module state `hoverId`/`hoverPlace`.

- [ ] **Step 1: HUD DOM + style.** In Task 0's block, add a builder and call it:

```js
  // DOM HUD overlay (crisp text + a11y). Snaps to the acquired place's projected screen pos.
  const hud = (function () {
    const style = document.createElement('style');
    style.textContent =
      '#globe-hud{position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;transition:opacity .12s}' +
      '#globe-hud.on{opacity:1}' +
      '#globe-hud .ret{position:absolute;transform:translate(-50%,-50%);width:34px;height:34px;margin-left:0}' +
      '#globe-hud .ret::before,#globe-hud .ret::after{content:"";position:absolute;background:rgba(57,240,255,.85)}' +
      '#globe-hud .ret::before{left:50%;top:0;width:1px;height:100%;transform:translateX(-50%)}' +
      '#globe-hud .ret::after{top:50%;left:0;height:1px;width:100%;transform:translateY(-50%)}' +
      '#globe-hud .box{position:absolute;width:34px;height:34px;transform:translate(-50%,-50%);' +
      'box-shadow:inset 0 0 0 1px rgba(57,240,255,.5);border-radius:2px}' +
      '#globe-hud .lead{position:absolute;height:1px;background:linear-gradient(90deg,rgba(57,240,255,.6),rgba(57,240,255,0));transform-origin:0 50%}' +
      '#globe-hud .lbl{position:absolute;transform:translateY(-50%);font:600 11px/1.35 "JetBrains Mono",monospace;' +
      'color:rgba(57,240,255,.92);letter-spacing:.08em;white-space:nowrap;text-shadow:0 0 8px rgba(57,240,255,.35)}' +
      '#globe-hud .lbl b{color:#ffd9a0;font-weight:600}' +
      '#globe-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}';
    document.head.appendChild(style);
    const root = document.createElement('div'); root.id = 'globe-hud';
    root.innerHTML = '<div class="ret"></div><div class="box"></div><div class="lead"></div><div class="lbl"></div>';
    document.body.appendChild(root);
    const live = document.createElement('div'); live.id = 'globe-live';
    live.setAttribute('aria-live', 'polite'); document.body.appendChild(live);
    return { root, ret: root.querySelector('.ret'), box: root.querySelector('.box'),
      lead: root.querySelector('.lead'), lbl: root.querySelector('.lbl'), live };
  })();
  const _proj = new THREE.Vector3();
  function fmtCoord(lat, lon) {
    return Math.abs(lat).toFixed(1) + (lat >= 0 ? 'N' : 'S') + ' ' + Math.abs(lon).toFixed(1) + (lon >= 0 ? 'E' : 'W');
  }
```

- [ ] **Step 2: `interrogate()` + hover debounce.** Add after the HUD builder:

```js
  let hoverPlace = null, hoverId = null, hoverPending = null, hoverPendT = 0;
  function interrogate(dt) {
    const r = ptr.inside ? pickPlace() : null;
    const id = r && r.place ? r.place.id : null;
    if (id !== (hoverPending && hoverPending.id)) { hoverPending = r; hoverPendT = 0; }   // debounce place-change
    else hoverPendT += dt;
    if ((hoverPending ? hoverPending.place.id : null) !== hoverId && hoverPendT >= 0.09) {
      hoverPlace = hoverPending; hoverId = hoverPlace ? hoverPlace.place.id : null;
      if (hoverPlace) hud.live.textContent = (hoverPlace.place.kind === 'photo' ? 'Gallery — ' : '') + hoverPlace.place.label;
    }
    if (!hoverPlace) { hud.root.classList.remove('on'); return; }
    // snap the reticle to the acquired place's projected screen position
    _proj.copy(hoverPlace.place.dir).multiplyScalar(R); spin.localToWorld(_proj); _proj.project(camera);
    if (_proj.z > 1) { hud.root.classList.remove('on'); return; }   // behind camera / far side
    const sx = (_proj.x * 0.5 + 0.5) * innerWidth, sy = (-_proj.y * 0.5 + 0.5) * innerHeight;
    hud.root.classList.add('on');
    hud.ret.style.left = hud.box.style.left = sx + 'px'; hud.ret.style.top = hud.box.style.top = sy + 'px';
    const lead = 46, lx = sx + 20, ly = sy - 20;
    hud.lead.style.left = (sx + 12) + 'px'; hud.lead.style.top = (sy - 12) + 'px';
    hud.lead.style.width = lead + 'px'; hud.lead.style.transform = 'rotate(-30deg)';
    hud.lbl.style.left = lx + lead * 0.9 + 'px'; hud.lbl.style.top = (ly - 8) + 'px';
    const p = hoverPlace.place;
    hud.lbl.innerHTML = '<b>' + p.label + '</b>' + (p.jp ? ' ' + p.jp : '') + '<br>' + fmtCoord(hoverPlace.lat, hoverPlace.lon);
  }
```

- [ ] **Step 3: Call it in the loop.** In `js/background.js`, find (`:1740-1741`):
```js
    render();
    if (droplets) droplets.update(dt);   // after render: droplet lenses sample THIS frame's buffer
```
Replace with:
```js
    render();
    if (droplets) droplets.update(dt);   // after render: droplet lenses sample THIS frame's buffer
    if (!coarse) interrogate(dt);         // SP3: pointer interrogation (touch uses tap-select, Task 3)
```

- [ ] **Step 4: Syntax + browser.** `node --check` → OK. Hard-reload `?sceneDebug=1&cb=sp3t1`. Move the pointer over the globe (synthesize `pointermove` at a place's screen pos via `javascript_tool`, then `interrogate(0.1)` won't run outside rAF — instead set `ptr` via `__interrogateAt` and screenshot after a moment). Expected: a crosshair reticle + box + leader + label ("SHIBUYA 渋谷 / 35.7N 139.7E") snaps onto the acquired place; moving off the globe hides it (`#globe-hud` loses `.on`); no drift as the globe spins; parity + no errors.
- [ ] **Step 5: Commit** `feat(sp3): hover reticle HUD + interrogate() pick loop`.

---

### Task 2: Focus (dwell) → reuse the 3D scan-tag

**Files:** Modify `js/background.js` — extend `interrogate()` with a dwell timer.

**Interfaces — Consumes:** `window.__scanPlace` (`:1168`), `window.__scanClear` (`:1194`), `hoverPlace`.

- [ ] **Step 1: Dwell → scan.** In `interrogate()`, after `hoverId` is settled, add dwell logic: track `dwellT` for the stable `hoverId`; at ≥0.40 s fire `__scanPlace(place.lat, place.lon, EN, JP)` once (guard with `scannedId`); when hover clears, `__scanClear()` and reset. Use the place's label for EN and `jp` for JP (photos have both; tokyo `東京`; dallas `''`). Exact insertion — replace the `if (!hoverPlace) { hud.root.classList.remove('on'); return; }` line with a version that also clears dwell + scan, and add the dwell block after the settle:
```js
    if (!hoverPlace) { hud.root.classList.remove('on'); if (scannedId) { window.__scanClear && window.__scanClear(); scannedId = null; } dwellT = 0; return; }
    // dwell -> focus scan-tag (the one animated step)
    if (hoverPlace.place.id === lastDwellId) dwellT += dt; else { dwellT = 0; lastDwellId = hoverPlace.place.id; if (scannedId && scannedId !== hoverPlace.place.id) { window.__scanClear && window.__scanClear(); scannedId = null; } }
    if (dwellT >= 0.40 && scannedId !== hoverPlace.place.id && window.__scanPlace) {
      const p = hoverPlace.place; window.__scanPlace(p.lat, p.lon, p.label, p.jp || ''); scannedId = p.id;
    }
```
and declare `let dwellT = 0, lastDwellId = null, scannedId = null;` alongside the other hover state.
- [ ] **Step 2: Syntax + browser.** `node --check` → OK. Hard-reload `?sceneDebug=1&cb=sp3t2`; set `ptr` onto a gallery place and hold ~0.5 s of loop time (wait), screenshot → the 3D scan-tag (bracket label + particle assembly) fires at that place. Moving away clears it. No errors.
- [ ] **Step 3: Commit** `feat(sp3): dwell-focus reuses the 3D scan-tag`.

---

### Task 3: Select (tap) → content dispatch + lightbox

**Files:** Modify `js/background.js` — add `pointerdown`/`pointerup`/`keydown` near Task 0 pointer block. First **confirm the lightbox opener**.

- [ ] **Step 1: Confirm lightbox trigger.** Run: `grep -nE "lightbox|\.shot|openShot|data-full|<dialog" js/*.js index.html` — determine what opening a gallery `.shot` does (click handler? function?). Record the opener. (Expectation: clicking a `.shot` opens the lightbox; if so, select → `domRef.click()`.)
- [ ] **Step 2: Select handlers.** After the `pointerleave` line from Task 0, add tap-vs-drag discrimination + dispatch:
```js
  let _downX = 0, _downY = 0, _downT = 0;
  addEventListener('pointerdown', e => { _downX = e.clientX; _downY = e.clientY; _downT = performance.now(); });
  addEventListener('pointerup', e => {
    if (Math.hypot(e.clientX - _downX, e.clientY - _downY) > 8) return;   // drag/parallax, not a tap
    ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1; ptr.inside = true;
    const r = pickPlace(); if (r && r.place) selectPlace(r.place);
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') { window.__scanClear && window.__scanClear(); hud.root.classList.remove('on'); } });
  function selectPlace(p) {
    if (p.kind === 'photo' && p.domRef) { p.domRef.click(); }                 // existing lightbox (Step 1)
    else if (p.kind === 'tokyo' || p.kind === 'dallas') {
      if (typeof setFocusedPlace === 'function') setFocusedPlace(p.id, 1);
      const about = document.getElementById('about'); if (about) about.scrollIntoView({ behavior: 'smooth' });
    }
  }
```
(If Step 1 shows the opener is NOT a `.shot` click, replace `p.domRef.click()` with the real opener call.)
- [ ] **Step 3: Syntax + browser.** `node --check` → OK. Hard-reload `?sceneDebug=1&cb=sp3t3`; synthesize a `pointerdown`+`pointerup` (same coords) on a gallery place → the lightbox opens (screenshot). A `pointerdown`→moved→`pointerup` (drag) does NOT select. Tokyo tap scrolls to `#about`. No errors.
- [ ] **Step 4: Commit** `feat(sp3): tap-select — gallery photo -> lightbox, tokyo/dallas -> #about`.

---

### Task 4: Accessibility (DOM focus mirrors + aria-live) + freebie fix

**Files:** Modify `js/background.js` — the DOM wiring block (`:1216-1231`).

- [ ] **Step 1: Regate + mirror + fix.** Replace the `if (!reduced && !LITE && scanTag) { ... }` block (`:1216-1231`) so the pointer scan stays `!reduced && !LITE` BUT the a11y mirrors run on `!reduced` (any device), and fix the project selector:
```js
  if (!reduced) {                                                 // a11y mirrors: not gated by LITE
    document.querySelectorAll('.gallery-grid .shot').forEach(el => {
      const key = ((el.dataset.src || '').match(/gallery-\d+/) || [])[0];
      const place = GALLERY_PLACES[key];
      if (!place) return;
      const enter = () => { window.__scanPlace && window.__scanPlace(place.lat, place.lon, place.en, place.jp); hud.live.textContent = 'Gallery — ' + place.en; };
      const leave = () => window.__scanClear && window.__scanClear();
      if (!LITE) { el.addEventListener('pointerenter', enter); el.addEventListener('pointerleave', leave); }
      el.addEventListener('focus', enter); el.addEventListener('blur', leave);   // keyboard/AT
      if (!el.hasAttribute('tabindex') && el.tagName !== 'A' && el.tagName !== 'BUTTON') el.setAttribute('tabindex', '0');
    });
    document.querySelectorAll('.projects .proj-grid').forEach(el => {
      const name = ((el.querySelector('.row-title, h3, .proj-name') || {}).textContent || 'PROJECT').trim();   // FIX: .row-title
      const year = ((el.querySelector('.proj-year') || {}).textContent || '').trim().slice(0, 4);
      const enter = () => window.__scanPlace && window.__scanPlace(35.6762, 139.6503, ('SIG: ' + name).toUpperCase().slice(0, 17), year ? 'PRJ//' + year : 'PRJ');
      const leave = () => window.__scanClear && window.__scanClear();
      if (!LITE) { el.addEventListener('pointerenter', enter); el.addEventListener('pointerleave', leave); }
      el.addEventListener('focus', enter); el.addEventListener('blur', leave);
    });
  }
```
Note: this block runs BEFORE Task 1's `hud` is defined (`:1216` < `:1440`). **Move this block** to just after the `hud` builder (Task 1) so `hud.live` exists — OR reference `hud` lazily. Simplest: relocate the whole `if (!reduced)` block to immediately after the HUD builder in Task 1's insertion. (Executor: cut from `:1216-1231`, paste after the `hud` IIFE.)
- [ ] **Step 2: `:focus-visible` style.** Append to the injected `<style>` (Task 1): `'.gallery-grid .shot:focus-visible,.projects .proj-grid:focus-visible{outline:2px solid rgba(57,240,255,.8);outline-offset:3px}'`.
- [ ] **Step 3: Syntax + browser.** `node --check` → OK. Hard-reload `?sceneDebug=1&cb=sp3t4`. Via `javascript_tool`: `document.querySelector('.gallery-grid .shot').focus()` → the globe scan-tag fires at that photo's place + `#globe-live` text updates; `.blur()` clears. Confirm a project row hover shows the real title (not 'PROJECT'). No errors.
- [ ] **Step 4: Commit** `feat(sp3): a11y — DOM focus mirrors + aria-live + focus-visible; fix project title selector`.

---

### Task 5: Touch/LITE + reduced-motion verify + acceptance record

**Files:** Modify `js/background.js` (touch guard already via `!coarse` at Task 1 Step 3); Modify the spec (append §15 results).

- [ ] **Step 1: Touch tap.** Confirm Task 3's `pointerup` select works on `coarse` (it's not gated). Ensure the per-frame `interrogate` is skipped on `coarse` (Task 1 Step 3 `if (!coarse)`). No code change expected; if `coarse` still runs hover, gate it.
- [ ] **Step 2: Full gate sweep (A–H from spec §9).** Server up. Verify each via Chrome + `javascript_tool`, screenshot evidence:
  - A pick correctness + no spin drift (pick a place at two `spin.rotation.y` values → same place).
  - B hover reticle snaps/hides. C dwell fires scan. D select → lightbox / scroll; drag no-op. E keyboard focus mirror + aria-live + project title fix. F touch tap (emulate `coarse`) / no hover cost. G reduced-motion (emulate `prefers-reduced-motion` via the re-import trick from SP2 → static globe, DOM+live still work, no pick loop). H parity (`__sceneDebug` unchanged 7000/dpr2/high, fps ≥ 58) + `grep -nE "WebGLRenderTarget|EffectComposer" js/background.js` shows only pre-existing SP1 bloom.
- [ ] **Step 3: Record.** Append `## §15 — Build results` to the spec: gate table A–H + evidence, final tuned knobs, commit list, `SP3 COMPLETE` decision, and the two owner debts (verify 12 photo→city labels; author project/district content to make them selectable).
- [ ] **Step 4: Commit** `docs(sp3): acceptance results + SP3 COMPLETE record`.
- [ ] **Step 5: Finish.** superpowers:finishing-a-development-branch → present options (branch stays `v3-build` per the program).

---

## Self-review notes

- **Ordering hazard:** the DOM-wiring block currently at `:1216-1231` references `hud.live` (added Task 4) but `hud` is defined in Task 1 (near `:1440`). Task 4 Step 1 **relocates** that block to after the HUD builder. Apply Task 1 before Task 4; when Task 4 runs, cut the `:1216` block and paste it after the `hud` IIFE.
- **Type consistency:** `INTERROGABLE` entry shape `{id,label,jp,lat,lon,kind,dir,domRef?}` is used identically in pick (`dir.dot`), reticle (`label/jp`), dwell (`label/jp/lat/lon`), select (`kind/domRef`). `kind ∈ {tokyo,dallas,photo}`.
- **No placeholders:** every code step has real code; Task 3 Step 1 is a genuine grep-confirm (the one unknown — the lightbox opener — resolved before wiring).
- **Reduced-motion:** no pick loop (loop returns at `:1616`); Task 4's mirrors run outside the loop on DOM events, so a11y works statically.
