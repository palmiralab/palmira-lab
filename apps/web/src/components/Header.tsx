import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LabIcon } from '@/components/icons/LabIcon';

const wordmark = (
  <>
    <LabIcon className="mr-1 inline-block h-[0.9em] w-[0.9em] -translate-y-[0.05em] text-emerald-600 dark:text-emerald-400" />
    Palmira<span className="text-emerald-600 dark:text-emerald-400">Lab</span>
  </>
);
const wordmarkClass = 'text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl';

// На главной логотип — единственный h1; на внутренних страницах h1 — заголовок
// самой страницы, поэтому логотип там ссылка, а не заголовок.
export function Header({ isHome = false }: { isHome?: boolean }) {
  return (
    <div className="flex flex-col gap-4 -mb-8">
      <div className="flex items-center justify-between">
        {isHome ? (
          <h1 className={wordmarkClass}>{wordmark}</h1>
        ) : (
          <Link href="/" className={wordmarkClass}>
            {wordmark}
          </Link>
        )}
        <ThemeToggle />
      </div>
      <nav className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
        <Link href="/services" className="hover:underline">
          Услуги
        </Link>
        <Link href="/#cases" className="hover:underline">
          Кейсы
        </Link>
        <Link href="/sandbox" className="hover:underline">
          Песочница
        </Link>
      </nav>
    </div>
  );
}
