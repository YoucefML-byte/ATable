-- Orders. Bible: vol. 04 §4.5.
-- Divergence (ADR-009): orders are readable by employees with Floor or Kitchen ('service'),
-- not by "Stock"-only employees; status events snapshot the actor's display name so that
-- employees can see "already handled by Léa" without reading the whole team list.

create table public.shop_daily_counters (
  shop_id      uuid not null references public.shops (id) on delete cascade,
  business_day date not null,
  last_number  integer not null,
  primary key (shop_id, business_day)
);

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  shop_id          uuid not null references public.shops (id) on delete cascade,
  table_id         uuid not null references public.dining_tables (id),
  table_session_id uuid not null references public.table_sessions (id),
  business_day     date not null,
  number           integer not null,
  status           public.order_status not null default 'submitted',
  source           public.order_source not null default 'qr',
  client_key_hash  text,                -- SHA-256 of the client identifier; purged after 48 h
  note             text check (char_length(note) <= 280),
  subtotal_cents   integer not null default 0 check (subtotal_cents >= 0),
  item_count       integer not null default 0 check (item_count >= 0),
  idempotency_key  uuid not null,
  internal_reason  text check (char_length(internal_reason) <= 200), -- never shown to the customer
  created_at       timestamptz not null default now(),
  accepted_at      timestamptz, accepted_by  uuid references public.shop_members (id),
  ready_at         timestamptz, ready_by     uuid references public.shop_members (id),
  served_at        timestamptz, served_by    uuid references public.shop_members (id),
  rejected_at      timestamptz, rejected_by  uuid references public.shop_members (id),
  cancelled_at     timestamptz, cancelled_by uuid references public.shop_members (id),
  unique (shop_id, idempotency_key),
  unique (shop_id, business_day, number)
);
create index orders_shop_active on public.orders (shop_id, status, created_at)
  where status in ('submitted', 'accepted', 'ready');
create index orders_shop_day on public.orders (shop_id, business_day);
create index orders_session on public.orders (table_session_id);
create index orders_table_pending on public.orders (table_id) where status = 'submitted';
create index orders_client on public.orders (shop_id, client_key_hash, created_at) where client_key_hash is not null;

create table public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  shop_id          uuid not null references public.shops (id) on delete cascade,
  product_id       uuid not null references public.products (id),
  product_name     text not null,  -- snapshot
  category_name    text not null,  -- snapshot
  prep_station     public.prep_station not null,
  base_price_cents integer not null check (base_price_cents >= 0),
  unit_price_cents integer not null check (unit_price_cents >= 0), -- base + options
  quantity         integer not null check (quantity between 1 and 200),
  line_total_cents integer not null check (line_total_cents >= 0),
  position         smallint not null
);
create index order_items_order on public.order_items (order_id);
create index order_items_shop_product on public.order_items (shop_id, product_id);

create table public.order_item_options (
  id                uuid primary key default gen_random_uuid(),
  order_item_id     uuid not null references public.order_items (id) on delete cascade,
  shop_id           uuid not null references public.shops (id) on delete cascade,
  option_id         uuid not null references public.options (id),
  group_id          uuid not null references public.option_groups (id),
  group_name        text not null, -- snapshot
  option_name       text not null, -- snapshot
  price_delta_cents integer not null check (price_delta_cents >= 0),
  quantity          smallint not null default 1 check (quantity between 1 and 20),
  unique (order_item_id, option_id)
);
create index order_item_options_item on public.order_item_options (order_item_id);
create index order_item_options_shop_option on public.order_item_options (shop_id, option_id);

create table public.order_status_events (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  shop_id     uuid not null references public.shops (id) on delete cascade,
  from_status public.order_status,
  to_status   public.order_status not null,
  actor_id    uuid references public.shop_members (id),
  actor_name  text, -- snapshot of the member's display name
  reason      text check (char_length(reason) <= 200),
  created_at  timestamptz not null default now()
);
create index order_status_events_order on public.order_status_events (order_id);
create index order_status_events_shop on public.order_status_events (shop_id, created_at);

alter table public.shop_daily_counters enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_item_options enable row level security;
alter table public.order_status_events enable row level security;

revoke all on public.shop_daily_counters, public.orders, public.order_items, public.order_item_options,
  public.order_status_events from anon;
revoke all on public.shop_daily_counters from authenticated;
revoke insert, update, delete on public.orders, public.order_items, public.order_item_options,
  public.order_status_events from authenticated;

create policy orders_select on public.orders
  for select to authenticated using (shop_id in (select private.my_shop_ids('service')));
create policy order_items_select on public.order_items
  for select to authenticated using (shop_id in (select private.my_shop_ids('service')));
create policy order_item_options_select on public.order_item_options
  for select to authenticated using (shop_id in (select private.my_shop_ids('service')));
create policy order_status_events_select on public.order_status_events
  for select to authenticated using (shop_id in (select private.my_shop_ids('service')));
