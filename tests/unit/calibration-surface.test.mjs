import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const calibrationHtml = await readFile(
  new URL('../device/mobile-rich-calibration.html', import.meta.url),
  'utf8'
);

test('full-bleed owner calibration protects every iPhone safe-area edge', () => {
  assert.match(calibrationHtml, /viewport-fit=cover/);

  for (const edge of ['top', 'right', 'bottom', 'left']) {
    assert.match(
      calibrationHtml,
      new RegExp(`env\\(safe-area-inset-${edge}\\)`),
      `missing safe-area protection for ${edge}`
    );
  }
});
