/* The hosted runner has no GPU. Chromium launches there with
   --enable-unsafe-swiftshader and logs "GPU stall due to ReadPixels" repeatedly,
   so every frame of the WebGL scene is rasterised on two shared CPU cores.
   Measured from the traces of run 30331300075, against a local machine where
   the same calls take single-digit milliseconds:

     locator.click()          18,770ms
     locator.isVisible()       4,069ms
     waitForSelector()        10,501ms
     scene render rate        469 frames in 65s (~7fps)

   Scaling a WAIT is safe in a way that scaling an assertion is not: a longer
   timeout cannot make an incorrect page pass, it can only stop a correct one
   from being failed for impatience, and a test that resolves in 100ms locally
   still resolves in 100ms here. Budgets that assert a product property are
   deliberately NOT routed through this — they are widened at their own site,
   with the measurement and the reason recorded there, so that loosening one can
   never happen silently as a side effect of touching CI configuration.

   A 4x scale was tried first and made things worse: every failure then held a
   barely-responsive browser for 32s instead of 8s, lengthening the run without
   rescuing a single test. 2x is enough now that the measured desktop tier
   (see classifyTier) keeps the runner off the full scene. */
const SCALE = process.env.CI ? 2 : 1;

/** Scale a wait-for timeout for the current environment. */
export const ms = base => base * SCALE;

/** True when running on the GPU-less CI runner. */
export const SOFTWARE_RENDERER = Boolean(process.env.CI);

/* Some tests measure the GPU itself — the tier probe's own timings, the postFX
   attachment budget, the sustained-FPS watchdog. On a machine with no GPU those
   assertions describe SwiftShader, not the site, and no amount of waiting makes
   them true. They are skipped here with the reason recorded in the run output
   rather than deleted or quietly loosened, and they remain part of the local
   pre-ship gate (`npm run qa:browser`), which is where the shipping decision is
   made. Anything that would still be true on a machine that cannot rasterise —
   DOM, content, routing, focus, accessibility, boot behaviour — stays on CI. */
export const NEEDS_REAL_GPU =
  'measures GPU behaviour (probe timings, postFX attachments, sustained FPS); the CI runner has no GPU — enforced locally by `npm run qa:browser`';
