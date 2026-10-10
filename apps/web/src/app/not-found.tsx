import Link from 'next/link';
import type { Metadata } from 'next';
import { SiteShell } from '@/components/SiteShell';

export const metadata: Metadata = {
  title: 'Страница не найдена — PalmiraLab',
};

// Общая 404 для всего сайта, в том числе для демо-страниц, у которых вышел срок
// хранения (результат демо живёт в памяти сервера несколько минут).
export default function NotFound() {
  return (
    <SiteShell>
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Страница не найдена</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Возможно, ссылка набрана с ошибкой. Если это страница из демо, срок её хранения мог истечь:
          результаты демо не сохраняются надолго.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-emerald-700 dark:text-emerald-400">
          <Link href="/" className="underline">
            На главную
          </Link>
          <Link href="/demo" className="underline">
            К демо
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
