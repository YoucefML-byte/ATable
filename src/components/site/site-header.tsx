import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ReceiptText } from 'lucide-react';

/** Fixed header: logo, name, table — the customer always knows where they are (vol. 07 §1). */
export async function SiteHeader({
  name,
  logoUrl,
  tableLabel,
}: {
  name: string;
  logoUrl: string | null;
  tableLabel: string | null;
}) {
  const t = await getTranslations('site');
  return (
    <header className="sticky top-0 z-20 h-14 border-b border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-3xl items-center gap-3 px-4">
        <Link href="/carte" className="flex min-w-0 flex-1 items-center gap-2">
          {logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- storage CDN
            <img src={logoUrl} alt="" width={32} height={32} className="h-8 w-8 rounded object-contain" />
          )}
          <span className="font-display truncate text-lg font-semibold">{name}</span>
        </Link>
        {tableLabel && (
          <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand-text">
            <span className="sm:hidden">
              <span className="sr-only">{t('youAreAt', { table: tableLabel })}</span>
              <span aria-hidden>{tableLabel}</span>
            </span>
            <span className="hidden sm:inline">{t('youAreAt', { table: tableLabel })}</span>
          </span>
        )}
        {tableLabel && (
          <Link href="/commandes" className="inline-flex h-11 shrink-0 items-center gap-1 rounded-button px-2 text-sm font-medium text-brand-text" aria-label={t('orders.link')}>
            <ReceiptText aria-hidden className="h-5 w-5" />
            <span className="hidden sm:inline">{t('orders.link')}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
