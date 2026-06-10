/* Immersive scene: TOKYO DATA-GLOBE — a particle Earth whose points exist only
   where land exists, a pulsing amber Tokyo node with live coordinates, and a
   great-circle arc that draws his Dallas->Tokyo move on boot. Layered particle
   fields, synthwave grid and data-streaks frame it; scroll dollies the camera.
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
  const dpr = Math.min(window.devicePixelRatio || 1, LITE ? 1.5 : 2);
  let w = innerWidth, h = innerHeight;
  // globe detail scales with device class
  const R = 3.2;                       // globe radius
  const GLOBE_N = LITE ? 2600 : 7000;  // land particle count

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.05);
  const camera = new THREE.PerspectiveCamera(62, w / h, 0.1, 140);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  mount.appendChild(renderer.domElement);

  /* Fail-loud onBeforeCompile helper — a silent no-op replace() would ship an
     unpatched material (e.g. after a three version bump), so warn instead. */
  function patchShader(src, find, insert) {
    if (!src.includes(find)) { console.warn('[scene] shader chunk missing:', find); return src; }
    return src.replace(find, insert);
  }

  // ---- particle fields ----
  // Points are patched to render as ROUND, depth-faded sprites: PointsMaterial's
  // default square pixels + FogExp2 brighten additively-blended points toward the
  // fog colour, so fog is off and a manual smoothstep depth fade replaces it.
  function makeField(count, color, spread, size, op) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * spread;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
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
    return new THREE.Points(geo, mat);
  }
  const fieldCyan = makeField(LITE ? 1100 : 2600, CYAN, 46, 0.05, 0.9);
  const fieldAmber = makeField(LITE ? 520 : 1200, AMBER, 36, 0.06, 0.8);
  const fieldDeep = makeField(LITE ? 360 : 900, 0x6fb7ff, 70, 0.035, 0.5);
  scene.add(fieldCyan, fieldAmber, fieldDeep);

  // ---- TOKYO DATA-GLOBE ----------------------------------------------------
  // coreGroup carries the mouse gyro tilt; `spin` (its child) carries the
  // y-rotation, so the globe can rotate without fighting the tilt easing.
  const coreGroup = new THREE.Group();
  coreGroup.position.set(3, 0.4, -2);
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
    const x = Math.min(MW - 1, Math.floor(((lon + 180) / 360) * MW));
    const y = Math.min(MH - 1, Math.floor(((90 - lat) / 180) * MH));
    const i = y * MW + x;
    return (LAND.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
  };
  const toV3 = (lat, lon, r) => {
    const p = (90 - lat) * Math.PI / 180, q = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-r * Math.sin(p) * Math.cos(q), r * Math.cos(p), r * Math.sin(p) * Math.sin(q));
  };

  // (a) land particles — rejection-sampled uniform on the sphere (asin keeps
  // pole density honest), one phase attribute drives GPU breathing: zero
  // per-frame buffer uploads, unlike the old CPU-distorted icosahedron.
  const gp = new Float32Array(GLOBE_N * 3), gph = new Float32Array(GLOBE_N);
  for (let i = 0, guard = 0; i < GLOBE_N && guard < GLOBE_N * 10; guard++) {
    const lat = Math.asin(Math.random() * 2 - 1) * 180 / Math.PI;
    const lon = Math.random() * 360 - 180;
    if (!landAt(lon, lat)) continue;
    toV3(lat, lon, R).toArray(gp, i * 3);
    gph[i] = Math.random() * Math.PI * 2;
    i++;
  }
  const globeGeo = new THREE.BufferGeometry();
  globeGeo.setAttribute('position', new THREE.BufferAttribute(gp, 3));
  globeGeo.setAttribute('phase', new THREE.BufferAttribute(gph, 1));
  const globeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPx: { value: dpr } },
    vertexShader: `
      attribute float phase; uniform float uTime, uPx; varying float vA;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vA = 0.55 + 0.45 * sin(uTime * 2.2 + phase);
        gl_PointSize = (2.4 + 1.4 * vA) * uPx * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(0.224, 0.941, 1.0, vA * (1.0 - d * 2.0) * 0.85);
      }`,
  });
  spin.add(new THREE.Points(globeGeo, globeMat));

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
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs), 3));
    spin.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      color: CYAN, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending })));
  })();

  // (c) Tokyo node: amber marker + tangent pulse ring + ping ripple ring
  const TOKYO = toV3(35.6762, 139.6503, R);
  const tokyoA0 = Math.atan2(TOKYO.z, TOKYO.x);   // rest angle in the xz plane
  const markGeo = new THREE.BufferGeometry();
  markGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TOKYO.toArray()), 3));
  spin.add(new THREE.Points(markGeo, new THREE.PointsMaterial({
    color: AMBER, size: 0.22, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true })));
  function tangentRing(inner, outer, op) {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 40),
      new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: op, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
    );
    m.position.copy(TOKYO);
    m.lookAt(TOKYO.clone().multiplyScalar(2));
    spin.add(m);
    return m;
  }
  const tokyoRing = tangentRing(0.16, 0.2, 0.8);
  const pingRing = tangentRing(0.3, 0.34, 0);     // expands on section change

  // (d) coordinate callout — CanvasTexture sprite, drawn once fonts are ready
  const callout = (function () {
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 56;
    const tex = new THREE.CanvasTexture(cv);
    function draw() {
      const cx = cv.getContext('2d');
      cx.clearRect(0, 0, cv.width, cv.height);
      cx.font = '500 26px "JetBrains Mono", monospace';
      cx.fillStyle = '#ff9e2c';
      cx.shadowColor = 'rgba(255,158,44,0.7)'; cx.shadowBlur = 12;
      cx.fillText('35.6762°N 139.6503°E — TOKYO', 8, 38);
      tex.needsUpdate = true;
    }
    draw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: 0, depthWrite: false }));
    sp.scale.set(3.6, 0.4, 1);
    sp.position.copy(TOKYO).multiplyScalar(1.22).add(new THREE.Vector3(0, 0.45, 0));
    spin.add(sp);
    return sp;
  })();

  // (e) Dallas -> Tokyo great-circle arc (SLERP, lifted at mid-flight) + comet
  const DALLAS = toV3(32.7767, -96.797, R);
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
  const arcGeo = new THREE.BufferGeometry();
  arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPts, 3));
  arcGeo.setDrawRange(0, 0);
  let arcN = 0, arcArm = 0;
  spin.add(new THREE.Line(arcGeo, new THREE.LineBasicMaterial({
    color: AMBER, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending })));
  const cometGeo = new THREE.BufferGeometry();
  cometGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
  const cometMat = new THREE.PointsMaterial({
    color: 0xffd9a0, size: 0.3, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  const comet = new THREE.Points(cometGeo, cometMat);
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
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(cv), transparent: true, opacity: 0.13,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    sp.scale.setScalar(7.5);
    coreGroup.add(sp);
    return sp;
  })();

  // (g) orbital scan ring — equatorial, does not rotate with the land
  const ringBaseC = new THREE.Color(CYAN), ringAmberC = new THREE.Color(AMBER);
  const ringMat = new THREE.MeshBasicMaterial({
    color: CYAN, transparent: true, opacity: 0.16,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(R * 1.32, R * 1.36, 96), ringMat);
  ring.rotation.x = Math.PI / 2.05;
  coreGroup.add(ring);

  // section-change ping: scan ring flashes amber + ripple expands from Tokyo
  let ping = 0;
  window.__scenePing = () => { ping = 1; };

  // ---- synthwave grid ----
  const grid = new THREE.GridHelper(160, 70, AMBER, 0x10303a);
  grid.material.transparent = true; grid.material.opacity = 0.2; grid.material.blending = THREE.AdditiveBlending;
  grid.position.y = -7; scene.add(grid);

  // ---- vertical data streaks ----
  const streakGeo = new THREE.BufferGeometry();
  const SN = LITE ? 22 : 40; const sp = new Float32Array(SN * 6);
  for (let i = 0; i < SN; i++) {
    const x = (Math.random() - 0.5) * 60, z = -Math.random() * 50 - 5, y = (Math.random() - 0.5) * 24, len = 1 + Math.random() * 3;
    sp.set([x, y, z, x, y + len, z], i * 6);
  }
  streakGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const streaks = new THREE.LineSegments(streakGeo, new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending }));
  scene.add(streaks);

  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', e => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = (e.clientY / innerHeight) * 2 - 1; });

  /* Debounced resize — raw handler reallocated the GL backbuffer dozens of
     times/sec during window drags, and iOS fires resize on URL-bar collapse
     mid-scroll, so small height-only deltas on touch are ignored entirely. */
  let maxScroll = Math.max(1, document.body.scrollHeight - innerHeight);
  let resizeTm;
  addEventListener('resize', () => {
    clearTimeout(resizeTm);
    resizeTm = setTimeout(() => {
      if (coarse && innerWidth === w && Math.abs(innerHeight - h) < 120) return;
      w = innerWidth; h = innerHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
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

  const render = () => renderer.render(scene, camera);

  if (reduced) {
    // Meaningful static frame: Tokyo rotated to face the camera, journey arc
    // fully drawn, node + callout at fixed mid-pulse — the story reads unmoving.
    spin.rotation.y = tokyoA0 - Math.PI / 2;
    coreGroup.rotation.x = 0.12;
    arcGeo.setDrawRange(0, ARC_SEG + 1);
    globeMat.uniforms.uTime.value = 4;
    tokyoRing.material.opacity = 0.7;
    callout.material.opacity = 0.85;
    render();
    return;
  }

  // boot hook: camera "warp" + (re)launch the Dallas->Tokyo journey
  let warp = 0;
  window.__sceneWarp = () => { warp = 1; arcN = 0; arcArm = 0; arcGeo.setDrawRange(0, 0); };

  /* Delta-time: the old `t += 0.005` per frame ran the whole scene at 2x on
     120Hz displays (ProMotion phones, gaming monitors). Normalised to the same
     speed as 60Hz: 0.005/frame @60fps = 0.3/s. Clamped so a stalled tab can't
     jump time on resume. */
  let raf, running = true, t = 0, last = performance.now();
  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.033); last = now;
    t += dt * 0.3;
    const scrollN = Math.min(1, Math.max(0, scrollY / maxScroll));
    const f = dt * 60;   // per-frame speeds scale to real elapsed time

    /* Autonomous drift — phones never fire pointermove, so without this the
       LITE scene reads as parked. Slow beat-frequency wobble on every speed. */
    const drift = 0.7 + 0.6 * Math.sin(t * 0.31) * Math.sin(t * 0.113 + 1.7);

    fieldCyan.rotation.y -= 0.0004 * f * drift;
    fieldAmber.rotation.x += 0.0005 * f * drift;
    fieldDeep.rotation.y += 0.0002 * f;
    grid.position.z = ((t * 6 + scrollN * 70) % 4) - 2;

    /* Globe motion — autonomous spin (t term keeps phones alive without
       pointermove) + scroll-advanced rotation, ABSOLUTE so smooth-scroll can't
       make it jumpy. Gyro tilt eases on coreGroup; spin owns the y-rotation. */
    spin.rotation.y = t * 0.22 + scrollN * 2.4;
    coreGroup.rotation.x += ((-mouse.y * 0.26) - coreGroup.rotation.x) * 0.03;
    coreGroup.rotation.z += ((mouse.x * 0.12) - coreGroup.rotation.z) * 0.03;
    globeMat.uniforms.uTime.value = t * 10;   // GPU breathing — one uniform,
    ring.rotation.z += 0.006 * f * (0.5 + drift); // zero buffer re-uploads

    // Tokyo node pulse + camera-facing callout fade (allocation-free)
    const pulse = Math.sin(t * 6) * 0.5 + 0.5;
    tokyoRing.scale.setScalar(1 + 0.25 * pulse);
    tokyoRing.material.opacity = 0.45 + 0.45 * pulse;
    const facing = Math.max(0, Math.sin(tokyoA0 - spin.rotation.y));
    callout.material.opacity = facing * facing * 0.9;
    halo.material.opacity = 0.10 + 0.05 * (Math.sin(t * 1.5) * 0.5 + 0.5);

    // Dallas -> Tokyo arc: draws over ~1.5s, comet rides the front, re-arms ~12s
    arcArm += dt;
    if (arcN < ARC_SEG) {
      arcN = Math.min(ARC_SEG, arcN + 1.4 * f);
      const head = Math.floor(arcN);
      arcGeo.setDrawRange(0, head + 1);
      const cp = cometGeo.attributes.position.array, ci = head * 3;
      cp[0] = arcPts[ci]; cp[1] = arcPts[ci + 1]; cp[2] = arcPts[ci + 2];
      cometGeo.attributes.position.needsUpdate = true;
      cometMat.opacity = arcN >= ARC_SEG ? 0 : 0.9;
    } else if (arcArm > 12) {
      arcN = 0; arcArm = 0; arcGeo.setDrawRange(0, 0);
    }

    // section-change ping: ripple expands from Tokyo, scan ring flashes amber
    if (ping > 0.01) {
      ping *= Math.pow(0.94, f);
      pingRing.scale.setScalar(1 + (1 - ping) * 2.2);
      pingRing.material.opacity = ping * 0.8;
      ringMat.color.copy(ringBaseC).lerp(ringAmberC, ping);
      ringMat.opacity = 0.16 + ping * 0.2;
    } else if (ping !== 0) {
      ping = 0; pingRing.material.opacity = 0;
      ringMat.color.copy(ringBaseC); ringMat.opacity = 0.16;
    }

    if (warp > 0.001) warp *= 0.92; else warp = 0;
    camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 1.0 + scrollN * 3 - camera.position.y) * 0.04;
    camera.position.z = 10 - scrollN * 4 - warp * 6;
    camera.lookAt(0, scrollN * 1.5, 0);
    render();
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
