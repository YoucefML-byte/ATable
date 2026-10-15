import { redirect } from 'next/navigation';
import { requireShopPage } from '@/server/auth/guards';

// Sends each person to their first section.
export default async function ShopIndex({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug);
  const base = `/${ctx.shop.slug}`;
  if (ctx.can('floor')) redirect(`${base}/salle`);
  if (ctx.can('kitchen')) redirect(`${base}/cuisine`);
  if (ctx.can('stock')) redirect(`${base}/disponibilites`);
  redirect('/');
}
