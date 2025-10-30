-- 010_v0_4_phase5_cleanup.sql
-- Backend v0.4 — Phase 5: Legacy cleanup after backfill and cutover
-- Drops legacy table public.attestations and the old enum type, with a safety check.

begin;

-- Safety check: ensure all legacy rows were backfilled
do $$
declare
  missing_count integer;
begin
  select count(*) into missing_count
  from public.attestations a
  left join public.site s
    on s.profile_id = a.profile_id
   and s.lon = a.location_lng
   and s.lat = a.location_lat
  left join public.attestation na
    on na.profile_id = a.profile_id
   and na.site_id = s.site_id
   and na.action_start_date = a.action_date
  where na.attestation_id is null;

  if missing_count > 0 then
    raise exception 'Refusing to drop legacy table: % legacy rows not backfilled. Run 009_v0_4_phase4_legacy_backfill.sql and re-check.', missing_count;
  end if;
end $$;

-- Drop legacy RLS policies if they exist (will be removed with table too, but explicit for clarity)
drop policy if exists attestations_select_public on public.attestations;
drop policy if exists attestations_insert_own_profile on public.attestations;
drop policy if exists attestations_update_own_profile on public.attestations;

-- Finally drop the legacy table
drop table if exists public.attestations;

-- Drop the old enum type that was renamed in 006; safe if no remaining dependencies
drop type if exists public.regen_type_enum;

commit;

