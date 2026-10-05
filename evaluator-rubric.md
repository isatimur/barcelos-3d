# Evaluator Rubric

Use this rubric after implementation and before final acceptance.

Scored for the 5 October 2026 session (sibling-review follow-up).

| Category | Question | Score (0-2) | Notes |
| --- | --- | --- | --- |
| Correctness | Does the implemented behavior match the requested feature? | 2 | API defaults to Barcelos, cinema warning gone, story has 10 chapters, photos and SEO files in place |
| Verification | Did the required checks actually run, with evidence? | 2 | `npm run build`, `npm run verify`, `npm test`, headless console run; the live curl checks are recorded in the final report |
| Scope discipline | Did the session stay inside the chosen feature scope? | 2 | Only this repo changed; sibling cities untouched; small commits |
| Reliability | Does the result survive restart or rerun without repair? | 2 | `npm run verify` is green from a clean build |
| Maintainability | Is the code and documentation clear enough for the next session? | 1 | New builders sit in their own files. Fourteen landmarks still share archetypes |
| Handoff readiness | Can a fresh session continue work from repo artifacts only? | 2 | `session-handoff.md`, `claude-progress.md`, `feature_list.json`, `REVIEW.md` are current |

## Verdict

- Accept

## Required Follow-Up

- Missing evidence: real-device performance; SSAO cost on a mobile GPU.
- Required fixes: none blocking.
- Next review trigger: before the `barcelos-3d.com` domain goes live, or after the next model batch.
- Verification run: `npm run verify`
