-- 013_v0_4_taxa_and_legacy_cleanup.sql
-- Cleanup: remove staging table and legacy coral_species

begin;

-- Drop staging table used for CSV imports
drop table if exists public.taxa_staging;

-- Remove legacy coral_species (replaced by public.taxa)
-- Drop RLS policy first (if present), then drop the table
drop policy if exists coral_species_select_public on public.coral_species;
drop table if exists public.coral_species;

commit;

