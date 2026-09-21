'use client';

import { useState } from 'react';

export function ProposalChat() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

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

      setResult(data);
    } catch {
      setError('Не удалось связаться с сервером');
    } finally {
      setLoading(false);
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
      {result != null && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
