import { cases } from '@/lib/content';

export function Cases() {
  return (
    <section id="cases" className="flex flex-col gap-4">
      <h2 className="flex items-baseline gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        <span className="font-mono text-emerald-600 dark:text-emerald-400">02 /</span> Кейсы
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {cases.map((item) => (
          <article
            key={item.tag}
            className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
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
          </article>
        ))}
      </div>
    </section>
  );
}
