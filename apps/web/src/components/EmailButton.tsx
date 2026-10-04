'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

// Не кладём email в разметку/href вообще — иначе он присутствует
// готовой строкой в статичном HTML, которую читают ботные сборщики
// почты без выполнения JS. Собираем адрес по клику из двух частей —
// строка-адрес не существует ни в HTML, ни как единая константа в
// бандле.
const EMAIL_USER = 'roman.palmin';
const EMAIL_DOMAIN = 'gmail.com';

const COPIED_RESET_MS = 2000;

type Status = 'idle' | 'copied' | 'shown';

// Копируем адрес в буфер, а не открываем почтовый клиент (его почти ни у кого
// нет). Если браузер не дал доступ к буферу, показываем адрес текстом.
export function EmailButton({ children, className }: { children: ReactNode; className?: string }) {
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (status !== 'copied') return;
    const timer = setTimeout(() => setStatus('idle'), COPIED_RESET_MS);
    return () => clearTimeout(timer);
  }, [status]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(`${EMAIL_USER}@${EMAIL_DOMAIN}`);
      setStatus('copied');
    } catch {
      setStatus('shown');
    }
  }

  if (status === 'shown') {
    return <span className="select-all">{`${EMAIL_USER}@${EMAIL_DOMAIN}`}</span>;
  }

  // Подтверждение отдельным элементом, а не кнопкой с другим классом: у кнопки
  // из пропса уже могут быть cursor-pointer и underline, перебить их другими
  // Tailwind-классами нельзя (побеждает порядок в CSS, не порядок в разметке).
  if (status === 'copied') {
    return (
      <span role="status" className="text-emerald-700 dark:text-emerald-400">
        Скопировано
      </span>
    );
  }

  return (
    <button
      onClick={copyEmail}
      title="Скопировать адрес"
      className={className ?? 'cursor-pointer hover:underline'}
    >
      {children}
    </button>
  );
}
