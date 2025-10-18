-- 004_v0_3.sql
-- v0.3 additions: filebase integration + map visibility

begin;

alter table public.attestations
  add column if not exists file_cid text,
  add column if not exists file_gateway_url text,
  add column if not exists show_on_map boolean default true;

-- Optional: index for show_on_map
create index if not exists attestations_show_on_map_idx on public.attestations (show_on_map);

commit;

