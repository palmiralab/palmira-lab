import type { ModelResponse, ServiceType } from './provider';

const VALID_SERVICE_TYPES: ServiceType[] = [
  'telegram_automation',
  'website_landing',
  'content_automation',
  'ai_consultation',
  'manual_review',
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
