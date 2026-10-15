import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { requirePlatformAdminPage } from '@/server/auth/guards';
import { shopPublicUrl } from '@/server/env';
import { vercelEnabled } from '@/server/vercel';
import { loadConsoleShop } from '@/features/console/queries';
import { ShopDetail } from '@/components/console/shop-detail';
import { Alert } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/dates';

export const metadata: Metadata = { title: 'Commerce' };

export default async function ConsoleShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopId: string }>;
  searchParams: Promise<{ cree?: string }>;
}) {
  const ctx = await requirePlatformAdminPage();
  const { shopId } = await params;
  const { cree } = await searchParams;
  if (!z.uuid().safeParse(shopId).success) notFound();
  const data = await loadConsoleShop(ctx, shopId);
  if (!data) notFound();
  const t = await getTranslations('console.create');
  const primary = data.domains.find((d) => d.isPrimary && d.verifiedAt);
  // Dates are formatted on the server, in the platform's time zone.
  const dates = new Set<string>([
    ...data.devices.flatMap((d) => [d.enrolledAt, d.lastSeenAt ?? d.enrolledAt]),
    ...data.owners.flatMap((o) => (o.lastSignInAt ? [o.lastSignInAt] : [])),
    ...data.audit.map((a) => a.createdAt),
  ]);
  const formatDate = Object.fromEntries(
    [...dates].map((d) => [d, formatDateTime(d, 'Europe/Paris')]),
  );
  return (
    <div className="space-y-4">
      {cree === 'invited' && <Alert tone="success">{t('invited')}</Alert>}
      {cree === 'attached' && <Alert tone="success">{t('attached')}</Alert>}
      <ShopDetail
        data={data}
        siteUrl={primary ? shopPublicUrl(primary.hostname, '/') : null}
        vercel={vercelEnabled()}
        formatDate={formatDate}
      />
    </div>
  );
}
