import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { LeadNotifier } from '../src/notifications/lead-notifier.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Сквозная проверка на живой базе: HTTP-запрос → транзакция → строки в lead и
// conversation. Все тестовые лиды помечены префиксом в contact, по нему и
// чистим.
const MARK = 'test-contact-e2e';
const URL = '/api/v1/intake/contact';
const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

describe('POST /api/v1/intake/contact (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const conversationIds: string[] = [];

  // Подмена всегда, не только в тестах про уведомления: если в локальном .env
  // заданы настоящие TELEGRAM_*, каждый прогон тестов иначе слал бы реальные
  // сообщения в чат.
  const notifier = { notifyNewLead: vi.fn() };

  const validBody = {
    name: 'Тест',
    contact: `${MARK}@example.com`,
    serviceType: 'website_landing',
  };

  const post = (body: object) =>
    request(app.getHttpServer()).post(URL).send(body);

  const newConversation = async () => {
    const conversation = await prisma.conversation.create({
      data: { currentStep: 'start' },
    });
    conversationIds.push(conversation.id);
    return conversation;
  };

  const countTestLeads = () =>
    prisma.lead.count({
      where: { contact: { startsWith: MARK, mode: 'insensitive' } },
    });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LeadNotifier)
      .useValue(notifier)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(() => {
    notifier.notifyNewLead.mockReset();
    notifier.notifyNewLead.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    // try/finally: сбой очистки разговоров не должен оставить тестовых лидов.
    try {
      await prisma.conversation.deleteMany({
        where: { id: { in: conversationIds } },
      });
    } finally {
      // insensitive: тесты повторов шлют тот же контакт в другом регистре.
      await prisma.lead.deleteMany({
        where: { contact: { startsWith: MARK, mode: 'insensitive' } },
      });
      conversationIds.length = 0;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('создаёт лида без разговора и возвращает его id', async () => {
    const res = await post(validBody).expect(201);

    expect(res.body.leadId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: res.body.leadId },
    });
    expect(lead).toMatchObject({
      name: 'Тест',
      contact: validBody.contact,
      serviceType: 'website_landing',
      status: 'new',
      auditAnswers: null,
    });
  });

  it('один контакт можно оставить 3 раза, четвёртая заявка лида не создаёт и не уведомляет', async () => {
    const variants = [
      validBody.contact,
      validBody.contact.toUpperCase(),
      ` ${validBody.contact} `,
    ];
    const ids: string[] = [];
    for (const contact of variants) {
      const res = await post({ ...validBody, contact }).expect(201);
      ids.push(res.body.leadId);
    }
    expect(new Set(ids).size).toBe(3);

    const fourth = await post(validBody).expect(201);

    expect(ids).toContain(fourth.body.leadId);
    expect(await countTestLeads()).toBe(3);
    expect(notifier.notifyNewLead).toHaveBeenCalledTimes(3);
  });

  it('тот же контакт с другим типом услуги: отдельная заявка', async () => {
    await post(validBody).expect(201);
    await post({ ...validBody, serviceType: 'ai_consultation' }).expect(201);

    expect(await countTestLeads()).toBe(2);
  });

  it('сохраняет ответы анкеты аудита', async () => {
    const auditAnswers = { business: 'Клиника', hoursPerWeek: 10 };
    const res = await post({
      ...validBody,
      serviceType: 'ai_consultation',
      auditAnswers,
    }).expect(201);

    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: res.body.leadId },
    });
    expect(lead.auditAnswers).toEqual(auditAnswers);
  });

  it('сохраняет КП снимком и передаёт его в уведомление', async () => {
    const proposal = { title: 'Лендинг', scope: ['Дизайн', 'Вёрстка'] };
    const res = await post({ ...validBody, proposal }).expect(201);

    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: res.body.leadId },
    });
    expect(lead.proposal).toEqual(proposal);
    expect(notifier.notifyNewLead).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: res.body.leadId, proposal }),
    );
  });

  it('принимает задачу вне типовых услуг (out_of_scope) вместе с КП', async () => {
    const proposal = { title: 'Смарт-контракт', scope: ['Разбор задачи'] };
    const res = await post({
      ...validBody,
      serviceType: 'out_of_scope',
      proposal,
    }).expect(201);

    const lead = await prisma.lead.findUniqueOrThrow({
      where: { id: res.body.leadId },
    });
    expect(lead).toMatchObject({ serviceType: 'out_of_scope', proposal });
  });

  it('привязывает разговор к лиду в той же транзакции', async () => {
    const conversation = await newConversation();
    const res = await post({
      ...validBody,
      conversationId: conversation.id,
    }).expect(201);

    const row = await prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
    });
    expect(row.leadId).toBe(res.body.leadId);
    expect(row.category).toBe('website_landing');
    expect(row.completedAt).toBeInstanceOf(Date);
  });

  it.each([
    ['пустое имя', { ...validBody, name: '' }],
    ['нет контакта', { name: 'Тест', serviceType: 'website_landing' }],
    ['неизвестный serviceType', { ...validBody, serviceType: 'nope' }],
    ['слишком длинный контакт', { ...validBody, contact: MARK + 'x'.repeat(200) }],
    ['conversationId не uuid', { ...validBody, conversationId: 'abc' }],
    ['лишнее поле', { ...validBody, status: 'won' }],
    ['auditAnswers не объект', { ...validBody, auditAnswers: 'текст' }],
    [
      'auditAnswers больше 16 КБ',
      { ...validBody, auditAnswers: { details: 'x'.repeat(17 * 1024) } },
    ],
    ['proposal не объект', { ...validBody, proposal: 'текст' }],
    [
      'proposal больше 20 КБ',
      { ...validBody, proposal: { title: 'x'.repeat(21 * 1024) } },
    ],
  ])('отвечает 400: %s, лид не создаётся', async (_name, body) => {
    await post(body).expect(400);
    expect(await countTestLeads()).toBe(0);
  });

  it('отвечает 404 на несуществующий разговор и откатывает создание лида', async () => {
    const res = await post({
      ...validBody,
      conversationId: UNKNOWN_UUID,
    }).expect(404);
    // Без проверки текста тест прошёл бы и на несуществующем маршруте (там
    // тоже 404): так и поймали, когда ещё не было реализации.
    expect(res.body.message).toBe('Разговор не найден');

    // Лид создаётся в транзакции раньше проверки разговора: если откат не
    // работает, он останется в базе.
    expect(await countTestLeads()).toBe(0);
  });

  it('отвечает 409, если разговор уже привязан к другому лиду, новый лид не создаётся', async () => {
    const conversation = await newConversation();
    await post({ ...validBody, conversationId: conversation.id }).expect(201);
    expect(await countTestLeads()).toBe(1);

    await post({
      ...validBody,
      contact: `${MARK}-second@example.com`,
      conversationId: conversation.id,
    }).expect(409);

    expect(await countTestLeads()).toBe(1);
  });

  describe('уведомление о новом лиде', () => {
    it('отправляется один раз после успешного создания, с данными лида', async () => {
      const res = await post({
        ...validBody,
        serviceType: 'ai_consultation',
        auditAnswers: { business: 'Клиника' },
      }).expect(201);

      expect(notifier.notifyNewLead).toHaveBeenCalledTimes(1);
      expect(notifier.notifyNewLead).toHaveBeenCalledWith({
        leadId: res.body.leadId,
        name: 'Тест',
        contact: validBody.contact,
        serviceType: 'ai_consultation',
        auditAnswers: { business: 'Клиника' },
      });
    });

    it('не отправляется, если запрос отклонён (400, 404, 409)', async () => {
      await post({ ...validBody, name: '' }).expect(400);
      await post({ ...validBody, conversationId: UNKNOWN_UUID }).expect(404);

      const conversation = await newConversation();
      await post({ ...validBody, conversationId: conversation.id }).expect(201);
      notifier.notifyNewLead.mockClear();
      await post({
        ...validBody,
        contact: `${MARK}-second@example.com`,
        conversationId: conversation.id,
      }).expect(409);

      expect(notifier.notifyNewLead).not.toHaveBeenCalled();
    });

    it('сбой уведомления не ломает запрос: лид сохранён, ответ 201', async () => {
      notifier.notifyNewLead.mockRejectedValue(new Error('Telegram недоступен'));

      const res = await post(validBody).expect(201);

      expect(await countTestLeads()).toBe(1);
      expect(res.body.leadId).toEqual(expect.any(String));
    });
  });
});
