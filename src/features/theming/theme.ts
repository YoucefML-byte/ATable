// Shop themes (vol. 07 §3): presets, font pairs, CSS variables and contrast guards.
import type { ShopTheme } from '@/features/shops/schemas';
import { adjustForContrast, contrastRatio, readableOn, withLightness, hexToOklch } from './color';

export const FONT_PAIRS = {
  classique: { display: 'playfair', body: 'inter', label: 'Classique' },
  bistrot: { display: 'fraunces', body: 'worksans', label: 'Bistrot' },
  moderne: { display: 'spacegrotesk', body: 'inter', label: 'Moderne' },
  street: { display: 'archivoblack', body: 'archivo', label: 'Street' },
  elegant: { display: 'cormorant', body: 'lato', label: 'Élégant' },
  doux: { display: 'dmserif', body: 'dmsans', label: 'Doux' },
} as const;
export type FontPair = keyof typeof FONT_PAIRS;

export type ThemeSettings = Pick<
  ShopTheme,
  'preset' | 'primary_color' | 'accent_color' | 'font_pair' | 'radius' | 'density' | 'menu_layout' | 'color_scheme'
>;

export const PRESETS: Record<string, ThemeSettings & { label: string }> = {
  classique: { label: 'Classique', preset: 'classique', primary_color: '#1F4D3A', accent_color: '#E0A33A', font_pair: 'classique', radius: 'doux', density: 'aeree', menu_layout: 'liste', color_scheme: 'clair' },
  brasserie: { label: 'Brasserie', preset: 'brasserie', primary_color: '#7A2E1F', accent_color: '#D9A441', font_pair: 'bistrot', radius: 'doux', density: 'aeree', menu_layout: 'liste', color_scheme: 'clair' },
  'street-food': { label: 'Street food', preset: 'street-food', primary_color: '#111111', accent_color: '#F5C400', font_pair: 'street', radius: 'carre', density: 'compacte', menu_layout: 'grille', color_scheme: 'clair' },
  lounge: { label: 'Lounge', preset: 'lounge', primary_color: '#3B1F5C', accent_color: '#E3B04B', font_pair: 'elegant', radius: 'arrondi', density: 'aeree', menu_layout: 'grille', color_scheme: 'sombre' },
  cafe: { label: 'Café', preset: 'cafe', primary_color: '#5B3A29', accent_color: '#C98B4F', font_pair: 'moderne', radius: 'doux', density: 'compacte', menu_layout: 'minimaliste', color_scheme: 'auto' },
  'salon-de-the': { label: 'Salon de thé', preset: 'salon-de-the', primary_color: '#9C4A6B', accent_color: '#E8B4B8', font_pair: 'doux', radius: 'arrondi', density: 'aeree', menu_layout: 'grille', color_scheme: 'clair' },
  'bistrot-nature': { label: 'Bistrot nature', preset: 'bistrot-nature', primary_color: '#3F5E3A', accent_color: '#C7B37A', font_pair: 'bistrot', radius: 'doux', density: 'aeree', menu_layout: 'liste', color_scheme: 'clair' },
};

const RADIUS = { carre: '4px', doux: '10px', arrondi: '18px' } as const;
const BUTTON_RADIUS = { carre: '4px', doux: '10px', arrondi: '999px' } as const;

const LIGHT = { bg: '#FFFFFF', surface: '#F7F5F2', fg: '#1A1A1A', muted: '#5C5C5C', border: '#E3E0DA' };
const DARK = { bg: '#121212', surface: '#1E1E1E', fg: '#F2F2F2', muted: '#B3B3B3', border: '#333333' };

function palette(theme: ThemeSettings, dark: boolean): Record<string, string> {
  const base = dark ? DARK : LIGHT;
  // In dark mode the brand colour is lifted in lightness to stay visible on the dark background.
  const brand = dark ? liftForDark(theme.primary_color) : theme.primary_color.toUpperCase();
  const accent = dark ? liftForDark(theme.accent_color) : theme.accent_color.toUpperCase();
  const o = hexToOklch(brand);
  const soft = withLightness(brand, dark ? 0.26 : 0.95);
  const surfaces = [base.bg, base.surface, soft];
  return {
    '--bg': base.bg,
    '--surface': base.surface,
    '--fg': base.fg,
    '--muted-fg': base.muted,
    '--border': base.border,
    '--brand': brand,
    '--brand-foreground': readableOn(brand),
    '--brand-hover': withLightness(brand, dark ? o.l + 0.06 : o.l - 0.06),
    '--brand-soft': soft,
    '--brand-border': withLightness(brand, dark ? 0.4 : 0.85),
    // Brand colour used AS TEXT on the page background: always at least 4.5:1 (ADR-009).
    '--brand-text': safeText(brand, surfaces, base.fg),
    '--accent': accent,
    '--accent-foreground': readableOn(accent),
    '--accent-text': safeText(accent, surfaces, base.fg),
  };
}

/** A colour readable (>= 4.5:1) as text on every given background, or the fallback. */
function safeText(color: string, backgrounds: string[], fallback: string): string {
  let current: string | null = color.toUpperCase();
  for (let pass = 0; pass < 3 && current; pass++) {
    for (const bg of backgrounds) {
      current = current ? adjustForContrast(current, bg, 4.5) : null;
    }
    if (current && backgrounds.every((bg) => contrastRatio(current!, bg) >= 4.5)) return current;
  }
  return fallback;
}

function liftForDark(hex: string): string {
  const o = hexToOklch(hex);
  return o.l < 0.62 ? withLightness(hex, 0.68) : hex.toUpperCase();
}

/** CSS rules for a theme, rendered server-side (no colour flash). */
export function themeCss(theme: ThemeSettings, scope = ':root'): string {
  const common = {
    '--radius': RADIUS[theme.radius],
    '--radius-button': BUTTON_RADIUS[theme.radius],
    '--density': theme.density === 'compacte' ? '0.75' : '1',
    '--font-display': `var(--font-${FONT_PAIRS[theme.font_pair].display})`,
    '--font-body': `var(--font-${FONT_PAIRS[theme.font_pair].body})`,
  };
  const decl = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([k, v]) => `${k}:${v}`)
      .join(';');
  const light = decl({ ...common, ...palette(theme, false), 'color-scheme': 'light' });
  const dark = decl({ ...common, ...palette(theme, true), 'color-scheme': 'dark' });
  if (theme.color_scheme === 'clair') return `${scope}{${light}}`;
  if (theme.color_scheme === 'sombre') return `${scope}{${dark}}`;
  return `${scope}{${light}}@media (prefers-color-scheme: dark){${scope}{${dark}}}`;
}

export type ThemeIssue = {
  field: 'primary_color';
  mode: 'clair' | 'sombre';
  ratio: number;
  suggestion: string | null;
};

/**
 * Blocking check at save time (ADR-009). Text placed ON the shop colours switches to black or
 * white (always >= 4.5:1), and text written IN the shop colours uses --brand-text, darkened or
 * lightened automatically to 4.5:1. What remains to check is the main colour itself as a
 * button or active element on the page background: it must reach 3:1 (WCAG 1.4.11), otherwise
 * buttons disappear into the page. A corrected shade is proposed.
 */
export function validateThemeContrast(theme: ThemeSettings): ThemeIssue[] {
  const modes: Array<'clair' | 'sombre'> =
    theme.color_scheme === 'auto' ? ['clair', 'sombre'] : [theme.color_scheme];
  const issues: ThemeIssue[] = [];
  for (const mode of modes) {
    const bg = mode === 'sombre' ? DARK.bg : LIGHT.bg;
    const color = mode === 'sombre' ? liftForDark(theme.primary_color) : theme.primary_color;
    const ratio = contrastRatio(color, bg);
    if (ratio < 3) {
      issues.push({
        field: 'primary_color',
        mode,
        ratio: Math.round(ratio * 100) / 100,
        suggestion: adjustForContrast(theme.primary_color, bg, 3),
      });
    }
  }
  return issues;
}

/** Colours actually used as text on the page, for tests and the preview. */
export function textColorsFor(
  theme: ThemeSettings,
  mode: 'clair' | 'sombre',
): { bg: string; surfaces: string[]; colors: string[]; muted: string } {
  const p = palette(theme, mode === 'sombre');
  return {
    bg: p['--bg']!,
    surfaces: [p['--bg']!, p['--surface']!, p['--brand-soft']!],
    colors: [p['--brand-text']!, p['--accent-text']!, p['--fg']!],
    muted: p['--muted-fg']!,
  };
}

export function onColorPairs(theme: ThemeSettings, mode: 'clair' | 'sombre'): Array<[string, string]> {
  const p = palette(theme, mode === 'sombre');
  return [
    [p['--brand-foreground']!, p['--brand']!],
    [p['--accent-foreground']!, p['--accent']!],
  ];
}
