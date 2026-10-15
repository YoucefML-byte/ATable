import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { env } from '@/server/env';

/**
 * Secret key, role service_role: BYPASSES RLS. Closed list of uses, documented in
 * src/server/supabase/admin-usage.md. Any new use requires an ADR (vol. 05 §5).
 * ESLint forbids importing this file outside of the allowed files.
 */
export function createAdminClient() {
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'x-client-info': 'atable-admin' } },
  });
}

export type AdminClient = ReturnType<typeof createAdminClient>;
