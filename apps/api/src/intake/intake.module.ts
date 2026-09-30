import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { IntakeController } from './intake.controller.js';
import { IntakeService } from './intake.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [IntakeController],
  providers: [IntakeService],
})
export class IntakeModule {}
