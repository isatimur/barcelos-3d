# barcelos-3d Delta Contract

## Overview

barcelos-3d is a single-city fork of the Braga 3D engine (Vite + three.js, real-scale city map). It shows Barcelos, Portugal. Every place-specific constant lives in `cities/barcelos.json` and `data/` [AGENTS.md: Overview]. This file records only how the fork differs from its upstream. For the engine itself, read the upstream contract (last line).

- City id: `barcelos` [cities/barcelos.json:id]. Names: Barcelos (pt, en), Барселуш (ru).
- Domain: `https://barcelos.portugal-3d.com` [cities/barcelos.json:domain]. Also `public_url`. Hostnames: `barcelos-3d.com`, `www.barcelos-3d.com`, `barcelos-3d.vercel.app`, `barcelos.portugal-3d.com` [cities/barcelos.json:hostnames]. The file says the domain waits for the deploy [cities/barcelos.json:domain_note].
- Data folder: `data` [cities/barcelos.json:data_dir].
- Features: `story: true` [cities/barcelos.json:features].
- Landmark ids (16, from `data/landmarks.json`): ponte-medieval, bom-jesus-cruz, igreja-matriz, paco-condes, torre-menagem, museu-olaria, pacos-concelho, solar-pinheiros, teatro-gil-vicente, estadio-cidade, parque-cidade, jardim-barrocas, mercado-municipal, igreja-barcelinhos, capela-ponte, casa-azenha.
- Fork HEAD: `bc31023ace29846f3421a079c36460ea93f459be` (Merge feat/layers-and-loading, 2026-11-18). Working tree: clean (`git status --short | wc -l` = 0).
- Engine base recorded at the fork cut: Braga `1784ff3ac71ae8a7e3a8247adf48f494827800cc` (2026-10-06) [scripts/engine-base.json:commit].
- Compared against: Braga git main `431ff94`. Date of comparison: 2026-11-22.
- Scope of the comparison: `src/` (with `src/models/` and `src/locales/`), `scripts/`, `api/`, `public/sw.js`, `vite.config.js`, `package.json`, `vercel.json`. Excluded: node_modules, dist, data, assets, docs, output, .git, .vercel, .DS_Store.
- Counts: 132 files in the fork, 170 in Braga, 104 shared. Shared: 37 identical, 67 changed. Only in the fork: 28 files (18 entries; `src/models/barcelos/` holds 11 files). Only in Braga: 66 files.
- Current state: the next candidates are builders for the seven archetype landmarks (`igreja-barcelinhos` first) and a performance governor [claude-progress.md: Current Verified State]. Session 011 (2026-11-18) ported the Layers panel and loading status from lisboa-3d. The progress log says the branch was not merged, pushed or deployed at that time; the HEAD commit is the merge.

## Fork-Only Interface

Files that exist in the fork and not in Braga.

City and runtime:

- `src/city-id.js`: [src/city-id.js:resolveCityId] picks the city id from env id, query and hostname. Local and unknown preview hosts load Barcelos [scripts/check-city.test.mjs]. `src/city.js` re-exports it [src/city.js:resolveCityId].
- `src/materials-tex.js`: triplanar texture materials. Exports [src/materials-tex.js:TEXTURE_FILES], [src/materials-tex.js:TEX_PROGRESS], [src/materials-tex.js:TEX], [src/materials-tex.js:loadMaterials], [src/materials-tex.js:retryTextures], [src/materials-tex.js:texturesEnabled], [src/materials-tex.js:setTexturesEnabled], [src/materials-tex.js:bindTextures], and the GLSL chunks [src/materials-tex.js:TRIPLANAR], [src/materials-tex.js:TRIPLANAR_NORMAL], [src/materials-tex.js:TRIPLANAR_ROUGH]. Used by `facades.js`, `scene.js`, `streetscape.js`, `main.js`.
- `src/locales/en.barcelos.js`, `src/locales/pt.barcelos.js`: the Barcelos texts. Each exports [src/locales/en.barcelos.js:landmarks] and [src/locales/en.barcelos.js:routes] (same two names in `pt.barcelos.js`). Braga keeps `en.js` and `pt.js` instead; the fork loads `./locales/<lang>.<city>.js` for every city [src/i18n.js:loadTranslations].

Landmark builders (`src/models/barcelos/`):

- [src/models/barcelos/detailed.js:detailedBuilders]: the table of detailed builders.
- [src/models/barcelos/block.js:blockBuilders]: block-model builders for landmarks without a detailed model.
- One default export per detailed landmark: [src/models/barcelos/ponte-medieval.js:default], [src/models/barcelos/igreja-matriz.js:default], [src/models/barcelos/paco-condes.js:default], [src/models/barcelos/torre-menagem.js:default], [src/models/barcelos/pacos-concelho.js:default], [src/models/barcelos/solar-pinheiros.js:default], [src/models/barcelos/teatro-gil-vicente.js:default], [src/models/barcelos/capela-ponte.js:default], [src/models/barcelos/casa-azenha.js:default]. Each returns `{ '<landmark-id>': builder }`.

Scripts:

- `scripts/build-barcelos.mjs`: deterministic build from reviewed content (`content/barcelos.mjs`) and the checked-in OSM snapshot.
- `scripts/fetch-barcelos-gallery.mjs`: per-landmark free-licensed photo galleries from Wikimedia Commons into `assets/img/` and `data/sources/media.json`.
- `scripts/fetch-barcelos-media.mjs`: maps Wikidata ids to landmark ids and fetches media.
- `scripts/fetch-barcelos-routes.mjs`: walking routes from the FOSSGIS walking profile only.
- `scripts/fetch-barcelos-videos.mjs`: YouTube video ids per landmark into `data/sources/videos.json`.
- `scripts/check-city.test.mjs`: tests for [src/city-id.js:resolveCityId].
- `scripts/sync-engine.mjs`: 3-way, hash-guarded report of engine changes from an engine source; `--apply` copies only files the fork has not touched and writes `*.conflict` for the rest [AGENTS.md: Engine Lineage].
- `scripts/engine-base.json`: the recorded engine base commit.
- `scripts/measure-load.mjs`: first-load bytes and time to interactive on a throttled phone profile.
- `scripts/perf-bench.mjs`, `scripts/perf-serve.mjs`, `scripts/perf-page.js`, `scripts/perf-shots.mjs`: the perf bench, a Vercel-like static server for `dist/`, the bench page, and a screenshot helper (`perf-shots.mjs` imports Playwright from an absolute path in the user's home).

## Changed Engine Files

Differing lines count `<` and `>` lines from `diff braga fork`, so it counts both sides. Rows are sorted by count.

| File | Differing lines | What differs |
| --- | --- | --- |
| src/nature.js | 677 | Braga has the Minho species 5-11 (chestnut, plane, poplar, willow, reed, hedgerow, meadow) and `TREE_SPECIES`; the fork has five species. |
| src/style.css | 648 | not determined (CSS not read). |
| src/people.js | 618 | Braga has the varied crowd (children, elderly, cyclists, dogs, market crowd); the fork has standing groups, seated guests, one 28-triangle figure. |
| src/main.js | 546 | Fork imports `story.js`, `guide.js`, `materials-tex.js`; Braga imports `discovery.js` and `mountTool`, and has the quest, history route text and `debug.buildingClock`. |
| src/streetscape.js | 337 | Fork binds triplanar textures; Braga has tuned calçada patterns (line width, pitch). |
| src/facades.js | 275 | Fork adds plaster, granite and roof texture samplers (albedo, normal, roughness) and the triplanar chunks. |
| src/roads.js | 250 | Fork adds `isBridgeModel` use; Braga exports `asphaltGrain`. |
| src/scene.js | 238 | Fork binds textures; Braga has `SHROUD_UNIFORMS` and the fog-of-war reveal mask for the game. |
| src/effects.js | 169 | Fork adds `ContactShadowPass` (depth-only SSAO, `?ao=1` forces, `?ao=0` skips). |
| src/terrain.js | 165 | Braga has Catmull-Rom smoothing and a `scarp` option; the fork lacks both. Log tag is `[barcelos]`. |
| src/models.js | 145 | Barcelos registry: header says it holds Barcelos models and loads `src/models/barcelos/`; rest of the diff not determined. |
| src/water.js | 138 | Fork adds `seekWater` and `resumeWater` (seek-safe clock); Braga has a wave `ang` field. |
| scripts/check-layers.mjs | 125 | Fork targets Barcelos fly targets in the ring; the budget setter is optional (Barcelos `tiles.js` has none) [git log 714ec33]. |
| src/life.js | 101 | Braga has fountain `h` and `r` and finer particle tiers; the fork uses two tiers. |
| src/locales/ui.js | 91 | Fork adds Barcelos strings and an empty-state text; Braga has `Открытия`. |
| scripts/layers.test.mjs | 91 | not determined (diff not read). |
| scripts/make-og.mjs | 90 | Fork uses `public_url` for share pages and sitemap and has `--sitemap`; Braga also writes route text pages. |
| vite.config.js | 61 | Fork has no `localNews` middleware and no `knownCities`/city filter; copies all of `cities/`. |
| scripts/layers-manifest.mjs | 51 | not determined. |
| src/layer-defs.js | 50 | not determined. |
| src/road-network.js | 46 | not determined. |
| src/leaves.js | 46 | not determined. |
| src/city.js | 46 | Fork imports `resolveCityId` from `city-id.js`; Braga has a fixed `HOSTS` map and `ID_RE`. |
| src/ui.js | 44 | Fork adds `gardens` label and the empty-places state (`is-empty`, "Начните с улиц"); Braga has `mountTool`. |
| scripts/verify.mjs | 43 | Fork is single-city and runs tests first; Braga takes `--city`. |
| src/models/metric.js | 42 | Fork adds `skirtRoof` and imports `inside`. |
| src/tiles.js | 41 | not determined. |
| src/layers-ui.js | 38 | not determined. |
| src/buildings.js | 35 | not determined. |
| src/live.js | 29 | not determined. |
| src/data.js | 29 | not determined. |
| src/fly.js | 28 | not determined. |
| src/camera.js | 28 | not determined. |
| src/tour.js | 25 | not determined. |
| vercel.json | 20 | Fork redirects `www.barcelos-3d.com` (non-permanent); Braga redirects www and vercel.app hosts to braga-3d.com (permanent), and has `api/news.js` and `/route/` rules. |
| package.json | 18 | Name `barcelos-3d`; `check:*` scripts pass `--city barcelos`; fork adds `perf`, `perf:full`, `perf:serve`; Braga has `check:discovery`. |
| src/search.js | 15 | not determined. |
| api/_city.js | 15 | Fork sets `DEFAULT_CITY = 'barcelos'` and has no `ALLOWED` city list; Braga reads `CITIES`/`VITE_CITIES`/`VITE_CITY`. |
| src/traffic-model.js | 13 | not determined. |
| src/landmarks.js | 13 | not determined. |
| src/story.js | 11 | not determined. |
| src/perf.js | 11 | not determined. |
| src/buildings-ms.js | 11 | not determined. |
| src/livebus.js | 10 | not determined. |
| src/i18n.js | 10 | Storage key `barcelos-language`; the fork loads `<lang>.<city>.js` for all cities, default city `barcelos`. |
| src/weather.js | 8 | not determined. |
| src/share.js | 8 | not determined. |
| scripts/fetch-traffic-axes.mjs | 8 | not determined. |
| api/route.js | 8 | Default city `barcelos`; cache key un-prefixed for `barcelos`. |
| api/guide.js | 8 | Default city `barcelos`; locale file is always `<lang>.<city>.js`. |
| src/liveair.js | 6 | not determined. |
| scripts/city-lib.mjs | 6 | Default city `barcelos` (was `braga`). |
| scripts/city-api.test.mjs | 6 | not determined. |
| src/seasons.js | 5 | not determined. |
| src/models/kit.js | 5 | not determined. |
| src/guide.js | 4 | not determined. |
| scripts/pack-buildings.mjs | 4 | not determined. |
| scripts/fetch-nature.mjs | 4 | not determined. |
| public/sw.js | 4 | Header text and `VERSION = 'barcelos-v1'` (Braga `braga-v3`). |
| api/adsb.js | 4 | Default city `barcelos`. |
| src/tile-worker.js | 2 | not determined. |
| src/pois.js | 2 | not determined. |
| src/panorama.js | 2 | not determined. |
| src/fit.js | 2 | not determined. |
| src/back-to-globe.js | 2 | not determined. |
| src/load-status.js | 1 | not determined. |
| src/layers.js | 1 | not determined. |

Also changed: `src/.DS_Store` (binary, ignore).

## Not Yet Ported From Braga

Files only in Braga, by feature. The feature names come from Braga's contract and the file names; the fork has none of these files.

- Walk mode (street-level walking): `src/walk.js`, `src/walk-collide.js`, `src/walk-figure.js`, `scripts/check-walk.mjs`, `scripts/walk-collide.test.mjs`.
- Game and discovery (fog of war, HUD, audio, VFX, progress): `src/game.js`, `src/game-hud.js`, `src/game-audio.js`, `src/game-vfx.js`, `src/game-progress.js`, `src/discovery.js`, `src/discovery-state.js`, `scripts/check-discovery.mjs`. The fork's `src/scene.js` lacks `SHROUD_UNIFORMS`.
- History quest routes: `src/quest.js`, `src/quest-progress.js`, `src/quest-tasks.js`, `src/quest.css`, `scripts/quest.test.mjs`.
- Events: `src/events.js`, `scripts/events.test.mjs`.
- News: `api/news.js` (and the `localNews` dev middleware in `vite.config.js`, plus the `api/news.js` entry in `vercel.json`).
- Text route pages for no-WebGL visitors and crawlers: `scripts/route-pages.mjs`, `scripts/check-route-mobile.browser.js`.
- Interface check: `scripts/check-interface.browser.js`.
- Braga landmark models: `src/models/arco.js`, `avenida.js`, `biscainhos.js`, `bomjesus.js`, `coimbras.js`, `congregados.js`, `diogosousa.js`, `dmaria.js`, `estadio.js`, `fonteidolo.js`, `forum.js`, `frutuoso.js`, `leonardo.js`, `maio.js`, `nogueira.js`, `parque.js`, `populo.js`, `praca.js`, `raio.js`, `sameiro.js`, `santabarbara.js`, `santacruz.js`, `saomarcos.js`, `se.js`, `termas.js`, `theatro.js`, `tibaes.js`, `torre.js`, `ucp.js`, `uminho.js`, and `src/models/index.guimaraes.js` (the Guimarães registry). These belong to Braga and Guimarães, not to Barcelos; the fork does not need them.
- Braga-only helpers: `scripts/add-populo-square.mjs`, `scripts/dmaria-parts.mjs`, `scripts/smoke-flicker.mjs`, `scripts/stash-pending.mjs`.
- Braga locale files `src/locales/en.js`, `src/locales/pt.js` (the fork has `*.barcelos.js` instead).
- Module contract files: `src/EGM.md`, `src/locales/EGM.md`, `src/models/EGM.md`, `scripts/EGM.md`, `api/EGM.md`. The fork has none.

Shared files where Braga is clearly ahead (from the diffs read):

- [src/nature.js]: Minho species 5-11 and understory.
- [src/people.js]: varied crowd (children, elderly, cyclists, dogs, market crowd).
- [src/terrain.js]: Catmull-Rom smooth mesh and the `scarp` option.
- [src/roads.js]: `asphaltGrain`.
- [src/life.js]: fountain `h` and `r`, finer particle tiers.
- [src/main.js]: discovery, quest, history route text link, `mountTool`.
- [src/scene.js]: game shroud.
- [src/streetscape.js]: tuned calçada patterns.
- [vite.config.js]: Braga's multi-city `knownCities` and `localNews`.

The fork is ahead of Braga in: `src/effects.js` (`ContactShadowPass`), `src/water.js` (`seekWater`, `resumeWater`), `src/models/metric.js` (`skirtRoof`), and the texture system (`materials-tex.js` with `facades.js`, `scene.js`, `streetscape.js`).

## Identical To Braga

37 files: scripts/back-to-globe.test.mjs, scripts/cell-runs.test.mjs, scripts/check-data.mjs, scripts/check-dimensions.mjs, scripts/check-fit.mjs, scripts/check-geo.mjs, scripts/check-traffic.mjs, scripts/city.mjs, scripts/count-tris.mjs, scripts/fetch-buildings.mjs, scripts/fetch-footprints.mjs, scripts/fetch-funicular.mjs, scripts/fetch-gtfs.mjs, scripts/fetch-ms-buildings.mjs, scripts/fetch-pois.mjs, scripts/fetch-roads.mjs, scripts/fetch-routes.mjs, scripts/fetch-terrain.mjs, scripts/fetch-tiles.mjs, scripts/geo-lib.mjs, scripts/landmark-heights.mjs, src/bounds.js, src/buildings-pack.js, src/cell-runs.js, src/gallery.js, src/geo.js, src/governor.js, src/intro.js, src/models/drape.js, src/models/geom.js, src/models/parts.js, src/perf-classes.js, src/placeholder-data.js, src/road-structures.js, src/routes.js, src/textures.js, src/video.js.

## Invariants

- Engine base is Braga; the fork never overwrites its own changes when syncing. `sync-engine.mjs --apply` copies only untouched files [AGENTS.md: Engine Lineage].
- Never hand-edit generated geodata in `data/*.json`; regenerate through the pipeline [AGENTS.md: Working Rules].
- Do not weaken `scripts/verify.mjs` or a check to make a feature pass [AGENTS.md: Working Rules].
- `npm run verify` is the definition of done [AGENTS.md: Verification].
- Node 22 or newer; plain ES modules [package.json:engines; AGENTS.md: Hard Constraints].
- Landmark models are authored in metres on real OSM footprints [AGENTS.md: Hard Constraints].
- Photos must be free-licensed; `check:data` rejects NC/ND [AGENTS.md: Hard Constraints].
- Pipeline step order: `ms-buildings` runs after `tiles` [AGENTS.md: Data Pipeline].
- Triangle budgets: 4k to 40k per model, 600k total [AGENTS.md: Verification, `check:models`].
- 1:1 fit against OSM is at least 97 percent, and a miss fails hard [AGENTS.md: Verification, `check:fit`].
- Never commit `data/.cache/`, `dist/` or `node_modules/` [AGENTS.md: Hard Constraints].
- Walking routes use the FOSSGIS walking profile only; never car routes [scripts/fetch-barcelos-routes.mjs: line 1].

## Side Effects

Only the differences from Braga.

- Hosts: `barcelos.portugal-3d.com`, `barcelos-3d.com`, `www.barcelos-3d.com`, `barcelos-3d.vercel.app` [cities/barcelos.json:hostnames]. `vercel.json` redirects `www.barcelos-3d.com` to `barcelos-3d.com` (non-permanent). Braga redirects to `braga-3d.com`.
- Hosts the fork does not call: no `/api/news` (no `api/news.js`), so no publisher RSS feed.
- Storage keys: `localStorage` language key is `barcelos-language` [src/i18n.js]. The other keys keep the `braga-` prefix (`braga-quality`, `braga-class-last`, `braga-tier`, `braga-season`, `braga-time`, `braga-fx`, `braga-live`, `braga-weather`, `braga-scale`, `braga-guide-voice`) and the `sessionStorage` key `braga-intro`. Braga's `braga-game-help` does not exist in the fork.
- Cache Storage: `barcelos-v1` [public/sw.js:VERSION] (Braga: `braga-v3`).
- Data path: `data/` (`data_dir` = `data`). Per-landmark photos in `assets/img/<id>-<n>.jpg`. Media and video lists in `data/sources/media.json` and `data/sources/videos.json`. Research cache in `data/.cache/research/` and `data/.cache/routes/`.
- Network at build time (fork-only): Wikimedia Commons, Wikidata, YouTube search and oEmbed, FOSSGIS walking routes (`scripts/fetch-barcelos-*.mjs`).
- Disk: `perf/results.json` written by `npm run perf:full`.
- Environment: fork-only `BRAGA_DIR` and `ENGINE_BASE` for `scripts/sync-engine.mjs`. `api/_city.js` does not read `CITIES`, `VITE_CITIES` or `VITE_CITY`.

## Verification

Commands from `package.json` (all take the city from `--city barcelos` already):

```
npm run verify          # node scripts/verify.mjs: tests + build + every check
npm test                # node --test scripts/*.test.mjs
npm run build           # vite build
npm run check:data      # node scripts/check-data.mjs --city barcelos
npm run check:geo       # node scripts/check-geo.mjs --city barcelos
npm run check:dimensions
npm run check:fit
npm run check:traffic
npm run check:models    # node scripts/count-tris.mjs --city barcelos
npm run layers          # node scripts/layers-manifest.mjs
npm run perf            # node scripts/perf-bench.mjs --reduced --check
npm run perf:full       # node scripts/perf-bench.mjs --check --out perf/results.json
npm run perf:serve      # node scripts/perf-serve.mjs
npm run city            # node scripts/city.mjs
```

Not run when this file was written (read-only task). Session 011 recorded `npm test` 39/39 and `npm run verify` OK with 11 PASS lines [claude-progress.md: Session 011].

Upstream contract: /Users/timur_isachenko/Dev/braga-3d/EGM.md
