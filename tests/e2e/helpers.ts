import { createHmac } from 'node:crypto';
import { expect, type Page } from '@playwright/test';

export const BISTROT = 'http://bistrot.localhost:3000';
export const LOUNGE = 'http://lounge.localhost:3000';
export const PRO = 'http://pro.localhost:3000';
export const CONSOLE = 'http://console.localhost:3000';
export const MAILPIT = 'http://127.0.0.1:54324';

// Demo accounts of supabase/seed.sql (local only).
export const KARIM = {
  email: 'karim@bistrot.test',
  password: 'Bistrot-Demo-2026!',
  totp: 'KRSXG5CTMVRXEZLU',
};
export const SAMIA = {
  email: 'samia@lounge.test',
  password: 'Lounge-Demo-2026!',
  totp: 'GEZDGNBVGY3TQOJQ',
};
export const ADMIN = {
  email: 'admin@atable.test',
  password: 'Console-Demo-2026!',
  totp: 'JBSWY3DPEHPK3PXP',
};

function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of input.replace(/=+$/, '').toUpperCase())
    bits += alphabet.indexOf(c).toString(2).padStart(5, '0');
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** RFC 6238 TOTP (SHA-1, 6 digits, 30 s). */
export function totp(secret: string, at = Date.now()): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at / 1000 / 30)));
  const hmac = createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return code.toString().padStart(6, '0');
}

export async function ownerLogin(
  page: Page,
  account: { email: string; password: string; totp: string },
  host = PRO,
) {
  await page.goto(`${host}/connexion`);
  await page.getByLabel('E-mail').fill(account.email);
  await page.getByLabel('Mot de passe').fill(account.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/2fa$/);
  await page.getByLabel('Code à 6 chiffres').fill(totp(account.totp));
  await page.getByRole('button', { name: 'Valider' }).click();
  await expect(page).not.toHaveURL(/\/2fa$/);
}

export async function scanTable(page: Page, token: string, host = BISTROT) {
  await page.goto(`${host}/t/${token}`);
  await expect(page).toHaveURL(/\/carte$/);
}
