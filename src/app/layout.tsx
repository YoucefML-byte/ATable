import type { Metadata, Viewport } from 'next';
import { allFontVariables } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Atable',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={allFontVariables}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
