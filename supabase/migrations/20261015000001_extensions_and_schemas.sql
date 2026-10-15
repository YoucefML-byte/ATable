-- Extensions, private schema and default privileges.
-- Bible: vol. 04 §1, §5, §6.1.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon;
-- Needed so that RLS policies (evaluated as `authenticated`) can call helper functions.
grant usage on schema private to authenticated;

-- Defence in depth: anon never gets direct table privileges in public.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
-- Functions are not executable by default: every function grants explicitly.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon;

-- Shared trigger: keep updated_at current.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
