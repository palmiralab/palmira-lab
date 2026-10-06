import Link from 'next/link';
import type { Metadata } from 'next';
import { AuditQuestionnaire } from '@/components/AuditQuestionnaire';

export const metadata: Metadata = {
  title: 'Заказать бесплатный ИИ-аудит — PalmiraLab',
  description:
    'Ответьте на несколько вопросов о вашем бизнесе, и мы пришлём карту процессов: что можно автоматизировать с помощью ИИ.',
};

// Страница-хозяин анкеты. Чата здесь нет, поэтому chatContext не передаём.
export default function AuditPage() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <Link href="/" className="text-sm text-slate-600 hover:underline dark:text-slate-400">
          ← На главную
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Бесплатный ИИ-аудит
        </h1>
      </div>

      <AuditQuestionnaire showHeading={false} />
    </>
  );
}
