import { MAX_DETAILS_LENGTH, MAX_PROPOSAL_BYTES } from '@/lib/contact-limits';
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

  // КП приходит из браузера, поэтому ему не доверяем: не объект отбрасываем
  // (заявка важнее КП), слишком большое отклоняем. Отбрасывание не молчаливое:
  // КП делаем мы сами, и не-объект может быть нашим багом на фронте. В лог только
  // тип, не содержимое.
  const isProposalObject =
    body?.proposal && typeof body.proposal === 'object' && !Array.isArray(body.proposal);
  if (body?.proposal != null && !isProposalObject) {
    console.warn(`КП в заявке отброшено: ожидался объект, пришёл ${typeof body.proposal}`);
  }
  const proposal = isProposalObject ? (body.proposal as Record<string, unknown>) : undefined;

  if (!name || !contact) {
    return Response.json({ error: 'Укажите имя и контакт для связи' }, { status: 400 });
  }

  if (name.length > MAX_FIELD_LENGTH || contact.length > MAX_FIELD_LENGTH) {
    return Response.json({ error: 'Слишком длинное значение полей' }, { status: 400 });
  }

  if (details.length > MAX_DETAILS_LENGTH) {
    return Response.json({ error: 'Слишком длинное описание' }, { status: 400 });
  }

  if (proposal && new TextEncoder().encode(JSON.stringify(proposal)).length > MAX_PROPOSAL_BYTES) {
    return Response.json({ error: 'Слишком большое КП' }, { status: 400 });
  }

  if (!serviceType) {
    return Response.json({ error: 'Не удалось определить тип заявки' }, { status: 400 });
  }

  const result = await sendContact({
    name,
    contact,
    serviceType,
    auditAnswers: details ? { details } : undefined,
    proposal,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  // Контакты теперь хранятся в БД: до публичного запуска на сайте нужна
  // страница политики обработки персональных данных (152-ФЗ), см. /privacy.
  return Response.json({ ok: true });
}
