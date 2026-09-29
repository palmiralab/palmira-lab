import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { validate } from '../src/config/env.validation.js';
import { PrismaModule } from '../src/prisma/prisma.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Ходит в живую базу из docker-compose и читает DATABASE_URL из apps/api/.env.
describe('PrismaService (живая база)', () => {
  it('соединяется с базой и читает таблицу lead', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, validate }),
        PrismaModule,
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const prisma = app.get(PrismaService);
    await expect(prisma.lead.count()).resolves.toBeTypeOf('number');

    await app.close();
  });

  it('роняет старт, если база недоступна (fail-fast)', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PrismaModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({ get: () => 'postgresql://x:x@localhost:1/x' })
      .compile();
    const app = moduleRef.createNestApplication();

    await expect(app.init()).rejects.toThrow();
  });
});
