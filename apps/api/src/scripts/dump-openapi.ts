import { writeFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { configureApp } from '../app.setup.js';
import { buildOpenApiDocument, OPENAPI_FILE } from '../swagger.js';

// Выгрузка схемы в docs/openapi.json: `npm run openapi`. Базы и сервера не
// нужно: приложение только собирается (без app.init() и listen()), схема
// читается из декораторов. Заглушка нужна лишь потому, что ConfigModule
// проверяет DATABASE_URL при загрузке AppModule.
process.env.DATABASE_URL ??= 'postgresql://dump:dump@localhost:1/dump';

// Динамический импорт: обычный import поднимается вверх файла и выполнился бы
// раньше строки с заглушкой, а AppModule проверяет окружение в момент загрузки.
const { AppModule } = await import('../app.module.js');

const app = await NestFactory.create(AppModule, { logger: false });
configureApp(app);
writeFileSync(
  OPENAPI_FILE,
  JSON.stringify(buildOpenApiDocument(app), null, 2) + '\n',
);
await app.close();
