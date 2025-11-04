-- 017_v0_4_drop_location_payload.sql
-- Remove site.location_payload since SRS/locationType/specVersion are fixed in frontend

begin;

-- Drop sanitize trigger/function if present
drop trigger if exists site_location_payload_sanitize_trg on public.site;
drop function if exists public.site_location_payload_sanitize();

-- Drop the column (payload now reconstructed client-side as needed)
alter table public.site
  drop column if exists location_payload;

commit;

