-- Isolation and access tests. Bible: vol. 04 §15 « Isolation », vol. 05 M4.
begin;
\ir 00_helpers.sql.inc
select plan(31);

-- Every public table that carries a shop_id.
create temp table shop_tables on commit drop as
select c.table_name::text as t
from information_schema.columns c
join information_schema.tables tb on tb.table_schema = c.table_schema and tb.table_name = c.table_name
where c.table_schema = 'public' and c.column_name = 'shop_id' and tb.table_type = 'BASE TABLE';
grant select on shop_tables to authenticated, anon;

create or replace function tests.count_rows(p_table text, p_shop uuid) returns bigint
language plpgsql as $$
declare v bigint;
begin
  execute format('select count(*) from public.%I where shop_id = $1', p_table) into v using p_shop;
  return v;
end;
$$;
create or replace function tests.tables_leaking(p_shop uuid) returns text[]
language plpgsql as $$
declare r record; v text[] := '{}';
begin
  for r in select t from shop_tables loop
    begin
      if tests.count_rows(r.t, p_shop) > 0 then v := v || r.t; end if;
    exception when insufficient_privilege then null; -- no privilege at all: nothing leaks
    end;
  end loop;
  return v;
end;
$$;
grant execute on all functions in schema tests to authenticated, anon;

select ok((select count(*) from shop_tables) >= 20, 'at least 20 tables carry shop_id');

-- RLS is enabled on every table of public.
select is(
  (select array_agg(tablename::text order by tablename) from pg_tables
   where schemaname = 'public' and not rowsecurity),
  null, 'RLS is enabled on every table of public');

-- No policy targets anon.
select is(
  (select count(*)::int from pg_policies where schemaname = 'public' and 'anon' = any (roles)),
  0, 'no policy for anon in public');

-- 1. Owner A (aal2) reads nothing from shop B, in any table.
select tests.login(tests.owner_a());
select is(tests.tables_leaking(tests.shop_b()), '{}'::text[], 'owner A reads no row of shop B in any table');
select ok(tests.count_rows('products', tests.shop_a()) = 30, 'owner A reads its 30 products');

-- 2. Owner A cannot insert, update or delete in shop B.
select throws_ok(
  $$ insert into public.categories (shop_id, name) values ('c2000000-0000-4000-8000-000000000002', 'Hack') $$,
  '42501', null, 'owner A cannot insert a category into shop B');
select is(
  tests.affected($q$update public.products set base_price_cents = 1 where shop_id = tests.shop_b()$q$), 0, 'owner A cannot update products of shop B');
select is(
  tests.affected($q$delete from public.menu_categories where shop_id = tests.shop_b()$q$), 0, 'owner A cannot delete links of shop B');
select is(
  tests.affected($q$update public.shops set name = 'Hack' where id = tests.shop_b()$q$), 0, 'owner A cannot rename shop B');
select throws_ok(
  $$ update public.shops set status = 'active' where id = 'c1000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'owner cannot change the status of their own shop (column privilege)');
select throws_ok(
  $$ update public.shop_members set pin_hash = 'x' where shop_id = 'c1000000-0000-4000-8000-000000000001' $$,
  '42501', null, 'owner cannot write pin_hash directly (column privilege)');
select tests.logout();

-- 3. anon reads no table directly.
select tests.login_anon();
select throws_ok($$ select count(*) from public.products $$, '42501', null, 'anon cannot read products');
select throws_ok($$ select count(*) from public.orders $$, '42501', null, 'anon cannot read orders');
select throws_ok($$ select count(*) from public.shops $$, '42501', null, 'anon cannot read shops');
select throws_ok($$ select count(*) from public.table_tokens $$, '42501', null, 'anon cannot read table tokens');
select tests.logout();

-- 4. Owner in aal1 (2FA not passed) reads nothing.
select tests.login(tests.owner_a(), 'aal1');
select is(tests.count_rows('products', tests.shop_a()), 0::bigint, 'owner in aal1 reads no product');
select is((select count(*) from public.shop_members)::int, 0, 'owner in aal1 reads no member (restrictive policy)');
select tests.logout();

-- 5. Employee without a valid staff session reads nothing.
select tests.login('a0000000-0000-4000-8000-000000000011', 'aal1');
select is(tests.count_rows('products', tests.shop_a()), 0::bigint, 'employee without staff session reads nothing');
select tests.logout();

-- 6. Employee with a valid session reads the catalog, cannot modify it.
select tests.staff_login(tests.lea()) as lea_device \gset
select is(tests.count_rows('products', tests.shop_a()), 30::bigint, 'Léa (valid session) reads the catalog');
select is(
  tests.affected($q$update public.products set base_price_cents = 1 where shop_id = tests.shop_a()$q$), 0, 'an employee cannot modify the catalog (price)');
select is(tests.tables_leaking(tests.shop_b()), '{}'::text[], 'employee of A reads nothing of shop B');
select tests.logout();

-- 7. Revoked device: immediately no access.
update public.devices set revoked_at = now() where id = :'lea_device';
select tests.login('a0000000-0000-4000-8000-000000000011', 'aal1',
  (select session_id from public.staff_sessions where device_id = :'lea_device'));
select is(tests.count_rows('products', tests.shop_a()), 0::bigint, 'revoked device: no access, immediately');
select tests.logout();

-- 8. Expired staff session: no access.
select tests.staff_login(tests.lea(), interval '-1 minute');
select is(tests.count_rows('products', tests.shop_a()), 0::bigint, 'expired staff session: no access');
select tests.logout();

-- 9. Locked device (ADR-009): existing sessions keep working, only new logins are blocked.
select tests.staff_login(tests.lea()) as lea_device2 \gset
select tests.logout();
update public.devices set locked = true where id = :'lea_device2';
select tests.login('a0000000-0000-4000-8000-000000000011', 'aal1',
  (select session_id from public.staff_sessions where device_id = :'lea_device2'));
select is(tests.count_rows('products', tests.shop_a()), 30::bigint, 'locked device keeps open sessions (ADR-009)');
select tests.logout();

-- 10. "Stock"-only employee does not read orders (ADR-009), Kitchen does.
update public.shop_members set permissions = '{stock}' where id = tests.lea();
select tests.staff_login(tests.lea());
select is(tests.count_rows('orders', tests.shop_a()), 0::bigint, 'Stock-only employee reads no order');
select is(tests.count_rows('table_tokens', tests.shop_a()), 0::bigint, 'employee reads no table token');
select tests.logout();
select tests.staff_login(tests.mehdi());
select ok(tests.count_rows('orders', tests.shop_a()) > 0, 'Kitchen employee reads orders');
select is((select count(*)::int from public.shop_members), 1, 'employee reads only their own member row');
select tests.logout();

-- 11. Suspended shop: owner can read but not write.
update public.shops set status = 'suspended' where id = tests.shop_a();
select tests.login(tests.owner_a());
select ok(tests.count_rows('products', tests.shop_a()) = 30, 'owner of suspended shop still reads');
select is(
  tests.affected($q$update public.products set name = 'X' where shop_id = tests.shop_a()$q$), 0, 'owner of suspended shop cannot write');
select tests.logout();
update public.shops set status = 'active' where id = tests.shop_a();

-- 12. Cross-shop links are refused by assert_same_shop.
select throws_ok(
  $$ insert into public.menu_categories (menu_id, category_id, shop_id)
     values ('d1000000-0000-4000-8000-000000000001', 'e2000000-0000-4000-8000-000000000001',
             'c1000000-0000-4000-8000-000000000001') $$,
  'P0001', 'CROSS_SHOP_LINK', 'a category of shop B cannot be linked to a menu of shop A');

select * from finish();
rollback;
