import 'server-only';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { resolveShopByHost } from '@/server/tenancy/resolve';
import { createPublicClient } from '@/server/supabase/public';
import { readSiteCookies } from './cookies';
import type { ResolvedShop } from '@/features/shops/schemas';

/** Shop of the current customer-site request (host from the rewritten URL). */
export const getSiteShop = cache(async (hostParam: string): Promise<ResolvedShop> => {
  const host = decodeURIComponent(hostParam);
  const shop = await resolveShopByHost(host);
  if (!shop || shop.status === 'archived') notFound();
  return shop;
});

export type SiteTable = {
  token: string;
  source: 'qr' | 'nfc';
  id: string;
  label: string;
  zone: string | null;
};

const openTable = (shopId: string, token: string) =>
  unstable_cache(
    async () => {
      const { data, error } = await createPublicClient().rpc('public_open_table', {
        p_shop_id: shopId,
        p_token: token,
      });
      if (error || !data) return null;
      return data as { table_id: string; table_label: string; zone: string | null };
    },
    ['open-table', shopId, token],
    { revalidate: 60, tags: [`tables:${shopId}`] },
  )();

/** Table of the customer (cookie), checked against the shop: null if absent or no longer valid. */
export const getSiteTable = cache(async (shop: ResolvedShop): Promise<SiteTable | null> => {
  if (shop.status !== 'active') return null;
  const { table } = await readSiteCookies();
  if (!table) return null;
  const opened = await openTable(shop.shop_id, table.token);
  if (!opened) return null;
  return { ...table, id: opened.table_id, label: opened.table_label, zone: opened.zone };
});

export function mediaBaseUrl(): string {
  const base = process.env.STORAGE_PUBLIC_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/shop-media`;
}
