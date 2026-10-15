'use server';
import 'server-only';
import { requireOwner } from '@/server/auth/guards';
import { revalidateHostsOfShop } from '@/server/tenancy/invalidate';
import { err, ok, type ActionResult } from '@/lib/result';
import { mapDbError } from '@/lib/errors';
import { z } from 'zod';
import { shopSettingsSchema } from './schemas';

// Shop settings (REG-01). Column grants restrict what an owner can change; the status, slug,
// domains and features stay with the platform (console).

const nullIfEmpty = (v: string) => (v.length === 0 ? null : v);

export async function saveShopSettingsAction(
  shopSlug: string,
  input: z.input<typeof shopSettingsSchema>,
): Promise<ActionResult<null>> {
  const parsed = shopSettingsSchema.safeParse(input);
  if (!parsed.success) {
    const fields = Object.fromEntries(
      parsed.error.issues.map((i) => [String(i.path[0] ?? ''), i.message]),
    );
    return err('VALIDATION', 'VALIDATION', fields);
  }
  const res = await requireOwner(z.string().max(40).parse(shopSlug));
  if (!res.ok) return res;
  const { db, shop } = res.value;
  if (parsed.data.shopId !== shop.id) return err('FORBIDDEN', 'FORBIDDEN');
  const { shopId: _ignored, ...v } = parsed.data;
  const { error } = await db
    .from('shops')
    .update({
      ...v,
      welcome_message: nullIfEmpty(v.welcome_message),
      opening_hours_text: nullIfEmpty(v.opening_hours_text),
      address_text: nullIfEmpty(v.address_text),
      phone: nullIfEmpty(v.phone),
      legal_name: nullIfEmpty(v.legal_name),
      legal_form: nullIfEmpty(v.legal_form),
      legal_siret: nullIfEmpty(v.legal_siret),
      legal_address: nullIfEmpty(v.legal_address),
      legal_publication_director: nullIfEmpty(v.legal_publication_director),
    })
    .eq('id', shop.id);
  if (error) return err(mapDbError(error).code, 'ERROR');
  await revalidateHostsOfShop(db, shop.id);
  return ok(null);
}
