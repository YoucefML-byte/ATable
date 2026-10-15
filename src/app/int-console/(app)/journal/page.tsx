import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { requirePlatformAdminPage } from '@/server/auth/guards';
import { Card } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/dates';

export const metadata: Metadata = { title: 'Journal' };

const PAGE = 50;

/** Audit log (CON-05): who did what, never a secret (vol. 05 §10). Keyset pagination by id. */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string; before?: string }>;
}) {
  const { db } = await requirePlatformAdminPage();
  const t = await getTranslations('console.audit');
  const sp = await searchParams;
  const shopId = z.uuid().safeParse(sp.shop).success ? sp.shop! : null;
  const before = /^\d{1,18}$/.test(sp.before ?? '') ? Number(sp.before) : null;
  let query = db
    .from('audit_log')
    .select('id, shop_id, created_at, actor_kind, action, entity_type, entity_id, changes')
    .order('id', { ascending: false })
    .limit(PAGE + 1);
  if (shopId) query = query.eq('shop_id', shopId);
  if (before) query = query.lt('id', before);
  const [{ data: rows }, { data: shops }] = await Promise.all([
    query,
    db.from('shops').select('id, name').order('name'),
  ]);
  const names = new Map((shops ?? []).map((s) => [s.id, s.name]));
  const page = (rows ?? []).slice(0, PAGE);
  const hasMore = (rows ?? []).length > PAGE;
  const link = (params: Record<string, string | null>) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter((e): e is [string, string] => e[1] !== null),
    );
    return `/journal${qs.size ? `?${qs}` : ''}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <form method="get" className="flex items-end gap-2">
          <select
            name="shop"
            defaultValue={shopId ?? ''}
            aria-label={t('shop')}
            className="border-line bg-surface min-h-12 rounded-lg border px-3"
          >
            <option value="">{t('allShops')}</option>
            {(shops ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-brand text-brand-fg min-h-12 rounded-lg px-4 font-semibold"
          >
            OK
          </button>
        </form>
      </div>
      <Card className="overflow-x-auto p-0">
        {page.length === 0 ? (
          <p className="text-muted p-4">{t('empty')}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                {[t('when'), t('shop'), t('actor'), t('action'), t('entity'), t('changes')].map(
                  (h) => (
                    <th key={h} scope="col" className="p-2 font-semibold">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {page.map((r) => (
                <tr key={r.id} className="border-line border-t align-top">
                  <td className="p-2 whitespace-nowrap">
                    {formatDateTime(r.created_at, 'Europe/Paris')}
                  </td>
                  <td className="p-2">{r.shop_id ? (names.get(r.shop_id) ?? '—') : '—'}</td>
                  <td className="p-2">{t(`actorKind.${r.actor_kind as 'system'}`)}</td>
                  <td className="p-2">
                    <code>{r.action}</code>
                  </td>
                  <td className="p-2">{r.entity_type ?? '—'}</td>
                  <td className="max-w-md p-2">
                    {r.changes ? (
                      <code className="text-xs break-all">
                        {JSON.stringify(r.changes).slice(0, 300)}
                      </code>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <nav className="flex gap-3" aria-label={t('title')}>
        {before && (
          <Link
            href={link({ shop: shopId })}
            className="border-line min-h-12 rounded-lg border px-3 py-3 font-medium"
          >
            {t('newer')}
          </Link>
        )}
        {hasMore && (
          <Link
            href={link({ shop: shopId, before: String(page.at(-1)!.id) })}
            className="border-line min-h-12 rounded-lg border px-3 py-3 font-medium"
          >
            {t('older')}
          </Link>
        )}
      </nav>
    </div>
  );
}
