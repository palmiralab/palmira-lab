import type { ServiceType } from '@/lib/ai-provider/provider';
import { MAX_DETAILS_LENGTH } from '@/lib/contact-limits';

// Выбор посетителя в карточке manual_review.
export type ManualChoice =
  | { kind: 'as_is' }
  | { kind: 'with_details'; details: string }
  | { kind: 'declined' };

// Что уходит в /api/contact поверх имени и контакта.
export type ContactSubmission = {
  serviceType: ServiceType;
  auditAnswers?: { details: string };
};

function cut(text: string): string | undefined {
  const trimmed = text.trim().slice(0, MAX_DETAILS_LENGTH);
  return trimmed ? trimmed : undefined;
}

// «Как есть» и «подробнее» — заявка на аудит (ai_consultation), «нет, спасибо» —
// остаётся manual_review. «Как есть» несёт реплики посетителя из чата: иначе
// лид пришёл бы без текста запроса.
export function buildManualSubmission(
  choice: ManualChoice,
  userMessages: string[],
): ContactSubmission {
  if (choice.kind === 'declined') {
    return { serviceType: 'manual_review' };
  }

  const details = cut(choice.kind === 'as_is' ? userMessages.join('\n') : choice.details);
  return {
    serviceType: 'ai_consultation',
    ...(details && { auditAnswers: { details } }),
  };
}
