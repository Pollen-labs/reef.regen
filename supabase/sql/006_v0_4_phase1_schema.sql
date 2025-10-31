-- 006_v0_4_phase1_schema.sql
-- Backend v0.4 — Phase 1: New schema (Sites, Attestations v2, Regen/Taxa catalogs)
-- Safe to run on existing DB; does not drop/alter legacy tables except renaming a conflicting enum type.

begin;

-- Extensions required
create extension if not exists pgcrypto;
create extension if not exists postgis;

-- 1) Avoid name conflict: existing enum type `public.regen_type` from v0.1
--    We will rename it so we can create a table named `public.regen_type` per the new spec.
do $$ begin
  if exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
             where n.nspname = 'public' and t.typname = 'regen_type') then
    execute 'alter type public.regen_type rename to regen_type_enum';
  end if;
end $$;

-- 2) Enum for regen categories
do $$ begin
  if not exists (select 1 from pg_type where typname = 'regen_category') then
    create type public.regen_category as enum (
      'Asexual Propagation',
      'Sexual Propagation',
      'Substratum Enhancement'
    );
  end if;
end $$;

-- 3) Lookup: site_type
create table if not exists public.site_type (
  site_type_id smallint primary key,
  name text unique not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4) Catalog: regen_type (table)
create table if not exists public.regen_type (
  regen_type_id integer primary key,
  name text unique not null,
  category public.regen_category not null,
  description text,
  std_label text,
  stage text,
  primary_site_type_id smallint references public.site_type(site_type_id) on delete set null,
  aliases text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) Catalog: taxa
create table if not exists public.taxa (
  taxa_id integer primary key,
  scientific_name text unique not null,
  common_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper trigger for updated_at (idempotent)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end
$$;

-- 6) Core: site
create table if not exists public.site (
  site_id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  site_name text not null,
  site_type_id smallint not null references public.site_type(site_type_id) on delete restrict,
  location_point geography(Point,4326) not null,
  lon numeric(9,6) not null,
  lat numeric(9,6) not null,
  depth_m numeric(6,2) check (depth_m is null or depth_m >= 0),
  surface_area_m2 numeric(12,2) check (surface_area_m2 is null or surface_area_m2 >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for site
create index if not exists site_profile_idx on public.site(profile_id);
create index if not exists site_type_idx on public.site(site_type_id);
create index if not exists site_location_gix on public.site using gist (location_point);

-- updated_at triggers
drop trigger if exists site_touch_updated_at on public.site;
create trigger site_touch_updated_at
before update on public.site
for each row execute function public.touch_updated_at();

drop trigger if exists site_type_touch_updated_at on public.site_type;
create trigger site_type_touch_updated_at
before update on public.site_type
for each row execute function public.touch_updated_at();

drop trigger if exists regen_type_touch_updated_at on public.regen_type;
create trigger regen_type_touch_updated_at
before update on public.regen_type
for each row execute function public.touch_updated_at();

drop trigger if exists taxa_touch_updated_at on public.taxa;
create trigger taxa_touch_updated_at
before update on public.taxa
for each row execute function public.touch_updated_at();

-- 7) Core: attestation (v2)
create table if not exists public.attestation (
  attestation_id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  site_id uuid not null references public.site(site_id) on delete cascade,
  action_start_date date not null,
  action_end_date date,
  summary text,
  contributors text[],
  internal_identifier text,
  ipfs_cid text,
  file_gateway_url text,
  eas_attestation_uid text,
  show_on_map boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attestation_internal_ident_unique unique (profile_id, internal_identifier) deferrable initially immediate
);

create index if not exists attestation_profile_idx on public.attestation(profile_id);
create index if not exists attestation_site_idx on public.attestation(site_id);
create index if not exists attestation_start_date_idx on public.attestation(action_start_date desc);

drop trigger if exists attestation_touch_updated_at on public.attestation;
create trigger attestation_touch_updated_at
before update on public.attestation
for each row execute function public.touch_updated_at();

-- 8) Joins: attestation_regen_type, attestation_taxa
create table if not exists public.attestation_regen_type (
  attestation_id uuid not null references public.attestation(attestation_id) on delete cascade,
  regen_type_id integer not null references public.regen_type(regen_type_id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (attestation_id, regen_type_id)
);

create table if not exists public.attestation_taxa (
  attestation_id uuid not null references public.attestation(attestation_id) on delete cascade,
  taxa_id integer not null references public.taxa(taxa_id) on delete restrict,
  count integer check (count is null or count >= 0),
  created_at timestamptz not null default now(),
  primary key (attestation_id, taxa_id)
);

commit;
