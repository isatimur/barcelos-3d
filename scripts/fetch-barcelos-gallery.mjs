// Build per-landmark photo galleries for Barcelos from Wikimedia Commons.
//
// For each place it collects up to N free-licensed JPEGs that plausibly depict
// the landmark (preferring files whose title mentions it, plus the Wikidata
// Commons category P373 when known), downloads them to assets/img/<id>-<n>.jpg,
// and records a gallery in data/sources/media.json:
//   images: [{ src, credit:{author,license,source_url} }, ...]
// while keeping src/credit (the hero) pointing at the first image.
//
// Node 22, no deps. Usage:
//   node scripts/fetch-barcelos-gallery.mjs [--per 4] [--only <id>]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { places } from '../content/barcelos.mjs';

const UA = { 'User-Agent': 'Barcelos3D/1.0 (educational map; contact: local)' };
const argv = process.argv.slice(2);
const onlyIdx = argv.indexOf('--only');
const ONLY = onlyIdx >= 0 ? argv[onlyIdx + 1] : null;
const ALWAYS = argv.includes('--force');
const perIdx = argv.indexOf('--per');
const PER = perIdx >= 0 ? parseInt(argv[perIdx + 1], 10) : 4;

mkdirSync('assets/img', { recursive: true });
const mediaPath = 'data/sources/media.json';
const media = existsSync(mediaPath) ? JSON.parse(readFileSync(mediaPath, 'utf8')) : {};
const wdPath = 'data/.cache/research/wikidata.json';
const wikidata = existsSync(wdPath) ? JSON.parse(readFileSync(wdPath, 'utf8')) : { entities: {} };

const clean = (s) => String(s || '')
  .replace(/<[^>]*>/g, '')
  .replace(/&amp;/g, '&')
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

const FREE = /^(CC BY(-SA)?|CC0|Public domain|CC-BY|CC-BY-SA)/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: 'json', action: 'query', ...params });
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status === 503) && attempt < 5) {
      await sleep(1500 * attempt * attempt);
      continue;
    }
    throw new Error(`${host} ${res.status}`);
  }
}

// Candidate File: titles for a place: Wikidata P373 category members + search.
async function candidates(place) {
  const out = [];
  const wd = place.wikidata && wikidata.entities?.[place.wikidata];
  const cat = wd?.claims?.P373?.[0]?.mainsnak?.datavalue?.value;
  const queries = [];
  if (cat) queries.push({ list: 'categorymembers', cmtitle: `Category:${cat}`, cmtype: 'file', cmlimit: '12' });
  queries.push({ list: 'search', srsearch: `${place.name[0]} Barcelos`, srnamespace: '6', srlimit: '12' });

  for (const q of queries) {
    try {
      const j = await api('commons.wikimedia.org', q);
      const titles = (j.query?.categorymembers || j.query?.search || []).map((m) => m.title);
      out.push(...titles);
    } catch (e) {
      console.warn(`  ${place.id}: ${q.list} failed: ${e.message}`);
    }
    if (out.length >= PER * 3) break;
  }
  // De-dupe, keep only File: JPEGs, prefer titles that mention the place name.
  const seen = new Set();
  const files = [];
  for (const t of out) {
    if (!/^File:/i.test(t) || seen.has(t)) continue;
    if (!/\.jpe?g$/i.test(t)) continue;
    seen.add(t);
    files.push(t);
  }
  const key = place.name[0].toLowerCase().split(/[ (]/)[0];
  files.sort((a, b) => (b.toLowerCase().includes(key) ? 1 : 0) - (a.toLowerCase().includes(key) ? 1 : 0));
  return files;
}

async function fetchImages(place) {
  const files = await candidates(place);
  const images = [];
  for (const title of files) {
    if (images.length >= PER) break;
    try {
      const j = await api('commons.wikimedia.org', {
        action: 'query',
        titles: title,
        prop: 'imageinfo',
        iiprop: 'url|extmetadata|size',
        iiurlwidth: '1280',
      });
      const info = Object.values(j.query?.pages || {})[0]?.imageinfo?.[0];
      if (!info) continue;
      const license = clean(info.extmetadata?.LicenseShortName?.value);
      if (!FREE.test(license)) continue;
      const width = info.width || 0;
      const height = info.height || 0;
      if (width < 640 || height < 480) continue;
      const src = `assets/img/${place.id}-${images.length + 1}.jpg`;
      const dl = await fetch(info.thumburl || info.url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (!dl.ok) continue;
      const data = Buffer.from(await dl.arrayBuffer());
      if (data[0] !== 0xff || data[1] !== 0xd8) continue;
      writeFileSync(src, data);
      images.push({
        src,
        credit: {
          author: clean(info.extmetadata?.Artist?.value) || 'Wikimedia Commons contributors',
          license,
          source_url: info.descriptionurl,
        },
      });
      console.log(`  ${place.id}: ${src} (${license}, ${data.length} bytes) <- ${title}`);
      await sleep(1300);
    } catch (e) {
      console.warn(`  ${place.id}: ${title} failed: ${e.message}`);
    }
  }
  return images;
}

for (const place of places) {
  if (ONLY && place.id !== ONLY) continue;
  if (media[place.id]?.images?.length && !ALWAYS) { console.log(`${place.id}: has gallery, skipped`); continue; }
  console.log(`${place.id}:`);
  const images = await fetchImages(place);
  if (!images.length) {
    console.warn(`  ${place.id}: no free images found`);
    continue;
  }
  const prev = media[place.id] || {};
  media[place.id] = {
    ...prev,
    images,
    src: images[0].src,
    credit: images[0].credit,
  };
  writeFileSync(mediaPath, JSON.stringify(media, null, 2) + '\n');
}

console.log('done.');
