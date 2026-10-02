-- WordCourt · Phase 2 (Learner model) · schema only, additive. Safe to re-run.
-- Reference layer (tests, domains, skills), annotation columns on item versions, test results,
-- analysis (L2), learner state (L3), decisions (L4), and the evidence guard trigger.

-- ---------- reference: tests and domains ----------
create table if not exists public.wc_test_sections (
  id          bigint generated always as identity primary key,
  test        text not null check (test in ('ISEE','SSAT')),
  level       text not null default 'upper',
  section     text not null,
  n_items     smallint not null,
  minutes     smallint not null,
  blank_rule  text not null check (blank_rule in ('never_blank','quarter_penalty')),
  target_raw  smallint,
  verified    boolean not null default false,
  notes       text,
  unique (test, level, section)
);
create table if not exists public.wc_domains (
  id          text primary key,
  label       text not null,
  description text
);
create table if not exists public.wc_section_domains (
  section_id  bigint not null references public.wc_test_sections(id),
  domain_id   text not null references public.wc_domains(id),
  n_items     smallint not null,
  per_item_s  smallint,
  verified    boolean not null default false,
  primary key (section_id, domain_id)
);
create index if not exists wc_section_domains_domain_idx on public.wc_section_domains (domain_id);

-- ---------- reference: skills (every existing tag id is preserved) ----------
create table if not exists public.wc_skills (
  id          text primary key,
  label       text not null,
  kind        text not null check (kind in ('concept','process','format','vocab')),
  strand      text,
  domain_id   text references public.wc_domains(id),
  parent      text references public.wc_skills(id),
  alias_of    text references public.wc_skills(id),
  lesson_n    smallint,
  word_id     bigint references public.wc_words(id),
  retired_at  timestamptz
);
create index if not exists wc_skills_parent_idx on public.wc_skills (parent);
create index if not exists wc_skills_alias_idx on public.wc_skills (alias_of);
create index if not exists wc_skills_domain_idx on public.wc_skills (domain_id);
create index if not exists wc_skills_word_idx on public.wc_skills (word_id);
create table if not exists public.wc_skill_edges (
  skill_id    text not null references public.wc_skills(id),
  requires_id text not null references public.wc_skills(id),
  primary key (skill_id, requires_id)
);
create index if not exists wc_skill_edges_requires_idx on public.wc_skill_edges (requires_id);

-- ---------- evidence: platform practice tests ----------
create table if not exists public.wc_test_sittings (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references public.wc_profiles(id),
  test           text not null,
  sat_on         date not null,
  mode           text not null check (mode in ('paper','online','official')),
  timed          boolean not null,
  section_scores jsonb,
  source         text,
  created_at     timestamptz not null default now(),
  unique (user_id, test, sat_on)
);
create table if not exists public.wc_test_items (
  id          bigint generated always as identity primary key,
  sitting_id  bigint not null references public.wc_test_sittings(id),
  section_id  bigint references public.wc_test_sections(id),
  number      smallint not null,
  domain_id   text references public.wc_domains(id),
  skills      text[],
  difficulty  text,
  outcome     text not null check (outcome in ('correct','wrong','blank','unreached')),
  chosen      text,
  correct     text,
  time_s      smallint,
  note        text,
  question_id bigint references public.wc_questions(id),
  unique (sitting_id, section_id, number)
);
create index if not exists wc_test_items_sitting_idx on public.wc_test_items (sitting_id);
create index if not exists wc_test_items_section_idx on public.wc_test_items (section_id);
create index if not exists wc_test_items_domain_idx on public.wc_test_items (domain_id);
create index if not exists wc_test_items_question_idx on public.wc_test_items (question_id);

-- ---------- annotations on item versions (metadata, not part of the content hash) ----------
alter table public.wc_item_versions
  add column if not exists primary_skill_id text references public.wc_skills(id),
  add column if not exists process_skill_ids text[] not null default '{}',
  add column if not exists choice_rationale jsonb,
  add column if not exists difficulty smallint,
  add column if not exists derived_from_test_item_id bigint references public.wc_test_items(id),
  add column if not exists annotated_at timestamptz;
create index if not exists wc_item_versions_primary_skill_idx on public.wc_item_versions (primary_skill_id);
create index if not exists wc_item_versions_derived_idx on public.wc_item_versions (derived_from_test_item_id);

-- ---------- retention probes: checkpoints may sample skills as well as words ----------
alter table public.wc_checkpoints
  add column if not exists kind text not null default 'word',
  add column if not exists sampled_skills text[],
  add column if not exists vested_cents integer,
  add column if not exists reverted_cents integer;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'wc_checkpoints_kind_check') then
    alter table public.wc_checkpoints add constraint wc_checkpoints_kind_check check (kind in ('word','skill','mixed'));
  end if;
end $$;

-- ---------- layer 2: analysis ----------
create table if not exists public.wc_analyses (
  id                 bigint generated always as identity primary key,
  user_id            uuid not null references public.wc_profiles(id),
  analyst            text not null,
  analyst_kind       text not null check (analyst_kind in ('model','human')),
  method             text not null,
  method_version     text not null,
  kind               text not null default 'scoped' check (kind in ('scoped','full','weekly','test','strategic','shadow')),
  scope              jsonb not null default '{}',
  evidence_watermark jsonb,
  comparison         jsonb,
  started_at         timestamptz not null default now(),
  finished_at        timestamptz,
  status             text not null default 'running' check (status in ('running','done','failed','insufficient_evidence')),
  notes              text
);
create index if not exists wc_analyses_user_started_idx on public.wc_analyses (user_id, started_at);

create table if not exists public.wc_findings (
  id            bigint generated always as identity primary key,
  analysis_id   bigint not null references public.wc_analyses(id),
  user_id       uuid not null references public.wc_profiles(id),
  subject_type  text not null check (subject_type in ('skill','domain','word','item','learner')),
  subject_id    text not null,
  level         text check (level is null or level in ('knowledge','execution','retention','speed','strategy','test')),
  finding_type  text not null,
  statement     text not null,
  detail        jsonb,
  confidence    numeric(4,3) not null check (confidence between 0 and 1),
  evidence_refs jsonb not null,
  competing     jsonb,
  supersedes_id bigint references public.wc_findings(id),
  status        text not null default 'active' check (status in ('active','superseded','resolved','retired')),
  created_at    timestamptz not null default now(),
  check (jsonb_typeof(evidence_refs) = 'array')
);
create index if not exists wc_findings_subject_idx on public.wc_findings (user_id, subject_type, subject_id);
create index if not exists wc_findings_analysis_idx on public.wc_findings (analysis_id);
create index if not exists wc_findings_supersedes_idx on public.wc_findings (supersedes_id);

create table if not exists public.wc_finding_reviews (
  id          bigint generated always as identity primary key,
  finding_id  bigint not null references public.wc_findings(id),
  reviewer    uuid not null references public.wc_profiles(id),
  verdict     text not null check (verdict in ('agree','disagree','unsure')),
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists wc_finding_reviews_finding_idx on public.wc_finding_reviews (finding_id);
create index if not exists wc_finding_reviews_reviewer_idx on public.wc_finding_reviews (reviewer);

create table if not exists public.wc_reflection_grades (
  id            bigint generated always as identity primary key,
  reflection_id bigint not null references public.wc_reflections(id),
  analysis_id   bigint not null references public.wc_analyses(id),
  verdict       text not null check (verdict in ('names_mechanism','names_symptom','empty')),
  send_back     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists wc_reflection_grades_reflection_idx on public.wc_reflection_grades (reflection_id);
create index if not exists wc_reflection_grades_analysis_idx on public.wc_reflection_grades (analysis_id);

-- ---------- layer 3: learner state (append-only snapshots) ----------
create table if not exists public.wc_learner_state (
  id               bigint generated always as identity primary key,
  user_id          uuid not null references public.wc_profiles(id),
  subject_type     text not null check (subject_type in ('skill','domain','word','section')),
  subject_id       text not null,
  level            text not null check (level in ('knowledge','execution','retention','speed','strategy','test','readiness')),
  estimate         numeric(5,4),
  ci_low           numeric(5,4),
  ci_high          numeric(5,4),
  n_evidence       integer not null default 0,
  n_conditions     smallint,
  last_evidence_at timestamptz,
  last_probe_at    timestamptz,
  params           jsonb,
  status           text not null check (status in ('insufficient','estimated','demonstrated')),
  method           text not null,
  method_version   text not null,
  derived_from     jsonb,
  computed_at      timestamptz not null default now()
);
create index if not exists wc_learner_state_lookup_idx on public.wc_learner_state (user_id, subject_type, subject_id, level, method, computed_at desc);
create or replace view public.wc_learner_state_current with (security_invoker = on) as
  select distinct on (user_id, subject_type, subject_id, level, method) *
  from public.wc_learner_state
  order by user_id, subject_type, subject_id, level, method, computed_at desc;

-- ---------- layer 4: plans, assignments, planner memory ----------
create table if not exists public.wc_plans (
  id                bigint generated always as identity primary key,
  user_id           uuid not null references public.wc_profiles(id),
  for_date          date not null,
  currency          text not null check (currency in ('scrap','block')),
  minutes_available smallint not null,
  minutes_planned   smallint not null default 0,
  minutes_returned  smallint not null default 0,
  phase             text check (phase is null or phase in ('acquisition','consolidation','taper')),
  skipped           jsonb,
  expected          jsonb,
  inputs            jsonb,
  shadow            boolean not null default false,
  planner_version   text,
  created_at        timestamptz not null default now()
);
create index if not exists wc_plans_user_date_idx on public.wc_plans (user_id, for_date desc);

create table if not exists public.wc_assignments (
  id                bigint generated always as identity primary key,
  user_id           uuid not null references public.wc_profiles(id),
  kind_id           text not null references public.wc_intervention_kinds(id),
  target_type       text check (target_type is null or target_type in ('skill','domain','word','set')),
  target_id         text,
  set_id            text,
  currency          text check (currency is null or currency in ('scrap','block')),
  est_minutes       smallint,
  expected_benefit  numeric(6,3),
  expected_voi      numeric(6,3),
  rationale         text,
  finding_refs      bigint[],
  state_refs        bigint[],
  made_by           text not null,
  made_by_kind      text not null check (made_by_kind in ('model','human','rule')),
  status            text not null default 'proposed' check (status in ('proposed','accepted','declined','planned','started','finished','abandoned','expired')),
  declined_reason   text,
  plan_id           bigint references public.wc_plans(id),
  plan_order        smallint,
  reason_codes      jsonb,
  alternatives      jsonb,
  success_criterion jsonb,
  if_fails          jsonb,
  outcome           text check (outcome is null or outcome in ('met','unmet','unknown')),
  evaluated_at      timestamptz,
  due_by            date,
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz
);
create index if not exists wc_assignments_user_status_idx on public.wc_assignments (user_id, status, created_at);
create index if not exists wc_assignments_plan_idx on public.wc_assignments (plan_id);
create index if not exists wc_assignments_kind_idx on public.wc_assignments (kind_id);
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'wc_activity_log' and column_name = 'assignment_id') then
    alter table public.wc_activity_log add column assignment_id bigint references public.wc_assignments(id);
    create index wc_activity_log_assignment_idx on public.wc_activity_log (assignment_id);
  end if;
end $$;

create table if not exists public.wc_planner_stats (
  user_id      uuid not null references public.wc_profiles(id),
  kind_id      text not null references public.wc_intervention_kinds(id),
  level        text not null,
  node_family  text not null,
  currency     text not null,
  n            integer not null default 0,
  effect_mean  numeric(6,4),
  minutes_mean numeric(6,2),
  start_rate   numeric(4,3),
  computed_at  timestamptz not null default now(),
  primary key (user_id, kind_id, level, node_family, currency)
);

-- ---------- RLS ----------
alter table public.wc_test_sections    enable row level security;
alter table public.wc_domains          enable row level security;
alter table public.wc_section_domains  enable row level security;
alter table public.wc_skills           enable row level security;
alter table public.wc_skill_edges      enable row level security;
alter table public.wc_test_sittings    enable row level security;
alter table public.wc_test_items       enable row level security;
alter table public.wc_analyses         enable row level security;
alter table public.wc_findings         enable row level security;
alter table public.wc_finding_reviews  enable row level security;
alter table public.wc_reflection_grades enable row level security;
alter table public.wc_learner_state    enable row level security;
alter table public.wc_plans            enable row level security;
alter table public.wc_assignments      enable row level security;
alter table public.wc_planner_stats    enable row level security;

drop policy if exists "read test sections" on public.wc_test_sections;   create policy "read test sections"   on public.wc_test_sections   for select to authenticated using (true);
drop policy if exists "read domains" on public.wc_domains;               create policy "read domains"         on public.wc_domains         for select to authenticated using (true);
drop policy if exists "read section domains" on public.wc_section_domains; create policy "read section domains" on public.wc_section_domains for select to authenticated using (true);
drop policy if exists "read skills" on public.wc_skills;                 create policy "read skills"          on public.wc_skills          for select to authenticated using (true);
drop policy if exists "read skill edges" on public.wc_skill_edges;       create policy "read skill edges"     on public.wc_skill_edges     for select to authenticated using (true);

drop policy if exists "read family sittings" on public.wc_test_sittings;
create policy "read family sittings" on public.wc_test_sittings for select to authenticated using (user_id = (select auth.uid()) or public.wc_same_family(user_id));
drop policy if exists "coach inserts sittings" on public.wc_test_sittings;
create policy "coach inserts sittings" on public.wc_test_sittings for insert to authenticated with check (public.wc_same_family(user_id) and (select public.wc_is_coach()));
drop policy if exists "read family test items" on public.wc_test_items;
create policy "read family test items" on public.wc_test_items for select to authenticated
  using (exists (select 1 from public.wc_test_sittings s where s.id = sitting_id and (s.user_id = (select auth.uid()) or public.wc_same_family(s.user_id))));
drop policy if exists "coach inserts test items" on public.wc_test_items;
create policy "coach inserts test items" on public.wc_test_items for insert to authenticated
  with check (exists (select 1 from public.wc_test_sittings s where s.id = sitting_id and public.wc_same_family(s.user_id)) and (select public.wc_is_coach()));

drop policy if exists "coach reads analyses" on public.wc_analyses;
create policy "coach reads analyses" on public.wc_analyses for select to authenticated using (public.wc_same_family(user_id) and (select public.wc_is_coach()));
drop policy if exists "coach inserts analyses" on public.wc_analyses;
create policy "coach inserts analyses" on public.wc_analyses for insert to authenticated with check (public.wc_same_family(user_id) and (select public.wc_is_coach()) and analyst_kind = 'human');
drop policy if exists "coach reads findings" on public.wc_findings;
create policy "coach reads findings" on public.wc_findings for select to authenticated using (public.wc_same_family(user_id) and (select public.wc_is_coach()));
drop policy if exists "coach inserts findings" on public.wc_findings;
create policy "coach inserts findings" on public.wc_findings for insert to authenticated with check (public.wc_same_family(user_id) and (select public.wc_is_coach()));
drop policy if exists "coach reviews findings" on public.wc_finding_reviews;
create policy "coach reviews findings" on public.wc_finding_reviews for insert to authenticated with check (reviewer = (select auth.uid()) and (select public.wc_is_coach()));
drop policy if exists "coach reads reviews" on public.wc_finding_reviews;
create policy "coach reads reviews" on public.wc_finding_reviews for select to authenticated using ((select public.wc_is_coach()));
drop policy if exists "coach reads reflection grades" on public.wc_reflection_grades;
create policy "coach reads reflection grades" on public.wc_reflection_grades for select to authenticated using ((select public.wc_is_coach()));

drop policy if exists "read own or family state" on public.wc_learner_state;
create policy "read own or family state" on public.wc_learner_state for select to authenticated using (user_id = (select auth.uid()) or public.wc_same_family(user_id));
drop policy if exists "read family plans" on public.wc_plans;
create policy "read family plans" on public.wc_plans for select to authenticated using (user_id = (select auth.uid()) or public.wc_same_family(user_id));
drop policy if exists "read family assignments" on public.wc_assignments;
create policy "read family assignments" on public.wc_assignments for select to authenticated using (user_id = (select auth.uid()) or public.wc_same_family(user_id));
drop policy if exists "coach reads planner stats" on public.wc_planner_stats;
create policy "coach reads planner stats" on public.wc_planner_stats for select to authenticated using (public.wc_same_family(user_id));
-- writes to plans/assignments arrive in Phase 4–5 with their own policies

-- ---------- evidence guard: facts are never rewritten ----------
-- Allowed updates: a run row completes once (from unfinished to finished) and may later gain linkage/flags;
-- an attempt may gain error_log (legacy dual-write) and item_version_id; a session may complete once.
create or replace function public.wc_guard_evidence() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then raise exception 'evidence rows are never deleted (%)', tg_table_name; end if;
  if tg_table_name = 'wc_drill_attempts' then
    if new.run_id is distinct from old.run_id or new.user_id is distinct from old.user_id or new.set_id is distinct from old.set_id
       or new.item_id is distinct from old.item_id or new.kind is distinct from old.kind or new.skills is distinct from old.skills
       or new.chosen is distinct from old.chosen or new.correct is distinct from old.correct or new.blank is distinct from old.blank
       or new.timed_out is distinct from old.timed_out or new.latency_ms is distinct from old.latency_ms or new.note is distinct from old.note
       or new.created_at is distinct from old.created_at or new.dwell_ms is distinct from old.dwell_ms or new.over_cap is distinct from old.over_cap
       or new.position is distinct from old.position or new.first_answer_ms is distinct from old.first_answer_ms or new.n_changes is distinct from old.n_changes then
      raise exception 'attempt facts are immutable; only error_log, item_version_id and reference_visible may change';
    end if;
  elsif tg_table_name = 'wc_drill_runs' then
    if old.finished_at is not null and (
       new.user_id is distinct from old.user_id or new.set_id is distinct from old.set_id or new.scoring is distinct from old.scoring
       or new.started_at is distinct from old.started_at or new.finished_at is distinct from old.finished_at or new.duration_s is distinct from old.duration_s
       or new.timed_out is distinct from old.timed_out or new.n_items is distinct from old.n_items or new.n_correct is distinct from old.n_correct
       or new.n_wrong is distinct from old.n_wrong or new.n_blank is distinct from old.n_blank or new.raw_score is distinct from old.raw_score
       or new.n_over_cap is distinct from old.n_over_cap or new.n_unreached is distinct from old.n_unreached or new.created_at is distinct from old.created_at) then
      raise exception 'finished run facts are immutable; only logs_complete, set_version_id, set_content_hash, is_junk, purpose, conditions, local_day and tz may change';
    end if;
  elsif tg_table_name = 'wc_answers' then
    if new.user_id is distinct from old.user_id or new.session_id is distinct from old.session_id or new.kind is distinct from old.kind
       or new.word_id is distinct from old.word_id or new.question_id is distinct from old.question_id or new.correct is distinct from old.correct
       or new.chosen is distinct from old.chosen or new.latency_ms is distinct from old.latency_ms or new.counted is distinct from old.counted
       or new.rushed is distinct from old.rushed or new.created_at is distinct from old.created_at then
      raise exception 'answer facts are immutable';
    end if;
  elsif tg_table_name = 'wc_sessions' then
    if old.completed and (new.user_id is distinct from old.user_id or new.kind is distinct from old.kind or new.xp is distinct from old.xp
       or new.focus is distinct from old.focus or new.duration_s is distinct from old.duration_s or new.completed is distinct from old.completed
       or new.created_at is distinct from old.created_at or new.is_primary is distinct from old.is_primary) then
      raise exception 'completed session facts are immutable';
    end if;
  elsif tg_table_name in ('wc_answer_events','wc_reflections','wc_activity_log','wc_teach_entries','wc_ledger') then
    raise exception '% rows are append-only', tg_table_name;
  end if;
  return new;
end $$;
do $$
declare t text;
begin
  foreach t in array array['wc_drill_attempts','wc_drill_runs','wc_answers','wc_sessions','wc_answer_events','wc_reflections','wc_activity_log','wc_teach_entries','wc_ledger'] loop
    execute format('drop trigger if exists wc_guard_evidence_trg on public.%I', t);
    execute format('create trigger wc_guard_evidence_trg before update or delete on public.%I for each row execute function public.wc_guard_evidence()', t);
  end loop;
end $$;
