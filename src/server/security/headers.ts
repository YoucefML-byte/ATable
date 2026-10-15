// Security headers (vol. 05 §6). Built by proxy.ts for every response.

export type Space = 'site' | 'pro' | 'console' | 'api';

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64');
}

export function buildCsp(opts: { nonce: string; supabaseUrl: string; storageUrl: string; isDev: boolean }): string {
  const supabase = new URL(opts.supabaseUrl);
  const storage = new URL(opts.storageUrl);
  const wss = `${supabase.protocol === 'https:' ? 'wss' : 'ws'}://${supabase.host}`;
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${opts.nonce}' 'strict-dynamic'${opts.isDev ? " 'unsafe-eval'" : ''}`,
    // Theme CSS variables are injected inline by the server (tolerated by the bible).
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${storage.origin}`,
    `font-src 'self'`,
    `connect-src 'self' ${supabase.origin} ${wss}`,
    `media-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `manifest-src 'self'`,
    `worker-src 'self'`,
  ];
  if (!opts.isDev) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

export function securityHeaders(opts: {
  space: Space;
  isPlatformHost: boolean;
  isHttps: boolean;
}): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': opts.space === 'site' ? 'same-origin' : 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
  };
  if (opts.isHttps) {
    // preload only on the platform domain: we do not control the shops' subdomains.
    headers['Strict-Transport-Security'] = opts.isPlatformHost
      ? 'max-age=63072000; includeSubDomains; preload'
      : 'max-age=31536000';
  }
  if (opts.space === 'pro' || opts.space === 'console') {
    headers['Cache-Control'] = 'no-store';
  }
  return headers;
}

/**
 * Origin check for state-changing API routes (vol. 05 M10). The Origin header must be present
 * and match the expected host (scheme-insensitive in development).
 */
export function isAllowedOrigin(origin: string | null, expectedHost: string): boolean {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return url.host.toLowerCase() === expectedHost.toLowerCase();
  } catch {
    return false;
  }
}

/** Only relative internal paths are allowed as redirect targets (vol. 05 M17). */
export function safeRedirectPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (/[\r\n]/.test(value)) return fallback;
  return value;
}
