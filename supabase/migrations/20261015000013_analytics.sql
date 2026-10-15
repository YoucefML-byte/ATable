-- Statistics, owner only. Bible: vol. 04 §11, vol. 02 DSH-01.
-- Common definition: "validated" = accepted, ready or served. Dates are business days (inclusive),
-- times are expressed in the shop's time zone. Vocabulary: "montant commandé", never revenue.

create or replace function private.require_owner(p_shop_id uuid)
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.has_read_perm(p_shop_id, 'owner') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
end;
$$;

create or replace function public.analytics_overview(p_shop_id uuid, p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v jsonb;
begin
  perform private.require_owner(p_shop_id);
  with o as (
    select * from public.orders
    where shop_id = p_shop_id and business_day between p_from and p_to
  ),
  validated as (select * from o where status in ('accepted', 'ready', 'served'))
  select jsonb_build_object(
    'validated_amount_cents', coalesce((select sum(subtotal_cents) from validated), 0),
    'validated_orders', (select count(*) from validated),
    'avg_order_cents', coalesce((select round(avg(subtotal_cents)) from validated), 0),
    'table_sessions', (select count(distinct table_session_id) from validated),
    'avg_session_cents', coalesce((
      select round(avg(t)) from (select sum(subtotal_cents) as t from validated group by table_session_id) s), 0),
    'rejected_orders', (select count(*) from o where status = 'rejected'),
    'cancelled_orders', (select count(*) from o where status = 'cancelled'),
    'total_orders', (select count(*) from o),
    'reject_rate', coalesce((
      select round(100.0 * count(*) filter (where status = 'rejected') / nullif(count(*), 0), 1) from o), 0),
    'avg_validation_seconds', coalesce((
      select round(avg(extract(epoch from accepted_at - created_at))) from o where accepted_at is not null), 0),
    'avg_preparation_seconds', coalesce((
      select round(avg(extract(epoch from ready_at - accepted_at))) from o
      where ready_at is not null and accepted_at is not null and ready_at > accepted_at), 0)
  ) into v;
  return v;
end;
$$;

create or replace function public.analytics_timeseries(p_shop_id uuid, p_from date, p_to date, p_bucket text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_tz text;
  v    jsonb;
begin
  perform private.require_owner(p_shop_id);
  if p_bucket not in ('hour', 'day', 'week', 'month') then
    raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
  end if;
  select timezone into v_tz from public.shops where id = p_shop_id;
  select coalesce(jsonb_agg(jsonb_build_object('bucket', bucket, 'amount_cents', amount, 'orders', n) order by bucket), '[]')
  into v
  from (
    select case p_bucket
             when 'hour' then to_char(date_trunc('hour', created_at at time zone v_tz), 'YYYY-MM-DD"T"HH24:00')
             when 'day' then to_char(business_day, 'YYYY-MM-DD')
             when 'week' then to_char(date_trunc('week', business_day), 'YYYY-MM-DD')
             else to_char(date_trunc('month', business_day), 'YYYY-MM')
           end as bucket,
           sum(subtotal_cents) as amount, count(*) as n
    from public.orders
    where shop_id = p_shop_id and business_day between p_from and p_to
      and status in ('accepted', 'ready', 'served')
    group by 1
  ) s;
  return v;
end;
$$;

create or replace function public.analytics_heatmap(p_shop_id uuid, p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_tz text;
  v    jsonb;
begin
  perform private.require_owner(p_shop_id);
  select timezone into v_tz from public.shops where id = p_shop_id;
  select coalesce(jsonb_agg(jsonb_build_object('dow', dow, 'hour', hr, 'orders', n) order by dow, hr), '[]')
  into v
  from (
    select extract(isodow from created_at at time zone v_tz)::int as dow,
           extract(hour from created_at at time zone v_tz)::int as hr,
           count(*) as n
    from public.orders
    where shop_id = p_shop_id and business_day between p_from and p_to
      and status in ('accepted', 'ready', 'served')
    group by 1, 2
  ) s;
  return v;
end;
$$;

create or replace function public.analytics_top_products(
  p_shop_id uuid, p_from date, p_to date, p_limit int default 10, p_order_by text default 'quantity')
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v jsonb;
begin
  perform private.require_owner(p_shop_id);
  if p_order_by not in ('quantity', 'amount') then
    raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'product_id', product_id, 'name', name, 'category', category,
           'quantity', qty, 'amount_cents', amount) order by rnk), '[]')
  into v
  from (
    select oi.product_id,
           (array_agg(oi.product_name order by o.created_at desc))[1] as name,
           (array_agg(oi.category_name order by o.created_at desc))[1] as category,
           sum(oi.quantity) as qty, sum(oi.line_total_cents) as amount,
           row_number() over (order by case when p_order_by = 'amount' then sum(oi.line_total_cents)
                                            else sum(oi.quantity) end desc) as rnk
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.shop_id = p_shop_id and o.business_day between p_from and p_to
      and o.status in ('accepted', 'ready', 'served')
    group by oi.product_id
    order by rnk
    limit greatest(1, least(p_limit, 100))
  ) s;
  return v;
end;
$$;

create or replace function public.analytics_unsold_products(p_shop_id uuid, p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v jsonb;
begin
  perform private.require_owner(p_shop_id);
  select coalesce(jsonb_agg(jsonb_build_object('product_id', p.id, 'name', p.name, 'category', c.name,
                                               'quantity', coalesce(q.qty, 0)) order by coalesce(q.qty, 0), p.name), '[]')
  into v
  from public.products p
  join public.categories c on c.id = p.category_id
  left join (
    select oi.product_id, sum(oi.quantity) as qty
    from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.shop_id = p_shop_id and o.business_day between p_from and p_to
      and o.status in ('accepted', 'ready', 'served')
    group by oi.product_id
  ) q on q.product_id = p.id
  where p.shop_id = p_shop_id and p.deleted_at is null and not p.is_hidden and coalesce(q.qty, 0) <= 1;
  return v;
end;
$$;

create or replace function public.analytics_by_category(p_shop_id uuid, p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v jsonb;
begin
  perform private.require_owner(p_shop_id);
  select coalesce(jsonb_agg(jsonb_build_object('category', category, 'quantity', qty, 'amount_cents', amount)
                            order by amount desc), '[]')
  into v
  from (
    select oi.category_name as category, sum(oi.quantity) as qty, sum(oi.line_total_cents) as amount
    from public.order_items oi join public.orders o on o.id = oi.order_id
    where o.shop_id = p_shop_id and o.business_day between p_from and p_to
      and o.status in ('accepted', 'ready', 'served')
    group by oi.category_name
  ) s;
  return v;
end;
$$;

create or replace function public.analytics_by_table(p_shop_id uuid, p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v jsonb;
begin
  perform private.require_owner(p_shop_id);
  select coalesce(jsonb_agg(jsonb_build_object(
           'table_id', t.id, 'label', t.label, 'zone', t.zone,
           'sessions', s.sessions, 'orders', s.orders, 'amount_cents', s.amount,
           'avg_session_cents', case when s.sessions > 0 then round(s.amount::numeric / s.sessions) else 0 end)
         order by s.amount desc), '[]')
  into v
  from (
    select o.table_id, count(distinct o.table_session_id) as sessions, count(*) as orders,
           sum(o.subtotal_cents) as amount
    from public.orders o
    where o.shop_id = p_shop_id and o.business_day between p_from and p_to
      and o.status in ('accepted', 'ready', 'served')
    group by o.table_id
  ) s
  join public.dining_tables t on t.id = s.table_id;
  return v;
end;
$$;

create or replace function public.analytics_top_options(p_shop_id uuid, p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v jsonb;
begin
  perform private.require_owner(p_shop_id);
  select coalesce(jsonb_agg(jsonb_build_object('group', group_name, 'option', option_name, 'quantity', qty)
                            order by group_name, qty desc), '[]')
  into v
  from (
    select oio.group_name, oio.option_name, sum(oio.quantity * oi.quantity) as qty,
           row_number() over (partition by oio.group_name order by sum(oio.quantity * oi.quantity) desc) as rnk
    from public.order_item_options oio
    join public.order_items oi on oi.id = oio.order_item_id
    join public.orders o on o.id = oi.order_id
    where o.shop_id = p_shop_id and o.business_day between p_from and p_to
      and o.status in ('accepted', 'ready', 'served')
    group by oio.group_name, oio.option_name
  ) s
  where rnk <= 5;
  return v;
end;
$$;

create or replace function public.analytics_reject_reasons(p_shop_id uuid, p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v jsonb;
begin
  perform private.require_owner(p_shop_id);
  select coalesce(jsonb_agg(jsonb_build_object('status', status, 'reason', reason, 'orders', n) order by n desc), '[]')
  into v
  from (
    select status, coalesce(internal_reason, '') as reason, count(*) as n
    from public.orders
    where shop_id = p_shop_id and business_day between p_from and p_to
      and status in ('rejected', 'cancelled')
    group by 1, 2
  ) s;
  return v;
end;
$$;

-- Attention boxes of the dashboard (DSH-02).
create or replace function public.analytics_alerts(p_shop_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_today date;
begin
  perform private.require_owner(p_shop_id);
  v_today := private.business_day(p_shop_id, now());
  return jsonb_build_object(
    'products_without_allergens', (select count(*) from public.products
      where shop_id = p_shop_id and deleted_at is null and allergens_declared_at is null),
    'sold_out_over_24h', (select count(*) from public.products
      where shop_id = p_shop_id and deleted_at is null and is_sold_out and updated_at < now() - interval '24 hours'),
    'reject_rate_today', coalesce((select round(100.0 * count(*) filter (where status = 'rejected') / nullif(count(*), 0), 1)
      from public.orders where shop_id = p_shop_id and business_day = v_today), 0),
    'reject_rate_30d', coalesce((select round(100.0 * count(*) filter (where status = 'rejected') / nullif(count(*), 0), 1)
      from public.orders where shop_id = p_shop_id and business_day between v_today - 30 and v_today - 1), 0),
    'tables_left_open', (select count(*) from public.table_sessions
      where shop_id = p_shop_id and closed_at is null and business_day < v_today)
  );
end;
$$;

do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'analytics\_%'
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end;
$$;
