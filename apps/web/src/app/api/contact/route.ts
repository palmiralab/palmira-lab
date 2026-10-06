import { buildAuditAnswers, findMissingRequired } from '@/lib/audit-answers';
import {
  MAX_AUDIT_ANSWERS_BYTES,
  MAX_DETAILS_LENGTH,
  MAX_PROPOSAL_BYTES,
} from '@/lib/contact-limits';
import { VALID_SERVICE_TYPES } from '@/lib/ai-provider/validate-model-response';
import { sendContact } from '@/lib/intake-client';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_FIELD_LENGTH = 200;

const jsonBytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;

// Обычный объект (не null, не массив): всё, что приходит из браузера, проверяем так.
const asObject = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

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

  if (proposal && jsonBytes(proposal) > MAX_PROPOSAL_BYTES) {
    return Response.json({ error: 'Слишком большое КП' }, { status: 400 });
  }

  if (!serviceType) {
    return Response.json({ error: 'Не удалось определить тип заявки' }, { status: 400 });
  }

  let auditAnswers: Record<string, unknown> | undefined = details ? { details } : undefined;

  // Анкета аудита (визард). Браузер присылает только ключи и ответы, а пары
  // «вопрос и ответ» собираем мы из своего списка: текст вопроса подделать нельзя, а
  // ответ на выбор принимается только из вариантов. Анкета есть только у заявки на
  // аудит: у других типов её отбрасываем (лид важнее), но в лог пишем тип, чтобы
  // собственный баг не прошёл незамеченным. Побеждает анкета, а не `details`.
  if (body?.auditForm != null) {
    if (serviceType !== 'ai_consultation') {
      console.warn(`Анкета аудита отброшена: тип заявки ${serviceType}`);
    } else {
      const form = asObject(body.auditForm);
      const answers = asObject(form?.answers) ?? {};

      if (findMissingRequired(answers).length > 0) {
        return Response.json({ error: 'Ответьте на обязательные вопросы анкеты' }, { status: 400 });
      }

      const chatContext = typeof form?.chatContext === 'string' ? form.chatContext : undefined;
      const built = buildAuditAnswers(answers, chatContext);

      if (built && jsonBytes(built) > MAX_AUDIT_ANSWERS_BYTES) {
        return Response.json({ error: 'Слишком большая анкета' }, { status: 400 });
      }
      auditAnswers = built;
    }
  }

  const result = await sendContact({
    name,
    contact,
    serviceType,
    auditAnswers,
    proposal,
  });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  // Контакты теперь хранятся в БД: до публичного запуска на сайте нужна
  // страница политики обработки персональных данных (152-ФЗ), см. /privacy.
  return Response.json({ ok: true });
}
