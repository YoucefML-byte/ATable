import { describe, expect, it } from 'vitest';
import errorsFr from '../../messages/fr/errors.json';
import { ERROR_CODES, httpStatusFor, mapDbError, parseTransitionDetail } from './errors';

describe('errors', () => {
  it('maps P0001 business errors', () => {
    expect(mapDbError({ code: 'P0001', message: 'ORDERS_CLOSED' })).toEqual({
      code: 'ORDERS_CLOSED',
      detail: null,
    });
    expect(
      mapDbError({ code: 'P0001', message: 'PRODUCT_UNAVAILABLE', details: 'abc' }).detail,
    ).toBe('abc');
  });
  it('never leaks unknown errors', () => {
    expect(mapDbError({ code: 'XX000', message: 'relation does not exist' }).code).toBe('INTERNAL');
    expect(mapDbError({ code: 'P0001', message: 'SOMETHING_ELSE' }).code).toBe('INTERNAL');
    expect(mapDbError({ code: '22P02', message: 'invalid input syntax for type uuid' }).code).toBe(
      'BAD_REQUEST',
    );
  });
  it('gives an HTTP status for every code', () => {
    expect(httpStatusFor('RATE_LIMITED')).toBe(429);
    expect(httpStatusFor('INVALID_TABLE')).toBe(404);
  });
  it('has a French message for every code (no hard-coded text)', () => {
    const messages = errorsFr as Record<string, string>;
    for (const code of Object.keys(ERROR_CODES)) {
      expect(messages[code], code).toBeTypeOf('string');
    }
  });
  it('SAL-02 — parses "already handled by" details', () => {
    expect(parseTransitionDetail('accepted|Léa')).toEqual({ status: 'accepted', actor: 'Léa' });
    expect(parseTransitionDetail('ready|')).toEqual({ status: 'ready', actor: null });
  });
});
