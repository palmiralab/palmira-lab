'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isActivePath } from '@/lib/nav';

// Пункт меню в шапке. Выбранный подсвечивается и помечается aria-current,
// чтобы скринридер тоже понимал, где человек находится. Жирность не меняем:
// более широкий текст сдвигал бы соседние пункты (layout shift); цвет и
// подчёркивание размеры не меняют.
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const active = isActivePath(usePathname(), href);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'text-slate-900 underline decoration-emerald-600 decoration-2 underline-offset-4 dark:text-slate-100 dark:decoration-emerald-400'
          : 'hover:underline'
      }
    >
      {children}
    </Link>
  );
}
