'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { AuditQuestionnaire } from '@/components/AuditQuestionnaire';
import { ContactForm } from '@/components/ContactForm';
import { primaryButtonClass } from '@/lib/ui-classes';

type ManualReviewCardProps = {
  contactName: string;
  contactValue: string;
  contactStatus: 'idle' | 'sending' | 'sent' | 'error';
  onContactNameChange: (value: string) => void;
  onContactValueChange: (value: string) => void;
  // Отправка заявки «без аудита» (manual_review).
  onContactSubmit: () => void;
  // Реплики посетителя из чата: уходят в анкету аудита отдельной парой.
  chatContext?: string;
  restartControl?: ReactNode;
  // Анкета аудита из этой карточки отправлена (чат перестаёт спрашивать подтверждение
  // при «Начать заново»).
  onAuditSent?: () => void;
};

type Step = 'choose' | 'audit' | 'declined';

const DECLINED_SUCCESS = 'Спасибо! Посмотрим ваш запрос вручную и свяжемся с вами.';
const DECLINED_INTRO =
  'Хорошо, без аудита. Оставьте контакт, и мы посмотрим ваш запрос вручную и свяжемся с вами.';

// Исход `manual`: запрос не подходит под услуги. Предлагаем бесплатный ИИ-аудит
// (он открывает ту же анкету, что и исход «аудит») либо отказ: тогда заявка уходит
// как manual_review.
export function ManualReviewCard({
  chatContext,
  restartControl,
  onAuditSent,
  ...contactProps
}: ManualReviewCardProps) {
  const [step, setStep] = useState<Step>('choose');

  // Аудит: карточка целиком заменяется анкетой, у неё своя рамка и заголовок.
  if (step === 'audit') {
    return (
      <AuditQuestionnaire
        chatContext={chatContext}
        restartControl={restartControl}
        onSent={onAuditSent}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Ваш запрос выходит за рамки наших типовых услуг
      </h2>

      {step === 'choose' && (
        <>
          <p className="text-slate-700 dark:text-slate-300">
            Можем разобрать его в рамках бесплатного ИИ-аудита: ответьте на несколько вопросов, и
            мы пришлём карту процессов за 1–2 рабочих дня.
          </p>
          <button onClick={() => setStep('audit')} className={primaryButtonClass}>
            Заказать бесплатный ИИ-аудит
          </button>
          <button
            onClick={() => setStep('declined')}
            className="cursor-pointer self-start text-sm text-slate-500 hover:underline dark:text-slate-400"
          >
            Нет, спасибо
          </button>
        </>
      )}

      {step === 'declined' && (
        <>
          <p className="text-slate-700 dark:text-slate-300">{DECLINED_INTRO}</p>
          <ContactForm
            {...contactProps}
            restartControl={restartControl}
            successText={DECLINED_SUCCESS}
          />
        </>
      )}
    </div>
  );
}
