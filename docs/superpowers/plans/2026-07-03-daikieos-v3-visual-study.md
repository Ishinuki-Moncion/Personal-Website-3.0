# daikieOS v3 Concept-Art Visual Study — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the daikieOS v3 concept-art visual study — capture a real, on-disk reference board across seven surfaces, study it with vision, and produce a v3 visual language + seven elevation briefs + a north-star — before any site code changes.

**Architecture:** Sequential, resumable, single-threaded. Each surface runs the same loop: discover source URLs with cheap text search → `curl` images to a git-ignored on-disk board → `sips` downscale → vision-study the curated keepers → write a tiered, image-pinned study entry → commit. A tiny capture helper (`tools/refcap.sh`) keeps capture DRY. After all seven surfaces, three synthesis tasks distill the visual language, the elevation briefs, and the north-star. "Tests" here are **acceptance-criteria checks** (file counts + a grep that every principle carries a confidence tier and an image reference), not unit tests — this is a research deliverable, not runtime code.

**Tech Stack:** bash (`curl`, `sips` — both macOS-native, no install), WebSearch/WebFetch for discovery, `Read` for vision study, Markdown for all deliverables. No new dependencies. Chrome MCP is a **sparing fallback** only for JS-gated galleries with no direct image URL.

**Companion spec:** `docs/superpowers/specs/2026-07-03-daikieos-v3-visual-study-design.md` (read §5 for the full per-surface reference rationale; this plan makes it executable).

## Global Constraints

Every task implicitly includes these (copied from the spec):

- **Sourcing:** autonomous capture via `curl` → `sips` → `Read`. MCP browser only as a sparing fallback for JS-gated pages with no direct image URL.
- **No ultracode / multi-agent for capture+study.** The binding cost is vision tokens, which parallelism inflates; a fan-out is what died last time. Max, single-threaded.
- **Guard rails:** the fact-forcing GateGuard hook is disabled for this work (`ECC_GATEGUARD=off` or `ECC_DISABLED_HOOKS`).
- **Caps per surface:** ~25 images captured / ~10 studied at full vision (tunable). Note a one-line **cost checkpoint** at each surface boundary in `refs/CHECKPOINTS.md`.
- **Confidence tiers on every decision-driving principle:** `[VERIFIED]` (adversarially checked) · `[EXTRACTED]` (quoted from a primary source, unchecked) · `[DATA]` (measured values) · `[WORKING]` (practitioner judgment, no source). Each principle also carries a source URL and an image reference.
- **No site code changes this phase.** The seven elevation briefs are the hand-off to a later per-surface spec→plan→build.
- **Ethics:** references are private, on-disk study aids. Raw `refs/` images are **git-ignored** (we don't commit others' art); provenance lives in the committed study entries. We extract principles and build our own work.
- **Library discipline:** extend `docs/superpowers/research/` per its README; note supersessions, never silently delete.

---

## File Structure

**Created by this plan:**
- `tools/refcap.sh` — capture helper: download a URL into `refs/<surface>/`, numbered, UA-headed, `sips`-downscaled, provenance appended.
- `docs/superpowers/research/refs/<surface>/` — the on-disk board (git-ignored raw frames), one dir per surface: `globe rain hud motion type color composition`.
- `docs/superpowers/research/refs/CHECKPOINTS.md` — per-surface checkpoint + cost log (git-ignored with the board).
- `docs/superpowers/research/2026-07-03-<surface>-visual-study.md` — seven study entries (committed).
- `docs/superpowers/specs/2026-07-03-design-language-v3.md` — the v3 visual language (committed; supersedes the v2 sologram-noir doc with a note).
- `docs/superpowers/specs/2026-07-03-<surface>-elevation-brief.md` — seven elevation briefs (committed).
- `docs/superpowers/specs/2026-07-03-north-star.md` — the north-star (committed).

**Modified by this plan:**
- `.gitignore` — add the `refs/` board.
- `docs/superpowers/research/README.md` — index the new entries + note the v2→v3 supersession.
- `docs/superpowers/specs/2026-07-02-design-language-sologram-noir.md` — add a one-line "superseded by v3" banner at the top.

**Referenced (as *later* targets, not touched this phase):** `js/background.js` (globe, rain), `css/site.css` + `js/app.js` + `js/effects.js` + `js/cursor.js` + `js/boot.js` (HUD, motion, type, color, composition).

---

## Shared Procedure: the Surface Study Loop (SSL)

Tasks 1–7 each run this exact loop with surface-specific inputs. It is written out **once, in full** here; each surface task supplies only its parameters (seed queries, priority sources, extract targets, caps, acceptance floor). Read this once; every surface task points back to it.

**Inputs a surface task provides:** `<surface>` slug, seed search queries, priority source URLs, extract targets, capture cap (default 25), keep/study floor (default 10).

- [ ] **SSL-1: Seed the study entry (the "failing test").** Create `docs/superpowers/research/2026-07-03-<surface>-visual-study.md` from this skeleton, filling the acceptance checklist with the surface's numbers:

  ```markdown
  # <Surface> — Visual Study (2026-07-03)

  Part of the daikieOS v3 visual study — spec §5.x, plan Task N.
  Board: `refs/<surface>/` (git-ignored raw frames). Provenance below is authoritative.

  ## Acceptance (Definition of Done for this entry)
  - [ ] >= <keep floor> images kept in refs/<surface>/ after curation
  - [ ] >= 8 principles, each with a [TIER] + (ref: NNN-label) + source URL
  - [ ] thin/uncertain areas marked honestly with tier

  ## Boards studied (provenance — survives even though raw images are git-ignored)
  | file | source URL | why it's here |
  |------|-----------|---------------|

  ## Principles
  <!-- 1. [TIER] transferable rule stated as a design instruction. (ref: NNN-label; src: URL) -->

  ## Thin areas / open questions
  ```

- [ ] **SSL-2: Discover.** Run WebSearch on each seed query and WebFetch the top source pages to collect **direct image URLs** (right-click-image-address equivalents). Assemble a candidate list of ~cap URLs with a short label each. Prefer direct-image or open sources; note any that will need the MCP fallback.

- [ ] **SSL-3: Capture.** For each candidate: `tools/refcap.sh <surface> "<image-url>" <label>`. Expect `captured: docs/superpowers/research/refs/<surface>/NNN-label.ext`. A `403`/hotlink block is expected on some hosts — try an alternate source or, sparingly, the MCP browser screenshot fallback. Stop at the capture cap.

- [ ] **SSL-4: Downscale sweep (safety net).** Run `sips -Z 1400 docs/superpowers/research/refs/<surface>/*.{jpg,jpeg,png,webp} 2>/dev/null; true` to guarantee every frame is cheap to view (the helper already downscales; this catches any it missed).

- [ ] **SSL-5: Curate + study (the vision spend).** `Read` the board images (batch them; downscaled they are cheap). Discard junk/duplicates (`rm` them). For each keeper, extract transferable **principles** — not descriptions: state each as a design instruction ("holo edges fall off over ~6% of radius with additive glow, never a hard rim"), tagged `[TIER]`, `(ref: NNN-label)`, and a source URL. Aim past the 8-principle floor where the material is rich.

- [ ] **SSL-6: Fill the entry + provenance table.** Write the principles and the Boards-studied table into the study entry. Tick the acceptance checkboxes.

- [ ] **SSL-7: Verify (the "test passes").** Run:
  ```bash
  ls docs/superpowers/research/refs/<surface>/[0-9]*.* | wc -l    # >= keep floor
  grep -cE '\[(VERIFIED|EXTRACTED|DATA|WORKING)\]' docs/superpowers/research/2026-07-03-<surface>-visual-study.md   # >= 8
  grep -c '(ref:' docs/superpowers/research/2026-07-03-<surface>-visual-study.md   # >= 8 (every principle image-pinned)
  ```
  All three must meet their floors. If not, capture/study more before committing.

- [ ] **SSL-8: Checkpoint + commit.** Append one line to `refs/CHECKPOINTS.md`: `<surface>: captured N / kept M / P principles — cost checkpoint: <your note>`. Then commit the study entry only (raw board is git-ignored):
  ```bash
  git -C "<repo>" add "docs/superpowers/research/2026-07-03-<surface>-visual-study.md"
  git -C "<repo>" commit -m "research(<surface>): visual study — <M> frames, <P> tiered principles"
  ```

---

## Task 0: Board scaffolding + capture helper

**Files:**
- Create: `tools/refcap.sh`
- Create: `docs/superpowers/research/refs/CHECKPOINTS.md`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `tools/refcap.sh <surface> <url> <label>` — used by SSL-3 in every surface task.

- [ ] **Step 1: Write the capture helper.** Create `tools/refcap.sh`:

  ```bash
  #!/usr/bin/env bash
  # refcap.sh — capture a reference image into the git-ignored study board.
  # Usage: tools/refcap.sh <surface> <image-url> <label>
  set -uo pipefail
  surface="${1:?surface}"; url="${2:?url}"; label="${3:-ref}"
  dir="docs/superpowers/research/refs/$surface"
  mkdir -p "$dir"
  count=$(ls "$dir"/[0-9]*.* 2>/dev/null | wc -l | tr -d ' ')
  n=$(printf '%03d' "$((count + 1))")
  ext="${url##*.}"; ext="${ext%%\?*}"; case "$ext" in jpg|jpeg|png|webp|gif) ;; *) ext="jpg" ;; esac
  out="$dir/${n}-${label}.${ext}"
  if curl -fsSL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36" -o "$out" "$url"; then
    sips -Z 1400 "$out" >/dev/null 2>&1 || true
    printf '%s\t%s\n' "$out" "$url" >> "$dir/SOURCES.tsv"
    echo "captured: $out"
  else
    echo "FAILED (try alt source or MCP fallback): $url" >&2; exit 1
  fi
  ```

- [ ] **Step 2: Make it executable and smoke-test it.**

  Run:
  ```bash
  chmod +x tools/refcap.sh
  tools/refcap.sh _smoke "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Example.jpg/320px-Example.jpg" example
  ```
  Expected: `captured: docs/superpowers/research/refs/_smoke/001-example.jpg`

- [ ] **Step 3: Clean the smoke dir + create the checkpoint log.**

  Run:
  ```bash
  rm -rf docs/superpowers/research/refs/_smoke
  printf '# Visual-study checkpoints (git-ignored board)\n\n' > docs/superpowers/research/refs/CHECKPOINTS.md
  ```

- [ ] **Step 4: Git-ignore the raw board.** Append to `.gitignore`:
  ```
  # daikieOS v3 visual-study board — raw third-party reference frames (provenance lives in the committed study entries)
  docs/superpowers/research/refs/
  ```

- [ ] **Step 5: Verify the ignore works.**

  Run: `git -C "<repo>" status --short docs/superpowers/research/refs/`
  Expected: no output (the board is ignored).

- [ ] **Step 6: Commit the helper + gitignore.**
  ```bash
  git -C "<repo>" add tools/refcap.sh .gitignore
  git -C "<repo>" commit -m "chore(study): capture helper (curl+sips) and git-ignore the reference board"
  ```

---

## Task 1: Globe study

Run the **Surface Study Loop** with these inputs. (Rationale: spec §5.1.)

- **`<surface>`:** `globe`
- **Seed queries:** "Blade Runner 2049 hologram interface Territory Studio"; "Ghost in the Shell 2017 sologram hologram"; "Metal Gear Solid V iDroid hologram globe"; "Cyberpunk 2077 world map UI"; "Destiny director orbit map"; "Elite Dangerous galaxy map"; "NASA Eyes on the Earth screenshot"; "CesiumJS globe demo"; "ArtStation holographic globe hologram UI"
- **Priority sources:** territorystudio.com (Blade Runner 2049 project), interfaceingame.com (Cyberpunk 2077 / Destiny map screens), eyes.nasa.gov, cesium.com/platform/cesiumjs, cantinacreative.com, artstation.com search
- **Extract targets:** how holograms *read* (scanline density, additive glow, edge falloff %, parallax, wireframe vs filled); ground-glow city emitters; color temperature of the hologram vs the dark; terminator/day-night rendering; label legibility at density (how many labels legible at once).
- **Cap / keep floor:** 25 / 12.
- **Acceptance:** SSL-7 floors met (≥12 kept, ≥8 tiered + image-pinned principles).

---

## Task 2: Rain & weather study

Run the **Surface Study Loop**. (Rationale: spec §5.2.)

- **`<surface>`:** `rain`
- **Seed queries:** "Blade Runner 2049 rain still cinematography"; "Blade Runner 1982 rain neon"; "Makoto Shinkai Garden of Words rain still"; "rain on glass macro photography bokeh"; "Death Stranding timefall"; "Houdini rain particle render reel"; "windshield droplet refraction reference"; "sheet lightning night sky reference"
- **Priority sources:** film-grab.com (Blade Runner 2049, Se7en, Blade Runner), artstation.com (Houdini rain FX), Behance rain-on-glass photography, interfaceingame is N/A here
- **Extract targets:** depth layering (near/far rain planes); droplets refracting the frame *behind* them; streak vs discrete particle; motivated sheet lightning (source + falloff timing); atmospheric perspective in rain; wet-glass beading/rivulets.
- **Cap / keep floor:** 25 / 10.
- **Note:** hologram/motion *timing* data is scarce (library open debt) — where you can't measure, mark `[WORKING]`, don't invent `[DATA]`.

---

## Task 3: HUD / UI chrome study

Run the **Surface Study Loop**. (Rationale: spec §5.3.)

- **`<surface>`:** `hud`
- **Seed queries:** "Territory Studio FUI interface design"; "Cyberpunk 2077 scan HUD braindance"; "Death Stranding UI menu"; "Deus Ex Mankind Divided HUD"; "aircraft HUD symbology"; "NASA mission control panel"; "Teenage Engineering OP-1 interface"; "oscilloscope readout"
- **Priority sources:** interfaceingame.com (per-game UI galleries), territorystudio.com, ashthorp.com, gmunk.com, Behance FUI
- **Extract targets:** corner-bracket framing; tick/graticule systems; mono-grid alignment; data-label grammar (how a label + value + unit are set); bracket tags; live readouts; **restraint** (how little is actually "on" at once); information hierarchy.
- **Cap / keep floor:** 25 / 12.

---

## Task 4: Motion / UX study

Run the **Surface Study Loop**. (Rationale: spec §5.4.)

- **`<surface>`:** `motion`
- **Seed queries:** "FUI animation reel motion design"; "decrypt text scramble effect UI"; "terminal boot sequence interface animation"; "Cyberpunk 2077 scan tag particle assembly"; "Awwwards magnetic cursor interaction"; "Codrops reveal animation"; "glitch chromatic aberration transition UI"
- **Priority sources:** gmunk.com, ashthorp.com, tympanus.net/codrops, awwwards.com, Behance motion (capture representative **stills** — motion is temporal)
- **Extract targets:** easing curves (ease-out vs spring feel); stagger rhythm (delay between siblings); "system responding" feedback; cursor states; reveal timing; and explicitly **when *not* to animate**.
- **Cap / keep floor:** 20 / 8.
- **Note:** this surface is temporal — pin representative stills and describe timing/feel in prose; mark timing `[WORKING]` unless a source gives measured values.

---

## Task 5: Typography & bilingual study

Run the **Surface Study Loop**. (Rationale: spec §5.5.)

- **`<surface>`:** `type`
- **Seed queries:** "Japanese sci-fi typography poster"; "katakana graphic design layout"; "Rajdhani typeface interface FUI"; "monospace grid technical interface"; "anime title card typography"; "Swiss international typographic style grid"; "military stencil data type"
- **Priority sources:** artstation.com, Behance (Japanese graphic design), fontsinuse.com, interfaceingame.com (menu type)
- **Extract targets:** EN/JP pairing (weights, relative size); weight contrast; tracking/letter-spacing on labels; mono grids; JP as *accent/texture* vs *content*; technical numerals (tabular, slashed zero).
- **Cap / keep floor:** 20 / 8.

---

## Task 6: Color & grade study

Run the **Surface Study Loop**. (Rationale: spec §5.6.)

- **`<surface>`:** `color`
- **Seed queries:** "Blade Runner 2049 color script"; "film-grab Blade Runner 2049"; "cyberpunk key art teal amber palette"; "neon noir color palette night city"; "teal orange color grade film"
- **Priority sources:** film-grab.com, moviesincolor.com, artstation.com (color scripts), Behance palettes
- **Extract targets:** value structure (how dark the darks sit, % of frame in shadow); accent discipline (amber signal on a cyan field — ratio of accent to base); neon bloom behavior; grade consistency across shots; contrast ratios for legibility.
- **Cap / keep floor:** 20 / 8.
- **Note:** sample hexes by eye from the downscaled frames → tag `[EXTRACTED]`; only tag `[DATA]` if you pull exact pixel values with a picker.

---

## Task 7: Composition & layout study

Run the **Surface Study Loop**. (Rationale: spec §5.7.)

- **`<surface>`:** `composition`
- **Seed queries:** "Swiss grid editorial layout design"; "FUI screen composition full frame"; "noir film framing negative space still"; "brutalist web design layout"; "dashboard information hierarchy layout"
- **Priority sources:** film-grab.com (framing stills), Behance (editorial/Swiss), brutalistwebsites.com, interfaceingame.com (full-screen composition)
- **Extract targets:** grid systems; negative space as a device; focal hierarchy (where the eye lands first); framing devices (corner HUD, letterbox); eye-path; density vs breathing room.
- **Cap / keep floor:** 20 / 8.

---

## Task 8: Synthesis — daikieOS Visual Language v3

**Files:**
- Create: `docs/superpowers/specs/2026-07-03-design-language-v3.md`
- Modify: `docs/superpowers/specs/2026-07-02-design-language-sologram-noir.md` (supersession banner)

**Interfaces:**
- Consumes: all seven `2026-07-03-<surface>-visual-study.md` entries.
- Produces: `2026-07-03-design-language-v3.md` — the rule set the elevation briefs (Task 9) cite.

- [ ] **Step 1: Re-read all seven study entries** and list every principle that reached `[VERIFIED]` or `[EXTRACTED]`, grouped by surface.

- [ ] **Step 2: Write the v3 language.** Create `2026-07-03-design-language-v3.md` with: (a) a one-paragraph **spine** (the fixed noir identity); (b) seven per-surface **rule blocks**, each rule stated as an enforceable instruction with `(ref: <surface>/NNN)` + tier; (c) a "what changed from v2" section naming each elevation the study justifies. Every rule must trace to a pinned reference — no rule without a ref.

- [ ] **Step 3: Verify traceability.**
  Run: `grep -c '(ref:' docs/superpowers/specs/2026-07-03-design-language-v3.md`
  Expected: a count ≥ the number of rules (every rule cites a reference).

- [ ] **Step 4: Banner the v2 doc.** Add to the very top of `2026-07-02-design-language-sologram-noir.md`:
  ```markdown
  > **Superseded by `2026-07-03-design-language-v3.md` (2026-07-03).** Kept for history per the research-library rule (corrections noted, never deleted).
  ```

- [ ] **Step 5: Commit.**
  ```bash
  git -C "<repo>" add docs/superpowers/specs/2026-07-03-design-language-v3.md docs/superpowers/specs/2026-07-02-design-language-sologram-noir.md
  git -C "<repo>" commit -m "design(v3): daikieOS visual language v3 synthesized from the seven-surface study"
  ```

---

## Task 9: Seven elevation briefs

**Files:**
- Create: `docs/superpowers/specs/2026-07-03-<surface>-elevation-brief.md` × 7 (globe, rain, hud, motion, type, color, composition)

**Interfaces:**
- Consumes: `2026-07-03-design-language-v3.md`, the study entries, and the current code (`js/background.js`, `css/site.css`, `js/app.js`, `js/effects.js`, `js/cursor.js`, `js/boot.js`).
- Produces: seven briefs — the hand-off artifacts a later per-surface spec→plan→build executes.

- [ ] **Step 1: For each surface, write its brief** from this structure (no code — this is the *what/why*, not the build):
  ```markdown
  # <Surface> — Elevation Brief (2026-07-03)

  Source rules: design-language-v3 §<surface>. Study: 2026-07-03-<surface>-visual-study.md.

  ## Current state
  <where it lives now: file(s) + line ranges; what it does today>

  ## Target intent
  <the feel the v3 rules call for, each with (ref: <surface>/NNN)>

  ## Concrete code levers
  - <lever>: <specific change> — e.g. "globe rim: replace fresnel hard rim with additive edge-falloff over 6% radius (background.js updateTokyoHalo)"

  ## Before / after
  <2-3 lines: what a viewer notices change>

  ## Out of scope / risks
  ```

- [ ] **Step 2: Ground each brief in the real code.** For every "current state" and "lever", cite an actual file + line range (e.g. read `js/background.js` for globe/rain levers, `css/site.css` for HUD/type/color, `js/effects.js`/`js/cursor.js` for motion). No lever may reference code that doesn't exist.

- [ ] **Step 3: Verify each brief cites code + refs.**
  Run: `for f in docs/superpowers/specs/2026-07-03-*-elevation-brief.md; do echo "$f: refs=$(grep -c '(ref:' "$f") levers=$(grep -c 'lever' "$f")"; done`
  Expected: every brief shows refs ≥ 1 and at least one concrete lever.

- [ ] **Step 4: Commit.**
  ```bash
  git -C "<repo>" add docs/superpowers/specs/2026-07-03-*-elevation-brief.md
  git -C "<repo>" commit -m "design(v3): seven per-surface elevation briefs (principle -> code lever)"
  ```

---

## Task 10: North-star + Definition-of-Done QA + library index

**Files:**
- Create: `docs/superpowers/specs/2026-07-03-north-star.md`
- Modify: `docs/superpowers/research/README.md`

- [ ] **Step 1: Write the north-star.** Create `2026-07-03-north-star.md`: one page describing the single target *feel* the whole site renders toward, plus (if one frame captures it) one pinned key-art `(ref: <surface>/NNN)`. This is the anchor the owner signs off against.

- [ ] **Step 2: Run the whole-study Definition of Done.**
  Run:
  ```bash
  echo "study entries:"; ls docs/superpowers/research/2026-07-03-*-visual-study.md | wc -l    # expect 7
  echo "briefs:";        ls docs/superpowers/specs/2026-07-03-*-elevation-brief.md | wc -l     # expect 7
  echo "v3 + north-star:"; ls docs/superpowers/specs/2026-07-03-design-language-v3.md docs/superpowers/specs/2026-07-03-north-star.md
  echo "total tiered principles:"; grep -hcE '\[(VERIFIED|EXTRACTED|DATA|WORKING)\]' docs/superpowers/research/2026-07-03-*-visual-study.md | paste -sd+ - | bc
  ```
  Expected: 7 entries, 7 briefs, both synthesis docs present, principle total comfortably past 56 (7×8 floor).

- [ ] **Step 3: Index the library.** Add to `docs/superpowers/research/README.md`: the seven study entries under Index, and a line under Open debts noting the v2→v3 design-language supersession and which `[EXTRACTED]` claims are now `[VERIFIED]`.

- [ ] **Step 4: Commit.**
  ```bash
  git -C "<repo>" add docs/superpowers/specs/2026-07-03-north-star.md docs/superpowers/research/README.md
  git -C "<repo>" commit -m "design(v3): north-star + library index update; study complete"
  ```

- [ ] **Step 5: Report the checkpoint log** to the owner: print `refs/CHECKPOINTS.md` so the running capture/cost trail is visible, and surface the north-star for sign-off.

---

## Self-Review

**1. Spec coverage** (spec → task):
- §4 seven surfaces → Tasks 1–7. ✓
- §5 reference net (what to reference) → each surface task's seed queries + priority sources + extract targets. ✓
- §6 method (discover→curl→sips→Read→extract; caps; checkpoints; MCP fallback) → SSL-1…8 + Task 0 helper. ✓
- §6 operational settings (guard rails off, no ultracode, single-threaded, caps, cost checkpoint) → Global Constraints + SSL-8 checkpoint. ✓
- §7 deliverables: board → Task 0 + SSL-3; study entries → Tasks 1–7; visual language v3 → Task 8; elevation briefs → Task 9; north-star → Task 10. ✓
- §8 tiers → SSL-5/7 grep gate. ✓
- §9 sequence → Tasks ordered globe→…→composition then synthesis. ✓
- §10 ethics/git-ignore → Task 0 Step 4; provenance-in-entry → SSL skeleton. ✓
- §11 definition of done → Task 10 Step 2. ✓
- §13 connection to elevation → Task 9 briefs (explicitly no code). ✓
No gaps found.

**2. Placeholder scan:** No "TBD/TODO/implement later". The SSL skeleton's `<!-- -->` and table headers are *templates the executor fills*, not vague instructions — the surrounding steps specify exactly what goes in them. Surface tasks carry concrete queries/sources/targets, not "add appropriate references."

**3. Type consistency:** The helper signature `refcap.sh <surface> <url> <label>` is defined in Task 0 and used identically in SSL-3. Surface slugs (`globe rain hud motion type color composition`) are consistent across File Structure, tasks, verification greps, and Task 10's DoD counts. Filenames (`2026-07-03-<surface>-visual-study.md`, `-elevation-brief.md`) match between creation and the DoD `ls` checks. `refs/<surface>/` path consistent throughout.

Fixes applied inline: none required.

Note for the executor: replace `<repo>` in commit commands with the absolute repo path `"/Users/daikieishinuki/Claude Code Projects/Personal Website"` (has a space — keep it quoted).
