import { describe, expect, it } from 'vitest';
import { centsToInput, formatAmountCompact, formatPrice, parsePriceInput } from './money';

describe('formatPrice', () => {
  it('CLI-02 CA4 — French format 12,50 €', () => {
    expect(formatPrice(1250)).toBe('12,50 €');
    expect(formatPrice(0)).toBe('0,00 €');
    expect(formatPrice(123456)).toBe('1 234,56 €');
  });
  it('refuses non-integer cents', () => {
    expect(() => formatPrice(12.5)).toThrow();
  });
  it('drops decimals above 10 000 € on dashboards', () => {
    expect(formatAmountCompact(1_234_567)).toBe('12 346 €');
    expect(formatAmountCompact(128450)).toBe('1 284,50 €');
  });
});

describe('parsePriceInput', () => {
  it.each([
    ['12,50', 1250],
    ['12.50', 1250],
    ['12', 1200],
    ['0,5', 50],
    [' 9,90 € ', 990],
    ['0', 0],
  ])('parses %s', (input, expected) => {
    expect(parsePriceInput(input)).toBe(expected);
  });
  it.each(['', 'abc', '-1', '12,345', '1.234,50', '1 234', '12,', ',50', '1e3'])(
    'refuses ambiguous %s',
    (input) => {
      expect(parsePriceInput(input)).toBeNull();
    },
  );
  it('round-trips with centsToInput', () => {
    for (const cents of [0, 5, 50, 999, 1250, 100000]) {
      expect(parsePriceInput(centsToInput(cents))).toBe(cents);
    }
  });
});
