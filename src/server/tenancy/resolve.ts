import 'server-only';
import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/server/supabase/public';
import { resolvedShopSchema, type ResolvedShop } from '@/features/shops/schemas';
import { logger } from '@/lib/logger';

export const hostTag = (host: string) => `host:${host}`;
export const shopTag = (shopId: string) => `shop:${shopId}`;

/** Normalises a host: lower case, no port, no trailing dot (vol. 03 §4.2). */
export function normalizeHost(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
}

async function fetchShop(host: string): Promise<ResolvedShop | null> {
  const { data, error } = await createPublicClient().rpc('public_resolve_host', { p_host: host });
  if (error) {
    logger.error({ event: 'tenancy.resolve_failed', host, code: error.code });
    throw new Error('Host resolution failed');
  }
  if (data === null) return null;
  const parsed = resolvedShopSchema.safeParse(data);
  if (!parsed.success) {
    logger.error({ event: 'tenancy.resolve_invalid', host });
    return null;
  }
  return parsed.data;
}

/**
 * Shop of a host, cached 60 s on the Next.js server with the tag host:<host> (and shop:<id>),
 * invalidated on any change of domain, theme or status (vol. 03 §4.3).
 */
export async function resolveShopByHost(host: string): Promise<ResolvedShop | null> {
  const normalized = normalizeHost(host);
  if (!normalized) return null;
  return unstable_cache(() => fetchShop(normalized), ['resolve-host', normalized], {
    revalidate: 60,
    tags: [hostTag(normalized), 'hosts'],
  })();
}
