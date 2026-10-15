'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { restockAllAction, setSoldOutAction, type AvailabilityData } from '@/features/catalog/stock-actions';
import { Alert, Button, Input, Switch } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';

/** Accent- and case-insensitive search ("samourai" finds "Samouraï", vol. 07 §5.6). */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

type Entity = 'product' | 'option' | 'category';

/** Live availability (STK-01): large switches, optimistic update with rollback. */
export function AvailabilityView({ shopSlug, initial, isOwner }: { shopSlug: string; initial: AvailabilityData; isOwner: boolean }) {
  const t = useTranslations('pro.availability');
  const te = useTranslations('errors');
  const [data, setData] = useState(initial);
  const [query, setQuery] = useState('');
  const [onlySoldOut, setOnlySoldOut] = useState(false);
  const [tab, setTab] = useState<'products' | 'options'>('products');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [confirmRestock, setConfirmRestock] = useState(false);

  const soldOutCount = useMemo(
    () =>
      data.categories.reduce((a, c) => a + (c.is_sold_out ? 1 : 0) + c.products.filter((p) => p.is_sold_out).length, 0) +
      data.groups.reduce((a, g) => a + g.options.filter((o) => o.is_sold_out).length, 0),
    [data],
  );

  function patch(entity: Entity, id: string, value: boolean, source = data): AvailabilityData {
    return {
      categories: source.categories.map((c) => ({
        ...c,
        is_sold_out: entity === 'category' && c.id === id ? value : c.is_sold_out,
        products: c.products.map((p) => (entity === 'product' && p.id === id ? { ...p, is_sold_out: value } : p)),
      })),
      groups: source.groups.map((g) => ({
        ...g,
        options: g.options.map((o) => (entity === 'option' && o.id === id ? { ...o, is_sold_out: value } : o)),
      })),
    };
  }

  async function toggle(entity: Entity, id: string, soldOut: boolean) {
    const previous = data;
    setData(patch(entity, id, soldOut));
    const res = await setSoldOutAction({ shopSlug, entity, id, soldOut });
    if (!res.ok) {
      setData(previous);
      setMessage({ tone: 'danger', text: te(res.code) });
    }
  }

  const q = normalize(query.trim());
  const match = (name: string) => q === '' || normalize(name).includes(q);
  const keep = (soldOut: boolean) => !onlySoldOut || soldOut;

  const row = (entity: Entity, id: string, name: string, soldOut: boolean, extra?: React.ReactNode, indent = false) => (
    <li key={`${entity}-${id}`} className={cn('flex min-h-14 items-center gap-3 py-1', indent && 'pl-8', soldOut && 'hatched')}>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {extra}
        <span className={cn('truncate', soldOut ? 'text-muted' : 'font-medium')}>{name}</span>
      </span>
      <Switch checked={!soldOut} label={name} onLabel={t('available')} offLabel={t('soldOut')} onChange={(available) => toggle(entity, id, !available)} />
    </li>
  );

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-3.5 left-3 h-5 w-5 text-muted" />
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('search')} aria-label={t('search')} className="pl-10" />
        </div>
        <div className="flex gap-1 rounded-lg bg-brand-soft p-1">
          <button type="button" aria-pressed={!onlySoldOut} onClick={() => setOnlySoldOut(false)} className={cn('min-h-11 rounded-md px-3 font-semibold', !onlySoldOut && 'bg-surface shadow')}>
            {t('all')}
          </button>
          <button type="button" aria-pressed={onlySoldOut} onClick={() => setOnlySoldOut(true)} className={cn('min-h-11 rounded-md px-3 font-semibold', onlySoldOut && 'bg-surface shadow')}>
            {t('soldOutOnly', { count: soldOutCount })}
          </button>
        </div>
        {isOwner &&
          (!confirmRestock ? (
            <Button variant="secondary" onClick={() => setConfirmRestock(true)} disabled={soldOutCount === 0}>
              {t('restockAll')}
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-2">
              <span className="text-sm font-medium">{t('restockConfirm')}</span>
              <Button size="sm" variant="secondary" onClick={() => setConfirmRestock(false)}>
                ✕
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  setConfirmRestock(false);
                  const res = await restockAllAction(shopSlug);
                  if (!res.ok) return setMessage({ tone: 'danger', text: te(res.code) });
                  setMessage({ tone: 'success', text: t('restocked', { count: res.value }) });
                  setData({
                    categories: data.categories.map((c) => ({ ...c, is_sold_out: false, products: c.products.map((p) => ({ ...p, is_sold_out: false })) })),
                    groups: data.groups.map((g) => ({ ...g, options: g.options.map((o) => ({ ...o, is_sold_out: false })) })),
                  });
                }}
              >
                ✓
              </Button>
            </div>
          ))}
      </div>

      <div role="tablist" className="flex gap-1 border-b border-line">
        {(['products', 'options'] as const).map((k) => (
          <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn('min-h-12 border-b-4 px-4 font-semibold', tab === k ? 'border-brand' : 'border-transparent text-muted')}>
            {k === 'products' ? t('productsTab') : t('optionsTab')}
          </button>
        ))}
      </div>

      {tab === 'products' ? (
        <div className="space-y-5">
          {data.categories.map((cat) => {
            const products = cat.products.filter((p) => (match(p.name) || match(cat.name)) && keep(p.is_sold_out));
            const showCat = match(cat.name) && keep(cat.is_sold_out);
            if (products.length === 0 && !showCat) return null;
            return (
              <section key={cat.id}>
                <h2 className="text-sm font-bold tracking-wide text-muted uppercase">{cat.name}</h2>
                <ul className="divide-y divide-line">
                  {showCat && row('category', cat.id, `${t('category')} — ${cat.name}`, cat.is_sold_out)}
                  {products.map((p) => {
                    const groups = data.groups.filter((g) => p.optionGroupIds.includes(g.id));
                    const expanded = open[p.id] ?? false;
                    return (
                      <li key={p.id}>
                        <ul>
                          {row(
                            'product',
                            p.id,
                            p.name,
                            p.is_sold_out,
                            groups.length > 0 ? (
                              <button type="button" aria-expanded={expanded} onClick={() => setOpen((o) => ({ ...o, [p.id]: !expanded }))} className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-brand-soft" aria-label={t('options')}>
                                {expanded ? <ChevronDown aria-hidden className="h-5 w-5" /> : <ChevronRight aria-hidden className="h-5 w-5" />}
                              </button>
                            ) : (
                              <span className="inline-block w-10" aria-hidden />
                            ),
                          )}
                          {expanded &&
                            groups.flatMap((g) => g.options.filter((o) => keep(o.is_sold_out)).map((o) => row('option', o.id, `${g.name} · ${o.name}`, o.is_sold_out, undefined, true)))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-5">
          {data.groups.map((g) => {
            const options = g.options.filter((o) => (match(o.name) || match(g.name)) && keep(o.is_sold_out));
            if (options.length === 0) return null;
            return (
              <section key={g.id}>
                <h2 className="text-sm font-bold tracking-wide text-muted uppercase">{g.name}</h2>
                <ul className="divide-y divide-line">{options.map((o) => row('option', o.id, o.name, o.is_sold_out))}</ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
