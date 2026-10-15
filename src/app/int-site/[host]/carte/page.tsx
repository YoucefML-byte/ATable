import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getSiteShop, getSiteTable, mediaBaseUrl } from '@/server/site/context';
import { getPublicMenu } from '@/features/catalog/queries';
import { formatHourFr } from '@/lib/dates';
import { SiteHeader } from '@/components/site/site-header';
import { MenuApp } from '@/components/site/menu-app';

export const metadata: Metadata = { title: 'La carte' };

// Menu (CLI-02): rendered on the server — usable without JavaScript for browsing (CA5).
export default async function MenuPage({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const shop = await getSiteShop(host);
  const table = await getSiteTable(shop);
  const t = await getTranslations('site');
  const base = mediaBaseUrl();
  const logo = shop.theme?.logo_path ? `${base}/${shop.theme.logo_path}-400.webp` : null;

  if (!table && !shop.public_menu_enabled) {
    return (
      <>
        <SiteHeader name={shop.name} logoUrl={logo} tableLabel={null} />
        <main className="mx-auto max-w-md p-8 text-center">
          <p className="font-display text-xl font-semibold">{t('home.noPublicMenu')}</p>
        </main>
      </>
    );
  }

  const menu = await getPublicMenu(shop.shop_id);
  const empty = !menu || menu.categories.length === 0;
  const nextOpening =
    empty && menu?.next_change_at ? formatHourFr(menu.next_change_at, shop.timezone) : null;

  return (
    <>
      <SiteHeader name={shop.name} logoUrl={logo} tableLabel={table?.label ?? null} />
      <main className="w-full flex-1">
        <h1 className="sr-only">{t('menu.title')}</h1>
        {shop.welcome_message && !empty && (
          <details open className="mx-auto max-w-3xl px-4 pt-3">
            <summary className="text-muted marker:text-muted cursor-pointer text-sm">
              {t('menu.welcomeHide')}
            </summary>
            <p className="mt-1">{shop.welcome_message}</p>
          </details>
        )}
        <MenuApp
          shop={{
            id: shop.shop_id,
            soldOutLabel: shop.sold_out_label,
            acceptingOrders: shop.accepting_orders,
            orderNoteEnabled: shop.order_note_enabled,
            layout: shop.theme?.menu_layout ?? 'liste',
          }}
          table={table ? { id: table.id, label: table.label } : null}
          menu={menu}
          mediaBase={base}
          nextOpening={nextOpening}
        />
      </main>
    </>
  );
}
