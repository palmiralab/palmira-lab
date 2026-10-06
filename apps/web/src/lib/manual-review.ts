import type { ServiceType } from '@/lib/ai-provider/provider';
import { detailsFromMessages } from '@/lib/lead-details';

// Что уходит в /api/contact поверх имени и контакта.
export type ContactSubmission = {
  serviceType: ServiceType;
  auditAnswers?: { details: string };
};

// «Нет, спасибо» в карточке manual_review: заявка остаётся manual_review, а в
// описании реплики посетителя из чата, иначе лид пришёл бы без текста запроса.
// Аудит из этой карточки идёт через анкету (AuditQuestionnaire), не через этот путь.
export function buildDeclinedSubmission(userMessages: string[]): ContactSubmission {
  const auditAnswers = detailsFromMessages(userMessages);
  return { serviceType: 'manual_review', ...(auditAnswers && { auditAnswers }) };
}
