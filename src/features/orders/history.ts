import 'server-only';
import { z } from 'zod';
import type { UserClient } from '@/server/supabase/user';

// Order history (HIS-01): filters, pagination, timeline.

export const historyFilterSchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
  status: z.enum(['submitted', 'accepted', 'ready', 'served', 'rejected', 'cancelled']).optional(),
  table: z.uuid().optional(),
  number: z.coerce.number().int().min(1).max(100000).optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});
export type HistoryFilter = z.infer<typeof historyFilterSchema>;

export const PAGE_SIZE = 50;

export type HistoryOrder = {
  id: string;
  number: number;
  business_day: string;
  status: string;
  source: string;
  created_at: string;
  note: string | null;
  internal_reason: string | null;
  subtotal_cents: number;
  item_count: number;
  table_label: string;
  items: Array<{
    name: string;
    category: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
    options: string[];
  }>;
  events: Array<{
    to_status: string;
    actor_name: string | null;
    created_at: string;
    reason: string | null;
  }>;
};

const SELECT =
  'id, number, business_day, status, source, created_at, note, internal_reason, subtotal_cents, item_count, dining_tables(label), order_items(product_name, category_name, quantity, unit_price_cents, line_total_cents, position, order_item_options(option_name, quantity)), order_status_events(to_status, actor_name, created_at, reason, id)';

type Row = {
  id: string;
  number: number;
  business_day: string;
  status: string;
  source: string;
  created_at: string;
  note: string | null;
  internal_reason: string | null;
  subtotal_cents: number;
  item_count: number;
  dining_tables: { label: string } | null;
  order_items: Array<{
    product_name: string;
    category_name: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
    position: number;
    order_item_options: Array<{ option_name: string; quantity: number }>;
  }>;
  order_status_events: Array<{
    id: number;
    to_status: string;
    actor_name: string | null;
    created_at: string;
    reason: string | null;
  }>;
};

async function queryPage(
  db: UserClient,
  shopId: string,
  filter: HistoryFilter,
  from: number,
  to: number,
) {
  let query = db
    .from('orders')
    .select(SELECT, { count: 'exact' })
    .eq('shop_id', shopId)
    .gte('business_day', filter.from)
    .lte('business_day', filter.to)
    .order('created_at', { ascending: false });
  if (filter.status) query = query.eq('status', filter.status);
  if (filter.table) query = query.eq('table_id', filter.table);
  if (filter.number) query = query.eq('number', filter.number);
  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.code);
  return { rows: data as unknown as Row[], count: count ?? 0 };
}

/** One page of history, or every order of the period for the CSV export (chunks of 1000 rows). */
export async function queryHistory(
  db: UserClient,
  shopId: string,
  filter: HistoryFilter,
  opts: { all?: boolean } = {},
) {
  let rows: Row[] = [];
  let total = 0;
  if (opts.all) {
    for (let offset = 0; offset < 50_000; offset += 1000) {
      const chunk = await queryPage(db, shopId, filter, offset, offset + 999);
      rows = rows.concat(chunk.rows);
      total = chunk.count;
      if (chunk.rows.length < 1000) break;
    }
  } else {
    const page = await queryPage(
      db,
      shopId,
      filter,
      (filter.page - 1) * PAGE_SIZE,
      filter.page * PAGE_SIZE - 1,
    );
    rows = page.rows;
    total = page.count;
  }
  const orders: HistoryOrder[] = rows.map((r) => ({
    id: r.id,
    number: r.number,
    business_day: r.business_day,
    status: r.status,
    source: r.source,
    created_at: r.created_at,
    note: r.note,
    internal_reason: r.internal_reason,
    subtotal_cents: r.subtotal_cents,
    item_count: r.item_count,
    table_label: r.dining_tables?.label ?? '',
    items: [...r.order_items]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        name: i.product_name,
        category: i.category_name,
        quantity: i.quantity,
        unit_price_cents: i.unit_price_cents,
        line_total_cents: i.line_total_cents,
        options: i.order_item_options.map((o) =>
          o.quantity > 1 ? `${o.option_name} ×${o.quantity}` : o.option_name,
        ),
      })),
    events: [...r.order_status_events]
      .sort((a, b) => a.id - b.id)
      .map((e) => ({
        to_status: e.to_status,
        actor_name: e.actor_name,
        created_at: e.created_at,
        reason: e.reason,
      })),
  }));
  return { orders, total };
}
