import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { consoleClientMessages } from '@/i18n/client-messages';

export const metadata: Metadata = {
  title: { default: 'Console', template: '%s · Console Atable' },
  icons: { icon: '/icons/favicon-32.png' },
};

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider messages={consoleClientMessages}>
      <div data-theme="light" className="bg-bg text-fg min-h-dvh">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
