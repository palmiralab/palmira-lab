'use client';

// Выбор одного варианта чипсами, как радиокнопки (role="radiogroup"). Стиль
// как у подсказок в чате; выбранный чип выделен. Общий для форм демо.
type Option<T extends string> = { value: T; label: string };

export function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
            value === option.value
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300'
              : 'border-slate-300 text-slate-700 hover:border-emerald-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-400'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
