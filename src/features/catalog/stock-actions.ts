'use server';
import 'server-only';
import { z } from 'zod';
import { requireOwner, requireStaffPermission } from '@/server/auth/guards';
import { revalidateMenu } from '@/server/tenancy/invalidate';
import { err, ok, type ActionResult } from '@/lib/result';
import { mapDbError } from '@/lib/errors';

export type AvailabilityItem = { id: string; name: string; is_sold_out: boolean };
export type AvailabilityData = {
  categories: Array<
    AvailabilityItem & { products: Array<AvailabilityItem & { optionGroupIds: string[] }> }
  >;
  groups: Array<{ id: string; name: string; options: AvailabilityItem[] }>;
};

/** Everything that can be marked sold out (STK-01). */
export async function listAvailabilityAction(
  shopSlug: string,
): Promise<ActionResult<AvailabilityData>> {
  const res = await requireStaffPermission(z.string().max(40).parse(shopSlug), 'stock');
  if (!res.ok) return res;
  const { db, shop } = res.value;
  const [cats, prods, groups, opts, links] = await Promise.all([
    db
      .from('categories')
      .select('id, name, is_sold_out, position')
      .eq('shop_id', shop.id)
      .is('deleted_at', null)
      .order('position'),
    db
      .from('products')
      .select('id, name, is_sold_out, category_id, position')
      .eq('shop_id', shop.id)
      .is('deleted_at', null)
      .order('position'),
    db
      .from('option_groups')
      .select('id, name, internal_name, position')
      .eq('shop_id', shop.id)
      .is('deleted_at', null)
      .order('position'),
    db
      .from('options')
      .select('id, name, is_sold_out, group_id, position')
      .eq('shop_id', shop.id)
      .is('deleted_at', null)
      .order('position'),
    db.from('product_option_groups').select('product_id, group_id').eq('shop_id', shop.id),
  ]);
  if (cats.error || prods.error || groups.error || opts.error || links.error)
    return err('INTERNAL', 'INTERNAL');
  const groupsOf = new Map<string, string[]>();
  for (const l of links.data)
    groupsOf.set(l.product_id, [...(groupsOf.get(l.product_id) ?? []), l.group_id]);
  return ok({
    categories: cats.data.map((c) => ({
      id: c.id,
      name: c.name,
      is_sold_out: c.is_sold_out,
      products: prods.data
        .filter((p) => p.category_id === c.id)
        .map((p) => ({
          id: p.id,
          name: p.name,
          is_sold_out: p.is_sold_out,
          optionGroupIds: groupsOf.get(p.id) ?? [],
        })),
    })),
    groups: groups.data.map((g) => ({
      id: g.id,
      name: g.internal_name ?? g.name,
      options: opts.data
        .filter((o) => o.group_id === g.id)
        .map((o) => ({ id: o.id, name: o.name, is_sold_out: o.is_sold_out })),
    })),
  });
}

const soldOutSchema = z.object({
  shopSlug: z.string().max(40),
  entity: z.enum(['product', 'option', 'category']),
  id: z.uuid(),
  soldOut: z.boolean(),
});

/** Sold out / back on sale — effect immediate on the customer site, guaranteed at sending. */
export async function setSoldOutAction(
  input: z.input<typeof soldOutSchema>,
): Promise<ActionResult<boolean>> {
  const parsed = soldOutSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireStaffPermission(parsed.data.shopSlug, 'stock');
  if (!res.ok) return res;
  const { error } = await res.value.db.rpc('staff_set_sold_out', {
    p_entity: parsed.data.entity,
    p_id: parsed.data.id,
    p_sold_out: parsed.data.soldOut,
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  revalidateMenu(res.value.shop.id);
  return ok(parsed.data.soldOut);
}

/** "Tout remettre en vente" — owner only, with confirmation. */
export async function restockAllAction(shopSlug: string): Promise<ActionResult<number>> {
  const res = await requireOwner(z.string().max(40).parse(shopSlug));
  if (!res.ok) return res;
  const { data, error } = await res.value.db.rpc('owner_restock_all', {
    p_shop_id: res.value.shop.id,
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  revalidateMenu(res.value.shop.id);
  return ok(Number(data ?? 0));
}
