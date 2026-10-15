// CSV export (vol. 02 HIS-01). Cells starting with = + - @ are neutralised to prevent formula
// injection in spreadsheets (vol. 05 §7).

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let text = typeof value === 'number' ? String(value) : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[";\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

/** Semicolon-separated (French spreadsheets), UTF-8 with BOM so that accents display correctly. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(';'), ...rows.map((r) => r.map(csvCell).join(';'))];
  return `﻿${lines.join('\r\n')}\r\n`;
}

/** 1250 → "12,50" (French decimal comma). */
export function centsToCsv(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)},${(abs % 100).toString().padStart(2, '0')}`;
}
