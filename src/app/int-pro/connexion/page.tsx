import type { Metadata } from 'next';
import { LoginPage } from '@/components/auth/auth-pages';

export const metadata: Metadata = { title: 'Connexion' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ refus?: string; lien?: string }>;
}) {
  const sp = await searchParams;
  return <LoginPage space="pro" refused={sp.refus === '1'} expired={sp.lien === 'expire'} />;
}
