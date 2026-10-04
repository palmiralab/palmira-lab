import { MAX_DETAILS_LENGTH } from '@/lib/contact-limits';

// Свободное описание для заявки: обрезаем пробелы и длину, пустое не отправляем.
export function limitDetails(text: string): string | undefined {
  const trimmed = text.trim().slice(0, MAX_DETAILS_LENGTH);
  return trimmed ? trimmed : undefined;
}

// Реплики посетителя из чата, склеенные переносом строки: без них лид в Telegram
// приходит без текста запроса.
export function detailsFromMessages(userMessages: string[]): { details: string } | undefined {
  const details = limitDetails(userMessages.join('\n'));
  return details ? { details } : undefined;
}
