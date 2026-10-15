-- Audit log. Bible: vol. 04 §4.6, §5 (private.audit), §10 (audit_catalog_change).

create table public.audit_log (
  id              bigint generated always as identity primary key,
  shop_id         uuid references public.shops (id) on delete set null, -- NULL = platform action
  actor_user_id   uuid,
  actor_member_id uuid,
  actor_kind      text not null check (actor_kind in ('owner', 'staff', 'platform_admin', 'system', 'public')),
  action          text not null check (char_length(action) <= 80), -- e.g. 'product.update', 'order.reject'
  entity_type     text check (char_length(entity_type) <= 60),
  entity_id       uuid,
  changes         jsonb,                                            -- { "field": [old, new] }; never a secret
  request_ip      inet,                                             -- staff only; kept 24 months max
  created_at      timestamptz not null default now()
);
create index audit_log_shop on public.audit_log (shop_id, created_at desc);
create index audit_log_created on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon;
revoke insert, update, delete on public.audit_log from authenticated;

create policy audit_log_select on public.audit_log
  for select to authenticated
  using (shop_id in (select private.my_shop_ids('owner')) or (select private.is_platform_admin()));
create policy require_mfa_when_enrolled on public.audit_log
  as restrictive for all to authenticated
  using (coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2' or not (select private.has_verified_mfa()));

-- Writes an audit entry (called by business functions and triggers).
create or replace function private.audit(
  p_shop_id uuid, p_action text, p_entity_type text, p_entity_id uuid, p_changes jsonb default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_member uuid := case when p_shop_id is null then null else private.current_member_id(p_shop_id) end;
  v_kind   text;
begin
  v_kind := case
    when (select auth.uid()) is null then
      case when coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'anon'
           then 'public' else 'system' end
    when v_member is null and exists (select 1 from public.platform_admins where user_id = (select auth.uid()))
      then 'platform_admin'
    when exists (select 1 from public.shop_members where id = v_member and role = 'owner') then 'owner'
    when v_member is not null then 'staff'
    else 'system' end;
  insert into public.audit_log (shop_id, actor_user_id, actor_member_id, actor_kind, action,
                                entity_type, entity_id, changes)
  values (p_shop_id, (select auth.uid()), v_member, v_kind, p_action, p_entity_type, p_entity_id, p_changes);
end;
$$;

-- Generic trigger: records changed columns (old -> new), never secrets or counters.
create or replace function private.audit_row_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_old     jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else '{}'::jsonb end;
  v_new     jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else '{}'::jsonb end;
  v_row     jsonb := case when tg_op = 'DELETE' then v_old else v_new end;
  v_changes jsonb := '{}'::jsonb;
  v_key     text;
  v_shop    uuid;
  v_action  text;
  v_ignored text[] := array['updated_at', 'created_at', 'pin_hash', 'secret_hash', 'pin_failed_count',
                            'pin_lock_level', 'pin_locked_until', 'failed_attempts',
                            'failed_attempts_window_start', 'last_seen_at', 'position'];
begin
  for v_key in select jsonb_object_keys(v_old || v_new) loop
    continue when v_key = any (v_ignored);
    if (v_old -> v_key) is distinct from (v_new -> v_key) then
      v_changes := v_changes || jsonb_build_object(v_key, jsonb_build_array(v_old -> v_key, v_new -> v_key));
    end if;
  end loop;
  if v_changes = '{}'::jsonb then
    return null;
  end if;
  v_shop := case when tg_table_name = 'shops' then (v_row ->> 'id')::uuid else (v_row ->> 'shop_id')::uuid end;
  -- The entity name is passed as trigger argument (e.g. 'product').
  v_action := tg_argv[0] || '.' || lower(tg_op);
  -- Soft delete is reported as such.
  if tg_op = 'UPDATE' and (v_old ->> 'deleted_at') is null and (v_new ->> 'deleted_at') is not null then
    v_action := tg_argv[0] || '.delete';
  end if;
  perform private.audit(v_shop, v_action, tg_table_name,
    coalesce((v_row ->> 'id')::uuid, (v_row ->> 'shop_id')::uuid),
    case when tg_op = 'INSERT' then null else v_changes end);
  return null;
end;
$$;

create trigger shops_audit after update on public.shops
  for each row execute function private.audit_row_change('shop');
create trigger shop_themes_audit after update on public.shop_themes
  for each row execute function private.audit_row_change('theme');
create trigger shop_members_audit after insert or update on public.shop_members
  for each row execute function private.audit_row_change('member');
