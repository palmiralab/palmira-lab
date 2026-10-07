import type { AuditQuestion } from '@/lib/audit-questions';
import { TextArea } from '@/components/ui/TextArea';

const chipBase = 'cursor-pointer rounded-full border px-3 py-1.5 text-sm';
const chipOn =
  'border-emerald-600 bg-emerald-50 text-emerald-900 ' +
  'dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100';
const chipOff = 'border-slate-300 text-slate-800 dark:border-slate-700 dark:text-slate-100';

type AuditQuestionFieldProps = {
  question: AuditQuestion;
  // Сырое значение из состояния визарда: оно приходит из reducer и не обязано
  // быть нужного типа, поэтому unknown и проверка на месте.
  value: unknown;
  onChange: (value: unknown) => void;
  // Ставить ли курсор в текстовое поле при появлении (у выбора из вариантов не нужно).
  autoFocus?: boolean;
  // Ctrl/⌘+Enter в текстовом поле: перейти дальше.
  onModEnter?: () => void;
};

// Поле одного вопроса анкеты: текст, один вариант или несколько. Сама ничего не
// хранит: значение приходит сверху, изменение уходит обратно через onChange
// (в визарде это dispatch).
export function AuditQuestionField({
  question,
  value,
  onChange,
  autoFocus = false,
  onModEnter,
}: AuditQuestionFieldProps) {
  if (question.type === 'text') {
    return (
      <TextArea
        value={typeof value === 'string' ? value : ''}
        onValueChange={onChange}
        maxLength={question.maxLength}
        showCounter
        autoFocus={autoFocus}
        onModEnter={onModEnter}
        hint={onModEnter ? 'Ctrl/⌘ + Enter — дальше' : undefined}
        placeholder={question.placeholder}
        aria-label={question.question}
      />
    );
  }

  if (question.type === 'single') {
    const picked = typeof value === 'string' ? value : '';

    return (
      <div role="group" aria-label={question.question} className="flex flex-wrap gap-2">
        {question.options.map((option) => {
          const on = option === picked;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              // Повторный клик по выбранному снимает выбор: так необязательный
              // вопрос можно «развыбрать».
              onClick={() => onChange(on ? '' : option)}
              className={`${chipBase} ${on ? chipOn : chipOff}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  const picked = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

  return (
    <div role="group" aria-label={question.question} className="flex flex-wrap gap-2">
      {question.options.map((option) => {
        const on = picked.includes(option);

        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? picked.filter((item) => item !== option) : [...picked, option])}
            className={`${chipBase} ${on ? chipOn : chipOff}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
