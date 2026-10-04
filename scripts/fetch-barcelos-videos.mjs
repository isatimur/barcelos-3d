// Resolve real YouTube videos for each Barcelos landmark.
//
// Searches YouTube for "<place> Barcelos", takes the top few distinct results,
// validates each through the oEmbed endpoint (title + channel), and writes
// data/sources/videos.json:
//   { "<id>": [{ youtube_id, title, channel, lang }, ...] }
//
// Node 22, no deps. The language is recorded as "pt" only when the channel or
// title strongly indicates Portuguese; otherwise "other" (never guessed).
//
// Usage: node scripts/fetch-barcelos-videos.mjs [--per 2] [--only <id>]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { places } from '../content/barcelos.mjs';

const UA = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
  'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8',
};
const argv = process.argv.slice(2);
const onlyIdx = argv.indexOf('--only');
const ONLY = onlyIdx >= 0 ? argv[onlyIdx + 1] : null;
const perIdx = argv.indexOf('--per');
const PER = perIdx >= 0 ? parseInt(argv[perIdx + 1], 10) : 2;

const outPath = 'data/sources/videos.json';
const store = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchIds(query, want) {
  const res = await fetch(
    'https://www.youtube.com/results?search_query=' + encodeURIComponent(query),
    { headers: UA, signal: AbortSignal.timeout(30000) },
  );
  if (!res.ok) throw new Error(`youtube ${res.status}`);
  const html = await res.text();
  const ids = [...html.matchAll(/"videoId":"([\w-]{11})"/g)].map((m) => m[1]);
  const uniq = [...new Set(ids)];
  return uniq.slice(0, want + 3);
}

async function oembed(id) {
  const res = await fetch(
    'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(`https://www.youtube.com/watch?v=${id}`),
    { headers: UA, signal: AbortSignal.timeout(20000) },
  );
  if (!res.ok) return null;
  return res.json();
}

const PT = /portugu|lusa|barcelos|braga|portugal|cm-|municíp|câmara/i;
for (const place of places) {
  if (ONLY && place.id !== ONLY) continue;
  console.log(`${place.id}:`);
  const existing = store[place.id] || [];
  if (existing.length >= PER) {
    console.log(`  already has ${existing.length}`);
    continue;
  }
  let ids = [];
  try {
    ids = await searchIds(`${place.name[0]} Barcelos`, PER);
  } catch (e) {
    console.warn(`  search failed: ${e.message}`);
    continue;
  }
  const videos = [...existing];
  for (const id of ids) {
    if (videos.length >= PER) break;
    if (videos.some((v) => v.youtube_id === id)) continue;
    try {
      const meta = await oembed(id);
      if (!meta?.title || !meta?.author_name) continue;
      const lang = PT.test(`${meta.title} ${meta.author_name}`) ? 'pt' : 'other';
      videos.push({ youtube_id: id, title: meta.title.slice(0, 160), channel: meta.author_name.slice(0, 120), lang });
      console.log(`  + ${id} | ${meta.author_name} | ${meta.title.slice(0, 80)}`);
      await sleep(800);
    } catch (e) {
      console.warn(`  ${id}: ${e.message}`);
    }
  }
  if (videos.length) {
    store[place.id] = videos;
    writeFileSync(outPath, JSON.stringify(store, null, 2) + '\n');
  }
  await sleep(800);
}
console.log('done.');
