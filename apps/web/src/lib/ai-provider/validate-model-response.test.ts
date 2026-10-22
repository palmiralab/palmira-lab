import { describe, expect, it } from 'vitest';
import {
  isValidModelResponse,
  normalizeModelResponse,
} from './validate-model-response';

describe('normalizeModelResponse', () => {
  it.each(['manual_review', 'ai_consultation'])(
    '{ type: %s } становится валидным предложением с пустым телом',
    (type) => {
      const normalized = normalizeModelResponse({ type });

      expect(isValidModelResponse(normalized)).toBe(true);
      expect(normalized).toMatchObject({ type: 'proposal', serviceType: type });
    },
  );

  it('лишние поля модели (reason) не мешают', () => {
    const normalized = normalizeModelResponse({ type: 'manual_review', reason: 'вне услуг' });

    expect(isValidModelResponse(normalized)).toBe(true);
  });

  it.each(['telegram_automation', 'website_landing', 'content_automation', 'out_of_scope'])(
    '{ type: %s } с КП не трогаем: остаётся невалидным',
    (type) => {
      const value = { type };

      expect(normalizeModelResponse(value)).toBe(value);
      expect(isValidModelResponse(normalizeModelResponse(value))).toBe(false);
    },
  );

  it('обычные ответы проходят без изменений', () => {
    const question = { type: 'question', text: 'Какой бюджет?' };

    expect(normalizeModelResponse(question)).toBe(question);
    expect(normalizeModelResponse('текст')).toBe('текст');
    expect(normalizeModelResponse(null)).toBeNull();
  });
});
