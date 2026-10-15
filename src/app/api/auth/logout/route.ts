import { NextResponse, type NextRequest } from 'next/server';
import { createUserClient } from '@/server/supabase/user';
import { isAllowedOrigin } from '@/server/security/headers';
import { env } from '@/server/env';

// Sign-out of the owner / platform admin (plain HTML form: works without JavaScript).
export async function POST(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const allowed = [env.PLATFORM_PRO_HOST, env.PLATFORM_CONSOLE_HOST].includes(host) && isAllowedOrigin(request.headers.get('origin'), host);
  if (!allowed) return NextResponse.json({ ok: false, code: 'BAD_ORIGIN' }, { status: 403 });
  const supabase = await createUserClient();
  await supabase.auth.signOut({ scope: 'local' });
  return NextResponse.redirect(new URL('/connexion', `${request.nextUrl.protocol}//${host}`), 303);
}
