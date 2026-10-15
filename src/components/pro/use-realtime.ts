'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting';

type Options = {
  shopId: string;
  supabaseUrl: string;
  publishableKey: string;
  onMessage: (payload: { order_id: string; status: string; table_id: string }) => void;
  /** Full reload: at (re)connection and every 20 s as a safety net (SAL-01). */
  onResync: () => void;
};

async function fetchToken(): Promise<{ token: string; serverNow: number } | null> {
  try {
    const res = await fetch('/api/realtime-token', { cache: 'no-store' });
    if (!res.ok) return null;
    const body = (await res.json()) as { ok: boolean; token?: string; serverNow?: number };
    return body.ok && body.token
      ? { token: body.token, serverNow: body.serverNow ?? Date.now() }
      : null;
  } catch {
    return null;
  }
}

/**
 * Subscribes to the private channel shop:<id>:orders. The message is minimal; the screen reloads
 * the data through a normal request subject to RLS (vol. 03 §7).
 */
export function useOrdersRealtime({
  shopId,
  supabaseUrl,
  publishableKey,
  onMessage,
  onResync,
}: Options) {
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const handlers = useRef({ onMessage, onResync });
  useEffect(() => {
    handlers.current = { onMessage, onResync };
  });

  useEffect(() => {
    let client: SupabaseClient | null = null;
    let channel: RealtimeChannel | null = null;
    let disposed = false;
    let wasConnected = false;

    const start = async () => {
      const auth = await fetchToken();
      if (disposed || !auth) {
        setStatus('reconnecting');
        return;
      }
      client = createClient(supabaseUrl, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        realtime: { params: { eventsPerSecond: 10 } },
      });
      await client.realtime.setAuth(auth.token);
      channel = client
        .channel(`shop:${shopId}:orders`, { config: { private: true } })
        .on('broadcast', { event: 'order_changed' }, (msg) => {
          handlers.current.onMessage(
            msg.payload as { order_id: string; status: string; table_id: string },
          );
        })
        .subscribe((state) => {
          if (disposed) return;
          if (state === 'SUBSCRIBED') {
            setStatus('connected');
            // On every (re)connection, reload everything: nothing is missed (SAL-01 CA2).
            handlers.current.onResync();
            wasConnected = true;
          } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') {
            setStatus(wasConnected ? 'reconnecting' : 'connecting');
          }
        });
    };
    void start();

    // Safety net: full reload every 20 s even without realtime events.
    const poll = setInterval(() => handlers.current.onResync(), 20_000);
    // Refresh the access token every 10 minutes (tokens last one hour).
    const refresh = setInterval(async () => {
      const auth = await fetchToken();
      if (auth && client) await client.realtime.setAuth(auth.token);
    }, 10 * 60_000);
    const onOnline = () => handlers.current.onResync();
    window.addEventListener('online', onOnline);

    return () => {
      disposed = true;
      clearInterval(poll);
      clearInterval(refresh);
      window.removeEventListener('online', onOnline);
      if (channel && client) void client.removeChannel(channel);
    };
  }, [shopId, supabaseUrl, publishableKey]);

  return status;
}
