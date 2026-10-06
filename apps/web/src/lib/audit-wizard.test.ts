import { describe, expect, it } from 'vitest';
import {
  CONTACT_STEP,
  QUESTION_COUNT,
  canGoNext,
  canSubmit,
  initialWizardState,
  progressLabel,
  wizardReducer,
  type WizardAction,
  type WizardState,
} from './audit-wizard';

const run = (actions: WizardAction[], from: WizardState = initialWizardState()) =>
  actions.reduce(wizardReducer, from);

const answerRequired: WizardAction[] = [
  { type: 'answer', key: 'businessDescription', value: 'Салон' },
  { type: 'next' },
  { type: 'answer', key: 'mainPainPoint', value: 'Запись вручную' },
  { type: 'next' },
];

describe('wizardReducer', () => {
  it('начинается с первого шага без ответов', () => {
    expect(initialWizardState()).toEqual({
      step: 0,
      answers: {},
      name: '',
      contact: '',
    });
  });

  it('answer кладёт ответ и не меняет старое состояние', () => {
    const before = initialWizardState();
    const after = wizardReducer(before, { type: 'answer', key: 'businessDescription', value: 'Салон' });

    expect(after.answers).toEqual({ businessDescription: 'Салон' });
    expect(before.answers).toEqual({});
    expect(after).not.toBe(before);
  });

  it('не пускает вперёд, пока обязательный вопрос пуст, и возвращает то же состояние', () => {
    const before = initialWizardState();

    expect(wizardReducer(before, { type: 'next' })).toBe(before);
    expect(
      wizardReducer(wizardReducer(before, { type: 'answer', key: 'businessDescription', value: '   ' }), {
        type: 'next',
      }).step,
    ).toBe(0);
  });

  it('пускает вперёд после ответа на обязательный вопрос', () => {
    const state = run([
      { type: 'answer', key: 'businessDescription', value: 'Салон' },
      { type: 'next' },
    ]);

    expect(state.step).toBe(1);
  });

  it('необязательный вопрос можно пропустить без ответа', () => {
    const state = run([...answerRequired, { type: 'next' }]);

    expect(state.step).toBe(3);
  });

  it('назад возвращает на шаг и сохраняет ответы, ниже нуля не уходит', () => {
    const state = run([...answerRequired, { type: 'back' }]);

    expect(state.step).toBe(1);
    expect(state.answers.businessDescription).toBe('Салон');

    const first = initialWizardState();
    expect(wizardReducer(first, { type: 'back' })).toBe(first);
  });

  it('с шага контактов вперёд не идёт', () => {
    const atContacts: WizardState = {
      ...initialWizardState(),
      step: CONTACT_STEP,
      answers: { businessDescription: 'Салон', mainPainPoint: 'Запись' },
    };

    expect(wizardReducer(atContacts, { type: 'next' })).toBe(atContacts);
    expect(canGoNext(atContacts)).toBe(false);
  });

  describe('подрезка пробелов при уходе с шага', () => {
    it('вперёд: убирает пробелы по краям у текстового ответа', () => {
      const state = run([
        { type: 'answer', key: 'businessDescription', value: '  Салон  красоты \n' },
        { type: 'next' },
      ]);

      // внутренние пробелы не трогаем, только края
      expect(state.answers.businessDescription).toBe('Салон  красоты');
    });

    it('назад: тоже подрезает', () => {
      // answerRequired приводит на шаг 2; два «вперёд» дают шаг 4 (triedBefore)
      const state = run([
        ...answerRequired,
        { type: 'next' },
        { type: 'next' },
        { type: 'answer', key: 'triedBefore', value: '  пробовали CRM  ' },
        { type: 'back' },
      ]);

      expect(state.answers.triedBefore).toBe('пробовали CRM');
    });

    it('ответ из одних пробелов у необязательного вопроса удаляется', () => {
      const state = run([
        ...answerRequired,
        { type: 'next' },
        { type: 'next' },
        { type: 'answer', key: 'triedBefore', value: '    ' },
        { type: 'next' },
      ]);

      expect(state.answers).not.toHaveProperty('triedBefore');
    });

    it('пока человек печатает, пробелы по краям сохраняются', () => {
      const state = run([{ type: 'answer', key: 'businessDescription', value: 'Салон ' }]);

      expect(state.answers.businessDescription).toBe('Салон ');
    });

    it('выбор из вариантов не трогает, и без чистки answers остаётся тем же объектом', () => {
      const before = run([
        ...answerRequired,
        { type: 'answer', key: 'weeklyHours', value: 'До 5 часов' },
      ]);
      const after = wizardReducer(before, { type: 'next' });

      expect(after.answers).toBe(before.answers);
    });
  });

  it('имя и контакт сохраняются', () => {
    const state = run([
      { type: 'setName', value: 'Анна' },
      { type: 'setContact', value: '@anna' },
    ]);

    expect(state).toMatchObject({ name: 'Анна', contact: '@anna' });
  });
});

describe('canSubmit', () => {
  const ready: WizardState = {
    step: CONTACT_STEP,
    answers: { businessDescription: 'Салон', mainPainPoint: 'Запись' },
    name: 'Анна',
    contact: '@anna',
  };

  it('можно, когда обязательные вопросы, имя и контакт заполнены', () => {
    expect(canSubmit(ready)).toBe(true);
  });

  it.each([
    ['нет обязательного ответа', { answers: { businessDescription: 'Салон' } }],
    ['пустое имя', { name: '  ' }],
    ['пустой контакт', { contact: '' }],
  ])('нельзя: %s', (_title, patch) => {
    expect(canSubmit({ ...ready, ...patch })).toBe(false);
  });
});

describe('progressLabel', () => {
  it('для вопросов «Вопрос N из M», для контактов «Последний шаг»', () => {
    expect(progressLabel(0)).toBe(`Вопрос 1 из ${QUESTION_COUNT}`);
    expect(progressLabel(QUESTION_COUNT - 1)).toBe(`Вопрос ${QUESTION_COUNT} из ${QUESTION_COUNT}`);
    expect(progressLabel(CONTACT_STEP)).toBe('Последний шаг');
  });
});
