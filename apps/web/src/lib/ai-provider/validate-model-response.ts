import { outcomeFor } from '../proposal-outcome';
import type { ModelResponse, ServiceType } from './provider';

export const VALID_SERVICE_TYPES: ServiceType[] = [
  'telegram_automation',
  'website_landing',
  'content_automation',
  'ai_consultation',
  'manual_review',
  'out_of_scope',
];

// Общая для всех провайдеров без серверной гарантии формы (сейчас — оба,
// и DeepSeek, и GigaChat в текстовом режиме, см. gigachat.ts) — каст сам по
// себе ничего не проверяет, форму нужно проверять в рантайме вручную.
export function isValidModelResponse(value: unknown): value is ModelResponse {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  if (v.type === 'question') {
    return typeof v.text === 'string';
  }

  if (v.type === 'proposal') {
    return (
      typeof v.serviceType === 'string' &&
      VALID_SERVICE_TYPES.includes(v.serviceType as ServiceType) &&
      typeof v.title === 'string' &&
      typeof v.problemSummary === 'string' &&
      Array.isArray(v.scope) && v.scope.every((x) => typeof x === 'string') &&
      Array.isArray(v.assumptions) && v.assumptions.every((x) => typeof x === 'string') &&
      Array.isArray(v.exclusions) && v.exclusions.every((x) => typeof x === 'string') &&
      typeof v.nextStep === 'string'
    );
  }

  return false;
}

// Модель иногда кладёт услугу в верхнеуровневый `type`: `{ "type": "manual_review" }`
// вместо предложения с `serviceType` (для ответа «вне наших услуг» это стабильно
// воспроизводится на GigaChat). Для услуг, у которых исход не показывает КП
// (аудит, ручной разбор), тела предложения не нужно, поэтому принимаем такой ответ
// как предложение с пустым телом. Для услуг с КП не трогаем: пустое КП недопустимо.
export function normalizeModelResponse(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) return value;

  const serviceType = VALID_SERVICE_TYPES.find((type) => type === (value as { type?: unknown }).type);
  if (!serviceType || outcomeFor(serviceType) === 'quote') return value;

  return {
    type: 'proposal',
    serviceType,
    title: '',
    problemSummary: '',
    scope: [],
    assumptions: [],
    exclusions: [],
    nextStep: '',
  };
}
