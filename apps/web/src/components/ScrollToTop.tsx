'use client';

import { useEffect, useState } from 'react';

// Кнопка появляется, когда страницу прокрутили больше чем на этот порог (px).
const SHOW_AFTER = 400;

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > SHOW_AFTER);

    // Первая проверка через кадр: страница могла открыться уже прокрученной
    // (восстановление позиции, якорь).
    const frame = window.requestAnimationFrame(update);
    window.addEventListener('scroll', update, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
    };
  }, []);

  function scrollToTop() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Наверх"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={
        'fixed bottom-4 right-4 z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border ' +
        'border-slate-300 bg-white text-slate-700 shadow-md transition-opacity hover:border-emerald-600 ' +
        'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-400 ' +
        (visible ? 'opacity-100' : 'pointer-events-none opacity-0')
      }
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-5 w-5"
      >
        <path d="M6 15l6-6 6 6" />
      </svg>
    </button>
  );
}
