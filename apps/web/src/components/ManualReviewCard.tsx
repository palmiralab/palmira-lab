'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ContactForm } from '@/components/ContactForm';
import { MAX_DETAILS_LENGTH } from '@/lib/contact-limits';
import type { ManualChoice } from '@/lib/manual-review';
import { inputClass, primaryButtonClass, secondaryButtonClass } from '@/lib/ui-classes';

type ManualReviewCardProps = {
  contactName: string;
  contactValue: string;
  contactStatus: 'idle' | 'sending' | 'sent' | 'error';
  onContactNameChange: (value: string) => void;
  onContactValueChange: (value: string) => void;
  onContactSubmit: (choice: ManualChoice) => void;
  restartControl?: ReactNode;
};

type Step = 'choose' | 'details' | 'contact';

const AUDIT_SUCCESS = 'Заявка на аудит принята. Пришлём карту процессов за 1–2 рабочих дня.';
const DECLINED_SUCCESS = 'Спасибо! Посмотрим ваш запрос вручную и свяжемся с вами.';

const AUDIT_INTRO =
  'Отправим ваш запрос на бесплатный ИИ-аудит. Оставьте контакт, и мы пришлём карту процессов за 1–2 рабочих дня.';
const DECLINED_INTRO =
  'Хорошо, без аудита. Оставьте контакт, и мы посмотрим ваш запрос вручную и свяжемся с вами.';

// Исход `manual`: запрос не подходит под услуги. Предлагаем бесплатный аудит
// (как есть или с уточнением) либо отказ, тогда заявка уходит как manual_review.
export function ManualReviewCard({ onContactSubmit, ...contactProps }: ManualReviewCardProps) {
  const [step, setStep] = useState<Step>('choose');
  const [details, setDetails] = useState('');
  const [choice, setChoice] = useState<ManualChoice>({ kind: 'declined' });

  function pick(next: ManualChoice) {
    setChoice(next);
    setStep('contact');
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Ваш запрос выходит за рамки наших типовых услуг
      </h2>

      {step === 'choose' && (
        <>
          <p className="text-slate-700 dark:text-slate-300">
            Можем разобрать его в рамках бесплатного ИИ-аудита: посмотрим, что здесь можно сделать,
            и пришлём карту процессов за 1–2 рабочих дня.
          </p>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <button onClick={() => pick({ kind: 'as_is' })} className={primaryButtonClass}>
              Отправить на аудит как есть
            </button>
            <button onClick={() => setStep('details')} className={secondaryButtonClass}>
              Опишите подробнее
            </button>
          </div>
          <button
            onClick={() => pick({ kind: 'declined' })}
            className="cursor-pointer self-start text-sm text-slate-500 hover:underline dark:text-slate-400"
          >
            Нет, спасибо
          </button>
        </>
      )}

      {step === 'details' && (
        <div className="flex flex-col gap-2">
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            maxLength={MAX_DETAILS_LENGTH}
            rows={4}
            placeholder="Опишите задачу подробнее"
            className={inputClass}
          />
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <button
              onClick={() => pick({ kind: 'with_details', details })}
              disabled={!details.trim()}
              className={primaryButtonClass}
            >
              Отправить на аудит
            </button>
            <button
              onClick={() => setStep('choose')}
              className="cursor-pointer text-sm text-slate-500 hover:underline dark:text-slate-400"
            >
              Назад
            </button>
          </div>
        </div>
      )}

      {step === 'contact' && (
        <>
          <p className="text-slate-700 dark:text-slate-300">
            {choice.kind === 'declined' ? DECLINED_INTRO : AUDIT_INTRO}
          </p>
          <ContactForm
            {...contactProps}
            onContactSubmit={() => onContactSubmit(choice)}
            successText={choice.kind === 'declined' ? DECLINED_SUCCESS : AUDIT_SUCCESS}
          />
        </>
      )}
    </div>
  );
}
