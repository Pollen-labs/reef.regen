-- 016_v0_4_trim_srs_from_location_payload.sql
-- Cleanup: do not store SRS in location_payload (SRID fixed at 4326 by geography type)

begin;

-- 1) Backfill: remove the `srs` key from existing payloads if present
update public.site
set location_payload = location_payload - 'srs'
where location_payload ? 'srs';

-- 2) Trigger to strip `srs` on insert/update for consistency
create or replace function public.site_location_payload_sanitize()
returns trigger language plpgsql as $$
begin
  if new.location_payload is not null then
    -- drop the `srs` attribute if provided
    new.location_payload := new.location_payload - 'srs';
  end if;
  return new;
end $$;

drop trigger if exists site_location_payload_sanitize_trg on public.site;
create trigger site_location_payload_sanitize_trg
before insert or update of location_payload on public.site
for each row execute function public.site_location_payload_sanitize();

-- 3) Optional: document the column purpose
comment on column public.site.location_payload is
  'Location Protocol payload without SRS; SRID enforced by geography(Point,4326). Keep keys like locationType, location, specVersion.';

commit;

