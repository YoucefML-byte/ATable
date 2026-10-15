'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPrice } from '@/lib/money';

const euroTick = (v: number) =>
  `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v)} €`;
import { cn } from '@/lib/cn';

// Charts of the dashboard (DSH-01). Each chart has its data table ("Voir les données") for screen
// readers and for those who prefer figures (vol. 07 §7).

function DataTable({ head, rows }: { head: string[]; rows: Array<Array<string | number>> }) {
  const t = useTranslations('pro.dashboard');
  return (
    <details className="mt-2">
      <summary className="min-h-10 cursor-pointer text-sm font-medium">{t('seeData')}</summary>
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h} className="p-1 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-line border-t">
                {r.map((c, j) => (
                  <td key={j} className="p-1">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

const bucketLabel = (b: string) =>
  b.includes('T')
    ? `${b.slice(11, 13)} h`
    : b.length === 7
      ? b
      : `${b.slice(8, 10)}/${b.slice(5, 7)}`;

export function EvolutionChart({
  data,
}: {
  data: Array<{ bucket: string; amount_cents: number; orders: number }>;
}) {
  const t = useTranslations('pro.dashboard');
  if (data.length === 0) return <p className="text-muted">{t('noData')}</p>;
  const rows = data.map((d) => ({
    ...d,
    label: bucketLabel(d.bucket),
    euros: d.amount_cents / 100,
  }));
  return (
    <>
      <div className="h-64" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ left: 8, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--muted-fg)' }} />
            <YAxis
              tickFormatter={euroTick}
              tick={{ fontSize: 12, fill: 'var(--muted-fg)' }}
              width={72}
            />
            <Tooltip
              formatter={(v) => formatPrice(Math.round(Number(v) * 100))}
              labelStyle={{ color: '#111' }}
            />
            <Line
              type="monotone"
              dataKey="euros"
              name={t('amount')}
              stroke="var(--brand)"
              strokeWidth={3}
              dot={rows.length < 40}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DataTable
        head={[t('period'), t('amount'), t('kpi.orders')]}
        rows={rows.map((r) => [r.label, formatPrice(r.amount_cents), r.orders])}
      />
    </>
  );
}

export function TopProductsChart({
  byQuantity,
  byAmount,
}: {
  byQuantity: Array<{ name: string; quantity: number; amount_cents: number }>;
  byAmount: Array<{ name: string; quantity: number; amount_cents: number }>;
}) {
  const t = useTranslations('pro.dashboard');
  const [mode, setMode] = useState<'quantity' | 'amount'>('quantity');
  const data = (mode === 'quantity' ? byQuantity : byAmount).map((d) => ({
    ...d,
    value: mode === 'quantity' ? d.quantity : d.amount_cents / 100,
  }));
  return (
    <>
      <div role="radiogroup" aria-label={t('topProducts')} className="mb-2 flex gap-2">
        {(['quantity', 'amount'] as const).map((m) => (
          <button
            key={m}
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'min-h-10 rounded-lg px-3 text-sm',
              mode === m ? 'bg-brand text-brand-fg font-semibold' : 'border-line border',
            )}
          >
            {m === 'quantity' ? t('byQuantity') : t('byAmount')}
          </button>
        ))}
      </div>
      {data.length === 0 ? (
        <p className="text-muted">{t('noData')}</p>
      ) : (
        <div style={{ height: Math.max(160, data.length * 32) }} aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 12, fill: 'var(--fg)' }}
              />
              <Tooltip
                formatter={(v) =>
                  mode === 'quantity' ? String(v) : formatPrice(Math.round(Number(v) * 100))
                }
                labelStyle={{ color: '#111' }}
              />
              <Bar
                dataKey="value"
                fill="var(--brand)"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <DataTable
        head={[t('product'), t('quantity'), t('amount')]}
        rows={data.map((d) => [d.name, d.quantity, formatPrice(d.amount_cents)])}
      />
    </>
  );
}

export function CategoryChart({
  data,
}: {
  data: Array<{ category: string | null; quantity: number; amount_cents: number }>;
}) {
  const t = useTranslations('pro.dashboard');
  if (data.length === 0) return <p className="text-muted">{t('noData')}</p>;
  const rows = data.map((d) => ({ name: d.category ?? '—', euros: d.amount_cents / 100, ...d }));
  return (
    <>
      <div className="h-56" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-fg)' }} />
            <YAxis
              tickFormatter={euroTick}
              tick={{ fontSize: 12, fill: 'var(--muted-fg)' }}
              width={72}
            />
            <Tooltip
              formatter={(v) => formatPrice(Math.round(Number(v) * 100))}
              labelStyle={{ color: '#111' }}
            />
            <Bar
              dataKey="euros"
              fill="var(--accent)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable
        head={[t('category'), t('quantity'), t('amount')]}
        rows={rows.map((r) => [r.name, r.quantity, formatPrice(r.amount_cents)])}
      />
    </>
  );
}
