import { services } from '@/lib/content';

export function Services() {
  return (
    <section id="services" className="flex flex-col gap-4">
      <h2 className="flex items-baseline gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        <span className="font-mono text-emerald-600 dark:text-emerald-400">01 /</span> Услуги
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.index}
            className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
              {service.index}
            </span>
            <h3 className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{service.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
