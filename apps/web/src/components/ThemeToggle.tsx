'use client';

import { useSyncExternalStore } from 'react';

// Тема живёт вне React: класс `dark` на <html> выставляет инлайн-скрипт в
// <head>. Подписываемся на изменение этого класса и читаем его же.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains('dark');
}

// На сервере сохранённую тему не знаем: null, рендерим пусто, чтобы не спорить
// с классом, который уже выставил скрипт.
function getServerSnapshot() {
  return null;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore<boolean | null>(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !isDark;
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
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-white text-base dark:border-slate-700 dark:bg-slate-900"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
