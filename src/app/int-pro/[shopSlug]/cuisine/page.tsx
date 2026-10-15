import type { Metadata } from 'next';
import { requireShopPage } from '@/server/auth/guards';
import { listActiveOrdersAction } from '@/features/orders/staff-actions';
import { KitchenBoard } from '@/components/pro/kitchen-board';
import { env } from '@/server/env';

export const metadata: Metadata = { title: 'Cuisine' };

export default async function KitchenPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug, 'kitchen');
  const res = await listActiveOrdersAction(ctx.shop.slug);
  const initial = res.ok
    ? res.value
    : {
        orders: [],
        // eslint-disable-next-line react-hooks/purity -- server component: rendered once per request
        serverNow: Date.now(),
        acceptingOrders: ctx.shop.accepting_orders,
        kitchenWarningMinutes: ctx.shop.kitchen_warning_minutes,
        kitchenCriticalMinutes: ctx.shop.kitchen_critical_minutes,
      };
  return (
    <KitchenBoard
      shop={{ id: ctx.shop.id, slug: ctx.shop.slug }}
      initial={initial}
      supabaseUrl={env.NEXT_PUBLIC_SUPABASE_URL}
      publishableKey={env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
    />
  );
}
