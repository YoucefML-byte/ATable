import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getSiteShop } from '@/server/site/context';

export const metadata: Metadata = { title: 'Confidentialité' };

// Privacy page: no personal data, two strictly necessary cookies (vol. 05 §12.3, CLI-10).
export default async function PrivacyPage({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  await getSiteShop(host);
  const t = await getTranslations('site.privacy');
  return (
    <main className="mx-auto w-full max-w-2xl space-y-5 p-4">
      <h1 className="font-display text-2xl font-semibold">{t('title')}</h1>
      <p>{t('intro')}</p>
      <section>
        <h2 className="text-lg font-semibold">{t('cookiesTitle')}</h2>
        <p className="mt-2">{t('cookiesText')}</p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>{t('cookieTable')}</li>
          <li>{t('cookieClient')}</li>
        </ul>
        <p className="mt-2">{t('noTracking')}</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold">{t('rightsTitle')}</h2>
        <p className="mt-2">{t('rightsText')}</p>
      </section>
    </main>
  );
}
