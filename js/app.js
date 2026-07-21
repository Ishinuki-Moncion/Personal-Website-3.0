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

  /* v3.3d — WAAPI sequencer (M5). Every entrance beat is a tracked Animation on
     the document timeline: runHero() cancels the whole set before re-running, so
     interruption safety is STRUCTURAL (real cancel/finish/fill lifecycle) and the
     old wall-clock settle sweep is retired. End states are owned by the animation
     lifecycle — backwards fill through the delay, the elements' natural styles
     after finish — never by inline styles. Beats are the pre-M5 constants, named
     in one place. */
  const EASE_OUT_CB = 'cubic-bezier(0.16, 1, 0.3, 1)';  // = --ease-out (site.css:43)
  const EASE_IO_CB = 'cubic-bezier(0.65, 0, 0.35, 1)';  // = --ease-io  (site.css:44)
  const HERO_BEATS = {
    decryptLineMs: 230,                    // was setTimeout(li * 230)
    staggerLineMs: 280, staggerChMs: 45,   // was transitionDelay li*0.28s + ci*0.045s
    chromaticWipeMs: 180,                  // was transitionDelay li*0.18s
    chromaticFireStepMs: 200, chromaticFireBaseMs: 560, chromaticFireHoldMs: 1100,
    subMs: 700                             // was the 700ms sub setTimeout
  };
  let anims = [];
  /* seq(): a zero-duration marker Animation whose finished promise fires a beat.
     Cancellable like any Animation; cancel() REJECTS finished, so the rejection
     handler swallows it by design — torture runs must stay console-clean. */
  function seq(delayMs, fn) {
    const a = document.body.animate([], { delay: delayMs, duration: 0 });
    a.finished.then(fn, () => {});
    anims.push(a);
    return a;
  }

  function runDecrypt() {
    titleLines.forEach((line, li) => {
      clearLineStyles(line); line.textContent = '';
      seq(li * HERO_BEATS.decryptLineMs, () => {
        line.classList.add('scramble-on');
        window.scramble(line, line.dataset.line, { duration: 950 }).then(() => line.classList.remove('scramble-on'));
      });
    });
  }

  function runStagger() {
    titleLines.forEach((line, li) => {
      clearLineStyles(line); line.innerHTML = '';
      [...line.dataset.line].forEach((c, ci) => {
        const s = document.createElement('span');
        s.className = 'ch'; s.textContent = c;
        line.appendChild(s);
        /* ONE Animation per char carrying BOTH pre-M5 curves via property-
           specific keyframes: opacity finishes at offset 550/800 = 0.6875
           (= the old .55s track inside the .8s transform track), both easing
           --ease-out. fill:'backwards' hides the char through its delay; on
           finish the effect ceases and the char's NATURAL state (opacity 1,
           transform none — byte-identical to the pre-M5 settled computed
           style; a fill-held 'none' would serialize as the identity matrix)
           takes over — zero inline styles, no double-rAF kick. */
        anims.push(s.animate([
          { offset: 0, easing: EASE_OUT_CB, opacity: 0,
            transform: 'translateY(0.6em) rotateX(-55deg)', transformOrigin: 'bottom' },
          { offset: 0.6875, opacity: 1 },
          { offset: 1, transform: 'none', transformOrigin: 'bottom' }
        ], { duration: 800, delay: li * HERO_BEATS.staggerLineMs + ci * HERO_BEATS.staggerChMs, fill: 'backwards' }));
      });
    });
  }

  function runChromatic() {
    titleLines.forEach((line, li) => {
      clearLineStyles(line);
      line.textContent = line.dataset.line;
      line.setAttribute('data-text', line.dataset.line);
      line.classList.add('glitch');
      /* Wipe fills BACKWARDS only: while it runs the line clips exactly as the
         pre-M5 inline transition did; on finish the clip ceases to apply, so
         computed clip-path returns to 'none' — the state the retired settle
         sweep used to restore by hand. */
      anims.push(line.animate(
        [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
        { duration: 850, delay: li * HERO_BEATS.chromaticWipeMs, easing: EASE_IO_CB, fill: 'backwards' }
      ));
      /* fire beat rides marker Animations at the pre-M5 offsets (li*200+560 on,
         +1100 off) — same wall-clock beats, now cancellable. */
      seq(li * HERO_BEATS.chromaticFireStepMs + HERO_BEATS.chromaticFireBaseMs, () => {
        line.classList.add('fire');
        seq(HERO_BEATS.chromaticFireHoldMs, () => line.classList.remove('fire'));
      });
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
    /* structural interruption safety: kill the previous entrance's whole
       Animation set before starting — no timer bookkeeping, no stale beats. */
    anims.forEach(a => a.cancel());
    anims = [];
    if (heroVariant === 'stagger') runStagger();
    else if (heroVariant === 'chromatic') runChromatic();
    else runDecrypt();
    seq(HERO_BEATS.subMs, typeSub);   // the 700ms sub beat, on the same timeline
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
    const langBtn = $('.lang-btn');
    if (langBtn) {
      // the label announces the TARGET language, in that language
      langBtn.setAttribute('aria-label', lang === 'en'
        ? 'EN / 日本 — Switch to Japanese'
        : '日本 / EN — 英語に切り替える');
      langBtn.setAttribute('lang', lang === 'en' ? 'en' : 'ja');
    }
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

  /* v3.2n — touch photo parity: hover doesn't exist on coarse pointers, so the
     tile nearest viewport centre wears the EXISTING focus grade (.lit lifts the
     rest filter) — exactly ONE at a time (one-signal rule): remove-before-add.
     Same rAF+rect pattern as checkTiles (IO misbehaves in scaled/preview
     iframes), and registered for BOTH scroll and resize like onTileScroll — an
     orientation flip without a scroll re-picks instead of leaving a stale lit
     tile. Filter transition is covered by the reduced-motion kill-switch. */
  if (matchMedia('(pointer: coarse)').matches && shots.length) {
    let litShot = null, litTick = false;
    function checkLit() {
      const mid = innerHeight / 2;
      let best = null, bestD = Infinity;
      for (const s of shots) {
        const r = s.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = s; }
      }
      if (best !== litShot) {
        if (litShot) litShot.classList.remove('lit');
        litShot = best;
        if (litShot) litShot.classList.add('lit');
      }
    }
    function onLitScroll() {
      if (litTick) return;
      litTick = true;
      requestAnimationFrame(() => { litTick = false; checkLit(); });
    }
    addEventListener('scroll', onLitScroll, { passive: true });
    addEventListener('resize', onLitScroll, { passive: true });
    checkLit();
  }

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
    if (lbPos) lbPos.textContent = String(lbIndex + 1).padStart(2, '0') + '/' + String(sources.length).padStart(2, '0');
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
  let lbOpenPending = false;
  let lbOpenRequest = 0;
  /* v32h — overlays are visibility-gated while closed, and Blink applies the closed
     state's transition delay on the opening edge, so the focus target can stay
     computed-hidden (unfocusable) for up to ~.45s after open. Retry until it lands. */
  function focusWhenFocusable(el, tries = 10) {
    if (!el) return;
    el.focus();
    if (document.activeElement !== el && tries > 0) setTimeout(() => focusWhenFocusable(el, tries - 1), 80);
  }
  const overlayInertState = new Map();
  function setOverlaySiblingsInert(container, open) {
    [...document.body.children].forEach(el => {
      if (el === container || el.tagName === 'SCRIPT' || el.tagName === 'TEMPLATE') return;
      if (open) {
        overlayInertState.set(el, el.inert);
        el.inert = true;
      } else if (overlayInertState.has(el)) {
        el.inert = overlayInertState.get(el);
        overlayInertState.delete(el);
      }
    });
  }
  function openLb(i, returnTarget) {
    if (!lb) return;
    const request = ++lbOpenRequest;
    lbOpenPending = true;
    lbReturnFocus = returnTarget || document.activeElement;
    setOverlaySiblingsInert(lb, true);
    const openNow = () => {
      if (!lbOpenPending || request !== lbOpenRequest) return false;
      lbOpenPending = false;
      show(i);
      lb.inert = false;                       // un-inert BEFORE moving focus in
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      focusWhenFocusable($('.lb-close'));
      return true;
    };
    /* v3.2o — progressive enhancement: shared-element morph tile→stage where
       View Transitions exist; everywhere else (and under reduced motion) the
       original fade runs untouched. Name lives on the tile in the OLD state
       and moves to the stage image in the NEW state — never both at once.
       The full-res frame is decoded FIRST (bounded at 250ms so a cold cache
       cannot stall the open) and set synchronously inside the update callback
       — otherwise the NEW snapshot catches the stale/blank stage mid-swap. */
    const srcTile = shots[(i + shots.length) % shots.length];
    const media = srcTile && srcTile.querySelector('.media');
    if (!reduced && typeof document.startViewTransition === 'function' && media && lbImg) {
      const pre = new Image();
      pre.src = sources[(i + sources.length) % sources.length];
      Promise.race([pre.decode().catch(() => {}), new Promise(r => setTimeout(r, 250))]).then(() => {
        if (!lbOpenPending || request !== lbOpenRequest) return;
        media.style.viewTransitionName = 'lb-photo';
        const vt = document.startViewTransition(() => {
          if (!lbOpenPending || request !== lbOpenRequest) {
            media.style.viewTransitionName = '';
            return;
          }
          media.style.viewTransitionName = '';
          lbImg.style.viewTransitionName = 'lb-photo';
          openNow();
          lbImg.src = pre.src;                 // already decoded — snapshot gets the real photograph
          lbImg.classList.remove('swapping');  // skip the fade show() armed; the morph IS the entrance
        });
        vt.finished.finally(() => { lbImg.style.viewTransitionName = ''; });
      });
    } else {
      openNow();
    }
  }
  function closeLb() {
    if (!lb) return;
    lbOpenPending = false;
    lbOpenRequest++;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    lb.inert = true;
    document.body.style.overflow = '';
    setOverlaySiblingsInert(lb, false);
    if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
    lbReturnFocus = null;
  }

  /* v3.2o GATED — photo ambient halo: average-colour DOM glow behind the
     lightbox image. The pass's ONLY new-emissive-layer candidate; ships OFF —
     it FAILED its net-luminance-down gate in the original campaign (on 52.23
     > off 51.29). Everything (canvas, listener, style) sits behind the const:
     with HALO_GATE false, NOTHING is allocated, bound, or drawn. Flip to true
     ONLY for an owner-requested gate capture. */
  const HALO_GATE = false;
  if (HALO_GATE && lbImg) {
    const av = document.createElement('canvas'); av.width = av.height = 1;
    const avx = av.getContext('2d', { willReadFrequently: true });
    lbImg.addEventListener('load', () => {
      try {
        avx.drawImage(lbImg, 0, 0, 1, 1);
        const d = avx.getImageData(0, 0, 1, 1).data;
        lbImg.style.boxShadow =
          '0 0 60px rgba(0,0,0,0.7), 0 0 110px 8px rgba(' + d[0] + ',' + d[1] + ',' + d[2] + ',0.20)';
      } catch (e) { /* tainted canvas — halo silently off */ }
    });
  }

  /* v3.2o GATED — minimal typographic stack rail: per-row tech readouts align
     as ONE column; the alignment IS the rail, nothing is drawn (the L3
     deferral's over-framing warning stands). Ships OFF pending owner A/B:
     gates/v32/o2-rail-on.png vs o2-rail-off.png — the body class is the only
     hook, so with RAIL_GATE false the CSS never matches anything. */
  const RAIL_GATE = false;
  if (RAIL_GATE) document.body.classList.add('proj-rail');

  shots.forEach((s, i) => s.addEventListener('click', () => openLb(i, s)));
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
    if (!lb || (!lb.classList.contains('open') && !lbOpenPending)) return;
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
    if (mmenu) {
      mmenu.inert = !open;
      mmenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    if (burger) burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menuReturnFocus = burger || document.activeElement;
      setOverlaySiblingsInert(mmenu, true);
      focusWhenFocusable($('.mm-close'));
    } else {
      setOverlaySiblingsInert(mmenu, false);
      if (menuReturnFocus && menuReturnFocus.focus) menuReturnFocus.focus();
      menuReturnFocus = null;
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
