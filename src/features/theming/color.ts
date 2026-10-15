// Colour utilities: WCAG 2.2 contrast and OKLCH derivations (vol. 07 §3.4).

export type Rgb = { r: number; g: number; b: number };
export type Oklch = { l: number; c: number; h: number };

export function hexToRgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Invalid colour: ${hex}`);
  const n = parseInt(m[1]!, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

function srgbToLinear(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  return c * 255;
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/** WCAG contrast ratio between two colours (1 to 21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white, whichever reads best on the background. */
export function readableOn(background: string): '#000000' | '#FFFFFF' {
  return contrastRatio(background, '#000000') >= contrastRatio(background, '#FFFFFF') ? '#000000' : '#FFFFFF';
}

export function hexToOklch(hex: string): Oklch {
  const { r, g, b } = hexToRgb(hex);
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h };
}

export function oklchToHex({ l, c, h }: Oklch): string {
  const hr = (h * Math.PI) / 180;
  const A = c * Math.cos(hr);
  const B = c * Math.sin(hr);
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
  const g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
  const b = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;
  return rgbToHex({ r: linearToSrgb(Math.max(0, Math.min(1, r))), g: linearToSrgb(Math.max(0, Math.min(1, g))), b: linearToSrgb(Math.max(0, Math.min(1, b))) });
}

/** Same hue and chroma, another lightness (clamped). */
export function withLightness(hex: string, l: number): string {
  const o = hexToOklch(hex);
  return oklchToHex({ ...o, l: Math.min(0.99, Math.max(0.02, l)) });
}

/**
 * Darkens (or lightens) a colour along OKLCH lightness until it reaches the target contrast
 * against the given background. Returns null if impossible.
 */
export function adjustForContrast(color: string, background: string, target: number): string | null {
  if (contrastRatio(color, background) >= target) return color.toUpperCase();
  const o = hexToOklch(color);
  const bgIsLight = luminance(background) > 0.18;
  for (let step = 1; step <= 100; step++) {
    const l = bgIsLight ? o.l - step * 0.01 : o.l + step * 0.01;
    if (l <= 0 || l >= 1) break;
    const candidate = oklchToHex({ ...o, l });
    if (contrastRatio(candidate, background) >= target) return candidate;
  }
  return null;
}
