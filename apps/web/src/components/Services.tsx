import Link from 'next/link';
import { serviceGroups } from '@/lib/content';

export function Services() {
  return (
    <section id="services" className="flex flex-col gap-4">
      <h2 className="flex items-baseline gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        <span className="font-mono text-emerald-600 dark:text-emerald-400">01 /</span> Услуги
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {serviceGroups.map((group, index) => (
          <article
            key={group.title}
            className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{group.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{group.summary}</p>
            <p className="mt-3 font-mono text-sm text-emerald-600 dark:text-emerald-400">
              {group.price}
            </p>
            <ul className="mt-3 divide-y divide-slate-200 border-t border-slate-200 text-sm dark:divide-slate-800 dark:border-slate-800">
              {group.items.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/services/${item.slug}`}
                    className="group flex items-center justify-between gap-2 py-2 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
                  >
                    <span>{item.title}</span>
                    <span
                      aria-hidden="true"
                      className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <Link href="/services" className="text-sm text-emerald-700 underline dark:text-emerald-400">
        Все услуги и цены →
      </Link>
    </section>
  );
}
