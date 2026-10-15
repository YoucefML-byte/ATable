-- Platform console functions. Bible: vol. 04 §8 (console_*), vol. 02 §11.
-- Addition (ADR-009): console_revoke_device, used by the "stolen tablet" procedure when the
-- owner cannot be reached (vol. 08 §9.3).

create or replace function private.require_platform_admin()
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;
end;
$$;

-- Creates a shop with its default theme, default menu, platform subdomain and billing row.
create or replace function public.console_create_shop(
  p_name text, p_slug text, p_business_type public.business_type, p_timezone text, p_root_domain text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
  v_menu uuid;
begin
  perform private.require_platform_admin();
  if p_root_domain is null or p_root_domain !~ '^[a-z0-9.-]+$' then
    raise exception using errcode = 'P0001', message = 'BAD_REQUEST';
  end if;
  if exists (select 1 from public.shops where slug = p_slug) then
    raise exception using errcode = 'P0001', message = 'SLUG_TAKEN';
  end if;
  insert into public.shops (name, slug, business_type, timezone)
  values (p_name, p_slug, coalesce(p_business_type, 'restaurant'), coalesce(p_timezone, 'Europe/Paris'))
  returning id into v_shop;
  insert into public.shop_themes (shop_id) values (v_shop);
  insert into public.shop_billing (shop_id) values (v_shop);
  insert into public.menus (shop_id, name, is_default) values (v_shop, 'Carte', true) returning id into v_menu;
  insert into public.shop_domains (shop_id, hostname, kind, is_primary, verified_at)
  values (v_shop, p_slug || '.' || p_root_domain, 'platform', true, now());
  perform private.audit(v_shop, 'shop.create', 'shop', v_shop, jsonb_build_object('slug', p_slug));
  return v_shop;
end;
$$;

create or replace function public.console_set_shop_status(p_shop_id uuid, p_status public.shop_status)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_old public.shop_status;
begin
  perform private.require_platform_admin();
  select status into v_old from public.shops where id = p_shop_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  update public.shops
     set status = p_status,
         archived_at = case when p_status = 'archived' then now() else null end
   where id = p_shop_id;
  if p_status = 'archived' then
    update public.devices set revoked_at = now() where shop_id = p_shop_id and revoked_at is null;
    update public.staff_sessions set revoked_at = now(), revoked_reason = 'shop_archived'
     where shop_id = p_shop_id and revoked_at is null;
    update public.shop_members set is_active = false, deactivated_at = now()
     where shop_id = p_shop_id and is_active;
  end if;
  perform private.audit(p_shop_id, 'shop.status', 'shop', p_shop_id,
    jsonb_build_object('status', jsonb_build_array(v_old, p_status)));
end;
$$;

create or replace function public.console_set_shop_features(p_shop_id uuid, p_features text[])
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.require_platform_admin();
  update public.shops set features = coalesce(p_features, '{}') where id = p_shop_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
end;
$$;

create or replace function public.console_set_primary_domain(p_domain_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  perform private.require_platform_admin();
  select shop_id into v_shop from public.shop_domains where id = p_domain_id;
  if v_shop is null then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  update public.shop_domains set is_primary = false where shop_id = v_shop and is_primary;
  update public.shop_domains set is_primary = true where id = p_domain_id;
  perform private.audit(v_shop, 'domain.primary', 'domain', p_domain_id, null);
end;
$$;

create or replace function public.console_revoke_device(p_device_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_shop uuid;
begin
  perform private.require_platform_admin();
  select shop_id into v_shop from public.devices where id = p_device_id;
  if v_shop is null then
    raise exception using errcode = 'P0001', message = 'NOT_FOUND';
  end if;
  update public.devices set revoked_at = now() where id = p_device_id and revoked_at is null;
  update public.staff_sessions set revoked_at = now(), revoked_reason = 'device_revoked'
   where device_id = p_device_id and revoked_at is null;
  perform private.audit(v_shop, 'device.revoke', 'device', p_device_id, jsonb_build_object('by', 'platform'));
end;
$$;

-- Aggregates per shop, without detail data.
create or replace function public.console_shop_health()
returns table (
  shop_id uuid, slug text, name text, status public.shop_status, primary_host text,
  created_at timestamptz, last_order_at timestamptz, orders_7d bigint, active_devices bigint,
  billing_status public.billing_status, next_due_on date
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform private.require_platform_admin();
  return query
  select s.id, s.slug, s.name, s.status,
         (select d.hostname from public.shop_domains d where d.shop_id = s.id and d.is_primary),
         s.created_at,
         (select max(o.created_at) from public.orders o where o.shop_id = s.id),
         (select count(*) from public.orders o where o.shop_id = s.id and o.created_at > now() - interval '7 days'),
         (select count(*) from public.devices dv where dv.shop_id = s.id and dv.revoked_at is null),
         b.status, b.next_due_on
  from public.shops s
  left join public.shop_billing b on b.shop_id = s.id
  order by s.created_at desc;
end;
$$;

-- Anomalies for the console (vol. 08 §4): refusal rate and PIN failures.
create or replace function public.console_anomalies()
returns table (shop_id uuid, name text, refusal_rate_today numeric, pin_failures_1h bigint, open_tables_old bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  perform private.require_platform_admin();
  return query
  select s.id, s.name,
    (select case when count(*) = 0 then 0
                 else round(100.0 * count(*) filter (where o.status = 'rejected') / count(*), 1) end
       from public.orders o
      where o.shop_id = s.id and o.business_day = private.business_day(s.id, now())),
    (select coalesce(sum(dv.failed_attempts), 0)::bigint from public.devices dv
      where dv.shop_id = s.id and dv.failed_attempts_window_start > now() - interval '1 hour'),
    (select count(*) from public.table_sessions ts
      where ts.shop_id = s.id and ts.closed_at is null and ts.opened_at < now() - interval '12 hours')
  from public.shops s
  where s.status in ('active', 'onboarding');
end;
$$;

do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'console\_%'
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end;
$$;
