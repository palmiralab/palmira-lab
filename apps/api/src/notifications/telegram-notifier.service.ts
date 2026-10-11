import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation.js';

export interface NewLeadNotice {
  leadId: string;
  name: string;
  contact: string;
  serviceType: string;
  auditAnswers?: Record<string, unknown>;
  // КП, которое видел клиент (снимок с сайта). Форму не гарантируем, поэтому
  // читаем поля защитно, см. formatProposal.
  proposal?: Record<string, unknown>;
}

// Лимит Telegram на длину одного сообщения.
const MESSAGE_LIMIT = 4096;
// Повторы и фон: см. LeadNotifier. Один запрос не должен висеть долго.
const REQUEST_TIMEOUT_MS = 4000;

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

const asStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

// Краткий вид КП: название, задача, состав, срок и цена. Весь JSON в чат не
// льём: он длинный, и читать его нечем. Поля могут отсутствовать или быть не
// того типа (форму КП задаёт сайт), поэтому берём только то, что похоже на
// ожидаемое.
function formatProposal(proposal: Record<string, unknown>): string[] {
  // Подпись честная: КП пришло от сайта (браузера), сервер его не проверял.
  const lines = ['КП (со слов сайта):'];

  const title = asString(proposal.title);
  if (title) lines.push(title);

  const problem = asString(proposal.problemSummary);
  if (problem) lines.push(`Задача: ${problem}`);

  const scope = asStrings(proposal.scope);
  if (scope.length > 0) {
    lines.push('', 'Состав:', ...scope.map((item) => `- ${item}`));
  }

  const assumptions = asStrings(proposal.assumptions);
  if (assumptions.length > 0) {
    lines.push('', 'Допущения:', ...assumptions.map((item) => `- ${item}`));
  }

  const exclusions = asStrings(proposal.exclusions);
  if (exclusions.length > 0) {
    lines.push('', 'Не входит:', ...exclusions.map((item) => `- ${item}`));
  }

  // Срок и цена идут одним блоком: оба необязательные, пустая строка перед
  // блоком нужна, только если в нём что-то есть.
  const terms: string[] = [];
  const timeline = asString(proposal.estimatedTimelineText);
  if (timeline) terms.push(`Срок: ${timeline}`);

  const { priceRangeMin: min, priceRangeMax: max } = proposal;
  if (typeof min === 'number' && typeof max === 'number') {
    terms.push(`Цена: ${min}–${max} ₽`);
  }
  if (terms.length > 0) lines.push('', ...terms);

  return lines;
}

// Ответ анкеты, как его присылает сайт: текст вопроса и ответ (строка или
// список выбранных вариантов). Вопрос лежит рядом с ответом, чтобы заявка читалась
// без справочника, даже если сайт потом поменяет формулировки.
// undefined: значение не похоже на пару вопрос-ответ; null: пара, но без ответа.
function readQa(value: unknown): { question: string; answer: string } | null | undefined {
  if (typeof value !== 'object' || value === null || !('question' in value)) return undefined;
  const { question, answer } = value as Record<string, unknown>;
  const q = asString(question);
  const a = Array.isArray(answer) ? asStrings(answer).join(', ') : asString(answer);
  return q && a ? { question: q, answer: a } : null;
}

function formatAuditAnswers(answers: Record<string, unknown>): string[] {
  const entries = Object.entries(answers);
  // Заявка с одним свободным описанием (manual_review): это не анкета, а
  // просьба клиента своими словами.
  const onlyDetails =
    entries.length === 1 && entries[0][0] === 'details' && asString(entries[0][1]);
  if (onlyDetails) return ['Запрос клиента:', onlyDetails];

  const lines = ['Анкета аудита:'];
  for (const [key, value] of entries) {
    const qa = readQa(value);
    if (qa === null) continue; // вопрос без ответа
    if (qa) {
      lines.push('', qa.question, qa.answer);
    } else if (value !== null && value !== undefined && value !== '') {
      // Старый или неожиданный вид: показываем «ключ: значение», как раньше.
      lines.push(`${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
    }
  }
  return lines;
}

// Шапка (имя, контакт, услуга, id лида) идёт целиком и всегда: по ней можно
// связаться с клиентом. Режем только тело (КП и анкету), иначе при длинном
// КП хвост унёс бы id лида.
export function formatLeadNotice(notice: NewLeadNotice): string {
  const head = [
    'Новая заявка',
    '',
    `Имя: ${notice.name}`,
    `Контакт: ${notice.contact}`,
    `Услуга: ${notice.serviceType}`,
    `Лид: ${notice.leadId}`,
  ].join('\n');

  const body = [
    ...(notice.proposal ? ['', ...formatProposal(notice.proposal)] : []),
    ...(notice.auditAnswers ? ['', ...formatAuditAnswers(notice.auditAnswers)] : []),
  ].join('\n');

  if (!body) return head.slice(0, MESSAGE_LIMIT);

  // Тело начинается с пустой строки (так отделено от шапки), в бюджет её
  // длина входит вместе с телом.
  const room = MESSAGE_LIMIT - head.length - 1;
  const text = body.length <= room ? body : `${body.slice(0, room - 1)}…`;
  return `${head}\n${text}`.slice(0, MESSAGE_LIMIT);
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
