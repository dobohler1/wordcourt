-- WordCourt · Phase 1 follow-up · store each distinct item content once; link set versions to item versions.
-- wc_item_versions was empty when this ran; no learner data involved.
alter table public.wc_item_versions alter column set_version_id drop not null;
comment on column public.wc_item_versions.set_version_id is 'set version in which this item content was first registered (informational)';
alter table public.wc_item_versions drop constraint if exists wc_item_versions_set_version_id_item_id_key;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'wc_item_versions_item_id_content_hash_key') then
    alter table public.wc_item_versions add constraint wc_item_versions_item_id_content_hash_key unique (item_id, content_hash);
  end if;
end $$;
create table if not exists public.wc_set_version_items (
  set_version_id  bigint not null references public.wc_set_versions(id),
  item_version_id bigint not null references public.wc_item_versions(id),
  position        smallint not null,
  primary key (set_version_id, item_version_id)
);
create index if not exists wc_set_version_items_item_idx on public.wc_set_version_items (item_version_id);
alter table public.wc_set_version_items enable row level security;
drop policy if exists "read set version items" on public.wc_set_version_items;
create policy "read set version items" on public.wc_set_version_items for select to authenticated using (true);
