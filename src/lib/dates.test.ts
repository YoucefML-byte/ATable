import { describe, expect, it } from 'vitest';
import { addDaysIso, businessDay, formatHourFr, formatTimer } from './dates';

const bistrot = { timezone: 'Europe/Paris', businessDayStart: '05:00' };

describe('businessDay (mirror of private.business_day)', () => {
  it('DSH-01 CA1 — 01:30 belongs to the previous business day', () => {
    expect(businessDay(new Date('2026-10-14T23:30:00Z'), bistrot)).toBe('2026-10-14'); // 01:30 Paris
  });
  it('05:00 starts the business day', () => {
    expect(businessDay(new Date('2026-10-15T03:00:00Z'), bistrot)).toBe('2026-10-15'); // 05:00 Paris
    expect(businessDay(new Date('2026-10-15T02:59:00Z'), bistrot)).toBe('2026-10-14');
  });
  it('handles a custom start (Lounge, 06:00) and winter time', () => {
    expect(
      businessDay(new Date('2026-12-15T04:30:00Z'), {
        timezone: 'Europe/Paris',
        businessDayStart: '06:00',
      }),
    ).toBe('2026-12-14');
  });
});

describe('formatting', () => {
  it('formats the next opening time', () => {
    expect(formatHourFr('2026-10-15T16:30:00Z', 'Europe/Paris')).toBe('18 h 30');
    expect(formatHourFr('2026-10-15T10:00:00Z', 'Europe/Paris')).toBe('12 h');
  });
  it('formats kitchen timers', () => {
    expect(formatTimer(462_000)).toBe('07:42');
    expect(formatTimer(-5)).toBe('00:00');
  });
  it('adds days to ISO dates', () => {
    expect(addDaysIso('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysIso('2026-03-01', -1)).toBe('2026-02-28');
  });
});
