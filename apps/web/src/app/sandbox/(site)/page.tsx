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
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Песочница: страничка по шаблону
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Введите заголовок и текст, выберите шаблон, и мы соберём из них отдельную
        страничку с готовой ссылкой, которой можно поделиться. Ссылка живёт 5 минут.
      </p>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Это не сайт целиком, а демонстрация автоматической сборки: так же страницы
        собираются и для ваших задач. В работе дизайн и тип страницы могут быть любыми, по
        согласованию.
      </p>

      <div className="mt-6 space-y-4">
        <input
          type="text"
          placeholder="Заголовок"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400"
        />
        <textarea
          placeholder="Текст (можно несколько строк)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400"
        />
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value as SandboxTemplate)}
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400"
        >
          <option value="note">Заметка</option>
          <option value="announcement">Объявление</option>
          <option value="fact">Факт</option>
        </select>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded bg-emerald-600 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-emerald-400 dark:text-slate-950"
        >
          {loading ? 'Собираю...' : 'Собрать страницу'}
        </button>
      </div>

      {error && (
        <p className="mt-4 animate-[fade-in-up_0.2s_ease-out] text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {result && (
        <p className="mt-4 text-slate-700 dark:text-slate-300">
          Готово:{' '}
          <a className="text-emerald-700 underline dark:text-emerald-400" href={result.url}>
            {result.url}
          </a>{' '}
          — доступна до {new Date(result.expiresAt).toLocaleTimeString('ru-RU')}.
        </p>
      )}
    </div>
  );
}
