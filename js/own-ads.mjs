/* The site's own live ads (index.html, #own-ads): run each ad only while it is near the screen, show its state in
 * the caption, replay it on request, and take the ads' links into this page.
 *
 * Each ad is a page of its own under ads/, in a lazy frame at its true size. An ad starts paused and says
 * { ns: 'own-ad', type: 'ready' } when it has loaded; this page answers with 'run' or 'pause' and sends either
 * again whenever the frame comes near the screen (within a tenth of a screen) or leaves it, or the tab is hidden.
 * Messages go only to the frames' own windows and are taken only from them (the frames are sandboxed without the
 * same origin, so their origin is opaque: 'null').
 *
 * Replay loads the ad's page again with location.replace, so its opening runs from the start; the src attribute
 * is never touched, because changing it adds an entry to the tab's history and Back would step through ads.
 *
 * An ad's link that leads to a section of this page (data-go) is sent here instead of navigating the top window,
 * so the page keeps its own address, query and language: only the four section names are accepted. The case-study
 * link is a plain target="_top" navigation.
 *
 * Keyboard focus that walks into an ad lands on the ad's own controls; the frame element in this page matches no
 * :focus, so the tile gets .is-focus while a Tab has taken focus into its frame (as on the Work site, work.mjs). */
const block = document.getElementById('own-ads');
const SECTIONS = new Set(['#projects', '#work', '#gallery', '#contact']);

if (block) {
  const tiles = [...block.querySelectorAll('.adt')].map(tile => ({
    tile,
    frame: tile.querySelector('iframe'),
    state: tile.querySelector('.adt-state'),
    replay: tile.querySelector('.adt-replay'),
    near: false,
  }));
  const byWindow = win => tiles.find(t => t.frame && t.frame.contentWindow === win);
  const shown = t => t.frame && t.frame.getClientRects().length > 0;
  const runs = t => t.near && shown(t) && document.visibilityState === 'visible';

  const tell = t => {
    const go = runs(t);
    t.state.dataset.state = go ? 'running' : 'paused';
    /* '*': a sandboxed ad has an opaque origin, which no target origin can name; the message says only run or pause */
    try { t.frame.contentWindow.postMessage({ ns: 'own-ad', type: go ? 'run' : 'pause' }, '*'); } catch { /* not loaded yet */ }
  };

  if ('IntersectionObserver' in window) {
    const watch = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const t = tiles.find(x => x.frame === entry.target);
        if (!t) continue;
        t.near = entry.isIntersecting;
        tell(t);
      }
    }, { rootMargin: '10% 0px' });
    tiles.forEach(t => t.frame && watch.observe(t.frame));
  }
  document.addEventListener('visibilitychange', () => tiles.forEach(tell));

  window.addEventListener('message', event => {
    /* only our own frames' windows; a sandboxed ad's origin reads 'null' */
    if ((event.origin !== 'null' && event.origin !== location.origin) || !event.data || event.data.ns !== 'own-ad') return;
    const t = byWindow(event.source);
    if (!t) return;
    if (event.data.type === 'ready') tell(t);
    else if (event.data.type === 'go' && SECTIONS.has(event.data.to)) {
      const target = document.querySelector(event.data.to);
      if (!target) return;
      history.pushState(null, '', event.data.to);
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  });

  for (const t of tiles) {
    if (!t.replay || !t.frame) continue;
    const url = new URL(t.frame.getAttribute('src'), document.baseURI).href;
    t.replay.hidden = false;
    t.replay.addEventListener('click', () => {
      try { t.frame.contentWindow.location.replace(url); } catch { /* a frame that cannot be reached is left as it is */ }
      t.replay.classList.remove('is-turning');
      void t.replay.offsetWidth;               // restart the turn when pressed twice in a row
      t.replay.classList.add('is-turning');
    });
  }

  let tabbedAt = 0;
  const clearRing = () => block.querySelectorAll('.adt.is-focus').forEach(tile => tile.classList.remove('is-focus'));
  document.addEventListener('keydown', event => { if (event.key === 'Tab') tabbedAt = Date.now(); }, true);
  window.addEventListener('blur', () => {
    clearRing();
    const frame = document.activeElement;
    const tile = frame && frame.tagName === 'IFRAME' && frame.closest('.adt');
    if (tile && Date.now() - tabbedAt < 1000) {
      tile.classList.add('is-focus');
      /* WebKit moves focus into a frame without scrolling this page to it (measured: Option+Tab from the hero left the
         970x250 2,800 px below the screen), so the tile is brought into view here; elsewhere this is already done */
      tile.querySelector('.adt-view').scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
  });
  window.addEventListener('focus', clearRing);
}
