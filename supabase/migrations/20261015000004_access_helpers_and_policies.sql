-- Access helpers (private schema) and RLS policies for platform, shops and members.
-- Bible: vol. 04 §5, §6.
-- Divergence (ADR-009): a locked device no longer kills the sessions already open on it,
-- it only blocks new PIN logins (a customer typing wrong PINs must not stop the service).
-- Divergence (ADR-009): the pseudo-permission 'service' (floor or kitchen) is used for
-- order data, so that a "Stock"-only employee does not read orders (vol. 02 AUTH-04).

-- Shops the current user can access for a given permission.
-- p_perm: 'any' (any member), 'owner', 'service' (floor or kitchen), 'floor', 'kitchen', 'stock'.
create or replace function private.my_shop_ids(p_perm text)
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select m.shop_id
  from public.shop_members m
  join public.shops s on s.id = m.shop_id
  where m.user_id = (select auth.uid())
    and m.is_active
    and s.status <> 'archived'
    and (
      -- Owner: every permission, provided the session passed 2FA (aal2)
      (m.role = 'owner' and coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2')
      or
      -- Staff: required permission + valid staff session on a non-revoked device
      (m.role = 'staff'
        and p_perm <> 'owner'
        and (
          p_perm = 'any'
          or (p_perm = 'service' and m.permissions && array['floor', 'kitchen']::text[])
          or p_perm = any (m.permissions)
        )
        and exists (
          select 1
          from public.staff_sessions ss
          join public.devices d on d.id = ss.device_id
          where ss.session_id = nullif((select auth.jwt() ->> 'session_id'), '')::uuid
            and ss.member_id = m.id
            and ss.revoked_at is null
            and ss.expires_at > now()
            and d.revoked_at is null))
    );
$$;

-- Same, restricted to writable shops (a suspended shop is read-only).
create or replace function private.my_writable_shop_ids(p_perm text)
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.shops
  where id in (select private.my_shop_ids(p_perm))
    and status in ('onboarding', 'active');
$$;

create or replace function private.has_perm(p_shop_id uuid, p_perm text)
returns boolean
language sql stable security definer set search_path = ''
as $$ select p_shop_id in (select private.my_writable_shop_ids(p_perm)); $$;

create or replace function private.has_read_perm(p_shop_id uuid, p_perm text)
returns boolean
language sql stable security definer set search_path = ''
as $$ select p_shop_id in (select private.my_shop_ids(p_perm)); $$;

create or replace function private.current_member_id(p_shop_id uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.shop_members
  where shop_id = p_shop_id and user_id = (select auth.uid()) and is_active
  limit 1;
$$;

create or replace function private.is_platform_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()))
     and coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2';
$$;

-- `authenticated` cannot read the auth schema: go through a security definer function.
create or replace function private.has_verified_mfa()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from auth.mfa_factors f
                 where f.user_id = (select auth.uid()) and f.status = 'verified');
$$;

-- Business day of an instant, in the shop's time zone.
create or replace function private.business_day(p_shop_id uuid, p_at timestamptz)
returns date
language sql stable security definer set search_path = ''
as $$
  select ((p_at at time zone s.timezone) - (s.business_day_start - time '00:00'))::date
  from public.shops s where s.id = p_shop_id;
$$;

grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Privileges: anon has nothing; authenticated gets narrow column privileges.
-- ---------------------------------------------------------------------------
revoke all on public.platform_admins, public.shops, public.shop_domains, public.shop_themes,
  public.shop_billing, public.shop_members, public.devices, public.staff_sessions from anon;

revoke insert, update, delete on public.platform_admins from authenticated;
revoke insert, delete on public.shops from authenticated;
revoke update on public.shops from authenticated;
grant update (
  name, welcome_message, opening_hours_text, address_text, phone,
  accepting_orders, public_menu_enabled, order_note_enabled, sold_out_label, price_notice,
  business_day_start, kitchen_warning_minutes, kitchen_critical_minutes, floor_alert_repeat_seconds,
  staff_idle_lock_minutes, max_orders_per_client_10min, max_pending_orders_per_table,
  max_lines_per_order, max_quantity_per_line, max_order_total_cents,
  legal_name, legal_form, legal_siret, legal_address, legal_publication_director
) on public.shops to authenticated;
-- slug, status, features, timezone: console functions only.

revoke insert, delete on public.shop_themes from authenticated;
revoke update on public.shop_themes from authenticated;
grant update (preset, primary_color, accent_color, font_pair, radius, density, menu_layout,
  color_scheme) on public.shop_themes to authenticated;
-- logo_path / cover_path: written by the server after image processing.

revoke insert, update, delete on public.shop_members from authenticated;
grant update (display_name, color, permissions, is_active, deactivated_at)
  on public.shop_members to authenticated;
-- pin_hash and counters: server side only (secret key), after checking the owner role.

revoke insert, update, delete on public.devices from authenticated;
revoke insert, update, delete on public.staff_sessions from authenticated;
revoke delete on public.shop_billing from authenticated;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
create policy platform_admins_select_self on public.platform_admins
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy shops_select on public.shops
  for select to authenticated
  using (id in (select private.my_shop_ids('any')) or (select private.is_platform_admin()));

create policy shops_update_owner on public.shops
  for update to authenticated
  using (id in (select private.my_writable_shop_ids('owner')))
  with check (id in (select private.my_writable_shop_ids('owner')));

create policy shop_domains_select on public.shop_domains
  for select to authenticated
  using (shop_id in (select private.my_shop_ids('any')) or (select private.is_platform_admin()));
create policy shop_domains_insert_admin on public.shop_domains
  for insert to authenticated with check ((select private.is_platform_admin()));
create policy shop_domains_update_admin on public.shop_domains
  for update to authenticated
  using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));
create policy shop_domains_delete_admin on public.shop_domains
  for delete to authenticated using ((select private.is_platform_admin()));

create policy shop_themes_select on public.shop_themes
  for select to authenticated
  using (shop_id in (select private.my_shop_ids('any')) or (select private.is_platform_admin()));
create policy shop_themes_update_owner on public.shop_themes
  for update to authenticated
  using (shop_id in (select private.my_writable_shop_ids('owner')))
  with check (shop_id in (select private.my_writable_shop_ids('owner')));

create policy shop_billing_select_admin on public.shop_billing
  for select to authenticated using ((select private.is_platform_admin()));
create policy shop_billing_insert_admin on public.shop_billing
  for insert to authenticated with check ((select private.is_platform_admin()));
create policy shop_billing_update_admin on public.shop_billing
  for update to authenticated
  using ((select private.is_platform_admin())) with check ((select private.is_platform_admin()));

create policy shop_members_select on public.shop_members
  for select to authenticated
  using (
    shop_id in (select private.my_shop_ids('owner'))
    or (user_id = (select auth.uid()) and shop_id in (select private.my_shop_ids('any')))
    or (select private.is_platform_admin())
  );
create policy shop_members_update_owner on public.shop_members
  for update to authenticated
  using (shop_id in (select private.my_writable_shop_ids('owner')))
  with check (shop_id in (select private.my_writable_shop_ids('owner')));

create policy devices_select_owner on public.devices
  for select to authenticated
  using (shop_id in (select private.my_shop_ids('owner')) or (select private.is_platform_admin()));

create policy staff_sessions_select on public.staff_sessions
  for select to authenticated
  using (
    shop_id in (select private.my_shop_ids('owner'))
    or member_id in (select m.id from public.shop_members m where m.user_id = (select auth.uid()))
    or (select private.is_platform_admin())
  );

-- Restrictive policy: a user who enrolled 2FA but whose session is still aal1 reads nothing
-- on the most sensitive tables (vol. 04 §6.4).
create policy require_mfa_when_enrolled on public.shop_members
  as restrictive for all to authenticated
  using (coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2' or not (select private.has_verified_mfa()));
create policy require_mfa_when_enrolled on public.devices
  as restrictive for all to authenticated
  using (coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2' or not (select private.has_verified_mfa()));
create policy require_mfa_when_enrolled on public.staff_sessions
  as restrictive for all to authenticated
  using (coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2' or not (select private.has_verified_mfa()));
create policy require_mfa_when_enrolled on public.shop_billing
  as restrictive for all to authenticated
  using (coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2' or not (select private.has_verified_mfa()));
