import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { CreateContactResponse } from './dto/create-contact.response.js';
import { StartIntakeResponse } from './dto/start-intake.response.js';
import { IntakeService } from './intake.service.js';

// Контроллер только принимает HTTP-запрос и передаёт его сервису.
@ApiTags('intake')
@Controller('intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Post('start')
  @ApiOperation({ summary: 'Открыть разговор с ассистентом' })
  @ApiCreatedResponse({ type: StartIntakeResponse })
  start(): Promise<StartIntakeResponse> {
    return this.intakeService.start();
  }

  @Post('contact')
  @ApiOperation({ summary: 'Оставить контакт: создаёт заявку' })
  @ApiCreatedResponse({ type: CreateContactResponse })
  @ApiBadRequestResponse({ description: 'Поля не прошли проверку' })
  @ApiNotFoundResponse({ description: 'Разговор conversationId не найден' })
  @ApiConflictResponse({ description: 'Разговор уже привязан к другой заявке' })
  createContact(@Body() dto: CreateContactDto): Promise<CreateContactResponse> {
    return this.intakeService.createContact(dto);
  }
}
