# v3.4 — Mobile Richness: Measured Tier Promotion

**Date:** 2026-07-16
**Owner verdicts baked in:** phones are the primary demo surface — "I want that wow factor"; full richness with automatic guardrails (approach A approved); rivulet glass rides as gated M2.
**Prerequisite shipped:** v3.3h WebKit alpha-clamp fix (PR #3, 562b0a3) — without it, no mobile richness is visible on any Apple device.

## 1. Problem

The LITE tier (`coarse || small`) treats every touch device as weak. A 2026 flagship phone gets: no bloom/grade/CA, 2,600/7,000 globe particles, a flat rain veil with no wells, 12 non-refracting glass beads, 3/5 graticule rings and no meridians, 2/5 halo labels, DPR 1.5. The owner shows the site primarily on phones; the current mobile read is "the old buggy version" (owner, 2026-07-16). "Request Desktop Site" cannot help — the gate keys off pointer capability, correctly.

## 2. Tier decision — boot-time GPU probe (M1 core)

**A new `mobile-rich` tier sits between `lite` and `high`. Touch devices earn it by measurement, never by device identity.**

- **Probe module** (`js/gpu-probe.mjs`, imported by `boot.mjs` BEFORE `background.js`): offscreen 512×512 WebGL2 context runs ~12 frames of work shaped like the real scene's cost — one instanced-quad fill pass (rain-shaped) + a 5-tap separable blur ping-pong chain (UnrealBloom-shaped). Each frame is fenced with a 1×1 `readPixels` to defeat pipelining; score = median ms/frame.
- **Thresholds:** score ≤ 4.5ms → `mobile-rich`; else `lite`. (Calibration task in the plan: measure on the owner's iPhone + Playwright WebKit to pin the constant; the constant ships with a measured provenance comment.)
- **Session cache:** result stored in `sessionStorage` (`v34.tierProbe = {score, tier, ts}`); revisits skip the probe. A demotion (§5) overwrites it for the session.
- **Fail-safe posture:** probe throws / times out (>1.5s budget) / WebGL2 missing → `lite`. Emulated or software GL therefore lands in `lite` naturally — Playwright QA uses the override param (§6) instead of faking scores.
- **Probe eligibility is `coarse` only.** A narrow fine-pointer desktop window (`small` without `coarse`) keeps plain `lite` exactly as today — it is a resize case, not a demo surface. `reduced` wins over everything (no probe); full-size fine-pointer desktop stays `high` (no probe); the v3.2n portrait/layout branch and touch tap-select are input/layout concerns and stay keyed off `coarse`/`small`, NOT off the richness tier.

## 3. The `mobile-rich` payload

| Axis | lite (today) | mobile-rich (new) | high (desktop) |
|---|---|---|---|
| postFX (bloom+grade+CA) | none | ON, composer samples 2 | ON, samples 4 |
| DPR cap | 1.5 | 2 | 2 |
| globeParticles | 2,600 | 5,000 | 7,000 |
| fieldCounts | 1100/520/360 | 1800/850/620 | 2600/1200/900 |
| rain quads | 210, flat veil | 320, WELLS compiled (motivated per-drop) | 470, WELLS |
| graticule | 3 lats, no meridians | 5 lats + 6 meridians | 5 lats + 6 meridians |
| halo | 2 labels, 12 ticks, 1 ring | 5 labels, 24 ticks, 2 rings | 5 labels, 24 ticks, 2 rings |
| holo-scan shell | 24×16 | 48×32 | 48×32 |
| glass | 12 beads, no refraction | 16 beads + refraction ON (until M2 rivulet) | rivulet grabpass |
| halo scale / globe seat | portrait (0.82 / v3.2n seat) | portrait (unchanged — layout ≠ richness) | landscape |

Numbers are phone-tuned targets, not desktop copies; each lands as a named const with the same provenance-comment discipline as the v3.2/v3.3 laws.

## 4. Gate refactor — capability flags, not name strings

`quality.name === 'high'` string checks currently gate postFX, WELLS, halo label priority, and the rivulet import. The profile gains explicit capability fields — `postFX: bool`, `postFXSamples: int`, `wells: bool`, `labelPriority: int`, `rivulet: bool`, `refractBeads: bool` — and every gate keys off its field. One decision point (the profile), no scattered string comparisons. `LITE` remains ONLY for input/layout branches (tap-select, portrait seat, hover-scan skip). This is the targeted boundary cleanup that makes three tiers sane instead of eight string checks.

## 5. Runtime demotion watchdog

The probe can't see thermal throttling, Low Power Mode, or multitasking splits. The existing `fpsEMA` gauge becomes the enforcement arm, on `mobile-rich` only:

- `fpsEMA < 45` sustained for 4 consecutive seconds → demote ONCE, permanently for the session: composers released (direct render path — the toggle already exists as `renderBloomThenFinal` vs direct), DPR to 1.5, `sessionStorage` tier overwritten to `lite` so the next navigation boots lite without re-probing.
- Counts/geometry are NOT rebuilt on demotion (postFX + DPR are ~80% of the cost; rebuilds mid-session are the complexity that killed approach B). iOS Low Power Mode caps rAF at 30fps → auto-demotes within 4s, by design, no special-casing.
- No re-promotion mid-session (hysteresis flapping is worse than a stable lite).
- `__sceneDebug()` gains `tier`, `probeScore`, `demoted` fields; the debug HUD line shows them.

## 6. QA overrides & verification

- `?tier=rich|lite` — deterministic override, skips probe AND watchdog (same spirit as `?globe=classic`). Playwright WebKit mobile runs use `?tier=rich` to exercise the payload (emulated GPU scores would fail-safe to lite otherwise).
- Verification battery: Playwright WebKit 390×844 `?tier=rich` — rain wells active, bloom present, floor [0,1,6], zero console errors; `?tier=lite` unchanged from today; desktop `high` byte-identical screenshots (no regression); hardening harness gains three checks (probe fail-safe → lite; watchdog demotes exactly once; layout stays portrait on rich).
- **The owner's on-device verdict is the ship gate.** The measured probe threshold and the final counts are tuning constants expected to move during their review; everything else is structural.

## 7. M2 — rivulet glass on mobile (gated, separate ship decision)

Port the v3.3f grabpass to `mobile-rich` behind `RIVULET_MOBILE_GATE` (default false at first ship). Requirements to flip true: probe score in the top band (≤3ms), 60fps hold WITH composers for 10s on the owner's device, and the retirement pairing — where rivulet lands, the 2D beads retire (their `.scene-droplets` canvas stays LITE's home, exactly as on desktop). If the hold fails, beads-with-refraction remain the rich-mobile glass and M2 closes as measured-and-declined, with the numbers recorded.

## 8. Out of scope

Photo-label verification, Package L, historical author-email (owner-only debts); any desktop-tier change; any layout/input change on touch. No new always-on layers anywhere — every addition in this campaign is tier-gated, and the only retirement (beads → rivulet) follows the established pairing law.
