'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { listActiveOrdersAction } from '@/features/orders/staff-actions';
import type { ActiveOrdersSnapshot, StaffOrder } from '@/features/orders/staff-types';
import { useOrdersRealtime } from './use-realtime';

/**
 * Live list of active orders: realtime message → reload; reconnection and every 20 s → full
 * reload. Keeps the offset between the device clock and the server clock (CUI-01 CA1).
 */
export function useActiveOrders(opts: {
  shopId: string;
  shopSlug: string;
  supabaseUrl: string;
  publishableKey: string;
  initial: ActiveOrdersSnapshot;
}) {
  const [orders, setOrders] = useState<StaffOrder[]>(opts.initial.orders);
  const [acceptingOrders, setAcceptingOrders] = useState(opts.initial.acceptingOrders);
  const [thresholds, setThresholds] = useState({
    warning: opts.initial.kitchenWarningMinutes,
    critical: opts.initial.kitchenCriticalMinutes,
  });
  const clockOffset = useRef(opts.initial.serverNow - Date.now());
  const inflight = useRef<Promise<void> | null>(null);
  const [lastNew, setLastNew] = useState<StaffOrder | null>(null);
  const known = useRef(new Set(opts.initial.orders.map((o) => o.id)));

  const reload = useCallback(async () => {
    if (inflight.current) return inflight.current;
    const started = Date.now();
    const p = (async () => {
      const res = await listActiveOrdersAction(opts.shopSlug);
      if (!res.ok) return;
      const latency = (Date.now() - started) / 2;
      clockOffset.current = res.value.serverNow + latency - Date.now();
      const fresh = res.value.orders.filter(
        (o) => o.status === 'submitted' && !known.current.has(o.id),
      );
      for (const o of res.value.orders) known.current.add(o.id);
      if (fresh.length > 0) setLastNew(fresh[fresh.length - 1]!);
      setOrders(res.value.orders);
      setAcceptingOrders(res.value.acceptingOrders);
      setThresholds({
        warning: res.value.kitchenWarningMinutes,
        critical: res.value.kitchenCriticalMinutes,
      });
    })().finally(() => {
      inflight.current = null;
    });
    inflight.current = p;
    return p;
  }, [opts.shopSlug]);

  const status = useOrdersRealtime({
    shopId: opts.shopId,
    supabaseUrl: opts.supabaseUrl,
    publishableKey: opts.publishableKey,
    onMessage: () => void reload(),
    onResync: () => void reload(),
  });

  // Reload when the tab becomes visible again (tablet woken up).
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [reload]);

  const serverNow = useCallback(() => Date.now() + clockOffset.current, []);

  return { orders, setOrders, reload, status, serverNow, lastNew, acceptingOrders, thresholds };
}

/** Re-renders every `ms` milliseconds (timers, "3 min ago"). */
export function useTick(ms: number): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return tick;
}
