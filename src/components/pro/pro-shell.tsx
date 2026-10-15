'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  ChefHat,
  History,
  LogOut,
  Palette,
  PackageCheck,
  QrCode,
  Settings,
  Tablet,
  UserRoundCog,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { setAcceptingOrdersAction } from '@/features/orders/staff-actions';
import { Switch } from '@/components/ui/primitives';
import { cn } from '@/lib/cn';

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

const ICONS = {
  floor: UtensilsCrossed,
  kitchen: ChefHat,
  availability: PackageCheck,
  dashboard: BarChart3,
  history: History,
  catalog: BookOpen,
  menus: CalendarClock,
  tables: QrCode,
  team: Users,
  devices: Tablet,
  theme: Palette,
  settings: Settings,
};

export function ProShell({
  shop,
  member,
  canToggleOrders,
  readOnly,
  idleLockMinutes,
  items,
  children,
}: {
  shop: { id: string; slug: string; name: string; acceptingOrders: boolean };
  member: { id: string; name: string; isStaff: boolean };
  canToggleOrders: boolean;
  readOnly: boolean;
  idleLockMinutes: number | null;
  items: NavItem[];
  children: React.ReactNode;
}) {
  const t = useTranslations('pro');
  const pathname = usePathname();
  const router = useRouter();
  const [accepting, setAccepting] = useState(shop.acceptingOrders);
  const [pending, startTransition] = useTransition();

  const switchUser = useCallback(async () => {
    await fetch('/api/staff/logout', { method: 'POST' }).catch(() => null);
    router.replace(`/equipe?m=${member.id}`);
    router.refresh();
  }, [router, member.id]);

  // Inactivity lock for staff sessions (AUTH-03): asks for the PIN of the same person again.
  const lastActivity = useRef(0);
  useEffect(() => {
    if (!idleLockMinutes) return;
    lastActivity.current = Date.now();
    const bump = () => {
      lastActivity.current = Date.now();
    };
    const events = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = setInterval(() => {
      if (Date.now() - lastActivity.current > idleLockMinutes * 60_000) void switchUser();
    }, 15_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(timer);
    };
  }, [idleLockMinutes, switchUser]);

  const isKitchen = pathname?.endsWith('/cuisine');

  return (
    <div
      data-theme={isKitchen ? 'dark' : 'light'}
      className="bg-bg text-fg flex min-h-dvh flex-col lg:flex-row"
    >
      <aside className="border-line bg-surface hidden w-60 shrink-0 border-r lg:flex lg:flex-col print:!hidden">
        <div className="border-line border-b p-4">
          <p className="truncate text-lg font-semibold">{shop.name}</p>
          <p className="text-muted text-sm">{t('nav.connectedAs', { name: member.name })}</p>
        </div>
        <nav aria-label={t('nav.label')} className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = pathname?.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-12 items-center gap-3 rounded-lg px-3 font-medium',
                      active ? 'bg-brand text-brand-fg' : 'hover:bg-brand-soft',
                    )}
                  >
                    <Icon aria-hidden className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-line border-t p-2">
          {member.isStaff ? (
            <button
              type="button"
              onClick={switchUser}
              className="hover:bg-brand-soft flex min-h-12 w-full items-center gap-3 rounded-lg px-3 font-medium"
            >
              <UserRoundCog aria-hidden className="h-5 w-5" />
              {t('nav.switchUser')}
            </button>
          ) : (
            <form method="post" action="/api/auth/logout">
              <button
                type="submit"
                className="hover:bg-brand-soft flex min-h-12 w-full items-center gap-3 rounded-lg px-3 font-medium"
              >
                <LogOut aria-hidden className="h-5 w-5" />
                {t('nav.logout')}
              </button>
            </form>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-line bg-surface flex flex-wrap items-center gap-3 border-b px-4 py-2 print:hidden">
          <p className="truncate font-semibold lg:hidden">{shop.name}</p>
          <div className="ml-auto flex items-center gap-3">
            {canToggleOrders && (
              <Switch
                checked={accepting}
                disabled={pending}
                label={t('service.ordersOpen')}
                onLabel={t('service.ordersOpen')}
                offLabel={t('service.ordersClosed')}
                onChange={(value) => {
                  setAccepting(value);
                  startTransition(async () => {
                    const res = await setAcceptingOrdersAction(shop.slug, value);
                    if (!res.ok) setAccepting(!value);
                  });
                }}
              />
            )}
            <span className="text-muted hidden text-sm sm:inline lg:hidden">{member.name}</span>
            {member.isStaff && (
              <button
                type="button"
                onClick={switchUser}
                className="border-line inline-flex min-h-12 items-center gap-2 rounded-lg border px-3 text-sm font-medium lg:hidden"
              >
                <UserRoundCog aria-hidden className="h-5 w-5" />
                {t('nav.switchUser')}
              </button>
            )}
          </div>
        </header>
        {readOnly && (
          <p className="bg-st-warning-soft px-4 py-2 text-sm font-medium print:hidden">
            {t('nav.readOnly')}
          </p>
        )}
        <main className="min-w-0 flex-1 pb-20 lg:pb-0 print:pb-0">{children}</main>
        {/* Bottom bar on tablets in portrait */}
        <nav
          aria-label={t('nav.label')}
          className="border-line bg-surface fixed inset-x-0 bottom-0 z-30 border-t lg:hidden print:hidden"
        >
          <ul className="flex overflow-x-auto">
            {items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = pathname?.startsWith(item.href);
              return (
                <li key={item.href} className="min-w-20 flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-xs font-medium',
                      active ? 'text-brand-text' : 'text-muted',
                    )}
                  >
                    <Icon aria-hidden className={cn('h-6 w-6', active && 'text-fg')} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            {!member.isStaff && (
              <li className="min-w-20 flex-1">
                <form method="post" action="/api/auth/logout">
                  <button
                    type="submit"
                    className="text-muted flex min-h-16 w-full flex-col items-center justify-center gap-1 px-2 text-xs font-medium"
                  >
                    <LogOut aria-hidden className="h-6 w-6" />
                    {t('nav.logout')}
                  </button>
                </form>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
}
