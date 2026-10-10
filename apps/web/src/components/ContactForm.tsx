import Link from 'next/link';
import type { ReactNode } from 'react';
import { HONEYPOT_FIELD } from '@/lib/honeypot';
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
  // Необязательные настройки для других форм (анкета аудита). Без них форма
  // выглядит и ведёт себя как раньше.
  heading?: string;
  submitLabel?: string;
  errorText?: string;
  submitDisabled?: boolean;
  // Курсор в первое поле при появлении формы (на шаге контактов анкеты).
  autoFocus?: boolean;
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
  heading = 'Оставить контакт',
  submitLabel = 'Отправить контакт',
  errorText = 'Не удалось отправить, попробуйте ещё раз',
  submitDisabled = false,
  autoFocus = false,
}: ContactFormProps) {
  if (contactStatus === 'sent') {
    return (
      <div className="flex flex-col items-start gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
        <p className="text-emerald-700 dark:text-emerald-400">{successText}</p>
        {restartControl}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
      <h3 className="font-medium text-slate-900 dark:text-slate-100">{heading}</h3>
      <p className="text-sm text-slate-500">
        <small>Чтобы связаться с вами — ничего лишнего не собираем.</small>
      </p>
      <input
        value={contactName}
        onChange={(e) => onContactNameChange(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Имя"
        className={inputClass}
      />
      <input
        value={contactValue}
        onChange={(e) => onContactValueChange(e.target.value)}
        placeholder="Телефон, email или Telegram"
        className={inputClass}
      />
      {/* Приманка для ботов (см. lib/honeypot.ts): за экраном, не в порядке Tab,
          скрыта от скринридеров и автозаполнения. */}
      <div aria-hidden="true" className="absolute left-[-9999px] size-px overflow-hidden">
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => onContactSubmit()}
          disabled={contactStatus === 'sending' || submitDisabled}
          className={primaryButtonClass}
        >
          {contactStatus === 'sending' ? 'Отправляю...' : submitLabel}
        </button>
        {restartControl}
      </div>
      <p className="text-sm text-slate-500">
        <small>
          Нажимая «{submitLabel}», вы соглашаетесь на{' '}
          {/* Новая вкладка: иначе уход на /privacy сбросит чат и введённое. */}
          <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
            обработку персональных данных
          </Link>
          .
        </small>
      </p>
      {contactStatus === 'error' && (
        <p className="animate-[fade-in-up_0.2s_ease-out] text-red-600 dark:text-red-400">
          {errorText}
        </p>
      )}
    </div>
  );
}
