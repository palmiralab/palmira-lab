import { describe, expect, it } from 'vitest';
import { MAX_DETAILS_LENGTH } from './contact-limits';
import { buildManualSubmission } from './manual-review';

const messages = ['Сделайте борщ', 'Лучше украинский'];

describe('buildManualSubmission', () => {
  it('«нет, спасибо»: manual_review без описания', () => {
    expect(buildManualSubmission({ kind: 'declined' }, messages)).toEqual({
      serviceType: 'manual_review',
    });
  });

  it('«как есть»: аудит, в описании реплики посетителя', () => {
    expect(buildManualSubmission({ kind: 'as_is' }, messages)).toEqual({
      serviceType: 'ai_consultation',
      auditAnswers: { details: 'Сделайте борщ\nЛучше украинский' },
    });
  });

  it('«подробнее»: аудит, в описании только введённый текст', () => {
    expect(
      buildManualSubmission({ kind: 'with_details', details: '  Нужна автоматизация склада  ' }, messages),
    ).toEqual({
      serviceType: 'ai_consultation',
      auditAnswers: { details: 'Нужна автоматизация склада' },
    });
  });

  it('пустое описание не создаёт auditAnswers', () => {
    expect(buildManualSubmission({ kind: 'with_details', details: '   ' }, messages)).toEqual({
      serviceType: 'ai_consultation',
    });
    expect(buildManualSubmission({ kind: 'as_is' }, [])).toEqual({ serviceType: 'ai_consultation' });
  });

  it('длинное описание обрезается до лимита', () => {
    const result = buildManualSubmission({ kind: 'as_is' }, ['а'.repeat(MAX_DETAILS_LENGTH + 500)]);

    expect(result.auditAnswers?.details).toHaveLength(MAX_DETAILS_LENGTH);
  });
});
