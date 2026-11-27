/* Which scene engine this tab runs. The new scene (js/scene/next.mjs) is the default. `?scene=live`
   mounts the old scene (js/background.js) and keeps it for the tab (sessionStorage['scene.engine'] =
   'live'), so navigating keeps it; `?scene=next` clears that choice. With storage unavailable, the
   query alone decides for that load. The inline <script id="scene-switch"> in index.html applies the
   same rule before the first paint (tests/unit/scene-switch.test.mjs holds the two together). */
const ENGINE_KEY = 'scene.engine';
export function chooseEngine(search = location.search) {
  const asked = new URLSearchParams(search).get('scene');
  try {
    if (asked === 'live') sessionStorage.setItem(ENGINE_KEY, 'live');
    else if (asked === 'next') sessionStorage.removeItem(ENGINE_KEY);
    return sessionStorage.getItem(ENGINE_KEY) === 'live' ? 'live' : 'next';
  } catch {
    return asked === 'live' ? 'live' : 'next';   // storage unavailable: the flag works for this load only
  }
}

export async function bootstrapScene({ version, probeVersion, nextVersion = '1' }) {
  try {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const engine = chooseEngine();
    let probe = null;
    window.__TIER_PROBE = null;

    if (!reduced) {
      const { resolveTier } = await import(`./gpu-probe.mjs?v=${probeVersion}`)
        .catch(() => ({ resolveTier: async () => null }));
      probe = await resolveTier();
      window.__TIER_PROBE = probe;
    }

    if (engine === 'next') {
      /* One context, no post-processing: three.js only, no addons. */
      const { mountScene } = await import(`./scene/next.mjs?v=${nextVersion}`);
      mountScene({ probe });
      return { ok: true, probe, error: null };
    }

    const THREE = await import('three');
    const [{ EffectComposer }, { RenderPass }, { ShaderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/ShaderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/OutputPass.js')
    ]);
    window.THREE = THREE;
    window.POST = { EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, OutputPass };
    await import(`./background.js?v=${version}`);
    return { ok: true, probe, error: null };
  } catch (error) {
    document.getElementById('scene-root')?.replaceChildren();
    document.body.dataset.scene = 'unavailable';
    return { ok: false, probe: window.__TIER_PROBE ?? null, error: String(error?.message || error) };
  }
}
