import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
  return (
    <div className="flex flex-col gap-4 -mb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Palmira<span className="text-emerald-600 dark:text-emerald-400">Lab</span>
        </h1>
        <ThemeToggle />
      </div>
      <nav className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
        <a href="#services" className="hover:underline">
          Услуги
        </a>
        <a href="#cases" className="hover:underline">
          Кейсы
        </a>
      </nav>
    </div>
  );
}
