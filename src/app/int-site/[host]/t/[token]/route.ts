import { NextResponse, type NextRequest } from 'next/server';
import { resolveShopByHost } from '@/server/tenancy/resolve';
import { createPublicClient } from '@/server/supabase/public';
import {
  CLIENT_COOKIE,
  TABLE_COOKIE,
  encodeTableCookie,
  isValidClientKey,
  newClientKey,
  siteCookieOptions,
} from '@/server/site/cookies';
import { mapDbError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Arrival by QR code or NFC: https://<domain>/t/<token> (CLI-01).
// Checks the token, sets the two technical cookies, then redirects to /carte: the token no longer
// appears in the address bar.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ host: string; token: string }> },
) {
  const { host, token } = await params;
  const shop = await resolveShopByHost(decodeURIComponent(host));
  const visibleOrigin = `${request.nextUrl.protocol}//${request.headers.get('host')}`;
  const go = (path: string) => NextResponse.redirect(new URL(path, visibleOrigin), 303);

  if (!shop) return go('/');
  if (shop.status !== 'active') return go('/');
  if (!/^[A-Za-z0-9_-]{22,64}$/.test(token)) return go('/qr-invalide');

  const { error } = await createPublicClient().rpc('public_open_table', {
    p_shop_id: shop.shop_id,
    p_token: token,
  });
  if (error) {
    const { code } = mapDbError(error);
    if (code !== 'INVALID_TABLE' && code !== 'SHOP_UNAVAILABLE') {
      logger.error({ event: 'site.open_table_failed', shopId: shop.shop_id, code: error.code });
    }
    return go(code === 'SHOP_UNAVAILABLE' ? '/' : '/qr-invalide');
  }

  const source = request.nextUrl.searchParams.get('s') === 'nfc' ? 'nfc' : 'qr'; // CLI-01 CA4
  const response = go('/carte');
  const options = siteCookieOptions();
  response.cookies.set(TABLE_COOKIE, encodeTableCookie(token, source), options);
  const existing = request.cookies.get(CLIENT_COOKIE)?.value;
  response.cookies.set(
    CLIENT_COOKIE,
    isValidClientKey(existing) ? existing : newClientKey(),
    options,
  );
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
