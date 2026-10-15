import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { buildCsp, generateNonce, securityHeaders, type Space } from '@/server/security/headers';

// Routing by host (vol. 03 §4.2). No business logic and no final authorisation here: it only
// routes. Authorisations are checked in pages, server actions and above all in the database.
//
// Internal prefixes (reachable only through a rewrite, ADR-010):
//   pro.<platform>      → /int-pro/...
//   console.<platform>  → /int-console/...
//   any other host      → /int-site/<host>/...

const INTERNAL_PREFIX = /^\/(?:int-(?:site|pro|console)|(?:_|%5F)(?:site|pro|console))(?:\/|$)/i;

function normalizeHost(raw: string | null): string {
  return (raw ?? '').trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
}

function hostOnly(value: string | undefined): string {
  return normalizeHost(value ?? '');
}

export async function proxy(request: NextRequest) {
  const proHost = hostOnly(process.env.PLATFORM_PRO_HOST);
  const consoleHost = hostOnly(process.env.PLATFORM_CONSOLE_HOST);
  const rootDomain = hostOnly(process.env.PLATFORM_ROOT_DOMAIN);
  const isDev = process.env.NODE_ENV === 'development';
  const isHttps = (process.env.PUBLIC_SCHEME ?? 'https') === 'https';

  const host = normalizeHost(request.headers.get('host'));
  const { pathname, search } = request.nextUrl;

  // 1. Direct access to internal prefixes is blocked.
  if (INTERNAL_PREFIX.test(pathname)) {
    return new NextResponse('Not found', { status: 404 });
  }

  // 2. www.<domain> → <domain>
  if (host.startsWith('www.') && host !== proHost && host !== consoleHost) {
    const target = new URL(request.url);
    target.host = request.headers.get('host')!.replace(/^www\./i, '');
    return NextResponse.redirect(target, 308);
  }

  const space: Space = pathname.startsWith('/api/')
    ? 'api'
    : host === proHost
      ? 'pro'
      : host === consoleHost
        ? 'console'
        : 'site';

  // 3. <shop domain>/admin → pro space
  if (space === 'site' && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return NextResponse.redirect(
      `${isHttps ? 'https' : 'http'}://${process.env.PLATFORM_PRO_HOST}/`,
      307,
    );
  }

  const nonce = generateNonce();
  const csp = buildCsp({
    nonce,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    storageUrl: process.env.STORAGE_PUBLIC_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    isDev,
  });
  const cspHeader =
    process.env.CSP_REPORT_ONLY === 'true'
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  requestHeaders.set('x-atable-host', host);
  requestHeaders.set('x-atable-space', space);
  // Never trust a client-provided value for these.
  requestHeaders.delete('x-atable-shop');

  let response: NextResponse;
  if (space === 'api') {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    const target = request.nextUrl.clone();
    target.pathname =
      space === 'pro'
        ? `/int-pro${pathname}`
        : space === 'console'
          ? `/int-console${pathname}`
          : `/int-site/${encodeURIComponent(host)}${pathname === '/' ? '' : pathname}`;
    target.search = search;
    response = NextResponse.rewrite(target, { request: { headers: requestHeaders } });
  }

  // 4. Refresh the Supabase session (cookies) for the pro space and the console only.
  if (
    space === 'pro' ||
    space === 'console' ||
    (space === 'api' && (host === proHost || host === consoleHost))
  ) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookieOptions: { path: '/', sameSite: 'lax', httpOnly: true, secure: isHttps },
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, {
                ...options,
                httpOnly: true,
                secure: isHttps,
                sameSite: 'lax',
              });
            }
          },
        },
      },
    );
    await supabase.auth.getClaims();
  }

  // 5. Security headers.
  if (space !== 'api') response.headers.set(cspHeader, csp);
  const isPlatformHost = host === rootDomain || host.endsWith(`.${rootDomain}`);
  for (const [key, value] of Object.entries(securityHeaders({ space, isPlatformHost, isHttps }))) {
    response.headers.set(key, value);
  }
  if (space === 'api') response.headers.set('Cache-Control', 'no-store');
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/|__nextjs|favicon.ico|icons/|robots.txt|manifest.webmanifest).*)',
    },
  ],
};
