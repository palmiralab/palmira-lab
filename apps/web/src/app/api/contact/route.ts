import { MAX_DETAILS_LENGTH } from '@/lib/contact-limits';
import { VALID_SERVICE_TYPES } from '@/lib/ai-provider/validate-model-response';
import { sendContact } from '@/lib/intake-client';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_FIELD_LENGTH = 200;

export async function POST(request: Request) {
  const { rateLimited } = checkRateLimit(request, 'contact');
  if (rateLimited) {
    return Response.json({ error: 'Слишком много запросов, попробуйте позже' }, { status: 429 });
  }

  const body = await request.json();
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const contact = typeof body?.contact === 'string' ? body.contact.trim() : '';
  const serviceType = VALID_SERVICE_TYPES.find((type) => type === body?.serviceType);
  const details =
    typeof body?.auditAnswers?.details === 'string' ? body.auditAnswers.details.trim() : '';

  if (!name || !contact) {
    return Response.json({ error: 'Укажите имя и контакт для связи' }, { status: 400 });
  }

  if (name.length > MAX_FIELD_LENGTH || contact.length > MAX_FIELD_LENGTH) {
    return Response.json({ error: 'Слишком длинное значение полей' }, { status: 400 });
  }

  if (details.length > MAX_DETAILS_LENGTH) {
    return Response.json({ error: 'Слишком длинное описание' }, { status: 400 });
  }

  if (!serviceType) {
    return Response.json({ error: 'Не удалось определить тип заявки' }, { status: 400 });
  }

  const result = await sendContact({
    name,
    contact,
    serviceType,
    auditAnswers: details ? { details } : undefined,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  // Контакты теперь хранятся в БД: до публичного запуска на сайте нужна
  // страница политики обработки персональных данных (152-ФЗ), см. /privacy.
  return Response.json({ ok: true });
}
