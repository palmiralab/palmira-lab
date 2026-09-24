'use client';

import { useState } from 'react';
import type { Proposal } from '@/lib/ai-provider/provider';

// GigaChat иногда сам добавляет "- " в начало пунктов массива — при рендере
// в <li> это задвоило бы буллет ("• - текст"), убираем.
function stripBullet(text: string): string {
  return text.replace(/^[-•]\s*/, '');
}

const inputClass =
  'w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 ' +
  'focus:border-emerald-600 focus:outline-none ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400';
const primaryButtonClass =
  'w-full rounded bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50 sm:w-auto ' +
  'dark:bg-emerald-400 dark:text-slate-950';

export function ProposalChat() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [contactName, setContactName] = useState('');
  const [contactValue, setContactValue] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit() {
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setContactStatus('idle');
    setContactName('');
    setContactValue('');

    try {
      const response = await fetch('/api/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Что-то пошло не так');
        return;
      }

      setResult(data as Proposal);
    } catch {
      setError('Не удалось связаться с сервером');
    } finally {
      setLoading(false);
    }
  }

  async function handleContactSubmit() {
    if (!contactName.trim() || !contactValue.trim() || !result) return;

    setContactStatus('sending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: contactName, contact: contactValue, proposalId: result.id }),
      });

      setContactStatus(response.ok ? 'sent' : 'error');
    } catch {
      setContactStatus('error');
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Опишите, что нужно сделать"
        rows={4}
        className={inputClass}
      />
      <div>
        <button onClick={handleSubmit} disabled={loading} className={primaryButtonClass}>
          {loading ? 'Отправляю...' : 'Отправить'}
        </button>
      </div>
      {error && (
        <p className="animate-[fade-in-up_0.2s_ease-out] text-red-600 dark:text-red-400">{error}</p>
      )}
      {result && (
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{result.title}</h2>
            <p className="mt-1 text-slate-600 dark:text-slate-400">{result.problemSummary}</p>
          </div>

          <div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100">Состав работ</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
              {result.scope.map((item, i) => (
                <li key={i}>{stripBullet(item)}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100">Допущения</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
              {result.assumptions.map((item, i) => (
                <li key={i}>{stripBullet(item)}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-slate-900 dark:text-slate-100">Что не входит</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
              {result.exclusions.map((item, i) => (
                <li key={i}>{stripBullet(item)}</li>
              ))}
            </ul>
          </div>

          <p className="text-slate-800 dark:text-slate-200">
            <strong>Стоимость:</strong>{' '}
            {result.priceRangeMin != null && result.priceRangeMax != null
              ? `${result.priceRangeMin}–${result.priceRangeMax} ₽`
              : 'обсудим после уточнения деталей'}
          </p>
          <p className="text-slate-800 dark:text-slate-200">
            <strong>Сроки:</strong>{' '}
            {result.estimatedTimelineText ?? 'обсудим после уточнения деталей'}
          </p>

          <p className="text-slate-800 dark:text-slate-200">
            <strong>Следующий шаг:</strong> {result.nextStep}
          </p>

          <p className="text-sm text-slate-500">
            <small>{result.disclaimer}</small>
          </p>

          {contactStatus === 'sent' ? (
            <p className="text-emerald-700 dark:text-emerald-400">
              Спасибо! Мы свяжемся с вами, чтобы уточнить детали.
            </p>
          ) : (
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="font-medium text-slate-900 dark:text-slate-100">Оставить контакт</h3>
              <p className="text-sm text-slate-500">
                <small>Чтобы связаться и уточнить предложение — ничего лишнего не собираем.</small>
              </p>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Имя"
                className={inputClass}
              />
              <input
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder="Телефон, email или Telegram"
                className={inputClass}
              />
              <div>
                <button
                  onClick={handleContactSubmit}
                  disabled={contactStatus === 'sending'}
                  className={primaryButtonClass}
                >
                  {contactStatus === 'sending' ? 'Отправляю...' : 'Отправить контакт'}
                </button>
              </div>
              {contactStatus === 'error' && (
                <p className="animate-[fade-in-up_0.2s_ease-out] text-red-600 dark:text-red-400">
                  Не удалось отправить, попробуйте ещё раз
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
