'use client';

import { useCallback, useEffect, useState } from 'react';
import { emptyCart, restoreCart, type Cart } from '@/features/orders/cart';

const storageKey = (shopId: string) => `atable:cart:${shopId}`;

function read(shopId: string): unknown {
  // Tab memory first, local storage as fallback (vol. 02 CLI-04).
  for (const store of [globalThis.sessionStorage, globalThis.localStorage]) {
    try {
      const raw = store?.getItem(storageKey(shopId));
      if (raw) return JSON.parse(raw);
    } catch {
      // Storage unavailable (private browsing): the cart lives in memory only.
    }
  }
  return null;
}

function write(shopId: string, cart: Cart | null): void {
  for (const store of [globalThis.sessionStorage, globalThis.localStorage]) {
    try {
      if (cart && cart.lines.length > 0) store?.setItem(storageKey(shopId), JSON.stringify(cart));
      else store?.removeItem(storageKey(shopId));
    } catch {
      // Storage unavailable: ignore.
    }
  }
}

/** Cart bound to the shop and the table; never sent to the server before validation. */
export function useCart(shopId: string, tableKey: string) {
  const [cart, setCart] = useState<Cart>(() => emptyCart(shopId, tableKey, 0));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Restored after hydration so that server and client render the same first HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage once
    setCart(restoreCart(read(shopId), shopId, tableKey));
    setReady(true);
  }, [shopId, tableKey]);

  const update = useCallback(
    (next: Cart | ((c: Cart) => Cart)) => {
      setCart((current) => {
        const value = typeof next === 'function' ? next(current) : next;
        const stamped =
          current.lines.length === 0 && value.lines.length > 0
            ? { ...value, createdAt: Date.now() }
            : value;
        write(shopId, stamped);
        return stamped;
      });
    },
    [shopId],
  );

  const clear = useCallback(() => {
    write(shopId, null);
    setCart(emptyCart(shopId, tableKey));
  }, [shopId, tableKey]);

  return { cart, update, clear, ready };
}
