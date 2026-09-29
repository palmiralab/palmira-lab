import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Настройки CLI Prisma (generate, migrate). Во время работы сервера адрес базы
// берётся из ConfigService, здесь та же переменная из apps/api/.env.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
