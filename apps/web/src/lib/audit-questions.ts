// Вопросы анкеты бесплатного ИИ-аудита: единственное место, где они описаны.
// Из этого списка строится форма (шаги визарда) и JSON для заявки, поэтому
// формулировку или варианты ответа меняем здесь, больше нигде.
//
// `key` — стабильное имя ответа в заявке (по смыслу, не по номеру), его же
// читают фильтры и админка. Текст вопроса уходит в заявку рядом с ответом, так
// что старые заявки остаются читаемыми, даже если мы потом поменяем формулировку.

type BaseQuestion = {
  key: string;
  question: string;
  // Обязательные вопросы не пускают дальше без ответа, остальные можно пропустить.
  required: boolean;
};

export type TextQuestion = BaseQuestion & {
  type: 'text';
  maxLength: number;
  placeholder?: string;
};

export type SingleQuestion = BaseQuestion & {
  type: 'single';
  options: readonly string[];
};

export type MultiQuestion = BaseQuestion & {
  type: 'multi';
  options: readonly string[];
};

export type AuditQuestion = TextQuestion | SingleQuestion | MultiQuestion;

// Пределы по полям. Считаются от худшего случая, а не «чтобы точно хватило»:
// 4 текстовых ответа по 500 символов, реплики из чата до 2000, тексты вопросов и
// варианты. Кириллица занимает 2 байта, вся анкета в худшем случае около 10 КБ, и
// общий предел слоёв route и API (16 КБ) даёт запас примерно 60%.
export const MAX_ANSWER_LENGTH = 500;
// Вариант ответа выбирают из списка, но route не должен верить браузеру.
export const MAX_OPTION_LENGTH = 60;

export const AUDIT_QUESTIONS: readonly AuditQuestion[] = [
  {
    key: 'businessDescription',
    question: 'Кратко: что за бизнес и кто ваши основные клиенты?',
    type: 'text',
    required: true,
    maxLength: MAX_ANSWER_LENGTH,
    placeholder: 'Например: салон красоты, клиенты — женщины 25–45',
  },
  {
    key: 'mainPainPoint',
    question: 'Какой один процесс сейчас отнимает больше всего времени, денег или нервов?',
    type: 'text',
    required: true,
    maxLength: MAX_ANSWER_LENGTH,
    placeholder: 'Например: переношу записи из WhatsApp в таблицу вручную',
  },
  {
    key: 'weeklyHours',
    question: 'Сколько времени в неделю это съедает?',
    type: 'single',
    required: false,
    options: ['До 5 часов', '5–20 часов', 'Больше 20 часов', 'Не знаю'],
  },
  {
    key: 'currentTools',
    question: 'В чём этот процесс делается прямо сейчас?',
    type: 'multi',
    required: false,
    options: ['Excel или Google Таблицы', '1С', 'CRM (amoCRM, Битрикс24)', 'Мессенджеры', 'Бумага', 'Другое'],
  },
  {
    key: 'triedBefore',
    question: 'Что уже пробовали делать, чтобы это исправить?',
    type: 'text',
    required: false,
    maxLength: MAX_ANSWER_LENGTH,
  },
  {
    key: 'hasTechPerson',
    question: 'Есть ли у вас технический специалист для обсуждения деталей?',
    type: 'single',
    required: false,
    options: ['Да, есть', 'Нет, я принимаю решения сам', 'Пока нет'],
  },
  {
    key: 'idealResult',
    question: 'Какой результат аудита был бы идеальным?',
    type: 'single',
    required: false,
    options: ['Пошаговый план действий', 'Оценка сроков и бюджета', 'Прототип', 'Пока не знаю'],
  },
];

// Реплики посетителя из чата прикладываются к анкете отдельной парой, не шагом
// визарда: человек уже рассказал задачу, второй раз спрашивать не нужно.
export const CHAT_CONTEXT_KEY = 'chatDescription';
export const CHAT_CONTEXT_QUESTION = 'Что вы описали в чате';
