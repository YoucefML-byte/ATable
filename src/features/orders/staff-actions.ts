'use server';
import 'server-only';
import { z } from 'zod';
import { requireShopAction, requireStaffPermission } from '@/server/auth/guards';
import { err, ok, type ActionResult } from '@/lib/result';
import { mapDbError, parseTransitionDetail } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { transitionInputSchema } from './schemas';
import { revalidateHostsOfShop } from '@/server/tenancy/invalidate';
import type { ActiveOrdersSnapshot, StaffOrder, TableOverview } from './staff-types';

const ORDER_SELECT =
  'id, number, status, table_id, table_session_id, created_at, accepted_at, ready_at, note, subtotal_cents, dining_tables(label, zone), order_items(id, product_name, quantity, prep_station, position, order_item_options(option_name, group_name, quantity))';

type Row = {
  id: string;
  number: number;
  status: StaffOrder['status'];
  table_id: string;
  table_session_id: string;
  created_at: string;
  accepted_at: string | null;
  ready_at: string | null;
  note: string | null;
  subtotal_cents: number;
  dining_tables: { label: string; zone: string | null } | null;
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    prep_station: 'kitchen' | 'bar' | 'none';
    position: number;
    order_item_options: Array<{ option_name: string; group_name: string; quantity: number }>;
  }>;
};

function toDto(row: Row): StaffOrder {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    table_id: row.table_id,
    table_label: row.dining_tables?.label ?? '?',
    zone: row.dining_tables?.zone ?? null,
    table_session_id: row.table_session_id,
    created_at: row.created_at,
    accepted_at: row.accepted_at,
    ready_at: row.ready_at,
    note: row.note,
    subtotal_cents: row.subtotal_cents,
    items: [...row.order_items]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        id: i.id,
        name: i.product_name,
        quantity: i.quantity,
        prep_station: i.prep_station,
        options: i.order_item_options.map((o) => ({
          name: o.option_name,
          group: o.group_name,
          quantity: o.quantity,
        })),
      })),
  };
}

/** Active orders (submitted, accepted, ready) — reloaded on every realtime message and every 20 s. */
export async function listActiveOrdersAction(
  shopSlug: string,
): Promise<ActionResult<ActiveOrdersSnapshot>> {
  const res = await requireShopAction(z.string().max(40).parse(shopSlug));
  if (!res.ok) return res;
  const ctx = res.value;
  if (!ctx.can('floor') && !ctx.can('kitchen')) return err('FORBIDDEN', 'FORBIDDEN');
  const [{ data, error }, { data: shop }] = await Promise.all([
    ctx.db
      .from('orders')
      .select(ORDER_SELECT)
      .eq('shop_id', ctx.shop.id)
      .in('status', ['submitted', 'accepted', 'ready'])
      .order('created_at', { ascending: true })
      .limit(300),
    ctx.db
      .from('shops')
      .select('accepting_orders, kitchen_warning_minutes, kitchen_critical_minutes')
      .eq('id', ctx.shop.id)
      .single(),
  ]);
  if (error) {
    logger.error({ event: 'orders.list_failed', shopId: ctx.shop.id, code: error.code });
    return err('INTERNAL', 'INTERNAL');
  }
  return ok({
    orders: (data as unknown as Row[]).map(toDto),
    serverNow: Date.now(),
    acceptingOrders: shop?.accepting_orders ?? false,
    kitchenWarningMinutes: shop?.kitchen_warning_minutes ?? 10,
    kitchenCriticalMinutes: shop?.kitchen_critical_minutes ?? 20,
  });
}

export type TransitionResult = { status: string } | { alreadyHandledBy: string | null };

/** Applies a status change; the state machine and permissions are enforced by the database. */
export async function transitionOrderAction(
  input: z.input<typeof transitionInputSchema>,
): Promise<ActionResult<TransitionResult>> {
  const parsed = transitionInputSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const perm = parsed.data.to === 'ready' ? null : 'floor';
  const res = perm
    ? await requireStaffPermission(parsed.data.shopSlug, perm)
    : await requireShopAction(parsed.data.shopSlug);
  if (!res.ok) return res;
  if (!perm && !res.value.can('floor') && !res.value.can('kitchen'))
    return err('FORBIDDEN', 'FORBIDDEN');
  const { data, error } = await res.value.db.rpc('staff_transition_order', {
    p_order_id: parsed.data.orderId,
    p_to: parsed.data.to,
    ...(parsed.data.reason ? { p_reason: parsed.data.reason } : {}),
  });
  if (error) {
    const mapped = mapDbError(error);
    if (mapped.code === 'INVALID_TRANSITION') {
      return ok({ alreadyHandledBy: parseTransitionDetail(mapped.detail).actor });
    }
    return err(mapped.code, mapped.code);
  }
  return ok({ status: String((data as { status?: string } | null)?.status ?? parsed.data.to) });
}

/** Opens or closes the orders of the shop (SAL-05), logged. */
export async function setAcceptingOrdersAction(
  shopSlug: string,
  value: boolean,
): Promise<ActionResult<boolean>> {
  const res = await requireStaffPermission(z.string().max(40).parse(shopSlug), 'floor');
  if (!res.ok) return res;
  const { error } = await res.value.db.rpc('staff_set_accepting_orders', {
    p_shop_id: res.value.shop.id,
    p_value: z.boolean().parse(value),
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  await revalidateHostsOfShop(res.value.db, res.value.shop.id);
  return ok(value);
}

/** Tables with their open session (SAL-04). */
export async function listTablesAction(shopSlug: string): Promise<ActionResult<TableOverview[]>> {
  const res = await requireStaffPermission(z.string().max(40).parse(shopSlug), 'floor');
  if (!res.ok) return res;
  const ctx = res.value;
  const [{ data: tables }, { data: sessions }] = await Promise.all([
    ctx.db
      .from('dining_tables')
      .select('id, label, zone, position')
      .eq('shop_id', ctx.shop.id)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('position'),
    ctx.db
      .from('table_sessions')
      .select('id, table_id, opened_at, orders(status, subtotal_cents)')
      .eq('shop_id', ctx.shop.id)
      .is('closed_at', null),
  ]);
  const byTable = new Map(
    (sessions ?? []).map((s) => {
      const orders = (s.orders ?? []) as Array<{ status: string; subtotal_cents: number }>;
      return [
        s.table_id,
        {
          id: s.id,
          opened_at: s.opened_at,
          orders: orders.length,
          pending: orders.filter((o) => o.status === 'submitted').length,
          validated_cents: orders
            .filter((o) => ['accepted', 'ready', 'served'].includes(o.status))
            .reduce((a, o) => a + o.subtotal_cents, 0),
        },
      ] as const;
    }),
  );
  return ok(
    (tables ?? []).map((t) => ({
      id: t.id,
      label: t.label,
      zone: t.zone,
      session: byTable.get(t.id) ?? null,
    })),
  );
}

/** All orders of a table session, for the detail and the printable summary. */
export async function getSessionOrdersAction(
  shopSlug: string,
  sessionId: string,
): Promise<ActionResult<StaffOrder[]>> {
  const res = await requireStaffPermission(z.string().max(40).parse(shopSlug), 'floor');
  if (!res.ok) return res;
  const { data, error } = await res.value.db
    .from('orders')
    .select(ORDER_SELECT)
    .eq('shop_id', res.value.shop.id)
    .eq('table_session_id', z.uuid().parse(sessionId))
    .order('created_at');
  if (error) return err('INTERNAL', 'INTERNAL');
  return ok((data as unknown as Row[]).map(toDto));
}

/** Frees a table once paid (SAL-04); refused while an order is pending. */
export async function closeTableAction(
  shopSlug: string,
  sessionId: string,
): Promise<ActionResult<number>> {
  const res = await requireStaffPermission(z.string().max(40).parse(shopSlug), 'floor');
  if (!res.ok) return res;
  const { data, error } = await res.value.db.rpc('staff_close_table_session', {
    p_session_id: z.uuid().parse(sessionId),
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  return ok(Number((data as { total_cents?: number } | null)?.total_cents ?? 0));
}
