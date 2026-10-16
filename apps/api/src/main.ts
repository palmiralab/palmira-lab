import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { setupSwagger } from './swagger.js';
import type { Env } from './config/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  configureApp(app);
  if (config.get('SWAGGER_ENABLED', { infer: true })) {
    setupSwagger(app);
  }
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
