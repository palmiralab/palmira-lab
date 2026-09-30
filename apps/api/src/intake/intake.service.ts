import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StartIntakeResponse } from './dto/start-intake.response.js';
import { FIRST_QUESTION, INTAKE_STEP } from './intake.constants.js';

@Injectable()
export class IntakeService {
  constructor(private readonly prisma: PrismaService) {}

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
}
