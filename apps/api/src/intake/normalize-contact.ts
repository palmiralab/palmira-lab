// Приводит контакт к виду, в котором два записанных по-разному одинаковых
// контакта совпадают: «@Ivan» и «ivan», «+7 (900) 123-45-67» и «89001234567».
// Нужен для защиты от повторных заявок на один и тот же контакт: сравнивать
// «как набрали» бесполезно, злоумышленнику достаточно сменить регистр или пробел.
// Это не проверка, что контакт настоящий, и не замена подтверждению контакта.
export function normalizeContact(raw: string): string {
  const compact = raw.trim().toLowerCase().replace(/\s+/g, '');
  const withoutAt = compact.startsWith('@') ? compact.slice(1) : compact;

  // Телефон: только цифры и привычные знаки. Оставляем цифры, российский
  // номер с «8» в начале приводим к «7».
  if (/^\+?[\d()\-.]+$/.test(withoutAt)) {
    const digits = withoutAt.replace(/\D/g, '');
    return digits.length === 11 && digits.startsWith('8')
      ? `7${digits.slice(1)}`
      : digits;
  }

  return withoutAt;
}
