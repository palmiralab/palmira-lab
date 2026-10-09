import Link from 'next/link';
import { cases } from '@/lib/content';
import { CaseCard } from '@/components/CaseCard';

// На главной показываем первые кейсы, остальные на странице /cases.
const HOME_CASES_COUNT = 3;

export function Cases() {
  return (
    <section id="cases" className="flex flex-col gap-4">
      <h2 className="flex items-baseline gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        <span className="font-mono text-emerald-600 dark:text-emerald-400">02 /</span> Кейсы
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {cases.slice(0, HOME_CASES_COUNT).map((item) => (
          <CaseCard key={item.slug} item={item} />
        ))}
      </div>
      <Link href="/cases" className="w-fit text-emerald-700 underline dark:text-emerald-400">
        Все кейсы →
      </Link>
    </section>
  );
}
