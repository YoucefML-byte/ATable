'use server';
import 'server-only';
import { z } from 'zod';
import { requireOwner } from '@/server/auth/guards';
import { revalidateHostsOfShop } from '@/server/tenancy/invalidate';
import { createAdminClient } from '@/server/supabase/admin';
import { deleteStoredImage, ImageError, processAndStoreImage } from '@/server/media/images';
import { err, ok, type ActionResult } from '@/lib/result';
import { mapDbError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { FONT_PAIRS, validateThemeContrast } from './theme';

// Theme editor (REG-02). The contrast check is repeated here: the browser check is only a help.

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const themeInputSchema = z
  .object({
    preset: z.string().regex(/^[a-z0-9-]{1,60}$/),
    primary_color: hex,
    accent_color: hex,
    font_pair: z.enum(
      Object.keys(FONT_PAIRS) as [keyof typeof FONT_PAIRS, ...Array<keyof typeof FONT_PAIRS>],
    ),
    radius: z.enum(['carre', 'doux', 'arrondi']),
    density: z.enum(['compacte', 'aeree']),
    menu_layout: z.enum(['liste', 'grille', 'minimaliste']),
    color_scheme: z.enum(['clair', 'sombre', 'auto']),
  })
  .strict();

export type ThemeInput = z.input<typeof themeInputSchema>;

export async function saveThemeAction(
  shopSlug: string,
  input: ThemeInput,
): Promise<ActionResult<null>> {
  const parsed = themeInputSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  if (validateThemeContrast(parsed.data).length > 0)
    return err('CONTRAST_TOO_LOW', 'CONTRAST_TOO_LOW');
  const res = await requireOwner(z.string().max(40).parse(shopSlug));
  if (!res.ok) return res;
  const { db, shop } = res.value;
  const { error } = await db.from('shop_themes').update(parsed.data).eq('shop_id', shop.id);
  if (error) return err(mapDbError(error).code, 'ERROR');
  await revalidateHostsOfShop(db, shop.id);
  return ok(null);
}

/** Logo or cover: same pipeline as product photos; the path is written with the secret key. */
export async function uploadThemeImageAction(formData: FormData): Promise<ActionResult<string>> {
  const shopSlug = z.string().max(40).safeParse(formData.get('shopSlug'));
  const kind = z.enum(['logo', 'cover']).safeParse(formData.get('kind'));
  const file = formData.get('file');
  if (!shopSlug.success || !kind.success || !(file instanceof File))
    return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(shopSlug.data);
  if (!res.ok) return res;
  const { db, shop } = res.value;
  const column: 'logo_path' | 'cover_path' = kind.data === 'logo' ? 'logo_path' : 'cover_path';
  const { data: current } = await db
    .from('shop_themes')
    .select('logo_path, cover_path')
    .eq('shop_id', shop.id)
    .single();
  let path: string;
  try {
    path = await processAndStoreImage(shop.id, kind.data, file);
  } catch (e) {
    if (e instanceof ImageError) return err(e.code, e.code);
    logger.error({ event: 'theme.image_failed', error: e });
    return err('INTERNAL', 'INTERNAL');
  }
  const { error } = await createAdminClient()
    .from('shop_themes')
    .update(column === 'logo_path' ? { logo_path: path } : { cover_path: path })
    .eq('shop_id', shop.id);
  if (error) {
    await deleteStoredImage(path);
    return err('INTERNAL', 'INTERNAL');
  }
  await deleteStoredImage(current?.[column] ?? null);
  await revalidateHostsOfShop(db, shop.id);
  return ok(path);
}

export async function removeThemeImageAction(
  shopSlug: string,
  kind: 'logo' | 'cover',
): Promise<ActionResult<null>> {
  const res = await requireOwner(z.string().max(40).parse(shopSlug));
  if (!res.ok) return res;
  const { db, shop } = res.value;
  const column: 'logo_path' | 'cover_path' =
    z.enum(['logo', 'cover']).parse(kind) === 'logo' ? 'logo_path' : 'cover_path';
  const { data: current } = await db
    .from('shop_themes')
    .select('logo_path, cover_path')
    .eq('shop_id', shop.id)
    .single();
  const { error } = await createAdminClient()
    .from('shop_themes')
    .update(column === 'logo_path' ? { logo_path: null } : { cover_path: null })
    .eq('shop_id', shop.id);
  if (error) return err('INTERNAL', 'INTERNAL');
  await deleteStoredImage(current?.[column] ?? null);
  await revalidateHostsOfShop(db, shop.id);
  return ok(null);
}
