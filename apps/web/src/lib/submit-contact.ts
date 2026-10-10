import type { ServiceType } from '@/lib/ai-provider/provider';
import type { RawAnswers } from '@/lib/audit-answers';
import { HONEYPOT_FIELD, readHoneypot } from '@/lib/honeypot';

// Отправка заявки из браузера на маршрут сайта /api/contact. Не путать с
// intake-client.ts: тот работает на сервере сайта и ходит уже в NestJS-API.

export type SubmitContactPayload = {
  name: string;
  contact: string;
  serviceType: ServiceType;
  // Свободное описание (вариант «подробнее» у manual_review).
  auditAnswers?: { details: string };
  // КП, которое видел посетитель (только исход «quote»).
  proposal?: Record<string, unknown>;
  // Анкета аудита: ключи и ответы, вопросы подставит сервер сайта.
  auditForm?: { answers: RawAnswers; chatContext?: string };
};

// Что делать посетителю: invalid — поправить данные, rate_limited — подождать,
// unavailable — повторить позже (от него ничего не зависит).
export type SubmitContactResult =
  | { ok: true }
  | { ok: false; kind: 'invalid' | 'rate_limited' | 'unavailable'; message: string };

const GENERIC_ERROR = 'Не удалось отправить, попробуйте ещё раз';
const MAX_MESSAGE_LENGTH = 200;

// Текст ошибки, который сервер сайта пишет для посетителя. Тела может не быть
// или оно не JSON: тогда undefined и подставится запасной текст.
async function readServerMessage(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    const error = (body as { error?: unknown } | null)?.error;
    return typeof error === 'string' && error.trim()
      ? error.trim().slice(0, MAX_MESSAGE_LENGTH)
      : undefined;
  } catch {
    return undefined;
  }
}

// Результат объектом, без исключений наружу. Серверный текст показываем только
// для 400 и 429; остальное (502, 500, обрыв сети) всегда одна фиксированная
// фраза, чтобы посетитель не видел непредсказуемый текст.
export async function submitContact(payload: SubmitContactPayload): Promise<SubmitContactResult> {
  let response: Response;
  try {
    response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, [HONEYPOT_FIELD]: readHoneypot() }),
    });
  } catch {
    return { ok: false, kind: 'unavailable', message: GENERIC_ERROR };
  }

  if (response.ok) return { ok: true };

  if (response.status === 400) {
    const message = (await readServerMessage(response)) ?? 'Проверьте введённые данные';
    return { ok: false, kind: 'invalid', message };
  }

  if (response.status === 429) {
    const message = (await readServerMessage(response)) ?? 'Слишком много запросов, попробуйте позже';
    return { ok: false, kind: 'rate_limited', message };
  }

  return { ok: false, kind: 'unavailable', message: GENERIC_ERROR };
}
