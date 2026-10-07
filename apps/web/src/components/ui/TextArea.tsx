import { useId, type TextareaHTMLAttributes } from 'react';
import { inputClass } from '@/lib/ui-classes';

type TextAreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'className' | 'maxLength'
> & {
  value: string;
  // Отдаёт новое значение строкой, а не событие: как emit('update:modelValue') во Vue.
  onValueChange: (value: string) => void;
  maxLength: number;
  // Счётчик «12 / 500» под полем. По умолчанию выключен.
  showCounter?: boolean;
  // Ctrl+Enter или ⌘+Enter в поле. Обычный Enter остаётся переводом строки.
  onModEnter?: () => void;
  // Подсказка под полем слева (скрыта на узких экранах: там нет клавиатуры).
  hint?: string;
};

// Начиная с этой доли лимита счётчик меняет цвет: человек видит, что место кончается.
const WARN_RATIO = 0.9;

// Текстовое поле нашего «ui-kit». Значение хранит родитель (управляемый компонент),
// поле только показывает его и сообщает об изменении.
export function TextArea({
  value,
  onValueChange,
  maxLength,
  showCounter = false,
  onModEnter,
  hint,
  rows = 4,
  ...rest
}: TextAreaProps) {
  const counterId = useId();
  const hintId = useId();
  const nearLimit = value.length >= maxLength * WARN_RATIO;

  return (
    <div className="flex flex-col gap-1">
      <textarea
        {...rest}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        maxLength={maxLength}
        rows={rows}
        onKeyDown={(e) => {
          if (onModEnter && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onModEnter();
          }
        }}
        // Счётчик и подсказка читаются при фокусе на поле, а не на каждый символ.
        aria-describedby={
          [showCounter && counterId, hint && hintId].filter(Boolean).join(' ') || undefined
        }
        className={inputClass}
      />
      {(showCounter || hint) && (
        <div className="flex items-start justify-between gap-3">
          {hint ? (
            <p id={hintId} className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              {hint}
            </p>
          ) : (
            <span />
          )}
          {showCounter && (
            <p
              id={counterId}
              data-near-limit={nearLimit}
              className={`text-xs ${
                nearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {value.length} / {maxLength}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
