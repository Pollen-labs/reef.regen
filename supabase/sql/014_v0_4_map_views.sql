-- 014_v0_4_map_views.sql
-- Views and RPCs to support the Map page contracts with v0.4 schema

begin;

-- 1) Map points: one row per site with attestation count for visible attestations
create or replace view public.site_points_v as
select
  s.site_id,
  s.site_name,
  s.lon,
  s.lat,
  count(a.attestation_id) filter (where a.show_on_map is true) as attestation_count
from public.site s
left join public.attestation a on a.site_id = s.site_id
group by s.site_id, s.site_name, s.lon, s.lat;

-- 2) Attestation summary per attestation with action types and species names
create or replace view public.attestation_min_v as
select a.attestation_id,
       a.site_id,
       a.created_at as submitted_at,
       a.action_start_date,
       a.summary,
       a.ipfs_cid,
       a.file_gateway_url,
       a.eas_attestation_uid,
       coalesce(json_agg(distinct rt.name) filter (where rt.regen_type_id is not null), '[]') as action_types,
       coalesce(json_agg(distinct t.scientific_name) filter (where t.taxa_id is not null), '[]') as species
from public.attestation a
left join public.attestation_regen_type art on art.attestation_id = a.attestation_id
left join public.regen_type rt on rt.regen_type_id = art.regen_type_id
left join public.attestation_taxa atx on atx.attestation_id = a.attestation_id
left join public.taxa t on t.taxa_id = atx.taxa_id
group by a.attestation_id;

-- 3) RPC: site detail payload matching Location contract shape
-- Returns one jsonb with: id, name, lat, lng, attestationCount, actionsBreakdown[], species[], attestations[] (recent N)
create or replace function public.get_site_detail(site_uuid uuid, recent_count int default 5)
returns jsonb
language sql
stable
as $$
  with base as (
    select s.site_id, s.site_name, s.lat, s.lon
    from public.site s where s.site_id = site_uuid
  ),
  counts as (
    select count(a.attestation_id) as attestation_count
    from public.attestation a where a.site_id = site_uuid and a.show_on_map is true
  ),
  actions as (
    select coalesce(json_agg(jsonb_build_object('label', x.name, 'count', x.cnt, 'color', x.color)),'[]'::json) as actions_breakdown
    from (
      select rt.name,
             count(*) as cnt,
             case rt.category
               when 'Asexual Propagation' then '#F034ED' -- magenta
               when 'Sexual Propagation' then '#4DCEAE'  -- aquamarine
               when 'Substratum Enhancement' then '#9CA3AF' -- gray
               else '#9CA3AF'
             end as color
      from public.attestation_regen_type art
      join public.attestation a on a.attestation_id = art.attestation_id and a.site_id = site_uuid and a.show_on_map is true
      join public.regen_type rt on rt.regen_type_id = art.regen_type_id
      group by rt.name, rt.category
      order by rt.name
    ) x
  ),
  species as (
    select coalesce(json_agg(distinct t.scientific_name),'[]'::json) as species_list
    from public.attestation_taxa atx
    join public.attestation a on a.attestation_id = atx.attestation_id and a.site_id = site_uuid and a.show_on_map is true
    join public.taxa t on t.taxa_id = atx.taxa_id
  ),
  recent as (
    select coalesce(json_agg(jsonb_build_object(
              'id', r.attestation_id,
              'title', coalesce(nullif(r.summary,''), to_char(r.action_start_date,'YYYY-MM-DD')),
              'submittedAt', r.created_at,
              'actionDate', r.action_start_date,
              'actionTypes', r.action_types
            ) order by r.action_start_date desc nulls last), '[]'::json) as items
    from (
      select a.attestation_id, a.created_at, a.action_start_date, a.summary, am.action_types
      from public.attestation a
      join public.attestation_min_v am on am.attestation_id = a.attestation_id
      where a.site_id = site_uuid and a.show_on_map is true
      order by a.action_start_date desc nulls last
      limit greatest(recent_count, 0)
    ) r
  )
  select jsonb_build_object(
      'id', b.site_id,
      'name', b.site_name,
      'lat', b.lat,
      'lng', b.lon,
      'attestationCount', coalesce(c.attestation_count,0),
      'actionsBreakdown', a.actions_breakdown,
      'species', s.species_list,
      'attestations', r.items
  )
  from base b
  left join counts c on true
  left join actions a on true
  left join species s on true
  left join recent r on true;
$$;

commit;
