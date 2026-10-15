import 'server-only';
import { hash, verify } from '@node-rs/argon2';

// PIN hashing: Argon2id, at least 19 MiB memory and 2 iterations, unique salt (vol. 05 §4.2).
const OPTIONS = { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

// Used when the member does not exist or is locked, so that the response time does not reveal it.
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$AEVU+DBJa15IrftsAyYzRA$RIzV0TmAbnFGq4O51kGJgpeSbTa83nSqRnH/UKCMhzQ';

export async function hashPin(pin: string): Promise<string> {
  return hash(pin, OPTIONS);
}

export async function verifyPin(pinHash: string | null, pin: string): Promise<boolean> {
  try {
    return await verify(pinHash ?? DUMMY_HASH, pin);
  } catch {
    return false;
  }
}

/** Trivial PINs are refused: sequences and repetitions (EQP-01, vol. 05 §4.2). */
export function isWeakPin(pin: string): boolean {
  if (!/^\d{6}$/.test(pin)) return true;
  const digits = pin.split('').map(Number);
  const allSame = digits.every((d) => d === digits[0]);
  const ascending = digits.every((d, i) => i === 0 || d === (digits[i - 1]! + 1) % 10);
  const descending = digits.every((d, i) => i === 0 || d === (digits[i - 1]! + 9) % 10);
  // Repeated pairs or triples: 112233, 121212, 123123
  const pairs = /^(\d)\1(\d)\2(\d)\3$/.test(pin);
  const repeatedPair = /^(\d\d)\1\1$/.test(pin);
  const repeatedTriple = /^(\d{3})\1$/.test(pin);
  return allSame || ascending || descending || pairs || repeatedPair || repeatedTriple;
}

/** Random non-trivial PIN for the "generate" button. */
export function generatePin(): string {
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint32Array(1));
    const pin = (bytes[0]! % 1_000_000).toString().padStart(6, '0');
    if (!isWeakPin(pin)) return pin;
  }
}

// Lockout rules (AUTH-03): 5 failures → 15 min; 3 successive lockouts → until the owner unlocks;
// 20 failures in one hour on a device → device locked until the owner unlocks.
export const MEMBER_MAX_FAILURES = 5;
export const MEMBER_LOCK_MINUTES = 15;
export const MEMBER_MAX_LOCKS = 3;
export const DEVICE_MAX_FAILURES_PER_HOUR = 20;
export const STAFF_SESSION_HOURS = 14;
