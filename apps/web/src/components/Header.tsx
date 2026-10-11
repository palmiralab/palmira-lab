import Link from 'next/link';
import { NavLink } from '@/components/NavLink';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoMark } from '@/components/icons/LogoMark';

const wordmark = (
  <>
    <LogoMark className="mr-1 inline-block h-[1em] w-[1em] translate-y-[calc(0.03em_-_3px)]" />
    Palmira<span className="text-emerald-600 dark:text-emerald-400">Lab</span>
  </>
);
const wordmarkClass = 'whitespace-nowrap text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl';

// На главной логотип — единственный h1; на внутренних страницах h1 — заголовок
// самой страницы, поэтому логотип там ссылка, а не заголовок.
export function Header({ isHome = false }: { isHome?: boolean }) {
  return (
    <div className="-mb-8 flex flex-col gap-4 border-b border-slate-200 pb-3 dark:border-slate-800">
      <div className="flex items-center justify-between">
        {isHome ? (
          <h1 className={wordmarkClass}>{wordmark}</h1>
        ) : (
          <Link href="/" className={wordmarkClass}>
            {wordmark}
          </Link>
        )}
        <div className="flex items-center gap-3">
          <Link
            href="/audit"
            aria-label="Бесплатный ИИ-аудит"
            className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 sm:text-sm dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
          >
            <span className="sm:hidden">Аудит</span>
            <span className="hidden sm:inline">Бесплатный аудит</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
      <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
        <NavLink href="/services">Услуги</NavLink>
        <NavLink href="/cases">Кейсы</NavLink>
        <NavLink href="/demo">Демо</NavLink>
      </nav>
    </div>
  );
}
