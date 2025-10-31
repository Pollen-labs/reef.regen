Reef.regen — Supabase SQL (Backend v0.4)

Overview
- This folder contains SQL you can run in the Supabase SQL Editor to create and migrate the reef.regen backend.
- v0.4 introduces Sites as first‑class records and expands Attestations to support multiple action types and species counts.

Run order
- 001_schema.sql — Initial MVP schema (profiles, coral_species, attestations).
- 002_rls.sql — RLS for initial schema.
- 003_seed.sql — Example seed for coral_species (legacy UI only).
- 004_v0_3.sql — File CID + map visibility on legacy `attestations`.
- 005_v0_5.sql — profiles.email column.
- 006_v0_4_phase1_schema.sql — New v0.4 schema (sites, attestation v2, regen_type table, taxa, joins).
- 007_v0_4_phase2_seeds_template.sql — Seed `site_type` and the curated `regen_type` list.
- 008_v0_4_phase3_rls.sql — RLS for new v0.4 tables.
- 009_v0_4_phase4_legacy_backfill.sql — Optional: backfill legacy `attestations` → new `attestation` + `site`.
- 010_v0_4_phase5_cleanup.sql — Optional: drop legacy table and old enum after cutover.
- 011_v0_4_taxa_identity.sql — Make `taxa_id` auto‑generated for CSV imports.
 - 016_v0_4_trim_srs_from_location_payload.sql — Strip `srs` and sanitize payload (legacy).
 - 017_v0_4_drop_location_payload.sql — Drop `site.location_payload`; construct JSON client-side.
 - 013_v0_4_taxa_and_legacy_cleanup.sql — Cleanup: drop `taxa_staging` and legacy `coral_species`.

Core tables (v0.4)
- `site_type` (smallint PK): Outplant reef, Nursery, Lab/Hatchery, Staging/Holding, Other.
- `site` (uuid PK): profile owner, name, type, PostGIS `location_point`, `lon`/`lat`, optional `depth_m` and `surface_area_m2`, `location_payload` JSON.
- `regen_type` (int PK): controlled vocabulary of action types with `category` enum, `std_label`, `stage`, optional `primary_site_type_id`, `aliases`.
- `taxa` (int PK, identity): species catalog with unique `scientific_name` and optional `common_name`.
- `attestation` (uuid PK): references `profile` and `site`; `action_start_date`/`action_end_date`, `summary`, `contributors[]`, `internal_identifier` (unique per profile), `ipfs_cid`, optional `file_gateway_url`, optional `eas_attestation_uid`, `show_on_map`.
- `attestation_regen_type` (composite PK): many‑to‑many between attestation and regen_type.
- `attestation_taxa` (composite PK): many‑to‑many between attestation and taxa with optional `count`.

Enums
- `regen_category`: Asexual Propagation | Sexual Propagation | Substratum Enhancement.

Indexes
- GIST index on `site.location_point` for fast map queries; FK indexes on `site.profile_id`, `site.site_type_id`, `attestation.profile_id`, `attestation.site_id`.

RLS summary (v0.4)
- Public SELECT on `site_type`, `regen_type`, `taxa`, `site`, `attestation`, and the join tables.
- Owners (users whose `auth.uid()` matches the row’s profile owner) can INSERT/UPDATE their own `site` and `attestation` rows.
- Owners can INSERT/UPDATE/DELETE their own join rows (`attestation_regen_type`, `attestation_taxa`).
- No client delete on core `site` and `attestation` by default.

Seeding
- Run `007_v0_4_phase2_seeds_template.sql` to seed `site_type` and the curated `regen_type` list.
- For `taxa` (~5k species), either use Supabase CSV import or a staging table. `011_v0_4_taxa_identity.sql` enables auto IDs.
  - CSV header: `scientific_name[,common_name]`. Map `scientific_name`; leave `taxa_id` unmapped.

Legacy migration (optional)
- `009_v0_4_phase4_legacy_backfill.sql` creates minimal `site` rows per distinct legacy `(profile_id, lng, lat)` and copies legacy `attestations` to new `attestation`.
- `010_v0_4_phase5_cleanup.sql` drops legacy `public.attestations` and the old enum (with a safety check that all rows were backfilled).

Example queries
- Sites + attestation count:
  select s.site_id, s.site_name, s.lon, s.lat, count(a.attestation_id) as attestation_count
  from public.site s
  left join public.attestation a on a.site_id = s.site_id and a.show_on_map is true
  group by s.site_id, s.site_name, s.lon, s.lat;

- Attestations for a site:
  select * from public.attestation where site_id = $1 order by action_start_date desc nulls last;

- Attestation detail with actions & taxa:
  select a.*, 
         coalesce(json_agg(distinct rt.name) filter (where rt.regen_type_id is not null), '[]') as actions,
         coalesce(json_agg(distinct jsonb_build_object('taxa_id', t.taxa_id, 'scientific_name', t.scientific_name, 'count', at.count))
                  filter (where t.taxa_id is not null), '[]') as species
  from public.attestation a
  left join public.attestation_regen_type art on art.attestation_id = a.attestation_id
  left join public.regen_type rt on rt.regen_type_id = art.regen_type_id
  left join public.attestation_taxa at on at.attestation_id = a.attestation_id
  left join public.taxa t on t.taxa_id = at.taxa_id
  where a.attestation_id = $1
  group by a.attestation_id;

Notes
- PostGIS is required (`create extension if not exists postgis;`).
- Dates are UTC; `action_end_date` is optional.
- For large map workloads, consider a materialized view of per‑site stats.
