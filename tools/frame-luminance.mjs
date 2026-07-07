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
