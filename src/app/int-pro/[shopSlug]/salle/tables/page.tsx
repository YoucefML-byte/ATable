import type { Metadata } from 'next';
import { requireShopPage } from '@/server/auth/guards';
import { listTablesAction } from '@/features/orders/staff-actions';
import { TablesView } from '@/components/pro/tables-view';

export const metadata: Metadata = { title: 'Tables' };

export default async function TablesPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug, 'floor');
  const res = await listTablesAction(ctx.shop.slug);
  return <TablesView shop={{ slug: ctx.shop.slug, name: ctx.shop.name, timezone: ctx.shop.timezone }} initial={res.ok ? res.value : []} />;
}
