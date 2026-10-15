'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import QRCode from 'qrcode';
import { Download, Link2, Nfc, Plus, Printer, RefreshCw, Trash2 } from 'lucide-react';
import {
  createTableAction,
  createTablesBatchAction,
  deleteTableAction,
  rotateTableTokenAction,
  updateTableAction,
} from '@/features/tables/actions';
import { Alert, Button, Card, Field, Input, Select } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';
import type { ActionResult } from '@/lib/result';

export type TableAdmin = {
  id: string;
  label: string;
  zone: string | null;
  seats: number | null;
  isActive: boolean;
  url: string | null;
  nfcUrl: string | null;
};

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase();

function download(name: string, href: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  a.click();
}

/** Tables and QR codes (TAB-01 to TAB-03). */
export function TablesAdminView({
  shopSlug,
  shopName,
  tables,
  hasDomain,
}: {
  shopSlug: string;
  shopName: string;
  tables: TableAdmin[];
  hasDomain: boolean;
}) {
  const t = useTranslations('pro.tablesAdmin');
  const tc = useTranslations('common');
  const te = useTranslations('errors');
  const router = useRouter();
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showNfc, setShowNfc] = useState(false);
  const [format, setFormat] = useState<'tent' | 'labels6' | 'labels12'>('tent');
  const [checked, setChecked] = useState<string[]>([]);
  const table = tables.find((x) => x.id === selected) ?? null;

  const report = (res: ActionResult<unknown>, success?: string) => {
    if (!res.ok) setMessage({ tone: 'danger', text: te(res.code) });
    else {
      if (success) setMessage({ tone: 'success', text: success });
      router.refresh();
    }
  };

  const printIds = checked.length > 0 ? checked : tables.filter((x) => x.isActive).map((x) => x.id);

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      {!hasDomain && <Alert tone="warning">{t('noDomain')}</Alert>}
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <div className="grid gap-4 lg:grid-cols-2">
        <SingleForm shopSlug={shopSlug} onDone={(res) => report(res, t('created', { count: 1 }))} />
        <BatchForm
          shopSlug={shopSlug}
          onDone={(res, count) => report(res, t('created', { count }))}
        />
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <Field label={t('sheetFormat')} htmlFor="sheet-format">
            <Select
              id="sheet-format"
              value={format}
              onChange={(e) => setFormat(e.target.value as typeof format)}
              className="w-64"
            >
              <option value="tent">{t('tent')}</option>
              <option value="labels6">{t('labels6')}</option>
              <option value="labels12">{t('labels12')}</option>
            </Select>
          </Field>
          <Button
            variant="secondary"
            disabled={printIds.length === 0 || !hasDomain}
            onClick={() =>
              window.open(
                `/${shopSlug}/tables/impression?format=${format}&ids=${printIds.join(',')}`,
                '_blank',
                'noopener',
              )
            }
          >
            <Printer aria-hidden className="h-4 w-4" /> {t('sheet')} ({printIds.length})
          </Button>
          <Button variant="ghost" onClick={() => setShowNfc((v) => !v)} aria-expanded={showNfc}>
            <Nfc aria-hidden className="h-4 w-4" /> {t('nfcHelp')}
          </Button>
        </div>
        {showNfc && (
          <section className="bg-brand-soft rounded-lg p-3">
            <h2 className="font-semibold">{t('nfcTitle')}</h2>
            <ol className="ml-5 list-decimal space-y-1 text-sm">
              {(['nfc1', 'nfc2', 'nfc3', 'nfc4', 'nfc5', 'nfc6'] as const).map((k) => (
                <li key={k}>{t(k)}</li>
              ))}
            </ol>
          </section>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-muted text-sm">
              <tr>
                <th className="w-10 p-2">
                  <input
                    type="checkbox"
                    aria-label={t('selectAll')}
                    className="h-5 w-5"
                    checked={checked.length === tables.length && tables.length > 0}
                    onChange={(e) => setChecked(e.target.checked ? tables.map((x) => x.id) : [])}
                  />
                </th>
                <th className="p-2">{t('label')}</th>
                <th className="p-2">{t('zone')}</th>
                <th className="p-2">{t('seats')}</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {tables.map((row) => (
                <tr
                  key={row.id}
                  className={cn('border-line border-t', !row.isActive && 'text-muted')}
                >
                  <td className="p-2">
                    <input
                      type="checkbox"
                      aria-label={row.label}
                      className="h-5 w-5"
                      checked={checked.includes(row.id)}
                      onChange={(e) =>
                        setChecked((x) =>
                          e.target.checked ? [...x, row.id] : x.filter((y) => y !== row.id),
                        )
                      }
                    />
                  </td>
                  <td className="p-2 font-medium">
                    {row.label}
                    {!row.isActive && <span className="ml-2 text-xs">({t('inactive')})</span>}
                  </td>
                  <td className="p-2">{row.zone ?? '—'}</td>
                  <td className="p-2">{row.seats ?? '—'}</td>
                  <td className="p-2 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setSelected(row.id === selected ? null : row.id)}
                      aria-expanded={row.id === selected}
                    >
                      {tc('edit')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {table && (
        <TableDetail
          key={table.id}
          shopName={shopName}
          table={table}
          onUpdate={async (patch) =>
            report(
              await updateTableAction({
                shopSlug,
                id: table.id,
                label: table.label,
                zone: table.zone,
                seats: table.seats,
                isActive: table.isActive,
                ...patch,
              }),
              tc('saved'),
            )
          }
          onRotate={async () => {
            if (!window.confirm(t('regenerateConfirm', { table: table.label }))) return;
            report(await rotateTableTokenAction(shopSlug, table.id), t('regenerated'));
          }}
          onDelete={async () => {
            if (!window.confirm(t('deleteConfirm', { table: table.label }))) return;
            const res = await deleteTableAction(shopSlug, table.id);
            if (res.ok) setSelected(null);
            report(res);
          }}
        />
      )}
    </div>
  );
}

function SingleForm({
  shopSlug,
  onDone,
}: {
  shopSlug: string;
  onDone: (res: ActionResult<number>) => void;
}) {
  const t = useTranslations('pro.tablesAdmin');
  const [label, setLabel] = useState('');
  const [zone, setZone] = useState('');
  const [seats, setSeats] = useState('');
  const [pending, setPending] = useState(false);
  return (
    <Card>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          const res = await createTableAction({
            shopSlug,
            label,
            zone,
            seats: seats ? Number(seats) : null,
          });
          setPending(false);
          if (res.ok) setLabel('');
          onDone(res);
        }}
      >
        <h2 className="font-semibold">{t('newTable')}</h2>
        <Field label={t('label')} htmlFor="t-label">
          <Input
            id="t-label"
            value={label}
            maxLength={40}
            required
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Terrasse 4"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t('zone')} htmlFor="t-zone">
            <Input
              id="t-zone"
              value={zone}
              maxLength={40}
              onChange={(e) => setZone(e.target.value)}
            />
          </Field>
          <Field label={t('seats')} htmlFor="t-seats">
            <Input
              id="t-seats"
              type="number"
              min={1}
              max={100}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
          </Field>
        </div>
        <Button type="submit" disabled={pending}>
          <Plus aria-hidden className="h-4 w-4" /> {t('create')}
        </Button>
      </form>
    </Card>
  );
}

function BatchForm({
  shopSlug,
  onDone,
}: {
  shopSlug: string;
  onDone: (res: ActionResult<number>, count: number) => void;
}) {
  const t = useTranslations('pro.tablesAdmin');
  const [prefix, setPrefix] = useState('Table');
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState('10');
  const [zone, setZone] = useState('');
  const [pending, setPending] = useState(false);
  const count = Math.max(0, Number(to) - Number(from) + 1);
  return (
    <Card>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          const res = await createTablesBatchAction({
            shopSlug,
            prefix,
            from: Number(from),
            to: Number(to),
            zone,
            seats: null,
          });
          setPending(false);
          onDone(res, count);
        }}
      >
        <h2 className="font-semibold">{t('batch')}</h2>
        <div className="grid grid-cols-3 gap-2">
          <Field label={t('prefix')} htmlFor="b-prefix">
            <Input
              id="b-prefix"
              value={prefix}
              maxLength={30}
              onChange={(e) => setPrefix(e.target.value)}
            />
          </Field>
          <Field label={t('fromNumber')} htmlFor="b-from">
            <Input
              id="b-from"
              type="number"
              min={0}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label={t('toNumber')} htmlFor="b-to">
            <Input
              id="b-to"
              type="number"
              min={0}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>
        <Field label={t('zone')} htmlFor="b-zone">
          <Input
            id="b-zone"
            value={zone}
            maxLength={40}
            onChange={(e) => setZone(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={pending || count < 1 || count > 200}>
          <Plus aria-hidden className="h-4 w-4" /> {t('createCount', { count })}
        </Button>
      </form>
    </Card>
  );
}

function TableDetail({
  shopName,
  table,
  onUpdate,
  onRotate,
  onDelete,
}: {
  shopName: string;
  table: TableAdmin;
  onUpdate: (
    patch: Partial<Pick<TableAdmin, 'label' | 'zone' | 'seats' | 'isActive'>>,
  ) => Promise<void>;
  onRotate: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const t = useTranslations('pro.tablesAdmin');
  const tc = useTranslations('common');
  const [label, setLabel] = useState(table.label);
  const [zone, setZone] = useState(table.zone ?? '');
  const [seats, setSeats] = useState(table.seats ? String(table.seats) : '');
  const [svg, setSvg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!table.url) return;
    let cancelled = false;
    void QRCode.toString(table.url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' }).then(
      (s) => !cancelled && setSvg(s),
    );
    return () => {
      cancelled = true;
    };
  }, [table.url]);

  const fileBase = `qr-${slugify(shopName)}-${slugify(table.label)}`;
  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value).catch(() => null);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="grid gap-6 md:grid-cols-[16rem_minmax(0,1fr)]" aria-label={table.label}>
      <div className="space-y-2">
        {svg ? (
          <div
            className="rounded-lg bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
            role="img"
            aria-label={t('qrOf', { table: table.label })}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="bg-line aspect-square rounded-lg" />
        )}
        {table.url && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={!svg}
              onClick={() =>
                svg &&
                download(
                  `${fileBase}.svg`,
                  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
                )
              }
            >
              <Download aria-hidden className="h-4 w-4" /> {t('downloadSvg')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () =>
                download(
                  `${fileBase}.png`,
                  await QRCode.toDataURL(table.url!, {
                    width: 1024,
                    margin: 2,
                    errorCorrectionLevel: 'M',
                  }),
                )
              }
            >
              <Download aria-hidden className="h-4 w-4" /> {t('downloadPng')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => copy(table.url!, 'qr')}>
              <Link2 aria-hidden className="h-4 w-4" />{' '}
              {copied === 'qr' ? t('copied') : t('copyLink')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => copy(table.nfcUrl!, 'nfc')}>
              <Nfc aria-hidden className="h-4 w-4" />{' '}
              {copied === 'nfc' ? t('copied') : t('copyNfcLink')}
            </Button>
          </div>
        )}
      </div>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void onUpdate({ label, zone: zone || null, seats: seats ? Number(seats) : null });
        }}
      >
        <h2 className="text-lg font-semibold">{table.label}</h2>
        <Field label={t('label')} htmlFor="d-label">
          <Input
            id="d-label"
            value={label}
            maxLength={40}
            required
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t('zone')} htmlFor="d-zone">
            <Input
              id="d-zone"
              value={zone}
              maxLength={40}
              onChange={(e) => setZone(e.target.value)}
            />
          </Field>
          <Field label={t('seats')} htmlFor="d-seats">
            <Input
              id="d-seats"
              type="number"
              min={1}
              max={100}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">{tc('save')}</Button>
          <Button variant="secondary" onClick={() => void onUpdate({ isActive: !table.isActive })}>
            {table.isActive ? t('deactivate') : t('activate')}
          </Button>
          <Button variant="secondary" onClick={() => void onRotate()}>
            <RefreshCw aria-hidden className="h-4 w-4" /> {t('regenerate')}
          </Button>
          <Button variant="ghost" onClick={() => void onDelete()}>
            <Trash2 aria-hidden className="h-4 w-4" /> {tc('delete')}
          </Button>
        </div>
        <p className="text-muted text-sm">{t('regenerateHelp')}</p>
      </form>
    </Card>
  );
}
