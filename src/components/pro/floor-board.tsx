'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { transitionOrderAction } from '@/features/orders/staff-actions';
import type { ActiveOrdersSnapshot, StaffOrder } from '@/features/orders/staff-types';
import { Button } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import { useActiveOrders, useTick } from './use-active-orders';
import { ServiceBar } from './service-bar';
import { FloorOrderCard } from './order-card';
import { ReasonDialog } from './reason-dialog';
import { playNewOrderChime } from './sounds';

type Column = 'submitted' | 'accepted' | 'ready';

/** Floor screen: three columns (tabs in portrait), alert sound, realtime (SAL-01 to SAL-03). */
export function FloorBoard({
  shop,
  initial,
  supabaseUrl,
  publishableKey,
  repeatSeconds,
}: {
  shop: { id: string; slug: string };
  initial: ActiveOrdersSnapshot;
  supabaseUrl: string;
  publishableKey: string;
  repeatSeconds: number;
}) {
  const t = useTranslations('pro.floor');
  const te = useTranslations('errors');
  const { orders, setOrders, reload, status, serverNow, lastNew } = useActiveOrders({
    shopId: shop.id,
    shopSlug: shop.slug,
    supabaseUrl,
    publishableKey,
    initial,
  });
  useTick(15_000);
  const [started, setStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [tab, setTab] = useState<Column>('submitted');
  const [dialog, setDialog] = useState<{ order: StaffOrder; kind: 'reject' | 'cancel' } | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [announce, setAnnounce] = useState('');
  const newIds = useRef(new Set<string>());

  const columns = useMemo(() => {
    const by: Record<Column, StaffOrder[]> = { submitted: [], accepted: [], ready: [] };
    for (const o of orders) if (o.status in by) by[o.status as Column].push(o);
    // New arrivals at the top of "To validate".
    by.submitted.reverse();
    return by;
  }, [orders]);

  // New order: sound, gentle blink, aria-live announcement.
  useEffect(() => {
    if (!lastNew) return;
    newIds.current.add(lastNew.id);
    setAnnounce(t('newOrder', { table: lastNew.table_label }));
    if (started && soundOn) playNewOrderChime();
  }, [lastNew, started, soundOn, t]);

  // The sound repeats while an order is waiting to be validated (configurable, can be disabled).
  const pendingCount = columns.submitted.length;
  useEffect(() => {
    if (!started || !soundOn || repeatSeconds <= 0 || pendingCount === 0) return;
    const id = setInterval(playNewOrderChime, repeatSeconds * 1000);
    return () => clearInterval(id);
  }, [started, soundOn, repeatSeconds, pendingCount]);

  // Browser tab title prefixed with the count: "(2) Atable".
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, '');
    document.title = pendingCount > 0 ? `(${pendingCount}) ${base}` : base;
  }, [pendingCount]);

  async function transition(order: StaffOrder, to: 'accepted' | 'rejected' | 'ready' | 'served' | 'cancelled', reason: string | null = null) {
    setBusy((b) => ({ ...b, [order.id]: true }));
    setMessages((m) => ({ ...m, [order.id]: '' }));
    // Optimistic update with rollback (vol. 07 §8).
    const previous = orders;
    setOrders((list) =>
      list
        .map((o) => (o.id === order.id ? { ...o, status: to } : o))
        .filter((o) => o.status === 'submitted' || o.status === 'accepted' || o.status === 'ready'),
    );
    const res = await transitionOrderAction({ shopSlug: shop.slug, orderId: order.id, to, reason });
    setBusy((b) => ({ ...b, [order.id]: false }));
    if (!res.ok) {
      setOrders(previous);
      setMessages((m) => ({ ...m, [order.id]: te(res.code) }));
      return;
    }
    if ('alreadyHandledBy' in res.value) {
      setOrders(previous);
      setMessages((m) => ({
        ...m,
        [order.id]: res.value && 'alreadyHandledBy' in res.value && res.value.alreadyHandledBy ? t('alreadyHandled', { name: res.value.alreadyHandledBy }) : t('alreadyHandledNoName'),
      }));
    }
    void reload();
  }

  const now = serverNow();
  const age = (o: StaffOrder) => {
    const from = o.status === 'ready' && o.ready_at ? o.ready_at : o.created_at;
    const minutes = Math.max(0, Math.floor((now - new Date(from).getTime()) / 60_000));
    if (o.status === 'ready') return t('readySince', { minutes });
    return minutes < 1 ? t('justNow') : t('ago', { minutes });
  };

  const titles: Record<Column, string> = { submitted: t('toValidate'), accepted: t('inPreparation'), ready: t('readyToServe') };
  const tone: Record<Column, string> = { submitted: 'text-st-submitted', accepted: 'text-st-accepted', ready: 'text-st-ready' };

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <ServiceBar started={started} onStart={() => setStarted(true)} soundOn={soundOn} onToggleSound={() => setSoundOn((s) => !s)} status={status} />
          <Link href={`/${shop.slug}/salle/tables`} className="inline-flex min-h-12 items-center rounded-lg border border-line px-4 font-semibold hover:bg-brand-soft">
            {t('tablesView')}
          </Link>
        </div>
      </div>

      {/* Tabs (tablet portrait) */}
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-lg bg-brand-soft p-1 xl:hidden">
        {(['submitted', 'accepted', 'ready'] as Column[]).map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={tab === c}
            type="button"
            onClick={() => setTab(c)}
            className={cn('min-h-12 rounded-md px-2 text-sm font-semibold', tab === c ? 'bg-surface shadow' : '')}
          >
            {titles[c]} ({columns[c].length})
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {(['submitted', 'accepted', 'ready'] as Column[]).map((c) => (
          <section key={c} aria-labelledby={`col-${c}`} className={cn('space-y-3', tab !== c && 'hidden xl:block')}>
            <h2 id={`col-${c}`} className={cn('text-sm font-bold tracking-wide uppercase', tone[c])}>
              {titles[c]} ({columns[c].length})
            </h2>
            {columns[c].length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-center text-muted">{t('empty')}</p>}
            {columns[c].map((order) => (
              <FloorOrderCard
                key={order.id}
                order={order}
                ageLabel={age(order)}
                isNew={newIds.current.has(order.id) && order.status === 'submitted'}
                message={messages[order.id] ?? null}
                actions={
                  order.status === 'submitted' ? (
                    <>
                      <Button size="lg" className="flex-1" disabled={busy[order.id]} onClick={() => transition(order, 'accepted')}>
                        {t('validate')}
                      </Button>
                      <Button size="lg" variant="secondary" disabled={busy[order.id]} onClick={() => setDialog({ order, kind: 'reject' })}>
                        {t('reject')}
                      </Button>
                    </>
                  ) : order.status === 'accepted' ? (
                    <>
                      <Button size="lg" variant="success" className="flex-1" disabled={busy[order.id]} onClick={() => transition(order, 'ready')}>
                        {t('ready')}
                      </Button>
                      <Button size="lg" variant="secondary" disabled={busy[order.id]} onClick={() => setDialog({ order, kind: 'cancel' })}>
                        {t('cancel')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="lg" className="flex-1" disabled={busy[order.id]} onClick={() => transition(order, 'served')}>
                        {t('served')}
                      </Button>
                      <Button size="lg" variant="secondary" disabled={busy[order.id]} onClick={() => setDialog({ order, kind: 'cancel' })}>
                        {t('cancel')}
                      </Button>
                    </>
                  )
                }
              />
            ))}
          </section>
        ))}
      </div>

      {dialog && (
        <ReasonDialog
          title={dialog.kind === 'reject' ? t('rejectTitle', { number: String(dialog.order.number).padStart(3, '0') }) : t('cancelTitle', { number: String(dialog.order.number).padStart(3, '0') })}
          reasons={dialog.kind === 'reject' ? ['nobody', 'duplicate', 'unavailable', 'other'] : ['left', 'mistake', 'unavailable', 'other']}
          confirmLabel={dialog.kind === 'reject' ? t('confirmReject') : t('confirmCancel')}
          onClose={() => setDialog(null)}
          onConfirm={(reason) => {
            const d = dialog;
            setDialog(null);
            void transition(d.order, d.kind === 'reject' ? 'rejected' : 'cancelled', reason);
          }}
        />
      )}
      <p className="sr-only" aria-live="assertive">
        {announce}
      </p>
    </div>
  );
}
