'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ALLERGEN_CODES, type AllergenCode } from '@/features/catalog/menu-schema';
import type { AdminAllergen } from '@/features/catalog/admin-queries';
import { setAllergensAction } from '@/features/catalog/actions';
import { Alert, Button } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/dates';
import { cn } from '@/lib/cn';

type State = 'no' | 'contains' | 'may_contain';

/**
 * The 14 regulated allergens with three states (CAT-03). "Aucun" is an explicit declaration:
 * a product never declared stays flagged in the dashboard alerts.
 */
export function AllergenGrid({
  shopSlug,
  kind,
  id,
  declaredAt,
  initial,
  timezone,
  onSaved,
}: {
  shopSlug: string;
  kind: 'product' | 'option';
  id: string;
  declaredAt: string | null;
  initial: AdminAllergen[];
  timezone: string;
  onSaved: () => void;
}) {
  const t = useTranslations('pro.catalog.allergens');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const [values, setValues] = useState<Record<AllergenCode, State>>(() => {
    const map = Object.fromEntries(ALLERGEN_CODES.map((c) => [c, 'no'])) as Record<
      AllergenCode,
      State
    >;
    for (const a of initial) map[a.code] = a.presence;
    return map;
  });
  const [none, setNone] = useState(declaredAt !== null && initial.length === 0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set(code: AllergenCode, state: State) {
    setValues((v) => ({ ...v, [code]: state }));
    if (state !== 'no') setNone(false);
    setSaved(false);
  }

  async function save() {
    setPending(true);
    setError(null);
    const allergens = none
      ? []
      : ALLERGEN_CODES.filter((c) => values[c] !== 'no').map((c) => ({
          code: c,
          presence: values[c] as 'contains' | 'may_contain',
        }));
    const res = await setAllergensAction({ shopSlug, kind, id, none, allergens });
    setPending(false);
    if (!res.ok) {
      setError(te(res.code));
      return;
    }
    setSaved(true);
    onSaved();
  }

  const states: Array<{ value: State; label: string }> = [
    { value: 'no', label: t('no') },
    { value: 'contains', label: t('contains') },
    { value: 'may_contain', label: t('traces') },
  ];

  return (
    <fieldset className="space-y-3">
      <legend className="font-semibold">{t('title')}</legend>
      <p className="text-muted text-sm">
        {declaredAt ? t('declaredAt', { date: formatDateTime(declaredAt, timezone) }) : t('never')}
      </p>
      <label className="border-line flex min-h-12 items-center gap-3 rounded-lg border px-3">
        <input
          type="checkbox"
          className="h-5 w-5"
          checked={none}
          onChange={(e) => {
            setNone(e.target.checked);
            setSaved(false);
            if (e.target.checked)
              setValues(
                Object.fromEntries(ALLERGEN_CODES.map((c) => [c, 'no'])) as Record<
                  AllergenCode,
                  State
                >,
              );
          }}
        />
        <span className="font-medium">{t('none')}</span>
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {ALLERGEN_CODES.map((code) => (
          <div
            key={code}
            role="radiogroup"
            aria-label={tc(`allergens.${code}`)}
            className="border-line rounded-lg border p-2"
          >
            <p className="mb-1 text-sm font-medium">{tc(`allergens.${code}`)}</p>
            <div className="flex gap-1">
              {states.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  role="radio"
                  aria-checked={values[code] === s.value}
                  onClick={() => set(code, s.value)}
                  className={cn(
                    'min-h-10 flex-1 rounded-md border text-sm',
                    values[code] === s.value
                      ? s.value === 'contains'
                        ? 'border-st-danger bg-st-danger-soft font-semibold'
                        : s.value === 'may_contain'
                          ? 'border-st-warning bg-st-warning-soft font-semibold'
                          : 'border-fg bg-brand-soft font-semibold'
                      : 'border-line',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
      {saved && <Alert tone="success">{tc('saved')}</Alert>}
      <Button variant="secondary" onClick={save} disabled={pending}>
        {pending ? tc('saving') : t('save')}
      </Button>
    </fieldset>
  );
}
