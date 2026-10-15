'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createShopAction } from '@/features/console/actions';
import { BUSINESS_TYPES } from '@/features/console/constants';
import { Alert, Button, Card, Field, Input, Select } from '@/components/ui/primitives';

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

/** Shop creation with owner invitation (CON-02). */
export function CreateShopForm({ rootDomain }: { rootDomain: string }) {
  const t = useTranslations('console.create');
  const tb = useTranslations('console.businessType');
  const te = useTranslations('errors');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [type, setType] = useState<(typeof BUSINESS_TYPES)[number]>('restaurant');
  const [timezone, setTimezone] = useState('Europe/Paris');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="max-w-2xl">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          const res = await createShopAction({
            name,
            slug,
            businessType: type,
            timezone,
            ownerEmail,
            ownerName,
          });
          setPending(false);
          if (!res.ok) {
            setError(te(res.code));
            return;
          }
          window.location.assign(`/commerces/${res.value.shopId}?cree=${res.value.owner}`);
        }}
      >
        <p className="text-muted">{t('intro')}</p>
        <Field label={t('name')} htmlFor="c-name">
          <Input
            id="c-name"
            value={name}
            maxLength={80}
            required
            onChange={(e) => {
              setName(e.target.value);
              if (!slugEdited) setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <Field
          label={t('slug')}
          htmlFor="c-slug"
          help={t('slugHelp', { host: `${slug || '…'}.${rootDomain}` })}
        >
          <Input
            id="c-slug"
            value={slug}
            required
            pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]"
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(e.target.value.toLowerCase());
            }}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('type')} htmlFor="c-type">
            <Select
              id="c-type"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              {BUSINESS_TYPES.map((b) => (
                <option key={b} value={b}>
                  {tb(b)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('timezone')} htmlFor="c-tz">
            <Select id="c-tz" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {[
                'Europe/Paris',
                'Europe/Brussels',
                'Europe/Zurich',
                'Europe/Luxembourg',
                'America/Martinique',
                'America/Guadeloupe',
                'Indian/Reunion',
                'America/Cayenne',
                'Indian/Mayotte',
                'Pacific/Noumea',
                'Pacific/Tahiti',
                'Africa/Algiers',
                'Africa/Casablanca',
                'Africa/Tunis',
              ].map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('ownerEmail')} htmlFor="c-email">
            <Input
              id="c-email"
              type="email"
              autoComplete="off"
              value={ownerEmail}
              required
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </Field>
          <Field label={t('ownerName')} htmlFor="c-owner">
            <Input
              id="c-owner"
              value={ownerName}
              maxLength={40}
              required
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </Field>
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
        <Button type="submit" disabled={pending}>
          {t('submit')}
        </Button>
      </form>
    </Card>
  );
}
