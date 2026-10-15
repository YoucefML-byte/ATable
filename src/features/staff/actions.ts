'use server';
import 'server-only';
import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { requireOwner, requireShopAction } from '@/server/auth/guards';
import { createAdminClient } from '@/server/supabase/admin';
import {
  DEVICE_COOKIE,
  deviceCookieOptions,
  hashSecret,
  newDeviceSecret,
} from '@/server/staff/device';
import { generatePin, hashPin, isWeakPin } from '@/server/staff/pin';
import { env } from '@/server/env';
import { err, ok, type ActionResult } from '@/lib/result';
import { mapDbError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const slug = z.string().min(1).max(40);
const PERMISSIONS = z.array(z.enum(['floor', 'kitchen', 'stock'])).max(3);

// ---------------------------------------------------------------------------
// Devices (AUTH-02)
// ---------------------------------------------------------------------------

/** Enrols THIS device: random secret in a protected cookie, only its SHA-256 in the database. */
export async function enrollDeviceAction(
  shopSlug: string,
  name: string,
): Promise<ActionResult<string>> {
  const res = await requireOwner(slug.parse(shopSlug));
  if (!res.ok) return res;
  const parsedName = z.string().trim().min(1).max(40).safeParse(name);
  if (!parsedName.success) return err('VALIDATION', 'VALIDATION');
  const secret = newDeviceSecret();
  const { data, error } = await res.value.db.rpc('owner_enroll_device', {
    p_shop_id: res.value.shop.id,
    p_name: parsedName.data,
    p_secret_hash: hashSecret(secret),
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  (await cookies()).set(DEVICE_COOKIE, secret, deviceCookieOptions());
  return ok(String(data));
}

export async function revokeDeviceAction(
  shopSlug: string,
  deviceId: string,
): Promise<ActionResult<null>> {
  const res = await requireShopAction(slug.parse(shopSlug), 'owner');
  if (!res.ok) return res;
  const { error } = await res.value.db.rpc('owner_revoke_device', {
    p_device_id: z.uuid().parse(deviceId),
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  return ok(null);
}

export async function unlockDeviceAction(
  shopSlug: string,
  deviceId: string,
): Promise<ActionResult<null>> {
  const res = await requireOwner(slug.parse(shopSlug));
  if (!res.ok) return res;
  const { error } = await res.value.db.rpc('owner_unlock_device', {
    p_device_id: z.uuid().parse(deviceId),
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  return ok(null);
}

// ---------------------------------------------------------------------------
// Team (EQP-01)
// ---------------------------------------------------------------------------

const createMemberSchema = z
  .object({
    shopSlug: slug,
    displayName: z.string().trim().min(1).max(40),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    permissions: PERMISSIONS,
    pin: z
      .string()
      .regex(/^\d{6}$/)
      .nullable(),
  })
  .strict();

/**
 * Creates an employee: a technical Supabase user with a fictitious non-routable address and a
 * random password nobody knows (vol. 03 §6.2), then the member row with the Argon2id hash of the
 * PIN. Uses the admin client (documented in admin-usage.md).
 */
export async function createMemberAction(
  input: z.input<typeof createMemberSchema>,
): Promise<ActionResult<{ generatedPin: string | null }>> {
  const parsed = createMemberSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(parsed.data.shopSlug);
  if (!res.ok) return res;
  const pin = parsed.data.pin ?? generatePin();
  if (isWeakPin(pin)) return err('WEAK_PIN', 'WEAK_PIN');
  const admin = createAdminClient();
  const memberId = randomUUID();
  const { data: user, error: userError } = await admin.auth.admin.createUser({
    email: `${memberId}@${env.STAFF_EMAIL_DOMAIN}`,
    password: newDeviceSecret() + newDeviceSecret(),
    email_confirm: true,
    app_metadata: { kind: 'staff', shop_id: res.value.shop.id },
  });
  if (userError || !user.user) {
    logger.error({ event: 'staff.user_create_failed', code: userError?.code });
    return err('INTERNAL', 'INTERNAL');
  }
  const { error } = await admin.from('shop_members').insert({
    id: memberId,
    shop_id: res.value.shop.id,
    user_id: user.user.id,
    role: 'staff',
    display_name: parsed.data.displayName,
    color: parsed.data.color.toUpperCase(),
    permissions: parsed.data.permissions,
    pin_hash: await hashPin(pin),
  });
  if (error) {
    await admin.auth.admin.deleteUser(user.user.id);
    logger.error({ event: 'staff.member_create_failed', code: error.code });
    return err('INTERNAL', 'INTERNAL');
  }
  await admin.from('audit_log').insert({
    shop_id: res.value.shop.id,
    actor_user_id: res.value.claims.userId,
    actor_member_id: res.value.member.id,
    actor_kind: 'owner',
    action: 'member.create',
    entity_type: 'member',
    entity_id: memberId,
    changes: { display_name: parsed.data.displayName, permissions: parsed.data.permissions },
  });
  return ok({ generatedPin: parsed.data.pin ? null : pin });
}

const updateMemberSchema = z
  .object({
    shopSlug: slug,
    memberId: z.uuid(),
    displayName: z.string().trim().min(1).max(40),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    permissions: PERMISSIONS,
    isActive: z.boolean(),
  })
  .strict();

/** Name, colour, permissions, deactivation — through RLS (owner, column privileges). */
export async function updateMemberAction(
  input: z.input<typeof updateMemberSchema>,
): Promise<ActionResult<null>> {
  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(parsed.data.shopSlug);
  if (!res.ok) return res;
  const { data, error } = await res.value.db
    .from('shop_members')
    .update({
      display_name: parsed.data.displayName,
      color: parsed.data.color.toUpperCase(),
      permissions: parsed.data.permissions,
      is_active: parsed.data.isActive,
      deactivated_at: parsed.data.isActive ? null : new Date().toISOString(),
    })
    .eq('id', parsed.data.memberId)
    .eq('shop_id', res.value.shop.id)
    .eq('role', 'staff')
    .select('id');
  if (error) return err(mapDbError(error).code, 'ERROR');
  if (!data || data.length === 0) return err('NOT_FOUND', 'NOT_FOUND');
  if (!parsed.data.isActive) {
    await res.value.db.rpc('owner_revoke_member_sessions', { p_member_id: parsed.data.memberId });
  }
  return ok(null);
}

const resetPinSchema = z
  .object({
    shopSlug: slug,
    memberId: z.uuid(),
    pin: z
      .string()
      .regex(/^\d{6}$/)
      .nullable(),
  })
  .strict();

/** New PIN (typed or generated): only the server writes the hash (secret key). */
export async function resetPinAction(
  input: z.input<typeof resetPinSchema>,
): Promise<ActionResult<{ generatedPin: string | null }>> {
  const parsed = resetPinSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requireOwner(parsed.data.shopSlug);
  if (!res.ok) return res;
  const pin = parsed.data.pin ?? generatePin();
  if (isWeakPin(pin)) return err('WEAK_PIN', 'WEAK_PIN');
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('shop_members')
    .update({
      pin_hash: await hashPin(pin),
      pin_failed_count: 0,
      pin_lock_level: 0,
      pin_locked_until: null,
      pin_hard_locked: false,
    })
    .eq('id', parsed.data.memberId)
    .eq('shop_id', res.value.shop.id)
    .eq('role', 'staff')
    .select('id');
  if (error || !data || data.length === 0) return err('NOT_FOUND', 'NOT_FOUND');
  await admin.from('audit_log').insert({
    shop_id: res.value.shop.id,
    actor_user_id: res.value.claims.userId,
    actor_member_id: res.value.member.id,
    actor_kind: 'owner',
    action: 'member.reset_pin',
    entity_type: 'member',
    entity_id: parsed.data.memberId,
  });
  return ok({ generatedPin: parsed.data.pin ? null : pin });
}

export async function unlockMemberAction(
  shopSlug: string,
  memberId: string,
): Promise<ActionResult<null>> {
  const res = await requireOwner(slug.parse(shopSlug));
  if (!res.ok) return res;
  const { error } = await res.value.db.rpc('owner_unlock_member', {
    p_member_id: z.uuid().parse(memberId),
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  return ok(null);
}

export async function closeMemberSessionsAction(
  shopSlug: string,
  memberId: string,
): Promise<ActionResult<null>> {
  const res = await requireShopAction(slug.parse(shopSlug), 'owner');
  if (!res.ok) return res;
  const { error } = await res.value.db.rpc('owner_revoke_member_sessions', {
    p_member_id: z.uuid().parse(memberId),
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  return ok(null);
}
