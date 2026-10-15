import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requirePlatformAdminPage } from '@/server/auth/guards';
import { env } from '@/server/env';
import { CreateShopForm } from '@/components/console/create-shop-form';

export const metadata: Metadata = { title: 'Nouveau commerce' };

export default async function NewShopPage() {
  await requirePlatformAdminPage();
  const t = await getTranslations('console.create');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <CreateShopForm rootDomain={env.PLATFORM_ROOT_DOMAIN} />
    </div>
  );
}
