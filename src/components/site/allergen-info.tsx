'use client';

import { useTranslations } from 'next-intl';
import type { AllergenCode } from '@/features/catalog/menu-schema';

/** "Contient : gluten, lait. Peut contenir des traces de : fruits à coque." (CLI-08) */
export function AllergenText({
  declared,
  contains,
  mayContain,
}: {
  declared: boolean;
  contains: AllergenCode[];
  mayContain: AllergenCode[];
}) {
  const t = useTranslations('site.menu');
  const tc = useTranslations('common.allergens');
  if (!declared) return <p className="text-muted text-sm">{t('askTeam')}</p>;
  if (contains.length === 0 && mayContain.length === 0)
    return <p className="text-muted text-sm">{t('noAllergen')}</p>;
  const list = (codes: AllergenCode[]) => codes.map((c) => tc(c).toLowerCase()).join(', ');
  return (
    <p className="text-muted text-sm">
      {contains.length > 0 && <span>{t('contains', { list: list(contains) })} </span>}
      {mayContain.length > 0 && <span>{t('mayContain', { list: list(mayContain) })}</span>}
    </p>
  );
}

/** Small pictograms with an accessible name (vol. 07 §4.1). */
export function AllergenBadges({ codes }: { codes: AllergenCode[] }) {
  const tc = useTranslations('common.allergens');
  const ts = useTranslations('common.allergenShort');
  if (codes.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Allergènes">
      {codes.map((c) => (
        <li key={c}>
          <abbr
            title={tc(c)}
            aria-label={tc(c)}
            className="border-line text-muted inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-1 text-[0.7rem] font-semibold no-underline"
          >
            {ts(c)}
          </abbr>
        </li>
      ))}
    </ul>
  );
}
