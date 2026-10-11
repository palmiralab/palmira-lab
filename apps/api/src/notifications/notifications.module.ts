import { Module } from '@nestjs/common';
import { EmailNotifier } from './email-notifier.service.js';
import { LeadNotifier } from './lead-notifier.service.js';
import { TelegramNotifier } from './telegram-notifier.service.js';

@Module({
  providers: [TelegramNotifier, EmailNotifier, LeadNotifier],
  exports: [LeadNotifier],
})
export class NotificationsModule {}
