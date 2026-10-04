import type { ServiceType } from '@/lib/ai-provider/provider';
import { detailsFromMessages, limitDetails } from '@/lib/lead-details';

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

// «Как есть» и «подробнее» — заявка на аудит (ai_consultation), «нет, спасибо» —
// остаётся manual_review. Во всех вариантах, кроме «подробнее» (там введённый
// текст), описание это реплики посетителя из чата: иначе лид пришёл бы без текста
// запроса.
export function buildManualSubmission(
  choice: ManualChoice,
  userMessages: string[],
): ContactSubmission {
  if (choice.kind === 'declined') {
    const auditAnswers = detailsFromMessages(userMessages);
    return { serviceType: 'manual_review', ...(auditAnswers && { auditAnswers }) };
  }

  const details =
    choice.kind === 'as_is' ? detailsFromMessages(userMessages)?.details : limitDetails(choice.details);
  return {
    serviceType: 'ai_consultation',
    ...(details && { auditAnswers: { details } }),
  };
}
