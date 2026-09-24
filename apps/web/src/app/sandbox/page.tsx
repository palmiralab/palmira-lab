'use client';

import { useState } from 'react';
import type { SandboxTemplate } from '@/lib/sandbox-store';

type CreateResult = { url: string; expiresAt: number };

export default function SandboxFormPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [template, setTemplate] = useState<SandboxTemplate>('note');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, template }),
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
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Песочница: страница по шаблону</h1>
      <p className="mt-2 text-slate-600">
        Текст + шаблон → живая ссылка на пару минут. Демонстрация того, как работает
        автоматическая сборка страниц.
      </p>

      <div className="mt-6 space-y-4">
        <input
          type="text"
          placeholder="Заголовок"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <textarea
          placeholder="Текст (можно несколько строк)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="w-full rounded border border-slate-300 px-3 py-2"
        />
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value as SandboxTemplate)}
          className="w-full rounded border border-slate-300 px-3 py-2"
        >
          <option value="note">Заметка</option>
          <option value="announcement">Объявление</option>
          <option value="fact">Факт</option>
        </select>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? 'Собираю...' : 'Собрать страницу'}
        </button>
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {result && (
        <p className="mt-4 text-slate-700">
          Готово: <a className="text-emerald-700 underline" href={result.url}>{result.url}</a>{' '}
          — доступна до {new Date(result.expiresAt).toLocaleTimeString('ru-RU')}.
        </p>
      )}
    </main>
  );
}
