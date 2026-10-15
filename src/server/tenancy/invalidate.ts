import 'server-only';
import { revalidateTag } from 'next/cache';
import type { UserClient } from '@/server/supabase/user';
import { hostTag } from './resolve';
import { menuTag } from '@/features/catalog/queries';

/**
 * Invalidates the host-resolution cache of every domain of a shop (theme, status, settings,
 * domains changed). `{ expire: 0 }`: the next visitor waits for fresh data (vol. 03 §4.3).
 */
export async function revalidateHostsOfShop(db: UserClient, shopId: string): Promise<void> {
  const { data } = await db.from('shop_domains').select('hostname').eq('shop_id', shopId);
  for (const d of data ?? []) revalidateTag(hostTag(d.hostname), { expire: 0 });
}

export function revalidateMenu(shopId: string): void {
  revalidateTag(menuTag(shopId), { expire: 0 });
}

export function revalidateTables(shopId: string): void {
  revalidateTag(`tables:${shopId}`, { expire: 0 });
}
