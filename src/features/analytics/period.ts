import { addDaysIso } from '@/lib/dates';

// Dashboard periods (DSH-01), in business days of the shop. The comparison period is the
// period of the same length just before (for "month", the previous month).

export const PERIODS = ['today', 'yesterday', '7d', '30d', 'month', 'lastMonth', 'custom'] as const;
export type Period = (typeof PERIODS)[number];
export type Bucket = 'hour' | 'day' | 'week' | 'month';

export type Range = {
  period: Period;
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
  bucket: Bucket;
};

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

function previousMonthStart(iso: string): string {
  const [y, m] = iso.split('-').map(Number) as [number, number];
  return m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, '0')}-01`;
}

function bucketFor(from: string, to: string): Bucket {
  const days = daysBetween(from, to) + 1;
  if (days <= 2) return 'hour';
  if (days <= 62) return 'day';
  if (days <= 190) return 'week';
  return 'month';
}

function withPrevious(period: Period, from: string, to: string): Range {
  const length = daysBetween(from, to) + 1;
  return {
    period,
    from,
    to,
    prevFrom: addDaysIso(from, -length),
    prevTo: addDaysIso(from, -1),
    bucket: bucketFor(from, to),
  };
}

export function resolvePeriod(
  input: { period?: string | undefined; from?: string | undefined; to?: string | undefined },
  today: string,
): Range {
  const period = (PERIODS as readonly string[]).includes(input.period ?? '')
    ? (input.period as Period)
    : '7d';
  switch (period) {
    case 'today':
      return withPrevious(period, today, today);
    case 'yesterday': {
      const y = addDaysIso(today, -1);
      return withPrevious(period, y, y);
    }
    case '30d':
      return withPrevious(period, addDaysIso(today, -29), today);
    case 'month': {
      const from = monthStart(today);
      const prevFrom = previousMonthStart(today);
      return {
        period,
        from,
        to: today,
        prevFrom,
        prevTo: addDaysIso(from, -1),
        bucket: bucketFor(from, today),
      };
    }
    case 'lastMonth': {
      const from = previousMonthStart(today);
      const to = addDaysIso(monthStart(today), -1);
      const prevFrom = previousMonthStart(from);
      return {
        period,
        from,
        to,
        prevFrom,
        prevTo: addDaysIso(from, -1),
        bucket: bucketFor(from, to),
      };
    }
    case 'custom': {
      const from = input.from && ISO.test(input.from) ? input.from : addDaysIso(today, -6);
      let to = input.to && ISO.test(input.to) ? input.to : today;
      if (to < from) to = from;
      // At most one year, never in the future.
      if (to > today) to = today;
      const start = daysBetween(from, to) > 366 ? addDaysIso(to, -366) : from;
      return withPrevious(period, start <= to ? start : to, to);
    }
    default:
      return withPrevious('7d', addDaysIso(today, -6), today);
  }
}

/** Relative change in percent, null when the previous value is zero. */
export function changePercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
