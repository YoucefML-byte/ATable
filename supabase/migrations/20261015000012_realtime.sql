-- Realtime: minimal broadcast on the shop's private channel. Bible: vol. 04 §10, §10.1; vol. 03 §7.
-- The message never carries business data: screens reload the order through RLS.

create or replace function private.broadcast_order_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object('order_id', new.id, 'status', new.status, 'table_id', new.table_id),
    'order_changed',
    'shop:' || new.shop_id::text || ':orders',
    true -- private channel
  );
  return null;
end;
$$;

create trigger orders_broadcast
  after insert or update of status on public.orders
  for each row execute function private.broadcast_order_change();

-- Only active members with Floor or Kitchen (or the owner) can subscribe to a shop channel.
create policy shop_members_receive_order_broadcasts on realtime.messages
  for select to authenticated
  using (
    realtime.topic() ~ '^shop:[0-9a-f-]{36}:orders$'
    and split_part(realtime.topic(), ':', 2)::uuid in (select private.my_shop_ids('service'))
  );
