-- Week plan (Oct 9, 2026): the coach's planned assignments show on the student's Drills tab and Today card, behind a flag.
-- Data: wc_assignments rows with made_by_kind = 'human', status = 'planned', due_by, and reason_codes.label (the student-safe title).
-- The student's view is read-only; done / pending states are derived from wc_drill_runs (see drills.js weekPlanStatus).
-- The flag row below is created by the coach (the Supabase SQL editor); the System panel can then toggle it.
insert into public.wc_flags (name, enabled, description) values
  ('week_plan', true, 'Drills tab and Today card show the coach''s planned assignments (wc_assignments, status planned, made by the coach) with due dates and done/pending status. Off = no change to the student''s view.')
on conflict (name) do update set enabled = excluded.enabled, description = excluded.description;
