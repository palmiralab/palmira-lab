import { describe, expect, it } from 'vitest';
import { parseLandingInput } from './landing-input';

const valid = {
  name: 'Кофейня «Утро»',
  description: 'Свежий кофе и выпечка каждый день',
  phone: '+7 000 000-00-00',
  email: 'hello@example.test',
  address: 'Вымышленная улица, 1',
  design: 'light',
};

describe('parseLandingInput', () => {
  it('принимает корректные данные и добавляет kind', () => {
    const result = parseLandingInput(valid);
    expect(result).toEqual({ ok: true, data: { kind: 'landing', ...valid } });
  });

  it('обрезает пробелы по краям', () => {
    const result = parseLandingInput({ ...valid, name: '  Утро  ' });
    expect(result.ok && result.data.name).toBe('Утро');
  });

  it('контакты необязательны', () => {
    const result = parseLandingInput({ name: 'Утро', description: 'Кофе', design: 'bright' });
    expect(result.ok && result.data.phone).toBe('');
  });

  it('требует название и описание', () => {
    expect(parseLandingInput({ ...valid, name: '  ' })).toEqual({
      ok: false,
      error: 'Укажите название и описание',
    });
    expect(parseLandingInput({ ...valid, description: undefined }).ok).toBe(false);
  });

  it('отклоняет слишком длинное поле', () => {
    const result = parseLandingInput({ ...valid, description: 'а'.repeat(301) });
    expect(result.ok).toBe(false);
  });

  it('отклоняет неизвестный дизайн', () => {
    expect(parseLandingInput({ ...valid, design: 'neon' })).toEqual({
      ok: false,
      error: 'Неизвестный дизайн',
    });
  });

  it('не падает на «не объектах»', () => {
    expect(parseLandingInput(null).ok).toBe(false);
    expect(parseLandingInput('текст').ok).toBe(false);
    expect(parseLandingInput(42).ok).toBe(false);
  });
});
