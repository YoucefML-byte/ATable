'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Star, Trash2 } from 'lucide-react';
import {
  previewMenuAction,
  saveMenuAction,
  setDefaultMenuAction,
} from '@/features/catalog/menu-actions';
import { softDeleteAction } from '@/features/catalog/actions';
import { Alert, Button, Card, Field, Input, Textarea } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';

export type MenuAdmin = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  schedules: Array<{ days: number[]; start: string; end: string }>;
  categoryIds: string[];
};

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;
const COLORS = [
  'bg-st-accepted',
  'bg-st-ready',
  'bg-st-warning',
  'bg-st-submitted',
  'bg-brand',
  'bg-accent',
];

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number) as [number, number];
  return h * 60 + m;
};

/** Segments [start, end) in minutes for a day 1..7, including the after-midnight part of the day before. */
function segmentsFor(menu: MenuAdmin, day: number): Array<[number, number]> {
  if (menu.schedules.length === 0) return [[0, 1440]];
  const out: Array<[number, number]> = [];
  const previous = day === 1 ? 7 : day - 1;
  for (const s of menu.schedules) {
    const a = toMinutes(s.start);
    const b = toMinutes(s.end);
    if (a < b) {
      if (s.days.includes(day)) out.push([a, b]);
    } else {
      if (s.days.includes(day)) out.push([a, 1440]);
      if (s.days.includes(previous)) out.push([0, b]);
    }
  }
  return out;
}

/** Menus and time slots (CAT-04): editor, week view and "what does a customer see" simulator. */
export function MenusView({
  shopSlug,
  menus,
  categories,
  today,
}: {
  shopSlug: string;
  menus: MenuAdmin[];
  categories: Array<{ id: string; name: string }>;
  today: string;
}) {
  const t = useTranslations('pro.menus');
  const te = useTranslations('errors');
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(menus[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const menu = selected === 'new' ? null : (menus.find((m) => m.id === selected) ?? null);

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <Card className="space-y-2">
          <ul className="space-y-1">
            {menus.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => setSelected(m.id)}
                  aria-current={selected === m.id}
                  className={cn(
                    'min-h-12 w-full rounded-lg px-3 text-left',
                    selected === m.id ? 'bg-brand-soft font-semibold' : 'hover:bg-brand-soft',
                  )}
                >
                  {m.name}
                  {m.isDefault && (
                    <Star aria-label={t('default')} className="ml-2 inline h-4 w-4" />
                  )}
                  {!m.isActive && (
                    <span className="text-muted ml-2 text-xs">({t('inactive')})</span>
                  )}
                  <span className="text-muted block text-sm">
                    {m.schedules.length === 0
                      ? t('alwaysActive')
                      : m.schedules
                          .map(
                            (s) =>
                              `${s.days.map((d) => DAYS[d - 1]).join(' ')} ${s.start}–${s.end}`,
                          )
                          .join(' · ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Button variant="secondary" className="w-full" onClick={() => setSelected('new')}>
            <Plus aria-hidden className="h-4 w-4" /> {t('newMenu')}
          </Button>
        </Card>
        {selected ? (
          <MenuForm
            key={selected}
            shopSlug={shopSlug}
            menu={menu}
            categories={categories}
            onSaved={(id) => {
              setSelected(id);
              router.refresh();
            }}
            onDefault={
              menu && !menu.isDefault
                ? async () => {
                    const res = await setDefaultMenuAction(shopSlug, menu.id);
                    if (!res.ok) setError(te(res.code));
                    router.refresh();
                  }
                : null
            }
            onDelete={
              menu
                ? async () => {
                    if (!window.confirm(t('deleteConfirm', { name: menu.name }))) return;
                    const res = await softDeleteAction({ shopSlug, entity: 'menu', id: menu.id });
                    if (!res.ok) setError(te(res.code));
                    else setSelected(null);
                    router.refresh();
                  }
                : null
            }
          />
        ) : (
          <Card className="text-muted">{t('select')}</Card>
        )}
      </div>

      <WeekView menus={menus.filter((m) => m.isActive)} />
      <Simulator shopSlug={shopSlug} today={today} />
    </div>
  );
}

function MenuForm({
  shopSlug,
  menu,
  categories,
  onSaved,
  onDefault,
  onDelete,
}: {
  shopSlug: string;
  menu: MenuAdmin | null;
  categories: Array<{ id: string; name: string }>;
  onSaved: (id: string) => void;
  onDefault: (() => void) | null;
  onDelete: (() => void) | null;
}) {
  const t = useTranslations('pro.menus');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const [name, setName] = useState(menu?.name ?? '');
  const [description, setDescription] = useState(menu?.description ?? '');
  const [isActive, setActive] = useState(menu?.isActive ?? true);
  const [schedules, setSchedules] = useState(menu?.schedules ?? []);
  const [categoryIds, setCategoryIds] = useState(menu?.categoryIds ?? []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const update = (i: number, patch: Partial<MenuAdmin['schedules'][number]>) =>
    setSchedules((x) => x.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (schedules.some((s) => s.days.length === 0 || s.start === s.end)) {
            setError(t('invalidSchedule'));
            return;
          }
          setPending(true);
          setError(null);
          setSaved(false);
          const res = await saveMenuAction({
            shopSlug,
            id: menu?.id ?? null,
            name,
            description,
            isActive,
            schedules,
            categoryIds,
          });
          setPending(false);
          if (!res.ok) setError(te(res.code));
          else {
            setSaved(true);
            onSaved(res.value);
          }
        }}
      >
        <h2 className="text-lg font-semibold">{menu ? menu.name : t('newMenu')}</h2>
        <Field label={t('name')} htmlFor="m-name">
          <Input
            id="m-name"
            value={name}
            maxLength={60}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label={t('description')} htmlFor="m-desc">
          <Textarea
            id="m-desc"
            rows={2}
            maxLength={300}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <label className="flex min-h-12 items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={isActive}
            onChange={(e) => setActive(e.target.checked)}
          />
          {t('active')}
        </label>

        <fieldset className="space-y-2">
          <legend className="font-medium">{t('schedules')}</legend>
          {schedules.length === 0 && <p className="text-muted text-sm">{t('alwaysActive')}</p>}
          {schedules.map((s, i) => (
            <div key={i} className="border-line space-y-2 rounded-lg border p-3">
              <div className="flex flex-wrap gap-1" role="group" aria-label={t('days')}>
                {DAYS.map((label, d) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={s.days.includes(d + 1)}
                    onClick={() =>
                      update(i, {
                        days: s.days.includes(d + 1)
                          ? s.days.filter((x) => x !== d + 1)
                          : [...s.days, d + 1].sort(),
                      })
                    }
                    className={cn(
                      'min-h-10 min-w-12 rounded-md border text-sm',
                      s.days.includes(d + 1)
                        ? 'border-fg bg-brand-soft font-semibold'
                        : 'border-line',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Field label={t('from')} htmlFor={`s-from-${i}`}>
                  <Input
                    id={`s-from-${i}`}
                    type="time"
                    value={s.start}
                    onChange={(e) => update(i, { start: e.target.value })}
                    className="w-32"
                  />
                </Field>
                <Field label={t('to')} htmlFor={`s-to-${i}`}>
                  <Input
                    id={`s-to-${i}`}
                    type="time"
                    value={s.end}
                    onChange={(e) => update(i, { end: e.target.value })}
                    className="w-32"
                  />
                </Field>
                {toMinutes(s.end) < toMinutes(s.start) && (
                  <span className="text-muted pb-3 text-sm">{t('nextDay')}</span>
                )}
                <Button
                  variant="ghost"
                  aria-label={t('removeSchedule')}
                  onClick={() => setSchedules((x) => x.filter((_, j) => j !== i))}
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setSchedules((x) => [...x, { days: [1, 2, 3, 4, 5], start: '12:00', end: '14:30' }])
            }
          >
            <Plus aria-hidden className="h-4 w-4" /> {t('addSchedule')}
          </Button>
        </fieldset>

        <fieldset>
          <legend className="font-medium">{t('categories')}</legend>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {categories.map((c) => (
              <label key={c.id} className="flex min-h-12 items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={categoryIds.includes(c.id)}
                  onChange={(e) =>
                    setCategoryIds((x) =>
                      e.target.checked ? [...x, c.id] : x.filter((y) => y !== c.id),
                    )
                  }
                />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>

        {error && <Alert tone="danger">{error}</Alert>}
        {saved && <Alert tone="success">{tc('saved')}</Alert>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? tc('saving') : tc('save')}
          </Button>
          {onDefault && (
            <Button variant="secondary" onClick={onDefault}>
              <Star aria-hidden className="h-4 w-4" /> {t('makeDefault')}
            </Button>
          )}
          {menu?.isDefault && (
            <span className="text-muted self-center text-sm">{t('default')}</span>
          )}
          {onDelete && (
            <Button variant="ghost" onClick={onDelete}>
              <Trash2 aria-hidden className="h-4 w-4" /> {tc('delete')}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function WeekView({ menus }: { menus: MenuAdmin[] }) {
  const t = useTranslations('pro.menus');
  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold">{t('week')}</h2>
      <ul className="flex flex-wrap gap-3 text-sm">
        {menus.map((m, i) => (
          <li key={m.id} className="flex items-center gap-2">
            <span className={cn('h-3 w-3 rounded-sm', COLORS[i % COLORS.length])} aria-hidden />
            {m.name}
          </li>
        ))}
      </ul>
      <div className="space-y-2" role="table" aria-label={t('week')}>
        <div className="text-muted ml-12 flex justify-between text-xs" aria-hidden>
          {[0, 6, 12, 18, 24].map((h) => (
            <span key={h}>{h} h</span>
          ))}
        </div>
        {DAYS.map((label, d) => (
          <div key={label} role="row" className="flex items-center gap-2">
            <span role="rowheader" className="w-10 text-sm font-medium">
              {label}
            </span>
            <div role="cell" className="relative flex-1 space-y-0.5">
              {menus.map((m, i) => (
                <div key={m.id} className="bg-line/40 relative h-3 rounded-sm">
                  {segmentsFor(m, d + 1).map(([a, b], k) => (
                    <span
                      key={k}
                      title={`${m.name} ${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}–${Math.floor(b / 60)}:${String(b % 60).padStart(2, '0')}`}
                      className={cn('absolute top-0 h-3 rounded-sm', COLORS[i % COLORS.length])}
                      style={{ left: `${(a / 1440) * 100}%`, width: `${((b - a) / 1440) * 100}%` }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Simulator({ shopSlug, today }: { shopSlug: string; today: string }) {
  const t = useTranslations('pro.menus');
  const te = useTranslations('errors');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('12:30');
  const [result, setResult] = useState<{ menus: string[]; categories: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold">{t('simulator')}</h2>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const res = await previewMenuAction({ shopSlug, date, time });
          if (!res.ok) setError(te(res.code));
          else setResult(res.value);
        }}
      >
        <span className="pb-3">{t('simulatorQuestion')}</span>
        <Input
          aria-label={t('simulatorDate')}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44"
          required
        />
        <span className="pb-3">{t('at')}</span>
        <Input
          aria-label={t('simulatorTime')}
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-32"
          required
        />
        <Button type="submit">{t('simulate')}</Button>
      </form>
      {error && <Alert tone="danger">{error}</Alert>}
      {result &&
        (result.menus.length === 0 ? (
          <Alert tone="warning">{t('simulatorNone')}</Alert>
        ) : (
          <div className="space-y-1" role="status">
            <p className="font-medium">
              {t('simulatorResult', { menus: result.menus.join(', ') })}
            </p>
            <p className="text-muted text-sm">
              {t('visibleCategories')} : {result.categories.join(', ') || '—'}
            </p>
          </div>
        ))}
    </Card>
  );
}
