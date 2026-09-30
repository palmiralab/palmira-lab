import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Сквозная проверка на живой базе: HTTP-запрос → сервис → строка в conversation.
describe('POST /api/v1/intake/start (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const conversationIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.conversation.deleteMany({
      where: { id: { in: conversationIds } },
    });
    conversationIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('создаёт разговор и возвращает идентификаторы с первым вопросом', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/intake/start')
      .expect(201);
    conversationIds.push(res.body.conversationId);

    const uuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    expect(res.body.conversationId).toMatch(uuid);
    expect(res.body.sessionId).toMatch(uuid);
    expect(res.body.message).toEqual({
      role: 'assistant',
      content: expect.stringContaining('какую задачу хотите решить'),
    });

    const row = await prisma.conversation.findUnique({
      where: { id: res.body.conversationId },
    });
    expect(row).toMatchObject({
      sessionId: res.body.sessionId,
      currentStep: 'start',
      leadId: null,
      category: null,
      completedAt: null,
    });
  });

  it('каждый вызов создаёт новый разговор с новой сессией', async () => {
    const first = await request(app.getHttpServer()).post(
      '/api/v1/intake/start',
    );
    const second = await request(app.getHttpServer()).post(
      '/api/v1/intake/start',
    );
    conversationIds.push(first.body.conversationId, second.body.conversationId);

    expect(first.body.conversationId).not.toBe(second.body.conversationId);
    expect(first.body.sessionId).not.toBe(second.body.sessionId);
  });
});
