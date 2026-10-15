import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

/** Price notice and legal links (CLI-08). */
export async function SiteFooter({ priceNotice }: { priceNotice: string }) {
  const t = await getTranslations('site.footer');
  return (
    <footer className="border-line text-muted mt-auto border-t px-4 py-6 pb-28 text-center text-sm">
      {priceNotice && <p>{priceNotice}</p>}
      <p className="mt-2 flex justify-center gap-4">
        <Link href="/mentions-legales" className="underline underline-offset-2">
          {t('legal')}
        </Link>
        <Link href="/confidentialite" className="underline underline-offset-2">
          {t('privacy')}
        </Link>
      </p>
    </footer>
  );
}
