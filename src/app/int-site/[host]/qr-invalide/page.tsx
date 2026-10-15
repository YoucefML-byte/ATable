import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getSiteShop } from '@/server/site/context';

// Invalid or revoked QR code (CLI-01).
export default async function InvalidQrPage({ params }: { params: Promise<{ host: string }> }) {
  const { host } = await params;
  const shop = await getSiteShop(host);
  const t = await getTranslations('site.qrInvalid');
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-display text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted">{t('text')}</p>
      {shop.public_menu_enabled && (
        <Link href="/carte" className="flex min-h-12 items-center justify-center rounded-button border border-brand-line px-6 font-semibold text-brand-text">
          {t('seeMenu')}
        </Link>
      )}
    </main>
  );
}
