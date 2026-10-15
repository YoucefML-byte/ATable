-- Shared test helpers, included at the top of every pgTAP file (\ir 00_helpers.sql.inc).
-- Everything is created inside the test transaction and rolled back at the end.

create schema if not exists tests;
grant usage on schema tests to authenticated, anon;

-- Demo identifiers (supabase/seed.sql)
create or replace function tests.shop_a() returns uuid language sql immutable as $$ select 'c1000000-0000-4000-8000-000000000001'::uuid $$;
create or replace function tests.shop_b() returns uuid language sql immutable as $$ select 'c2000000-0000-4000-8000-000000000002'::uuid $$;
create or replace function tests.owner_a() returns uuid language sql immutable as $$ select 'a0000000-0000-4000-8000-000000000002'::uuid $$;
create or replace function tests.owner_b() returns uuid language sql immutable as $$ select 'a0000000-0000-4000-8000-000000000003'::uuid $$;
create or replace function tests.admin() returns uuid language sql immutable as $$ select 'a0000000-0000-4000-8000-000000000001'::uuid $$;
-- Bistrot staff members: Léa (floor, stock), Mehdi (kitchen), Sofia (all)
create or replace function tests.lea() returns uuid language sql immutable as $$ select 'b1000000-0000-4000-8000-000000000011'::uuid $$;
create or replace function tests.mehdi() returns uuid language sql immutable as $$ select 'b1000000-0000-4000-8000-000000000012'::uuid $$;
create or replace function tests.sofia() returns uuid language sql immutable as $$ select 'b1000000-0000-4000-8000-000000000013'::uuid $$;
create or replace function tests.token_a1() returns text language sql immutable as $$ select 'demoBistrotTable000001' $$;
create or replace function tests.token_b1() returns text language sql immutable as $$ select 'demoLoungeTable0000001' $$;

-- Become the given user (role authenticated) with the given assurance level.
create or replace function tests.login(p_user uuid, p_aal text default 'aal2', p_session uuid default null)
returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', p_user, 'role', 'authenticated', 'aal', p_aal,
    'session_id', coalesce(p_session::text, gen_random_uuid()::text))::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create or replace function tests.login_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('role', 'anon', true);
end;
$$;

create or replace function tests.logout() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

-- Creates an enrolled device and a valid staff session for the member, then logs in as them.
-- Must be called as postgres. Returns the device id.
create or replace function tests.staff_login(p_member uuid, p_expires interval default interval '14 hours')
returns uuid language plpgsql as $$
declare
  v_shop    uuid;
  v_user    uuid;
  v_owner   uuid;
  v_device  uuid;
  v_session uuid := gen_random_uuid();
begin
  select shop_id, user_id into v_shop, v_user from public.shop_members where id = p_member;
  select id into v_owner from public.shop_members where shop_id = v_shop and role = 'owner' limit 1;
  insert into public.devices (shop_id, name, secret_hash, enrolled_by)
  values (v_shop, 'Tablette test', encode(extensions.digest(gen_random_uuid()::text, 'sha256'), 'hex'), v_owner)
  returning id into v_device;
  insert into public.staff_sessions (session_id, shop_id, member_id, device_id, expires_at)
  values (v_session, v_shop, p_member, v_device, now() + p_expires);
  perform tests.login(v_user, 'aal1', v_session);
  return v_device;
end;
$$;

-- Places an order at a given instant (private function, called as postgres).
create or replace function tests.order_at(p_items jsonb, p_at timestamptz default now(),
  p_shop uuid default 'c1000000-0000-4000-8000-000000000001', p_token text default 'demoBistrotTable000001',
  p_client text default repeat('c', 40))
returns jsonb language sql as $$
  select private.place_order(p_shop, p_token, p_client, gen_random_uuid(), p_items, null, 'qr', p_at);
$$;

-- A Paris local time today (or another date) as timestamptz.
create or replace function tests.paris(p_time time, p_date date default (now() at time zone 'Europe/Paris')::date)
returns timestamptz language sql stable as $$ select (p_date + p_time) at time zone 'Europe/Paris' $$;

-- Number of rows affected by a statement (RLS silently filters rows on update/delete).
create or replace function tests.affected(p_sql text) returns integer language plpgsql as $$
declare v integer;
begin
  execute p_sql;
  get diagnostics v = row_count;
  return v;
end;
$$;

grant execute on all functions in schema tests to authenticated, anon;
