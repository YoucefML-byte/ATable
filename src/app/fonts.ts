import {
  Archivo,
  Archivo_Black,
  Cormorant_Garamond,
  DM_Sans,
  DM_Serif_Display,
  Fraunces,
  Inter,
  Lato,
  Playfair_Display,
  Space_Grotesk,
  Work_Sans,
} from 'next/font/google';

// next/font downloads the fonts at build time and self-hosts them: no request to a third-party
// service when a page is displayed (vol. 06 §4, vol. 05 §12.3). Only used weights, latin subset.
// No preload except Inter: a shop only uses one pair, the browser downloads only that pair.
// next/font requires literal options (no spread).

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});
export const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['600', '700'],
  variable: '--font-playfair',
});
export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['600', '700'],
  variable: '--font-fraunces',
});
export const worksans = Work_Sans({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['400', '500', '600'],
  variable: '--font-worksans',
});
export const spacegrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['500', '700'],
  variable: '--font-spacegrotesk',
});
export const archivoblack = Archivo_Black({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['400'],
  variable: '--font-archivoblack',
});
export const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['400', '500', '600'],
  variable: '--font-archivo',
});
export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['600', '700'],
  variable: '--font-cormorant',
});
export const lato = Lato({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['400', '700'],
  variable: '--font-lato',
});
export const dmserif = DM_Serif_Display({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['400'],
  variable: '--font-dmserif',
});
export const dmsans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  weight: ['400', '500', '600'],
  variable: '--font-dmsans',
});

export const allFontVariables = [
  inter,
  playfair,
  fraunces,
  worksans,
  spacegrotesk,
  archivoblack,
  archivo,
  cormorant,
  lato,
  dmserif,
  dmsans,
]
  .map((f) => f.variable)
  .join(' ');
