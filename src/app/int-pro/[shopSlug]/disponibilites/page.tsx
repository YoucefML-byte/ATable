import type { Metadata } from 'next';
import { requireShopPage } from '@/server/auth/guards';
import { listAvailabilityAction } from '@/features/catalog/stock-actions';
import { AvailabilityView } from '@/components/pro/availability-view';

export const metadata: Metadata = { title: 'Disponibilités' };

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug, 'stock');
  const res = await listAvailabilityAction(ctx.shop.slug);
  return (
    <AvailabilityView
      shopSlug={ctx.shop.slug}
      initial={res.ok ? res.value : { categories: [], groups: [] }}
      isOwner={ctx.isOwner}
    />
  );
}
