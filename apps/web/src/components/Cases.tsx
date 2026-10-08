import { cases } from '@/lib/content';
import { CaseCard } from '@/components/CaseCard';

export function Cases() {
  return (
    <section id="cases" className="flex flex-col gap-4">
      <h2 className="flex items-baseline gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        <span className="font-mono text-emerald-600 dark:text-emerald-400">02 /</span> Кейсы
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {cases.map((item) => (
          <CaseCard key={item.slug} item={item} />
        ))}
      </div>
    </section>
  );
}
