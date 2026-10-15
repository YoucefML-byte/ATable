import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requireShopPage } from '@/server/auth/guards';
import { historyFilterSchema, PAGE_SIZE, queryHistory } from '@/features/orders/history';
import { addDaysIso, formatDateTime, formatTime, todayBusinessDay } from '@/lib/dates';
import { formatPrice } from '@/lib/money';
import { Button, Card, Input, Select } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Historique' };

type SearchParams = Record<string, string | undefined>;

// Order history (HIS-01): filterable list, pagination, timeline, CSV export. Owner only.
export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopSlug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug, 'owner');
  const sp = await searchParams;
  const t = await getTranslations('pro.history');
  const tc = await getTranslations('common');
  const today = todayBusinessDay({
    timezone: ctx.shop.timezone,
    businessDayStart: ctx.shop.business_day_start,
  });
  const parsed = historyFilterSchema.safeParse({
    from: sp.from || addDaysIso(today, -6),
    to: sp.to || today,
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.table ? { table: sp.table } : {}),
    ...(sp.number ? { number: sp.number } : {}),
    page: sp.page || '1',
  });
  const filter = parsed.success
    ? parsed.data
    : historyFilterSchema.parse({ from: addDaysIso(today, -6), to: today });
  const [{ orders, total }, { data: tables }] = await Promise.all([
    queryHistory(ctx.db, ctx.shop.id, filter),
    ctx.db
      .from('dining_tables')
      .select('id, label')
      .eq('shop_id', ctx.shop.id)
      .is('deleted_at', null)
      .order('position'),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (overrides: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged: Record<string, string | number | undefined> = {
      from: filter.from,
      to: filter.to,
      status: filter.status,
      table: filter.table,
      number: filter.number,
      page: filter.page,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged))
      if (v !== undefined && v !== '') p.set(k, String(v));
    return p.toString();
  };
  const exportQs = (mode: 'orders' | 'items') =>
    `${qs({ page: undefined })}&shop=${ctx.shop.slug}&mode=${mode}`;
  const tz = ctx.shop.timezone;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <Card>
        <form method="get" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:items-end">
          <label className="space-y-1">
            <span className="font-medium">{t('from')}</span>
            <Input type="date" name="from" defaultValue={filter.from} />
          </label>
          <label className="space-y-1">
            <span className="font-medium">{t('to')}</span>
            <Input type="date" name="to" defaultValue={filter.to} />
          </label>
          <label className="space-y-1">
            <span className="font-medium">{t('status')}</span>
            <Select name="status" defaultValue={filter.status ?? ''}>
              <option value="">{t('allStatuses')}</option>
              {(['submitted', 'accepted', 'ready', 'served', 'rejected', 'cancelled'] as const).map(
                (s) => (
                  <option key={s} value={s}>
                    {tc(`status.${s}`)}
                  </option>
                ),
              )}
            </Select>
          </label>
          <label className="space-y-1">
            <span className="font-medium">{t('table')}</span>
            <Select name="table" defaultValue={filter.table ?? ''}>
              <option value="">{t('allTables')}</option>
              {(tables ?? []).map((tb) => (
                <option key={tb.id} value={tb.id}>
                  {tb.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="space-y-1">
            <span className="font-medium">{t('number')}</span>
            <Input type="number" name="number" min={1} defaultValue={filter.number ?? ''} />
          </label>
          <Button type="submit">{t('filter')}</Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="font-medium">{t('export')} :</span>
          <a className="underline" href={`/api/export/orders?${exportQs('orders')}`}>
            {t('exportOrders')}
          </a>
          <a className="underline" href={`/api/export/orders?${exportQs('items')}`}>
            {t('exportItems')}
          </a>
        </div>
      </Card>

      {orders.length === 0 ? (
        <p className="text-muted">{t('empty')}</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id}>
              <details className="border-line bg-surface rounded-xl border">
                <summary className="flex min-h-14 cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 p-3">
                  <span className="tabular font-semibold">
                    #{String(o.number).padStart(3, '0')}
                  </span>
                  <span>{formatDateTime(o.created_at, tz)}</span>
                  <span className="font-medium">{o.table_label}</span>
                  <span
                    className={
                      o.status === 'rejected' || o.status === 'cancelled'
                        ? 'text-st-danger'
                        : 'text-muted'
                    }
                  >
                    {tc(`status.${o.status as 'served'}`)}
                  </span>
                  <span className="tabular ml-auto font-semibold">
                    {formatPrice(o.subtotal_cents)}
                  </span>
                </summary>
                <div className="border-line grid gap-4 border-t p-3 md:grid-cols-2">
                  <ul className="space-y-1">
                    {o.items.map((i, idx) => (
                      <li key={idx} className="flex justify-between gap-2">
                        <span>
                          {i.quantity} × {i.name}
                          {i.options.length > 0 && (
                            <span className="text-muted block text-sm">{i.options.join(', ')}</span>
                          )}
                        </span>
                        <span className="tabular">{formatPrice(i.line_total_cents)}</span>
                      </li>
                    ))}
                    {o.note && (
                      <li className="bg-st-warning-soft rounded-lg p-2 text-sm">
                        <span className="font-semibold">{t('note')} : </span>« {o.note} »
                      </li>
                    )}
                  </ul>
                  <div>
                    <p className="font-semibold">{t('timeline')}</p>
                    <ol className="mt-1 space-y-1 text-sm">
                      {o.events.map((e, idx) => (
                        <li key={idx}>
                          {t(`event.${e.to_status as 'accepted'}`, {
                            name: e.actor_name ?? '—',
                            time: formatTime(e.created_at, tz),
                          })}
                        </li>
                      ))}
                    </ol>
                    {o.internal_reason && (
                      <p className="text-muted mt-2 text-sm">
                        {t('reason', { reason: o.internal_reason })}
                      </p>
                    )}
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <nav
        className="flex items-center justify-between gap-2"
        aria-label={t('page', { page: filter.page })}
      >
        {filter.page > 1 ? (
          <Link
            className="border-line inline-flex min-h-12 items-center rounded-lg border px-4 font-semibold"
            href={`?${qs({ page: filter.page - 1 })}`}
          >
            {t('previous')}
          </Link>
        ) : (
          <span />
        )}
        <span className="text-muted text-sm">
          {t('page', { page: filter.page })} / {pages}
        </span>
        {filter.page < pages ? (
          <Link
            className="border-line inline-flex min-h-12 items-center rounded-lg border px-4 font-semibold"
            href={`?${qs({ page: filter.page + 1 })}`}
          >
            {t('next')}
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
