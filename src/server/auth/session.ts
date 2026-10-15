import 'server-only';
import { cache } from 'react';
import { createUserClient } from '@/server/supabase/user';

export type SessionClaims = {
  userId: string;
  email: string | null;
  aal: 'aal1' | 'aal2';
  sessionId: string | null;
};

/** Verified claims of the current session (JWT checked by Supabase), memoised per request. */
export const getSessionClaims = cache(async (): Promise<SessionClaims | null> => {
  const supabase = await createUserClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const claims = data.claims as Record<string, unknown>;
  return {
    userId: String(claims.sub),
    email: typeof claims.email === 'string' ? claims.email : null,
    aal: claims.aal === 'aal2' ? 'aal2' : 'aal1',
    sessionId: typeof claims.session_id === 'string' ? claims.session_id : null,
  };
});

/** True when the user has a verified TOTP factor but the session is still aal1. */
export async function needsMfaStep(): Promise<{ needsVerify: boolean; needsEnroll: boolean }> {
  const supabase = await createUserClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!data) return { needsVerify: false, needsEnroll: true };
  return {
    needsVerify: data.currentLevel === 'aal1' && data.nextLevel === 'aal2',
    needsEnroll: data.nextLevel === 'aal1',
  };
}
