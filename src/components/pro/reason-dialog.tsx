'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Select } from '@/components/ui/primitives';

/** Confirmation with an optional internal reason (SAL-02, SAL-03). Never shown to the customer. */
export function ReasonDialog({
  title,
  reasons,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  reasons: Array<'nobody' | 'duplicate' | 'unavailable' | 'left' | 'mistake' | 'other'>;
  confirmLabel: string;
  onConfirm: (reason: string | null) => void;
  onClose: () => void;
}) {
  const t = useTranslations('pro.floor');
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState('');
  const id = useId();
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog ref={ref} onClose={onClose} onCancel={onClose} aria-labelledby={`${id}-t`} className="m-auto w-full max-w-md rounded-xl bg-surface p-0 text-fg backdrop:bg-black/50">
      <form
        method="dialog"
        className="space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(reason ? t(`reasons.${reason as 'other'}`) : null);
        }}
      >
        <h2 id={`${id}-t`} className="text-xl font-semibold">
          {title}
        </h2>
        <div className="space-y-1">
          <label htmlFor={id} className="font-medium">
            {t('reason')}
          </label>
          <Select id={id} value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">—</option>
            {reasons.map((r) => (
              <option key={r} value={r}>
                {t(`reasons.${r}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('keep')}
          </Button>
          <Button type="submit" variant="danger">
            {confirmLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
