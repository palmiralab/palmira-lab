import { describe, expect, it } from 'vitest';
import { MAX_DETAILS_LENGTH } from './contact-limits';
import { detailsFromMessages, limitDetails } from './lead-details';

describe('limitDetails', () => {
  it('обрезает пробелы и длину, пустое превращает в undefined', () => {
    expect(limitDetails('  текст  ')).toBe('текст');
    expect(limitDetails('   ')).toBeUndefined();
    expect(limitDetails('а'.repeat(MAX_DETAILS_LENGTH + 10))).toHaveLength(MAX_DETAILS_LENGTH);
  });
});

describe('detailsFromMessages', () => {
  it('склеивает реплики переносом строки', () => {
    expect(detailsFromMessages(['первое', 'второе'])).toEqual({ details: 'первое\nвторое' });
  });

  it('без реплик возвращает undefined', () => {
    expect(detailsFromMessages([])).toBeUndefined();
  });
});
