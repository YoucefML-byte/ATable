import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createUserClient } from '@/server/supabase/user';

// Invitation and password reset links (token_hash flow, server side).
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
  const origin = `${request.nextUrl.protocol}//${request.headers.get('host')}`;
  if (!tokenHash || (type !== 'invite' && type !== 'recovery')) {
    return NextResponse.redirect(new URL('/connexion?lien=expire', origin), 303);
  }
  const supabase = await createUserClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return NextResponse.redirect(new URL('/connexion?lien=expire', origin), 303);
  return NextResponse.redirect(new URL('/nouveau-mot-de-passe', origin), 303);
}
