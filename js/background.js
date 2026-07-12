/* Immersive scene: TOKYO DATA-GLOBE — a particle Earth whose points exist only
   where land exists, a pulsing amber Tokyo node with live coordinates, and a
   great-circle arc that draws his Dallas->Tokyo move on boot. Layered particle
   fields and the synthwave grid frame it; scroll dollies the camera.
   One render loop, DPR-capped, paused when hidden, static under reduced-motion. */
(function () {
  const CYAN = 0x39f0ff, AMBER = 0xff9e2c;
  const mount = document.getElementById('scene-root');
  if (!mount || !window.THREE) return;
  const THREE = window.THREE;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const small = window.matchMedia('(max-width: 760px)').matches;
  const LITE = coarse || small;            // phones / tablets: lighter scene
  const sceneDebug = new URLSearchParams(location.search).get('sceneDebug') === '1';
  // SP2 globe shader elevation — ON by default; ?globe=classic restores the pre-SP2 look (A/B + rollback).
  const GLOBE_ELEV = new URLSearchParams(location.search).get('globe') !== 'classic';
  const debugEl = sceneDebug ? document.querySelector('.scene-debug') : null;
  function getQualityProfile() {
    if (reduced) return {
      name: 'reduced',
      dpr: 1,
      globeParticles: 2600,
      fieldCounts: [360, 180, 120],
      haloLabels: 1,
      haloTicks: 8,
      haloRings: 1,
    };
    if (LITE) return {
      name: 'lite',
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      globeParticles: 2600,
      fieldCounts: [1100, 520, 360],
      haloLabels: 2,
      haloTicks: 12,
      haloRings: 1,
    };
    return {
      name: 'high',
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      globeParticles: 7000,
      fieldCounts: [2600, 1200, 900],
      haloLabels: 5,
      haloTicks: 24,
      haloRings: 2,
    };
  }
  const quality = getQualityProfile();
  const SCENE_COLORS = {
    cyan: CYAN,
    amber: AMBER,
    softAmber: 0xffd9a0,
    terminal: 0x8dffb3,
  };
  const dpr = quality.dpr;
  let w = innerWidth, h = innerHeight;
  // globe detail scales with device class
  const R = 3.2;                       // globe radius
  const GLOBE_N = quality.globeParticles;  // land particle count

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.05);
  const camera = new THREE.PerspectiveCamera(62, w / h, 0.1, 140);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  mount.appendChild(renderer.domElement);
  if (debugEl) debugEl.classList.add('on');

  /* Fail-loud onBeforeCompile helper — a silent no-op replace() would ship an
     unpatched material (e.g. after a three version bump), so warn instead. */
  function patchShader(src, find, insert) {
    if (!src.includes(find)) { console.warn('[scene] shader chunk missing:', find); return src; }
    return src.replace(find, insert);
  }

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
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material, i) => {
      if (material && !material.name) material.name = name + (i ? ':material-' + i : ':material');
    });
    return object;
  }

  // ---- particle fields ----
  // Points are patched to render as ROUND, depth-faded sprites: PointsMaterial's
  // default square pixels + FogExp2 brighten additively-blended points toward the
  // fog colour, so fog is off and a manual smoothstep depth fade replaces it.
  function makeField(count, color, spread, size, op) {
    const geo = new THREE.BufferGeometry();
    geo.name = 'field-' + color.toString(16);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * spread;
    if (!setFiniteAttribute(geo, 'position', pos, 3)) return new THREE.Group();
    const mat = new THREE.PointsMaterial({
      color, size, transparent: true, opacity: op, fog: false,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    mat.onBeforeCompile = s => {
      s.vertexShader = 'varying float vDepth;\n' + patchShader(s.vertexShader,
        '#include <project_vertex>',
        '#include <project_vertex>\n  vDepth = -mvPosition.z;');
      s.fragmentShader = 'varying float vDepth;\n' + patchShader(s.fragmentShader,
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        `float pd = length(gl_PointCoord - 0.5);
         if (pd > 0.5) discard;
         vec4 diffuseColor = vec4(diffuse,
           opacity * smoothstep(0.5, 0.18, pd) * smoothstep(64.0, 18.0, vDepth));`);
    };
    mat.customProgramCacheKey = () => 'field-round';
    return nameObject(new THREE.Points(geo, mat), geo.name);
  }
  const fieldCyan = makeField(quality.fieldCounts[0], CYAN, 46, 0.05, 0.9);
  // Owner decision 2026-07-07: the cyan+orange two-temperature starfield is the
  // site's signature — restored to its original timeline values (AMBER α.8) after
  // v3.1 briefly cooled it; scarcity now comes from the calmed arc/labels instead.
  const fieldAmber = makeField(quality.fieldCounts[1], AMBER, 36, 0.06, 0.8);
  const fieldDeep = makeField(quality.fieldCounts[2], 0x6fb7ff, 70, 0.035, 0.5);
  scene.add(fieldCyan, fieldAmber, fieldDeep);

  // ---- TOKYO DATA-GLOBE ----------------------------------------------------
  // coreGroup carries the mouse gyro tilt; `spin` (its child) carries the
  // y-rotation, so the globe can rotate without fighting the tilt easing.
  const coreGroup = new THREE.Group();
  // host page may reposition the globe (the lab centres it); the portfolio's
  // hero layout is the default
  /* v3.2n — the globe survives the phone: below ~0.7 aspect (or <700px) the
     sphere sits smaller (deeper, z -7.5) and HIGH behind the hero name, so the
     name overlaps only the facing-dimmed lower limb (point alpha floors at 0.18
     via vFacing — luminance-under-text discipline, zero added GPU work).
     Retune from the brief's [0.8, 4.5]: at y 4.5 the Tokyo callout (sprite at
     TOKYO*1.22 + 0.45y = +2.73 world above centre) projected INSIDE the fixed
     80px header band at 390x844 and collided with the wordmark/lang toggle; the
     panel is ~190px wide on a 390px screen, so no x-shift can clear the fully-
     occupied header row. y 3.4 puts the facing-open panel below the nav at the
     normal camera (measured, not modelled); the portrait header gate in the
     render loop covers every camera state the offset can't (warp, idle dolly).
     x 0.4 recentres the disc off the right frame edge. */
  const isPortrait = () => (w / h) < 0.7 || w < 700;
  const offsetFor = () => isPortrait()
    ? [0.4, 3.4, -7.5]
    : LITE ? [5.8, 0.35, -4.5] : [3, 0.4, -2];
  let OFF = window.__SCENE_OFFSET || offsetFor();
  coreGroup.position.set(OFF[0], OFF[1], OFF[2]);
  scene.add(coreGroup);
  const spin = new THREE.Group();
  coreGroup.add(spin);

  /* 384x192 equirectangular land bitmask, baked offline from Natural Earth
     110m land polygons (point-in-polygon per cell centre). ~12KB base64;
     decoded once at init. Verified: Tokyo+Dallas land, mid-Pacific water,
     Japan archipelago resolves. */
  const MW = 384, MH = 192;
  const LAND = atob('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH//4AAA////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB////8P75//3hAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAc////H////////8AAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAB////4////////8AAAAAAf+AAAMAAAAAAAH8AAAAAAAAAAAAAAAAAAAAAAAAAAAYAP9/4A////////8AAAAA/8AAAAAAAAAAAAD+wAAAAAAAAAAAAAAAAAAAAAAAAAABnDn/4/////////4AAAAAfzgAAAAAAAAAAAAB8AAAAAAAAAAAAAAAAAAAAAAADwAAAAP/AB////////8AAAAAHgAAAAAAAAAAAAAAeAAAAAAAAAAAAAAAAAAAAAAAPEMA4+HOAD////////wAAAAAAAAAAAAAAPgAAAAH//AAAAAAAAAAAAAAAAAAAAAAAf/g8n/8AAAD//////4AAAAAAAAAAAAAfgAAAA////wAAAP+AAAAAAAAAAAAAAAAABgAAA/oAAAB//////4AAAAAAAAAAAAB4AAAAP///8AAAAAAAAAAAAAAAAAAAAAA/wAw8+MTgAAA//////wAAAAAAAAAAAADgAAAP/////vhgAA4AAAAAAAAAAAAAAAB+/tx+w98AAAAP/////AAAAAAAAAAAAAPAAOAP///////+AB4AAAAAAAAAAAAAAAD9//wew//+AAAf/////AAAAAAAAAAAAAeAAeX////////+EB/8AAAAAAAAD7AAAAAA//4B8f//4AAJ////7gAAAAAAAPwAAAHgB+f//////////////wAAAAAA///+AHYAf//E8BOf/AAO////+AAAAAAAH/4AAAAAA/f//////////////wAOwAAD////////h8GBex4P+AAB////wAAAAAAA///8AAAB8fP////////////////P/4AD////////4B8G/z4M/wAH///wAAAAAAAD////hx////P//////////////////+AA//////////////4A/8AH///AAAAAAAAH////xn///+f///////////////////+O/////////////8AB+fAH//8ABnwAAAAf///jP////////////////////////DwP/////////////7Af/EAD/+AAA/4AAAA/+H/gf////////////////////////AAAP////////////z4A/wAD/+AAA/gAAAB/8f/z////////////////////////8ADA////////////+AAAe4AB/8AAAAAAAAH/x///////////////////////////+AAD////////////4AQZDgAAf4AAAAAAAA//h/////////////////////////f/wAAH////////////wAAfwAAAfwAAAAAAAB//B///////////////////////+Of+AAAD//8/////////gAAf8AAABwAAAAAAAA//g+//////////////////////8B/wAAAAf8wAf///////gAAf8MAAAAAAAAAAAA//wE/////////////////////54HAAAAAAC8AAH///////4AAf+eAAAAAAAAAAIA4/Af////////////////////gAAOAAAAAAAzAAAf//////4AAP//AAAAAAAAAA8AA/AP///////////////////+AAB/AAAAAADAAAAP///////gAP//AAAAAAAAAA4AGeD////////////////////8AAD/AAAAAAcAAAAH///////8AP//gAAAAAAAAA8AGoB////////////////////wAAD+AAAAABAAAAAB////////x///8AAAAAAAAGeAGAH////////////////////AAAD+AAAAAAAAAAAJ////////w///+AAAAAAAAOHAH//////////////////////7AAD4AAAAAAAAAAAA////////4////gAAAAAAAOfB////////////////////////4ADgAAAAAAAAAAAAP///////4////AAAAAAAAMfz////////////////////////4ABgAAAAAAAAAAAAP///////////5AAAAAAAAAfv////////////////////////IAAAAAAAAAAAAAAAf//////////hjAAAAAAAAAgf////////////////////////MAAAAAAAAAAAAAAAC/////////+JD4AAAAAAAAD/////////////////////////cAAAAAAAAAAAAAAABf////////94H4AAAAAAAAf////////////////////////+QAAAAAAAAAAAAAAAB/////////74AcAAAAAAAAH////////////////////////8YAAAAAAAAAAAAAAAA//////////7QAAAAAAAAAD/////7x/8H//////////////4QAAAAAAAAAAAAAAAA///////////gAAAAAAAAAB//n//xz/4H//////////////wQAAAAAAAAAAAAAAAA//////////MAAAAAAAAAAB//j//gj/w///////////////gYAAAAAAAAAAAAAAAA/////////4AAAAAAAAAAGD/xx//AA/4f//////////////AeAAAAAAAAAAAAAAAB/////////wAAAAAAAAAAP/4E4f/AAP4P/////////////wB4AAAAAAAAAAAAAAAA/////////4AAAAAAAAAAP/4EeH/DwP8D/////////////ABgAAAAAAAAAAAAAAAB/////////gAAAAAAAAAAH/gEHnyf//+L///////////7/ABgAAAAAAAAAAAAAAAA////////+AAAAAAAAAAAP/AEBXD///+H///////////zcABgAAAAAAAAAAAAAAAA////////0AAAAAAAAAAAP/AABDh///8H///////////AOABgAAAAAAAAAAAAAAAAf///////0AAAAAAAAAAAH+AAcBz///8H///////////AeADAAAAAAAAAAAAAAAAAP///////4AAAAAAAAAAAH8A2EBB////H///////////+HAHAAAAAAAAAAAAAAAAAP///////4AAAAAAAAAAAAA/+AAAAP//////////////4HAfAAAAAAAAAAAAAAAAAH///////4AAAAAAAAAAAB///AAMBP//////////////gHH/AAAAAAAAAAAAAAAAAB///////gAAAAAAAAAAAB//+AAAAP//////////////wAMwAAAAAAAAAAAAAAAAAAf//////AAAAAAAAAAAAH///AAAAP//////////////4A8AAAAAAAAAAAAAAAAAAAf/////8AAAAAAAAAAAAP///8DgAf//////////////4AQAAAAAAAAAAAAAAAAAAAJ/////4AAAAAAAAAAAAP///+H+Mf//////////////8AQAAAAAAAAAAAAAAAAAAAN/////4AAAAAAAAAAAAP////3/////////////////4AAAAAAAAAAAAAAAAAAAAAE///jgYAAAAAAAAAAAAf/////////4////////////8AAAAAAAAAAAAAAAAAAAAACf//AAMAAAAAAAAAAAA//////////8////////////8AAAAAAAAAAAAAAAAAAAAAHP/8AAMAAAAAAAAAAAD////////P/8P///////////4AAAAAAAAAAAAAAAAAAAAABn/8AAOwAAAAAAAAAAH////////H/+Gf//////////wAAAAAAAAAAAAAAAAAAAAAAn/8AAGAAAAAAAAAAAP////////n//gf//////////wAAAAAAAAAAAAAAAAAAAAAAx/8AAAgAAAAAAAAAAP////////j//jAB/////////kAAAAAAAAAAAAAAAAAAAAAAI/8AAAAAAAAAAAAAAf////////x///gA/////////MAAAAAAAAAAAAAAAAAAAAAAAf8AAcAAAAAAAAAAAf////////x///4AP///////8IAAAAAAAAAAAAAAAAAAAAAAAf8AADgAAAAAAAAAA/////////4///8AP///P///gAAAAAAAAAAAAAAAgAAAAAAAAP8A4A4AAAAAAAAAA/////////8///4AG//4P//EAAAAAAAAAAAAAAAAAAAAAAAAAf+B4AeAAAAAAAAAAf////////8f//wAA//wH/+AAAAAAAAAAAAAAAAAAAAAAAAAAP+B4AA8AAAAAAAAAf////////8P//wAA//AD/+MAAAAAAAAAAAAAAAAAAAAAAAAAD/vwAxwwAAAAAAAAf////////+P//AAA//AB/+AAEAAAAAAAAAAAAAAAAAAAAAAAA//wAAAAAAAAAAAAf////////+H/+AAA/8AB//AAOAAAAAAAAAAAAAAAAAAAAAAAAH/wAAAAAAAAAAAA//////////D/wAAA/4ABv/gAMAAAAAAAAAAAAAAAAAAAAAAAAAH/gAAAAAAAAAAA//////////D/gAAAfgAAP/wAMAAAAAAAAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAB//////////z+AAAAfgAAP/wAMAAAAAAAAAAAAAAAAAAAAAAAAAA/gAAAAAAAAAAA//////////74AAAAPwAAH/4ADAAAAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAA//////////+AAAAAPgAAG/4AAAAAAAAAAAAAAAAAAAAAAAAAAAADgAUAAAAAAAAAf/////////8AgAAAPgAAEPwAAQAAAAAAAAAAAAAAAAAAAAAAAAABgD+AgAAAAAAAP/////////+fAAAAHgAAEPgATAAAAAAAAAAAAAAAAAAAAAAAAAAAwHv/AAAAAAAAH///////////AAAAHAAAEDAAhAAAAAAAAAAAAAAAAAAAAAAAAAAAav//gAAAAAAAD///////////AAAACQAAGCABAYAAAAAAAAAAAAAAAAAAAAAAAAAAE///4AAAAAAAD//////////+AAAAAYAACAAAD4AAAAAAAAAAAAAAAAAAAAAAAAAAAf//8AAAAAAAB//////////+AAAAAYAADAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAf//+AAAAAAAAf/x///////8AAAAAAAABgADAQAAAAAAAAAAAAAAAAAAAAAAAAAAAf///8AAAAAAAPuA///////8AAAAAAAAxwAHgAAAAAAAAAAAAAAAAAAAAAAAAAAAAf///+AAAAAAAAAAH//////4AAAAAAAA5wAPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf////AAAAAAAAAAD//////wAAAAAAAAMwAeAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////AAAAAAAAAAD//////gAAAAAAAAOYB/AAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////gAAAAAAAAAD//////AAAAAAAAAHoP/ASAAAAAAAAAAAAAAAAAAAAAAAAAAB/////AAAAAAAAAAD/////8AAAAAAAAADwP/PiAAAAAAAAAAAAAAAAAAAAAAAAAAD/////wAAAAAAAAAD/////4AAAAAAAAABwP+ACEAAAAAAAAAAAAAAAAAAAAAAAAAD//////AAAAAAAAAD/////4AAAAAAAAAB4H8eAOAAAAAAAAAAAAAAAAAAAAAAAAAD//////gAAAAAAAAD/////gAAAAAAAAAA8D8cAAeAAAAAAAAAAAAAAAAAAAAAAAAD///////AAAAAAAAB/////gAAAAAAAAAAeBcWPjfwAAAAAAAAAAAAAAAAAAAAAAAH///////wAAAAAAAA/////AAAAAAAAAAAeAACAA/+AAAAAAAAAAAAAAAAAAAAAAAH///////8AAAAAAAAf////AAAAAAAAAAAGAASAAH/BAAAAAAAAAAAAAAAAAAAAAAH///////+AAAAAAAAf///+AAAAAAAAAAABgAAABD/mEAAAAAAAAAAAAAAAAAAAAAB///////+AAAAAAAAP////AAAAAAAAAAAB/AAAAD/gBAAAAAAAAAAAAAAAAAAAAAB///////+AAAAAAAAP////AAAAAAAAAAAAH4AAAH5wAAAAAAAAAAAAAAAAAAAAAAA///////+AAAAAAAAP////AAAAAAAAAAAAABAYAA44AAAAAAAAAAAAAAAAAAAAAAA///////8AAAAAAAAP////AAAAAAAAAAAAAAYgAAAcAEAAAAAAAAAAAAAAAAAAAAAf//////4AAAAAAAAH////gAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAf//////wAAAAAAAAH////gAAAAAAAAAAAAAAAEAQAAAAAAAAAAAAAAAAAAAAAAAAP//////gAAAAAAAAP////gCAAAAAAAAAAAAAAfwYAAAAAAAAAAAAAAAAAAAAAAAAH//////gAAAAAAAAf////gCAAAAAAAAAAAAAAfgYAAAAAAAAAAAAAAAAAAAAAAAAH//////AAAAAAAAAf////gHAAAAAAAAAAAAAO/geAAAAAAAAAAAAAAAAAAAAAAAAD//////gAAAAAAAAf////gPAAAAAAAAAAAAAf/geAAAAAAAAAAAAAAAAAAAAAAAAA//////AAAAAAAAA/////B+AAAAAAAAAAAAA//4eAAAAABAAAAAAAAAAAAAAAAAAAP/////AAAAAAAAAf///+B+AAAAAAAAAAAAD//+/AAAAAAAAAAAAAAAAAAAAAAAAAH/////AAAAAAAAAf///4B+AAAAAAAAAAAAD////AAAAAAAAAAAAAAAAAAAAAAAAAH/////AAAAAAAAAP///wB8AAAAAAAAAAAAD////gAAAAAAAAAAAAAAAAAAAAAAAAH////+AAAAAAAAAP///gB8AAAAAAAAAAAAf////wAAAAAAAAAAAAAAAAAAAAAAAAH////8AAAAAAAAAP///gB8AAAAAAAAAAAD/////4AAIAAAAAAAAAAAAAAAAAAAAAH////8AAAAAAAAAH///wD4AAAAAAAAAAAP/////8AAEAAAAAAAAAAAAAAAAAAAAAH////wAAAAAAAAAH///wD4AAAAAAAAAAAf/////+AAAAAAAAAAAAAAAAAAAAAAAAH///+AAAAAAAAAAH///wB4AAAAAAAAAAAf//////AAAAAAAAAAAAAAAAAAAAAAAAH///4AAAAAAAAAAD///ABwAAAAAAAAAAAf//////gAAAAAAAAAAAAAAAAAAAAAAAH///wAAAAAAAAAAD//+AAAAAAAAAAAAAAP//////gAAAAAAAAAAAAAAAAAAAAAAAP///wAAAAAAAAAAD//+AAAAAAAAAAAAAAf//////gAAAAAAAAAAAAAAAAAAAAAAAP///wAAAAAAAAAAB//+AAAAAAAAAAAAAAP//////wAAAAAAAAAAAAAAAAAAAAAAAP///wAAAAAAAAAAB//8AAAAAAAAAAAAAAP//////wAAAAAAAAAAAAAAAAAAAAAAAP///gAAAAAAAAAAA//4AAAAAAAAAAAAAAH//////wAAAAAAAAAAAAAAAAAAAAAAAP///AAAAAAAAAAAAf/4AAAAAAAAAAAAAAH//////gAAAAAAAAAAAAAAAAAAAAAAAP//+AAAAAAAAAAAAf/wAAAAAAAAAAAAAAH//////gAAAAAAAAAAAAAAAAAAAAAAAP//8AAAAAAAAAAAAf/gAAAAAAAAAAAAAAH/wB///gAAAAAAAAAAAAAAAAAAAAAAAP//8AAAAAAAAAAAAf+AAAAAAAAAAAAAAAH/AA///AAAAAAAAAAAAAAAAAAAAAAAAf//4AAAAAAAAAAAAOAAAAAAAAAAAAAAAAHwAAn/+AAAAAAAAAAAAAAAAAAAAAAAAf/+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/+AAABAAAAAAAAAAAAAAAAAAAA//+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/8AAABAAAAAAAAAAAAAAAAAAAA//+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/8AAAAwAAAAAAAAAAAAAAAAAAA//+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9wAAAA8AAAAAAAAAAAAAAAAAAA//gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAB//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAB//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAQAAAAAAAAAAAAAAAAAAB/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAHAAAAAAAAAAAAAAAAAAAB/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAOAAAAAAAAAAAAAAAAAAAA/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAcAAAAAAAAAAAAAAAAAAAB/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAD/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAD/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+AYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAAAAAAAAAAAAAAAAAAAAPAAAAAAAAYAwAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAA/wAAAAGAB///H///+AAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAA///fwAP///////////gAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAABwP////wB/////////////8AAAAAAAAAAAAAAAAAAAAAAAd+AAAAAAAAAAAAAAAAH//////wf//////////////wAAAAAAAAAAAAAAAAAAAAAAf/AAAAAAAAAAAB+//////////w////////////////8AAAAAAAAAAAAAAAAAAAAD+/AAAAAAAAA//////////////j/////////////////4AAAAAAAAAAAAAAEAAAAAA/gAAAAAAAD////////////////////////////////wAAAAAAAAAAGcAAD///jx//gAAAAAAAf////////////////////////////////gAAAAAAAAD////QAf/////+AAAAAAAAf///////////////////////////////4AAAAAAAA3/////////////wAAAAAAAD////////////////////////////////gAAAAAAAA/////////////4AAAAAAAP/////////////////////////////////AAAAAAB+f////////////8AAAAAAAH//////////////////////////////////gAAAAAg//////////////gAAAAPgD///////////////////////////////////4AAAAAcB/////////////gAAAA/wD//////////////////////////////////8AAAAAAAAA////////////4AAwH/gAB/////////////////////////////////4AAAAAAADH/////////////8AAAAAD//////////////////////////////////4AAAAAAAB////////////////AB/////////////////////////////////////+AAAAAAAB////////////////9///////////////////////////////////////4AAACAAAf////////////////////////////////////////////////////////wA//+AAAH/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////');
  const landAt = (lon, lat) => {
    const x = Math.max(0, Math.min(MW - 1, Math.floor(((lon + 180) / 360) * MW)));
    const y = Math.max(0, Math.min(MH - 1, Math.floor(((90 - lat) / 180) * MH)));
    const i = y * MW + x;
    return (LAND.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
  };
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
  const toV3 = (lat, lon, r) => {
    const p = (90 - lat) * Math.PI / 180, q = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(p) * Math.cos(q), r * Math.cos(p), r * Math.sin(p) * Math.sin(q));
  };

  // (a) land particles — rejection-sampled uniform on the sphere (asin keeps
  // pole density honest), one phase attribute drives GPU breathing: zero
  // per-frame buffer uploads, unlike the old CPU-distorted icosahedron.
  const gp = new Float32Array(GLOBE_N * 3), gph = new Float32Array(GLOBE_N), gedge = new Float32Array(GLOBE_N);
  const gcity = new Float32Array(GLOBE_N);   // coastline-clustered night-side city lights (motivated amber emitters, v3.2b)
  let globeFilled = 0;
  for (let i = 0, guard = 0; i < GLOBE_N && guard < GLOBE_N * 10; guard++) {
    const lat = Math.asin(Math.random() * 2 - 1) * 180 / Math.PI;
    const lon = Math.random() * 360 - 180;
    if (!landAt(lon, lat)) continue;
    toV3(lat, lon, R).toArray(gp, i * 3);
    gph[i] = Math.random() * Math.PI * 2;
    gedge[i] = landEdgeAt(lon, lat);
    /* v3.2b (globe brief lever 1): coastline-weighted city clustering replaces
       the uniform 11% freckle. A low-frequency lon/lat field, cubed to sharpen
       its peaks, gates WHERE metropolitan clusters exist; the gedge coastline
       signal pulls them onto coasts (cities are coastal). Expected lit share
       ~2-4% of land points — under the <5% night-side budget. */
    const cityCluster = Math.pow(0.5 + 0.5 * Math.sin(lon * 0.12 + 1.7) * Math.sin(lat * 0.19 - 0.6), 3.0);
    const pCity = gedge[i] ? 0.45 * cityCluster : 0.03 * cityCluster;
    gcity[i] = Math.random() < pCity ? 1 : 0;
    globeFilled = i + 1;
    i++;
  }
  if (globeFilled < GLOBE_N) console.warn('[scene] land particle sample underfilled', { quality: quality.name, globeFilled, expected: GLOBE_N });
  const globeGeo = makeGeometry('earth-land-particles', gp.subarray(0, globeFilled * 3), 3);
  if (!globeGeo) return;
  setFiniteAttribute(globeGeo, 'phase', gph.subarray(0, globeFilled), 1);
  setFiniteAttribute(globeGeo, 'edge', gedge.subarray(0, globeFilled), 1);
  setFiniteAttribute(globeGeo, 'city', gcity.subarray(0, globeFilled), 1);
  const globeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uPx: { value: dpr }, uSunDir: { value: new THREE.Vector3(1, 0, 0) },
      uReveal: { value: 1 },              // 0→1 boot reveal; 1 = fully shown (reduced-motion default)
      uElev: { value: GLOBE_ELEV ? 1 : 0 },  // 1 = v3 elevation, 0 = classic; land shader mixes on this
    },
    vertexShader: `
      attribute float phase;
      attribute float edge;
      attribute float city;
      uniform float uTime, uPx;
      uniform vec3 uSunDir;
      uniform float uReveal, uElev;
      varying float vA;
      varying float vEdge;
      varying float vFacing;
      varying float vNight;
      varying float vCity;
      varying float vReveal;
      varying float vBand;
      void main() {
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vec3 worldNormal = normalize((modelMatrix * vec4(normalize(position), 0.0)).xyz);
        vec3 viewDir = normalize(cameraPosition - worldPos);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vA = 0.55 + 0.45 * sin(uTime * 2.2 + phase);
        vEdge = edge;
        vFacing = smoothstep(-0.15, 0.65, dot(worldNormal, viewDir));
        // Terminator: uElev widens+softens the day/night band (classic edges at uElev=0).
        float sun = dot(normalize(position), uSunDir);
        vNight = 1.0 - smoothstep(mix(-0.18, -0.35, uElev), mix(0.12, 0.28, uElev), sun);
        vCity = city;
        // Boot-up scan-reveal (inert at uReveal=1): pole->pole sweep, per-point curl dither.
        float yN = normalize(position).y * 0.5 + 0.5;
        float front = mix(-0.15, 1.15, uReveal);
        float curl = fract(sin(dot(position, vec3(12.9898, 78.233, 37.719))) * 43758.5453) * 0.06;
        vReveal = 1.0 - smoothstep(front, front + 0.15, yN + curl);
        vBand = smoothstep(front - 0.12, front, yN + curl) * (1.0 - smoothstep(front, front + 0.12, yN + curl));
        gl_PointSize = (2.4 + 1.4 * vA + edge * 1.2 + city * vNight * 1.1) * uPx * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uElev;
      varying float vA;
      varying float vEdge;
      varying float vFacing;
      varying float vNight;
      varying float vCity;
      varying float vReveal;
      varying float vBand;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 base = mix(vec3(0.224, 0.941, 1.0), vec3(1.0, 0.62, 0.17), vEdge * 0.35);
        vec3 col = mix(base * 0.62, base * 1.18, vNight);
        col = mix(col, vec3(1.0, 0.72, 0.35), vCity * vNight * 0.85);
        float dusk = vNight * (1.0 - vNight) * 4.0;
        col += vec3(1.0, 0.5, 0.25) * dusk * 0.16;
        // Elevated: cool cyan lift on the DAY limb (day side + near silhouette); gated by uElev.
        float dayLimb = (1.0 - vNight) * (1.0 - vFacing);
        col += vec3(0.10, 0.55, 0.75) * dayLimb * 0.18 * uElev;
        // Elevated: softer point core (pow) vs classic linear falloff.
        float core = mix(1.0 - d * 2.0, pow(max(1.0 - d * 2.0, 0.0), 3.0), uElev);
        float facingAlpha = mix(0.18, 1.0, vFacing);
        float alpha = vA * core * (0.75 + vEdge * 0.25) * facingAlpha;
        alpha *= mix(0.9, 1.0 + vCity * 0.6, vNight);
        // Boot-up reveal (inert at uReveal=1: vReveal=1, vBand=0): mask + bright leading band.
        alpha *= vReveal;
        col += vec3(0.3, 0.95, 1.0) * vBand * 0.6;
        gl_FragColor = vec4(col, alpha);
      }`,
  });
  spin.add(nameObject(new THREE.Points(globeGeo, globeMat), 'earth-land-particles'));

  /* Real-time day/night terminator (dossier: light is information; warmth
     lives in the emitter — night cities glow amber, day side dims). Sun dir
     lives in the globe's GEOGRAPHIC frame (same toV3 mapping as particles),
     so night stays over the right countries however the display spins. */
  let sunTimer = 0;
  function updateSunDir() {
    const now = new Date();
    const doy = (now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 0)) / 864e5;
    const decl = 23.44 * Math.sin((2 * Math.PI * (doy - 81)) / 365.25);
    const mins = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
    globeMat.uniforms.uSunDir.value.copy(toV3(decl, 180 - mins / 4, 1)).normalize();
  }
  updateSunDir();

  // (b) graticule — one merged LineSegments (LITE: 3 rings, no meridians)
  (function buildGraticule() {
    const segs = [], SEG = 72;
    const ringLats = LITE ? [0, 30, -30] : [0, 30, -30, 60, -60];
    for (const lat of ringLats) {
      const r = R * Math.cos(lat * Math.PI / 180), y = R * Math.sin(lat * Math.PI / 180);
      for (let i = 0; i < SEG; i++) {
        const a = (i / SEG) * Math.PI * 2, b = ((i + 1) / SEG) * Math.PI * 2;
        segs.push(Math.cos(a) * r, y, Math.sin(a) * r, Math.cos(b) * r, y, Math.sin(b) * r);
      }
    }
    if (!LITE) for (let m = 0; m < 6; m++) {
      const lon = m * 30;
      for (let i = 0; i < SEG; i++) {
        const a = (i / SEG) * Math.PI * 2, b = ((i + 1) / SEG) * Math.PI * 2;
        const p1 = toV3(90 - (a * 180 / Math.PI), lon, R), p2 = toV3(90 - (b * 180 / Math.PI), lon, R);
        segs.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }
    const g = makeGeometry('earth-graticule-lines', new Float32Array(segs), 3);
    if (!g) return;
    // Elevated: fade lines toward the poles (soften the meridian pinch) + fade in on boot.
    const gratMat = GLOBE_ELEV
      ? new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          uniforms: { uReveal: globeMat.uniforms.uReveal },
          vertexShader: `
            uniform float uReveal;
            varying float vFade;
            void main() {
              float pole = abs(normalize(position).y);
              vFade = (1.0 - smoothstep(0.7, 1.0, pole)) * uReveal;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }`,
          fragmentShader: `
            varying float vFade;
            void main() { gl_FragColor = vec4(vec3(0.224, 0.941, 1.0), 0.07 * vFade); }`,
        })
      : new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending });
    spin.add(nameObject(new THREE.LineSegments(g, gratMat), 'earth-graticule-lines'));
  })();

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

  /* v3.1 calm-the-signals: 5 labels → 2. 東京 anchors the halo, JST is the one
     secondary (the live-time identity thread the whole site carries). The three
     district labels (渋谷/新宿/秋葉原) were competing chatter — retired. */
  const TOKYO_HALO_LABELS = [
    { id: 'tokyo', jp: '東京', en: 'TOKYO', angle: 0, priority: 1, kind: 'place' },
    { id: 'jst', jp: '日本時間', en: 'JST', angle: 52, priority: 1, kind: 'status' },
  ];

  // (c) personal place nodes: Dallas origin + Tokyo current focus
  const TOKYO_PLACE = placeById('tokyo');
  const DALLAS_PLACE = placeById('dallas');
  const TOKYO = placeVector(TOKYO_PLACE, R);
  const tokyoA0 = Math.atan2(TOKYO.z, TOKYO.x);   // rest angle in the xz plane
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

  function makeCircleLine(name, radius, segments, color, opacity) {
    const pts = new Float32Array(segments * 3);
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts[i * 3] = Math.cos(a) * radius;
      pts[i * 3 + 1] = Math.sin(a) * radius;
      pts[i * 3 + 2] = 0;
    }
    const geo = makeGeometry(name, pts, 3);
    if (!geo) return null;
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return nameObject(new THREE.LineLoop(geo, mat), name);
  }

  function makeRadialTicks(name, count, inner, outer, color, opacity) {
    const pts = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      pts.set([c * inner, s * inner, 0, c * outer, s * outer, 0], i * 6);
    }
    const geo = makeGeometry(name, pts, 3);
    if (!geo) return null;
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return nameObject(new THREE.LineSegments(geo, mat), name);
  }

  function makeGlowSprite(name, size, colorStops) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    (colorStops || [[0,'rgba(255,180,90,0.9)'],[0.4,'rgba(255,158,44,0.35)'],[1,'rgba(255,158,44,0)']])
      .forEach(function (s) { grd.addColorStop(s[0], s[1]); });
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(cv);
    const sp = nameObject(new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    })), name);
    sp.scale.set(size, size, 1);
    return sp;
  }

  function tangentRing(inner, outer, op, name) {
    const m = nameObject(new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 40),
      new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: op, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
    ), name);
    m.position.copy(TOKYO);
    m.lookAt(TOKYO.clone().multiplyScalar(2));
    spin.add(m);
    return m;
  }
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
          vec2 perp = vec2(dir.y, -dir.x);   // NOT vec2(-dir.y, dir.x): with dir pointing DOWN that basis has det = -1 (a reflection) — it flips the quad's CCW winding and FrontSide culling eats every streak (v33a live-debug find); this sign keeps det = +1, and the symmetric lateral profile makes the two mathematically mirrored widths visually identical
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

  const tokyoRing = tangentRing(0.16, 0.2, 0.8, 'tokyo-focus-ring');
  // v3.2d: tokyo-ping-ring deleted with the dead scene-ping machinery (zero callers since v31c).

  // Tokyo holographic halo — spinGroup (rings/ticks/packet) rotates; staticGroup
  // (glow + labels) never does, so district labels stay put instead of orbiting.
  function makeTokyoHalo() {
    const group = new THREE.Group();
    group.name = 'tokyo-holographic-halo';
    group.position.copy(TOKYO).multiplyScalar(1.08);
    group.lookAt(TOKYO.clone().multiplyScalar(2));
    group.scale.setScalar(LITE ? 0.82 : 1);
    const spinGroup = new THREE.Group();
    const staticGroup = new THREE.Group();

    const rings = [];
    const ringMat = new THREE.MeshBasicMaterial({ color: SCENE_COLORS.cyan, transparent: true,
      opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const primaryRing = nameObject(new THREE.Mesh(new THREE.RingGeometry(0.56, 0.60, 96), ringMat), 'tokyo-halo-primary-ring');
    spinGroup.add(primaryRing); rings.push(primaryRing);
    if (quality.haloRings > 1) {
      const secondary = makeCircleLine('tokyo-halo-secondary-ring', 0.82, 128, SCENE_COLORS.amber, 0.18);
      if (secondary) { spinGroup.add(secondary); rings.push(secondary); }
    }

    const ticks = makeRadialTicks('tokyo-halo-station-ticks', quality.haloTicks, 0.54, 0.62, SCENE_COLORS.softAmber, 0.42);
    if (ticks) spinGroup.add(ticks);

    const glow = makeGlowSprite('tokyo-halo-glow', LITE ? 0.9 : 1.15);
    glow.position.set(0, 0, -0.02);
    staticGroup.add(glow);

    const labels = [];
    TOKYO_HALO_LABELS
      .filter(l => l.priority <= (quality.name === 'high' ? 3 : 1))
      .slice(0, quality.haloLabels)
      .forEach(label => {
        const pack = makeCanvasSprite('tokyo-halo-label-' + label.id, 256, 72, [1.25, 0.35, 1],
          (ctx, p, w, h) => drawHudLabel(ctx, p || label, w, h,
            label.kind === 'status' ? '#ff9e2c' : '#39f0ff',
            label.priority === 1 ? 'primary' : 'district'));
        const a = label.angle * Math.PI / 180;
        const radius = label.priority === 1 ? 0.94 : 1.08;
        pack.sprite.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0.08);
        pack.sprite.userData.label = label;
        pack.sprite.material.opacity = 0;
        staticGroup.add(pack.sprite);
        labels.push(pack.sprite);
      });

    /* Transit loop — a hand-placed Yamanote-style circuit with station dots
       (dossier: MGS Soliton-schematic grammar; per-shot deliberate placement,
       never procedural). The pulse packet rides THIS loop, not a circle. */
    const TRANSIT_LOOP = [
      [0.62, 0.02], [0.48, 0.34], [0.18, 0.55], [-0.16, 0.60], [-0.44, 0.46],
      [-0.60, 0.18], [-0.63, -0.14], [-0.48, -0.40], [-0.18, -0.56], [0.14, -0.60],
      [0.42, -0.48], [0.60, -0.24],
    ];
    const transitPos = new Float32Array(TRANSIT_LOOP.length * 3);
    TRANSIT_LOOP.forEach((p2, i) => { transitPos[i * 3] = p2[0]; transitPos[i * 3 + 1] = p2[1]; transitPos[i * 3 + 2] = 0.05; });
    const transitGeo = new THREE.BufferGeometry();
    transitGeo.setAttribute('position', new THREE.BufferAttribute(transitPos, 3));
    const transit = nameObject(new THREE.LineLoop(transitGeo, new THREE.LineBasicMaterial({
      color: 0xb2f5fd, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false })), 'tokyo-transit-loop');
    staticGroup.add(transit);
    const stations = nameObject(new THREE.Points(transitGeo, new THREE.PointsMaterial({
      color: SCENE_COLORS.softAmber, size: 0.05, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })), 'tokyo-transit-stations');
    staticGroup.add(stations);

    const packetGeo = makeGeometry('tokyo-halo-pulse-packet', new Float32Array([0, 0, 0.1]), 3);
    const packetMat = new THREE.PointsMaterial({
      color: SCENE_COLORS.softAmber,
      size: LITE ? 0.11 : 0.14,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const packet = packetGeo ? nameObject(new THREE.Points(packetGeo, packetMat), 'tokyo-halo-pulse-packet') : null;
    if (packet) staticGroup.add(packet);          // rides the geographic loop, so it must not spin

    function setPacketAt(k) {                     // k = laps along the transit loop (fractional)
      if (!packet || !packetGeo) return;
      const n = TRANSIT_LOOP.length;
      const f = (((k % 1) + 1) % 1) * n;
      const i = Math.floor(f) % n, t2 = f - Math.floor(f);
      const a = TRANSIT_LOOP[i], b = TRANSIT_LOOP[(i + 1) % n];
      const pos = packetGeo.attributes.position.array;
      pos[0] = a[0] + (b[0] - a[0]) * t2;
      pos[1] = a[1] + (b[1] - a[1]) * t2;
      pos[2] = 0.07;
      packetGeo.attributes.position.needsUpdate = true;
    }

    group.add(spinGroup);
    group.add(staticGroup);
    spin.add(group);
    return { group, spinGroup, staticGroup, rings, ticks, glow, labels, packet, packetMat, packetGeo, setPacketAt, transit, stations };
  }

  const tokyoHalo = makeTokyoHalo();
  const depthRain = reduced ? null : makeDepthRain();

  /* Rain-on-glass droplets — 2D canvas beads that condense, swell, and break
     into wobbling runs; each lens samples the LIVE frame inverted (dossier:
     Joi/Pink-Joi — holograms and wet glass interact with real scene light;
     restraint over artifice). Updated AFTER render() so the lens reads this
     frame's buffer; idles to zero work when no drops live. */
  const droplets = (function () {
    if (reduced) return null;
    const cv = document.querySelector('.scene-droplets');
    if (!cv) return null;
    const ctx = cv.getContext('2d');
    const cap = LITE ? 12 : 24;
    const REFRACT = !LITE;
    let W = 0, H = 0;
    function resizeDroplets() {
      const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resizeDroplets();
    window.addEventListener('resize', resizeDroplets);
    const drops = [];
    let spawnIn = 1.4, skip = 0, fadeOut = 0;
    function spawn() {
      drops.push({
        x: 20 + Math.random() * (W - 40), y: 10 + Math.random() * H * 0.75,
        r: 1.4 + Math.random() * 2.2, grow: 0.12 + Math.random() * 0.5,
        runAt: 5 + Math.random() * 2.5, vy: 0, wob: Math.random() * 6.28,
        state: 'sit', age: 0, alpha: 0,
      });
    }
    function drawDrop(d) {
      const a = d.alpha;
      const stretch = d.state === 'run' ? Math.min(0.45, d.vy * 0.004) : 0;
      ctx.save();
      ctx.translate(d.x, d.y); ctx.scale(1, 1 + stretch); ctx.translate(-d.x, -d.y);
      if (REFRACT && d.r > 3) {
        const src = renderer.domElement;
        const k = src.width / W;
        const sr = d.r * 2.5;
        ctx.save();
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 0.92, 0, 6.2832); ctx.clip();
        ctx.translate(d.x, d.y); ctx.rotate(Math.PI);
        // v3.1f: 0.65 -> 0.22 — the lens samples the (bright, additive) WebGL frame,
        // and at 0.65 a droplet over a dark page gap read as a bright smudge on the
        // deep-black floor. Capped so a drop is never more than a faint glint.
        // v3.2l: sample through worn glass — desaturated + dimmed (rain brief Lever A
        // one-liner); Safari ignores ctx.filter (harmless no-op there).
        ctx.filter = 'saturate(0.5) brightness(0.9)';
        ctx.globalAlpha = 0.22 * a;
        ctx.drawImage(src, (d.x - sr) * k, (d.y - sr) * k, sr * 2 * k, sr * 2 * k, -d.r, -d.r, d.r * 2, d.r * 2);
        ctx.filter = 'none';
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      const g = ctx.createRadialGradient(d.x, d.y, d.r * 0.15, d.x, d.y, d.r);
      g.addColorStop(0, 'rgba(200, 235, 255, ' + (0.07 * a).toFixed(3) + ')');
      g.addColorStop(0.72, 'rgba(120, 180, 200, ' + (0.04 * a).toFixed(3) + ')');
      g.addColorStop(0.95, 'rgba(0, 8, 12, ' + (0.26 * a).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(0, 8, 12, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.2832); ctx.fill();
      ctx.fillStyle = 'rgba(235, 250, 255, ' + (0.2 * a).toFixed(3) + ')';   // v3.1f: highlight 0.55 -> 0.2 (whisper, not signal)
      ctx.beginPath();
      ctx.ellipse(d.x - d.r * 0.34, d.y - d.r * 0.42, d.r * 0.2, d.r * 0.12, -0.6, 0, 6.2832);
      ctx.fill();
      ctx.restore();
    }
    function update(dt) {
      if ((skip = 1 - skip)) return;                 // ~30fps is plenty for glass
      dt = Math.min(dt * 2, 0.1);
      spawnIn -= dt * (0.4 + sceneState.rain * 0.6);   // v3.2l: rain is presence (≈1) now — rescaled to the old veil-era spawn rate
      if (spawnIn <= 0 && drops.length < cap) { spawn(); spawnIn = 1 + Math.random() * 2.4; }
      if (!drops.length) {
        if (fadeOut > 0) {
          fadeOut -= 1;
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
          ctx.fillRect(0, 0, W, H);
          ctx.globalCompositeOperation = 'source-over';
          if (fadeOut === 0) ctx.clearRect(0, 0, W, H);
        }
        return;
      }
      fadeOut = 40;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';         // prior frame decays → running wakes
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.age += dt;
        d.alpha = Math.min(1, d.alpha + dt * 1.5);
        if (d.state === 'sit') {
          d.r += d.grow * dt;
          if (d.r >= d.runAt) d.state = 'run';
          else if (d.age > 12) {
            d.r -= dt * 0.7;
            if (d.r <= 1.2) { drops.splice(i, 1); continue; }
          }
        } else {
          d.vy = Math.min(d.vy + dt * 80, 120);
          d.wob += dt * 4.5;
          d.y += d.vy * dt;
          d.x += Math.sin(d.wob) * 0.22;
          d.r -= dt * 1.1;
          if (d.r <= 1.6 || d.y > H + 12) { drops.splice(i, 1); continue; }
        }
        drawDrop(d);
      }
    }
    return { update };
  })();

  // Reusable CanvasTexture sprite factory — re-renders on document.fonts.ready
  // (with the last payload) so JP glyphs never bake as tofu. Canvas work runs
  // only at construction/redraw, never per frame.
  function makeCanvasSprite(name, width, height, scale, drawFn) {
    const cv = document.createElement('canvas');
    cv.width = width;
    cv.height = height;
    const tex = new THREE.CanvasTexture(cv);
    const ctx = cv.getContext('2d');
    let _payload;
    function redraw(payload) {
      _payload = payload;
      ctx.clearRect(0, 0, width, height);
      drawFn(ctx, payload, width, height);
      tex.needsUpdate = true;
    }
    redraw();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => redraw(_payload));
    }
    const sprite = nameObject(new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })), name);
    sprite.scale.set(scale[0], scale[1], scale[2] || 1);
    return { sprite, redraw, texture: tex, canvas: cv };
  }

  function drawHudLabel(ctx, label, width, height, accent, variant) {
    const color = accent || '#39f0ff';
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    if (variant === 'primary') {
      ctx.strokeStyle = 'rgba(57,240,255,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, 18); ctx.lineTo(2, 2); ctx.lineTo(28, 2);
      ctx.moveTo(width - 28, 2); ctx.lineTo(width - 2, 2); ctx.lineTo(width - 2, 18);
      ctx.moveTo(2, height - 18); ctx.lineTo(2, height - 2); ctx.lineTo(28, height - 2);
      ctx.moveTo(width - 28, height - 2); ctx.lineTo(width - 2, height - 2); ctx.lineTo(width - 2, height - 18);
      ctx.stroke();
    }
    ctx.font = '500 28px "M PLUS Rounded 1c", "JetBrains Mono", monospace';
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.fillText(label.jp || label.en, 16, 34);
    ctx.shadowBlur = 0;
    if (variant === 'primary') {
      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(233,241,244,0.78)';
      ctx.fillText(label.en || '', 18, 54);
      ctx.fillStyle = 'rgba(255,158,44,0.78)';
      ctx.fillRect(width - 58, height - 18, 34, 2);
      ctx.fillRect(width - 18, height - 18, 8, 2);
    } else {                                  /* district: one quiet tick */
      ctx.fillStyle = color; ctx.globalAlpha = 0.7;
      ctx.fillRect(16, 44, 22, 2);
    }
    ctx.restore();
  }

  // (d) coordinate callout — CanvasTexture sprite, drawn once fonts are ready
  const callout = (function () {
    const cv = document.createElement('canvas');
    cv.width = 640; cv.height = 118;
    const tex = new THREE.CanvasTexture(cv);
    function draw(place) {
      const target = place || TOKYO_PLACE;
      const cx = cv.getContext('2d');
      cx.clearRect(0, 0, cv.width, cv.height);
      const isTokyo = target.id === 'tokyo';
      const accent = isTokyo ? '#ff9e2c' : '#ffd9a0';
      const heading = isTokyo ? '東京 / ' + target.label : target.label;
      const jst = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' });
      const status = isTokyo ? ('BASE: JST ' + jst + ' // SIGNAL ONLINE') : 'ORIGIN VECTOR // ROUTE TOKYO';
      cx.save();
      cx.strokeStyle = 'rgba(57, 240, 255, 0.42)';
      cx.lineWidth = 2;
      cx.beginPath();
      cx.moveTo(4, 24); cx.lineTo(4, 4); cx.lineTo(42, 4);
      cx.moveTo(cv.width - 42, 4); cx.lineTo(cv.width - 4, 4); cx.lineTo(cv.width - 4, 24);
      cx.moveTo(4, cv.height - 24); cx.lineTo(4, cv.height - 4); cx.lineTo(42, cv.height - 4);
      cx.moveTo(cv.width - 42, cv.height - 4); cx.lineTo(cv.width - 4, cv.height - 4); cx.lineTo(cv.width - 4, cv.height - 24);
      cx.stroke();
      cx.font = '500 32px "M PLUS Rounded 1c", "JetBrains Mono", monospace';
      cx.fillStyle = accent;
      cx.shadowColor = 'rgba(255,158,44,0.75)';
      cx.shadowBlur = 14;
      cx.fillText(heading, 18, 42);
      cx.shadowBlur = 0;
      cx.font = '500 15px "JetBrains Mono", monospace';
      cx.fillStyle = 'rgba(233, 241, 244, 0.82)';
      cx.fillText(status, 20, 70);
      cx.fillStyle = 'rgba(57, 240, 255, 0.78)';
      cx.fillText(target.detail, 20, 94);
      // v3.2d: the 9 amber barcode ticks were retired — pure noise that floated
      // detached at hero scale and collided with the coordinate line up close.
      cx.restore();
      tex.needsUpdate = true;
    }
    draw();
    // v3.1f: re-draw the FOCUSED place, not the Tokyo default — a fonts-ready tick
    // mid-sequence (about: dallas->tokyo) used to snap the callout back to Tokyo
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw(placeById(focusedPlaceId)));
    const sp = nameObject(new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: 0, depthWrite: false
    })), 'place-coordinate-callout');
    sp.scale.set(3.9, 0.72, 1);
    sp.position.copy(TOKYO).multiplyScalar(1.22).add(new THREE.Vector3(0, 0.45, 0));
    spin.add(sp);
    return { sprite: sp, draw };
  })();
  const calloutOffset = new THREE.Vector3(0, 0.45, 0);
  const _calloutV = new THREE.Vector3();   // v3.2n scratch — portrait header gate projection

  // v3.2k — the callout bakes "BASE: JST HH:MM" into its texture at draw()
  // time; with no periodic redraw it reads stale within a minute. Wake exactly
  // at the next minute boundary (not 60x/min), redraw the FOCUSED place, skip
  // work while the tab is hidden (visibilitychange repaints on return). A
  // 1/min texture refresh of live data is clock truth, not idle animation.
  (function alignCalloutClock() {
    let t = null;
    function wake() {
      clearTimeout(t);
      t = setTimeout(wake, 60000 - (Date.now() % 60000) + 50);
      if (document.hidden) return;
      callout.draw(placeById(focusedPlaceId));
    }
    t = setTimeout(wake, 60000 - (Date.now() % 60000) + 50);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  })();

  // (e) Dallas -> Tokyo great-circle arc (SLERP, lifted at mid-flight) + comet
  const DALLAS = placeVector(DALLAS_PLACE, R);
  const ARC_SEG = 128;
  const arcPts = new Float32Array((ARC_SEG + 1) * 3);
  (function buildArc() {
    const a = TOKYO.clone().normalize(), b = DALLAS.clone().normalize();
    const ang = a.angleTo(b), sA = Math.sin(ang);
    for (let i = 0; i <= ARC_SEG; i++) {
      const f0 = i / ARC_SEG;
      const v = b.clone().multiplyScalar(Math.sin((1 - f0) * ang) / sA)
        .add(a.clone().multiplyScalar(Math.sin(f0 * ang) / sA))
        .multiplyScalar(R * (1 + 0.22 * Math.sin(f0 * Math.PI)));
      v.toArray(arcPts, i * 3);
    }
  })();
  const arcGeo = makeGeometry('dallas-to-tokyo-arc', arcPts, 3);
  if (!arcGeo) return;
  arcGeo.setDrawRange(0, 0);
  let arcN = 0;
  const ARC_OPACITY = 0.7;
  const arcMat = new THREE.LineBasicMaterial({
    color: AMBER, transparent: true, opacity: ARC_OPACITY, blending: THREE.AdditiveBlending,
    depthWrite: false });   // v3.1f: depth writes from the arc clipped later-drawn glow fragments behind it (1px dark cuts through the halo)
  spin.add(nameObject(new THREE.Line(arcGeo, arcMat), 'dallas-to-tokyo-arc'));
  const cometGeo = makeGeometry('journey-comet-point', new Float32Array(3), 3);
  if (!cometGeo) return;
  const cometMat = new THREE.PointsMaterial({
    color: 0xffd9a0, size: 0.3, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  const comet = nameObject(new THREE.Points(cometGeo, cometMat), 'journey-comet-point');
  function setCometAt(head) {
    const safeHead = Math.max(0, Math.min(ARC_SEG, head));
    const cp = cometGeo.attributes.position.array, ci = safeHead * 3;
    const x = arcPts[ci], y = arcPts[ci + 1], z = arcPts[ci + 2];
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      console.error('[scene] non-finite comet position', { head, safeHead, ci, x, y, z });
      return;
    }
    cp[0] = x; cp[1] = y; cp[2] = z;
    cometGeo.attributes.position.needsUpdate = true;
  }
  setCometAt(0);
  spin.add(comet);

  // (f) atmosphere halo — 1 sprite, 0 render targets; sells "planet" on LITE too
  const halo = (function () {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const cx = cv.getContext('2d');
    const grad = cx.createRadialGradient(64, 64, 6, 64, 64, 64);
    grad.addColorStop(0, 'rgba(57,240,255,0.5)');
    grad.addColorStop(0.45, 'rgba(57,240,255,0.12)');
    grad.addColorStop(1, 'rgba(57,240,255,0)');
    cx.fillStyle = grad; cx.fillRect(0, 0, 128, 128);
    const sp = nameObject(new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0.13,
      blending: THREE.AdditiveBlending, depthWrite: false
    })), 'earth-atmosphere-halo');
    sp.scale.setScalar(7.5);
    coreGroup.add(sp);
    return sp;
  })();

  /* (f0) SP2 cool limb — replaces the uniform halo sprite with a terminator-biased
     back-side Fresnel scatter shell (rim brightest toward the sun, dying on the night
     limb). Parented to `spin` so normalize(position) shares uSunDir's geographic frame.
     Additive + depthWrite:false → cannot fill undrawn pixels (canvas stays transparent). */
  if (GLOBE_ELEV) {
    halo.visible = false;                                  // sprite off; shell is the atmosphere now
    const segW = LITE ? 24 : 48, segH = LITE ? 16 : 32;
    const limbMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      uniforms: { uSunDir: globeMat.uniforms.uSunDir, uReveal: globeMat.uniforms.uReveal },
      vertexShader: `
        varying vec3 vNormalV;
        varying vec3 vViewDirV;
        varying vec3 vSphereDir;
        void main() {
          vSphereDir = normalize(position);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormalV = normalize(normalMatrix * normal);
          vViewDirV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uSunDir;
        uniform float uReveal;
        varying vec3 vNormalV;
        varying vec3 vViewDirV;
        varying vec3 vSphereDir;
        void main() {
          float rim = pow(1.0 - abs(dot(vNormalV, vViewDirV)), 4.0);   // edge-weighted limb
          float day = smoothstep(-0.25, 0.30, dot(vSphereDir, uSunDir)); // 1 day/terminator, 0 night
          float yN = vSphereDir.y * 0.5 + 0.5;
          float front = mix(-0.15, 1.15, uReveal);                     // boot sweep; 1.15 = fully lit at rest
          float reveal = 1.0 - smoothstep(front, front + 0.15, yN);
          float band = smoothstep(front - 0.12, front, yN) * (1.0 - smoothstep(front, front + 0.12, yN));
          float a = min(rim * mix(0.05, 1.0, day) * reveal, 0.5) + band * 0.25 * day;
          gl_FragColor = vec4(vec3(0.224, 0.941, 1.0), a);             // cyan; additive scales RGB by a
        }`,
    });
    spin.add(nameObject(new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, segW, segH), limbMat), 'earth-limb-shell'));
  }

  /* Instrument palette anchors (dossier [DATA]: MGSV iDroid field #0f394c,
     active #b2f5fd, hue discipline 193-201; v3.2 law: no alert red — the
     palette is cyan/amber, complete (2026-07-08 law addendum, ruling 2). */
  const DL = { instrumentField: 0x0f394c, instrumentActive: 0xb2f5fd };

  /* (f2) holo-scan shell — a thin latitude scanline sweeping the planet like a
     slow radar pass (dossier: Soliton grammar; solograms, not atmosphere —
     the globe is INSTRUMENTED, never "photographed"; realistic rim rejected). */
  const holoScan = (function () {
    // Elevated: dissolve the ring's crisp inner/outer edge into a radial additive falloff
    // (band center R*1.001, half-width R*0.011) so the sweeping band melts into scatter.
    const mat = GLOBE_ELEV
      ? new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          uniforms: { uOpacity: { value: 0.1 } },
          vertexShader: `
            varying float vR;
            void main() { vR = length(position.xy); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
          fragmentShader: `
            uniform float uOpacity;
            varying float vR;
            void main() {
              float a = pow(1.0 - clamp(abs(vR - ${(R * 1.001).toFixed(4)}) / ${(R * 0.011).toFixed(4)}, 0.0, 1.0), 3.0);
              gl_FragColor = vec4(vec3(0.698, 0.961, 0.992), a * uOpacity);
            }`,
        })
      : new THREE.MeshBasicMaterial({ color: DL.instrumentActive, transparent: true,
          opacity: 0.1, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
    const m = nameObject(new THREE.Mesh(new THREE.RingGeometry(R * 0.99, R * 1.012, 96), mat), 'holo-scan-shell');
    m.rotation.x = Math.PI / 2;
    coreGroup.add(m);
    return m;
  })();

  /* (f3) celestial events — a patrolling satellite whose beacon blinks and
     occasionally downlinks to Tokyo (line-of-sight gated so the beam never
     pierces the planet), plus rare shooting stars. Event-gated, per-shot
     deliberate (dossier: never procedural clutter); off under reduced motion. */
  function makeStreakTexture(lengthFrac, headAlpha) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const g = cv.getContext('2d');
    const x0 = 64 + 8, y0 = 128 - Math.round(128 * lengthFrac);
    const x1 = 64 - 8, y1 = 122;
    const grd = g.createLinearGradient(x0, y0, x1, y1);
    grd.addColorStop(0, 'rgba(180, 235, 255, 0)');
    grd.addColorStop(0.55, 'rgba(180, 235, 255, ' + headAlpha * 0.45 + ')');
    grd.addColorStop(0.9, 'rgba(214, 244, 255, ' + headAlpha + ')');
    grd.addColorStop(1, 'rgba(214, 244, 255, 0)');
    g.strokeStyle = grd; g.lineCap = 'round';
    g.globalAlpha = 0.45; g.lineWidth = 9;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.globalAlpha = 1; g.lineWidth = 4;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    return new THREE.CanvasTexture(cv);
  }
  const celestial = (function () {
    if (reduced) return null;
    const sat = makeGlowSprite('orbit-satellite', 0.3,
      [[0, 'rgba(210,245,255,0.95)'], [0.35, 'rgba(57,240,255,0.4)'], [1, 'rgba(57,240,255,0)']]);
    sat.material.opacity = 0.5;
    coreGroup.add(sat);
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const linkMat = new THREE.LineBasicMaterial({ color: SCENE_COLORS.cyan, transparent: true,
      opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    coreGroup.add(nameObject(new THREE.Line(linkGeo, linkMat), 'satellite-downlink'));
    const star = nameObject(new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeStreakTexture(0.9, 0.9), transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false })), 'shooting-star');
    star.scale.setScalar(3);
    star.position.set(0, 0, -24);
    scene.add(camera);           // camera joins the graph so it can parent sky events
    camera.add(star);
    return {
      sat, linkGeo, linkMat, star,
      satA: Math.random() * 6.28, linkT: 0, starT: 0,
      nextLink: 60 + Math.random() * 60, nextStar: 12 + Math.random() * 30,   // v3.2m: idle downlink rarer — contact owns the beat
      starFrom: new THREE.Vector3(), starTo: new THREE.Vector3(), tokyoW: new THREE.Vector3(),
    };
  })();
  function updateCelestial(dt) {
    if (!celestial) return;
    const c = celestial;
    c.satA += dt * 0.16;                                     // ~40s orbit period
    c.sat.position.set(Math.cos(c.satA) * R * 1.6, Math.sin(c.satA) * R * 0.68, Math.sin(c.satA) * R * 1.42);
    c.sat.material.opacity = (Math.sin(c.satA * 34) > 0.55 ? 1 : 0.45) * 0.5;   // beacon blink
    c.nextLink -= dt;
    if (c.nextLink <= 0) {
      c.tokyoW.copy(TOKYO).multiplyScalar(1.02);
      spin.localToWorld(c.tokyoW);
      coreGroup.worldToLocal(c.tokyoW);
      const los = c.tokyoW.dot(c.sat.position) / (c.tokyoW.length() * c.sat.position.length());
      if (los > 0.25) { c.linkT = 1; c.nextLink = 90 + Math.random() * 90; }   // v3.2m: post-fire idle re-arm lengthened
      else c.nextLink = 4 + Math.random() * 6;   // Tokyo behind the disc — retry when it faces the sat
    }
    if (c.linkT > 0) {
      c.linkT = Math.max(0, c.linkT - dt * 0.7);
      c.tokyoW.copy(TOKYO).multiplyScalar(1.02);
      spin.localToWorld(c.tokyoW);
      coreGroup.worldToLocal(c.tokyoW);
      const lp = c.linkGeo.attributes.position.array;
      lp[0] = c.sat.position.x; lp[1] = c.sat.position.y; lp[2] = c.sat.position.z;
      lp[3] = c.tokyoW.x; lp[4] = c.tokyoW.y; lp[5] = c.tokyoW.z;
      c.linkGeo.attributes.position.needsUpdate = true;
      c.linkMat.opacity = c.linkT * 0.45;
    } else if (c.linkMat.opacity !== 0) c.linkMat.opacity = 0;
    c.nextStar -= dt;
    if (c.nextStar <= 0 && c.starT <= 0) {
      c.starT = 1;
      c.nextStar = 25 + Math.random() * 35;
      const dir = Math.random() < 0.5 ? 1 : -1;
      c.starFrom.set(dir * (8 + Math.random() * 6), 7 + Math.random() * 4, -24);
      c.starTo.set(-dir * (6 + Math.random() * 6), -2 - Math.random() * 4, -24);
      c.star.material.rotation = Math.atan2(c.starTo.y - c.starFrom.y, c.starTo.x - c.starFrom.x) + Math.PI / 2;
    }
    if (c.starT > 0) {
      c.starT = Math.max(0, c.starT - dt * 1.4);             // ~0.7s crossing
      const k = 1 - c.starT;
      c.star.position.lerpVectors(c.starFrom, c.starTo, k);
      c.star.material.opacity = Math.sin(k * Math.PI) * 0.75;
    } else if (c.star.material.opacity !== 0) c.star.material.opacity = 0;
  }

  /* Sheet lightning — a rare decaying double-flicker behind the globe; the
     rain flares with it (dossier: motivated light — the flash is an emitter).
     Off under reduced motion. */
  const lightning = (function () {
    if (reduced) return null;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    grd.addColorStop(0, 'rgba(210,235,255,0.85)');
    grd.addColorStop(0.55, 'rgba(140,190,230,0.25)');
    grd.addColorStop(1, 'rgba(140,190,230,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    const sp = nameObject(new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false })), 'sheet-lightning');
    sp.scale.set(46, 30, 1);
    sp.position.set(0, 6, -30);
    camera.add(sp);
    return { sp, t: 0, next: 16 + Math.random() * 30 };
  })();
  function updateLightning(dt) {
    if (!lightning) return 0;
    const L = lightning;
    L.next -= dt;
    if (L.next <= 0 && L.t <= 0) {
      L.t = 1;
      L.next = 30 + Math.random() * 42;
      L.sp.position.x = (Math.random() * 2 - 1) * 14;
    }
    if (L.t > 0) {
      L.t = Math.max(0, L.t - dt * 2.4);
      const k = 1 - L.t;
      const env = Math.max(0, Math.sin(k * Math.PI * 3)) * (1 - k * 0.7);
      L.sp.material.opacity = env * 0.24;
      return env;
    }
    if (L.sp.material.opacity !== 0) L.sp.material.opacity = 0;
    return 0;
  }

  /* Kiroshi scan-and-tag (dossier: CP2077 — scanned things acquire bracket
     tags with readouts, one confident tick; GITS — tags ASSEMBLE FROM
     PARTICLES). One tag live at a time; pointer-hover only (skipped on LITE
     and reduced). Coordinates below are PLACEHOLDERS until the owner supplies
     real shot locations — swap values in this one map. */
  const GALLERY_PLACES = {
    'gallery-01': { lat: 43.06, lon: 141.35, en: 'HOKKAIDO', jp: '北海道' },
    'gallery-02': { lat: 35.66, lon: 139.70, en: 'SHIBUYA', jp: '渋谷' },
    'gallery-03': { lat: 35.31, lon: 139.55, en: 'KAMAKURA', jp: '鎌倉' },
    'gallery-04': { lat: 34.69, lon: 135.50, en: 'OSAKA', jp: '大阪' },
    'gallery-05': { lat: 35.01, lon: 135.77, en: 'KYOTO', jp: '京都' },
    'gallery-07': { lat: 36.55, lon: 138.32, en: 'NAGANO', jp: '長野' },
    'gallery-08': { lat: 35.36, lon: 138.73, en: 'FUJI', jp: '富士' },
    'gallery-09': { lat: 32.75, lon: -96.80, en: 'DALLAS', jp: 'ダラス' },
    'gallery-10': { lat: 35.71, lon: 139.80, en: 'ASAKUSA', jp: '浅草' },
    'gallery-11': { lat: 26.21, lon: 127.68, en: 'OKINAWA', jp: '沖縄' },
    'gallery-13': { lat: 33.59, lon: 130.40, en: 'FUKUOKA', jp: '福岡' },
    'gallery-16': { lat: 38.26, lon: 140.87, en: 'SENDAI', jp: '仙台' },
  };
  const scanTag = (function () {
    if (reduced) return null;
    const group = new THREE.Group(); group.name = 'scan-tag';
    const marker = makeGlowSprite('scan-tag-marker', 0.5,
      [[0, 'rgba(178,245,253,0.9)'], [0.4, 'rgba(57,240,255,0.3)'], [1, 'rgba(57,240,255,0)']]);
    group.add(marker);
    let tagLabel = { en: '', jp: '' };
    const tag = makeCanvasSprite('scan-tag-label', 256, 72, [1.5, 0.42, 1], (ctx, p, w2, h2) => {
      const L = p || tagLabel;
      ctx.strokeStyle = 'rgba(178,245,253,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(2, 16); ctx.lineTo(2, 2); ctx.lineTo(22, 2);
      ctx.moveTo(w2 - 22, 2); ctx.lineTo(w2 - 2, 2); ctx.lineTo(w2 - 2, 16);
      ctx.moveTo(2, h2 - 16); ctx.lineTo(2, h2 - 2); ctx.lineTo(22, h2 - 2);
      ctx.moveTo(w2 - 22, h2 - 2); ctx.lineTo(w2 - 2, h2 - 2); ctx.lineTo(w2 - 2, h2 - 16);
      ctx.stroke();
      /* v3.2c: one instrument voice — the condensed HUD face is retired (name
         unspellable here: the harness pins its absence); JetBrains Mono (the DOM
         instrument face) takes the scan tag. 500 = heaviest weight the fonts
         link ships; 22px keeps the 17-char project tag inside the 256px canvas. */
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillStyle = '#b2f5fd';
      ctx.fillText(L.en || '', 16, 32);
      ctx.font = '500 20px "M PLUS Rounded 1c", sans-serif';
      ctx.fillStyle = 'rgba(255,158,44,0.85)';
      ctx.fillText(L.jp || '', 16, 58);
    });
    tag.sprite.position.set(0, 0.7, 0.1);
    group.add(tag.sprite);
    const N = 26;
    const asmGeo = new THREE.BufferGeometry();
    const asmPos = new Float32Array(N * 3);
    asmGeo.setAttribute('position', new THREE.BufferAttribute(asmPos, 3));
    const asmMat = new THREE.PointsMaterial({ color: 0xb2f5fd, size: 0.06, transparent: true,
      opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    group.add(nameObject(new THREE.Points(asmGeo, asmMat), 'scan-tag-assembly'));
    const seeds = new Float32Array(N * 3);
    const arcG = new THREE.BufferGeometry();
    arcG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(40 * 3), 3));
    const arcM = new THREE.LineBasicMaterial({ color: SCENE_COLORS.cyan, transparent: true,
      opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    spin.add(nameObject(new THREE.Line(arcG, arcM), 'scan-tag-arc'));
    group.visible = false;
    spin.add(group);
    return { group, marker, tag, setLabel: v => { tagLabel = v; }, asmGeo, asmPos, asmMat, seeds, N, arcG, arcM };
  })();
  let scanT = 0, scanActive = false;
  const _scanWorld = new THREE.Vector3();
  window.__scanPlace = (lat, lon, en, jp) => {
    if (!scanTag) return;
    const p = toV3(lat, lon, R * 1.04);
    scanTag.group.position.copy(p);
    _scanWorld.copy(p).multiplyScalar(2);
    spin.localToWorld(_scanWorld);
    scanTag.group.lookAt(_scanWorld);
    scanTag.setLabel({ en, jp });
    scanTag.tag.redraw({ en, jp });
    for (let i = 0; i < scanTag.N; i++) {
      scanTag.seeds[i * 3] = (Math.random() * 2 - 1) * 1.6;
      scanTag.seeds[i * 3 + 1] = (Math.random() * 2 - 1) * 1.6;
      scanTag.seeds[i * 3 + 2] = Math.random() * 1.2;
    }
    const a = TOKYO.clone().normalize(), b = p.clone().normalize();
    const arr = scanTag.arcG.attributes.position.array;
    for (let i = 0; i < 40; i++) {
      const k = i / 39;
      const v = a.clone().lerp(b, k).normalize().multiplyScalar(R * (1.02 + Math.sin(k * Math.PI) * 0.18));
      arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z;
    }
    scanTag.arcG.attributes.position.needsUpdate = true;
    scanT = 0; scanActive = true;
    scanTag.group.visible = true;
    sceneState.haloPulse = Math.max(sceneState.haloPulse, 0.5);   // one confident tick
  };
  window.__scanClear = () => { scanActive = false; };
  function updateScanTag(dt) {
    if (!scanTag) return;
    if (scanActive) scanT = Math.min(1, scanT + dt * 2.6);        // ~0.4s assembly
    else scanT = Math.max(0, scanT - dt * 3.2);
    if (scanT <= 0.001) {
      if (scanTag.group.visible) { scanTag.group.visible = false; scanTag.arcM.opacity = 0; }
      return;
    }
    const k = scanT, ease = k * k * (3 - 2 * k);
    for (let i = 0; i < scanTag.N; i++) {                          // particles converge on the tag
      const tx = ((i % 13) / 12 - 0.5) * 2.6, ty = 0.7 + (i > 12 ? -0.16 : 0.16);
      scanTag.asmPos[i * 3] = scanTag.seeds[i * 3] + (tx - scanTag.seeds[i * 3]) * ease;
      scanTag.asmPos[i * 3 + 1] = scanTag.seeds[i * 3 + 1] + (ty - scanTag.seeds[i * 3 + 1]) * ease;
      scanTag.asmPos[i * 3 + 2] = scanTag.seeds[i * 3 + 2] * (1 - ease) + 0.1 * ease;
    }
    scanTag.asmGeo.attributes.position.needsUpdate = true;
    scanTag.asmMat.opacity = Math.sin(Math.min(1, k * 1.4) * Math.PI) * 0.8;
    scanTag.marker.material.opacity = ease * 0.75;
    scanTag.tag.sprite.material.opacity = Math.max(0, ease - 0.35) * 1.4;      // tag snaps in after particles
    scanTag.arcM.opacity = ease * 0.4;
  }
  {   // SP3: focus/blur a11y mirrors ALWAYS (keyboard/AT + aria-live, even under reduced); pointer-hover scan only non-reduced non-LITE
    const wire = (el, enter, leave) => {
      if (!reduced && !LITE) { el.addEventListener('pointerenter', enter); el.addEventListener('pointerleave', leave); }
      el.addEventListener('focus', enter); el.addEventListener('blur', leave);
    };
    document.querySelectorAll('.gallery-grid .shot').forEach(el => {
      const key = ((el.dataset.src || '').match(/gallery-\d+/) || [])[0];
      const place = GALLERY_PLACES[key];
      if (!place) return;
      wire(el,
        () => { if (window.__scanPlace) window.__scanPlace(place.lat, place.lon, place.en, place.jp); if (hud) hud.live.textContent = 'Gallery — ' + place.en; },
        () => { if (window.__scanClear) window.__scanClear(); });
    });
    document.querySelectorAll('.projects .proj-grid').forEach(el => {
      const name = ((el.querySelector('.row-title, h3, .proj-name') || {}).textContent || 'PROJECT').trim();   // FIX: markup is .row-title
      const year = ((el.querySelector('.proj-year') || {}).textContent || '').trim().slice(0, 4);
      wire(el,
        () => { if (window.__scanPlace) window.__scanPlace(35.6762, 139.6503, ('SIG: ' + name).toUpperCase().slice(0, 17), year ? 'PRJ//' + year : 'PRJ'); },
        () => { if (window.__scanClear) window.__scanClear(); });
    });
  }

  let rainSway = 0, rainShear = 0, lastScrollY2 = 0, rainTintK = 0, rainWindT = 0;   // v3.3a: rainWindT = ∫wind dt — the GPU x-drift clock
  let shearHold = null;   // v3.3a QA lever (lean captures): forced-shear hold; settable ONLY via the sceneDebug hook below — null on every real page
  if (sceneDebug) window.__rainShear = v => { shearHold = (typeof v === 'number') ? Math.max(-0.6, Math.min(0.6, v)) : null; return shearHold; };
  let idleT = 0, idleK = 0;                                   // idle cinematics state
  ['pointermove', 'pointerdown', 'wheel', 'keydown', 'touchstart', 'scroll'].forEach(ev =>
    window.addEventListener(ev, () => { idleT = 0; }, { passive: true }));
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
  const _wellP = new THREE.Vector3(), _wellN = new THREE.Vector3(), _wellC = new THREE.Vector3();
  function setWell(well, worldV, strength) {
    // world→screen: the exact path the DOM HUD reticle uses (interrogate(), :1577-1580)
    // — matrixWorldInverse is one render stale here; irrelevant at falloff scale.
    _wellC.copy(worldV).applyMatrix4(camera.matrixWorldInverse);   // camera-space depth
    if (_wellC.z > -0.1) { well.s = 0; return; }                   // at/behind the camera — dark
    _wellN.copy(worldV).project(camera);
    const edge = Math.max(Math.abs(_wellN.x), Math.abs(_wellN.y));
    well.s = strength * (1 - THREE.MathUtils.smoothstep(edge, 0.9, 1.5)); // screen-space falloff as the emitter leaves frame
    well.z = _wellC.z;
    well.x = _wellN.x; well.y = _wellN.y;   // v3.3a: the NDC seat rides to the GPU as uWells[i].xy
  }
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

  // (g) orbital scan ring — equatorial, does not rotate with the land
  const ringMat = new THREE.MeshBasicMaterial({
    color: CYAN, transparent: true, opacity: 0.16,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
  const ring = nameObject(new THREE.Mesh(new THREE.RingGeometry(R * 1.32, R * 1.36, 96), ringMat), 'orbital-scan-ring');
  ring.rotation.x = Math.PI / 2.05;
  coreGroup.add(ring);

  let focusedPlaceId = 'tokyo';
  let focusFlash = 0;
  let focusedA0 = tokyoA0;   // v3.2m: focused place's xz rest angle — the spin-bias target
  function setFocusedPlace(id, intensity) {
    focusedPlaceId = placeById(id).id;
    focusFlash = Math.max(focusFlash, intensity || 1);
    const fv = placeVector(placeById(focusedPlaceId), R);   // one alloc per focus CHANGE, never per frame
    focusedA0 = Math.atan2(fv.z, fv.x);
    if (callout && callout.draw) callout.draw(placeById(focusedPlaceId));
  }
  function updateTokyoHalo(f, focusedFacing, tokyoFacing) {
    if (!tokyoHalo) return;
    // v3.1f: local was named `halo`, shadowing the atmosphere-halo sprite (:889) — renamed
    const haloK = sceneState.halo, lab = sceneState.labels;
    const pulse = sceneState.haloPulse, lock = sceneState.lockT;
    // spin ONLY rings/ticks/packet; a faster sweep during the signal-lock
    tokyoHalo.spinGroup.rotation.z += 0.0016 * f * (LITE ? 0.5 : 1) + lock * 0.02 * f;
    tokyoHalo.group.visible = haloK > 0.02;
    tokyoHalo.rings.forEach((r, i) => {                       // ring keeps a small floor so the hub reads as "there"
      const base = i === 0 ? 0.24 : 0.12;
      r.material.opacity = (0.10 + tokyoFacing * 0.9) * haloK * (base + pulse * 0.10 + lock * 0.25);
    });
    if (tokyoHalo.ticks) tokyoHalo.ticks.material.opacity = tokyoFacing * haloK * (0.20 + pulse * 0.18);
    if (tokyoHalo.transit) tokyoHalo.transit.material.opacity = tokyoFacing * haloK * (0.14 + lock * 0.2);
    if (tokyoHalo.stations) tokyoHalo.stations.material.opacity = tokyoFacing * haloK * (0.3 + pulse * 0.3);
    if (tokyoHalo.glow) tokyoHalo.glow.material.opacity = (0.10 + tokyoFacing * 0.5) * haloK * (0.4 + pulse * 0.8 + lock * 1.0 + idleK * 0.35);
    tokyoHalo.labels.forEach(sp => {                          // per-label facing gate: only 1–2 read at once
      const a = (sp.userData.label.angle || 0) * Math.PI / 180;
      const lf = Math.max(0, Math.cos(a - spin.rotation.y + tokyoA0));
      // priority-1 labels keep a floor so TOKYO/JST stay legible at Tokyo dead-centre,
      // where their own facing term bottoms out (browser-verified phase gap).
      // v3.1f: floor 0.45 -> 0.3 (post-merge ledger) — labels sit quieter off-phase
      const gate = Math.max(lf * lf, sp.userData.label.priority === 1 ? 0.3 : 0);
      sp.material.opacity = tokyoFacing * lab * gate * (LITE ? 0.72 : 0.9);
    });
    if (tokyoHalo.packet && tokyoHalo.packetMat) {            // packet is event-gated, never a perpetual orbit
      const p = Math.max(pulse, lock);
      tokyoHalo.packet.visible = p > 0.03;
      // v3.1f: buffer write gated on visibility (was every frame, ledger nit)
      if (tokyoHalo.packet.visible) tokyoHalo.setPacketAt(t * 0.22);   // ~15s per lap of the transit loop
      tokyoHalo.packetMat.opacity = tokyoFacing * haloK * p * 0.9;
    }
  }
  function replayJourney() {
    arcN = 0;
    arcMat.opacity = ARC_OPACITY;
    arcGeo.setDrawRange(0, 0);
    setCometAt(0);
  }
  let seqArrival = null;   // v3.2m: pending sequence payload — fires on arc ARRIVAL (arcN >= ARC_SEG), not wall-clock
  const ZERO_SHIFT = [0, 0];
  const sectionStories = {
    home: {
      place: 'tokyo', sequence: null, intensity: 1.2, route: 'replay',
      halo: 1, rain: 1, labels: 1, callout: 1, camera: 0, grid: 1,   // v3.2l: veil retired — rain is presence; density comes from motivated light
    },
    about: {
      place: 'tokyo', sequence: ['dallas', 'tokyo'], intensity: 0.95, route: 'replay',
      halo: 0.85, rain: 1, labels: 0.85, callout: 1, camera: -0.2, grid: 1,
    },
    work: {
      place: 'tokyo', sequence: null, intensity: 0.85, route: 'hold',
      halo: 1.15, rain: 1, labels: 1, callout: 0.9, camera: 0, grid: 1, shift: [-1.2, -2.0],   // v3.2o: globe eases left+deeper — row titles never sit on the bright disc
    },
    gallery: {
      place: 'tokyo', sequence: null, intensity: 0.45, route: 'hold',
      halo: 0.45, rain: 0.3, labels: 0.35, callout: 0.35, camera: 0.15, grid: 0.06,
    },
    projects: {
      place: 'dallas', sequence: null, intensity: 0.75, route: 'hold',
      halo: 0.35, rain: 1, labels: 0.2, callout: 0.65, camera: -0.1, grid: 1,
    },
    contact: {
      place: 'tokyo', sequence: null, intensity: 1.0, route: 'hold',
      halo: 1.25, rain: 1, labels: 1, callout: 1, camera: 0, grid: 1,
    },
  };
  const sceneState = {
    section: 'home', story: sectionStories.home,
    halo: sectionStories.home.halo, rain: sectionStories.home.rain,
    labels: sectionStories.home.labels, callout: sectionStories.home.callout,
    camera: sectionStories.home.camera,
    grid: sectionStories.home.grid,
    haloPulse: 0,
    shiftX: 0, shiftZ: 0,   // v3.2o: eased per-section globe offset (only work sets a target)
    lockT: 1,          // signal-lock timer (1 → 0), drives ring sweep + glow bloom; starts armed —
                       // boot IS the home entry (effects.js never emits an initial section focus)
  };
  let storyCooldown = 0;                       // seconds; guards re-arming on scroll jitter
  /* v3.2r — forward-only focus-bias: while a story window is open the spin
     carries a small ADDED forward rate so the callout's facing gate is met
     when the beat fires. ONE-SIGNAL RULE, held by construction, not tuning:
     the per-frame regime target biasTarget is clamped to [0, cap] — a place
     BEHIND the current facing (e <= 0) is never chased, so the added rate is
     never negative — and the APPLIED rate (focusBiasRate) is the only thing
     integrated into the angle. What is ramped: focusBiasRate slews toward
     biasTarget at BIAS_SLEW_RADS_PER_S2, so EVERY regime edge — onset, the
     seqArrival mid-window flip, window expiry, re-arm mid-decay — moves the
     applied rate by at most 0.15 * dt <= 0.005 rad/s per frame (dt clamps at
     0.033, see loop()); the slew approaches a clamped target from the current
     value, so the rate can never overshoot the cap. Invariant: total y-rate
     = autonomous 0.066 (0.22 spinBase * 0.3 t-scale) + focusBiasRate, always
     in [0.066, 0.121] rad/s (absent user scroll — spinBase also carries the
     absolute, scrubbed scrollNS * 2.4 term) — never frozen, never reversed. Cap derivation:
     safety is structural for any cap < 0.066, so the cap trades margin for
     beat coverage — 0.055 keeps 0.011 rad/s (17%) margin, peaks at 1.83x
     autonomous (below the ~2x subliminal ceiling), and covers cap * window
     ~= 0.33 rad added (~0.72 rad ahead-geometry with the autonomous 0.40) —
     places further behind stay partially faced; accepted over a perceptible
     steer. SUPERSEDES the plan-pinned 0.12 (2026-07-08 plan :2593): 0.12
     exceeds the autonomous rate — a spec defect, measured live at 5a4480e as
     a -0.054 rad/s visible reverse during the state-word. The accumulated
     phase offset is KEPT after the window (unwinding it would need a negative
     added rate); it is bounded per window and spinBase is unbounded anyway. */
  let focusBias = 0, focusBiasT = 0, focusBiasRate = 0;
  const BIAS_MAX_RADS_PER_SEC = 0.055;   // added-rate cap — MUST stay < autonomous 0.066 (harness pins this)
  const BIAS_WINDOW_S = 6;
  const BIAS_SLEW_RADS_PER_S2 = 0.15;    // applied-rate slew: 0 -> cap in ~0.37s; bounds every regime edge
  window.__sceneFocus = sectionId => {
    const story = sectionStories[sectionId] || sectionStories.home;
    const id = sectionStories[sectionId] ? sectionId : 'home';
    const sameSection = id === sceneState.section;
    sceneState.section = id;
    sceneState.story = story;                  // target always updates (interpolation continues)
    if (sameSection || storyCooldown > 0) {     // guard re-arming replay/pulse on scroll jitter
      if (!sameSection) {                       // focus still tracks the section; kill any pending
        seqArrival = null;                      // arrival payload so a dead section can't hijack it
        setFocusedPlace(story.sequence ? story.sequence[1] : story.place, story.intensity * 0.85);
      }
      return;
    }
    storyCooldown = 0.6;
    focusBiasT = BIAS_WINDOW_S;   // v3.2m: open the subliminal facing window
    sceneState.haloPulse = Math.max(sceneState.haloPulse, story.intensity || 1);
    if (id === 'home') sceneState.lockT = 1;   // signal-lock beat (boot/home only)
    /* v3.2m — contact's own signature: fire the existing LOS-gated satellite
       downlink on section lock (the callout already reads SIGNAL ONLINE).
       REPLACES the duplicated home lockT copy — one signal per section-change
       is preserved: replace, never add. Null under reduced (no celestial). */
    if (id === 'contact' && celestial) celestial.nextLink = 0;
    if (id === 'projects') rainTintK = 1;   // v3.2d: rain warms on the ENTRY beat, ~2s decay
    seqArrival = null;
    if (story.route === 'replay') replayJourney();
    if (story.sequence) {
      /* v3.2m — narrative sync: the second beat fires when the comet ARRIVES
         (arcN >= ARC_SEG), replacing the desynced 650ms wall-clock timer.
         The callout announces TOKYO exactly when the journey lands. */
      setFocusedPlace(story.sequence[0], story.intensity);
      seqArrival = { place: story.sequence[1], intensity: story.intensity * 0.85 };
      return;
    }
    setFocusedPlace(story.place, story.intensity);
  };

  let fpsEMA = 60;   // declared before the reduced branch runs — getSceneDebug must never TDZ-crash
  function getSceneDebug() {
    return {
      quality: quality.name,
      dpr,
      lite: LITE,
      reduced,
      globeParticles: globeFilled,
      expectedGlobeParticles: GLOBE_N,
      activeSection: sceneState.section,
      halo: Number(sceneState.halo.toFixed(3)),
      rain: Number(sceneState.rain.toFixed(3)),
      labels: Number(sceneState.labels.toFixed(3)),
      callout: Number(sceneState.callout.toFixed(3)),
      lockT: Number(sceneState.lockT.toFixed(3)),
      fps: Math.round(fpsEMA),
      focusedPlaceId,
      arcHead: Math.floor(arcN),
      arcSegments: ARC_SEG,
      // v3.2r probe surface — raw (unrounded): rad/s deltas are ~1e-3/frame
      spinY: spin.rotation.y,
      focusedA0,
      focusBias,
      focusBiasRate,
      focusBiasT,
    };
  }
  function updateDebugText() {
    if (!debugEl) return;
    const d = getSceneDebug();
    debugEl.textContent = [
      'scene=' + d.quality,
      'dpr=' + d.dpr,
      'particles=' + d.globeParticles + '/' + d.expectedGlobeParticles,
      'section=' + d.activeSection,
      'halo=' + d.halo,
      'rain=' + d.rain,
      'focus=' + d.focusedPlaceId,
      'arc=' + d.arcHead + '/' + d.arcSegments,
      'fps=' + d.fps,
      'lite=' + d.lite,
      'reduced=' + d.reduced,
    ].join(' // ');
  }
  if (sceneDebug) window.__sceneDebug = getSceneDebug;

  // ---- synthwave grid ----
  // v3.2d: centre lines de-ambered (amber is an EVENT, never wallpaper) — a
  // brighter member of the 0x10303a family keeps the axis readable; opacity
  // rides sceneState.grid (near-0 in gallery so the photographs own the frame).
  const grid = nameObject(new THREE.GridHelper(160, 70, 0x1a4a5a, 0x10303a), 'synthwave-grid');
  grid.material.transparent = true; grid.material.opacity = 0.2; grid.material.blending = THREE.AdditiveBlending;
  grid.position.y = -7; scene.add(grid);

  // v3.2d: the static vertical data streaks (40 on high tier) were retired —
  // they duplicated the starfield's job (calm-the-signals: a layer with no
  // distinct job is a layer to delete).

  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', e => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = (e.clientY / innerHeight) * 2 - 1; });

  // ---- SP3 globe interrogation: analytic-sphere pick -> nearest place ----
  const ptr = { x: 0, y: 0, inside: false };   // TRUE flipped-NDC (mouse above is not NDC)
  addEventListener('pointermove', e => {
    ptr.x = (e.clientX / innerWidth) * 2 - 1;
    ptr.y = -(e.clientY / innerHeight) * 2 + 1;
    ptr.inside = true;
  });
  addEventListener('pointerleave', () => { ptr.inside = false; });

  // SP3 select: tap (not drag/parallax) -> content. gallery photo -> lightbox; tokyo/dallas -> #about.
  let _downX = 0, _downY = 0;
  addEventListener('pointerdown', e => { _downX = e.clientX; _downY = e.clientY; });
  /* v3.2n — seam guard: the global tap-select must yield to real UI. On phones
     the globe disc sits behind the hero name and the gallery tiles, so an
     unguarded pick DOUBLE-ACTIVATES (tile tap = lightbox AND city-select; hero-
     name tap = surprise scroll to #about; lightbox-scrim tap = close AND
     re-select, breaking the focus-restore contract). Bail while an overlay owns
     the screen, and when the tap landed on interactive/overlay DOM. */
  const lbGuard = document.querySelector('.lightbox');
  addEventListener('pointerup', e => {
    if (Math.hypot(e.clientX - _downX, e.clientY - _downY) > 8) return;   // drag/parallax, not a tap
    if (lbGuard && lbGuard.classList.contains('open')) return;
    if (document.body.classList.contains('menu-open')) return;
    if (e.target && e.target.closest &&
        e.target.closest('a, button, input, .shot, .lightbox, .mobile-menu, .scroll-hud, nav, .deck')) return;
    /* h1 guards TOUCH only: on phones the hero name overlays the disc (tap =
       surprise scroll), but on desktop the h1 block box invisibly spans the
       whole node region — a mouse arm here would kill click-select that the
       hover HUD just advertised. Mouse clicks pass through to the pick. */
    if (e.pointerType !== 'mouse' && e.target && e.target.closest && e.target.closest('h1')) return;
    ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1; ptr.inside = true;
    const r = pickPlace(); if (r && r.place) selectPlace(r.place);
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (window.__scanClear) window.__scanClear(); hud.root.classList.remove('on'); } });
  function selectPlace(p) {
    if (p.kind === 'photo' && p.domRef) { p.domRef.click(); }               // app.js openLb() (:233)
    else if (p.kind === 'tokyo' || p.kind === 'dallas') {
      if (typeof setFocusedPlace === 'function') setFocusedPlace(p.id, 1);
      const about = document.getElementById('about'); if (about) about.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const _pk = new THREE.Vector3(), _hit = new THREE.Vector3(), _cw = new THREE.Vector3();
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
  const PICK_COS = Math.cos(8 * Math.PI / 180);   // ~8deg snap radius
  function pickPlace() {
    camera.updateMatrixWorld();   // ray origin needs a fresh camera matrix when picking outside the render tick
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
  // (SP3 dev pick/diagnostic hooks stripped for ship)

  // DOM HUD overlay (crisp text + a11y). Snaps to the acquired place's projected screen pos.
  const hud = (function () {
    const style = document.createElement('style');
    style.textContent =
      '#globe-hud{position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;transition:opacity .12s}' +
      '#globe-hud.on{opacity:1}' +
      '#globe-hud .ret{position:absolute;transform:translate(-50%,-50%);width:34px;height:34px}' +
      '#globe-hud .ret::before,#globe-hud .ret::after{content:"";position:absolute;background:rgba(57,240,255,.85)}' +
      '#globe-hud .ret::before{left:50%;top:0;width:1px;height:100%;transform:translateX(-50%)}' +
      '#globe-hud .ret::after{top:50%;left:0;height:1px;width:100%;transform:translateY(-50%)}' +
      '#globe-hud .box{position:absolute;width:34px;height:34px;transform:translate(-50%,-50%);' +
      'box-shadow:inset 0 0 0 1px rgba(57,240,255,.5);border-radius:2px}' +
      '#globe-hud .lead{position:absolute;height:1px;background:linear-gradient(90deg,rgba(57,240,255,.6),rgba(57,240,255,0));transform-origin:0 50%}' +
      '#globe-hud .lbl{position:absolute;transform:translateY(-50%);font:600 11px/1.35 "JetBrains Mono",monospace;' +
      'color:rgba(57,240,255,.92);letter-spacing:.08em;white-space:nowrap;text-shadow:0 0 8px rgba(57,240,255,.35)}' +
      '#globe-hud .lbl b{color:#ffd9a0;font-weight:600}' +
      '.gallery-grid .shot:focus-visible,.projects .proj-grid:focus-visible{outline:2px solid rgba(57,240,255,.8);outline-offset:3px}' +
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

  let hoverPlace = null, hoverId = null, hoverPending = null, hoverPendT = 0;
  let dwellT = 0, lastDwellId = null, scannedId = null;
  function interrogate(dt) {
    const r = ptr.inside ? pickPlace() : null;
    const pendId = r && r.place ? r.place.id : null;
    if (pendId !== (hoverPending && hoverPending.place ? hoverPending.place.id : null)) { hoverPending = r; hoverPendT = 0; }
    else hoverPendT += dt;
    const settledId = hoverPending && hoverPending.place ? hoverPending.place.id : null;
    if (settledId !== hoverId && hoverPendT >= 0.09) {   // debounce place-change
      hoverPlace = hoverPending; hoverId = settledId;
      if (hoverPlace) hud.live.textContent = (hoverPlace.place.kind === 'photo' ? 'Gallery — ' : '') + hoverPlace.place.label;
    }
    if (!hoverPlace) {
      hud.root.classList.remove('on');
      if (scannedId) { window.__scanClear && window.__scanClear(); scannedId = null; }
      dwellT = 0; lastDwellId = null; return;
    }
    // snap the reticle to the acquired place's projected screen position
    _proj.copy(hoverPlace.place.dir).multiplyScalar(R); spin.localToWorld(_proj);
    camera.updateMatrixWorld(); _proj.project(camera);
    if (_proj.z > 1) { hud.root.classList.remove('on'); return; }   // clipped
    const sx = (_proj.x * 0.5 + 0.5) * innerWidth, sy = (-_proj.y * 0.5 + 0.5) * innerHeight;
    hud.root.classList.add('on');
    hud.ret.style.left = hud.box.style.left = sx + 'px'; hud.ret.style.top = hud.box.style.top = sy + 'px';
    const lead = 46;
    hud.lead.style.left = (sx + 12) + 'px'; hud.lead.style.top = (sy - 12) + 'px';
    hud.lead.style.width = lead + 'px'; hud.lead.style.transform = 'rotate(-30deg)';
    hud.lbl.style.left = (sx + 20 + lead * 0.9) + 'px'; hud.lbl.style.top = (sy - 28) + 'px';
    const p = hoverPlace.place;
    hud.lbl.innerHTML = '<b>' + p.label + '</b>' + (p.jp ? ' ' + p.jp : '') + '<br>' + fmtCoord(hoverPlace.lat, hoverPlace.lon);
    // dwell -> focus scan-tag (the one animated step)
    if (hoverPlace.place.id === lastDwellId) dwellT += dt;
    else { dwellT = 0; lastDwellId = hoverPlace.place.id; if (scannedId && scannedId !== hoverPlace.place.id) { window.__scanClear && window.__scanClear(); scannedId = null; } }
    if (dwellT >= 0.40 && scannedId !== hoverPlace.place.id && window.__scanPlace) {
      window.__scanPlace(p.lat, p.lon, p.label, p.jp || ''); scannedId = p.id;
    }
  }

  /* Debounced resize — raw handler reallocated the GL backbuffer dozens of
     times/sec during window drags, and iOS fires resize on URL-bar collapse
     mid-scroll, so small height-only deltas on touch are ignored entirely. */
  let maxScroll = Math.max(1, document.body.scrollHeight - innerHeight);
  let resizeTm;

  /* ------------------------------------------------------------------ *
   *  POSTPROCESSING — SP1 bloom + SP4 grade/CA, high tier only.        *
   *  Two-composer selective DARK-MATERIAL-SWAP (NOT camera.layers, R8),*
   *  alpha-preserving via a NoBlending mixPass (R2). Fully decoupled:   *
   *  composers stay null unless enabled; render() falls back to the     *
   *  direct path on LITE/reduced (R7). ON by default (high tier).       *
   * ------------------------------------------------------------------ */
  // SP4: bloom is ON by default (high tier). The ?bloom=1 spike flag is retired.
  const bloomEnabled = quality.name === 'high' && !reduced &&
                       !!(window.POST && window.POST.EffectComposer);
  let bloomComposer = null, finalComposer = null, renderBloomThenFinal = null;

  if (bloomEnabled) {
    const POST = window.POST;
    const BLOOM_STRENGTH = 0.9, BLOOM_RADIUS = 0.5, BLOOM_THRESHOLD = 0.6;   // spike-tunable (gate #4)

    // (a) Tag emitters — userData.bloom keeps their real material through the dark pass.
    //     Source intensities already sit in [0,1]; bloom is a blow-out multiplier (R14).
    [fieldCyan, fieldAmber, tokyoRing, comet].forEach(o => { o.userData.bloom = true; });
    tokyoHalo.glow.userData.bloom = true;                       // glow Sprite (makeGlowSprite, 497)
    tokyoHalo.rings.forEach(r => { r.userData.bloom = true; }); // ring meshes/line (487-491)
    // Inline-added objects (no variable handle) — tag by their nameObject() name:
    //   globe Points  background.js:260  'earth-land-particles'
    //   arc   Line    background.js:816  'dallas-to-tokyo-arc'
    const bloomByName = new Set(['earth-land-particles', 'dallas-to-tokyo-arc']);
    scene.traverse(o => { if (bloomByName.has(o.name)) o.userData.bloom = true; });
    // Explicitly EXCLUDED (design §2c "instrument only the focus"): fieldDeep starfield,
    // depth-rain, holo-scan-shell, satellite, transit/stations/packet, halo text labels.

    // (b) bloomComposer — renders ONLY tagged emitters (rest swapped to black), off-screen.
    bloomComposer = new POST.EffectComposer(renderer);   // no type arg -> HalfFloatType RGBA16F LINEAR target (EffectComposer.js:27)
    /* v3.2e: renderer {antialias:true} only multisamples the DEFAULT framebuffer;
       composer passes rasterize into plain targets, so the high tier shipped
       WORSE line quality (graticule, arc, transit loop) than LITE's direct path.
       samples=4 = WebGL2 MSAA, auto-resolved on sample; EffectComposer.setSize
       reallocates targets preserving .samples, so resize keeps it. Set before
       first render — targets allocate lazily on first bind. */
    bloomComposer.renderTarget1.samples = 4;
    bloomComposer.renderTarget2.samples = 4;
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(new POST.RenderPass(scene, camera));
    bloomComposer.addPass(new POST.UnrealBloomPass(
      new THREE.Vector2(w, h), BLOOM_STRENGTH, BLOOM_RADIUS, BLOOM_THRESHOLD));

    // (c) mixPass — ADD glow rgb, KEEP base alpha, NoBlending overwrite (design §2b — THE fix).
    const mixPass = new POST.ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture:  { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `,
        fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          varying vec2 vUv;
          void main() {
            vec4 base  = texture2D( baseTexture,  vUv );
            vec4 bloom = texture2D( bloomTexture, vUv );
            gl_FragColor = vec4( base.rgb + bloom.rgb, base.a );
          }
        `,
      }),
      'baseTexture'
    );
    mixPass.needsSwap = true;
    mixPass.material.blending = THREE.NoBlending;   // NOT transparent=true — overwrite the stale target

    // (c2) gradePass — analytic lift/gamma/gain + gentle saturation, in
    //      DISPLAY-referred sRGB (runs AFTER OutputPass). NoBlending, alpha
    //      straight through. v3.1: teal shadow crush neutralised (uTealAmt 0)
    //      and lift pulled uniformly negative — shadows sink to true black so
    //      the scene sits on the deep-black CSS floor; amber-highlight gain
    //      (the signal look) stays.
    const gradePass = new POST.ShaderPass(new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uLift:    { value: new THREE.Vector3(-0.02, -0.02, -0.02) }, // neutral crush: all channels down, no teal cast
        uGamma:   { value: new THREE.Vector3( 1.00, 1.00, 1.04) },   // mids
        uGain:    { value: new THREE.Vector3( 1.05, 1.00, 0.97) },   // highlights lean amber (signal)
        uTeal:    { value: new THREE.Vector3( 0.00, 0.020, 0.030) }, // shadow floor colour (inert at uTealAmt 0)
        uTealAmt: { value: 0.0 },
        uSat:     { value: 1.06 },                                   // keep cyan lead / amber pop
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec3 uLift, uGamma, uGain, uTeal;
        uniform float uTealAmt, uSat;
        varying vec2 vUv;
        const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
        void main(){
          vec4 src = texture2D(tDiffuse, vUv);
          vec3 c = src.rgb;

          // (1) lift/gamma/gain (ASC-CDL-ish). Lift weighted by (1-c) => tints shadows
          //     toward teal-black WITHOUT washing highlights.
          c = c * uGain + uLift * (1.0 - c);
          c = clamp(c, 0.0, 1.0);
          c = pow(c, 1.0 / uGamma);

          // (2) crush blacks toward a teal-black floor, strongest in shadows
          float luma   = dot(c, LUMA);
          float shadow = 1.0 - smoothstep(0.0, 0.35, luma);
          c = mix(c, max(c, uTeal), shadow * uTealAmt);

          // (3) gentle saturation
          c = mix(vec3(dot(c, LUMA)), c, uSat);

          gl_FragColor = vec4(clamp(c, 0.0, 1.0), src.a);   // alpha straight through
        }
      `,
    }));
    gradePass.material.blending = THREE.NoBlending;

    // (c3) caPass — radial chromatic aberration ("worn projected glass" fringe),
    //      display-space, LAST in the chain. R/B sampled at ±radial offset; G AND
    //      alpha at the un-offset CENTRE tap => undrawn pixels stay alpha 0 (no ghost).
    const caPass = new POST.ShaderPass(new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uAmount:  { value: 0.0035 },     // edge fringe, uv units; tune 0.002..0.006
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uAmount;
        varying vec2 vUv;
        void main(){
          vec2  dir = vUv - 0.5;                 // radial from centre; 0 at centre (no normalize -> no NaN)
          float d   = length(dir);
          vec2  off = dir * (uAmount * d);       // |off| = uAmount * d^2  -> lens falloff
          float r = texture2D(tDiffuse, vUv + off).r;
          vec4  c = texture2D(tDiffuse, vUv).rgba;   // CENTRE tap: green + the alpha we keep
          float b = texture2D(tDiffuse, vUv - off).b;
          // v3.2e: +-0.5/255 hash dither at the ONLY 8-bit quantisation point in
          // the chain (intermediate targets are HalfFloat). Deep-black gradients
          // are the worst banding case for the #05060a floor; one LSB of spatial
          // noise breaks the bands. The fixed-point canvas write clamps negatives.
          float dth = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 255.0 - 0.5 / 255.0;
          gl_FragColor = vec4(r + dth, c.g + dth, b + dth, c.a);   // <-- centre alpha => undrawn stays 0
        }
      `,
    }));
    caPass.material.blending = THREE.NoBlending;   // overwrite stale ping-pong target

    // (d) finalComposer — full REAL scene + ADD glow + restore on-screen sRGB (R6).
    finalComposer = new POST.EffectComposer(renderer);
    finalComposer.renderTarget1.samples = 4;   // v3.2e MSAA — see bloomComposer note
    finalComposer.renderTarget2.samples = 4;
    finalComposer.addPass(new POST.RenderPass(scene, camera));
    finalComposer.addPass(mixPass);
    finalComposer.addPass(new POST.OutputPass());   // REQUIRED: composer strips on-screen sRGB otherwise
    finalComposer.addPass(gradePass);               // SP4: grade tone-mapped sRGB display values, keep .a
    finalComposer.addPass(caPass);                  // SP4: lens fringe, centre-alpha, LAST -> writes canvas

    // (e) Dark-material-swap (official pattern; depthWrite:false preserves the scene's
    //     real no-occlusion property since every emitter is additive/depthWrite:false).
    /* v3.1g: a MeshBasicMaterial on THREE.Points leaves gl_PointSize UNWRITTEN —
       undefined per GLSL ES, so many GPUs rasterized the untagged deep starfield as
       random-sized opaque black squares in the bloom buffer: square bloom-holes that
       drifted with the field (the owner's "dark squares stuttering"). Every untagged
       object now swaps to a type-correct fully-invisible material instead — safe
       because this scene has no occluders by design (all emitters additive). */
    const darkMat    = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
    const darkPoints = new THREE.PointsMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false, size: 0.001 });
    /* v3.1f: SpriteMaterial defaults transparent:true, so a plain black swap kept the
       untagged canvas sprites (halo labels, callout, scan tag) in the TRANSPARENT queue
       as opaque black quads — each one stamped its rectangle over the additive emitters
       already drawn behind it in the bloom pass, and the missing bloom read as dark/grey
       slabs around the halo cluster on the deep-black floor. opacity:0 makes untagged
       sprites contribute nothing instead (this scene has no occluders by design). */
    const darkSprite = new THREE.SpriteMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
    const matCache = new Map();
    const darken = o => {
      if (o.userData.bloom) return;
      if (o.isSprite) { matCache.set(o, o.material); o.material = darkSprite; }
      else if (o.isPoints) { matCache.set(o, o.material); o.material = darkPoints; }
      else if (o.isMesh || o.isLine) { matCache.set(o, o.material); o.material = darkMat; }
    };
    const restore = o => { const m = matCache.get(o); if (m) { o.material = m; matCache.delete(o); } };

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

  const DPR_CAP = reduced ? 1 : LITE ? 1.5 : 2;   // mirrors getQualityProfile's per-tier caps
  addEventListener('resize', () => {
    clearTimeout(resizeTm);
    resizeTm = setTimeout(() => {
      if (coarse && innerWidth === w && Math.abs(innerHeight - h) < 120) return;
      w = innerWidth; h = innerHeight;
      /* v3.2e: re-read devicePixelRatio — dragging the window between a Retina
         and a 1x display (or zooming) changes DPR without a reload; the boot-time
         snapshot left the canvas soft (or 4x oversized) after such a move. */
      const newDpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      if (renderer.getPixelRatio() !== newDpr) {
        renderer.setPixelRatio(newDpr);
        globeMat.uniforms.uPx.value = newDpr;   // land-particle gl_PointSize is uPx-scaled
        if (bloomComposer) { bloomComposer.setPixelRatio(newDpr); finalComposer.setPixelRatio(newDpr); }
      }
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (!window.__SCENE_OFFSET) {          // v3.2n: portrait<->landscape re-aim
        OFF = offsetFor();
        coreGroup.position.set(OFF[0], OFF[1], OFF[2]);
      }
      if (bloomComposer) { bloomComposer.setSize(w, h); finalComposer.setSize(w, h); }
      maxScroll = Math.max(1, document.body.scrollHeight - innerHeight);
    }, 150);
  });
  // content height also changes without a window resize (boot unlock, images)
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      maxScroll = Math.max(1, document.body.scrollHeight - innerHeight);
    }).observe(document.body);
  }

  /* Mobile Safari evicts WebGL contexts under memory pressure — without these
     handlers the canvas freezes dead. */
  renderer.domElement.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    if (reduced) return;            // no loop exists in the static branch
    running = false; cancelAnimationFrame(raf);
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    if (reduced) { render(); return; }   // re-draw the single static frame
    if (!document.hidden && !running) { running = true; raf = requestAnimationFrame(loop); }
  });

  const render = (bloomEnabled && renderBloomThenFinal)
    ? () => renderBloomThenFinal()               // high tier: dark-swap -> bloom composite -> final
    : () => renderer.render(scene, camera);        // reduced / LITE: direct path

  if (reduced) {
    // Meaningful static frame: Tokyo rotated to face the camera, journey arc
    // fully drawn, node + callout at fixed mid-pulse — the story reads unmoving.
    spin.rotation.y = tokyoA0 - Math.PI / 2;
    coreGroup.rotation.x = 0.12;
    arcGeo.setDrawRange(0, ARC_SEG + 1);
    globeMat.uniforms.uTime.value = 4;
    tokyoRing.material.opacity = 0.7;
    if (tokyoHalo) {
      tokyoHalo.rings.forEach((r, i) => { r.material.opacity = i === 0 ? 0.3 : 0.12; });
      if (tokyoHalo.ticks) tokyoHalo.ticks.material.opacity = 0.18;
      if (tokyoHalo.glow) tokyoHalo.glow.material.opacity = 0.4;
      tokyoHalo.labels.forEach(sp => { sp.material.opacity = 0.5; });
      if (tokyoHalo.packetMat) tokyoHalo.packetMat.opacity = 0;
      if (tokyoHalo.transit) tokyoHalo.transit.material.opacity = 0.12;
      if (tokyoHalo.stations) tokyoHalo.stations.material.opacity = 0.25;
    }
    callout.sprite.material.opacity = 0.85;
    render();
    /* The static frame renders exactly once, so the sprite redraws queued on
       fonts.ready (registered earlier) need one re-present or a cold-cache
       visitor keeps fallback-font glyphs forever. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => render());
    updateDebugText();
    return;
  }

  // boot hook: camera "warp" + (re)launch the Dallas->Tokyo journey
  let warp = 0;
  window.__sceneWarp = () => { warp = 1; sceneState.lockT = 1; replayJourney(); };   // beat lands at reveal

  /* Delta-time: the old `t += 0.005` per frame ran the whole scene at 2x on
     120Hz displays (ProMotion phones, gaming monitors). Normalised to the same
     speed as 60Hz: 0.005/frame @60fps = 0.3/s. Clamped so a stalled tab can't
     jump time on resume. */
  let raf, running = true, t = 0, last = performance.now(), debugTick = 0;
  let scrollNS = -1;   // scrubbed scroll (one-pole low-pass of scrollN); -1 = unseeded, first frame snaps to scrollN so anchored loads don't swoop
  let revealT = 0;   // SP2 boot reveal: real-time accumulator (pauses with the loop when hidden)
  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.033)); last = now;
    if (dt > 0) fpsEMA += (Math.min(1 / dt, 120) - fpsEMA) * 0.04;   // QA gate reads this
    t += dt * 0.3;
    if (GLOBE_ELEV) {   // boot-up scan-reveal: ease-out cubic over ~1.8s, then inert at 1
      revealT += dt;
      const rr = Math.min(1, revealT / 1.8);
      globeMat.uniforms.uReveal.value = 1.0 - Math.pow(1.0 - rr, 3.0);
    }
    const scrollN = Math.min(1, Math.max(0, scrollY / maxScroll));
    if (scrollNS < 0) scrollNS = scrollN;
    scrollNS += (scrollN - scrollNS) * Math.min(1, dt * 8);   // scroll scrub: raw per-event scrollY steps the camera/spin under load; tau ~0.125s
    const f = dt * 60;   // per-frame speeds scale to real elapsed time

    // Section story state — eased toward the active story's targets each frame
    if (storyCooldown > 0) storyCooldown = Math.max(0, storyCooldown - dt);
    if (sceneState.lockT > 0) sceneState.lockT = Math.max(0, sceneState.lockT - dt * 0.9);
    sceneState.halo    += (sceneState.story.halo    - sceneState.halo)    * Math.min(1, 0.08 * f);
    sceneState.rain    += (sceneState.story.rain    - sceneState.rain)    * Math.min(1, 0.08 * f);
    sceneState.labels  += (sceneState.story.labels  - sceneState.labels)  * Math.min(1, 0.08 * f);
    sceneState.callout += (sceneState.story.callout - sceneState.callout) * Math.min(1, 0.08 * f);
    sceneState.grid    += (sceneState.story.grid    - sceneState.grid)    * Math.min(1, 0.08 * f);
    sceneState.camera  += (sceneState.story.camera  - sceneState.camera)  * Math.min(1, 0.06 * f);
    const _sh = sceneState.story.shift || ZERO_SHIFT;                      // v3.2o work shift
    sceneState.shiftX += (_sh[0] - sceneState.shiftX) * Math.min(1, 0.05 * f);
    sceneState.shiftZ += (_sh[1] - sceneState.shiftZ) * Math.min(1, 0.05 * f);
    coreGroup.position.x = OFF[0] + sceneState.shiftX;
    coreGroup.position.z = OFF[2] + sceneState.shiftZ;
    if (sceneState.haloPulse > 0.01) sceneState.haloPulse *= Math.pow(0.92, f); else sceneState.haloPulse = 0;
    idleT += dt;
    idleK += ((idleT > 20 ? 1 : 0) - idleK) * Math.min(1, 0.02 * f);   // idle cinematic ease
    rainShear += ((scrollY - lastScrollY2) * 0.0025 - rainShear) * Math.min(1, 0.12 * f);
    if (shearHold !== null) rainShear = shearHold;   // v3.3a QA hold — always null outside ?sceneDebug=1
    lastScrollY2 = scrollY;
    updateDepthRain(dt, updateLightning(dt));
    updateScanTag(dt);
    updateCelestial(dt);
    const scanY = Math.sin(t * 0.55) * R * 0.9;                       // holo shell sweeps the sphere
    const scanS = Math.max(0.06, Math.sqrt(Math.max(0, 1 - (scanY / R) * (scanY / R))));
    holoScan.position.y = scanY;
    holoScan.scale.set(scanS, scanS, 1);
    // projector shimmer, instrument-quiet; elevated drives a uniform + fades in with the boot reveal
    if (GLOBE_ELEV) holoScan.material.uniforms.uOpacity.value = (0.09 + 0.03 * Math.sin(t * 9.7)) * globeMat.uniforms.uReveal.value;
    else holoScan.material.opacity = 0.09 + 0.03 * Math.sin(t * 9.7);
    sunTimer -= dt;
    if (sunTimer <= 0) { sunTimer = 120; updateSunDir(); }            // terminator drifts in real time

    /* Autonomous drift — phones never fire pointermove, so without this the
       LITE scene reads as parked. Slow beat-frequency wobble on every speed. */
    const drift = 0.7 + 0.6 * Math.sin(t * 0.31) * Math.sin(t * 0.113 + 1.7);

    fieldCyan.rotation.y -= 0.0004 * f * drift;
    fieldAmber.rotation.x += 0.0005 * f * drift;
    fieldDeep.rotation.y += 0.0002 * f;
    grid.position.z = ((t * 6 + scrollNS * 70) % 4) - 2;
    grid.material.opacity = 0.2 * sceneState.grid;   // v3.2d: story-driven — near-0 in gallery

    /* Globe motion — autonomous spin (t term keeps phones alive without
       pointermove) + scroll-advanced rotation on the SCRUBBED scroll: absolute
       in scrollNS (no drift), low-passed so per-event scroll steps can't make
       it jumpy. Gyro tilt eases on coreGroup; spin owns the y-rotation. */
    const spinBase = t * 0.22 + scrollNS * 2.4;
    let biasTarget = 0;            // regime target for the ADDED rate, rad/s — in [0, cap] always
    if (focusBiasT > 0) {          // chase: forward-only P-controller (eases as it closes)
      focusBiasT = Math.max(0, focusBiasT - dt);
      let e = (focusedA0 - Math.PI / 2 - (spinBase + focusBias)) % (Math.PI * 2);
      if (e > Math.PI) e -= Math.PI * 2; else if (e < -Math.PI) e += Math.PI * 2;
      if (e > 0) biasTarget = Math.min(BIAS_MAX_RADS_PER_SEC, e * 0.9);   // behind (e <= 0) is never chased
    }
    // slew the applied rate toward the target — sole writer of focusBiasRate,
    // so every regime edge is a bounded ramp (<= 0.15 * dt per frame), never a step
    const biasDr = biasTarget - focusBiasRate;
    focusBiasRate += Math.sign(biasDr) * Math.min(Math.abs(biasDr), BIAS_SLEW_RADS_PER_S2 * dt);
    focusBias += focusBiasRate * dt;
    spin.rotation.y = spinBase + focusBias;
    coreGroup.rotation.x += ((-mouse.y * 0.26) - coreGroup.rotation.x) * 0.03;
    coreGroup.rotation.z += ((mouse.x * 0.12) - coreGroup.rotation.z) * 0.03;
    globeMat.uniforms.uTime.value = t * 10;   // GPU breathing — one uniform,
    ring.rotation.z += 0.006 * f * (0.5 + drift); // zero buffer re-uploads

    // Tokyo node pulse + camera-facing callout fade (allocation-free)
    const pulse = Math.sin(t * 6) * 0.5 + 0.5;
    tokyoRing.scale.setScalar(1 + 0.25 * pulse);
    tokyoRing.material.opacity = 0.45 + 0.45 * pulse;
    const focusedPlace = placeById(focusedPlaceId);
    const focusedVector = placeVector(focusedPlace, R);
    const focusedAngle = Math.atan2(focusedVector.z, focusedVector.x);
    const focusedFacing = Math.max(0, Math.sin(focusedAngle - spin.rotation.y));
    const tokyoFacing = Math.max(0, Math.sin(tokyoA0 - spin.rotation.y));
    updateTokyoHalo(f, focusedFacing, tokyoFacing);
    callout.sprite.position.copy(focusedVector).multiplyScalar(1.22).add(calloutOffset);
    // v3.1: hard facing gate (0 below 0.35, full above 0.72) — the old facing²
    // curve left a half-faded panel drifting off the limb as a grey rectangle;
    // now it fades out completely before the node detaches from the disc.
    const calloutGate = THREE.MathUtils.smoothstep(focusedFacing, 0.35, 0.72);
    let calloutOp = calloutGate * sceneState.callout * (focusedPlace.primary ? 0.9 : 0.55);
    /* v3.2n — portrait header gate: at phone aspect the panel rides just under
       the fixed 80px nav band, and the boot warp / idle dolly-in push it higher
       still; fade it out BEFORE its top edge enters the band — same grammar as
       the facing gate above (the panel never half-collides with chrome).
       Allocation-free: one projection of last frame's sprite matrix. Desktop
       composition never projects the panel that high — gate is portrait-only. */
    if (isPortrait()) {
      _calloutV.setFromMatrixPosition(callout.sprite.matrixWorld);
      const calloutDist = camera.position.distanceTo(_calloutV);
      _calloutV.project(camera);
      const halfHCss = 0.36 * (h * 0.5) / (Math.tan(camera.fov * Math.PI / 360) * calloutDist);
      const topCss = (1 - _calloutV.y) * 0.5 * h - halfHCss;
      calloutOp *= THREE.MathUtils.smoothstep(topCss, 80, 100);
    }
    callout.sprite.material.opacity = calloutOp;
    if (focusFlash > 0.01) focusFlash *= Math.pow(0.9, f);
    else focusFlash = 0;
    for (const id in placeNodesById) {
      const node = placeNodesById[id];
      const isFocused = id === focusedPlaceId;
      const base = node.userData.baseOpacity || 0.5;
      node.material.opacity = base + (isFocused ? focusFlash * 0.35 : 0);
      node.material.size = node.userData.place.size * (1 + (isFocused ? focusFlash * 0.35 : 0));
    }
    if (!GLOBE_ELEV) halo.material.opacity = 0.10 + 0.05 * (Math.sin(t * 1.5) * 0.5 + 0.5);

    // Dallas -> Tokyo arc: draws over ~1.5s, comet rides the front. v3.1: plays
    // ONCE per journey trigger (boot + route:'replay' section stories), then the
    // trace lingers a few seconds and fades — amber is an event, never wallpaper.
    // No idle re-arm; only replayJourney() re-arms it.
    if (arcN < ARC_SEG) {
      arcN = Math.min(ARC_SEG, arcN + 1.4 * f);
      const head = Math.max(0, Math.min(ARC_SEG, Math.floor(arcN)));
      arcGeo.setDrawRange(0, head + 1);
      setCometAt(head);
      cometMat.opacity = arcN >= ARC_SEG ? 0 : 0.9;
    } else if (arcMat.opacity > 0) {
      arcMat.opacity = Math.max(0, arcMat.opacity - 0.15 * dt);   // ~4.5s afterglow
      if (arcMat.opacity === 0) arcGeo.setDrawRange(0, 0);
    }
    if (seqArrival && arcN >= ARC_SEG) {   // v3.2m: the label lands when the comet does
      const s = seqArrival; seqArrival = null;
      setFocusedPlace(s.place, s.intensity);
    }

    if (warp > 0.001) warp *= 0.92; else warp = 0;
    if (debugEl && ++debugTick % 20 === 0) updateDebugText();
    camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 1.0 + scrollNS * 3 + sceneState.camera - camera.position.y) * 0.04;
    camera.position.z = 10 - scrollNS * 4 - warp * 6 - idleK * 1.6;   // idle cinematic dolly-in
    camera.lookAt(0, scrollNS * 1.5, 0);
    render();
    if (droplets) droplets.update(dt);   // after render: droplet lenses sample THIS frame's buffer
    if (!coarse) interrogate(dt);          // SP3: pointer interrogation (touch uses tap-select)
  }
  raf = requestAnimationFrame(loop);

  /* Re-entry-guarded pause/resume — the old `running = !hidden; if (running)
     requestAnimationFrame(loop)` could start a SECOND concurrent loop chain on
     a rapid hidden->visible flip (one raf handle can't cancel two callbacks),
     permanently doubling scene speed and GPU work. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      last = performance.now();   // don't lerp across the hidden gap
      raf = requestAnimationFrame(loop);
    }
  });
})();
