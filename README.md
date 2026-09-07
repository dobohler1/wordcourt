# WordCourt

Daily 15-minute ISEE/SSAT verbal training. Frontend only — all content and progress live behind authenticated Supabase APIs.

## Pacing sets and the coach's deck (added Sept 6, 2026)
- A drill set with `paceCapS` shows a per-question dwell clock (time since the previous answer), chimes softly at the cap, and shows a one-minute banner asking for every remaining bubble. Each attempt stores `dwell_ms` and `over_cap`; each run stores `n_over_cap` and `n_unreached`. `paceFirstCapS` gives the first question after a passage a longer cap (it carries the reading time). Results and the coach dashboard show the two numbers that matter: over the cap, and unanswered.
- `deck.json` is a coach-chosen word list. Deck words jump the new-word queue (`newPerDay` new words per session while any remain); `production` words get an original-sentence prompt every `productionEveryDays` days until they convert.
