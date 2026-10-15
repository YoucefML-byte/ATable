import { NextResponse, type NextRequest } from 'next/server';
import { requireOwner } from '@/server/auth/guards';
import { historyFilterSchema, queryHistory } from '@/features/orders/history';
import { centsToCsv, toCsv } from '@/lib/csv';
import { formatDateTime } from '@/lib/dates';
import { messages } from '@/i18n/messages';

// CSV export of the filtered period: one line per order or one line per item (HIS-01).
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const res = await requireOwner(sp.get('shop') ?? '');
  if (!res.ok) return NextResponse.json({ ok: false, code: res.code }, { status: 403 });
  const filter = historyFilterSchema.safeParse(Object.fromEntries([...sp.entries()].filter(([, v]) => v !== '')));
  if (!filter.success) return NextResponse.json({ ok: false, code: 'BAD_REQUEST' }, { status: 400 });
  const mode = sp.get('mode') === 'items' ? 'items' : 'orders';
  const { orders } = await queryHistory(res.value.db, res.value.shop.id, filter.data, { all: true });
  const tz = res.value.shop.timezone;
  const status = messages.common.status as Record<string, string>;
  const h = messages.pro.history.csv;
  const csv =
    mode === 'orders'
      ? toCsv(
          [h.businessDay, h.number, h.date, h.table, h.status, h.source, h.items, h.amount, h.note, h.reason],
          orders.map((o) => [o.business_day, o.number, formatDateTime(o.created_at, tz), o.table_label, status[o.status] ?? o.status, o.source, o.item_count, centsToCsv(o.subtotal_cents), o.note, o.internal_reason]),
        )
      : toCsv(
          [h.businessDay, h.number, h.date, h.table, h.status, h.category, h.product, h.options, h.quantity, h.unitPrice, h.lineTotal],
          orders.flatMap((o) =>
            o.items.map((i) => [o.business_day, o.number, formatDateTime(o.created_at, tz), o.table_label, status[o.status] ?? o.status, i.category, i.name, i.options.join(', '), i.quantity, centsToCsv(i.unit_price_cents), centsToCsv(i.line_total_cents)]),
          ),
        );
  const name = `commandes-${res.value.shop.slug}-${filter.data.from}-${filter.data.to}${mode === 'items' ? '-articles' : ''}.csv`;
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store',
    },
  });
}
