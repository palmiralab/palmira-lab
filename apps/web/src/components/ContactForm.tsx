import type { ReactNode } from 'react';
import { inputClass, primaryButtonClass } from '@/lib/ui-classes';

type ContactFormProps = {
  contactName: string;
  contactValue: string;
  contactStatus: 'idle' | 'sending' | 'sent' | 'error';
  onContactNameChange: (value: string) => void;
  onContactValueChange: (value: string) => void;
  onContactSubmit: () => void;
  // Текст после успешной отправки: у КП и у заявки на аудит он разный.
  successText: string;
  restartControl?: ReactNode;
};

export function ContactForm({
  contactName,
  contactValue,
  contactStatus,
  onContactNameChange,
  onContactValueChange,
  onContactSubmit,
  successText,
  restartControl,
}: ContactFormProps) {
  if (contactStatus === 'sent') {
    return (
      <div className="flex flex-col items-start gap-2 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-emerald-700 dark:text-emerald-400">{successText}</p>
        {restartControl}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
      <h3 className="font-medium text-slate-900 dark:text-slate-100">Оставить контакт</h3>
      <p className="text-sm text-slate-500">
        <small>Чтобы связаться с вами — ничего лишнего не собираем.</small>
      </p>
      <input
        value={contactName}
        onChange={(e) => onContactNameChange(e.target.value)}
        placeholder="Имя"
        className={inputClass}
      />
      <input
        value={contactValue}
        onChange={(e) => onContactValueChange(e.target.value)}
        placeholder="Телефон, email или Telegram"
        className={inputClass}
      />
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onContactSubmit}
          disabled={contactStatus === 'sending'}
          className={primaryButtonClass}
        >
          {contactStatus === 'sending' ? 'Отправляю...' : 'Отправить контакт'}
        </button>
        {restartControl}
      </div>
      {contactStatus === 'error' && (
        <p className="animate-[fade-in-up_0.2s_ease-out] text-red-600 dark:text-red-400">
          Не удалось отправить, попробуйте ещё раз
        </p>
      )}
    </div>
  );
}
