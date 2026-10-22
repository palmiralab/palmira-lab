import type { ServiceType } from '@/lib/ai-provider/provider';

// Что показываем посетителю по итогу чата:
// - quote:  КП по конкретной услуге + форма контакта;
// - audit:  без КП, заявка на бесплатный ИИ-аудит;
// - manual: запрос не подходит под услуги, предлагаем аудит или ручной разбор.
export type ProposalOutcome = 'quote' | 'audit' | 'manual';

// Все значения ServiceType перечислены явно, без `default`: при добавлении
// новой услуги TypeScript не даст собрать код, пока не решим, какой у неё исход.
export function outcomeFor(serviceType: ServiceType): ProposalOutcome {
  switch (serviceType) {
    case 'telegram_automation':
    case 'website_landing':
    case 'content_automation':
    case 'out_of_scope':
      return 'quote';
    case 'ai_consultation':
      return 'audit';
    case 'manual_review':
      return 'manual';
  }
}

