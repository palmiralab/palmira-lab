import type { LeadNotifier } from '../notifications/lead-notifier.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { FIRST_QUESTION, INTAKE_STEP } from './intake.constants.js';
import { IntakeService } from './intake.service.js';

describe('IntakeService.start', () => {
  const created = {
    id: '11111111-1111-4111-8111-111111111111',
    sessionId: '22222222-2222-4222-8222-222222222222',
  };

  function setup() {
    const create = vi.fn().mockResolvedValue(created);
    const prisma = { conversation: { create } } as unknown as PrismaService;
    // start() уведомлений не шлёт, поэтому подмена пустая.
    const notifier = {} as unknown as LeadNotifier;
    return { create, service: new IntakeService(prisma, notifier) };
  }

  it('создаёт разговор на начальном шаге сценария', async () => {
    const { create, service } = setup();

    await service.start();

    expect(create).toHaveBeenCalledWith({
      data: { currentStep: INTAKE_STEP.start },
    });
  });

  it('возвращает идентификаторы и первый вопрос ассистента', async () => {
    const { service } = setup();

    await expect(service.start()).resolves.toEqual({
      conversationId: created.id,
      sessionId: created.sessionId,
      message: { role: 'assistant', content: FIRST_QUESTION },
    });
  });
});

describe('IntakeService.createContact: повторные заявки', () => {
  const dto = {
    name: 'Тест',
    contact: '@Ivan',
    serviceType: 'website_landing' as const,
  };
  // Сначала новые (так же, как отдаёт запрос с orderBy createdAt desc).
  const existing = [
    { id: 'lead-3', contact: 'ivan' },
    { id: 'lead-2', contact: '@Ivan' },
    { id: 'lead-1', contact: ' IVAN' },
  ];

  function setup(recent: { id: string; contact: string }[]) {
    const tx = {
      $executeRaw: vi.fn().mockResolvedValue(1),
      lead: {
        findMany: vi.fn().mockResolvedValue(recent),
        create: vi.fn().mockResolvedValue({ id: 'new-lead' }),
      },
      conversation: { updateMany: vi.fn(), findUnique: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn((callback: (t: typeof tx) => unknown) =>
        callback(tx),
      ),
    } as unknown as PrismaService;
    const notifier = { notifyNewLead: vi.fn().mockResolvedValue(undefined) };
    const service = new IntakeService(
      prisma,
      notifier as unknown as LeadNotifier,
    );
    return { tx, notifier, service };
  }

  it('лимит исчерпан (3 за сутки): не создаёт лида, не уведомляет, отдаёт id последнего', async () => {
    const { tx, notifier, service } = setup(existing);

    await expect(service.createContact(dto)).resolves.toEqual({
      leadId: 'lead-3',
    });
    expect(tx.lead.create).not.toHaveBeenCalled();
    expect(notifier.notifyNewLead).not.toHaveBeenCalled();
  });

  it('пока лимит не исчерпан (2 из 3): создаёт лида и уведомляет', async () => {
    const { tx, notifier, service } = setup(existing.slice(0, 2));

    await expect(service.createContact(dto)).resolves.toEqual({
      leadId: 'new-lead',
    });
    expect(tx.lead.create).toHaveBeenCalledOnce();
    expect(notifier.notifyNewLead).toHaveBeenCalledOnce();
  });

  it('не ждёт уведомление: посетитель получает ответ, пока отправка ещё идёт', async () => {
    const { notifier, service } = setup(existing.slice(0, 2));
    notifier.notifyNewLead.mockReturnValue(new Promise<void>(() => {}));

    await expect(service.createContact(dto)).resolves.toEqual({
      leadId: 'new-lead',
    });
    expect(notifier.notifyNewLead).toHaveBeenCalledOnce();
  });

  it('сбой уведомления не ломает приём заявки', async () => {
    const { notifier, service } = setup(existing.slice(0, 2));
    notifier.notifyNewLead.mockRejectedValue(new Error('Telegram недоступен'));

    await expect(service.createContact(dto)).resolves.toEqual({
      leadId: 'new-lead',
    });
  });

  it('контакт записан иначе (регистр, @), но считается тем же', async () => {
    const { tx, service } = setup(existing);

    await service.createContact({ ...dto, contact: ' @ivan' });

    expect(tx.lead.create).not.toHaveBeenCalled();
  });

  it('другой контакт: создаёт лида и уведомляет', async () => {
    const { tx, notifier, service } = setup(existing);

    await expect(
      service.createContact({ ...dto, contact: '@petr' }),
    ).resolves.toEqual({ leadId: 'new-lead' });
    expect(tx.lead.create).toHaveBeenCalledOnce();
    expect(notifier.notifyNewLead).toHaveBeenCalledOnce();
  });

  it('ищет повторы только среди заявок того же типа услуги за окно', async () => {
    const { tx, service } = setup([]);

    await service.createContact(dto);

    expect(tx.lead.findMany).toHaveBeenCalledWith({
      where: {
        serviceType: 'website_landing',
        createdAt: { gte: expect.any(Date) },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, contact: true },
    });
  });

  it('до проверки берёт блокировку на ключ контакта (защита от гонки)', async () => {
    const { tx, service } = setup([]);

    await service.createContact(dto);

    expect(tx.$executeRaw).toHaveBeenCalledOnce();
  });
});
