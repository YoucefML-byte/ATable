import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/server/supabase/admin';
import { createUserClient } from '@/server/supabase/user';
import { getCurrentDevice } from '@/server/staff/device';
import {
  DEVICE_MAX_FAILURES_PER_HOUR,
  MEMBER_LOCK_MINUTES,
  MEMBER_MAX_FAILURES,
  MEMBER_MAX_LOCKS,
  STAFF_SESSION_HOURS,
  verifyPin,
} from '@/server/staff/pin';
import { isAllowedOrigin } from '@/server/security/headers';
import { env } from '@/server/env';
import { httpStatusFor, type ErrorCode } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Staff login by PIN on an enrolled device (vol. 02 AUTH-03, vol. 03 §6.2, ADR-011).
const bodySchema = z.object({ memberId: z.uuid(), pin: z.string().regex(/^\d{6}$/) }).strict();

function fail(code: ErrorCode) {
  // Same message for an unknown member, a wrong PIN and a locked member: no remaining-attempt
  // count is revealed (ADR-009).
  return NextResponse.json({ ok: false, code }, { status: httpStatusFor(code), headers: { 'Cache-Control': 'no-store' } });
}

function sessionIdFromJwt(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString('utf8')) as { session_id?: string };
    return typeof payload.session_id === 'string' ? payload.session_id : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  // 1. Origin of the request (pro space only).
  if (!isAllowedOrigin(request.headers.get('origin'), env.PLATFORM_PRO_HOST)) return fail('BAD_ORIGIN');
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail('BAD_REQUEST');
  const { memberId, pin } = parsed.data;

  // 2. Device cookie: enrolled, not revoked, not locked.
  const device = await getCurrentDevice();
  if (!device) return fail('DEVICE_NOT_ENROLLED');
  if (device.locked) return fail('DEVICE_LOCKED');

  const admin = createAdminClient();
  const { data: member } = await admin
    .from('shop_members')
    .select('id, shop_id, user_id, role, is_active, pin_hash, pin_failed_count, pin_lock_level, pin_locked_until, pin_hard_locked')
    .eq('id', memberId)
    .maybeSingle();
  const eligible = !!member && member.shop_id === device.shop_id && member.role === 'staff' && member.is_active;
  const now = Date.now();
  const locked = !!member && (member.pin_hard_locked || (!!member.pin_locked_until && new Date(member.pin_locked_until).getTime() > now));

  // 3–4. Argon2id verification, always executed (comparable response time in every case).
  const pinOk = await verifyPin(eligible && !locked ? member!.pin_hash : null, pin);

  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() || null;
  const audit = (action: string, changes: Record<string, unknown> | null = null) =>
    admin.from('audit_log').insert({
      shop_id: device.shop_id,
      actor_kind: 'staff',
      actor_member_id: eligible ? member!.id : null,
      action,
      entity_type: 'device',
      entity_id: device.id,
      changes: changes as never,
      request_ip: ip as never,
    });

  if (!eligible || locked || !pinOk) {
    // Device counter: 20 failures within one hour locks the device (new logins only).
    const windowStart = device.failed_attempts_window_start ? new Date(device.failed_attempts_window_start).getTime() : 0;
    const inWindow = now - windowStart < 60 * 60 * 1000;
    const attempts = inWindow ? device.failed_attempts + 1 : 1;
    await admin
      .from('devices')
      .update({
        failed_attempts: attempts,
        failed_attempts_window_start: inWindow ? device.failed_attempts_window_start : new Date(now).toISOString(),
        locked: attempts >= DEVICE_MAX_FAILURES_PER_HOUR,
      })
      .eq('id', device.id);

    // Member counter: 5 failures → 15 min; 3 successive lockouts → owner must unlock.
    if (eligible && !locked) {
      const failures = member!.pin_failed_count + 1;
      if (failures >= MEMBER_MAX_FAILURES) {
        const level = member!.pin_lock_level + 1;
        await admin
          .from('shop_members')
          .update({
            pin_failed_count: 0,
            pin_lock_level: level,
            pin_locked_until: new Date(now + MEMBER_LOCK_MINUTES * 60 * 1000).toISOString(),
            pin_hard_locked: level >= MEMBER_MAX_LOCKS,
          })
          .eq('id', member!.id);
        await audit('member.pin_locked', { level });
      } else {
        await admin.from('shop_members').update({ pin_failed_count: failures }).eq('id', member!.id);
      }
    }
    await audit('staff.login_failed');
    if (attempts >= DEVICE_MAX_FAILURES_PER_HOUR) return fail('DEVICE_LOCKED');
    return fail(locked ? 'MEMBER_LOCKED' : 'BAD_PIN');
  }

  // 5. Session for the technical user, generated and consumed in this same server request:
  //    the one-time link never reaches the browser or an e-mail.
  const { data: user } = await admin.auth.admin.getUserById(member!.user_id);
  const email = user?.user?.email;
  if (!email) return fail('INTERNAL');
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (linkError || !link?.properties?.hashed_token) {
    logger.error({ event: 'staff.link_failed', code: linkError?.code });
    return fail('INTERNAL');
  }
  const supabase = await createUserClient();
  await supabase.auth.signOut({ scope: 'local' });
  const { data: verified, error: verifyError } = await supabase.auth.verifyOtp({ type: 'email', token_hash: link.properties.hashed_token });
  const accessToken = verified?.session?.access_token;
  const sessionId = accessToken ? sessionIdFromJwt(accessToken) : null;
  if (verifyError || !sessionId) {
    logger.error({ event: 'staff.verify_failed', code: verifyError?.code });
    return fail('INTERNAL');
  }

  // 6. staff_sessions row: checked by the database on every request.
  const { error: insertError } = await admin.from('staff_sessions').insert({
    session_id: sessionId,
    shop_id: device.shop_id,
    member_id: member!.id,
    device_id: device.id,
    expires_at: new Date(now + STAFF_SESSION_HOURS * 60 * 60 * 1000).toISOString(),
    last_seen_at: new Date(now).toISOString(),
  });
  if (insertError) {
    await supabase.auth.signOut({ scope: 'local' });
    logger.error({ event: 'staff.session_insert_failed', code: insertError.code });
    return fail('INTERNAL');
  }
  await admin.from('shop_members').update({ pin_failed_count: 0, pin_lock_level: 0, pin_locked_until: null }).eq('id', member!.id);
  await admin.from('devices').update({ last_seen_at: new Date(now).toISOString(), failed_attempts: 0, failed_attempts_window_start: null }).eq('id', device.id);
  await audit('staff.login');

  const { data: shop } = await admin.from('shops').select('slug').eq('id', device.shop_id).single();
  return NextResponse.json({ ok: true, redirect: `/${shop?.slug ?? ''}` }, { headers: { 'Cache-Control': 'no-store' } });
}
