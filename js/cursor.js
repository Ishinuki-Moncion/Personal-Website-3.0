/* HUD reticle cursor with lerped trailing, hover states, magnetic pull on
   [data-magnetic] elements, and contextual labels via [data-cursor]. */
(function () {
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  const ring = document.querySelector('.cursor');
  const dot = document.querySelector('.cursor-dot');
  const label = document.querySelector('.cursor-label');
  if (!ring || !dot) return;

  let mx = innerWidth / 2, my = innerHeight / 2;     // target
  let rx = mx, ry = my;                               // ring (lerped)
  const SEL = 'a, button, .shot, .pill, [data-cursor], [data-magnetic]';

  addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    if (label.classList.contains('show')) {
      label.style.transform = `translate(${mx + 18}px, ${my + 8}px)`;
    }
  });
  addEventListener('pointerdown', () => ring.classList.add('is-down'));
  addEventListener('pointerup', () => ring.classList.remove('is-down'));

  // delegated hover state
  let magnetEl = null, magnetRect = null;
  document.addEventListener('pointerover', e => {
    const hot = e.target.closest(SEL);
    if (!hot) return;
    const isText = hot.matches('input, textarea, [contenteditable]');
    ring.classList.toggle('is-hot', !isText);
    ring.classList.toggle('is-text', isText);
    const lbl = hot.getAttribute('data-cursor');
    if (lbl) { label.textContent = lbl; label.classList.add('show'); }
    if (hot.hasAttribute('data-magnetic')) { magnetEl = hot; magnetRect = hot.getBoundingClientRect(); }
  });
  document.addEventListener('pointerout', e => {
    const hot = e.target.closest(SEL);
    if (!hot) return;
    const to = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(SEL);
    if (to === hot) return;
    ring.classList.remove('is-hot', 'is-text');
    label.classList.remove('show');
    if (magnetEl === hot) { magnetEl.style.transform = ''; magnetEl = null; magnetRect = null; }
  });

  function frame() {
    rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    if (magnetEl && magnetRect) {
      const cx = magnetRect.left + magnetRect.width / 2;
      const cy = magnetRect.top + magnetRect.height / 2;
      const dx = (mx - cx) * 0.28, dy = (my - cy) * 0.28;
      magnetEl.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
