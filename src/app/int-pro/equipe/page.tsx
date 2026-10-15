import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getCurrentDevice, listStaffForDevice } from '@/server/staff/device';
import { createAdminClient } from '@/server/supabase/admin';
import { StaffLogin } from '@/components/pro/staff-login';
import { Card } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Connexion de l’équipe' };

// Staff login screen: only on an enrolled device (AUTH-03).
export default async function StaffLoginPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const sp = await searchParams;
  const device = await getCurrentDevice();
  const t = await getTranslations('pro.staffLogin');
  if (!device) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-4">
        <Card className="space-y-4 p-6 text-center">
          <p className="text-lg font-medium">{t('notEnrolled')}</p>
          <Link href="/connexion" className="underline">
            {t('ownerLink')}
          </Link>
        </Card>
      </main>
    );
  }
  const [{ data: shop }, staff] = await Promise.all([
    createAdminClient().from('shops').select('name').eq('id', device.shop_id).single(),
    listStaffForDevice(device.shop_id),
  ]);
  return <StaffLogin shopName={shop?.name ?? ''} deviceName={device.name} staff={staff} {...(sp.m ? { preselect: sp.m } : {})} />;
}
