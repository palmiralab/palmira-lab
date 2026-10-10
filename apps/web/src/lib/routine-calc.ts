// Допущения калькулятора рутины. Показываются посетителю под результатом, чтобы
// цифры можно было проверить руками.
export const WORK_WEEKS_PER_YEAR = 47;
export const WORK_HOURS_PER_DAY = 8;

// Верхние границы полей. Больше — не «очень много рутины», а ошибка ввода.
export const LIMITS = {
  hoursPerWeek: 168, // часов в неделе
  people: 10_000,
  hourlyCost: 1_000_000,
  percent: 100,
};

export type RoutineInput = {
  hoursPerWeek: number; // часов рутины в неделю на одного человека
  people: number; // сколько человек этим занимаются
  hourlyCost: number; // стоимость часа, ₽ (0, если не нужна)
  automatablePercent: number | null; // доля, которую можно автоматизировать, по оценке посетителя
};

export type RoutineResult = {
  hoursPerYear: number;
  workDaysPerYear: number;
  costPerYear: number;
  // Только если посетитель сам назвал долю; иначе null (своих процентов не придумываем).
  saved: { hoursPerYear: number; workDaysPerYear: number; costPerYear: number } | null;
};

function isValidAmount(value: number, max: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= max;
}

// Что не так с вводом: текст для посетителя или null, если всё в порядке.
// Нужен, чтобы при отвергнутом вводе не молчать (calcRoutine в этом случае вернёт null).
export function findInputProblem(input: RoutineInput): string | null {
  const checks: [string, number | null, number][] = [
    ['Часов рутины в неделю', input.hoursPerWeek, LIMITS.hoursPerWeek],
    ['Количество человек', input.people, LIMITS.people],
    ['Стоимость часа', input.hourlyCost, LIMITS.hourlyCost],
    ['Доля автоматизации', input.automatablePercent, LIMITS.percent],
  ];
  for (const [label, value, max] of checks) {
    if (value === null) continue;
    if (Number.isNaN(value)) return `${label}: введите число, например 5.`;
    if (value > max) return `${label}: не больше ${max.toLocaleString('ru-RU')}.`;
  }
  return null;
}

// Чистая арифметика над введёнными числами. Возвращает null, если ввод
// некорректен или рутины нет совсем (считать нечего).
export function calcRoutine(input: RoutineInput): RoutineResult | null {
  const { hoursPerWeek, people, hourlyCost, automatablePercent } = input;

  if (!isValidAmount(hoursPerWeek, LIMITS.hoursPerWeek) || !isValidAmount(people, LIMITS.people)) return null;
  if (!isValidAmount(hourlyCost, LIMITS.hourlyCost)) return null;
  if (automatablePercent !== null && !isValidAmount(automatablePercent, LIMITS.percent)) return null;
  if (hoursPerWeek === 0 || people === 0) return null;

  const hoursPerYear = hoursPerWeek * people * WORK_WEEKS_PER_YEAR;
  const result: RoutineResult = {
    hoursPerYear,
    workDaysPerYear: hoursPerYear / WORK_HOURS_PER_DAY,
    costPerYear: hoursPerYear * hourlyCost,
    saved: null,
  };

  if (automatablePercent !== null) {
    const share = automatablePercent / 100;
    result.saved = {
      hoursPerYear: result.hoursPerYear * share,
      workDaysPerYear: result.workDaysPerYear * share,
      costPerYear: result.costPerYear * share,
    };
  }

  return result;
}
