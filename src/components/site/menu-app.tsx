'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import type { Menu, MenuProduct } from '@/features/catalog/menu-schema';
import {
  addLine,
  buildLine,
  cartCount,
  cartTotalCents,
  defaultSelections,
  markUnavailable,
  setLineQuantity,
  toOrderPayload,
  type CartLine,
} from '@/features/orders/cart';
import { formatPrice } from '@/lib/money';
import { isErrorCode, type ErrorCode } from '@/lib/errors';
import { useCart } from './use-cart';
import { ProductSheet } from './product-sheet';
import { CartSheet } from './cart-sheet';
import { AllergenBadges } from './allergen-info';
import { ProductImage } from './product-image';
import { CategoryNav } from './category-nav';

export type MenuAppProps = {
  shop: {
    id: string;
    soldOutLabel: string;
    acceptingOrders: boolean;
    orderNoteEnabled: boolean;
    layout: 'liste' | 'grille' | 'minimaliste';
  };
  table: { id: string; label: string } | null;
  menu: Menu | null;
  mediaBase: string;
  nextOpening: string | null;
};

type Confirmation = { number: number; totalCents: number; lines: CartLine[] };

export function MenuApp({ shop, table, menu, mediaBase, nextOpening }: MenuAppProps) {
  const t = useTranslations('site');
  const te = useTranslations('errors');
  const tt = useTranslations('common.tags');
  const tc = useTranslations('common');
  const router = useRouter();
  const { cart, update, clear, ready } = useCart(shop.id, table?.id ?? 'none');
  const [openProduct, setOpenProduct] = useState<MenuProduct | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [online, setOnline] = useState(true);
  const pendingKey = useRef<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const canOrder = !!table && shop.acceptingOrders && !!menu && online;

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // A pending idempotency key is kept until success, so a retry after a network error
  // never creates a second order (CLI-05 CA2).
  useEffect(() => {
    try {
      pendingKey.current = sessionStorage.getItem(`atable:pending:${shop.id}`);
    } catch {
      pendingKey.current = null;
    }
  }, [shop.id]);

  const setPending = useCallback(
    (key: string | null) => {
      pendingKey.current = key;
      try {
        if (key) sessionStorage.setItem(`atable:pending:${shop.id}`, key);
        else sessionStorage.removeItem(`atable:pending:${shop.id}`);
      } catch {
        // ignore
      }
    },
    [shop.id],
  );

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of cart.lines) m.set(l.productId, (m.get(l.productId) ?? 0) + l.quantity);
    return m;
  }, [cart.lines]);

  function addToCart(line: CartLine, product: MenuProduct) {
    setPending(null);
    update((c) => addLine(c, line));
    setAnnounce(t('cart.added', { name: product.name }));
    setOpenProduct(null);
  }

  function changeSimple(product: MenuProduct, delta: number) {
    const key = buildLine(product, defaultSelections(product), 1).key;
    const current = cart.lines.find((l) => l.key === key)?.quantity ?? 0;
    setPending(null);
    if (current === 0 && delta > 0) {
      update((c) => addLine(c, buildLine(product, defaultSelections(product), 1)));
      setAnnounce(t('cart.added', { name: product.name }));
    } else {
      update((c) => setLineQuantity(c, key, current + delta));
    }
  }

  async function send() {
    if (!menu || cart.lines.length === 0) return;
    setSending(true);
    setError(null);
    const key = pendingKey.current ?? crypto.randomUUID();
    setPending(key);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toOrderPayload(cart, key)),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok: true; number: number; subtotal_cents: number }
        | { ok: false; code: string; detail?: string | null }
        | null;
      if (res.ok && body && body.ok) {
        setConfirmation({
          number: body.number,
          totalCents: body.subtotal_cents,
          lines: cart.lines,
        });
        setPending(null);
        clear(); // CLI-05 CA4: the cart is emptied after a successful send, not before
        setCartOpen(false);
        return;
      }
      const code: ErrorCode = body && !body.ok && isErrorCode(body.code) ? body.code : 'INTERNAL';
      setPending(null);
      setError(te(code));
      if (code === 'PRODUCT_UNAVAILABLE' || code === 'OPTIONS_INVALID') {
        const detail = body && !body.ok ? (body.detail ?? undefined) : undefined;
        update((c) => markUnavailable(c, menu, detail));
        router.refresh();
      }
    } catch {
      setError(te('NETWORK'));
    } finally {
      setSending(false);
    }
  }

  const count = cartCount(cart);
  const total = cartTotalCents(cart);

  if (confirmation) {
    return (
      <section className="mx-auto max-w-lg space-y-4 p-4 text-center" aria-live="polite">
        <div className="rounded-theme border-line bg-surface border p-6">
          <p className="font-display text-2xl font-semibold">{t('confirmation.title')}</p>
          <p className="tabular mt-2 text-3xl font-bold">
            {t('confirmation.number', { number: String(confirmation.number).padStart(3, '0') })}
          </p>
          <p className="text-muted mt-2">{t('confirmation.willValidate')}</p>
          <ul className="mt-4 space-y-1 text-left">
            {confirmation.lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-2">
                <span>
                  {l.quantity} × {l.name}
                  {l.options.length > 0 && (
                    <span className="text-muted block text-sm">
                      {l.options
                        .map((o) => (o.quantity > 1 ? `${o.name} ×${o.quantity}` : o.name))
                        .join(', ')}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="border-line mt-3 flex justify-between border-t pt-3 font-semibold">
            <span>{t('cart.total')}</span>
            <span className="tabular">{formatPrice(confirmation.totalCents)}</span>
          </p>
          <p className="text-muted mt-1 text-sm">{t('cart.payAtCounter')}</p>
        </div>
        <div className="grid gap-2">
          <Link
            href="/commandes"
            className="rounded-button border-brand-line text-brand-text flex min-h-12 items-center justify-center border font-semibold"
          >
            {t('confirmation.seeOrders')}
          </Link>
          <button
            type="button"
            onClick={() => setConfirmation(null)}
            className="rounded-button bg-brand text-brand-fg min-h-12 font-semibold"
          >
            {t('confirmation.orderMore')}
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      {!online && (
        <p
          role="status"
          className="bg-st-warning-soft text-fg sticky top-0 z-30 px-4 py-2 text-center text-sm font-medium"
        >
          {tc('offline')}
        </p>
      )}
      {!table && (
        <p className="bg-brand-soft px-4 py-3 text-center text-sm font-medium">
          {t('menu.consultOnly')}
        </p>
      )}
      {table && !shop.acceptingOrders && (
        <p
          role="status"
          className="bg-st-warning-soft text-fg px-4 py-3 text-center text-sm font-medium"
        >
          {t('menu.ordersClosed')}
        </p>
      )}

      {!menu || menu.categories.length === 0 ? (
        <section className="mx-auto max-w-lg p-8 text-center">
          <p className="font-display text-xl font-semibold">{t('menu.unavailable')}</p>
          {nextOpening && (
            <p className="text-muted mt-2">{t('menu.backAt', { time: nextOpening })}</p>
          )}
        </section>
      ) : (
        <>
          <CategoryNav
            categories={menu.categories.map((c) => ({ id: c.id, name: c.name }))}
            label={t('menu.categories')}
          />
          <div className="mx-auto max-w-3xl px-4 pb-32">
            {menu.categories.map((category) => (
              <section
                key={category.id}
                id={`cat-${category.id}`}
                aria-labelledby={`h-${category.id}`}
                className="scroll-mt-28 pt-6"
              >
                <h2 id={`h-${category.id}`} className="font-display text-xl font-semibold">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-muted text-sm">{category.description}</p>
                )}
                <ul
                  className={
                    shop.layout === 'grille'
                      ? 'mt-3 grid grid-cols-2 gap-3'
                      : 'divide-line mt-2 divide-y'
                  }
                >
                  {category.products.map((product) => {
                    const simple = product.option_groups.length === 0;
                    const showFrom =
                      product.has_paid_options ||
                      product.min_price_cents !== product.base_price_cents;
                    const price = showFrom
                      ? t('menu.from', { price: formatPrice(product.min_price_cents) })
                      : formatPrice(product.base_price_cents);
                    const inCart = counts.get(product.id) ?? 0;
                    const containsCodes = product.allergens
                      .filter((a) => a.presence === 'contains')
                      .map((a) => a.code);
                    const open = (el: HTMLElement) => {
                      triggerRef.current = el;
                      setOpenProduct(product);
                    };
                    const addControl =
                      canOrder && !product.is_sold_out ? (
                        simple && inCart > 0 ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => changeSimple(product, -1)}
                              aria-label={t('menu.decrease', { name: product.name })}
                              className="border-brand-line text-brand-text inline-flex h-11 w-11 items-center justify-center rounded-full border"
                            >
                              <Minus aria-hidden className="h-4 w-4" />
                            </button>
                            <span className="tabular w-5 text-center font-semibold">{inCart}</span>
                            <button
                              type="button"
                              onClick={() => changeSimple(product, 1)}
                              aria-label={t('menu.increase', { name: product.name })}
                              className="bg-brand text-brand-fg inline-flex h-11 w-11 items-center justify-center rounded-full"
                            >
                              <Plus aria-hidden className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) =>
                              simple ? changeSimple(product, 1) : open(e.currentTarget)
                            }
                            aria-label={t('menu.addNamed', { name: product.name })}
                            className="bg-brand text-brand-fg hover:bg-brand-hover inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                          >
                            <Plus aria-hidden className="h-5 w-5" />
                          </button>
                        )
                      ) : null;
                    const soldOut = product.is_sold_out ? (
                      <p className="text-muted text-sm font-medium">{shop.soldOutLabel}</p>
                    ) : null;

                    if (shop.layout === 'grille') {
                      return (
                        <li
                          key={product.id}
                          className={`rounded-theme border-line bg-surface flex flex-col overflow-hidden border ${product.is_sold_out ? 'opacity-60' : ''}`}
                        >
                          <button
                            type="button"
                            className="text-left"
                            onClick={(e) => open(e.currentTarget)}
                          >
                            {product.image_path ? (
                              <ProductImage
                                path={product.image_path}
                                base={mediaBase}
                                alt={product.name}
                                size="small"
                                className="aspect-square w-full object-cover"
                              />
                            ) : (
                              <div className="bg-brand-soft aspect-square w-full" aria-hidden />
                            )}
                            <span className="block p-2 font-semibold">{product.name}</span>
                          </button>
                          <div className="mt-auto flex items-center justify-between gap-2 p-2 pt-0">
                            <span className="tabular text-sm">{price}</span>
                            {addControl}
                          </div>
                          {soldOut && <div className="px-2 pb-2">{soldOut}</div>}
                        </li>
                      );
                    }

                    if (shop.layout === 'minimaliste') {
                      return (
                        <li
                          key={product.id}
                          className={`flex items-center gap-3 py-3 ${product.is_sold_out ? 'opacity-60' : ''}`}
                        >
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-baseline gap-2 text-left"
                            onClick={(e) => open(e.currentTarget)}
                          >
                            <span className="font-medium">{product.name}</span>
                            <span
                              className="border-line min-w-4 flex-1 border-b border-dotted"
                              aria-hidden
                            />
                            <span className="tabular shrink-0">{price}</span>
                          </button>
                          {addControl}
                          {soldOut}
                        </li>
                      );
                    }

                    return (
                      <li
                        key={product.id}
                        className={`flex gap-3 py-3 ${product.is_sold_out ? 'opacity-60' : ''}`}
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 space-y-1 text-left"
                          onClick={(e) => open(e.currentTarget)}
                        >
                          <span className="block font-semibold">{product.name}</span>
                          {product.description && (
                            <span className="text-muted line-clamp-2 block text-sm">
                              {product.description}
                            </span>
                          )}
                          <span className="tabular block">{price}</span>
                          {product.tags.length > 0 && (
                            <span className="flex flex-wrap gap-1">
                              {product.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="bg-brand-soft text-brand-text rounded-full px-2 py-0.5 text-xs font-medium"
                                >
                                  {tt(tag as 'vegan')}
                                </span>
                              ))}
                            </span>
                          )}
                          {soldOut}
                        </button>
                        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                          {product.image_path && (
                            <ProductImage
                              path={product.image_path}
                              base={mediaBase}
                              alt={product.name}
                              size="small"
                              className="rounded-theme h-20 w-20 object-cover"
                            />
                          )}
                          <AllergenBadges codes={containsCodes as never} />
                          {addControl}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      {ready && count > 0 && table && (
        <div className="fixed inset-x-0 bottom-0 z-20 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="rounded-button bg-brand text-brand-fg hover:bg-brand-hover mx-auto flex min-h-14 w-full max-w-lg items-center justify-center gap-2 px-4 font-semibold shadow-lg"
          >
            <ShoppingBag aria-hidden className="h-5 w-5" />
            {t('cart.seeCart', { count, total: formatPrice(total) })}
          </button>
        </div>
      )}

      {openProduct && (
        <ProductSheet
          product={openProduct}
          mediaBase={mediaBase}
          canOrder={canOrder}
          onClose={() => {
            setOpenProduct(null);
            triggerRef.current?.focus();
          }}
          onAdd={(line) => addToCart(line, openProduct)}
        />
      )}

      {cartOpen && (
        <CartSheet
          cart={cart}
          noteEnabled={shop.orderNoteEnabled}
          canOrder={canOrder}
          sending={sending}
          error={error}
          onClose={() => {
            setCartOpen(false);
            setError(null);
          }}
          onQuantity={(key, q) => {
            setPending(null);
            update((c) => setLineQuantity(c, key, q));
          }}
          onNote={(note) => update((c) => ({ ...c, note }))}
          onSend={send}
        />
      )}

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </>
  );
}
