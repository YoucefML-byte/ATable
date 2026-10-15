import 'server-only';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { env } from '@/server/env';

// The only two cookies of the customer site (vol. 02 CLI-10). Strictly necessary: no banner.
export const TABLE_COOKIE = 'atable_table';
export const CLIENT_COOKIE = 'atable_client';
const MAX_AGE = 12 * 60 * 60;

export const siteCookieOptions = () => ({
  httpOnly: true,
  secure: env.PUBLIC_SCHEME === 'https',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE,
});

const TOKEN_RE = /^[A-Za-z0-9_-]{22,64}$/;
const CLIENT_RE = /^[A-Za-z0-9_-]{43}$/;

/** The table cookie holds the token and the source ("~nfc" suffix) of the scan. */
export function encodeTableCookie(token: string, source: 'qr' | 'nfc'): string {
  return source === 'nfc' ? `${token}~nfc` : token;
}

export function decodeTableCookie(
  value: string | undefined,
): { token: string; source: 'qr' | 'nfc' } | null {
  if (!value) return null;
  const [token = '', suffix] = value.split('~');
  if (!TOKEN_RE.test(token)) return null;
  return { token, source: suffix === 'nfc' ? 'nfc' : 'qr' };
}

/** 256-bit random client identifier, base64url (43 characters). */
export function newClientKey(): string {
  return randomBytes(32).toString('base64url');
}

export function isValidClientKey(value: string | undefined): value is string {
  return !!value && CLIENT_RE.test(value);
}

export async function readSiteCookies(): Promise<{
  table: { token: string; source: 'qr' | 'nfc' } | null;
  clientKey: string | null;
}> {
  const store = await cookies();
  const table = decodeTableCookie(store.get(TABLE_COOKIE)?.value);
  const client = store.get(CLIENT_COOKIE)?.value;
  return { table, clientKey: isValidClientKey(client) ? client : null };
}
