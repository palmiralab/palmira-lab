import type { ReactNode } from 'react';
import { ContactForm } from '@/components/ContactForm';

type AuditRequestCardProps = {
  contactName: string;
  contactValue: string;
  contactStatus: 'idle' | 'sending' | 'sent' | 'error';
  onContactNameChange: (value: string) => void;
  onContactValueChange: (value: string) => void;
  onContactSubmit: () => void;
  restartControl?: ReactNode;
};

// Исход `audit`: КП не показываем, предлагаем бесплатный ИИ-аудит.
export function AuditRequestCard(contactProps: AuditRequestCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Бесплатный ИИ-аудит
      </h2>

      <p className="text-slate-700 dark:text-slate-300">
        Разберём ваши процессы и покажем, что в них можно автоматизировать с помощью ИИ, а что пока
        не стоит. Оставьте контакт, и мы пришлём карту процессов за 1–2 рабочих дня.
      </p>

      <ContactForm
        {...contactProps}
        successText="Заявка на аудит принята. Пришлём карту процессов за 1–2 рабочих дня."
      />
    </div>
  );
}
