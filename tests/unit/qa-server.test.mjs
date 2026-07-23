import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { symlink, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

async function startServer() {
  const child = spawn(process.execPath, ['tests/helpers/serve.mjs'], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  const url = await new Promise((resolveUrl, reject) => {
    let stdout = '';
    const timer = setTimeout(() => reject(new Error('QA server did not report its bound port')), 5_000);
    const onExit = code => {
      clearTimeout(timer);
      reject(new Error(stderr || `QA server exited ${code}`));
    };
    child.once('exit', onExit);
    child.stdout.on('data', chunk => {
      stdout += chunk;
      const match = stdout.match(/qa-server (http:\/\/127\.0\.0\.1:\d+)/);
      if (!match) return;
      clearTimeout(timer);
      child.off('exit', onExit);
      resolveUrl(match[1]);
    });
  });
  return { child, url };
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolveExit => child.once('exit', resolveExit)),
    delay(2_000)
  ]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

test('QA server serves the site allowlist and rejects repository internals', async () => {
  const { child, url } = await startServer();
  try {
    const publicPaths = [
      '/',
      '/index.html',
      '/404.html',
      '/favicon.svg',
      '/css/site.css',
      '/js/app.js',
      '/js/vendor/three-0.158.0/three.module.min.js',
      '/images/gallery-07.jpg',
      '/fonts/hanken-grotesk-latin.woff2',
      '/tests/device/mobile-rich-calibration.html',
      '/tests/device/mobile-rich-calibration.mjs'
    ];
    for (const pathname of publicPaths) {
      const response = await fetch(url + pathname);
      assert.equal(response.status, 200, `${pathname} should return 200`);
    }
    const weightedGzip = await fetch(`${url}/css/site.css`, {
      headers: { 'Accept-Encoding': 'br, gzip;q=1.0' }
    });
    assert.equal(weightedGzip.headers.get('content-encoding'), 'gzip');
    const excludedGzip = await fetch(`${url}/css/site.css`, {
      headers: { 'Accept-Encoding': 'gzip;q=0' }
    });
    assert.equal(excludedGzip.headers.get('content-encoding'), null);

    const sensitivePaths = [
      '/.git',
      '/.gitignore',
      '/.superpowers/sdd/task-8-brief.md',
      '/node_modules/lighthouse/package.json',
      '/package-lock.json'
    ];
    for (const pathname of sensitivePaths) {
      const response = await fetch(url + pathname);
      assert.equal(response.status, 404, `${pathname} should return 404`);
    }

    const escapeName = `__qa-symlink-escape-${process.pid}.html`;
    const escapePath = resolve('tests/device', escapeName);
    await symlink('/etc/hosts', escapePath);
    try {
      const response = await fetch(`${url}/tests/device/${escapeName}`);
      assert.equal(response.status, 404, 'an allowlisted-path symlink must not escape the site root');
    } finally {
      await unlink(escapePath);
    }
  } finally {
    await stopServer(child);
  }
});
