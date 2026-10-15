import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSessionClaims } from '@/server/auth/session';
import { isStaffEmail } from '@/server/auth/guards';
import { createUserClient } from '@/server/supabase/user';
import { getCurrentDevice } from '@/server/staff/device';
import { Button, Card } from '@/components/ui/primitives';

// Entry of the pro space: sends everyone to the right place.
export default async function ProHome() {
  const claims = await getSessionClaims();
  if (!claims) {
    redirect((await getCurrentDevice()) ? '/equipe' : '/connexion');
  }
  if (claims.aal === 'aal1' && !isStaffEmail(claims.email)) redirect('/2fa');

  const db = await createUserClient();
  const { data: memberships } = await db
    .from('shop_members')
    .select('shop_id, role, shops!inner(slug, name, status)')
    .eq('user_id', claims.userId)
    .eq('is_active', true);
  const shops = (memberships ?? []).map((m) => m.shops).filter((s) => s.status !== 'archived');
  if (isStaffEmail(claims.email)) {
    if (shops.length === 0) redirect('/equipe');
  }
  if (shops.length === 1) redirect(`/${shops[0]!.slug}`);

  const t = await getTranslations('pro.shops');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-4">
      <Card className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        {shops.length === 0 && <p className="text-muted">{t('none')}</p>}
        <ul className="space-y-2">
          {shops.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/${s.slug}`}
                className="border-line hover:bg-brand-soft flex min-h-12 items-center rounded-lg border px-4 font-medium"
              >
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
        <form method="post" action="/api/auth/logout">
          <Button type="submit" variant="ghost" className="w-full">
            {(await getTranslations('pro.nav'))('logout')}
          </Button>
        </form>
      </Card>
    </main>
  );
}
