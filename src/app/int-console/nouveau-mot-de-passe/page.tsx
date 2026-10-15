import type { Metadata } from 'next';
import { NewPasswordPage } from '@/components/auth/auth-pages';

export const metadata: Metadata = { title: 'Nouveau mot de passe' };

export default function Page() {
  return <NewPasswordPage />;
}
