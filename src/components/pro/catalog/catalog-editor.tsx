'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Copy, EyeOff, Plus, Trash2 } from 'lucide-react';
import type { AdminCatalog } from '@/features/catalog/admin-queries';
import { PRODUCT_TAGS, type ProductTag } from '@/features/catalog/menu-schema';
import {
  duplicateProductAction,
  reorderAction,
  saveCategoryAction,
  saveGroupAction,
  saveOptionAction,
  saveProductAction,
  softDeleteAction,
} from '@/features/catalog/actions';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '@/components/ui/primitives';
import { AllergenGrid } from './allergen-grid';
import { PhotoUpload } from './photo-upload';
import { centsToInput, formatPrice, parsePriceInput } from '@/lib/money';
import { cn } from '@/lib/cn';

type Selection = { type: 'category' | 'product' | 'group'; id: string | null } | null;
type Props = { shopSlug: string; timezone: string; mediaBase: string; catalog: AdminCatalog };

/** Owner's catalog editor (CAT-01 to CAT-03): categories / products / edit panel, plus groups. */
export function CatalogEditor({ shopSlug, timezone, mediaBase, catalog }: Props) {
  const t = useTranslations('pro.catalog');
  const te = useTranslations('errors');
  const router = useRouter();
  const [view, setView] = useState<'products' | 'groups'>('products');
  const [categoryId, setCategoryId] = useState<string | null>(catalog.categories[0]?.id ?? null);
  const [selection, setSelectionState] = useState<Selection>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const setSelection = (next: Selection) => {
    setNotice(null);
    setSelectionState(next);
  };
  const tc = useTranslations('common');

  const products = useMemo(
    () => catalog.products.filter((p) => p.categoryId === categoryId),
    [catalog.products, categoryId],
  );
  const refresh = () => router.refresh();
  const saved = () => {
    setNotice(tc('saved'));
    refresh();
  };

  async function move(
    entity: 'category' | 'product' | 'option_group',
    ids: string[],
    index: number,
    delta: -1 | 1,
  ) {
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target]!, next[index]!];
    const res = await reorderAction({ shopSlug, entity, ids: next });
    if (!res.ok) setError(te(res.code));
    refresh();
  }

  async function remove(
    entity: 'category' | 'product' | 'option_group' | 'option',
    id: string,
    name: string,
  ) {
    if (!window.confirm(t('deleteConfirm', { name }))) return;
    const res = await softDeleteAction({ shopSlug, entity, id });
    if (!res.ok) {
      setError(te(res.code));
      return;
    }
    setSelection(null);
    if (entity === 'category' && id === categoryId) setCategoryId(null);
    refresh();
  }

  const selected = (() => {
    if (!selection) return null;
    if (selection.type === 'category') {
      const category = selection.id ? catalog.categories.find((c) => c.id === selection.id) : null;
      return (
        <CategoryForm
          key={selection.id ?? 'new-category'}
          shopSlug={shopSlug}
          catalog={catalog}
          category={category ?? null}
          onSaved={(id) => {
            setCategoryId(id);
            setSelection({ type: 'category', id });
            saved();
          }}
          onDelete={category ? () => remove('category', category.id, category.name) : null}
        />
      );
    }
    if (selection.type === 'product') {
      const product = selection.id ? catalog.products.find((p) => p.id === selection.id) : null;
      return (
        <ProductForm
          key={selection.id ?? 'new-product'}
          shopSlug={shopSlug}
          timezone={timezone}
          mediaBase={mediaBase}
          catalog={catalog}
          product={product ?? null}
          defaultCategoryId={categoryId}
          onSaved={(id) => {
            setSelection({ type: 'product', id });
            saved();
          }}
          onDelete={product ? () => remove('product', product.id, product.name) : null}
        />
      );
    }
    const group = selection.id ? catalog.groups.find((g) => g.id === selection.id) : null;
    return (
      <GroupForm
        key={selection.id ?? 'new-group'}
        shopSlug={shopSlug}
        timezone={timezone}
        catalog={catalog}
        group={group ?? null}
        onSaved={(id) => {
          setSelection({ type: 'group', id });
          saved();
        }}
        onDelete={
          group ? () => remove('option_group', group.id, group.internalName ?? group.name) : null
        }
        onDeleteOption={(id, name) => remove('option', id, name)}
      />
    );
  })();

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div role="tablist" className="flex gap-2">
          {(['products', 'groups'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => {
                setView(v);
                setSelection(null);
              }}
              className={cn(
                'min-h-12 rounded-lg px-4 font-semibold',
                view === v ? 'bg-brand text-brand-fg' : 'border-line border',
              )}
            >
              {v === 'products' ? t('products') : t('optionGroups')}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <Alert tone="danger">
          {error}{' '}
          <button className="underline" onClick={() => setError(null)}>
            ×
          </button>
        </Alert>
      )}

      {notice && <Alert tone="success">{notice}</Alert>}
      {view === 'products' ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,20rem)_minmax(0,1fr)]">
          <Card className="space-y-2">
            <h2 className="font-semibold">{t('categories')}</h2>
            <ul className="space-y-1">
              {catalog.categories.map((c, i) => (
                <li key={c.id} className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setCategoryId(c.id);
                      setSelection({ type: 'category', id: c.id });
                    }}
                    aria-current={categoryId === c.id}
                    className={cn(
                      'min-h-12 flex-1 rounded-lg px-3 text-left',
                      categoryId === c.id ? 'bg-brand-soft font-semibold' : 'hover:bg-brand-soft',
                    )}
                  >
                    {c.name}
                    <Badges hidden={c.isHidden} soldOut={c.isSoldOut} />
                  </button>
                  <MoveButtons
                    name={c.name}
                    onUp={() =>
                      move(
                        'category',
                        catalog.categories.map((x) => x.id),
                        i,
                        -1,
                      )
                    }
                    onDown={() =>
                      move(
                        'category',
                        catalog.categories.map((x) => x.id),
                        i,
                        1,
                      )
                    }
                  />
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setSelection({ type: 'category', id: null })}
            >
              <Plus aria-hidden className="h-4 w-4" /> {t('newCategory')}
            </Button>
          </Card>

          <Card className="space-y-2">
            <h2 className="font-semibold">{t('products')}</h2>
            {!categoryId ? (
              <p className="text-muted">{t('noCategory')}</p>
            ) : products.length === 0 ? (
              <p className="text-muted">{t('noProduct')}</p>
            ) : (
              <ul className="space-y-1">
                {products.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-1">
                    <button
                      onClick={() => setSelection({ type: 'product', id: p.id })}
                      aria-current={selection?.id === p.id}
                      className={cn(
                        'min-h-12 flex-1 rounded-lg px-3 text-left',
                        selection?.id === p.id
                          ? 'bg-brand-soft font-semibold'
                          : 'hover:bg-brand-soft',
                      )}
                    >
                      <span className="block">{p.name}</span>
                      <span className="text-muted text-sm">{formatPrice(p.basePriceCents)}</span>
                      <Badges hidden={p.isHidden} soldOut={p.isSoldOut} />
                      {!p.allergensDeclaredAt && (
                        <span className="text-st-warning ml-2 text-xs font-semibold">
                          {t('allergensToDeclare')}
                        </span>
                      )}
                    </button>
                    <MoveButtons
                      name={p.name}
                      onUp={() =>
                        move(
                          'product',
                          products.map((x) => x.id),
                          i,
                          -1,
                        )
                      }
                      onDown={() =>
                        move(
                          'product',
                          products.map((x) => x.id),
                          i,
                          1,
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
            {categoryId && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setSelection({ type: 'product', id: null })}
              >
                <Plus aria-hidden className="h-4 w-4" /> {t('newProduct')}
              </Button>
            )}
            {selection?.type === 'product' && selection.id && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={async () => {
                  const res = await duplicateProductAction(shopSlug, selection.id!);
                  if (!res.ok) setError(te(res.code));
                  else {
                    setSelection({ type: 'product', id: res.value });
                    refresh();
                  }
                }}
              >
                <Copy aria-hidden className="h-4 w-4" /> {t('duplicate')}
              </Button>
            )}
          </Card>

          <div>{selected ?? <Card className="text-muted">{t('select')}</Card>}</div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <Card className="space-y-2">
            <h2 className="font-semibold">{t('optionGroups')}</h2>
            <ul className="space-y-1">
              {catalog.groups.map((g, i) => (
                <li key={g.id} className="flex items-center gap-1">
                  <button
                    onClick={() => setSelection({ type: 'group', id: g.id })}
                    aria-current={selection?.id === g.id}
                    className={cn(
                      'min-h-12 flex-1 rounded-lg px-3 text-left',
                      selection?.id === g.id
                        ? 'bg-brand-soft font-semibold'
                        : 'hover:bg-brand-soft',
                    )}
                  >
                    <span className="block">{g.internalName ?? g.name}</span>
                    <span className="text-muted text-sm">
                      {t('usedBy', {
                        count: catalog.products.filter((p) =>
                          p.groups.some((l) => l.groupId === g.id),
                        ).length,
                      })}
                    </span>
                  </button>
                  <MoveButtons
                    name={g.internalName ?? g.name}
                    onUp={() =>
                      move(
                        'option_group',
                        catalog.groups.map((x) => x.id),
                        i,
                        -1,
                      )
                    }
                    onDown={() =>
                      move(
                        'option_group',
                        catalog.groups.map((x) => x.id),
                        i,
                        1,
                      )
                    }
                  />
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setSelection({ type: 'group', id: null })}
            >
              <Plus aria-hidden className="h-4 w-4" /> {t('newGroup')}
            </Button>
          </Card>
          <div>{selected ?? <Card className="text-muted">{t('select')}</Card>}</div>
        </div>
      )}
    </div>
  );
}

function Badges({ hidden, soldOut }: { hidden: boolean; soldOut: boolean }) {
  const t = useTranslations('pro.catalog');
  return (
    <>
      {hidden && (
        <span className="bg-line ml-2 inline-flex items-center gap-1 rounded px-1.5 text-xs">
          <EyeOff aria-hidden className="h-3 w-3" />
          {t('hidden')}
        </span>
      )}
      {soldOut && (
        <span className="bg-st-danger-soft ml-2 rounded px-1.5 text-xs">{t('soldOut')}</span>
      )}
    </>
  );
}

function MoveButtons({
  name,
  onUp,
  onDown,
}: {
  name: string;
  onUp: () => void;
  onDown: () => void;
}) {
  const t = useTranslations('pro.catalog');
  return (
    <span className="flex flex-col">
      <button
        className="hover:bg-brand-soft flex h-6 w-10 items-center justify-center rounded"
        aria-label={t('moveUp', { name })}
        onClick={onUp}
      >
        <ArrowUp aria-hidden className="h-4 w-4" />
      </button>
      <button
        className="hover:bg-brand-soft flex h-6 w-10 items-center justify-center rounded"
        aria-label={t('moveDown', { name })}
        onClick={onDown}
      >
        <ArrowDown aria-hidden className="h-4 w-4" />
      </button>
    </span>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3">
      <input
        type="checkbox"
        className="h-5 w-5"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function useSave() {
  const te = useTranslations('errors');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  async function run<T>(
    fn: () => Promise<{ ok: true; value: T } | { ok: false; code: Parameters<typeof te>[0] }>,
    onOk: (v: T) => void,
  ) {
    setPending(true);
    setError(null);
    setSaved(false);
    const res = await fn();
    setPending(false);
    if (!res.ok) {
      setError(te(res.code));
      return;
    }
    setSaved(true);
    onOk(res.value);
  }
  return { pending, error, saved, setError, run };
}

function FormFooter({
  pending,
  error,
  onDelete,
}: {
  pending: boolean;
  error: string | null;
  onDelete: (() => void) | null;
}) {
  const tc = useTranslations('common');
  return (
    <div className="space-y-2">
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? tc('saving') : tc('save')}
        </Button>
        {onDelete && (
          <Button variant="ghost" onClick={onDelete}>
            <Trash2 aria-hidden className="h-4 w-4" /> {tc('delete')}
          </Button>
        )}
      </div>
    </div>
  );
}

function CategoryForm({
  shopSlug,
  catalog,
  category,
  onSaved,
  onDelete,
}: {
  shopSlug: string;
  catalog: AdminCatalog;
  category: AdminCatalog['categories'][number] | null;
  onSaved: (id: string) => void;
  onDelete: (() => void) | null;
}) {
  const t = useTranslations('pro.catalog');
  const tc = useTranslations('common');
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [prepStation, setPrepStation] = useState(category?.prepStation ?? 'kitchen');
  const [isHidden, setHidden] = useState(category?.isHidden ?? false);
  const [isSoldOut, setSoldOut] = useState(category?.isSoldOut ?? false);
  const [menuIds, setMenuIds] = useState<string[]>(
    category?.menuIds ?? catalog.menus.map((m) => m.id),
  );
  const save = useSave();

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save.run(
            () =>
              saveCategoryAction({
                shopSlug,
                id: category?.id ?? null,
                name,
                description,
                prepStation,
                isHidden,
                isSoldOut,
                menuIds,
              }),
            onSaved,
          );
        }}
      >
        <h2 className="text-lg font-semibold">{category ? category.name : t('newCategory')}</h2>
        <Field label={t('fields.name')} htmlFor="cat-name">
          <Input
            id="cat-name"
            value={name}
            maxLength={60}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label={t('fields.description')} htmlFor="cat-desc">
          <Textarea
            id="cat-desc"
            value={description}
            maxLength={300}
            rows={2}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label={t('fields.prepStation')} htmlFor="cat-station">
          <Select
            id="cat-station"
            value={prepStation}
            onChange={(e) => setPrepStation(e.target.value as typeof prepStation)}
          >
            {(['kitchen', 'bar', 'none'] as const).map((s) => (
              <option key={s} value={s}>
                {tc(`prepStation.${s}`)}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset>
          <legend className="font-medium">{t('fields.menus')}</legend>
          {catalog.menus.map((m) => (
            <Checkbox
              key={m.id}
              label={m.name}
              checked={menuIds.includes(m.id)}
              onChange={(v) =>
                setMenuIds((ids) => (v ? [...ids, m.id] : ids.filter((x) => x !== m.id)))
              }
            />
          ))}
        </fieldset>
        <Checkbox label={t('fields.hidden')} checked={isHidden} onChange={setHidden} />
        <Checkbox label={t('fields.soldOut')} checked={isSoldOut} onChange={setSoldOut} />
        <FormFooter pending={save.pending} error={save.error} onDelete={onDelete} />
      </form>
    </Card>
  );
}

function ProductForm({
  shopSlug,
  timezone,
  mediaBase,
  catalog,
  product,
  defaultCategoryId,
  onSaved,
  onDelete,
}: {
  shopSlug: string;
  timezone: string;
  mediaBase: string;
  catalog: AdminCatalog;
  product: AdminCatalog['products'][number] | null;
  defaultCategoryId: string | null;
  onSaved: (id: string) => void;
  onDelete: (() => void) | null;
}) {
  const t = useTranslations('pro.catalog');
  const tc = useTranslations('common');
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product ? centsToInput(product.basePriceCents) : '');
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? defaultCategoryId ?? catalog.categories[0]?.id ?? '',
  );
  const [tags, setTags] = useState<ProductTag[]>(product?.tags ?? []);
  const [originInfo, setOrigin] = useState(product?.originInfo ?? '');
  const [isHidden, setHidden] = useState(product?.isHidden ?? false);
  const [isSoldOut, setSoldOut] = useState(product?.isSoldOut ?? false);
  const [groups, setGroups] = useState(product?.groups ?? []);
  const [template, setTemplate] = useState<'simple' | 'sizes' | 'compose'>('simple');
  const [priceError, setPriceError] = useState<string | null>(null);
  const save = useSave();
  const available = catalog.groups.filter((g) => !groups.some((l) => l.groupId === g.id));
  const groupName = (id: string) => {
    const g = catalog.groups.find((x) => x.id === id);
    return g ? (g.internalName ?? g.name) : '';
  };
  const intOrNull = (v: string) => (v.trim() === '' ? null : Math.max(0, Math.floor(Number(v))));

  return (
    <Card className="space-y-6">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const cents = parsePriceInput(price);
          if (cents === null) {
            setPriceError(t('invalidPrice'));
            return;
          }
          setPriceError(null);
          const bad = groups.find(
            (g) =>
              g.minOverride !== null && g.maxOverride !== null && g.minOverride > g.maxOverride,
          );
          if (bad) {
            save.setError(t('minGreaterThanMax'));
            return;
          }
          void save.run(
            () =>
              saveProductAction({
                shopSlug,
                id: product?.id ?? null,
                categoryId,
                name,
                description,
                basePriceCents: cents,
                tags,
                originInfo,
                isHidden,
                isSoldOut,
                groups,
                ...(product ? {} : { template }),
              }),
            onSaved,
          );
        }}
      >
        <h2 className="text-lg font-semibold">{product ? product.name : t('newProduct')}</h2>
        {!product && (
          <fieldset>
            <legend className="font-medium">{t('templates.title')}</legend>
            <div className="flex flex-wrap gap-2">
              {(['simple', 'sizes', 'compose'] as const).map((tp) => (
                <label
                  key={tp}
                  className={cn(
                    'flex min-h-12 items-center gap-2 rounded-lg border px-3',
                    template === tp ? 'border-fg' : 'border-line',
                  )}
                >
                  <input
                    type="radio"
                    name="template"
                    checked={template === tp}
                    onChange={() => setTemplate(tp)}
                  />
                  {t(`templates.${tp}`)}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <Field label={t('fields.name')} htmlFor="p-name">
          <Input
            id="p-name"
            value={name}
            maxLength={80}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label={t('fields.description')} htmlFor="p-desc">
          <Textarea
            id="p-desc"
            value={description}
            maxLength={500}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('fields.price')} htmlFor="p-price" error={priceError}>
            <Input
              id="p-price"
              inputMode="decimal"
              value={price}
              required
              placeholder="12,50"
              onChange={(e) => setPrice(e.target.value)}
            />
          </Field>
          <Field label={t('fields.category')} htmlFor="p-cat">
            <Select id="p-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {catalog.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <fieldset>
          <legend className="font-medium">{t('fields.tags')}</legend>
          <div className="flex flex-wrap gap-x-4">
            {PRODUCT_TAGS.map((tag) => (
              <Checkbox
                key={tag}
                label={tc(`tags.${tag}`)}
                checked={tags.includes(tag)}
                onChange={(v) => setTags((x) => (v ? [...x, tag] : x.filter((y) => y !== tag)))}
              />
            ))}
          </div>
        </fieldset>
        <Field label={t('fields.origin')} htmlFor="p-origin">
          <Input
            id="p-origin"
            value={originInfo}
            maxLength={200}
            onChange={(e) => setOrigin(e.target.value)}
          />
        </Field>
        <Checkbox label={t('fields.hidden')} checked={isHidden} onChange={setHidden} />
        <Checkbox label={t('fields.soldOut')} checked={isSoldOut} onChange={setSoldOut} />

        <fieldset className="space-y-2">
          <legend className="font-medium">{t('fields.groups')}</legend>
          {groups.length === 0 && <p className="text-muted text-sm">{t('noLinkedGroups')}</p>}
          {groups.map((g, i) => (
            <div key={g.groupId} className="border-line space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{groupName(g.groupId)}</span>
                <span className="flex gap-1">
                  <MoveButtons
                    name={groupName(g.groupId)}
                    onUp={() =>
                      i > 0 &&
                      setGroups((x) =>
                        x.map((y, j) => (j === i - 1 ? x[i]! : j === i ? x[i - 1]! : y)),
                      )
                    }
                    onDown={() =>
                      i < groups.length - 1 &&
                      setGroups((x) =>
                        x.map((y, j) => (j === i + 1 ? x[i]! : j === i ? x[i + 1]! : y)),
                      )
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('removeGroup')}
                    onClick={() => setGroups((x) => x.filter((y) => y.groupId !== g.groupId))}
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </Button>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t('fields.minOverride')} htmlFor={`min-${g.groupId}`}>
                  <Input
                    id={`min-${g.groupId}`}
                    inputMode="numeric"
                    value={g.minOverride ?? ''}
                    onChange={(e) =>
                      setGroups((x) =>
                        x.map((y) =>
                          y.groupId === g.groupId
                            ? { ...y, minOverride: intOrNull(e.target.value) }
                            : y,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label={t('fields.maxOverride')} htmlFor={`max-${g.groupId}`}>
                  <Input
                    id={`max-${g.groupId}`}
                    inputMode="numeric"
                    value={g.maxOverride ?? ''}
                    onChange={(e) => {
                      const v = intOrNull(e.target.value);
                      setGroups((x) =>
                        x.map((y) =>
                          y.groupId === g.groupId ? { ...y, maxOverride: v === 0 ? null : v } : y,
                        ),
                      );
                    }}
                  />
                </Field>
              </div>
            </div>
          ))}
          {available.length > 0 && (
            <Select
              aria-label={t('addGroup')}
              value=""
              onChange={(e) =>
                e.target.value &&
                setGroups((x) => [
                  ...x,
                  { groupId: e.target.value, minOverride: null, maxOverride: null },
                ])
              }
            >
              <option value="">{t('addGroup')}</option>
              {available.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.internalName ?? g.name}
                </option>
              ))}
            </Select>
          )}
        </fieldset>
        <FormFooter pending={save.pending} error={save.error} onDelete={onDelete} />
      </form>

      {product ? (
        <>
          <section className="border-line space-y-2 border-t pt-4">
            <h3 className="font-semibold">{t('fields.photo')}</h3>
            <PhotoUpload
              shopSlug={shopSlug}
              productId={product.id}
              imageUrl={product.imagePath ? `${mediaBase}/${product.imagePath}-400.webp` : null}
              onChanged={() => router.refresh()}
            />
          </section>
          <section className="border-line border-t pt-4">
            <AllergenGrid
              key={product.allergensDeclaredAt ?? 'never'}
              shopSlug={shopSlug}
              kind="product"
              id={product.id}
              declaredAt={product.allergensDeclaredAt}
              initial={product.allergens}
              timezone={timezone}
              onSaved={() => router.refresh()}
            />
          </section>
        </>
      ) : (
        <p className="text-muted text-sm">{t('saveFirst')}</p>
      )}
    </Card>
  );
}

function GroupForm({
  shopSlug,
  timezone,
  catalog,
  group,
  onSaved,
  onDelete,
  onDeleteOption,
}: {
  shopSlug: string;
  timezone: string;
  catalog: AdminCatalog;
  group: AdminCatalog['groups'][number] | null;
  onSaved: (id: string) => void;
  onDelete: (() => void) | null;
  onDeleteOption: (id: string, name: string) => void;
}) {
  const t = useTranslations('pro.catalog');
  const [name, setName] = useState(group?.name ?? '');
  const [internalName, setInternalName] = useState(group?.internalName ?? '');
  const [minSelect, setMin] = useState(String(group?.minSelect ?? 0));
  const [maxSelect, setMax] = useState(
    group?.maxSelect === null || group?.maxSelect === undefined
      ? group
        ? ''
        : '1'
      : String(group.maxSelect),
  );
  const [allowQuantity, setAllowQuantity] = useState(group?.allowQuantity ?? false);
  const [maxPerOption, setMaxPerOption] = useState(String(group?.maxPerOption ?? 1));
  const [isHidden, setHidden] = useState(group?.isHidden ?? false);
  const save = useSave();
  const usedBy = group
    ? catalog.products.filter((p) => p.groups.some((l) => l.groupId === group.id))
    : [];

  return (
    <Card className="space-y-6">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const min = Number(minSelect);
          const max = maxSelect.trim() === '' ? null : Number(maxSelect);
          if (max !== null && min > max) {
            save.setError(t('minGreaterThanMax'));
            return;
          }
          void save.run(
            () =>
              saveGroupAction({
                shopSlug,
                id: group?.id ?? null,
                name,
                internalName,
                minSelect: min,
                maxSelect: max,
                allowQuantity,
                maxPerOption: allowQuantity ? Number(maxPerOption) : 1,
                isHidden,
              }),
            onSaved,
          );
        }}
      >
        <h2 className="text-lg font-semibold">
          {group ? (group.internalName ?? group.name) : t('newGroup')}
        </h2>
        {group && (
          <p className="text-muted text-sm">
            {t('usedBy', { count: usedBy.length })}
            {usedBy.length > 0 && ` : ${usedBy.map((p) => p.name).join(', ')}`}
          </p>
        )}
        <Field label={t('fields.name')} htmlFor="g-name">
          <Input
            id="g-name"
            value={name}
            maxLength={60}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label={t('fields.internalName')} htmlFor="g-internal">
          <Input
            id="g-internal"
            value={internalName}
            maxLength={60}
            onChange={(e) => setInternalName(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t('fields.min')} htmlFor="g-min">
            <Input
              id="g-min"
              type="number"
              min={0}
              max={50}
              value={minSelect}
              onChange={(e) => setMin(e.target.value)}
            />
          </Field>
          <Field label={t('fields.max')} htmlFor="g-max">
            <Input
              id="g-max"
              type="number"
              min={1}
              max={50}
              value={maxSelect}
              onChange={(e) => setMax(e.target.value)}
            />
          </Field>
        </div>
        <Checkbox
          label={t('fields.allowQuantity')}
          checked={allowQuantity}
          onChange={setAllowQuantity}
        />
        {allowQuantity && (
          <Field label={t('fields.maxPerOption')} htmlFor="g-mpo">
            <Input
              id="g-mpo"
              type="number"
              min={1}
              max={20}
              value={maxPerOption}
              onChange={(e) => setMaxPerOption(e.target.value)}
            />
          </Field>
        )}
        <Checkbox label={t('fields.hidden')} checked={isHidden} onChange={setHidden} />
        <FormFooter pending={save.pending} error={save.error} onDelete={onDelete} />
      </form>

      {group ? (
        <section className="border-line space-y-3 border-t pt-4">
          <h3 className="font-semibold">{t('options')}</h3>
          {group.options.map((o) => (
            <OptionRow
              key={o.id}
              shopSlug={shopSlug}
              timezone={timezone}
              groupId={group.id}
              option={o}
              onDelete={() => onDeleteOption(o.id, o.name)}
            />
          ))}
          <OptionRow
            key={`new-${group.options.length}`}
            shopSlug={shopSlug}
            timezone={timezone}
            groupId={group.id}
            option={null}
            onDelete={null}
          />
        </section>
      ) : (
        <p className="text-muted text-sm">{t('saveGroupFirst')}</p>
      )}
    </Card>
  );
}

function OptionRow({
  shopSlug,
  timezone,
  groupId,
  option,
  onDelete,
}: {
  shopSlug: string;
  timezone: string;
  groupId: string;
  option: AdminCatalog['groups'][number]['options'][number] | null;
  onDelete: (() => void) | null;
}) {
  const t = useTranslations('pro.catalog');
  const tc = useTranslations('common');
  const router = useRouter();
  const [name, setName] = useState(option?.name ?? '');
  const [delta, setDelta] = useState(option ? centsToInput(option.priceDeltaCents) : '0');
  const [isDefault, setDefault] = useState(option?.isDefault ?? false);
  const [isHidden, setHidden] = useState(option?.isHidden ?? false);
  const [isSoldOut, setSoldOut] = useState(option?.isSoldOut ?? false);
  const [showAllergens, setShowAllergens] = useState(false);
  const save = useSave();
  const id = option?.id ?? `new-${groupId}`;

  return (
    <div
      className={cn(
        'space-y-2 rounded-lg border p-3',
        option ? 'border-line' : 'border-line border-dashed',
      )}
    >
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const cents = parsePriceInput(delta || '0');
          if (cents === null) {
            save.setError(t('invalidPrice'));
            return;
          }
          void save.run(
            () =>
              saveOptionAction({
                shopSlug,
                id: option?.id ?? null,
                groupId,
                name,
                priceDeltaCents: cents,
                isDefault,
                isHidden,
                isSoldOut,
              }),
            () => {
              if (!option) {
                setName('');
                setDelta('0');
              }
              router.refresh();
            },
          );
        }}
      >
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <Field label={option ? t('fields.name') : t('newOption')} htmlFor={`o-name-${id}`}>
            <Input
              id={`o-name-${id}`}
              value={name}
              maxLength={60}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label={t('fields.priceDelta')} htmlFor={`o-delta-${id}`}>
            <Input
              id={`o-delta-${id}`}
              inputMode="decimal"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-x-4">
          <Checkbox label={t('fields.isDefault')} checked={isDefault} onChange={setDefault} />
          <Checkbox label={t('hidden')} checked={isHidden} onChange={setHidden} />
          <Checkbox label={t('soldOut')} checked={isSoldOut} onChange={setSoldOut} />
        </div>
        {save.error && <Alert tone="danger">{save.error}</Alert>}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={save.pending}>
            {option ? tc('save') : tc('add')}
          </Button>
          {option && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowAllergens((v) => !v)}
                aria-expanded={showAllergens}
              >
                {t('allergens.title')}
                {!option.allergensDeclaredAt && ' ⚠'}
              </Button>
              {onDelete && (
                <Button size="sm" variant="ghost" onClick={onDelete}>
                  <Trash2 aria-hidden className="h-4 w-4" /> {tc('delete')}
                </Button>
              )}
            </>
          )}
        </div>
      </form>
      {option && showAllergens && (
        <AllergenGrid
          key={option.allergensDeclaredAt ?? 'never'}
          shopSlug={shopSlug}
          kind="option"
          id={option.id}
          declaredAt={option.allergensDeclaredAt}
          initial={option.allergens}
          timezone={timezone}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
