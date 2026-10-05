# Progress Log

<!--
Agent-agnostic repository-local session log. Any coding agent reads it at
startup and updates it before handoff when AGENTS.md tells it to. No agent
updates it automatically.
-->

## Current Verified State

- Repository root: `~/Dev/barcelos-3d`
- Standard startup path: `./init.sh`
- Standard verification path: `npm run verify`
- Current highest-priority unfinished feature: none; next candidates are individual builders for the other archetype landmarks and a performance governor.
- Current blocker: none.

## Session Log

### Session 001

- Date: 2026-10-04
- Goal: Install the harness pack (instructions, state, verification, scope, lifecycle).
- Completed:
  - Added `AGENTS.md` (+ `CLAUDE.md` pointer) — map, not manual.
  - Added `feature_list.json` — 13 features from the repo's history and current checks.
  - Added `scripts/verify.mjs` + `npm run verify` — the single gate; runs `npm test`, the build and every check whose data exists.
  - Added individual `check:*` npm scripts (kept `test` and `city`).
  - Added `init.sh`, `.nvmrc` (22) and `engines.node >=22`.
  - Added `scripts/sync-engine.sh` + `scripts/engine-base.txt` (base `1784ff3`).
  - Added `clean-state-checklist.md`, `session-handoff.md`, `evaluator-rubric.md` and `.github/workflows/verify.yml`.
  - Added this progress log.
- Verification run: `npm run verify`
  - PASS build, tests, geo, dimensions, 1:1 fit, traffic
  - FAIL data contract (81 errors), FAIL models (casa-azenha under the 4k floor)
- Evidence captured: verify summary above; `feature_list.json` statuses.
- Commits: `barcelos-3d: harness pack — AGENTS.md, feature_list, progress, init.sh, verify gate, engine-sync, CI`.
- Files or artifacts updated: AGENTS.md, CLAUDE.md, feature_list.json, claude-progress.md,
  init.sh, .nvmrc, scripts/verify.mjs, scripts/sync-engine.sh, scripts/engine-base.txt,
  clean-state-checklist.md, session-handoff.md, evaluator-rubric.md, package.json, .github/workflows/verify.yml.
- Known risk or unresolved issue:
  - No git remote configured — commits stay local until one is added.
  - `check-data`: merged `data/landmarks.json` has 0 gallery photos and 0 videos; the photo work in
    `assets/` is not reaching the merged contract. Fill `data/new/<id>.content.json` and re-merge.
  - `casa-azenha` model is under the 4k triangle floor.
- Next best step: `bar-004` — wire galleries/videos into the merged content so `check:data` passes.

### Session 002

- Date: 2026-10-04
- Goal: Realism pass — architectural detail to the model floor, and real CC0 surface materials.
- Completed:
  - Rewrote `src/models/barcelos/detailed.js`: every landmark 4k+ triangles on its real
    footprint (bridge balustrade + voussoirs + cutwaters; church twin belfry towers,
    apse, buttresses; crenellated palace turrets + keep; battlement keep with bartizans;
    market arcade + stalls; theatre pilasters; stadium trusses + floodlights; mill house
    with water wheel, dormers, roof parapet; chapels with buttresses).
  - Added real CC0 Poly Haven materials (`assets/tex/`, `src/materials-tex.js`): ground,
    plaster, granite, roof tiles, cobble; sampled triplanar (world space, no UVs) in the
    ground and facade shaders, distance-faded. Credits in `data/CREDITS.md`.
  - Wall micro-detail (grain/mottle/eave weathering), softer calçada, warmer daylight.
- Verification run: `npm run verify`
  - PASS build, tests, geo, dimensions, 1:1 fit, traffic, models
  - FAIL data contract (content) — see blocker below
- Evidence: `check:models` all 16 in 4k..40k, total ~184k/600k; `check:fit` all within tolerance;
  screenshots: textured tower walls + terracotta roofs + photographic ground, live overview healthy
  (149 draw calls, 1.37M tris, 0 errors).
- Known risk or unresolved issue:
  - `check:data` blocked (bar-004): needs authored histories (900..1800 RU chars, 3..5 paras),
    3..5 facts, 1..5 credited gallery photos and 1..3 YouTube videos per place. Editorial work.

### Session 003

- Date: 2026-10-04
- Goal: Clear the last blocker — the content contract (`check:data`).
- Completed:
  - `data/sources/history-ru.json`: authored 16 histories, 900..1800 RU chars, 3..5 paragraphs.
  - `data/sources/facts-ru.json`: 4 facts per landmark.
  - `scripts/build-barcelos.mjs` reads history/facts sources and guarantees >=2 sources.
  - Galleries: `scripts/fetch-barcelos-gallery.mjs` (rate-limit retry) filled 37 credited
    Commons photos; removed wrong matches (Guimaraes palace, Madrid market, museum montage,
    Amazon park) and pinned the correct ones; re-encoded oversized JPEGs under 650 KB.
  - Videos: 32 real YouTube entries (`data/sources/videos.json`).
- Verification run: `npm run verify`
  - PASS build, tests, data contract, geo, dimensions, 1:1 fit, traffic, models — verify OK
- Evidence: `check:data` OK (16 landmarks, 37 gallery photos, 32 videos, 3 routes); `npm run verify` OK.
- Known risk or unresolved issue: none blocking; a few places have a single gallery photo (warn only).

### Session 004

- Date: 2026-10-04
- Goal: Materials realism — normal-map surface relief.
- Completed:
  - Poly Haven CC0 normal maps for ground/plaster/granite/roof (`assets/tex/*_nor.jpg`).
  - `src/materials-tex.js`: `TRIPLANAR_NORMAL` + `brgTriplanarNormal` (tangent-free triplanar
    normal blend, world space).
  - Ground shader and building shader (`FACADE_NORMAL` at `<normal_fragment_maps>`) perturb
    the lit normal up close; distance-faded, light-mode guarded.
- Verification run: `npm run verify` → OK (build, tests, data, geo, dimensions, fit, traffic, models).
- Evidence: textured tower shows granite relief; 0 console errors; live healthy.

### Session 005

- Date: 2026-10-05
- Goal: Physical roughness variation for key surfaces and 1K close-range textures.
- Completed:
  - Added CC0 Poly Haven roughness maps for ground, plaster, granite, roof tiles and cobble.
  - Added calibrated triplanar roughness/specular modulation before lighting on buildings,
    ground and calçada.
  - Restored original 1K diffuse/normal downloads for close ground, wall, roof and cobble detail.
- Verification run: `npm run verify` → OK (build, tests, data, geo, dimensions, fit, traffic, models).
- Evidence: production build passed; Barcelos sunset close-ups for `igreja-matriz` and `pacos-concelho`
  rendered without console errors.
- Known risk or unresolved issue: none; SSAO remains the next realism candidate.

### Session 006

- Date: 2026-10-05
- Goal: Guarded contact shadows (SSAO) with calibrated roughness/specular and 1K textures.
- Completed:
  - Depth-based horizon occlusion on a half-resolution mask with depth-weighted blur.
  - Automatic close-range activation, far fade, night scaling, and `?ao=1` / `?ao=0`.
  - Calibrated triplanar roughness/specular on buildings, ground and cobbles.
  - Restored original 1K diffuse/normal maps for close-range surfaces.
- Verification run: `npm run verify` → OK (build, tests, data, geo, dimensions, fit, traffic, models).
- Evidence: A/B close-up shows added contact occlusion on architecture; overview remains clean;
  browser screenshots had no console errors.
- Known risk or unresolved issue: working tree is uncommitted; no deploy was run for this change.

### Session 007

- Date: 2026-10-05
- Goal: Follow up the sibling review: commit the realism work, fix the Braga defaults, add content, SEO and two individual models, deploy.
- Completed:
  - Committed the roughness, SSAO and 1K texture work; SSAO now stays off on the low tier.
  - API default city and `city.js`/`i18n.js` default are `barcelos`; console tags read `[barcelos]`; cinema order has `capela-ponte` and `casa-azenha`.
  - Story has 10 chapters; four landmarks gained 2-4 Commons photos; `robots.txt`, `sitemap.xml`, JSON-LD and hreflang added.
  - Own builders for `igreja-matriz` and `paco-condes`.
- Verification run: `npm run verify` -> OK; `npm test` 5/5; headless run with no errors and no cinema warning.
- Known risk or unresolved issue: `barcelos-3d.com` does not resolve, so canonical URLs use `barcelos-3d.vercel.app`; share pages `/p/` are missing for `capela-ponte` and `casa-azenha`; fit drift warnings stay under 15 %.
