// Превью уведомления о заявке для демо. Текст повторяет формат настоящего
// сообщения, которое сервер шлёт владельцу в Telegram (apps/api, formatLeadNotice):
// «Новая заявка», пустая строка, затем «Имя / Контакт / Услуга». В демо ничего не
// отправляется: это только то, как выглядело бы сообщение.

export const LEAD_SERVICES = [
  { value: 'website', label: 'Сайт или лендинг' },
  { value: 'bot', label: 'Telegram-бот' },
  { value: 'automation', label: 'Автоматизация рутины' },
  { value: 'consulting', label: 'ИИ-консультация' },
] as const;

export type LeadServiceValue = (typeof LEAD_SERVICES)[number]['value'];

export const LEAD_TASK_LIMIT = 300;

export type LeadPreviewInput = {
  name: string;
  contact: string;
  service: LeadServiceValue;
  task: string;
};

const EMPTY = '—';

function serviceLabel(value: LeadServiceValue): string {
  return LEAD_SERVICES.find((item) => item.value === value)?.label ?? EMPTY;
}

// Пустые поля показываем прочерком, чтобы строки не пропадали и сообщение
// выглядело как настоящее. Текст задачи необязателен и обрезается по лимиту.
export function buildLeadPreview(input: LeadPreviewInput): string {
  const lines = [
    'Новая заявка',
    '',
    `Имя: ${input.name.trim() || EMPTY}`,
    `Контакт: ${input.contact.trim() || EMPTY}`,
    `Услуга: ${serviceLabel(input.service)}`,
  ];

  const task = input.task.trim().slice(0, LEAD_TASK_LIMIT);
  if (task) lines.push('', `Задача: ${task}`);

  return lines.join('\n');
}
