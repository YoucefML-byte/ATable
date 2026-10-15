import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Cache Components (PPR) is incompatible with the nonce-based CSP required by the bible
  // (vol. 05 §6): pages are rendered dynamically and data is cached explicitly (ADR-010).
  cacheComponents: false,
  poweredByHeader: false,
  reactStrictMode: true,
  // No Vercel image optimisation: images are served by the Supabase CDN (vol. 03 §8, §13).
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: '4mb' },
  },
  serverExternalPackages: ['@node-rs/argon2', 'sharp'],
};

export default withNextIntl(nextConfig);
