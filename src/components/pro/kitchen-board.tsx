'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { transitionOrderAction } from '@/features/orders/staff-actions';
import type { ActiveOrdersSnapshot, StaffOrder } from '@/features/orders/staff-types';
import { formatTimer } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { useActiveOrders, useTick } from './use-active-orders';
import { ServiceBar } from './service-bar';
import { OrderLines, OrderNote } from './order-card';
import { playLateSound } from './sounds';

type Filter = 'all' | 'kitchen' | 'bar';
const UNDO_MS = 5000;

/**
 * Kitchen queue (CUI-01): big cards from the oldest to the newest, timer based on the server
 * clock, orange/red thresholds of the shop, filter by station.
 * "Prête" is sent to the server only after the 5-second undo window (ADR-009): no transition
 * back from "ready" is needed in the database.
 */
export function KitchenBoard({
  shop,
  initial,
  supabaseUrl,
  publishableKey,
}: {
  shop: { id: string; slug: string };
  initial: ActiveOrdersSnapshot;
  supabaseUrl: string;
  publishableKey: string;
}) {
  const t = useTranslations('pro.kitchen');
  const tp = useTranslations('common.prepStation');
  const te = useTranslations('errors');
  const { orders, reload, status, serverNow, thresholds } = useActiveOrders({
    shopId: shop.id,
    shopSlug: shop.slug,
    supabaseUrl,
    publishableKey,
    initial,
  });
  useTick(1000);
  const [filter, setFilter] = useState<Filter>('all');
  const [started, setStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [pendingReady, setPendingReady] = useState<
    Record<string, { number: number; timer: ReturnType<typeof setTimeout> }>
  >({});
  const [error, setError] = useState<string | null>(null);
  const lateNotified = useRef(new Set<string>());

  const queue = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'accepted' && !pendingReady[o.id])
        .sort(
          (a, b) =>
            new Date(a.accepted_at ?? a.created_at).getTime() -
            new Date(b.accepted_at ?? b.created_at).getTime(),
        ),
    [orders, pendingReady],
  );

  const now = serverNow();
  const elapsed = (o: StaffOrder) => now - new Date(o.accepted_at ?? o.created_at).getTime();
  const level = (ms: number) =>
    ms >= thresholds.critical * 60_000
      ? 'critical'
      : ms >= thresholds.warning * 60_000
        ? 'warning'
        : 'normal';

  // Distinct sound played once per order when it turns red.
  useEffect(() => {
    for (const o of queue) {
      if (level(elapsed(o)) === 'critical' && !lateNotified.current.has(o.id)) {
        lateNotified.current.add(o.id);
        if (started && soundOn) playLateSound();
      }
    }
  });

  function markReady(order: StaffOrder) {
    setError(null);
    const timer = setTimeout(async () => {
      const res = await transitionOrderAction({
        shopSlug: shop.slug,
        orderId: order.id,
        to: 'ready',
        reason: null,
      });
      setPendingReady((p) => {
        const next = { ...p };
        delete next[order.id];
        return next;
      });
      if (!res.ok) setError(te(res.code));
      void reload();
    }, UNDO_MS);
    setPendingReady((p) => ({ ...p, [order.id]: { number: order.number, timer } }));
  }

  function undo(orderId: string) {
    setPendingReady((p) => {
      const entry = p[orderId];
      if (entry) clearTimeout(entry.timer);
      const next = { ...p };
      delete next[orderId];
      return next;
    });
  }

  const oldestMinutes = queue[0] ? Math.floor(elapsed(queue[0]) / 60_000) : 0;

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] font-semibold">{t('title')}</h1>
          <p className="text-muted text-lg">
            {t('count', { count: queue.length })}
            {queue.length > 0 && ` · ${t('oldest', { minutes: oldestMinutes })}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div role="radiogroup" className="bg-brand-soft flex gap-1 rounded-lg p-1">
            {(['all', 'kitchen', 'bar'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  'min-h-12 rounded-md px-4 font-semibold',
                  filter === f ? 'bg-surface shadow' : '',
                )}
              >
                {f === 'all'
                  ? t('filterAll')
                  : f === 'kitchen'
                    ? t('filterKitchen')
                    : t('filterBar')}
              </button>
            ))}
          </div>
          <ServiceBar
            started={started}
            onStart={() => setStarted(true)}
            soundOn={soundOn}
            onToggleSound={() => setSoundOn((s) => !s)}
            status={status}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="bg-st-danger-soft rounded-lg p-3 font-medium">
          {error}
        </p>
      )}

      {Object.entries(pendingReady).map(([id, p]) => (
        <div
          key={id}
          role="status"
          className="bg-st-ready-soft flex items-center justify-between gap-3 rounded-xl p-3 text-lg font-semibold"
        >
          <span>{t('markedReady', { number: String(p.number).padStart(3, '0') })}</span>
          <button
            type="button"
            onClick={() => undo(id)}
            className="border-fg min-h-12 rounded-lg border-2 px-5 font-bold"
          >
            {t('undo')}
          </button>
        </div>
      ))}

      {queue.length === 0 && (
        <p className="border-line text-muted rounded-xl border border-dashed p-10 text-center text-xl">
          {t('empty')}
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {queue.map((order) => {
          const ms = elapsed(order);
          const lvl = level(ms);
          const items =
            filter === 'all' ? order.items : order.items.filter((i) => i.prep_station === filter);
          const others =
            filter === 'all'
              ? []
              : order.items.filter((i) => i.prep_station !== filter && i.prep_station !== 'none');
          if (filter !== 'all' && items.length === 0) return null;
          const otherStation = filter === 'kitchen' ? 'bar' : 'kitchen';
          return (
            <li key={order.id}>
              <article
                className={cn(
                  'bg-surface flex h-full flex-col gap-3 rounded-xl border-4 p-4',
                  lvl === 'critical'
                    ? 'pulse-critical border-st-danger'
                    : lvl === 'warning'
                      ? 'border-st-warning'
                      : 'border-line',
                )}
              >
                <header className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 text-xl font-bold">
                    <span className="tabular">#{String(order.number).padStart(3, '0')}</span>{' '}
                    <span className="text-[1.625rem]">{order.table_label}</span>
                  </p>
                  <p
                    className={cn(
                      'tabular shrink-0 rounded-lg text-[2.5rem] leading-none font-bold',
                      lvl === 'critical'
                        ? 'text-st-danger'
                        : lvl === 'warning'
                          ? 'text-st-warning'
                          : '',
                    )}
                    aria-label={
                      lvl === 'critical' ? `${t('late')} ${formatTimer(ms)}` : formatTimer(ms)
                    }
                  >
                    {formatTimer(ms)}
                  </p>
                </header>
                <div className="flex-1">
                  <OrderLines items={items} large />
                  {others.length > 0 && (
                    <p className="text-muted mt-2 text-lg">
                      {t('otherStation', {
                        count: others.reduce((a, i) => a + i.quantity, 0),
                        station: tp(otherStation).toLowerCase(),
                      })}
                    </p>
                  )}
                </div>
                <OrderNote note={order.note} large />
                <button
                  type="button"
                  onClick={() => markReady(order)}
                  className="bg-st-ready text-bg min-h-16 w-full rounded-xl text-2xl font-bold"
                >
                  {t('ready').toUpperCase()}
                </button>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
