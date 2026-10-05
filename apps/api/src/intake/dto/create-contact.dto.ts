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
import { MaxJsonBytes } from './max-json-bytes.decorator.js';

// Лимит как в веб-форме (MAX_FIELD_LENGTH в apps/web): иначе API принимал бы
// то, что сайт отсекает, и наоборот.
const MAX_FIELD_LENGTH = 200;

// Предел размера ответов анкеты: 7 вопросов с развёрнутыми ответами занимают
// 2–4 КБ, 10 КБ даёт запас.
const MAX_AUDIT_ANSWERS_BYTES = 10 * 1024;

// Предел размера КП в заявке: реальное КП занимает 1–3 КБ, 20 КБ даёт запас.
const MAX_PROPOSAL_BYTES = 20 * 1024;

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

  // Ответы анкеты аудита целиком; структуру не проверяем (набор вопросов
  // задаётся на сайте и может меняться), но размер режем, как у proposal.
  @IsOptional()
  @IsObject()
  @MaxJsonBytes(MAX_AUDIT_ANSWERS_BYTES)
  auditAnswers?: Prisma.InputJsonObject;

  // КП, которое видел клиент, снимком. Форму не проверяем (она меняется на
  // сайте), но размер режем: API публичный, и сверх общего лимита тела запроса
  // (100 КБ по умолчанию у Express) в базу и Telegram такое не нужно.
  @IsOptional()
  @IsObject()
  @MaxJsonBytes(MAX_PROPOSAL_BYTES)
  proposal?: Prisma.InputJsonObject;

  // Необязательный: сайт пока не открывает разговор в API (его чат ходит в
  // Next-маршруты), после подключения станет приходить всегда.
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
