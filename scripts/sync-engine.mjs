#!/usr/bin/env node
// Port engine updates from an engine source repo (default: the braga-3d source
// of truth) into this fork, without ever overwriting this fork's own work.
//
//   node scripts/sync-engine.mjs --dry-run   print the table (also the default)
//   node scripts/sync-engine.mjs --apply     apply 'behind' files, write *.conflict for 'diverged'
//   node scripts/sync-engine.mjs --record    set the base to the source's committed HEAD
//   --verbose                                also explain the 'absent' count
//
// Environment (all optional):
//   BRAGA_DIR       the engine source repo (default ../braga-3d). Another fork
//                   can be the source too: BRAGA_DIR=../porto-3d
//   ENGINE_BASE     a commit of the source to use as the base instead of the
//                   one in scripts/engine-base.json (a source whose history
//                   does not contain the recorded base, e.g. porto-3d)
//   ENGINE_EXCLUDE  extra comma-separated regexes of source paths to skip (the
//                   source's own city files, e.g. '^src/models/porto/,\.porto\.js$')
//
// A 3-way compare per engine file, by git blob hash:
//   base  = the file in the source at the commit recorded in scripts/engine-base.json
//   fork  = this fork's working-tree file
//   head  = the file at the source's committed HEAD (uncommitted source work is invisible)
//
//   same      fork == head                          nothing to do
//   behind    only the source changed since base    --apply copies the source's file
//   ahead     only this fork changed since base     skipped, listed
//   diverged  both changed, and they differ         --apply writes <file>.conflict (the source's
//                                                   version) next to the fork file, skips it
//
// The source is only ever read (git ls-tree / git show); this script writes
// into this fork only, and only with --apply or --record.
//
// Engine = src/, scripts/, api/, index.html, vite.config.js, minus this fork's
// city files (src/models/barcelos/, src/locales/*.barcelos.js, the barcelos
// pipeline scripts) and the sync script itself. Files the source has and this
// fork does not carry (the source's own models and locales) are not engine
// files for this fork: counted as 'absent'.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = process.env.BRAGA_DIR ? resolve(process.env.BRAGA_DIR) : resolve(ROOT, '..', 'braga-3d');
const BASE_FILE = join(ROOT, 'scripts', 'engine-base.json');
const PATHS = ['src', 'scripts', 'api', 'index.html', 'vite.config.js'];
const EXCLUDE = [
  /^src\/models\/barcelos\//,
  /^src\/locales\/[a-z]+\.barcelos\.js$/,
  /^scripts\/sync-engine\.(sh|mjs)$/,
  /^scripts\/engine-base\.(json|txt)$/,
  /^scripts\/(build|fetch)-barcelos-[a-z]+\.mjs$/,
  /\.conflict$/,
  ...(process.env.ENGINE_EXCLUDE || '').split(',').filter(Boolean).map((s) => new RegExp(s)),
];
const args = new Set(process.argv.slice(2));
const mode = args.has('--apply') ? 'apply' : args.has('--record') ? 'record' : 'dry-run';

const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 }).trim();
const die = (m) => {
  console.error(`error: ${m}`);
  process.exit(1);
};
if (!existsSync(join(SOURCE, '.git'))) die(`engine source not found at ${SOURCE} (set BRAGA_DIR)`);

const HEAD = git(SOURCE, 'rev-parse', 'HEAD');
if (mode === 'record') {
  writeFileSync(BASE_FILE, JSON.stringify({ commit: HEAD, recorded: new Date().toISOString().slice(0, 10), source: SOURCE.split('/').pop() }, null, 2) + '\n');
  console.log(`recorded engine base: ${HEAD}`);
  process.exit(0);
}
let BASE = process.env.ENGINE_BASE;
if (!BASE) {
  if (!existsSync(BASE_FILE)) die(`no ${BASE_FILE}; run with --record`);
  BASE = JSON.parse(readFileSync(BASE_FILE, 'utf8')).commit;
}
try {
  BASE = git(SOURCE, 'rev-parse', '--verify', `${BASE}^{commit}`);
} catch {
  die(`base ${BASE} is not a commit of ${SOURCE}; set ENGINE_BASE to a commit of that repo`);
}

// path -> blob hash, for a commit's engine paths
function tree(commit) {
  const out = git(SOURCE, 'ls-tree', '-r', commit, '--', ...PATHS);
  const m = new Map();
  for (const line of out ? out.split('\n') : []) {
    const [meta, path] = line.split('\t');
    if (!EXCLUDE.some((re) => re.test(path))) m.set(path, meta.split(' ')[2]);
  }
  return m;
}
const baseTree = tree(BASE);
const headTree = tree(HEAD);
const forkHash = (p) => {
  const f = join(ROOT, p);
  return existsSync(f) ? execFileSync('git', ['hash-object', f], { encoding: 'utf8' }).trim() : null;
};

const rows = [];
let absent = 0;
for (const p of [...new Set([...baseTree.keys(), ...headTree.keys()])].sort()) {
  const b = baseTree.get(p) ?? null;
  const h = headTree.get(p) ?? null;
  const f = forkHash(p);
  if (f === null && b === h) {
    absent++; // the source's own file, never carried here
    continue;
  }
  if (f === null && h !== null && b === null) {
    rows.push({ p, state: 'behind', note: 'new in source' });
    continue;
  }
  if (f === null) {
    absent++;
    continue;
  }
  if (f === h) {
    rows.push({ p, state: 'same' });
    continue;
  }
  const forkChanged = f !== b;
  const sourceChanged = h !== b;
  if (!forkChanged && sourceChanged) rows.push({ p, state: 'behind', note: h === null ? 'deleted in source' : '' });
  else if (forkChanged && !sourceChanged) rows.push({ p, state: 'ahead' });
  else rows.push({ p, state: 'diverged' });
}

const width = Math.max(4, ...rows.filter((r) => r.state !== 'same').map((r) => r.p.length));
console.log(`engine source : ${SOURCE}`);
console.log(`base          : ${BASE}`);
console.log(`source HEAD   : ${HEAD}${BASE === HEAD ? '  (base == HEAD)' : ''}`);
console.log(`mode          : ${mode}\n`);
console.log(`${'file'.padEnd(width)}  state`);
console.log(`${'-'.repeat(width)}  --------`);
for (const r of rows) if (r.state !== 'same') console.log(`${r.p.padEnd(width)}  ${r.state}${r.note ? ` (${r.note})` : ''}`);
const count = (s) => rows.filter((r) => r.state === s).length;
console.log(`\nsame ${count('same')} | behind ${count('behind')} | ahead ${count('ahead')} | diverged ${count('diverged')} | absent in fork ${absent}`);
if (args.has('--verbose')) console.log("(absent = source files this fork does not carry: the source's models, locales, game, discovery)");

if (mode === 'apply') {
  console.log('');
  for (const r of rows) {
    const dest = join(ROOT, r.p);
    if (r.state === 'behind') {
      if (headTree.get(r.p) == null) {
        rmSync(dest, { force: true });
        console.log(`removed   ${r.p}`);
        continue;
      }
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, execFileSync('git', ['show', `${HEAD}:${r.p}`], { cwd: SOURCE, maxBuffer: 1 << 28 }));
      console.log(`applied   ${r.p}`);
    } else if (r.state === 'diverged') {
      writeFileSync(`${dest}.conflict`, execFileSync('git', ['show', `${HEAD}:${r.p}`], { cwd: SOURCE, maxBuffer: 1 << 28 }));
      console.log(`conflict  ${r.p}.conflict (the source's version; merge by hand, delete the .conflict file)`);
    }
  }
  console.log('\ndone. Review: git diff --stat && npm run verify. After merging, run --record to move the base.');
} else if (count('behind') || count('diverged')) {
  console.log('\nReport only. --apply copies the behind files and writes *.conflict for diverged ones; ahead files are never touched.');
}
