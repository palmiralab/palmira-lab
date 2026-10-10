import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  TelegramNotifier,
  type NewLeadNotice,
} from '../notifications/telegram-notifier.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { CreateContactResponse } from './dto/create-contact.response.js';
import { StartIntakeResponse } from './dto/start-intake.response.js';
import {
  DUPLICATE_LEAD_WINDOW_MS,
  FIRST_QUESTION,
  INTAKE_STEP,
  MAX_LEADS_PER_CONTACT,
} from './intake.constants.js';
import { normalizeContact } from './normalize-contact.js';

@Injectable()
export class IntakeService {
  private readonly logger = new Logger(IntakeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: TelegramNotifier,
  ) {}

  // Открывает разговор: посетитель анонимен, лида ещё нет. Идентификаторы
  // выдаёт сервер (id и sessionId генерирует база).
  async start(): Promise<StartIntakeResponse> {
    const conversation = await this.prisma.conversation.create({
      data: { currentStep: INTAKE_STEP.start },
    });

    return {
      conversationId: conversation.id,
      sessionId: conversation.sessionId,
      message: { role: 'assistant', content: FIRST_QUESTION },
    };
  }

  // Посетитель оставил контакт: создаём лида и, если пришёл разговор,
  // привязываем его. Всё в одной транзакции: исключение внутри откатывает и
  // лида, чтобы не оставалось лидов-сирот с неудавшейся привязкой.
  //
  // Повторы: один контакт с одним типом услуги можно оставить до
  // MAX_LEADS_PER_CONTACT раз за сутки. Сверх этого заявка не создаёт лида и не
  // шлёт уведомление, а возвращает id последней созданной. Ответ тот же, что у
  // новой заявки: тот, кто шлёт заявки на чужой контакт, не узнаёт, сработала ли
  // защита, а честный двойной клик не даёт ошибки.
  async createContact(dto: CreateContactDto): Promise<CreateContactResponse> {
    const contactKey = normalizeContact(dto.contact);

    const { leadId, created } = await this.prisma.$transaction(async (tx) => {
      // Проверка «есть ли такой» и вставка лида иначе могли бы пройти оба при
      // двух одновременных запросах (оба не увидели бы друг друга). Блокировка на
      // ключ контакта до конца транзакции ставит такие запросы в очередь: второй
      // увидит лида первого.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${dto.serviceType}:${contactKey}`}))`;

      // Сравниваем нормализованные значения в коде: нормализация одна на весь
      // проект. Выборка узкая (тип услуги, сутки), для MVP это десятки строк.
      // При росте объёма ключ выносится в индексируемую колонку.
      const since = new Date(Date.now() - DUPLICATE_LEAD_WINDOW_MS);
      const recent = await tx.lead.findMany({
        where: { serviceType: dto.serviceType, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, contact: true },
      });
      const sameContact = recent.filter(
        (lead) => normalizeContact(lead.contact) === contactKey,
      );
      if (sameContact.length >= MAX_LEADS_PER_CONTACT) {
        return { leadId: sameContact[0].id, created: false };
      }

      const lead = await tx.lead.create({
        data: {
          name: dto.name,
          contact: dto.contact,
          serviceType: dto.serviceType,
          auditAnswers: dto.auditAnswers,
          proposal: dto.proposal,
        },
      });

      if (dto.conversationId) {
        // Привязываем одним запросом с условием «ещё без лида»: при двух
        // одновременных запросах на один разговор успеет только один (отдельная
        // проверка перед записью оставляла бы окно гонки).
        const { count } = await tx.conversation.updateMany({
          where: { id: dto.conversationId, leadId: null },
          data: {
            leadId: lead.id,
            category: dto.serviceType,
            completedAt: new Date(),
          },
        });

        if (count === 0) {
          // Ничего не обновилось: либо разговора нет, либо он уже занят.
          const exists = await tx.conversation.findUnique({
            where: { id: dto.conversationId },
            select: { id: true },
          });
          throw exists
            ? new ConflictException('Разговор уже привязан к другому лиду')
            : new NotFoundException('Разговор не найден');
        }
      }

      return { leadId: lead.id, created: true };
    });

    if (!created) {
      return { leadId };
    }

    // Уведомляем только после коммита: откатанный лид не должен попасть в
    // чат. Сбой уведомления не ломает приём заявки (лид уже в базе).
    await this.notifyNewLead({
      leadId,
      name: dto.name,
      contact: dto.contact,
      serviceType: dto.serviceType,
      auditAnswers: dto.auditAnswers,
      proposal: dto.proposal,
    });

    return { leadId };
  }

  private async notifyNewLead(notice: NewLeadNotice): Promise<void> {
    try {
      await this.notifier.notifyNewLead(notice);
    } catch (error) {
      // В лог только id лида и текст ошибки, без контакта посетителя.
      this.logger.error(
        `Не удалось отправить уведомление о лиде ${notice.leadId}: ${
          error instanceof Error ? error.message : 'неизвестная ошибка'
        }`,
      );
    }
  }
}
