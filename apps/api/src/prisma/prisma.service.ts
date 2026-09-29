import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Env } from '../config/env.validation.js';
import { PrismaClient } from '../generated/prisma/client.js';

// Единственный клиент базы на всё приложение (один пул соединений). Адрес
// берётся из ConfigService, то есть уже прошёл проверку при старте.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get('DATABASE_URL', { infer: true }),
      }),
    });
  }

  // Проверяем базу при старте: если её нет, приложение падает сразу, а не на
  // первом запросе (то же правило fail-fast, что и для конфига). Одного
  // $connect() мало: с драйвер-адаптером он успешен без реального соединения
  // (пул ленивый), поэтому делаем пробный запрос.
  async onModuleInit() {
    await this.$connect();
    await this.$queryRaw`SELECT 1`;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
