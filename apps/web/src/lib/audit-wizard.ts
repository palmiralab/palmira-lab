import { AUDIT_QUESTIONS } from '@/lib/audit-questions';
import { findMissingRequired, normalizeAnswer, type RawAnswers } from '@/lib/audit-answers';

// Логика визарда без React: что хранится, как меняется и когда можно идти дальше.
// Отдельно от разметки, чтобы все правила лежали в одном месте и проверялись
// тестами без браузера. В компоненте это подключается через useReducer.

// Шаги 0…(N-1) — вопросы анкеты, шаг N — контакты и отправка.
export const QUESTION_COUNT = AUDIT_QUESTIONS.length;
export const CONTACT_STEP = QUESTION_COUNT;

export type WizardState = {
  step: number;
  answers: RawAnswers;
  name: string;
  contact: string;
};

export type WizardAction =
  | { type: 'answer'; key: string; value: unknown }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'setName'; value: string }
  | { type: 'setContact'; value: string };

export function initialWizardState(): WizardState {
  return { step: 0, answers: {}, name: '', contact: '' };
}

// Можно ли с текущего шага идти вперёд. Обязательный вопрос без ответа не
// пускает, необязательный можно пропустить. С шага контактов вперёд некуда.
export function canGoNext(state: WizardState): boolean {
  if (state.step >= CONTACT_STEP) return false;

  const question = AUDIT_QUESTIONS[state.step];
  return !question.required || normalizeAnswer(question, state.answers[question.key]) !== undefined;
}

// Можно ли отправлять: обязательные вопросы отвечены, имя и контакт есть. Согласие
// отдельным шагом не берём: как на остальных формах сайта, оно даётся самой
// отправкой (фраза со ссылкой на /privacy под кнопкой).
export function canSubmit(state: WizardState): boolean {
  return (
    findMissingRequired(state.answers).length === 0 &&
    state.name.trim() !== '' &&
    state.contact.trim() !== ''
  );
}

// «Вопрос 3 из 7» для вопросов, подпись для финального шага.
export function progressLabel(step: number): string {
  return step >= CONTACT_STEP ? 'Последний шаг' : `Вопрос ${step + 1} из ${QUESTION_COUNT}`;
}

// Чистая функция: из старого состояния и действия делает новое, старое не
// трогает. Если действие ничего не меняет (например, «вперёд» при пустом
// обязательном ответе), возвращает то же состояние, и React не перерисовывает.
export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'answer':
      return { ...state, answers: { ...state.answers, [action.key]: action.value } };
    case 'next':
      return canGoNext(state) ? { ...state, step: state.step + 1 } : state;
    case 'back':
      return state.step > 0 ? { ...state, step: state.step - 1 } : state;
    case 'setName':
      return { ...state, name: action.value };
    case 'setContact':
      return { ...state, contact: action.value };
  }
}
