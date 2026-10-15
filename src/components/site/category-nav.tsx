'use client';

import { useEffect, useRef, useState } from 'react';

/** Sticky horizontal category bar; the current category is highlighted while scrolling (CLI-02). */
export function CategoryNav({ categories, label }: { categories: Array<{ id: string; name: string }>; label: string }) {
  const [current, setCurrent] = useState<string | null>(categories[0]?.id ?? null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(`cat-${c.id}`))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const first = visible[0];
        if (first) setCurrent(first.target.id.replace(/^cat-/, ''));
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [categories]);

  useEffect(() => {
    const link = listRef.current?.querySelector<HTMLElement>(`[data-cat="${current}"]`);
    link?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [current]);

  return (
    <nav aria-label={label} className="sticky top-14 z-10 border-b border-line bg-bg/95 backdrop-blur">
      <ul ref={listRef} className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none]">
        {categories.map((c) => (
          <li key={c.id} className="shrink-0">
            <a
              href={`#cat-${c.id}`}
              data-cat={c.id}
              aria-current={current === c.id ? 'true' : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap ${
                current === c.id ? 'bg-brand text-brand-fg' : 'text-fg hover:bg-brand-soft'
              }`}
            >
              {c.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
