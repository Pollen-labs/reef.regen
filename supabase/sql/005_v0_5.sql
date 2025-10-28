-- 005_v0_5.sql
-- v0.5 addition: store email captured from Web3Auth (embedded wallet)

begin;

-- Add an email column to public.profiles if it doesn't exist
alter table public.profiles
  add column if not exists email text;

commit;

