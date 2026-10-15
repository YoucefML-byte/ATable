import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { AlertTriangle } from 'lucide-react';
import { requireShopPage } from '@/server/auth/guards';
import { PERIODS, changePercent, resolvePeriod } from '@/features/analytics/period';
import { loadDashboard, type Overview } from '@/features/analytics/queries';
import { CategoryChart, EvolutionChart, TopProductsChart } from '@/components/pro/dashboard/charts';
import { Card } from '@/components/ui/primitives';
import { todayBusinessDay } from '@/lib/dates';
import { formatPrice } from '@/lib/money';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Tableau de bord' };

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

type SearchParams = Promise<{ period?: string; from?: string; to?: string }>;

/** Dashboard (DSH-01, DSH-02): key figures with comparison, charts and attention boxes. */
export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopSlug: string }>;
  searchParams: SearchParams;
}) {
  const { shopSlug } = await params;
  const sp = await searchParams;
  const ctx = await requireShopPage(shopSlug, 'owner');
  const t = await getTranslations('pro.dashboard');
  const today = todayBusinessDay({
    timezone: ctx.shop.timezone,
    businessDayStart: ctx.shop.business_day_start,
  });
  const range = resolvePeriod(sp, today);
  const data = await loadDashboard(ctx, range);
  const base = `/${ctx.shop.slug}`;

  const duration = (seconds: number) =>
    seconds >= 60
      ? t('minutes', { m: Math.floor(seconds / 60), s: String(seconds % 60).padStart(2, '0') })
      : t('seconds', { s: seconds });
  const kpis: Array<{
    key: keyof Overview;
    label: string;
    format: (v: number) => string;
    lowerIsBetter?: boolean;
  }> = [
    { key: 'validated_amount_cents', label: t('kpi.amount'), format: formatPrice },
    { key: 'validated_orders', label: t('kpi.orders'), format: String },
    { key: 'avg_order_cents', label: t('kpi.avgOrder'), format: formatPrice },
    { key: 'avg_session_cents', label: t('kpi.avgSession'), format: formatPrice },
    { key: 'table_sessions', label: t('kpi.sessions'), format: String },
    {
      key: 'reject_rate',
      label: t('kpi.rejectRate'),
      format: (v) => `${String(v).replace('.', ',')} %`,
      lowerIsBetter: true,
    },
    {
      key: 'avg_validation_seconds',
      label: t('kpi.validationDelay'),
      format: duration,
      lowerIsBetter: true,
    },
    {
      key: 'avg_preparation_seconds',
      label: t('kpi.prepTime'),
      format: duration,
      lowerIsBetter: true,
    },
  ];

  const alerts: Array<{ text: string; href: string }> = [];
  if (data.alerts.products_without_allergens > 0)
    alerts.push({
      text: t('alerts.allergens', { count: data.alerts.products_without_allergens }),
      href: `${base}/carte`,
    });
  if (data.alerts.sold_out_over_24h > 0)
    alerts.push({
      text: t('alerts.soldOut', { count: data.alerts.sold_out_over_24h }),
      href: `${base}/disponibilites`,
    });
  if (data.alerts.reject_rate_today > Math.max(15, data.alerts.reject_rate_30d * 2)) {
    alerts.push({
      text: t('alerts.rejectRate', {
        rate: String(data.alerts.reject_rate_today).replace('.', ','),
      }),
      href: `${base}/historique`,
    });
  }
  if (data.alerts.tables_left_open > 0)
    alerts.push({
      text: t('alerts.openTables', { count: data.alerts.tables_left_open }),
      href: `${base}/salle/tables`,
    });

  const maxHeat = Math.max(1, ...data.heatmap.map((h) => h.orders));
  const heat = new Map(data.heatmap.map((h) => [`${h.dow}-${h.hour}`, h.orders]));
  const hours = Array.from({ length: 24 }, (_, h) => h);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <form method="get" className="flex flex-wrap items-end gap-2">
          <label className="space-y-1">
            <span className="block text-sm font-medium">{t('period')}</span>
            <select
              name="period"
              defaultValue={range.period}
              className="border-line bg-surface min-h-12 rounded-lg border px-3"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {t(`periods.${p}`)}
                </option>
              ))}
            </select>
          </label>
          <input
            type="date"
            name="from"
            aria-label={t('from')}
            defaultValue={range.from}
            max={today}
            className="border-line bg-surface min-h-12 rounded-lg border px-3"
          />
          <input
            type="date"
            name="to"
            aria-label={t('to')}
            defaultValue={range.to}
            max={today}
            className="border-line bg-surface min-h-12 rounded-lg border px-3"
          />
          <button
            type="submit"
            className="bg-brand text-brand-fg min-h-12 rounded-lg px-4 font-semibold"
          >
            {t('apply')}
          </button>
        </form>
      </div>
      <p className="text-muted text-sm">{t('rangeLabel', { from: range.from, to: range.to })}</p>

      {alerts.length > 0 && (
        <ul className="grid gap-2 md:grid-cols-2" aria-label={t('alertsTitle')}>
          {alerts.map((a) => (
            <li key={a.href + a.text}>
              <Link
                href={a.href}
                className="bg-st-warning-soft flex min-h-12 items-center gap-3 rounded-lg p-3 font-medium"
              >
                <AlertTriangle aria-hidden className="text-st-warning h-5 w-5 shrink-0" />
                {a.text}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={t('kpiTitle')}>
        {kpis.map((k) => {
          const value = data.overview[k.key];
          const change = changePercent(value, data.previous[k.key]);
          const good =
            change === null || change === 0 ? null : k.lowerIsBetter ? change < 0 : change > 0;
          return (
            <Card key={k.key} className="space-y-1">
              <p className="text-muted text-sm">{k.label}</p>
              <p className="text-2xl font-bold tabular-nums">{k.format(value)}</p>
              <p
                className={cn(
                  'text-sm',
                  good === null ? 'text-muted' : good ? 'text-st-ready' : 'text-st-danger',
                )}
              >
                {change === null
                  ? '—'
                  : `${change > 0 ? '+' : ''}${String(change).replace('.', ',')} %`}{' '}
                <span className="text-muted">{t('comparedTo')}</span>
              </p>
            </Card>
          );
        })}
      </section>

      <Card>
        <h2 className="mb-2 font-semibold">{t('evolution')}</h2>
        <EvolutionChart data={data.timeseries} />
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-2 font-semibold">{t('heatmap')}</h2>
        {data.heatmap.length === 0 ? (
          <p className="text-muted">{t('noData')}</p>
        ) : (
          <table className="border-separate border-spacing-0.5 text-xs">
            <thead>
              <tr>
                <th />
                {hours.map((h) => (
                  <th key={h} scope="col" className="text-muted w-6 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, d) => (
                <tr key={day}>
                  <th scope="row" className="pr-2 text-left font-medium">
                    {day}
                  </th>
                  {hours.map((h) => {
                    const count = heat.get(`${d + 1}-${h}`) ?? 0;
                    return (
                      <td
                        key={h}
                        title={t('heatmapCell', { day, hour: h, count })}
                        aria-label={t('heatmapCell', { day, hour: h, count })}
                        className="h-6 w-6 rounded-sm"
                        style={{
                          background:
                            count === 0
                              ? 'var(--border)'
                              : `color-mix(in srgb, var(--brand) ${Math.round(15 + (count / maxHeat) * 85)}%, transparent)`,
                        }}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="text-muted mt-1 text-xs">{t('heatmapLegend')}</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">{t('topProducts')}</h2>
          <TopProductsChart byQuantity={data.topByQuantity} byAmount={data.topByAmount} />
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">{t('byCategory')}</h2>
          <CategoryChart data={data.byCategory} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-x-auto">
          <h2 className="mb-2 font-semibold">{t('byTable')}</h2>
          <SimpleTable
            empty={t('noData')}
            head={[
              t('table'),
              t('zone'),
              t('kpi.sessions'),
              t('kpi.orders'),
              t('amount'),
              t('kpi.avgSession'),
            ]}
            rows={data.byTable.map((r) => [
              r.label,
              r.zone ?? '—',
              r.sessions,
              r.orders,
              formatPrice(r.amount_cents),
              formatPrice(r.avg_session_cents),
            ])}
          />
        </Card>
        <Card className="overflow-x-auto">
          <h2 className="mb-2 font-semibold">{t('flop')}</h2>
          <SimpleTable
            empty={t('noData')}
            head={[t('product'), t('category'), t('quantity')]}
            rows={data.unsold.map((r) => [r.name, r.category, r.quantity])}
          />
        </Card>
        <Card className="overflow-x-auto">
          <h2 className="mb-2 font-semibold">{t('topOptions')}</h2>
          <SimpleTable
            empty={t('noData')}
            head={[t('group'), t('option'), t('quantity')]}
            rows={data.topOptions.map((r) => [r.group, r.option, r.quantity])}
          />
        </Card>
        <Card className="overflow-x-auto">
          <h2 className="mb-2 font-semibold">{t('rejectReasons')}</h2>
          <SimpleTable
            empty={t('noData')}
            head={[t('status'), t('reason'), t('count')]}
            rows={data.rejects.map((r) => [
              r.status === 'rejected' ? t('rejected') : t('cancelled'),
              r.reason || t('noReason'),
              r.orders,
            ])}
          />
        </Card>
      </div>
    </div>
  );
}

function SimpleTable({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: Array<Array<string | number>>;
  empty: string;
}) {
  if (rows.length === 0) return <p className="text-muted">{empty}</p>;
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} scope="col" className="p-1 font-semibold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-line border-t">
            {r.map((c, j) => (
              <td key={j} className="p-1 tabular-nums">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
