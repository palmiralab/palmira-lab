import { describe, expect, it } from 'vitest';
import { formatHours, formatRub, formatWorkDays, pluralRu } from './format-ru';

const DAYS = ['день', 'дня', 'дней'] as const;

// Intl ставит неразрывные пробелы; в тестах сравниваем с обычными.
const plain = (text: string) => text.replace(/[  ]/g, ' ');

describe('pluralRu', () => {
  it('склоняет по последней цифре', () => {
    expect(pluralRu(1, DAYS)).toBe('день');
    expect(pluralRu(2, DAYS)).toBe('дня');
    expect(pluralRu(4, DAYS)).toBe('дня');
    expect(pluralRu(5, DAYS)).toBe('дней');
    expect(pluralRu(0, DAYS)).toBe('дней');
  });

  it('11–14 всегда «дней», а 21 снова «день»', () => {
    expect(pluralRu(11, DAYS)).toBe('дней');
    expect(pluralRu(12, DAYS)).toBe('дней');
    expect(pluralRu(14, DAYS)).toBe('дней');
    expect(pluralRu(21, DAYS)).toBe('день');
    expect(pluralRu(112, DAYS)).toBe('дней');
  });
});

describe('форматирование', () => {
  it('часы и рабочие дни: округление, разделители, склонение', () => {
    expect(plain(formatHours(470))).toBe('470 часов');
    expect(plain(formatHours(1234))).toBe('1 234 часа');
    expect(plain(formatWorkDays(58.75))).toBe('59 рабочих дней');
    expect(plain(formatWorkDays(21))).toBe('21 рабочий день');
  });

  it('рубли с разделителями тысяч', () => {
    expect(plain(formatRub(470_000))).toBe('470 000 ₽');
    expect(plain(formatRub(0))).toBe('0 ₽');
  });
});
