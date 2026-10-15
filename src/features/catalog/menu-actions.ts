'use server';
import 'server-only';
import { z } from 'zod';
import { TZDate } from '@date-fns/tz';
import { requireOwner } from '@/server/auth/guards';
import { revalidateMenu } from '@/server/tenancy/invalidate';
import { err, ok, type ActionResult } from '@/lib/result';
import { mapDbError } from '@/lib/errors';
import { menuSchema } from './menu-schema';

// Menus and time slots (CAT-04). A menu without a slot is always active; a slot whose end is
// before its start runs until the next day (vol. 04 §5).

const slug = z.string().min(1).max(40);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const scheduleSchema = z
  .object({
    days: z.array(z.number().int().min(1).max(7)).min(1).max(7),
    start: time,
    end: time,
  })
  .strict()
  .refine((s) => s.start !== s.end, { message: 'sameTimes' });

const menuInputSchema = z
  .object({
    shopSlug: slug,
    id: z.uuid().nullable(),
    name: z.string().trim().min(1).max(60),
    description: z
      .string()
      .trim()
      .max(300)
      .transform((v) => (v.length === 0 ? null : v)),
    isActive: z.boolean(),
    schedules: z.array(scheduleSchema).max(30),
    categoryIds: z.array(z.uuid()).max(200),
  })
  .strict();

export type MenuInput = z.input<typeof menuInputSchema>;

export async function saveMenuAction(input: MenuInput): Promise<ActionResult<string>> {
  const parsed = menuInputSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(parsed.data.shopSlug);
  if (!res.ok) return res;
  const { db, shop } = res.value;
  const fail = (e: { code?: string; message?: string }) => err(mapDbError(e).code, 'ERROR');
  const values = {
    name: parsed.data.name,
    description: parsed.data.description,
    is_active: parsed.data.isActive,
  };
  let id = parsed.data.id;
  if (id) {
    const { error } = await db.from('menus').update(values).eq('id', id).eq('shop_id', shop.id);
    if (error) return fail(error);
  } else {
    const [{ data: last }, { count }] = await Promise.all([
      db
        .from('menus')
        .select('position')
        .eq('shop_id', shop.id)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from('menus')
        .select('id', { count: 'exact', head: true })
        .eq('shop_id', shop.id)
        .is('deleted_at', null),
    ]);
    const { data, error } = await db
      .from('menus')
      .insert({
        ...values,
        shop_id: shop.id,
        position: (last?.position ?? 0) + 1,
        is_default: (count ?? 0) === 0,
      })
      .select('id')
      .single();
    if (error) return fail(error);
    id = data.id;
  }
  const menuId = id;
  // Slots: replaced as a whole (small volume, simple to reason about).
  const { error: delError } = await db.from('menu_schedules').delete().eq('menu_id', menuId);
  if (delError) return fail(delError);
  if (parsed.data.schedules.length > 0) {
    const { error } = await db
      .from('menu_schedules')
      .insert(
        parsed.data.schedules.map((s) => ({
          shop_id: shop.id,
          menu_id: menuId,
          days: [...new Set(s.days)].sort(),
          start_time: s.start,
          end_time: s.end,
        })),
      );
    if (error) return fail(error);
  }
  // Categories shown by this menu.
  const { data: current } = await db
    .from('menu_categories')
    .select('category_id')
    .eq('menu_id', menuId);
  const wanted = new Set(parsed.data.categoryIds);
  const existing = new Set((current ?? []).map((r) => r.category_id));
  const toRemove = [...existing].filter((c) => !wanted.has(c));
  const toAdd = parsed.data.categoryIds.filter((c) => !existing.has(c));
  if (toRemove.length > 0) {
    const { error } = await db
      .from('menu_categories')
      .delete()
      .eq('menu_id', menuId)
      .in('category_id', toRemove);
    if (error) return fail(error);
  }
  if (toAdd.length > 0) {
    const { error } = await db
      .from('menu_categories')
      .insert(
        toAdd.map((categoryId) => ({
          menu_id: menuId,
          category_id: categoryId,
          shop_id: shop.id,
          position: parsed.data.categoryIds.indexOf(categoryId) + 1,
        })),
      );
    if (error) return fail(error);
  }
  revalidateMenu(shop.id);
  return ok(menuId);
}

export async function setDefaultMenuAction(
  shopSlug: string,
  menuId: string,
): Promise<ActionResult<null>> {
  const res = await requireOwner(slug.parse(shopSlug));
  if (!res.ok) return res;
  const { error } = await res.value.db.rpc('owner_set_default_menu', {
    p_menu_id: z.uuid().parse(menuId),
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  revalidateMenu(res.value.shop.id);
  return ok(null);
}

const previewSchema = z.object({ shopSlug: slug, date: z.iso.date(), time }).strict();

/** Simulator: what a customer would see at a given local date and time of the shop. */
export async function previewMenuAction(
  input: z.input<typeof previewSchema>,
): Promise<ActionResult<{ menus: string[]; categories: string[] }>> {
  const parsed = previewSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(parsed.data.shopSlug);
  if (!res.ok) return res;
  const [y, m, d] = parsed.data.date.split('-').map(Number) as [number, number, number];
  const [hh, mm] = parsed.data.time.split(':').map(Number) as [number, number];
  const at = new TZDate(y, m - 1, d, hh, mm, res.value.shop.timezone);
  const { data, error } = await res.value.db.rpc('staff_preview_menu', {
    p_shop_id: res.value.shop.id,
    p_at: at.toISOString(),
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  const menu = menuSchema.safeParse(data);
  if (!menu.success) return err('INTERNAL', 'INTERNAL');
  return ok({
    menus: menu.data.active_menus.map((x) => x.name),
    categories: menu.data.categories.map((c) => c.name),
  });
}
