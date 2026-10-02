# Barcelos review — 2 October 2026

The app builds and starts locally. It remains an early preview with incomplete city content.

## Fixed findings

| Priority | Reproduction / impact | Change |
| --- | --- | --- |
| P1 | `npm run build` failed on missing `locales/en.js` and `locales/pt.js`. | Search uses the optional per-city translation loader. |
| P1 | Localhost and arbitrary preview domains requested the absent Braga config. | Default to Barcelos; build-time city pins take precedence over URL overrides. Five regression tests cover selection. |
| P1 | Clicking Cinema with no landmarks threw `Cannot read properties of undefined (reading 't0')` and entered the cinema overlay. | Disable unavailable Cinema, guard direct starts, and handle unavailable deep links without entering the mode. |
| P2 | Empty list offered no next action, and Story advertised unavailable content. | Localized preview explanation, working street-search action, compact desktop card, and explicit Story availability. |
| P2 | Config failures incorrectly blamed WebGL and offered no recovery. | Connection/config failures have a separate message and a working retry button. |
| P2 | Social metadata advertised 19 landmarks and an image that was absent. | Metadata describes the preview and removes the nonexistent social image. |

## Verification

- `npm test`: five passing city-selection regression tests.
- `npm run build`: passes.
- Playwright: English, Portuguese, Russian; empty Cinema direct call and deep link; accent-insensitive street search (`Fervenca`); search-action focus; language switch preserving `#time=night`; 390 × 844 viewport without horizontal overflow; simulated config HTTP 503 followed by successful retry.
- No uncaught page errors during normal browser flows. Optional-data warnings remain expected.
- Screenshots and replayable Playwright CLI code: `output/playwright/`.
- `git diff --check`: passes.

## Remaining limits

`check:models`, `check-data.mjs`, and `check-geo.mjs` currently skip their substantive checks because required data is missing. Their zero exit codes do not establish content readiness. At the final data inspection, roads, terrain, and buildings were present; landmarks, footprints, nature, routes, and story were absent. The buildings file arrived from another process during review; existing data was not edited.

This review verified local behavior, not deployment or production. Detailed landmark models, sourced content, missing layers, and real device performance remain outside the verified result. The existing cinematic itinerary also needs city-specific authoring before enabling a complete Barcelos film.
