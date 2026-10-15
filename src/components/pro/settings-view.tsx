'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { saveShopSettingsAction } from '@/features/shops/actions';
import type { ShopSettingsInput } from '@/features/shops/schemas';
import { Alert, Button, Card, Field, Input, Textarea } from '@/components/ui/primitives';
import { centsToInput, parsePriceInput } from '@/lib/money';

type Key = Exclude<keyof ShopSettingsInput, 'shopId'>;
type Kind = 'text' | 'textarea' | 'bool' | 'int' | 'time' | 'money';

const SECTIONS: Array<{
  title: 'storefront' | 'orders' | 'floorKitchen' | 'antiAbuse' | 'legal';
  fields: Array<[Key, Kind, number?]>;
}> = [
  {
    title: 'storefront',
    fields: [
      ['name', 'text', 80],
      ['welcome_message', 'textarea', 500],
      ['opening_hours_text', 'textarea', 500],
      ['address_text', 'textarea', 300],
      ['phone', 'text', 30],
    ],
  },
  {
    title: 'orders',
    fields: [
      ['accepting_orders', 'bool'],
      ['public_menu_enabled', 'bool'],
      ['order_note_enabled', 'bool'],
      ['sold_out_label', 'text', 40],
      ['price_notice', 'text', 120],
      ['business_day_start', 'time'],
    ],
  },
  {
    title: 'floorKitchen',
    fields: [
      ['kitchen_warning_minutes', 'int'],
      ['kitchen_critical_minutes', 'int'],
      ['floor_alert_repeat_seconds', 'int'],
      ['staff_idle_lock_minutes', 'int'],
    ],
  },
  {
    title: 'antiAbuse',
    fields: [
      ['max_orders_per_client_10min', 'int'],
      ['max_pending_orders_per_table', 'int'],
      ['max_lines_per_order', 'int'],
      ['max_quantity_per_line', 'int'],
      ['max_order_total_cents', 'money'],
    ],
  },
  {
    title: 'legal',
    fields: [
      ['legal_name', 'text', 120],
      ['legal_form', 'text', 60],
      ['legal_siret', 'text', 14],
      ['legal_address', 'textarea', 300],
      ['legal_publication_director', 'text', 120],
    ],
  },
];

const HELP: Partial<Record<Key, true>> = {
  business_day_start: true,
  max_orders_per_client_10min: true,
  max_pending_orders_per_table: true,
  public_menu_enabled: true,
};

/** Shop settings (REG-01), grouped as in vol. 07 §5.10. */
export function SettingsView({
  shopSlug,
  initial,
}: {
  shopSlug: string;
  initial: ShopSettingsInput;
}) {
  const t = useTranslations('pro.settings');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [money, setMoney] = useState(centsToInput(initial.max_order_total_cents));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  const set = <K extends Key>(key: K, value: ShopSettingsInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  return (
    <form
      className="space-y-4 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const cents = parsePriceInput(money);
        if (cents === null) {
          setFieldErrors({ max_order_total_cents: tc('required') });
          return;
        }
        setPending(true);
        setMessage(null);
        const res = await saveShopSettingsAction(shopSlug, {
          ...values,
          max_order_total_cents: cents,
        });
        setPending(false);
        if (!res.ok) {
          setFieldErrors(res.fields ?? {});
          setMessage({
            tone: 'danger',
            text:
              res.fields?.kitchen_critical_minutes === 'kitchenThresholds'
                ? t('kitchenThresholds')
                : res.fields
                  ? t('invalid')
                  : te(res.code),
          });
          return;
        }
        setFieldErrors({});
        setMessage({ tone: 'success', text: tc('saved') });
        router.refresh();
      }}
    >
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      {SECTIONS.map((section) => (
        <Card key={section.title} className="space-y-3">
          <h2 className="text-lg font-semibold">{t(section.title)}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {section.fields.map(([key, kind, max]) => {
              const id = `s-${key}`;
              const label = t(`fields.${key}`);
              const help = HELP[key] ? t(`help.${key as 'business_day_start'}`) : undefined;
              const error = fieldErrors[key]
                ? fieldErrors[key] === 'kitchenThresholds'
                  ? t('kitchenThresholds')
                  : t('invalid')
                : null;
              if (kind === 'bool') {
                return (
                  <div key={key} className="md:col-span-2">
                    <label className="flex min-h-12 items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-5 w-5"
                        checked={values[key] as boolean}
                        onChange={(e) => set(key, e.target.checked as never)}
                      />
                      <span className="font-medium">{label}</span>
                    </label>
                    {help && <p className="text-muted ml-8 text-sm">{help}</p>}
                  </div>
                );
              }
              return (
                <div key={key} className={kind === 'textarea' ? 'md:col-span-2' : undefined}>
                  <Field label={label} htmlFor={id} {...(help ? { help } : {})} error={error}>
                    {kind === 'textarea' ? (
                      <Textarea
                        id={id}
                        rows={3}
                        maxLength={max}
                        value={values[key] as string}
                        onChange={(e) => set(key, e.target.value as never)}
                      />
                    ) : kind === 'money' ? (
                      <Input
                        id={id}
                        inputMode="decimal"
                        value={money}
                        onChange={(e) => setMoney(e.target.value)}
                      />
                    ) : kind === 'int' ? (
                      <Input
                        id={id}
                        type="number"
                        value={values[key] as number}
                        onChange={(e) => set(key, Number(e.target.value) as never)}
                      />
                    ) : kind === 'time' ? (
                      <Input
                        id={id}
                        type="time"
                        value={values[key] as string}
                        onChange={(e) => set(key, e.target.value as never)}
                        className="w-36"
                      />
                    ) : (
                      <Input
                        id={id}
                        maxLength={max}
                        value={values[key] as string}
                        inputMode={
                          key === 'legal_siret' ? 'numeric' : key === 'phone' ? 'tel' : undefined
                        }
                        onChange={(e) => set(key, e.target.value as never)}
                      />
                    )}
                  </Field>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <div className="sticky bottom-20 lg:bottom-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? tc('saving') : tc('save')}
        </Button>
      </div>
    </form>
  );
}
