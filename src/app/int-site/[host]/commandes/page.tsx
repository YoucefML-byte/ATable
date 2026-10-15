import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { getSiteShop, getSiteTable, mediaBaseUrl } from '@/server/site/context';
import { readSiteCookies } from '@/server/site/cookies';
import { createPublicClient } from '@/server/supabase/public';
import { myOrderSchema } from '@/features/orders/schemas';
import { formatPrice } from '@/lib/money';
import { formatTime } from '@/lib/dates';
import { SiteHeader } from '@/components/site/site-header';

export const metadata: Metadata = { title: 'Mes commandes' };

// My orders (CLI-06): only the orders of this phone, during the open table session.
export default async function MyOrdersPage({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const shop = await getSiteShop(host);
  const table = await getSiteTable(shop);
  const { clientKey } = await readSiteCookies();
  const t = await getTranslations('site.orders');
  const base = mediaBaseUrl();
  const logo = shop.theme?.logo_path ? `${base}/${shop.theme.logo_path}-400.webp` : null;

  let orders: z.infer<typeof myOrderSchema>[] = [];
  if (table && clientKey) {
    const { data } = await createPublicClient().rpc('public_my_orders', {
      p_shop_id: shop.shop_id,
      p_token: table.token,
      p_client_key: clientKey,
    });
    orders = z
      .array(myOrderSchema)
      .catch([])
      .parse(data ?? []);
  }
  const total = orders.filter((o) => o.status === 'sent').reduce((a, o) => a + o.subtotal_cents, 0);

  return (
    <>
      <SiteHeader name={shop.name} logoUrl={logo} tableLabel={table?.label ?? null} />
      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 p-4">
        <h1 className="font-display text-2xl font-semibold">{t('title')}</h1>
        {!table && <p className="text-muted">{t('noTable')}</p>}
        {table && orders.length === 0 && <p className="text-muted">{t('empty')}</p>}
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.order_id} className="rounded-theme border-line bg-surface border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="tabular font-semibold">
                  {t('numberAt', {
                    number: String(order.number).padStart(3, '0'),
                    time: formatTime(order.created_at, shop.timezone),
                  })}
                </p>
                <p
                  className={`text-sm font-medium ${order.status === 'withdrawn' ? 'text-st-danger' : 'text-brand-text'}`}
                >
                  {order.status === 'sent' ? t('sent') : ''}
                </p>
              </div>
              {order.status === 'withdrawn' && (
                <p className="text-st-danger mt-1 text-sm font-medium">{t('withdrawn')}</p>
              )}
              <ul className="mt-2 space-y-1">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      {item.quantity} × {item.name}
                      {item.options.length > 0 && (
                        <span className="text-muted block text-sm">
                          {item.options
                            .map((o) => (o.quantity > 1 ? `${o.name} ×${o.quantity}` : o.name))
                            .join(', ')}
                        </span>
                      )}
                    </span>
                    <span
                      className={`tabular ${order.status === 'withdrawn' ? 'text-muted line-through' : ''}`}
                    >
                      {formatPrice(item.line_total_cents)}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {orders.length > 0 && (
          <div className="rounded-theme border-line border p-4">
            <p className="flex justify-between text-lg font-semibold">
              <span>{t('indicativeTotal')}</span>
              <span className="tabular">{formatPrice(total)}</span>
            </p>
            <p className="text-muted mt-1 text-sm">{t('indicativeNote')}</p>
          </div>
        )}
        <Link
          href="/carte"
          className="rounded-button bg-brand text-brand-fg flex min-h-12 items-center justify-center font-semibold"
        >
          {(await getTranslations('site.confirmation'))('orderMore')}
        </Link>
      </main>
    </>
  );
}
