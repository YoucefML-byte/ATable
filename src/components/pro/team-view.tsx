'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { closeMemberSessionsAction, createMemberAction, resetPinAction, unlockMemberAction, updateMemberAction } from '@/features/staff/actions';
import { readableOn } from '@/features/theming/color';
import { Alert, Button, Card, Field, Input } from '@/components/ui/primitives';

type Perm = 'floor' | 'kitchen' | 'stock';
export type MemberRow = {
  id: string;
  role: 'owner' | 'staff';
  display_name: string;
  color: string;
  permissions: Perm[];
  is_active: boolean;
  locked: boolean;
  sessions: number;
  isYou: boolean;
};

const COLORS = ['#0E7490', '#B45309', '#6D28D9', '#BE123C', '#15803D', '#1D4ED8', '#A16207', '#475569'];

function PermissionBoxes({ value, onChange, name }: { value: Perm[]; onChange: (v: Perm[]) => void; name: string }) {
  const tp = useTranslations('common.permissions');
  return (
    <fieldset className="flex flex-wrap gap-3">
      {(['floor', 'kitchen', 'stock'] as Perm[]).map((p) => (
        <label key={p} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3">
          <input
            type="checkbox"
            name={name}
            className="h-5 w-5"
            checked={value.includes(p)}
            onChange={(e) => onChange(e.target.checked ? [...value, p] : value.filter((x) => x !== p))}
          />
          {tp(p)}
        </label>
      ))}
    </fieldset>
  );
}

/** Team (EQP-01): create, edit permissions, deactivate, reset PIN, unlock, close sessions. */
export function TeamView({ shopSlug, members }: { shopSlug: string; members: MemberRow[] }) {
  const t = useTranslations('pro.team');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ tone: 'success' | 'danger' | 'warning'; text: string } | null>(null);
  const [form, setForm] = useState({ name: '', color: COLORS[0]!, permissions: ['floor', 'stock'] as Perm[], pin: '', pinConfirm: '', generate: true });
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ name: string; color: string; permissions: Perm[] }>({ name: '', color: '', permissions: [] });
  const ids = { name: useId(), pin: useId(), pin2: useId() };

  const run = (fn: () => Promise<{ ok: boolean; code?: string; text?: string }>) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) setMessage({ tone: 'danger', text: te((res.code ?? 'INTERNAL') as 'INTERNAL') });
      else if (res.text) setMessage({ tone: 'warning', text: res.text });
      router.refresh();
    });

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t('newMember')}</h2>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.generate && form.pin !== form.pinConfirm) return setMessage({ tone: 'danger', text: t('pinMismatch') });
            run(async () => {
              const res = await createMemberAction({ shopSlug, displayName: form.name, color: form.color, permissions: form.permissions, pin: form.generate ? null : form.pin });
              if (!res.ok) return { ok: false, code: res.code };
              setForm((f) => ({ ...f, name: '', pin: '', pinConfirm: '' }));
              return { ok: true, ...(res.value.generatedPin ? { text: t('generated', { pin: res.value.generatedPin }) } : {}) };
            });
          }}
        >
          <Field label={t('firstName')} htmlFor={ids.name}>
            <Input id={ids.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={40} required />
          </Field>
          <div>
            <p className="font-medium">{t('color')}</p>
            <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label={t('color')}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={form.color === c}
                  aria-label={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-11 w-11 rounded-full border-4 ${form.color === c ? 'border-fg' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium">{t('permissions')}</p>
            <PermissionBoxes value={form.permissions} onChange={(permissions) => setForm({ ...form, permissions })} name="new-perms" />
          </div>
          <label className="inline-flex min-h-11 items-center gap-2">
            <input type="checkbox" className="h-5 w-5" checked={form.generate} onChange={(e) => setForm({ ...form, generate: e.target.checked })} />
            {t('generate')}
          </label>
          {!form.generate && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('pin')} htmlFor={ids.pin}>
                <Input id={ids.pin} inputMode="numeric" pattern="\d{6}" maxLength={6} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value })} autoComplete="off" required />
              </Field>
              <Field label={t('pinConfirm')} htmlFor={ids.pin2}>
                <Input id={ids.pin2} inputMode="numeric" pattern="\d{6}" maxLength={6} value={form.pinConfirm} onChange={(e) => setForm({ ...form, pinConfirm: e.target.value })} autoComplete="off" required />
              </Field>
            </div>
          )}
          <Button type="submit" disabled={pending}>
            {tc('create')}
          </Button>
        </form>
      </Card>
      <p className="text-sm text-muted">{t('staffProfileHelp')}</p>

      <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
        {members.map((m) => (
          <li key={m.id} className="space-y-3 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full font-bold" style={{ backgroundColor: m.color, color: readableOn(m.color) }} aria-hidden>
                {m.display_name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {m.display_name} {m.isYou && <span className="text-sm text-muted">({t('you')})</span>}
                </p>
                <p className="text-sm text-muted">
                  {m.role === 'owner' ? t('owner') : m.permissions.map((p) => tc(`permissions.${p}`)).join(' · ')}
                  {!m.is_active && ` · ${t('inactive')}`}
                  {m.locked && ` · ${t('locked')}`}
                  {m.role === 'staff' && ` · ${m.sessions > 0 ? `${t('sessions')} : ${m.sessions}` : t('noSession')}`}
                </p>
              </div>
              {m.role === 'staff' && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => {
                    setEditing(editing === m.id ? null : m.id);
                    setEdit({ name: m.display_name, color: m.color, permissions: m.permissions });
                  }}>
                    {tc('edit')}
                  </Button>
                  {m.locked && (
                    <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(async () => unlockMemberAction(shopSlug, m.id))}>
                      {t('unlock')}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(async () => {
                        const res = await resetPinAction({ shopSlug, memberId: m.id, pin: null });
                        if (!res.ok) return { ok: false, code: res.code };
                        return { ok: true, text: t('generated', { pin: res.value.generatedPin ?? '' }) };
                      })
                    }
                  >
                    {t('resetPin')}
                  </Button>
                  {m.sessions > 0 && (
                    <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(async () => closeMemberSessionsAction(shopSlug, m.id))}>
                      {t('closeSessions')}
                    </Button>
                  )}
                  <Button
                    variant={m.is_active ? 'danger' : 'secondary'}
                    size="sm"
                    disabled={pending}
                    onClick={() => run(async () => updateMemberAction({ shopSlug, memberId: m.id, displayName: m.display_name, color: m.color, permissions: m.permissions, isActive: !m.is_active }))}
                  >
                    {m.is_active ? t('deactivate') : t('reactivate')}
                  </Button>
                </div>
              )}
            </div>
            {editing === m.id && (
              <form
                className="space-y-3 rounded-lg bg-brand-soft p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditing(null);
                  run(async () => updateMemberAction({ shopSlug, memberId: m.id, displayName: edit.name, color: edit.color, permissions: edit.permissions, isActive: m.is_active }));
                }}
              >
                <Input aria-label={t('firstName')} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} maxLength={40} required />
                <PermissionBoxes value={edit.permissions} onChange={(permissions) => setEdit({ ...edit, permissions })} name={`perms-${m.id}`} />
                <Button type="submit" size="sm">
                  {tc('save')}
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
