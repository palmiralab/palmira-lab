import type { ServiceType } from '@/lib/ai-provider/provider';

// Что показываем посетителю по итогу чата:
// - quote:  КП по конкретной услуге + форма контакта (у out_of_scope — с пометкой
//           о ручном разборе, см. proposalNotice);
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

// Пометка над КП. Тоже исчерпывающий switch: новая услуга не останется без решения,
// нужна ли ей пометка.
export function proposalNotice(serviceType: ServiceType): string | undefined {
  switch (serviceType) {
    case 'out_of_scope':
      return 'Задача выходит за рамки наших типовых услуг: её рассмотрит менеджер вручную и свяжется с вами.';
    case 'telegram_automation':
    case 'website_landing':
    case 'content_automation':
    case 'ai_consultation':
    case 'manual_review':
      return undefined;
  }
}
