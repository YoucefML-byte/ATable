import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/server/supabase/admin';
import { createUserClient } from '@/server/supabase/user';
import { getSessionClaims } from '@/server/auth/session';
import { isAllowedOrigin } from '@/server/security/headers';
import { env } from '@/server/env';

// "Change user" / inactivity lock: revokes the staff session, then signs out locally (AUTH-03).
export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request.headers.get('origin'), env.PLATFORM_PRO_HOST)) {
    return NextResponse.json({ ok: false, code: 'BAD_ORIGIN' }, { status: 403 });
  }
  const claims = await getSessionClaims();
  if (claims?.sessionId) {
    await createAdminClient()
      .from('staff_sessions')
      .update({ revoked_at: new Date().toISOString(), revoked_reason: 'logout' })
      .eq('session_id', claims.sessionId)
      .is('revoked_at', null);
  }
  const supabase = await createUserClient();
  await supabase.auth.signOut({ scope: 'local' });
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
