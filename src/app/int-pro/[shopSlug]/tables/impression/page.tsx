import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireShopPage } from '@/server/auth/guards';
import { shopPublicUrl } from '@/server/env';
import { PrintButton } from '@/components/pro/print-button';
import { QrCode } from '@/components/ui/qr-code';

export const metadata: Metadata = { title: 'Planche de QR codes' };

const FORMATS = {
  tent: { cols: 1, rows: 2, qr: '70mm', title: '9mm' },
  labels6: { cols: 2, rows: 3, qr: '55mm', title: '6mm' },
  labels12: { cols: 3, rows: 4, qr: '40mm', title: '4.5mm' },
} as const;

/** A4 print sheets (TAB-02): one QR code per cell with the table name and the invitation. */
export default async function PrintSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ shopSlug: string }>;
  searchParams: Promise<{ format?: string; ids?: string }>;
}) {
  const { shopSlug } = await params;
  const sp = await searchParams;
  const ctx = await requireShopPage(shopSlug, 'owner');
  const t = await getTranslations('pro.tablesAdmin');
  const format = FORMATS[(sp.format ?? 'tent') as keyof typeof FORMATS] ?? FORMATS.tent;
  const ids = (sp.ids ?? '')
    .split(',')
    .filter((id) => /^[0-9a-f-]{36}$/.test(id))
    .slice(0, 200);
  const { db, shop } = ctx;
  const [tables, tokens, domains] = await Promise.all([
    db
      .from('dining_tables')
      .select('id, label, position')
      .eq('shop_id', shop.id)
      .is('deleted_at', null)
      .in('id', ids)
      .order('position'),
    db
      .from('table_tokens')
      .select('table_id, token')
      .eq('shop_id', shop.id)
      .is('revoked_at', null)
      .in('table_id', ids),
    db
      .from('shop_domains')
      .select('hostname, is_primary')
      .eq('shop_id', shop.id)
      .order('is_primary', { ascending: false })
      .limit(1),
  ]);
  const host = domains.data?.[0]?.hostname;
  const tokenOf = new Map((tokens.data ?? []).map((x) => [x.table_id, x.token]));
  const cells = (tables.data ?? [])
    .filter((x) => host && tokenOf.has(x.id))
    .map((x) => ({
      id: x.id,
      label: x.label,
      url: shopPublicUrl(host!, `/t/${tokenOf.get(x.id)}`),
    }));
  const perPage = format.cols * format.rows;
  const pages = Array.from({ length: Math.ceil(cells.length / perPage) }, (_, i) =>
    cells.slice(i * perPage, (i + 1) * perPage),
  );

  return (
    <div className="bg-white p-4 text-black print:p-0">
      <style>{`@page { size: A4; margin: 0 } @media print { body { background: #fff } }`}</style>
      <div className="mb-4 flex items-center gap-3 print:hidden">
        <PrintButton label={t('print')} />
        <p>{t('sheetCount', { count: cells.length })}</p>
      </div>
      {pages.map((page, i) => (
        <section
          key={i}
          className="mx-auto mb-6 grid bg-white shadow print:mb-0 print:shadow-none"
          style={{
            width: '210mm',
            height: '297mm',
            gridTemplateColumns: `repeat(${format.cols}, 1fr)`,
            gridTemplateRows: `repeat(${format.rows}, 1fr)`,
            breakAfter: 'page',
          }}
        >
          {page.map((cell) => (
            <div
              key={cell.id}
              className="flex flex-col items-center justify-center gap-[2mm] border border-dashed border-gray-300 p-[4mm] text-center"
            >
              <p className="font-semibold" style={{ fontSize: format.title }}>
                {shop.name}
              </p>
              <div style={{ width: format.qr, height: format.qr }}>
                <QrCode value={cell.url} label={cell.label} margin={1} className="h-full w-full" />
              </div>
              <p className="font-bold" style={{ fontSize: format.title }}>
                {cell.label}
              </p>
              <p style={{ fontSize: `calc(${format.title} * 0.6)` }}>{t('invitation')}</p>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
