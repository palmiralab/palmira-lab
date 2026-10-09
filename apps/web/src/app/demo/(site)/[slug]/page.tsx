import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { demos, findDemo } from '@/lib/content';
import { demoBodies } from '@/components/demos';

export function generateStaticParams() {
  return demos.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(props: PageProps<'/demo/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const item = findDemo(slug);
  if (!item) return {};
  return { title: `${item.title} — PalmiraLab`, description: item.description };
}

export default async function DemoPage(props: PageProps<'/demo/[slug]'>) {
  const { slug } = await props.params;
  const item = findDemo(slug);

  const Body = demoBodies[slug];

  if (!item || !Body) {
    notFound();
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <Link href="/demo" className="text-sm text-slate-600 hover:underline dark:text-slate-400">
          ← Все демо
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{item.heading}</h1>
        <p className="text-slate-600 dark:text-slate-400">{item.intro}</p>
      </div>

      <Body />
    </>
  );
}
