'use client';

import Link from 'next/link';
import { useState } from 'react';
import { formatHours, formatRub, formatWorkDays } from '@/lib/format-ru';
import { parseAmount } from '@/lib/parse-amount';
import {
  calcRoutine,
  WORK_HOURS_PER_DAY,
  WORK_WEEKS_PER_YEAR,
} from '@/lib/routine-calc';
import { inputClass } from '@/lib/ui-classes';

const labelClass = 'flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400';

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function RoutineCalculatorForm() {
  // В состоянии только то, что ввёл человек (строки). Результат не хранится:
  // он считается из этих строк при каждой отрисовке.
  const [hours, setHours] = useState('');
  const [people, setPeople] = useState('1');
  const [cost, setCost] = useState('');
  const [percent, setPercent] = useState('');

  const hourlyCost = parseAmount(cost);
  const result = calcRoutine({
    hoursPerWeek: parseAmount(hours),
    people: parseAmount(people),
    hourlyCost,
    automatablePercent: percent.trim() === '' ? null : parseAmount(percent),
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Сколько часов в неделю уходит на рутину (на одного человека)"
          value={hours}
          onChange={setHours}
          placeholder="например, 5"
        />
        <Field
          label="Сколько человек этим занимается"
          value={people}
          onChange={setPeople}
          placeholder="например, 2"
        />
        <Field
          label="Сколько стоит час работы, ₽ (необязательно)"
          value={cost}
          onChange={setCost}
          placeholder="например, 1000"
        />
        <Field
          label="Какую часть, по вашей оценке, можно автоматизировать, % (необязательно)"
          value={percent}
          onChange={setPercent}
          placeholder="например, 50"
        />
      </div>

      <div
        aria-live="polite"
        className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
      >
        {result ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">За год рутина занимает:</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {formatHours(result.hoursPerYear)}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Это {formatWorkDays(result.workDaysPerYear)}
              {hourlyCost > 0 && <>, около {formatRub(result.costPerYear)} в год</>}.
            </p>
            {result.saved && (
              <p className="text-emerald-700 dark:text-emerald-400">
                Если автоматизировать эту часть, высвободится около{' '}
                {formatHours(result.saved.hoursPerYear)} (
                {formatWorkDays(result.saved.workDaysPerYear)}
                {hourlyCost > 0 && <>, {formatRub(result.saved.costPerYear)}</>}) в год.
              </p>
            )}
            <p className="text-xs text-slate-500">
              Это арифметика ваших чисел, а не прогноз: часы в неделю × люди × {WORK_WEEKS_PER_YEAR}{' '}
              рабочих недель в году; рабочий день — {WORK_HOURS_PER_DAY} часов. Долю автоматизации
              вы называете сами.
            </p>
          </div>
        ) : (
          <p className="text-slate-500">
            Введите, сколько часов в неделю уходит на рутину, и мы посчитаем, сколько это за год.
          </p>
        )}
      </div>

      <p className="text-slate-600 dark:text-slate-400">
        Не знаете, что из этого реально автоматизировать?{' '}
        <Link href="/audit" className="text-emerald-700 underline dark:text-emerald-400">
          Бесплатный ИИ-аудит →
        </Link>
      </p>
    </div>
  );
}
