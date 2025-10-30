-- 012_v0_4_taxa_staging_merge.sql
-- Helper: import CSV into staging and merge any missing taxa into public.taxa

begin;

-- 1) Create staging table compatible with CSV headers
create table if not exists public.taxa_staging (
  scientific_name text,
  common_name text
);

-- 2) After you import your CSV into public.taxa_staging via the Supabase GUI,
--    run the following merge to insert any missing rows into public.taxa.

insert into public.taxa (scientific_name, common_name)
select distinct trim(s.scientific_name) as scientific_name,
       nullif(trim(s.common_name), '') as common_name
from public.taxa_staging s
where trim(s.scientific_name) is not null and trim(s.scientific_name) <> ''
on conflict (scientific_name) do nothing;

-- Optional: clean the staging table when done
-- truncate table public.taxa_staging;

commit;

