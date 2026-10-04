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
- Current highest-priority unfinished feature: `bar-004` (content + photos)
- Current blocker: `check:data` (81 errors — 0 gallery photos, 0 videos) and `check:models` (`casa-azenha` 969 tris < 4000)

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
