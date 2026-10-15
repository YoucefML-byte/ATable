import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { env } from '@/server/env';

// Session cookies are HttpOnly: the browser never reads the session. The realtime client
// receives a short-lived access token from the server instead (see /api/realtime-token).
export const SESSION_COOKIE_OPTIONS: CookieOptions = {
  path: '/',
  sameSite: 'lax',
  httpOnly: true,
  secure: env.PUBLIC_SCHEME === 'https',
};

/**
 * Publishable key + session cookie, role authenticated. Used by the whole pro space and the
 * console: RLS applies to every query.
 */
export async function createUserClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, { ...options, ...SESSION_COOKIE_OPTIONS });
          }
        } catch {
          // Called from a Server Component: cookies are read-only there. The proxy refreshes
          // the session on every request of the pro space and the console.
        }
      },
    },
  });
}

export type UserClient = Awaited<ReturnType<typeof createUserClient>>;
