'use client';

import Link from 'next/link';
import { EmailButton } from '@/components/EmailButton';
import { Tooltip } from '@/components/Tooltip';

export function Footer() {
  return (
    <footer className="flex flex-col gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Palmira Lab</p>
        <div className="flex items-center gap-4">
          <EmailButton>Почта</EmailButton>
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
          Контакты, оставленные через форму, мы храним.{' '}
          <Link href="/privacy" className="underline">
            Политика обработки персональных данных
          </Link>
          .
        </small>
      </p>
    </footer>
  );
}
