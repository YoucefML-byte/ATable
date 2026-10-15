'use server';
import 'server-only';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createUserClient } from '@/server/supabase/user';
import { getSessionClaims } from '@/server/auth/session';
import { isStaffEmail } from '@/server/auth/guards';
import { env } from '@/server/env';
import { logger } from '@/lib/logger';

// Redirects are done by the browser (full navigation through proxy.ts): a redirect() thrown by a
// server action is rendered internally, without the host rewrite (ADR-010).
export type FormState = {
  error: string | null;
  info?: string | null;
  waitSeconds?: number;
  redirectTo?: string;
};

const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(200) });

/** Owner / platform admin login (AUTH-01). Same message whether the e-mail exists or not. */
export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'BAD_CREDENTIALS' };
  if (isStaffEmail(parsed.data.email)) return { error: 'BAD_CREDENTIALS' };
  const supabase = await createUserClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logger.info({ event: 'auth.login_failed', reason: error.code ?? 'unknown' });
    return { error: 'BAD_CREDENTIALS' };
  }
  return { error: null, redirectTo: '/2fa' };
}

/** Starts the TOTP enrolment: removes unverified factors, returns the QR code and the secret. */
export async function startEnrollAction(): Promise<
  { factorId: string; qr: string; secret: string } | { error: string }
> {
  const claims = await getSessionClaims();
  if (!claims || isStaffEmail(claims.email)) return { error: 'UNAUTHENTICATED' };
  const supabase = await createUserClient();
  const { data: list } = await supabase.auth.mfa.listFactors();
  if (list?.totp.some((f) => f.status === 'verified')) return { error: 'BAD_REQUEST' };
  for (const factor of list?.all ?? []) {
    if (factor.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: factor.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: `Atable ${new Date().toISOString().slice(0, 10)}`,
  });
  if (error || !data) {
    logger.error({ event: 'auth.mfa_enroll_failed', code: error?.code });
    return { error: 'INTERNAL' };
  }
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

const codeSchema = z.object({ code: z.string().regex(/^\d{6}$/), factorId: z.uuid().optional() });

/** Verifies a TOTP code (enrolment or login). Progressive delay after 5 failures (AUTH-01 CA2). */
export async function verifyMfaAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const claims = await getSessionClaims();
  if (!claims) return { error: null, redirectTo: '/connexion' };
  const parsed = codeSchema.safeParse({
    code: String(formData.get('code') ?? '').replace(/\s/g, ''),
    factorId: formData.get('factorId') || undefined,
  });
  if (!parsed.success) return { error: 'BAD_CODE' };
  const supabase = await createUserClient();
  const { data: wait } = await supabase.rpc('auth_mfa_wait_seconds');
  if ((wait ?? 0) > 0) return { error: 'WAIT', waitSeconds: wait ?? 0 };

  let factorId = parsed.data.factorId;
  if (!factorId) {
    const { data: list } = await supabase.auth.mfa.listFactors();
    factorId = list?.totp.find((f) => f.status === 'verified')?.id;
  }
  if (!factorId) return { error: 'BAD_CODE' };
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: parsed.data.code,
  });
  if (error) {
    const { data: next } = await supabase.rpc('auth_register_mfa_failure');
    logger.info({ event: 'auth.mfa_failed' });
    return (next ?? 0) > 0 ? { error: 'WAIT', waitSeconds: next ?? 0 } : { error: 'BAD_CODE' };
  }
  await supabase.rpc('auth_reset_mfa_failures');
  return { error: null, redirectTo: '/' };
}

const emailSchema = z.object({ email: z.email().max(254) });

/** Password reset by e-mail; the link expires after 1 hour. Same answer whether the e-mail exists. */
export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = emailSchema.safeParse({ email: formData.get('email') });
  if (parsed.success && !isStaffEmail(parsed.data.email)) {
    const host = (await headers()).get('host') ?? env.PLATFORM_PRO_HOST;
    const target =
      host === env.PLATFORM_CONSOLE_HOST ? env.PLATFORM_CONSOLE_HOST : env.PLATFORM_PRO_HOST;
    const supabase = await createUserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${env.PUBLIC_SCHEME}://${target}/auth/confirm`,
    });
    if (error) logger.warn({ event: 'auth.reset_failed', code: error.code });
  }
  return { error: null, info: 'SENT' };
}

const passwordSchema = z
  .object({ password: z.string().min(12).max(200), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'mismatch' });

/** New password after an invitation or a reset link (12 characters minimum). */
export async function setPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const claims = await getSessionClaims();
  if (!claims) return { error: 'LINK_EXPIRED' };
  const parsed = passwordSchema.safeParse({
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.path[0] === 'confirm' ? 'MISMATCH' : 'TOO_SHORT' };
  }
  const supabase = await createUserClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    // Includes Supabase's leaked-password protection ("weak_password").
    return { error: 'WEAK' };
  }
  return { error: null, redirectTo: '/2fa' };
}
