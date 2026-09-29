import { INestApplication, ValidationPipe } from '@nestjs/common';

// Общая настройка приложения: её вызывают и main.ts, и e2e-тесты, чтобы тесты
// проверяли то же самое приложение, что запускается в проде.
export function configureApp(app: INestApplication) {
  // Без этого SIGTERM (docker stop) не вызовет onModuleDestroy и соединения
  // с базой оборвутся грубо.
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // поля без декораторов вырезаются
      forbidNonWhitelisted: true, // а вместо молчаливого выреза отвечаем 400
      transform: true, // в контроллер приходит экземпляр DTO, а не голый JSON
    }),
  );
}
