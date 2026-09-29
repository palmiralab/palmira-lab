import { Body, Controller, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsOptional, IsString, Length } from 'class-validator';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { configureApp } from '../src/app.setup.js';

// Проверяем настройки глобального ValidationPipe на тестовом контроллере, а не
// на бизнес-эндпоинте: правила пайпа не должны зависеть от того, что мы
// напишем дальше.
class SampleDto {
  @IsString()
  @Length(3, 250)
  contact!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;
}

@Controller('sample')
class SampleController {
  @Post()
  create(@Body() dto: SampleDto) {
    return {
      contact: dto.contact,
      name: dto.name,
      isDtoInstance: dto instanceof SampleDto,
    };
  }
}

describe('ValidationPipe (глобальные настройки)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SampleController],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const post = (body: object) =>
    request(app.getHttpServer()).post('/api/v1/sample').send(body);

  it('пропускает корректное тело и отдаёт экземпляр DTO (transform)', async () => {
    const res = await post({ contact: '@roman', name: 'Роман' }).expect(201);

    expect(res.body).toEqual({
      contact: '@roman',
      name: 'Роман',
      isDtoInstance: true,
    });
  });

  it('отклоняет неизвестное поле с 400 и называет его', async () => {
    const res = await post({ contact: '@roman', status: 'won' }).expect(400);

    expect(res.body.message).toContain('property status should not exist');
  });

  it('отклоняет слишком короткий contact', async () => {
    await post({ contact: 'ab' }).expect(400);
  });

  it('отклоняет тело без обязательного contact', async () => {
    await post({}).expect(400);
  });

  it('отклоняет поле неверного типа', async () => {
    await post({ contact: '@roman', name: 123 }).expect(400);
  });
});
