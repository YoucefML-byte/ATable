import type { Metadata } from 'next';
import { requireShopPage } from '@/server/auth/guards';
import { SettingsView } from '@/components/pro/settings-view';

export const metadata: Metadata = { title: 'Réglages' };

export default async function SettingsPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug, 'owner');
  const { data: s } = await ctx.db
    .from('shops')
    .select(
      'id, name, welcome_message, opening_hours_text, address_text, phone, accepting_orders, public_menu_enabled, order_note_enabled, sold_out_label, price_notice, business_day_start, kitchen_warning_minutes, kitchen_critical_minutes, floor_alert_repeat_seconds, staff_idle_lock_minutes, max_orders_per_client_10min, max_pending_orders_per_table, max_lines_per_order, max_quantity_per_line, max_order_total_cents, legal_name, legal_form, legal_siret, legal_address, legal_publication_director',
    )
    .eq('id', ctx.shop.id)
    .single();
  if (!s) throw new Error('settings.load_failed');
  return (
    <SettingsView
      shopSlug={ctx.shop.slug}
      initial={{
        shopId: s.id,
        name: s.name,
        welcome_message: s.welcome_message ?? '',
        opening_hours_text: s.opening_hours_text ?? '',
        address_text: s.address_text ?? '',
        phone: s.phone ?? '',
        accepting_orders: s.accepting_orders,
        public_menu_enabled: s.public_menu_enabled,
        order_note_enabled: s.order_note_enabled,
        sold_out_label: s.sold_out_label,
        price_notice: s.price_notice,
        business_day_start: s.business_day_start.slice(0, 5),
        kitchen_warning_minutes: s.kitchen_warning_minutes,
        kitchen_critical_minutes: s.kitchen_critical_minutes,
        floor_alert_repeat_seconds: s.floor_alert_repeat_seconds,
        staff_idle_lock_minutes: s.staff_idle_lock_minutes,
        max_orders_per_client_10min: s.max_orders_per_client_10min,
        max_pending_orders_per_table: s.max_pending_orders_per_table,
        max_lines_per_order: s.max_lines_per_order,
        max_quantity_per_line: s.max_quantity_per_line,
        max_order_total_cents: s.max_order_total_cents,
        legal_name: s.legal_name ?? '',
        legal_form: s.legal_form ?? '',
        legal_siret: s.legal_siret ?? '',
        legal_address: s.legal_address ?? '',
        legal_publication_director: s.legal_publication_director ?? '',
      }}
    />
  );
}
