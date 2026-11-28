/* Essential DOM behavior is progressive enhancement: initialize it before the
   optional WebGL scene, then give the browser two frames to paint the page. */
window.__TIER_PROBE = null;
window.__CURSOR_ACTIVE = false;
window.__SCENE_READY_FIRED = false;

/* The page's layout follows the scene engine through html[data-scene="next"]. That attribute is set by the inline
   script in the page's head, before the stylesheet and the first paint (step L2;
   tests/unit/scene-switch.test.mjs holds that script to chooseEngine()). Step L1 set it from here, by importing
   the scene's bootstrap first. That fetched a scene module before the page had painted, on every visit, new
   scene or not: against the rule this file opens with, and tests/browser/boot-isolation.spec.mjs failed on it
   when the whole suite was next run. Nothing of the scene is imported here before the page's own behaviour. */

/* Bumped for every module this branch modified: js/background.js (postFX
   re-gate + timebase reset), js/boot.js (navigation-anchored cap) and
   js/app.js (ownership-scoped inert + per-photo lightbox sizing). Without
   these, a returning visitor keeps the CACHED module and none of the fixes —
   including the Critical inert lockout — ever reach them. */
const V = { bg: '8.0', boot: '3.4', cursor: '3.2', fx: '3.9', app: '5.2', probe: '6', next: '10' };

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

/* Mutually independent, so they load concurrently.
   js/cursor.js IS decorative — it draws the HUD reticle and nothing else.
   js/effects.js is NOT: it owns the scroll reveal, and js/effects.js:104 is the
   only code anywhere that adds `.seen`, which is what lifts
   `[data-reveal]{opacity:0}`. Absorbing its failure silently was a REGRESSION
   introduced by making this file a coordinator: previously the failure aborted
   boot.mjs, `data-booting` stayed set, index.html's 10s watchdog fired and
   latched `body.revealed`, and `body.revealed [data-reveal]{opacity:1!important}`
   force-showed the page. Now boot.js clears data-booting first, which
   permanently disarms that watchdog (reveal() early-returns once the attribute
   is gone), so all 34 revealed elements would sit at opacity 0 for the whole
   session — a blank scrolling page. */
const [effectsOk] = await Promise.all([
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

/* Restore the safety net effects.js would otherwise have provided. This runs
   AFTER boot:done has been dispatched on purpose: index.html strips `revealed`
   in its own boot:done handler (`if (!fired)`), so adding the class earlier
   would be undone. With no .seen writer alive, this class is the only thing
   standing between the visitor and a permanently blank scrolling page. */
if (!effectsOk) {
  document.body.classList.add('revealed');
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
  const { bootstrapScene } = await import('./scene-bootstrap.mjs?v=2');
  status = await bootstrapScene({ version: V.bg, probeVersion: V.probe, nextVersion: V.next });
} catch (error) {
  document.getElementById('scene-root')?.replaceChildren();
  document.body.dataset.scene = 'unavailable';
  status = { ok: false, probe: window.__TIER_PROBE ?? null, error: String(error?.message || error) };
}
window.__SCENE_STATUS = { ...status, readyAt: performance.now() };
window.__SCENE_READY_FIRED = true;
document.dispatchEvent(new CustomEvent('scene:ready', { detail: window.__SCENE_STATUS }));
