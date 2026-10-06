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
  // Человек уже переходил между шагами. От этого зависит автофокус: при первой
  // загрузке поле не фокусируем (на телефоне клавиатура закрыла бы вводный текст),
  // а после «Далее» и «Назад» фокус идёт в текстовое поле нового шага.
  navigated: boolean;
};

export type WizardAction =
  | { type: 'answer'; key: string; value: unknown }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'setName'; value: string }
  | { type: 'setContact'; value: string };

export function initialWizardState(): WizardState {
  return { step: 0, answers: {}, name: '', contact: '', navigated: false };
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

// При уходе с шага убирает пробелы по краям у текстового ответа на нём. Пока
// человек печатает, значение хранится как есть (пробел внутри фразы нужен), а
// «подчищается» только на переходе. Ответ из одних пробелов удаляем совсем, чтобы
// он не лежал в состоянии мусором. Если чистить нечего, возвращает те же answers.
function trimmedAnswers(state: WizardState): RawAnswers {
  const question = AUDIT_QUESTIONS[state.step];
  if (!question || question.type !== 'text') return state.answers;

  const value = state.answers[question.key];
  if (typeof value !== 'string') return state.answers;

  const trimmed = value.trim();
  if (trimmed === value) return state.answers;

  const answers = { ...state.answers };
  if (trimmed) {
    answers[question.key] = trimmed;
  } else {
    delete answers[question.key];
  }
  return answers;
}

// Чистая функция: из старого состояния и действия делает новое, старое не
// трогает. Если действие ничего не меняет (например, «вперёд» при пустом
// обязательном ответе), возвращает то же состояние, и React не перерисовывает.
export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'answer':
      return { ...state, answers: { ...state.answers, [action.key]: action.value } };
    case 'next':
      return canGoNext(state)
        ? { ...state, step: state.step + 1, answers: trimmedAnswers(state), navigated: true }
        : state;
    case 'back':
      return state.step > 0
        ? { ...state, step: state.step - 1, answers: trimmedAnswers(state), navigated: true }
        : state;
    case 'setName':
      return { ...state, name: action.value };
    case 'setContact':
      return { ...state, contact: action.value };
  }
}
