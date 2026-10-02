import { ConfigModule } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from '../src/config/env.validation.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Проверяет колонку audit_answers таблицы lead на живой базе. Созданные
// строки удаляются в afterEach, чтобы не засорять локальную базу.
describe('lead.audit_answers (живая база)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
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
    await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
    leadIds.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  it('у лида без анкеты ответы пусты (null)', async () => {
    const lead = await prisma.lead.create({
      data: { contact: 'test-lead-e2e', serviceType: 'website_landing' },
    });
    leadIds.push(lead.id);

    expect(lead.auditAnswers).toBeNull();
  });

  it('ответы анкеты сохраняются как JSON и читаются в том же виде', async () => {
    const answers = {
      business: 'Небольшая клиника',
      clients: 'Сайт и рекомендации',
      hoursPerWeek: 10,
      tools: ['Excel', 'Telegram'],
    };
    const lead = await prisma.lead.create({
      data: {
        contact: 'test-lead-e2e',
        serviceType: 'ai_consultation',
        auditAnswers: answers,
      },
    });
    leadIds.push(lead.id);

    const fromDb = await prisma.lead.findUniqueOrThrow({
      where: { id: lead.id },
    });
    expect(fromDb.auditAnswers).toEqual(answers);
  });
});
