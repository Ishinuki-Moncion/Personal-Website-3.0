# v3.2 Elevation Campaign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the approved v3.2 spec (`docs/superpowers/specs/2026-07-07-v32-elevation-campaign-design.md`): four slices in risk order — LAW → SUBTRACT → TRUTH → SIGNATURE — 15 commits (v32a–v32o) plus a no-commit close-out, each slice boundary a shippable stopping point.

**Architecture:** Hand-built static site (no framework, no build step): `index.html` + `css/site.css` + ESM chain (`js/boot.mjs` → `app.js`/`background.js`/`effects.js`, three.js via import map). A WebGL globe/scene ("daikieOS") with a section-story system drives the visual world; a grep-pinned harness (`tools/verify-site-hardening.js`) is the regression net. Every task = one commit, harness-pin-first where pinnable.

**Tech Stack:** Vanilla ES modules, three.js r158 (ESM, import-mapped), zero-dependency Node tools, chrome-devtools MCP for live verification, `python3 -m http.server` for serving.

## Global Constraints

- **Repo:** `/Users/daikieishinuki/Claude Code Projects/Personal Website`, branch `v3-build`. Live checks: `http://127.0.0.1:8765` (if dead: `cd` to repo, `python3 -m http.server 8765 --bind 127.0.0.1 &`).
- **Owner taste law (violations = task failure):** deep space black `#05060a` floor; never add a visual layer without retiring one; amber is an event (~1–6% warm) — amber starfield exempt (owner signature); one signal per section-change; photos dim at rest / full on demand; NO AUDIO; palette is cyan/amber, complete.
- **Task order is strict:** 1 → 16. No parallel execution of tasks — later old_strings assume earlier commits landed.
- **Binding-intent rule:** code quotes were verified at plan time (2026-07-08, HEAD `46eb768`). If an old_string no longer matches because an earlier task edited that line, re-derive the edit against current source preserving the step's stated intent — the intent is binding, not the byte-exact quote. Never skip a step because its quote drifted.
- **Read-current-and-increment (binding):** version stamps observed at plan time: `index.html` → `css/site.css?v=3.20`, `js/boot.mjs?v=5`; `js/boot.mjs:17` → `V = { bg:'4.2', fx:'3.5', app:'3.4' }`; harness = 22 checks all green. Concrete post-bump numbers inside steps are plan-time projections — always read the current value and increment (+1 boot `?v` and +0.1 `V.bg`/`V.fx`/`V.app` per task touching the respective file; +0.01 css `?v` per site.css-touching task).
- **Harness discipline:** checks are updated with features, NEVER deleted. New pins append above the stable anchor `const failed = checks.filter(item => !item.pass);`. Each task gates on: pre-task PASS count N (record it) → post-task N+1 PASS / 0 FAIL.
- **Bloom dark-swap landmine (bit twice):** during bloom, untagged objects swap to TYPE-CORRECT invisible materials (`darkPoints` for Points — v31g black-squares fix; `darkSprite` for sprites — v31f slabs fix; see `background.js:1755–1777`). Any task touching scene objects/materials must keep the swap set type-correct; prefer zero new scene objects.
- **Email plaintext ban:** the contact address must NEVER appear as plaintext in any committed file (HTML, JS, CSS, docs, this plan, commit messages). Only the encoded char-code form ships.
- **Reduced-motion:** global kill-switch stays authoritative; no new idle animation anywhere; every new motion sits behind existing `reduced`/LITE gates.
- **Commits:** exactly one per task, message per spec §Commit plan, formatted `feat(v32X): <description>` + blank line + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`. **No push, no PR** — the campaign STOPS at Task 16's gate pile for owner review.
- **Gate screenshots:** `docs/superpowers/gates/v32/` (git-ignored from Task 1), named `<letter>-<what>-before/after.png`; Task 16 assembles `GATE-PILE.md`.
- **MCP tools:** executors load chrome-devtools tools in ONE ToolSearch call (`select:mcp__plugin_ecc_chrome-devtools__new_page,…navigate_page,…resize_page,…take_screenshot,…evaluate_script,…list_console_messages` + `lighthouse_audit` where a task needs it) and use parameter names as the loaded schema defines them.

## Corrections of record (plan-time findings that override spec wording)

- EXIF source is `images/gallery-*.jpg` (12 photos; 5 carry EXIF — all NIKON D5500 — 7 stripped → `EXIF//REDACTED`); `shots/` is QA screenshots. The real thumb/tile dirs are `images/thumbs/` + `images/tiles/`, both live.
- Photos-dim-at-rest law records the AS-BUILT values `brightness(.58) saturate(.45) contrast(1.05)` (spec preamble's .62/.55 was drift); addendum §9 logs the correction.
- No tile has `data-title` today — Task 7 CREATES it from the existing `GALLERY_PLACES` city labels (no new fabrication; owner photo→city verification debt unchanged).
- No hero coordinate readout exists — the decrypt-on-reveal applies to the signature footer `.coord`, one-shot, real text kept in HTML.
- The stale clock is the canvas coordinate-callout JST bake (`background.js:807`), not the DOM `[data-clock]` (already live per-second).
- `__scenePing` is defined in `js/background.js:1374` (effects.js holds only a stale comment), zero callers.
- `storyCooldown` is 0.6s — too short for a subliminal bias; Task 13 uses a dedicated 6s window (`BIAS_WINDOW_S = 6`, cap `BIAS_MAX_RADS_PER_SEC = 0.12`). **[AMENDED 2026-07-10: 0.12 was a spec defect (> autonomous 0.066 — measured live globe reverse); shipped cap 0.055, forward-only + slew-limited on all regime edges — see the amendment at Task 13 Step 4.]**
- JP faces Zen Kaku Gothic New AND M PLUS Rounded 1c both stay on the Google CDN (variable-font subsetting impractical); only Latin faces self-host. Addendum records both.
- Absolute URLs (canonical/OG/JSON-LD/404) use the verified GitHub Pages base `https://ishinuki-moncion.github.io/Personal-Website-3.0/`; a future custom domain needs a one-sweep update.
- `SCENE_COLORS.terminal` is also dead but stays (spec ruled only on `alert`); flagged for a future ruling.

---
### Task 1: LAW — addendum, harness pins, vendor delete, measured baselines (v32a)

**Files:**
- Create: `docs/superpowers/specs/2026-07-08-v32-law-addendum.md` (new law-of-record doc)
- Create: `tools/frame-luminance.mjs` (zero-dep PNG luminance histogram CLI)
- Create: `docs/superpowers/gates/v32/` directory (git-ignored; holds `a-hero-baseline-before.png`)
- Modify: `.gitignore` (8 lines; append gates ignore at end)
- Modify: `tools/verify-site-hardening.js` (line 11 dead read; lines 26–32 check #2 rewrite; insert 5 pins after line 163)
- Modify: `js/background.js` (lines 53–59 `SCENE_COLORS`; lines 954–955 palette-anchor comment)
- Modify: `js/boot.mjs` (line 17 `V.bg` `'4.2'` → `'4.3'`)
- Modify: `index.html` (line 354 `boot.mjs?v=5` → `?v=6`)
- Delete: `js/vendor/three.global.min.js` (651,447 B, dead since the SP1 ESM cutover)
- Test: `node tools/verify-site-hardening.js` (grows 22 → 27 checks), `node --check` on touched JS, live browser at http://127.0.0.1:8765, Lighthouse mobile, frame-luminance baseline

**Interfaces:**
- Consumes: none (first task of the campaign).
- Produces (later tasks rely on these exact names):
  - `docs/superpowers/specs/2026-07-08-v32-law-addendum.md` — law of record + §8 baseline table (slice 2/4 luminance and slice 4 perf re-measures compare against it).
  - `tools/frame-luminance.mjs` — CLI `node tools/frame-luminance.mjs <image.png>` → prints JSON `{"mean":0-255,"p50":…,"p95":…,"warmShare":0-1}` (warmShare = fraction of pixels with R > B+20).
  - `docs/superpowers/gates/v32/` (git-ignored) with `a-hero-baseline-before.png`; all later gate shots follow `<letter>-<what>-before.png` / `-after.png`.
  - Harness at **27 checks**, including 5 new v3.2-law pins (names in Step 6) and the rewritten ESM-chain check (Step 5). Later tasks state expected counts from 27 upward.
  - Version state after this task: `V.bg = '4.3'` (boot.mjs), `boot.mjs?v=6` (index.html), `site.css?v=3.20` **unchanged** (this task does not touch site.css), `V.fx = '3.5'` unchanged.
  - `js/background.js` no longer contains `SCENE_COLORS.alert`; `js/vendor/three.global.min.js` no longer exists.

**Scene-material landmine note (house rule, stated explicitly):** this task's only `background.js` edits are deleting a **dead constant** and updating a **comment** — no material, no uniform, no bloom-swap surface is touched, so the bloom dark-swap landmine (v31f slabs / v31g black squares) is **not in play**. Step 14 still eyeballs the live hero for black squares/slabs as standard paranoia.

**Owner-taste check:** no visual layer added, one dead thing retired (vendor file) plus one dead token retired (alert red) — this task is pure subtraction + law, fully inside "never add a layer without retiring one".

---

- [ ] **Step 1: Preconditions.** Run:
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git branch --show-current && git status --porcelain && node tools/verify-site-hardening.js | grep -c PASS
  ```
  Expect: branch `v3-build`, empty status (clean tree), and `22` (all 22 existing checks green, exit 0). If the tree is dirty or any check fails, STOP and report — do not build law on a broken base.

- [ ] **Step 2: Git-ignore the gates dir and create it.** In `.gitignore`, Edit — old_string:
  ```
  # Personal Claude Code overrides (local, not shared)
  .claude/settings.local.json
  ```
  new_string:
  ```
  # Personal Claude Code overrides (local, not shared)
  .claude/settings.local.json

  # v3.2 gate screenshots (owner end-of-pass review artifacts; heavy PNGs, not site assets)
  docs/superpowers/gates/v32/
  ```
  Then:
  ```bash
  mkdir -p "/Users/daikieishinuki/Claude Code Projects/Personal Website/docs/superpowers/gates/v32" && cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git check-ignore -v docs/superpowers/gates/v32/probe.png
  ```
  Expect: `git check-ignore` prints the `.gitignore` rule line (the path is ignored). No `.gitkeep` — the dir is intentionally untracked.

- [ ] **Step 3: Create `tools/frame-luminance.mjs` (full code, zero deps).** Write the file with exactly this content:
  ```js
  #!/usr/bin/env node
  /* frame-luminance.mjs — v3.2 measurement law (Slice 1 / v32a).
     Zero-dep PNG luminance histogram so "net light drops" claims are provable
     (spec 1.5; slices 2 and 4 must beat the v32a baselines in the law addendum).

     Usage:  node tools/frame-luminance.mjs <image.png>
     Prints: {"mean":0-255,"p50":0-255,"p95":0-255,"warmShare":0-1}
       mean/p50/p95 = Rec.709 luma (0.2126R + 0.7152G + 0.0722B) stats
       warmShare    = fraction of pixels with R > B + 20 (warm-budget probe;
                      reference target: color study [DATA] warm 1-6%, amber
                      starfield exempt per the 2026-07-08 law addendum)

     Supports 8-bit RGB (color type 2) and RGBA (color type 6), non-interlaced —
     exactly what Chrome devtools screenshots produce. Anything else errors loudly. */

  import { readFileSync } from 'node:fs';
  import { inflateSync } from 'node:zlib';

  function decodePNG(buf) {
    const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (let i = 0; i < 8; i++) if (buf[i] !== SIG[i]) throw new Error('not a PNG');
    let pos = 8, width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
    const idat = [];
    while (pos + 8 <= buf.length) {
      const len = buf.readUInt32BE(pos);
      const type = buf.toString('ascii', pos + 4, pos + 8);
      const data = buf.subarray(pos + 8, pos + 8 + len);
      if (type === 'IHDR') {
        width = data.readUInt32BE(0);
        height = data.readUInt32BE(4);
        bitDepth = data[8];
        colorType = data[9];
        interlace = data[12];
      } else if (type === 'IDAT') {
        idat.push(data);
      } else if (type === 'IEND') {
        break;
      }
      pos += 12 + len; // 4 len + 4 type + payload + 4 crc
    }
    if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth} (need 8)`);
    if (colorType !== 2 && colorType !== 6) throw new Error(`unsupported color type ${colorType} (need RGB=2 or RGBA=6)`);
    if (interlace !== 0) throw new Error('interlaced PNG unsupported');
    const bpp = colorType === 6 ? 4 : 3;
    const stride = width * bpp;
    const raw = inflateSync(Buffer.concat(idat));
    if (raw.length < height * (stride + 1)) throw new Error('truncated IDAT stream');
    const out = Buffer.alloc(height * stride);
    // un-filter scanlines (PNG filter types 0..4: None, Sub, Up, Average, Paeth)
    for (let y = 0; y < height; y++) {
      const filter = raw[y * (stride + 1)];
      const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
      const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
      const cur = out.subarray(y * stride, (y + 1) * stride);
      for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? cur[x - bpp] : 0;          // left
        const b = prev ? prev[x] : 0;                   // up
        const c = x >= bpp && prev ? prev[x - bpp] : 0; // up-left
        let v = line[x];
        switch (filter) {
          case 0: break;
          case 1: v = (v + a) & 0xff; break;
          case 2: v = (v + b) & 0xff; break;
          case 3: v = (v + ((a + b) >> 1)) & 0xff; break;
          case 4: {
            const p = a + b - c;
            const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
            v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
            break;
          }
          default: throw new Error(`bad filter ${filter} on row ${y}`);
        }
        cur[x] = v;
      }
    }
    return { width, height, bpp, pixels: out };
  }

  const file = process.argv[2];
  if (!file) {
    console.error('usage: node tools/frame-luminance.mjs <image.png>');
    process.exit(2);
  }
  const { width, height, bpp, pixels } = decodePNG(readFileSync(file));

  const hist = new Uint32Array(256);
  let warm = 0;
  const n = width * height;
  for (let i = 0; i < n; i++) {
    const o = i * bpp;
    const r = pixels[o], g = pixels[o + 1], b = pixels[o + 2];
    hist[Math.min(255, Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b))]++;
    if (r > b + 20) warm++;
  }
  let sum = 0;
  for (let l = 0; l < 256; l++) sum += l * hist[l];
  const pct = (q) => {
    const target = q * n;
    let acc = 0;
    for (let l = 0; l < 256; l++) { acc += hist[l]; if (acc >= target) return l; }
    return 255;
  };
  console.log(JSON.stringify({
    mean: +(sum / n).toFixed(2),
    p50: pct(0.50),
    p95: pct(0.95),
    warmShare: +(warm / n).toFixed(4),
  }));
  ```
  Then run `node --check "/Users/daikieishinuki/Claude Code Projects/Personal Website/tools/frame-luminance.mjs"` — expect silent exit 0.

- [ ] **Step 4: Prove the tool against known pixels (TDD analog for the measurement tool).** Write a throwaway generator to `/tmp/make-test-png.mjs` (test scaffold only — NOT committed, lives outside the repo):
  ```js
  // /tmp/make-test-png.mjs <rrggbb> <out.png> — 4x4 solid-color 8-bit RGB PNG (filter 0, non-interlaced)
  import { deflateSync } from 'node:zlib';
  import { writeFileSync } from 'node:fs';
  const [hex = '05060a', out = '/tmp/v32-lum-test.png'] = process.argv.slice(2);
  const px = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  const W = 4, H = 4;
  const crcTable = [...Array(256)].map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit, RGB
  const rows = [];
  for (let y = 0; y < H; y++) rows.push(Buffer.from([0, ...Array(W).fill(px).flat()]));
  writeFileSync(out, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0)),
  ]));
  console.log('wrote ' + out);
  ```
  Run the three assertions:
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" \
    && node /tmp/make-test-png.mjs 05060a /tmp/v32-lum-void.png && node tools/frame-luminance.mjs /tmp/v32-lum-void.png \
    && node /tmp/make-test-png.mjs ff9e2c /tmp/v32-lum-amber.png && node tools/frame-luminance.mjs /tmp/v32-lum-amber.png \
    && node tools/frame-luminance.mjs shots/hero.png
  ```
  Expected EXACT outputs:
  - `--void` #05060a test → `{"mean":6,"p50":6,"p95":6,"warmShare":0}` (luma of (5,6,10) = 6.076 → bin 6; R=5 is not > B+20=30).
  - `--amber` #ff9e2c test → `{"mean":170,"p50":170,"p95":170,"warmShare":1}` (luma 170.39 → bin 170; R=255 > B+20=64).
  - `shots/hero.png` smoke → any valid JSON with `0 <= p50 <= p95 <= 255` and `0 <= warmShare <= 1` (this file is an old QA capture; it only proves real-world PNG decode). If it errors with "unsupported color type", that is acceptable for this legacy file — the binding smoke test is the devtools screenshot in Step 15, which is always type 2/6.
  Any mismatch on the two synthetic cases = decoder bug; fix before proceeding (systematic-debugging, not tweaking expected values).

- [ ] **Step 5: Harness — rewrite the dead-vendor check FIRST (red before green).** In `tools/verify-site-hardening.js`, two Edits.
  (1) Remove the raw read of the file we are about to delete — old_string:
  ```js
  const css = read('css/site.css');
  const three = read('js/vendor/three.global.min.js');
  ```
  new_string:
  ```js
  const css = read('css/site.css');
  ```
  (2) Rewrite check #2 (update-with-feature, never delete) — old_string:
  ```js
  check(
    'vendored Three.js is a generated global build without the deprecated browser entry',
    /Generated from three@0\.158\.0\/build\/three\.module\.min\.js/.test(three) &&
      /globalThis\.THREE=/.test(three) &&
      !three.includes('Scripts "build/three.js" and "build/three.min.js" are deprecated'),
    'use the generated global build instead of the deprecated browser entry'
  );
  ```
  new_string:
  ```js
  check(
    'ESM chain is live with no dead global Three.js build (v3.2 law)',
    /"three":\s*"\.\/js\/vendor\/three-0\.158\.0\/three\.module\.min\.js"/.test(index) &&
      /"three\/addons\/":\s*"\.\/js\/vendor\/three-0\.158\.0\/examples\/jsm\/"/.test(index) &&
      /<script type="module" src="js\/boot\.mjs\?v=\d+"><\/script>/.test(index) &&
      !index.includes('three.global.min.js') &&
      !fs.existsSync(path.join(root, 'js/vendor/three.global.min.js')),
    'import-map + versioned boot.mjs is the only Three.js path; the 651KB global build must stay deleted and unreferenced'
  );
  ```

- [ ] **Step 6: Harness — append the 5 v3.2-law pins.** In `tools/verify-site-hardening.js`, Edit — old_string (the current last check plus the tally line):
  ```js
  check(
    'page copy explains the Dallas to Tokyo geography',
    /class="geo-trail"/.test(index) &&
      /Dallas[\s\S]*Tokyo/.test(index),
    'regular page content should explain the same geography as the globe'
  );

  const failed = checks.filter(item => !item.pass);
  ```
  new_string:
  ```js
  check(
    'page copy explains the Dallas to Tokyo geography',
    /class="geo-trail"/.test(index) &&
      /Dallas[\s\S]*Tokyo/.test(index),
    'regular page content should explain the same geography as the globe'
  );

  /* ---- v3.2 law pins (2026-07-08 addendum; update-with-feature, never delete) ---- */

  check(
    'v3.2 law: deep-black floor tokens pinned (no teal floor regression)',
    /--void:\s*#05060a/.test(css) &&
      /--void-2:\s*#080a10/.test(css) &&
      /--void-deep:\s*#030407/.test(css) &&
      /--panel-solid:\s*rgba\(7,\s*9,\s*14,\s*0\.92\)/.test(css) &&
      !/0a1416/i.test(css) &&
      !/0a1416/i.test(index),
    'site.css :root must keep the #05060a deep-black family; no #0a1416 teal floor token may return in css or index.html'
  );

  check(
    'v3.2 law: teal shadow crush stays neutralised in the scene grade',
    /uTealAmt:\s*\{\s*value:\s*0\.0\s*\}/.test(background),
    'background.js gradePass must keep uTealAmt at 0.0 — shadows sink to true black, no teal cast'
  );

  check(
    'v3.2 law: photos dim at rest, full on demand',
    /\.shot \.media \{[^}]*brightness\(\.58\) saturate\(\.45\) contrast\(1\.05\)/.test(css) &&
      /\.shot:hover \.media, \.shot:focus-visible \.media \{ transform: scale\(1\.12\); filter: none; \}/.test(css) &&
      /\.about-portrait \.media \{[^}]*brightness\(\.58\) saturate\(\.45\) contrast\(1\.05\)/.test(css),
    'gallery tiles + about portrait keep the v3.1f rest grade; hover/focus-visible lifts the filter entirely (lightbox stays unfiltered)'
  );

  check(
    'v3.2 law: amber starfield signature present (owner timeline)',
    /const fieldAmber = makeField\(quality\.fieldCounts\[1\], AMBER, 36, 0\.06, 0\.8\);/.test(background) &&
      /scene\.add\(fieldCyan, fieldAmber, fieldDeep\);/.test(background),
    'the cyan+amber two-temperature starfield is the owner signature exception to the warm budget — AMBER field at alpha .8 must stay'
  );

  check(
    'v3.2 law: scene palette is cyan/amber, complete — no alert red',
    /softAmber: 0xffd9a0/.test(background) &&
      !/alert:\s*0xff3b5c/.test(background) &&
      !/SCENE_COLORS\.alert/.test(background),
    'SCENE_COLORS.alert was deleted by v3.2 ruling (red-on-failure rejected as a third-hue palette-law change); it must not return'
  );

  const failed = checks.filter(item => !item.pass);
  ```

- [ ] **Step 7: Run the harness — show the expected RED state.** Run:
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && node --check tools/verify-site-hardening.js && node tools/verify-site-hardening.js; echo "exit=$?"
  ```
  Expect EXACTLY: 27 checks total, **25 PASS / 2 FAIL**, exit=1, and the two FAILs are precisely:
  1. `ESM chain is live with no dead global Three.js build (v3.2 law)` — red because `js/vendor/three.global.min.js` still exists.
  2. `v3.2 law: scene palette is cyan/amber, complete — no alert red` — red because `alert: 0xff3b5c` is still in background.js.
  The four other new pins (floor tokens, uTealAmt, photo rest-filter, amber starfield) must already be GREEN — they are regression pins on as-built behavior. If any of those four is red, the regex is wrong: fix the check, not the site.

- [ ] **Step 8: Delete `SCENE_COLORS.alert` + re-true the palette comment.** In `js/background.js`, two Edits.
  (1) The dead constant (line ~57; zero usages — `grep -c "SCENE_COLORS.alert" js/background.js` returns 0) — old_string:
  ```js
    softAmber: 0xffd9a0,
    alert: 0xff3b5c,
    terminal: 0x8dffb3,
  ```
  new_string:
  ```js
    softAmber: 0xffd9a0,
    terminal: 0x8dffb3,
  ```
  (2) The comment at line ~954–955 that still legislates a red reserve, contradicting the new ruling — old_string:
  ```js
    /* Instrument palette anchors (dossier [DATA]: MGSV iDroid field #0f394c,
       active #b2f5fd, hue discipline 193-201; alert red reserved for alerts). */
  ```
  new_string:
  ```js
    /* Instrument palette anchors (dossier [DATA]: MGSV iDroid field #0f394c,
       active #b2f5fd, hue discipline 193-201; v3.2 law: no alert red — the
       palette is cyan/amber, complete (2026-07-08 law addendum, ruling 2). */
  ```
  Then `node --check "/Users/daikieishinuki/Claude Code Projects/Personal Website/js/background.js"` — expect silent exit 0.

- [ ] **Step 9: Delete the dead vendor build.** Run:
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git rm js/vendor/three.global.min.js && ls js/vendor/
  ```
  Expect: `ls` shows only `es-module-shims-1.10.0.min.js` and `three-0.158.0/`. (Pre-verified: the ONLY reference in the whole repo outside docs/history was harness line 11, removed in Step 5. `tools/build-three-global.cjs` — the generator that once produced this file — stays as provenance; its output is now banned from the serve chain by the rewritten check #2.)

- [ ] **Step 10: Harness GREEN.** Run `cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && node tools/verify-site-hardening.js; echo "exit=$?"` — expect **27 PASS / 0 FAIL, exit=0**. Both Step-7 reds must have flipped green; nothing else may have changed state.

- [ ] **Step 11: Cache-bust the boot chain (background.js was touched).** Two Edits.
  (1) `js/boot.mjs` line 17 — old_string:
  ```js
  const V = { bg: '4.2', boot: '3.1', cursor: '3.1', fx: '3.5', app: '3.4' };
  ```
  new_string:
  ```js
  const V = { bg: '4.3', boot: '3.1', cursor: '3.1', fx: '3.5', app: '3.4' };
  ```
  (2) `index.html` line 354 (executor: this is the current value read from the file — if it has moved on, increment whatever is there by 1) — old_string:
  ```html
  <script type="module" src="js/boot.mjs?v=5"></script>
  ```
  new_string:
  ```html
  <script type="module" src="js/boot.mjs?v=6"></script>
  ```
  Then `node --check "/Users/daikieishinuki/Claude Code Projects/Personal Website/js/boot.mjs"` (exit 0) and re-run the harness once more (27/27 — the rewritten check #2 matches `boot.mjs?v=\d+`, so the bump cannot break it). `site.css` is untouched this task → `?v=3.20` stays.

- [ ] **Step 12: Write the law addendum.** Create `docs/superpowers/specs/2026-07-08-v32-law-addendum.md` with exactly this content (the `*(measured at execution time)*` cells in §8 are filled by Steps 13–16 before commit — this is the one permitted deferred-value pattern):
  ````markdown
  # v3.2 law addendum — the corpus re-trued (deep black is law)

  **Date:** 2026-07-08. **Author:** Fable 5 (v3.2 Slice 1 / commit v32a), per `2026-07-07-v32-elevation-campaign-design.md` §1.1–1.5.
  **Why this document exists:** the design corpus still legislates the rejected teal floor (design-language-v3 §6/§8; north-star line ~10 names `#0a1416`). Those passages are **SUPERSEDED** on floor + palette by this addendum. The old files stay unedited as history; THIS file plus the harness pins in `tools/verify-site-hardening.js` are the law of record. House rule: pins are updated with features, never deleted.

  ## 1. Floor tokens (law)
  The floor is the deep-black family, verbatim from `css/site.css :root` as built (v3.1a):

  | Token | Value | Role |
  |---|---|---|
  | `--void` | `#05060a` | page floor; matches scene fog `THREE.FogExp2(0x05060a, 0.05)` |
  | `--void-2` | `#080a10` | raised surfaces (tile beds) |
  | `--void-deep` | `#030407` | deepest overlay-scrim floor |
  | `--panel-solid` | `rgba(7, 9, 14, 0.92)` | chrome panel bed |

  `#0a1416` and the whole v3.0 teal-floor family (`#0e1a1d`, `#050e10`, `uTealAmt > 0`, teal-tinted `uLift`) are **banned as floor values**. Scene grade law: `uTealAmt: { value: 0.0 }` and neutral negative lift `uLift (-0.02,-0.02,-0.02)` — shadows sink to true black. Pinned: floor-token pin + uTealAmt pin.

  ## 2. Amber starfield = owner signature (warm-budget exception)
  Owner decision 2026-07-07: the cyan+amber two-temperature starfield is the site's signature, restored to its original timeline values after v3.1 briefly cooled it. As built in `js/background.js`:
  `const fieldAmber = makeField(quality.fieldCounts[1], AMBER, 36, 0.06, 0.8);` — 1200 particles on the high tier, AMBER at alpha .8, added via `scene.add(fieldCyan, fieldAmber, fieldDeep)`.
  This field is **exempt** from the ~1–6% warm budget (reference: `docs/superpowers/research/2026-07-03-color-visual-study.md` [DATA] budgets). Everywhere else, amber = event. Pinned.

  ## 3. Photos dim at rest, full on demand (law)
  As built (v3.1f — one notch deeper than the v3.1 spec's `.62/.55` draft; the as-built value is the law):
  - Rest grade on `.shot .media` **and** `.about-portrait .media`: `filter: brightness(.58) saturate(.45) contrast(1.05)`.
  - Hover / `:focus-visible` lifts the filter **entirely** (`filter: none`) — acquisition is binary, not graded.
  - The lightbox is the full-color payoff: no filter on the lightbox image, ever.
  - Transition `.45s var(--ease-out)`, covered by the global reduced-motion kill-switch. Pinned.

  ## 4. Pinned negatives (do-not-repropose)
  1. **Teal floor** — rejected by owner 2026-07-07; deep space black is the identity.
  2. **All-cool starfield** — killed the signature; the amber field is law (§2).
  3. **Uniform lift with tinted shadows** — tinted lift reads as haze on the black floor; grade must crush neutral.
  4. **Signal density regressions** — always-on packets, scroll pings, perpetual spinners; one signal per section-change.
  5. **Perpetual arc re-arm** — the arc+comet fires once per story trigger, never on an idle timer.
  6. **5-label halo** — halo labels are capped at 2 (東京 + one secondary).

  ## 5. Closed deferrals (moved from "deferred" → CLOSED; rationale kept)
  1. **Motion L4 ghost-echo** — a second motion voice on acquisitions; violates scarcity.
  2. **Motion L5 per-letter** — per-letter decrypt everywhere reads as animation for its own sake; the boxed state-word owns section-change.
  3. **Motion L7 idle** — no new idle animation, ever (reduced-motion law + calm).
  4. **Hue-jump / glitch / CA-pulse** — chromatic events break the two-hue palette law.
  5. **Composition L4 named-cells as built things** — the Swiss third zone stays a composition *guide*, not a rendered feature; the original over-framing warning stands.

  ## 6. New rulings
  1. **NO AUDIO, ever.** Not a deferral — a law. Recorded so it never resurfaces as an additive temptation.
  2. **`SCENE_COLORS.alert` deleted** (was `alert: 0xff3b5c`, dead since birth — zero call sites). The scene palette is cyan/amber (+`softAmber` tint, +`terminal` legacy), **complete, by law**. Red-on-failure was considered in the v3.2 brainstorm and REJECTED as a third-hue palette-law change. Pinned so it cannot return.
  3. **Dead global Three.js build deleted** (`js/vendor/three.global.min.js`, 651,447 B). The ESM chain (import-map + versioned `boot.mjs`) is the only Three.js path. `tools/build-three-global.cjs` remains as provenance; its output is banned from the serve chain. Pinned.

  ## 7. Measurement law: the frame-luminance tool
  `node tools/frame-luminance.mjs <image.png>` → `{"mean":0-255,"p50":…,"p95":…,"warmShare":0-1}` (Rec.709 luma stats; `warmShare` = fraction of pixels with R > B+20). Zero deps; decodes 8-bit RGB/RGBA non-interlaced PNG (devtools screenshot format).
  **Any v3.2 claim of "net light drops"** — slice 2 (dither/floor), slice 4 rain lever A, slice 4 photo halo — **must be proven** against the §8 baselines: same URL, same viewport, same wait-for-scene procedure (§8 method notes).

  ## 8. Performance + luminance baselines (v32a, measured)
  Method: site served at `http://127.0.0.1:8765` (python3 http.server); Chrome devtools MCP; hero shot at 1440×900 after a 5s scene-settle wait post-navigation; Lighthouse run with mobile emulation against `http://127.0.0.1:8765/`. Localhost Lighthouse numbers are for **relative** comparison (slice 4 re-measures the same way), not absolute field truth.

  | # | Metric | How measured | Value |
  |---|---|---|---|
  | 1 | `js/vendor` payload (after vendor delete) | `du -sh js/vendor` | *(measured at execution time; expect ~760K, was 1.4M)* |
  | 2 | vendor breakdown | `du -sh js/vendor/*` | *(measured at execution time)* |
  | 3 | `images/` total / `thumbs/` / `tiles/` | `du -sh images images/thumbs images/tiles` | *(measured at execution time; pre-verified 6.9M / 116K / 904K)* |
  | 4 | gallery JPG min/max | `ls -laS images/gallery-*.jpg` | *(measured at execution time; pre-verified 113,475 B gallery-16.jpg – 948,938 B gallery-08.jpg)* |
  | 5 | thumbs/tiles referenced? | grep (see §9) | **YES, both live** — `index.html:215–226` inline `images/thumbs/*`; `js/app.js:154` (thumbs), `:170` (tiles) |
  | 6 | Lighthouse mobile: perf score / LCP / total byte weight | `lighthouse_audit` on `http://127.0.0.1:8765/` | *(measured at execution time)* |
  | 7 | Hero frame luminance @1440×900: mean / p50 / p95 / warmShare | `node tools/frame-luminance.mjs docs/superpowers/gates/v32/a-hero-baseline-before.png` | *(measured at execution time)* |

  ## 9. Corrections of record
  - The v3.2 campaign spec §1.4 says "`shots/thumbs/` and `shots/tiles/`" — the real directories are **`images/thumbs/`** and **`images/tiles/`**, both live (row 5 above). `shots/` is QA screenshots only, no subdirectories, never served by the site.
  - The v3.2 campaign spec preamble quotes the photos-dim rule at `.62/.55` — as built it is `.58/.45` (v3.1f, "one notch deeper for the black floor"). This addendum records the as-built value as law (§3).

  ## 10. Enforcement
  Six pins in `tools/verify-site-hardening.js` (harness total: 27):
  `ESM chain is live with no dead global Three.js build (v3.2 law)` · `v3.2 law: deep-black floor tokens pinned` · `v3.2 law: teal shadow crush stays neutralised` · `v3.2 law: photos dim at rest, full on demand` · `v3.2 law: amber starfield signature present` · `v3.2 law: scene palette is cyan/amber, complete — no alert red`.
  ````

- [ ] **Step 13: Payload census — fill §8 rows 1–4.** Run:
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" \
    && du -sh js/vendor && du -sh js/vendor/* \
    && du -sh images images/thumbs images/tiles \
    && ls -laS images/gallery-*.jpg | sed -n '1p;$p' \
    && grep -rn "images/thumbs\|images/tiles" index.html js/app.js | head -5 \
    && find shots -type d
  ```
  Edit the addendum: replace the `*(measured at execution time…)*` cells in rows 1–4 with the actual numbers (row 5 is already final; `find shots -type d` must print only `shots` — confirming the §9 correction). Sanity: row 1 should be ~760K (1.4M minus the deleted 651,447 B file); rows 3–4 should match the pre-verified values — if they differ, record the actual and note the drift.

- [ ] **Step 14: Live verify at the bumped ?v= (zero console errors) + hero baseline screenshot.** First ensure the server is up:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8765/index.html
  ```
  If not `200`: `cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && python3 -m http.server 8765 --bind 127.0.0.1 &` (background). Then load the browser tools in ONE ToolSearch call: `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__resize_page,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__lighthouse_audit`. Then:
  1. `new_page` → `navigate_page` to `http://127.0.0.1:8765/index.html` → `resize_page` to 1440×900.
  2. `evaluate_script`: `new Promise(r => setTimeout(() => r(performance.getEntriesByType('resource').filter(e => e.name.includes('background.js')).map(e => e.name).join(',')), 5000))` — the 5s settle wait doubles as the hard-reload proof: the returned URL MUST contain `background.js?v=4.3` (new boot chain live). Also confirm no resource entry contains `three.global` : `performance.getEntriesByType('resource').some(e => e.name.includes('three.global'))` must be `false`.
  3. `list_console_messages` — **zero error-level messages** required (a vendor 404 or a broken boot chain shows here; if any error appears, stop and fix before proceeding).
  4. Visual eyeball on the live page: hero renders the globe + starfield with NO black squares/slabs (bloom dark-swap paranoia check — not expected to trigger, nothing material-typed was touched).
  5. `take_screenshot` of the viewport (not fullPage) saved to `/Users/daikieishinuki/Claude Code Projects/Personal Website/docs/superpowers/gates/v32/a-hero-baseline-before.png` (pass the tool's `filePath` parameter; if this MCP version only returns inline base64, write it to that path by decoding with `python3 -c "import base64,sys; open(sys.argv[1],'wb').write(base64.b64decode(sys.stdin.read()))"`).

- [ ] **Step 15: Frame-luminance baseline — fill §8 row 7.** Run:
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && node tools/frame-luminance.mjs docs/superpowers/gates/v32/a-hero-baseline-before.png
  ```
  Expect valid JSON; for the deep-black hero, `p50` should be very low (single digits — the floor) and `warmShare` modest (starfield + Tokyo amber only). Edit the addendum §8 row 7 cell with the exact JSON values.

- [ ] **Step 16: Lighthouse mobile baseline — fill §8 row 6.** Call `mcp__plugin_ecc_chrome-devtools__lighthouse_audit` (schema already loaded in Step 14) against `http://127.0.0.1:8765/` with mobile emulation and the performance category (use the tool's device/formFactor parameter as its schema names it). Record into addendum §8 row 6: performance score, LCP (s), and total byte weight (KB). Note in the cell that LCP may key on the boot overlay — fine, slice 4 re-measures identically.

- [ ] **Step 17: Final green sweep.** Run:
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" \
    && node --check tools/frame-luminance.mjs && node --check tools/verify-site-hardening.js \
    && node --check js/background.js && node --check js/boot.mjs \
    && node tools/verify-site-hardening.js | tail -3 && node tools/verify-site-hardening.js | grep -c PASS \
    && grep -n "measured at execution time" docs/superpowers/specs/2026-07-08-v32-law-addendum.md; echo "leftover-deferred=$?"
  ```
  Expect: all `node --check` silent; harness **27** PASS, exit 0; and the final grep finds **no** remaining "measured at execution time" cells in §8 rows 1–4, 6, 7 (`leftover-deferred=1`, i.e. grep found nothing — every cell holds a real number; the phrase may only survive inside row parentheticals if you kept the "expect ~" hints, so delete those hints when filling the cells).

- [ ] **Step 18: Commit v32a.** Run:
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" \
    && git add .gitignore index.html js/background.js js/boot.mjs tools/frame-luminance.mjs tools/verify-site-hardening.js docs/superpowers/specs/2026-07-08-v32-law-addendum.md \
    && git status --short
  ```
  Verify staged set is EXACTLY: modified `.gitignore`, `index.html`, `js/background.js`, `js/boot.mjs`, `tools/verify-site-hardening.js`; new `tools/frame-luminance.mjs`, `docs/superpowers/specs/2026-07-08-v32-law-addendum.md`; deleted `js/vendor/three.global.min.js` (already staged by `git rm` in Step 9). Nothing from `docs/superpowers/gates/v32/` may appear (ignored). Then:
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git commit -m "$(cat <<'EOF'
  feat(v32a): law addendum + harness pins + vendor delete + baselines

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )" && git show --stat HEAD
  ```
  Expect: 8 files changed, including the 651KB deletion. **No push** — the campaign stays on `v3-build` until the owner signs off on the gate pile.
### Task 2: Cluster the city lights (v32b)

**Files:** Modify: `js/background.js` (:199 comment, :206–208 gcity fill), `tools/verify-site-hardening.js` (append 1 pin before `const failed`, currently :165), `js/boot.mjs` (:17 V.bg), `index.html` (:354 boot.mjs?v). Test: `tools/verify-site-hardening.js`, `tools/frame-luminance.mjs`.
**Interfaces:** Consumes: `tools/frame-luminance.mjs` CLI and `docs/superpowers/gates/v32/` naming convention (both created in Task 1/v32a). Produces: harness pin `v32b: city lights cluster on coastlines — the uniform 11% freckle is retired`; gate screenshots `docs/superpowers/gates/v32/b-citylights-before.png` / `b-citylights-after.png`; variables `cityCluster`, `pCity` in background.js; V.bg `4.3`; `boot.mjs?v=6`.

Bloom dark-swap landmine (bit twice: v31f sprite slabs, v31g point squares): this task touches **no material at all** — it only re-weights the existing `city` BufferAttribute consumed by the `earth-land-particles` ShaderMaterial. That object is bloom-TAGGED via `bloomByName` (background.js:1627), so during the bloom pass it keeps its real material (which writes `gl_PointSize`). No swap-material change is needed; do not add one.

Owner-taste law: pure subtraction — lit night-side share drops from a uniform 11% to ~2–4%, warm pixels DROP. No new layer.

- [ ] **Step 1: Server + BEFORE baseline.** Check the server: `curl -sI http://127.0.0.1:8765 | head -1` — if dead, restart: `cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && python3 -m http.server 8765 --bind 127.0.0.1 &`. Then `mkdir -p "/Users/daikieishinuki/Claude Code Projects/Personal Website/docs/superpowers/gates/v32"`. Load browser tools once for this task: ToolSearch `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__resize_page,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__list_console_messages`. Open `http://127.0.0.1:8765/?r=b0`, `resize_page` 1440×900, then `evaluate_script`: `async () => { await new Promise(r => setTimeout(r, 9000)); return document.body.hasAttribute('data-booting'); }` — expect `false` (9 s also lets the boot arc afterglow fully fade so before/after frames are comparable). `take_screenshot` format `png`, filePath `/Users/daikieishinuki/Claude Code Projects/Personal Website/docs/superpowers/gates/v32/b-citylights-before.png`.
- [ ] **Step 2: Record baseline luminance.** Run `cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && node tools/frame-luminance.mjs docs/superpowers/gates/v32/b-citylights-before.png` — record the printed JSON (`mean`, `p50`, `p95`, `warmShare`) in the task notes. (If Task 1 recorded a hero baseline in the law addendum, note both; this pair is the binding comparison.)
- [ ] **Step 3: Add the harness pin FIRST (red).** In `tools/verify-site-hardening.js`, Edit — old_string:
  ```js
  const failed = checks.filter(item => !item.pass);
  ```
  new_string:
  ```js
  check('v32b: city lights cluster on coastlines — the uniform 11% freckle is retired',
    !/gcity\[i\] = Math\.random\(\) < 0\.11/.test(background) &&
      /cityCluster/.test(background) &&
      /const pCity = gedge\[i\]/.test(background),
    'gcity must be weighted by the gedge coastline signal and a low-frequency cluster field (lit night-side area < ~5%), never the uniform 11% freckle');

  const failed = checks.filter(item => !item.pass);
  ```
  Run `node tools/verify-site-hardening.js` — expect exit 1 with exactly one FAIL: the new `v32b:` check (all pre-existing checks PASS; after Task 1/v32a the passing count should be 27 — if it differs, just record the printed count as N; this task ends at N+1).
- [ ] **Step 4: Implement the clustering.** In `js/background.js`, Edit — old_string:
  ```js
    gph[i] = Math.random() * Math.PI * 2;
    gedge[i] = landEdgeAt(lon, lat);
    gcity[i] = Math.random() < 0.11 ? 1 : 0;
  ```
  new_string:
  ```js
    gph[i] = Math.random() * Math.PI * 2;
    gedge[i] = landEdgeAt(lon, lat);
    /* v3.2b (globe brief lever 1): coastline-weighted city clustering replaces
       the uniform 11% freckle. A low-frequency lon/lat field, cubed to sharpen
       its peaks, gates WHERE metropolitan clusters exist; the gedge coastline
       signal pulls them onto coasts (cities are coastal). Expected lit share
       ~2-4% of land points — under the <5% night-side budget. */
    const cityCluster = Math.pow(0.5 + 0.5 * Math.sin(lon * 0.12 + 1.7) * Math.sin(lat * 0.19 - 0.6), 3.0);
    const pCity = gedge[i] ? 0.45 * cityCluster : 0.03 * cityCluster;
    gcity[i] = Math.random() < pCity ? 1 : 0;
  ```
  Then update the declaration comment, Edit — old_string:
  ```js
  const gcity = new Float32Array(GLOBE_N);   // sparse night-side city lights (motivated amber emitters)
  ```
  new_string:
  ```js
  const gcity = new Float32Array(GLOBE_N);   // coastline-clustered night-side city lights (motivated amber emitters, v3.2b)
  ```
- [ ] **Step 5: Version bumps.** `js/boot.mjs` Edit — old_string:
  ```js
  const V = { bg: '4.2', boot: '3.1', cursor: '3.1', fx: '3.5', app: '3.4' };
  ```
  new_string:
  ```js
  const V = { bg: '4.3', boot: '3.1', cursor: '3.1', fx: '3.5', app: '3.4' };
  ```
  (If another slice already moved `bg` past 4.2, increment whatever is current by +0.1 instead.) `index.html` Edit — old_string:
  ```html
  <script type="module" src="js/boot.mjs?v=5"></script>
  ```
  new_string:
  ```html
  <script type="module" src="js/boot.mjs?v=6"></script>
  ```
  (Same rule: read the current value and add 1 if it is no longer 5.)
- [ ] **Step 6: Static verification (green).** `node --check js/background.js && node --check js/boot.mjs` — both silent. `node tools/verify-site-hardening.js` — ALL GREEN, count N+1 (expected 28), including the new `v32b:` pin.
- [ ] **Step 7: Live verify + AFTER luminance.** Navigate to `http://127.0.0.1:8765/?r=b1` (fresh query busts the cached index.html; the bumped `?v=` busts the JS chain), 1440×900, run the same 9 s boot-wait `evaluate_script` as Step 1, then `take_screenshot` png filePath `/Users/daikieishinuki/Claude Code Projects/Personal Website/docs/superpowers/gates/v32/b-citylights-after.png`. `list_console_messages` — zero errors required. Run `node tools/frame-luminance.mjs docs/superpowers/gates/v32/b-citylights-after.png` and compare with Step 2: `mean` and `warmShare` must DROP or hold (tolerance +1 on mean, +0.01 on warmShare for rain/starfield frame noise; if a lightning flash contaminated the frame — a visible horizontal glow sheet — retake the screenshot). Eyeball the globe: night-side lights should now read as strings/clumps hugging coastlines with dark interiors, not an even freckle.
- [ ] **Step 8: Commit.** `git status` must show only `js/background.js`, `js/boot.mjs`, `index.html`, `tools/verify-site-hardening.js` (gate PNGs are git-ignored via Task 1's `.gitignore` line — if they show up, do NOT add them). Then:
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git add js/background.js js/boot.mjs index.html tools/verify-site-hardening.js && git commit -m "$(cat <<'EOF'
  feat(v32b): city clustering

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )"
  ```

### Task 3: Retire Rajdhani — one instrument voice (v32c)

**Files:** Modify: `js/background.js` (:1151 scan-tag font), `tools/verify-site-hardening.js` (:148–152, the wave-3 check — updated SAME commit, never deleted), `index.html` (:12 Google Fonts URL, :354 boot.mjs?v), `js/boot.mjs` (:17 V.bg). Test: `tools/verify-site-hardening.js`.
**Interfaces:** Consumes: `docs/superpowers/gates/v32/` dir (Task 1). Produces: gate screenshots `c-scantag-before.png` / `c-scantag-after.png` (owner gate-pile item 1); rewritten harness check `wave 3: transit halo + scan-and-tag are wired; scan tag speaks JetBrains Mono (Rajdhani retired, v32c)`; V.bg `4.4`; `boot.mjs?v=7`.

Verified scope: `Rajdhani` appears in exactly two repo files — `js/background.js:1151` and the fonts `<link>` at `index.html:12` (css/site.css, app.js, boot.js, cursor.js, boot.mjs: zero hits). Font-size note baked into the replacement: the Google Fonts URL ships JetBrains Mono only at 400/500 (a 600 request would synthesize-bold), and JBM's fixed-pitch advance (~0.6 em) means 26px would push the 17-char project tag (`'SIG: ' + name` sliced to 17, drawn at x=16) past the 256px canvas — 500 weight at 22px keeps it inside (16 + 17×13.2 ≈ 240px). The before/after screenshot is the owner's taste gate on exactly this.

Bloom dark-swap landmine: the scan-tag label is a canvas Sprite that is intentionally UNTAGGED and already swaps to the type-correct `darkSprite` (`SpriteMaterial`, opacity 0 — background.js:1769/1773). Changing the canvas font changes pixels, not material type. No swap change needed; do not add one.

- [ ] **Step 1: BEFORE gate screenshot (current Rajdhani tag).** Server alive per Task 2 Step 1 (restart if needed); browser tools loaded (same ToolSearch select if this is a fresh session). Navigate `http://127.0.0.1:8765/?r=c0`, `resize_page` 1440×900, boot-wait `evaluate_script`: `async () => { await new Promise(r => setTimeout(r, 5000)); return document.body.hasAttribute('data-booting'); }` → `false`. Arm the scan tag deterministically (hover is flaky; `__scanPlace` is the same code path the pointer handlers call): `evaluate_script`: `async () => { window.__scanPlace(35.6762, 139.6503, 'SHIBUYA', '渋谷'); await new Promise(r => setTimeout(r, 700)); return 'tag-armed'; }` (700 ms > the ~0.4 s particle assembly; the tag stays up until `__scanClear`). `take_screenshot` png filePath `/Users/daikieishinuki/Claude Code Projects/Personal Website/docs/superpowers/gates/v32/c-scantag-before.png` — the bracketed tag with SHIBUYA/渋谷 must be visible near the globe (top-right of the hero). If it is not, wait 2 s (globe spin) and retake.
- [ ] **Step 2: Update the harness check FIRST (red).** In `tools/verify-site-hardening.js`, Edit — old_string:
  ```js
  check('wave 3: transit halo, scan-and-tag, and Rajdhani HUD face are wired',
    /TRANSIT_LOOP/.test(background) && /tokyo-transit-loop/.test(background) &&
      /__scanPlace/.test(background) && /scan-tag-assembly/.test(background) &&
      /GALLERY_PLACES/.test(background) && /Rajdhani/.test(background) && /Rajdhani/.test(index),
    'Soliton transit loop, particle-assembled scan tags (gallery + projects), and Rajdhani must be present');
  ```
  new_string:
  ```js
  check('wave 3: transit halo + scan-and-tag are wired; scan tag speaks JetBrains Mono (Rajdhani retired, v32c)',
    /TRANSIT_LOOP/.test(background) && /tokyo-transit-loop/.test(background) &&
      /__scanPlace/.test(background) && /scan-tag-assembly/.test(background) &&
      /GALLERY_PLACES/.test(background) && /'500 22px "JetBrains Mono", monospace'/.test(background) &&
      !/Rajdhani/.test(background) && !/Rajdhani/.test(index),
    'Soliton transit loop and particle-assembled scan tags stay; Rajdhani must NOT appear anywhere — one instrument voice (JetBrains Mono)');
  ```
  Run `node tools/verify-site-hardening.js` — expect exit 1 with exactly this one check FAILING (Rajdhani still present).
- [ ] **Step 3: Swap the scan-tag font.** In `js/background.js`, Edit — old_string:
  ```js
      ctx.font = '600 26px Rajdhani, "JetBrains Mono", monospace';
  ```
  new_string:
  ```js
      /* v3.2c: one instrument voice — Rajdhani retired; JetBrains Mono (the DOM
         instrument face) takes the scan tag. 500 = heaviest weight the fonts
         link ships; 22px keeps the 17-char project tag inside the 256px canvas. */
      ctx.font = '500 22px "JetBrains Mono", monospace';
  ```
- [ ] **Step 4: Drop Rajdhani from the fonts link.** In `index.html`, Edit — old_string:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@200;400&family=JetBrains+Mono:wght@400;500&family=M+PLUS+Rounded+1c:wght@400;500&family=Rajdhani:wght@500;600&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap" rel="stylesheet" />
  ```
  new_string:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@200;400&family=JetBrains+Mono:wght@400;500&family=M+PLUS+Rounded+1c:wght@400;500&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap" rel="stylesheet" />
  ```
- [ ] **Step 5: Version bumps.** `js/boot.mjs` Edit — old_string:
  ```js
  const V = { bg: '4.3', boot: '3.1', cursor: '3.1', fx: '3.5', app: '3.4' };
  ```
  new_string:
  ```js
  const V = { bg: '4.4', boot: '3.1', cursor: '3.1', fx: '3.5', app: '3.4' };
  ```
  `index.html` Edit — old_string: `<script type="module" src="js/boot.mjs?v=6"></script>` → new_string: `<script type="module" src="js/boot.mjs?v=7"></script>` (read-current-and-increment if values drifted).
- [ ] **Step 6: Static verification (green).** `node --check js/background.js && node --check js/boot.mjs`; `node tools/verify-site-hardening.js` — ALL GREEN, same count as Task 2's end (expected 28; this task rewrites a check, adds none).
- [ ] **Step 7: Live verify + AFTER gate screenshot.** Navigate `http://127.0.0.1:8765/?r=c1`, 1440×900, boot-wait, then the same `__scanPlace` `evaluate_script` as Step 1, `take_screenshot` png filePath `/Users/daikieishinuki/Claude Code Projects/Personal Website/docs/superpowers/gates/v32/c-scantag-after.png`. `list_console_messages` — zero errors. Load `mcp__plugin_ecc_chrome-devtools__list_network_requests` via ToolSearch if not loaded and confirm the `fonts.googleapis.com/css2` request no longer contains `Rajdhani`. Eyeball the tag: EN line now monospace, must not overflow the bracket frame. Also hover a projects row (`.proj-grid`) and confirm the longer `SIG: …` tag stays inside its brackets.
- [ ] **Step 8: Commit.**
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git add js/background.js js/boot.mjs index.html tools/verify-site-hardening.js && git commit -m "$(cat <<'EOF'
  feat(v32c): Rajdhani retirement

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )"
  ```

### Task 4: Calm-the-signals leftovers (v32d)

**Files:** Modify: `js/background.js` (:3–4 header comment, :26/:36/:46 quality `streaks:` keys, :519 pingRing, :829–832 barcode ticks, :1249–1263 rain tint, :1282 ring colors, :1290–1291 ping decl, :1339–1374 sectionStories/sceneState/`__scenePing`, :1391 entry beat, :1442–1456 grid+streaks, :1621 bloom tag array, :1876–1878 interpolation, :1905 grid loop line, :1958–1968 ping branch), `js/effects.js` (:131–134 stale comment), `tools/verify-site-hardening.js` (append 1 pin), `js/boot.mjs` (:17 V.bg + V.fx), `index.html` (:354). Test: `tools/verify-site-hardening.js`.
**Interfaces:** Consumes: nothing from other tasks. Produces: `sceneState.grid` channel + `grid:` key in every `sectionStories` entry (later slices may read it); harness pin `v32d: signals calmed — streaks retired, grid story-driven and de-ambered, rain tint beat-keyed, dead ping deleted`; V.bg `4.5`; V.fx `3.6`; `boot.mjs?v=8`.

Location corrections vs the spec text (verified by grep): `window.__scenePing` is DEFINED in `js/background.js:1374` (effects.js only carries a stale comment about it); zero callers anywhere (`grep -rn "__scenePing" js/ index.html tools/` → definition + comment only). The "legacy barcode ticks" are the 9 amber `fillRect` bars drawn inside the coordinate-callout canvas (background.js:829–832), not a DOM element. There is NO harness reference to `__scenePing`, streaks, or the barcode ticks — nothing to update-in-place; we only ADD a pin.

Bloom dark-swap landmine (state of every touched material): (1) `pingRing` is currently bloom-TAGGED in the array at :1621 — deleting the object WITHOUT removing it from that array is a boot-time ReferenceError; the edit below removes both together. (2) The deleted streaks are an untagged `LineSegments` — removing an object can never create a swap bug. (3) GridHelper is an untagged `LineSegments` and already swaps to the type-correct `darkMat` via the `isMesh || o.isLine` branch (:1775) — we change its constructor colors and drive `material.opacity`, never the material type. (4) The rain tint edit changes a `PointsMaterial`'s `.color` only; depth-rain stays untagged and swaps to `darkPoints` (which writes a defined `size`) exactly as before. No new swap materials, no type changes.

Owner-taste law: pure retirement — streaks deleted, permanent amber grid lines cooled, residency-long amber rain tint becomes a ~2 s entry event, dead signal machinery removed. Amber = event holds; one signal per section-change untouched (the state-word + focus own the beat). No new idle animation (grid opacity rides the existing story easing; under reduced-motion the loop never runs and the grid keeps its static 0.2).

- [ ] **Step 1: Add the harness pin FIRST (red).** In `tools/verify-site-hardening.js`, Edit — old_string:
  ```js
  const failed = checks.filter(item => !item.pass);
  ```
  new_string:
  ```js
  check('v32d: signals calmed — streaks retired, grid story-driven and de-ambered, rain tint beat-keyed, dead ping deleted',
    !/vertical-data-streaks/.test(background) &&
      !/__scenePing/.test(background) &&
      /new THREE\.GridHelper\(160, 70, 0x1a4a5a, 0x10303a\)/.test(background) &&
      /sceneState\.grid/.test(background) &&
      /rainTintK = 1;/.test(background) &&
      !background.includes('cx.fillRect(cv.width - 128 + i * 12'),
    'streaks, dead __scenePing and the callout barcode ticks must be gone; grid centre lines cool (0x1a4a5a family) with opacity driven by sceneState.grid (near-0 in gallery); rain tint keys to the projects ENTRY beat, not residency');

  const failed = checks.filter(item => !item.pass);
  ```
  Run `node tools/verify-site-hardening.js` — expect exit 1, exactly one FAIL (the new `v32d:` pin).
- [ ] **Step 2: Delete the 40 static cyan streaks.** In `js/background.js`, Edit — old_string:
  ```js
  // ---- vertical data streaks ----
  const SN = quality.streaks; const sp = new Float32Array(SN * 6);
  for (let i = 0; i < SN; i++) {
    const x = (Math.random() - 0.5) * 60, z = -Math.random() * 50 - 5, y = (Math.random() - 0.5) * 24, len = 1 + Math.random() * 3;
    sp.set([x, y, z, x, y + len, z], i * 6);
  }
  const streakGeo = makeGeometry('vertical-data-streaks', sp, 3);
  if (!streakGeo) return;
  const streaks = nameObject(new THREE.LineSegments(streakGeo, new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending })), 'vertical-data-streaks');
  scene.add(streaks);
  ```
  new_string:
  ```js
  // v3.2d: the static vertical data streaks (40 on high tier) were retired —
  // they duplicated the starfield's job (calm-the-signals: a layer with no
  // distinct job is a layer to delete).
  ```
  Then delete the dead quality keys — three Edits. Old_string 1:
  ```js
      fieldCounts: [360, 180, 120],
      streaks: 12,
  ```
  new_string 1:
  ```js
      fieldCounts: [360, 180, 120],
  ```
  Old_string 2:
  ```js
      fieldCounts: [1100, 520, 360],
      streaks: 22,
  ```
  new_string 2:
  ```js
      fieldCounts: [1100, 520, 360],
  ```
  Old_string 3:
  ```js
      fieldCounts: [2600, 1200, 900],
      streaks: 40,
  ```
  new_string 3:
  ```js
      fieldCounts: [2600, 1200, 900],
  ```
  Then true the file header, Edit — old_string:
  ```js
   fields, synthwave grid and data-streaks frame it; scroll dollies the camera.
  ```
  new_string:
  ```js
   fields and the synthwave grid frame it; scroll dollies the camera.
  ```
- [ ] **Step 3: De-amber the grid + wire opacity into the story system.** Edit — old_string:
  ```js
  // ---- synthwave grid ----
  const grid = nameObject(new THREE.GridHelper(160, 70, AMBER, 0x10303a), 'synthwave-grid');
  ```
  new_string:
  ```js
  // ---- synthwave grid ----
  // v3.2d: centre lines de-ambered (amber is an EVENT, never wallpaper) — a
  // brighter member of the 0x10303a family keeps the axis readable; opacity
  // rides sceneState.grid (near-0 in gallery so the photographs own the frame).
  const grid = nameObject(new THREE.GridHelper(160, 70, 0x1a4a5a, 0x10303a), 'synthwave-grid');
  ```
  Add the per-section targets (mirror of halo/rain/labels/callout) — six Edits in `sectionStories`. Old/new pairs:
  ```js
      halo: 1, rain: 0.6, labels: 1, callout: 1, camera: 0,   // v3.1: hero rain calmed 1.0→0.6 — type owns the hero, weather recedes
  ```
  →
  ```js
      halo: 1, rain: 0.6, labels: 1, callout: 1, camera: 0, grid: 1,   // v3.1: hero rain calmed 1.0→0.6 — type owns the hero, weather recedes
  ```
  ```js
      halo: 0.85, rain: 0.85, labels: 0.85, callout: 1, camera: -0.2,
  ```
  →
  ```js
      halo: 0.85, rain: 0.85, labels: 0.85, callout: 1, camera: -0.2, grid: 1,
  ```
  ```js
      halo: 1.15, rain: 0.7, labels: 1, callout: 0.9, camera: 0,
  ```
  →
  ```js
      halo: 1.15, rain: 0.7, labels: 1, callout: 0.9, camera: 0, grid: 1,
  ```
  ```js
      halo: 0.45, rain: 0.35, labels: 0.35, callout: 0.35, camera: 0.15,
  ```
  →
  ```js
      halo: 0.45, rain: 0.35, labels: 0.35, callout: 0.35, camera: 0.15, grid: 0.06,
  ```
  ```js
      halo: 0.35, rain: 0.55, labels: 0.2, callout: 0.65, camera: -0.1,
  ```
  →
  ```js
      halo: 0.35, rain: 0.55, labels: 0.2, callout: 0.65, camera: -0.1, grid: 1,
  ```
  ```js
      halo: 1.25, rain: 0.8, labels: 1, callout: 1, camera: 0,
  ```
  →
  ```js
      halo: 1.25, rain: 0.8, labels: 1, callout: 1, camera: 0, grid: 1,
  ```
  Seed the channel in `sceneState` — Edit, old_string:
  ```js
    labels: sectionStories.home.labels, callout: sectionStories.home.callout,
    camera: sectionStories.home.camera,
  ```
  new_string:
  ```js
    labels: sectionStories.home.labels, callout: sectionStories.home.callout,
    camera: sectionStories.home.camera,
    grid: sectionStories.home.grid,
  ```
  Interpolate it each frame — Edit, old_string:
  ```js
    sceneState.callout += (sceneState.story.callout - sceneState.callout) * Math.min(1, 0.08 * f);
  ```
  new_string:
  ```js
    sceneState.callout += (sceneState.story.callout - sceneState.callout) * Math.min(1, 0.08 * f);
    sceneState.grid    += (sceneState.story.grid    - sceneState.grid)    * Math.min(1, 0.08 * f);
  ```
  Drive the material — Edit, old_string:
  ```js
    grid.position.z = ((t * 6 + scrollN * 70) % 4) - 2;
  ```
  new_string:
  ```js
    grid.position.z = ((t * 6 + scrollN * 70) % 4) - 2;
    grid.material.opacity = 0.2 * sceneState.grid;   // v3.2d: story-driven — near-0 in gallery
  ```
- [ ] **Step 4: Rain tint keys to the entry beat (~2 s decay), not residency.** Edit — old_string:
  ```js
    rainTintK += ((sceneState.section === 'projects' ? 1 : 0) - rainTintK) * Math.min(1, dt * 1.2);
    depthRain.layers[0].material.color.copy(RAIN_CYAN).lerp(RAIN_AMBER, rainTintK * 0.85);
  ```
  new_string:
  ```js
    // v3.2d: tint keys to the projects ENTRY beat (armed in __sceneFocus) and
    // decays over ~2s — amber is an event, never section-residency wallpaper.
    if (rainTintK > 0) rainTintK = Math.max(0, rainTintK - dt * 0.5);
    depthRain.layers[0].material.color.copy(RAIN_CYAN).lerp(RAIN_AMBER, rainTintK * 0.85);
  ```
  Arm it on entry (inside `__sceneFocus`, after the cooldown guard so scroll jitter cannot re-fire it) — Edit, old_string:
  ```js
    if (id === 'home' || id === 'contact') sceneState.lockT = 1;   // signal-lock beat
  ```
  new_string:
  ```js
    if (id === 'home' || id === 'contact') sceneState.lockT = 1;   // signal-lock beat
    if (id === 'projects') rainTintK = 1;   // v3.2d: rain warms on the ENTRY beat, ~2s decay
  ```
- [ ] **Step 5: Delete dead `__scenePing` machinery + barcode ticks.** Five Edits in `js/background.js`. (a) old_string:
  ```js
  const pingRing = tangentRing(0.3, 0.34, 0, 'tokyo-ping-ring');     // expands on section change
  ```
  new_string (empty replacement — delete the line entirely, keeping surrounding lines):
  ```js
  // v3.2d: tokyo-ping-ring deleted with the dead __scenePing machinery (zero callers since v31c).
  ```
  (b) old_string:
  ```js
  // section-change ping: scan ring flashes amber + ripple expands from Tokyo
  let ping = 0;
  let focusedPlaceId = 'tokyo';
  ```
  new_string:
  ```js
  let focusedPlaceId = 'tokyo';
  ```
  (c) old_string:
  ```js
  window.__scenePing = () => { ping = 1; };
  let storyCooldown = 0;                       // seconds; guards re-arming on scroll jitter
  ```
  new_string:
  ```js
  let storyCooldown = 0;                       // seconds; guards re-arming on scroll jitter
  ```
  (d) old_string:
  ```js
  const ringBaseC = new THREE.Color(CYAN), ringAmberC = new THREE.Color(AMBER);
  const ringMat = new THREE.MeshBasicMaterial({
  ```
  new_string:
  ```js
  const ringMat = new THREE.MeshBasicMaterial({
  ```
  (e) old_string:
  ```js
    // section-change ping: ripple expands from Tokyo, scan ring flashes amber
    if (ping > 0.01) {
      ping *= Math.pow(0.94, f);
      pingRing.scale.setScalar(1 + (1 - ping) * 2.2);
      pingRing.material.opacity = ping * 0.8;
      ringMat.color.copy(ringBaseC).lerp(ringAmberC, ping);
      ringMat.opacity = 0.16 + ping * 0.2;
    } else if (ping !== 0) {
      ping = 0; pingRing.material.opacity = 0;
      ringMat.color.copy(ringBaseC); ringMat.opacity = 0.16;
    }

  ```
  new_string (delete the whole block):
  ```js
  ```
  Remove the now-dangling bloom tag — Edit, old_string:
  ```js
    [fieldCyan, fieldAmber, tokyoRing, pingRing, comet].forEach(o => { o.userData.bloom = true; });
  ```
  new_string:
  ```js
    [fieldCyan, fieldAmber, tokyoRing, comet].forEach(o => { o.userData.bloom = true; });
  ```
  Barcode ticks — Edit, old_string:
  ```js
      cx.fillStyle = 'rgba(255, 158, 44, 0.82)';
      for (let i = 0; i < 9; i++) {
        cx.fillRect(cv.width - 128 + i * 12, 70, i % 3 === 0 ? 7 : 3, 22);
      }
      cx.restore();
  ```
  new_string:
  ```js
      // v3.2d: the 9 amber barcode ticks were retired — pure noise that floated
      // detached at hero scale and collided with the coordinate line up close.
      cx.restore();
  ```
  Finally true the stale comment in `js/effects.js` — Edit, old_string:
  ```js
    // entering a new section refocuses the scene story + flashes the state-word.
    // v3.1 (one signal per section change): the amber __scenePing ring-flash was
    // retired from this handler — focus + state-word own the beat; the ping
    // function itself stays in background.js for deck/reboot use.
  ```
  new_string:
  ```js
    // entering a new section refocuses the scene story + flashes the state-word.
    // v3.1 (one signal per section change): the amber __scenePing ring-flash was
    // retired from this handler; v3.2d deleted the dead ping machinery outright
    // (zero callers since v31c — the reserved "deck/reboot use" never landed).
  ```
- [ ] **Step 6: Version bumps.** `js/boot.mjs` Edit — old_string:
  ```js
  const V = { bg: '4.4', boot: '3.1', cursor: '3.1', fx: '3.5', app: '3.4' };
  ```
  new_string:
  ```js
  const V = { bg: '4.5', boot: '3.1', cursor: '3.1', fx: '3.6', app: '3.4' };
  ```
  (bg +0.1 for background.js, fx +0.1 for the effects.js edit; increment from current if drifted.) `index.html` Edit — old_string: `<script type="module" src="js/boot.mjs?v=7"></script>` → new_string: `<script type="module" src="js/boot.mjs?v=8"></script>`.
- [ ] **Step 7: Static verification (green).** `node --check js/background.js && node --check js/effects.js && node --check js/boot.mjs`. Then `grep -n "ping\b\|pingRing\|streaks\|streakGeo" js/background.js` — expect ZERO hits for pingRing/streaks/streakGeo and no live `ping` variable (only the v3.2d tombstone comments and unrelated words like "haloPulse" survive; check 12's `rain-layer-` and check 13's `rainShear` greps are untouched). `node tools/verify-site-hardening.js` — ALL GREEN, count +1 vs Task 3 (expected 29).
- [ ] **Step 8: Live verify.** Navigate `http://127.0.0.1:8765/?r=d1`, 1440×900, boot-wait, `list_console_messages` — zero errors (a ReferenceError here means a missed `pingRing`/`ping` reference — go back to Step 5). Hero screenshot: streaks gone (no faint vertical cyan dashes in the mid-field), grid centre lines no longer amber. Then `evaluate_script`: `() => { document.getElementById('gallery').scrollIntoView(); return 'nav'; }`, wait 2 s (`async () => { await new Promise(r => setTimeout(r, 2000)); return 'settled'; }`), screenshot: the floor grid should be effectively invisible behind the photographs. Then `evaluate_script`: `() => { window.__sceneFocus('projects'); return 'beat'; }`, screenshot immediately (nearest rain layer reads warm), wait 4 s, screenshot again (rain fully cool again — the tint is now an event, not wallpaper). Archive the hero shot as `docs/superpowers/gates/v32/d-signals-after.png` (git-ignored; per-slice section screenshots feed the end-of-pass gate review).
- [ ] **Step 9: Commit.**
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git add js/background.js js/effects.js js/boot.mjs index.html tools/verify-site-hardening.js && git commit -m "$(cat <<'EOF'
  feat(v32d): calm-the-signals leftovers

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )"
  ```

### Task 5: Black floor fidelity — dither, MSAA, live DPR (v32e)

**Files:** Modify: `js/background.js` (:1633 bloomComposer targets, :1728–1741 caPass fragment shader, :1746 finalComposer targets, :1787–1797 debounced resize handler), `tools/verify-site-hardening.js` (append 1 pin), `js/boot.mjs` (:17 V.bg), `index.html` (:354). Test: `tools/verify-site-hardening.js`.
**Interfaces:** Consumes: nothing from other tasks. Produces: harness pin `v32e: black-floor fidelity — CA-pass hash dither, MSAA composer targets, live DPR re-read`; `DPR_CAP` const in background.js; V.bg `4.6`; `boot.mjs?v=9`.

All three changes live inside the `if (bloomEnabled)` high-tier block or the shared resize handler; `bloomEnabled` requires `quality.name === 'high' && !reduced` (background.js:1611), so the LITE and reduced paths are untouched by the dither/MSAA edits, and the DPR re-read respects each tier's original cap. Vendored EffectComposer r158 verified to support this plan: `setPixelRatio(pixelRatio)` exists (js/vendor/three-0.158.0/examples/jsm/postprocessing/EffectComposer.js:212) and `renderTarget.setSize()` reallocation preserves the `.samples` instance property, so the existing resize path keeps MSAA alive. Bloom dark-swap landmine: no scene material is created or retyped here (render-target and shader-string changes only) — the swap table (:1761–1769) is untouched.

Reduced-motion law: the hash dither is a static, screen-space function of `gl_FragCoord` — zero new animation (and the whole composer chain is off under reduced anyway).

- [ ] **Step 1: Add the harness pin FIRST (red).** In `tools/verify-site-hardening.js`, Edit — old_string:
  ```js
  const failed = checks.filter(item => !item.pass);
  ```
  new_string:
  ```js
  check('v32e: black-floor fidelity — CA-pass hash dither, MSAA composer targets, live DPR re-read',
    /fract\(sin\(dot\(gl_FragCoord\.xy, vec2\(12\.9898, 78\.233\)\)\) \* 43758\.5453\) \/ 255\.0/.test(background) &&
      /renderTarget1\.samples = 4/.test(background) &&
      /renderer\.getPixelRatio\(\) !== newDpr/.test(background),
    'the final CA pass must carry the ±0.5/255 hash dither, the high-tier composer ping-pong targets must be 4x multisampled, and the debounced resize handler must re-read devicePixelRatio');

  const failed = checks.filter(item => !item.pass);
  ```
  Run `node tools/verify-site-hardening.js` — expect exit 1, exactly one FAIL (the new `v32e:` pin; note the globe reveal shader already contains a `12.9898, 78.233` hash on `position` — the pin's `gl_FragCoord.xy, vec2(` anchor cannot false-positive on it).
- [ ] **Step 2: Hash dither in the final CA pass.** In `js/background.js`, Edit — old_string:
  ```js
          float b = texture2D(tDiffuse, vUv - off).b;
          gl_FragColor = vec4(r, c.g, b, c.a);   // <-- centre alpha => undrawn stays 0
  ```
  new_string:
  ```js
          float b = texture2D(tDiffuse, vUv - off).b;
          // v3.2e: +-0.5/255 hash dither at the ONLY 8-bit quantisation point in
          // the chain (intermediate targets are HalfFloat). Deep-black gradients
          // are the worst banding case for the #05060a floor; one LSB of spatial
          // noise breaks the bands. The fixed-point canvas write clamps negatives.
          float dth = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 255.0 - 0.5 / 255.0;
          gl_FragColor = vec4(r + dth, c.g + dth, b + dth, c.a);   // <-- centre alpha => undrawn stays 0
  ```
- [ ] **Step 3: samples=4 on the high-tier composer targets.** Edit — old_string:
  ```js
    bloomComposer = new POST.EffectComposer(renderer);   // no type arg -> HalfFloatType RGBA16F LINEAR target (EffectComposer.js:27)
    bloomComposer.renderToScreen = false;
  ```
  new_string:
  ```js
    bloomComposer = new POST.EffectComposer(renderer);   // no type arg -> HalfFloatType RGBA16F LINEAR target (EffectComposer.js:27)
    /* v3.2e: renderer {antialias:true} only multisamples the DEFAULT framebuffer;
       composer passes rasterize into plain targets, so the high tier shipped
       WORSE line quality (graticule, arc, transit loop) than LITE's direct path.
       samples=4 = WebGL2 MSAA, auto-resolved on sample; EffectComposer.setSize
       reallocates targets preserving .samples, so resize keeps it. Set before
       first render — targets allocate lazily on first bind. */
    bloomComposer.renderTarget1.samples = 4;
    bloomComposer.renderTarget2.samples = 4;
    bloomComposer.renderToScreen = false;
  ```
  Edit — old_string:
  ```js
    finalComposer = new POST.EffectComposer(renderer);
    finalComposer.addPass(new POST.RenderPass(scene, camera));
  ```
  new_string:
  ```js
    finalComposer = new POST.EffectComposer(renderer);
    finalComposer.renderTarget1.samples = 4;   // v3.2e MSAA — see bloomComposer note
    finalComposer.renderTarget2.samples = 4;
    finalComposer.addPass(new POST.RenderPass(scene, camera));
  ```
- [ ] **Step 4: Re-read devicePixelRatio in the debounced resize handler.** Edit — old_string:
  ```js
  addEventListener('resize', () => {
    clearTimeout(resizeTm);
    resizeTm = setTimeout(() => {
      if (coarse && innerWidth === w && Math.abs(innerHeight - h) < 120) return;
      w = innerWidth; h = innerHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (bloomComposer) { bloomComposer.setSize(w, h); finalComposer.setSize(w, h); }
      maxScroll = Math.max(1, document.body.scrollHeight - innerHeight);
    }, 150);
  });
  ```
  new_string:
  ```js
  const DPR_CAP = reduced ? 1 : LITE ? 1.5 : 2;   // mirrors getQualityProfile's per-tier caps
  addEventListener('resize', () => {
    clearTimeout(resizeTm);
    resizeTm = setTimeout(() => {
      if (coarse && innerWidth === w && Math.abs(innerHeight - h) < 120) return;
      w = innerWidth; h = innerHeight;
      /* v3.2e: re-read devicePixelRatio — dragging the window between a Retina
         and a 1x display (or zooming) changes DPR without a reload; the boot-time
         snapshot left the canvas soft (or 4x oversized) after such a move. */
      const newDpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      if (renderer.getPixelRatio() !== newDpr) {
        renderer.setPixelRatio(newDpr);
        globeMat.uniforms.uPx.value = newDpr;   // land-particle gl_PointSize is uPx-scaled
        if (bloomComposer) { bloomComposer.setPixelRatio(newDpr); finalComposer.setPixelRatio(newDpr); }
      }
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (bloomComposer) { bloomComposer.setSize(w, h); finalComposer.setSize(w, h); }
      maxScroll = Math.max(1, document.body.scrollHeight - innerHeight);
    }, 150);
  });
  ```
- [ ] **Step 5: Version bumps.** `js/boot.mjs` Edit — old_string:
  ```js
  const V = { bg: '4.5', boot: '3.1', cursor: '3.1', fx: '3.6', app: '3.4' };
  ```
  new_string:
  ```js
  const V = { bg: '4.6', boot: '3.1', cursor: '3.1', fx: '3.6', app: '3.4' };
  ```
  `index.html` Edit — old_string: `<script type="module" src="js/boot.mjs?v=8"></script>` → new_string: `<script type="module" src="js/boot.mjs?v=9"></script>`.
- [ ] **Step 6: Static verification (green).** `node --check js/background.js && node --check js/boot.mjs`; `node tools/verify-site-hardening.js` — ALL GREEN, count +1 vs Task 4 (expected 30).
- [ ] **Step 7: Live verify.** Navigate `http://127.0.0.1:8765/?sceneDebug=1&r=e1`, 1440×900, boot-wait `evaluate_script` (5 s), `list_console_messages` — zero errors (a shader compile error would surface here as a THREE warning + black scene: recheck Step 2's GLSL verbatim). Perf gate: `evaluate_script`: `async () => { await new Promise(r => setTimeout(r, 3000)); return window.__sceneDebug().fps; }` — expect ≥ 55 (MSAA cost budget; if it tanks below ~45, report before committing). Quality eyeball: hero screenshot — graticule rings, Dallas–Tokyo arc and transit loop render without stair-stepping; slow-scroll region between sections shows no visible banding rings in the dark vignette. Then resize check: `resize_page` to 900×700, wait 1 s, `resize_page` back to 1440×900, `list_console_messages` again — still zero errors (exercises the new handler + composer `setPixelRatio`/`setSize` path). Archive a hero shot as `docs/superpowers/gates/v32/e-floor-after.png` and (optional cross-check) run `node tools/frame-luminance.mjs` on it — `mean` should sit within ±1 of Task 2's after-value: dither must not measurably brighten the floor.
- [ ] **Step 8: Commit.**
  ```bash
  cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git add js/background.js js/boot.mjs index.html tools/verify-site-hardening.js && git commit -m "$(cat <<'EOF'
  feat(v32e): dither/MSAA/DPR

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
  EOF
  )"
  ```
### Task 6: Contact return path — obfuscated SIGNAL row (v32f)

**Files:** Modify: `index.html` (contact section ~line 276; cache-bust lines ~13, ~354), `css/site.css` (insert after `.contact h2 em` rule, ~line 684), `js/app.js` (insert before `// hero variant segment`, ~line 306), `js/boot.mjs` (V.app, line 17), `tools/verify-site-hardening.js` (insert before `const failed`, ~line 165).
**Interfaces:** Consumes: gate-screenshot dir `docs/superpowers/gates/v32/` (created in Task 1, git-ignored); harness append-anchor `const failed = checks.filter(item => !item.pass);`. Produces: `.signal-row` / `.signal-k` / `.signal-addr` / `.signal-tick` markup+CSS, `[data-addr]` runtime-assembly + copy handler in app.js (Task 8 leaves them untouched; Task 10's print sheet references `.signal-row .signal-addr`).

**PLAN-TIME VERSION NOTE (applies to Tasks 6–11):** cache-bust values below show plan-authoring-time numbers (`css/site.css?v=3.20`, `js/boot.mjs?v=5`, `V = { bg: '4.2', boot: '3.1', cursor: '3.1', fx: '3.5', app: '3.4' }`). Slice-1/2 commits (v32a–e) may already have bumped some of them. Rule: ALWAYS read the current value first, then increment — `site.css?v` +0.01, `boot.mjs?v` +1 (integer), `V.*` +0.1 — and use the actual current string as your Edit `old_string`.

**LAW NOTE:** the address must NEVER appear as plaintext in any committed file — not in HTML, not in JS, not in the harness, not in a comment. It exists only as the char-code array below and is assembled at runtime. This row is sanctioned content (a return path), not a new visual layer — no retirement owed (survey lane verdict: "a single quiet line, no new visual layer").

- [ ] **Step 1: Gate "before" screenshot.** Confirm the site is served: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8765/index.html` → expect `200`; if dead: `cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && python3 -m http.server 8765 --bind 127.0.0.1 &`. Load the chrome-devtools tools via ToolSearch (`select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__resize_page,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__list_console_messages,mcp__plugin_ecc_chrome-devtools__press_key`). new_page → `http://127.0.0.1:8765/#contact`, resize 1440×900, wait for boot to finish (evaluate `!document.body.hasAttribute('data-booting')` → true), take_screenshot → `docs/superpowers/gates/v32/f-signal-row-before.png`.

- [ ] **Step 2: Add the harness pin FIRST and show it FAIL.** In `tools/verify-site-hardening.js`, Edit — old_string:
```js
const failed = checks.filter(item => !item.pass);
```
new_string:
```js
check(
  'v32f: contact return path — signal row present, address assembled at runtime only',
  (() => {
    const addr = String.fromCharCode(105, 115, 104, 105, 110, 117, 107, 105, 100, 97, 105, 107, 105, 101, 64, 105, 99, 108, 111, 117, 100, 46, 99, 111, 109);
    return /class="signal-row"/.test(index) &&
      /String\.fromCharCode/.test(app) &&
      !index.includes(addr) && !app.includes(addr) && !css.includes(addr);
  })(),
  'contact needs the SIGNAL // row; the address must be JS-assembled, never plaintext in any committed file'
);

const failed = checks.filter(item => !item.pass);
```
Run `node tools/verify-site-hardening.js` → expect exactly ONE FAIL line (`v32f: contact return path …`), exit 1.

- [ ] **Step 3: Contact markup.** In `index.html`, Edit — old_string:
```html
      <h2 data-reveal data-en="Let’s make something." data-ja="一緒に作りましょう。">Let’s make <em>something.</em></h2>
      <div class="pills" data-reveal data-reveal-delay="0.1s">
```
new_string:
```html
      <h2 data-reveal data-en="Let’s make something." data-ja="一緒に作りましょう。">Let’s make <em>something.</em></h2>
      <button class="signal-row" type="button" data-reveal data-reveal-delay="0.05s" data-cursor="copy" aria-label="Copy email address to clipboard" translate="no">
        <span class="signal-k">SIGNAL //</span>
        <span class="signal-addr" data-addr>KEY//STANDBY</span>
        <span class="signal-tick" aria-hidden="true">✓ COPIED</span>
        <span class="sr-only" role="status" data-copy-status></span>
      </button>
      <div class="pills" data-reveal data-reveal-delay="0.1s">
```
(Preserve the curly apostrophe `’` exactly. `KEY//STANDBY` is the honest no-JS placeholder; JS replaces it at boot. It is a `<button>` → keyboard-accessible by construction.)

- [ ] **Step 4: CSS in the readout/ledger idiom (~10 lines).** In `css/site.css`, Edit — old_string:
```css
.contact h2 em { font-style: normal; color: var(--cyan); }
```
new_string:
```css
.contact h2 em { font-style: normal; color: var(--cyan); }

/* v3.2f — contact return path: one instrument row in the ledger grammar. The
   address is JS-assembled (never in source); the copy tick is the amber event. */
.signal-row { display: inline-flex; align-items: baseline; gap: 14px; margin-top: clamp(30px, 4vw, 48px);
  font-family: var(--font-mono); border: 1px solid var(--line); padding: 13px 20px; cursor: none;
  transition: border-color .3s var(--ease-out), box-shadow .3s var(--ease-out); }
.signal-row:hover, .signal-row:focus-visible { border-color: var(--cyan); box-shadow: 0 0 18px rgba(57,240,255,0.25); }
.signal-row .signal-k { font-size: 10px; letter-spacing: var(--track-10); color: var(--muted); text-transform: uppercase; }
.signal-row .signal-addr { font-size: clamp(13px, 1.5vw, 16px); letter-spacing: var(--track-13); color: var(--cyan); }
.signal-row .signal-tick { font-size: 10px; letter-spacing: var(--track-10); color: var(--amber);
  opacity: 0; transition: opacity .25s; }
.signal-row.copied .signal-tick { opacity: 1; text-shadow: 0 0 10px rgba(255,158,44,0.6); }
```

- [ ] **Step 5: Copy handler in app.js.** Edit — old_string:
```js
  // hero variant segment
```
new_string:
```js
  /* ---------------- CONTACT SIGNAL ROW ----------------
     Return path (v3.2f): the address is assembled at runtime from char codes —
     by law it never appears as plaintext in any committed file. Click = copy,
     amber tick = the event. */
  const sigRow = $('.signal-row');
  if (sigRow) {
    const addr = String.fromCharCode(105, 115, 104, 105, 110, 117, 107, 105, 100, 97, 105, 107, 105, 101, 64, 105, 99, 108, 111, 117, 100, 46, 99, 111, 109);
    const addrOut = sigRow.querySelector('[data-addr]');
    const copyStatus = sigRow.querySelector('[data-copy-status]');
    if (addrOut) addrOut.textContent = addr;
    let sigTimer = null;
    const copied = () => {
      sigRow.classList.add('copied');
      if (copyStatus) copyStatus.textContent = 'Email address copied';
      clearTimeout(sigTimer);
      sigTimer = setTimeout(() => {
        sigRow.classList.remove('copied');
        if (copyStatus) copyStatus.textContent = '';
      }, 1600);
    };
    const fallbackCopy = () => {
      const ta = document.createElement('textarea');
      ta.value = addr; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { if (document.execCommand('copy')) copied(); } catch (e) {}
      document.body.removeChild(ta);
    };
    sigRow.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(copied, fallbackCopy);
      else fallbackCopy();
    });
  }

  // hero variant segment
```

- [ ] **Step 6: Cache-busts.** (a) `index.html` — old_string `<link rel="stylesheet" href="css/site.css?v=3.20" />` → new_string `<link rel="stylesheet" href="css/site.css?v=3.21" />` (use current value +0.01 if it differs). (b) `index.html` — old_string `<script type="module" src="js/boot.mjs?v=5"></script>` → new_string `<script type="module" src="js/boot.mjs?v=6"></script>` (current +1). (c) `js/boot.mjs` — old_string `app: '3.4'` → new_string `app: '3.5'` (current +0.1).

- [ ] **Step 7: Syntax + harness green.** `node --check js/app.js` and `node --check js/boot.mjs` → both silent. `node tools/verify-site-hardening.js` → ALL GREEN, total = previous all-green count + 1 (plan-time base was 22 checks before the v32 campaign; slices 1–2 added their own pins — whatever the pre-task count was, it grows by exactly one here).

- [ ] **Step 8: Live verify + gate "after".** navigate_page → `http://127.0.0.1:8765/#contact` (the bumped `?v=` forces fresh CSS/JS). Verify via evaluate_script: `document.querySelector('.signal-addr').textContent.includes('@')` → true, and `document.documentElement.outerHTML.length > 0` (sanity). Click the row (evaluate `document.querySelector('.signal-row').click()`), then evaluate `document.querySelector('.signal-row').classList.contains('copied')` → true. Keyboard path: press_key Tab until the row has focus, press_key Enter → tick again. list_console_messages → ZERO errors. Screenshot → `docs/superpowers/gates/v32/f-signal-row-after.png` (git-ignored, so the visible address never enters git). Also resize 390×844 and confirm the row doesn't overflow (it is `inline-flex`; wraps under the headline).

- [ ] **Step 9: Reduced-motion sanity.** No new animation was added (the tick is an opacity transition covered by the global kill-switch at site.css ~line 404). Confirm by re-checking the `@media (prefers-reduced-motion: reduce)` block was not touched (`git diff css/site.css | grep -c "prefers-reduced-motion"` → 0).

- [ ] **Step 10: Commit.**
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git add index.html css/site.css js/app.js js/boot.mjs tools/verify-site-hardening.js && git commit -m "feat(v32f): contact row

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 7: Real EXIF + honest alt text (v32g)

**Files:** Modify: `index.html` (12 gallery tiles, lines ~215–226; lightbox `.lb-meta` line ~292; boot.mjs?v line ~354), `js/app.js` (lb refs ~line 142, aria-label ~line 167, `show()` ~lines 196–205), `js/boot.mjs` (V.app), `tools/verify-site-hardening.js`.
**Interfaces:** Consumes: `mdls` (verified at `/usr/bin/mdls`); `GALLERY_PLACES` labels in `js/background.js` lines 1121–1134 (existing, owner-unverified — recorded debt, reused not extended). Produces: `data-title="CITY // 都市"` and `data-meta="…"` on all 12 `.shot` tiles and the `.lb-exif` span — Task 10's JSON-LD consumes these exact `data-title` values.

**Bake evidence (already run at plan time, executor re-verifies in Step 2):** only 5 of the 12 photos carry EXIF (all NIKON D5500); 7 are stripped → `EXIF//REDACTED`.

- [ ] **Step 1: Harness pin FIRST, show FAIL.** In `tools/verify-site-hardening.js`, Edit — old_string:
```js
const failed = checks.filter(item => !item.pass);
```
new_string:
```js
check(
  'v32g: gallery EXIF is real per-photo data, never the fabricated universal readout',
  !index.includes('ƒ/2.8 · 1/250s') &&
    (index.match(/data-meta="/g) || []).length === 12 &&
    /EXIF\/\/REDACTED/.test(index) &&
    (index.match(/data-title="/g) || []).length === 12 &&
    /dataset\.meta/.test(app) &&
    /class="lb-exif"/.test(index),
  'every .shot bakes data-meta from mdls (stripped files = EXIF//REDACTED) + a data-title; the lightbox meta reads dataset.meta'
);

const failed = checks.filter(item => !item.pass);
```
Run `node tools/verify-site-hardening.js` → the new check FAILs, exit 1.

- [ ] **Step 2: Verify the bake tool and re-extract (evidence step).** Run:
```bash
command -v mdls
```
→ `/usr/bin/mdls` (darwin Spotlight metadata CLI; if this ever missing, fallback is `sips -g allxml <file>` — parse `<key>FNumber</key>` etc. — but mdls is present on this machine). Then re-run the extraction to confirm the baked values below are still exact:
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && for f in images/gallery-07.jpg images/gallery-03.jpg images/gallery-08.jpg images/gallery-16.jpg images/gallery-04.jpg images/gallery-13.jpg images/gallery-01.jpg images/gallery-02.jpg images/gallery-05.jpg images/gallery-09.jpg images/gallery-10.jpg images/gallery-11.jpg; do echo "== $f"; mdls -name kMDItemFNumber -name kMDItemExposureTimeSeconds -name kMDItemISOSpeed -name kMDItemFocalLength "$f"; done
```
Expected (formatted `ƒ/N · 1/Ns · ISO N · Nmm`; `(null)` across all four keys ⇒ `EXIF//REDACTED`): gallery-03 → `ƒ/16 · 1/50s · ISO 100 · 50mm`; gallery-04 → `ƒ/10 · 1/50s · ISO 1600 · 50mm`; gallery-01 → `ƒ/10 · 1/160s · ISO 100 · 35mm`; gallery-02 → `ƒ/1.8 · 1s · ISO 100 · 50mm` (1-second exposure — real value, keep it); gallery-05 → `ƒ/1.8 · 1/100s · ISO 320 · 35mm`; gallery-07/08/16/13/09/10/11 → all null ⇒ `EXIF//REDACTED`. (Exposure formatting rule: seconds < 1 → `1/{round(1/s)}s`; ≥ 1 → `{s}s`.)

- [ ] **Step 3: Bake tiles 1–6 (Edit per tile; the `data-src` value makes each old_string unique).** In `index.html`:
  1. old `data-src="images/gallery-07.jpg" data-cursor="expand"` → new `data-src="images/gallery-07.jpg" data-title="NAGANO // 長野" data-meta="EXIF//REDACTED" data-cursor="expand"`
  2. old `data-src="images/gallery-03.jpg" data-cursor="expand"` → new `data-src="images/gallery-03.jpg" data-title="KAMAKURA // 鎌倉" data-meta="ƒ/16 · 1/50s · ISO 100 · 50mm" data-cursor="expand"`
  3. old `data-src="images/gallery-08.jpg" data-cursor="expand"` → new `data-src="images/gallery-08.jpg" data-title="FUJI // 富士" data-meta="EXIF//REDACTED" data-cursor="expand"`
  4. old `data-src="images/gallery-16.jpg" data-cursor="expand"` → new `data-src="images/gallery-16.jpg" data-title="SENDAI // 仙台" data-meta="EXIF//REDACTED" data-cursor="expand"`
  5. old `data-src="images/gallery-04.jpg" data-cursor="expand"` → new `data-src="images/gallery-04.jpg" data-title="OSAKA // 大阪" data-meta="ƒ/10 · 1/50s · ISO 1600 · 50mm" data-cursor="expand"`
  6. old `data-src="images/gallery-13.jpg" data-cursor="expand"` → new `data-src="images/gallery-13.jpg" data-title="FUKUOKA // 福岡" data-meta="EXIF//REDACTED" data-cursor="expand"`

- [ ] **Step 4: Bake tiles 7–12.**
  7. old `data-src="images/gallery-01.jpg" data-cursor="expand"` → new `data-src="images/gallery-01.jpg" data-title="HOKKAIDO // 北海道" data-meta="ƒ/10 · 1/160s · ISO 100 · 35mm" data-cursor="expand"`
  8. old `data-src="images/gallery-02.jpg" data-cursor="expand"` → new `data-src="images/gallery-02.jpg" data-title="SHIBUYA // 渋谷" data-meta="ƒ/1.8 · 1s · ISO 100 · 50mm" data-cursor="expand"`
  9. old `data-src="images/gallery-05.jpg" data-cursor="expand"` → new `data-src="images/gallery-05.jpg" data-title="KYOTO // 京都" data-meta="ƒ/1.8 · 1/100s · ISO 320 · 35mm" data-cursor="expand"`
  10. old `data-src="images/gallery-09.jpg" data-cursor="expand"` → new `data-src="images/gallery-09.jpg" data-title="DALLAS // ダラス" data-meta="EXIF//REDACTED" data-cursor="expand"`
  11. old `data-src="images/gallery-10.jpg" data-cursor="expand"` → new `data-src="images/gallery-10.jpg" data-title="ASAKUSA // 浅草" data-meta="EXIF//REDACTED" data-cursor="expand"`
  12. old `data-src="images/gallery-11.jpg" data-cursor="expand"` → new `data-src="images/gallery-11.jpg" data-title="OKINAWA // 沖縄" data-meta="EXIF//REDACTED" data-cursor="expand"`
  (Titles come verbatim from the existing `GALLERY_PLACES` map, background.js:1121–1134 — the scene already shows these on tile hover, so no NEW fabrication; owner verification of the 12 city labels stays a recorded debt.)

- [ ] **Step 5: Kill the fabricated universal EXIF in the lightbox chrome.** In `index.html`, Edit — old_string:
```html
  <div class="lb-meta" translate="no"><span class="lb-id">IMG_01</span><br />ƒ/2.8 · 1/250s<br />SELECTED ARCHIVE</div>
```
new_string:
```html
  <div class="lb-meta" translate="no"><span class="lb-id">IMG_01</span><br /><span class="lb-exif">EXIF//REDACTED</span><br />SELECTED ARCHIVE</div>
```

- [ ] **Step 6: Wire the lightbox meta + honest alt/aria in app.js.** Three Edits.
  (a) old_string:
```js
  const lbId = $('.lb-id');
```
new_string:
```js
  const lbId = $('.lb-id');
  const lbExif = $('.lb-exif');
```
  (b) old_string:
```js
  shots.forEach((s, i) => s.setAttribute('aria-label', 'View photograph ' + (i + 1) + ' full screen'));
```
new_string:
```js
  shots.forEach((s, i) => {
    const t = s.getAttribute('data-title');
    s.setAttribute('aria-label', 'View photograph ' + (i + 1) + (t ? ' — ' + t : '') + ' full screen');
  });
```
  (c) old_string:
```js
    if (lbImg) {
      lbImg.classList.add('swapping');
      setTimeout(() => {
        lbImg.src = sources[lbIndex];
        lbImg.alt = 'Gallery photograph ' + (lbIndex + 1) + ' of ' + sources.length;
        lbImg.classList.remove('swapping');
      }, 180);
    }
    if (lbPos) lbPos.textContent = String(lbIndex + 1).padStart(2, '0') + ' / ' + String(sources.length).padStart(2, '0');
    if (lbId) lbId.textContent = 'IMG_' + String(lbIndex + 1).padStart(2, '0');
```
new_string:
```js
    if (lbImg) {
      lbImg.classList.add('swapping');
      setTimeout(() => {
        lbImg.src = sources[lbIndex];
        const t = shots[lbIndex] && shots[lbIndex].getAttribute('data-title');
        lbImg.alt = (t ? t + ' — ' : '') + 'gallery photograph ' + (lbIndex + 1) + ' of ' + sources.length;
        lbImg.classList.remove('swapping');
      }, 180);
    }
    if (lbPos) lbPos.textContent = String(lbIndex + 1).padStart(2, '0') + ' / ' + String(sources.length).padStart(2, '0');
    if (lbId) lbId.textContent = 'IMG_' + String(lbIndex + 1).padStart(2, '0');
    if (lbExif) lbExif.textContent = (shots[lbIndex] && shots[lbIndex].dataset.meta) || 'EXIF//REDACTED';
```

- [ ] **Step 7: Cache-busts.** `index.html`: `js/boot.mjs?v=6` → `?v=7` (current +1). `js/boot.mjs`: `app: '3.5'` → `app: '3.6'` (current +0.1). (No site.css change this task — no css bump.)

- [ ] **Step 8: Syntax + harness.** `node --check js/app.js && node --check js/boot.mjs` → silent. `node tools/verify-site-hardening.js` → ALL GREEN, previous total + 1.

- [ ] **Step 9: Live verify + gates.** navigate_page → `http://127.0.0.1:8765/#gallery`. Gate "before" was the fabricated meta — capture it from git if wanted; the required gates: open the lightbox on tile 2 (evaluate `document.querySelectorAll('.shot')[1].click()`), verify evaluate `document.querySelector('.lb-exif').textContent` → `ƒ/16 · 1/50s · ISO 100 · 50mm`; screenshot → `docs/superpowers/gates/v32/g-exif-after.png`. Arrow-key to tile 1 (press_key ArrowLeft) → `.lb-exif` reads `EXIF//REDACTED`. Verify alt: evaluate `document.querySelector('.lb-img').alt` contains `KAMAKURA`/`NAGANO` per position, and `document.querySelectorAll('.shot')[0].getAttribute('aria-label')` → `View photograph 1 — NAGANO // 長野 full screen`. Confirm the scene scan-tag still fires on tile hover (it keys off `data-src`, untouched — background.js ~line 1234). list_console_messages → ZERO errors.

- [ ] **Step 10: Commit.**
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git add index.html js/app.js js/boot.mjs tools/verify-site-hardening.js && git commit -m "feat(v32g): EXIF truth

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 8: Keyboard/ARIA truth + tokenized z-ladder (v32h)

**Files:** Modify: `css/site.css` (`:root` ~line 44; z-index sites at lines ~93, 110, 195, 242, 300, 351, 372, 652, 715, 722; hover selectors at ~267–269, 543–544, 557, 569, 573, 632, 643, 649), `index.html` (scroll-hud lines ~92–99, lightbox ~291, deck-toggle ~310, deck ~313, cache-busts), `js/app.js` (openLb/closeLb ~215–231, Tab trap ~238–251, menu keydown ~282, setDeck ~287–293), `js/boot.mjs` (V.app), `tools/verify-site-hardening.js`.
**Interfaces:** Consumes: nothing new. Produces: the SHARED z-ladder tokens `--z-scene, --z-content, --z-nav, --z-scrollhud, --z-menu, --z-deck, --z-lightbox, --z-boot` in `:root` (exact names — other slices reference them), `trapTab()` helper in app.js, `inert` wiring on `.lightbox`/`.deck`.

**Current z-index census (css/site.css, verified):** `#scene-root` 0 (:93) · `.scene-atmosphere` 0 (:110) · `main` 1 (:372) · `.frame-hud` 88 (:140) · `.scroll-hud` 95 (:351) · `.nav` 100 (:242) · `.scroll-progress` 101 (:365) · `.state-flash` 180 (:618) · `.deck-toggle` 200 (:715) · `.deck` 200 (:722) · `.scene-debug` 220 (:97) · `.boot` **9000** (:195) · `.mobile-menu` 9300 (:300) · `.lightbox` **9500** (:652) · `.cursor` 9998 (:156) · `.cursor-label` 9998 (:180) · `.cursor-dot` 9999 (:165) · `.skip-link` 9999 (:774) · local stacking-only values left alone: `.mm-head/.mm-links/.mm-foot` 1, `.clip-reveal::after` 2. **The defect:** boot 9000 < lightbox 9500 — deck "↻ Reboot sequence" fired with the lightbox open plays the boot UNDER it. Ladder maps the 8 named surfaces onto their current values, boot moves to 9600 (above lightbox, still below cursor/skip-link). `frame-hud`/`scroll-progress`/`state-flash`/`scene-debug`/cursor/skip-link stay hardcoded by design (outside the 8-token shared interface).

- [ ] **Step 1: Harness pin FIRST, show FAIL.** In `tools/verify-site-hardening.js`, Edit — old_string:
```js
const failed = checks.filter(item => !item.pass);
```
new_string:
```js
check(
  'v32h: z-ladder tokens exist, boot outranks the lightbox, closed overlays are inert',
  (() => {
    const g = n => { const m = css.match(new RegExp('--z-' + n + ':\\s*(\\d+)')); return m ? parseInt(m[1], 10) : NaN; };
    const order = g('scene') < g('content') && g('content') < g('scrollhud') && g('scrollhud') < g('nav') &&
      g('nav') < g('deck') && g('deck') < g('menu') && g('menu') < g('lightbox') && g('lightbox') < g('boot');
    return order && /class="lightbox"[^>]*\binert\b/.test(index) && /class="deck"[^>]*\binert\b/.test(index) &&
      /lb\.inert/.test(app) && /deck\.inert/.test(app) && /trapTab/.test(app) &&
      !/<div class="deck"[^>]*aria-modal/.test(index);
  })(),
  'the --z-* ladder must exist with boot above lightbox; closed lightbox/deck must be inert; deck uses disclosure semantics'
);

const failed = checks.filter(item => !item.pass);
```
Run `node tools/verify-site-hardening.js` → new check FAILs, exit 1.

- [ ] **Step 2: Define the ladder tokens.** In `css/site.css`, Edit — old_string:
```css
  --shell: min(1440px, 100%);
}
```
new_string:
```css
  --shell: min(1440px, 100%);

  /* v3.2h — tokenized z-ladder (fixed stack law). Values preserve the working
     order except boot, which now outranks the lightbox (confirmed defect: deck
     "Reboot sequence" fired under an open lightbox played the boot underneath).
     Cursor (9998/9999) and skip-link (9999) deliberately stay topmost, hardcoded. */
  --z-scene: 0;
  --z-content: 1;
  --z-scrollhud: 95;
  --z-nav: 100;
  --z-deck: 200;
  --z-menu: 9300;
  --z-lightbox: 9500;
  --z-boot: 9600;
}
```

- [ ] **Step 3: Swap hardcoded z-indexes for tokens (7 small Edits).**
  (a) old `#scene-root {\n  position: fixed; inset: 0; z-index: 0; pointer-events: none;` → new `#scene-root {\n  position: fixed; inset: 0; z-index: var(--z-scene); pointer-events: none;`
  (b) In the `.scene-atmosphere` block, old `  inset: 0;\n  z-index: 0;` → new `  inset: 0;\n  z-index: var(--z-scene);`
  (c) old `main { position: relative; z-index: 1; transition: opacity 1s var(--ease-out); }` → new `main { position: relative; z-index: var(--z-content); transition: opacity 1s var(--ease-out); }`
  (d) old `  position: fixed; top: 0; left: 0; right: 0; z-index: 100;` → new `  position: fixed; top: 0; left: 0; right: 0; z-index: var(--z-nav);`
  (e) old `  position: fixed; top: 50%; right: 18px; transform: translateY(-50%); z-index: 95;` → new `  position: fixed; top: 50%; right: 18px; transform: translateY(-50%); z-index: var(--z-scrollhud);`
  (f) old `.mobile-menu { position: fixed; inset: 0; z-index: 9300; background: rgba(3,4,7,0.97);` → new `.mobile-menu { position: fixed; inset: 0; z-index: var(--z-menu); background: rgba(3,4,7,0.97);`
  (g) old `  position: fixed; inset: 0; z-index: 9000; background: var(--void-deep);` → new `  position: fixed; inset: 0; z-index: var(--z-boot); background: var(--void-deep);`
  (h) old `.deck-toggle { position: fixed; bottom: 22px; left: 22px; z-index: 200; width: 42px; height: 42px;` → new `.deck-toggle { position: fixed; bottom: 22px; left: 22px; z-index: var(--z-deck); width: 42px; height: 42px;`

- [ ] **Step 4: Lightbox + deck get `visibility` (kills ~22 ghost tab stops) — two Edits.**
  (a) old_string:
```css
.lightbox { position: fixed; inset: 0; z-index: 9500; background: rgba(2,3,6,0.96);
  backdrop-filter: blur(8px); display: flex; flex-direction: column; opacity: 0; pointer-events: none;
  transition: opacity .4s var(--ease-out); }
.lightbox.open { opacity: 1; pointer-events: auto; }
```
new_string:
```css
.lightbox { position: fixed; inset: 0; z-index: var(--z-lightbox); background: rgba(2,3,6,0.96);
  backdrop-filter: blur(8px); display: flex; flex-direction: column; opacity: 0; pointer-events: none;
  visibility: hidden;
  transition: opacity .4s var(--ease-out), visibility 0s linear .4s; }
.lightbox.open { opacity: 1; pointer-events: auto; visibility: visible;
  transition: opacity .4s var(--ease-out), visibility 0s; }
```
  (b) old_string:
```css
.deck { position: fixed; bottom: 74px; left: 22px; z-index: 200; width: 250px;
  background: var(--panel-solid); backdrop-filter: blur(12px); border: 1px solid var(--line-strong);
  padding: 16px; transform: translateY(12px) scale(0.96); opacity: 0; pointer-events: none;
  transition: .3s var(--ease-out); }
.deck.open { transform: none; opacity: 1; pointer-events: auto; }
```
new_string:
```css
.deck { position: fixed; bottom: 74px; left: 22px; z-index: var(--z-deck); width: 250px;
  background: var(--panel-solid); backdrop-filter: blur(12px); border: 1px solid var(--line-strong);
  padding: 16px; transform: translateY(12px) scale(0.96); opacity: 0; pointer-events: none;
  visibility: hidden;
  transition: opacity .3s var(--ease-out), transform .3s var(--ease-out), visibility 0s linear .3s; }
.deck.open { transform: none; opacity: 1; pointer-events: auto; visibility: visible;
  transition: opacity .3s var(--ease-out), transform .3s var(--ease-out), visibility 0s; }
```
(The visibility-delay pattern mirrors `.mobile-menu`, site.css :300–306. The mobile menu already has `visibility: hidden` — no change needed there.)

- [ ] **Step 5: `:focus-visible` parity on every hover-only acquisition selector (6 Edits in css/site.css).** (`.shot:focus-visible .media` at :639 ALREADY exists — leave it.)
  (a) old `.nav-link:hover, .nav-link.active { color: var(--cyan); }` → new `.nav-link:hover, .nav-link:focus-visible, .nav-link.active { color: var(--cyan); }`
  (b) old:
```css
.nav-link:hover::before, .nav-link.active::before,
.nav-link:hover::after, .nav-link.active::after { opacity: 0.8; transform: translateX(0); }
```
new:
```css
.nav-link:hover::before, .nav-link:focus-visible::before, .nav-link.active::before,
.nav-link:hover::after, .nav-link:focus-visible::after, .nav-link.active::after { opacity: 0.8; transform: translateX(0); }
```
  (c) old:
```css
.row:hover::before { transform: scaleX(1); }
.row:hover { background: linear-gradient(90deg, rgba(57,240,255,0.04), transparent 70%); }
```
new:
```css
.row:hover::before, .row:focus-visible::before { transform: scaleX(1); }
.row:hover, .row:focus-visible { background: linear-gradient(90deg, rgba(57,240,255,0.04), transparent 70%); }
```
  (d) old `.row:hover .row-title { color: var(--cyan); text-shadow: 0 0 24px rgba(57,240,255,0.4); }` → new `.row:hover .row-title, .row:focus-visible .row-title { color: var(--cyan); text-shadow: 0 0 24px rgba(57,240,255,0.4); }`
  (e) old `.row:hover .tag { border-color: var(--line-strong); }` → new `.row:hover .tag, .row:focus-visible .tag { border-color: var(--line-strong); }` AND old `.row:hover .row-arrow { transform: translate(4px, -4px); }` → new `.row:hover .row-arrow, .row:focus-visible .row-arrow { transform: translate(4px, -4px); }`
  (f) old `.shot:hover { border-color: var(--cyan); box-shadow: 0 0 30px rgba(57,240,255,0.22); }` → new `.shot:hover, .shot:focus-visible { border-color: var(--cyan); box-shadow: 0 0 30px rgba(57,240,255,0.22); }` AND old `.shot:hover .sweep { opacity: 1; animation: shotScan 1.4s linear infinite; }` → new `.shot:hover .sweep, .shot:focus-visible .sweep { opacity: 1; animation: shotScan 1.4s linear infinite; }` AND old `.shot:hover .id, .shot:hover .plus { opacity: 0.95; transform: translateY(0); }` → new `.shot:hover .id, .shot:focus-visible .id, .shot:hover .plus, .shot:focus-visible .plus { opacity: 0.95; transform: translateY(0); }`
  (Work rows are `<article>` — not focusable, `:focus-visible` is inert on them; projects rows are `<a class="row">` — this is where keyboard parity lands.)

- [ ] **Step 6: index.html markup truth (3 Edits + scroll-hud block).**
  (a) old `<div class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" aria-hidden="true">` → new `<div class="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" aria-hidden="true" inert>`
  (b) deck loses the false `aria-modal`/dialog role → disclosure semantics (it's a non-modal panel toggled by an `aria-expanded` button): old `<div class="deck" role="dialog" aria-modal="true" aria-label="Control deck" aria-hidden="true">` → new `<div class="deck" id="deck" role="group" aria-label="Control deck" aria-hidden="true" inert>`
  (c) old `<button class="deck-toggle" aria-label="Open control deck" aria-expanded="false" data-cursor="tweak">` → new `<button class="deck-toggle" aria-controls="deck" aria-label="Open control deck" aria-expanded="false" data-cursor="tweak">`
  (d) scroll-hud links are inside an `aria-hidden="true"` container yet remain real tab stops — old_string:
```html
<div class="scroll-hud" aria-hidden="true">
  <a href="#home" data-sec="home"><span class="lbl">Home</span><span class="tick"></span></a>
  <a href="#about" data-sec="about"><span class="lbl">About</span><span class="tick"></span></a>
  <a href="#work" data-sec="work"><span class="lbl">Work</span><span class="tick"></span></a>
  <a href="#gallery" data-sec="gallery"><span class="lbl">Gallery</span><span class="tick"></span></a>
  <a href="#projects" data-sec="projects"><span class="lbl">Projects</span><span class="tick"></span></a>
  <a href="#contact" data-sec="contact"><span class="lbl">Contact</span><span class="tick"></span></a>
</div>
```
new_string:
```html
<div class="scroll-hud" aria-hidden="true">
  <a href="#home" data-sec="home" tabindex="-1"><span class="lbl">Home</span><span class="tick"></span></a>
  <a href="#about" data-sec="about" tabindex="-1"><span class="lbl">About</span><span class="tick"></span></a>
  <a href="#work" data-sec="work" tabindex="-1"><span class="lbl">Work</span><span class="tick"></span></a>
  <a href="#gallery" data-sec="gallery" tabindex="-1"><span class="lbl">Gallery</span><span class="tick"></span></a>
  <a href="#projects" data-sec="projects" tabindex="-1"><span class="lbl">Projects</span><span class="tick"></span></a>
  <a href="#contact" data-sec="contact" tabindex="-1"><span class="lbl">Contact</span><span class="tick"></span></a>
</div>
```

- [ ] **Step 7: app.js — inert toggles in the SAME functions that toggle aria-hidden (3 Edits).**
  (a) old_string:
```js
  function openLb(i) {
    if (!lb) return;
    lbReturnFocus = document.activeElement;
    show(i);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const c = $('.lb-close'); if (c) c.focus();
  }
  function closeLb() {
    if (!lb) return;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
    lbReturnFocus = null;
  }
```
new_string:
```js
  function openLb(i) {
    if (!lb) return;
    lbReturnFocus = document.activeElement;
    show(i);
    lb.inert = false;                       // un-inert BEFORE moving focus in
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const c = $('.lb-close'); if (c) c.focus();
  }
  function closeLb() {
    if (!lb) return;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    lb.inert = true;
    document.body.style.overflow = '';
    if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
    lbReturnFocus = null;
  }
```
  (b) old_string:
```js
  function setDeck(open) {
    if (!deck || !deckToggle) return;
    deck.classList.toggle('open', open);
    deck.setAttribute('aria-hidden', open ? 'false' : 'true');
    deckToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    deckToggle.setAttribute('aria-label', open ? 'Close control deck' : 'Open control deck');
  }
```
new_string:
```js
  function setDeck(open) {
    if (!deck || !deckToggle) return;
    deck.inert = !open;
    deck.classList.toggle('open', open);
    deck.setAttribute('aria-hidden', open ? 'false' : 'true');
    deckToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    deckToggle.setAttribute('aria-label', open ? 'Close control deck' : 'Open control deck');
  }
```

- [ ] **Step 8: Generalize the Tab trap to the mobile menu (2 Edits in app.js).**
  (a) old_string:
```js
  addEventListener('keydown', e => {
    if (!lb || !lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') show(lbIndex - 1);
    else if (e.key === 'ArrowRight') show(lbIndex + 1);
    else if (e.key === 'Tab') {
      // trap Tab inside the open lightbox
      const f = [...lb.querySelectorAll('button')].filter(b => b.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
```
new_string:
```js
  /* Tab trap shared by every fullscreen overlay (lightbox + mobile menu):
     cycle focus among the container's visible interactive elements. */
  function trapTab(container, e) {
    const f = [...container.querySelectorAll('button, a[href]')].filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  addEventListener('keydown', e => {
    if (!lb || !lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') show(lbIndex - 1);
    else if (e.key === 'ArrowRight') show(lbIndex + 1);
    else if (e.key === 'Tab') trapTab(lb, e);
  });
```
  (b) old_string:
```js
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false); });
```
new_string:
```js
  addEventListener('keydown', e => {
    if (!document.body.classList.contains('menu-open')) return;
    if (e.key === 'Escape') setMenu(false);
    else if (e.key === 'Tab' && mmenu) trapTab(mmenu, e);
  });
```
  (Note: `trapTab` is declared as a function statement before the lightbox keydown listener; the menu listener at ~line 282 runs later in source, so hoisting is not even needed. `inert` is a no-op attribute in very old engines — `aria-hidden` + `visibility:hidden` still cover them.)

- [ ] **Step 9: Cache-busts.** `index.html`: `css/site.css?v=3.21` → `?v=3.22` and `js/boot.mjs?v=7` → `?v=8` (current values +0.01/+1). `js/boot.mjs`: `app: '3.6'` → `app: '3.7'`.

- [ ] **Step 10: Syntax + harness.** `node --check js/app.js && node --check js/boot.mjs` → silent. `node tools/verify-site-hardening.js` → ALL GREEN, previous total + 1. (Existing checks 3–4 still pass: `class="deck"` + `aria-hidden="true"` and the setAttribute patterns were preserved.)

- [ ] **Step 11: Live verify — the three defects, dead.** navigate_page → `http://127.0.0.1:8765/` (fresh `?v=`).
  (1) Ghost tab stops: evaluate
```js
(() => { const ids = []; let el = document.body; const all = [...document.querySelectorAll('.lightbox button, .deck button, .scroll-hud a')]; return all.every(b => b.closest('[inert]') !== null || b.tabIndex === -1); })()
```
→ true (all lightbox/deck controls sit inside an inert container; scroll-hud links are tabindex -1).
  (2) Boot-over-lightbox: evaluate `getComputedStyle(document.querySelector('.lightbox')).zIndex` → `9500`, and `getComputedStyle(document.documentElement).getPropertyValue('--z-boot').trim()` → `9600`. Functional check: open a shot, then click deck-toggle → "↻ Reboot sequence" (evaluate the clicks); screenshot → `docs/superpowers/gates/v32/h-boot-over-lightbox-after.png` — the boot screen must cover the lightbox.
  (3) Focus parity: press_key Tab until a `.shot` is focused; screenshot → `docs/superpowers/gates/v32/h-focus-parity-after.png` (tile shows border/ID/plus acquisition, not just the outline). Open the mobile menu at 390×844 (resize, click burger), Tab repeatedly → focus must cycle inside the menu (evaluate `document.activeElement.closest('.mobile-menu') !== null`).
  list_console_messages → ZERO errors. Also verify at 1440×900 AND 390×844 that nothing visually moved (z values unchanged except boot).

- [ ] **Step 12: Commit.**
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git add index.html css/site.css js/app.js js/boot.mjs tools/verify-site-hardening.js && git commit -m "feat(v32h): keyboard/ARIA + z-ladder

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 9: lang truth + JP display headlines (v32i)

**Files:** Modify: `index.html` (JP fragments at lines ~63, 78–83, 87, 106, 140, 158, 209, 235, 284, 327; cache-busts), `js/app.js` (`applyLang` ~lines 127–128), `css/site.css` (after the `html[lang="ja"] .contact h2` rule ~line 699), `js/boot.mjs` (V.app), `tools/verify-site-hardening.js`.
**Interfaces:** Consumes: `applyLang()`'s existing `[data-en]/[data-ja]` swap mechanism (app.js:116–133) and `--font-ja-hero` (site.css:31, Zen Kaku Gothic New — already loaded via the fonts link). Produces: `html[lang="ja"] .heading-xl` rule; `data-ja` entries `作品`/`レンズ越しに`/`代表作` on the three display headlines; dynamic lang-toggle `aria-label`. Task 11 consumes this task's decision that the footer `.coord` carries `lang="ja"` on the WHOLE span (no child wrapper — Task 11's scramble flattens children).

**JP text-node census (index.html, verified):** always-JP-visible fragments needing `lang="ja"`: nav-meta `東京` (:63), six `.mm-ja` spans (:78–83), `.mm-coord` `東京` (:87), hero-kicker span (:106, majority-JP in both modes), About stat `東京` (:140), footer `.coord` (:284), deck `日本語` button (:327). The `data-ja` swap texts are covered globally because `applyLang` already sets `document.documentElement.lang` (app.js:129).

- [ ] **Step 1: Harness pin FIRST, show FAIL.** In `tools/verify-site-hardening.js`, Edit — old_string:
```js
const failed = checks.filter(item => !item.pass);
```
new_string:
```js
check(
  'v32i: JP fragments carry lang="ja" and display headlines full-translate',
  (index.match(/lang="ja"/g) || []).length >= 10 &&
    /<h2 class="heading-xl"[^>]*data-ja="作品"/.test(index) &&
    /data-ja="レンズ越しに"/.test(index) &&
    /data-ja="代表作"/.test(index) &&
    /Switch to Japanese/.test(app) &&
    /html\[lang="ja"\] \.heading-xl/.test(css),
  'always-JP text nodes need lang="ja"; Work/Through the lens/Selected Work translate via data-ja; the toggle label announces its target'
);

const failed = checks.filter(item => !item.pass);
```
Run `node tools/verify-site-hardening.js` → FAIL, exit 1.

- [ ] **Step 2: Gate "before" screenshot (EN headlines).** navigate_page → `http://127.0.0.1:8765/#gallery`, 1440×900, screenshot → `docs/superpowers/gates/v32/i-jp-headlines-before.png`.

- [ ] **Step 3: `lang="ja"` on the 12 static JP fragments (Edits in index.html).**
  (a) old `      <span>TOKYO // 東京</span>` → new `      <span>TOKYO // <span lang="ja">東京</span></span>`
  (b–g) six mm-ja spans: old `<span class="mm-ja">ホーム</span>` → new `<span class="mm-ja" lang="ja">ホーム</span>`; likewise for `概要`, `経歴`, `写真`, `制作`, `連絡` (each old_string is unique).
  (h) old `    <span class="mm-coord" translate="no">35.6762° N, 139.6503° E — TOKYO // 東京</span>` → new `    <span class="mm-coord" translate="no">35.6762° N, 139.6503° E — TOKYO // <span lang="ja">東京</span></span>`
  (i) old `      <span data-en="開発者 / 写真家 — Tokyo, Japan" data-ja="開発者 / 写真家 — 東京, 日本">開発者 / 写真家 — Tokyo, Japan</span>` → new `      <span lang="ja" data-en="開発者 / 写真家 — Tokyo, Japan" data-ja="開発者 / 写真家 — 東京, 日本">開発者 / 写真家 — Tokyo, Japan</span>`
  (j) old `<div class="n">東京</div>` → new `<div class="n" lang="ja">東京</div>`
  (k) footer coord — whole-span lang (NO child wrapper; Task 11 scrambles this element's textContent): old `        <span class="coord" translate="no">35.6762° N, 139.6503° E — 東京</span>` → new `        <span class="coord" translate="no" lang="ja">35.6762° N, 139.6503° E — 東京</span>`
  (l) old `      <button data-val="ja" data-cursor="set">日本語</button>` → new `      <button data-val="ja" data-cursor="set" lang="ja">日本語</button>`

- [ ] **Step 4: Full-translate the three display headlines (3 Edits in index.html).**
  (a) old `<h2 class="heading-xl" data-reveal>Work</h2>` → new `<h2 class="heading-xl" data-reveal data-en="Work" data-ja="作品">Work</h2>`
  (b) old `<h2 class="heading-xl" data-reveal style="margin-bottom:0">Through the lens</h2>` → new `<h2 class="heading-xl" data-reveal style="margin-bottom:0" data-en="Through the lens" data-ja="レンズ越しに">Through the lens</h2>`
  (c) old `<h2 class="heading-xl" data-reveal>Selected Work</h2>` → new `<h2 class="heading-xl" data-reveal data-en="Selected Work" data-ja="代表作">Selected Work</h2>`
  (The existing `applyLang` picks these up automatically — it queries `[data-en]` and scrambles to the JA string; no JS change needed for the swap itself.)

- [ ] **Step 5: JP metrics for the headline face.** The Latin `.heading-xl` recipe (weight 200, negative tracking, 0.92 leading — site.css:533) is wrong for kanji. In `css/site.css`, Edit — old_string:
```css
html[lang="ja"] .contact h2 {
  font-family: var(--font-ja-hero); font-weight: 700;
  letter-spacing: 0.02em; line-height: 1.15;
}
```
new_string:
```css
html[lang="ja"] .contact h2 {
  font-family: var(--font-ja-hero); font-weight: 700;
  letter-spacing: 0.02em; line-height: 1.15;
}
html[lang="ja"] .heading-xl {
  font-family: var(--font-ja-hero); font-weight: 700;
  letter-spacing: 0.02em; line-height: 1.1;
}
```
(Zen Kaku Gothic New is already loaded — `--font-ja-hero`, site.css:31 — and this mirrors the sanctioned L5 pattern directly above it.)

- [ ] **Step 6: Dynamic toggle-label semantics in app.js.** Edit — old_string:
```js
    const btn = $('.lang-btn .swap');
    if (btn) btn.textContent = lang === 'en' ? 'EN / 日本' : '日本 / EN';
```
new_string:
```js
    const btn = $('.lang-btn .swap');
    if (btn) btn.textContent = lang === 'en' ? 'EN / 日本' : '日本 / EN';
    const langBtn = $('.lang-btn');
    if (langBtn) {
      // the label announces the TARGET language, in that language
      langBtn.setAttribute('aria-label', lang === 'en' ? 'Switch to Japanese' : '英語に切り替える');
      langBtn.setAttribute('lang', lang === 'en' ? 'en' : 'ja');
    }
```

- [ ] **Step 7: Cache-busts.** `index.html`: `css/site.css?v=3.22` → `?v=3.23`, `js/boot.mjs?v=8` → `?v=9` (current +0.01/+1). `js/boot.mjs`: `app: '3.7'` → `app: '3.8'`.

- [ ] **Step 8: Syntax + harness.** `node --check js/app.js && node --check js/boot.mjs` → silent. `node tools/verify-site-hardening.js` → ALL GREEN, previous total + 1.

- [ ] **Step 9: Live verify + gate "after" (OWNER WORDING GATE).** navigate_page → `http://127.0.0.1:8765/`, click the lang toggle (evaluate `document.querySelector('.lang-btn').click()`), then evaluate `document.documentElement.lang` → `ja` and `[...document.querySelectorAll('.heading-xl')].map(h => h.textContent)` → `["作品","レンズ越しに","代表作"]` (allow a beat for the scramble to settle). Verify the headlines render in Zen Kaku (evaluate `getComputedStyle(document.querySelector('.gallery .heading-xl')).fontFamily` contains `Zen Kaku Gothic New`). Screenshot each translated headline section at 1440×900 → `docs/superpowers/gates/v32/i-jp-headlines-after.png` (this is spec gate #5 — FINAL WORDING IS THE OWNER'S CALL at the gate review; note in the gate pile that nav `Work=作品` vs sec-label `作品 / 経歴` coexist by design). Toggle back to EN, confirm headlines return. Verify `document.querySelector('.lang-btn').getAttribute('aria-label')` flips between the two labels. list_console_messages → ZERO errors. Reduced-motion note: the swap uses the existing `scramble` which no-ops to instant text under `prefers-reduced-motion` (effects.js:28) — no new animation added.

- [ ] **Step 10: Commit.**
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git add index.html css/site.css js/app.js js/boot.mjs tools/verify-site-hardening.js && git commit -m "feat(v32i): lang + JP headlines

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 10: Beyond the viewport — meta/og/404/noscript/print/JSON-LD/fonts (v32j)

**Files:** Create: `tools/og-board.html`, `404.html`, `images/og.png` (baked), `images/apple-touch-icon.png` (baked), `fonts/hanken-grotesk-latin.woff2`, `fonts/jetbrains-mono-latin.woff2`. Modify: `index.html` (head ~lines 8–13, body-end script ~line 352, JSON-LD before import-map ~line 339), `css/site.css` (@font-face at top; `@media print` at end), `docs/superpowers/specs/2026-07-08-v32-law-addendum.md` (one appended line), `tools/verify-site-hardening.js`.
**Interfaces:** Consumes: Task 7's `data-title` values (JSON-LD names); law addendum doc (Task 1); canonical base URL `https://ishinuki-moncion.github.io/Personal-Website-3.0/` (GitHub Pages, verified via `gh api repos/Ishinuki-Moncion/Personal-Website-3.0/pages`). Produces: og/canonical/twitter meta block, boot watchdog (inline, OUTSIDE the module chain), print sheet, ImageObject JSON-LD, self-hosted Latin @font-face. No boot-chain JS is touched → no `boot.mjs?v`/V.* bump this task; site.css changes → css bump only.

- [ ] **Step 1: Harness pin FIRST, show FAIL.** In `tools/verify-site-hardening.js`, Edit — old_string:
```js
const failed = checks.filter(item => !item.pass);
```
new_string:
```js
check(
  'v32j: the world beyond the viewport is real (meta/og/404/noscript/watchdog/print/JSON-LD/fonts)',
  (() => {
    const exists = f => fs.existsSync(path.join(root, f));
    return /property="og:image"/.test(index) && /rel="canonical"/.test(index) &&
      /name="twitter:card"/.test(index) && /rel="apple-touch-icon"/.test(index) &&
      /<noscript>/.test(index) && /application\/ld\+json/.test(index) &&
      /setTimeout\(reveal, 10000\)/.test(index) &&
      exists('404.html') && fs.readFileSync(path.join(root, '404.html'), 'utf8').includes('SIGNAL LOST // 404') &&
      exists('images/og.png') && exists('images/apple-touch-icon.png') &&
      /@media print/.test(css) && /@font-face/.test(css) &&
      exists('fonts/hanken-grotesk-latin.woff2') && exists('fonts/jetbrains-mono-latin.woff2') &&
      !/family=Hanken\+Grotesk/.test(index) && !/family=JetBrains\+Mono/.test(index);
  })(),
  'share/crawl/no-JS/print surfaces must exist; Latin faces self-hosted (JP faces stay on CDN — recorded law exception)'
);

const failed = checks.filter(item => !item.pass);
```
Run `node tools/verify-site-hardening.js` → FAIL, exit 1 (stays red until Step 11).

- [ ] **Step 2: Head meta block.** In `index.html`, Edit — old_string:
```html
<meta name="theme-color" content="#05060a" />
<link rel="icon" href="favicon.svg" type="image/svg+xml" />
```
new_string:
```html
<meta name="theme-color" content="#05060a" />
<link rel="canonical" href="https://ishinuki-moncion.github.io/Personal-Website-3.0/" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="daikieOS" />
<meta property="og:title" content="Ishinuki Daikie — Developer &amp; Photographer" />
<meta property="og:description" content="Ishinuki Daikie — software developer and photographer based in Tokyo, Japan." />
<meta property="og:url" content="https://ishinuki-moncion.github.io/Personal-Website-3.0/" />
<meta property="og:image" content="https://ishinuki-moncion.github.io/Personal-Website-3.0/images/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="daikieOS — Ishinuki Daikie, developer and photographer, Tokyo" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Ishinuki Daikie — Developer &amp; Photographer" />
<meta name="twitter:description" content="Software developer and photographer based in Tokyo, Japan." />
<meta name="twitter:image" content="https://ishinuki-moncion.github.io/Personal-Website-3.0/images/og.png" />
<link rel="apple-touch-icon" href="images/apple-touch-icon.png" />
<link rel="icon" href="favicon.svg" type="image/svg+xml" />
```

- [ ] **Step 3: The og art-board.** Write `tools/og-board.html` with EXACTLY this content (a capture tool, not a site page — CDN fonts allowed here; tokens hand-mirrored from css/site.css):
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>og-board — daikieOS share-card art (capture source; not linked from the site)</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@200;400&family=JetBrains+Mono:wght@400;500&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap" rel="stylesheet" />
<style>
  /* tokens mirrored from css/site.css :root — keep in sync by hand */
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body { position: relative; background: #05060a; color: #e9f1f4; font-family: 'Hanken Grotesk', system-ui, sans-serif; }
  .grid { position: absolute; inset: 0; opacity: 0.5; background-image:
      linear-gradient(rgba(57,240,255,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(57,240,255,0.05) 1px, transparent 1px);
    background-size: 44px 44px;
    -webkit-mask-image: radial-gradient(circle at 32% 46%, #000 10%, transparent 72%);
    mask-image: radial-gradient(circle at 32% 46%, #000 10%, transparent 72%); }
  .frame span { position: absolute; width: 30px; height: 30px; border: 1px solid rgba(57,240,255,0.36); }
  .frame .tl { top: 34px; left: 34px; border-right: 0; border-bottom: 0; }
  .frame .tr { top: 34px; right: 34px; border-left: 0; border-bottom: 0; }
  .frame .bl { bottom: 34px; left: 34px; border-right: 0; border-top: 0; }
  .frame .br { bottom: 34px; right: 34px; border-left: 0; border-top: 0; }
  .board { position: absolute; left: 96px; top: 50%; transform: translateY(-50%); }
  .kicker { font-family: 'JetBrains Mono', monospace; font-size: 15px; letter-spacing: 0.35em;
    color: #39f0ff; text-transform: uppercase; text-shadow: 0 0 12px rgba(57,240,255,0.6); margin-bottom: 30px; }
  h1 { font-weight: 200; letter-spacing: -0.035em; line-height: 0.85; font-size: 128px; color: #f4feff;
    text-shadow: 0 0 30px rgba(57,240,255,0.35), 0 0 80px rgba(57,240,255,0.14); }
  h1 .amberline { color: #fff6ec; text-shadow: 0 0 30px rgba(255,158,44,0.4); }
  .jp { font-family: 'Zen Kaku Gothic New', sans-serif; font-weight: 500; font-size: 28px;
    letter-spacing: 0.14em; color: #76858f; margin-top: 34px; }
  .readout { font-family: 'JetBrains Mono', monospace; font-size: 14px; letter-spacing: 0.12em;
    text-transform: uppercase; color: #76858f; margin-top: 26px; }
  .readout b { font-weight: 400; color: #39f0ff; }
  .dia { position: absolute; right: 96px; bottom: 76px; font-size: 34px; color: #39f0ff;
    text-shadow: 0 0 18px rgba(57,240,255,0.7); }
  /* ?icon variant — 180x180 apple-touch-icon capture */
  body.icon { width: 180px; height: 180px; }
  body.icon .grid, body.icon .frame, body.icon .board { display: none; }
  body.icon .dia { right: 50%; bottom: 50%; transform: translate(50%, 50%); font-size: 96px; }
</style>
</head>
<body>
  <div class="grid"></div>
  <div class="frame"><span class="tl"></span><span class="tr"></span><span class="bl"></span><span class="br"></span></div>
  <div class="board">
    <div class="kicker">daikieOS // PORTFOLIO UPLINK</div>
    <h1>Ishinuki<br /><span class="amberline">Daikie</span></h1>
    <div class="jp" lang="ja">開発者 / 写真家 — 東京</div>
    <div class="readout"><b>35.6762° N, 139.6503° E</b> — DEVELOPER &amp; PHOTOGRAPHER</div>
  </div>
  <div class="dia">◆</div>
  <script>if (location.search.indexOf('icon') !== -1) document.body.classList.add('icon');</script>
</body>
</html>
```

- [ ] **Step 4: Bake og.png (exactly 1200×630) + apple-touch-icon (180×180) with headless Chrome.** (Server must be up — see Task 6 Step 1.)
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --user-data-dir=/tmp/og-chrome-profile --window-size=1200,630 --virtual-time-budget=8000 --screenshot="images/og.png" "http://127.0.0.1:8765/tools/og-board.html"
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --user-data-dir=/tmp/og-chrome-profile --window-size=180,180 --virtual-time-budget=8000 --screenshot="images/apple-touch-icon.png" "http://127.0.0.1:8765/tools/og-board.html?icon"
sips -g pixelWidth -g pixelHeight "/Users/daikieishinuki/Claude Code Projects/Personal Website/images/og.png" "/Users/daikieishinuki/Claude Code Projects/Personal Website/images/apple-touch-icon.png"
```
→ og.png 1200×630, icon 180×180. Eyeball both (Read the PNGs): deep-black field, name legible, JP line renders (NOT tofu — if tofu, the CDN font didn't land inside the virtual-time budget; raise `--virtual-time-budget` to 15000 and re-shoot). Copy the og for the gate pile: `cp images/og.png docs/superpowers/gates/v32/j-og-board-after.png`.

- [ ] **Step 5: 404.html.** Write `404.html` (repo root — GitHub Pages serves it automatically) with EXACTLY this content (self-contained, inline styles, system mono stack, ZERO JS, zero external requests):
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<meta name="theme-color" content="#05060a" />
<title>SIGNAL LOST // 404 — Ishinuki Daikie</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { background: #05060a; }
  body { min-height: 100vh; display: grid; place-items: center; background: #05060a; color: #e9f1f4;
    font-family: ui-monospace, 'JetBrains Mono', Menlo, monospace; }
  .panel { position: relative; padding: 56px clamp(28px, 8vw, 72px); text-align: center; }
  .panel > span { position: absolute; width: 26px; height: 26px; border: 1px solid rgba(57,240,255,0.36); }
  .tl { top: 0; left: 0; border-right: 0; border-bottom: 0; }
  .tr { top: 0; right: 0; border-left: 0; border-bottom: 0; }
  .bl { bottom: 0; left: 0; border-right: 0; border-top: 0; }
  .br { bottom: 0; right: 0; border-left: 0; border-top: 0; }
  .code { font-size: clamp(64px, 16vw, 140px); color: #f4feff; letter-spacing: 0.04em; line-height: 1;
    text-shadow: 0 0 30px rgba(57,240,255,0.35); }
  .word { margin-top: 18px; font-size: 12px; letter-spacing: 0.35em; color: #39f0ff; text-transform: uppercase; }
  .sub { margin-top: 10px; font-size: 11px; letter-spacing: 0.12em; color: #76858f; text-transform: uppercase; }
  a.return { display: inline-block; margin-top: 34px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
    color: #39f0ff; text-decoration: none; border: 1px solid rgba(57,240,255,0.36); padding: 10px 18px; }
  a.return:hover, a.return:focus-visible { border-color: #39f0ff; box-shadow: 0 0 14px rgba(57,240,255,0.3); }
</style>
</head>
<body>
  <main class="panel">
    <span class="tl"></span><span class="tr"></span><span class="bl"></span><span class="br"></span>
    <div class="code">404</div>
    <div class="word">SIGNAL LOST // 404</div>
    <div class="sub">the requested route does not resolve on this uplink</div>
    <a class="return" href="https://ishinuki-moncion.github.io/Personal-Website-3.0/">RE-ESTABLISH UPLINK ↵</a>
  </main>
</body>
</html>
```

- [ ] **Step 6: `<noscript>` fallback.** In `index.html`, Edit — old_string:
```html
<link rel="stylesheet" href="css/site.css?v=3.23" />
```
(use the actual current `?v=` value) — new_string:
```html
<link rel="stylesheet" href="css/site.css?v=3.23" />
<noscript>
  <style>
    /* No-JS truth: kill the boot screen and reveal everything the engine would */
    .boot, .cursor, .cursor-dot, .cursor-label, .typ-caret, .scene-atmosphere { display: none !important; }
    body[data-booting] { overflow: auto; }
    body { cursor: auto; }
    [data-reveal], .sec-label { opacity: 1 !important; transform: none !important; }
    .clip-reveal::after { display: none; }
    .clip-reveal .media { transform: none; }
    .hero-sub-text::before { content: attr(data-text); }
  </style>
</noscript>
```

- [ ] **Step 7: Boot-chain watchdog (OUTSIDE the module chain).** Current failure mode, verified: `js/boot.mjs` is a top-level-await chain (`await import('./background.js?...')` then boot.js/cursor.js/effects.js/app.js) — if any import 404s, `boot.js`'s `finish()` (which does `boot.classList.add('gone'); body.removeAttribute('data-booting'); document.dispatchEvent(new Event('boot:done'))`) never runs and the opaque `.boot` div (now `--z-boot: 9600`) covers the site forever; even app.js's 9.5s fallback is dead because app.js itself never loads. In `index.html`, Edit — old_string:
```html
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
```
new_string:
```html
<script>
document.getElementById('year').textContent = new Date().getFullYear();
/* v3.2j boot watchdog — deliberately OUTSIDE the module chain: if any vendor/
   module import 404s, boot.js never runs and the opaque boot screen would sit
   forever. On any script error (capture phase catches resource failures) or
   after 10s, force-reveal the DOM content. No-ops when boot.js finished. */
(function () {
  function reveal() {
    if (!document.body.hasAttribute('data-booting')) return;
    var b = document.getElementById('boot');
    if (b && b.parentNode) b.parentNode.removeChild(b);
    document.body.removeAttribute('data-booting');
    document.body.classList.add('revealed');
    document.dispatchEvent(new Event('boot:done'));
  }
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'SCRIPT') setTimeout(reveal, 0);
  }, true);
  setTimeout(reveal, 10000);
})();
</script>
```

- [ ] **Step 8: Print stylesheet.** Append to the END of `css/site.css` (after the `.mobile-menu { padding-bottom: … }` safe-area line):
```css

/* ============================================================
   v3.2j — print: the ledger on paper. Scene/HUD chrome dies, light-on-white,
   work/projects/contact remain a readable dossier.
   ============================================================ */
@media print {
  #scene-root, .scene-atmosphere, .scene-debug, .frame-hud, .state-flash,
  .cursor, .cursor-dot, .cursor-label, .scroll-progress, .scroll-hud,
  .boot, .mobile-menu, .lightbox, .deck, .deck-toggle, .nav-burger,
  .lang-btn, .skip-link, .scroll-cue, .typ-caret, .shot .sweep, .signal-tick { display: none !important; }
  html, body { background: #fff !important; color: #111 !important; cursor: auto; }
  .nav { position: static; background: none; }
  .hero { height: auto; min-height: 0; padding-block: 24pt; }
  [data-reveal], .sec-label { opacity: 1 !important; transform: none !important; }
  .clip-reveal::after { display: none; }
  .hero h1, .hero h1 .amberline, .heading-xl, .about-lead, .contact h2, .contact h2 em,
  .row-title, .about-bio p, .row-desc, .geo-copy { color: #111 !important; text-shadow: none !important; }
  .sec-label .txt, .geo-line, .proj-tech, .stat .n, .brand .name, .nav-meta .clock,
  .footer .coord, .signal-row .signal-addr, .pill, .tag, .row-arrow, .mm-coord { color: #333 !important; text-shadow: none !important; }
  .hero-kicker, .sys-online, .row-date, .row-sub, .proj-year, .gallery-count, .stat .l,
  .geo-kicker, .footer { color: #555 !important; text-shadow: none !important; }
  .stat-row, .gallery-grid, .lb-stage { background-image: none; }
  .shot .media, .about-portrait .media { filter: none; }
  .about-portrait .duo, .about-portrait .scanmask { display: none; }
  .row, .row-end-rule, .footer, .geo-trail, .signal-row, .pill, .tag { border-color: #ccc !important; box-shadow: none !important; }
  .row::before { display: none; }
}
```

- [ ] **Step 9: JSON-LD ImageObject for the 12 gallery photos** (photos are CSS backgrounds → invisible to image search; JSON-LD chosen over an `<img>` refactor as least-invasive — recorded in the spec). In `index.html`, Edit — old_string:
```html
<!-- Import-map fallback for Safari <16.4 / Firefox <108. Loads async; no-ops on
```
new_string:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Through the lens — selected photography by Ishinuki Daikie",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "item": { "@type": "ImageObject", "name": "NAGANO // 長野 — IMG_01", "contentUrl": "https://ishinuki-moncion.github.io/Personal-Website-3.0/images/gallery-07.jpg", "creator": { "@type": "Person", "name": "Ishinuki Daikie" } } },
    { "@type": "ListItem", "position": 2, "item": { "@type": "ImageObject", "name": "KAMAKURA // 鎌倉 — IMG_02", "contentUrl": "https://ishinuki-moncion.github.io/Personal-Website-3.0/images/gallery-03.jpg", "creator": { "@type": "Person", "name": "Ishinuki Daikie" } } },
    { "@type": "ListItem", "position": 3, "item": { "@type": "ImageObject", "name": "FUJI // 富士 — IMG_03", "contentUrl": "https://ishinuki-moncion.github.io/Personal-Website-3.0/images/gallery-08.jpg", "creator": { "@type": "Person", "name": "Ishinuki Daikie" } } },
    { "@type": "ListItem", "position": 4, "item": { "@type": "ImageObject", "name": "SENDAI // 仙台 — IMG_04", "contentUrl": "https://ishinuki-moncion.github.io/Personal-Website-3.0/images/gallery-16.jpg", "creator": { "@type": "Person", "name": "Ishinuki Daikie" } } },
    { "@type": "ListItem", "position": 5, "item": { "@type": "ImageObject", "name": "OSAKA // 大阪 — IMG_05", "contentUrl": "https://ishinuki-moncion.github.io/Personal-Website-3.0/images/gallery-04.jpg", "creator": { "@type": "Person", "name": "Ishinuki Daikie" } } },
    { "@type": "ListItem", "position": 6, "item": { "@type": "ImageObject", "name": "FUKUOKA // 福岡 — IMG_06", "contentUrl": "https://ishinuki-moncion.github.io/Personal-Website-3.0/images/gallery-13.jpg", "creator": { "@type": "Person", "name": "Ishinuki Daikie" } } },
    { "@type": "ListItem", "position": 7, "item": { "@type": "ImageObject", "name": "HOKKAIDO // 北海道 — IMG_07", "contentUrl": "https://ishinuki-moncion.github.io/Personal-Website-3.0/images/gallery-01.jpg", "creator": { "@type": "Person", "name": "Ishinuki Daikie" } } },
    { "@type": "ListItem", "position": 8, "item": { "@type": "ImageObject", "name": "SHIBUYA // 渋谷 — IMG_08", "contentUrl": "https://ishinuki-moncion.github.io/Personal-Website-3.0/images/gallery-02.jpg", "creator": { "@type": "Person", "name": "Ishinuki Daikie" } } },
    { "@type": "ListItem", "position": 9, "item": { "@type": "ImageObject", "name": "KYOTO // 京都 — IMG_09", "contentUrl": "https://ishinuki-moncion.github.io/Personal-Website-3.0/images/gallery-05.jpg", "creator": { "@type": "Person", "name": "Ishinuki Daikie" } } },
    { "@type": "ListItem", "position": 10, "item": { "@type": "ImageObject", "name": "DALLAS // ダラス — IMG_10", "contentUrl": "https://ishinuki-moncion.github.io/Personal-Website-3.0/images/gallery-09.jpg", "creator": { "@type": "Person", "name": "Ishinuki Daikie" } } },
    { "@type": "ListItem", "position": 11, "item": { "@type": "ImageObject", "name": "ASAKUSA // 浅草 — IMG_11", "contentUrl": "https://ishinuki-moncion.github.io/Personal-Website-3.0/images/gallery-10.jpg", "creator": { "@type": "Person", "name": "Ishinuki Daikie" } } },
    { "@type": "ListItem", "position": 12, "item": { "@type": "ImageObject", "name": "OKINAWA // 沖縄 — IMG_12", "contentUrl": "https://ishinuki-moncion.github.io/Personal-Website-3.0/images/gallery-11.jpg", "creator": { "@type": "Person", "name": "Ishinuki Daikie" } } }
  ]
}
</script>

<!-- Import-map fallback for Safari <16.4 / Firefox <108. Loads async; no-ops on
```
(Names mirror Task 7's `data-title` values exactly.)

- [ ] **Step 10: Self-host the Latin woff2s.** (a) Download (this exact script was dry-run at plan time — css2 serves ONE variable woff2 per family covering both requested weights):
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && mkdir -p fonts && python3 - <<'PY'
import re, urllib.request
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
url = 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@200;400&family=JetBrains+Mono:wght@400;500&display=swap'
css = urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read().decode()
seen = {}
for m in re.finditer(r"/\* (\w[\w-]*) \*/\s*@font-face \{([^}]*)\}", css):
    subset, body = m.group(1), m.group(2)
    if subset != 'latin':
        continue
    fam = re.search(r"font-family: '([^']+)'", body).group(1)
    woff = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
    name = fam.lower().replace(' ', '-') + '-latin.woff2'
    if name not in seen:
        seen[name] = woff
        open('fonts/' + name, 'wb').write(urllib.request.urlopen(urllib.request.Request(woff, headers=UA)).read())
        print('saved fonts/' + name, '<-', woff)
    print('unicode-range check:', re.search(r'unicode-range: ([^;]+);', body).group(1)[:40], '...')
PY
ls -la fonts/
```
→ `fonts/hanken-grotesk-latin.woff2` and `fonts/jetbrains-mono-latin.woff2` exist, each > 10KB. Confirm the printed unicode-range matches the one hardcoded in (b) — at plan time it was byte-identical for all four blocks.
  (b) @font-face in `css/site.css`, Edit — old_string:
```css
   ============================================================ */

:root {
```
new_string:
```css
   ============================================================ */

/* v3.2j — self-hosted Latin instrument faces (Google Fonts CDN retired for
   Latin). css2 serves one variable woff2 per family for both requested weights;
   the font-weight descriptor selects the instance. JP faces (Zen Kaku Gothic
   New, M PLUS Rounded 1c) stay on the CDN — JP glyph subsetting impractical
   to self-host (recorded exception, law addendum). */
@font-face { font-family: 'Hanken Grotesk'; font-style: normal; font-weight: 200; font-display: swap;
  src: url('../fonts/hanken-grotesk-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'Hanken Grotesk'; font-style: normal; font-weight: 400; font-display: swap;
  src: url('../fonts/hanken-grotesk-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'JetBrains Mono'; font-style: normal; font-weight: 400; font-display: swap;
  src: url('../fonts/jetbrains-mono-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: 'JetBrains Mono'; font-style: normal; font-weight: 500; font-display: swap;
  src: url('../fonts/jetbrains-mono-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }

:root {
```
  (c) Trim the CDN link in `index.html`. READ the current fonts `<link>` line first — v32c (slice 2) should already have removed Rajdhani. Expected old_string (post-v32c):
```html
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@200;400&family=JetBrains+Mono:wght@400;500&family=M+PLUS+Rounded+1c:wght@400;500&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap" rel="stylesheet" />
```
(if Rajdhani is somehow still in the line, keep its absence/presence EXACTLY as found except for the two families removed here) — new_string:
```html
<link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500&family=Zen+Kaku+Gothic+New:wght@500;700&display=swap" rel="stylesheet" />
```
(The two `preconnect` lines stay — the JP faces still ride the CDN.)
  (d) Record the exception — append ONE line to the law addendum:
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && printf '\n- **Fonts ruling (v32j):** Latin instrument faces (Hanken Grotesk 200/400, JetBrains Mono 400/500) are self-hosted woff2 in `fonts/`; JP faces (Zen Kaku Gothic New, M PLUS Rounded 1c) STAY on the Google Fonts CDN — JP glyph subsetting impractical to self-host (recorded exception).\n' >> docs/superpowers/specs/2026-07-08-v32-law-addendum.md
```

- [ ] **Step 11: Cache-bust + harness green.** `index.html`: `css/site.css?v=3.23` → `?v=3.24` (current +0.01; note the noscript block in Step 6 sits on the line AFTER the link — only the link's `?v=` changes). No JS-chain bump (only inline HTML script changed). `node tools/verify-site-hardening.js` → ALL GREEN, previous total + 1.

- [ ] **Step 12: Live verify.** navigate_page → `http://127.0.0.1:8765/` (fresh `?v=`). (1) Fonts: list_network_requests → `fonts/hanken-grotesk-latin.woff2` + `fonts/jetbrains-mono-latin.woff2` served from 127.0.0.1, NO `fonts.gstatic.com` requests for hankengrotesk/jetbrainsmono (gstatic requests for M PLUS / Zen Kaku are expected); evaluate `document.fonts.check('500 12px "JetBrains Mono"') && document.fonts.check('200 12px "Hanken Grotesk"')` → true; eyeball hero + a mono readout at 1440×900 (no fallback-face flash). (2) 404: navigate_page → `http://127.0.0.1:8765/404.html`, screenshot → `docs/superpowers/gates/v32/j-404-after.png`, ZERO console messages (it has no JS). (3) Print: `cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --user-data-dir=/tmp/og-chrome-profile --print-to-pdf="docs/superpowers/gates/v32/j-print-after.pdf" "http://127.0.0.1:8765/"` → open/Read the PDF: white background, black text, no canvas/HUD. (4) JSON-LD: evaluate `JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent).itemListElement.length` → 12. (5) Watchdog drill (REAL failure test, then restore): `mv js/vendor/three-0.158.0 /tmp/three-quarantine` → hard reload → content must reveal at ~10s with the boot screen gone (console will show the import error — that's the tested condition, not a regression) → `mv /tmp/three-quarantine js/vendor/three-0.158.0` → reload → normal boot, ZERO console errors. (6) noscript spot-check: evaluate on the ?icon-free page is impossible with JS on — instead verify statically: `grep -c "noscript" index.html` → 2 (open+close).

- [ ] **Step 13: Commit.**
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git add index.html css/site.css 404.html tools/og-board.html images/og.png images/apple-touch-icon.png fonts/ docs/superpowers/specs/2026-07-08-v32-law-addendum.md tools/verify-site-hardening.js && git commit -m "feat(v32j): beyond-the-viewport (meta/og/404/noscript/print/JSON-LD/fonts)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 11: Instrument micro-fidelity (v32k)

**Files:** Modify: `index.html` (About stat ~line 138, lb-pos ~line 303, cache-busts), `css/site.css` (after `.stat .l` rule ~line 527), `js/app.js` (lb-pos format ~line 204), `js/effects.js` (one-shot coord decrypt, ~lines 54 and 82–93), `js/background.js` (callout clock, after ~line 848), `js/boot.mjs` (V.app, V.fx, V.bg), `tools/verify-site-hardening.js`.
**Interfaces:** Consumes: `window.scramble` (effects.js:25 — existing decrypt utility, reduced-motion no-op built in at :28); `callout.draw` + `placeById(focusedPlaceId)` (background.js:796–847, 1292); Task 9's whole-span `lang="ja"` on `.footer .coord` (safe to scramble — no child elements). Produces: the sanctioned `.readout`/`.readout-unit` CSS pattern (P3 unit-triad deferral, first unit born); `alignCalloutClock` in background.js; `coordEl` one-shot in effects.js.

**Resolution notes (state them in the commit if asked):** (1) The spec's "minute-aligned JST callout redraw" targets the CANVAS coordinate callout in background.js — its JST HH:MM is baked into the texture at `draw()` time and only redrawn on focus-change/fonts-ready, so it reads STALE within a minute; there is NO interval to replace — the fix ADDS a minute-aligned `setTimeout` wake. The DOM `[data-clock]` in effects.js displays live seconds and is left untouched (never stale; minute-aligning it would delete the seconds readout — a design change nobody ordered). (2) "Hero coordinates" — no coordinate readout exists inside the hero section; the site's signature coordinate readout is the contact-footer `.coord` (`35.6762° N…`). The decrypt applies there, one-shot on first reveal, real text kept in the HTML (noscript/print truth; scramble supplies the placeholder frames itself — no fake `--` seeded, which the survey critic flagged as broken-data risk). Only ONE readout resolves → no signal storm by construction. (3) Bloom dark-swap landmine: N/A this task — `alignCalloutClock` only redraws an existing CanvasTexture via the sanctioned `callout.draw` path; no material is created or swapped.

- [ ] **Step 1: Harness pin FIRST, show FAIL.** Two Edits in `tools/verify-site-hardening.js`. (a) old_string:
```js
const css = read('css/site.css');
```
new_string:
```js
const css = read('css/site.css');
const effects = read('js/effects.js');
```
(b) old_string:
```js
const failed = checks.filter(item => !item.pass);
```
new_string:
```js
check(
  'v32k: instrument micro-fidelity — readout unit, compact lb-pos, minute-aligned callout clock, one-shot coord decrypt',
  /class="readout-unit"/.test(index) && /\.readout-unit \{/.test(css) &&
    /padStart\(2, '0'\) \+ '\/' \+ String/.test(app) &&
    /alignCalloutClock/.test(background) && /60000 - \(Date\.now\(\) % 60000\)/.test(background) &&
    /coordEl/.test(effects),
  'stat births the .readout pattern; lb-pos reads 01/12; the callout JST wakes on the minute; contact coords decrypt once on reveal'
);

const failed = checks.filter(item => !item.pass);
```
Run `node tools/verify-site-hardening.js` → FAIL, exit 1.

- [ ] **Step 2: Gate "before".** navigate_page → `http://127.0.0.1:8765/#about`, 1440×900, screenshot → `docs/superpowers/gates/v32/k-readout-before.png` (stat row with glowing `100+`).

- [ ] **Step 3: About stat births the `.readout` pattern.** In `index.html`, Edit — old_string:
```html
            <div class="stat" data-reveal data-reveal-delay="0.18s"><div class="n"><span data-count="100" data-suffix="+" aria-hidden="true">88+</span><span class="sr-only">100+</span></div><div class="l" data-en="Campaigns shipped" data-ja="キャンペーン">Campaigns shipped</div></div>
```
new_string:
```html
            <div class="stat" data-reveal data-reveal-delay="0.18s"><div class="n readout"><span data-count="100" aria-hidden="true">88</span><span class="readout-unit" aria-hidden="true">+</span><span class="sr-only">100+</span></div><div class="l" data-en="Campaigns shipped" data-ja="キャンペーン">Campaigns shipped</div></div>
```
(Zero JS change needed: `runCounter` reads `data-suffix` with a `|| ''` default — effects.js:71 — so removing the attribute makes it write the bare number and the unit span carries the `+`.)

- [ ] **Step 4: `.readout` CSS.** In `css/site.css`, Edit — old_string:
```css
.stat .l { font-size: 10px; letter-spacing: var(--track-10); text-transform: uppercase; color: var(--muted); margin-top: 8px; }
```
new_string:
```css
.stat .l { font-size: 10px; letter-spacing: var(--track-10); text-transform: uppercase; color: var(--muted); margin-top: 8px; }
/* v3.2k — sanctioned .readout pattern (P3 unit-triad deferral, first unit born):
   value + typographically-demoted unit; the unit never glows. */
.readout { display: inline-flex; align-items: baseline; }
.readout-unit { color: var(--muted); font-size: 0.5em; margin-left: 2px; letter-spacing: 0.04em; }
```

- [ ] **Step 5: Compact `.lb-pos`.** (a) `js/app.js`, Edit — old_string:
```js
    if (lbPos) lbPos.textContent = String(lbIndex + 1).padStart(2, '0') + ' / ' + String(sources.length).padStart(2, '0');
```
new_string:
```js
    if (lbPos) lbPos.textContent = String(lbIndex + 1).padStart(2, '0') + '/' + String(sources.length).padStart(2, '0');
```
(b) `index.html` static seed, Edit — old_string `<span class="pos lb-pos">01 / 12</span>` → new_string `<span class="pos lb-pos">01/12</span>`.

- [ ] **Step 6: Minute-aligned callout clock in background.js.** Current redraw sites (verified — there is NO periodic redraw, which is the staleness bug): `draw()` at construction (:836), `document.fonts.ready.then(() => draw(placeById(focusedPlaceId)))` (:839), and focus-change `if (callout && callout.draw) callout.draw(placeById(focusedPlaceId));` (:1297). Edit — old_string:
```js
  const calloutOffset = new THREE.Vector3(0, 0.45, 0);
```
new_string:
```js
  const calloutOffset = new THREE.Vector3(0, 0.45, 0);

  // v3.2k — the callout bakes "BASE: JST HH:MM" into its texture at draw()
  // time; with no periodic redraw it reads stale within a minute. Wake exactly
  // at the next minute boundary (not 60x/min), redraw the FOCUSED place, skip
  // work while the tab is hidden (visibilitychange repaints on return). A
  // 1/min texture refresh of live data is clock truth, not idle animation.
  (function alignCalloutClock() {
    let t = null;
    function wake() {
      clearTimeout(t);
      t = setTimeout(wake, 60000 - (Date.now() % 60000) + 50);
      if (document.hidden) return;
      callout.draw(placeById(focusedPlaceId));
    }
    t = setTimeout(wake, 60000 - (Date.now() % 60000) + 50);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  })();
```
(`focusedPlaceId` is declared with `let` at :1292, after this insertion point, but every reference here runs asynchronously ≥ next minute / on visibility — the same deferred-reference pattern the existing fonts-ready callback at :839 already uses. No materials touched → bloom dark-swap rule N/A.)

- [ ] **Step 7: One-shot coordinate decrypt in effects.js (2 Edits).**
  (a) old_string:
```js
  /* ---- collect animated elements ---- */
  let reveals = [], counters = [], parallaxEls = [];
```
new_string:
```js
  /* ---- collect animated elements ---- */
  let reveals = [], counters = [], parallaxEls = [];

  /* v3.2k — one-shot coordinate decrypt (spec 3.6, "hero coordinates only"):
     the site's signature Tokyo coordinate readout (contact footer .coord)
     resolves once, on first reveal. Real text ships in the HTML — noscript and
     print stay truthful; scramble supplies the placeholder frames itself.
     One element only (no signal storm); no idle loop; reduced-motion takes
     scramble's instant path. */
  let coordEl = document.querySelector('.footer .coord');
```
  (b) old_string:
```js
  function checkReveals() {
    const vh = innerHeight;
    for (let i = reveals.length - 1; i >= 0; i--) {
      const el = reveals[i];
      const top = el.getBoundingClientRect().top;
      if (top < vh * 0.92) { el.classList.add('seen'); reveals.splice(i, 1); }
    }
    for (let i = counters.length - 1; i >= 0; i--) {
      const el = counters[i];
      if (el.getBoundingClientRect().top < vh * 0.85) { runCounter(el); counters.splice(i, 1); }
    }
  }
```
new_string:
```js
  function checkReveals() {
    const vh = innerHeight;
    for (let i = reveals.length - 1; i >= 0; i--) {
      const el = reveals[i];
      const top = el.getBoundingClientRect().top;
      if (top < vh * 0.92) { el.classList.add('seen'); reveals.splice(i, 1); }
    }
    for (let i = counters.length - 1; i >= 0; i--) {
      const el = counters[i];
      if (el.getBoundingClientRect().top < vh * 0.85) { runCounter(el); counters.splice(i, 1); }
    }
    if (coordEl && coordEl.getBoundingClientRect().top < vh * 0.92) {
      const el = coordEl; coordEl = null;             // one-shot, never re-arms
      window.scramble(el, el.textContent, { duration: 900 });
    }
  }
```

- [ ] **Step 8: Cache-busts + version stamps.** `index.html`: `css/site.css?v=3.24` → `?v=3.25`, `js/boot.mjs?v=9` → `?v=10` (current +0.01/+1). `js/boot.mjs` (three Edits, each current +0.1): `app: '3.8'` → `app: '3.9'`; `fx: '3.5'` → `fx: '3.6'`; `bg: '4.2'` → bump whatever the CURRENT bg value is by +0.1 (slice 2 will have moved it past 4.2 — read the line first; e.g. `bg: '4.6'` → `bg: '4.7'`).

- [ ] **Step 9: Syntax + harness.** `node --check js/app.js && node --check js/effects.js && node --check js/background.js && node --check js/boot.mjs` → all silent. `node tools/verify-site-hardening.js` → ALL GREEN, previous total + 1.

- [ ] **Step 10: Live verify + gate "after".** navigate_page → `http://127.0.0.1:8765/` (fresh `?v=`), 1440×900.
  (1) Stat: scroll to About (evaluate `document.getElementById('about').scrollIntoView()`), wait ~1.5s for the counter, evaluate `document.querySelector('.stat .n').textContent` → `100+` with the `+` inside `.readout-unit`; screenshot → `docs/superpowers/gates/v32/k-readout-after.png` — the `+` reads muted/small against the cyan 100.
  (2) lb-pos: open a shot, evaluate `document.querySelector('.lb-pos').textContent` → `02/12`-style (no spaces).
  (3) Coord decrypt: scroll to the footer; watch `.coord` scramble once (~0.9s) and settle to `35.6762° N, 139.6503° E — 東京`; scroll away and back → it must NOT re-fire. Verify one-signal discipline visually: the decrypt happens at footer-reveal, after the contact state-flash has already finished.
  (4) Callout clock: evaluate `window.__sceneDebug && window.__sceneDebug()` (with `?sceneDebug=1` if required by the flag) for sanity, then simply wait across a minute boundary and confirm zero console errors and the scene keeps rendering (the redraw is invisible unless the minute ticks — correctness here is the harness regex + no-error run).
  (5) Reduced-motion: emulate `prefers-reduced-motion: reduce` (devtools emulate, or OS setting), reload → coord shows instantly (scramble's reduced path), no scramble frames, no counter animation. list_console_messages → ZERO errors at BOTH 1440×900 and 390×844.

- [ ] **Step 11: Commit.**
```bash
cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && git add index.html css/site.css js/app.js js/effects.js js/background.js js/boot.mjs tools/verify-site-hardening.js && git commit -m "feat(v32k): micro-fidelity

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
### Task 12: Rain lever A — motivated light (v32l)

**Files:** Modify: `js/background.js` (makeDepthRain ~:481–516, droplets spawn ~:690, drawDrop ~:654–686, updateDepthRain ~:1254–1279, sectionStories ~:1339–1364), `js/boot.mjs` (:17 version map), `index.html` (:354 boot.mjs `?v=`). Test: `tools/verify-site-hardening.js` (append one check before `const failed =`, ~:165).
**Interfaces:** Consumes: `node tools/frame-luminance.mjs <png>` (Task 1 / v32a) → JSON `{"mean","p50","p95","warmShare"}`; hero + projects luminance baselines recorded in `docs/superpowers/specs/2026-07-08-v32-law-addendum.md` (Task 1 §baselines); git-ignored gate dir `docs/superpowers/gates/v32/`. Produces: consts `MOTIV_FLOOR`, `MOTIV_CAP`, `RAIN_LITE_VEIL`, `WELL_DEPTH_SIGMA`, `rainWells`, `setWell()`; the per-plane term `ud.baseOp * vis * beat * motivation`; harness check `v3.2l — rain is motivated light, not a flat veil`; gate screenshots `l-hero-before/after.png`, `l-projects-before/after.png`.

Context an executor must hold: the depth rain is 2–3 `THREE.Points` planes parented to the **camera** (`makeDepthRain`, background.js:481–516; layer `userData = { speeds, halfW, halfH, baseOp }`). Today every plane's opacity is the flat veil `pts.material.opacity = ud.baseOp * vis * beat` where `vis = sceneState.rain` (a per-section scalar) — quantity, never spatiality. LITE (`coarse || small`, :15) gets 2 lighter layers from the `defs` ternary (:483–488); `reduced` gets no rain at all (`const depthRain = reduced ? null : makeDepthRain();`, :621). This task makes opacity = `baseOp × vis × beat × motivation`, where `motivation` is a per-PLANE (never per-drop) sample of ≤3 screen-space light-wells at projected emitter positions: Tokyo halo, focused place node, lightning.

**BLOOM DARK-SWAP LANDMINE (restated):** during the bloom pass every untagged object is swapped to a TYPE-CORRECT invisible material (`darkPoints` for Points — v31g fixed black squares from undefined `gl_PointSize`; `darkSprite` opacity:0 for sprites — v31f fixed dark slabs; see background.js:1755–1777). This task adds **zero new scene objects and zero new materials** — wells are pure math driving the existing rain `PointsMaterial.opacity`, and the rain Points already swap through the type-correct `darkPoints`. Do NOT add any helper mesh/sprite to visualize wells.

- [ ] **Step 1: Baseline + BEFORE captures.** Confirm the site is served: `curl -sI http://127.0.0.1:8765 | head -1` — if dead, restart: `cd "/Users/daikieishinuki/Claude Code Projects/Personal Website" && python3 -m http.server 8765 --bind 127.0.0.1 &`. Load the browser tools once for the whole slice: `ToolSearch` query `select:mcp__plugin_ecc_chrome-devtools__new_page,mcp__plugin_ecc_chrome-devtools__navigate_page,mcp__plugin_ecc_chrome-devtools__resize_page,mcp__plugin_ecc_chrome-devtools__take_screenshot,mcp__plugin_ecc_chrome-devtools__evaluate_script,mcp__plugin_ecc_chrome-devtools__list_console_messages`. Open `http://127.0.0.1:8765/` at 1440×900, wait ~8 s (boot + arc afterglow decays), screenshot → `docs/superpowers/gates/v32/l-hero-before.png` (use take_screenshot's file-path parameter; the gates dir is git-ignored per Task 1). Then `evaluate_script`: `document.getElementById('projects').scrollIntoView()`, wait 3 s (entry beat decays), screenshot → `docs/superpowers/gates/v32/l-projects-before.png`. Run `node tools/frame-luminance.mjs` on both and note the numbers next to the Task-1 baselines in the addendum (they should be ≈ equal; the addendum numbers are the gate reference).
- [ ] **Step 2: Harness pin FIRST (house TDD analog).** In `tools/verify-site-hardening.js`, insert immediately above this exact anchor line:
```js
const failed = checks.filter(item => !item.pass);
```
this check:
```js
check('v3.2l — rain is motivated light, not a flat veil',
  /MOTIV_FLOOR/.test(background) && /MOTIV_CAP/.test(background) &&
    /baseOp \* vis \* beat \* motivation/.test(background) &&
    /saturate\(0\.5\) brightness\(0\.9\)/.test(background) &&
    !/rain: 0\.6,/.test(background),
  'per-plane motivation term (rain brief Lever A), worn-glass droplet filter, and the retired flat hero veil');
```
Run `node tools/verify-site-hardening.js` — expect the NEW check to FAIL and every pre-existing check to PASS (run the harness before editing and record the pre-task PASS count N — the v3.1 base was 22 and Tasks 1–11 added pins; after this task the expectation is N+1 PASS / 0 FAIL).
- [ ] **Step 3: give each rain plane a depth handle.** In `makeDepthRain`, Edit old_string:
```js
      pts.userData = { speeds: spd, halfW, halfH, baseOp: d.op };
```
new_string:
```js
      pts.userData = { speeds: spd, halfW, halfH, baseOp: d.op, zMid: (d.z[0] + d.z[1]) / 2 };  // v3.2l: camera-space mid-depth for the per-plane well falloff
```
- [ ] **Step 4: well machinery.** Edit old_string (function head of `updateDepthRain`, untouched by v32d which edits only the tint lines further down):
```js
  function updateDepthRain(dt, flash) {
    if (!depthRain) return;
    const vis = sceneState.rain;
```
new_string:
```js
  /* v3.2l — rain lever A (rain brief, the one never-built research surface):
     rain is bright only where motivated light reaches it. ≤3 screen-space
     falloff wells at projected emitter positions — Tokyo halo (the city IS
     the lamp), the focused place node, and lightning while it flashes —
     evaluated per PLANE, never per drop:
        terminal opacity = baseOp × vis × beat × motivation
     `vis` (sceneState.rain) is now a simple presence envelope (see
     sectionStories); density/art-direction moved into the wells. LITE skips
     all projection math: one flat veil (RAIN_LITE_VEIL). No new scene
     objects/materials — the bloom dark-swap set is untouched. */
  const MOTIV_FLOOR = 0.22;      // rain never fully dies while a section calls for weather
  const MOTIV_CAP   = 0.80;      // motivated rain always sits BELOW the retired flat-veil peaks
  const RAIN_LITE_VEIL = 0.55;   // LITE: single flat veil ≤ every old per-section value
  const WELL_DEPTH_SIGMA = 6.0;  // camera-Z reach of an emitter's light, world units
  const TOKYO_HALO_LOCAL = TOKYO.clone().multiplyScalar(1.08);   // halo group's spin-local seat (:526)
  const rainWells = [{ s: 0, z: 0 }, { s: 0, z: 0 }, { s: 0, z: 0 }];
  const _wellP = new THREE.Vector3(), _wellN = new THREE.Vector3(), _wellC = new THREE.Vector3();
  function setWell(well, worldV, strength) {
    // world→screen: the exact path the DOM HUD reticle uses (interrogate(), :1577-1580)
    // — matrixWorldInverse is one render stale here; irrelevant at falloff scale.
    _wellC.copy(worldV).applyMatrix4(camera.matrixWorldInverse);   // camera-space depth
    if (_wellC.z > -0.1) { well.s = 0; return; }                   // at/behind the camera — dark
    _wellN.copy(worldV).project(camera);
    const edge = Math.max(Math.abs(_wellN.x), Math.abs(_wellN.y));
    well.s = strength * (1 - THREE.MathUtils.smoothstep(edge, 0.9, 1.5)); // screen-space falloff as the emitter leaves frame
    well.z = _wellC.z;
  }
  function updateDepthRain(dt, flash) {
    if (!depthRain) return;
    const vis = sceneState.rain;
```
- [ ] **Step 5: compute wells per frame + hook the per-plane opacity.** Edit old_string:
```js
    depthRain.group.visible = vis > 0.02;
    if (!depthRain.group.visible) return;
    rainSway += dt;
```
new_string:
```js
    depthRain.group.visible = vis > 0.02;
    if (!depthRain.group.visible) return;
    if (!LITE) {   // wells: 1 Tokyo halo, 2 focused place node, 3 lightning reach while active
      _wellP.copy(TOKYO_HALO_LOCAL); spin.localToWorld(_wellP);
      setWell(rainWells[0], _wellP, sceneState.halo * (0.30 + sceneState.haloPulse * 0.25 + sceneState.lockT * 0.20));
      _wellP.copy(focusedPlaceId === 'dallas' ? DALLAS : TOKYO); spin.localToWorld(_wellP);
      setWell(rainWells[1], _wellP, 0.15 + focusFlash * 0.20);
      if (lightning && lightning.t > 0) {
        _wellP.copy(lightning.sp.position); camera.localToWorld(_wellP);   // sprite is a camera child (:1093)
        setWell(rainWells[2], _wellP, (flash || 0) * 0.9);
      } else rainWells[2].s = 0;
    }
    rainSway += dt;
```
Then Edit old_string (the flat-veil terminal line — do NOT include the `rainTintK` lines above it in old_string; v32d re-keys those):
```js
      pts.geometry.attributes.position.needsUpdate = true;
      pts.material.opacity = ud.baseOp * vis * beat;
    });
```
new_string:
```js
      pts.geometry.attributes.position.needsUpdate = true;
      // v3.2l terminal opacity = baseOp × vis × beat × motivation (per PLANE, not per drop)
      let motivation = RAIN_LITE_VEIL;               // LITE: flat veil, zero projection math on phones
      if (!LITE) {
        let m = 0;
        for (let wi = 0; wi < 3; wi++) {
          const wl = rainWells[wi];
          if (wl.s > 0) m += wl.s * Math.exp(-Math.abs(ud.zMid - wl.z) / WELL_DEPTH_SIGMA);
        }
        motivation = Math.min(MOTIV_CAP, MOTIV_FLOOR + m);
      }
      pts.material.opacity = ud.baseOp * vis * beat * motivation;
    });
```
Symbol order is safe: `TOKYO` :385, `DALLAS` :851, `spin` :164, `lightning` :1079, `focusedPlaceId`/`focusFlash` :1292–1293 are all declared before the insertion point (~:1253), and `updateDepthRain` first RUNS inside the loop (:1885).
- [ ] **Step 6: retire the flat per-section veil.** Current values (sectionStories, :1339–1364): home `rain: 0.6`, about `0.85`, work `0.7`, gallery `0.35`, projects `0.55`, contact `0.8` — a graded art-directed veil. Replacement: `vis` becomes a presence envelope (1 where weather exists, a whisper in gallery where photos own the section); density is now the wells' job. Proof the luminance gate can pass, using the plane mid-depths (−5.5/−8.5/−12.5) vs the halo's camera depth (≈−12): typical hero motivation = 0.22 + 0.30·exp(−|Δz|/6) ≈ 0.32–0.50 per plane → effective 1×0.32–0.50 vs old flat 0.6; about 0.85→~0.4; work 0.7→~0.4; projects 0.55→~0.4; gallery 0.35→0.3×~0.4≈0.12. Every section drops. Six Edits (each old_string is unique in the file; if v32d appended a `grid:` field to any of these lines, keep it and change only the shown tokens):
  1. old `rain: 0.6, labels: 1, callout: 1, camera: 0,   // v3.1: hero rain calmed 1.0→0.6 — type owns the hero, weather recedes` → new `rain: 1, labels: 1, callout: 1, camera: 0,   // v3.2l: veil retired — rain is presence; density comes from motivated light`
  2. old `halo: 0.85, rain: 0.85, labels: 0.85,` → new `halo: 0.85, rain: 1, labels: 0.85,`
  3. old `halo: 1.15, rain: 0.7, labels: 1,` → new `halo: 1.15, rain: 1, labels: 1,`
  4. old `halo: 0.45, rain: 0.35, labels: 0.35,` → new `halo: 0.45, rain: 0.3, labels: 0.35,`
  5. old `halo: 0.35, rain: 0.55, labels: 0.2,` → new `halo: 0.35, rain: 1, labels: 0.2,`
  6. old `halo: 1.25, rain: 0.8, labels: 1,` → new `halo: 1.25, rain: 1, labels: 1,`
- [ ] **Step 7: re-scale the droplet spawn coupling** (sceneState.rain also feeds glass-bead spawning; with `vis` now ≈1 the beads would spawn ~40% faster on the hero — a luminance-UP leak). Edit old_string:
```js
      spawnIn -= dt * (0.4 + sceneState.rain);
```
new_string:
```js
      spawnIn -= dt * (0.4 + sceneState.rain * 0.6);   // v3.2l: rain is presence (≈1) now — rescaled to the old veil-era spawn rate
```
- [ ] **Step 8: worn-glass droplet lens** (`ctx.filter` through the sample; recorded one-liner from the rain brief). Edit old_string (inside `drawDrop`, :659–673):
```js
        ctx.translate(d.x, d.y); ctx.rotate(Math.PI);
        // v3.1f: 0.65 -> 0.22 — the lens samples the (bright, additive) WebGL frame,
        // and at 0.65 a droplet over a dark page gap read as a bright smudge on the
        // deep-black floor. Capped so a drop is never more than a faint glint.
        ctx.globalAlpha = 0.22 * a;
        ctx.drawImage(src, (d.x - sr) * k, (d.y - sr) * k, sr * 2 * k, sr * 2 * k, -d.r, -d.r, d.r * 2, d.r * 2);
        ctx.restore();
```
new_string:
```js
        ctx.translate(d.x, d.y); ctx.rotate(Math.PI);
        // v3.1f: 0.65 -> 0.22 — the lens samples the (bright, additive) WebGL frame,
        // and at 0.65 a droplet over a dark page gap read as a bright smudge on the
        // deep-black floor. Capped so a drop is never more than a faint glint.
        // v3.2l: sample through worn glass — desaturated + dimmed (rain brief Lever A
        // one-liner); Safari ignores ctx.filter (harmless no-op there).
        ctx.filter = 'saturate(0.5) brightness(0.9)';
        ctx.globalAlpha = 0.22 * a;
        ctx.drawImage(src, (d.x - sr) * k, (d.y - sr) * k, sr * 2 * k, sr * 2 * k, -d.r, -d.r, d.r * 2, d.r * 2);
        ctx.filter = 'none';
        ctx.restore();
```
(The lens branch only runs when `REFRACT = !LITE`, :634 — no phone cost.)
- [ ] **Step 9: syntax + harness.** `node --check js/background.js` (clean), then `node tools/verify-site-hardening.js` — expect ALL GREEN, N+1 PASS / 0 FAIL.
- [ ] **Step 10: version bumps.** In `js/boot.mjs` :17 the map currently reads `const V = { bg: '4.2', boot: '3.1', cursor: '3.1', fx: '3.5', app: '3.4' };` — earlier v32 tasks will have advanced it; read the CURRENT `bg` value and bump one minor step (e.g. `bg: '4.5'` → `bg: '4.6'`). In `index.html` :354, `<script type="module" src="js/boot.mjs?v=5"></script>` — read the CURRENT `?v=` and increment by 1 (e.g. `?v=9` → `?v=10`).
- [ ] **Step 11: live verify + HARD GATE (net frame luminance must DROP).** Hard-reload `http://127.0.0.1:8765/` at 1440×900 with the new `?v=`; wait ~8 s; screenshot → `docs/superpowers/gates/v32/l-hero-after.png`; scroll to `#projects` (same evaluate_script as Step 1), wait 3 s, screenshot → `docs/superpowers/gates/v32/l-projects-after.png`. Run `node tools/frame-luminance.mjs` on both AFTER files. GATE: `mean` and `warmShare` must be ≤ the Task-1 addendum baselines for hero and projects. If `mean` exceeds baseline: lower `MOTIV_FLOOR` 0.22→0.16 and re-verify; if `warmShare` exceeds: lower the halo-well strength `0.30`→`0.22` and re-verify (record any retune in a code comment). Visual read: rain should pool near the Tokyo halo and vanish toward frame corners; a lightning flash should visibly wake the far planes.
- [ ] **Step 12: secondary live checks.** (a) `list_console_messages` — zero errors. (b) Resize 390×844, hard-reload: rain present at the flat LITE veil, no console errors. (c) Reduced-motion: rain is built as `reduced ? null : makeDepthRain()` (:621) and every new line is inside rain/droplet code that never constructs under reduced — verify by loading with the chrome-devtools `emulate` tool's reduced-motion emulation if its schema supports it (ToolSearch `select:mcp__plugin_ecc_chrome-devtools__emulate`); otherwise confirm the static frame renders and the console is clean with the OS setting, and note the code-path proof.
- [ ] **Step 13: Commit.** `git add js/background.js js/boot.mjs index.html tools/verify-site-hardening.js` then commit with EXACTLY:
```
feat(v32l): rain lever A

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

### Task 13: Guarantee the beat (v32m)

**Files:** Modify: `js/background.js` (celestial init ~:1029/:1045, setFocusedPlace ~:1294, storyTimer/`__sceneFocus` ~:1338–1400, spin rotation ~:1910, arc block ~:1947–1956), `js/boot.mjs` (version map), `index.html` (boot.mjs `?v=`). Test: `tools/verify-site-hardening.js` (append one check).
**Interfaces:** Consumes: nothing from other slices (self-contained scene authorship). Produces: `seqArrival` (arc-arrival story payload), `focusedA0`, `focusBias`/`focusBiasT` + named const `BIAS_MAX_RADS_PER_SEC`, contact→downlink trigger (`celestial.nextLink = 0`), harness check `v3.2m — story beats are guaranteed`, gate screenshot `m-projects-dallas-callout.png`.

Three defects, all in `js/background.js`: (1) `spin.rotation.y = t * 0.22 + scrollN * 2.4;` (:1910) is absolute, so whether the focused place faces the camera when its beat fires is timing luck — and the v3.1 facing gate (`smoothstep(focusedFacing, 0.35, 0.72)`, :1930) then correctly renders nothing. (2) About's dallas→tokyo sequence flips on a fixed 650 ms `setTimeout` (:1396) while the arc it narrates takes ~2 s (`arcN += 1.4 * f` over 128 segments, :1947–1952) — the callout announces TOKYO mid-Pacific. (3) Contact's beat is a copy of home's `lockT = 1` (:1391) while a complete LOS-gated satellite downlink (:1039–1058) fires only on a random 20–60 s timer. No new geometry anywhere; bloom dark-swap set untouched (restated: any object we DON'T touch still swaps type-correct; we add no objects).

- [ ] **Step 1: Harness pin FIRST.** Insert above the `const failed = checks.filter(item => !item.pass);` anchor in `tools/verify-site-hardening.js`:
```js
check('v3.2m — story beats are guaranteed: arc-arrival sync, subliminal focus-bias, contact downlink',
  /BIAS_MAX_RADS_PER_SEC/.test(background) && /seqArrival/.test(background) &&
    !/storyTimer/.test(background) &&
    /celestial\.nextLink = 0/.test(background),
  'sequence beat keys to arc arrival (no 650ms timer), spin carries a rate-capped focus bias, contact fires the LOS downlink');
```
Run harness → new check FAILs, all prior PASS.
- [ ] **Step 2: arrival payload replaces the wall-clock timer.** Edit old_string:
```js
  let storyTimer = 0;
```
new_string:
```js
  let seqArrival = null;   // v3.2m: pending sequence payload — fires on arc ARRIVAL (arcN >= ARC_SEG), not wall-clock
```
Then Edit old_string:
```js
    if (sameSection || storyCooldown > 0) {     // guard re-arming replay/pulse on scroll jitter
      if (!sameSection) {                       // focus still tracks the section; kill any pending
        clearTimeout(storyTimer);               // sequence timer so a dead section can't hijack it
        setFocusedPlace(story.sequence ? story.sequence[1] : story.place, story.intensity * 0.85);
      }
      return;
    }
```
new_string:
```js
    if (sameSection || storyCooldown > 0) {     // guard re-arming replay/pulse on scroll jitter
      if (!sameSection) {                       // focus still tracks the section; kill any pending
        seqArrival = null;                      // arrival payload so a dead section can't hijack it
        setFocusedPlace(story.sequence ? story.sequence[1] : story.place, story.intensity * 0.85);
      }
      return;
    }
```
Then Edit old_string (this deletes the setTimeout plumbing):
```js
    clearTimeout(storyTimer);
    if (story.route === 'replay') replayJourney();
    if (story.sequence) {
      setFocusedPlace(story.sequence[0], story.intensity);
      storyTimer = setTimeout(() => setFocusedPlace(story.sequence[1], story.intensity * 0.85), 650);
      return;
    }
    setFocusedPlace(story.place, story.intensity);
```
new_string:
```js
    seqArrival = null;
    if (story.route === 'replay') replayJourney();
    if (story.sequence) {
      /* v3.2m — narrative sync: the second beat fires when the comet ARRIVES
         (arcN >= ARC_SEG), replacing the desynced 650ms wall-clock timer.
         The callout announces TOKYO exactly when the journey lands. */
      setFocusedPlace(story.sequence[0], story.intensity);
      seqArrival = { place: story.sequence[1], intensity: story.intensity * 0.85 };
      return;
    }
    setFocusedPlace(story.place, story.intensity);
```
`grep -n storyTimer js/background.js` must now return nothing.
- [ ] **Step 3: fire the payload at arc arrival.** Edit old_string (end of the arc block in the loop):
```js
    } else if (arcMat.opacity > 0) {
      arcMat.opacity = Math.max(0, arcMat.opacity - 0.15 * dt);   // ~4.5s afterglow
      if (arcMat.opacity === 0) arcGeo.setDrawRange(0, 0);
    }
```
new_string:
```js
    } else if (arcMat.opacity > 0) {
      arcMat.opacity = Math.max(0, arcMat.opacity - 0.15 * dt);   // ~4.5s afterglow
      if (arcMat.opacity === 0) arcGeo.setDrawRange(0, 0);
    }
    if (seqArrival && arcN >= ARC_SEG) {   // v3.2m: the label lands when the comet does
      const s = seqArrival; seqArrival = null;
      setFocusedPlace(s.place, s.intensity);
    }
```
(Placed AFTER the if/else so it also fires defensively if a payload is ever set while the arc is already complete. Under reduced-motion the loop never runs and `__sceneFocus` still updates focus targets directly — same behavior as before.)
- [ ] **Step 4: subliminal focus-bias on the spin.** First cache the focused place's rest angle. Edit old_string:
```js
  let ping = 0;
  let focusedPlaceId = 'tokyo';
  let focusFlash = 0;
  function setFocusedPlace(id, intensity) {
    focusedPlaceId = placeById(id).id;
    focusFlash = Math.max(focusFlash, intensity || 1);
    if (callout && callout.draw) callout.draw(placeById(focusedPlaceId));
  }
```
new_string:
```js
  let ping = 0;
  let focusedPlaceId = 'tokyo';
  let focusFlash = 0;
  let focusedA0 = tokyoA0;   // v3.2m: focused place's xz rest angle — the spin-bias target
  function setFocusedPlace(id, intensity) {
    focusedPlaceId = placeById(id).id;
    focusFlash = Math.max(focusFlash, intensity || 1);
    const fv = placeVector(placeById(focusedPlaceId), R);   // one alloc per focus CHANGE, never per frame
    focusedA0 = Math.atan2(fv.z, fv.x);
    if (callout && callout.draw) callout.draw(placeById(focusedPlaceId));
  }
```
Then add the bias state. Edit old_string:
```js
  let storyCooldown = 0;                       // seconds; guards re-arming on scroll jitter
```
new_string:
```js
  let storyCooldown = 0;                       // seconds; guards re-arming on scroll jitter
  /* v3.2m — eased focus-bias: while a story window is open the spin drifts
     toward the focused place so the callout's facing gate (:1930) is met when
     the beat fires; afterwards it decays back to pure autonomous drift.
     SUBLIMINAL-SLOW constraint: BIAS_MAX_RADS_PER_SEC caps the ADDED angular
     velocity at ~2× the autonomous 0.066 rad/s — below a conscious "gesture".
     ONE-SIGNAL RULE: the boxed state-word remains the section's one signal;
     this bias must never read as a second one. It cannot cover >~0.7 rad in a
     window by design — partial facing is accepted over a perceptible lurch. */
  let focusBias = 0, focusBiasT = 0;
  const BIAS_MAX_RADS_PER_SEC = 0.12;
  const BIAS_WINDOW_S = 6;
```

> **AMENDMENT 2026-07-10 (v3.2r):** the pinned `BIAS_MAX_RADS_PER_SEC = 0.12` above was a **spec defect** — 0.12 exceeds the autonomous 0.066 rad/s, letting the signed controller freeze or visibly reverse the globe during the state-word (measured −0.054 rad/s live at 5a4480e; `.superpowers/sdd/v32/task-13-report.md:48–84`), a one-signal violation. Superseded spec: the cap MUST be < 0.066 (shipped **0.055**), the regime MUST be forward-only by construction (per-frame target ∈ [0, cap]; behind-targets never chased), and the applied rate MUST be slew-limited (0.15 rad/s², ≤ 0.005 rad/s per frame at the dt clamp) across ALL regime edges — onset, seqArrival flip, window expiry, re-arm. The harness pins the cap by parsed value so a revert fails red. Step 6's "previous count +1" expectation is superseded by "same count, check hardened in place", and the comment block above is intentionally replaced in code. (The Opus fix c7d2dd2 had diverged from this plan silently and shipped un-ramped regime edges; it was reverted and redone on Fable — `.superpowers/sdd/v32r/task-13r-report.md`.)

Arm the window where the cooldown arms. Edit old_string:
```js
    storyCooldown = 0.6;
    sceneState.haloPulse = Math.max(sceneState.haloPulse, story.intensity || 1);
```
new_string:
```js
    storyCooldown = 0.6;
    focusBiasT = BIAS_WINDOW_S;   // v3.2m: open the subliminal facing window
    sceneState.haloPulse = Math.max(sceneState.haloPulse, story.intensity || 1);
```
Apply it in the loop. Edit old_string:
```js
    spin.rotation.y = t * 0.22 + scrollN * 2.4;
```
new_string:
```js
    const spinBase = t * 0.22 + scrollN * 2.4;
    if (focusBiasT > 0) {          // chase: rate-capped P-controller (eases as it closes)
      focusBiasT = Math.max(0, focusBiasT - dt);
      let e = (focusedA0 - Math.PI / 2 - (spinBase + focusBias)) % (Math.PI * 2);
      if (e > Math.PI) e -= Math.PI * 2; else if (e < -Math.PI) e += Math.PI * 2;
      focusBias += Math.sign(e) * Math.min(BIAS_MAX_RADS_PER_SEC * dt, Math.abs(e) * 0.9 * dt);
    } else if (focusBias !== 0) {  // decay home at the same subliminal cap
      const back = Math.min(BIAS_MAX_RADS_PER_SEC * dt, Math.abs(focusBias) * 0.4 * dt);
      focusBias -= Math.sign(focusBias) * back;
      if (Math.abs(focusBias) < 1e-4) focusBias = 0;
    }
    spin.rotation.y = spinBase + focusBias;
```
(Facing is maximal when `sin(focusedA0 − rotation) = 1`, i.e. rotation = `focusedA0 − π/2` — same trig as :1922–1924. The reduced-motion static branch (:1824) sets `spin.rotation.y` directly and never reaches this code.)
- [ ] **Step 5: contact's downlink REPLACES the duplicated lockT beat.** Edit old_string:
```js
    if (id === 'home' || id === 'contact') sceneState.lockT = 1;   // signal-lock beat
```
new_string:
```js
    if (id === 'home') sceneState.lockT = 1;   // signal-lock beat (boot/home only)
    /* v3.2m — contact's own signature: fire the existing LOS-gated satellite
       downlink on section lock (the callout already reads SIGNAL ONLINE).
       REPLACES the duplicated home lockT copy — one signal per section-change
       is preserved: replace, never add. Null under reduced (no celestial). */
    if (id === 'contact' && celestial) celestial.nextLink = 0;
```
Then make the idle event rarer so contact's firing stays special. Edit old_string:
```js
      satA: Math.random() * 6.28, linkT: 0, starT: 0,
      nextLink: 20 + Math.random() * 40, nextStar: 12 + Math.random() * 30,
```
new_string:
```js
      satA: Math.random() * 6.28, linkT: 0, starT: 0,
      nextLink: 60 + Math.random() * 60, nextStar: 12 + Math.random() * 30,   // v3.2m: idle downlink rarer — contact owns the beat
```
and Edit old_string:
```js
      if (los > 0.25) { c.linkT = 1; c.nextLink = 45 + Math.random() * 45; }
```
new_string:
```js
      if (los > 0.25) { c.linkT = 1; c.nextLink = 90 + Math.random() * 90; }   // v3.2m: post-fire idle re-arm lengthened
```
(The existing 4–6 s retry branch on the next line already handles Tokyo facing away at contact-entry — keep it.)
- [ ] **Step 6: syntax + harness.** `node --check js/background.js`; `node tools/verify-site-hardening.js` → ALL GREEN, previous count +1. (The pre-existing pins `storyCooldown`, `sceneState.lockT = 1`, and `warp = 1; sceneState.lockT = 1;` all still match.)
- [ ] **Step 7: version bumps.** `js/boot.mjs`: bump CURRENT `bg` one minor step (pattern: `bg: '4.6'` → `bg: '4.7'`). `index.html`: increment CURRENT `boot.mjs?v=` by 1.
- [ ] **Step 8: live verify.** Open `http://127.0.0.1:8765/?sceneDebug=1` at 1440×900, hard-reload with the new `?v=`. (a) Narrative sync: `evaluate_script` → `window.__sceneFocus('about'); 'armed'` then immediately poll `JSON.stringify({arc: window.__sceneDebug().arcHead, focus: window.__sceneDebug().focusedPlaceId})` — expect `focus:'dallas'` while `arc < 128`; poll again after 3 s — expect `arc: 128` AND `focus:'tokyo'` (the beat landed with the comet, not at 650 ms). (b) Projects beat visibility: scroll to `#projects`, wait 10 s, screenshot → `docs/superpowers/gates/v32/m-projects-dallas-callout.png` — the Dallas callout (`ORIGIN VECTOR // ROUTE TOKYO`) should be visible (bias has drifted Dallas toward the camera); confirm `window.__sceneDebug().focusedPlaceId === 'dallas'`. (c) Contact downlink: scroll to `#contact`, watch ~6 s — the satellite→Tokyo beam fires once (or visibly retries if Tokyo faces away), and no second signal accompanies the state-word. (d) Subliminal check: watch the globe for 10 s after a section change — no perceptible lurch. (e) `list_console_messages` → zero errors. (f) 390×844 hard-reload: no errors, scene alive. (g) Reduced-motion: all new code is inside the non-reduced loop / null-guarded `celestial`; verify static frame renders clean (same emulation approach as Task 12 Step 12c).
- [ ] **Step 9: Commit.** `git add js/background.js js/boot.mjs index.html tools/verify-site-hardening.js`; commit EXACTLY:
```
feat(v32m): story beats

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

### Task 14: The globe survives the phone (v32n)

**Files:** Modify: `js/background.js` (globe offset ~:160–162, debounced resize ~:1787–1797), `js/app.js` (touch parity — insert after the tile-upgrade block ~:192), `css/site.css` (`.shot.lit` rules after ~:649; bump `?v=` in index.html :13), `js/boot.mjs` (bump `bg` AND `app`), `index.html` (css + boot.mjs `?v=`). Test: `tools/verify-site-hardening.js` (append one check).
**Interfaces:** Consumes: Task-1 mobile perf baseline (Lighthouse numbers in the law addendum §baselines); gates dir. Produces: `offsetFor()` and mutable `let OFF` in background.js (Task 15 repositions relative to `OFF`); `.shot.lit` CSS class + `checkLit()` in app.js; harness check `v3.2n — portrait globe branch + touch photo parity`; gates `n-mobile-hero-after.png`, `n-mobile-callout-after.png`, `n-gallery-touch-lit.png`.

Current composition code (background.js:160–162):
```js
  const DEFAULT_OFFSET = LITE ? [5.8, 0.35, -4.5] : [3, 0.4, -2];
  const OFF = window.__SCENE_OFFSET || DEFAULT_OFFSET;
  coreGroup.position.set(OFF[0], OFF[1], OFF[2]);
```
At 390×844 (aspect 0.462) the LITE offset puts the globe center at NDC x≈1.45 — mostly OFF-frame right; the phone gets almost no globe and never the Tokyo callout. Camera math for the new branch: camera z=10, FOV 62° → at globe z=−7.5 (distance 17.5) half-height = tan(31°)·17.5 ≈ 10.5 world units, half-width ≈ 4.86 at aspect 0.462. Offset `[0.8, 4.5, -7.5]` puts the sphere center at NDC (0.165, 0.428) with NDC radius ≈ 0.30 → fully in-frame, upper half of the screen, ~128 px radius. **Luminance-under-text decision (pick ONE): the y-offset.** The hero h1 (64 px ×2 lines at 390 px, vertically centered ≈ y 360–470 px) then overlaps only the sphere's LOWER LIMB, where the land shader's facing term already floors point alpha at 0.18 (`facingAlpha = mix(0.18, 1.0, vFacing)`, :282) — the limb is dim by construction. Chosen over a local darkening shader because it adds ZERO GPU work on phones and retires nothing it would need to pay for. Do not recreate the bright-globe-under-text defect: verify with the Step-6 screenshot. Touch photo parity: the v3.1 rest grade (`.shot .media { filter: brightness(.58) saturate(.45) contrast(1.05); }`, site.css:637) pays off only on `:hover/:focus-visible` (:639) — which never fires on phones; grant the EXISTING grade lift to the tile nearest viewport center, exactly one at a time (one-signal rule), using the same rAF+rect pattern app.js already uses for tile upgrades (:174–192; the file deliberately avoids IntersectionObserver — "IO misbehaves in scaled/preview iframes"). **Bloom dark-swap rule (restated): this task adds no scene objects or materials; the portrait branch implies LITE/small in almost all cases (bloom off), and repositioning `coreGroup` cannot affect the swap. Nothing to re-type.**

- [ ] **Step 1: Harness pin FIRST.** Insert above the `const failed =` anchor:
```js
check('v3.2n — portrait globe branch + touch photo parity',
  /offsetFor/.test(background) && /0\.8, 4\.5, -7\.5/.test(background) &&
    /pointer: coarse/.test(app) && /classList\.add\('lit'\)/.test(app) &&
    /\.shot\.lit \.media/.test(css),
  'aspect-aware globe offset (sphere high behind the name, name on the dim limb) and one-at-a-time .lit focus grade');
```
Run harness → new check FAILs, all prior PASS.
- [ ] **Step 2: aspect-aware offset.** Edit old_string:
```js
  const DEFAULT_OFFSET = LITE ? [5.8, 0.35, -4.5] : [3, 0.4, -2];
  const OFF = window.__SCENE_OFFSET || DEFAULT_OFFSET;
  coreGroup.position.set(OFF[0], OFF[1], OFF[2]);
```
new_string:
```js
  /* v3.2n — the globe survives the phone: below ~0.7 aspect (or <700px) the
     sphere sits smaller (deeper, z -7.5) and HIGH (y 4.5) behind the hero name,
     so the name overlaps only the facing-dimmed lower limb (alpha floors at
     0.18 via vFacing — luminance-under-text discipline, zero added GPU work). */
  const offsetFor = () => ((w / h) < 0.7 || w < 700)
    ? [0.8, 4.5, -7.5]
    : LITE ? [5.8, 0.35, -4.5] : [3, 0.4, -2];
  let OFF = window.__SCENE_OFFSET || offsetFor();
  coreGroup.position.set(OFF[0], OFF[1], OFF[2]);
```
(`w`/`h` are declared at :61 and refreshed by the resize handler — safe here.)
- [ ] **Step 3: re-aim on orientation change.** Edit old_string (inside the debounced resize handler):
```js
      w = innerWidth; h = innerHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
```
new_string:
```js
      w = innerWidth; h = innerHeight;
      camera.aspect = w / h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (!window.__SCENE_OFFSET) {          // v3.2n: portrait↔landscape re-aim
        OFF = offsetFor();
        coreGroup.position.set(OFF[0], OFF[1], OFF[2]);
      }
```
- [ ] **Step 4: touch photo parity (app.js).** Edit old_string:
```js
  addEventListener('scroll', onTileScroll, { passive: true });
  addEventListener('resize', onTileScroll, { passive: true });
  checkTiles();
```
new_string:
```js
  addEventListener('scroll', onTileScroll, { passive: true });
  addEventListener('resize', onTileScroll, { passive: true });
  checkTiles();

  /* v3.2n — touch photo parity: hover doesn't exist on coarse pointers, so the
     tile nearest viewport centre wears the EXISTING focus grade (.lit lifts the
     rest filter) — exactly ONE at a time (one-signal rule). Same rAF+rect
     pattern as checkTiles; IO misbehaves in scaled/preview iframes. The filter
     change is covered by the global reduced-motion transition kill-switch. */
  if (matchMedia('(pointer: coarse)').matches && shots.length) {
    let litShot = null, litTick = false;
    const checkLit = () => {
      const mid = innerHeight / 2;
      let best = null, bestD = Infinity;
      for (const s of shots) {
        const r = s.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestD) { bestD = d; best = s; }
      }
      if (best !== litShot) {
        if (litShot) litShot.classList.remove('lit');
        litShot = best;
        if (litShot) litShot.classList.add('lit');
      }
    };
    addEventListener('scroll', () => {
      if (litTick) return; litTick = true;
      requestAnimationFrame(() => { litTick = false; checkLit(); });
    }, { passive: true });
    checkLit();
  }
```
- [ ] **Step 5: the `.lit` grade (site.css).** Edit old_string:
```css
.shot:hover .id, .shot:hover .plus { opacity: 0.95; transform: translateY(0); }
```
new_string:
```css
.shot:hover .id, .shot:hover .plus { opacity: 0.95; transform: translateY(0); }
/* v3.2n — touch parity: the scroll-centred tile wears the focus grade (JS adds
   .lit on coarse pointers only). Filter lift only, NO transform — a scale on
   scroll would read as motion; the grade change IS the payoff, one at a time. */
.shot.lit { border-color: var(--cyan); }
.shot.lit .media { filter: none; }
```
- [ ] **Step 6: syntax, harness, versions.** `node --check js/background.js && node --check js/app.js`; `node tools/verify-site-hardening.js` → ALL GREEN, previous count +1. Bump `js/boot.mjs` CURRENT `bg` AND `app` one minor step each (pattern: `bg: '4.7'` → `'4.8'`, `app: '3.4'` → `'3.5'`); `index.html`: css link `css/site.css?v=3.20` → CURRENT value +0.01 (e.g. `3.24` → `3.25`), boot.mjs `?v=` +1.
- [ ] **Step 7: live verify — phone frame.** Hard-reload at 390×844. (a) Hero: sphere visible high behind the name, name legible on the dim lower limb → screenshot `docs/superpowers/gates/v32/n-mobile-hero-after.png`. (b) Tokyo callout in-frame: `evaluate_script` → `window.__sceneFocus && window.__sceneFocus('about')`, wait 4 s (post-v32m the second beat fires on arc arrival), screenshot → `docs/superpowers/gates/v32/n-mobile-callout-after.png` — the bilingual `東京 / TOKYO` panel must be fully inside the viewport. If it clips, reduce the portrait x-offset `0.8` → `0.4` and re-verify (record the retune). (c) Touch parity: chrome-devtools mobile emulation reports coarse pointer — scroll to mid-gallery, confirm exactly ONE `.shot.lit` exists (`evaluate_script`: `document.querySelectorAll('.shot.lit').length`) and its photo reads full-color → screenshot `docs/superpowers/gates/v32/n-gallery-touch-lit.png`. (d) 1440×900 hard-reload: desktop composition unchanged (offset ternary falls through to the old values); hover grade still works; zero console errors both sizes (`list_console_messages`).
- [ ] **Step 8: perf re-measure vs Task-1 baseline.** ToolSearch `select:mcp__plugin_ecc_chrome-devtools__lighthouse_audit`, run a mobile performance audit against `http://127.0.0.1:8765/`. Compare LCP and total transferred bytes against the Task-1 numbers in the law addendum. GATE: no regression beyond ~5%. (This task adds ~40 lines of JS and zero assets — a regression means something else broke; investigate before proceeding.) Record the new numbers under the baseline in the addendum as `v32n re-measure`.
- [ ] **Step 9: reduced-motion.** New code paths: offset math (static, runs under reduced too — fine, it's composition not motion) and `.lit` (transition killed by the global kill-switch, no new idle animation). Verify the reduced static frame at 390×844 renders the high sphere + no errors (same emulation approach as Task 12 Step 12c).
- [ ] **Step 10: Commit.** `git add js/background.js js/app.js css/site.css js/boot.mjs index.html tools/verify-site-hardening.js`; commit EXACTLY:
```
feat(v32n): mobile globe + touch parity

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

### Task 15: Lightbox light event + ledger truing (v32o)

**Files:** Modify: `css/site.css` (`.lightbox` bg ~:652, `.lb-strip` ~:667–668, `.about` ~:473, `.about-bio` ~:479, gated `.proj-rail` rules after `.row-end-rule` ~:574, view-transition block at end of file), `js/app.js` (openLb ~:215–223, gates after closeLb ~:231), `js/background.js` (sceneState ~:1365–1373, story ease ~:1875–1879, work story shift), `js/boot.mjs` (bump `bg` + `app`), `index.html` (css + boot.mjs `?v=`). Test: `tools/verify-site-hardening.js` (append one check).
**Interfaces:** Consumes: `let OFF` from Task 14 (globe shift applies relative to it); post-Task-12 sectionStories text (work line reads `rain: 1`); gates dir; gate const names fixed by the spec: `HALO_GATE`, `RAIL_GATE`. Produces: `sceneState.shiftX/shiftZ` + story field `shift: [-1.2, -2.0]`; `.proj-rail` body class; safe-center strip pattern; gates `o-halo-on/off.png`, `o-rail-on/off.png`, `o-gallery-8x5.png`, `o-gallery-anamorphic.png`, `o-gallery-bookend-off.png`, `o-about-reclaim-before/after.png`, `o-work-shift-after.png`, `o-lightbox-after.png`; harness check `v3.2o — lightbox is the one light event`.

**CAUTION (cross-slice drift):** Task 8 (v32h) tokenizes z-indexes and may add `inert`/`visibility` toggles inside `openLb`/`closeLb`. Every old_string below is chosen to avoid the z-index lines; for the openLb edit, if v32h added lines (e.g. `lb.inert = false;`), keep them INSIDE the new `openNow()` body in the same order — the wrapper pattern is the change, not the body.

- [ ] **Step 1: Harness pin FIRST.** Insert above the `const failed =` anchor:
```js
check('v3.2o — lightbox is the one light event (deep scrim, safe-centred strip, gated halo/rail, work shift)',
  /rgba\(2,3,6,0\.985\)/.test(css) && /justify-content: flex-start/.test(css) &&
    /\.lb-thumb:first-child \{ margin-left: auto/.test(css) &&
    /const HALO_GATE = false/.test(app) && /const RAIL_GATE = false/.test(app) &&
    /startViewTransition/.test(app) && /shift: \[-1\.2, -2\.0\]/.test(background),
  'scrim sinks toward true black, strip safe-centres, halo/rail ship OFF behind gates, view-transition morph present, work globe eases left/deeper');
```
Run harness → new check FAILs, all prior PASS. Also capture the About BEFORE: at 1440×900 scroll to `#about`, screenshot → `docs/superpowers/gates/v32/o-about-reclaim-before.png`.
- [ ] **Step 2: scrim sinks toward true black.** Edit css old_string (do NOT include the z-index token — v32h owns it):
```css
background: rgba(2,3,6,0.96);
```
new_string:
```css
background: rgba(2,3,6,0.985); /* v3.2o: the photograph is the ONLY light event — scrim sinks a notch shy of solid so the blur still reads as glass */
```
- [ ] **Step 3: thumb-strip safe-center (confirmed clipping bug: `justify-content:center` + `overflow-x:auto` pushes leading thumbs off-canvas below ~800px — a centered flex container cannot scroll to negative space).** Edit css old_string:
```css
.lb-strip { display: flex; gap: 8px; padding: 14px clamp(20px,4vw,48px) clamp(20px,4vw,40px); overflow-x: auto;
  justify-content: center; }
```
new_string:
```css
.lb-strip { display: flex; gap: 8px; padding: 14px clamp(20px,4vw,48px) clamp(20px,4vw,40px); overflow-x: auto;
  justify-content: flex-start; }
/* v3.2o safe-centre: auto margins centre the strip when it FITS and yield to
   scrolling when it doesn't (the justify-content:center + overflow-x:auto
   combination clipped the leading thumbs below ~800px — confirmed defect). */
.lb-thumb:first-child { margin-left: auto; }
.lb-thumb:last-child { margin-right: auto; }
```
- [ ] **Step 4: view-transition morph (progressive enhancement; fade fallback untouched).** In `js/app.js` Edit old_string:
```js
  function openLb(i) {
    if (!lb) return;
    lbReturnFocus = document.activeElement;
    show(i);
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const c = $('.lb-close'); if (c) c.focus();
  }
```
new_string:
```js
  function openLb(i) {
    if (!lb) return;
    lbReturnFocus = document.activeElement;
    const openNow = () => {
      show(i);
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const c = $('.lb-close'); if (c) c.focus();
    };
    /* v3.2o — progressive enhancement: shared-element morph tile→stage where
       View Transitions exist; everywhere else (and under reduced motion) the
       original fade runs untouched. Name lives on the tile in the OLD state
       and moves to the stage image in the NEW state — never both at once. */
    const srcTile = shots[(i + sources.length) % sources.length];
    const media = srcTile && srcTile.querySelector('.media');
    if (!reduced && typeof document.startViewTransition === 'function' && media && lbImg) {
      media.style.viewTransitionName = 'lb-photo';
      const vt = document.startViewTransition(() => {
        media.style.viewTransitionName = '';
        lbImg.style.viewTransitionName = 'lb-photo';
        openNow();
      });
      vt.finished.finally(() => { lbImg.style.viewTransitionName = ''; });
    } else {
      openNow();
    }
  }
```
And append to `css/site.css` (end of file):
```css
/* v3.2o — lightbox morph timing (progressive enhancement; no-op elsewhere).
   The JS assigns view-transition-name only for the one open gesture. */
@supports (view-transition-name: lb-photo) {
  ::view-transition-group(lb-photo) { animation-duration: .45s; animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1); }
  ::view-transition-old(lb-photo), ::view-transition-new(lb-photo) { height: 100%; object-fit: contain; }
}
```
- [ ] **Step 5: Work section — globe eases left/deeper on `focus='work'`.** Mirror of how About already moves things: About's camera move is the eased story scalar `camera: -0.2` applied via `sceneState.camera += (sceneState.story.camera - sceneState.camera) * Math.min(1, 0.06 * f);` (:1879), and About's portrait-dim is the CSS rest grade `.about-portrait .media { filter: brightness(.58) saturate(.45) contrast(1.05); }` (:500) — same grammar: a per-section eased target, no new layer. In `js/background.js`: (a) Edit old_string (post-Task-12 text; if v32d appended a `grid:` field keep it):
```js
      halo: 1.15, rain: 1, labels: 1, callout: 0.9, camera: 0,
```
new_string:
```js
      halo: 1.15, rain: 1, labels: 1, callout: 0.9, camera: 0, shift: [-1.2, -2.0],   // v3.2o: globe eases left+deeper — row titles never sit on the bright disc
```
(b) Edit old_string:
```js
    haloPulse: 0,
    lockT: 1,          // signal-lock timer (1 → 0), drives ring sweep + glow bloom; starts armed —
```
new_string:
```js
    haloPulse: 0,
    shiftX: 0, shiftZ: 0,   // v3.2o: eased per-section globe offset (only work sets a target)
    lockT: 1,          // signal-lock timer (1 → 0), drives ring sweep + glow bloom; starts armed —
```
(c) Edit old_string:
```js
    sceneState.camera  += (sceneState.story.camera  - sceneState.camera)  * Math.min(1, 0.06 * f);
```
new_string:
```js
    sceneState.camera  += (sceneState.story.camera  - sceneState.camera)  * Math.min(1, 0.06 * f);
    const _sh = sceneState.story.shift || ZERO_SHIFT;                      // v3.2o work shift
    sceneState.shiftX += (_sh[0] - sceneState.shiftX) * Math.min(1, 0.05 * f);
    sceneState.shiftZ += (_sh[1] - sceneState.shiftZ) * Math.min(1, 0.05 * f);
    coreGroup.position.x = OFF[0] + sceneState.shiftX;
    coreGroup.position.z = OFF[2] + sceneState.shiftZ;
```
(d) Declare the zero target. Edit old_string:
```js
  const sectionStories = {
```
new_string:
```js
  const ZERO_SHIFT = [0, 0];
  const sectionStories = {
```
(Reduced-motion: the loop never runs, `coreGroup` stays at `OFF` — static frame unchanged. Bloom dark-swap: no objects/materials added; moving `coreGroup` is swap-neutral — rule satisfied by construction, restated here because this task touches scene code.)
- [ ] **Step 6: About ~200px void reclaim.** Two rules own the dead zone (survey: "~350px of empty starfield below the stat triad; reclaim ~200px"). Edit css old_string:
```css
.about { padding-block: clamp(96px, 16vw, 200px); }
```
new_string:
```css
.about { padding-block: clamp(88px, 12vw, 150px); }  /* v3.2o: −50px top/bottom at desktop — scarcity should look chosen, not leftover */
```
and Edit css old_string:
```css
.about-bio { display: grid; gap: 28px; }
```
new_string:
```css
.about-bio { display: grid; gap: 28px; align-self: stretch; align-content: space-between; }  /* v3.2o: stat row bottom-aligns with the portrait's bottom edge — closes the dead bottom-left quadrant */
```
(`align-self: stretch` overrides the grid's `align-items: start` for the bio column only; at ≤800px the grid is single-column and auto-height, so `space-between` is inert on mobile.)
- [ ] **Step 7: GATED — photo ambient halo (ships OFF).** In `js/app.js` Edit old_string (tail of closeLb — unique):
```js
    if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
    lbReturnFocus = null;
  }
```
new_string:
```js
    if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
    lbReturnFocus = null;
  }

  /* v3.2o GATED — photo ambient halo: average-colour DOM glow behind the
     lightbox image. The pass's ONLY new-emissive-layer candidate; ships OFF.
     Owner decides on gates/v32/o-halo-on.png vs o-halo-off.png plus the
     frame-luminance numbers. Flip HALO_GATE to true ONLY for the gate capture. */
  const HALO_GATE = false;
  if (HALO_GATE && lbImg) {
    const av = document.createElement('canvas'); av.width = av.height = 1;
    const avx = av.getContext('2d', { willReadFrequently: true });
    lbImg.addEventListener('load', () => {
      try {
        avx.drawImage(lbImg, 0, 0, 1, 1);
        const d = avx.getImageData(0, 0, 1, 1).data;
        lbImg.style.boxShadow =
          '0 0 60px rgba(0,0,0,0.7), 0 0 110px 8px rgba(' + d[0] + ',' + d[1] + ',' + d[2] + ',0.20)';
      } catch (e) { /* tainted canvas — halo silently off */ }
    });
  }

  /* v3.2o GATED — minimal typographic stack rail: per-row tech readouts align
     as ONE column; the alignment IS the rail, nothing is drawn (the L3
     deferral's over-framing warning stands). Ships OFF pending owner A/B:
     gates/v32/o-rail-on.png vs o-rail-off.png. */
  const RAIL_GATE = false;
  if (RAIL_GATE) document.body.classList.add('proj-rail');
```
And append the rail CSS to `css/site.css` (after the view-transition block from Step 4):
```css
/* v3.2o GATED (.proj-rail via RAIL_GATE, app.js) — stack readouts as one
   aligned right-hand column, no drawn rule. */
body.proj-rail .proj-end { flex-direction: column; align-items: flex-end; gap: 6px; }
body.proj-rail .proj-tech { text-align: right; max-width: none; min-width: 30ch; }
```
- [ ] **Step 8: syntax, harness, versions.** `node --check js/app.js && node --check js/background.js`; `node tools/verify-site-hardening.js` → ALL GREEN, previous count +1. Bump `js/boot.mjs` CURRENT `bg` and `app` one minor step each; `index.html`: css `?v=` +0.01, boot.mjs `?v=` +1.
- [ ] **Step 9: live verify — ships.** Hard-reload 1440×900 with new `?v=`s. (a) Open a gallery tile: in Chrome the tile MORPHS into the stage (then the full-res swaps in); scrim near-black; screenshot → `docs/superpowers/gates/v32/o-lightbox-after.png`. (b) Strip fix: resize to 700×900, open the lightbox, `evaluate_script`: `(() => { const s = document.querySelector('.lb-strip'); s.scrollLeft = 0; return s.firstElementChild.getBoundingClientRect().left >= 0; })()` → must return `true` (first thumb reachable). (c) Work shift: back to 1440×900, scroll to `#work`, wait 3 s — globe eased left/deeper, row titles clear of the disc → screenshot `docs/superpowers/gates/v32/o-work-shift-after.png`; scroll back to hero — globe eases home. (d) About: screenshot `#about` → `docs/superpowers/gates/v32/o-about-reclaim-after.png` (compare against Step-1 before: stats bottom-aligned, seam tighter). (e) `list_console_messages` → zero errors; repeat load at 390×844 → zero errors, About single-column intact, lightbox usable. (f) Reduced-motion: view-transition branch is `!reduced`-gated, shift ease lives in the non-reduced loop, gates are OFF — verify static frame clean (same emulation approach as Task 12 Step 12c). (g) Frame-luminance sanity on `o-lightbox-after.png`: mean must be BELOW the Task-1 hero baseline (the scrim got darker; if not, something regressed).
- [ ] **Step 10: gate captures — halo A/B.** With the lightbox open on IMG_01 at 1440×900: screenshot → `docs/superpowers/gates/v32/o-halo-off.png`; run `node tools/frame-luminance.mjs` on it and note the numbers. Then temporarily Edit `js/app.js` `const HALO_GATE = false;` → `const HALO_GATE = true;`, bump nothing (dev-only), hard-reload with a throwaway query (`?halogate=1` appended manually to the URL busts nothing — instead do a devtools hard reload / disable cache), open the same image, screenshot → `docs/superpowers/gates/v32/o-halo-on.png`, run frame-luminance. The halo may only be OFFERED to the owner if on-mean ≤ off-mean + 2 (near-parity; the scrim darkening in Step 2 is what pays for it) — record both JSON outputs in the gate pile. Revert the Edit to `const HALO_GATE = false;` and re-run `node --check js/app.js` + harness (the pin requires `= false`).
- [ ] **Step 11: gate captures — rail A/B.** At 1440×900 scroll to `#projects`: screenshot → `docs/superpowers/gates/v32/o-rail-off.png`. `evaluate_script`: `document.body.classList.add('proj-rail')` (runtime toggle — no code edit needed), screenshot → `docs/superpowers/gates/v32/o-rail-on.png`, then `document.body.classList.remove('proj-rail')`.
- [ ] **Step 12: gate captures — gallery feature ratio + bookend (devtools only, NOT committed code).** At 1440×900 scroll to `#gallery`: screenshot → `docs/superpowers/gates/v32/o-gallery-8x5.png`. Then `evaluate_script`:
```js
document.querySelectorAll('.shot.feature, .gallery-grid .shot:last-child').forEach(el => { el.style.aspectRatio = '2.2 / 1'; });
```
screenshot → `docs/superpowers/gates/v32/o-gallery-anamorphic.png`. Then bookend-drop variant:
```js
document.querySelectorAll('.shot.feature, .gallery-grid .shot:last-child').forEach(el => { el.style.aspectRatio = ''; });
const last = document.querySelector('.gallery-grid .shot:last-child');
last.style.gridColumn = 'auto'; last.style.aspectRatio = '4 / 5';
```
screenshot → `docs/superpowers/gates/v32/o-gallery-bookend-off.png`. Reset: `last.style.gridColumn = ''; last.style.aspectRatio = '';` — confirm the grid returns to 2+3+3+3+2.
- [ ] **Step 13: Commit** (gates dir is git-ignored — verify `git status` shows only the six intended files). `git add js/app.js js/background.js css/site.css js/boot.mjs index.html tools/verify-site-hardening.js`; commit EXACTLY:
```
feat(v32o): lightbox + ledger truing

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

### Task 16: Campaign close-out (no commit)

**Files:** Create: `docs/superpowers/gates/v32/GATE-PILE.md` (git-ignored — a review index, not a repo doc). Modify: nothing. Test: full harness + perf + histograms.
**Interfaces:** Consumes: every `docs/superpowers/gates/v32/*.png` from Tasks 1–15, the Task-1 baselines in `docs/superpowers/specs/2026-07-08-v32-law-addendum.md`, `tools/frame-luminance.mjs`. Produces: the assembled gate pile; a STOPPED, owner-review-ready branch.

- [ ] **Step 1: full harness.** `node --check js/background.js && node --check js/effects.js && node --check js/app.js && node --check js/boot.js && node --check js/cursor.js`, then `node tools/verify-site-hardening.js` → ALL GREEN (final count = 22 v3.1 checks + every pin Tasks 1–15 added; record the number).
- [ ] **Step 2: final measurements vs Task-1 baselines.** At 1440×900, fresh hard-reload, wait 8 s: hero screenshot + `#projects` screenshot → `node tools/frame-luminance.mjs` on each → both `mean` and `warmShare` ≤ the addendum baselines (the campaign's net-light-drops promise, now proven end-to-end). Re-run the mobile Lighthouse audit (Task 14 Step 8 procedure) → within ~5% of baseline. Append all final numbers to the addendum under `## v3.2 close-out measurements`.
- [ ] **Step 3: full-viewport sweep.** 1440×900 AND 390×844, hard-reload each: zero console errors; walk home→about→work→gallery→projects→contact confirming one signal per section-change (state-word; contact adds only the downlink which REPLACED its lockT copy); reduced-motion pass renders the static frame with zero errors.
- [ ] **Step 4: assemble the gate pile.** Write `docs/superpowers/gates/v32/GATE-PILE.md` listing every gate screenshot with its ONE decision question, in review order (adjust names to what earlier slices actually produced; the list below covers this slice plus the spec's standing gates):
  1. `c-scantag-before.png` / `c-scantag-after.png` — scan-tag face: keep JetBrains Mono (Rajdhani retired)?
  2. `i-jp-headline-*.png` — JP display headline wording: 作品 / レンズ越しに / 代表作 — approve or reword?
  3. `l-hero-before/after.png`, `l-projects-before/after.png` (+ frame-luminance JSON pairs) — motivated rain: does the frame read cinematic-dark, not empty?
  4. `m-projects-dallas-callout.png` — the guaranteed Dallas beat: earns its place?
  5. `n-mobile-hero-after.png`, `n-mobile-callout-after.png`, `n-gallery-touch-lit.png` — phone composition + touch grade: name legible on the dim limb?
  6. `o-lightbox-after.png` — deeper scrim: right depth?
  7. `o-halo-off.png` vs `o-halo-on.png` (+ both frame-luminance JSONs) — photo ambient halo: ship ON or keep OFF? (only new-emissive-layer candidate of the pass)
  8. `o-rail-off.png` vs `o-rail-on.png` — typographic stack rail: ship ON or keep OFF?
  9. `o-gallery-8x5.png` vs `o-gallery-anamorphic.png` vs `o-gallery-bookend-off.png` — feature ratio 8:5 vs ~2.2:1, and last-tile span-2 bookend keep/drop?
  10. `o-about-reclaim-before/after.png`, `o-work-shift-after.png` — ledger truing: composed or over-corrected?
  11. Any screenshots an implementer flagged as taste-ambiguous during Tasks 1–15 (list them here with their question).
- [ ] **Step 5: STOP.** Confirm `git status` clean, all v32a–v32o commits present on `v3-build` (`git log --oneline -16`). Do NOT push. Do NOT open a PR. Report to the owner: harness count, final luminance + perf numbers vs baseline, and the gate-pile path for the one-session review. The campaign ends here pending owner sign-off.
