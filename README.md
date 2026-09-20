# WordCourt

Daily ISEE/SSAT preparation for one family: a 15-minute vocabulary session with spaced repetition and a
money ladder, plus the practice booklets ("Drills") delivered online, timed, auto-graded, and gated on an
error log. A coach Dashboard reads both. Frontend only; every row lives behind authenticated Supabase APIs
with row-level security.

## Layout

| File | Role |
|---|---|
| `index.html` | shell and tabs; loads supabase-js and MathJax from CDN |
| `config.js` | Supabase URL and the publishable anon key |
| `engine.js` | vocabulary logic: session building, Leitner boxes, mastery, money, error reporting, flags |
| `app.js` | auth, tabs, session player, Money and My Words panels |
| `drills_content.js` | the drill sets (original content) and the skill-tag labels |
| `content_versions.js` | **generated** — set id → content hash of the shipped content |
| `content_registry.json` | **generated** — every set and item version in git history, deduped, for the database registry |
| `drills.js` | drill runner: timers, pacing clock, grading, evidence capture, error-log gate |
| `dashboard.js` | coach Dashboard, activity log form, System panel |
| `deck.json`, `strategy_content.json` | the coach's word deck; the verbal micro-lessons |
| `sql/` | schema-only migrations, numbered, additive |
| `tests/` | `node --test tests/*.test.mjs` |

Sets that contain copyrighted passages live in the `wc_drill_sets` table (handle-gated), never in this repo.

## Evidence captured (Phase 1, Sept 2026)

Every fact about what the learner did is written once and never rewritten:

- **Vocab answers** (`wc_answers`): kind, word or question, correctness, latency, rushed flag, scaffold level in force, the options shown, local day.
- **Drill runs** (`wc_drill_runs`): purpose, a frozen snapshot of the set's conditions (timed, cap, scoring, blank rule, gating), the exact content version shown, local day and time zone, `is_junk` for the six timer-bug rows.
- **Drill attempts** (`wc_drill_attempts`): skills, correctness, blank vs. timed out, dwell on every set, first-answer time, change count, position, item version.
- **Answer events** (`wc_answer_events`): every pick, change, and clear with its time.
- **Reflections** (`wc_reflections`): the student's own words — error logs, author's-point lines, recall lines, analogy bridges, production sentences — every version kept (`supersedes_id`). The legacy `error_log` column is still written for the UI.
- **Activity log** (`wc_activity_log`): one row per run and session written by the app, plus lessons, paper sets, platform corrections, and tests entered by the coach on the Dashboard.
- **Client errors** (`wc_client_errors`): any failed write, so silent data loss is visible on the System panel.

Dates are the learner's **local** calendar day (`local_day`, `tz`). Rows from before Sept 20, 2026 were stamped in UTC and were backfilled into `local_day` from their timestamps; the legacy `day` column is kept.

## Flags (`wc_flags`, editable on the Dashboard's System panel)

| Flag | Effect |
|---|---|
| `vocab_review_first` | the daily session fills up to 14 cards from due reviews, highest box first; new deck words only when fewer than 10 are due (`deck.json` `newPerDay` = 4). Off = legacy composition (6 oldest-due reviews + up to 8 new). |

## Content workflow

1. Edit `drills_content.js` (add sets; never take existing sets down).
2. `node <private>/analyst/build_content.mjs validate` — rejects syntax errors, duplicate ids, unlabeled skills, answers not among choices.
3. `node <private>/analyst/build_content.mjs versions --out content_versions.js` and `... registry --out content_registry.json`.
4. `node --test tests/*.test.mjs`, commit, push (GitHub Pages deploys on push).
5. Register the shipped content in the database: `select public.wc_import_registry('https://raw.githubusercontent.com/dobohler1/wordcourt/<commit>/content_registry.json');` (service role only). Runs started before the import store the content hash and are linked afterwards.

The private tooling lives outside this repo (nothing here holds a service-role key).

## Tests

`node --test tests/*.test.mjs` covers local-date helpers across the 5 pm and DST boundaries, the answer-kind mapping,
session composition under review backlogs, the numeric grader, dwell and answer-event bookkeeping, run
conditions and purposes, canonical hashing (and its agreement with the build script), content validation,
and a load-time smoke test of every script with a stub DOM.
