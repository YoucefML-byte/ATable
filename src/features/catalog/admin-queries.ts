import 'server-only';
import type { ShopContext } from '@/server/auth/guards';
import type { AllergenCode, ProductTag } from './menu-schema';

// Full catalog for the owner's editor (CAT-01 to CAT-03), deleted rows excluded.

export type AdminAllergen = { code: AllergenCode; presence: 'contains' | 'may_contain' };

export type AdminCatalog = {
  menus: Array<{ id: string; name: string }>;
  categories: Array<{
    id: string;
    name: string;
    description: string | null;
    prepStation: 'kitchen' | 'bar' | 'none';
    isHidden: boolean;
    isSoldOut: boolean;
    menuIds: string[];
  }>;
  products: Array<{
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    basePriceCents: number;
    imagePath: string | null;
    tags: ProductTag[];
    originInfo: string | null;
    isHidden: boolean;
    isSoldOut: boolean;
    allergensDeclaredAt: string | null;
    allergens: AdminAllergen[];
    groups: Array<{ groupId: string; minOverride: number | null; maxOverride: number | null }>;
  }>;
  groups: Array<{
    id: string;
    name: string;
    internalName: string | null;
    minSelect: number;
    maxSelect: number | null;
    allowQuantity: boolean;
    maxPerOption: number;
    isHidden: boolean;
    options: Array<{
      id: string;
      name: string;
      priceDeltaCents: number;
      isDefault: boolean;
      isHidden: boolean;
      isSoldOut: boolean;
      allergensDeclaredAt: string | null;
      allergens: AdminAllergen[];
    }>;
  }>;
};

export async function loadAdminCatalog(ctx: ShopContext): Promise<AdminCatalog | null> {
  const { db, shop } = ctx;
  const [menus, cats, menuCats, prods, prodAllergens, links, groups, opts, optAllergens] =
    await Promise.all([
      db
        .from('menus')
        .select('id, name, position')
        .eq('shop_id', shop.id)
        .is('deleted_at', null)
        .order('position'),
      db
        .from('categories')
        .select('id, name, description, prep_station, is_hidden, is_sold_out, position')
        .eq('shop_id', shop.id)
        .is('deleted_at', null)
        .order('position'),
      db.from('menu_categories').select('menu_id, category_id').eq('shop_id', shop.id),
      db
        .from('products')
        .select(
          'id, category_id, name, description, base_price_cents, image_path, tags, origin_info, is_hidden, is_sold_out, allergens_declared_at, position',
        )
        .eq('shop_id', shop.id)
        .is('deleted_at', null)
        .order('position'),
      db
        .from('product_allergens')
        .select('product_id, allergen_code, presence')
        .eq('shop_id', shop.id),
      db
        .from('product_option_groups')
        .select('product_id, group_id, position, min_override, max_override')
        .eq('shop_id', shop.id)
        .order('position'),
      db
        .from('option_groups')
        .select(
          'id, name, internal_name, min_select, max_select, allow_quantity, max_per_option, is_hidden, position',
        )
        .eq('shop_id', shop.id)
        .is('deleted_at', null)
        .order('position'),
      db
        .from('options')
        .select(
          'id, group_id, name, price_delta_cents, is_default, is_hidden, is_sold_out, allergens_declared_at, position',
        )
        .eq('shop_id', shop.id)
        .is('deleted_at', null)
        .order('position'),
      db
        .from('option_allergens')
        .select('option_id, allergen_code, presence')
        .eq('shop_id', shop.id),
    ]);
  if (
    menus.error ||
    cats.error ||
    menuCats.error ||
    prods.error ||
    prodAllergens.error ||
    links.error ||
    groups.error ||
    opts.error ||
    optAllergens.error
  ) {
    return null;
  }
  const group = <T, K>(rows: T[], key: (r: T) => K) => {
    const map = new Map<K, T[]>();
    for (const r of rows) map.set(key(r), [...(map.get(key(r)) ?? []), r]);
    return map;
  };
  const menusOf = group(menuCats.data, (r) => r.category_id);
  const pAllergens = group(prodAllergens.data, (r) => r.product_id);
  const pLinks = group(links.data, (r) => r.product_id);
  const gOptions = group(opts.data, (r) => r.group_id);
  const oAllergens = group(optAllergens.data, (r) => r.option_id);
  const liveGroups = new Set(groups.data.map((g) => g.id));
  return {
    menus: menus.data.map((m) => ({ id: m.id, name: m.name })),
    categories: cats.data.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      prepStation: c.prep_station,
      isHidden: c.is_hidden,
      isSoldOut: c.is_sold_out,
      menuIds: (menusOf.get(c.id) ?? []).map((r) => r.menu_id),
    })),
    products: prods.data.map((p) => ({
      id: p.id,
      categoryId: p.category_id,
      name: p.name,
      description: p.description,
      basePriceCents: p.base_price_cents,
      imagePath: p.image_path,
      tags: p.tags as ProductTag[],
      originInfo: p.origin_info,
      isHidden: p.is_hidden,
      isSoldOut: p.is_sold_out,
      allergensDeclaredAt: p.allergens_declared_at,
      allergens: (pAllergens.get(p.id) ?? []).map((a) => ({
        code: a.allergen_code as AllergenCode,
        presence: a.presence,
      })),
      groups: (pLinks.get(p.id) ?? [])
        .filter((l) => liveGroups.has(l.group_id))
        .map((l) => ({
          groupId: l.group_id,
          minOverride: l.min_override,
          maxOverride: l.max_override,
        })),
    })),
    groups: groups.data.map((g) => ({
      id: g.id,
      name: g.name,
      internalName: g.internal_name,
      minSelect: g.min_select,
      maxSelect: g.max_select,
      allowQuantity: g.allow_quantity,
      maxPerOption: g.max_per_option,
      isHidden: g.is_hidden,
      options: (gOptions.get(g.id) ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        priceDeltaCents: o.price_delta_cents,
        isDefault: o.is_default,
        isHidden: o.is_hidden,
        isSoldOut: o.is_sold_out,
        allergensDeclaredAt: o.allergens_declared_at,
        allergens: (oAllergens.get(o.id) ?? []).map((a) => ({
          code: a.allergen_code as AllergenCode,
          presence: a.presence,
        })),
      })),
    })),
  };
}
