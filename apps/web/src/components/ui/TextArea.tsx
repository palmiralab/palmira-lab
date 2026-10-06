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
  rows = 4,
  ...rest
}: TextAreaProps) {
  const counterId = useId();
  const nearLimit = value.length >= maxLength * WARN_RATIO;

  return (
    <div className="flex flex-col gap-1">
      <textarea
        {...rest}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        maxLength={maxLength}
        rows={rows}
        // Счётчик читается при фокусе на поле, а не на каждый символ.
        aria-describedby={showCounter ? counterId : undefined}
        className={inputClass}
      />
      {showCounter && (
        <p
          id={counterId}
          data-near-limit={nearLimit}
          className={`self-end text-xs ${
            nearLimit ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {value.length} / {maxLength}
        </p>
      )}
    </div>
  );
}
