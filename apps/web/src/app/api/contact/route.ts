import { checkRateLimit } from '@/lib/rate-limit';

const MAX_FIELD_LENGTH = 200;

export async function POST(request: Request) {
  const { rateLimited } = checkRateLimit(request);
  if (rateLimited) {
    return Response.json({ error: 'Слишком много запросов, попробуйте позже' }, { status: 429 });
  }

  const body = await request.json();
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const contact = typeof body?.contact === 'string' ? body.contact.trim() : '';
  const proposalId = typeof body?.proposalId === 'string' ? body.proposalId : undefined;

  if (!name || !contact) {
    return Response.json({ error: 'Укажите имя и контакт для связи' }, { status: 400 });
  }

  if (name.length > MAX_FIELD_LENGTH || contact.length > MAX_FIELD_LENGTH) {
    return Response.json({ error: 'Слишком длинное значение полей' }, { status: 400 });
  }

  // ВРЕМЕННОЕ, ОСОЗНАННОЕ нарушение собственного правила §14.1 («не
  // логировать полные контакты») — до появления реального хранилища
  // (БД, неделя 3 по §15) контакту физически больше некуда попасть.
  // Правило §14.1 написано про продакшн-логи/агрегаторы, не про
  // локальный dev-терминал на этапе спайка — но это допущение, не
  // постоянное решение. Заменить на реальное хранилище с контролем
  // доступа до публичного запуска, не забыть.
  //
  // ВАЖНО (27.09): когда здесь появится реальное сохранение (БД, не
  // console.log) — на сайте ОБЯЗАТЕЛЬНО должна появиться страница
  // политики обработки персональных данных (152-ФЗ), см.
  // session-plan.md §15 «Неделя 3». Сейчас (dev-стаб) юридической
  // обязанности нет, но публиковать сохранение контактов без этой
  // страницы — уже нельзя.
  console.log('Новый контакт (dev, временно, без хранилища):', {
    name,
    contact,
    proposalId,
    receivedAt: new Date().toISOString(),
  });

  return Response.json({ ok: true });
}
