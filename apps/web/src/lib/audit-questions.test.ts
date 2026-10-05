import { describe, expect, it } from 'vitest';
import {
  AUDIT_QUESTIONS,
  CHAT_CONTEXT_KEY,
  MAX_OPTION_LENGTH,
} from './audit-questions';

describe('AUDIT_QUESTIONS', () => {
  it('содержит семь вопросов', () => {
    expect(AUDIT_QUESTIONS).toHaveLength(7);
  });

  it('ключи уникальны и не совпадают с ключом реплик из чата', () => {
    const keys = AUDIT_QUESTIONS.map((q) => q.key);

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain(CHAT_CONTEXT_KEY);
  });

  it('обязательны только первые два вопроса: бизнес и главная боль', () => {
    const required = AUDIT_QUESTIONS.filter((q) => q.required).map((q) => q.key);

    expect(required).toEqual(['businessDescription', 'mainPainPoint']);
  });

  it('у вопросов с выбором есть варианты, и они не повторяются', () => {
    for (const q of AUDIT_QUESTIONS) {
      if (q.type === 'text') continue;
      expect(q.options.length).toBeGreaterThan(1);
      expect(new Set(q.options).size).toBe(q.options.length);
      for (const option of q.options) {
        expect(option.length).toBeLessThanOrEqual(MAX_OPTION_LENGTH);
      }
    }
  });

  it('у текстовых вопросов задан предел длины', () => {
    for (const q of AUDIT_QUESTIONS) {
      if (q.type !== 'text') continue;
      expect(q.maxLength).toBeGreaterThan(0);
    }
  });
});
