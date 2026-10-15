'use server';
import 'server-only';
import { z } from 'zod';
import { requireOwner, type ShopContext } from '@/server/auth/guards';
import { revalidateMenu } from '@/server/tenancy/invalidate';
import { deleteStoredImage, ImageError, processAndStoreImage } from '@/server/media/images';
import { err, ok, type ActionResult } from '@/lib/result';
import { mapDbError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import {
  allergensInputSchema,
  categoryInputSchema,
  groupInputSchema,
  optionInputSchema,
  productInputSchema,
  type AllergensInput,
  type CategoryInput,
  type GroupInput,
  type OptionInput,
  type ProductInput,
} from './schemas';

// Catalog management by the owner (CAT-01 to CAT-03). Writes go through the user client: RLS
// (owner of a writable shop) applies; complex operations are SQL functions.

const slug = z.string().min(1).max(40);
const dbFail = (error: {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}) => {
  const mapped = mapDbError(error);
  if (mapped.code === 'INTERNAL') logger.error({ event: 'catalog.db_error', code: error.code });
  return err(mapped.code, mapped.code);
};

export async function saveCategoryAction(input: CategoryInput): Promise<ActionResult<string>> {
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(parsed.data.shopSlug);
  if (!res.ok) return res;
  const { db, shop } = res.value;
  const values = {
    name: parsed.data.name,
    description: parsed.data.description,
    prep_station: parsed.data.prepStation,
    is_hidden: parsed.data.isHidden,
    is_sold_out: parsed.data.isSoldOut,
  };
  let id = parsed.data.id;
  if (id) {
    const { error } = await db
      .from('categories')
      .update(values)
      .eq('id', id)
      .eq('shop_id', shop.id);
    if (error) return dbFail(error);
  } else {
    const { data: last } = await db
      .from('categories')
      .select('position')
      .eq('shop_id', shop.id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await db
      .from('categories')
      .insert({ ...values, shop_id: shop.id, position: (last?.position ?? 0) + 1 })
      .select('id')
      .single();
    if (error) return dbFail(error);
    id = data.id;
  }
  // Menus of the category (n:m).
  const { data: current } = await db
    .from('menu_categories')
    .select('menu_id')
    .eq('category_id', id);
  const wanted = new Set(parsed.data.menuIds);
  const existing = new Set((current ?? []).map((r) => r.menu_id));
  const toRemove = [...existing].filter((m) => !wanted.has(m));
  const toAdd = [...wanted].filter((m) => !existing.has(m));
  if (toRemove.length > 0) {
    const { error } = await db
      .from('menu_categories')
      .delete()
      .eq('category_id', id)
      .in('menu_id', toRemove);
    if (error) return dbFail(error);
  }
  if (toAdd.length > 0) {
    const { error } = await db.from('menu_categories').insert(
      toAdd.map((menuId) => ({
        menu_id: menuId,
        category_id: id!,
        shop_id: shop.id,
        position: 99,
      })),
    );
    if (error) return dbFail(error);
  }
  revalidateMenu(shop.id);
  return ok(id);
}

const deleteSchema = z
  .object({
    shopSlug: slug,
    entity: z.enum(['category', 'product', 'option_group', 'option', 'menu', 'table']),
    id: z.uuid(),
  })
  .strict();

/** Soft delete (history stays readable); a non-empty category is refused (CAT-01). */
export async function softDeleteAction(
  input: z.input<typeof deleteSchema>,
): Promise<ActionResult<null>> {
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(parsed.data.shopSlug);
  if (!res.ok) return res;
  const { error } = await res.value.db.rpc('owner_soft_delete', {
    p_entity: parsed.data.entity,
    p_id: parsed.data.id,
  });
  if (error) return dbFail(error);
  revalidateMenu(res.value.shop.id);
  return ok(null);
}

const reorderSchema = z
  .object({
    shopSlug: slug,
    entity: z.enum(['category', 'product', 'option_group', 'option', 'menu', 'table']),
    ids: z.array(z.uuid()).min(1).max(1000),
  })
  .strict();

export async function reorderAction(
  input: z.input<typeof reorderSchema>,
): Promise<ActionResult<null>> {
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(parsed.data.shopSlug);
  if (!res.ok) return res;
  const { error } = await res.value.db.rpc('owner_reorder', {
    p_entity: parsed.data.entity,
    p_ids: parsed.data.ids,
  });
  if (error) return dbFail(error);
  revalidateMenu(res.value.shop.id);
  return ok(null);
}

/** Creates the "sizes" template group (S / M / L) for a new product. */
async function createSizesGroup(ctx: ShopContext): Promise<string | null> {
  const { data: group, error } = await ctx.db
    .from('option_groups')
    .insert({
      shop_id: ctx.shop.id,
      name: 'Taille',
      internal_name: `Tailles ${new Date().toISOString().slice(0, 10)}`,
      min_select: 1,
      max_select: 1,
    })
    .select('id')
    .single();
  if (error) return null;
  await ctx.db.from('options').insert([
    { shop_id: ctx.shop.id, group_id: group.id, name: 'S', price_delta_cents: 0, position: 1 },
    {
      shop_id: ctx.shop.id,
      group_id: group.id,
      name: 'M',
      price_delta_cents: 0,
      position: 2,
      is_default: true,
    },
    { shop_id: ctx.shop.id, group_id: group.id, name: 'L', price_delta_cents: 0, position: 3 },
  ]);
  return group.id;
}

export async function saveProductAction(input: ProductInput): Promise<ActionResult<string>> {
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(parsed.data.shopSlug);
  if (!res.ok) return res;
  const { db, shop } = res.value;
  const values = {
    category_id: parsed.data.categoryId,
    name: parsed.data.name,
    description: parsed.data.description,
    base_price_cents: parsed.data.basePriceCents,
    tags: parsed.data.tags,
    origin_info: parsed.data.originInfo,
    is_hidden: parsed.data.isHidden,
    is_sold_out: parsed.data.isSoldOut,
  };
  let id = parsed.data.id;
  const groups = [...parsed.data.groups];
  if (id) {
    const { error } = await db.from('products').update(values).eq('id', id).eq('shop_id', shop.id);
    if (error) return dbFail(error);
  } else {
    const { data: last } = await db
      .from('products')
      .select('position')
      .eq('category_id', parsed.data.categoryId)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await db
      .from('products')
      .insert({ ...values, shop_id: shop.id, position: (last?.position ?? 0) + 1 })
      .select('id')
      .single();
    if (error) return dbFail(error);
    id = data.id;
    if (parsed.data.template === 'sizes' && groups.length === 0) {
      const groupId = await createSizesGroup(res.value);
      if (groupId) groups.push({ groupId, minOverride: null, maxOverride: null });
    }
  }
  // Option groups linked to the product, in order, with per-product min/max overrides.
  const { error: delError } = await db.from('product_option_groups').delete().eq('product_id', id);
  if (delError) return dbFail(delError);
  if (groups.length > 0) {
    const { error } = await db.from('product_option_groups').insert(
      groups.map((g, i) => ({
        product_id: id!,
        group_id: g.groupId,
        shop_id: shop.id,
        position: i + 1,
        min_override: g.minOverride,
        max_override: g.maxOverride,
      })),
    );
    if (error) return dbFail(error);
  }
  revalidateMenu(shop.id);
  return ok(id);
}

export async function duplicateProductAction(
  shopSlug: string,
  productId: string,
): Promise<ActionResult<string>> {
  const res = await requireOwner(slug.parse(shopSlug));
  if (!res.ok) return res;
  const { data, error } = await res.value.db.rpc('owner_duplicate_product', {
    p_product_id: z.uuid().parse(productId),
  });
  if (error) return dbFail(error);
  revalidateMenu(res.value.shop.id);
  return ok(String(data));
}

export async function setAllergensAction(input: AllergensInput): Promise<ActionResult<null>> {
  const parsed = allergensInputSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(parsed.data.shopSlug);
  if (!res.ok) return res;
  const fn =
    parsed.data.kind === 'product' ? 'owner_set_product_allergens' : 'owner_set_option_allergens';
  const args =
    parsed.data.kind === 'product'
      ? {
          p_product_id: parsed.data.id,
          p_allergens: parsed.data.allergens,
          p_none: parsed.data.none,
        }
      : {
          p_option_id: parsed.data.id,
          p_allergens: parsed.data.allergens,
          p_none: parsed.data.none,
        };
  const { error } = await res.value.db.rpc(fn, args as never);
  if (error) return dbFail(error);
  revalidateMenu(res.value.shop.id);
  return ok(null);
}

export async function saveGroupAction(input: GroupInput): Promise<ActionResult<string>> {
  const parsed = groupInputSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(parsed.data.shopSlug);
  if (!res.ok) return res;
  const { db, shop } = res.value;
  const values = {
    name: parsed.data.name,
    internal_name: parsed.data.internalName,
    min_select: parsed.data.minSelect,
    max_select: parsed.data.maxSelect,
    allow_quantity: parsed.data.allowQuantity,
    max_per_option: parsed.data.maxPerOption,
    is_hidden: parsed.data.isHidden,
  };
  if (parsed.data.id) {
    const { error } = await db
      .from('option_groups')
      .update(values)
      .eq('id', parsed.data.id)
      .eq('shop_id', shop.id);
    if (error) return dbFail(error);
    revalidateMenu(shop.id);
    return ok(parsed.data.id);
  }
  const { data, error } = await db
    .from('option_groups')
    .insert({ ...values, shop_id: shop.id })
    .select('id')
    .single();
  if (error) return dbFail(error);
  revalidateMenu(shop.id);
  return ok(data.id);
}

export async function saveOptionAction(input: OptionInput): Promise<ActionResult<string>> {
  const parsed = optionInputSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(parsed.data.shopSlug);
  if (!res.ok) return res;
  const { db, shop } = res.value;
  const values = {
    group_id: parsed.data.groupId,
    name: parsed.data.name,
    price_delta_cents: parsed.data.priceDeltaCents,
    is_default: parsed.data.isDefault,
    is_hidden: parsed.data.isHidden,
    is_sold_out: parsed.data.isSoldOut,
  };
  if (parsed.data.id) {
    const { error } = await db
      .from('options')
      .update(values)
      .eq('id', parsed.data.id)
      .eq('shop_id', shop.id);
    if (error) return dbFail(error);
    revalidateMenu(shop.id);
    return ok(parsed.data.id);
  }
  const { data: last } = await db
    .from('options')
    .select('position')
    .eq('group_id', parsed.data.groupId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await db
    .from('options')
    .insert({ ...values, shop_id: shop.id, position: (last?.position ?? 0) + 1 })
    .select('id')
    .single();
  if (error) return dbFail(error);
  revalidateMenu(shop.id);
  return ok(data.id);
}

/**
 * Product photo upload (the browser has already reduced it to <= 2000 px): real type check,
 * WebP re-encoding without metadata, then replacement of the previous files.
 */
export async function uploadProductPhotoAction(formData: FormData): Promise<ActionResult<string>> {
  const shopSlug = slug.safeParse(formData.get('shopSlug'));
  const productId = z.uuid().safeParse(formData.get('productId'));
  const file = formData.get('file');
  if (!shopSlug.success || !productId.success || !(file instanceof File))
    return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(shopSlug.data);
  if (!res.ok) return res;
  const { db, shop } = res.value;
  const { data: product } = await db
    .from('products')
    .select('id, image_path')
    .eq('id', productId.data)
    .eq('shop_id', shop.id)
    .maybeSingle();
  if (!product) return err('NOT_FOUND', 'NOT_FOUND');
  let path: string;
  try {
    path = await processAndStoreImage(shop.id, 'products', file);
  } catch (e) {
    if (e instanceof ImageError) return err(e.code, e.code);
    logger.error({ event: 'catalog.photo_failed', error: e });
    return err('INTERNAL', 'INTERNAL');
  }
  const { error } = await db.from('products').update({ image_path: path }).eq('id', product.id);
  if (error) {
    await deleteStoredImage(path);
    return dbFail(error);
  }
  await deleteStoredImage(product.image_path);
  revalidateMenu(shop.id);
  return ok(path);
}

export async function removeProductPhotoAction(
  shopSlug: string,
  productId: string,
): Promise<ActionResult<null>> {
  const res = await requireOwner(slug.parse(shopSlug));
  if (!res.ok) return res;
  const { db, shop } = res.value;
  const { data: product } = await db
    .from('products')
    .select('id, image_path')
    .eq('id', z.uuid().parse(productId))
    .eq('shop_id', shop.id)
    .maybeSingle();
  if (!product) return err('NOT_FOUND', 'NOT_FOUND');
  const { error } = await db.from('products').update({ image_path: null }).eq('id', product.id);
  if (error) return dbFail(error);
  await deleteStoredImage(product.image_path);
  revalidateMenu(shop.id);
  return ok(null);
}
