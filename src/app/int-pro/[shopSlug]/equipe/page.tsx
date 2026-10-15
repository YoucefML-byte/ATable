import type { Metadata } from 'next';
import { requireShopPage } from '@/server/auth/guards';
import { TeamView, type MemberRow } from '@/components/pro/team-view';

export const metadata: Metadata = { title: 'Équipe' };

export default async function TeamPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug, 'owner');
  const [{ data: members }, { data: sessions }] = await Promise.all([
    ctx.db
      .from('shop_members')
      .select('id, role, display_name, color, permissions, is_active, pin_hard_locked, pin_locked_until, user_id')
      .eq('shop_id', ctx.shop.id)
      .order('role')
      .order('display_name'),
    ctx.db.from('staff_sessions').select('member_id').eq('shop_id', ctx.shop.id).is('revoked_at', null).gt('expires_at', new Date().toISOString()),
  ]);
  const count = new Map<string, number>();
  for (const s of sessions ?? []) count.set(s.member_id, (count.get(s.member_id) ?? 0) + 1);
  const now = Date.now();
  const rows: MemberRow[] = (members ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    display_name: m.display_name,
    color: m.color,
    permissions: (m.permissions ?? []) as MemberRow['permissions'],
    is_active: m.is_active,
    locked: m.pin_hard_locked || (!!m.pin_locked_until && new Date(m.pin_locked_until).getTime() > now),
    sessions: count.get(m.id) ?? 0,
    isYou: m.user_id === ctx.claims.userId,
  }));
  return <TeamView shopSlug={ctx.shop.slug} members={rows} />;
}
