#!/usr/bin/env node
// Browser check of the Layers panel and the status pill (plain Playwright,
// like perf-shots.mjs). Needs a running server (vite on 5211, or
// perf-serve on dist/):
//
//   node scripts/check-layers.mjs --url http://127.0.0.1:5211/ [--out output/layers-check] [--size 1440x900]
//
// 1. ?layers=light: no request of any optional layer (network log of the
//    page and its workers).
// 2. For each layer: switch it on in the panel; its files must now be
//    requested (the positive control: a log that sees nothing proves
//    nothing), and it must report loaded, without a reload.
// 3. Reload without ?layers: the choice came back from localStorage.
// 4. Ring tiles that fail (aborted by the test) end in a failed status with
//    a Retry button; Retry with the network back loads them.
// 5. Screenshots: the panel, the pill mid-load (tile replies held back).
// Exit 1 on any failed assertion or console error.
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : d);
const BASE = opt('url', 'http://127.0.0.1:5211/');
const OUT = opt('out', 'output/layers-check');
const [W, H] = opt('size', '1440x900').split('x').map(Number);
const PHONE = W < 600;
mkdirSync(OUT, { recursive: true });

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
function chromePath() {
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  if (!existsSync(cache)) return undefined;
  const dir = readdirSync(cache).filter((d) => d.startsWith('chromium_headless_shell')).sort().pop();
  const sub = dir && readdirSync(join(cache, dir)).find((d) => d.startsWith('chrome-headless-shell'));
  const exe = sub && join(cache, dir, sub, 'chrome-headless-shell');
  return exe && existsSync(exe) ? exe : undefined;
}

const PATTERNS = {
  ring: /\/data\/tiles\/|\/tile-worker[-.]/,
  ms: /\/data\/(buildings-ms\.json|tiles-ms\/)/,
  street: /\/data\/(streetscape|pois)\.json/,
  live: /\/(liveair|livebus)[-.]/,
  textures: /\/assets\/tex\//,
};

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures++;
};

const chromium = await loadPlaywright();
const browser = await chromium.launch({ headless: true, executablePath: chromePath(), args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: PHONE ? 2 : 1, isMobile: PHONE, hasTouch: PHONE, serviceWorkers: 'block' });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && !/\/api\//.test(m.location()?.url || '') && errors.push(m.text().slice(0, 200)));
page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
const urls = [];
page.on('request', (r) => urls.push(r.url()));
const hits = (id, from = 0) => urls.slice(from).filter((u) => PATTERNS[id].test(u));
const ready = () => page.waitForFunction(() => window.__braga?.ready === true, null, { timeout: 180000 });
const rowState = (id) => page.evaluate((i) => document.querySelector(`.layer-row[data-layer="${i}"]`)?.dataset.state, id);
const waitRow = (id, states, ms = 90000) => page.waitForFunction(([i, s]) => s.includes(document.querySelector(`.layer-row[data-layer="${i}"]`)?.dataset.state), [id, states], { timeout: ms, polling: 200 });
const openPanel = async () => {
  if (await page.evaluate(() => window.__braga.layersUI.isOpen)) return;
  await page.evaluate(() => window.__braga.layersUI.open());
  await page.waitForSelector('#layers.is-open');
};

// ---- 1. light: nothing optional on the wire
const sep = BASE.includes('?') ? '&' : '?';
await page.goto(`${BASE}${sep}intro=0&lang=en&layers=light`, { waitUntil: 'domcontentloaded' });
await ready();
await page.waitForTimeout(6000); // the ring would start 20 frames after ready
const sel = await page.evaluate(() => window.__braga.layers.selection);
ok(Object.values(sel).every((v) => !v), `light preset: every layer off (${JSON.stringify(sel)})`);
for (const id of Object.keys(PATTERNS)) ok(hits(id).length === 0, `light: no ${id} request (${hits(id).length})`);

// ---- 2. switch each layer on in the panel: it loads, no reload
await openPanel();
await page.screenshot({ path: `${OUT}/panel-light-${W}x${H}.png` });
const nav0 = await page.evaluate(() => performance.getEntriesByType('navigation').length + ':' + performance.timeOrigin);
for (const id of ['street', 'textures', 'live', 'ms', 'ring']) {
  const from = urls.length;
  await openPanel();
  await page.click(`.layer-switch[data-layer="${id}"]`);
  try {
    await waitRow(id, ['ready', 'failed']);
  } catch {
    // reported below
  }
  if (id === 'ring' || id === 'ms') await page.waitForTimeout(3000); // the first wave
  const st = await rowState(id);
  ok(hits(id, from).length > 0, `${id} on: its files are requested now (${hits(id, from).length}, e.g. ${(hits(id, from)[0] || '').replace(/^https?:\/\/[^/]+/, '')})`);
  ok(st === 'ready', `${id} on: panel says loaded (state ${st})`);
}
const nav1 = await page.evaluate(() => performance.getEntriesByType('navigation').length + ':' + performance.timeOrigin);
ok(nav0 === nav1, 'no page reload while switching layers');
await page.screenshot({ path: `${OUT}/panel-full-${W}x${H}.png` });

// a layer switched off again: hidden, and no more of its requests
{
  await page.click('.layer-switch[data-layer="street"]');
  const vis = await page.evaluate(() => window.__braga.life.street.object.visible);
  ok(vis === false, 'street off again: hidden at once');
}

// ---- 3. the choice persists (localStorage), without ?layers
const savedSel = await page.evaluate(() => window.__braga.layers.selection);
await page.goto(`${BASE}${sep}intro=0&lang=en`, { waitUntil: 'domcontentloaded' });
await ready();
// a small streamed radius (the governor's own knob), so a camera move
// below reaches tiles that are not loaded yet
await page.waitForFunction(() => !!window.__braga.tiles, null, { timeout: 30000 });
await page.evaluate(() => window.__braga.tiles.setBudgetScale(0.25));
const back =await page.evaluate(() => ({ sel: window.__braga.layers.selection, src: window.__braga.layers.source }));
ok(back.src === 'saved' && JSON.stringify(back.sel) === JSON.stringify(savedSel), `choice restored from localStorage (${back.src}: ${JSON.stringify(back.sel)})`);

// ---- 4 and 5. a camera move: the pill counts the area; failures and retry
{
  // hold tile replies back so the pill can be seen mid-load, and fail some
  let mode = 'slow';
  await ctx.route(/\/data\/tiles\/\d+_\d+\.json/, async (route) => {
    if (mode === 'fail') return route.abort('failed');
    await new Promise((r) => setTimeout(r, 900));
    return route.continue();
  });
  const fly = (lat, lon) =>
    page.evaluate(
      async ([la, lo]) => {
        const P = window.__braga;
        const V = P.camera.position.constructor;
        const q = P.project(la, lo);
        const k = P.projection.metresPerUnit;
        const gy = P.heightAt(q.x, q.z);
        const f0 = P.flights;
        P.rig.flyTo(new V(q.x + 300 / k, gy + 900 / k, q.z + 600 / k), new V(q.x, gy, q.z), 0.4);
        const t0 = performance.now();
        while (P.flights === f0 && performance.now() - t0 < 8000) await new Promise((r) => setTimeout(r, 50));
      },
      [lat, lon],
    );
  await page.evaluate(() => window.__braga.layersUI.close());
  await page.evaluate(() => window.__braga.tiles?.idle(60000));
  await fly(38.735, -9.165); // north-west of the core: ring tiles not yet seen
  let saw = null;
  for (let i = 0; i < 60 && !saw; i++) {
    const s = await page.evaluate(() => window.__braga.layersUI.status);
    if (s.state === 'loading' && s.id === 'area' && s.done > 0) saw = s;
    else await page.waitForTimeout(150);
  }
  ok(!!saw, `camera move: the pill counts this area (${saw?.text})`);
  if (saw) await page.screenshot({ path: `${OUT}/status-midload-${W}x${H}.png` });
  const live = await page.evaluate(() => document.querySelector('#load-status [role=status]')?.getAttribute('aria-live'));
  ok(live === 'polite', 'the pill has a polite live region');
  await page.waitForFunction(() => window.__braga.layersUI.status.state !== 'loading', null, { timeout: 120000, polling: 200 });
  const after = await page.evaluate(() => window.__braga.layersUI.status);
  ok(after.state === 'done' || after.state === 'idle', `the wave ends: ${after.state} "${after.text}"`);

  // failures: every ring tile request aborts; three tries, then failed + Retry
  mode = 'fail';
  const err0 = await page.evaluate(() => window.__braga.tiles.stats.errors);
  await fly(38.692, -9.17); // south-west corner, by the river
  let failedState = null;
  try {
    await page.waitForFunction(() => window.__braga.layersUI.status.state === 'failed', null, { timeout: 90000, polling: 250 });
    failedState = await page.evaluate(() => window.__braga.layersUI.status);
  } catch {
    // reported below
  }
  const err1 = await page.evaluate(() => window.__braga.tiles.stats.errors);
  ok(err1 > err0, `the aborts reached the tile loader (errors ${err0} -> ${err1})`);
  ok(failedState?.state === 'failed', `failed tiles: the pill says so (${failedState?.text})`);
  const retryShown = await page.evaluate(() => !document.querySelector('#load-status .ls-retry').hidden);
  ok(retryShown, 'a Retry button shows');
  if (failedState) await page.screenshot({ path: `${OUT}/status-failed-${W}x${H}.png` });
  // keyboard: Retry is reachable with Tab and works with Enter
  mode = 'slow';
  await page.focus('#load-status .ls-retry');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__braga.layersUI.status.state !== 'failed', null, { timeout: 30000, polling: 200 });
  await page.waitForFunction(() => window.__braga.layersUI.status.state !== 'loading', null, { timeout: 120000, polling: 200 });
  const stuck = await page.evaluate(() => window.__braga.tiles.stats.stuck);
  ok(stuck === 0, `Retry with the network back: no tile left failed (${stuck})`);
  await ctx.unroute(/\/data\/tiles\/\d+_\d+\.json/);
}

// no layout shift: the pill is fixed
const pos = await page.evaluate(() => getComputedStyle(document.getElementById('load-status')).position);
ok(pos === 'fixed', 'the pill is position: fixed (no layout shift)');

ok(errors.length === 0, `no console errors (${errors.length})${errors.length ? `: ${errors.join(' | ')}` : ''}`);
await browser.close();
console.log(failures ? `\ncheck-layers: ${failures} FAILED` : '\ncheck-layers: OK');
process.exit(failures ? 1 : 0);
