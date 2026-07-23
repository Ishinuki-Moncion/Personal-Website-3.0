import { spawn } from 'node:child_process';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import lighthouse, { desktopConfig } from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import {
  desktopPasses,
  displayMetrics,
  extractMetrics,
  medianMetrics,
  mobilePasses
} from './lighthouse-policy.mjs';

const root = resolve(import.meta.dirname, '../..');
const url = 'http://127.0.0.1:4173/';
const outputDirectory = await mkdtemp(join(tmpdir(), 'daikie-lh-'));
const networkMode = process.env.LIGHTHOUSE_NETWORK_MODE === 'production-network';
const mode = networkMode ? 'production-network' : 'deterministic-first-party';
let server;
let chrome;

function failingAuditIds(lhr) {
  return lhr.categories.performance.auditRefs
    .filter(reference => reference.weight > 0)
    .filter(reference => {
      const score = lhr.audits[reference.id]?.score;
      return typeof score === 'number' && score < 1;
    })
    .map(reference => reference.id)
    .sort();
}

async function waitForServer() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`QA server exited before health check (code ${server.exitCode})`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch { /* keep polling until the deadline */ }
    await delay(100);
  }
  throw new Error('QA server did not answer on port 4173 within 15 seconds');
}

async function runAudit(label, config) {
  const chromeFlags = [
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage'
  ];
  if (!networkMode) {
    chromeFlags.push('--host-resolver-rules=MAP * 0.0.0.0, EXCLUDE 127.0.0.1');
  }
  chrome = await chromeLauncher.launch({
    chromeFlags
  });
  try {
    const lighthouseOptions = {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance']
    };
    if (!networkMode) {
      lighthouseOptions.blockedUrlPatterns = ['https://fonts.googleapis.com/*', 'https://fonts.gstatic.com/*'];
    }
    const result = await lighthouse(`${url}?lighthouse=${encodeURIComponent(label)}`, lighthouseOptions, config);
    if (!result?.lhr) throw new Error(`Lighthouse returned no report for ${label}`);
    await writeFile(join(outputDirectory, `${label}.json`), String(result.report));
    return {
      label,
      metrics: extractMetrics(result.lhr),
      environment: {
        formFactor: result.lhr.configSettings.formFactor,
        viewport: result.lhr.configSettings.screenEmulation
      },
      failingAuditIds: failingAuditIds(result.lhr)
    };
  } finally {
    await chrome.kill();
    chrome = null;
  }
}

function printableRun(run) {
  return { ...run, metrics: displayMetrics(run.metrics) };
}

try {
  console.log(JSON.stringify({
    label: 'lighthouse-mode',
    mode,
    googleFonts: networkMode ? 'live network' : 'excluded',
    productionNetworkEvidence: networkMode
  }));
  server = spawn(process.execPath, ['tests/helpers/serve.mjs'], {
    cwd: root,
    env: { ...process.env, HOST: '127.0.0.1', PORT: '4173' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverStderr = '';
  server.stderr.on('data', chunk => { serverStderr += chunk; });
  await waitForServer();

  const mobileRuns = [];
  for (let index = 1; index <= 3; index++) {
    const run = await runAudit(`mobile-cold-${index}`);
    mobileRuns.push(run);
    console.log(JSON.stringify(printableRun(run)));
  }
  const medians = medianMetrics(mobileRuns.map(run => run.metrics));
  console.log(JSON.stringify({ label: 'mobile-median', mode, sortedMedian: displayMetrics(medians) }));

  const desktop = await runAudit('desktop-cold-1', desktopConfig);
  if (desktop.environment.formFactor !== 'desktop' || desktop.environment.viewport.mobile !== false) {
    throw new Error(`Desktop Lighthouse config did not apply: ${JSON.stringify(desktop.environment)}`);
  }
  console.log(JSON.stringify(printableRun(desktop)));

  const failed = [];
  if (!mobilePasses(medians)) {
    failed.push({
      gate: 'mobile-median',
      values: displayMetrics(medians),
      rawValues: medians,
      failingAuditIds: [...new Set(mobileRuns.flatMap(run => run.failingAuditIds))].sort()
    });
  }
  if (!desktopPasses(desktop.metrics)) {
    failed.push({
      gate: 'desktop',
      values: displayMetrics(desktop.metrics),
      rawValues: desktop.metrics,
      failingAuditIds: desktop.failingAuditIds
    });
  }
  if (failed.length) {
    console.error(JSON.stringify({ lighthouseGate: 'FAIL', mode, reports: outputDirectory, failed }));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ lighthouseGate: 'PASS', mode, reports: outputDirectory }));
  }
  if (server.exitCode !== null && server.exitCode !== 0) throw new Error(serverStderr || `QA server exited ${server.exitCode}`);
} finally {
  if (chrome) {
    try {
      await chrome.kill();
    } catch {}
    chrome = null;
  }
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await Promise.race([
      new Promise(resolveExit => server.once('exit', resolveExit)),
      delay(2_000)
    ]);
    if (server.exitCode === null) server.kill('SIGKILL');
  }
}
