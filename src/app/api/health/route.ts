import { NextResponse } from 'next/server';
import { createPublicClient } from '@/server/supabase/public';
import { normalizeHost, resolveShopByHost } from '@/server/tenancy/resolve';
import { env } from '@/server/env';
import { logger } from '@/lib/logger';

// Health check for the uptime monitor (vol. 08 §4): application, database (light query) and host
// resolution. Never returns sensitive information.
export async function GET(request: Request) {
  const host = normalizeHost(request.headers.get('host'));
  try {
    const { error } = await createPublicClient().rpc('public_resolve_host', { p_host: '__healthcheck__' });
    if (error) throw new Error(error.code);
    const platformHosts = [env.PLATFORM_PRO_HOST, env.PLATFORM_CONSOLE_HOST, env.PLATFORM_ROOT_DOMAIN].map(normalizeHost);
    if (!platformHosts.includes(host)) {
      const shop = await resolveShopByHost(host);
      if (!shop) return NextResponse.json({ status: 'unknown_host' }, { status: 404, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    logger.error({ event: 'health.failed', error: e });
    return NextResponse.json({ status: 'error' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
