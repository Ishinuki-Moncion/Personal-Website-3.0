/* Enhanced immersive scene: layered particle fields, breathing wireframe form,
   synthwave grid, drifting data-streaks, scroll dolly + mouse parallax.
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
  // detail levels scale with device class
  const ICO_DETAIL = LITE ? 2 : 3;
  const GHOST_DETAIL = 1;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060a, 0.05);
  const camera = new THREE.PerspectiveCamera(62, w / h, 0.1, 140);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h);
  mount.appendChild(renderer.domElement);

  // ---- particle fields ----
  function makeField(count, color, spread, size, op) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * spread;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color, size, transparent: true, opacity: op,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    });
    return new THREE.Points(geo, mat);
  }
  const fieldCyan = makeField(LITE ? 1100 : 2600, CYAN, 46, 0.05, 0.9);
  const fieldAmber = makeField(LITE ? 520 : 1200, AMBER, 36, 0.06, 0.8);
  const fieldDeep = makeField(LITE ? 360 : 900, 0x6fb7ff, 70, 0.035, 0.5);
  scene.add(fieldCyan, fieldAmber, fieldDeep);

  // ---- OUTER CORE: layered glowing icosahedron assembly ----
  const coreGroup = new THREE.Group();
  coreGroup.position.set(3, 0.4, -2);
  scene.add(coreGroup);

  // source geometry — distorted per-frame; shared by the wire + node lattice
  const icoGeo = new THREE.IcosahedronGeometry(3.3, ICO_DETAIL);
  const basePos = icoGeo.attributes.position.array.slice();

  // (a) volumetric shell — faint faceted backface glow gives the form mass
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.18, 2),
    new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, side: THREE.BackSide })
  );
  coreGroup.add(shell);

  // (b) bright breathing edges — built ONCE; its own vertex buffer is distorted
  // in place each frame (the old code rebuilt the geometry every frame, which
  // allocated garbage and stalled phones). Distortion is a pure function of
  // each vertex's rest position, so wire + nodes can breathe independently.
  const wireMat = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending });
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(icoGeo), wireMat);
  const wirePos = wire.geometry.attributes.position;
  const wireBase = wirePos.array.slice();
  coreGroup.add(wire);

  // (c) geodesic node lattice — shares the distorted buffer, so it breathes for free
  const nodeMat = new THREE.PointsMaterial({ color: 0xbafcff, size: 0.06, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  const nodes = new THREE.Points(icoGeo, nodeMat);
  coreGroup.add(nodes);

  // (d) outer ghost cage — larger, fainter, amber, counter-rotating
  const ghost = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(4.55, GHOST_DETAIL)),
    new THREE.LineBasicMaterial({ color: AMBER, transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending })
  );
  coreGroup.add(ghost);

  // (e) equatorial scan ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(4.7, 4.78, 120),
    new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  ring.rotation.x = Math.PI / 2.3;
  coreGroup.add(ring);

  // inner amber core
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.9, 1),
    new THREE.MeshBasicMaterial({ color: AMBER, wireframe: true, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending })
  );
  coreGroup.add(core);

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
  addEventListener('resize', () => { w = innerWidth; h = innerHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); });

  const render = () => renderer.render(scene, camera);

  if (reduced) { coreGroup.rotation.set(0.3, 0.5, 0); render(); return; }

  // expose a hook so the boot sequence can trigger a camera "warp"
  let warp = 0;
  window.__sceneWarp = () => { warp = 1; };

  let raf, running = true, t = 0;
  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    t += 0.005;
    const maxScroll = Math.max(1, document.body.scrollHeight - innerHeight);
    const scrollN = scrollY / maxScroll;

    fieldCyan.rotation.y -= 0.0004; fieldAmber.rotation.x += 0.0005; fieldDeep.rotation.y += 0.0002;
    grid.position.z = ((t * 6 + scrollN * 70) % 4) - 2;

    // outer-core assembly motion
    const breath = 1 + Math.sin(t * 1.5) * 0.03;
    coreGroup.rotation.y += 0.0011;
    coreGroup.scale.setScalar(breath);
    // ease the whole assembly toward the pointer for a subtle gyroscopic tilt
    coreGroup.rotation.x += ((-mouse.y * 0.32) - coreGroup.rotation.x) * 0.03;
    coreGroup.rotation.z += ((mouse.x * 0.22) - coreGroup.rotation.z) * 0.03;
    ghost.rotation.y -= 0.0026; ghost.rotation.x += 0.0014;
    ring.rotation.z += 0.006;
    nodeMat.size = 0.055 + (Math.sin(t * 3) * 0.5 + 0.5) * 0.03;
    nodeMat.opacity = 0.4 + (Math.sin(t * 3) * 0.5 + 0.5) * 0.3;
    core.rotation.y -= 0.004; core.rotation.x += 0.003;

    // breathing distortion — twin travelling waves; applied IN PLACE to both the
    // node lattice (icoGeo) and the wire buffer using each vertex's rest position.
    const wp = icoGeo.attributes.position;
    for (let i = 0; i < wp.count; i++) {
      const ix = i * 3, bx = basePos[ix], by = basePos[ix + 1], bz = basePos[ix + 2];
      const n = Math.sin(t * 1.6 + bx * 1.4 + by) * 0.12
              + Math.cos(t * 1.1 + bz * 1.3) * 0.1
              + Math.sin(t * 2.3 + by * 1.7 - bx) * 0.05;
      const k = 1 + n * 0.16;
      wp.array[ix] = bx * k; wp.array[ix + 1] = by * k; wp.array[ix + 2] = bz * k;
    }
    wp.needsUpdate = true;
    for (let i = 0; i < wirePos.count; i++) {
      const ix = i * 3, bx = wireBase[ix], by = wireBase[ix + 1], bz = wireBase[ix + 2];
      const n = Math.sin(t * 1.6 + bx * 1.4 + by) * 0.12
              + Math.cos(t * 1.1 + bz * 1.3) * 0.1
              + Math.sin(t * 2.3 + by * 1.7 - bx) * 0.05;
      const k = 1 + n * 0.16;
      wirePos.array[ix] = bx * k; wirePos.array[ix + 1] = by * k; wirePos.array[ix + 2] = bz * k;
    }
    wirePos.needsUpdate = true;

    if (warp > 0.001) warp *= 0.92; else warp = 0;
    camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 1.0 + scrollN * 3 - camera.position.y) * 0.04;
    camera.position.z = 10 - scrollN * 4 - warp * 6;
    camera.lookAt(0, scrollN * 1.5, 0);
    render();
  }
  raf = requestAnimationFrame(loop);

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) raf = requestAnimationFrame(loop); else cancelAnimationFrame(raf);
  });
})();
