import { z } from 'zod';

export const themeSchema = z.object({
  preset: z.string(),
  primary_color: z.string(),
  accent_color: z.string(),
  font_pair: z.enum(['classique', 'bistrot', 'moderne', 'street', 'elegant', 'doux']),
  radius: z.enum(['carre', 'doux', 'arrondi']),
  density: z.enum(['compacte', 'aeree']),
  menu_layout: z.enum(['liste', 'grille', 'minimaliste']),
  color_scheme: z.enum(['clair', 'sombre', 'auto']),
  logo_path: z.string().nullable(),
  cover_path: z.string().nullable(),
});
export type ShopTheme = z.infer<typeof themeSchema>;

export const resolvedShopSchema = z.object({
  shop_id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  status: z.enum(['onboarding', 'active', 'suspended', 'archived']),
  business_type: z.string(),
  timezone: z.string(),
  currency: z.string(),
  locale: z.string(),
  is_primary_host: z.boolean(),
  primary_host: z.string().nullable(),
  public_menu_enabled: z.boolean(),
  accepting_orders: z.boolean(),
  order_note_enabled: z.boolean(),
  sold_out_label: z.string(),
  price_notice: z.string(),
  welcome_message: z.string().nullable(),
  opening_hours_text: z.string().nullable(),
  address_text: z.string().nullable(),
  phone: z.string().nullable(),
  legal: z.object({
    name: z.string().nullable(),
    form: z.string().nullable(),
    siret: z.string().nullable(),
    address: z.string().nullable(),
    publication_director: z.string().nullable(),
  }),
  theme: themeSchema.nullable(),
});
export type ResolvedShop = z.infer<typeof resolvedShopSchema>;

// Settings form (REG-01). Same limits as the SQL constraints (vol. 05 §7).
export const shopSettingsSchema = z
  .object({
    shopId: z.uuid(),
    name: z.string().trim().min(1).max(80),
    welcome_message: z.string().trim().max(500),
    opening_hours_text: z.string().trim().max(500),
    address_text: z.string().trim().max(300),
    phone: z.string().trim().max(30),
    accepting_orders: z.boolean(),
    public_menu_enabled: z.boolean(),
    order_note_enabled: z.boolean(),
    sold_out_label: z.string().trim().min(1).max(40),
    price_notice: z.string().trim().max(120),
    business_day_start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    kitchen_warning_minutes: z.number().int().min(1).max(240),
    kitchen_critical_minutes: z.number().int().min(2).max(480),
    floor_alert_repeat_seconds: z.number().int().min(0).max(600),
    staff_idle_lock_minutes: z.number().int().min(1).max(120),
    max_orders_per_client_10min: z.number().int().min(1).max(50),
    max_pending_orders_per_table: z.number().int().min(1).max(100),
    max_lines_per_order: z.number().int().min(1).max(200),
    max_quantity_per_line: z.number().int().min(1).max(200),
    max_order_total_cents: z.number().int().min(1).max(10_000_000),
    legal_name: z.string().trim().max(120),
    legal_form: z.string().trim().max(60),
    legal_siret: z
      .string()
      .trim()
      .regex(/^(\d{14})?$/),
    legal_address: z.string().trim().max(300),
    legal_publication_director: z.string().trim().max(120),
  })
  .strict()
  .refine((v) => v.kitchen_critical_minutes > v.kitchen_warning_minutes, {
    path: ['kitchen_critical_minutes'],
    message: 'kitchenThresholds',
  });
export type ShopSettingsInput = z.infer<typeof shopSettingsSchema>;
