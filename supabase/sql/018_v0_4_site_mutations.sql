-- 018_v0_4_site_mutations.sql
-- Helper RPCs to create and update sites with proper geography point construction

begin;

-- Create site for a given wallet address
-- Accepts lon/lat and constructs location_point geography(Point,4326)
create or replace function public.create_site_for_wallet(
  in wallet_addr text,
  in site_name text,
  in site_type_id smallint,
  in lon numeric,
  in lat numeric,
  in depth_m numeric,
  in surface_area_m2 numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  prof_id uuid;
  new_id uuid;
begin
  select p.id into prof_id from public.profiles p where p.wallet_address ilike wallet_addr limit 1;
  if prof_id is null then
    raise exception 'No profile found for wallet %', wallet_addr using errcode = 'P0001';
  end if;

  insert into public.site (
    profile_id, site_name, site_type_id,
    location_point, lon, lat, depth_m, surface_area_m2
  ) values (
    prof_id, site_name, site_type_id,
    ST_SetSRID(ST_MakePoint(lon::double precision, lat::double precision), 4326)::geography,
    lon, lat, depth_m, surface_area_m2
  ) returning site_id into new_id;

  return new_id;
end
$$;

-- Update editable fields for a site (no coordinate changes here)
create or replace function public.update_site_basic(
  in site_uuid uuid,
  in site_name text,
  in site_type_id smallint,
  in depth_m numeric,
  in surface_area_m2 numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.site
  set site_name = site_name,
      site_type_id = site_type_id,
      depth_m = depth_m,
      surface_area_m2 = surface_area_m2,
      updated_at = now()
  where site_id = site_uuid;
end
$$;

commit;

