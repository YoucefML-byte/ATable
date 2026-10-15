'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  enrollDeviceAction,
  revokeDeviceAction,
  unlockDeviceAction,
} from '@/features/staff/actions';
import { Alert, Button, Card, Field, Input } from '@/components/ui/primitives';

export type DeviceRow = {
  id: string;
  name: string;
  enrolled_at: string;
  enrolledLabel: string;
  lastSeenLabel: string | null;
  locked: boolean;
  revoked: boolean;
};

/** Devices (AUTH-02): enrol this device, list, revoke (immediate), unlock. */
export function DevicesView({
  shopSlug,
  devices,
  currentDeviceId,
}: {
  shopSlug: string;
  devices: DeviceRow[];
  currentDeviceId: string | null;
}) {
  const t = useTranslations('pro.devices');
  const te = useTranslations('errors');
  const router = useRouter();
  const [name, setName] = useState('');
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const id = useId();

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted">{t('intro')}</p>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      {currentDeviceId ? (
        <Alert tone="success">{t('enrolled')}</Alert>
      ) : (
        <Card>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const res = await enrollDeviceAction(shopSlug, name);
                if (!res.ok) return setMessage({ tone: 'danger', text: te(res.code) });
                setMessage({ tone: 'success', text: t('enrolled') });
                setName('');
                router.refresh();
              });
            }}
          >
            <div className="min-w-60 flex-1">
              <Field label={t('name')} htmlFor={id}>
                <Input
                  id={id}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  placeholder={t('namePlaceholder')}
                  required
                />
              </Field>
            </div>
            <Button type="submit" disabled={pending || name.trim().length === 0}>
              {t('enrollThis')}
            </Button>
          </form>
        </Card>
      )}
      {devices.length === 0 ? (
        <p className="text-muted">{t('none')}</p>
      ) : (
        <ul className="divide-line border-line bg-surface divide-y rounded-xl border">
          {devices.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {d.name}
                  {d.id === currentDeviceId && (
                    <span className="bg-brand-soft ml-2 rounded px-2 py-0.5 text-xs">
                      {t('thisDevice')}
                    </span>
                  )}
                </p>
                <p className="text-muted text-sm">
                  {t('enrolledAt', { date: d.enrolledLabel })} ·{' '}
                  {t('lastSeen', { date: d.lastSeenLabel ?? t('never') })}
                </p>
                {d.revoked && <p className="text-st-danger text-sm font-medium">{t('revoked')}</p>}
                {d.locked && !d.revoked && (
                  <p className="text-st-warning text-sm font-medium">{t('locked')}</p>
                )}
              </div>
              {!d.revoked && d.locked && (
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await unlockDeviceAction(shopSlug, d.id);
                      if (!res.ok) setMessage({ tone: 'danger', text: te(res.code) });
                      router.refresh();
                    })
                  }
                >
                  {t('unlock')}
                </Button>
              )}
              {!d.revoked &&
                (confirm === d.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm">{t('revokeConfirm', { name: d.name })}</span>
                    <Button variant="secondary" size="sm" onClick={() => setConfirm(null)}>
                      ✕
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        start(async () => {
                          setConfirm(null);
                          const res = await revokeDeviceAction(shopSlug, d.id);
                          if (!res.ok) setMessage({ tone: 'danger', text: te(res.code) });
                          router.refresh();
                        })
                      }
                    >
                      {t('revoke')}
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" onClick={() => setConfirm(d.id)}>
                    {t('revoke')}
                  </Button>
                ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
