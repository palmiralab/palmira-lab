import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { Env } from '../config/env.validation.js';
import { formatLeadNotice, type NewLeadNotice } from './telegram-notifier.service.js';

// Префикс темы: по нему почтовый фильтр раскладывает заявки в отдельную папку
// (Gmail: тема содержит «[Palmira Lab] Заявка», ярлык PalmiraLab/Заявки).
const SUBJECT_PREFIX = '[Palmira Lab] Заявка';
const SUBJECT_NAME_LIMIT = 80;

// Сбой SMTP не должен висеть минутами: уведомление идёт в фоне, но повторы
// (см. LeadNotifier) рассчитаны на быстрый отказ.
const CONNECTION_TIMEOUT_MS = 10_000;
const SOCKET_TIMEOUT_MS = 15_000;

// Дублирует Telegram-уведомление письмом: Telegram с сервера доступен
// нестабильно, а заявка не должна потеряться. Настройки заданы вместе
// (см. env.validation.ts); без них канал выключен, как и Telegram.
@Injectable()
export class EmailNotifier {
  private readonly transport?: Transporter;
  private readonly from?: string;
  private readonly to?: string;

  constructor(config: ConfigService<Env, true>) {
    const user = config.get('SMTP_USER', { infer: true });
    const pass = config.get('SMTP_PASSWORD', { infer: true });
    const to = config.get('LEAD_EMAIL_TO', { infer: true });
    if (!user || !pass || !to) return;

    const port = config.get('SMTP_PORT', { infer: true });
    this.transport = createTransport({
      host: config.get('SMTP_HOST', { infer: true }),
      port,
      // 465: TLS сразу; на других портах (587) шифрование включает STARTTLS.
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: CONNECTION_TIMEOUT_MS,
      greetingTimeout: CONNECTION_TIMEOUT_MS,
      socketTimeout: SOCKET_TIMEOUT_MS,
    });
    this.from = config.get('LEAD_EMAIL_FROM', { infer: true }) || user;
    this.to = to;
  }

  async notifyNewLead(notice: NewLeadNotice): Promise<void> {
    if (!this.transport || !this.to) return;

    // Имя вводит посетитель: перевод строки в теме превратился бы в лишний
    // заголовок письма.
    const name = notice.name.replace(/[\r\n]+/g, ' ').slice(0, SUBJECT_NAME_LIMIT);

    try {
      await this.transport.sendMail({
        from: this.from,
        to: this.to,
        subject: `${SUBJECT_PREFIX}: ${notice.serviceType} — ${name}`,
        text: formatLeadNotice(notice),
      });
    } catch (error) {
      // Текст ошибки SMTP может содержать логин и адрес, поэтому наружу только
      // код (EAUTH, ETIMEDOUT и т. п.), если он есть.
      const code = (error as { code?: unknown })?.code;
      throw new Error(
        typeof code === 'string' && /^[A-Z_]+$/.test(code)
          ? `Не удалось отправить письмо (${code})`
          : 'Не удалось отправить письмо',
      );
    }
  }
}
