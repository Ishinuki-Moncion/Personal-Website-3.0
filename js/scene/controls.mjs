/* The controls (design 2026-11-26, section 5; plan, step 2): the visitor can take the view over, and nothing
   here ever fights the page's own scrolling.

   - Three buttons near the globe, EARTH, JAPAN, TOKYO (aria-pressed shows the level), built from the site's
     tokens with 44 px targets, injected by the scene so the default site never has them. Their keyboard: the
     arrows turn the Earth (orbit) or pan (below orbit), + and - change the level, Escape returns to the
     section's view. Tab reaches them from the hero; focus wears the site's one :focus-visible ring.
   - Double-click (mouse) or double-tap (touch) on the globe: one level deeper, centred on that spot. Pinch on
     touch: a level deeper or up. Drag: turn at orbit, pan below it. All of it only where nothing else is
     under the pointer (no link, control, text or photograph) and only on the globe itself.
   - NEVER: the wheel is not listened to at all, so it always scrolls the page, over the globe too. On touch the
     hero leaves vertical panning to the browser (touch-action: pan-y), so a vertical swipe that starts on the
     globe scrolls the page (the browser cancels the pointer and scrolls); only a mostly sideways drag turns the
     globe. No listener here is passive: false, and nothing calls preventDefault on a pointer, touch or wheel
     event. Outside the hero the browser keeps every gesture (pinch-zoom included); the buttons and the
     keyboard work everywhere.
   Styles: css/site.css, under html[data-scene="next"] (step L1); nothing inline in the HTML. */
import { LEVELS, LADDER } from './story.mjs?v=5';

const IGNORE = 'a, button, input, select, textarea, label, summary, [role="button"], [role="link"], [contenteditable], nav, img, picture, video, .shot, .lightbox, .mobile-menu, .deck, .deck-toggle, .scene-levels';
const DRAG_PX = 4;           // mouse: movement before a press becomes a drag
const DECIDE_PX = 10;        // touch: movement before the direction is decided
const SIDEWAYS = 1.2;        // touch: |dx| > SIDEWAYS * |dy| is a sideways drag
const TAP_MS = 320, TAP_PX = 30, PINCH = 1.3;
const KEY_STEP = 0.12;       // an arrow turns or pans by this share of the disc's radius
const RING_CLEAR = 22;       // phones: the buttons' left edge from the disc's limb (the ring's glow, 10 px, and 12 px of air)

/* Step L1: the buttons' styles live in css/site.css (scoped to html[data-scene="next"], tokens only); this module
   keeps no CSS. On desktop the stylesheet also places them: under the section ticks, inside one hairline frame
   (.scene-instrument, drawn here as an empty decorative element), the ticks above and the levels below. */
export function createControls({ story, globe, overlay, onChange = () => {}, follow = false }) {
  // ---------------------------------------------------------------- the frame around the ticks and the levels (desktop)
  const frame = document.createElement('div');
  frame.className = 'scene-instrument';
  frame.setAttribute('aria-hidden', 'true');
  document.body.appendChild(frame);
  // ---------------------------------------------------------------- the three buttons
  const group = document.createElement('div');
  group.className = 'scene-levels';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Globe view');
  const help = document.createElement('span');
  help.className = 'sr-only';
  help.id = 'scene-levels-help';
  help.textContent = 'Arrow keys turn or pan the globe, plus and minus change the level, Escape returns to the view of this section.';
  group.appendChild(help);
  const buttons = LADDER.map(level => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.sceneLevel = level;
    b.textContent = LEVELS[level].label;
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-describedby', help.id);
    b.addEventListener('click', () => { story.takeOver({ level, why: 'button' }); onChange(); });
    group.appendChild(b);
    return b;
  });
  (document.getElementById('home') || document.body).appendChild(group);

  function setLevel(level) {
    for (const b of buttons) b.setAttribute('aria-pressed', b.dataset.sceneLevel === level ? 'true' : 'false');
  }
  setLevel(story.level());

  /* Near the globe, in the HUD's own margin: a column beside the disc. On desktop it is the right-hand edge,
     in the instrument under the section ticks, where the reading column never runs; the stylesheet places it
     there (the same media query as the phone test in layout.mjs: at least 700 px wide and not portrait). On
     phones it is just right of the disc, above the copy, placed here from the composition. */
  function place(comp, w, h) {
    group.dataset.axis = 'column';
    phone = comp.phone;
    if (!comp.phone) {
      group.style.left = ''; group.style.top = '';
      fits = true;
      show();
      return;
    }
    /* Step L2: right of the disc, RING_CLEAR px from its limb (the ring's glow reaches about 10 px out, and the
       buttons keep 12 px more), and inside the width a fixed element is placed in (a classic scrollbar excluded) */
    const gw = group.offsetWidth || 50, gh = group.offsetHeight || 144;
    /* The review of this step: on a short screen the Earth is small, so that the hero's own buttons end above the
       theme button (360 x 640: 92 px across), and the column of three (144 px) is taller than the disc it belongs
       to: it stood up into the nav and down onto the hero's first line. There the level buttons are not shown.
       The Earth still changes its view with every section, and a pinch or a double tap still changes the level. */
    fits = 2 * comp.r >= gh - 0.5;
    const room = document.documentElement.clientWidth || w;
    const x = Math.min(room - gw, comp.cx + comp.r + RING_CLEAR);
    const y = comp.cy - gh / 2;
    group.style.left = `${Math.round(Math.max(0, x))}px`;
    group.style.top = `${Math.round(Math.max(8, y))}px`;
    show();
  }
  /* Step L2: on a phone the buttons belong to the disc. They are shown wherever the stage's strength (next.mjs:
     1 at a section's opening, 0 while copy is under the disc) is over a half, in every section, and fade with
     it: full at 1, gone at a half; at a half and under they are hidden, so they can be neither focused nor
     pressed. On desktop they stand in the instrument and are always shown. */
  let phone = false, strength = 1, shownK = -1, fits = true;
  function show() {
    /* TRIAL, the open layout (follow): on desktop too the buttons and their frame belong to the Earth, and go
       with it when it leaves after the hero */
    const tied = phone || follow;
    const on = !tied || (fits && strength > 0.5);
    const q = !tied ? 1 : on ? Math.max(0.02, Math.round(Math.min(1, (strength - 0.5) * 2) * 100) / 100) : 0;
    if (q === shownK) return;                 // written only when it changes (called every frame on phones)
    shownK = q;
    group.style.visibility = on ? 'visible' : 'hidden';
    group.style.opacity = String(q);
    if (follow) { frame.style.visibility = on ? 'visible' : 'hidden'; frame.style.opacity = String(q); }
  }
  function setStrength(s) { strength = s; show(); }
  function setSection() { show(); }

  // ---------------------------------------------------------------- keyboard
  group.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const r = globe.layout.r * KEY_STEP;
    const arrows = { ArrowLeft: [-r, 0], ArrowRight: [r, 0], ArrowUp: [0, -r], ArrowDown: [0, r] };
    if (arrows[e.key]) { e.preventDefault(); story.nudge(...arrows[e.key], false); onChange(); return; }   // focus is in the widget: the arrows are its own
    if (e.key === '+' || e.key === '=') { e.preventDefault(); story.stepLevel(1); onChange(); return; }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); story.stepLevel(-1); onChange(); return; }
    if (e.key === 'Escape') { story.release(); onChange(); }
  });
  /* Escape also works after a pointer take-over, while focus is on nothing in particular (the page itself),
     and never while a dialog or the menu is open. */
  addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !story.takenOver() || group.contains(document.activeElement)) return;
    const a = document.activeElement;
    if (a && a !== document.body && a !== document.documentElement) return;
    if (document.querySelector('.lightbox.open, .mobile-menu.open')) return;
    story.release(); onChange();
  });

  // ---------------------------------------------------------------- pointer: only on the globe, only where nothing else is
  const hasText = el => { for (const n of el.childNodes) if (n.nodeType === 3 && n.nodeValue.trim()) return true; return false; };
  const allowed = t => t instanceof Element && !t.closest(IGNORE) && !hasText(t);
  const onGlobe = (x, y) => globe.fade() > 0.5 && globe.reveal() > 0.9 && Math.hypot(x - globe.layout.cx, y - globe.layout.cy) <= globe.layout.r;
  const deeperAt = (x, y, why) => {
    const g = globe.pick(x, y);
    if (!g) return false;
    story.stepLevel(1, { lat: g.lat, lon: g.lon, why });
    onChange();
    return true;
  };

  // mouse and pen: drag, double-click
  let press = null;   // { id, x, y, dragging }
  addEventListener('pointerdown', e => {
    if (e.pointerType === 'touch' || e.button !== 0) return;
    press = allowed(e.target) && onGlobe(e.clientX, e.clientY) ? { id: e.pointerId, x: e.clientX, y: e.clientY, dragging: false } : null;
  }, { passive: true });
  addEventListener('pointermove', e => {
    if (!press || e.pointerId !== press.id) return;
    if (!(e.buttons & 1)) { press = null; story.hold(false); return; }
    const dx = e.clientX - press.x, dy = e.clientY - press.y;
    if (!press.dragging) {
      if (Math.hypot(dx, dy) < DRAG_PX) return;
      press.dragging = true; story.hold(true);
      getSelection()?.removeAllRanges();
    }
    press.x = e.clientX; press.y = e.clientY;
    story.nudge(dx, dy, true); onChange();
  }, { passive: true });
  const endPress = e => { if (press && e.pointerId === press.id) { if (press.dragging) story.hold(false); press = null; } };
  /* A press that is the globe's never starts a text selection. The press usually lands on the hero's heading (its box
     spans the page), so the browser anchors a selection there. Clearing it once when the drag begins is enough in
     Chromium, which then leaves it alone; WebKit starts it again on the next move and paints the label and the name
     as the hand passes over them (the owner saw this, 2026-11-28). selectstart is asked before every such start, in
     both engines, so refusing it while the press is ours stops it at the source. It is not a pointer, touch or wheel
     event: the rule at the top of this file stands, and a press that starts on text is never ours (allowed()). */
  addEventListener('selectstart', e => { if (press) e.preventDefault(); });
  addEventListener('pointerup', endPress, { passive: true });
  addEventListener('pointercancel', endPress, { passive: true });
  addEventListener('dblclick', e => {
    if (!allowed(e.target) || !onGlobe(e.clientX, e.clientY) || overlay?.hitTest(e.clientX, e.clientY)) return;
    deeperAt(e.clientX, e.clientY, 'dblclick');
  });

  // touch: the direction test, double-tap, pinch
  const home = document.getElementById('home');
  if (home) home.style.touchAction = 'pan-y';   // vertical pans stay the browser's; sideways and pinch are the globe's
  const touches = new Map();   // id -> { x0, y0, x, y, t0, mode: null | 'turn' | 'page' }
  let pinch = null, lastTap = null;
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    if (!allowed(e.target) || !onGlobe(e.clientX, e.clientY)) return;
    touches.set(e.pointerId, { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: e.timeStamp, mode: null });
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), done: false };
      story.hold(true);
    }
  }, { passive: true });
  addEventListener('pointermove', e => {
    const t = touches.get(e.pointerId);
    if (!t) return;
    const px = t.x, py = t.y;
    t.x = e.clientX; t.y = e.clientY;
    if (pinch) {
      const [a, b] = [...touches.values()];
      const ratio = Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch.d0);
      if (!pinch.done && (ratio > PINCH || ratio < 1 / PINCH)) {
        pinch.done = true;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, g = ratio > 1 ? globe.pick(mx, my) : null;
        story.stepLevel(ratio > 1 ? 1 : -1, g ? { lat: g.lat, lon: g.lon, why: 'pinch' } : null);
        onChange();
      }
      return;
    }
    if (t.mode === null) {
      const dx = t.x - t.x0, dy = t.y - t.y0;
      if (Math.hypot(dx, dy) < DECIDE_PX) return;
      t.mode = Math.abs(dx) > SIDEWAYS * Math.abs(dy) ? 'turn' : 'page';
      if (t.mode === 'turn') story.hold(true);
    }
    if (t.mode === 'turn') { story.nudge(t.x - px, t.y - py, true); onChange(); }
  }, { passive: true });
  const endTouch = (e, cancelled) => {
    const t = touches.get(e.pointerId);
    if (!t) return;
    touches.delete(e.pointerId);
    if (pinch) { if (touches.size < 2) { pinch = null; story.hold(false); } return; }
    if (t.mode === 'turn') story.hold(false);
    if (cancelled || t.mode !== null || e.timeStamp - t.t0 > TAP_MS) return;
    // a tap: two on the same spot of the globe make a double-tap (a tap on the eye or a mark is the labels')
    if (overlay?.hitTest(t.x, t.y)) { lastTap = null; return; }
    if (lastTap && e.timeStamp - lastTap.t < TAP_MS && Math.hypot(t.x - lastTap.x, t.y - lastTap.y) < TAP_PX) {
      lastTap = null;
      deeperAt(t.x, t.y, 'double-tap');
    } else lastTap = { x: t.x, y: t.y, t: e.timeStamp };
  };
  addEventListener('pointerup', e => endTouch(e, false), { passive: true });
  addEventListener('pointercancel', e => endTouch(e, true), { passive: true });   // the browser took the gesture: it scrolls

  return {
    group, buttons, place, setLevel, setSection, setStrength,
    debug: () => ({ pressed: buttons.filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.sceneLevel), touches: touches.size }),
  };
}
