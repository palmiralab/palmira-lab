'use client';

import { useState } from 'react';
import { ChoiceChips } from '@/components/ChoiceChips';
import {
  buildLeadPreview,
  LEAD_SERVICES,
  LEAD_TASK_LIMIT,
  type LeadServiceValue,
} from '@/lib/lead-preview';
import { inputClass } from '@/lib/ui-classes';

export function LeadPreviewForm() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [service, setService] = useState<LeadServiceValue>('website');
  const [task, setTask] = useState('');

  // Сообщение не хранится в состоянии: оно считается из полей при каждой
  // отрисовке. Ничего никуда не отправляется.
  const message = buildLeadPreview({ name, contact, service, task });

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Имя (вымышленное)"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Контакт (например, @username)"
          value={contact}
          maxLength={80}
          onChange={(e) => setContact(e.target.value)}
          className={inputClass}
        />
        <ChoiceChips
          label="Услуга"
          options={LEAD_SERVICES}
          value={service}
          onChange={setService}
        />
        <textarea
          placeholder="Что нужно сделать (необязательно)"
          value={task}
          maxLength={LEAD_TASK_LIMIT}
          rows={4}
          onChange={(e) => setTask(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <p className="mb-2 text-sm text-slate-500">Так сообщение придёт вам в Telegram:</p>
        <div className="overflow-hidden rounded-2xl border border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-slate-900">
          <div className="flex items-center gap-3 border-b border-sky-200 bg-sky-100 px-4 py-3 dark:border-sky-900 dark:bg-slate-800">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-semibold text-white"
            >
              Б
            </span>
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Ваш бот</span>
          </div>
          <div className="p-4">
            <div className="max-w-full rounded-2xl rounded-tl-sm bg-white p-3 text-[15px] leading-relaxed text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100">
              <p className="whitespace-pre-wrap break-words">{message}</p>
            </div>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Это макет: настоящее сообщение не отправляется, данные никуда не уходят и не
          сохраняются.
        </p>
      </div>
    </div>
  );
}
