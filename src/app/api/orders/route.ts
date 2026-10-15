import { NextResponse, type NextRequest } from 'next/server';
import { resolveShopByHost, normalizeHost } from '@/server/tenancy/resolve';
import { createPublicClient } from '@/server/supabase/public';
import { CLIENT_COOKIE, TABLE_COOKIE, decodeTableCookie, isValidClientKey } from '@/server/site/cookies';
import { isAllowedOrigin } from '@/server/security/headers';
import { placeOrderInputSchema, placeOrderResultSchema } from '@/features/orders/schemas';
import { httpStatusFor, mapDbError, type ErrorCode } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Customer order (CLI-05). A stable route (instead of a server action) allows a precise rate
// limit rule in the Vercel firewall, an explicit origin check and simple load tests (vol. 03 §5.3).
const MAX_BODY_BYTES = 32 * 1024;

function fail(code: ErrorCode, detail?: string | null) {
  return NextResponse.json({ ok: false, code, detail: detail ?? null }, { status: httpStatusFor(code), headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const hostHeader = request.headers.get('host') ?? '';
  // 1. Origin: the request must come from the shop's own site (vol. 05 M10).
  if (!isAllowedOrigin(request.headers.get('origin'), hostHeader)) return fail('BAD_ORIGIN');
  if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) return fail('BAD_REQUEST');

  // 2. Body size.
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return fail('PAYLOAD_TOO_LARGE');
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return fail('BAD_REQUEST');
  }

  // 3. Validation: strict schema, no price field accepted.
  const parsed = placeOrderInputSchema.safeParse(json);
  if (!parsed.success) return fail('BAD_REQUEST');

  // 4. Shop from the host, table and client from the cookies.
  const shop = await resolveShopByHost(normalizeHost(hostHeader));
  if (!shop || shop.status !== 'active') return fail('SHOP_UNAVAILABLE');
  const table = decodeTableCookie(request.cookies.get(TABLE_COOKIE)?.value);
  if (!table) return fail('INVALID_TABLE');
  const clientKey = request.cookies.get(CLIENT_COOKIE)?.value;
  if (!isValidClientKey(clientKey)) return fail('BAD_CLIENT');

  // 5. The database recomputes everything in one transaction (vol. 04 §7.4).
  const { data, error } = await createPublicClient().rpc('public_place_order', {
    p_shop_id: shop.shop_id,
    p_token: table.token,
    p_client_key: clientKey,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_items: parsed.data.items,
    ...(parsed.data.note ? { p_note: parsed.data.note } : {}),
    p_source: table.source,
  });
  if (error) {
    const mapped = mapDbError(error);
    if (mapped.code === 'INTERNAL') {
      logger.error({ event: 'order.place_failed', shopId: shop.shop_id, code: error.code });
    }
    const detail = mapped.code === 'PRODUCT_UNAVAILABLE' || mapped.code === 'OPTIONS_INVALID' ? mapped.detail : null;
    return fail(mapped.code, detail);
  }
  const result = placeOrderResultSchema.safeParse(data);
  if (!result.success) return fail('INTERNAL');
  logger.info({ event: 'order.placed', shopId: shop.shop_id, orderId: result.data.order_id, duplicate: result.data.duplicate });
  return NextResponse.json(
    { ok: true, number: result.data.number, subtotal_cents: result.data.subtotal_cents, duplicate: result.data.duplicate },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}

export function GET() {
  return NextResponse.json({ ok: false, code: 'BAD_REQUEST' }, { status: 405, headers: { Allow: 'POST' } });
}
