import type { Metadata } from 'next';
import { MfaPage } from '@/components/auth/auth-pages';

export const metadata: Metadata = { title: 'Double authentification' };

export default function Page() {
  return <MfaPage />;
}
