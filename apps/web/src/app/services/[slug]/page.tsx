import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findService, serviceGroups } from '@/lib/content';
import { primaryButtonClass } from '@/lib/ui-classes';
import { NoBreak } from '@/components/NoBreak';

export function generateStaticParams() {
  return serviceGroups.flatMap((group) => group.items.map((item) => ({ slug: item.slug })));
}

export async function generateMetadata(props: PageProps<'/services/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const item = findService(slug);
  if (!item) return {};
  return {
    title: `${item.title} — PalmiraLab`,
    description: item.detail?.summary ?? item.description,
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {children}
    </section>
  );
}

const listClass = 'list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-400';

export default async function ServicePage(props: PageProps<'/services/[slug]'>) {
  const { slug } = await props.params;
  const item = findService(slug);

  if (!item) {
    notFound();
  }

  const { detail } = item;

  return (
    <>
      <div className="flex flex-col gap-3">
        <Link href="/services" className="text-sm text-slate-600 hover:underline dark:text-slate-400">
          ← Все услуги
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{item.title}</h1>
        <p className="font-mono text-emerald-600 dark:text-emerald-400">{item.price}</p>
        <p className="text-slate-600 dark:text-slate-400">{detail?.summary ?? item.description}</p>
        {item.primaryAction && (
          <Link
            href={item.primaryAction.href}
            className={`${primaryButtonClass} self-start text-center`}
          >
            <NoBreak>{item.primaryAction.label}</NoBreak>
          </Link>
        )}
      </div>

      {detail && (
        <>
          {detail.explainer && (
            <Section title={detail.explainer.title}>
              <p className="text-slate-600 dark:text-slate-400">{detail.explainer.intro}</p>
              <h3 className="font-medium text-slate-900 dark:text-slate-100">
                {detail.explainer.tasksTitle}
              </h3>
              <ul className={listClass}>
                {detail.explainer.tasks.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Подходит вам, если">
            <ul className={listClass}>
              {detail.forWhom.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>

          <Section title="Что входит">
            <ul className={listClass}>
              {detail.includes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>

          <Section title="Как проходит работа">
            <ol className="list-decimal space-y-1 pl-5 text-slate-600 dark:text-slate-400">
              {detail.steps.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </Section>

          <Section title="Сколько стоит">
            {item.tiers && (
              <ul className="flex flex-col gap-2 text-slate-600 dark:text-slate-400">
                {item.tiers.map((tier) => (
                  <li key={tier.name}>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {tier.name}
                    </span>{' '}
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {tier.price}
                    </span>
                    : {tier.description}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-slate-600 dark:text-slate-400">{detail.pricingNote}</p>
          </Section>

          {detail.example && (
            <Section title="Пример">
              <p className="text-slate-600 dark:text-slate-400">{detail.example}</p>
              {item.demo && (
                <Link
                  href={item.demo.href}
                  className="text-emerald-700 underline dark:text-emerald-400"
                >
                  {item.demo.label} →
                </Link>
              )}
            </Section>
          )}
        </>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-700 dark:text-slate-300">
          {slug === 'ai-audit'
            ? 'Ответьте на несколько вопросов о вашем бизнесе. Получите страницу с разбором безвозмездно и без обязательств.'
            : 'Не уверены, что это вам подойдёт? Начните с бесплатного ИИ-аудита: несколько вопросов о вашем бизнесе, и вы получите страницу с разбором.'}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/audit" className="text-emerald-700 underline dark:text-emerald-400">
            <NoBreak>Заказать бесплатный ИИ-аудит →</NoBreak>
          </Link>
          {slug !== 'ai-audit' && (
            <Link
              href="/services/ai-audit"
              className="text-slate-600 underline dark:text-slate-400"
            >
              Подробнее про аудит
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
