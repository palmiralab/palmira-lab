import { Body, Controller, Post } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { CreateContactResponse } from './dto/create-contact.response.js';
import { StartIntakeResponse } from './dto/start-intake.response.js';
import { IntakeService } from './intake.service.js';

// Контроллер только принимает HTTP-запрос и передаёт его сервису.
@Controller('intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Post('start')
  start(): Promise<StartIntakeResponse> {
    return this.intakeService.start();
  }

  @Post('contact')
  createContact(@Body() dto: CreateContactDto): Promise<CreateContactResponse> {
    return this.intakeService.createContact(dto);
  }
}
