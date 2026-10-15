import type { Metadata } from 'next';
import { requireShopPage } from '@/server/auth/guards';
import { mediaBaseUrl } from '@/server/site/context';
import { PRESETS, type ThemeSettings } from '@/features/theming/theme';
import { ThemeEditor } from '@/components/pro/theme-editor';

export const metadata: Metadata = { title: 'Thème' };

export default async function ThemePage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params;
  const ctx = await requireShopPage(shopSlug, 'owner');
  const { db, shop } = ctx;
  const [{ data: theme }, { data: products }] = await Promise.all([
    db.from('shop_themes').select('*').eq('shop_id', shop.id).maybeSingle(),
    db
      .from('products')
      .select('name, description, base_price_cents')
      .eq('shop_id', shop.id)
      .is('deleted_at', null)
      .eq('is_hidden', false)
      .order('position')
      .limit(4),
  ]);
  const base = mediaBaseUrl();
  const fallback = PRESETS.classique!;
  const initial: ThemeSettings = theme
    ? {
        preset: theme.preset,
        primary_color: theme.primary_color.toUpperCase(),
        accent_color: theme.accent_color.toUpperCase(),
        font_pair: theme.font_pair as ThemeSettings['font_pair'],
        radius: theme.radius as ThemeSettings['radius'],
        density: theme.density as ThemeSettings['density'],
        menu_layout: theme.menu_layout as ThemeSettings['menu_layout'],
        color_scheme: theme.color_scheme as ThemeSettings['color_scheme'],
      }
    : {
        preset: fallback.preset,
        primary_color: fallback.primary_color,
        accent_color: fallback.accent_color,
        font_pair: fallback.font_pair,
        radius: fallback.radius,
        density: fallback.density,
        menu_layout: fallback.menu_layout,
        color_scheme: fallback.color_scheme,
      };
  return (
    <ThemeEditor
      shopSlug={shop.slug}
      shopName={shop.name}
      initial={initial}
      logoUrl={theme?.logo_path ? `${base}/${theme.logo_path}-400.webp` : null}
      coverUrl={theme?.cover_path ? `${base}/${theme.cover_path}-1200.webp` : null}
      products={(products ?? []).map((p) => ({
        name: p.name,
        description: p.description,
        price: p.base_price_cents,
      }))}
    />
  );
}
