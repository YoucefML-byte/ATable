'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ArrowLeft, Printer } from 'lucide-react';
import {
  closeTableAction,
  getSessionOrdersAction,
  listTablesAction,
} from '@/features/orders/staff-actions';
import type { StaffOrder, TableOverview } from '@/features/orders/staff-types';
import { formatPrice } from '@/lib/money';
import { formatTime } from '@/lib/dates';
import { Alert, Button } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';

/** Tables grouped by zone, amount per table, detail and closing (SAL-04, vol. 07 §5.4). */
export function TablesView({
  shop,
  initial,
}: {
  shop: { slug: string; name: string; timezone: string };
  initial: TableOverview[];
}) {
  const t = useTranslations('pro.tables');
  const tf = useTranslations('pro.floor');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const [tables, setTables] = useState(initial);
  const [selected, setSelected] = useState<TableOverview | null>(null);
  const [loaded, setLoaded] = useState<{ sessionId: string; orders: StaffOrder[] } | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  const refresh = useCallback(async () => {
    const res = await listTablesAction(shop.slug);
    if (res.ok) setTables(res.value);
  }, [shop.slug]);

  useEffect(() => {
    const id = setInterval(refresh, 20_000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const sessionId = selected?.session?.id;
    if (!sessionId) return;
    let cancelled = false;
    getSessionOrdersAction(shop.slug, sessionId).then((res) => {
      if (!cancelled && res.ok) setLoaded({ sessionId, orders: res.value });
    });
    return () => {
      cancelled = true;
    };
  }, [selected, shop.slug]);

  // Orders of the selected session only (never those of a previously opened table).
  const orders = loaded && loaded.sessionId === selected?.session?.id ? loaded.orders : null;

  const zones = useMemo(() => {
    const map = new Map<string, TableOverview[]>();
    for (const table of tables) {
      const key = table.zone ?? '';
      map.set(key, [...(map.get(key) ?? []), table]);
    }
    return [...map.entries()];
  }, [tables]);

  const validated = (orders ?? []).filter((o) =>
    ['accepted', 'ready', 'served'].includes(o.status),
  );
  const pending = (orders ?? []).filter((o) => o.status === 'submitted');
  const inProgress = (orders ?? []).some((o) =>
    ['submitted', 'accepted', 'ready'].includes(o.status),
  );
  const consolidated = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of validated)
      for (const i of o.items) {
        const key =
          i.options.length > 0 ? `${i.name} (${i.options.map((x) => x.name).join(', ')})` : i.name;
        map.set(key, (map.get(key) ?? 0) + i.quantity);
      }
    return [...map.entries()];
  }, [validated]);
  const total = validated.reduce((a, o) => a + o.subtotal_cents, 0);

  async function close() {
    if (!selected?.session) return;
    setConfirming(false);
    const res = await closeTableAction(shop.slug, selected.session.id);
    if (!res.ok) {
      setMessage({
        tone: 'danger',
        text: res.code === 'TABLE_HAS_PENDING_ORDERS' ? t('cannotClose') : te(res.code),
      });
      return;
    }
    setMessage({ tone: 'success', text: t('closed') });
    setSelected(null);
    await refresh();
  }

  if (selected) {
    return (
      <div className="space-y-4 p-4 print:p-0">
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <Button variant="secondary" onClick={() => setSelected(null)}>
            <ArrowLeft aria-hidden className="h-5 w-5" />
            {tc('back')}
          </Button>
          <h1 className="text-2xl font-semibold">{selected.label}</h1>
        </div>
        <div className="hidden print:block">
          <p className="text-xl font-bold">{shop.name}</p>
          <p className="text-lg">{selected.label}</p>
        </div>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        {!selected.session && <p className="text-muted">{t('noSession')}</p>}
        {orders && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="border-line bg-surface space-y-3 rounded-xl border p-4">
              <h2 className="text-lg font-semibold">{t('summary')}</h2>
              <ul className="space-y-1">
                {consolidated.map(([name, qty]) => (
                  <li key={name} className="flex gap-2">
                    <span className="tabular w-8 font-semibold">{qty} ×</span>
                    {name}
                  </li>
                ))}
              </ul>
              <p className="border-line flex justify-between border-t pt-2 text-lg font-bold">
                <span>{t('total')}</span>
                <span className="tabular">{formatPrice(total)}</span>
              </p>
            </section>
            <section className="space-y-3 print:hidden">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className={cn(
                    'bg-surface rounded-xl border p-3',
                    o.status === 'submitted' ? 'border-st-submitted' : 'border-line',
                  )}
                >
                  <p className="flex justify-between font-semibold">
                    <span>
                      #{String(o.number).padStart(3, '0')} ·{' '}
                      {formatTime(o.created_at, shop.timezone)}
                    </span>
                    <span>{tc(`status.${o.status}`)}</span>
                  </p>
                  <p className="text-muted text-sm">
                    {o.items.map((i) => `${i.quantity} × ${i.name}`).join(', ')}
                  </p>
                </div>
              ))}
              {pending.length > 0 && (
                <p className="text-st-submitted text-sm font-medium">{t('pendingList')}</p>
              )}
            </section>
          </div>
        )}
        {selected.session && (
          <div className="flex flex-wrap gap-3 print:hidden">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer aria-hidden className="h-5 w-5" />
              {t('print')}
            </Button>
            {!confirming ? (
              <Button
                onClick={() =>
                  inProgress
                    ? setMessage({ tone: 'danger', text: t('cannotClose') })
                    : setConfirming(true)
                }
              >
                {t('close')}
              </Button>
            ) : (
              <div className="border-line flex flex-wrap items-center gap-2 rounded-xl border p-2">
                <span className="font-medium">{t('closeConfirm', { table: selected.label })}</span>
                <Button variant="secondary" onClick={() => setConfirming(false)}>
                  {tc('cancel')}
                </Button>
                <Button onClick={close}>{tc('confirm')}</Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Link
          href={`/${shop.slug}/salle`}
          className="border-line hover:bg-brand-soft inline-flex min-h-12 items-center rounded-lg border px-4 font-semibold"
        >
          {t('backToFloor')}
        </Link>
      </div>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {zones.map(([zone, list]) => (
        <section key={zone} className="space-y-2">
          {zone && <h2 className="text-muted font-semibold">{zone}</h2>}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {list.map((table) => (
              <li key={table.id}>
                <button
                  type="button"
                  onClick={() => {
                    setMessage(null);
                    setSelected(table);
                  }}
                  className={cn(
                    'flex min-h-28 w-full flex-col items-start gap-1 rounded-xl border-2 p-3 text-left',
                    !table.session
                      ? 'border-line bg-surface'
                      : table.session.pending > 0
                        ? 'border-st-submitted bg-st-submitted-soft'
                        : 'border-st-accepted bg-st-accepted-soft',
                  )}
                >
                  <span className="flex w-full items-center justify-between text-lg font-bold">
                    {table.label}
                    {table.session && table.session.pending > 0 && (
                      <AlertTriangle
                        aria-label={tf('toValidate')}
                        className="text-st-submitted h-5 w-5"
                      />
                    )}
                  </span>
                  {!table.session ? (
                    <span className="text-muted">{t('free')}</span>
                  ) : (
                    <>
                      <span className="tabular font-semibold">
                        {formatPrice(table.session.validated_cents)}
                      </span>
                      <span className="text-sm">
                        {table.session.pending > 0
                          ? t('pendingCount', { count: table.session.pending })
                          : t('orders', { count: table.session.orders })}
                      </span>
                      <span className="text-muted text-xs">
                        {t('openedAt', {
                          time: formatTime(table.session.opened_at, shop.timezone),
                        })}
                      </span>
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
