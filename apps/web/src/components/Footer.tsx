'use client';

import { useState } from 'react';

// Не кладём email в разметку/href вообще — иначе он присутствует
// готовой строкой в статичном HTML, которую читают ботные сборщики
// почты без выполнения JS. Собираем mailto: по клику из двух частей —
// строка-адрес не существует ни в HTML, ни как единая константа в
// бандле.
const EMAIL_USER = 'roman.palmin';
const EMAIL_DOMAIN = 'gmail.com';

function openEmail() {
  window.location.href = `mailto:${EMAIL_USER}@${EMAIL_DOMAIN}`;
}

export function Footer() {
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <footer className="flex flex-col gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Palmira Lab</p>
        <div className="flex items-center gap-4">
          <button onClick={openEmail} className="cursor-pointer hover:underline">
            Почта
          </button>
          <a
            href="https://t.me/jromkin"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Telegram
          </a>
        </div>
      </div>
      <p>
        Сайт собран с помощью{' '}
        <span className="group relative inline-block">
          <button
            type="button"
            onClick={() => setTipOpen((open) => !open)}
            onBlur={() => setTipOpen(false)}
            aria-describedby="agentic-tip"
            aria-expanded={tipOpen}
            className="cursor-help underline decoration-dotted underline-offset-2"
          >
            agentic-разработки
          </button>
          <span
            id="agentic-tip"
            role="tooltip"
            className={
              'pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-64 rounded-md border border-slate-200 ' +
              'bg-white p-3 text-xs leading-relaxed text-slate-700 shadow-md transition-opacity ' +
              'group-hover:visible group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 ' +
              (tipOpen ? 'visible opacity-100' : 'invisible opacity-0')
            }
          >
            Это когда ИИ-агент сам читает код проекта, вносит правки и запускает проверки, а
            человек ставит задачи, смотрит результат и принимает решения.
          </span>
        </span>{' '}
        на Claude Code.
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        <small>
          Персональные данные, оставленные через форму, пока не сохраняются на постоянной основе (152-ФЗ).
        </small>
      </p>
    </footer>
  );
}
