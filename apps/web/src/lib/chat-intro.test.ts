import { describe, expect, it } from 'vitest';
import { chatIntro } from './content';

describe('chatIntro', () => {
  it('первой строкой говорит, чем занимается студия', () => {
    expect(chatIntro.about).toContain('Palmira Lab');
    expect(chatIntro.about).toMatch(/бот/i);
    expect(chatIntro.about).toMatch(/сайт/i);
    expect(chatIntro.about).toMatch(/автоматизаци/i);
  });

  it('второй строкой объясняет, что получит посетитель', () => {
    expect(chatIntro.how).toMatch(/предложени/i);
    expect(chatIntro.how).toMatch(/состав работ/i);
  });

  it('говорит, что контакт оставляют по желанию', () => {
    expect(chatIntro.how).toMatch(/контакт/i);
  });

  it('не обещает число вопросов: оно зависит от промпта', () => {
    expect(`${chatIntro.about} ${chatIntro.how}`).not.toMatch(/\d\s*[–-]?\s*\d?\s*(уточняющ\S*\s+)?вопрос/i);
  });
});
