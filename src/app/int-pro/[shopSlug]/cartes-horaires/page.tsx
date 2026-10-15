import type { Metadata } from 'next';
import { requireShopPage } from '@/server/auth/guards';
import { MenusView, type MenuAdmin } from '@/components/pro/menus-view';
import { todayBusinessDay } from '@/lib/dates';

export const metadata: Metadata = { title: 'Cartes et horaires' };

export default async function MenusPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug, 'owner');
  const { db, shop } = ctx;
  const [menus, schedules, links, categories] = await Promise.all([
    db
      .from('menus')
      .select('id, name, description, is_active, is_default, position')
      .eq('shop_id', shop.id)
      .is('deleted_at', null)
      .order('position'),
    db
      .from('menu_schedules')
      .select('menu_id, days, start_time, end_time')
      .eq('shop_id', shop.id)
      .order('start_time'),
    db
      .from('menu_categories')
      .select('menu_id, category_id, position')
      .eq('shop_id', shop.id)
      .order('position'),
    db
      .from('categories')
      .select('id, name')
      .eq('shop_id', shop.id)
      .is('deleted_at', null)
      .order('position'),
  ]);
  const hhmm = (t: string) => t.slice(0, 5);
  const data: MenuAdmin[] = (menus.data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    isActive: m.is_active,
    isDefault: m.is_default,
    schedules: (schedules.data ?? [])
      .filter((s) => s.menu_id === m.id)
      .map((s) => ({ days: s.days, start: hhmm(s.start_time), end: hhmm(s.end_time) })),
    categoryIds: (links.data ?? []).filter((l) => l.menu_id === m.id).map((l) => l.category_id),
  }));
  return (
    <MenusView
      shopSlug={shop.slug}
      menus={data}
      categories={categories.data ?? []}
      today={todayBusinessDay({ timezone: shop.timezone, businessDayStart: '00:00' })}
    />
  );
}
