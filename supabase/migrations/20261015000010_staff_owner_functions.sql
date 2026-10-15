-- Staff and owner functions. Bible: vol. 04 §8, §8.1.
-- Every function is security definer, executable by authenticated only, and starts with a
-- permission check that raises FORBIDDEN. Identifiers belonging to another shop raise NOT_FOUND.

-- Display name of the current member (snapshot in order events).
create or replace function private.current_member_name(p_shop_id uuid)
returns text
language sql stable security definer set search_path = ''
as $$
  select display_name from public.shop_members
  where shop_id = p_shop_id and user_id = (select auth.uid()) and is_active
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Order state machine
-- ---------------------------------------------------------------------------
create or replace function public.staff_transition_order(
  p_order_id uuid, p_to public.order_status, p_reason text default null)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_order   public.orders%rowtype;
  v_member  uuid;
  v_name    text;
  v_last    text;
  v_needs   boolean;
  v_reason  text := nullif(btrim(p_reason), '');
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  -- Permission: floor for everything; kitchen or floor for "ready".
  if p_to = 'ready' then
    if not (private.has_perm(v_order.shop_id, 'floor') or private.has_perm(v_order.shop_id, 'kitchen')) then
      if private.has_read_perm(v_order.shop_id, 'any') then
        raise exception using errcode = 'P0001', message = 'FORBIDDEN';
      end if;
      raise exception using errcode = 'P0001', message = 'NOT_FOUND';
    end if;
  elsif not private.has_perm(v_order.shop_id, 'floor') then
    if private.has_read_perm(v_order.shop_id, 'any') then
      raise exception using errcode = 'P0001', message = 'FORBIDDEN';
    end if;
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if v_reason is not null and char_length(v_reason) > 200 then
    raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
  end if;

  if not (
       (v_order.status = 'submitted' and p_to in ('accepted', 'rejected'))
    or (v_order.status = 'accepted'  and p_to in ('ready', 'cancelled'))
    or (v_order.status = 'ready'     and p_to in ('served', 'cancelled'))
  ) then
    select actor_name into v_last from public.order_status_events
    where order_id = v_order.id order by id desc limit 1;
    -- The interface shows "Already handled by <name>".
    raise exception using errcode = 'P0001', message = 'INVALID_TRANSITION',
      detail = v_order.status::text || '|' || coalesce(v_last, '');
  end if;

  v_member := private.current_member_id(v_order.shop_id);
  v_name := private.current_member_name(v_order.shop_id);

  update public.orders set
    status          = p_to,
    accepted_at     = case when p_to = 'accepted'  then now() else accepted_at end,
    accepted_by     = case when p_to = 'accepted'  then v_member else accepted_by end,
    ready_at        = case when p_to = 'ready'     then now() else ready_at end,
    ready_by        = case when p_to = 'ready'     then v_member else ready_by end,
    served_at       = case when p_to = 'served'    then now() else served_at end,
    served_by       = case when p_to = 'served'    then v_member else served_by end,
    rejected_at     = case when p_to = 'rejected'  then now() else rejected_at end,
    rejected_by     = case when p_to = 'rejected'  then v_member else rejected_by end,
    cancelled_at    = case when p_to = 'cancelled' then now() else cancelled_at end,
    cancelled_by    = case when p_to = 'cancelled' then v_member else cancelled_by end,
    internal_reason = case when p_to in ('rejected', 'cancelled') then v_reason else internal_reason end
  where id = v_order.id;

  insert into public.order_status_events (order_id, shop_id, from_status, to_status, actor_id, actor_name, reason)
  values (v_order.id, v_order.shop_id, v_order.status, p_to, v_member, v_name,
          case when p_to in ('rejected', 'cancelled') then v_reason end);

  perform private.audit(v_order.shop_id, 'order.' || p_to::text, 'order', v_order.id,
    jsonb_build_object('status', jsonb_build_array(v_order.status, p_to)));

  -- Accepted with nothing to prepare => straight to "ready" (two events recorded).
  if p_to = 'accepted' then
    select exists (select 1 from public.order_items where order_id = v_order.id and prep_station <> 'none')
      into v_needs;
    if not v_needs then
      update public.orders set status = 'ready', ready_at = now(), ready_by = v_member where id = v_order.id;
      insert into public.order_status_events (order_id, shop_id, from_status, to_status, actor_id, actor_name)
      values (v_order.id, v_order.shop_id, 'accepted', 'ready', v_member, v_name);
      return jsonb_build_object('order_id', v_order.id, 'status', 'ready');
    end if;
  end if;
  return jsonb_build_object('order_id', v_order.id, 'status', p_to);
end;
$$;

-- ---------------------------------------------------------------------------
-- Table closing
-- ---------------------------------------------------------------------------
create or replace function public.staff_close_table_session(p_session_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_session public.table_sessions%rowtype;
  v_total   bigint;
begin
  select * into v_session from public.table_sessions where id = p_session_id for update;
  if not found or not private.has_read_perm(v_session.shop_id, 'any') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if not private.has_perm(v_session.shop_id, 'floor') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  if v_session.closed_at is not null then
    raise exception using errcode = 'P0001', message = 'INVALID_TRANSITION', detail = 'closed|';
  end if;
  -- Lock the table so that no order can be attached to this session meanwhile.
  perform 1 from public.dining_tables where id = v_session.table_id for update;
  if exists (select 1 from public.orders where table_session_id = v_session.id
             and status in ('submitted', 'accepted', 'ready')) then
    raise exception using errcode = 'P0001', message = 'TABLE_HAS_PENDING_ORDERS';
  end if;
  select coalesce(sum(subtotal_cents), 0) into v_total from public.orders
  where table_session_id = v_session.id and status in ('accepted', 'ready', 'served');
  update public.table_sessions
     set closed_at = now(), closed_by = private.current_member_id(v_session.shop_id), total_cents = v_total
   where id = v_session.id;
  perform private.audit(v_session.shop_id, 'table.close', 'table_session', v_session.id,
    jsonb_build_object('total_cents', v_total));
  return jsonb_build_object('session_id', v_session.id, 'total_cents', v_total);
end;
$$;

-- ---------------------------------------------------------------------------
-- Live availability (Stock permission)
-- ---------------------------------------------------------------------------
create or replace function public.staff_set_sold_out(p_entity text, p_id uuid, p_sold_out boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  if p_entity = 'product' then
    select shop_id into v_shop from public.products where id = p_id and deleted_at is null;
  elsif p_entity = 'option' then
    select shop_id into v_shop from public.options where id = p_id and deleted_at is null;
  elsif p_entity = 'category' then
    select shop_id into v_shop from public.categories where id = p_id and deleted_at is null;
  else
    raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
  end if;
  if v_shop is null or not private.has_read_perm(v_shop, 'any') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if not private.has_perm(v_shop, 'stock') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  if p_entity = 'product' then
    update public.products set is_sold_out = p_sold_out where id = p_id;
  elsif p_entity = 'option' then
    update public.options set is_sold_out = p_sold_out where id = p_id;
  else
    update public.categories set is_sold_out = p_sold_out where id = p_id;
  end if;
  -- The generic audit trigger records the change (who, what, when).
end;
$$;

create or replace function public.staff_set_accepting_orders(p_shop_id uuid, p_value boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.has_perm(p_shop_id, 'floor') then
    if private.has_read_perm(p_shop_id, 'any') then
      raise exception using errcode = 'P0001', message = 'FORBIDDEN';
    end if;
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  update public.shops set accepting_orders = p_value where id = p_shop_id;
end;
$$;

create or replace function public.owner_restock_all(p_shop_id uuid)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_count integer := 0;
  v_n     integer;
begin
  if not private.has_perm(p_shop_id, 'owner') then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
  update public.products set is_sold_out = false where shop_id = p_shop_id and is_sold_out and deleted_at is null;
  get diagnostics v_n = row_count; v_count := v_count + v_n;
  update public.options set is_sold_out = false where shop_id = p_shop_id and is_sold_out and deleted_at is null;
  get diagnostics v_n = row_count; v_count := v_count + v_n;
  update public.categories set is_sold_out = false where shop_id = p_shop_id and is_sold_out and deleted_at is null;
  get diagnostics v_n = row_count; v_count := v_count + v_n;
  perform private.audit(p_shop_id, 'stock.restock_all', 'shop', p_shop_id, jsonb_build_object('count', v_count));
  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables and tokens
-- ---------------------------------------------------------------------------
create or replace function public.owner_rotate_table_token(p_table_id uuid, p_new_token text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  select shop_id into v_shop from public.dining_tables where id = p_table_id and deleted_at is null;
  if v_shop is null or not private.has_perm(v_shop, 'owner') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  if p_new_token is null or p_new_token !~ '^[A-Za-z0-9_-]{22,64}$' then
    raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
  end if;
  update public.table_tokens set revoked_at = now() where table_id = p_table_id and revoked_at is null;
  insert into public.table_tokens (shop_id, table_id, token, created_by)
  values (v_shop, p_table_id, p_new_token, private.current_member_id(v_shop));
  perform private.audit(v_shop, 'table.rotate_token', 'table', p_table_id, null);
end;
$$;

-- ---------------------------------------------------------------------------
-- Devices, sessions, lockouts
-- ---------------------------------------------------------------------------
create or replace function public.owner_revoke_device(p_device_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  select shop_id into v_shop from public.devices where id = p_device_id;
  if v_shop is null or not private.has_read_perm(v_shop, 'owner') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  update public.devices set revoked_at = now(), revoked_by = private.current_member_id(v_shop)
   where id = p_device_id and revoked_at is null;
  update public.staff_sessions set revoked_at = now(), revoked_reason = 'device_revoked'
   where device_id = p_device_id and revoked_at is null;
  perform private.audit(v_shop, 'device.revoke', 'device', p_device_id, null);
end;
$$;

create or replace function public.owner_revoke_staff_session(p_session_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  select shop_id into v_shop from public.staff_sessions where session_id = p_session_id;
  if v_shop is null or not private.has_read_perm(v_shop, 'owner') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  update public.staff_sessions set revoked_at = now(), revoked_reason = 'owner_revoked'
   where session_id = p_session_id and revoked_at is null;
  perform private.audit(v_shop, 'staff_session.revoke', 'staff_session', p_session_id, null);
end;
$$;

create or replace function public.owner_unlock_member(p_member_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  select shop_id into v_shop from public.shop_members where id = p_member_id;
  if v_shop is null or not private.has_perm(v_shop, 'owner') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  update public.shop_members
     set pin_failed_count = 0, pin_lock_level = 0, pin_locked_until = null, pin_hard_locked = false
   where id = p_member_id;
  perform private.audit(v_shop, 'member.unlock', 'member', p_member_id, null);
end;
$$;

create or replace function public.owner_unlock_device(p_device_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  select shop_id into v_shop from public.devices where id = p_device_id;
  if v_shop is null or not private.has_perm(v_shop, 'owner') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  update public.devices set locked = false, failed_attempts = 0, failed_attempts_window_start = null
   where id = p_device_id;
  perform private.audit(v_shop, 'device.unlock', 'device', p_device_id, null);
end;
$$;

-- Owner: close every open session of an employee (EQP-01 "close remotely").
create or replace function public.owner_revoke_member_sessions(p_member_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  select shop_id into v_shop from public.shop_members where id = p_member_id;
  if v_shop is null or not private.has_read_perm(v_shop, 'owner') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  update public.staff_sessions set revoked_at = now(), revoked_reason = 'owner_revoked'
   where member_id = p_member_id and revoked_at is null;
  perform private.audit(v_shop, 'member.revoke_sessions', 'member', p_member_id, null);
end;
$$;

-- ---------------------------------------------------------------------------
-- Catalog helpers
-- ---------------------------------------------------------------------------
create or replace function private.entity_shop(p_entity text, p_id uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  -- Static SQL only (no dynamic SQL): one branch per entity.
  select case p_entity
    when 'category'     then (select shop_id from public.categories    where id = p_id and deleted_at is null)
    when 'product'      then (select shop_id from public.products      where id = p_id and deleted_at is null)
    when 'option_group' then (select shop_id from public.option_groups where id = p_id and deleted_at is null)
    when 'option'       then (select shop_id from public.options       where id = p_id and deleted_at is null)
    when 'menu'         then (select shop_id from public.menus         where id = p_id and deleted_at is null)
    when 'table'        then (select shop_id from public.dining_tables where id = p_id and deleted_at is null)
  end;
$$;

create or replace function public.owner_reorder(p_entity text, p_ids uuid[])
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
  i      integer;
begin
  if p_entity not in ('category', 'product', 'option_group', 'option', 'menu', 'table')
     or p_ids is null or cardinality(p_ids) = 0 or cardinality(p_ids) > 1000 then
    raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
  end if;
  v_shop := private.entity_shop(p_entity, p_ids[1]);
  if v_shop is null or not private.has_perm(v_shop, 'owner') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  for i in 1 .. cardinality(p_ids) loop
    if private.entity_shop(p_entity, p_ids[i]) is distinct from v_shop then
      raise exception using errcode = 'P0001', message = 'NOT_FOUND';
    end if;
    case p_entity
      when 'category'     then update public.categories    set position = i where id = p_ids[i];
      when 'product'      then update public.products      set position = i where id = p_ids[i];
      when 'option_group' then update public.option_groups set position = i where id = p_ids[i];
      when 'option'       then update public.options       set position = i where id = p_ids[i];
      when 'menu'         then update public.menus         set position = i where id = p_ids[i];
      when 'table'        then update public.dining_tables set position = i where id = p_ids[i];
    end case;
  end loop;
end;
$$;

create or replace function public.owner_duplicate_product(p_product_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_src public.products%rowtype;
  v_new uuid;
begin
  select * into v_src from public.products where id = p_product_id and deleted_at is null;
  if not found or not private.has_perm(v_src.shop_id, 'owner') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  insert into public.products (shop_id, category_id, name, description, base_price_cents, image_path, tags,
                               origin_info, allergens_declared_at, position, is_hidden, is_sold_out)
  values (v_src.shop_id, v_src.category_id, left(v_src.name || ' (copie)', 80), v_src.description,
          v_src.base_price_cents, null, v_src.tags, v_src.origin_info, v_src.allergens_declared_at,
          v_src.position + 1, true, false)
  returning id into v_new;
  insert into public.product_option_groups (product_id, group_id, shop_id, position, min_override, max_override)
  select v_new, group_id, shop_id, position, min_override, max_override
  from public.product_option_groups where product_id = p_product_id;
  insert into public.product_allergens (product_id, allergen_code, shop_id, presence)
  select v_new, allergen_code, shop_id, presence from public.product_allergens where product_id = p_product_id;
  return v_new;
end;
$$;

create or replace function public.owner_soft_delete(p_entity text, p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  if p_entity not in ('category', 'product', 'option_group', 'option', 'menu', 'table') then
    raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
  end if;
  v_shop := private.entity_shop(p_entity, p_id);
  if v_shop is null or not private.has_perm(v_shop, 'owner') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  case p_entity
    when 'category' then
      if exists (select 1 from public.products where category_id = p_id and deleted_at is null) then
        raise exception using errcode = 'P0001', message = 'CATEGORY_NOT_EMPTY';
      end if;
      update public.categories set deleted_at = now() where id = p_id;
    when 'product' then
      update public.products set deleted_at = now() where id = p_id;
    when 'option_group' then
      update public.option_groups set deleted_at = now() where id = p_id;
      delete from public.product_option_groups where group_id = p_id;
    when 'option' then
      update public.options set deleted_at = now() where id = p_id;
    when 'menu' then
      if not exists (select 1 from public.menus where shop_id = v_shop and id <> p_id and deleted_at is null) then
        raise exception using errcode = 'P0001', message = 'LAST_MENU';
      end if;
      update public.menus set deleted_at = now(), is_default = false where id = p_id;
    when 'table' then
      update public.dining_tables set deleted_at = now(), is_active = false where id = p_id;
      update public.table_tokens set revoked_at = now() where table_id = p_id and revoked_at is null;
  end case;
end;
$$;

create or replace function private.set_allergens(
  p_kind text, p_id uuid, p_shop uuid, p_allergens jsonb, p_none boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_item jsonb;
begin
  if p_allergens is null or jsonb_typeof(p_allergens) <> 'array' then
    raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
  end if;
  if p_none and jsonb_array_length(p_allergens) > 0 then
    raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
  end if;
  if p_kind = 'product' then
    delete from public.product_allergens where product_id = p_id;
  else
    delete from public.option_allergens where option_id = p_id;
  end if;
  for v_item in select value from jsonb_array_elements(p_allergens) loop
    if not exists (select 1 from public.allergens where code = v_item ->> 'code')
       or coalesce(v_item ->> 'presence', '') not in ('contains', 'may_contain') then
      raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
    end if;
    if p_kind = 'product' then
      insert into public.product_allergens (product_id, allergen_code, shop_id, presence)
      values (p_id, v_item ->> 'code', p_shop, (v_item ->> 'presence')::public.allergen_presence);
    else
      insert into public.option_allergens (option_id, allergen_code, shop_id, presence)
      values (p_id, v_item ->> 'code', p_shop, (v_item ->> 'presence')::public.allergen_presence);
    end if;
  end loop;
  if p_kind = 'product' then
    update public.products set allergens_declared_at = now() where id = p_id;
  else
    update public.options set allergens_declared_at = now() where id = p_id;
  end if;
  perform private.audit(p_shop, p_kind || '.allergens', p_kind, p_id,
    jsonb_build_object('allergens', p_allergens, 'none', p_none));
end;
$$;

create or replace function public.owner_set_product_allergens(p_product_id uuid, p_allergens jsonb, p_none boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  select shop_id into v_shop from public.products where id = p_product_id and deleted_at is null;
  if v_shop is null or not private.has_perm(v_shop, 'owner') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  perform private.set_allergens('product', p_product_id, v_shop, p_allergens, p_none);
end;
$$;

create or replace function public.owner_set_option_allergens(p_option_id uuid, p_allergens jsonb, p_none boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  select shop_id into v_shop from public.options where id = p_option_id and deleted_at is null;
  if v_shop is null or not private.has_perm(v_shop, 'owner') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  perform private.set_allergens('option', p_option_id, v_shop, p_allergens, p_none);
end;
$$;

-- Default menu: exactly one per shop.
create or replace function public.owner_set_default_menu(p_menu_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  select shop_id into v_shop from public.menus where id = p_menu_id and deleted_at is null;
  if v_shop is null or not private.has_perm(v_shop, 'owner') then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  update public.menus set is_default = false where shop_id = v_shop and is_default and id <> p_menu_id;
  update public.menus set is_default = true where id = p_menu_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and (p.proname like 'staff\_%' or p.proname like 'owner\_%')
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end;
$$;
