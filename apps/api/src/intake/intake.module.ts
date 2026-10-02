import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { IntakeController } from './intake.controller.js';
import { IntakeService } from './intake.service.js';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [IntakeController],
  providers: [IntakeService],
})
export class IntakeModule {}
