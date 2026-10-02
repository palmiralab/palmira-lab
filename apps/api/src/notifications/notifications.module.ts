import { Module } from '@nestjs/common';
import { TelegramNotifier } from './telegram-notifier.service.js';

@Module({
  providers: [TelegramNotifier],
  exports: [TelegramNotifier],
})
export class NotificationsModule {}
