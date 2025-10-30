-- 009_v0_4_phase4_legacy_backfill.sql
-- Backend v0.4 — Phase 4: Optional legacy backfill from public.attestations (legacy) into new model
-- This script is cautious and idempotent. Review before running in production.

begin;

-- 0) Resolve a generic site_type_id for "Other" without violating unique(name)
with other_existing as (
  select site_type_id from public.site_type where lower(name) = 'other'
), other_insert as (
  insert into public.site_type (site_type_id, name, description)
  select 6, 'Other', 'Imported from legacy attestations'
  where not exists (select 1 from other_existing)
  on conflict (site_type_id) do nothing
  returning site_type_id
), other_choice as (
  select site_type_id from other_existing
  union all
  select site_type_id from other_insert
)
select 1; -- no-op to close CTE chain

-- 1) Create one site per distinct (profile_id, location_lng, location_lat)
with distinct_sites as (
  select a.profile_id, a.location_lng as lon, a.location_lat as lat
  from public.attestations a
  group by a.profile_id, a.location_lng, a.location_lat
),
other_choice as (
  select site_type_id from public.site_type where lower(name) = 'other' limit 1
)
insert into public.site (
  profile_id, site_name, site_type_id,
  location_point, lon, lat,
  location_payload, depth_m, surface_area_m2
)
select
  ds.profile_id,
  coalesce(p.org_name, 'Imported Site') || ' @ ' || ds.lat || ',' || ds.lon as site_name,
  (select site_type_id from other_choice) as site_type_id,
  ST_SetSRID(ST_MakePoint(ds.lon::double precision, ds.lat::double precision), 4326)::geography,
  ds.lon, ds.lat,
  jsonb_build_object(
    'srs','EPSG:4326',
    'locationType','coordinate-decimal/lon-lat',
    'location', jsonb_build_array(ds.lon, ds.lat),
    'specVersion','1.0'
  ),
  null::numeric, null::numeric
from distinct_sites ds
left join public.profiles p on p.id = ds.profile_id
on conflict do nothing;

-- 2) Backfill attestations basic fields into new public.attestation table
--    Note: we intentionally do not copy species or action type links in this basic step.
insert into public.attestation (
  profile_id, site_id, action_start_date, action_end_date,
  summary, contributors, internal_identifier,
  ipfs_cid, file_gateway_url, eas_attestation_uid, show_on_map
)
select
  a.profile_id,
  s.site_id,
  a.action_date as action_start_date,
  null::date as action_end_date,
  a.summary,
  a.contributor_name as contributors,
  null::text as internal_identifier,
  a.file_cid as ipfs_cid,
  a.file_gateway_url,
  a.uid as eas_attestation_uid,
  coalesce(a.show_on_map, true)
from public.attestations a
join public.site s
  on s.profile_id = a.profile_id and s.lon = a.location_lng and s.lat = a.location_lat
left join public.attestation na
  on na.profile_id = a.profile_id
  and na.action_start_date = a.action_date
  and na.site_id = s.site_id
where na.attestation_id is null; -- avoid duplicates if re-run

-- 3) OPTIONAL: Map legacy enum regen_type into attestation_regen_type once `public.regen_type` rows are seeded
--    Uncomment and adjust names/ids to your seeded dataset.
-- insert into public.attestation_regen_type (attestation_id, regen_type_id)
-- select na.attestation_id,
--        rt.regen_type_id
-- from public.attestation na
-- join public.site s on s.site_id = na.site_id
-- join public.attestations a on a.profile_id = na.profile_id and a.action_date = na.action_start_date and s.lon = a.location_lng and s.lat = a.location_lat
-- join public.regen_type rt on rt.name = case a.regen_type::text
--   when 'transplantation' then 'Coral Outplanting'
--   when 'nursery' then 'Coral Nursery Maintenance'
--   else 'Other'
-- end
-- on conflict do nothing;

commit;
