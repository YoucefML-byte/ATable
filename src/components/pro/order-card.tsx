'use client';

import { useTranslations } from 'next-intl';
import { MessageSquareText } from 'lucide-react';
import type { StaffOrder, StaffOrderItem } from '@/features/orders/staff-types';
import { formatPrice } from '@/lib/money';
import { cn } from '@/lib/cn';

export function OrderLines({ items, large }: { items: StaffOrderItem[]; large?: boolean }) {
  return (
    <ul className={cn('space-y-1', large && 'space-y-2')}>
      {items.map((item) => (
        <li key={item.id}>
          <p className={cn(large ? 'text-xl font-bold' : 'font-medium')}>
            <span className={cn('tabular mr-2 inline-block', large ? 'min-w-8 text-2xl' : 'min-w-6')}>{item.quantity}</span>
            {large ? item.name.toUpperCase() : item.name}
          </p>
          {item.options.length > 0 && (
            <p className={cn('pl-8 text-muted', large ? 'text-lg font-semibold text-fg' : 'text-sm')}>
              {item.options.map((o) => (o.quantity > 1 ? `${o.name} ×${o.quantity}` : o.name)).join(', ')}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

export function OrderNote({ note, large }: { note: string | null; large?: boolean }) {
  const t = useTranslations('pro.history');
  if (!note) return null;
  return (
    <p className={cn('flex gap-2 rounded-lg border-2 border-st-warning bg-st-warning-soft p-2 font-semibold', large && 'text-lg')}>
      <MessageSquareText aria-label={t('note')} className="h-5 w-5 shrink-0" />« {note} »
    </p>
  );
}

/** Order card of the floor screen (vol. 07 §5.3). */
export function FloorOrderCard({
  order,
  ageLabel,
  isNew,
  actions,
  message,
}: {
  order: StaffOrder;
  ageLabel: string;
  isNew: boolean;
  actions: React.ReactNode;
  message?: string | null;
}) {
  const t = useTranslations('pro.floor');
  const tone =
    order.status === 'submitted' ? 'border-st-submitted' : order.status === 'accepted' ? 'border-st-accepted' : 'border-st-ready';
  return (
    <article
      aria-label={`${order.table_label} — ${t('orderNumber', { number: String(order.number).padStart(3, '0') })}`}
      className={cn('space-y-3 rounded-xl border-2 bg-surface p-4', tone, isNew && 'blink-new')}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[1.375rem] leading-tight font-bold">{order.table_label}</h3>
          <p className="text-sm text-muted">{ageLabel}</p>
        </div>
        <span className="tabular rounded-md bg-brand-soft px-2 py-1 font-semibold">#{String(order.number).padStart(3, '0')}</span>
      </header>
      <OrderLines items={order.items} />
      <OrderNote note={order.note} />
      <p className="tabular text-right font-semibold">{formatPrice(order.subtotal_cents)}</p>
      {message && (
        <p role="alert" className="rounded-lg bg-st-danger-soft p-2 text-sm font-medium">
          {message}
        </p>
      )}
      <div className="flex gap-2">{actions}</div>
    </article>
  );
}
