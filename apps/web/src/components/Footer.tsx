'use client';

import { Tooltip } from '@/components/Tooltip';

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
      <p className="relative">
        Сайт собран с помощью{' '}
          <Tooltip trigger="agentic-разработки">
          Вид разработки, когда ИИ-агент сам читает код проекта, вносит правки и запускает проверки, а
          человек ставит задачи, смотрит результат, корректирует и принимает решения.
        </Tooltip>{' '}
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
