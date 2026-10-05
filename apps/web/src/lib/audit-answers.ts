import {
  AUDIT_QUESTIONS,
  CHAT_CONTEXT_KEY,
  CHAT_CONTEXT_QUESTION,
  type AuditQuestion,
} from '@/lib/audit-questions';
import { limitDetails } from '@/lib/lead-details';

// Ответы так, как их присылает браузер: ключ вопроса и «сырое» значение. Типы
// не доверяем (данные из сети), поэтому unknown, а не string | string[].
export type RawAnswers = Record<string, unknown>;

// Заявка хранит вопрос рядом с ответом: она читается без справочника, даже если
// формулировки потом поменяются.
export type AnswerPair = { question: string; answer: string | string[] };
export type AuditAnswers = Record<string, AnswerPair>;

// Приводит сырое значение к тому, что можно сохранить, или возвращает undefined,
// если ответа нет. Чужое отбрасываем: ответ на выбор принимается, только если он
// есть среди вариантов вопроса, текст режем по пробелам и длине.
export function normalizeAnswer(
  question: AuditQuestion,
  value: unknown,
): string | string[] | undefined {
  if (question.type === 'text') {
    if (typeof value !== 'string') return undefined;
    const text = value.trim().slice(0, question.maxLength);
    return text || undefined;
  }

  if (question.type === 'single') {
    return typeof value === 'string' && question.options.includes(value) ? value : undefined;
  }

  if (!Array.isArray(value)) return undefined;
  // Порядок и повторы берём из списка вариантов, а не из присланного массива.
  const picked = question.options.filter((option) => value.includes(option));
  return picked.length > 0 ? picked : undefined;
}

// Ключи обязательных вопросов, на которые нет ответа. Пустой список: можно
// отправлять. Эту же проверку использует и визард (кнопка «Далее»).
export function findMissingRequired(raw: RawAnswers): string[] {
  return AUDIT_QUESTIONS.filter(
    (question) => question.required && normalizeAnswer(question, raw[question.key]) === undefined,
  ).map((question) => question.key);
}

// Собирает ответы для заявки. Пустое и чужое пропускает, порядок как в списке
// вопросов, реплики из чата идут последней парой. Нет ни одного ответа:
// undefined (в заявке auditAnswers останется пустым).
export function buildAuditAnswers(
  raw: RawAnswers,
  chatContext?: string,
): AuditAnswers | undefined {
  const result: AuditAnswers = {};

  for (const question of AUDIT_QUESTIONS) {
    const answer = normalizeAnswer(question, raw[question.key]);
    if (answer !== undefined) {
      result[question.key] = { question: question.question, answer };
    }
  }

  const chat = chatContext === undefined ? undefined : limitDetails(chatContext);
  if (chat) {
    result[CHAT_CONTEXT_KEY] = { question: CHAT_CONTEXT_QUESTION, answer: chat };
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
