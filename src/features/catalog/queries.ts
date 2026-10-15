import 'server-only';
import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/server/supabase/public';
import { menuSchema, type Menu } from './menu-schema';
import { logger } from '@/lib/logger';

export const menuTag = (shopId: string) => `menu:${shopId}`;

async function fetchMenu(shopId: string): Promise<Menu | null> {
  const { data, error } = await createPublicClient().rpc('public_get_menu', { p_shop_id: shopId });
  if (error) {
    logger.error({ event: 'menu.fetch_failed', shopId, code: error.code });
    throw new Error('Menu fetch failed');
  }
  if (data === null) return null;
  const parsed = menuSchema.safeParse(data);
  if (!parsed.success) {
    logger.error({ event: 'menu.invalid', shopId });
    return null;
  }
  return parsed.data;
}

/**
 * Menu of a shop, cached 30 s with the tag menu:<shopId>, invalidated on every change of the
 * catalog or of an availability. The final validity is always checked when the order is sent,
 * so a slightly late cache has no consequence on integrity (vol. 03 §12).
 */
export async function getPublicMenu(shopId: string): Promise<Menu | null> {
  return unstable_cache(() => fetchMenu(shopId), ['public-menu', shopId], {
    revalidate: 30,
    tags: [menuTag(shopId)],
  })();
}
