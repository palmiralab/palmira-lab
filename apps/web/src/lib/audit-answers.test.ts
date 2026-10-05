import { describe, expect, it } from 'vitest';
import {
  AUDIT_QUESTIONS,
  CHAT_CONTEXT_KEY,
  MAX_ANSWER_LENGTH,
  type AuditQuestion,
} from './audit-questions';
import { buildAuditAnswers, findMissingRequired, normalizeAnswer } from './audit-answers';

const byKey = (key: string): AuditQuestion => {
  const question = AUDIT_QUESTIONS.find((q) => q.key === key);
  if (!question) throw new Error(`нет вопроса ${key}`);
  return question;
};

const required = {
  businessDescription: 'Салон красоты',
  mainPainPoint: 'Запись вручную',
};

describe('normalizeAnswer', () => {
  it('текст: обрезает пробелы и длину, пустое превращает в undefined', () => {
    const q = byKey('businessDescription');

    expect(normalizeAnswer(q, '  Салон  ')).toBe('Салон');
    expect(normalizeAnswer(q, '   ')).toBeUndefined();
    expect(normalizeAnswer(q, 'а'.repeat(MAX_ANSWER_LENGTH + 50))).toHaveLength(MAX_ANSWER_LENGTH);
    expect(normalizeAnswer(q, 42)).toBeUndefined();
  });

  it('выбор: принимает только вариант из списка', () => {
    const q = byKey('weeklyHours');

    expect(normalizeAnswer(q, '5–20 часов')).toBe('5–20 часов');
    expect(normalizeAnswer(q, 'сколько угодно')).toBeUndefined();
    expect(normalizeAnswer(q, ['5–20 часов'])).toBeUndefined();
  });

  it('мультивыбор: оставляет известные варианты в порядке списка, без повторов', () => {
    const q = byKey('currentTools');

    expect(normalizeAnswer(q, ['Мессенджеры', 'Excel или Google Таблицы', 'Мессенджеры'])).toEqual([
      'Excel или Google Таблицы',
      'Мессенджеры',
    ]);
    expect(normalizeAnswer(q, ['что-то своё'])).toBeUndefined();
    expect(normalizeAnswer(q, [])).toBeUndefined();
    expect(normalizeAnswer(q, 'Excel или Google Таблицы')).toBeUndefined();
  });
});

describe('findMissingRequired', () => {
  it('возвращает ключи обязательных вопросов без ответа', () => {
    expect(findMissingRequired({})).toEqual(['businessDescription', 'mainPainPoint']);
    expect(findMissingRequired({ businessDescription: 'Салон', mainPainPoint: '  ' })).toEqual([
      'mainPainPoint',
    ]);
  });

  it('пусто, когда обязательные заполнены', () => {
    expect(findMissingRequired(required)).toEqual([]);
  });
});

describe('buildAuditAnswers', () => {
  it('кладёт рядом с ответом текст вопроса из списка', () => {
    const result = buildAuditAnswers({ ...required, weeklyHours: '5–20 часов' });

    expect(result).toEqual({
      businessDescription: {
        question: byKey('businessDescription').question,
        answer: 'Салон красоты',
      },
      mainPainPoint: { question: byKey('mainPainPoint').question, answer: 'Запись вручную' },
      weeklyHours: { question: byKey('weeklyHours').question, answer: '5–20 часов' },
    });
  });

  it('пропускает пропущенные необязательные вопросы и чужие ключи', () => {
    const result = buildAuditAnswers({
      ...required,
      triedBefore: '   ',
      currentTools: [],
      status: 'won',
    });

    expect(Object.keys(result ?? {})).toEqual(['businessDescription', 'mainPainPoint']);
  });

  it('идёт в порядке списка вопросов, а не порядка ключей в запросе', () => {
    const result = buildAuditAnswers({ idealResult: 'Прототип', ...required });

    expect(Object.keys(result ?? {})).toEqual([
      'businessDescription',
      'mainPainPoint',
      'idealResult',
    ]);
  });

  it('реплики из чата идут последней парой', () => {
    const result = buildAuditAnswers({ ...required, idealResult: 'Прототип' }, 'Нужен бот для записи');

    expect(Object.keys(result ?? {}).at(-1)).toBe(CHAT_CONTEXT_KEY);
    expect(result?.[CHAT_CONTEXT_KEY].answer).toBe('Нужен бот для записи');
  });

  it('реплики из чата режутся по общему пределу описания (2000)', () => {
    const result = buildAuditAnswers(required, 'а'.repeat(2500));

    expect(result?.[CHAT_CONTEXT_KEY].answer).toHaveLength(2000);
  });

  it('пустые реплики из чата в заявку не попадают', () => {
    expect(buildAuditAnswers(required, '   ')?.[CHAT_CONTEXT_KEY]).toBeUndefined();
  });

  it('нет ни одного ответа: undefined', () => {
    expect(buildAuditAnswers({})).toBeUndefined();
    expect(buildAuditAnswers({ businessDescription: '  ' }, '')).toBeUndefined();
  });
});
