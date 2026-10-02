import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ServiceType } from '../../generated/prisma/enums.js';
import type { Prisma } from '../../generated/prisma/client.js';

// Лимит как в веб-форме (MAX_FIELD_LENGTH в apps/web): иначе API принимал бы
// то, что сайт отсекает, и наоборот.
const MAX_FIELD_LENGTH = 200;

// Обрезаем пробелы до проверки длины: строка из одних пробелов не должна
// проходить как непустая.
const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

// DTO это класс, а не интерфейс: интерфейса нет после компиляции, и
// ValidationPipe нечем было бы проверять поля.
export class CreateContactDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_FIELD_LENGTH)
  name!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_FIELD_LENGTH)
  contact!: string;

  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  // Ответы анкеты аудита целиком; структуру пока не проверяем (набор
  // вопросов задаётся на сайте и может меняться).
  @IsOptional()
  @IsObject()
  auditAnswers?: Prisma.InputJsonObject;

  // Необязательный: сайт пока не открывает разговор в API (его чат ходит в
  // Next-маршруты), после подключения станет приходить всегда.
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
