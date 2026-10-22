import { describe, expect, it } from 'vitest';
import { VALID_SERVICE_TYPES } from '@/lib/ai-provider/validate-model-response';
import { outcomeFor, proposalNotice } from './proposal-outcome';

describe('outcomeFor', () => {
  it.each([
    ['telegram_automation', 'quote'],
    ['website_landing', 'quote'],
    ['content_automation', 'quote'],
    ['ai_consultation', 'audit'],
    ['manual_review', 'manual'],
    ['out_of_scope', 'quote'],
  ] as const)('%s → %s', (serviceType, expected) => {
    expect(outcomeFor(serviceType)).toBe(expected);
  });

  it('у каждой услуги из VALID_SERVICE_TYPES есть исход', () => {
    for (const type of VALID_SERVICE_TYPES) {
      expect(['quote', 'audit', 'manual']).toContain(outcomeFor(type));
    }
  });
});

describe('proposalNotice', () => {
  it('для задачи вне типовых услуг КП показывается с пометкой о ручном разборе', () => {
    expect(proposalNotice('out_of_scope')).toContain('рассмотрит менеджер');
  });

  it('у остальных услуг пометки нет', () => {
    for (const type of VALID_SERVICE_TYPES.filter((t) => t !== 'out_of_scope')) {
      expect(proposalNotice(type)).toBeUndefined();
    }
  });
});
