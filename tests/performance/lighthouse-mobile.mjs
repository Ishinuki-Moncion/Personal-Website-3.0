import { spawn } from 'node:child_process';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import lighthouse, { desktopConfig } from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const root = resolve(import.meta.dirname, '../..');
const url = 'http://127.0.0.1:4173/';
const outputDirectory = await mkdtemp(join(tmpdir(), 'daikie-lh-'));
let server;
let chrome;

function metric(lhr, id) {
  const value = lhr.audits[id]?.numericValue;
  if (!Number.isFinite(value)) throw new Error(`Lighthouse audit ${id} has no numeric value`);
  return value;
}

function summarize(lhr) {
  return {
    performance: Math.round((lhr.categories.performance.score ?? 0) * 100),
    FCP: Math.round(metric(lhr, 'first-contentful-paint')),
    LCP: Math.round(metric(lhr, 'largest-contentful-paint')),
    CLS: Number(metric(lhr, 'cumulative-layout-shift').toFixed(4)),
    TBT: Math.round(metric(lhr, 'total-blocking-time'))
  };
}

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

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function mobileMedian(runs) {
  return Object.fromEntries(
    ['performance', 'FCP', 'LCP', 'CLS', 'TBT'].map(key => [key, median(runs.map(run => run.summary[key]))])
  );
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
  chrome = await chromeLauncher.launch({
    chromeFlags: [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--host-resolver-rules=MAP * 0.0.0.0, EXCLUDE 127.0.0.1'
    ]
  });
  try {
    const result = await lighthouse(`${url}?lighthouse=${encodeURIComponent(label)}`, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance'],
      blockedUrlPatterns: ['https://fonts.googleapis.com/*', 'https://fonts.gstatic.com/*']
    }, config);
    if (!result?.lhr) throw new Error(`Lighthouse returned no report for ${label}`);
    await writeFile(join(outputDirectory, `${label}.json`), String(result.report));
    return {
      label,
      summary: summarize(result.lhr),
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

function mobilePasses(values) {
  return values.performance >= 80 && values.LCP <= 2500 && values.CLS <= 0.10 && values.TBT <= 200;
}

function desktopPasses(values) {
  return values.performance >= 85 && values.LCP <= 2500 && values.CLS <= 0.10;
}

try {
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
    console.log(JSON.stringify(run));
  }
  const medians = mobileMedian(mobileRuns);
  console.log(JSON.stringify({ label: 'mobile-median', sortedMedian: medians }));

  const desktop = await runAudit('desktop-cold-1', desktopConfig);
  if (desktop.environment.formFactor !== 'desktop' || desktop.environment.viewport.mobile !== false) {
    throw new Error(`Desktop Lighthouse config did not apply: ${JSON.stringify(desktop.environment)}`);
  }
  console.log(JSON.stringify(desktop));

  const failed = [];
  if (!mobilePasses(medians)) {
    failed.push({
      gate: 'mobile-median',
      values: medians,
      failingAuditIds: [...new Set(mobileRuns.flatMap(run => run.failingAuditIds))].sort()
    });
  }
  if (!desktopPasses(desktop.summary)) {
    failed.push({ gate: 'desktop', values: desktop.summary, failingAuditIds: desktop.failingAuditIds });
  }
  if (failed.length) {
    console.error(JSON.stringify({ lighthouseGate: 'FAIL', reports: outputDirectory, failed }));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ lighthouseGate: 'PASS', reports: outputDirectory }));
  }
  if (server.exitCode !== null && server.exitCode !== 0) throw new Error(serverStderr || `QA server exited ${server.exitCode}`);
} finally {
  if (chrome) await chrome.kill().catch(() => {});
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await Promise.race([
      new Promise(resolveExit => server.once('exit', resolveExit)),
      delay(2_000)
    ]);
    if (server.exitCode === null) server.kill('SIGKILL');
  }
}
