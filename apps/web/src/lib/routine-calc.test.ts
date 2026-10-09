import { describe, expect, it } from 'vitest';
import { calcRoutine } from './routine-calc';

describe('calcRoutine', () => {
  it('считает часы, дни и стоимость в год', () => {
    const result = calcRoutine({
      hoursPerWeek: 5,
      people: 2,
      hourlyCost: 1000,
      automatablePercent: null,
    });
    expect(result).toEqual({
      hoursPerYear: 470,
      workDaysPerYear: 58.75,
      costPerYear: 470_000,
      saved: null,
    });
  });

  it('считает «можно вернуть» только если названа доля', () => {
    const result = calcRoutine({
      hoursPerWeek: 4,
      people: 1,
      hourlyCost: 500,
      automatablePercent: 50,
    });
    expect(result?.saved).toEqual({
      hoursPerYear: 94,
      workDaysPerYear: 11.75,
      costPerYear: 47_000,
    });
  });

  it('стоимость часа необязательна: ноль даёт нулевую стоимость', () => {
    const result = calcRoutine({
      hoursPerWeek: 3,
      people: 1,
      hourlyCost: 0,
      automatablePercent: null,
    });
    expect(result?.costPerYear).toBe(0);
  });

  it('возвращает null, если рутины нет', () => {
    expect(
      calcRoutine({ hoursPerWeek: 0, people: 3, hourlyCost: 0, automatablePercent: null }),
    ).toBeNull();
    expect(
      calcRoutine({ hoursPerWeek: 3, people: 0, hourlyCost: 0, automatablePercent: null }),
    ).toBeNull();
  });

  it('возвращает null на некорректном вводе', () => {
    const base = { hoursPerWeek: 3, people: 1, hourlyCost: 0, automatablePercent: null };
    expect(calcRoutine({ ...base, hoursPerWeek: -1 })).toBeNull();
    expect(calcRoutine({ ...base, hoursPerWeek: 200 })).toBeNull();
    expect(calcRoutine({ ...base, people: Number.NaN })).toBeNull();
    expect(calcRoutine({ ...base, automatablePercent: 150 })).toBeNull();
  });
});
