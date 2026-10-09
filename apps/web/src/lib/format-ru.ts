// Форматирование чисел для показа на русском. Расчёты (routine-calc) отдают
// числа как есть; как их показать, решает этот слой.

// Склонение по числу: pluralRu(1, ['день', 'дня', 'дней']) → 'день',
// 2 → 'дня', 5 → 'дней', 11 → 'дней', 21 → 'день'.
export function pluralRu(count: number, forms: readonly [string, string, string]): string {
  const n = Math.abs(Math.trunc(count));
  const lastTwo = n % 100;
  const last = n % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

const numberFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

// Целое число с разделителями тысяч: 470000 → '470 000' (пробел неразрывный).
export function formatInt(value: number): string {
  return numberFormat.format(Math.round(value));
}

export function formatHours(value: number): string {
  const rounded = Math.round(value);
  return `${formatInt(rounded)} ${pluralRu(rounded, ['час', 'часа', 'часов'])}`;
}

export function formatWorkDays(value: number): string {
  const rounded = Math.round(value);
  return `${formatInt(rounded)} ${pluralRu(rounded, ['рабочий день', 'рабочих дня', 'рабочих дней'])}`;
}

export function formatRub(value: number): string {
  return `${formatInt(value)} ₽`;
}
