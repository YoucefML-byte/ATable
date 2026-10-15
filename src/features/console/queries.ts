import 'server-only';
import type { AdminContext } from '@/server/auth/guards';
import { createAdminClient } from '@/server/supabase/admin';
import type { DomainState } from '@/server/vercel';

// Shop detail for the console (CON-03). Everything goes through RLS (platform admin policies)
// except the owners' e-mail and last sign-in, which only Auth knows (admin-usage.md).

export type ConsoleShop = {
  shop: {
    id: string;
    name: string;
    slug: string;
    status: 'onboarding' | 'active' | 'suspended' | 'archived';
    features: string[];
    businessType: string;
    createdAt: string;
    timezone: string;
  };
  domains: Array<{
    id: string;
    hostname: string;
    kind: 'platform' | 'custom';
    isPrimary: boolean;
    verifiedAt: string | null;
    state: DomainState | null;
  }>;
  billing: {
    setupFeeCents: number | null;
    setupPaidAt: string | null;
    monthlyFeeCents: number | null;
    status: 'trial' | 'active' | 'past_due' | 'cancelled';
    nextDueOn: string | null;
    notes: string | null;
  } | null;
  owners: Array<{
    memberId: string;
    name: string;
    email: string | null;
    lastSignInAt: string | null;
    isActive: boolean;
  }>;
  devices: Array<{
    id: string;
    name: string;
    enrolledAt: string;
    lastSeenAt: string | null;
    revokedAt: string | null;
  }>;
  audit: Array<{
    id: number;
    createdAt: string;
    actorKind: string;
    action: string;
    entityType: string | null;
  }>;
};

export async function loadConsoleShop(
  ctx: AdminContext,
  shopId: string,
): Promise<ConsoleShop | null> {
  const { db } = ctx;
  const [shop, domains, billing, owners, devices, audit] = await Promise.all([
    db
      .from('shops')
      .select('id, name, slug, status, features, business_type, created_at, timezone')
      .eq('id', shopId)
      .maybeSingle(),
    db
      .from('shop_domains')
      .select('id, hostname, kind, is_primary, verified_at, provider_state')
      .eq('shop_id', shopId)
      .order('created_at'),
    db.from('shop_billing').select('*').eq('shop_id', shopId).maybeSingle(),
    db
      .from('shop_members')
      .select('id, user_id, display_name, is_active')
      .eq('shop_id', shopId)
      .eq('role', 'owner')
      .order('created_at'),
    db
      .from('devices')
      .select('id, name, enrolled_at, last_seen_at, revoked_at')
      .eq('shop_id', shopId)
      .order('enrolled_at', { ascending: false }),
    db
      .from('audit_log')
      .select('id, created_at, actor_kind, action, entity_type')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);
  if (!shop.data) return null;
  const admin = createAdminClient();
  const ownerRows = await Promise.all(
    (owners.data ?? []).map(async (o) => {
      const { data } = await admin.auth.admin.getUserById(o.user_id);
      return {
        memberId: o.id,
        name: o.display_name,
        email: data.user?.email ?? null,
        lastSignInAt: data.user?.last_sign_in_at ?? null,
        isActive: o.is_active,
      };
    }),
  );
  const s = shop.data;
  const b = billing.data;
  return {
    shop: {
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: s.status,
      features: s.features,
      businessType: s.business_type,
      createdAt: s.created_at,
      timezone: s.timezone,
    },
    domains: (domains.data ?? []).map((d) => ({
      id: d.id,
      hostname: d.hostname,
      kind: d.kind,
      isPrimary: d.is_primary,
      verifiedAt: d.verified_at,
      state:
        d.provider_state &&
        typeof d.provider_state === 'object' &&
        'instructions' in d.provider_state
          ? (d.provider_state as unknown as DomainState)
          : null,
    })),
    billing: b
      ? {
          setupFeeCents: b.setup_fee_cents,
          setupPaidAt: b.setup_paid_at,
          monthlyFeeCents: b.monthly_fee_cents,
          status: b.status,
          nextDueOn: b.next_due_on,
          notes: b.notes,
        }
      : null,
    owners: ownerRows,
    devices: (devices.data ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      enrolledAt: d.enrolled_at,
      lastSeenAt: d.last_seen_at,
      revokedAt: d.revoked_at,
    })),
    audit: (audit.data ?? []).map((a) => ({
      id: a.id,
      createdAt: a.created_at,
      actorKind: a.actor_kind,
      action: a.action,
      entityType: a.entity_type,
    })),
  };
}
