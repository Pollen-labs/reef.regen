-- 008_v0_4_phase3_rls.sql
-- Backend v0.4 — Phase 3: RLS for new tables

begin;

-- Enable RLS
alter table if exists public.site_type enable row level security;
alter table if exists public.regen_type enable row level security;
alter table if exists public.taxa enable row level security;
alter table if exists public.site enable row level security;
alter table if exists public.attestation enable row level security;
alter table if exists public.attestation_regen_type enable row level security;
alter table if exists public.attestation_taxa enable row level security;

-- Helpers: owners are users whose auth.uid() matches profiles.user_id for the row profile_id

-- Public read policies
drop policy if exists site_type_select_public on public.site_type;
create policy site_type_select_public on public.site_type for select using (true);

drop policy if exists regen_type_select_public on public.regen_type;
create policy regen_type_select_public on public.regen_type for select using (true);

drop policy if exists taxa_select_public on public.taxa;
create policy taxa_select_public on public.taxa for select using (true);

drop policy if exists site_select_public on public.site;
create policy site_select_public on public.site for select using (true);

drop policy if exists attestation_select_public on public.attestation;
create policy attestation_select_public on public.attestation for select using (true);

drop policy if exists attestation_regen_type_select_public on public.attestation_regen_type;
create policy attestation_regen_type_select_public on public.attestation_regen_type for select using (true);

drop policy if exists attestation_taxa_select_public on public.attestation_taxa;
create policy attestation_taxa_select_public on public.attestation_taxa for select using (true);

-- Sites: insert/update by owners; no deletes from clients
drop policy if exists site_insert_own on public.site;
create policy site_insert_own on public.site
  for insert
  with check (
    auth.uid() is not null and exists (
      select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()
    )
  );

drop policy if exists site_update_own on public.site;
create policy site_update_own on public.site
  for update
  using (
    auth.uid() is not null and exists (
      select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() is not null and exists (
      select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()
    )
  );

-- Attestations: insert/update by owners; no deletes from clients
drop policy if exists attestation_insert_own on public.attestation;
create policy attestation_insert_own on public.attestation
  for insert
  with check (
    auth.uid() is not null and exists (
      select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()
    )
  );

drop policy if exists attestation_update_own on public.attestation;
create policy attestation_update_own on public.attestation
  for update
  using (
    auth.uid() is not null and exists (
      select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() is not null and exists (
      select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()
    )
  );

-- Join tables: ensure the linked attestation belongs to the user for writes
drop policy if exists art_write_own on public.attestation_regen_type;
create policy art_write_own on public.attestation_regen_type
  for all -- allow owners to insert/update/delete links
  using (
    auth.uid() is not null and exists (
      select 1 from public.attestation a
      join public.profiles p on p.id = a.profile_id
      where a.attestation_id = attestation_id and p.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() is not null and exists (
      select 1 from public.attestation a
      join public.profiles p on p.id = a.profile_id
      where a.attestation_id = attestation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists atax_write_own on public.attestation_taxa;
create policy atax_write_own on public.attestation_taxa
  for all -- allow owners to insert/update/delete links
  using (
    auth.uid() is not null and exists (
      select 1 from public.attestation a
      join public.profiles p on p.id = a.profile_id
      where a.attestation_id = attestation_id and p.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() is not null and exists (
      select 1 from public.attestation a
      join public.profiles p on p.id = a.profile_id
      where a.attestation_id = attestation_id and p.user_id = auth.uid()
    )
  );

commit;
