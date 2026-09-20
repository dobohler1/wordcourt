-- WordCourt · Phase 1 · import content_registry.json (public repo, pinned to a commit) into the versioned tables.
-- Service role only. Usage: select public.wc_import_registry('https://raw.githubusercontent.com/dobohler1/wordcourt/<commit>/content_registry.json');
create extension if not exists http with schema extensions;
create or replace function public.wc_import_registry(url text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare resp record; j jsonb; n_items int; n_sets int; n_links int;
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
  return jsonb_build_object('sets', n_sets, 'items', n_items, 'links', n_links, 'built', j->>'built');
end $$;
revoke execute on function public.wc_import_registry(text) from public, anon, authenticated;
