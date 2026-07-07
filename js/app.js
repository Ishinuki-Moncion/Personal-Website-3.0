/* Orchestration: hero entrance variants, typewriter, gallery lightbox,
   animated EN/JP language swap, HUD control deck. */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  /* ---------------- HERO ENTRANCE ---------------- */
  const hero = $('.hero');
  const titleLines = $$('.hero h1 .line');
  const sub = $('.hero-sub-text');
  const caret = $('.typ-caret');
  let heroVariant = 'decrypt';
  try { heroVariant = localStorage.getItem('daikie-hero') || 'decrypt'; } catch (e) {}

  function clearLineStyles(line) {
    line.classList.remove('glitch', 'fire', 'scramble-on');
    line.style.cssText = '';
    line.removeAttribute('data-text');
  }

  /* SAFETY NET — force every hero line to its final, visible text. Called on a
     timer after each entrance so a throttled/interrupted rAF (offscreen tab,
     slow paint) can never leave the giant title blank. */
  let heroSettleTimer = null;
  function settleHero() {
    titleLines.forEach(line => {
      line.classList.remove('glitch', 'fire', 'scramble-on');
      line.style.clipPath = '';
      const chs = line.querySelectorAll('.ch');
      if (chs.length) {
        let txt = '';
        chs.forEach(s => { s.style.opacity = '1'; s.style.transform = 'none'; txt += s.textContent; });
        if (txt !== line.dataset.line) line.textContent = line.dataset.line;
      } else if (line.textContent !== line.dataset.line) {
        line.textContent = line.dataset.line;
      }
    });
    if (sub && sub.dataset.text && sub.textContent !== sub.dataset.text) {
      sub.textContent = sub.dataset.text;
      if (caret) caret.style.opacity = '0.4';
    }
  }

  function runDecrypt() {
    titleLines.forEach((line, li) => {
      clearLineStyles(line); line.textContent = '';
      setTimeout(() => {
        line.classList.add('scramble-on');
        window.scramble(line, line.dataset.line, { duration: 950 }).then(() => line.classList.remove('scramble-on'));
      }, li * 230);
    });
  }

  function runStagger() {
    titleLines.forEach((line, li) => {
      clearLineStyles(line); line.innerHTML = '';
      [...line.dataset.line].forEach((c, ci) => {
        const s = document.createElement('span');
        s.className = 'ch'; s.textContent = c;
        s.style.opacity = '0';
        s.style.transform = 'translateY(0.6em) rotateX(-55deg)';
        s.style.transformOrigin = 'bottom';
        s.style.transition = 'opacity .55s var(--ease-out), transform .8s var(--ease-out)';
        s.style.transitionDelay = (li * 0.28 + ci * 0.045) + 's';
        line.appendChild(s);
      });
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$('.hero h1 .ch').forEach(s => { s.style.opacity = '1'; s.style.transform = 'none'; });
    }));
  }

  function runChromatic() {
    titleLines.forEach((line, li) => {
      clearLineStyles(line);
      line.textContent = line.dataset.line;
      line.setAttribute('data-text', line.dataset.line);
      line.classList.add('glitch');
      line.style.clipPath = 'inset(0 100% 0 0)';
      line.style.transition = 'clip-path .85s var(--ease-io)';
      line.style.transitionDelay = (li * 0.18) + 's';
      requestAnimationFrame(() => requestAnimationFrame(() => { line.style.clipPath = 'inset(0 0 0 0)'; }));
      setTimeout(() => { line.classList.add('fire'); setTimeout(() => line.classList.remove('fire'), 1100); }, li * 200 + 560);
    });
  }

  function typeSub() {
    if (!sub) return;
    const text = sub.dataset.text || sub.textContent;
    if (reduced) { sub.textContent = text; if (caret) caret.style.display = 'none'; return; }
    sub.textContent = '';
    let i = 0;
    const iv = setInterval(() => {
      sub.textContent = text.slice(0, ++i);
      if (i >= text.length) { clearInterval(iv); setTimeout(() => { if (caret) caret.style.opacity = '0.4'; }, 600); }
    }, 26);
  }

  function runHero() {
    if (!hero) return;
    if (reduced) { titleLines.forEach(l => { clearLineStyles(l); l.textContent = l.dataset.line; }); typeSub(); return; }
    if (heroVariant === 'stagger') runStagger();
    else if (heroVariant === 'chromatic') runChromatic();
    else runDecrypt();
    setTimeout(typeSub, 700);
    // guaranteed settle — covers the longest variant (~1.7s) with margin
    clearTimeout(heroSettleTimer);
    heroSettleTimer = setTimeout(settleHero, 2800);
  }

  /* ---------------- LANGUAGE SWAP ---------------- */
  let lang = 'en';
  try { const s = localStorage.getItem('daikie-lang'); if (s === 'en' || s === 'ja') lang = s; } catch (e) {}

  function applyLang(animate) {
    const els = $$('[data-en]');
    els.forEach(el => {
      const target = lang === 'ja' ? (el.dataset.ja || el.dataset.en) : el.dataset.en;
      if (el.dataset.ja) el.classList.toggle('is-jp', lang === 'ja');
      if (animate && !reduced && window.scramble && el.offsetParent !== null) {
        window.scramble(el, target, { duration: 520 });
      } else {
        el.textContent = target;
      }
    });
    const btn = $('.lang-btn .swap');
    if (btn) btn.textContent = lang === 'en' ? 'EN / 日本' : '日本 / EN';
    document.documentElement.lang = lang === 'ja' ? 'ja' : 'en';
    try { localStorage.setItem('daikie-lang', lang); } catch (e) {}
    // deck seg
    $$('.seg[data-seg="lang"] button').forEach(b => b.classList.toggle('on', b.dataset.val === lang));
  }
  function toggleLang() { lang = lang === 'en' ? 'ja' : 'en'; applyLang(true); }

  $$('.lang-btn').forEach(b => b.addEventListener('click', toggleLang));

  /* ---------------- GALLERY LIGHTBOX ---------------- */
  const lb = $('.lightbox');
  const lbImg = $('.lb-img');
  const lbPos = $('.lb-pos');
  const lbId = $('.lb-id');
  const lbExif = $('.lb-exif');
  const strip = $('.lb-strip');
  const shots = $$('.shot');
  const sources = shots.map(s => s.getAttribute('data-src'));
  let lbIndex = 0;

  function buildStrip() {
    if (!strip) return;
    sources.forEach((src, i) => {
      const t = document.createElement('button');
      // 140px derivatives — the strip used to decode the multi-MB originals
      t.className = 'lb-thumb';
      t.style.backgroundImage = `url("${src.replace('images/', 'images/thumbs/')}")`;
      t.setAttribute('data-cursor', 'VIEW');
      t.setAttribute('aria-label', 'Show photograph ' + (i + 1));
      t.addEventListener('click', () => show(i));
      strip.appendChild(t);
    });
  }
  buildStrip();
  const thumbs = strip ? [...strip.children] : [];

  /* Image strategy: inline styles ship 140px thumbs as instant placeholders;
     the 640px tile swaps in when a shot nears the viewport; only the lightbox
     ever touches the full-size originals. */
  shots.forEach((s, i) => {
    const t = s.getAttribute('data-title');
    s.setAttribute('aria-label', 'View photograph ' + (i + 1) + (t ? ' — ' + t : '') + ' full screen');
  });
  const upgradeTile = s => {
    const m = s.querySelector('.media'), src = s.getAttribute('data-src');
    if (m && src) m.style.backgroundImage = `url("${src.replace('images/', 'images/tiles/')}")`;
  };
  // rAF + rect check, NOT IntersectionObserver — same reasoning as effects.js
  // (IO misbehaves in scaled/preview iframes). Self-prunes to zero work.
  const pendingTiles = [...shots];
  function checkTiles() {
    for (let i = pendingTiles.length - 1; i >= 0; i--) {
      const r = pendingTiles[i].getBoundingClientRect();
      if (r.top < innerHeight + 400 && r.bottom > -400) {
        upgradeTile(pendingTiles[i]);
        pendingTiles.splice(i, 1);
      }
    }
  }
  let tileTick = false;
  function onTileScroll() {
    if (tileTick || !pendingTiles.length) return;
    tileTick = true;
    requestAnimationFrame(() => { tileTick = false; checkTiles(); });
  }
  addEventListener('scroll', onTileScroll, { passive: true });
  addEventListener('resize', onTileScroll, { passive: true });
  checkTiles();

  function show(i) {
    lbIndex = (i + sources.length) % sources.length;
    if (lbImg) {
      lbImg.classList.add('swapping');
      setTimeout(() => {
        lbImg.src = sources[lbIndex];
        const t = shots[lbIndex] && shots[lbIndex].getAttribute('data-title');
        lbImg.alt = (t ? t + ' — ' : '') + 'gallery photograph ' + (lbIndex + 1) + ' of ' + sources.length;
        lbImg.classList.remove('swapping');
      }, 180);
    }
    if (lbPos) lbPos.textContent = String(lbIndex + 1).padStart(2, '0') + ' / ' + String(sources.length).padStart(2, '0');
    if (lbId) lbId.textContent = 'IMG_' + String(lbIndex + 1).padStart(2, '0');
    if (lbExif) lbExif.textContent = (shots[lbIndex] && shots[lbIndex].dataset.meta) || 'EXIF//REDACTED';
    thumbs.forEach((t, k) => t.classList.toggle('active', k === lbIndex));
    const active = thumbs[lbIndex];
    if (active && active.scrollIntoView) { /* avoid scrollIntoView per guidance */ }
    if (active && strip) strip.scrollLeft = active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2;
  }
  /* Focus management: remember the trigger, move focus into the dialog on
     open, restore it on close — without this a keyboard user is left tabbing
     the page underneath an open modal. */
  let lbReturnFocus = null;
  /* v32h — overlays are visibility-gated while closed, and Blink applies the closed
     state's transition delay on the opening edge, so the focus target can stay
     computed-hidden (unfocusable) for up to ~.45s after open. Retry until it lands. */
  function focusWhenFocusable(el, tries = 10) {
    if (!el) return;
    el.focus();
    if (document.activeElement !== el && tries > 0) setTimeout(() => focusWhenFocusable(el, tries - 1), 80);
  }
  function openLb(i) {
    if (!lb) return;
    lbReturnFocus = document.activeElement;
    show(i);
    lb.inert = false;                       // un-inert BEFORE moving focus in
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    focusWhenFocusable($('.lb-close'));
  }
  function closeLb() {
    if (!lb) return;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    lb.inert = true;
    document.body.style.overflow = '';
    if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
    lbReturnFocus = null;
  }

  shots.forEach((s, i) => s.addEventListener('click', () => openLb(i)));
  $('.lb-close') && $('.lb-close').addEventListener('click', closeLb);
  $('.lb-prev') && $('.lb-prev').addEventListener('click', () => show(lbIndex - 1));
  $('.lb-next') && $('.lb-next').addEventListener('click', () => show(lbIndex + 1));
  lb && lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-stage')) closeLb(); });
  /* Tab trap shared by every fullscreen overlay (lightbox + mobile menu):
     cycle focus among the container's visible interactive elements. */
  function trapTab(container, e) {
    const f = [...container.querySelectorAll('button, a[href]')].filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  addEventListener('keydown', e => {
    if (!lb || !lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') show(lbIndex - 1);
    else if (e.key === 'ArrowRight') show(lbIndex + 1);
    else if (e.key === 'Tab') trapTab(lb, e);
  });

  // touch swipe inside the lightbox
  const lbStage = $('.lb-stage');
  let touchX = 0;
  lbStage && lbStage.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  lbStage && lbStage.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 45) show(lbIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  /* ---------------- MOBILE MENU ---------------- */
  const burger = $('.nav-burger');
  const mmenu = $('#mobileMenu');
  let menuReturnFocus = null;
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (mmenu) mmenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (burger) burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menuReturnFocus = document.activeElement;
      focusWhenFocusable($('.mm-close'));
    } else if (menuReturnFocus && menuReturnFocus.focus) {
      menuReturnFocus.focus(); menuReturnFocus = null;
    }
  }
  burger && burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $('.mm-close') && $('.mm-close').addEventListener('click', () => setMenu(false));
  $$('.mm-links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => {
    if (!document.body.classList.contains('menu-open')) return;
    if (e.key === 'Escape') setMenu(false);
    else if (e.key === 'Tab' && mmenu) trapTab(mmenu, e);
  });

  /* ---------------- CONTROL DECK ---------------- */
  const deck = $('.deck');
  const deckToggle = $('.deck-toggle');
  function setDeck(open) {
    if (!deck || !deckToggle) return;
    deck.inert = !open;
    deck.classList.toggle('open', open);
    deck.setAttribute('aria-hidden', open ? 'false' : 'true');
    deckToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    deckToggle.setAttribute('aria-label', open ? 'Close control deck' : 'Open control deck');
  }
  deckToggle && deck && deckToggle.addEventListener('click', () => setDeck(!deck.classList.contains('open')));
  document.addEventListener('click', e => {
    if (deck && deckToggle && deck.classList.contains('open') && !deck.contains(e.target) && !deckToggle.contains(e.target))
      setDeck(false);
  });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && deck && deck.classList.contains('open')) {
      setDeck(false);
      deckToggle && deckToggle.focus();
    }
  });

  /* ---------------- CONTACT SIGNAL ROW ----------------
     Return path (v3.2f): the address is assembled at runtime from char codes —
     by law it never appears as plaintext in any committed file. Click = copy,
     amber tick = the event. */
  const sigRow = $('.signal-row');
  if (sigRow) {
    const addr = String.fromCharCode(105, 115, 104, 105, 110, 117, 107, 105, 100, 97, 105, 107, 105, 101, 64, 105, 99, 108, 111, 117, 100, 46, 99, 111, 109);
    const addrOut = sigRow.querySelector('[data-addr]');
    const copyStatus = sigRow.querySelector('[data-copy-status]');
    if (addrOut) addrOut.textContent = addr;
    let sigTimer = null;
    const copied = () => {
      sigRow.classList.add('copied');
      if (copyStatus) copyStatus.textContent = 'Email address copied';
      clearTimeout(sigTimer);
      sigTimer = setTimeout(() => {
        sigRow.classList.remove('copied');
        if (copyStatus) copyStatus.textContent = '';
      }, 1600);
    };
    const fallbackCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = addr; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { if (document.execCommand('copy')) copied(); } catch (e) {}
      document.body.removeChild(ta);
    };
    sigRow.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(copied, fallbackCopy);
      else fallbackCopy();
    });
  }

  // hero variant segment
  $$('.seg[data-seg="hero"] button').forEach(b => {
    b.classList.toggle('on', b.dataset.val === heroVariant);
    b.addEventListener('click', () => {
      heroVariant = b.dataset.val;
      try { localStorage.setItem('daikie-hero', heroVariant); } catch (e) {}
      $$('.seg[data-seg="hero"] button').forEach(x => x.classList.toggle('on', x === b));
      runHero();
    });
  });
  // lang segment
  $$('.seg[data-seg="lang"] button').forEach(b => {
    b.addEventListener('click', () => { if (b.dataset.val !== lang) toggleLang(); });
  });
  // reboot
  $('.deck-reboot') && $('.deck-reboot').addEventListener('click', () => { try { sessionStorage.removeItem('daikie-booted'); } catch (e) {} location.reload(); });

  /* ---------------- INIT ---------------- */
  let heroStarted = false;
  function start() { if (heroStarted) return; heroStarted = true; applyLang(false); runHero(); }
  if (document.body.hasAttribute('data-booting')) {
    document.addEventListener('boot:done', start, { once: true });
    setTimeout(() => { if (!document.body.hasAttribute('data-booting')) start(); }, 250);
    // absolute fallback — if boot somehow never resolves, still reveal the hero
    setTimeout(start, 9500);
  } else { start(); }
  document.addEventListener('boot:done', () => { if (hero) hero.dataset.started = '1'; }, { once: true });

  /* occasional hero title glitch — dramatic but restrained, paused when hidden */
  if (!reduced) {
    const h1 = $('.hero h1');
    setInterval(() => {
      if (!h1 || document.hidden || !heroStarted) return;
      if (Math.random() < 0.55) { h1.classList.add('glx'); setTimeout(() => h1.classList.remove('glx'), 420); }
    }, 5200);
  }
})();
