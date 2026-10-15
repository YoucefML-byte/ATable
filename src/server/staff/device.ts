import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/server/supabase/admin';
import { env } from '@/server/env';

// Enrolled device: a random 256-bit secret in a protected cookie; only its SHA-256 is stored
// (vol. 02 AUTH-02, vol. 05 §4.2).
export const DEVICE_COOKIE = 'atable_device';

export function deviceCookieOptions() {
  return {
    httpOnly: true,
    secure: env.PUBLIC_SCHEME === 'https',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 400 * 24 * 60 * 60,
  };
}

export function newDeviceSecret(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export type CurrentDevice = {
  id: string;
  shop_id: string;
  name: string;
  locked: boolean;
  failed_attempts: number;
  failed_attempts_window_start: string | null;
};

/** The enrolled device of this browser, or null (unknown, revoked or no cookie). */
export async function getCurrentDevice(): Promise<CurrentDevice | null> {
  const secret = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!secret || !/^[A-Za-z0-9_-]{43}$/.test(secret)) return null;
  const { data } = await createAdminClient()
    .from('devices')
    .select('id, shop_id, name, locked, failed_attempts, failed_attempts_window_start')
    .eq('secret_hash', hashSecret(secret))
    .is('revoked_at', null)
    .maybeSingle();
  return data;
}

export type StaffTile = { id: string; display_name: string; color: string; locked: boolean };

/** Active employees of the device's shop, for the login grid (names and colours only). */
export async function listStaffForDevice(shopId: string): Promise<StaffTile[]> {
  const { data } = await createAdminClient()
    .from('shop_members')
    .select('id, display_name, color, pin_hard_locked, pin_locked_until')
    .eq('shop_id', shopId)
    .eq('role', 'staff')
    .eq('is_active', true)
    .order('display_name');
  const now = Date.now();
  return (data ?? []).map((m) => ({
    id: m.id,
    display_name: m.display_name,
    color: m.color,
    locked: m.pin_hard_locked || (!!m.pin_locked_until && new Date(m.pin_locked_until).getTime() > now),
  }));
}
