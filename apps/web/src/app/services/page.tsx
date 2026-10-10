import Link from 'next/link';
import type { Metadata } from 'next';
import { serviceGroups } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Услуги и цены — PalmiraLab',
  description: 'Что делает PalmiraLab и сколько это стоит. Цены «от», ориентировочные.',
};

// Группы, которые раскрыты сразу; остальные свёрнуты в <details>
// (работает без JS, текст остаётся в HTML для поисковых ботов).
const openGroups = new Set(['Боты и консультанты', 'Сайты']);

export default function ServicesPage() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <Link href="/" className="text-sm text-slate-600 hover:underline dark:text-slate-400">
          ← На главную
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Услуги и цены</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Цены указаны «от» и ориентировочные: итог зависит от задачи, и мы называем его
          после разбора. Не знаете, с чего начать? Начните с бесплатного{' '}
          <Link
            href="/services/ai-audit"
            className="text-emerald-700 underline dark:text-emerald-400"
          >
            ИИ-аудита
          </Link>
          .
        </p>
      </div>

      {serviceGroups.map((group) => (
        <details key={group.title} open={openGroups.has(group.title)} className="group">
          <summary className="cursor-pointer select-none text-xl font-semibold text-slate-900 dark:text-slate-100">
            {group.title}
          </summary>
          <div className="mt-4 flex flex-col gap-4">
            {group.items.map((item) => (
              <Link
                key={item.slug}
                href={`/services/${item.slug}`}
                className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</h2>
                  <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                    {item.price}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
              </Link>
            ))}
          </div>
        </details>
      ))}
    </>
  );
}
