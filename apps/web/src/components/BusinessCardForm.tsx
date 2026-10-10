'use client';

import { useState } from 'react';
import { ChoiceChips } from '@/components/ChoiceChips';
import { LANDING_LIMITS } from '@/lib/landing-input';
import type { LandingDesign } from '@/lib/sandbox-store';
import { inputClass, primaryButtonClass } from '@/lib/ui-classes';

type FormState = {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  design: LandingDesign;
};

type CreateResult = { url: string; expiresAt: number };

const INITIAL_STATE: FormState = {
  name: '',
  description: '',
  phone: '',
  email: '',
  address: '',
  design: 'light',
};

const DESIGN_OPTIONS: { value: LandingDesign; label: string }[] = [
  { value: 'light', label: 'Светлая' },
  { value: 'bright', label: 'Яркая' },
  { value: 'dark', label: 'Тёмная' },
];

export function BusinessCardForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Меняет одно поле формы. K ограничен ключами FormState, поэтому значение
  // проверяется по типу именно этого поля: setField('design', 'neon') не пройдёт.
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.description.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/demo/landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Что-то пошло не так');
        return;
      }

      setResult(data as CreateResult);
    } catch {
      setError('Не удалось связаться с сервером');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Название (например, кофейня «Утро»)"
        value={form.name}
        maxLength={LANDING_LIMITS.name}
        onChange={(e) => setField('name', e.target.value)}
        className={inputClass}
      />
      <textarea
        placeholder="Чем вы занимаетесь, в паре предложений"
        value={form.description}
        maxLength={LANDING_LIMITS.description}
        rows={4}
        onChange={(e) => setField('description', e.target.value)}
        className={inputClass}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Телефон (вымышленный)"
          value={form.phone}
          maxLength={LANDING_LIMITS.phone}
          onChange={(e) => setField('phone', e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Почта (вымышленная)"
          value={form.email}
          maxLength={LANDING_LIMITS.email}
          onChange={(e) => setField('email', e.target.value)}
          className={inputClass}
        />
      </div>
      <input
        type="text"
        placeholder="Адрес (вымышленный)"
        value={form.address}
        maxLength={LANDING_LIMITS.address}
        onChange={(e) => setField('address', e.target.value)}
        className={inputClass}
      />
      <ChoiceChips
        label="Дизайн"
        options={DESIGN_OPTIONS}
        value={form.design}
        onChange={(design) => setField('design', design)}
      />
      <button onClick={handleSubmit} disabled={loading} className={primaryButtonClass}>
        {loading ? 'Собираю...' : 'Собрать страницу'}
      </button>
      <p className="text-xs text-slate-500">
        Введённый текст хранится на сервере 5 минут, затем удаляется. Не вводите личные данные.
      </p>

      {error && (
        <p className="animate-[fade-in-up_0.2s_ease-out] text-red-600 dark:text-red-400">{error}</p>
      )}

      {result && (
        <p className="text-slate-700 dark:text-slate-300">
          Готово:{' '}
          <a
            className="text-emerald-700 underline dark:text-emerald-400"
            href={result.url}
            target="_blank"
            rel="noreferrer"
          >
            {result.url}
          </a>{' '}
          — доступна до {new Date(result.expiresAt).toLocaleTimeString('ru-RU')}.
        </p>
      )}
    </div>
  );
}
