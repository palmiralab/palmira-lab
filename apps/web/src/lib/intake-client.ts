import type { ServiceType } from '@/lib/ai-provider/provider';

export type ContactPayload = {
  name: string;
  contact: string;
  serviceType: ServiceType;
  // Свободное описание от посетителя (вариант «опишите подробнее» у manual_review).
  auditAnswers?: { details: string };
};

// Результат без исключений: вызывающий (route handler) решает, какой HTTP-код
// отдать посетителю. `status` — код для ответа сайта, не код NestJS.
export type ContactResult = { ok: true } | { ok: false; status: number; error: string };

const UNAVAILABLE: ContactResult = {
  ok: false,
  status: 502,
  error: 'Сервис временно недоступен, попробуйте позже',
};

export async function sendContact(payload: ContactPayload): Promise<ContactResult> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    console.error('API_URL не задан');
    return UNAVAILABLE;
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/intake/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // API лежит или нет сети: посетителю детали ни к чему.
    return UNAVAILABLE;
  }

  if (response.ok) {
    return { ok: true };
  }

  if (response.status === 400) {
    return { ok: false, status: 400, error: 'Проверьте имя и контакт для связи' };
  }

  // 404 и 409 (разговор не найден / уже занят) сайт пока не провоцирует:
  // conversationId мы не шлём. Если всё же пришли, это наша ошибка, не
  // посетителя, поэтому отвечаем как при сбое.
  return UNAVAILABLE;
}
