-- Catalog: menus, schedules, categories, products, option groups, options, allergens.
-- Bible: vol. 04 §4.3, §4.7, §5 (active_menu_ids, category_orderable_now), §10.

create table public.menus (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  description text check (char_length(description) <= 300),
  position    integer not null default 0,
  is_active   boolean not null default true,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);
create index menus_shop on public.menus (shop_id) where deleted_at is null;
create unique index menus_one_default on public.menus (shop_id) where is_default and deleted_at is null;

create table public.menu_schedules (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops (id) on delete cascade,
  menu_id    uuid not null references public.menus (id) on delete cascade,
  days       smallint[] not null
             check (days <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[] and cardinality(days) between 1 and 7),
  start_time time not null,
  end_time   time not null check (end_time <> start_time) -- end < start = until the next day
);
create index menu_schedules_menu on public.menu_schedules (menu_id);
create index menu_schedules_shop on public.menu_schedules (shop_id);

create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  description  text check (char_length(description) <= 300),
  prep_station public.prep_station not null default 'kitchen',
  position     integer not null default 0,
  is_hidden    boolean not null default false,
  is_sold_out  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index categories_shop on public.categories (shop_id, position) where deleted_at is null;

create table public.menu_categories (
  menu_id     uuid not null references public.menus (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  shop_id     uuid not null references public.shops (id) on delete cascade,
  position    integer not null default 0,
  primary key (menu_id, category_id)
);
create index menu_categories_category on public.menu_categories (category_id);
create index menu_categories_shop on public.menu_categories (shop_id);

create table public.products (
  id                    uuid primary key default gen_random_uuid(),
  shop_id               uuid not null references public.shops (id) on delete cascade,
  category_id           uuid not null references public.categories (id),
  name                  text not null check (char_length(name) between 1 and 80),
  description           text check (char_length(description) <= 500),
  base_price_cents      integer not null check (base_price_cents between 0 and 1000000),
  image_path            text,
  tags                  text[] not null default '{}'
                        check (tags <@ array['vegetarian', 'vegan', 'spicy', 'homemade', 'new', 'signature',
                                             'gluten_free']::text[]),
  origin_info           text check (char_length(origin_info) <= 200),
  allergens_declared_at timestamptz, -- NULL = allergens never declared
  position              integer not null default 0,
  is_hidden             boolean not null default false,
  is_sold_out           boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
create index products_shop_category on public.products (shop_id, category_id, position) where deleted_at is null;
create index products_category on public.products (category_id);

create table public.option_groups (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 60), -- shown to the customer
  internal_name  text check (char_length(internal_name) <= 60),           -- shown to the owner
  min_select     smallint not null default 0 check (min_select between 0 and 50),
  max_select     smallint check (max_select is null or max_select between 1 and 50), -- NULL = unlimited
  allow_quantity boolean not null default false,
  max_per_option smallint not null default 1 check (max_per_option between 1 and 20),
  position       integer not null default 0,
  is_hidden      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,
  constraint min_le_max check (max_select is null or min_select <= max_select)
);
create index option_groups_shop on public.option_groups (shop_id) where deleted_at is null;

create table public.options (
  id                    uuid primary key default gen_random_uuid(),
  shop_id               uuid not null references public.shops (id) on delete cascade,
  group_id              uuid not null references public.option_groups (id),
  name                  text not null check (char_length(name) between 1 and 60),
  price_delta_cents     integer not null default 0 check (price_delta_cents between 0 and 100000),
  is_default            boolean not null default false,
  allergens_declared_at timestamptz,
  position              integer not null default 0,
  is_hidden             boolean not null default false,
  is_sold_out           boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
create index options_group on public.options (group_id, position) where deleted_at is null;
create index options_shop on public.options (shop_id);

create table public.product_option_groups (
  product_id   uuid not null references public.products (id) on delete cascade,
  group_id     uuid not null references public.option_groups (id) on delete cascade,
  shop_id      uuid not null references public.shops (id) on delete cascade,
  position     integer not null default 0,
  min_override smallint check (min_override between 0 and 50),
  max_override smallint check (max_override between 1 and 50),
  primary key (product_id, group_id),
  constraint override_min_le_max check (min_override is null or max_override is null or min_override <= max_override)
);
create index product_option_groups_group on public.product_option_groups (group_id);
create index product_option_groups_shop on public.product_option_groups (shop_id);

create table public.allergens ( -- global reference data (no shop_id), read only
  code     text primary key,
  label_fr text not null,
  position smallint not null
);

create table public.product_allergens (
  product_id    uuid not null references public.products (id) on delete cascade,
  allergen_code text not null references public.allergens (code),
  shop_id       uuid not null references public.shops (id) on delete cascade,
  presence      public.allergen_presence not null,
  primary key (product_id, allergen_code)
);
create index product_allergens_shop on public.product_allergens (shop_id);

create table public.option_allergens (
  option_id     uuid not null references public.options (id) on delete cascade,
  allergen_code text not null references public.allergens (code),
  shop_id       uuid not null references public.shops (id) on delete cascade,
  presence      public.allergen_presence not null,
  primary key (option_id, allergen_code)
);
create index option_allergens_shop on public.option_allergens (shop_id);

-- The 14 regulatory allergens (reference data, not demo data).
insert into public.allergens (code, label_fr, position) values
  ('gluten',      'Céréales contenant du gluten', 1),
  ('crustaceans', 'Crustacés', 2),
  ('eggs',        'Œufs', 3),
  ('fish',        'Poissons', 4),
  ('peanuts',     'Arachides', 5),
  ('soybeans',    'Soja', 6),
  ('milk',        'Lait', 7),
  ('nuts',        'Fruits à coque', 8),
  ('celery',      'Céleri', 9),
  ('mustard',     'Moutarde', 10),
  ('sesame',      'Graines de sésame', 11),
  ('sulphites',   'Anhydride sulfureux et sulfites', 12),
  ('lupin',       'Lupin', 13),
  ('molluscs',    'Mollusques', 14);

-- ---------------------------------------------------------------------------
-- Cross-shop consistency: every linked entity must belong to the row's shop.
-- ---------------------------------------------------------------------------
create or replace function private.assert_same_shop()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_ok boolean := true;
begin
  case tg_table_name
    when 'menu_categories' then
      v_ok := exists (select 1 from public.menus where id = new.menu_id and shop_id = new.shop_id)
          and exists (select 1 from public.categories where id = new.category_id and shop_id = new.shop_id);
    when 'menu_schedules' then
      v_ok := exists (select 1 from public.menus where id = new.menu_id and shop_id = new.shop_id);
    when 'products' then
      v_ok := exists (select 1 from public.categories where id = new.category_id and shop_id = new.shop_id);
    when 'options' then
      v_ok := exists (select 1 from public.option_groups where id = new.group_id and shop_id = new.shop_id);
    when 'product_option_groups' then
      v_ok := exists (select 1 from public.products where id = new.product_id and shop_id = new.shop_id)
          and exists (select 1 from public.option_groups where id = new.group_id and shop_id = new.shop_id);
    when 'product_allergens' then
      v_ok := exists (select 1 from public.products where id = new.product_id and shop_id = new.shop_id);
    when 'option_allergens' then
      v_ok := exists (select 1 from public.options where id = new.option_id and shop_id = new.shop_id);
    when 'table_tokens' then
      v_ok := exists (select 1 from public.dining_tables where id = new.table_id and shop_id = new.shop_id);
    else
      raise exception 'assert_same_shop: unsupported table %', tg_table_name;
  end case;
  if not v_ok then
    raise exception using errcode = 'P0001', message = 'CROSS_SHOP_LINK';
  end if;
  return new;
end;
$$;

create trigger menu_categories_same_shop before insert or update on public.menu_categories
  for each row execute function private.assert_same_shop();
create trigger menu_schedules_same_shop before insert or update on public.menu_schedules
  for each row execute function private.assert_same_shop();
create trigger products_same_shop before insert or update of category_id, shop_id on public.products
  for each row execute function private.assert_same_shop();
create trigger options_same_shop before insert or update of group_id, shop_id on public.options
  for each row execute function private.assert_same_shop();
create trigger product_option_groups_same_shop before insert or update on public.product_option_groups
  for each row execute function private.assert_same_shop();
create trigger product_allergens_same_shop before insert or update on public.product_allergens
  for each row execute function private.assert_same_shop();
create trigger option_allergens_same_shop before insert or update on public.option_allergens
  for each row execute function private.assert_same_shop();

create trigger menus_updated_at before update on public.menus
  for each row execute function private.set_updated_at();
create trigger categories_updated_at before update on public.categories
  for each row execute function private.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function private.set_updated_at();
create trigger option_groups_updated_at before update on public.option_groups
  for each row execute function private.set_updated_at();
create trigger options_updated_at before update on public.options
  for each row execute function private.set_updated_at();

create trigger menus_audit after insert or update on public.menus
  for each row execute function private.audit_row_change('menu');
create trigger menu_schedules_audit after insert or update or delete on public.menu_schedules
  for each row execute function private.audit_row_change('menu_schedule');
create trigger categories_audit after insert or update on public.categories
  for each row execute function private.audit_row_change('category');
create trigger products_audit after insert or update on public.products
  for each row execute function private.audit_row_change('product');
create trigger option_groups_audit after insert or update on public.option_groups
  for each row execute function private.audit_row_change('option_group');
create trigger options_audit after insert or update on public.options
  for each row execute function private.audit_row_change('option');

-- ---------------------------------------------------------------------------
-- Schedules: menus active at an instant (a menu without any schedule is always active).
-- ---------------------------------------------------------------------------
create or replace function private.active_menu_ids(p_shop_id uuid, p_at timestamptz)
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  with loc as (
    select (p_at at time zone s.timezone) as ts from public.shops s where s.id = p_shop_id
  )
  select m.id
  from public.menus m, loc
  where m.shop_id = p_shop_id
    and m.is_active
    and m.deleted_at is null
    and (
      not exists (select 1 from public.menu_schedules ms where ms.menu_id = m.id)
      or exists (
        select 1 from public.menu_schedules ms
        where ms.menu_id = m.id
          and (
            -- same-day range
            (ms.start_time < ms.end_time
              and extract(isodow from loc.ts)::smallint = any (ms.days)
              and loc.ts::time >= ms.start_time and loc.ts::time < ms.end_time)
            or
            -- range crossing midnight: evening part
            (ms.start_time > ms.end_time
              and extract(isodow from loc.ts)::smallint = any (ms.days)
              and loc.ts::time >= ms.start_time)
            or
            -- range crossing midnight: after-midnight part (start day = the day before)
            (ms.start_time > ms.end_time
              and extract(isodow from loc.ts - interval '1 day')::smallint = any (ms.days)
              and loc.ts::time < ms.end_time)
          ))
    );
$$;

create or replace function private.category_orderable_now(p_category_id uuid, p_at timestamptz)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.menu_categories mc
    join public.categories c on c.id = mc.category_id
    where mc.category_id = p_category_id
      and mc.menu_id in (select private.active_menu_ids(c.shop_id, p_at))
  );
$$;

-- Next time the set of active menus may change (used for "back at 18:30").
-- Scans the next 7 days at the boundaries of every schedule.
create or replace function private.next_menu_change(p_shop_id uuid, p_at timestamptz)
returns timestamptz
language sql stable security definer set search_path = ''
as $$
  with s as (select timezone from public.shops where id = p_shop_id),
  candidates as (
    select ((((p_at at time zone s.timezone)::date + d) + t) at time zone s.timezone) as at
    from s,
         generate_series(0, 7) as d,
         lateral (
           select ms.start_time as t from public.menu_schedules ms
           join public.menus m on m.id = ms.menu_id
           where m.shop_id = p_shop_id and m.deleted_at is null and m.is_active
           union
           select ms.end_time from public.menu_schedules ms
           join public.menus m on m.id = ms.menu_id
           where m.shop_id = p_shop_id and m.deleted_at is null and m.is_active
         ) b
  )
  select min(at) from candidates where at > p_at;
$$;

grant execute on function private.active_menu_ids(uuid, timestamptz) to authenticated;
grant execute on function private.category_orderable_now(uuid, timestamptz) to authenticated;
grant execute on function private.next_menu_change(uuid, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.menus enable row level security;
alter table public.menu_schedules enable row level security;
alter table public.categories enable row level security;
alter table public.menu_categories enable row level security;
alter table public.products enable row level security;
alter table public.option_groups enable row level security;
alter table public.options enable row level security;
alter table public.product_option_groups enable row level security;
alter table public.allergens enable row level security;
alter table public.product_allergens enable row level security;
alter table public.option_allergens enable row level security;

revoke all on public.menus, public.menu_schedules, public.categories, public.menu_categories,
  public.products, public.option_groups, public.options, public.product_option_groups,
  public.allergens, public.product_allergens, public.option_allergens from anon;
-- No physical delete of anything that can appear in an order (soft delete only).
revoke delete on public.menus, public.categories, public.products, public.option_groups, public.options
  from authenticated;
revoke insert, update, delete on public.allergens from authenticated;

create policy allergens_select on public.allergens for select to authenticated using (true);

-- Read by any valid member; write by the owner of a writable shop.
do $$
declare
  t text;
begin
  foreach t in array array['menus', 'menu_schedules', 'categories', 'menu_categories', 'products',
                           'option_groups', 'options', 'product_option_groups', 'product_allergens',
                           'option_allergens'] loop
    execute format(
      'create policy %1$s_select on public.%1$s for select to authenticated
         using (shop_id in (select private.my_shop_ids(''any'')))', t);
    execute format(
      'create policy %1$s_insert on public.%1$s for insert to authenticated
         with check (shop_id in (select private.my_writable_shop_ids(''owner'')))', t);
    execute format(
      'create policy %1$s_update on public.%1$s for update to authenticated
         using (shop_id in (select private.my_writable_shop_ids(''owner'')))
         with check (shop_id in (select private.my_writable_shop_ids(''owner'')))', t);
  end loop;
  foreach t in array array['menu_schedules', 'menu_categories', 'product_option_groups',
                           'product_allergens', 'option_allergens'] loop
    execute format(
      'create policy %1$s_delete on public.%1$s for delete to authenticated
         using (shop_id in (select private.my_writable_shop_ids(''owner'')))', t);
  end loop;
end;
$$;
