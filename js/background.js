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

  if (reduced) { coreGroup.rotation.set(0.3, 0.5, 0); render(); return; }

  // expose a hook so the boot sequence can trigger a camera "warp"
  let warp = 0;
  window.__sceneWarp = () => { warp = 1; };

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

    // outer-core assembly motion
    const breath = 1 + Math.sin(t * 1.5) * (0.025 + 0.012 * Math.sin(t * 0.21));
    coreGroup.rotation.y += 0.0011 * f * drift;
    coreGroup.scale.setScalar(breath);
    // ease the whole assembly toward the pointer for a subtle gyroscopic tilt
    coreGroup.rotation.x += ((-mouse.y * 0.32) - coreGroup.rotation.x) * 0.03;
    coreGroup.rotation.z += ((mouse.x * 0.22) - coreGroup.rotation.z) * 0.03;
    ghost.rotation.y -= 0.0026 * f * (2.0 - drift); ghost.rotation.x += 0.0014 * f;
    ring.rotation.z += 0.006 * f * (0.5 + drift);
    nodeMat.size = 0.055 + (Math.sin(t * 3) * 0.5 + 0.5) * 0.03;
    nodeMat.opacity = 0.4 + (Math.sin(t * 3) * 0.5 + 0.5) * 0.3;
    core.rotation.y -= 0.004 * f; core.rotation.x += 0.003 * f;

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
