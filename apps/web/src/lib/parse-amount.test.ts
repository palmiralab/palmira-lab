import { describe, expect, it } from 'vitest';
import { parseAmount } from './parse-amount';

describe('parseAmount', () => {
  it('разбирает целые и дробные числа, запятую и пробелы', () => {
    expect(parseAmount('5')).toBe(5);
    expect(parseAmount('2,5')).toBe(2.5);
    expect(parseAmount('2.5')).toBe(2.5);
    expect(parseAmount('1 000')).toBe(1000);
    expect(parseAmount(' 12 ')).toBe(12);
  });

  it('разделитель в конце — число ещё печатается, не ошибка', () => {
    expect(parseAmount('9.')).toBe(9);
    expect(parseAmount('9,')).toBe(9);
  });

  it('пустое поле — ноль', () => {
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('   ')).toBe(0);
  });

  it('всё непонятное — NaN', () => {
    expect(parseAmount('abc')).toBeNaN();
    expect(parseAmount('-5')).toBeNaN();
    expect(parseAmount('1e3')).toBeNaN();
    expect(parseAmount('2,5,1')).toBeNaN();
  });
});
