import test from 'node:test';
import { access } from 'node:fs/promises';

test('QA harness production inputs exist', async () => {
  await Promise.all([
    access('index.html'),
    access('404.html'),
    access('tools/verify-site-hardening.js')
  ]);
});
