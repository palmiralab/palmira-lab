// Допущения калькулятора рутины. Показываются посетителю под результатом, чтобы
// цифры можно было проверить руками.
export const WORK_WEEKS_PER_YEAR = 47;
export const WORK_HOURS_PER_DAY = 8;

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

// Чистая арифметика над введёнными числами. Возвращает null, если ввод
// некорректен или рутины нет совсем (считать нечего).
export function calcRoutine(input: RoutineInput): RoutineResult | null {
  const { hoursPerWeek, people, hourlyCost, automatablePercent } = input;

  if (!isValidAmount(hoursPerWeek, 168) || !isValidAmount(people, 10_000)) return null;
  if (!isValidAmount(hourlyCost, 1_000_000)) return null;
  if (automatablePercent !== null && !isValidAmount(automatablePercent, 100)) return null;
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
