# Session handoff

Compact note for the next session. Keep it to one screen.

- Date: 2026-10-05
- Session goal: Follow up the sibling-city review (commit, defaults, content, SEO, two models, deploy).
- Verified state (last `npm run verify` result): OK (build, tests 5/5, data, geo, dimensions, fit, traffic, models).
- Active feature (id): none; bar-014..bar-019 are passing.
- What changed: realism work committed; Barcelos is the default city in `api/` and `src/`; story has 10 chapters; four landmarks have more photos; SEO files; own builders for `igreja-matriz` and `paco-condes`.
- What is half-done or risky:
  - `barcelos-3d.com` does not resolve; canonical URLs use `barcelos-3d.vercel.app`. Switch back when the domain is live (index.html, public/robots.txt, public/sitemap.xml; `src/city.js` already handles both).
  - `/p/` share pages are missing for `capela-ponte` and `casa-azenha` (`scripts/make-og.mjs`). They canonicalize to barcelos-3d.com.
  - Fourteen landmarks still use shared archetypes. The paco ruin sits lower than the church (separate flattening pads).
  - Only two of five new story camera presets were checked by screenshot.
- Exact next step: build individual models for `pacos-concelho`, `ponte-medieval` (real arches) and `torre-menagem`; then port the perf governor from porto-3d.
- Files to look at first: `REVIEW.md`, `src/models/barcelos/detailed.js`, `data/story.json`, `claude-progress.md`.
