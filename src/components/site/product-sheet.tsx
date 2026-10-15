'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Minus, Plus, X } from 'lucide-react';
import type { MenuProduct } from '@/features/catalog/menu-schema';
import {
  buildLine,
  combinedAllergens,
  defaultSelections,
  effectiveMax,
  groupCount,
  missingGroups,
  selectOption,
  unitPriceCents,
  type CartLine,
  type Selections,
} from '@/features/orders/cart';
import { formatPrice } from '@/lib/money';
import { AllergenText } from './allergen-info';
import { ProductImage } from './product-image';

/**
 * Product sheet sliding from the bottom (CLI-03, vol. 07 §4.2). Native <dialog>: focus trap,
 * Escape to close, focus returned to the trigger.
 */
export function ProductSheet({
  product,
  mediaBase,
  canOrder,
  onClose,
  onAdd,
}: {
  product: MenuProduct;
  mediaBase: string;
  canOrder: boolean;
  onClose: () => void;
  onAdd: (line: CartLine) => void;
}) {
  const t = useTranslations('site.product');
  const tm = useTranslations('site.menu');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const groupRefs = useRef<Record<string, HTMLFieldSetElement | null>>({});
  const titleId = useId();
  const [selections, setSelections] = useState<Selections>(() => defaultSelections(product));
  const [quantity, setQuantity] = useState(1);
  const [highlight, setHighlight] = useState<string | null>(null);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  const missing = missingGroups(product, selections);
  const unit = unitPriceCents(product, selections);
  const total = unit * quantity;
  const allergens = useMemo(() => combinedAllergens(product, selections), [product, selections]);

  function handleAdd() {
    if (missing.length > 0) {
      // Scrolls to the incomplete group and highlights it (vol. 07 §4.2).
      const first = missing[0]!;
      setHighlight(first);
      groupRefs.current[first]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      groupRefs.current[first]?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus();
      return;
    }
    onAdd(buildLine(product, selections, quantity));
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="rounded-t-theme bg-bg text-fg sm:rounded-theme m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden p-0 backdrop:bg-black/50 sm:mx-auto sm:mb-auto sm:max-w-lg"
    >
      <div
        className="flex max-h-[92dvh] flex-col"
        onTouchStart={(e) => {
          touchStart.current = e.touches[0]?.clientY ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          const end = e.changedTouches[0]?.clientY ?? 0;
          const scroller = e.currentTarget.querySelector('[data-scroll]');
          if (start !== null && end - start > 90 && (scroller?.scrollTop ?? 0) <= 0) onClose();
          touchStart.current = null;
        }}
      >
        <div className="relative overflow-y-auto" data-scroll>
          <div className="bg-line mx-auto mt-2 h-1.5 w-12 rounded-full" aria-hidden />
          <button
            type="button"
            onClick={onClose}
            className="bg-surface text-fg absolute top-3 right-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full shadow"
            aria-label={t('close')}
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
          {product.image_path && (
            <ProductImage
              path={product.image_path}
              base={mediaBase}
              alt={product.name}
              size="large"
              className="mt-2 aspect-[4/3] w-full object-cover"
            />
          )}
          <div className="space-y-2 p-4">
            <h2 id={titleId} className="font-display pr-12 text-2xl font-semibold">
              {product.name}
            </h2>
            {product.description && <p className="text-muted">{product.description}</p>}
            {product.origin_info && (
              <p className="text-muted text-sm">{tm('origin', { origin: product.origin_info })}</p>
            )}
            <AllergenText
              declared={product.allergens_declared}
              contains={allergens.contains}
              mayContain={allergens.mayContain}
            />
          </div>

          {product.option_groups.map((group) => {
            const count = groupCount(selections, group.id);
            const max = effectiveMax(group);
            const isRadio = max === 1 && !group.allow_quantity;
            const required = group.min > 0;
            const incomplete = count < group.min;
            return (
              <fieldset
                key={group.id}
                ref={(el) => {
                  groupRefs.current[group.id] = el;
                }}
                className={`border-line border-t px-4 py-3 ${highlight === group.id && incomplete ? 'bg-brand-soft' : ''}`}
              >
                <legend className="float-left w-full pt-1 pb-2">
                  <span className="font-semibold">{group.name}</span>
                  <span className="text-muted text-sm">
                    {' · '}
                    {required ? t('mandatory') : t('optional')}
                    {Number.isFinite(max) && max > 1 && ` · ${t('upTo', { max })}`}
                    {' · '}
                    {Number.isFinite(max)
                      ? t('chosen', { count, max })
                      : t('chosenNoMax', { count })}
                  </span>
                </legend>
                <div className="clear-both grid gap-1">
                  {group.options.map((option) => {
                    const q = selections[group.id]?.[option.id] ?? 0;
                    const atMax = !isRadio && count >= max && q === 0;
                    const disabled = option.is_sold_out || (atMax && !group.allow_quantity);
                    const label = (
                      <span className="flex flex-1 items-center justify-between gap-2">
                        <span className={option.is_sold_out ? 'text-muted line-through' : ''}>
                          {option.name}
                          {option.is_sold_out && (
                            <span className="ml-1 text-sm no-underline">({t('soldOut')})</span>
                          )}
                        </span>
                        {option.price_delta_cents > 0 && (
                          <span className="tabular text-muted text-sm">
                            +{formatPrice(option.price_delta_cents)}
                          </span>
                        )}
                      </span>
                    );
                    if (group.allow_quantity) {
                      return (
                        <div key={option.id} className="flex min-h-11 items-center gap-3">
                          {label}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="border-line inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
                              disabled={q === 0}
                              aria-label={`− ${option.name}`}
                              onClick={() =>
                                setSelections((s) =>
                                  selectOption(product, s, group.id, option.id, q - 1),
                                )
                              }
                            >
                              <Minus aria-hidden className="h-4 w-4" />
                            </button>
                            <span className="tabular w-6 text-center" aria-live="polite">
                              {q}
                            </span>
                            <button
                              type="button"
                              className="border-line inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
                              disabled={
                                option.is_sold_out || q >= group.max_per_option || count >= max
                              }
                              aria-label={`+ ${option.name}`}
                              onClick={() =>
                                setSelections((s) =>
                                  selectOption(product, s, group.id, option.id, q + 1),
                                )
                              }
                            >
                              <Plus aria-hidden className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <label
                        key={option.id}
                        className={`rounded-theme flex min-h-11 cursor-pointer items-center gap-3 px-1 ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <input
                          type={isRadio ? 'radio' : 'checkbox'}
                          name={group.id}
                          className="accent-brand h-5 w-5"
                          checked={q > 0}
                          disabled={disabled}
                          onChange={(e) => {
                            setHighlight(null);
                            setSelections((s) =>
                              selectOption(
                                product,
                                s,
                                group.id,
                                option.id,
                                e.target.checked ? 1 : 0,
                              ),
                            );
                          }}
                          onClick={(e) => {
                            // An optional radio choice can be unselected by tapping it again.
                            if (isRadio && !required && q > 0) {
                              e.preventDefault();
                              setSelections((s) =>
                                selectOption(product, s, group.id, option.id, 0),
                              );
                            }
                          }}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>

        {canOrder && !product.is_sold_out && (
          <div className="border-line bg-bg flex items-center gap-3 border-t p-3">
            <div className="flex items-center gap-1" role="group" aria-label={t('quantity')}>
              <button
                type="button"
                className="border-line inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
                disabled={quantity <= 1}
                aria-label={`− ${t('quantity')}`}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus aria-hidden className="h-4 w-4" />
              </button>
              <span className="tabular w-6 text-center">{quantity}</span>
              <button
                type="button"
                className="border-line inline-flex h-11 w-11 items-center justify-center rounded-full border disabled:opacity-40"
                disabled={quantity >= 20}
                aria-label={`+ ${t('quantity')}`}
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              >
                <Plus aria-hidden className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={handleAdd}
              aria-disabled={missing.length > 0}
              className={`rounded-button bg-brand text-brand-fg flex min-h-12 flex-1 items-center justify-center px-4 font-semibold ${missing.length > 0 ? 'opacity-60' : 'hover:bg-brand-hover'}`}
            >
              {missing.length > 0
                ? t('incomplete')
                : t('addWithPrice', { price: formatPrice(total) })}
            </button>
            <span className="sr-only" aria-live="polite">
              {t('priceUpdated', { price: formatPrice(total) })}
            </span>
          </div>
        )}
      </div>
    </dialog>
  );
}
