import type { Metadata } from 'next';
import { requireShopPage } from '@/server/auth/guards';
import { loadAdminCatalog } from '@/features/catalog/admin-queries';
import { mediaBaseUrl } from '@/server/site/context';
import { CatalogEditor } from '@/components/pro/catalog/catalog-editor';

export const metadata: Metadata = { title: 'Carte' };

export default async function CatalogPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug, 'owner');
  const catalog = await loadAdminCatalog(ctx);
  if (!catalog) throw new Error('catalog.load_failed');
  return (
    <CatalogEditor
      shopSlug={ctx.shop.slug}
      timezone={ctx.shop.timezone}
      mediaBase={mediaBaseUrl()}
      catalog={catalog}
    />
  );
}
