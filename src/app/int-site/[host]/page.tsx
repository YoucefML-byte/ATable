import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSiteShop, getSiteTable, mediaBaseUrl } from '@/server/site/context';
import { SiteHeader } from '@/components/site/site-header';

// Storefront home (CLI-07).
export default async function SiteHome({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const shop = await getSiteShop(host);
  const table = await getSiteTable(shop);
  if (table) redirect('/carte');
  const t = await getTranslations('site.home');
  const base = mediaBaseUrl();
  const logo = shop.theme?.logo_path ? `${base}/${shop.theme.logo_path}-400.webp` : null;
  const cover = shop.theme?.cover_path ? `${base}/${shop.theme.cover_path}-1200.webp` : null;

  return (
    <>
      <SiteHeader name={shop.name} logoUrl={logo} tableLabel={null} />
      <main className="mx-auto w-full max-w-3xl">
        <div className="relative">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- storage CDN
            <img
              src={cover}
              alt=""
              width={1200}
              height={600}
              className="aspect-[2/1] w-full object-cover"
            />
          ) : (
            <div className="hatched bg-brand aspect-[3/1] w-full" aria-hidden />
          )}
        </div>
        <div className="space-y-5 p-4">
          <h1 className="font-display text-3xl font-semibold">{shop.name}</h1>
          {shop.welcome_message && <p className="text-lg">{shop.welcome_message}</p>}
          {shop.public_menu_enabled ? (
            <>
              <p className="rounded-theme bg-brand-soft p-3 text-sm font-medium">
                {t('scanToOrder')}
              </p>
              <Link
                href="/carte"
                className="rounded-button bg-brand text-brand-fg hover:bg-brand-hover flex min-h-12 items-center justify-center font-semibold"
              >
                {t('seeMenu')}
              </Link>
            </>
          ) : (
            <p className="rounded-theme bg-brand-soft p-3 font-medium">{t('noPublicMenu')}</p>
          )}
          <dl className="grid gap-4 sm:grid-cols-2">
            {shop.opening_hours_text && (
              <div>
                <dt className="font-semibold">{t('hours')}</dt>
                <dd className="text-muted whitespace-pre-line">{shop.opening_hours_text}</dd>
              </div>
            )}
            {shop.address_text && (
              <div>
                <dt className="font-semibold">{t('address')}</dt>
                <dd className="text-muted whitespace-pre-line">{shop.address_text}</dd>
              </div>
            )}
            {shop.phone && (
              <div>
                <dt className="font-semibold">{t('phone')}</dt>
                <dd>
                  <a
                    className="text-brand-text underline"
                    href={`tel:${shop.phone.replace(/\s/g, '')}`}
                  >
                    {shop.phone}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </main>
    </>
  );
}
