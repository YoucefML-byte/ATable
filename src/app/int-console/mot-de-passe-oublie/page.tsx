import type { Metadata } from 'next';
import { ForgotPasswordPage } from '@/components/auth/auth-pages';

export const metadata: Metadata = { title: 'Mot de passe oublié' };

export default function Page() {
  return <ForgotPasswordPage />;
}
