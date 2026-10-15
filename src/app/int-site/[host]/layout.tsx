import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { getSiteShop, mediaBaseUrl } from '@/server/site/context';
import { PRESETS, themeCss } from '@/features/theming/theme';
import { siteClientMessages } from '@/i18n/client-messages';
import { SiteFooter } from '@/components/site/site-footer';

type Params = { params: Promise<{ host: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { host } = await params;
  const shop = await getSiteShop(host);
  return {
    title: { default: shop.name, template: `%s · ${shop.name}` },
    description: shop.welcome_message ?? undefined,
    robots: { index: shop.status === 'active', follow: shop.status === 'active' },
    icons: shop.theme?.logo_path ? { icon: `${mediaBaseUrl()}/${shop.theme.logo_path}-400.webp` } : undefined,
  };
}

export default async function SiteLayout({ children, params }: Params & { children: React.ReactNode }) {
  const { host } = await params;
  const shop = await getSiteShop(host);
  const theme = shop.theme ?? PRESETS.classique!;
  const logoPath = shop.theme?.logo_path ?? null;
  const t = await getTranslations('site.status');
  const css = themeCss(theme, '.site-root');

  let content = children;
  if (shop.status === 'onboarding' || shop.status === 'suspended') {
    const onboarding = shop.status === 'onboarding';
    content = (
      <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        {logoPath && (
          // eslint-disable-next-line @next/next/no-img-element -- storage CDN
          <img src={`${mediaBaseUrl()}/${logoPath}-400.webp`} alt={shop.name} width={96} height={96} className="h-24 w-24 object-contain" />
        )}
        <h1 className="font-display text-2xl font-semibold">{onboarding ? t('comingSoon') : t('unavailable')}</h1>
        <p className="text-muted">{onboarding ? t('comingSoonText') : t('unavailableText')}</p>
      </main>
    );
  }

  return (
    <NextIntlClientProvider messages={siteClientMessages}>
      <style>{css}</style>
      <div className="site-root site-body flex min-h-dvh flex-col bg-bg text-fg">
        {content}
        <SiteFooter priceNotice={shop.price_notice} />
      </div>
    </NextIntlClientProvider>
  );
}
