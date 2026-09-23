'use client';

import { useState } from 'react';
import type { Proposal } from '@/lib/ai-provider/provider';

// GigaChat иногда сам добавляет "- " в начало пунктов массива — при рендере
// в <li> это задвоило бы буллет ("• - текст"), убираем.
function stripBullet(text: string): string {
  return text.replace(/^[-•]\s*/, '');
}

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
    <div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Опишите, что нужно сделать"
        rows={4}
      />
      <div>
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Отправляю...' : 'Отправить'}
        </button>
      </div>
      {error && <p>{error}</p>}
      {result && (
        <div>
          <h2>{result.title}</h2>
          <p>{result.problemSummary}</p>

          <h3>Состав работ</h3>
          <ul>
            {result.scope.map((item, i) => (
              <li key={i}>{stripBullet(item)}</li>
            ))}
          </ul>

          <h3>Допущения</h3>
          <ul>
            {result.assumptions.map((item, i) => (
              <li key={i}>{stripBullet(item)}</li>
            ))}
          </ul>

          <h3>Что не входит</h3>
          <ul>
            {result.exclusions.map((item, i) => (
              <li key={i}>{stripBullet(item)}</li>
            ))}
          </ul>

          <p>
            <strong>Стоимость:</strong>{' '}
            {result.priceRangeMin != null && result.priceRangeMax != null
              ? `${result.priceRangeMin}–${result.priceRangeMax} ₽`
              : 'обсудим после уточнения деталей'}
          </p>
          <p>
            <strong>Сроки:</strong>{' '}
            {result.estimatedTimelineText ?? 'обсудим после уточнения деталей'}
          </p>

          <p>
            <strong>Следующий шаг:</strong> {result.nextStep}
          </p>

          <p>
            <small>{result.disclaimer}</small>
          </p>

          {contactStatus === 'sent' ? (
            <p>Спасибо! Мы свяжемся с вами, чтобы уточнить детали.</p>
          ) : (
            <div>
              <h3>Оставить контакт</h3>
              <p>
                <small>Чтобы связаться и уточнить предложение — ничего лишнего не собираем.</small>
              </p>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Имя"
              />
              <input
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder="Телефон, email или Telegram"
              />
              <div>
                <button onClick={handleContactSubmit} disabled={contactStatus === 'sending'}>
                  {contactStatus === 'sending' ? 'Отправляю...' : 'Отправить контакт'}
                </button>
              </div>
              {contactStatus === 'error' && <p>Не удалось отправить, попробуйте ещё раз</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
