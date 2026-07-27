/* Essential DOM behavior is progressive enhancement: initialize it before the
   optional WebGL scene, then give the browser two frames to paint the page. */
window.__TIER_PROBE = null;
window.__CURSOR_ACTIVE = false;
window.__SCENE_READY_FIRED = false;

const V = { bg: '7.0', boot: '3.2', cursor: '3.2', fx: '3.8', app: '4.4', probe: '1' };

/* v3.4b: this is a COORDINATOR, not a serial dependency chain (spec 2026-07-21
   §A3). It shipped as four unguarded sequential `await import()` calls, so a
   failed fetch of any earlier module stopped js/boot.js — the only code besides
   index.html's 10s watchdog that clears `data-booting` — from ever running. With
   `body[data-booting]{overflow:hidden}`, losing the purely DECORATIVE cursor
   module trapped the visitor under the boot overlay, unable to scroll, until the
   watchdog. Every import is now isolated; one optional module cannot take the
   page down with it. */
async function load(specifier, label) {
  try {
    await import(specifier);
    return true;
  } catch (error) {
    console.warn(`[boot] module "${label}" failed to load; continuing without it`, error);
    return false;
  }
}

/* Essential interactive behavior first, so its handlers exist before the reveal. */
await load(`./app.js?v=${V.app}`, 'app');

/* Decorative and mutually independent — neither may delay the reveal, so they
   load concurrently and their failures are absorbed. */
await Promise.all([
  load(`./effects.js?v=${V.fx}`, 'effects'),
  load(`./cursor.js?v=${V.cursor}`, 'cursor'),
]);

/* js/boot.js owns the reveal. If IT is the module that fails, nothing else would
   clear data-booting before the watchdog, so perform the same terminal reveal
   its own instant() path does. */
if (!(await load(`./boot.js?v=${V.boot}`, 'boot'))) {
  document.body.removeAttribute('data-booting');
  document.getElementById('boot')?.remove();
  document.dispatchEvent(new Event('boot:done'));
}

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/* The failure boundary lives INSIDE scene-bootstrap.mjs, so it cannot cover its
   own module fetch: a 404 on that one file (a deploy-artifact allowlist miss, a
   cache-bust mismatch) left __SCENE_STATUS unset, body.dataset.scene null,
   scene:ready never dispatched, and surfaced an unhandled module rejection.
   Mirror the boundary's own contract out here so the outcome is identical
   whether the scene fails, or the thing that catches scene failures fails. */
let status;
try {
  const { bootstrapScene } = await import('./scene-bootstrap.mjs?v=1');
  status = await bootstrapScene({ version: V.bg, probeVersion: V.probe });
} catch (error) {
  document.getElementById('scene-root')?.replaceChildren();
  document.body.dataset.scene = 'unavailable';
  status = { ok: false, probe: window.__TIER_PROBE ?? null, error: String(error?.message || error) };
}
window.__SCENE_STATUS = { ...status, readyAt: performance.now() };
window.__SCENE_READY_FIRED = true;
document.dispatchEvent(new CustomEvent('scene:ready', { detail: window.__SCENE_STATUS }));
