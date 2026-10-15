import 'server-only';
import { z } from 'zod';
import type { ShopContext } from '@/server/auth/guards';
import type { Range } from './period';

// Dashboard data (DSH-01, DSH-02): the aggregates are computed by SQL functions that check the
// owner role; nothing here bypasses RLS.

const n = z.coerce.number();
const overviewSchema = z.object({
  validated_amount_cents: n,
  validated_orders: n,
  avg_order_cents: n,
  table_sessions: n,
  avg_session_cents: n,
  rejected_orders: n,
  cancelled_orders: n,
  total_orders: n,
  reject_rate: n,
  avg_validation_seconds: n,
  avg_preparation_seconds: n,
});
export type Overview = z.infer<typeof overviewSchema>;

const schemas = {
  timeseries: z.array(z.object({ bucket: z.string(), amount_cents: n, orders: n })),
  heatmap: z.array(z.object({ dow: n, hour: n, orders: n })),
  top: z.array(
    z.object({
      product_id: z.string(),
      name: z.string(),
      category: z.string().nullable(),
      quantity: n,
      amount_cents: n,
    }),
  ),
  unsold: z.array(
    z.object({ product_id: z.string(), name: z.string(), category: z.string(), quantity: n }),
  ),
  byCategory: z.array(z.object({ category: z.string().nullable(), quantity: n, amount_cents: n })),
  byTable: z.array(
    z.object({
      table_id: z.string(),
      label: z.string(),
      zone: z.string().nullable(),
      sessions: n,
      orders: n,
      amount_cents: n,
      avg_session_cents: n,
    }),
  ),
  topOptions: z.array(z.object({ group: z.string(), option: z.string(), quantity: n })),
  rejects: z.array(
    z.object({ status: z.enum(['rejected', 'cancelled']), reason: z.string(), orders: n }),
  ),
  alerts: z.object({
    products_without_allergens: n,
    sold_out_over_24h: n,
    reject_rate_today: n,
    reject_rate_30d: n,
    tables_left_open: n,
  }),
};

export type Dashboard = {
  overview: Overview;
  previous: Overview;
  timeseries: z.infer<typeof schemas.timeseries>;
  heatmap: z.infer<typeof schemas.heatmap>;
  topByQuantity: z.infer<typeof schemas.top>;
  topByAmount: z.infer<typeof schemas.top>;
  unsold: z.infer<typeof schemas.unsold>;
  byCategory: z.infer<typeof schemas.byCategory>;
  byTable: z.infer<typeof schemas.byTable>;
  topOptions: z.infer<typeof schemas.topOptions>;
  rejects: z.infer<typeof schemas.rejects>;
  alerts: z.infer<typeof schemas.alerts>;
};

export async function loadDashboard(ctx: ShopContext, range: Range): Promise<Dashboard> {
  const { db, shop } = ctx;
  const p = { p_shop_id: shop.id, p_from: range.from, p_to: range.to };
  const calls = await Promise.all([
    db.rpc('analytics_overview', p),
    db.rpc('analytics_overview', {
      p_shop_id: shop.id,
      p_from: range.prevFrom,
      p_to: range.prevTo,
    }),
    db.rpc('analytics_timeseries', { ...p, p_bucket: range.bucket }),
    db.rpc('analytics_heatmap', p),
    db.rpc('analytics_top_products', { ...p, p_limit: 10, p_order_by: 'quantity' }),
    db.rpc('analytics_top_products', { ...p, p_limit: 10, p_order_by: 'amount' }),
    db.rpc('analytics_unsold_products', p),
    db.rpc('analytics_by_category', p),
    db.rpc('analytics_by_table', p),
    db.rpc('analytics_top_options', p),
    db.rpc('analytics_reject_reasons', p),
    db.rpc('analytics_alerts', { p_shop_id: shop.id }),
  ]);
  const failed = calls.find((c) => c.error);
  if (failed?.error) throw new Error(`analytics: ${failed.error.message}`);
  const [
    overview,
    previous,
    timeseries,
    heatmap,
    topQ,
    topA,
    unsold,
    byCategory,
    byTable,
    topOptions,
    rejects,
    alerts,
  ] = calls.map((c) => c.data);
  return {
    overview: overviewSchema.parse(overview),
    previous: overviewSchema.parse(previous),
    timeseries: schemas.timeseries.parse(timeseries),
    heatmap: schemas.heatmap.parse(heatmap),
    topByQuantity: schemas.top.parse(topQ),
    topByAmount: schemas.top.parse(topA),
    unsold: schemas.unsold.parse(unsold),
    byCategory: schemas.byCategory.parse(byCategory),
    byTable: schemas.byTable.parse(byTable),
    topOptions: schemas.topOptions.parse(topOptions),
    rejects: schemas.rejects.parse(rejects),
    alerts: schemas.alerts.parse(alerts),
  };
}
