import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { requirePlatformAdminPage } from '@/server/auth/guards';

// Console shell: reserved to platform admins with aal2 (vol. 02 CON, vol. 05 §4).
export default async function ConsoleAppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requirePlatformAdminPage();
  const t = await getTranslations('console');
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-line bg-surface border-b">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-2">
          <p className="font-semibold">{t('title')}</p>
          <nav aria-label={t('nav.label')} className="flex flex-wrap gap-1">
            <Link
              href="/"
              className="hover:bg-brand-soft flex min-h-12 items-center rounded-lg px-3 font-medium"
            >
              {t('nav.shops')}
            </Link>
            <Link
              href="/commerces/nouveau"
              className="hover:bg-brand-soft flex min-h-12 items-center rounded-lg px-3 font-medium"
            >
              {t('nav.newShop')}
            </Link>
            <Link
              href="/journal"
              className="hover:bg-brand-soft flex min-h-12 items-center rounded-lg px-3 font-medium"
            >
              {t('nav.audit')}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted text-sm">{ctx.claims.email}</span>
            <form method="post" action="/api/auth/logout">
              <button
                type="submit"
                className="border-line min-h-12 rounded-lg border px-3 font-medium"
              >
                {t('nav.logout')}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-4">{children}</main>
    </div>
  );
}
