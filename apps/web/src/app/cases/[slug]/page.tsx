import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cases, findCase } from '@/lib/content';

export function generateStaticParams() {
  return cases.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(props: PageProps<'/cases/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const item = findCase(slug);
  if (!item) return {};
  return {
    title: `${item.detail?.title ?? item.tag} — PalmiraLab`,
    description: item.problem,
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

const textClass = 'text-slate-600 dark:text-slate-400';
const listClass = `list-disc space-y-1 pl-5 ${textClass}`;
const linkClass = 'text-emerald-700 underline dark:text-emerald-400';

export default async function CasePage(props: PageProps<'/cases/[slug]'>) {
  const { slug } = await props.params;
  const item = findCase(slug);

  if (!item) {
    notFound();
  }

  const { detail } = item;

  return (
    <>
      <div className="flex flex-col gap-3">
        <Link href="/cases" className="text-sm text-slate-600 hover:underline dark:text-slate-400">
          ← Все кейсы
        </Link>
        <span className="w-fit rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400">
          {item.tag}
        </span>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {detail?.title ?? item.tag}
        </h1>
      </div>

      {detail ? (
        <>
          <Section title="Ситуация">
            <p className={textClass}>{detail.situation}</p>
          </Section>
          <Section title="Задача">
            <p className={textClass}>{detail.task}</p>
          </Section>
          <Section title="Решение">
            <ul className={listClass}>
              {detail.solution.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>
          <Section title="Результат">
            <ul className={listClass}>
              {detail.result.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Section>
          {(detail.site || detail.archive) && (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {detail.site && (
                <a href={detail.site.href} className={linkClass} target="_blank" rel="noreferrer">
                  {detail.site.label} →
                </a>
              )}
              {detail.archive && (
                <a href={detail.archive.href} className={linkClass} target="_blank" rel="noreferrer">
                  {detail.archive.label} →
                </a>
              )}
            </div>
          )}
          {detail.related && detail.related.length > 0 && (
            <Section title="Связанные кейсы">
              <ul className={listClass}>
                {detail.related.map((relatedSlug) => {
                  const related = findCase(relatedSlug);
                  if (!related) return null;
                  return (
                    <li key={relatedSlug}>
                      <Link href={`/cases/${relatedSlug}`} className={linkClass}>
                        {related.tag}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}
        </>
      ) : (
        <>
          <Section title="Проблема">
            <p className={textClass}>{item.problem}</p>
          </Section>
          <Section title="Решение">
            <p className={textClass}>{item.solution}</p>
          </Section>
          <Section title="Результат">
            <p className="text-emerald-700 dark:text-emerald-400">{item.result}</p>
          </Section>
          {item.link && (
            <a href={item.link.href} className={linkClass}>
              {item.link.label}
            </a>
          )}
        </>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-700 dark:text-slate-300">
          Похожая задача? Начните с бесплатного ИИ-аудита: несколько вопросов о вашем бизнесе, и вы
          получите страницу с разбором.
        </p>
        <div className="mt-3">
          <Link href="/audit" className={linkClass}>
            Заказать бесплатный ИИ-аудит →
          </Link>
        </div>
      </div>
    </>
  );
}
