import { getTranslations } from 'next-intl/server';
import { requireShopPage } from '@/server/auth/guards';
import { isStaffEmail } from '@/server/auth/guards';
import { ProShell, type NavItem } from '@/components/pro/pro-shell';

// Shell of the pro space: navigation filtered by role and permissions (vol. 07 §5.1).
export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shopSlug: string }>;
}) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug);
  const t = await getTranslations('pro.nav');
  const base = `/${ctx.shop.slug}`;
  const items: NavItem[] = [];
  if (ctx.can('floor')) items.push({ href: `${base}/salle`, label: t('floor'), icon: 'floor' });
  if (ctx.can('kitchen'))
    items.push({ href: `${base}/cuisine`, label: t('kitchen'), icon: 'kitchen' });
  if (ctx.can('stock'))
    items.push({ href: `${base}/disponibilites`, label: t('availability'), icon: 'availability' });
  if (ctx.isOwner) {
    items.push(
      { href: `${base}/tableau-de-bord`, label: t('dashboard'), icon: 'dashboard' },
      { href: `${base}/historique`, label: t('history'), icon: 'history' },
      { href: `${base}/carte`, label: t('catalog'), icon: 'catalog' },
      { href: `${base}/cartes-horaires`, label: t('menus'), icon: 'menus' },
      { href: `${base}/tables`, label: t('tables'), icon: 'tables' },
      { href: `${base}/equipe`, label: t('team'), icon: 'team' },
      { href: `${base}/appareils`, label: t('devices'), icon: 'devices' },
      { href: `${base}/theme`, label: t('theme'), icon: 'theme' },
      { href: `${base}/reglages`, label: t('settings'), icon: 'settings' },
    );
  }
  const isStaff = isStaffEmail(ctx.claims.email);
  return (
    <ProShell
      shop={{
        id: ctx.shop.id,
        slug: ctx.shop.slug,
        name: ctx.shop.name,
        acceptingOrders: ctx.shop.accepting_orders,
      }}
      member={{ id: ctx.member.id, name: ctx.member.display_name, isStaff }}
      canToggleOrders={ctx.can('floor') && !ctx.isReadOnly}
      readOnly={ctx.isReadOnly}
      idleLockMinutes={isStaff ? ctx.shop.staff_idle_lock_minutes : null}
      items={items}
    >
      {children}
    </ProShell>
  );
}
