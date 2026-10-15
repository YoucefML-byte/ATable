'use client';

import { useActionState, useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  forgotPasswordAction,
  setPasswordAction,
  signInAction,
  startEnrollAction,
  verifyMfaAction,
  type FormState,
} from '@/features/auth/actions';
import { Alert, Button, Field, Input } from '@/components/ui/primitives';

const initial: FormState = { error: null };

/** Full navigation (through proxy.ts) once an action asks for it. */
function useRedirect(state: FormState) {
  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state]);
}

export function LoginForm({ showStaffLink }: { showStaffLink: boolean }) {
  const t = useTranslations('pro.login');
  const te = useTranslations('errors');
  const [state, action, pending] = useActionState(signInAction, initial);
  useRedirect(state);
  const emailId = useId();
  const passwordId = useId();
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <Alert tone="danger">{te('BAD_CREDENTIALS')}</Alert>}
      <Field label={t('email')} htmlFor={emailId}>
        <Input id={emailId} name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label={t('password')} htmlFor={passwordId}>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t('submitting') : t('submit')}
      </Button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/mot-de-passe-oublie" className="underline">
          {t('forgot')}
        </Link>
        {showStaffLink && (
          <Link href="/equipe" className="underline">
            {t('staffLink')}
          </Link>
        )}
      </div>
    </form>
  );
}

function CodeField({ factorId }: { factorId?: string }) {
  const t = useTranslations('pro.mfa');
  const id = useId();
  return (
    <>
      {factorId && <input type="hidden" name="factorId" value={factorId} />}
      <Field label={t('code')} htmlFor={id}>
        <Input
          id={id}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          className="tabular text-center text-2xl tracking-[0.4em]"
          autoFocus
        />
      </Field>
    </>
  );
}

function MfaError({ state }: { state: FormState }) {
  const t = useTranslations('pro.mfa');
  if (!state.error) return null;
  return (
    <Alert tone="danger">
      {state.error === 'WAIT' ? t('wait', { seconds: state.waitSeconds ?? 0 }) : t('badCode')}
    </Alert>
  );
}

export function MfaVerifyForm() {
  const t = useTranslations('pro.mfa');
  const [state, action, pending] = useActionState(verifyMfaAction, initial);
  useRedirect(state);
  return (
    <form action={action} className="space-y-4">
      <p>{t('verifyIntro')}</p>
      <MfaError state={state} />
      <CodeField />
      <Button type="submit" className="w-full" disabled={pending}>
        {t('verify')}
      </Button>
    </form>
  );
}

export function MfaEnrollForm() {
  const t = useTranslations('pro.mfa');
  const te = useTranslations('errors');
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [state, action, pending] = useActionState(verifyMfaAction, initial);
  useRedirect(state);

  useEffect(() => {
    let cancelled = false;
    startEnrollAction().then((res) => {
      if (cancelled) return;
      if ('error' in res) setError(te('INTERNAL'));
      else setEnroll(res);
    });
    return () => {
      cancelled = true;
    };
  }, [te]);

  return (
    <form action={action} className="space-y-4">
      <p>{t('enrollIntro')}</p>
      {error && <Alert tone="danger">{error}</Alert>}
      {enroll ? (
        <div className="flex flex-col items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR code returned by Supabase as an SVG data URI */}
          <img
            src={enroll.qr}
            alt="QR code"
            width={200}
            height={200}
            className="h-52 w-52 rounded-lg bg-white p-2"
          />
          <p className="text-muted text-center text-sm break-all">
            {t('secret', { secret: enroll.secret })}
          </p>
        </div>
      ) : (
        <div className="skeleton mx-auto h-52 w-52" aria-hidden />
      )}
      <MfaError state={state} />
      <CodeField {...(enroll ? { factorId: enroll.factorId } : {})} />
      <Button type="submit" className="w-full" disabled={pending || !enroll}>
        {t('verify')}
      </Button>
      <p className="text-muted text-sm">{t('secondDevice')}</p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations('pro.password');
  const tl = useTranslations('pro.login');
  const [state, action, pending] = useActionState(forgotPasswordAction, initial);
  const id = useId();
  return (
    <form action={action} className="space-y-4">
      <p>{t('forgotIntro')}</p>
      {state.info === 'SENT' && <Alert tone="success">{t('sent')}</Alert>}
      <Field label={tl('email')} htmlFor={id}>
        <Input id={id} name="email" type="email" autoComplete="email" required />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {t('send')}
      </Button>
    </form>
  );
}

export function NewPasswordForm() {
  const t = useTranslations('pro.password');
  const [state, action, pending] = useActionState(setPasswordAction, initial);
  useRedirect(state);
  const a = useId();
  const b = useId();
  const messages: Record<string, string> = {
    MISMATCH: t('mismatch'),
    TOO_SHORT: t('tooShort'),
    WEAK: t('weak'),
    LINK_EXPIRED: t('linkExpired'),
  };
  return (
    <form action={action} className="space-y-4">
      <p>{t('newIntro')}</p>
      {state.error && <Alert tone="danger">{messages[state.error] ?? t('weak')}</Alert>}
      <Field label={t('new')} htmlFor={a}>
        <Input
          id={a}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </Field>
      <Field label={t('confirm')} htmlFor={b}>
        <Input
          id={b}
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {t('submit')}
      </Button>
    </form>
  );
}
