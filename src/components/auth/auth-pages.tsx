import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSessionClaims } from '@/server/auth/session';
import { isStaffEmail } from '@/server/auth/guards';
import { createUserClient } from '@/server/supabase/user';
import { Alert, Button, Card } from '@/components/ui/primitives';
import {
  ForgotPasswordForm,
  LoginForm,
  MfaEnrollForm,
  MfaVerifyForm,
  NewPasswordForm,
} from './forms';

// Authentication pages shared by the pro space and the console (vol. 02 AUTH-01).

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center p-4">
      <Card className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {children}
      </Card>
    </main>
  );
}

export async function LoginPage({
  space,
  refused,
  expired,
}: {
  space: 'pro' | 'console';
  refused?: boolean;
  expired?: boolean;
}) {
  const claims = await getSessionClaims();
  if (claims && claims.aal === 'aal2' && !refused) redirect('/');
  const t = await getTranslations('pro');
  return (
    <Shell title={t('login.title')}>
      {refused && <Alert tone="danger">{t('login.refused')}</Alert>}
      {expired && <Alert tone="warning">{t('password.linkExpired')}</Alert>}
      <LoginForm showStaffLink={space === 'pro'} />
    </Shell>
  );
}

export async function MfaPage() {
  const claims = await getSessionClaims();
  if (!claims) redirect('/connexion');
  if (isStaffEmail(claims.email)) redirect('/equipe');
  if (claims.aal === 'aal2') redirect('/');
  const supabase = await createUserClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const hasVerified = (data?.totp ?? []).some((f) => f.status === 'verified');
  const t = await getTranslations('pro.mfa');
  return (
    <Shell title={hasVerified ? t('title') : t('enrollTitle')}>
      {hasVerified ? <MfaVerifyForm /> : <MfaEnrollForm />}
      <form method="post" action="/api/auth/logout">
        <Button type="submit" variant="ghost" size="sm" className="w-full">
          {t('logout')}
        </Button>
      </form>
    </Shell>
  );
}

export async function ForgotPasswordPage() {
  const t = await getTranslations('pro.password');
  return (
    <Shell title={t('forgotTitle')}>
      <ForgotPasswordForm />
    </Shell>
  );
}

export async function NewPasswordPage() {
  const claims = await getSessionClaims();
  if (!claims) redirect('/connexion?lien=expire');
  const t = await getTranslations('pro.password');
  return (
    <Shell title={t('newTitle')}>
      <NewPasswordForm />
    </Shell>
  );
}
