import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validate } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { IntakeModule } from './intake/intake.module.js';

@Module({
  imports: [
    // Читает .env, проверяет переменные при старте (ошибка = сервер не
    // запускается) и делает ConfigService доступным во всех модулях.
    ConfigModule.forRoot({ isGlobal: true, validate }),
    HealthModule,
    IntakeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
