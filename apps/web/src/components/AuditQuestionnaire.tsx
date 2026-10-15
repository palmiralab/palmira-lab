'use client';

import { useReducer, useState, type ReactNode } from 'react';
import { AuditQuestionField } from '@/components/AuditQuestionField';
import { ContactForm } from '@/components/ContactForm';
import { normalizeAnswer } from '@/lib/audit-answers';
import { AUDIT_QUESTIONS } from '@/lib/audit-questions';
import {
  CONTACT_STEP,
  canGoNext,
  canSubmit,
  initialWizardState,
  progressLabel,
  wizardReducer,
} from '@/lib/audit-wizard';
import { submitContact } from '@/lib/submit-contact';
import { primaryButtonClass, secondaryButtonClass } from '@/lib/ui-classes';
import { NoBreak } from '@/components/NoBreak';

const SUCCESS_TEXT = 'Заявка на аудит принята. Пришлём карту процессов за 1–2 рабочих дня.';

type AuditQuestionnaireProps = {
  // Реплики посетителя из чата, если анкета открыта из чата. На странице /audit
  // чата нет, и проп не передаётся.
  chatContext?: string;
  restartControl?: ReactNode;
  // На странице /audit свой заголовок h1, и повтор внутри карточки лишний.
  showHeading?: boolean;
  // Заявка отправлена. Чат по этому знает, что терять нечего, и не просит
  // подтверждения при «Начать заново».
  onSent?: () => void;
};

// Статус запроса живёт здесь, а не в reducer: это не данные анкеты, а состояние
// сетевого вызова. Reducer остаётся чистым и проверяется тестами без сети.
type SendStatus = 'idle' | 'sending' | 'sent' | 'error';

export function AuditQuestionnaire({
  chatContext,
  restartControl,
  showHeading = true,
  onSent,
}: AuditQuestionnaireProps) {
  // state: шаг, ответы, имя, контакт. dispatch: способ сообщить визарду, что
  // произошло. Правила переходов лежат в wizardReducer, компонент их не знает.
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState());
  const [status, setStatus] = useState<SendStatus>('idle');
  const [errorText, setErrorText] = useState<string>();

  async function handleSubmit() {
    if (!canSubmit(state)) return;

    setStatus('sending');
    setErrorText(undefined);

    const result = await submitContact({
      name: state.name,
      contact: state.contact,
      serviceType: 'ai_consultation',
      auditForm: { answers: state.answers, chatContext },
    });

    if (result.ok) {
      setStatus('sent');
      onSent?.();
    } else {
      setStatus('error');
      setErrorText(result.message);
    }
  }

  const cardClass =
    'flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900';

  if (status === 'sent') {
    return (
      <div className={cardClass}>
        <p className="text-emerald-700 dark:text-emerald-400">{SUCCESS_TEXT}</p>
        {restartControl}
      </div>
    );
  }

  const question = state.step < CONTACT_STEP ? AUDIT_QUESTIONS[state.step] : null;
  const hasChatContext = Boolean(chatContext?.trim());
  // Необязательный вопрос без ответа: вместо «Далее» честнее «Пропустить».
  const skipping =
    question !== null &&
    !question.required &&
    normalizeAnswer(question, state.answers[question.key]) === undefined;

  return (
    <div className={cardClass}>
      <div className="flex flex-col gap-2">
        {showHeading && (
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            <NoBreak>Бесплатный ИИ-аудит</NoBreak>
          </h2>
        )}
        {state.step === 0 && (
          <p className="text-slate-700 dark:text-slate-300">
            Разберём ваши процессы и покажем, что в них можно автоматизировать с помощью ИИ, а что
            пока не стоит. Ответьте на несколько вопросов, это займёт пару минут.
          </p>
        )}
        <p className="text-sm text-slate-500 dark:text-slate-400">{progressLabel(state.step)}</p>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={CONTACT_STEP + 1}
          aria-valuenow={state.step + 1}
          className="h-1.5 w-full overflow-hidden rounded bg-slate-200 dark:bg-slate-800"
        >
          <div
            className="h-full bg-emerald-600 transition-[width] dark:bg-emerald-400"
            style={{ width: `${((state.step + 1) / (CONTACT_STEP + 1)) * 100}%` }}
          />
        </div>
      </div>

      {question ? (
        <>
          <div className="flex flex-col gap-3">
            <h3 className="font-medium text-slate-900 dark:text-slate-100">
              {question.question}
              {question.required && (
                // Звёздочка для глаз; скринридеру хватает подписи ниже.
                <span aria-hidden="true" className="ml-1 text-red-600 dark:text-red-400">
                  *
                </span>
              )}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {question.required ? 'Обязательный вопрос' : 'Можно пропустить'}
            </p>
            <AuditQuestionField
              // key: на каждом шаге поле создаётся заново, без хвостов прошлого вопроса.
              key={question.key}
              question={question}
              value={state.answers[question.key]}
              autoFocus={state.navigated}
              // Если «Далее» заблокирована пустым обязательным ответом, reducer
              // вернёт то же состояние, и ничего не произойдёт.
              onModEnter={() => dispatch({ type: 'next' })}
              onChange={(value) => dispatch({ type: 'answer', key: question.key, value })}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {state.step > 0 ? (
              <button
                type="button"
                onClick={() => dispatch({ type: 'back' })}
                className={secondaryButtonClass}
              >
                Назад
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              disabled={!canGoNext(state)}
              onClick={() => dispatch({ type: 'next' })}
              className={primaryButtonClass}
            >
              {skipping ? 'Пропустить' : 'Далее'}
            </button>
          </div>
          {/* В чате без этого человек не смог бы начать заново, пока не дойдёт до контактов. */}
          {restartControl}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => dispatch({ type: 'back' })}
            className="cursor-pointer self-start text-sm text-slate-600 underline dark:text-slate-400"
          >
            ← Назад к вопросам
          </button>
          {hasChatContext && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Мы приложим к заявке ваше описание задачи из чата, повторять его не нужно.
            </p>
          )}
          <ContactForm
            contactName={state.name}
            contactValue={state.contact}
            contactStatus={status}
            onContactNameChange={(value) => dispatch({ type: 'setName', value })}
            onContactValueChange={(value) => dispatch({ type: 'setContact', value })}
            onContactSubmit={handleSubmit}
            successText={SUCCESS_TEXT}
            restartControl={restartControl}
            heading="Куда прислать результат"
            submitLabel="Отправить заявку"
            errorText={errorText}
            submitDisabled={!canSubmit(state)}
            autoFocus
          />
        </>
      )}
    </div>
  );
}
