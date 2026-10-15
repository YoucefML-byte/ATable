import { getTranslations } from 'next-intl/server';

// Neutral 404: no information about the platform (vol. 03 §4.3).
export default async function NotFound() {
  const t = await getTranslations('common');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t('notFoundTitle')}</h1>
      <p className="text-muted">{t('notFoundText')}</p>
    </main>
  );
}
