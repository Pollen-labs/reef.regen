-- 015_v0_4_file_name.sql
-- Add optional file_name to attestation and backfill from gateway URL/CID

begin;

alter table public.attestation
  add column if not exists file_name text;

-- Backfill from file_gateway_url last path segment (strip query) when possible
update public.attestation a
set file_name = nullif(split_part(regexp_replace(a.file_gateway_url, '^.*/', ''), '?', 1), '')
where a.file_name is null and a.file_gateway_url is not null;

-- Fallback: use ipfs_cid when no filename could be extracted
update public.attestation a
set file_name = a.ipfs_cid
where a.file_name is null and a.ipfs_cid is not null;

commit;

