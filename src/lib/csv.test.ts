import { describe, expect, it } from 'vitest';
import { centsToCsv, csvCell, toCsv } from './csv';

describe('CSV export (HIS-01, vol. 05 §7)', () => {
  it('neutralises formula injection', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(csvCell('+33 1 23')).toBe("'+33 1 23");
    expect(csvCell('-2')).toBe("'-2");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
  });
  it('quotes separators and line breaks', () => {
    expect(csvCell('a;b')).toBe('"a;b"');
    expect(csvCell('ligne\nsuivante')).toBe('"ligne\nsuivante"');
  });
  it('writes amounts with a decimal comma', () => {
    expect(centsToCsv(1250)).toBe('12,50');
    expect(centsToCsv(5)).toBe('0,05');
  });
  it('starts with a BOM and uses semicolons', () => {
    expect(toCsv(['a', 'b'], [[1, 'x']])).toBe('﻿a;b\r\n1;x\r\n');
  });
});
