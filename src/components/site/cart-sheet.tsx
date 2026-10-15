'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { cartTotalCents, linePriceCents, MAX_NOTE_LENGTH, type Cart } from '@/features/orders/cart';
import { formatPrice } from '@/lib/money';

/** Cart, note for the team, confirmation step and sending (CLI-04, CLI-05). */
export function CartSheet({
  cart,
  noteEnabled,
  canOrder,
  sending,
  error,
  onClose,
  onQuantity,
  onNote,
  onSend,
}: {
  cart: Cart;
  noteEnabled: boolean;
  canOrder: boolean;
  sending: boolean;
  error: string | null;
  onClose: () => void;
  onQuantity: (key: string, quantity: number) => void;
  onNote: (note: string) => void;
  onSend: () => void;
}) {
  const t = useTranslations('site.cart');
  const tp = useTranslations('site.product');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const noteId = useId();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  const total = cartTotalCents(cart);
  const hasUnavailable = cart.lines.some((l) => l.unavailable);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={onClose}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-theme bg-bg p-0 text-fg backdrop:bg-black/50 sm:mx-auto sm:mb-auto sm:max-w-lg sm:rounded-theme"
    >
      <div className="flex max-h-[92dvh] flex-col">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h2 id={titleId} className="font-display text-xl font-semibold">
            {confirming ? t('confirmTitle') : t('title')}
          </h2>
          <button type="button" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-full" aria-label={tp('close')}>
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {cart.lines.length === 0 && <p className="text-muted">{t('empty')}</p>}
          <ul className="divide-y divide-line">
            {cart.lines.map((line) => (
              <li key={line.key} className={`py-3 ${line.unavailable ? 'text-st-danger' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {line.quantity} × {line.name}
                    </p>
                    {line.options.length > 0 && (
                      <p className="text-sm text-muted">{line.options.map((o) => (o.quantity > 1 ? `${o.name} ×${o.quantity}` : o.name)).join(', ')}</p>
                    )}
                    {line.unavailable && <p className="text-sm font-semibold">{t('noLongerAvailable')}</p>}
                  </div>
                  <span className="tabular shrink-0">{formatPrice(linePriceCents(line))}</span>
                </div>
                {!confirming && (
                  <div className="mt-2 flex items-center gap-1">
                    <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line" aria-label={`− ${line.name}`} onClick={() => onQuantity(line.key, line.quantity - 1)}>
                      <Minus aria-hidden className="h-4 w-4" />
                    </button>
                    <span className="tabular w-6 text-center">{line.quantity}</span>
                    <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line disabled:opacity-40" disabled={line.quantity >= 20} aria-label={`+ ${line.name}`} onClick={() => onQuantity(line.key, line.quantity + 1)}>
                      <Plus aria-hidden className="h-4 w-4" />
                    </button>
                    <button type="button" className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-button px-3 text-sm" aria-label={t('removeLine', { name: line.name })} onClick={() => onQuantity(line.key, 0)}>
                      <Trash2 aria-hidden className="h-4 w-4" />
                      {t('remove')}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {noteEnabled && cart.lines.length > 0 && (
            <div>
              <label htmlFor={noteId} className="font-medium">
                {t('note')}
              </label>
              <textarea
                id={noteId}
                value={cart.note}
                readOnly={confirming}
                maxLength={MAX_NOTE_LENGTH}
                rows={2}
                onChange={(e) => onNote(e.target.value)}
                placeholder={t('noteHelp')}
                className="mt-1 w-full rounded-theme border border-line bg-surface p-3"
              />
              <p className="text-right text-xs text-muted">
                {cart.note.length}/{MAX_NOTE_LENGTH}
              </p>
            </div>
          )}
        </div>
        <div className="space-y-2 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="flex justify-between text-lg font-semibold">
            <span>{t('total')}</span>
            <span className="tabular">{formatPrice(total)}</span>
          </p>
          <p className="text-sm text-muted">{t('payAtCounter')}</p>
          {error && (
            <p role="alert" className="rounded-theme bg-st-danger-soft p-3 text-sm font-medium text-fg">
              {error}
            </p>
          )}
          {canOrder && cart.lines.length > 0 && !confirming && (
            <button
              type="button"
              disabled={hasUnavailable}
              onClick={() => setConfirming(true)}
              className="min-h-12 w-full rounded-button bg-brand font-semibold text-brand-fg hover:bg-brand-hover disabled:opacity-50"
            >
              {t('send')}
            </button>
          )}
          {confirming && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={sending} onClick={() => setConfirming(false)} className="min-h-12 rounded-button border border-line font-semibold">
                {t('continue')}
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => {
                  onSend();
                  setConfirming(false);
                }}
                className="min-h-12 rounded-button bg-brand font-semibold text-brand-fg hover:bg-brand-hover disabled:opacity-60"
              >
                {sending ? t('sending') : t('confirmSend')}
              </button>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
