'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  FONT_PAIRS,
  PRESETS,
  themeCss,
  validateThemeContrast,
  type ThemeSettings,
} from '@/features/theming/theme';
import {
  removeThemeImageAction,
  saveThemeAction,
  uploadThemeImageAction,
} from '@/features/theming/actions';
import { Alert, Button, Card, Field, Input } from '@/components/ui/primitives';
import { formatPrice } from '@/lib/money';
import { cn } from '@/lib/cn';

type PreviewProduct = { name: string; description: string | null; price: number };

function Choice<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: T;
  options: Array<[T, string]>;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn(
            'min-h-12 rounded-lg border px-3',
            value === v ? 'border-fg bg-brand-soft font-semibold' : 'border-line',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Theme editor with live preview (REG-02). Saving is refused when the main colour lacks contrast. */
export function ThemeEditor({
  shopSlug,
  shopName,
  initial,
  logoUrl,
  coverUrl,
  products,
}: {
  shopSlug: string;
  shopName: string;
  initial: ThemeSettings;
  logoUrl: string | null;
  coverUrl: string | null;
  products: PreviewProduct[];
}) {
  const t = useTranslations('pro.theme');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeSettings>(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const issues = useMemo(() => validateThemeContrast(theme), [theme]);
  const css = useMemo(() => themeCss(theme, '.theme-preview'), [theme]);
  const set = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setTheme((x) => ({ ...x, [key]: value }));
    setMessage(null);
  };

  return (
    <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Card className="space-y-3">
          <h2 className="font-semibold">{t('presets')}</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  const { label: _label, ...settings } = p;
                  setTheme(settings);
                }}
                aria-pressed={theme.preset === key}
                className={cn(
                  'flex min-h-12 items-center gap-2 rounded-lg border px-3',
                  theme.preset === key ? 'border-fg font-semibold' : 'border-line',
                )}
              >
                <span
                  className="h-5 w-5 rounded-full"
                  style={{ background: p.primary_color }}
                  aria-hidden
                />
                <span
                  className="h-5 w-5 rounded-full"
                  style={{ background: p.accent_color }}
                  aria-hidden
                />
                {p.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('primary')} htmlFor="th-primary">
              <div className="flex gap-2">
                <input
                  id="th-primary"
                  type="color"
                  value={theme.primary_color}
                  onChange={(e) => set('primary_color', e.target.value.toUpperCase())}
                  className="border-line h-12 w-16 rounded border"
                />
                <Input
                  aria-label={`${t('primary')} (hex)`}
                  value={theme.primary_color}
                  maxLength={7}
                  onChange={(e) =>
                    /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) &&
                    set('primary_color', e.target.value.toUpperCase())
                  }
                />
              </div>
            </Field>
            <Field label={t('accent')} htmlFor="th-accent">
              <div className="flex gap-2">
                <input
                  id="th-accent"
                  type="color"
                  value={theme.accent_color}
                  onChange={(e) => set('accent_color', e.target.value.toUpperCase())}
                  className="border-line h-12 w-16 rounded border"
                />
                <Input
                  aria-label={`${t('accent')} (hex)`}
                  value={theme.accent_color}
                  maxLength={7}
                  onChange={(e) =>
                    /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) &&
                    set('accent_color', e.target.value.toUpperCase())
                  }
                />
              </div>
            </Field>
          </div>
          {issues.map((issue) => (
            <Alert key={issue.mode} tone="danger">
              {t('contrastIssue', {
                mode: issue.mode === 'clair' ? t('modeClair') : t('modeSombre'),
                ratio: issue.ratio.toFixed(2).replace('.', ','),
              })}{' '}
              {issue.suggestion && (
                <button
                  type="button"
                  className="font-semibold underline"
                  onClick={() => set('primary_color', issue.suggestion!)}
                >
                  {t('useSuggestion', { color: issue.suggestion })}
                </button>
              )}
            </Alert>
          ))}
          <fieldset className="space-y-2">
            <legend className="font-medium">{t('fonts')}</legend>
            <Choice
              name={t('fonts')}
              value={theme.font_pair}
              options={Object.entries(FONT_PAIRS).map(([k, v]) => [
                k as ThemeSettings['font_pair'],
                v.label,
              ])}
              onChange={(v) => set('font_pair', v)}
            />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="font-medium">{t('radius')}</legend>
            <Choice
              name={t('radius')}
              value={theme.radius}
              options={(['carre', 'doux', 'arrondi'] as const).map((k) => [
                k,
                t(`radiusOptions.${k}`),
              ])}
              onChange={(v) => set('radius', v)}
            />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="font-medium">{t('density')}</legend>
            <Choice
              name={t('density')}
              value={theme.density}
              options={(['compacte', 'aeree'] as const).map((k) => [k, t(`densityOptions.${k}`)])}
              onChange={(v) => set('density', v)}
            />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="font-medium">{t('layout')}</legend>
            <Choice
              name={t('layout')}
              value={theme.menu_layout}
              options={(['liste', 'grille', 'minimaliste'] as const).map((k) => [
                k,
                t(`layoutOptions.${k}`),
              ])}
              onChange={(v) => set('menu_layout', v)}
            />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="font-medium">{t('scheme')}</legend>
            <Choice
              name={t('scheme')}
              value={theme.color_scheme}
              options={(['clair', 'sombre', 'auto'] as const).map((k) => [
                k,
                t(`schemeOptions.${k}`),
              ])}
              onChange={(v) => set('color_scheme', v)}
            />
          </fieldset>
          {message && <Alert tone={message.tone}>{message.text}</Alert>}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={
                pending ||
                issues.length > 0 ||
                !/^#[0-9A-F]{6}$/i.test(theme.primary_color) ||
                !/^#[0-9A-F]{6}$/i.test(theme.accent_color)
              }
              onClick={async () => {
                setPending(true);
                const res = await saveThemeAction(shopSlug, theme);
                setPending(false);
                setMessage(
                  res.ok
                    ? { tone: 'success', text: tc('saved') }
                    : { tone: 'danger', text: te(res.code) },
                );
                if (res.ok) router.refresh();
              }}
            >
              {pending ? tc('saving') : tc('save')}
            </Button>
            <Button variant="ghost" onClick={() => setTheme(initial)}>
              {t('reset')}
            </Button>
          </div>
        </Card>

        <Card className="grid gap-4 sm:grid-cols-2">
          <ImageField
            shopSlug={shopSlug}
            kind="logo"
            label={t('logo')}
            url={logoUrl}
            onChanged={() => router.refresh()}
          />
          <ImageField
            shopSlug={shopSlug}
            kind="cover"
            label={t('cover')}
            url={coverUrl}
            onChanged={() => router.refresh()}
          />
        </Card>
      </div>

      <aside aria-label={t('preview')} className="xl:sticky xl:top-4 xl:self-start">
        <h2 className="mb-2 font-semibold">{t('preview')}</h2>
        <style>{css}</style>
        <div
          className="theme-preview site-body border-fg/80 bg-bg text-fg mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border-8 shadow-lg"
          style={{ height: '40rem' }}
        >
          <div className="h-full overflow-y-auto">
            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- storage CDN
              <img src={coverUrl} alt="" className="h-28 w-full object-cover" />
            )}
            <header className="border-line bg-surface flex items-center gap-3 border-b p-3">
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- storage CDN
                <img src={logoUrl} alt="" className="h-10 w-10 object-contain" />
              )}
              <div>
                <p className="font-display text-lg font-semibold">{shopName}</p>
                <p className="text-muted text-xs">Vous êtes à : Table 4</p>
              </div>
            </header>
            <nav className="flex gap-2 overflow-x-auto p-3" aria-hidden>
              <span className="bg-brand text-brand-fg rounded-[var(--radius-button)] px-3 py-1.5 text-sm font-semibold">
                Entrées
              </span>
              <span className="border-line rounded-[var(--radius-button)] border px-3 py-1.5 text-sm">
                Plats
              </span>
              <span className="border-line rounded-[var(--radius-button)] border px-3 py-1.5 text-sm">
                Desserts
              </span>
            </nav>
            <ul
              className={cn(
                'gap-3 p-3',
                theme.menu_layout === 'grille' ? 'grid grid-cols-2' : 'space-y-3',
              )}
            >
              {products.map((p) => (
                <li
                  key={p.name}
                  className={cn(
                    'bg-surface p-3',
                    theme.menu_layout === 'minimaliste'
                      ? 'border-line border-b bg-transparent'
                      : 'border-line rounded-[var(--radius)] border',
                  )}
                >
                  {theme.menu_layout === 'grille' && (
                    <div className="bg-brand-soft mb-2 aspect-[4/3] rounded-[var(--radius)]" />
                  )}
                  <p className="font-display font-semibold">{p.name}</p>
                  {theme.menu_layout !== 'minimaliste' && p.description && (
                    <p className="text-muted line-clamp-2 text-xs">{p.description}</p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-brand-text font-semibold">{formatPrice(p.price)}</span>
                    <span className="bg-brand text-brand-fg rounded-[var(--radius-button)] px-3 py-1 text-sm font-semibold">
                      +
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="sticky bottom-0 p-3">
              <span className="bg-accent text-accent-fg block rounded-[var(--radius-button)] px-4 py-3 text-center font-semibold">
                Voir mon panier · 2
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ImageField({
  shopSlug,
  kind,
  label,
  url,
  onChanged,
}: {
  shopSlug: string;
  kind: 'logo' | 'cover';
  label: string;
  url: string | null;
  onChanged: () => void;
}) {
  const tp = useTranslations('pro.catalog.photo');
  const te = useTranslations('errors');
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <p className="font-medium">{label}</p>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- storage CDN
        <img
          src={url}
          alt=""
          className={cn(
            'border-line rounded-lg border',
            kind === 'logo' ? 'h-24 w-24 object-contain' : 'h-24 w-full object-cover',
          )}
        />
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        aria-label={label}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setPending(true);
          setError(null);
          const form = new FormData();
          form.set('shopSlug', shopSlug);
          form.set('kind', kind);
          form.set('file', file);
          const res = await uploadThemeImageAction(form);
          setPending(false);
          if (input.current) input.current.value = '';
          if (!res.ok) setError(te(res.code));
          else onChanged();
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => input.current?.click()}
        >
          {pending ? tp('uploading') : url ? tp('replace') : tp('choose')}
        </Button>
        {url && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={async () => {
              const res = await removeThemeImageAction(shopSlug, kind);
              if (!res.ok) setError(te(res.code));
              else onChanged();
            }}
          >
            {tp('remove')}
          </Button>
        )}
      </div>
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
