# Barcelos review

Last refreshed: 5 October 2026. This file replaces the 2 October preview review, whose findings are resolved.

## Current state

- 16 landmarks on real OSM footprints, with RU/EN/PT texts, photos, videos and three routes.
- Core data is complete: roads, terrain, 1,171 buildings, nature, streetscape, 211 POIs, life layers.
- `npm run verify` is green: build, tests, data, geo, dimensions, 1:1 fit, traffic, models.
- `npm test` runs 5 city-resolution tests.
- Realism: triplanar normal and roughness maps (Poly Haven, CC0) and guarded SSAO contact shadows.
- Console: no errors in a headless run.

## Findings of the 5 October sibling review, and what happened

| # | Finding | Status |
| --- | --- | --- |
| 1 | 24 uncommitted paths (roughness, SSAO, 1K textures), never deployed | Committed and deployed |
| 2 | Models are 11 shared archetypes | `igreja-matriz` and `paco-condes` now have their own builders (stopped there on purpose). The other 14 still use archetypes |
| 3 | Story had 5 chapters | 10 chapters, each with 2-4 sources |
| 4 | Cinema skipped `capela-ponte`, `casa-azenha` | Both are in `cinema_order` |
| 5 | Bare `/api/adsb` returned 500 | API default city is `barcelos` |
| 6 | Four landmarks had one gallery photo | 2-3 Commons photos added each, credits in `data/CREDITS.md`. The `mercado-municipal` and `parque-cidade` photos show the Feira and the riverside park beside the buildings |
| 7 | `[braga]` console tags, `CITY.id === 'braga'` cases | Renamed or neutralised |
| 8 | No `robots.txt` or sitemap | Added, with JSON-LD and hreflang |

## Known limits

- Fit drift stays inside the 15 % tolerance: `solar-pinheiros` 14.5 %, `casa-azenha` 14.6 %, `paco-condes` height 14.3 % (warn only).
- Fourteen landmarks still use shared archetypes (`civic`, `chapel`, `garden` serve two places each). Only `igreja-matriz` and `paco-condes` have their own builders. Heights are "estimated". The ruin sits lower than the church (separate flattening pads).
- Only two of the five new story camera presets were checked by screenshot.
- The `/p/` share pages exist for 14 of 16 landmarks (`capela-ponte`, `casa-azenha` are missing). They name `barcelos-3d.com` as canonical, while the home page and the sitemap use `barcelos-3d.vercel.app` until the domain resolves. The sitemap lists the home page only.
- hreflang points at `?lang=` URLs under a root canonical, which search engines may treat as a mismatch. Porto has no hreflang.
- Six OSM specs have no landmark: `senhor-galo`, `largo-municipio`, `sao-francisco`, `mosteiro-terco`, `igreja-santa-cruz`, `franqueira`. The Galo monument is the city's brand symbol and deserves a landmark.
- No adaptive performance governor (porto-3d has one). SSAO runs only inside the post-processing composer, which is off on phones and light mode.
- Storage keys and the debug global still use the engine's `braga-` and `__braga` names. Renaming them across all forks is a joint step.
- FPS and SSAO cost could not be measured: the Apple GPU is capped at 60 fps.
- The `barcelos-3d.com` domain is not live yet. The site runs on `barcelos-3d.vercel.app`.
