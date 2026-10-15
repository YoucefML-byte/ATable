import { describe, expect, it } from 'vitest';
import { changePercent, resolvePeriod } from './period';

describe('dashboard periods (DSH-01)', () => {
  const today = '2026-10-15';
  it('today compares with yesterday, by hour', () => {
    expect(resolvePeriod({ period: 'today' }, today)).toMatchObject({
      from: today,
      to: today,
      prevFrom: '2026-10-14',
      prevTo: '2026-10-14',
      bucket: 'hour',
    });
  });
  it('7 days compares with the 7 days before', () => {
    expect(resolvePeriod({ period: '7d' }, today)).toMatchObject({
      from: '2026-10-09',
      to: today,
      prevFrom: '2026-10-02',
      prevTo: '2026-10-08',
      bucket: 'day',
    });
  });
  it('the current month compares with the whole previous month', () => {
    expect(resolvePeriod({ period: 'month' }, today)).toMatchObject({
      from: '2026-10-01',
      to: today,
      prevFrom: '2026-09-01',
      prevTo: '2026-09-30',
    });
  });
  it('last month across a year boundary', () => {
    expect(resolvePeriod({ period: 'lastMonth' }, '2027-01-10')).toMatchObject({
      from: '2026-12-01',
      to: '2026-12-31',
      prevFrom: '2026-11-01',
      prevTo: '2026-11-30',
    });
  });
  it('custom range is clamped: no future, at most a year, from <= to', () => {
    expect(
      resolvePeriod({ period: 'custom', from: '2026-10-10', to: '2027-01-01' }, today),
    ).toMatchObject({ from: '2026-10-10', to: today });
    expect(resolvePeriod({ period: 'custom', from: '2020-01-01', to: today }, today).from).toBe(
      '2025-10-14',
    );
    expect(
      resolvePeriod({ period: 'custom', from: 'nope', to: '2026-10-01' }, today),
    ).toMatchObject({ from: '2026-10-09', to: '2026-10-09' });
  });
  it('unknown period falls back to 7 days', () => {
    expect(resolvePeriod({ period: 'drop table' }, today).period).toBe('7d');
  });
  it('relative change', () => {
    expect(changePercent(120, 100)).toBe(20);
    expect(changePercent(50, 0)).toBeNull();
  });
});
