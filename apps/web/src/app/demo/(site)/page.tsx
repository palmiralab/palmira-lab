import Link from 'next/link';
import type { Metadata } from 'next';
import { demos } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Демо — PalmiraLab',
  description: 'Живые мини-версии того, что PalmiraLab делает для клиентов: попробуйте сами.',
};

export default function DemoListPage() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <Link href="/" className="text-sm text-slate-600 hover:underline dark:text-slate-400">
          ← На главную
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Демо</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Живые мини-версии того, что мы делаем для клиентов. Попробуйте сами: ничего
          устанавливать и регистрироваться не нужно.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {demos.map((item) => (
          <Link
            key={item.slug}
            href={`/demo/${item.slug}`}
            className="block rounded-lg border border-slate-200 bg-white p-5 hover:border-emerald-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-400"
          >
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
