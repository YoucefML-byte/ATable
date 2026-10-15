import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { proClientMessages } from '@/i18n/client-messages';

export const metadata: Metadata = {
  title: { default: 'Espace pro', template: '%s · Atable pro' },
  manifest: '/manifest.webmanifest',
};

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider messages={proClientMessages}>
      <div data-theme="light" className="min-h-dvh bg-bg text-fg">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
