import { NextResponse } from 'next/server';
import { createUserClient } from '@/server/supabase/user';

// Short-lived access token for the realtime subscription. Session cookies are HttpOnly, so the
// browser cannot read the session itself; it asks for the token here (ADR-011).
// The channel is still authorised by RLS on realtime.messages.
export async function GET() {
  const supabase = await createUserClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub)
    return NextResponse.json(
      { ok: false },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token)
    return NextResponse.json(
      { ok: false },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  return NextResponse.json(
    { ok: true, token, expiresAt: data.session?.expires_at ?? null, serverNow: Date.now() },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
