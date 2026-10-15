'use client';

import { useTranslations } from 'next-intl';
import { Bell, BellOff, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import type { RealtimeStatus } from './use-realtime';
import { keepScreenOn, unlockAudio } from './sounds';

/** "Démarrer le service" (unlocks sound, keeps the screen on), sound state, connection state. */
export function ServiceBar({
  started,
  onStart,
  soundOn,
  onToggleSound,
  status,
}: {
  started: boolean;
  onStart: () => void;
  soundOn: boolean;
  onToggleSound: () => void;
  status: RealtimeStatus;
}) {
  const t = useTranslations('pro.service');
  return (
    <div className="flex flex-wrap items-center gap-3">
      {!started ? (
        <Button
          size="lg"
          onClick={async () => {
            unlockAudio();
            await keepScreenOn();
            onStart();
          }}
          title={t('startHelp')}
        >
          {t('start')}
        </Button>
      ) : (
        <button type="button" onClick={onToggleSound} className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-line px-3 text-sm font-medium" aria-pressed={soundOn}>
          {soundOn ? <Bell aria-hidden className="h-5 w-5" /> : <BellOff aria-hidden className="h-5 w-5" />}
          {soundOn ? t('soundOn') : t('soundOff')}
        </button>
      )}
      <span role="status" className={`inline-flex items-center gap-2 text-sm font-medium ${status === 'connected' ? 'text-st-ready' : 'text-st-warning'}`}>
        {status === 'connected' ? <Wifi aria-hidden className="h-5 w-5" /> : <WifiOff aria-hidden className="h-5 w-5" />}
        {status === 'connected' ? t('connected') : t('reconnecting')}
      </span>
    </div>
  );
}
