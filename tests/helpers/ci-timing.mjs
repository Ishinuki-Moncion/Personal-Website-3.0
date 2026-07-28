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
   never happen silently as a side effect of touching CI configuration. */
const SCALE = process.env.CI ? 4 : 1;

/** Scale a wait-for timeout for the current environment. */
export const ms = base => base * SCALE;

/** True when running on the GPU-less CI runner. */
export const SOFTWARE_RENDERER = Boolean(process.env.CI);
