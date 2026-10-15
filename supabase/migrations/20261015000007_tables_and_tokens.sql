-- Dining tables, QR/NFC tokens, table sessions. Bible: vol. 04 §4.4.
-- Divergence (ADR-009): table tokens are readable by the owner only (not by every employee),
-- so that a former or "Stock" employee cannot copy every QR link.

create table public.dining_tables (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops (id) on delete cascade,
  label      text not null check (char_length(label) between 1 and 40),
  zone       text check (char_length(zone) <= 40),
  seats      smallint check (seats between 1 and 100),
  position   integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index dining_tables_label on public.dining_tables (shop_id, lower(label)) where deleted_at is null;
create index dining_tables_shop on public.dining_tables (shop_id, position) where deleted_at is null;

-- The token is printed on the table: it is public by nature for anyone sitting there.
-- Hashing it would bring no protection and would prevent reprinting the QR code.
create table public.table_tokens (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops (id) on delete cascade,
  table_id   uuid not null references public.dining_tables (id) on delete cascade,
  token      text not null unique check (token ~ '^[A-Za-z0-9_-]{22,64}$'),
  created_by uuid references public.shop_members (id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index table_tokens_one_active on public.table_tokens (table_id) where revoked_at is null;
create index table_tokens_shop on public.table_tokens (shop_id);

create table public.table_sessions (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops (id) on delete cascade,
  table_id     uuid not null references public.dining_tables (id),
  opened_at    timestamptz not null default now(),
  closed_at    timestamptz,
  closed_by    uuid references public.shop_members (id),
  total_cents  integer check (total_cents >= 0), -- frozen at closing
  business_day date not null
);
create unique index table_sessions_one_open on public.table_sessions (table_id) where closed_at is null;
create index table_sessions_shop_day on public.table_sessions (shop_id, business_day);

create trigger dining_tables_updated_at before update on public.dining_tables
  for each row execute function private.set_updated_at();
create trigger table_tokens_same_shop before insert or update on public.table_tokens
  for each row execute function private.assert_same_shop();
create trigger dining_tables_audit after insert or update on public.dining_tables
  for each row execute function private.audit_row_change('table');

alter table public.dining_tables enable row level security;
alter table public.table_tokens enable row level security;
alter table public.table_sessions enable row level security;

revoke all on public.dining_tables, public.table_tokens, public.table_sessions from anon;
revoke delete on public.dining_tables from authenticated;
revoke insert, update, delete on public.table_tokens, public.table_sessions from authenticated;

create policy dining_tables_select on public.dining_tables
  for select to authenticated using (shop_id in (select private.my_shop_ids('any')));
create policy dining_tables_insert on public.dining_tables
  for insert to authenticated with check (shop_id in (select private.my_writable_shop_ids('owner')));
create policy dining_tables_update on public.dining_tables
  for update to authenticated
  using (shop_id in (select private.my_writable_shop_ids('owner')))
  with check (shop_id in (select private.my_writable_shop_ids('owner')));

create policy table_tokens_select_owner on public.table_tokens
  for select to authenticated using (shop_id in (select private.my_shop_ids('owner')));

create policy table_sessions_select on public.table_sessions
  for select to authenticated using (shop_id in (select private.my_shop_ids('service')));
