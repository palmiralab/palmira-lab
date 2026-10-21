import { readFileSync } from 'node:fs';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import {
  buildOpenApiDocument,
  OPENAPI_FILE,
  setupSwagger,
} from '../src/swagger.js';

describe('Swagger (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
  });

  afterEach(async () => {
    await app.close();
  });

  it('схема описывает все публичные маршруты и только их', () => {
    const doc = buildOpenApiDocument(app);

    expect(Object.keys(doc.paths).sort()).toEqual([
      '/api/v1/health',
      '/api/v1/intake/contact',
      '/api/v1/intake/start',
    ]);
  });

  it('у intake/contact описаны все ответы, которые бросает код', () => {
    const doc = buildOpenApiDocument(app);
    const responses = doc.paths['/api/v1/intake/contact'].post?.responses;

    expect(Object.keys(responses ?? {}).sort()).toEqual([
      '201',
      '400',
      '404',
      '409',
    ]);
  });

  // Если упал: изменился API, перегенерируйте файл командой `npm run openapi`
  // (в apps/api) и закоммитьте его вместе с изменением.
  it('docs/openapi.json в репозитории совпадает с текущей схемой', () => {
    const committed: unknown = JSON.parse(readFileSync(OPENAPI_FILE, 'utf8'));
    // Через JSON, как при записи в файл: так пропадают поля со значением undefined.
    const current: unknown = JSON.parse(
      JSON.stringify(buildOpenApiDocument(app)),
    );

    expect(committed).toEqual(current);
  });

  it('без setupSwagger страницы документации нет', async () => {
    await app.init();

    await request(app.getHttpServer()).get('/api/v1/docs').expect(404);
    await request(app.getHttpServer()).get('/api/v1/docs-json').expect(404);
  });

  it('с setupSwagger схема отдаётся по /api/v1/docs-json', async () => {
    setupSwagger(app);
    await app.init();

    const res = await request(app.getHttpServer())
      .get('/api/v1/docs-json')
      .expect(200);
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.info.title).toBe('Palmira Lab API');
  });
});
