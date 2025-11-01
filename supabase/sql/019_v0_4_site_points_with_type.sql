-- 019_v0_4_site_points_with_type.sql
-- Extend site_points_v to include site_type_name for per-site coloring on map

begin;

create or replace view public.site_points_v as
select
  -- keep existing columns in the same order to satisfy CREATE OR REPLACE VIEW
  s.site_id,
  s.site_name,
  s.lon,
  s.lat,
  count(a.attestation_id) filter (where a.show_on_map is true) as attestation_count,
  -- append new column at the end (safe for replace)
  stt.name as site_type_name
from public.site s
join public.site_type stt on stt.site_type_id = s.site_type_id
left join public.attestation a on a.site_id = s.site_id
group by s.site_id, s.site_name, s.lon, s.lat, stt.name;

commit;
