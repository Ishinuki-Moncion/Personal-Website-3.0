/* Essential DOM behavior is progressive enhancement: initialize it before the
   optional WebGL scene, then give the browser two frames to paint the page. */
window.__TIER_PROBE = null;
window.__CURSOR_ACTIVE = false;

const V = { bg: '6.1', boot: '3.2', cursor: '3.2', fx: '3.8', app: '4.4', probe: '1' };

await import(`./app.js?v=${V.app}`);
await import(`./effects.js?v=${V.fx}`);
await import(`./cursor.js?v=${V.cursor}`);
await import(`./boot.js?v=${V.boot}`);

await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const { bootstrapScene } = await import('./scene-bootstrap.mjs?v=1');
window.__SCENE_STATUS = { ...(await bootstrapScene({ version: V.bg, probeVersion: V.probe })), readyAt: performance.now() };
document.dispatchEvent(new CustomEvent('scene:ready', { detail: window.__SCENE_STATUS }));
