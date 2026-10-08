import Link from 'next/link';
import type { Metadata } from 'next';
import { cases } from '@/lib/content';
import { CaseCard } from '@/components/CaseCard';

export const metadata: Metadata = {
  title: 'Кейсы — PalmiraLab',
  description: 'Что было сделано PalmiraLab. Примеры решений',
};

export default function CasesPage() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <Link href="/" className="text-sm text-slate-600 hover:underline dark:text-slate-400">
          ← На главную
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Кейсы</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Что было, что сделано и что получилось.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {cases.map((item) => (
            <CaseCard key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </>
  );
}
