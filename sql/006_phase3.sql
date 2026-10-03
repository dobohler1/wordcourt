-- Phase 3 (AI Analyst, shadow mode). Schema only, additive. Applied Oct 3, 2026 via the Supabase MCP (execute_sql).
-- 1. wc_bank_items: private copy of practice-test items (publisher content; never client-readable) and the link from test misses.
create table if not exists public.wc_bank_items (
  id text primary key, source_id text not null, exam text not null, form text not null, section text not null, number smallint not null,
  format text, stem text, choices jsonb, passage_id text, passage_text text, source_pdf text, source_page smallint,
  extraction_flags text[] not null default '{}', bank_skill text, loaded_at timestamptz not null default now(),
  unique (source_id, section, number)
);
alter table public.wc_bank_items enable row level security;
revoke all on public.wc_bank_items from anon, authenticated;
alter table public.wc_test_items add column if not exists bank_item_id text references public.wc_bank_items(id);
create index if not exists wc_test_items_bank_item_idx on public.wc_test_items (bank_item_id);

-- 2. wc_analyses gains the request (dossier), the full result (assessments/constraints/diagnostics have no tables of their own) and run metrics.
alter table public.wc_analyses add column if not exists request jsonb;
alter table public.wc_analyses add column if not exists result jsonb;
alter table public.wc_analyses add column if not exists metrics jsonb;

-- 3. Flag. Off = no triggers, no calls, no cost.
insert into public.wc_flags (name, enabled, description) values
  ('analyst_shadow', false, 'Phase 3: the AI Analyst runs on triggers and writes findings/proposals that only the System panel shows. Off = no model calls.')
on conflict (name) do nothing;

-- 4. Atomic writer, callable only by the service role from the private runner. Writes layer 2 + layer 4 only.
create or replace function public.wc_write_analysis_result(p_analysis_id bigint, p_result jsonb, p_metrics jsonb, p_finished_at timestamptz)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid; v_model text; v_status text; v_f jsonb; v_p jsonb; v_g jsonb; v_r jsonb; v_id bigint; v_map jsonb := '{}'::jsonb; v_refs bigint[]; v_x text;
begin
  select user_id, analyst into v_user, v_model from wc_analyses where id = p_analysis_id;
  if v_user is null then raise exception 'analysis % not found', p_analysis_id; end if;
  v_status := case p_result->>'status' when 'insufficient_evidence' then 'insufficient_evidence' when 'declined' then 'failed' else 'done' end;
  for v_f in select * from jsonb_array_elements(coalesce(p_result->'findings', '[]'::jsonb)) loop
    insert into wc_findings (analysis_id, user_id, subject_type, subject_id, level, finding_type, statement, detail, confidence, evidence_refs, competing, supersedes_id, status, created_at)
    values (p_analysis_id, v_user, v_f->>'subject_type', v_f->>'subject_id', v_f->>'level', v_f->>'type', v_f->>'statement',
            jsonb_build_object('mechanism', v_f->'mechanism', 'confidence_basis', v_f->>'confidence_basis', 'other_cause', v_f->'other_cause', 'client_id', v_f->>'finding_id'),
            (v_f->>'confidence')::numeric, v_f->'evidence_refs', v_f->'competing', (v_f->>'supersedes')::bigint, 'active', p_finished_at)
    returning id into v_id;
    v_map := v_map || jsonb_build_object(v_f->>'finding_id', v_id);
    if (v_f->>'supersedes') is not null then
      update wc_findings set status = 'superseded' where id = (v_f->>'supersedes')::bigint and user_id = v_user and status = 'active';
    end if;
  end loop;
  for v_p in select * from jsonb_array_elements(coalesce(p_result->'proposals', '[]'::jsonb)) loop
    v_refs := array(select (v_map->>x)::bigint from jsonb_array_elements_text(v_p->'for_finding_ids') x where v_map ? x);
    insert into wc_assignments (user_id, kind_id, target_type, target_id, set_id, currency, est_minutes, expected_benefit, expected_voi, rationale, finding_refs, made_by, made_by_kind, status,
                                reason_codes, success_criterion, if_fails, created_at)
    values (v_user, v_p->>'kind_id', 'skill', v_p->'target_node_ids'->>0, v_p->'specific'->>'set_id', v_p->>'currency', (v_p->>'est_minutes')::smallint,
            (v_p->'expected_benefit'->>'raw_points_mid')::numeric, (v_p->>'voi')::numeric, v_p->>'rationale', v_refs, v_model, 'model', 'proposed',
            jsonb_build_object('proposal_id', v_p->>'proposal_id', 'priority', v_p->'priority', 'target_node_ids', v_p->'target_node_ids', 'specific', v_p->'specific',
                               'expected_benefit', v_p->'expected_benefit', 'analysis_id', p_analysis_id),
            v_p->'success_criterion', v_p->'if_fails', p_finished_at);
  end loop;
  for v_g in select * from jsonb_array_elements(coalesce(p_result->'log_quality', '[]'::jsonb)) loop
    insert into wc_reflection_grades (reflection_id, analysis_id, verdict, send_back, created_at)
    values ((v_g->>'reflection_id')::bigint, p_analysis_id, v_g->>'verdict', coalesce((v_g->>'send_back')::boolean, false), p_finished_at);
  end loop;
  for v_r in select * from jsonb_array_elements(coalesce(p_result->'retire', '[]'::jsonb)) loop
    update wc_findings set status = 'retired' where id = (v_r->>'finding_id')::bigint and user_id = v_user and status = 'active';
  end loop;
  update wc_analyses set status = v_status, result = p_result, metrics = p_metrics, finished_at = p_finished_at, notes = p_result->>'notes_for_coach' where id = p_analysis_id;
  return v_map;
end $$;
revoke all on function public.wc_write_analysis_result(bigint, jsonb, jsonb, timestamptz) from public, anon, authenticated;
grant execute on function public.wc_write_analysis_result(bigint, jsonb, jsonb, timestamptz) to service_role;

-- 5. Shadow plans keep their ordered blocks on the plan row (Phase 5 will materialize them as wc_assignments; Phase 3 writes no assignments from the planner).
alter table public.wc_plans add column if not exists blocks jsonb;
