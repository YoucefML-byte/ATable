import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { proClientMessages } from '@/i18n/client-messages';

export const metadata: Metadata = {
  title: { default: 'Espace pro', template: '%s · Atable pro' },
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/favicon-32.png', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Atable', statusBarStyle: 'default' },
};

export const viewport: Viewport = { themeColor: '#1F4D3A' };

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider messages={proClientMessages}>
      <div data-theme="light" className="bg-bg text-fg min-h-dvh">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
