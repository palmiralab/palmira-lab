import { Injectable, Logger } from '@nestjs/common';
import { EmailNotifier } from './email-notifier.service.js';
import { withRetry, type RetryOptions } from './retry.js';
import { TelegramNotifier, type NewLeadNotice } from './telegram-notifier.service.js';

// Канал до Telegram с нашего сервера нестабилен (около трети запросов
// зависает), повтор обычно проходит. Три попытки по 4 секунды.
const TELEGRAM_RETRY: RetryOptions = { attempts: 3, delayMs: 1000 };
const EMAIL_RETRY: RetryOptions = { attempts: 3, delayMs: 2000 };

// Рассылает уведомление о новой заявке всеми каналами. Каналы независимы:
// сбой одного не мешает другому. Метод не бросает ошибок: заявка уже в базе,
// уведомление её не отменяет. В лог идёт только id лида и причина, без имени
// и контакта посетителя.
@Injectable()
export class LeadNotifier {
  private readonly logger = new Logger(LeadNotifier.name);

  constructor(
    private readonly telegram: TelegramNotifier,
    private readonly email: EmailNotifier,
  ) {}

  async notifyNewLead(notice: NewLeadNotice): Promise<void> {
    await Promise.all([
      this.deliver('Telegram', notice, () => this.telegram.notifyNewLead(notice), TELEGRAM_RETRY),
      this.deliver('почта', notice, () => this.email.notifyNewLead(notice), EMAIL_RETRY),
    ]);
  }

  private async deliver(
    channel: string,
    notice: NewLeadNotice,
    send: () => Promise<void>,
    retry: RetryOptions,
  ): Promise<void> {
    try {
      await withRetry(send, retry);
    } catch (error) {
      this.logger.error(
        `Не удалось отправить уведомление (${channel}) о лиде ${notice.leadId}: ${
          error instanceof Error ? error.message : 'неизвестная ошибка'
        }`,
      );
    }
  }
}
