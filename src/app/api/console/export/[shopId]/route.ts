import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdmin } from '@/server/auth/guards';
import { env } from '@/server/env';
import { centsToCsv, toCsv } from '@/lib/csv';

// Reversibility export of a shop (CON-05): configuration, catalog, tables and orders in one JSON
// file. Table tokens, PIN hashes, device secrets and customer keys are never exported.
const ORDER_PAGE = 1000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shopId: string }> },
) {
  if (request.headers.get('host') !== env.PLATFORM_CONSOLE_HOST)
    return new NextResponse(null, { status: 404 });
  const { shopId } = await params;
  if (!z.uuid().safeParse(shopId).success) return new NextResponse(null, { status: 404 });
  const res = await requirePlatformAdmin();
  if (!res.ok)
    return NextResponse.json(
      { ok: false, code: res.code },
      { status: res.code === 'FORBIDDEN' ? 403 : 401 },
    );
  const { db } = res.value;
  const by = <T extends string>(table: T) =>
    db
      .from(table as 'menus')
      .select('*')
      .eq('shop_id', shopId);
  const { data: shop } = await db
    .from('shops')
    .select(
      'id, slug, name, business_type, status, timezone, currency, locale, welcome_message, opening_hours_text, address_text, phone, sold_out_label, price_notice, business_day_start, legal_name, legal_form, legal_siret, legal_address, legal_publication_director, features, created_at',
    )
    .eq('id', shopId)
    .maybeSingle();
  if (!shop) return new NextResponse(null, { status: 404 });
  const [
    theme,
    domains,
    menus,
    schedules,
    menuCategories,
    categories,
    products,
    groups,
    options,
    links,
    productAllergens,
    optionAllergens,
    tables,
  ] = await Promise.all([
    db.from('shop_themes').select('*').eq('shop_id', shopId).maybeSingle(),
    db.from('shop_domains').select('hostname, kind, is_primary, verified_at').eq('shop_id', shopId),
    by('menus'),
    by('menu_schedules'),
    by('menu_categories'),
    by('categories'),
    by('products'),
    by('option_groups'),
    by('options'),
    by('product_option_groups'),
    by('product_allergens'),
    by('option_allergens'),
    db
      .from('dining_tables')
      .select('id, label, zone, seats, is_active, position, deleted_at')
      .eq('shop_id', shopId),
  ]);
  const orders: unknown[] = [];
  for (let from = 0; ; from += ORDER_PAGE) {
    const { data, error } = await db
      .from('orders')
      .select(
        'id, number, business_day, status, table_id, subtotal_cents, note, internal_reason, source, created_at, accepted_at, ready_at, served_at, rejected_at, cancelled_at, order_items(product_id, product_name, category_name, unit_price_cents, quantity, line_total_cents, order_item_options(group_name, option_name, price_delta_cents, quantity))',
      )
      .eq('shop_id', shopId)
      .order('created_at')
      .range(from, from + ORDER_PAGE - 1);
    if (error) return NextResponse.json({ ok: false, code: 'INTERNAL' }, { status: 500 });
    orders.push(...(data ?? []));
    if (!data || data.length < ORDER_PAGE) break;
  }
  if (request.nextUrl.searchParams.get('format') === 'csv') {
    // One line per ordered item: readable in a spreadsheet by the departing shop.
    type Row = {
      number: number;
      business_day: string;
      status: string;
      table_id: string;
      created_at: string;
      order_items: Array<{
        product_name: string;
        category_name: string | null;
        quantity: number;
        unit_price_cents: number;
        line_total_cents: number;
        order_item_options: Array<{ group_name: string; option_name: string; quantity: number }>;
      }>;
    };
    const labels = new Map((tables.data ?? []).map((t) => [t.id, t.label]));
    const rows = (orders as Row[]).flatMap((o) =>
      o.order_items.map((i) => [
        o.business_day,
        o.created_at,
        o.number,
        o.status,
        labels.get(o.table_id) ?? '',
        i.category_name ?? '',
        i.product_name,
        i.order_item_options
          .map((x) => `${x.group_name}: ${x.option_name}${x.quantity > 1 ? ` x${x.quantity}` : ''}`)
          .join(' | '),
        i.quantity,
        centsToCsv(i.unit_price_cents),
        centsToCsv(i.line_total_cents),
      ]),
    );
    const csv = toCsv(
      [
        'Journée',
        'Horodatage (UTC)',
        'N°',
        'Statut',
        'Table',
        'Catégorie',
        'Produit',
        'Options',
        'Quantité',
        'Prix unitaire',
        'Total ligne',
      ],
      rows,
    );
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="atable-${shop.slug}-commandes.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }
  const body = {
    format: 'atable-export',
    version: 1,
    exported_at: new Date().toISOString(),
    shop,
    theme: theme.data,
    domains: domains.data,
    catalog: {
      menus: menus.data,
      menu_schedules: schedules.data,
      menu_categories: menuCategories.data,
      categories: categories.data,
      products: products.data,
      option_groups: groups.data,
      options: options.data,
      product_option_groups: links.data,
      product_allergens: productAllergens.data,
      option_allergens: optionAllergens.data,
    },
    tables: tables.data,
    orders,
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="atable-${shop.slug}-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
