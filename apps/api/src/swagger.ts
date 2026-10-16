import type { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';

// Схема собирается из декораторов контроллеров и DTO. Отдельно от setupSwagger,
// чтобы e2e-тест и скрипт выгрузки docs/openapi.json брали ту же схему,
// не поднимая страницу документации.
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Palmira Lab API')
    .setDescription(
      'Заявки с сайта: старт разговора с ассистентом и контакт клиента.',
    )
    .setVersion('1')
    .build();
  return SwaggerModule.createDocument(app, config);
}

// Страница документации: /api/v1/docs, схема JSON: /api/v1/docs-json.
// Включается только флагом SWAGGER_ENABLED: на проде API наружу не
// публикуется, и описание его маршрутов там никому не нужно.
export function setupSwagger(app: INestApplication) {
  SwaggerModule.setup('docs', app, () => buildOpenApiDocument(app), {
    useGlobalPrefix: true,
  });
}
