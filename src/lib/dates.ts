// Dates are stored in UTC and shown in the shop's time zone, never the browser's (vol. 06 §6).
import { TZDate } from '@date-fns/tz';
import { format, subMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';

/** Mirror of private.business_day(): business day of an instant for a shop (tested against the DB). */
export function businessDay(
  at: Date,
  shop: { timezone: string; businessDayStart: string },
): string {
  const [h = '5', m = '0'] = shop.businessDayStart.split(':');
  const local = new TZDate(at.getTime(), shop.timezone);
  const shifted = subMinutes(local, Number(h) * 60 + Number(m));
  return format(shifted, 'yyyy-MM-dd');
}

export function formatTime(at: Date | string, timezone: string): string {
  return format(new TZDate(new Date(at).getTime(), timezone), 'HH:mm', { locale: fr });
}

export function formatDateTime(at: Date | string, timezone: string): string {
  return format(new TZDate(new Date(at).getTime(), timezone), "d MMM yyyy 'à' HH:mm", {
    locale: fr,
  });
}

export function formatDate(at: Date | string, timezone: string): string {
  return format(new TZDate(new Date(at).getTime(), timezone), 'EEEE d MMMM', { locale: fr });
}

/** "18 h 30" style used for the next opening time (vol. 02 CLI-02). */
export function formatHourFr(at: Date | string, timezone: string): string {
  const d = new TZDate(new Date(at).getTime(), timezone);
  const minutes = d.getMinutes();
  return minutes === 0
    ? `${d.getHours()} h`
    : `${d.getHours()} h ${minutes.toString().padStart(2, '0')}`;
}

/** Today's business day, as an ISO date. */
export function todayBusinessDay(shop: { timezone: string; businessDayStart: string }): string {
  return businessDay(new Date(), shop);
}

/** Adds days to an ISO date (yyyy-MM-dd), in UTC to avoid DST effects on pure dates. */
export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Minutes and seconds "07:42" from milliseconds. */
export function formatTimer(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
