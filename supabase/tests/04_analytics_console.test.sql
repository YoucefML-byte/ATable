-- Statistics, console and realtime tests. Bible: vol. 04 §15 « Statistiques », vol. 02 DSH-01, CON.
begin;
\ir 00_helpers.sql.inc
select plan(14);

-- 1. Business day: an order at 01:30 belongs to the previous business day (start 05:00).
select is(private.business_day(tests.shop_a(), tests.paris('01:30', '2026-10-15')), '2026-10-14'::date,
  'DSH-01 CA1 — 01:30 belongs to the previous business day');
select is(private.business_day(tests.shop_a(), tests.paris('05:00', '2026-10-15')), '2026-10-15'::date,
  '05:00 starts the business day');
select is(private.business_day(tests.shop_b(), tests.paris('05:30', '2026-10-15')), '2026-10-14'::date,
  'Lounge (start 06:00): 05:30 still belongs to the previous night');

-- 2. Overview consistent with a direct computation (validated = accepted, ready, served).
select tests.login(tests.owner_a());
select is(
  (public.analytics_overview(tests.shop_a(), current_date - 30, current_date) ->> 'validated_amount_cents')::bigint,
  (select coalesce(sum(subtotal_cents), 0) from public.orders
   where shop_id = tests.shop_a() and business_day between current_date - 30 and current_date
     and status in ('accepted', 'ready', 'served')),
  'DSH-01 CA2 — validated amount equals the direct sum');
select is(
  (public.analytics_overview(tests.shop_a(), current_date - 30, current_date) ->> 'validated_orders')::bigint,
  (select count(*) from public.orders
   where shop_id = tests.shop_a() and business_day between current_date - 30 and current_date
     and status in ('accepted', 'ready', 'served')),
  'validated orders count equals the direct count');
select is(
  (select sum((x ->> 'amount_cents')::bigint)::bigint from jsonb_array_elements(
     public.analytics_timeseries(tests.shop_a(), current_date - 30, current_date, 'day')) x),
  (public.analytics_overview(tests.shop_a(), current_date - 30, current_date) ->> 'validated_amount_cents')::bigint,
  'the daily series adds up to the overview');
select ok(jsonb_array_length(public.analytics_top_products(tests.shop_a(), current_date - 30, current_date, 10, 'amount')) = 10,
  'top 10 products');
select throws_ok($$ select public.analytics_overview('c2000000-0000-4000-8000-000000000002', current_date - 7, current_date) $$,
  'P0001', 'FORBIDDEN', 'owner A cannot read the statistics of shop B');
select tests.logout();

-- 3. An employee (even Floor) cannot call the statistics.
select tests.staff_login(tests.sofia());
select throws_ok($$ select public.analytics_overview('c1000000-0000-4000-8000-000000000001', current_date - 7, current_date) $$,
  'P0001', 'FORBIDDEN', 'an employee cannot read the statistics');
select tests.logout();

-- 4. Console: only a platform admin in aal2.
select tests.login(tests.owner_a());
select throws_ok($$ select * from public.console_shop_health() $$, 'P0001', 'FORBIDDEN', 'an owner cannot use the console');
select tests.logout();
select tests.login(tests.admin(), 'aal1');
select throws_ok($$ select * from public.console_shop_health() $$, 'P0001', 'FORBIDDEN', 'admin in aal1 cannot use the console');
select tests.logout();
select tests.login(tests.admin());
select is((select count(*)::int from public.console_shop_health()), 2, 'admin (aal2) sees every shop');
select isnt(public.console_create_shop('Café Test', 'cafe-test', 'cafe', 'Europe/Paris', 'atable.test'), null,
  'CON-01 — the console creates a shop');
select tests.logout();
select is(
  (select count(*)::int from public.menus m join public.shops s on s.id = m.shop_id where s.slug = 'cafe-test' and m.is_default)
  + (select count(*)::int from public.shop_themes t join public.shops s on s.id = t.shop_id where s.slug = 'cafe-test')
  + (select count(*)::int from public.shop_domains d where d.hostname = 'cafe-test.atable.test'),
  3, 'the new shop has a default menu, a theme and its platform subdomain');

select * from finish();
rollback;
