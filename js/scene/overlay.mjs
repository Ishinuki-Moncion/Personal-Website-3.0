/* The scene's labels and their keyboard twins (step 1b): the eye and the photo-area marks.
   - A label is a small DOM tag anchored to its target's projected position. It shows on hover (mouse), on a
     tap (touch: the first tap shows it, a second tap acts), on keyboard focus, and when flashed (the eye,
     once, at the end of the arrival). It is aria-hidden: the button carries the name.
   - Every target has a visually hidden button in the hero, the way the hero prototype's places work
     (docs/rebuild/prototypes/hero/): focus shows the label, Enter/Space acts.
   - Clicks and taps are read from the page (the scene root takes no pointer events) and only where nothing
     else is: never on a link, a control, the nav or an overlay, and only over the hero.
   Styles are set through the CSSOM with the site's tokens (no stylesheet edit, nothing inline in HTML). */
const IGNORE = 'a, button, input, select, textarea, label, summary, [role="button"], [role="link"], [contenteditable], nav, .lightbox, .mobile-menu, .deck, .deck-toggle';
const TAP_PIN_MS = 5000;

export function createOverlay({ targets, onHover = () => {} }) {
  const root = document.createElement('div');
  root.className = 'scene-labels';
  root.setAttribute('aria-hidden', 'true');
  Object.assign(root.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: 'var(--z-content)', overflow: 'hidden' });
  const sceneRoot = document.getElementById('scene-root');
  (sceneRoot?.parentNode || document.body).insertBefore(root, sceneRoot ? sceneRoot.nextSibling : null);

  const group = document.createElement('div');
  group.className = 'sr-only scene-targets';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'On the globe');
  (document.getElementById('home') || document.body).appendChild(group);

  const state = targets.map(t => {
    const label = document.createElement('div');
    label.dataset.sceneLabel = t.key;
    Object.assign(label.style, {
      position: 'absolute', left: '0', top: '0', padding: '5px 9px 6px', whiteSpace: 'nowrap',
      fontFamily: 'var(--font-mono)', fontSize: 'var(--step--1)', lineHeight: '1.35', letterSpacing: 'var(--track-label)',
      textTransform: 'uppercase', fontVariantLigatures: 'none', color: 'var(--signal-ink)', background: 'var(--panel-bed)',
      border: '1px solid var(--line-2)', opacity: '0', visibility: 'hidden', willChange: 'transform',
    });
    const l1 = document.createElement('span'), l2 = document.createElement('span');
    l1.style.display = 'block'; l2.style.display = 'block';
    label.append(l1, l2);
    /* F1a: a standing label (t.always) placed by its target (t.place) at the end of a short leader line from its point */
    let leader = null;
    if (t.place) {
      leader = document.createElement('div');
      leader.dataset.sceneLeader = t.key;
      Object.assign(leader.style, { position: 'absolute', left: '0', top: '0', height: '1px', width: '0', transformOrigin: '0 50%', background: 'var(--line-2)', opacity: '0', visibility: 'hidden' });
      root.appendChild(leader);
    }
    root.appendChild(label);
    let button = null;
    if (t.button !== false) {
      button = document.createElement('button');
      button.type = 'button';
      button.dataset.sceneTarget = t.key;
      group.appendChild(button);
    }
    return { t, label, l1, l2, button, leader, hover: false, focus: false, pin: 0, flash: 0, shown: false, x: NaN, y: NaN, lk: '', text: '' };
  });
  const byKey = Object.fromEntries(state.map(s => [s.t.key, s]));

  /** The buttons' names (and the labels' text): at mount and whenever a target's wording changes. */
  function names() {
    for (const s of state) {
      const lines = s.t.lines();
      const text = lines.join('\n');
      if (text !== s.text) {
        s.text = text;
        s.l1.textContent = lines[0]; s.l2.textContent = lines[1] || '';
        s.l2.style.color = s.t.tone?.() === 'event' ? 'var(--event-ink)' : 'var(--signal-ink)';
      }
      if (!s.button) continue;
      const name = s.t.name();
      if (s.button.textContent !== name) s.button.textContent = name;
    }
  }
  function render(s) {
    const show = s.hover || s.focus || s.pin > 0 || s.flash > 0 || s.t.always?.() === true;
    if (!show && !s.shown) return;          // nothing to do for a hidden label: no work per frame
    if (show !== s.shown) {
      s.shown = show;
      s.label.style.opacity = show ? '1' : '0';
      s.label.style.visibility = show ? 'visible' : 'hidden';
      s.label.dataset.visible = show ? 'true' : 'false';
      if (s.leader) { s.leader.style.opacity = show ? '1' : '0'; s.leader.style.visibility = show ? 'visible' : 'hidden'; }
    }
    s.label.style.outline = s.focus ? '2px solid var(--signal)' : 'none';
    s.label.style.outlineOffset = '2px';
    if (!show) return;
    const w = s.label.offsetWidth, h = s.label.offsetHeight;
    let x, y;
    if (s.t.place) {
      const q = s.t.place(w, h);
      x = Math.round(q.x); y = Math.round(q.y);
      const len = Math.hypot(q.x1 - q.x0, q.y1 - q.y0), ang = Math.atan2(q.y1 - q.y0, q.x1 - q.x0);
      const lk = `${q.x0.toFixed(1)},${q.y0.toFixed(1)},${len.toFixed(1)},${ang.toFixed(3)}`;
      if (lk !== s.lk) { s.lk = lk; s.leader.style.width = `${len.toFixed(1)}px`; s.leader.style.transform = `translate(${q.x0.toFixed(1)}px, ${q.y0.toFixed(1)}px) rotate(${ang.toFixed(4)}rad)`; }
    } else {
      const p = s.t.pos();
      const pad = p.pad ?? 14;               // clear of the target's drawn size (the eye: 32 css px since F1b)
      x = p.x + pad; y = p.y - h - 10;
      if (x + w > innerWidth - 8) x = p.x - w - pad;
      if (y < 8) y = p.y + 12;
      x = Math.round(Math.max(8, x)); y = Math.round(Math.max(8, Math.min(innerHeight - h - 8, y)));
    }
    if (x !== s.x || y !== s.y) { s.x = x; s.y = y; s.label.style.transform = `translate(${x}px, ${y}px)`; }
  }
  /** Position and text of every label; cheap when none is showing (called every frame). */
  function update() { for (const s of state) render(s); }

  const timers = new Map();
  function setTimed(s, field, msValue) {
    clearTimeout(timers.get(s.t.key + field));
    s[field] = 1; render(s);
    timers.set(s.t.key + field, setTimeout(() => { s[field] = 0; render(s); }, msValue));
  }
  /** Show a label for a while by itself (the eye at the end of the arrival). */
  const flash = (key, msValue) => { const s = byKey[key]; if (s) setTimed(s, 'flash', msValue); };

  // ---------------------------------------------------------------- keyboard: the hidden buttons
  for (const s of state) {
    if (!s.button) continue;
    s.button.addEventListener('focus', () => { s.focus = true; s.t.focus?.(true); render(s); });
    s.button.addEventListener('blur', () => { s.focus = false; s.t.focus?.(false); render(s); });
    s.button.addEventListener('click', () => s.t.activate());
  }

  // ---------------------------------------------------------------- pointer: hover, click, tap
  const allowed = target => {
    if (!(target instanceof Element)) return false;
    if (target.closest(IGNORE)) return false;
    if (target === document.body || target === document.documentElement || target.id === 'main') return true;
    return Boolean(target.closest('#home'));
  };
  function hit(x, y) {
    let best = null, bestD = Infinity;
    for (const s of state) {
      const p = s.t.pos();
      if (!p.live) continue;
      const d = Math.hypot(x - p.x, y - p.y);
      if (d <= p.hit && d < bestD) { best = s; bestD = d; }
    }
    return best;
  }
  let hovered = null;
  function setHovered(s) {
    if (s === hovered) return;
    if (hovered) { hovered.hover = false; render(hovered); }
    hovered = s;
    if (s) { s.hover = true; render(s); }
    onHover(s ? s.t.key : null);
  }
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    setHovered(allowed(e.target) ? hit(e.clientX, e.clientY) : null);
  }, { passive: true });
  // mouse: a click acts (hover already shows the label)
  addEventListener('click', e => {
    if ((e.pointerType && e.pointerType !== 'mouse') || !allowed(e.target)) return;
    const s = hit(e.clientX, e.clientY);
    if (s) s.t.activate();
  });
  /* touch and pen: a tap is read from pointerdown/pointerup, not from click. WebKit sends no click for a tap
     on an element without its own click handler (measured: Playwright WebKit delivers pointerdown, touchstart,
     pointerup, touchend and no click on the hero), and a swipe that scrolls ends in pointercancel. The first
     tap shows the label, a tap on a showing label acts. */
  const downs = new Map();
  addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    downs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: e.timeStamp, ok: allowed(e.target) });
  }, { passive: true });
  addEventListener('pointercancel', e => downs.delete(e.pointerId), { passive: true });
  addEventListener('pointerup', e => {
    const d = downs.get(e.pointerId);
    downs.delete(e.pointerId);
    if (!d || !d.ok || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10 || e.timeStamp - d.t > 600) return;
    const s = hit(e.clientX, e.clientY);
    for (const o of state) if (o !== s && o.pin) { o.pin = 0; render(o); }
    if (!s) return;
    if (s.pin) s.t.activate();
    setTimed(s, 'pin', TAP_PIN_MS);
  }, { passive: true });

  names();
  return {
    update, flash, names, root, group,
    /** The live target under a screen point (css px), or null: the globe's controls leave those taps to the labels. */
    hitTest: (x, y) => hit(x, y)?.t.key ?? null,
    debug: () => Object.fromEntries(state.map(s => [s.t.key, { shown: s.shown, focus: s.focus, hover: s.hover, text: s.text.split('\n') }])),
  };
}
