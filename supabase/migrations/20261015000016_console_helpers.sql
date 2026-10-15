-- Console helper (CON-02): finds an existing account by e-mail so that an owner of several shops
-- is attached instead of invited twice. Reserved to the secret key (service_role): never exposed
-- to authenticated users, it would allow e-mail enumeration.
create or replace function public.auth_user_id_by_email(p_email text)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(btrim(p_email)) limit 1;
$$;

revoke all on function public.auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.auth_user_id_by_email(text) to service_role;
