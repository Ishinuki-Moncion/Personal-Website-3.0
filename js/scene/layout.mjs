/* One composition for the globe and the weather, so the rain's light sits exactly on the globe.
   Screen space, CSS pixels, y down. The rules are the composed hero's (prototypes/hero/layout.js),
   mapped onto the live site's hero, whose DOM this step does not change:
     desktop : centre 66% of the width, mid-height; radius min(31% of the height, 30% of the width);
               the floor's horizon at 64% of the height (the strong reflections, D15)
     phones  : the globe above the copy, sized by the room the live hero leaves above its first
               line of text (which follows the screen height), so it never sits behind any of the
               copy; on short screens that makes it small (360x640: radius 37 px) until the phone
               hero is recomposed (phase 4). The horizon sits just under the sentence, so the name
               and sentence stay on the black sky and the reflection runs below the copy (the
               prototype's cap).
     phones, step L2 (the new layout on): the stage of css/site.css instead, top 82 px, radius the smallest of
               four limits (STAGE below), centred; the copy of the hero and of Contact starts under it. */

/** The prototype's pixel budget: never shade more than this many device pixels per frame. */
export const PIXEL_BUDGET = 3.2e6;

/** Phone composition: narrow or portrait. */
export function isPhone(w, h) { return w / h < 0.7 || w < 700 || h > w; }

/** min(devicePixelRatio, cap), lowered so w * h * dpr^2 <= PIXEL_BUDGET. */
export function pixelRatioFor(w, h, cap, deviceRatio = globalThis.devicePixelRatio || 1) {
  let dpr = Math.min(deviceRatio, cap);
  if (w * h * dpr * dpr > PIXEL_BUDGET) dpr = Math.sqrt(PIXEL_BUDGET / (w * h));
  return dpr;
}

const TOP = 66;   // the globe's top on phones: just under the nav's buttons

/** Where the live hero's copy is (css px, viewport), read from the page; null where it is not there. */
export function readHeroAnchors(doc = document) {
  const box = sel => {
    const el = doc.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.height > 0 ? { top: r.top + scrollY, bottom: r.bottom + scrollY } : null;
  };
  /* the kicker's words, not its rule: on narrow screens the rule sits on a line of its own at the left */
  return { kicker: box('.hero-kicker span:not(.bar)') || box('.hero-kicker'), sentence: box('.hero-sub') };
}

/* Step L2: the phone stage, one formula for the stylesheet and the scene. css/site.css defines it with viewport
   units only (--stage-top-m, --stage-r-m, centre at 50vw), so nothing moves when the scene
   mounts; with the new layout on, composition() takes the same numbers and no longer reads the hero's copy to size
   the disc (the hero's copy now starts under the stage instead). The limits, as the stylesheet's comment says
   them: the look (30% of the width); room on the right for the level buttons (half the width less 82 px); the
   hero's buttons ending above the fixed theme button ((svh - 549) / 2); 160 px at most; 44 px at least. The top
   is 82 px, clear of the nav once it has its scrolled background (the review of this step: 66 cut the ring). */
export const STAGE = { top: 82, gap: 24, rVw: 0.30, side: 82, fit: 549, rMax: 160, rMin: 44 };
/** The phone stage's radius (css px) for a viewport w wide whose small viewport height is svh. */
function stageRadius(w, svh) {
  return Math.max(STAGE.rMin, Math.min(STAGE.rVw * w, 0.5 * w - STAGE.side, (svh - STAGE.fit) / 2, STAGE.rMax));
}

/** { cx, cy, r, phone, horizon, reflCap } for a w x h viewport. stage: the new layout is on (html[data-scene="next"]);
    svh: the small viewport height, which the stylesheet's svh unit is (innerHeight where there are no toolbars). */
export function composition(w, h, anchors = null, { stage = false, svh = h } = {}) {
  if (!isPhone(w, h)) {
    return { cx: 0.66 * w, cy: 0.5 * h, r: Math.min(0.31 * h, 0.30 * w), phone: false, horizon: 0.64, reflCap: 1 };
  }
  const rMax = 0.31 * w;
  let r;
  if (stage) {
    r = stageRadius(w, svh);
  } else if (anchors?.kicker) {
    r = Math.max(36, Math.min(rMax, (anchors.kicker.top - 10 - TOP) / 2));   // the room above the first line of copy
  } else {
    r = Math.min(rMax, Math.max(76, (h - 490) / 2));            // the prototype's own rule
  }
  const s = anchors?.sentence;
  const horizon = s ? Math.min(0.86, Math.max(0.70, (s.bottom + 10) / h)) : 0.80;
  return { cx: 0.5 * w, cy: (stage ? STAGE.top : TOP) + r, r, phone: true, horizon, reflCap: 1 };
}
