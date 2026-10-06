# Cities

One JSON per city. In this project there is one city: `barcelos.json`. The app fetches `/cities/barcelos.json` before `start()` and exports `CITY`.

The schema and the shared pipeline are inherited from braga-3d; the full table of keys lives in braga-3d's `cities/README.md`. The scripts default to `barcelos` (`scripts/city-lib.mjs`), so `--city` can usually be omitted.

| Key | Barcelos value |
|---|---|
| `origin` | 41.5314, -8.6192 (historic centre) |
| `core_bbox` | 41.505–41.560 × −8.675…−8.560 |
| `wide_bbox` | 41.455–41.610 × −8.745…−8.490 |
| `data_dir` / `landmarks_file` | `data` / `data/landmarks.json` |
| `road.bridge_models` | bridges a landmark model draws: `match` (OSM name), `clearance_m` (deck above the river), `width_m` (roadway). The engine keeps only the road ribbon (Ponte Medieval: 6.2 m, 5.2 m wide) |
| `landmark_candidates` | 19 places (bridge, Bom Jesus da Cruz, Counts' Palace, tower, rooster cross, museums, stadium…) |

## Pipeline

```bash
npm run city -- barcelos [--dry-run] [--force] [--from <step>] [--only <step>]
```

Steps: terrain → buildings → ms-buildings → roads → nature → tiles → traffic-axes → gtfs.

## Next steps (manual)

1. `data/landmarks.json` from `landmark_candidates` (the landmark agents; real OSM outlines + sourced dimensions).
2. `node scripts/fetch-footprints.mjs` needs a Barcelos landmark table in the script.
3. `node scripts/fetch-routes.mjs` needs the city's itineraries.
4. `data/dimensions.json`, then models in `src/models/barcelos/`, checked with `node scripts/check-fit.mjs`.
5. `src/locales/en.barcelos.js` and `pt.barcelos.js`.
