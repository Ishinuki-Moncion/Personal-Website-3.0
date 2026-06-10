/* Scroll engine + reveals + parallax + nav state + live Tokyo clock + counters.
   Reveals are driven by a rAF scroll handler reading getBoundingClientRect —
   robust inside scaled/preview iframes where IntersectionObserver misbehaves.
   Exposes window.scramble() for text decrypt used by hero & locale swap. */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLYPHS = 'ｱｲｳｴｵｶｷｸ01<>/\\#$%日本開発ABCDEF';

  /* ---- text scramble / decrypt ----
     Token guard: each call stamps the element so a newer call on the same node
     cancels the older loop instead of racing it (which could otherwise blank the
     text). A hard wall-clock cap guarantees the element settles to `text`. */
  window.scramble = function (el, text, opts) {
    opts = opts || {};
    const dur = opts.duration || 700;
    if (reduced) { el.textContent = text; return Promise.resolve(); }
    const token = (el.__scrToken = (el.__scrToken || 0) + 1);
    const chars = text.split('');
    const start = performance.now();
    const settle = chars.map(() => 0.2 + Math.random() * 0.8);
    return new Promise(resolve => {
      function done() { el.textContent = text; resolve(); }
      function tick(now) {
        if (el.__scrToken !== token) { resolve(); return; }   // superseded
        const p = Math.min(1, (now - start) / dur);
        let out = '';
        for (let i = 0; i < chars.length; i++) {
          if (chars[i] === ' ') { out += ' '; continue; }
          out += p >= settle[i] ? chars[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(tick);
        else done();
      }
      requestAnimationFrame(tick);
      // safety: if rAF stalls, settle by wall clock anyway
      setTimeout(() => { if (el.__scrToken === token && el.textContent !== text) done(); }, dur + 400);
    });
  };

  /* ---- collect animated elements ---- */
  let reveals = [], counters = [], parallaxEls = [];

  function bind() {
    document.querySelectorAll('[data-stagger]').forEach(group => {
      [...group.children].forEach((k, i) => k.style.setProperty('--d', (i * 0.07) + 's'));
    });
    reveals = [...document.querySelectorAll('[data-reveal], .clip-reveal, .sec-label')].map(el => {
      const d = el.getAttribute('data-reveal-delay');
      if (d) el.style.setProperty('--d', d);
      return el;
    });
    counters = [...document.querySelectorAll('[data-count]')];
    parallaxEls = [...document.querySelectorAll('[data-parallax]')];
  }

  function runCounter(el) {
    const target = parseFloat(el.getAttribute('data-count'));
    const suffix = el.getAttribute('data-suffix') || '';
    if (reduced) { el.textContent = target + suffix; return; }
    const dur = 1400, start = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  }

  function checkReveals() {
    const vh = innerHeight;
    for (let i = reveals.length - 1; i >= 0; i--) {
      const el = reveals[i];
      const top = el.getBoundingClientRect().top;
      if (top < vh * 0.92) { el.classList.add('seen'); reveals.splice(i, 1); }
    }
    for (let i = counters.length - 1; i >= 0; i--) {
      const el = counters[i];
      if (el.getBoundingClientRect().top < vh * 0.85) { runCounter(el); counters.splice(i, 1); }
    }
  }

  /* ---- nav + progress + section HUD + parallax ---- */
  const nav = document.querySelector('.nav');
  const progress = document.querySelector('.scroll-progress');
  const sections = ['about', 'work', 'gallery', 'projects', 'contact'];
  const hudLinks = {}, navLinks = {};
  document.querySelectorAll('.scroll-hud a').forEach(a => { hudLinks[a.getAttribute('data-sec')] = a; });
  document.querySelectorAll('.nav-link[data-sec]').forEach(a => { navLinks[a.getAttribute('data-sec')] = a; });

  let ticking = false;
  let lastActive = 'home', lastPing = 0;
  function frame() {
    const y = scrollY;
    const max = Math.max(1, document.body.scrollHeight - innerHeight);
    if (progress) progress.style.width = (y / max * 100) + '%';
    if (nav) nav.classList.toggle('scrolled', y > 40);

    if (!reduced) {
      for (const el of parallaxEls) {
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - innerHeight / 2;
        el.style.transform = `translate3d(0, ${(-center * speed).toFixed(1)}px, 0)`;
      }
    }

    checkReveals();

    let active = 'home';
    for (const id of sections) {
      const s = document.getElementById(id);
      if (s && s.getBoundingClientRect().top <= innerHeight * 0.4) active = id;
    }
    if (scrollY < 80) active = 'home';
    Object.entries(hudLinks).forEach(([k, a]) => a.classList.toggle('active', k === active));
    Object.entries(navLinks).forEach(([k, a]) => a.classList.toggle('active', k === active));

    // entering a new section pings the scene (globe ripple + ring flash);
    // cooldown keeps fast scrolling from strobing it
    if (active !== lastActive) {
      lastActive = active;
      const now = performance.now();
      if (window.__scenePing && now - lastPing > 600) { lastPing = now; window.__scenePing(); }
    }
    ticking = false;
  }
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(frame); }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });

  /* ---- live Tokyo clock ----
     Intl.DateTimeFormat instead of the old new Date(toLocaleString()) round
     trip, which is implementation-defined off V8 (can yield Invalid Date).
     Skips work while the tab is hidden — the readout is invisible anyway. */
  const clockEls = [...document.querySelectorAll('[data-clock]')];
  const clockFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  function tickClock() {
    if (!clockEls.length || document.hidden) return;
    const txt = `JST ${clockFmt.format(new Date())}`;
    clockEls.forEach(el => { el.textContent = txt; });
  }
  setInterval(tickClock, 1000); tickClock();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tickClock(); });

  /* ---- init ---- */
  let inited = false;
  function init() {
    if (inited) return;
    inited = true;
    bind();
    frame();          // initial pass — reveals anything already in view
    requestAnimationFrame(frame);
  }
  window.__effectsInit = init;

  if (document.body.hasAttribute('data-booting')) {
    document.addEventListener('boot:done', init, { once: true });
    const poll = setInterval(() => {
      if (!document.body.hasAttribute('data-booting')) { clearInterval(poll); init(); }
    }, 120);
  } else {
    init();
  }
})();
