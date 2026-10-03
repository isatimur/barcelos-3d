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
