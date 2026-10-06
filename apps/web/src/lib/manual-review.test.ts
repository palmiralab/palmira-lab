import { describe, expect, it } from 'vitest';
import { MAX_DETAILS_LENGTH } from './contact-limits';
import { buildDeclinedSubmission } from './manual-review';

const messages = ['Сделайте борщ', 'Лучше украинский'];

describe('buildDeclinedSubmission', () => {
  it('manual_review, в описании реплики посетителя', () => {
    expect(buildDeclinedSubmission(messages)).toEqual({
      serviceType: 'manual_review',
      auditAnswers: { details: 'Сделайте борщ\nЛучше украинский' },
    });
  });

  it('без реплик auditAnswers не создаётся', () => {
    expect(buildDeclinedSubmission([])).toEqual({ serviceType: 'manual_review' });
    expect(buildDeclinedSubmission(['   ', ''])).toEqual({ serviceType: 'manual_review' });
  });

  it('длинное описание обрезается до лимита', () => {
    const result = buildDeclinedSubmission(['а'.repeat(MAX_DETAILS_LENGTH + 500)]);

    expect(result.auditAnswers?.details).toHaveLength(MAX_DETAILS_LENGTH);
  });
});
