// Переводит введённый человеком текст в число. Понимает запятую как десятичный
// разделитель и пробелы внутри числа («1 000», «2,5»). Пустая строка — это 0
// (поле не заполнено), всё непонятное — NaN: дальше расчёт отвергнет такой ввод.
export function parseAmount(text: string): number {
  const cleaned = text.replace(/[\s ]/g, '').replace(',', '.');
  if (cleaned === '') return 0;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}
