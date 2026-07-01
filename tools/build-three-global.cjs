const fs = require('fs');
const path = require('path');

const [, , sourceArg, outArg] = process.argv;

if (!sourceArg || !outArg) {
  console.error('Usage: node tools/build-three-global.cjs <three.module.min.js> <out-file>');
  process.exit(1);
}

const sourcePath = path.resolve(sourceArg);
const outPath = path.resolve(outArg);
const source = fs.readFileSync(sourcePath, 'utf8');

const footerMatch = source.match(/export\{([\s\S]+)\};\s*$/);
if (!footerMatch) {
  console.error('Could not find the final ESM export block.');
  process.exit(1);
}

const licenseMatch = source.match(/^\/\*\*[\s\S]*?\*\/\n?/);
const license = licenseMatch ? licenseMatch[0] : '';
const bodyStart = licenseMatch ? license.length : 0;
const body = source.slice(bodyStart, footerMatch.index);
const exportedItems = footerMatch[1].split(',').map(item => item.trim()).filter(Boolean);

const properties = exportedItems.map(item => {
  const alias = item.match(/^([A-Za-z_$][\w$]*) as ([A-Za-z_$][\w$]*)$/);
  if (alias) return `${alias[2]}:${alias[1]}`;
  if (/^[A-Za-z_$][\w$]*$/.test(item)) return `${item}:${item}`;
  console.error(`Unsupported export item: ${item}`);
  process.exit(1);
});

const output = `${license}/* Generated from three@0.158.0/build/three.module.min.js.
   This keeps the static site on classic scripts and exposes window.THREE
   without using Three's deprecated build/three.min.js browser entry. */
(function(globalThis){
${body}globalThis.THREE={${properties.join(',')}};
})(globalThis);
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, output);
console.log(`Wrote ${path.relative(process.cwd(), outPath)} with ${exportedItems.length} exports.`);
