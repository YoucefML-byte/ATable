-- Staff functions tests. Bible: vol. 04 §15 « Personnel », vol. 02 SAL, CUI, STK.
begin;
\ir 00_helpers.sql.inc
select plan(30);

create or replace function tests.new_order(p_items jsonb default '[{"product_id":"f1000000-0000-4000-8000-000000000016","quantity":1}]',
  p_token text default 'demoBistrotTable000006', p_client text default repeat('s', 40))
returns uuid language sql as $$
  select (private.place_order('c1000000-0000-4000-8000-000000000001', p_token, p_client, gen_random_uuid(),
    p_items, null, 'qr', now()) ->> 'order_id')::uuid;
$$;
grant execute on all functions in schema tests to authenticated, anon;

-- Orders created as postgres before switching roles.
select tests.new_order() as o1 \gset
select tests.new_order() as o2 \gset
select tests.new_order() as o3 \gset
select tests.new_order('[{"product_id":"f1000000-0000-4000-8000-000000000025","quantity":2}]') as o_drink \gset

-- 1. Kitchen alone cannot accept; Floor accepts.
select tests.staff_login(tests.mehdi());
select throws_ok(format($$ select public.staff_transition_order(%L, 'accepted') $$, :'o1'),
  'P0001', 'FORBIDDEN', 'kitchen-only employee cannot accept an order');
select tests.logout();

select tests.staff_login(tests.lea());
select is((public.staff_transition_order(:'o1', 'accepted')) ->> 'status', 'accepted', 'Floor accepts a submitted order');
select is((select accepted_by from public.orders where id = :'o1'), tests.lea(), 'acceptance records the author');
-- Second acceptance by someone else: "already handled by Léa".
select throws_ok(format($$ select public.staff_transition_order(%L, 'accepted') $$, :'o1'),
  'P0001', 'INVALID_TRANSITION', 'SAL-02 — accepting twice is refused (already handled)');
select is(
  (select actor_name from public.order_status_events where order_id = :'o1' order by id desc limit 1),
  'Léa', 'the event keeps the name of who handled it');
select tests.logout();

-- 2. Kitchen marks ready; Floor alone can also mark ready.
select tests.staff_login(tests.mehdi());
select is((public.staff_transition_order(:'o1', 'ready')) ->> 'status', 'ready', 'Kitchen marks an accepted order ready');
select throws_ok(format($$ select public.staff_transition_order(%L, 'served') $$, :'o1'),
  'P0001', 'FORBIDDEN', 'kitchen-only employee cannot mark served');
select tests.logout();

select tests.staff_login(tests.lea());
select is((public.staff_transition_order(:'o1', 'served')) ->> 'status', 'served', 'Floor marks a ready order served');
select lives_ok(format($$ select public.staff_transition_order(%L, 'accepted') $$, :'o2'), 'Floor accepts o2');
select is((public.staff_transition_order(:'o2', 'ready')) ->> 'status', 'ready', 'Floor alone can mark ready');

-- 3. Every other transition is refused.
select throws_ok(format($$ select public.staff_transition_order(%L, 'submitted') $$, :'o2'),
  'P0001', 'INVALID_TRANSITION', 'ready → submitted is refused');
select throws_ok(format($$ select public.staff_transition_order(%L, 'accepted') $$, :'o2'),
  'P0001', 'INVALID_TRANSITION', 'ready → accepted is refused');
select throws_ok(format($$ select public.staff_transition_order(%L, 'rejected') $$, :'o2'),
  'P0001', 'INVALID_TRANSITION', 'ready → rejected is refused');
select throws_ok(format($$ select public.staff_transition_order(%L, 'ready') $$, :'o3'),
  'P0001', 'INVALID_TRANSITION', 'submitted → ready is refused');
select throws_ok(format($$ select public.staff_transition_order(%L, 'served') $$, :'o3'),
  'P0001', 'INVALID_TRANSITION', 'submitted → served is refused');
select throws_ok(format($$ select public.staff_transition_order(%L, 'cancelled') $$, :'o3'),
  'P0001', 'INVALID_TRANSITION', 'submitted → cancelled is refused');
select is((public.staff_transition_order(:'o2', 'cancelled', 'Client parti')) ->> 'status', 'cancelled', 'ready → cancelled with reason');
select throws_ok(format($$ select public.staff_transition_order(%L, 'served') $$, :'o2'),
  'P0001', 'INVALID_TRANSITION', 'cancelled → served is refused');

-- 4. Accepted with nothing to prepare → ready directly (two events).
select is((public.staff_transition_order(:'o_drink', 'accepted')) ->> 'status', 'ready', 'SAL-02 — drinks only: straight to ready');
select is((select count(*)::int from public.order_status_events where order_id = :'o_drink'), 3, 'submitted, accepted and ready events are recorded');

-- 5. Closing the table: refused with a pending order, accepted after, total exact.
select throws_ok(format($$ select public.staff_close_table_session(%L) $$,
    (select table_session_id from public.orders where id = :'o3')),
  'P0001', 'TABLE_HAS_PENDING_ORDERS', 'SAL-04 — closing is refused while an order is pending');
select lives_ok(format($$ select public.staff_transition_order(%L, 'rejected', 'Personne à la table') $$, :'o3'), 'reject o3');
select lives_ok(format($$ select public.staff_transition_order(%L, 'served') $$, :'o_drink'), 'serve the drinks');
select is(
  (public.staff_close_table_session((select table_session_id from public.orders where id = :'o3')) ->> 'total_cents')::int,
  650 + 700, 'closing freezes the total of validated orders (tiramisu served + drinks served)');
select tests.logout();

-- 6. My orders: only the client's orders of the open session, never the internal reason.
select tests.new_order(p_token => 'demoBistrotTable000007', p_client => repeat('x', 40)) as mine \gset
select tests.new_order(p_token => 'demoBistrotTable000007', p_client => repeat('y', 40)) as other \gset
select tests.staff_login(tests.lea());
select public.staff_transition_order(:'mine', 'rejected', 'Commande en double');
select tests.logout();
select tests.login_anon();
select is(jsonb_array_length(public.public_my_orders(tests.shop_a(), 'demoBistrotTable000007', repeat('x', 40))), 1,
  'CLI-06 CA1 — another phone at the same table does not see my orders');
select is((public.public_my_orders(tests.shop_a(), 'demoBistrotTable000007', repeat('x', 40)) -> 0 ->> 'status'), 'withdrawn',
  'a rejected order is shown as withdrawn');
select ok(position('double' in public.public_my_orders(tests.shop_a(), 'demoBistrotTable000007', repeat('x', 40))::text) = 0,
  'the internal reason is never returned to the customer');
select tests.logout();

-- 7. Stock: Floor+Stock (Léa) can mark sold out; Kitchen-only (Mehdi) cannot; Stock cannot change a price.
select tests.staff_login(tests.mehdi());
select throws_ok($$ select public.staff_set_sold_out('product', 'f1000000-0000-4000-8000-000000000016', true) $$,
  'P0001', 'FORBIDDEN', 'employee without Stock cannot mark sold out');
select tests.logout();
select tests.staff_login(tests.lea());
select lives_ok($$ select public.staff_set_sold_out('option', '92000000-0000-4000-8000-000000000006', true) $$,
  'STK-01 — Stock marks an option sold out');
select tests.logout();
select is((select count(*)::int from public.audit_log where action = 'option.update' and entity_id = '92000000-0000-4000-8000-000000000006'),
  1, 'STK-01 — the change is logged (who, what, when)');

select * from finish();
rollback;
