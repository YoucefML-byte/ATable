import type { Metadata } from 'next';
import { requireShopPage } from '@/server/auth/guards';
import { getCurrentDevice } from '@/server/staff/device';
import { formatDateTime } from '@/lib/dates';
import { DevicesView } from '@/components/pro/devices-view';

export const metadata: Metadata = { title: 'Appareils' };

export default async function DevicesPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug, 'owner');
  const [{ data }, current] = await Promise.all([
    ctx.db.from('devices').select('id, name, enrolled_at, last_seen_at, locked, revoked_at').eq('shop_id', ctx.shop.id).order('enrolled_at', { ascending: false }),
    getCurrentDevice(),
  ]);
  const tz = ctx.shop.timezone;
  return (
    <DevicesView
      shopSlug={ctx.shop.slug}
      currentDeviceId={current && current.shop_id === ctx.shop.id ? current.id : null}
      devices={(data ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        enrolled_at: d.enrolled_at,
        enrolledLabel: formatDateTime(d.enrolled_at, tz),
        lastSeenLabel: d.last_seen_at ? formatDateTime(d.last_seen_at, tz) : null,
        locked: d.locked,
        revoked: !!d.revoked_at,
      }))}
    />
  );
}
