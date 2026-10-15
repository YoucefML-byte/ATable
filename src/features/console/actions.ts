'use server';
import 'server-only';
import { z } from 'zod';
import { requirePlatformAdmin, type AdminContext } from '@/server/auth/guards';
import { createAdminClient } from '@/server/supabase/admin';
import { env } from '@/server/env';
import { revalidateHostsOfShop } from '@/server/tenancy/invalidate';
import { revalidateTag } from 'next/cache';
import { hostTag, normalizeHost } from '@/server/tenancy/resolve';
import {
  addProjectDomain,
  getProjectDomain,
  removeProjectDomain,
  vercelEnabled,
} from '@/server/vercel';
import { err, ok, type ActionResult } from '@/lib/result';
import { mapDbError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { BUSINESS_TYPES, FEATURES } from './constants';

// Platform console (CON-01 to CON-06). Every action checks the platform admin role with aal2;
// the SQL functions check it again. The secret key is only used for what RLS cannot express:
// Auth users (invitation, 2FA reset) and owner memberships (admin-usage.md).

const uuid = z.uuid();

async function auditPlatform(
  ctx: AdminContext,
  shopId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  changes: Record<string, unknown> | null,
) {
  await createAdminClient()
    .from('audit_log')
    .insert({
      shop_id: shopId,
      actor_user_id: ctx.claims.userId,
      actor_kind: 'platform_admin',
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes: changes as never,
    });
}

const inviteRedirect = () => `${env.PUBLIC_SCHEME}://${env.PLATFORM_PRO_HOST}/auth/confirm`;

/**
 * Invites (or attaches) an owner: a new e-mail address receives an invitation; an existing
 * account (owner of another shop) is simply attached and will see the shop in its list.
 */
async function attachOwner(
  ctx: AdminContext,
  shopId: string,
  email: string,
  displayName: string,
): Promise<ActionResult<'invited' | 'attached'>> {
  const admin = createAdminClient();
  const { data: existing } = await admin.rpc('auth_user_id_by_email', { p_email: email });
  let userId = typeof existing === 'string' ? existing : null;
  let outcome: 'invited' | 'attached' = 'attached';
  if (!userId) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: inviteRedirect(),
    });
    if (error || !data.user) {
      logger.error({ event: 'console.invite_failed', code: error?.code });
      return err('INTERNAL', 'INTERNAL');
    }
    userId = data.user.id;
    outcome = 'invited';
  }
  const { error } = await admin.from('shop_members').upsert(
    {
      shop_id: shopId,
      user_id: userId,
      role: 'owner',
      display_name: displayName,
      permissions: ['floor', 'kitchen', 'stock'],
      is_active: true,
      deactivated_at: null,
    },
    { onConflict: 'shop_id,user_id' },
  );
  if (error) return err(mapDbError(error).code, 'ERROR');
  await auditPlatform(ctx, shopId, 'owner.invite', 'member', null, {
    email_domain: email.split('@')[1] ?? null,
    outcome,
  });
  return ok(outcome);
}

const createShopSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    slug: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/),
    businessType: z.enum(BUSINESS_TYPES),
    timezone: z.string().min(3).max(60),
    ownerEmail: z.email().max(254),
    ownerName: z.string().trim().min(1).max(40),
  })
  .strict();

export async function createShopAction(
  input: z.input<typeof createShopSchema>,
): Promise<ActionResult<{ shopId: string; owner: 'invited' | 'attached' }>> {
  const parsed = createShopSchema.safeParse(input);
  if (!parsed.success)
    return err(
      'VALIDATION',
      'VALIDATION',
      Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
    );
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  const { data, error } = await res.value.db.rpc('console_create_shop', {
    p_name: parsed.data.name,
    p_slug: parsed.data.slug,
    p_business_type: parsed.data.businessType,
    p_timezone: parsed.data.timezone,
    p_root_domain: env.PLATFORM_ROOT_DOMAIN,
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  const shopId = String(data);
  const owner = await attachOwner(
    res.value,
    shopId,
    parsed.data.ownerEmail.toLowerCase(),
    parsed.data.ownerName,
  );
  if (!owner.ok) return owner;
  return ok({ shopId, owner: owner.value });
}

export async function inviteOwnerAction(
  shopId: string,
  email: string,
  displayName: string,
): Promise<ActionResult<'invited' | 'attached'>> {
  const parsed = z
    .object({
      shopId: uuid,
      email: z.email().max(254),
      displayName: z.string().trim().min(1).max(40),
    })
    .safeParse({ shopId, email, displayName });
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  return attachOwner(
    res.value,
    parsed.data.shopId,
    parsed.data.email.toLowerCase(),
    parsed.data.displayName,
  );
}

/** Sends a new invitation link to an owner who never set a password. */
export async function resendInviteAction(memberId: string): Promise<ActionResult<null>> {
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  const admin = createAdminClient();
  const { data: member } = await admin
    .from('shop_members')
    .select('shop_id, user_id, role')
    .eq('id', uuid.parse(memberId))
    .maybeSingle();
  if (!member || member.role !== 'owner') return err('NOT_FOUND', 'NOT_FOUND');
  const { data: user } = await admin.auth.admin.getUserById(member.user_id);
  if (!user.user?.email) return err('NOT_FOUND', 'NOT_FOUND');
  const { error } = user.user.last_sign_in_at
    ? await admin.auth.resetPasswordForEmail(user.user.email, { redirectTo: inviteRedirect() })
    : await admin.auth.admin.inviteUserByEmail(user.user.email, { redirectTo: inviteRedirect() });
  if (error) return err('INTERNAL', 'INTERNAL');
  await auditPlatform(res.value, member.shop_id, 'owner.reinvite', 'member', memberId, null);
  return ok(null);
}

/**
 * 2FA reset of an owner who lost their phone (CON-06), after an identity check done by the
 * platform team (procedure in vol. 08). Removes the factors and closes the sessions.
 */
export async function resetOwnerMfaAction(
  memberId: string,
  reason: string,
): Promise<ActionResult<number>> {
  const parsedReason = z.string().trim().min(5).max(300).safeParse(reason);
  if (!parsedReason.success) return err('VALIDATION', 'VALIDATION');
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  const admin = createAdminClient();
  const { data: member } = await admin
    .from('shop_members')
    .select('shop_id, user_id, role')
    .eq('id', uuid.parse(memberId))
    .maybeSingle();
  if (!member || member.role !== 'owner') return err('NOT_FOUND', 'NOT_FOUND');
  if (member.user_id === res.value.claims.userId) return err('FORBIDDEN', 'FORBIDDEN');
  const { data: factors, error } = await admin.auth.admin.mfa.listFactors({
    userId: member.user_id,
  });
  if (error) return err('INTERNAL', 'INTERNAL');
  for (const f of factors.factors)
    await admin.auth.admin.mfa.deleteFactor({ userId: member.user_id, id: f.id });
  await admin.auth.admin.signOut(member.user_id, 'global').catch(() => null);
  await auditPlatform(res.value, member.shop_id, 'owner.mfa_reset', 'member', memberId, {
    factors: factors.factors.length,
    reason: parsedReason.data,
  });
  return ok(factors.factors.length);
}

export async function setShopStatusAction(
  shopId: string,
  status: 'onboarding' | 'active' | 'suspended' | 'archived',
): Promise<ActionResult<null>> {
  const parsed = z
    .object({ shopId: uuid, status: z.enum(['onboarding', 'active', 'suspended', 'archived']) })
    .safeParse({ shopId, status });
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  const { error } = await res.value.db.rpc('console_set_shop_status', {
    p_shop_id: parsed.data.shopId,
    p_status: parsed.data.status,
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  await revalidateHostsOfShop(res.value.db, parsed.data.shopId);
  return ok(null);
}

export async function setShopFeaturesAction(
  shopId: string,
  features: string[],
): Promise<ActionResult<null>> {
  const parsed = z
    .object({ shopId: uuid, features: z.array(z.enum(FEATURES)).max(FEATURES.length) })
    .safeParse({ shopId, features });
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  const { error } = await res.value.db.rpc('console_set_shop_features', {
    p_shop_id: parsed.data.shopId,
    p_features: parsed.data.features,
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  return ok(null);
}

const billingSchema = z
  .object({
    shopId: uuid,
    setupFeeCents: z.number().int().min(0).max(10_000_000).nullable(),
    setupPaidAt: z.iso.date().nullable(),
    monthlyFeeCents: z.number().int().min(0).max(1_000_000).nullable(),
    status: z.enum(['trial', 'active', 'past_due', 'cancelled']),
    nextDueOn: z.iso.date().nullable(),
    notes: z.string().max(2000),
  })
  .strict();

export async function saveBillingAction(
  input: z.input<typeof billingSchema>,
): Promise<ActionResult<null>> {
  const parsed = billingSchema.safeParse(input);
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  const b = parsed.data;
  const { error } = await res.value.db.from('shop_billing').upsert({
    shop_id: b.shopId,
    setup_fee_cents: b.setupFeeCents,
    setup_paid_at: b.setupPaidAt,
    monthly_fee_cents: b.monthlyFeeCents,
    status: b.status,
    next_due_on: b.nextDueOn,
    notes: b.notes.trim() || null,
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  await auditPlatform(res.value, b.shopId, 'billing.update', 'shop', b.shopId, {
    status: b.status,
  });
  return ok(null);
}

const hostnameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(253)
  .regex(/^(?=.{1,253}$)(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/);

export async function addDomainAction(
  shopId: string,
  hostname: string,
): Promise<ActionResult<{ vercel: boolean }>> {
  const parsed = z
    .object({ shopId: uuid, hostname: hostnameSchema })
    .safeParse({ shopId, hostname });
  if (!parsed.success) return err('VALIDATION', 'VALIDATION');
  const host = normalizeHost(parsed.data.hostname);
  const reserved = [
    env.PLATFORM_ROOT_DOMAIN,
    env.PLATFORM_PRO_HOST.split(':')[0],
    env.PLATFORM_CONSOLE_HOST.split(':')[0],
  ];
  if (reserved.includes(host)) return err('DOMAIN_TAKEN', 'DOMAIN_TAKEN');
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  const state = vercelEnabled() ? await addProjectDomain(host) : null;
  const { error } = await res.value.db.from('shop_domains').insert({
    shop_id: parsed.data.shopId,
    hostname: host,
    kind: 'custom',
    is_primary: false,
    verified_at: state?.verified && state.configured ? new Date().toISOString() : null,
    provider_state: (state ?? {}) as never,
  });
  if (error) return err(error.code === '23505' ? 'DOMAIN_TAKEN' : mapDbError(error).code, 'ERROR');
  revalidateTag(hostTag(host), { expire: 0 });
  await auditPlatform(res.value, parsed.data.shopId, 'domain.add', 'domain', null, {
    hostname: host,
  });
  return ok({ vercel: state !== null });
}

/** Re-reads the DNS state from Vercel and marks the domain verified when it is ready. */
export async function checkDomainAction(
  domainId: string,
): Promise<ActionResult<{ verified: boolean }>> {
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  const { data: domain } = await res.value.db
    .from('shop_domains')
    .select('id, hostname, kind, verified_at')
    .eq('id', uuid.parse(domainId))
    .maybeSingle();
  if (!domain) return err('NOT_FOUND', 'NOT_FOUND');
  if (domain.kind === 'platform' || !vercelEnabled())
    return ok({ verified: domain.verified_at !== null });
  const state = await getProjectDomain(domain.hostname);
  const verified = !!state && state.verified && state.configured;
  await res.value.db
    .from('shop_domains')
    .update({
      provider_state: (state ?? {}) as never,
      verified_at: verified ? (domain.verified_at ?? new Date().toISOString()) : null,
    })
    .eq('id', domain.id);
  revalidateTag(hostTag(domain.hostname), { expire: 0 });
  return ok({ verified });
}

/** Without a Vercel token, the admin confirms by hand once the DNS works. */
export async function markDomainVerifiedAction(domainId: string): Promise<ActionResult<null>> {
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  const { data, error } = await res.value.db
    .from('shop_domains')
    .update({ verified_at: new Date().toISOString() })
    .eq('id', uuid.parse(domainId))
    .select('hostname, shop_id')
    .maybeSingle();
  if (error || !data) return err('NOT_FOUND', 'NOT_FOUND');
  revalidateTag(hostTag(data.hostname), { expire: 0 });
  await auditPlatform(res.value, data.shop_id, 'domain.verify', 'domain', domainId, {
    hostname: data.hostname,
  });
  return ok(null);
}

export async function setPrimaryDomainAction(domainId: string): Promise<ActionResult<null>> {
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  const { data: domain } = await res.value.db
    .from('shop_domains')
    .select('shop_id, verified_at')
    .eq('id', uuid.parse(domainId))
    .maybeSingle();
  if (!domain) return err('NOT_FOUND', 'NOT_FOUND');
  if (!domain.verified_at) return err('BAD_REQUEST', 'BAD_REQUEST');
  const { error } = await res.value.db.rpc('console_set_primary_domain', { p_domain_id: domainId });
  if (error) return err(mapDbError(error).code, 'ERROR');
  await revalidateHostsOfShop(res.value.db, domain.shop_id);
  return ok(null);
}

export async function removeDomainAction(domainId: string): Promise<ActionResult<null>> {
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  const { data: domain } = await res.value.db
    .from('shop_domains')
    .select('id, shop_id, hostname, kind, is_primary')
    .eq('id', uuid.parse(domainId))
    .maybeSingle();
  if (!domain) return err('NOT_FOUND', 'NOT_FOUND');
  // The platform subdomain and the primary domain stay: they carry the printed QR codes.
  if (domain.kind === 'platform' || domain.is_primary) return err('BAD_REQUEST', 'BAD_REQUEST');
  if (vercelEnabled()) await removeProjectDomain(domain.hostname);
  const { error } = await res.value.db.from('shop_domains').delete().eq('id', domain.id);
  if (error) return err(mapDbError(error).code, 'ERROR');
  revalidateTag(hostTag(domain.hostname), { expire: 0 });
  await auditPlatform(res.value, domain.shop_id, 'domain.remove', 'domain', domain.id, {
    hostname: domain.hostname,
  });
  return ok(null);
}

/** "Stolen tablet" procedure when the owner cannot be reached (vol. 08 §9.3). */
export async function consoleRevokeDeviceAction(deviceId: string): Promise<ActionResult<null>> {
  const res = await requirePlatformAdmin();
  if (!res.ok) return res;
  const { error } = await res.value.db.rpc('console_revoke_device', {
    p_device_id: uuid.parse(deviceId),
  });
  if (error) return err(mapDbError(error).code, 'ERROR');
  return ok(null);
}
