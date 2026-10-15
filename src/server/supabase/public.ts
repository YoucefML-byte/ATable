import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { env } from '@/server/env';

/**
 * Publishable key, role anon, server only (customer site). It can only call the public_*
 * functions: anon has no table privilege and no policy (vol. 03 §5.2).
 */
export function createPublicClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { 'x-client-info': 'atable-site' } },
    },
  );
}

export type PublicClient = ReturnType<typeof createPublicClient>;
