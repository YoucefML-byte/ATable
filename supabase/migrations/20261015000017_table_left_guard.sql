-- ADR-009 §12: a customer who has left must not keep ordering for the table after it was closed.
-- The table cookie lasts 12 h; when the last order of a customer key on a table belongs to a table
-- session that has since been closed, a new order is refused (TABLE_CLOSED) until the customer
-- scans the QR code again, which issues a new customer key (src/app/int-site/[host]/t/[token]).

create or replace function private.client_left_table(p_table_id uuid, p_client_hash text, p_at timestamptz)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((
    select ts.closed_at is not null and ts.closed_at <= p_at
    from public.orders o
    join public.table_sessions ts on ts.id = o.table_session_id
    where o.table_id = p_table_id and o.client_key_hash = p_client_hash
      and o.created_at > p_at - interval '12 hours' and o.created_at <= p_at
    order by o.created_at desc
    limit 1
  ), false);
$$;

create or replace function private.orders_refuse_left_client()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if private.client_left_table(new.table_id, new.client_key_hash, new.created_at) then
    raise exception using errcode = 'P0001', message = 'TABLE_CLOSED';
  end if;
  return new;
end;
$$;

create trigger orders_refuse_left_client before insert on public.orders
  for each row execute function private.orders_refuse_left_client();

-- Used by the scan route: should this customer receive a new key?
create or replace function public.public_client_left_table(p_shop_id uuid, p_token text, p_client_key text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_table uuid;
begin
  if p_client_key is null or char_length(p_client_key) not between 32 and 128 then
    return false;
  end if;
  select tk.table_id into v_table from public.table_tokens tk
  where tk.token = p_token and tk.shop_id = p_shop_id and tk.revoked_at is null;
  if v_table is null then
    return false;
  end if;
  return private.client_left_table(v_table, encode(extensions.digest(p_client_key, 'sha256'), 'hex'), now());
end;
$$;

revoke all on function private.client_left_table(uuid, text, timestamptz) from public;
revoke all on function private.orders_refuse_left_client() from public;
revoke all on function public.public_client_left_table(uuid, text, text) from public;
grant execute on function public.public_client_left_table(uuid, text, text) to anon, authenticated;
