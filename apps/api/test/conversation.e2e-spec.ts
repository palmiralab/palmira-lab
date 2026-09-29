import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from '../src/config/env.validation.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Проверяет ограничения таблицы conversation на живой базе. Созданные строки
// удаляются в afterEach, чтобы не засорять локальную базу.
describe('conversation (живая база)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const conversationIds: string[] = [];
  const leadIds: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validate }),
        PrismaModule,
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    // try/finally: сбой очистки разговоров не должен оставить тестового лида.
    try {
      await prisma.conversation.deleteMany({
        where: { id: { in: conversationIds } },
      });
    } finally {
      await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
      conversationIds.length = 0;
      leadIds.length = 0;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('создаётся без лида и без категории, значения по умолчанию проставлены', async () => {
    const conversation = await prisma.conversation.create({
      data: { currentStep: 'start' },
    });
    conversationIds.push(conversation.id);

    expect(conversation.leadId).toBeNull();
    expect(conversation.category).toBeNull();
    expect(conversation.completedAt).toBeNull();
    expect(conversation.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(conversation.sessionId).not.toBe(conversation.id);
    expect(conversation.createdAt).toBeInstanceOf(Date);
  });

  it('не создаётся со ссылкой на несуществующего лида (внешний ключ)', async () => {
    await expect(
      prisma.conversation.create({
        data: {
          currentStep: 'start',
          leadId: '00000000-0000-4000-8000-000000000000',
        },
      }),
    ).rejects.toThrow();
  });

  it('лида с разговорами удалить нельзя (RESTRICT)', async () => {
    const lead = await prisma.lead.create({
      data: {
        contact: 'test-conversation-e2e',
        serviceType: 'website_landing',
      },
    });
    leadIds.push(lead.id);
    const conversation = await prisma.conversation.create({
      data: { currentStep: 'contact', leadId: lead.id },
    });
    conversationIds.push(conversation.id);

    await expect(
      prisma.lead.delete({ where: { id: lead.id } }),
    ).rejects.toThrow();
  });
});
