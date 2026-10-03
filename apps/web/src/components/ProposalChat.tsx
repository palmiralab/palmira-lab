'use client';

import { useEffect, useRef, useState } from 'react';
import type { Proposal } from '@/lib/ai-provider/provider';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { ProposalCard } from '@/components/ProposalCard';
import { RestartControl } from '@/components/RestartControl';
import { inputClass, primaryButtonClass } from '@/lib/ui-classes';

// Ровно то, что уходит в POST /api/proposal messages[] — история диалога,
// без финальной карточки КП (она не текст, отдельное состояние `proposal`,
// и диалог на ней всегда завершается, дальше в messages не попадает).
type ChatMessage = { role: 'user' | 'assistant'; content: string };

// Урезано относительно §11.2 session-plan.md для MVP: `sending` слит с
// `waiting_reply` (между кликом и появлением индикатора набора текста нет
// отдельного видимого состояния), `rate_limited` — это просто текст в
// `error` (сервер и так возвращает понятное сообщение на 429).
type ChatState =
  | 'idle'
  | 'waiting_reply'
  | 'collecting_contact'
  | 'completed'
  | 'error'
  | 'restart_confirm';

// Роман попросил не показывать 502 сразу — конкретное число не называл,
// 3 выбрано по аналогии с MAX_JSON_PARSE_ATTEMPTS на сервере (та же
// вероятностная природа сбоя), несложно подправить, если окажется мало/много.
const MAX_SEND_ATTEMPTS = 3;

// Растущая пауза перед повтором (500мс, потом 1000мс) — предположение
// Романа: несколько сбоев подряд без паузы может быть не независимыми
// случайностями, а коротким "плохим" окном у самого GigaChat, и мгновенный
// повтор просто попадает в то же окно. Перед первой попыткой паузы нет.
const RETRY_BASE_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ProposalChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [state, setState] = useState<ChatState>('idle');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [contactName, setContactName] = useState('');
  const [contactValue, setContactValue] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const draftInputRef = useRef<HTMLTextAreaElement>(null);

  // 'restart_confirm' перекрывает state, поэтому то, к чему нужно вернуться
  // при отмене ('idle', 'error', 'collecting_contact' — в зависимости от
  // момента клика), теряется на обычном useState. Ref, а не ещё один
  // useState — это не то, что триггерит собственный рендер, просто память
  // на время подтверждения.
  const stateBeforeRestartRef = useRef<ChatState>('idle');

  function handleRestartRequest() {
    stateBeforeRestartRef.current = state;
    setState('restart_confirm');
  }

  function handleRestartCancel() {
    setState(stateBeforeRestartRef.current);
  }

  function handleRestartConfirm() {
    setMessages([]);
    setDraft('');
    setProposal(null);
    setError(null);
    setContactName('');
    setContactValue('');
    setContactStatus('idle');
    setState('idle');
  }

  // Роман печатает "вслепую" (не глядя на экран) — фокус сам должен
  // оказаться в поле ввода каждый раз, как оно снова готово принимать текст
  // (пришёл новый вопрос — 'idle', либо провал после автопопыток, текст
  // можно сразу отправить ещё раз — 'error'), иначе набранное на автомате
  // проскакивает мимо. Пока поле disabled ('waiting_reply') — фокусить
  // некуда, браузер всё равно не даст.
  useEffect(() => {
    if (state === 'idle' || state === 'error') {
      draftInputRef.current?.focus();
    }
  }, [state]);

  async function handleSend() {
    const content = draft.trim();
    if (!content || state === 'waiting_reply') return;

    // Если прошлая попытка провалилась насовсем (state === 'error'), последняя
    // запись в messages — та самая непринятая реплика (по устройству стейт-машины
    // иначе state в 'error' не попадает). Повторная отправка заменяет её, а не
    // добавляет вторую копию поверх — чтобы ручной повтор после исчерпания
    // автопопыток не плодил дубли в треде.
    const nextMessages: ChatMessage[] =
      state === 'error'
        ? [...messages.slice(0, -1), { role: 'user', content }]
        : [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    // Реплика уже в ленте, поле очищаем сразу; при провале текст вернётся
    // (setDraft(content) в ветках ошибки ниже), чтобы набранное не терялось.
    setDraft('');
    setError(null);
    setState('waiting_reply');

    // 502 от /api/proposal — это исчерпанные внутренние (серверные) попытки
    // распарсить JSON от GigaChat (см. MAX_JSON_PARSE_ATTEMPTS в gigachat.ts),
    // не детерминированная ошибка запроса — есть смысл повторить весь HTTP-вызов
    // ещё раз с тем же nextMessages, не только внутренний парсинг. 400/429 сюда
    // не попадают — это не транзиентные сбои, повтор с теми же данными их не
    // исправит.
    for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
      try {
        const response = await fetch('/api/proposal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: nextMessages }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 502 && attempt < MAX_SEND_ATTEMPTS) {
            await delay(RETRY_BASE_DELAY_MS * attempt);
            continue;
          }
          setDraft(content);
          setError(typeof data?.error === 'string' ? data.error : 'Что-то пошло не так');
          setState('error');
          return;
        }

        if (data.type === 'question') {
          setMessages([...nextMessages, { role: 'assistant', content: data.text }]);
          setState('idle');
        } else {
          setProposal(data.proposal as Proposal);
          setState('collecting_contact');
        }
        return;
      } catch {
        if (attempt < MAX_SEND_ATTEMPTS) {
          await delay(RETRY_BASE_DELAY_MS * attempt);
          continue;
        }
        setDraft(content);
        setError('Не удалось связаться с сервером');
        setState('error');
        return;
      }
    }
  }

  async function handleContactSubmit() {
    if (!contactName.trim() || !contactValue.trim() || !proposal) return;

    setContactStatus('sending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          contact: contactValue,
          serviceType: proposal.serviceType,
        }),
      });

      if (response.ok) {
        setContactStatus('sent');
        setState('completed');
      } else {
        setContactStatus('error');
      }
    } catch {
      setContactStatus('error');
    }
  }

  const questionsAsked = messages.filter((m) => m.role === 'assistant').length;

  // Пока идёт запрос — рестарт не показываем: handleSend уже "летит" с
  // замкнутым nextMessages и по ответу вызовет setMessages/setState заново,
  // сброс во время waiting_reply перезапишется этим ответом, когда он
  // придёт. Проще не показывать кнопку в этом окне, чем гоняться за
  // AbortController-ом ради состояния в пару секунд.
  const canRestart = state !== 'waiting_reply' && state !== 'restart_confirm' && (messages.length > 0 || proposal !== null);
  const restartControl = (canRestart || state === 'restart_confirm') && (
    <RestartControl
      confirming={state === 'restart_confirm'}
      onRequest={handleRestartRequest}
      onConfirm={handleRestartConfirm}
      onCancel={handleRestartCancel}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      {messages.length > 0 && (
        <div className="flex flex-col gap-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === 'user'
                  ? 'self-end rounded-lg bg-emerald-600 px-3 py-2 text-white dark:bg-emerald-400 dark:text-slate-950'
                  : 'self-start rounded-lg bg-slate-100 px-3 py-2 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
              }
            >
              {m.content}
            </div>
          ))}
          {state === 'waiting_reply' && <TypingIndicator />}
        </div>
      )}

      {!proposal && (
        <>
          <ProgressIndicator questionsAsked={questionsAsked} />
          <textarea
            ref={draftInputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={messages.length === 0 ? 'Опишите, что нужно сделать' : 'Ваш ответ'}
            rows={3}
            disabled={state === 'waiting_reply'}
            className={inputClass}
          />
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={handleSend}
              disabled={state === 'waiting_reply' || !draft.trim()}
              className={primaryButtonClass}
            >
              {state === 'waiting_reply' ? 'Отправляю...' : 'Отправить'}
            </button>
            {restartControl}
          </div>
        </>
      )}
      {error && (
        <p className="animate-[fade-in-up_0.2s_ease-out] text-red-600 dark:text-red-400">{error}</p>
      )}
      {proposal && (
        <ProposalCard
          proposal={proposal}
          contactName={contactName}
          contactValue={contactValue}
          contactStatus={contactStatus}
          onContactNameChange={setContactName}
          onContactValueChange={setContactValue}
          onContactSubmit={handleContactSubmit}
          restartControl={restartControl}
        />
      )}
    </div>
  );
}
