#!/usr/bin/env node
// First-load bytes and time to interactive on a throttled phone profile
// (perf/profiles.json), counting every request until the network is quiet.
// perf-bench.mjs stops counting at `ready`; on Fast 3G the textures are
// still on the wire then, so its transfer figure hides most of the cost.
//
//   node scripts/measure-load.mjs --root dist --port 5233 [--profile phone-low] [--query "layers=light"] [--runs 2] [--out output/measure/x.json]
//
// Serves <root> with perf-serve.mjs (brotli, as Vercel). Service workers are
// blocked. Requests from the page and its workers are counted (Playwright
// reports dedicated-worker requests on the page). Network throttling is set
// on the page target only, so worker fetches (ring tiles) are not throttled.
import { spawn, execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

const ROOT = join(import.meta.dirname, '..');
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : d);
const SITE = opt('root', 'dist');
const PORT = opt('port', '5233');
const PROFILE = opt('profile', 'phone-low');
const QUERY = opt('query', '');
const RUNS = Number(opt('runs', '1'));
const OUT = opt('out', null);
const QUIET_MS = Number(opt('quiet', '5000'));
const CAP_MS = Number(opt('cap', '300000'));
const prof = JSON.parse(readFileSync(join(ROOT, 'perf/profiles.json'), 'utf8'))[PROFILE];
if (!prof) throw new Error(`unknown profile ${PROFILE}`);

async function loadPlaywright() {
  const c = [process.env.PLAYWRIGHT_CORE, 'playwright-core'].filter(Boolean);
  try {
    c.push(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), '@playwright/cli/node_modules/playwright-core/index.mjs'));
  } catch {
    // no global npm
  }
  for (const p of c) {
    try {
      const m = await import(p.startsWith('/') ? pathToFileURL(p).href : p);
      if (m.chromium || m.default?.chromium) return m.chromium || m.default.chromium;
    } catch {
      // next
    }
  }
  throw new Error('playwright-core not found (set PLAYWRIGHT_CORE)');
}

// the newest installed headless shell (as perf-bench.mjs chromePath)
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  if (!existsSync(cache)) return undefined;
  const dir = readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell')).sort().pop();
  const sub = dir && readdirSync(join(cache, dir)).find((d) => d.startsWith('chrome-headless-shell'));
  const exe = sub && join(cache, dir, sub, 'chrome-headless-shell');
  return exe && existsSync(exe) ? exe : undefined;
}

const GPU = {
  metal: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu', '--enable-webgl'],
  swiftshader: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
};

const kindOf = (u) => (/\/assets\/tex\//.test(u) ? 'textures' : /\/data\/tiles\//.test(u) ? 'ring' : /\/data\/(buildings-ms|tiles-ms)/.test(u) ? 'ms' : /\/data\/(streetscape|pois)\.json/.test(u) ? 'street' : /\/static\/(liveair|livebus)-/.test(u) ? 'live' : /\/static\/tile-worker-/.test(u) ? 'ring' : 'core');

async function oneRun(chromium) {
  const server = spawn(process.execPath, [join(ROOT, 'scripts/perf-serve.mjs'), PORT, '--root', SITE], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((res) => server.stdout.on('data', (d) => String(d).includes('cache warm') && res()));
  let browser = null;
  try {
    browser = await chromium.launch({ headless: true, executablePath: chromePath(), args: GPU[prof.gpu] });
    const ctx = await browser.newContext({ viewport: prof.viewport, deviceScaleFactor: prof.dpr, hasTouch: !!prof.touch, isMobile: !!prof.mobile, serviceWorkers: 'block' });
    if (prof.deviceMemory) await ctx.addInitScript(`Object.defineProperty(Navigator.prototype,'deviceMemory',{get:()=>${prof.deviceMemory},configurable:true});`);
    if (prof.hardwareConcurrency) await ctx.addInitScript(`Object.defineProperty(Navigator.prototype,'hardwareConcurrency',{get:()=>${prof.hardwareConcurrency},configurable:true});`);
    if (prof.rendererString) await ctx.addInitScript(`(() => { const R = ${JSON.stringify(prof.rendererString)}; for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) { const o = C.prototype.getParameter; C.prototype.getParameter = function (p) { return p === 0x9246 ? R : o.call(this, p); }; } })();`);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    if (prof.network) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: prof.network.latencyMs, downloadThroughput: (prof.network.downloadKbps * 1000) / 8, uploadThroughput: (prof.network.uploadKbps * 1000) / 8 });
    if (prof.cpuThrottle > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: prof.cpuThrottle });
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && !/\/api\//.test(m.location()?.url || '') && errors.push(m.text().slice(0, 200)));
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
    let inflight = 0;
    let lastActivity = Date.now();
    const done = [];
    let t0 = 0;
    page.on('request', () => {
      inflight++;
      lastActivity = Date.now();
    });
    const settle = async (req, failed) => {
      inflight = Math.max(0, inflight - 1);
      lastActivity = Date.now();
      const url = req.url();
      if (/\/api\//.test(url)) return;
      let bytes = 0;
      if (!failed) {
        try {
          const s = await req.sizes();
          bytes = s.responseBodySize + s.responseHeadersSize;
        } catch {
          // gone
        }
      }
      done.push({ url: url.replace(/^https?:\/\/[^/]+/, ''), bytes, t: Date.now() - t0, failed, kind: kindOf(url) });
    };
    page.on('requestfinished', (r) => settle(r, false));
    page.on('requestfailed', (r) => settle(r, true));
    t0 = Date.now();
    await page.goto(`http://localhost:${PORT}/?intro=0&lang=en${QUERY ? `&${QUERY}` : ''}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__braga?.interactive === true, null, { timeout: CAP_MS, polling: 200 });
    const tInteractive = await page.evaluate(() => window.__braga.timing.interactive);
    await page.waitForFunction(() => window.__braga?.ready === true, null, { timeout: CAP_MS, polling: 200 });
    // network quiet: nothing in flight for QUIET_MS (or the cap)
    while (Date.now() - t0 < CAP_MS) {
      if (inflight === 0 && Date.now() - lastActivity > QUIET_MS) break;
      await page.waitForTimeout(250);
    }
    const info = await page.evaluate(() => ({ timing: window.__braga.timing, tier: window.__braga.tier, layers: window.__braga.layers?.selection ?? null }));
    const sum = (rows) => rows.reduce((a, r) => a + r.bytes, 0);
    const byKind = {};
    for (const r of done) byKind[r.kind] = (byKind[r.kind] || 0) + r.bytes;
    const res = {
      profile: PROFILE,
      root: SITE,
      query: QUERY,
      cls: info.tier?.cls,
      layers: info.layers,
      interactiveMs: tInteractive,
      readyMs: info.timing.ready,
      bytesAtInteractive: sum(done.filter((r) => r.t <= tInteractive)),
      bytesSettled: sum(done),
      settledAtMs: Math.max(0, ...done.map((r) => r.t)),
      requests: done.length,
      byKind,
      failed: done.filter((r) => r.failed).map((r) => r.url),
      errors,
    };
    return res;
  } finally {
    await browser?.close();
    server.kill();
  }
}

const chromium = await loadPlaywright();
const runs = [];
for (let i = 0; i < RUNS; i++) {
  const r = await oneRun(chromium);
  runs.push(r);
  const kb = (b) => `${Math.round(b / 1024)} KB`;
  console.log(`[${SITE} ${QUERY || 'default'}] run ${i + 1}: class ${r.cls}, interactive ${r.interactiveMs} ms, ready ${r.readyMs} ms, bytes at interactive ${kb(r.bytesAtInteractive)}, settled ${kb(r.bytesSettled)} at ${r.settledAtMs} ms, ${r.requests} requests, errors ${r.errors.length}`);
  console.log(`   by kind: ${Object.entries(r.byKind).map(([k, v]) => `${k} ${kb(v)}`).join(', ')}`);
}
if (OUT) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(runs, null, 2));
}
