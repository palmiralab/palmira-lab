import { describe, expect, it } from 'vitest';
import { buildLeadPreview, LEAD_TASK_LIMIT } from './lead-preview';

const base = { name: 'Анна', contact: '@anna_test', service: 'bot', task: '' } as const;

describe('buildLeadPreview', () => {
  it('повторяет формат настоящего уведомления', () => {
    expect(buildLeadPreview(base)).toBe(
      'Новая заявка\n\nИмя: Анна\nКонтакт: @anna_test\nУслуга: Telegram-бот',
    );
  });

  it('добавляет задачу отдельным блоком, если она есть', () => {
    const text = buildLeadPreview({ ...base, task: 'Нужен бот для записи' });
    expect(text.endsWith('\n\nЗадача: Нужен бот для записи')).toBe(true);
  });

  it('пустые имя и контакт показывает прочерком', () => {
    const text = buildLeadPreview({ ...base, name: '  ', contact: '' });
    expect(text).toContain('Имя: —');
    expect(text).toContain('Контакт: —');
  });

  it('обрезает пробелы и слишком длинную задачу', () => {
    const text = buildLeadPreview({ ...base, name: '  Анна  ', task: 'а'.repeat(LEAD_TASK_LIMIT + 50) });
    expect(text).toContain('Имя: Анна\n');
    expect(text.split('Задача: ')[1]).toHaveLength(LEAD_TASK_LIMIT);
  });
});
