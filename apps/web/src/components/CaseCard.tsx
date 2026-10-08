import Link from 'next/link';
import type { Case } from '@/lib/content';

// Карточка кейса: используется на главной и на странице /cases. Короткие
// problem/solution/result и переход на страницу кейса; link — отдельный призыв
// (например, «Попробуйте сами»), если он есть у кейса.
export function CaseCard({ item }: { item: Case }) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <span className="w-fit rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
        {item.tag}
      </span>
      <div>
        <h4 className="font-mono text-xs uppercase tracking-wide text-slate-500">Проблема</h4>
        <p className="mt-0.5 text-slate-800 dark:text-slate-300">{item.problem}</p>
      </div>
      <div>
        <h4 className="font-mono text-xs uppercase tracking-wide text-slate-500">Решение</h4>
        <p className="mt-0.5 text-slate-800 dark:text-slate-300">{item.solution}</p>
      </div>
      <div>
        <h4 className="font-mono text-xs uppercase tracking-wide text-slate-500">Результат</h4>
        <p className="mt-0.5 text-emerald-700 dark:text-emerald-400">{item.result}</p>
      </div>
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
        <Link
          href={`/cases/${item.slug}`}
          className="text-emerald-700 hover:underline dark:text-emerald-400"
        >
          Подробнее →
        </Link>
        {item.link && (
          <a href={item.link.href} className="text-emerald-700 hover:underline dark:text-emerald-400">
            {item.link.label}
          </a>
        )}
      </div>
    </article>
  );
}
