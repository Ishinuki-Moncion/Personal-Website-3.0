# HUD / Chrome — Elevation Brief (2026-07-03)

Source rules: `design-language-v3` §3 (HUD & Chrome) + §0 Spine (laws 2, 5, 6). Study: `2026-07-03-hud-visual-study.md`.

This is the *what/why* hand-off, not the build. Every lever below cites live code (`file:line`) or is marked **(new)** where the v3 rule has no current counterpart. Code is untouched this phase.

Ref key (v3 §3 → study frame): `hud/007` = Cyberpunk 2077 off-red HUD · `hud/021` = F/A-18 gun symbology · `hud/010` = Ash Thorp COD:IW minimal HUD · `hud/022` = analog oscilloscope graticule · `hud/017` = The Martian mission-control panels · `hud/016` = Halo Wars 2 holotable · `hud/003` = BR2049 monitor bezel.

---

## Current state

The site already ships a competent FUI chrome layer; the elevation is *discipline and grammar*, not a rebuild. Where it lives today:

- **Viewport corner brackets** — `.frame-hud` (`css/site.css:128-140`; markup `index.html:37`). Four L-shaped thin brackets in `--line-strong`, 26px, `hudIn` scale-up. **This is the correct reference implementation** the rest of the chrome should match.
- **Section labels** — `.sec-label` (`css/site.css:365-374`; markup `index.html:123,155,205,232,273`): `[ 01 ]` index (amber, line 367) + txt (cyan, 368) + a swept `.rule` leader (370-374). Bracket digits are literal text in the HTML.
- **Right-rail section HUD** — `.scroll-hud` (`css/site.css:338-351`; markup `index.html:90`): a single 18px `.tick` per section (346) + hidden `.lbl`, `mix-blend-mode: difference` (342).
- **Live clock** — `.clock` `JST --:--:--` (`index.html:59-60,84`), driven by `Intl.DateTimeFormat` Asia/Tokyo in `js/effects.js:137-147`; tabular via `css/site.css:698-699`.
- **Status readout** — `.sys-online` `● SYS//ONLINE` (`index.html:116`; CSS `css/site.css:444`, amber, 9px, 0.25em).
- **Stat triad** — `.stat` (`css/site.css:497-501`; markup `index.html:135-138`): value `.n` (cyan, 34-56px, display weight 200) + label `.l` (10px muted caps, *below* the value). Count-up animates via `data-count`/`data-suffix` in `js/effects.js:57-68`. **No unit sub-element exists.**
- **Route readout** — `.geo-kicker` (amber) + `.geo-line` (cyan) (`css/site.css:471-483`; markup `index.html:131-132`).
- **Live tag** — `.live-tag` (`css/site.css:523-526`; markup `index.html:161`): pulsing amber dot + word `LIVE`. Colour + dot, **not** an outline box.
- **Coordinates** — `.coord` `35.6762° N, 139.6503° E — 東京` (`index.html:282`), tabular (699).
- **Lightbox chrome** — `.lb-corner`/`.lb-meta`/`.lb-id`/`.lb-pos` (`css/site.css:590-604`; markup `index.html:290,301`): `IMG_01`, `ƒ/2.8 · 1/250s`, position `01 / 12`. `.lb-corner` (590) is a **closed 30px full-border box**, ×4.
- **Control deck** — `.deck`/`.deck-toggle` (`css/site.css:633-664`; JS `js/app.js:284-321`): a **floating flat card** (full border + `backdrop-filter: blur`). `.seg button.on` (657) is a **filled cyan chip**.
- **Reticle cursor** — `.cursor`/`.cursor-ring`/`.cursor-dot` (`css/site.css:145-178`; `js/cursor.js`): solid ring; `is-hot` adds two corner ticks (159-165); the centre `.cursor-dot` (153-157) **occludes true centre**.
- **Tabular numerals** — `font-variant-numeric: tabular-nums` on clock/stat/lb-pos/gallery-count/proj-year/row-date/coord/mm-coord (`css/site.css:697-699`). **No slashed zero** (`'zero'` feature unused; no `font-feature-settings` anywhere).
- **Projection texture (already correct)** — scanlines/sweeps live on *content*: `.about-portrait .scanmask` (490-491), `.shot .sweep` (570-573), `.boot::before` (193-197), `.boot-grid` (199-205). Chrome stays crisp.
- **Filled-chip anti-patterns** — `.seg button.on` (657), `.tag:hover` fill (543), `.pill::before` cyan fill (621-624).

## Target intent

The chrome should read as **one crisp instrument printed in a single ink over the dark**, with warm light rationed as *asserted state only*, seated on a faint measured graticule, and grounded at its edges in implied worn hardware:

- **One ink, one accent.** The whole HUD in cyan; amber reserved for *live/active/alert*, never structural decoration. (ref: hud/007)
- **Imply the frame with thin corner brackets — never close the box.** The eye completes the rectangle. (ref: hud/007)
- **Set label + value + unit as a tight mono triad, the value the largest element**, label abbreviated to caps/glyphs, unit hung small. (ref: hud/021)
- **Assert live state with a bracket tag** — a thin outline box around the status word; the outline is the signal, never a filled chip. (ref: hud/010)
- **Seat data on a low-contrast tick/graticule substrate** — major + subdivided minor ticks dimmed well below the data (the oscilloscope root of FUI). (ref: hud/022)
- **Tabular, slashed numerals** — fixed-width, right-aligned, disambiguated zero, `current/max` slash form. (ref: hud/017)
- **Projection texture on the content/scan layer only; interactive chrome stays crisp.** (ref: hud/003; spine §0.6)
- **Ground the chrome in worn hardware at its edges** — bezel, labelled rail, corner brackets — not a floating flat card. (ref: hud/003)
- *(secondary)* **Build the reticle from detached ticks with an open centre** so it never occludes the target. (ref: hud/010)
- *(secondary)* **Instrument the void with a dim data-texture**, not flat black. (ref: hud/016)

## Concrete code levers

Ordered by priority. Each names the exact site and the change; **(new)** = no current counterpart.

**P1 · One ink, one accent (ref: hud/007).** Demote *structural* amber to cyan/muted; keep amber only for genuine state.
- Re-hue `.sec-label .idx` (`css/site.css:367`), `.proj-idx` (`css/site.css:533`), `.mm-idx` (`css/site.css:319`), `.geo-kicker` (`css/site.css:475-477`), and `.deck h4::before ◆` (`css/site.css:647`) from `--amber` to `--cyan`/`--muted`.
- Preserve amber only on true asserted state: `.live-tag` (`css/site.css:523-526`), `.nav-link.active` brackets (`css/site.css:252-258`), and alert marks. Net effect: the accent becomes a *budget* (§0.3), not a per-section motif.

**P2 · Corner brackets, never a closed box (ref: hud/007).** Propagate the `.frame-hud` L-bracket to the boxes that still close.
- Convert `.lb-corner` (`css/site.css:590`) from a full-border 30px square to L-brackets — mirror the `border-right:0/border-bottom:0` pattern of `.frame-hud .tl/.tr/.bl/.br` (`css/site.css:136-139`), one bracket per lightbox corner.
- Lighten `.shot` (`css/site.css:563`) and `.tag` (`css/site.css:540`) from a full box toward bracket-on-hover so gallery/tags imply rather than enclose.

**P3 · Label + value + unit triad, value dominant (ref: hud/021).** The stat is a two-part label/value; add the missing unit and offset the label.
- **(new)** Add a `.u` unit span to the `.stat` markup (`index.html:135-138`) + CSS beside `.stat .n` (`css/site.css:499-501`): unit small, hung, muted; keep `.n` dominant. Move the `data-suffix` "+" (`js/effects.js:59`) into the hung unit rather than gluing it to the number.
- Apply the same triad to `.lb-meta` (`css/site.css:591`; `ƒ/2.8 · 1/250s` already reads value+unit) and `.coord` (`index.html:282`). Set `.stat .l` (`css/site.css:501`) as offset tracked-caps, not a stacked caption.

**P4 · Bracket-tag live state; kill filled chips (ref: hud/010).**
- Wrap `.live-tag` (`css/site.css:523-526`) content in a thin rectangular outline (`border: 1px solid var(--amber)`, transparent fill), keeping the pulsing `.dot`; the **outline** carries the state.
- Convert `.seg button.on` (`css/site.css:657`) from filled cyan chip to outline-active (cyan border + cyan text, transparent bg). Same for `.tag:hover` (`css/site.css:543`) and reconsider `.pill::before` fill (`css/site.css:621-624`). The `.nav-link` `[ ]` idiom (`css/site.css:252-258`) is already correct — extend it.

**P5 · Low-contrast tick/graticule substrate under data (ref: hud/022).** **(new)** — no persistent graticule exists today.
- Add a dim minor-tick / major-grid substrate behind data-dense regions: under `.stat-row` (`css/site.css:497`), beneath the `.gallery-grid` (`css/site.css:560`), and behind the `.lb-stage` (`css/site.css:586`). Reuse the `.boot-grid` gradient recipe (`css/site.css:201-204`) but persistent and dimmed to ≈`--line` opacity, well below the data. This is the oscilloscope graticule the whole grammar descends from.

**P6 · Tabular slashed numerals (ref: hud/017).**
- **(new)** Add `font-feature-settings: 'zero' 1` (slashed zero; JetBrains Mono supports it) to the numeric selector at `css/site.css:698-699`, disambiguating 0/O across every readout; consider `'ss'`/`cv` for 1/l/I too.
- Tighten `.lb-pos` `01 / 12` (`index.html:301`) toward the compact `current/max` capacity form and confirm the tabular selector (`css/site.css:698`) covers any numeric it misses.

**P7 · Projection texture on content, chrome crisp (ref: hud/003; §0.6).** Mostly a guard-rail to *preserve*.
- When adding the P5 graticule and any new scan texture, bind it to a content/scan layer only — never onto `.frame-hud` (128), `.sec-label` (365), `.scroll-hud` (338), or the readouts.
- Audit `mix-blend-mode: difference` on `.scroll-hud` (`css/site.css:342`) and `.cursor` (`css/site.css:146`): over bright content it can invert chrome legibility. Prefer a crisp cyan + drop-shadow so chrome never inverts.

**P8 · Worn-hardware edges (ref: hud/003).**
- Give `.deck` (`css/site.css:640-644`) an implied bezel: extend the `◆ h4` header (`css/site.css:645-647`) into a labelled model/tick rail, swap the plain full border for corner brackets (per P2), add faint tick/screw detail — so it reads as instrument hardware, not a flat card.
- Give the lightbox stage (`.lb-stage`, `css/site.css:586`) an implied combiner frame (bezel + the P2 L-corners). `.about-portrait` (`css/site.css:485-496`) is the existing "instrument" template to echo.

**Secondary levers.**
- **Reticle detached ticks + open centre (ref: hud/010):** hollow/soften the occluding `.cursor-dot` (`css/site.css:153-157`) and build `.cursor-ring` (`css/site.css:147-152`) from detached tick segments; promote the `is-hot` corner ticks (159-165) toward the resting state.
- **Instrument the void (ref: hud/016):** a faint scrolling ticker / contour under sparse sections (chrome-local; the full field is `js/background.js` turf).

## Before / after

- **Before:** amber sprinkled on every section index, a filled-chip toggle, closed boxes around the lightbox image and gallery tiles, stats floating on flat void, plain 0/O numerals, a flat settings card.
- **After:** a single cyan instrument where the *only* warm marks are things that are genuinely live; brackets imply every frame; numbers read as label + hero value + hung unit on a faint measured graticule with slashed zeros; live state is an outlined tag, not a colour; the deck reads as a worn hardware panel. Restraint (§0.5) is legible: the accent is scarce, so it *means* something.

## Out of scope / risks

- **No `js/background.js`** (globe/rain/void field) — that is the globe & composition briefs. This brief is `css/site.css` + `js/app.js`/`js/effects.js`/`js/cursor.js` chrome only.
- **Accessibility must survive every lever:** `:focus-visible` (`css/site.css:675`), `.sr-only` mirrors on animated counters (`index.html:136`), `prefers-reduced-motion` (`css/site.css:393-399`, `js/effects.js:6`), and `tabular-nums` width-hold (`css/site.css:697-699`) are load-bearing — the P4 outline-state and P6 numeral change must keep the `.sr-only` semantics and reduced-motion fallbacks.
- **Amber-demotion is a taste call** (P1): verify the site does not go monochrome-dull — the fix is to make amber *rarer and meaningful*, not absent.
- **Graticule (P5) is the highest-risk add:** it must sit *below* data contrast or it becomes the noise the study warns against (hud/016/022); gate its opacity against the near-black base and honour reduced-motion for any scroll.
- **`mix-blend-mode` audit (P7)** may shift the look of the cursor/rail over bright media — treat as a deliberate visual decision, not a silent swap.
- **Two-density behaviour** (calm ↔ engaged, study P14 `[WORKING]`) is the motion brief's job; this brief only makes the resting chrome correct.
