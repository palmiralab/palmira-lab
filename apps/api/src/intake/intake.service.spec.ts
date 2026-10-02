import type { TelegramNotifier } from '../notifications/telegram-notifier.service.js';
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
    const notifier = {} as unknown as TelegramNotifier;
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
