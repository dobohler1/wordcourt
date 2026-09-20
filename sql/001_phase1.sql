-- WordCourt · Phase 1 (Instrument) · schema only, additive.
-- Applies to project flmtmihxpkcxvrasyyxt. Safe to re-run.
-- No column is dropped, renamed, or retyped. No learner row is modified here (backfills are separate).

-- ---------- helper: is the caller a coach? ----------
create or replace function public.wc_is_coach()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.wc_profiles p where p.id = (select auth.uid()) and p.role = 'coach'
  )
$$;
revoke execute on function public.wc_is_coach() from public, anon;
grant execute on function public.wc_is_coach() to authenticated;

-- ---------- additive columns on existing tables ----------
alter table public.wc_profiles
  add column if not exists tz text not null default 'America/Los_Angeles';

alter table public.wc_sessions
  add column if not exists local_day date,
  add column if not exists tz text;

alter table public.wc_drill_runs
  add column if not exists tz text,
  add column if not exists local_day date,
  add column if not exists set_version_id bigint,
  add column if not exists set_content_hash text,
  add column if not exists purpose text,
  add column if not exists conditions jsonb,
  add column if not exists is_junk boolean not null default false;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'wc_drill_runs_purpose_check' and conrelid = 'public.wc_drill_runs'::regclass) then
    alter table public.wc_drill_runs add constraint wc_drill_runs_purpose_check
      check (purpose is null or purpose in ('practice','check','pacing','correction','card','probe','section'));
  end if;
end $$;

alter table public.wc_drill_attempts
  add column if not exists item_version_id bigint,
  add column if not exists position smallint,
  add column if not exists first_answer_ms integer,
  add column if not exists n_changes smallint,
  add column if not exists reference_visible boolean;

alter table public.wc_answers
  add column if not exists scaffold_level smallint,
  add column if not exists options_shown jsonb,
  add column if not exists local_day date;

-- ---------- reference: versioned content registry ----------
create table if not exists public.wc_set_versions (
  id            bigint generated always as identity primary key,
  set_id        text not null,
  content_hash  text not null,
  content       jsonb not null,          -- the set minus its items
  source        text not null default 'repo' check (source in ('repo','remote')),
  git_commit    text,
  valid_from    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (set_id, content_hash)
);
create index if not exists wc_set_versions_set_id_valid_from_idx on public.wc_set_versions (set_id, valid_from desc);

create table if not exists public.wc_item_versions (
  id             bigint generated always as identity primary key,
  set_version_id bigint not null references public.wc_set_versions(id),
  item_id        text not null,
  content_hash   text not null,
  content        jsonb not null,
  item_type      text not null,
  skills         text[] not null default '{}',
  created_at     timestamptz not null default now(),
  unique (set_version_id, item_id)
);
create index if not exists wc_item_versions_item_id_idx on public.wc_item_versions (item_id);
create index if not exists wc_item_versions_skills_gin on public.wc_item_versions using gin (skills);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'wc_drill_runs_set_version_id_fkey') then
    alter table public.wc_drill_runs add constraint wc_drill_runs_set_version_id_fkey
      foreign key (set_version_id) references public.wc_set_versions(id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'wc_drill_attempts_item_version_id_fkey') then
    alter table public.wc_drill_attempts add constraint wc_drill_attempts_item_version_id_fkey
      foreign key (item_version_id) references public.wc_item_versions(id);
  end if;
end $$;
create index if not exists wc_drill_runs_set_version_id_idx on public.wc_drill_runs (set_version_id);
create index if not exists wc_drill_attempts_item_version_id_idx on public.wc_drill_attempts (item_version_id);
create index if not exists wc_drill_attempts_user_created_idx on public.wc_drill_attempts (user_id, created_at);
create index if not exists wc_answers_user_created_idx on public.wc_answers (user_id, created_at);

-- ---------- reference: intervention kinds ----------
create table if not exists public.wc_intervention_kinds (
  id              text primary key,
  label           text not null,
  moves_levels    text[] not null default '{}',
  currency        text not null default 'either' check (currency in ('scrap','block','either')),
  coach_required  boolean not null default false,
  typical_minutes smallint
);
insert into public.wc_intervention_kinds (id, label, moves_levels, currency, coach_required, typical_minutes) values
  ('vocab_session',       'Daily vocabulary session',            '{knowledge,retention}',  'scrap',  false, 15),
  ('word_expose',         'New word exposure',                   '{knowledge}',            'scrap',  false, 5),
  ('word_review',         'Spaced word review',                  '{retention}',            'scrap',  false, 7),
  ('production',          'Production sentence',                 '{retention,knowledge}',  'scrap',  false, 3),
  ('drill',               'Untimed drill set',                   '{execution}',            'scrap',  false, 10),
  ('mastery_check',       'Lesson mastery check',                '{execution}',            'scrap',  false, 8),
  ('pacing_set',          'Capped pacing set',                   '{speed,strategy}',       'scrap',  false, 12),
  ('correction',          'Correction derivatives',              '{knowledge,strategy}',   'either', false, 12),
  ('platform_correction', 'Correction on the test platform',     '{knowledge,strategy}',   'block',  true,  30),
  ('card',                'Read-only card',                      '{strategy}',             'scrap',  false, 3),
  ('lesson',              'Core Concepts lesson (coach-led)',    '{knowledge}',            'block',  true,  25),
  ('practice_set',        'Paper practice set',                  '{execution}',            'block',  false, 20),
  ('section_timed',       'Timed section',                       '{test,speed}',           'block',  false, 35),
  ('full_test',           'Full-length practice test',           '{test}',                 'block',  true,  170),
  ('probe',               'Retention probe',                     '{retention}',            'scrap',  false, 5),
  ('error_log',           'Error-log writing',                   '{strategy}',             'scrap',  false, 4)
on conflict (id) do nothing;

-- ---------- evidence: answer events (append-only) ----------
create table if not exists public.wc_answer_events (
  id          bigint generated always as identity primary key,
  run_id      uuid not null references public.wc_drill_runs(id),
  user_id     uuid not null references public.wc_profiles(id),
  item_id     text not null,
  at_ms       integer not null,
  event       text not null check (event in ('pick','change','clear')),
  value       text,
  created_at  timestamptz not null default now()
);
create index if not exists wc_answer_events_run_at_idx on public.wc_answer_events (run_id, at_ms);
create index if not exists wc_answer_events_user_idx on public.wc_answer_events (user_id);

-- ---------- evidence: reflections (append-only; the student's own words) ----------
create table if not exists public.wc_reflections (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.wc_profiles(id),
  kind          text not null check (kind in ('error_log','author_point','recall','bridge','production','other')),
  attempt_id    bigint references public.wc_drill_attempts(id),
  answer_id     bigint references public.wc_answers(id),
  run_id        uuid references public.wc_drill_runs(id),
  word_id       bigint references public.wc_words(id),
  passage_id    text,
  text          text not null,
  cause         text check (cause is null or cause in ('misread','no_method','wrong_method','arithmetic','time','guess','vocab','other')),
  supersedes_id bigint references public.wc_reflections(id),
  created_at    timestamptz not null default now()
);
create index if not exists wc_reflections_user_created_idx on public.wc_reflections (user_id, created_at);
create index if not exists wc_reflections_attempt_idx on public.wc_reflections (attempt_id);
create index if not exists wc_reflections_answer_idx on public.wc_reflections (answer_id);
create index if not exists wc_reflections_run_idx on public.wc_reflections (run_id);
create index if not exists wc_reflections_word_idx on public.wc_reflections (word_id);
create index if not exists wc_reflections_supersedes_idx on public.wc_reflections (supersedes_id);

-- ---------- evidence: activity log ----------
create table if not exists public.wc_activity_log (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.wc_profiles(id),
  kind_id       text not null references public.wc_intervention_kinds(id),
  started_at    timestamptz not null,
  ended_at      timestamptz,
  minutes       smallint,
  currency      text check (currency is null or currency in ('scrap','block')),
  coach_present boolean,
  targets       text[],
  run_id        uuid references public.wc_drill_runs(id),
  session_id    bigint references public.wc_sessions(id),
  outcome       jsonb,
  note          text,
  reported_by   text not null check (reported_by in ('app','coach','learner','import')),
  created_by    uuid references public.wc_profiles(id),
  created_at    timestamptz not null default now()
);
create index if not exists wc_activity_log_user_started_idx on public.wc_activity_log (user_id, started_at);
create index if not exists wc_activity_log_run_idx on public.wc_activity_log (run_id);
create index if not exists wc_activity_log_session_idx on public.wc_activity_log (session_id);
create index if not exists wc_activity_log_kind_idx on public.wc_activity_log (kind_id);
create index if not exists wc_activity_log_created_by_idx on public.wc_activity_log (created_by);

-- ---------- ops: flags and client errors ----------
create table if not exists public.wc_flags (
  name        text primary key,
  enabled     boolean not null default false,
  description text,
  updated_by  uuid references public.wc_profiles(id),
  updated_at  timestamptz not null default now()
);
insert into public.wc_flags (name, enabled, description) values
  ('vocab_review_first', true, 'Daily session fills up to 14 cards from due reviews (highest box first); new deck words only when the due backlog is under 10.')
on conflict (name) do nothing;

create table if not exists public.wc_client_errors (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.wc_profiles(id),
  site        text not null,
  message     text,
  detail      jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists wc_client_errors_created_idx on public.wc_client_errors (created_at);
create index if not exists wc_client_errors_user_idx on public.wc_client_errors (user_id);

-- ---------- row-level security ----------
alter table public.wc_set_versions       enable row level security;
alter table public.wc_item_versions      enable row level security;
alter table public.wc_intervention_kinds enable row level security;
alter table public.wc_answer_events      enable row level security;
alter table public.wc_reflections        enable row level security;
alter table public.wc_activity_log       enable row level security;
alter table public.wc_flags              enable row level security;
alter table public.wc_client_errors      enable row level security;

-- reference tables: any signed-in user may read; writes only via the service role
drop policy if exists "read set versions" on public.wc_set_versions;
create policy "read set versions" on public.wc_set_versions for select to authenticated using (true);
drop policy if exists "read item versions" on public.wc_item_versions;
create policy "read item versions" on public.wc_item_versions for select to authenticated using (true);
drop policy if exists "read intervention kinds" on public.wc_intervention_kinds;
create policy "read intervention kinds" on public.wc_intervention_kinds for select to authenticated using (true);

-- flags: everyone reads, coach updates
drop policy if exists "read flags" on public.wc_flags;
create policy "read flags" on public.wc_flags for select to authenticated using (true);
drop policy if exists "coach updates flags" on public.wc_flags;
create policy "coach updates flags" on public.wc_flags for update to authenticated
  using ((select public.wc_is_coach())) with check ((select public.wc_is_coach()));

-- evidence tables: insert own rows, read own or family; no update or delete for authenticated
drop policy if exists "insert own answer events" on public.wc_answer_events;
create policy "insert own answer events" on public.wc_answer_events for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "read family answer events" on public.wc_answer_events;
create policy "read family answer events" on public.wc_answer_events for select to authenticated
  using (user_id = (select auth.uid()) or public.wc_same_family(user_id));

drop policy if exists "insert own reflections" on public.wc_reflections;
create policy "insert own reflections" on public.wc_reflections for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "read family reflections" on public.wc_reflections;
create policy "read family reflections" on public.wc_reflections for select to authenticated
  using (user_id = (select auth.uid()) or public.wc_same_family(user_id));

drop policy if exists "insert activity" on public.wc_activity_log;
create policy "insert activity" on public.wc_activity_log for insert to authenticated
  with check (user_id = (select auth.uid()) or (public.wc_same_family(user_id) and (select public.wc_is_coach())));
drop policy if exists "read family activity" on public.wc_activity_log;
create policy "read family activity" on public.wc_activity_log for select to authenticated
  using (user_id = (select auth.uid()) or public.wc_same_family(user_id));

drop policy if exists "insert own client errors" on public.wc_client_errors;
create policy "insert own client errors" on public.wc_client_errors for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "read family client errors" on public.wc_client_errors;
create policy "read family client errors" on public.wc_client_errors for select to authenticated
  using (user_id = (select auth.uid()) or public.wc_same_family(user_id));
