import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToOklch, oklchToHex } from './color';
import {
  PRESETS,
  onColorPairs,
  textColorsFor,
  themeCss,
  validateThemeContrast,
  type ThemeSettings,
} from './theme';

function randomHex(seed: number): string {
  let x = seed * 9301 + 49297;
  const next = () => (x = (x * 9301 + 49297) % 233280) / 233280;
  const c = () =>
    Math.floor(next() * 256)
      .toString(16)
      .padStart(2, '0');
  return `#${c()}${c()}${c()}`;
}

const base: ThemeSettings = PRESETS.classique!;

describe('colour maths', () => {
  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 1);
  });
  it('round-trips OKLCH', () => {
    for (const hex of ['#1F4D3A', '#E0A33A', '#7A2E1F', '#FFFFFF', '#000000']) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex.toUpperCase());
    }
  });
});

describe('theme guards (CLI-09, vol. 07 §3.4, ADR-009)', () => {
  it('no chosen colour can produce text below 4.5:1 on the customer site', () => {
    for (let i = 0; i < 400; i++) {
      const theme: ThemeSettings = {
        ...base,
        primary_color: randomHex(i),
        accent_color: randomHex(i + 1000),
        color_scheme: i % 3 === 0 ? 'clair' : i % 3 === 1 ? 'sombre' : 'auto',
      };
      for (const mode of ['clair', 'sombre'] as const) {
        const { bg, surfaces, colors, muted } = textColorsFor(theme, mode);
        for (const color of colors)
          for (const s of surfaces) expect(contrastRatio(color, s)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(muted, bg)).toBeGreaterThanOrEqual(4.5);
        for (const [fg, fill] of onColorPairs(theme, mode))
          expect(contrastRatio(fg, fill)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it('blocks a main colour invisible on the page, with a corrected shade', () => {
    const issues = validateThemeContrast({
      ...base,
      primary_color: '#F4F4F4',
      color_scheme: 'clair',
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]!.suggestion).not.toBeNull();
    expect(contrastRatio(issues[0]!.suggestion!, '#FFFFFF')).toBeGreaterThanOrEqual(3);
  });
  it('accepts every preset', () => {
    for (const preset of Object.values(PRESETS)) expect(validateThemeContrast(preset)).toEqual([]);
  });
  it('renders light and dark rules for "auto"', () => {
    const css = themeCss({ ...base, color_scheme: 'auto' });
    expect(css).toContain('prefers-color-scheme: dark');
    expect(css).toContain('--brand-text');
  });
});
