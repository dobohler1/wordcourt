-- WordCourt · Phase 2 · reference import, checkpoint flag, learner-state builder v0, nightly schedule.
-- Additive. Service-role functions; the app only reads.

-- ---------- reference seed import (reference_seed.json in the public repo, pinned to a commit) ----------
create or replace function public.wc_import_reference(url text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare resp record; j jsonb;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '60');
  select * into resp from extensions.http_get(url);
  if resp.status <> 200 then raise exception 'reference fetch failed: HTTP %', resp.status; end if;
  j := resp.content::jsonb;
  insert into public.wc_domains (id, label, description)
    select x->>0, x->>1, x->>2 from jsonb_array_elements(j->'domains') x
    on conflict (id) do update set label = excluded.label, description = excluded.description;
  insert into public.wc_test_sections (test, level, section, n_items, minutes, blank_rule, target_raw, verified, notes)
    select s->>'test', 'upper', s->>'section', (s->>'n')::smallint, (s->>'minutes')::smallint, s->>'blank', (s->>'target')::smallint, (s->>'verified')::boolean,
           'format per published test structure; target_raw modelled from the Sept 2026 percentile goal (+/-2)'
    from jsonb_array_elements(j->'sections') s
    on conflict (test, level, section) do update set n_items = excluded.n_items, minutes = excluded.minutes, blank_rule = excluded.blank_rule, target_raw = excluded.target_raw, verified = excluded.verified, notes = excluded.notes;
  insert into public.wc_section_domains (section_id, domain_id, n_items, per_item_s, verified)
    select ts.id, dm.key, dm.value::smallint, round((s->>'minutes')::numeric * 60 / (s->>'n')::numeric)::smallint, false
    from jsonb_array_elements(j->'sections') s
    join public.wc_test_sections ts on ts.test = s->>'test' and ts.level = 'upper' and ts.section = s->>'section'
    cross join lateral jsonb_each_text(s->'domains') dm
    on conflict (section_id, domain_id) do update set n_items = excluded.n_items, per_item_s = excluded.per_item_s;
  insert into public.wc_skills (id, label, kind, strand, domain_id, lesson_n, word_id)
    select n->>'id', n->>'label', n->>'kind', n->>'strand', n->>'domain', (n->>'lesson')::smallint,
           case when n->>'word' is not null then (select w.id from public.wc_words w where w.word = n->>'word' order by w.study desc, w.tier desc limit 1) end
    from jsonb_array_elements(j->'nodes') n
    on conflict (id) do update set label = excluded.label, kind = excluded.kind, strand = excluded.strand, domain_id = excluded.domain_id, lesson_n = excluded.lesson_n, word_id = coalesce(excluded.word_id, public.wc_skills.word_id);
  update public.wc_skills k set parent = n->>'parent', alias_of = n->>'alias_of'
    from jsonb_array_elements(j->'nodes') n where k.id = n->>'id';
  insert into public.wc_skill_edges (skill_id, requires_id)
    select n->>'id', r from jsonb_array_elements(j->'nodes') n, jsonb_array_elements_text(n->'requires') r
    on conflict do nothing;
  return jsonb_build_object('version', j->>'version', 'domains', (select count(*) from public.wc_domains), 'sections', (select count(*) from public.wc_test_sections), 'section_domains', (select count(*) from public.wc_section_domains),
    'skills', (select count(*) from public.wc_skills), 'edges', (select count(*) from public.wc_skill_edges));
end $$;
revoke execute on function public.wc_import_reference(text) from public, anon, authenticated;

-- registry import now also carries annotations (metadata, not part of the content hash)
create or replace function public.wc_import_registry(url text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare resp record; j jsonb; n_items int; n_sets int; n_links int; n_ann int;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT', '60');
  select * into resp from extensions.http_get(url);
  if resp.status <> 200 then raise exception 'registry fetch failed: HTTP %', resp.status; end if;
  j := resp.content::jsonb;
  insert into public.wc_item_versions (item_id, content_hash, content, item_type, skills)
    select x->>'item_id', x->>'content_hash', x->'content', x->>'item_type', coalesce(array(select jsonb_array_elements_text(x->'skills')), '{}')
    from jsonb_array_elements(j->'items') x on conflict (item_id, content_hash) do nothing;
  get diagnostics n_items = row_count;
  insert into public.wc_set_versions (set_id, content_hash, content, source, git_commit, valid_from)
    select s->>'set_id', s->>'content_hash', s->'content', 'repo', s->>'git_commit', (s->>'valid_from')::timestamptz
    from jsonb_array_elements(j->'sets') s on conflict (set_id, content_hash) do nothing;
  get diagnostics n_sets = row_count;
  insert into public.wc_set_version_items (set_version_id, item_version_id, position)
    select sv.id, iv.id, (l->>'position')::smallint
    from jsonb_array_elements(j->'sets') s
    join public.wc_set_versions sv on sv.set_id = s->>'set_id' and sv.content_hash = s->>'content_hash'
    cross join lateral jsonb_array_elements(s->'items') l
    join public.wc_item_versions iv on iv.item_id = l->>'item_id' and iv.content_hash = l->>'content_hash'
    on conflict do nothing;
  get diagnostics n_links = row_count;
  update public.wc_item_versions iv set set_version_id = (select min(svi.set_version_id) from public.wc_set_version_items svi where svi.item_version_id = iv.id) where iv.set_version_id is null;
  -- annotations: keyed by item_id + content_hash; apply to every version carrying that content (and, when the
  -- annotation says so, to older versions of the same item id via the "all_versions" flag)
  update public.wc_item_versions iv
     set primary_skill_id = a->>'primary_skill_id',
         process_skill_ids = coalesce(array(select jsonb_array_elements_text(a->'process_skill_ids')), '{}'),
         choice_rationale = a->'choice_rationale',
         difficulty = (a->>'difficulty')::smallint,
         annotated_at = now()
    from jsonb_array_elements(coalesce(j->'annotations', '[]'::jsonb)) a
   where iv.item_id = a->>'item_id'
     and (iv.content_hash = a->>'content_hash' or coalesce((a->>'all_versions')::boolean, false))
     and (a->>'primary_skill_id') in (select id from public.wc_skills);
  get diagnostics n_ann = row_count;
  return jsonb_build_object('sets', n_sets, 'items', n_items, 'links', n_links, 'annotated', n_ann, 'built', j->>'built');
end $$;
revoke execute on function public.wc_import_registry(text) from public, anon, authenticated;

-- ---------- flags ----------
insert into public.wc_flags (name, enabled, description) values
  ('checkpoint', true, 'Weekly checkpoint on the Today card: re-tests mastered words that have sat 7+ days; a pass locks in (vests) the word''s earnings, a miss returns them and sends the word back to training.')
on conflict (name) do nothing;

-- ---------- learner state builder v0 ----------
-- Deterministic. Appends one snapshot per (learner, subject, level) per run. Wilson 95% intervals.
-- Levels: execution (graded drill attempts by primary skill; words by flashcard answers), speed (capped attempts),
-- retention (checkpoint probes per word; skill retention from delayed re-exposure), test (section scores),
-- readiness (latest section raw vs target). Knowledge and strategy are left insufficient in v0 (no instruments yet).
create or replace function public.wc_wilson(c bigint, n bigint, out p numeric, out lo numeric, out hi numeric)
language sql immutable as $$
  select case when n = 0 then null else round(c::numeric / n, 4) end,
         case when n = 0 then null else round(greatest(0, ((c::numeric / n) + 1.9208 / n - 1.96 * sqrt(((c::numeric / n) * (1 - c::numeric / n) + 0.9604 / n) / n)) / (1 + 3.8416 / n)), 4) end,
         case when n = 0 then null else round(least(1, ((c::numeric / n) + 1.9208 / n + 1.96 * sqrt(((c::numeric / n) * (1 - c::numeric / n) + 0.9604 / n) / n)) / (1 + 3.8416 / n)), 4) end
$$;

create or replace function public.wc_build_learner_state(p_user uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_method text := 'v0'; v_version text := '2026-10-02b'; v_n int := 0; r record;
begin
  for r in select id from public.wc_profiles where role = 'student' and (p_user is null or id = p_user) loop
    -- primary skill per attempt: annotation when present, else the first concept/format tag on the attempt
    create temp table if not exists wc_att (user_id uuid, run_id uuid, attempt_id bigint, skill text, domain_id text, proc text[], correct boolean, timed boolean, cap_s int, over_cap boolean, local_day date, created_at timestamptz) on commit drop;
    truncate wc_att;
    insert into wc_att
      select a.user_id, a.run_id, a.id,
             coalesce(iv.primary_skill_id, (select k from unnest(a.skills) k join public.wc_skills s on s.id = k where s.kind in ('concept','format') order by array_position(a.skills, k) limit 1)),
             coalesce(sk.domain_id, (select s.domain_id from unnest(a.skills) k join public.wc_skills s on s.id = k where s.domain_id is not null order by array_position(a.skills, k) limit 1)),
             coalesce(iv.process_skill_ids, (select array_agg(k order by array_position(a.skills, k)) from unnest(a.skills) k join public.wc_skills s on s.id = k where s.kind = 'process')),
             a.correct, coalesce((rn.conditions->>'timed')::boolean, rn.set_id like 'pace_%' or rn.scoring in ('ssat','isee')), (rn.conditions->>'cap_s')::int, a.over_cap, rn.local_day, a.created_at
      from public.wc_drill_attempts a
      join public.wc_drill_runs rn on rn.id = a.run_id and rn.finished_at is not null and not rn.is_junk
      left join public.wc_item_versions iv on iv.id = a.item_version_id
      left join public.wc_skills sk on sk.id = iv.primary_skill_id
      where a.user_id = r.id and a.correct is not null;

    -- skill × execution
    insert into public.wc_learner_state (user_id, subject_type, subject_id, level, estimate, ci_low, ci_high, n_evidence, n_conditions, last_evidence_at, params, status, method, method_version, derived_from)
      select r.id, 'skill', skill, 'execution', (w).p, (w).lo, (w).hi, n, nc, last_at,
             jsonb_build_object('n_correct', c, 'n_sittings', ns, 'n_timed', nt),
             case when n < 3 then 'insufficient' else 'estimated' end, v_method, v_version, jsonb_build_object('source', 'wc_drill_attempts', 'attempt_ids', ids)
      from (select skill, count(*) n, count(*) filter (where correct) c, count(distinct (timed, cap_s)) nc, count(distinct local_day) ns, count(*) filter (where timed) nt, max(created_at) last_at,
                   public.wc_wilson(count(*) filter (where correct), count(*)) w, (array_agg(attempt_id order by created_at))[1:50] ids
            from wc_att where skill is not null group by skill) x;
    get diagnostics v_n = row_count;

    -- skill × speed (only attempts under a cap; among correct answers, how many were within the cap)
    insert into public.wc_learner_state (user_id, subject_type, subject_id, level, estimate, ci_low, ci_high, n_evidence, n_conditions, last_evidence_at, params, status, method, method_version, derived_from)
      select r.id, 'skill', skill, 'speed', (w).p, (w).lo, (w).hi, n, 1, last_at,
             jsonb_build_object('stall_rate', round(n_over::numeric / nullif(n_all, 0), 4), 'n_over_cap', n_over, 'n_capped', n_all),
             case when n < 3 then 'insufficient' else 'estimated' end, v_method, v_version, jsonb_build_object('source', 'wc_drill_attempts', 'condition', 'capped')
      from (select skill, count(*) filter (where correct) n, count(*) filter (where correct and not over_cap) c, count(*) n_all, count(*) filter (where over_cap) n_over, max(created_at) last_at,
                   public.wc_wilson(count(*) filter (where correct and not over_cap), count(*) filter (where correct)) w
            from wc_att where skill is not null and cap_s is not null group by skill) x;

    -- domain × execution (pooled over attempts whose primary skill belongs to the domain)
    insert into public.wc_learner_state (user_id, subject_type, subject_id, level, estimate, ci_low, ci_high, n_evidence, n_conditions, last_evidence_at, params, status, method, method_version, derived_from)
      select r.id, 'domain', domain_id, 'execution', (w).p, (w).lo, (w).hi, n, nc, last_at, jsonb_build_object('n_correct', c, 'n_skills', nsk),
             case when n < 3 then 'insufficient' else 'estimated' end, v_method, v_version, jsonb_build_object('source', 'wc_drill_attempts', 'pooled', true)
      from (select domain_id, count(*) n, count(*) filter (where correct) c, count(distinct (timed, cap_s)) nc, count(distinct skill) nsk, max(created_at) last_at,
                   public.wc_wilson(count(*) filter (where correct), count(*)) w
            from wc_att where domain_id is not null group by domain_id) x;

    -- process skill × execution (QC method, reading processes): pooled over attempts whose item lists the skill as a process skill.
    -- Skills that already have a primary-skill row are skipped so each skill gets one execution row per build.
    insert into public.wc_learner_state (user_id, subject_type, subject_id, level, estimate, ci_low, ci_high, n_evidence, n_conditions, last_evidence_at, params, status, method, method_version, derived_from)
      select r.id, 'skill', k, 'execution', (w).p, (w).lo, (w).hi, n, nc, last_at,
             jsonb_build_object('n_correct', c, 'n_sittings', ns, 'n_timed', nt, 'role', 'process'),
             case when n < 3 then 'insufficient' else 'estimated' end, v_method, v_version, jsonb_build_object('source', 'wc_drill_attempts', 'role', 'process', 'attempt_ids', ids)
      from (select k, count(*) n, count(*) filter (where correct) c, count(distinct (timed, cap_s)) nc, count(distinct local_day) ns, count(*) filter (where timed) nt, max(created_at) last_at,
                   public.wc_wilson(count(*) filter (where correct), count(*)) w, (array_agg(attempt_id order by created_at))[1:50] ids
            from wc_att t, unnest(t.proc) k
            where k not in (select skill from wc_att where skill is not null) group by k) x;

    -- domain × execution for domains reached only through process skills (e.g. qc): one vote per attempt
    insert into public.wc_learner_state (user_id, subject_type, subject_id, level, estimate, ci_low, ci_high, n_evidence, n_conditions, last_evidence_at, params, status, method, method_version, derived_from)
      select r.id, 'domain', domain_id, 'execution', (w).p, (w).lo, (w).hi, n, nc, last_at, jsonb_build_object('n_correct', c, 'n_skills', nsk, 'role', 'process'),
             case when n < 3 then 'insufficient' else 'estimated' end, v_method, v_version, jsonb_build_object('source', 'wc_drill_attempts', 'role', 'process')
      from (select domain_id, count(*) n, count(*) filter (where correct) c, count(distinct (timed, cap_s)) nc, count(distinct skill) nsk, max(created_at) last_at,
                   public.wc_wilson(count(*) filter (where correct), count(*)) w
            from (select distinct on (t.attempt_id, s.domain_id) t.attempt_id, s.domain_id, k skill, t.correct, t.timed, t.cap_s, t.created_at
                  from wc_att t, unnest(t.proc) k join public.wc_skills s on s.id = k
                  where s.domain_id is not null and s.domain_id not in (select domain_id from wc_att where domain_id is not null)) d
            group by domain_id) x;

    -- word × execution (vocab lane: counted flashcard and question answers) and word × retention (checkpoint probes)
    insert into public.wc_learner_state (user_id, subject_type, subject_id, level, estimate, ci_low, ci_high, n_evidence, n_conditions, last_evidence_at, params, status, method, method_version, derived_from)
      select r.id, 'word', a.word_id::text, 'execution', (w).p, (w).lo, (w).hi, n, nk, last_at,
             jsonb_build_object('n_correct', c, 'box', ws.box, 'state', ws.state, 'vested', ws.vested),
             case when n < 3 then 'insufficient' else 'estimated' end, v_method, v_version, jsonb_build_object('source', 'wc_answers')
      from (select word_id, count(*) n, count(*) filter (where correct) c, count(distinct kind) nk, max(created_at) last_at, public.wc_wilson(count(*) filter (where correct), count(*)) w
            from public.wc_answers where user_id = r.id and word_id is not null and counted and coalesce(error_tag, '') <> 'probe' group by word_id) a
      left join public.wc_word_state ws on ws.user_id = r.id and ws.word_id = a.word_id;
    insert into public.wc_learner_state (user_id, subject_type, subject_id, level, estimate, ci_low, ci_high, n_evidence, n_conditions, last_evidence_at, last_probe_at, params, status, method, method_version, derived_from)
      select r.id, 'word', word_id::text, 'retention', (w).p, (w).lo, (w).hi, n, 1, last_at, last_at, jsonb_build_object('n_retained', c, 'half_life_days_v0', 30),
             case when n < 1 then 'insufficient' else 'estimated' end, v_method, v_version, jsonb_build_object('source', 'wc_answers', 'condition', 'probe')
      from (select word_id, count(*) n, count(*) filter (where correct) c, max(created_at) last_at, public.wc_wilson(count(*) filter (where correct), count(*)) w
            from public.wc_answers where user_id = r.id and word_id is not null and error_tag = 'probe' group by word_id) x;

    -- skill × retention v0: a correct answer on a skill at least 7 days after the previous exposure to that skill
    insert into public.wc_learner_state (user_id, subject_type, subject_id, level, estimate, ci_low, ci_high, n_evidence, n_conditions, last_evidence_at, last_probe_at, params, status, method, method_version, derived_from)
      select r.id, 'skill', skill, 'retention', (w).p, (w).lo, (w).hi, n, 1, last_at, last_at, jsonb_build_object('n_retained', c, 'gap_days_min', 7, 'half_life_days_v0', 30),
             case when n < 2 then 'insufficient' else 'estimated' end, v_method, v_version, jsonb_build_object('source', 'wc_drill_attempts', 'condition', 'delayed_reexposure')
      from (select skill, count(*) n, count(*) filter (where correct) c, max(created_at) last_at, public.wc_wilson(count(*) filter (where correct), count(*)) w
            from (select skill, correct, created_at, created_at - lag(created_at) over (partition by skill order by created_at) gap from wc_att where skill is not null) g
            where gap >= interval '7 days' group by skill) x;

    -- section × test (latest sitting) and section × readiness (raw vs target)
    insert into public.wc_learner_state (user_id, subject_type, subject_id, level, estimate, ci_low, ci_high, n_evidence, n_conditions, last_evidence_at, params, status, method, method_version, derived_from)
      select r.id, 'section', ts.test || ':' || ts.section, 'test', (w).p, (w).lo, (w).hi, (sc->>'of')::int, 1, s.sat_on::timestamptz,
             jsonb_build_object('raw', (sc->>'raw')::int, 'of', (sc->>'of')::int, 'blank', sc->>'blank', 'unreached', sc->>'unreached', 'sitting', s.test, 'n_sittings', cnt),
             case when cnt >= 2 and s.sat_on >= current_date - 14 and (w).p >= 0.9 then 'demonstrated' else 'estimated' end, v_method, v_version, jsonb_build_object('source', 'wc_test_sittings', 'sitting_id', s.id)
      from (select *, row_number() over (partition by split_part(test, '_', 1) order by sat_on desc) rn, count(*) over (partition by split_part(test, '_', 1)) cnt from public.wc_test_sittings where user_id = r.id) s
      cross join lateral jsonb_each(s.section_scores) e(section, sc)
      join public.wc_test_sections ts on ts.section = e.section and ts.test = split_part(s.test, '_', 1)
      cross join lateral public.wc_wilson((sc->>'raw')::int, (sc->>'of')::int) w
      where s.rn = 1;
    insert into public.wc_learner_state (user_id, subject_type, subject_id, level, estimate, ci_low, ci_high, n_evidence, n_conditions, last_evidence_at, params, status, method, method_version, derived_from)
      select r.id, 'section', ts.test || ':' || ts.section, 'readiness',
             round(least(1, greatest(0, 0.5 + ((sc->>'raw')::numeric - ts.target_raw) / (2 * sqrt(ts.n_items::numeric)))), 4), null, null, 1, 1, s.sat_on::timestamptz,
             jsonb_build_object('latest_raw', (sc->>'raw')::int, 'target_raw', ts.target_raw, 'n_items', ts.n_items, 'gap', ts.target_raw - (sc->>'raw')::int),
             'estimated', v_method, v_version, jsonb_build_object('source', 'wc_test_sittings', 'note', 'v0 heuristic: 0.5 at target, +/- one raw-sd per 2*sqrt(n)')
      from (select *, row_number() over (partition by split_part(test, '_', 1) order by sat_on desc) rn from public.wc_test_sittings where user_id = r.id) s
      cross join lateral jsonb_each(s.section_scores) e(section, sc)
      join public.wc_test_sections ts on ts.section = e.section and ts.test = split_part(s.test, '_', 1)
      where s.rn = 1 and ts.target_raw is not null;
  end loop;
  return jsonb_build_object('method', v_method, 'version', v_version, 'rows_total', (select count(*) from public.wc_learner_state where computed_at > now() - interval '1 minute'));
end $$;
revoke execute on function public.wc_build_learner_state(uuid) from public, anon, authenticated;

-- nightly at 11:00 UTC (04:00 Pacific)
create extension if not exists pg_cron;
do $$ begin
  if exists (select 1 from cron.job where jobname = 'wc_build_learner_state_nightly') then perform cron.unschedule('wc_build_learner_state_nightly'); end if;
  perform cron.schedule('wc_build_learner_state_nightly', '0 11 * * *', 'select public.wc_build_learner_state()');
end $$;
