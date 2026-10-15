import { z } from 'zod';

// Shape of public_get_menu / staff_preview_menu (vol. 04 §7.2).

export const allergenRefSchema = z.object({
  code: z.string(),
  presence: z.enum(['contains', 'may_contain']),
});

export const menuOptionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  price_delta_cents: z.number().int(),
  is_default: z.boolean(),
  is_sold_out: z.boolean(),
  allergens: z.array(allergenRefSchema),
});

export const menuGroupSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  min: z.number().int(),
  max: z.number().int().nullable(),
  allow_quantity: z.boolean(),
  max_per_option: z.number().int(),
  options: z.array(menuOptionSchema),
});

export const menuProductSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  base_price_cents: z.number().int(),
  min_price_cents: z.number().int(),
  has_paid_options: z.boolean(),
  image_path: z.string().nullable(),
  tags: z.array(z.string()),
  origin_info: z.string().nullable(),
  is_sold_out: z.boolean(),
  allergens_declared: z.boolean(),
  allergens: z.array(allergenRefSchema),
  option_groups: z.array(menuGroupSchema),
});

export const menuCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  is_sold_out: z.boolean(),
  prep_station: z.enum(['kitchen', 'bar', 'none']),
  products: z.array(menuProductSchema),
});

export const menuSchema = z.object({
  generated_at: z.string(),
  active_menus: z.array(z.object({ id: z.uuid(), name: z.string() })),
  next_change_at: z.string().nullable(),
  categories: z.array(menuCategorySchema),
});

export type MenuOption = z.infer<typeof menuOptionSchema>;
export type MenuGroup = z.infer<typeof menuGroupSchema>;
export type MenuProduct = z.infer<typeof menuProductSchema>;
export type MenuCategory = z.infer<typeof menuCategorySchema>;
export type Menu = z.infer<typeof menuSchema>;

export const ALLERGEN_CODES = [
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soybeans',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs',
] as const;
export type AllergenCode = (typeof ALLERGEN_CODES)[number];

export const PRODUCT_TAGS = [
  'vegetarian',
  'vegan',
  'spicy',
  'homemade',
  'new',
  'signature',
  'gluten_free',
] as const;
export type ProductTag = (typeof PRODUCT_TAGS)[number];
