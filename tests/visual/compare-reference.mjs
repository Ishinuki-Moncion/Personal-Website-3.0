import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const ids = ['home', 'about', 'work', 'gallery', 'projects', 'contact'];
const root = '.superpowers/gates/codex-v34/package-a-reference';
const beforeDir = `${root}/before/layout`;
const afterDir = `${root}/after/layout`;
const diffRequested = process.argv.includes('--diff');
const diffDir = `${root}/diff`;
const limit = 0.005;

if (diffRequested) await mkdir(diffDir); // fail rather than overwrite an evidence set

let failed = false;
for (const id of ids) {
  const before = PNG.sync.read(await readFile(`${beforeDir}/${id}.png`));
  const after = PNG.sync.read(await readFile(`${afterDir}/${id}.png`));
  if (before.width !== after.width || before.height !== after.height) {
    console.error(`${id}: size mismatch ${before.width}x${before.height} vs ${after.width}x${after.height}`);
    failed = true;
    continue;
  }

  const diff = diffRequested ? new PNG({ width: before.width, height: before.height }) : null;
  const differentPixels = pixelmatch(
    before.data,
    after.data,
    diff?.data,
    before.width,
    before.height
  );
  const ratio = differentPixels / (before.width * before.height);
  console.log(`${id}: ${ratio.toFixed(6)} (${differentPixels}/${before.width * before.height})`);
  if (diff) await writeFile(`${diffDir}/${id}.png`, PNG.sync.write(diff));
  if (ratio > limit) failed = true;
}

if (failed) process.exitCode = 1;
