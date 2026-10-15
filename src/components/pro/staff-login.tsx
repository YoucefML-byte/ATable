'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Delete, Lock } from 'lucide-react';
import type { StaffTile } from '@/server/staff/device';
import { cn } from '@/lib/cn';
import { readableOn } from '@/features/theming/color';

/** Staff login grid + numeric keypad (AUTH-03, vol. 07 §5.2). The PIN is checked at the 6th digit. */
export function StaffLogin({ shopName, deviceName, staff, preselect }: { shopName: string; deviceName: string; staff: StaffTile[]; preselect?: string }) {
  const t = useTranslations('pro.staffLogin');
  const te = useTranslations('errors');
  const router = useRouter();
  const [selected, setSelected] = useState<StaffTile | null>(() => staff.find((s) => s.id === preselect) ?? null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(
    async (value: string) => {
      if (!selected) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch('/api/staff/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: selected.id, pin: value }),
        });
        const body = (await res.json().catch(() => null)) as { ok: boolean; code?: string; redirect?: string } | null;
        if (body?.ok && body.redirect) {
          router.replace(body.redirect);
          router.refresh();
          return;
        }
        const code = body?.code ?? 'INTERNAL';
        setError(code === 'BAD_PIN' ? t('badPin') : code === 'MEMBER_LOCKED' ? t('locked') : code === 'DEVICE_LOCKED' ? t('deviceLocked') : te(code as 'INTERNAL'));
        setShake(true);
        setTimeout(() => setShake(false), 400);
        setPin('');
      } catch {
        setError(te('INTERNAL'));
        setPin('');
      } finally {
        setBusy(false);
      }
    },
    [selected, router, t, te],
  );

  const press = useCallback(
    (digit: string) => {
      if (busy) return;
      setPin((current) => {
        if (current.length >= 6) return current;
        const next = current + digit;
        if (next.length === 6) void submit(next);
        return next;
      });
    },
    [busy, submit],
  );

  useEffect(() => {
    if (!selected) return;
    // Physical keyboard support.
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') setPin((p) => p.slice(0, -1));
      else if (e.key === 'Escape') {
        setSelected(null);
        setPin('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, press]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 p-6">
      <p className="text-sm text-muted">
        {shopName} · {deviceName}
      </p>
      {!selected ? (
        <>
          <h1 className="text-3xl font-semibold">{t('title')}</h1>
          {staff.length === 0 && <p className="text-muted">{t('noStaff')}</p>}
          <ul className="grid grid-cols-3 gap-4 sm:grid-cols-4">
            {staff.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(m);
                    setError(null);
                  }}
                  className="flex w-full flex-col items-center gap-2 rounded-xl p-3 hover:bg-brand-soft"
                >
                  <span className="relative flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold" style={{ backgroundColor: m.color, color: readableOn(m.color) }}>
                    {m.display_name.slice(0, 2).toUpperCase()}
                    {m.locked && <Lock aria-hidden className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full bg-surface p-1 text-fg" />}
                  </span>
                  <span className="text-lg font-medium">{m.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-5">
          <h1 className="text-center text-2xl font-semibold">{t('pin', { name: selected.display_name })}</h1>
          <div className={cn('flex gap-3', shake && 'animate-pulse')} aria-live="polite" aria-label={`${pin.length}/6`}>
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className={cn('h-5 w-5 rounded-full border-2 border-fg', i < pin.length && 'bg-fg')} />
            ))}
          </div>
          {error && (
            <p role="alert" className="text-center font-medium text-st-danger">
              {error}
            </p>
          )}
          <div className="grid w-full grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button key={d} type="button" disabled={busy} onClick={() => press(d)} className="h-[72px] rounded-xl border border-line bg-surface text-3xl font-semibold hover:bg-brand-soft">
                {d}
              </button>
            ))}
            <button type="button" onClick={() => setPin((p) => p.slice(0, -1))} aria-label={t('erase')} className="flex h-[72px] items-center justify-center rounded-xl border border-line bg-surface hover:bg-brand-soft">
              <Delete aria-hidden className="h-7 w-7" />
            </button>
            <button type="button" disabled={busy} onClick={() => press('0')} className="h-[72px] rounded-xl border border-line bg-surface text-3xl font-semibold hover:bg-brand-soft">
              0
            </button>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setPin('');
                setError(null);
              }}
              className="h-[72px] rounded-xl text-sm font-medium hover:bg-brand-soft"
            >
              {t('back')}
            </button>
          </div>
        </div>
      )}
      <Link href="/connexion" className="mt-auto text-sm underline">
        {t('ownerLink')}
      </Link>
    </main>
  );
}
