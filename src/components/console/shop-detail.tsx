'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  addDomainAction,
  checkDomainAction,
  consoleRevokeDeviceAction,
  inviteOwnerAction,
  markDomainVerifiedAction,
  removeDomainAction,
  resendInviteAction,
  resetOwnerMfaAction,
  saveBillingAction,
  setPrimaryDomainAction,
  setShopFeaturesAction,
  setShopStatusAction,
} from '@/features/console/actions';
import { BILLING_STATUSES, FEATURES, SHOP_STATUSES } from '@/features/console/constants';
import type { ConsoleShop } from '@/features/console/queries';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '@/components/ui/primitives';
import { centsToInput, parsePriceInput } from '@/lib/money';
import type { ActionResult } from '@/lib/result';
import { cn } from '@/lib/cn';

type Message = { tone: 'success' | 'danger'; text: string } | null;

/** Shop detail in the console (CON-03 to CON-06). */
export function ShopDetail({
  data,
  siteUrl,
  vercel,
  formatDate,
}: {
  data: ConsoleShop;
  siteUrl: string | null;
  vercel: boolean;
  formatDate: Record<string, string>;
}) {
  const t = useTranslations('console');
  const te = useTranslations('errors');
  const tc = useTranslations('common');
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const { shop } = data;

  async function run(res: Promise<ActionResult<unknown>>, success?: string) {
    const r = await res;
    if (!r.ok) setMessage({ tone: 'danger', text: te(r.code) });
    else {
      setMessage(success ? { tone: 'success', text: success } : null);
      router.refresh();
    }
    return r.ok;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{shop.name}</h1>
        <span className="bg-brand-soft rounded px-2 py-0.5 text-sm font-semibold">
          {t(`status.${shop.status}`)}
        </span>
        <span className="text-muted text-sm">
          {t(`businessType.${shop.businessType as 'other'}`)} · {shop.timezone}
        </span>
        <div className="ml-auto flex gap-2">
          {siteUrl && (
            <a
              href={siteUrl}
              target="_blank"
              rel="noreferrer"
              className="border-line flex min-h-12 items-center rounded-lg border px-3 font-medium"
            >
              {t('detail.openSite')}
            </a>
          )}
          <a
            href={`/api/console/export/${shop.id}`}
            className="border-line flex min-h-12 items-center rounded-lg border px-3 font-medium"
          >
            {t('detail.export')}
          </a>
          <a
            href={`/api/console/export/${shop.id}?format=csv`}
            className="border-line flex min-h-12 items-center rounded-lg border px-3 font-medium"
          >
            {t('detail.exportCsv')}
          </a>
        </div>
      </div>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">{t('detail.statusTitle')}</h2>
          <p className="text-muted text-sm">{t('detail.statusHelp')}</p>
          <div className="flex flex-wrap gap-2">
            {SHOP_STATUSES.filter((s) => s !== shop.status).map((s) => (
              <Button
                key={s}
                variant={s === 'archived' ? 'danger' : s === 'active' ? 'primary' : 'secondary'}
                onClick={async () => {
                  if (s === 'archived') {
                    const typed = window.prompt(t('detail.archiveConfirm', { shop: shop.name }));
                    if (typed?.trim() !== shop.name) return;
                  } else if (
                    !window.confirm(
                      t('detail.statusConfirm', { shop: shop.name, status: t(`status.${s}`) }),
                    )
                  )
                    return;
                  await run(setShopStatusAction(shop.id, s), tc('saved'));
                }}
              >
                {t('detail.setStatus', { status: t(`status.${s}`) })}
              </Button>
            ))}
          </div>
          <fieldset className="border-line border-t pt-3">
            <legend className="font-medium">{t('detail.features')}</legend>
            {FEATURES.map((f) => (
              <label key={f} className="flex min-h-12 items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={shop.features.includes(f)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...shop.features, f]
                      : shop.features.filter((x) => x !== f);
                    void run(setShopFeaturesAction(shop.id, next));
                  }}
                />
                {t(`detail.featureNames.${f}`)}
              </label>
            ))}
          </fieldset>
        </Card>

        <BillingCard shopId={shop.id} billing={data.billing} onSave={(p) => run(p, tc('saved'))} />
      </div>

      <DomainsCard shopId={shop.id} domains={data.domains} vercel={vercel} run={run} />

      <div className="grid gap-4 lg:grid-cols-2">
        <OwnersCard shopId={shop.id} owners={data.owners} formatDate={formatDate} run={run} />
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">{t('detail.devices')}</h2>
          {data.devices.length === 0 ? (
            <p className="text-muted">{t('detail.noDevices')}</p>
          ) : (
            <ul className="space-y-2">
              {data.devices.map((d) => (
                <li
                  key={d.id}
                  className="border-line flex items-center justify-between gap-2 border-b pb-2"
                >
                  <span>
                    <span className="font-medium">{d.name}</span>
                    <span className="text-muted block text-xs">
                      {formatDate[d.lastSeenAt ?? d.enrolledAt]}
                    </span>
                  </span>
                  {d.revokedAt ? (
                    <span className="text-muted text-sm">{t('detail.revoked')}</span>
                  ) : (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() =>
                        window.confirm(t('detail.revokeConfirm', { name: d.name })) &&
                        void run(consoleRevokeDeviceAction(d.id), t('detail.revoked'))
                      }
                    >
                      {t('detail.revokeDevice')}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('detail.recentAudit')}</h2>
          <a href={`/journal?shop=${shop.id}`} className="font-medium underline">
            {t('detail.seeAudit')}
          </a>
        </div>
        <ul className="text-sm">
          {data.audit.map((a) => (
            <li key={a.id} className="border-line flex gap-3 border-t py-1">
              <span className="text-muted w-40 shrink-0">{formatDate[a.createdAt]}</span>
              <span className="w-24 shrink-0">
                {t(`audit.actorKind.${a.actorKind as 'system'}`)}
              </span>
              <code>{a.action}</code>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function BillingCard({
  shopId,
  billing,
  onSave,
}: {
  shopId: string;
  billing: ConsoleShop['billing'];
  onSave: (p: Promise<ActionResult<unknown>>) => Promise<boolean>;
}) {
  const t = useTranslations('console');
  const tc = useTranslations('common');
  const [setupFee, setSetupFee] = useState(
    billing?.setupFeeCents != null ? centsToInput(billing.setupFeeCents) : '',
  );
  const [setupPaidAt, setSetupPaidAt] = useState(billing?.setupPaidAt ?? '');
  const [monthly, setMonthly] = useState(
    billing?.monthlyFeeCents != null ? centsToInput(billing.monthlyFeeCents) : '',
  );
  const [status, setStatus] = useState(billing?.status ?? 'trial');
  const [nextDueOn, setNextDueOn] = useState(billing?.nextDueOn ?? '');
  const [notes, setNotes] = useState(billing?.notes ?? '');
  const [invalid, setInvalid] = useState(false);
  const money = (v: string) => (v.trim() === '' ? null : parsePriceInput(v));
  return (
    <Card>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          const fee = money(setupFee);
          const month = money(monthly);
          if ((setupFee.trim() && fee === null) || (monthly.trim() && month === null))
            return setInvalid(true);
          setInvalid(false);
          void onSave(
            saveBillingAction({
              shopId,
              setupFeeCents: fee,
              setupPaidAt: setupPaidAt || null,
              monthlyFeeCents: month,
              status,
              nextDueOn: nextDueOn || null,
              notes,
            }),
          );
        }}
      >
        <h2 className="text-lg font-semibold">{t('detail.billing')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('detail.setupFee')} htmlFor="b-setup">
            <Input
              id="b-setup"
              inputMode="decimal"
              value={setupFee}
              onChange={(e) => setSetupFee(e.target.value)}
            />
          </Field>
          <Field label={t('detail.setupPaidAt')} htmlFor="b-paid">
            <Input
              id="b-paid"
              type="date"
              value={setupPaidAt}
              onChange={(e) => setSetupPaidAt(e.target.value)}
            />
          </Field>
          <Field label={t('detail.monthlyFee')} htmlFor="b-month">
            <Input
              id="b-month"
              inputMode="decimal"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
          </Field>
          <Field label={t('detail.nextDueOn')} htmlFor="b-due">
            <Input
              id="b-due"
              type="date"
              value={nextDueOn}
              onChange={(e) => setNextDueOn(e.target.value)}
            />
          </Field>
          <Field label={t('detail.billingStatus')} htmlFor="b-status">
            <Select
              id="b-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              {BILLING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`billingStatus.${s}`)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={t('detail.notes')} htmlFor="b-notes">
          <Textarea
            id="b-notes"
            rows={3}
            maxLength={2000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        {invalid && <Alert tone="danger">{tc('required')}</Alert>}
        <Button type="submit">{tc('save')}</Button>
      </form>
    </Card>
  );
}

function DomainsCard({
  shopId,
  domains,
  vercel,
  run,
}: {
  shopId: string;
  domains: ConsoleShop['domains'];
  vercel: boolean;
  run: (p: Promise<ActionResult<unknown>>, success?: string) => Promise<boolean>;
}) {
  const t = useTranslations('console.detail');
  const [hostname, setHostname] = useState('');
  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold">{t('domains')}</h2>
      <p className="text-muted text-sm">{t('primaryHelp')}</p>
      {!vercel && <Alert tone="info">{t('noVercel')}</Alert>}
      <ul className="space-y-3">
        {domains.map((d) => (
          <li key={d.id} className="border-line space-y-2 rounded-lg border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{d.hostname}</span>
              <span className="text-muted text-xs">
                {d.kind === 'platform' ? t('domainPlatform') : t('domainCustom')}
              </span>
              {d.isPrimary && (
                <span className="bg-brand text-brand-fg rounded px-2 text-xs font-semibold">
                  {t('primary')}
                </span>
              )}
              <span
                className={cn(
                  'rounded px-2 text-xs font-semibold',
                  d.verifiedAt ? 'bg-st-ready-soft' : 'bg-st-warning-soft',
                )}
              >
                {d.verifiedAt ? t('verified') : t('pending')}
              </span>
              <span className="ml-auto flex flex-wrap gap-2">
                {!d.isPrimary && d.verifiedAt && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void run(setPrimaryDomainAction(d.id))}
                  >
                    {t('makePrimary')}
                  </Button>
                )}
                {d.kind === 'custom' && !d.verifiedAt && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void run(vercel ? checkDomainAction(d.id) : markDomainVerifiedAction(d.id))
                    }
                  >
                    {vercel ? t('check') : t('markVerified')}
                  </Button>
                )}
                {d.kind === 'custom' && !d.isPrimary && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      window.confirm(t('removeConfirm', { domain: d.hostname })) &&
                      void run(removeDomainAction(d.id))
                    }
                  >
                    {t('remove')}
                  </Button>
                )}
              </span>
            </div>
            {!d.verifiedAt && d.state && d.state.instructions.length > 0 && (
              <div className="text-sm">
                <p>{t('dnsInstructions')}</p>
                <ul className="font-mono text-xs">
                  {d.state.instructions.map((i, k) => (
                    <li key={k}>
                      {i.type} {i.name} → {i.value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(addDomainAction(shopId, hostname))) setHostname('');
        }}
      >
        <Field label={t('addDomain')} htmlFor="d-host">
          <Input
            id="d-host"
            value={hostname}
            required
            placeholder={t('domainPlaceholder')}
            onChange={(e) => setHostname(e.target.value)}
            className="w-80"
          />
        </Field>
        <Button type="submit">{t('addDomain')}</Button>
      </form>
    </Card>
  );
}

function OwnersCard({
  shopId,
  owners,
  formatDate,
  run,
}: {
  shopId: string;
  owners: ConsoleShop['owners'];
  formatDate: Record<string, string>;
  run: (p: Promise<ActionResult<unknown>>, success?: string) => Promise<boolean>;
}) {
  const t = useTranslations('console.detail');
  const tc = useTranslations('console.create');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-semibold">{t('owners')}</h2>
      <ul className="space-y-3">
        {owners.map((o) => (
          <li key={o.memberId} className="border-line space-y-2 border-b pb-3">
            <p>
              <span className="font-semibold">{o.name}</span>{' '}
              <span className="text-muted">{o.email}</span>
            </p>
            <p className="text-muted text-sm">
              {o.lastSignInAt
                ? t('lastSignIn', { date: formatDate[o.lastSignInAt] ?? '' })
                : t('neverSignedIn')}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void run(resendInviteAction(o.memberId), t('inviteSent'))}
              >
                {t('resendInvite')}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  const reason = window.prompt(t('resetMfaReason'));
                  if (!reason || reason.trim().length < 5) return;
                  const res = await resetOwnerMfaAction(o.memberId, reason);
                  await run(
                    Promise.resolve(res),
                    res.ok ? t('resetMfaDone', { count: res.value }) : undefined,
                  );
                }}
              >
                {t('resetMfa')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(inviteOwnerAction(shopId, email, name), t('inviteSent'))) {
            setEmail('');
            setName('');
          }
        }}
      >
        <h3 className="font-medium">{t('inviteOwner')}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label={tc('ownerEmail')} htmlFor="o-email">
            <Input
              id="o-email"
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label={tc('ownerName')} htmlFor="o-name">
            <Input
              id="o-name"
              value={name}
              maxLength={40}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        </div>
        <Button type="submit" variant="secondary">
          {t('inviteOwner')}
        </Button>
      </form>
    </Card>
  );
}
