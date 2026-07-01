# Cyberpunk Three.js — Tightened First-Slice Design (Council-Hardened)

## Status & Provenance

Ratified design of record for the cyberpunk first slice. It **supersedes the decisions**
(not the task mechanics) in `docs/superpowers/plans/2026-07-01-cyberpunk-threejs-claude-execution.md`
and refines the vision in `docs/superpowers/specs/2026-07-01-cyberpunk-threejs-future-work.md`.

- Approved by: site owner ("wow factor while making sense design-wise").
- Hardened by: a 3-model design council (Opus 4.8, Sonnet 5, Haiku 4.5) + the Task-1 spec/quality reviewer.
- Branch: `claude/cyberpunk-threejs-pass`. The committed rain/glass overlay (`2d4c9a6`) is KEPT as baseline and re-treated per below.
- Scope decision: **ratify & tighten the existing first slice** — CSS/DOM atmosphere + minimal Tokyo halo + richer section-story state. Not a redirection, not the full Phase 1–6 roadmap.

## Design Concept (refined north star)

**A clean editorial foreground floating over a deep, wet, living Tokyo signal-scape, with one signature lock-on moment.**

- Wow = **depth + light + life**, kept in the background.
- Sense = content stays primary and readable, coherent amber/cyan palette, graceful degradation, and zero "cheap tells" (frozen rain, tofu glyphs, loading-spinner motion, HUD-box clutter).
- The drama lives in the *background depth*; the discipline lives in the *foreground*.

## Ratified Decisions (the vision spec's 5 decision points)

- **(a) Dependencies — NO new Three.js dependencies.** No-dependency additive glow gets ~80% of bloom without the `file://`/mobile/render-target risk. True post-processing (EffectComposer/UnrealBloomPass) is a **measured escape hatch** only if the no-dep glow still reads crisp in-browser.
- **(b) Rain/glass intensity — clearly-visible but RESTRAINED.** Rain base ~0.16–0.18 desktop, sparse and irregular; glass subtle. "Wow" comes from motion + irregularity, not opacity.
- **(c) Japanese labels — balanced, district-forward.** Keep `東京 / JST / 渋谷 / 新宿 / 秋葉原`. The status label is bound to the **real JST clock** the page already tracks → live telemetry, not decoration.
- **(d) Controls — debug-only readouts; atmosphere folded into the existing Scanlines/CRT toggle.** One "cinematic mode" switch governs scanlines + rain + glow together, so it stays user-dimmable with no new UI. Scene state/debug fields remain behind `?sceneDebug=1`.
- **(e) Globe — portfolio-only for this slice.** `tokyo-data-globe` is not in this tree; the DOM/CSS atmosphere cannot cleanly mirror. If ever mirrored later, port only pure-Three halo geometry, never DOM atmosphere.

## Layering & Compositing

- Move `.scene-atmosphere` **below `main`** (share `z-index: 0`; DOM order already places it after `#scene-root`) so it glazes only the globe/backdrop. The hero name and every gallery photo stay untinted. This is both the "content primary" fix and, visually, the more premium read (crisp type over wet neon depth).
- The existing CRT/vignette stays as the top-level unifying grade — no new full-screen tint needed.
- Wire `.scene-atmosphere` visibility/intensity to the existing scan/CRT control-deck switch so one toggle calms all neo-noir overlays.

## Signature Moment — Tokyo Signal-Lock

- **Trigger:** home load, and re-entry to `home`/`contact`. Event-driven and **cooldown-guarded**.
- **Sequence:** Tokyo glow blooms up → ring sweep → **one** pulse packet travels the ring and fades → callout flickers in → settle to a calm ambient hum.
- **Constraint:** never perpetual. No always-on orbiting dot; the packet and pulse are gated on `haloPulse` and decay.

## Component Design & Required Fixes

### Rain (CSS) — correctness + re-treat
- **Bug (shipped in 2d4c9a6):** `sceneRainFall` animates `background-position` Y on `repeating-linear-gradient(90deg …)` streaks. A 90° gradient is invariant along Y, so vertical translation is a visual no-op — the rain is frozen, and it still forces a full-viewport `mix-blend-mode: screen` repaint every frame.
- **Fix:** rebuild streaks with real vertical structure (finite-length dashes via a `180deg` gradient) and animate motion with `transform: translateY()` on an over-tall inner element (GPU-composited). Remove the `background-position` animation.
- **Treatment:** 2–3 layers, sparse and **irregular** column spacing, different fall speeds, length-faded (alpha ramp at top/bottom so drops appear and dissipate), slight `blur(0.5–1px)`, cool-dominant with rare amber catches, effective opacity ≤ ~0.18 desktop. Avoid regular spacing that cross-hatches the CRT scanlines into a test-pattern.
- **Reduced motion:** no translate animation; a faint static sheen only.

### Atmosphere opacity ownership — fix inline-var/media-query conflict + per-frame write
- **Bug:** JS `setAtmosphereVars` writes inline `:root` custom properties every frame. Inline props beat stylesheet `@media` rules, so the reduced-motion and coarse-pointer CSS fallbacks go dead and runtime reduced-motion toggling breaks; plus a full-screen blended repaint + `.toFixed(3)` string alloc every frame.
- **Fix:** CSS owns the responsive/reduced **base** values (`--scene-rain-base`, `--scene-glass-base` via `@media`). JS sets only a per-section **multiplier** (`--scene-rain-mul`), and only when it changes (cache last; skip if |Δ| < ~0.005), driven from `__sceneFocus` rather than the render loop. Effective opacity = `calc(base * mul)`. Add a `matchMedia('(prefers-reduced-motion)')` listener if runtime toggling should be live.

### Tokyo halo — glow, rings, labels, packet
- **Glow (the wow lever):** add a soft additive **amber radial `CanvasTexture` sprite** behind the Tokyo node (~2–3× node size), opacity driven by `haloPulse` (blooms on lock, fades to a low ambient). Primary ring becomes a thin **`RingGeometry` mesh** (additive) instead of a 1px `LineLoop`, so it emits light rather than reading as a hairline. Secondary ring optional per quality.
- **Labels — font-load fix:** `makeCanvasSprite` must register a `document.fonts.ready` redraw (mirror the existing callout at `background.js:339`) and redraw all halo labels once fonts settle, so `東京`/`渋谷` never bake as tofu/fallback textures (currently unrecoverable in reduced-motion).
- **Labels — facing gate:** each label's opacity gated by its **own** orbital facing angle, so only 1–2 read at once and they fade in as they rotate toward the camera ("coming online").
- **Labels — angularly stable:** spin only the rings/ticks (child sub-group); keep labels in a **static** sub-group at semantic angles so districts don't orbit Tokyo (a spinner tell).
- **De-clutter:** full bracket + barcode treatment on the **primary Tokyo callout only**; district labels render as a bare JP glyph + a single ring tick.
- **Packet:** event-gated — visible only when `haloPulse` exceeds ~0.03, no `0.12` opacity floor; fires on section change and fades.
- **Hub presence:** to counter facing-gate flicker as the globe auto-spins Tokyo to the limb, allow a low opacity floor on the **ring only** (not labels/packet) and/or a gentle rotation bias that lingers Tokyo front-of-globe on `home`/`contact`.

### Callout — bilingual fix + de-clutter
- **Bug:** renders `DALLAS / DALLAS` (`jp = isTokyo ? '東京' : 'DALLAS'` then `jp + ' / ' + target.label`, where Dallas's label is also `DALLAS`).
- **Fix:** `heading = isTokyo ? '東京 / ' + target.label : target.label` (Dallas is not bilingual).
- Keep the upgraded bracket/scanner treatment for this single primary callout — it is the one place the dense HUD language belongs.
- Tokyo status content shows the **real JST time** from the page's existing clock.

### Section story / cooldown
- Add a replay/pulse **cooldown** in `__sceneFocus` mirroring the ~600 ms ping guard in `effects.js` (~line 124), so fast scroll across `home`↔`about` does not re-arm `replayJourney()` / re-pulse the halo (a strobe the plan's own reject criteria forbid).
- Keep the existing `sceneState` interpolation (`… * Math.min(1, 0.08 * f)`) — it is correct and frame-rate-independent. (A council member's "80%/frame strobe" claim was a 10× math error and is discarded.)

### Quality budgets
- Retain the high/lite/reduced structure for halo labels/ticks/rings. Add the glow sprite to high + lite (cheap), static/off in reduced. Lower rain base to ~0.16–0.18 (high), ~0.10–0.12 (lite), 0 (reduced).

## Accessibility & Degradation

- `.scene-atmosphere` stays decorative and `aria-hidden="true"`; the Dallas→Tokyo meaning remains in normal HTML.
- **Reduced motion:** a meaningful static frame — earth + arc + Tokyo ring/glow static, no rain motion, no packet, labels rendered with fonts settled, no spinner.
- **LITE (coarse pointer / ≤760px):** Tokyo + 1–2 status labels, sparser rain, glow retained if cheap, no perpetual per-frame motion cost.
- `file://` must keep working: no fetch, no module scripts, no CDN, no new assets.

## Acceptance Criteria (browser-verified, not just static)

- Rain **visibly falls** (static checks cannot see this — confirm motion in a real browser).
- Japanese glyphs render correctly (no tofu) in halo labels and callout, including the reduced-motion first frame.
- Only 1–2 halo labels legible at once; they fade in by facing; none orbit.
- No perpetual orbiting packet; the signal-lock fires on home load and home/contact re-entry, then settles.
- Callout shows `東京 / TOKYO` and `DALLAS` (never `DALLAS / DALLAS`); Tokyo status shows live JST.
- Hero name and gallery photos are **not tinted** by the atmosphere.
- No per-frame `:root` style writes; atmosphere opacity changes only on section change.
- The Scanlines/CRT toggle also dims the atmosphere.
- Console clean (no Three.js warnings); desktop, mobile, and reduced-motion all pass; CLS remains 0.
- `node tools/verify-site-hardening.js` (with extended assertions) and `node --check` pass.

## Non-Goals (this slice)

- No true post-processing pipeline (escape hatch only, not built now).
- No transit-map geometry, night-side earth, or city lights (later phases).
- No live weather/train/social/satellite data. No audio. No clickable WebGL UI.
- No framework, no build step, no new dependencies.

## Council Provenance (for traceability)

- Four independent reviews converged on the rain no-op.
- Opus additionally found the font-load tofu race and the z-index-over-content tint.
- Sonnet additionally found `DALLAS / DALLAS`, the inline-var vs `@media` conflict, and the per-frame `:root` write.
- Haiku contributed the per-label facing-gate and the re-focus cooldown instinct; its rain fix and interpolation-speed math were incorrect and were discarded.
