import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { consoleClientMessages } from '@/i18n/client-messages';

export const metadata: Metadata = { title: { default: 'Console', template: '%s · Console Atable' } };

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider messages={consoleClientMessages}>
      <div data-theme="light" className="min-h-dvh bg-bg text-fg">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
