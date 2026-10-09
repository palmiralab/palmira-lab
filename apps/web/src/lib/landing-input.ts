import type { LandingDesign, LandingPageData } from '@/lib/sandbox-store';

// Допустимая длина полей визитки в демо. Страница живёт 5 минут и строится
// из того, что ввёл посетитель, поэтому ограничиваем всё явно.
export const LANDING_LIMITS = {
  name: 60,
  description: 300,
  phone: 30,
  email: 80,
  address: 120,
} as const;

const DESIGNS: LandingDesign[] = ['light', 'bold'];

export type LandingParseResult =
  | { ok: true; data: LandingPageData }
  | { ok: false; error: string };

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

// Принимает «что угодно» (unknown): тело запроса пришло из сети, и верить его
// форме нельзя. Возвращает либо готовые данные для хранилища, либо понятную
// ошибку. Контакты необязательны и выводятся на странице обычным текстом, не
// ссылками (демо работает с вымышленными данными).
export function parseLandingInput(input: unknown): LandingParseResult {
  const body = (typeof input === 'object' && input !== null ? input : {}) as Record<
    string,
    unknown
  >;

  const name = text(body.name);
  const description = text(body.description);
  const phone = text(body.phone);
  const email = text(body.email);
  const address = text(body.address);
  const design = body.design;

  if (!name || !description) {
    return { ok: false, error: 'Укажите название и описание' };
  }

  for (const [field, limit] of Object.entries(LANDING_LIMITS)) {
    const value = { name, description, phone, email, address }[field as keyof typeof LANDING_LIMITS];
    if (value.length > limit) {
      return { ok: false, error: `Поле «${field}» длиннее ${limit} символов` };
    }
  }

  if (typeof design !== 'string' || !DESIGNS.includes(design as LandingDesign)) {
    return { ok: false, error: 'Неизвестный дизайн' };
  }

  return {
    ok: true,
    data: {
      kind: 'landing',
      name,
      description,
      phone,
      email,
      address,
      design: design as LandingDesign,
    },
  };
}
