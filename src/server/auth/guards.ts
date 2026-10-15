import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createUserClient, type UserClient } from '@/server/supabase/user';
import { getSessionClaims, type SessionClaims } from '@/server/auth/session';
import { err, ok, type Result } from '@/lib/result';
import { env } from '@/server/env';

// Early guards: they give clean errors and redirects. They come IN ADDITION to the database,
// which remains the only source of truth (RLS and functions, vol. 05 §5).

export type Permission = 'floor' | 'kitchen' | 'stock';

export type ShopContext = {
  db: UserClient;
  claims: SessionClaims;
  shop: {
    id: string;
    slug: string;
    name: string;
    status: 'onboarding' | 'active' | 'suspended' | 'archived';
    timezone: string;
    currency: string;
    accepting_orders: boolean;
    kitchen_warning_minutes: number;
    kitchen_critical_minutes: number;
    floor_alert_repeat_seconds: number;
    staff_idle_lock_minutes: number;
    business_day_start: string;
    sold_out_label: string;
  };
  member: {
    id: string;
    role: 'owner' | 'staff';
    display_name: string;
    color: string;
    permissions: Permission[];
  };
  isOwner: boolean;
  isReadOnly: boolean;
  can: (perm: Permission | 'owner') => boolean;
};

type ContextFailure = 'UNAUTHENTICATED' | 'MFA_REQUIRED' | 'NOT_FOUND' | 'STAFF_SESSION_INVALID';

/** Staff members sign in through technical users with a fictitious address (vol. 03 §6.2). */
export function isStaffEmail(email: string | null): boolean {
  return !!email && email.endsWith(`@${env.STAFF_EMAIL_DOMAIN}`);
}

const loadShopContext = cache(async (slug: string): Promise<ShopContext | ContextFailure> => {
  const claims = await getSessionClaims();
  if (!claims) return 'UNAUTHENTICATED';
  const db = await createUserClient();
  const { data: shop } = await db
    .from('shops')
    .select(
      'id, slug, name, status, timezone, currency, accepting_orders, kitchen_warning_minutes, kitchen_critical_minutes, floor_alert_repeat_seconds, staff_idle_lock_minutes, business_day_start, sold_out_label',
    )
    .eq('slug', slug)
    .maybeSingle();
  if (!shop) {
    if (isStaffEmail(claims.email)) return 'STAFF_SESSION_INVALID';
    // An owner in aal1 sees nothing: send them to the 2FA step rather than "not found".
    if (claims.aal === 'aal1') return 'MFA_REQUIRED';
    return 'NOT_FOUND';
  }
  const { data: member } = await db
    .from('shop_members')
    .select('id, role, display_name, color, permissions')
    .eq('shop_id', shop.id)
    .eq('user_id', claims.userId)
    .eq('is_active', true)
    .maybeSingle();
  if (!member) return 'NOT_FOUND';
  const isOwner = member.role === 'owner';
  const permissions = (member.permissions ?? []).filter((p): p is Permission =>
    ['floor', 'kitchen', 'stock'].includes(p),
  );
  return {
    db,
    claims,
    shop,
    member: { ...member, permissions },
    isOwner,
    isReadOnly: !(shop.status === 'active' || shop.status === 'onboarding'),
    can: (perm) => (perm === 'owner' ? isOwner : isOwner || permissions.includes(perm)),
  };
});

/** Page guard: redirects to login / 2FA, or 404. */
export async function requireShopPage(
  slug: string,
  perm?: Permission | 'owner',
): Promise<ShopContext> {
  const ctx = await loadShopContext(slug);
  if (ctx === 'UNAUTHENTICATED') redirect('/connexion');
  if (ctx === 'MFA_REQUIRED') redirect('/2fa');
  if (ctx === 'STAFF_SESSION_INVALID') redirect('/equipe');
  if (ctx === 'NOT_FOUND') redirect('/');
  if (perm && !ctx.can(perm)) redirect(`/${slug}`);
  return ctx;
}

/** Action guard: typed error instead of a redirect. */
export async function requireShopAction(
  slug: string,
  perm?: Permission | 'owner',
): Promise<Result<ShopContext>> {
  const ctx = await loadShopContext(slug);
  if (ctx === 'UNAUTHENTICATED') return err('UNAUTHENTICATED', 'UNAUTHENTICATED');
  if (ctx === 'MFA_REQUIRED') return err('MFA_REQUIRED', 'MFA_REQUIRED');
  if (ctx === 'STAFF_SESSION_INVALID') return err('UNAUTHENTICATED', 'UNAUTHENTICATED');
  if (ctx === 'NOT_FOUND') return err('NOT_FOUND', 'NOT_FOUND');
  if (perm && !ctx.can(perm)) return err('FORBIDDEN', 'FORBIDDEN');
  return ok(ctx);
}

export async function requireOwner(slug: string): Promise<Result<ShopContext>> {
  const res = await requireShopAction(slug, 'owner');
  if (res.ok && res.value.isReadOnly) return err('FORBIDDEN', 'READ_ONLY');
  return res;
}

export async function requireStaffPermission(
  slug: string,
  perm: Permission,
): Promise<Result<ShopContext>> {
  return requireShopAction(slug, perm);
}

export type AdminContext = { db: UserClient; claims: SessionClaims };

type AdminFailure = 'UNAUTHENTICATED' | 'MFA_REQUIRED' | 'NOT_FOUND';

export const loadAdminContext = cache(async (): Promise<AdminContext | AdminFailure> => {
  const claims = await getSessionClaims();
  if (!claims) return 'UNAUTHENTICATED';
  if (claims.aal !== 'aal2') return 'MFA_REQUIRED';
  const db = await createUserClient();
  const { data } = await db
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', claims.userId)
    .maybeSingle();
  if (!data) return 'NOT_FOUND';
  return { db, claims };
});

export async function requirePlatformAdminPage(): Promise<AdminContext> {
  const ctx = await loadAdminContext();
  if (ctx === 'UNAUTHENTICATED') redirect('/connexion');
  if (ctx === 'MFA_REQUIRED') redirect('/2fa');
  if (ctx === 'NOT_FOUND') redirect('/connexion?refus=1');
  return ctx;
}

export async function requirePlatformAdmin(): Promise<Result<AdminContext>> {
  const ctx = await loadAdminContext();
  if (ctx === 'UNAUTHENTICATED') return err('UNAUTHENTICATED', 'UNAUTHENTICATED');
  if (ctx === 'MFA_REQUIRED') return err('MFA_REQUIRED', 'MFA_REQUIRED');
  if (ctx === 'NOT_FOUND') return err('FORBIDDEN', 'FORBIDDEN');
  return ok(ctx);
}
