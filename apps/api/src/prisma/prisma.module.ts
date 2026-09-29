import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// Не глобальный: модуль, которому нужна база, импортирует PrismaModule сам.
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
