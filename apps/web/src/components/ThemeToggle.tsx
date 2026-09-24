'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  // null до монтирования — не знаем сохранённую тему на сервере, рендерим
  // пусто первый тик, чтобы не спорить с классом, который уже выставил
  // инлайн-скрипт в <head>.
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  if (isDark === null) {
    return <div className="h-9 w-9" />;
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-base dark:border-slate-700 dark:bg-slate-900"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
