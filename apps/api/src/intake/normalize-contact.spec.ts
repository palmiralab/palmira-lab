import { normalizeContact } from './normalize-contact.js';

describe('normalizeContact', () => {
  it('приводит Telegram-ник к одному виду: регистр, пробелы, @', () => {
    expect(normalizeContact('@Ivan_Petrov')).toBe('ivan_petrov');
    expect(normalizeContact('  ivan_petrov ')).toBe('ivan_petrov');
  });

  it('приводит email к нижнему регистру', () => {
    expect(normalizeContact('Ivan@Example.COM')).toBe('ivan@example.com');
  });

  it('оставляет в телефоне только цифры', () => {
    expect(normalizeContact('+7 (900) 123-45-67')).toBe('79001234567');
  });

  it('российский номер с 8 в начале равен номеру с 7', () => {
    expect(normalizeContact('8 900 123 45 67')).toBe(
      normalizeContact('+7 900 123 45 67'),
    );
  });

  it('разные контакты остаются разными', () => {
    expect(normalizeContact('@ivan')).not.toBe(normalizeContact('@ivan2'));
  });
});
