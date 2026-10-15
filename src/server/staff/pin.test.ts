import { describe, expect, it } from 'vitest';
import { generatePin, hashPin, isWeakPin, verifyPin } from './pin';

describe('PIN rules (EQP-01)', () => {
  it.each([
    '123456',
    '000000',
    '111111',
    '654321',
    '112233',
    '121212',
    '123123',
    '890123',
    '12345',
    'abcdef',
  ])('refuses the trivial PIN %s', (pin) => {
    expect(isWeakPin(pin)).toBe(true);
  });
  it.each(['241608', '739215', '518374'])('accepts %s', (pin) => {
    expect(isWeakPin(pin)).toBe(false);
  });
  it('generates non-trivial PINs', () => {
    for (let i = 0; i < 50; i++) expect(isWeakPin(generatePin())).toBe(false);
  });
  it('AUTH-03 CA4 — the PIN is hashed with Argon2id and never stored in clear', async () => {
    const h = await hashPin('241608');
    expect(h.startsWith('$argon2id$')).toBe(true);
    expect(h).not.toContain('241608');
    expect(await verifyPin(h, '241608')).toBe(true);
    expect(await verifyPin(h, '241609')).toBe(false);
    expect(await verifyPin(null, '241608')).toBe(false);
  });
});
