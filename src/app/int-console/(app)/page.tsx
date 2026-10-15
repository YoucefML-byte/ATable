import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { AlertTriangle } from 'lucide-react';
import { requirePlatformAdminPage } from '@/server/auth/guards';
import { Card } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/dates';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Commerces' };

const STATUS_TONE = {
  onboarding: 'bg-st-accepted-soft',
  active: 'bg-st-ready-soft',
  suspended: 'bg-st-warning-soft',
  archived: 'bg-line',
} as const;

/** Shops and their health (CON-01), with anomalies (vol. 08 §4). */
export default async function ConsoleHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { db } = await requirePlatformAdminPage();
  const t = await getTranslations('console');
  const q = ((await searchParams).q ?? '').trim().toLowerCase().slice(0, 80);
  const [health, anomalies] = await Promise.all([
    db.rpc('console_shop_health'),
    db.rpc('console_anomalies'),
  ]);
  const shops = (health.data ?? []).filter(
    (s) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.slug.includes(q) ||
      (s.primary_host ?? '').includes(q),
  );
  const alerts = (anomalies.data ?? []).flatMap((a) => {
    const out: string[] = [];
    if (Number(a.refusal_rate_today) >= 30)
      out.push(t('anomalies.refusal', { rate: String(a.refusal_rate_today).replace('.', ',') }));
    if (Number(a.pin_failures_1h) >= 10)
      out.push(t('anomalies.pin', { count: Number(a.pin_failures_1h) }));
    if (Number(a.open_tables_old) > 0)
      out.push(t('anomalies.openTables', { count: Number(a.open_tables_old) }));
    return out.map((text) => ({ shopId: a.shop_id, name: a.name, text }));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('shops.title')}</h1>
        <form method="get" role="search">
          <input
            type="search"
            name="q"
            defaultValue={q}
            aria-label={t('shops.search')}
            placeholder={t('shops.search')}
            className="border-line bg-surface min-h-12 w-72 rounded-lg border px-3"
          />
        </form>
      </div>

      <section aria-labelledby="anomalies" className="space-y-2">
        <h2 id="anomalies" className="text-lg font-semibold">
          {t('anomalies.title')}
        </h2>
        {alerts.length === 0 ? (
          <p className="text-muted">{t('anomalies.none')}</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {alerts.map((a, i) => (
              <li key={i}>
                <Link
                  href={`/commerces/${a.shopId}`}
                  className="bg-st-warning-soft flex min-h-12 items-center gap-3 rounded-lg p-3"
                >
                  <AlertTriangle aria-hidden className="text-st-warning h-5 w-5 shrink-0" />
                  <span>
                    <strong>{a.name}</strong> — {a.text}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card className="overflow-x-auto p-0">
        {shops.length === 0 ? (
          <p className="text-muted p-4">{t('shops.empty')}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                {[
                  t('shops.name'),
                  t('shops.status'),
                  t('shops.domain'),
                  t('shops.createdAt'),
                  t('shops.lastOrder'),
                  t('shops.orders7d'),
                  t('shops.devices'),
                  t('shops.billing'),
                  t('shops.nextDue'),
                ].map((h) => (
                  <th key={h} scope="col" className="p-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.shop_id} className="border-line border-t">
                  <td className="p-3">
                    <Link
                      href={`/commerces/${s.shop_id}`}
                      className="font-semibold underline-offset-2 hover:underline"
                    >
                      {s.name}
                    </Link>
                    <span className="text-muted block text-xs">{s.slug}</span>
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        'rounded px-2 py-0.5 text-xs font-semibold',
                        STATUS_TONE[s.status],
                      )}
                    >
                      {t(`status.${s.status}`)}
                    </span>
                  </td>
                  <td className="p-3">{s.primary_host ?? '—'}</td>
                  <td className="p-3 whitespace-nowrap">{s.created_at.slice(0, 10)}</td>
                  <td className="p-3">
                    {s.last_order_at
                      ? formatDateTime(s.last_order_at, 'Europe/Paris')
                      : t('shops.never')}
                  </td>
                  <td className="p-3 tabular-nums">{s.orders_7d}</td>
                  <td className="p-3 tabular-nums">{s.active_devices}</td>
                  <td className="p-3">
                    {s.billing_status ? t(`billingStatus.${s.billing_status}`) : '—'}
                  </td>
                  <td
                    className={cn(
                      'p-3',
                      s.next_due_on &&
                        s.next_due_on < new Date().toISOString().slice(0, 10) &&
                        'text-st-danger font-semibold',
                    )}
                  >
                    {s.next_due_on ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
