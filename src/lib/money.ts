// Money is always an integer number of cents (bible vol. 01 §5 rule 9, vol. 06 §6).

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, locale: string): Intl.NumberFormat {
  const key = `${locale}|${currency}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    formatters.set(key, formatter);
  }
  return formatter;
}

/** Displays an amount in cents, e.g. 1250 → "12,50 €". */
export function formatPrice(cents: number, currency = 'EUR', locale = 'fr-FR'): string {
  if (!Number.isInteger(cents)) {
    throw new TypeError('formatPrice expects an integer number of cents');
  }
  // Intl uses a narrow no-break space before the euro sign: normalise to a regular no-break space.
  return getFormatter(currency, locale)
    .format(cents / 100)
    .replace(/ /g, ' ');
}

/** Amount for dashboards: no decimals above 10 000 € (vol. 07 §5.10). */
export function formatAmountCompact(cents: number, currency = 'EUR', locale = 'fr-FR'): string {
  if (Math.abs(cents) >= 1_000_000) {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })
      .format(Math.round(cents / 100))
      .replace(/ /g, ' ');
  }
  return formatPrice(cents, currency, locale);
}

const PRICE_INPUT = /^(\d{1,7})(?:[,.](\d{1,2}))?$/;

/**
 * Parses a price typed by a shop owner, e.g. "12,50" → 1250, "12" → 1200, "0,5" → 50.
 * Ambiguous inputs ("1.234,5", "1 234", "12,345", negative numbers, letters) return null.
 */
export function parsePriceInput(input: string): number | null {
  const value = input.trim().replace(/\s*€$/, '');
  const match = PRICE_INPUT.exec(value);
  if (!match) return null;
  const euros = Number(match[1]);
  const decimals = match[2] ?? '';
  const cents =
    decimals.length === 0 ? 0 : decimals.length === 1 ? Number(decimals) * 10 : Number(decimals);
  return euros * 100 + cents;
}

/** Value to prefill a price input from cents, e.g. 1250 → "12,50". */
export function centsToInput(cents: number): string {
  const euros = Math.floor(cents / 100);
  const rest = cents % 100;
  return `${euros},${rest.toString().padStart(2, '0')}`;
}
