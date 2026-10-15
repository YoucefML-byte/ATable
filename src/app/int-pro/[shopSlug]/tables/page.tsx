import type { Metadata } from 'next';
import { requireShopPage } from '@/server/auth/guards';
import { shopPublicUrl } from '@/server/env';
import { TablesAdminView, type TableAdmin } from '@/components/pro/tables-admin-view';

export const metadata: Metadata = { title: 'Tables et QR codes' };

export default async function TablesAdminPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug, 'owner');
  const { db, shop } = ctx;
  const [tables, tokens, domains] = await Promise.all([
    db
      .from('dining_tables')
      .select('id, label, zone, seats, is_active, position')
      .eq('shop_id', shop.id)
      .is('deleted_at', null)
      .order('position'),
    db
      .from('table_tokens')
      .select('table_id, token, created_at')
      .eq('shop_id', shop.id)
      .is('revoked_at', null),
    db
      .from('shop_domains')
      .select('hostname, is_primary')
      .eq('shop_id', shop.id)
      .order('is_primary', { ascending: false }),
  ]);
  const host = domains.data?.[0]?.hostname ?? null;
  const tokenOf = new Map((tokens.data ?? []).map((t) => [t.table_id, t]));
  const rows: TableAdmin[] = (tables.data ?? []).map((t) => {
    const token = tokenOf.get(t.id);
    return {
      id: t.id,
      label: t.label,
      zone: t.zone,
      seats: t.seats,
      isActive: t.is_active,
      url: host && token ? shopPublicUrl(host, `/t/${token.token}`) : null,
      nfcUrl: host && token ? shopPublicUrl(host, `/t/${token.token}?s=nfc`) : null,
    };
  });
  return (
    <TablesAdminView
      shopSlug={shop.slug}
      shopName={shop.name}
      tables={rows}
      hasDomain={host !== null}
    />
  );
}
