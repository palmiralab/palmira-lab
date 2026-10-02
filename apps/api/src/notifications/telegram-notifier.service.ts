import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation.js';

export interface NewLeadNotice {
  leadId: string;
  name: string;
  contact: string;
  serviceType: string;
  auditAnswers?: Record<string, unknown>;
}

// Лимит Telegram на длину одного сообщения.
const MESSAGE_LIMIT = 4096;
// Telegram не должен задерживать ответ посетителю надолго.
const REQUEST_TIMEOUT_MS = 3000;

function formatLeadNotice(notice: NewLeadNotice): string {
  const lines = [
    'Новая заявка',
    `Имя: ${notice.name}`,
    `Контакт: ${notice.contact}`,
    `Услуга: ${notice.serviceType}`,
    `Лид: ${notice.leadId}`,
  ];

  if (notice.auditAnswers) {
    lines.push('', 'Анкета аудита:');
    for (const [question, answer] of Object.entries(notice.auditAnswers)) {
      lines.push(
        `${question}: ${typeof answer === 'string' ? answer : JSON.stringify(answer)}`,
      );
    }
  }

  return lines.join('\n').slice(0, MESSAGE_LIMIT);
}

// Только отправляет: решение «сбой уведомления не ломает приём лида» живёт у
// вызывающего (IntakeService), здесь ошибка честно бросается.
@Injectable()
export class TelegramNotifier {
  private readonly logger = new Logger(TelegramNotifier.name);
  private readonly token?: string;
  private readonly chatId?: string;

  constructor(config: ConfigService<Env, true>) {
    this.token = config.get('TELEGRAM_BOT_TOKEN', { infer: true });
    this.chatId = config.get('TELEGRAM_CHAT_ID', { infer: true });

    if (!this.token || !this.chatId) {
      this.logger.warn(
        'Telegram-уведомления выключены: не заданы TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID',
      );
    }
  }

  async notifyNewLead(notice: NewLeadNotice): Promise<void> {
    if (!this.token || !this.chatId) return;

    let response: Response;
    try {
      response = await fetch(
        `https://api.telegram.org/bot${this.token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Без parse_mode: текст посетителя уходит как есть, не как разметка.
          body: JSON.stringify({
            chat_id: this.chatId,
            text: formatLeadNotice(notice),
          }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
    } catch {
      // Исходную ошибку не пробрасываем: в её тексте может быть адрес с
      // токеном бота.
      throw new Error('Не удалось связаться с Telegram');
    }

    if (!response.ok) {
      throw new Error(`Telegram ответил статусом ${response.status}`);
    }
  }
}
