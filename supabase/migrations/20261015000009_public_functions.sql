-- Public functions used by the customer site (role anon through the server).
-- Bible: vol. 04 §7.
-- Divergences (ADR-009):
--  * the logic lives in private.* functions that take the instant as a parameter, so that the
--    time-dependent tests (lunch/evening menus, midnight ranges, numbering) can be written;
--  * a product whose mandatory option group has no orderable option left is reported sold out;
--  * the idempotency fallback only handles the violation of the idempotency constraint.

-- ---------------------------------------------------------------------------
-- Host resolution
-- ---------------------------------------------------------------------------
create or replace function public.public_resolve_host(p_host text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'shop_id', s.id,
    'slug', s.slug,
    'name', s.name,
    'status', s.status,
    'business_type', s.business_type,
    'timezone', s.timezone,
    'currency', s.currency,
    'locale', s.locale,
    'is_primary_host', d.is_primary,
    'primary_host', coalesce(
      (select pd.hostname from public.shop_domains pd where pd.shop_id = s.id and pd.is_primary),
      (select pd.hostname from public.shop_domains pd where pd.shop_id = s.id and pd.kind = 'platform' limit 1)),
    'public_menu_enabled', s.public_menu_enabled,
    'accepting_orders', s.accepting_orders,
    'order_note_enabled', s.order_note_enabled,
    'sold_out_label', s.sold_out_label,
    'price_notice', s.price_notice,
    'welcome_message', s.welcome_message,
    'opening_hours_text', s.opening_hours_text,
    'address_text', s.address_text,
    'phone', s.phone,
    'legal', jsonb_build_object(
      'name', s.legal_name, 'form', s.legal_form, 'siret', s.legal_siret,
      'address', s.legal_address, 'publication_director', s.legal_publication_director),
    'theme', (select to_jsonb(t) - 'shop_id' - 'updated_at' from public.shop_themes t where t.shop_id = s.id)
  )
  from public.shop_domains d
  join public.shops s on s.id = d.shop_id
  where d.hostname = lower(btrim(p_host))
    and s.status <> 'archived';
$$;

-- ---------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------
-- Orderable options of a group (visible, not deleted, not sold out).
create or replace function private.group_is_satisfiable(p_group_id uuid, p_min smallint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_min = 0 or (
    select coalesce(sum(case when g.allow_quantity then g.max_per_option else 1 end), 0)
    from public.options o join public.option_groups g on g.id = o.group_id
    where o.group_id = p_group_id and o.deleted_at is null and not o.is_hidden and not o.is_sold_out
  ) >= p_min;
$$;

create or replace function private.menu_json(p_shop_id uuid, p_at timestamptz)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with active as (
    select id from private.active_menu_ids(p_shop_id, p_at) as id
  ),
  cats as (
    select c.*, min(mc.position) as menu_position, min(m.position) as menu_order
    from public.categories c
    join public.menu_categories mc on mc.category_id = c.id
    join public.menus m on m.id = mc.menu_id
    where c.shop_id = p_shop_id and c.deleted_at is null and not c.is_hidden
      and mc.menu_id in (select id from active)
    group by c.id
  ),
  groups as (
    select pog.product_id, g.id, g.name, g.allow_quantity, g.max_per_option,
           coalesce(pog.min_override, g.min_select) as min_sel,
           coalesce(pog.max_override, g.max_select) as max_sel,
           pog.position
    from public.product_option_groups pog
    join public.option_groups g on g.id = pog.group_id
    where pog.shop_id = p_shop_id and g.deleted_at is null and not g.is_hidden
  ),
  prods as (
    select p.*,
      exists (select 1 from groups gr where gr.product_id = p.id
              and not private.group_is_satisfiable(gr.id, gr.min_sel)) as blocked_by_options,
      p.base_price_cents + coalesce((
        select sum(cheapest) from (
          select gr.id,
            case when gr.allow_quantity then gr.min_sel * coalesce(min(o.price_delta_cents), 0)
                 else coalesce((select sum(d) from (
                        select o2.price_delta_cents as d from public.options o2
                        where o2.group_id = gr.id and o2.deleted_at is null and not o2.is_hidden
                          and not o2.is_sold_out
                        order by o2.price_delta_cents limit gr.min_sel) x), 0)
            end as cheapest
          from groups gr
          left join public.options o on o.group_id = gr.id and o.deleted_at is null and not o.is_hidden
                                        and not o.is_sold_out
          where gr.product_id = p.id and gr.min_sel > 0
          group by gr.id, gr.allow_quantity, gr.min_sel
        ) mins), 0) as min_price_cents,
      exists (select 1 from groups gr join public.options o on o.group_id = gr.id
              where gr.product_id = p.id and o.deleted_at is null and not o.is_hidden
                and o.price_delta_cents > 0) as has_paid_options
    from public.products p
    where p.shop_id = p_shop_id and p.deleted_at is null and not p.is_hidden
      and p.category_id in (select id from cats)
  )
  select jsonb_build_object(
    'generated_at', p_at,
    'active_menus', coalesce((
      select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name) order by m.position, m.name)
      from public.menus m where m.id in (select id from active)), '[]'::jsonb),
    'next_change_at', private.next_menu_change(p_shop_id, p_at),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'description', c.description, 'is_sold_out', c.is_sold_out,
        'prep_station', c.prep_station,
        'products', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', p.id, 'name', p.name, 'description', p.description,
            'base_price_cents', p.base_price_cents,
            'min_price_cents', p.min_price_cents,
            'has_paid_options', p.has_paid_options,
            'image_path', p.image_path,
            'tags', to_jsonb(p.tags),
            'origin_info', p.origin_info,
            'is_sold_out', p.is_sold_out or c.is_sold_out or p.blocked_by_options,
            'allergens_declared', p.allergens_declared_at is not null,
            'allergens', coalesce((
              select jsonb_agg(jsonb_build_object('code', pa.allergen_code, 'presence', pa.presence)
                               order by a.position)
              from public.product_allergens pa join public.allergens a on a.code = pa.allergen_code
              where pa.product_id = p.id), '[]'::jsonb),
            'option_groups', coalesce((
              select jsonb_agg(jsonb_build_object(
                'id', gr.id, 'name', gr.name, 'min', gr.min_sel, 'max', gr.max_sel,
                'allow_quantity', gr.allow_quantity, 'max_per_option', gr.max_per_option,
                'options', coalesce((
                  select jsonb_agg(jsonb_build_object(
                    'id', o.id, 'name', o.name, 'price_delta_cents', o.price_delta_cents,
                    'is_default', o.is_default, 'is_sold_out', o.is_sold_out,
                    'allergens', coalesce((
                      select jsonb_agg(jsonb_build_object('code', oa.allergen_code, 'presence', oa.presence))
                      from public.option_allergens oa where oa.option_id = o.id), '[]'::jsonb)
                  ) order by o.position, o.name)
                  from public.options o
                  where o.group_id = gr.id and o.deleted_at is null and not o.is_hidden), '[]'::jsonb)
              ) order by gr.position, gr.name)
              from groups gr where gr.product_id = p.id), '[]'::jsonb)
          ) order by p.position, p.name)
          from prods p where p.category_id = c.id), '[]'::jsonb)
      ) order by c.menu_order, c.menu_position, c.position, c.name)
      from cats c), '[]'::jsonb)
  );
$$;

create or replace function public.public_get_menu(p_shop_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.shops where id = p_shop_id and status = 'active') then
    return null;
  end if;
  return private.menu_json(p_shop_id, now());
end;
$$;

-- Preview for the pro space (theme preview, schedule simulator), also in onboarding.
create or replace function public.staff_preview_menu(p_shop_id uuid, p_at timestamptz default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.has_read_perm(p_shop_id, 'any') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  return private.menu_json(p_shop_id, coalesce(p_at, now()));
end;
$$;

-- ---------------------------------------------------------------------------
-- Table arrival
-- ---------------------------------------------------------------------------
create or replace function public.public_open_table(p_shop_id uuid, p_token text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_status public.shop_status;
  v_result jsonb;
begin
  select status into v_status from public.shops where id = p_shop_id;
  if not found or v_status <> 'active' then
    raise exception using errcode = 'P0001', message = 'SHOP_UNAVAILABLE';
  end if;
  select jsonb_build_object('table_id', t.id, 'table_label', t.label, 'zone', t.zone)
    into v_result
  from public.table_tokens tk
  join public.dining_tables t on t.id = tk.table_id
  where tk.token = p_token and tk.shop_id = p_shop_id and tk.revoked_at is null
    and t.is_active and t.deleted_at is null;
  if v_result is null then
    raise exception using errcode = 'P0001', message = 'INVALID_TABLE';
  end if;
  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Order placement — the critical function (vol. 04 §7.4)
-- ---------------------------------------------------------------------------
create or replace function private.place_order(
  p_shop_id         uuid,
  p_token           text,
  p_client_key      text,
  p_idempotency_key uuid,
  p_items           jsonb, -- [{ "product_id": uuid, "quantity": int, "options": [{ "option_id": uuid, "quantity": int }] }]
  p_note            text,
  p_source          public.order_source,
  p_at              timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop        public.shops%rowtype;
  v_table_id    uuid;
  v_session_id  uuid;
  v_day         date;
  v_number      integer;
  v_order_id    uuid;
  v_existing    public.orders%rowtype;
  v_client_hash text;
  v_item        jsonb;
  v_opt         jsonb;
  v_qty         integer;
  v_opt_qty     integer;
  v_product     record;
  v_option      record;
  v_group       record;
  v_item_id     uuid;
  v_unit        bigint;
  v_selected    integer;
  v_subtotal    bigint := 0;
  v_count       integer := 0;
  v_pos         smallint := 0;
  v_constraint  text;
  v_note        text := nullif(btrim(p_note), '');
begin
  -- 1. Input shape
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = 'P0001', message = 'EMPTY_ORDER';
  end if;
  if p_client_key is null or char_length(p_client_key) < 32 or char_length(p_client_key) > 128 then
    raise exception using errcode = 'P0001', message = 'BAD_CLIENT';
  end if;
  if v_note is not null and char_length(v_note) > 280 then
    raise exception using errcode = 'P0001', message = 'NOTE_TOO_LONG';
  end if;
  if p_source is null or p_source = 'staff' then
    raise exception using errcode = 'P0001', message = 'BAD_SOURCE';
  end if;
  if p_idempotency_key is null then
    raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
  end if;

  -- 2. Shop
  select * into v_shop from public.shops where id = p_shop_id;
  if not found or v_shop.status <> 'active' then
    raise exception using errcode = 'P0001', message = 'SHOP_UNAVAILABLE';
  end if;
  if not v_shop.accepting_orders then
    raise exception using errcode = 'P0001', message = 'ORDERS_CLOSED';
  end if;
  if jsonb_array_length(p_items) > v_shop.max_lines_per_order then
    raise exception using errcode = 'P0001', message = 'TOO_MANY_LINES';
  end if;
  if not v_shop.order_note_enabled then
    v_note := null;
  end if;

  -- 3. Table
  select t.id into v_table_id
  from public.table_tokens tk
  join public.dining_tables t on t.id = tk.table_id
  where tk.token = p_token and tk.shop_id = p_shop_id and tk.revoked_at is null
    and t.is_active and t.deleted_at is null;
  if not found then
    raise exception using errcode = 'P0001', message = 'INVALID_TABLE';
  end if;

  v_client_hash := encode(extensions.digest(p_client_key, 'sha256'), 'hex');

  -- 4. Idempotency (double submit)
  select * into v_existing from public.orders
  where shop_id = p_shop_id and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('order_id', v_existing.id, 'number', v_existing.number,
      'subtotal_cents', v_existing.subtotal_cents, 'item_count', v_existing.item_count, 'duplicate', true);
  end if;

  -- 5. Table lock (serialises simultaneous orders of the same table)
  perform 1 from public.dining_tables where id = v_table_id for update;

  -- 6. Anti-abuse
  if (select count(*) from public.orders
      where shop_id = p_shop_id and client_key_hash = v_client_hash
        and created_at > p_at - interval '10 minutes') >= v_shop.max_orders_per_client_10min then
    raise exception using errcode = 'P0001', message = 'RATE_LIMITED';
  end if;
  if (select count(*) from public.orders
      where table_id = v_table_id and status = 'submitted') >= v_shop.max_pending_orders_per_table then
    raise exception using errcode = 'P0001', message = 'TOO_MANY_PENDING';
  end if;

  -- 7. Table session (opened by the first order)
  v_day := private.business_day(p_shop_id, p_at);
  select id into v_session_id from public.table_sessions
  where table_id = v_table_id and closed_at is null;
  if not found then
    insert into public.table_sessions (shop_id, table_id, business_day, opened_at)
    values (p_shop_id, v_table_id, v_day, p_at)
    returning id into v_session_id;
  end if;

  -- 8. Number of the day
  insert into public.shop_daily_counters as c (shop_id, business_day, last_number)
  values (p_shop_id, v_day, 1)
  on conflict (shop_id, business_day) do update set last_number = c.last_number + 1
  returning last_number into v_number;

  -- 9. Order header
  insert into public.orders (shop_id, table_id, table_session_id, business_day, number, status,
                             source, client_key_hash, note, idempotency_key, created_at)
  values (p_shop_id, v_table_id, v_session_id, v_day, v_number, 'submitted',
          p_source, v_client_hash, v_note, p_idempotency_key, p_at)
  returning id into v_order_id;

  -- 10. Lines
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_pos := v_pos + 1;
    if jsonb_typeof(v_item) <> 'object' or jsonb_typeof(v_item -> 'quantity') <> 'number' then
      raise exception using errcode = 'P0001', message = 'BAD_QUANTITY';
    end if;
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > v_shop.max_quantity_per_line then
      raise exception using errcode = 'P0001', message = 'BAD_QUANTITY';
    end if;

    select p.id, p.name, p.base_price_cents, c.name as category_name, c.prep_station
      into v_product
    from public.products p
    join public.categories c on c.id = p.category_id
    where p.id = (v_item ->> 'product_id')::uuid
      and p.shop_id = p_shop_id
      and p.deleted_at is null and not p.is_hidden and not p.is_sold_out
      and c.deleted_at is null and not c.is_hidden and not c.is_sold_out
      and private.category_orderable_now(c.id, p_at);
    if not found then
      raise exception using errcode = 'P0001', message = 'PRODUCT_UNAVAILABLE',
        detail = coalesce(v_item ->> 'product_id', '');
    end if;

    insert into public.order_items (order_id, shop_id, product_id, product_name, category_name,
                                    prep_station, base_price_cents, unit_price_cents, quantity,
                                    line_total_cents, position)
    values (v_order_id, p_shop_id, v_product.id, v_product.name, v_product.category_name,
            v_product.prep_station, v_product.base_price_cents, 0, v_qty, 0, v_pos)
    returning id into v_item_id;

    v_unit := v_product.base_price_cents;

    if jsonb_typeof(coalesce(v_item -> 'options', '[]'::jsonb)) <> 'array'
       or jsonb_array_length(coalesce(v_item -> 'options', '[]'::jsonb)) > 50 then
      raise exception using errcode = 'P0001', message = 'OPTIONS_INVALID',
        detail = v_product.id::text;
    end if;

    for v_opt in select value from jsonb_array_elements(coalesce(v_item -> 'options', '[]'::jsonb)) loop
      if jsonb_typeof(v_opt) <> 'object'
         or (v_opt ? 'quantity' and jsonb_typeof(v_opt -> 'quantity') <> 'number') then
        raise exception using errcode = 'P0001', message = 'OPTIONS_INVALID', detail = v_product.id::text;
      end if;
      v_opt_qty := coalesce((v_opt ->> 'quantity')::integer, 1);
      select o.id, o.name, o.price_delta_cents, g.id as group_id, g.name as group_name,
             g.allow_quantity, g.max_per_option
        into v_option
      from public.options o
      join public.option_groups g on g.id = o.group_id
      join public.product_option_groups pog on pog.group_id = g.id and pog.product_id = v_product.id
      where o.id = (v_opt ->> 'option_id')::uuid
        and o.shop_id = p_shop_id
        and o.deleted_at is null and not o.is_hidden and not o.is_sold_out
        and g.deleted_at is null and not g.is_hidden;
      if not found then
        raise exception using errcode = 'P0001', message = 'OPTIONS_INVALID', detail = v_product.id::text;
      end if;
      if v_opt_qty < 1 or (not v_option.allow_quantity and v_opt_qty <> 1)
         or v_opt_qty > v_option.max_per_option then
        raise exception using errcode = 'P0001', message = 'OPTIONS_INVALID', detail = v_product.id::text;
      end if;
      if exists (select 1 from public.order_item_options
                 where order_item_id = v_item_id and option_id = v_option.id) then
        raise exception using errcode = 'P0001', message = 'OPTIONS_INVALID', detail = v_product.id::text;
      end if;
      insert into public.order_item_options (order_item_id, shop_id, option_id, group_id, group_name,
                                             option_name, price_delta_cents, quantity)
      values (v_item_id, p_shop_id, v_option.id, v_option.group_id, v_option.group_name,
              v_option.name, v_option.price_delta_cents, v_opt_qty);
      v_unit := v_unit + v_option.price_delta_cents::bigint * v_opt_qty;
    end loop;

    -- min/max constraints of every visible group linked to the product
    for v_group in
      select g.id,
             coalesce(pog.min_override, g.min_select) as min_sel,
             coalesce(pog.max_override, g.max_select) as max_sel
      from public.product_option_groups pog
      join public.option_groups g on g.id = pog.group_id
      where pog.product_id = v_product.id and g.deleted_at is null and not g.is_hidden
    loop
      select coalesce(sum(oio.quantity), 0) into v_selected
      from public.order_item_options oio
      where oio.order_item_id = v_item_id and oio.group_id = v_group.id;
      if v_selected < v_group.min_sel or (v_group.max_sel is not null and v_selected > v_group.max_sel) then
        raise exception using errcode = 'P0001', message = 'OPTIONS_INVALID', detail = v_product.id::text;
      end if;
    end loop;

    if v_unit * v_qty > v_shop.max_order_total_cents then
      raise exception using errcode = 'P0001', message = 'ORDER_TOO_LARGE';
    end if;
    update public.order_items
       set unit_price_cents = v_unit, line_total_cents = v_unit * v_qty
     where id = v_item_id;

    v_subtotal := v_subtotal + v_unit * v_qty;
    v_count := v_count + v_qty;
  end loop;

  if v_subtotal > v_shop.max_order_total_cents then
    raise exception using errcode = 'P0001', message = 'ORDER_TOO_LARGE';
  end if;

  update public.orders set subtotal_cents = v_subtotal, item_count = v_count where id = v_order_id;
  insert into public.order_status_events (order_id, shop_id, from_status, to_status, created_at)
  values (v_order_id, p_shop_id, null, 'submitted', p_at);

  return jsonb_build_object('order_id', v_order_id, 'number', v_number,
    'subtotal_cents', v_subtotal, 'item_count', v_count, 'duplicate', false);
exception
  when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    -- Two simultaneous submits with the same idempotency key: return the existing order.
    if v_constraint = 'orders_shop_id_idempotency_key_key' then
      select * into v_existing from public.orders
      where shop_id = p_shop_id and idempotency_key = p_idempotency_key;
      if found then
        return jsonb_build_object('order_id', v_existing.id, 'number', v_existing.number,
          'subtotal_cents', v_existing.subtotal_cents, 'item_count', v_existing.item_count, 'duplicate', true);
      end if;
    end if;
    raise;
  when invalid_text_representation then
    -- e.g. 'abc'::uuid in the items
    raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
  when numeric_value_out_of_range then
    raise exception using errcode = 'P0001', message = 'BAD_QUANTITY';
end;
$$;

create or replace function public.public_place_order(
  p_shop_id         uuid,
  p_token           text,
  p_client_key      text,
  p_idempotency_key uuid,
  p_items           jsonb,
  p_note            text default null,
  p_source          public.order_source default 'qr'
)
returns jsonb
language sql
volatile
security definer
set search_path = ''
as $$
  select private.place_order(p_shop_id, p_token, p_client_key, p_idempotency_key, p_items, p_note,
                             p_source, now());
$$;

-- ---------------------------------------------------------------------------
-- My orders (CLI-06)
-- ---------------------------------------------------------------------------
create or replace function public.public_my_orders(p_shop_id uuid, p_token text, p_client_key text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_table_id uuid;
  v_hash     text;
begin
  if p_client_key is null or char_length(p_client_key) < 32 or char_length(p_client_key) > 128 then
    raise exception using errcode = 'P0001', message = 'BAD_CLIENT';
  end if;
  select tk.table_id into v_table_id
  from public.table_tokens tk join public.dining_tables t on t.id = tk.table_id
  where tk.token = p_token and tk.shop_id = p_shop_id and tk.revoked_at is null
    and t.is_active and t.deleted_at is null;
  if not found then
    raise exception using errcode = 'P0001', message = 'INVALID_TABLE';
  end if;
  v_hash := encode(extensions.digest(p_client_key, 'sha256'), 'hex');
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'order_id', o.id,
      'number', o.number,
      'created_at', o.created_at,
      'status', case when o.status in ('rejected', 'cancelled') then 'withdrawn' else 'sent' end,
      'subtotal_cents', o.subtotal_cents,
      'note', o.note,
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'name', oi.product_name, 'quantity', oi.quantity, 'line_total_cents', oi.line_total_cents,
          'options', coalesce((
            select jsonb_agg(jsonb_build_object('name', oio.option_name, 'quantity', oio.quantity))
            from public.order_item_options oio where oio.order_item_id = oi.id), '[]'::jsonb)
        ) order by oi.position)
        from public.order_items oi where oi.order_id = o.id), '[]'::jsonb)
    ) order by o.created_at)
    from public.orders o
    join public.table_sessions ts on ts.id = o.table_session_id and ts.closed_at is null
    where o.shop_id = p_shop_id and o.table_id = v_table_id and o.client_key_hash = v_hash
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.public_resolve_host(text) from public;
revoke all on function public.public_get_menu(uuid) from public;
revoke all on function public.public_open_table(uuid, text) from public;
revoke all on function public.public_place_order(uuid, text, text, uuid, jsonb, text, public.order_source) from public;
revoke all on function public.public_my_orders(uuid, text, text) from public;
revoke all on function public.staff_preview_menu(uuid, timestamptz) from public;
grant execute on function public.public_resolve_host(text) to anon, authenticated;
grant execute on function public.public_get_menu(uuid) to anon, authenticated;
grant execute on function public.public_open_table(uuid, text) to anon, authenticated;
grant execute on function public.public_place_order(uuid, text, text, uuid, jsonb, text, public.order_source) to anon, authenticated;
grant execute on function public.public_my_orders(uuid, text, text) to anon, authenticated;
grant execute on function public.staff_preview_menu(uuid, timestamptz) to authenticated;
-- private.place_order and private.menu_json stay unreachable from the API (private schema).
revoke all on function private.place_order(uuid, text, text, uuid, jsonb, text, public.order_source, timestamptz)
  from public, anon, authenticated;
