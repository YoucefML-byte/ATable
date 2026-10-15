import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getSiteShop } from '@/server/site/context';

export const metadata: Metadata = { title: 'Mentions légales' };

// Legal notice generated from the shop's information (vol. 01 §7.3). The publisher is the shop.
export default async function LegalPage({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const shop = await getSiteShop(host);
  const t = await getTranslations('site.legal');
  const value = (v: string | null) => v ?? t('notProvided');
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4">
      <h1 className="font-display text-2xl font-semibold">{t('title')}</h1>
      <section>
        <h2 className="text-lg font-semibold">{t('publisher')}</h2>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted">{t('company')}</dt>
          <dd>{value(shop.legal.name)}</dd>
          <dt className="text-muted">{t('form')}</dt>
          <dd>{value(shop.legal.form)}</dd>
          <dt className="text-muted">{t('siret')}</dt>
          <dd>{value(shop.legal.siret)}</dd>
          <dt className="text-muted">{t('address')}</dt>
          <dd>{value(shop.legal.address)}</dd>
          <dt className="text-muted">{t('director')}</dt>
          <dd>{value(shop.legal.publication_director)}</dd>
        </dl>
      </section>
      <section>
        <h2 className="text-lg font-semibold">{t('hosts')}</h2>
        <p className="mt-2">{t('hostsText')}</p>
      </section>
    </main>
  );
}
