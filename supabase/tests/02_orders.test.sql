-- Order placement tests. Bible: vol. 04 §15 « Commande », vol. 02 CLI-05, vol. 05 M1–M3.
begin;
\ir 00_helpers.sql.inc
select plan(43);

-- Products of Le Bistrot Démo (seed)
--   Café f...21 (1,80 €, always-available menu), Tiramisu f...16 (6,50 €), Croque-monsieur f...11 (lunch/evening)
--   Tacos 2 viandes f...13: Viandes 2/2, Sauces 0..3 (Harissa sold out), Gratiné +1 €, Suppléments ×2
\set cafe '''f1000000-0000-4000-8000-000000000021'''
\set tiramisu '''f1000000-0000-4000-8000-000000000016'''
\set burger '''f1000000-0000-4000-8000-000000000011'''
\set tacos '''f1000000-0000-4000-8000-000000000013'''

-- 1. The total is computed by the database; a price in the input has no effect (M2).
select is(
  (tests.order_at(format('[{"product_id":%s,"quantity":2,"price":1},{"product_id":%s,"quantity":1,"unit_price_cents":0}]',
                         to_json(:cafe::text), to_json(:tiramisu::text))::jsonb)->>'subtotal_cents')::int,
  2 * 180 + 650, 'CLI-05 CA1 — the total is computed by the database, client prices are ignored');

-- 2. Composed product: (base + options) × quantity.
select is(
  (tests.order_at(format('[{"product_id":%s,"quantity":2,"options":[
      {"option_id":"92000000-0000-4000-8000-000000000001"},{"option_id":"92000000-0000-4000-8000-000000000003"},
      {"option_id":"92000000-0000-4000-8000-000000000005"},{"option_id":"92000000-0000-4000-8000-000000000009"},
      {"option_id":"92000000-0000-4000-8000-000000000010","quantity":2}]}]', to_json(:tacos::text))::jsonb,
      tests.paris('12:30'), p_client => repeat('d', 40))->>'subtotal_cents')::int,
  (950 + 100 + 2 * 100) * 2, 'CLI-03 CA3 — tacos price = (base + supplements) × quantity');

-- 3. Unavailable products → PRODUCT_UNAVAILABLE (M3).
update public.products set is_sold_out = true where id = :tiramisu;
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]') $$, to_json(:tiramisu::text)),
  'P0001', 'PRODUCT_UNAVAILABLE', 'sold-out product is refused');
update public.products set is_sold_out = false, is_hidden = true where id = :tiramisu;
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]') $$, to_json(:tiramisu::text)),
  'P0001', 'PRODUCT_UNAVAILABLE', 'hidden product is refused');
update public.products set is_hidden = false, deleted_at = now() where id = :tiramisu;
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]') $$, to_json(:tiramisu::text)),
  'P0001', 'PRODUCT_UNAVAILABLE', 'deleted product is refused');
update public.products set deleted_at = null where id = :tiramisu;
update public.categories set is_sold_out = true where id = 'e1000000-0000-4000-8000-000000000004';
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]') $$, to_json(:tiramisu::text)),
  'P0001', 'PRODUCT_UNAVAILABLE', 'product of a sold-out category is refused');
update public.categories set is_sold_out = false, is_hidden = true where id = 'e1000000-0000-4000-8000-000000000004';
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]') $$, to_json(:tiramisu::text)),
  'P0001', 'PRODUCT_UNAVAILABLE', 'product of a hidden category is refused');
update public.categories set is_hidden = false where id = 'e1000000-0000-4000-8000-000000000004';
select throws_ok($$ select tests.order_at('[{"product_id":"f2000000-0000-4000-8000-000000000007","quantity":1}]') $$,
  'P0001', 'PRODUCT_UNAVAILABLE', 'product of another shop is refused');
select throws_ok($$ select tests.order_at('[{"product_id":"00000000-0000-4000-8000-000000000000","quantity":1}]') $$,
  'P0001', 'PRODUCT_UNAVAILABLE', 'unknown product is refused');

-- 4. Schedules: lunch menu product at 16:00 is refused, at 12:30 accepted, at 20:00 accepted.
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]', tests.paris('16:00')) $$, to_json(:burger::text)),
  'P0001', 'PRODUCT_UNAVAILABLE', 'CLI-02 CA2 — product outside of any active menu (16:00) is refused');
select lives_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]', tests.paris('12:30'), p_client => repeat('e', 40)) $$, to_json(:burger::text)),
  'lunch product ordered at 12:30');
select lives_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]', tests.paris('20:00'), p_client => repeat('f', 40)) $$, to_json(:burger::text)),
  'evening product ordered at 20:00');

-- Evening-only category ordered at lunch time.
insert into public.categories (id, shop_id, name, position) values ('e1000000-0000-4000-8000-0000000000aa', tests.shop_a(), 'Spécial soir', 9);
insert into public.menu_categories (menu_id, category_id, shop_id) values ('d1000000-0000-4000-8000-000000000002', 'e1000000-0000-4000-8000-0000000000aa', tests.shop_a());
insert into public.products (id, shop_id, category_id, name, base_price_cents) values ('f1000000-0000-4000-8000-0000000000aa', tests.shop_a(), 'e1000000-0000-4000-8000-0000000000aa', 'Plat du soir', 1500);
select throws_ok($$ select tests.order_at('[{"product_id":"f1000000-0000-4000-8000-0000000000aa","quantity":1}]', tests.paris('12:30')) $$,
  'P0001', 'PRODUCT_UNAVAILABLE', 'evening menu product ordered at lunch is refused');

-- Range crossing midnight: 22:00 → 02:00 accepted at 01:00, refused at 03:00.
insert into public.menus (id, shop_id, name) values ('d1000000-0000-4000-8000-0000000000bb', tests.shop_a(), 'Nuit');
insert into public.menu_schedules (shop_id, menu_id, days, start_time, end_time) values (tests.shop_a(), 'd1000000-0000-4000-8000-0000000000bb', '{1,2,3,4,5,6,7}', '22:00', '02:00');
insert into public.categories (id, shop_id, name, position) values ('e1000000-0000-4000-8000-0000000000bb', tests.shop_a(), 'Nuit', 10);
insert into public.menu_categories (menu_id, category_id, shop_id) values ('d1000000-0000-4000-8000-0000000000bb', 'e1000000-0000-4000-8000-0000000000bb', tests.shop_a());
insert into public.products (id, shop_id, category_id, name, base_price_cents) values ('f1000000-0000-4000-8000-0000000000bb', tests.shop_a(), 'e1000000-0000-4000-8000-0000000000bb', 'Croque de nuit', 800);
select lives_ok($$ select tests.order_at('[{"product_id":"f1000000-0000-4000-8000-0000000000bb","quantity":1}]', tests.paris('01:00'), p_client => repeat('g', 40)) $$,
  'CLI-02 CA3 — 22:00–02:00 range: accepted at 01:00');
select throws_ok($$ select tests.order_at('[{"product_id":"f1000000-0000-4000-8000-0000000000bb","quantity":1}]', tests.paris('03:00')) $$,
  'P0001', 'PRODUCT_UNAVAILABLE', 'CLI-02 CA3 — 22:00–02:00 range: refused at 03:00');
select lives_ok($$ select tests.order_at('[{"product_id":"f1000000-0000-4000-8000-0000000000bb","quantity":1}]', tests.paris('23:30'), p_client => repeat('h', 40)) $$,
  '22:00–02:00 range: accepted at 23:30');
-- Range limited to Monday: after midnight on Tuesday is still the Monday range.
update public.menu_schedules set days = '{1}' where menu_id = 'd1000000-0000-4000-8000-0000000000bb';
select lives_ok($$ select tests.order_at('[{"product_id":"f1000000-0000-4000-8000-0000000000bb","quantity":1}]', tests.paris('01:00', '2026-10-13'), p_client => repeat('i', 40)) $$,
  'Monday 22:00–02:00 range: accepted on Tuesday at 01:00');
select throws_ok($$ select tests.order_at('[{"product_id":"f1000000-0000-4000-8000-0000000000bb","quantity":1}]', tests.paris('01:00', '2026-10-12')) $$,
  'P0001', 'PRODUCT_UNAVAILABLE', 'Monday 22:00–02:00 range: refused on Monday at 01:00 (that is Sunday night)');

-- 5. Options → OPTIONS_INVALID.
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1,"options":[{"option_id":"92000000-0000-4000-8000-000000000001"}]}]', tests.paris('12:30')) $$, to_json(:tacos::text)),
  'P0001', 'OPTIONS_INVALID', 'CLI-03 CA1 — mandatory group not satisfied (1 meat out of 2)');
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1,"options":[{"option_id":"92000000-0000-4000-8000-000000000001"},{"option_id":"92000000-0000-4000-8000-000000000002"},{"option_id":"92000000-0000-4000-8000-000000000005"},{"option_id":"92000000-0000-4000-8000-000000000006"},{"option_id":"92000000-0000-4000-8000-000000000007"},{"option_id":"92000000-0000-4000-8000-000000000003"}]}]', tests.paris('12:30')) $$, to_json(:tacos::text)),
  'P0001', 'OPTIONS_INVALID', 'CLI-03 CA2 — group maximum exceeded (3 meats)');
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1,"options":[{"option_id":"92000000-0000-4000-8000-000000000001"},{"option_id":"92000000-0000-4000-8000-000000000002"},{"option_id":"92000000-0000-4000-8000-000000000008"}]}]', tests.paris('12:30')) $$, to_json(:tacos::text)),
  'P0001', 'OPTIONS_INVALID', 'sold-out option (Harissa) is refused');
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1,"options":[{"option_id":"92000000-0000-4000-8000-000000000001"},{"option_id":"92000000-0000-4000-8000-000000000001"}]}]', tests.paris('12:30')) $$, to_json(:tacos::text)),
  'P0001', 'OPTIONS_INVALID', 'duplicate option is refused');
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1,"options":[{"option_id":"92000000-0000-4000-8000-000000000015"}]}]', tests.paris('12:30')) $$, to_json(:tacos::text)),
  'P0001', 'OPTIONS_INVALID', 'option not linked to the product is refused');
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1,"options":[{"option_id":"92000000-0000-4000-8000-000000000001"},{"option_id":"92000000-0000-4000-8000-000000000002"},{"option_id":"92000000-0000-4000-8000-000000000009","quantity":2}]}]', tests.paris('12:30')) $$, to_json(:tacos::text)),
  'P0001', 'OPTIONS_INVALID', 'quantity on an option of a group without quantity is refused');
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1,"options":[{"option_id":"92000000-0000-4000-8000-000000000001"},{"option_id":"92000000-0000-4000-8000-000000000002"},{"option_id":"92000000-0000-4000-8000-000000000010","quantity":3}]}]', tests.paris('12:30')) $$, to_json(:tacos::text)),
  'P0001', 'OPTIONS_INVALID', 'quantity above max_per_option is refused');

-- 6. Idempotency: two identical calls → one order, duplicate = true the second time.
select private.place_order(tests.shop_a(), tests.token_a1(), repeat('j', 40), '11111111-1111-4111-8111-111111111111',
  format('[{"product_id":%s,"quantity":1}]', to_json(:cafe::text))::jsonb, null, 'qr', now()) as first_call \gset
select is(
  (private.place_order(tests.shop_a(), tests.token_a1(), repeat('j', 40), '11111111-1111-4111-8111-111111111111',
    format('[{"product_id":%s,"quantity":1}]', to_json(:cafe::text))::jsonb, null, 'qr', now()))->>'duplicate',
  'true', 'CLI-05 CA2 — same idempotency key: duplicate = true');
select is((select count(*)::int from public.orders where idempotency_key = '11111111-1111-4111-8111-111111111111'), 1,
  'CLI-05 CA2 — same idempotency key creates a single order');

-- 7. An error in the middle of the lines leaves nothing in the database.
select throws_ok(format($$ select private.place_order(tests.shop_a(), tests.token_a1(), repeat('k', 40),
    '22222222-2222-4222-8222-222222222222',
    '[{"product_id":%s,"quantity":1},{"product_id":"00000000-0000-4000-8000-000000000000","quantity":1}]'::jsonb,
    null, 'qr', now()) $$, to_json(:cafe::text)),
  'P0001', 'PRODUCT_UNAVAILABLE', 'CLI-05 CA3 — order with an unavailable line is refused');
select is((select count(*)::int from public.orders where idempotency_key = '22222222-2222-4222-8222-222222222222'), 0,
  'CLI-05 CA3 — no order and no line remains after a refused order');

-- 8. Limits.
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":21}]') $$, to_json(:cafe::text)),
  'P0001', 'BAD_QUANTITY', 'quantity above the limit is refused');
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":0}]') $$, to_json(:cafe::text)),
  'P0001', 'BAD_QUANTITY', 'quantity 0 is refused');
update public.shops set max_lines_per_order = 1 where id = tests.shop_a();
select throws_ok(format($$ select tests.order_at('[{"product_id":%1$s,"quantity":1},{"product_id":%1$s,"quantity":1}]') $$, to_json(:cafe::text)),
  'P0001', 'TOO_MANY_LINES', 'too many lines is refused');
update public.shops set max_lines_per_order = 30, max_order_total_cents = 1000 where id = tests.shop_a();
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":6}]') $$, to_json(:cafe::text)),
  'P0001', 'ORDER_TOO_LARGE', 'order above the maximum amount is refused');
update public.shops set max_order_total_cents = 50000, max_orders_per_client_10min = 2 where id = tests.shop_a();
select tests.order_at(format('[{"product_id":%s,"quantity":1}]', to_json(:cafe::text))::jsonb, now(), p_client => repeat('l', 40));
select tests.order_at(format('[{"product_id":%s,"quantity":1}]', to_json(:cafe::text))::jsonb, now(), p_client => repeat('l', 40));
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]', now(), p_client => repeat('l', 40)) $$, to_json(:cafe::text)),
  'P0001', 'RATE_LIMITED', 'too many orders from the same client in 10 minutes');
update public.shops set max_orders_per_client_10min = 50, max_pending_orders_per_table = 2 where id = tests.shop_a();
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]', now(), p_client => repeat('m', 40)) $$, to_json(:cafe::text)),
  'P0001', 'TOO_MANY_PENDING', 'too many pending orders at the table');
update public.shops set max_pending_orders_per_table = 10 where id = tests.shop_a();

-- 9. Tables, shop status.
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]', now(), p_token => 'demoLoungeTable0000001') $$, to_json(:cafe::text)),
  'P0001', 'INVALID_TABLE', 'CLI-01 CA1 — a token of shop B is refused on shop A');
update public.table_tokens set revoked_at = now() where token = 'demoBistrotTable000002';
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]', now(), p_token => 'demoBistrotTable000002') $$, to_json(:cafe::text)),
  'P0001', 'INVALID_TABLE', 'CLI-01 CA2 — a revoked token is refused');
update public.shops set accepting_orders = false where id = tests.shop_a();
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]') $$, to_json(:cafe::text)),
  'P0001', 'ORDERS_CLOSED', 'orders closed');
update public.shops set accepting_orders = true, status = 'suspended' where id = tests.shop_a();
select throws_ok(format($$ select tests.order_at('[{"product_id":%s,"quantity":1}]') $$, to_json(:cafe::text)),
  'P0001', 'SHOP_UNAVAILABLE', 'suspended shop');
update public.shops set status = 'active' where id = tests.shop_a();

-- 10. Numbering restarts at the next business day (start 05:00).
select is((tests.order_at(format('[{"product_id":%s,"quantity":1}]', to_json(:cafe::text))::jsonb, tests.paris('05:30', '2027-01-04'), p_token => 'demoBistrotTable000003', p_client => repeat('n', 40))->>'number')::int,
  1, 'first order of the business day gets number 1');
select is((tests.order_at(format('[{"product_id":%s,"quantity":1}]', to_json(:cafe::text))::jsonb, tests.paris('04:30', '2027-01-05'), p_token => 'demoBistrotTable000004', p_client => repeat('o', 40))->>'number')::int,
  2, 'an order at 04:30 the next morning belongs to the same business day');
select is((tests.order_at(format('[{"product_id":%s,"quantity":1}]', to_json(:cafe::text))::jsonb, tests.paris('05:30', '2027-01-05'), p_token => 'demoBistrotTable000005', p_client => repeat('p', 40))->>'number')::int,
  1, 'numbering restarts at 1 after the business day start (05:00)');

-- 11. Menu: a product whose mandatory group has no orderable option left is sold out (ADR-009).
update public.options set is_sold_out = true
 where group_id = '91000000-0000-4000-8000-000000000001' and name <> 'Poulet';
select is(
  (select (p ->> 'is_sold_out')::boolean
   from jsonb_array_elements(private.menu_json(tests.shop_a(), tests.paris('12:30')) -> 'categories') c,
        jsonb_array_elements(c -> 'products') p
   where p ->> 'id' = 'f1000000-0000-4000-8000-000000000013'),
  true, 'tacos needing 2 meats with only 1 meat left is shown sold out');

select * from finish();
rollback;
