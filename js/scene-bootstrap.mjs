export async function bootstrapScene({ version, probeVersion }) {
  try {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let probe = null;
    window.__TIER_PROBE = null;

    if (!reduced) {
      const { resolveTier } = await import(`./gpu-probe.mjs?v=${probeVersion}`)
        .catch(() => ({ resolveTier: async () => null }));
      probe = await resolveTier();
      window.__TIER_PROBE = probe;
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
