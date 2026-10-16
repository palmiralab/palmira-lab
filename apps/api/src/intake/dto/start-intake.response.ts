import { ApiProperty } from '@nestjs/swagger';

// Классы, а не интерфейсы: интерфейса нет после компиляции, и Swagger нечем
// было бы описать ответ (та же причина, что у DTO запросов).
export class IntakeMessage {
  @ApiProperty({ enum: ['assistant'], example: 'assistant' })
  role!: 'assistant';

  @ApiProperty({ example: 'Расскажите, какую задачу хотите решить…' })
  content!: string;
}

export class StartIntakeResponse {
  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  @ApiProperty({ format: 'uuid' })
  sessionId!: string;

  @ApiProperty({ type: IntakeMessage })
  message!: IntakeMessage;
}
