import type { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation.js';
import {
  TelegramNotifier,
  type NewLeadNotice,
} from './telegram-notifier.service.js';

const TOKEN = '123456:SECRET-TOKEN';
const CHAT_ID = '987654321';

const notice: NewLeadNotice = {
  leadId: '11111111-1111-4111-8111-111111111111',
  name: 'Анна',
  contact: '@anna_test',
  serviceType: 'website_landing',
};

function makeNotifier(
  config: Record<string, string | undefined> = {
    TELEGRAM_BOT_TOKEN: TOKEN,
    TELEGRAM_CHAT_ID: CHAT_ID,
  },
) {
  const configService = {
    get: (key: string) => config[key],
  } as unknown as ConfigService<Env, true>;
  return new TelegramNotifier(configService);
}

describe('TelegramNotifier', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const sentBody = () => {
    const init = fetchMock.mock.calls[0][1] as { body: string };
    return JSON.parse(init.body) as Record<string, unknown>;
  };

  it('шлёт POST на sendMessage с chat_id и данными заявки', async () => {
    await makeNotifier().notifyNewLead(notice);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, { method: string }];
    expect(url).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`);
    expect(init.method).toBe('POST');

    const body = sentBody();
    expect(body.chat_id).toBe(CHAT_ID);
    expect(body.text).toEqual(expect.stringContaining('Анна'));
    expect(body.text).toEqual(expect.stringContaining('@anna_test'));
    expect(body.text).toEqual(expect.stringContaining('website_landing'));
    expect(body.text).toEqual(expect.stringContaining(notice.leadId));
  });

  it('не использует parse_mode: текст посетителя не должен разбираться как разметка', async () => {
    await makeNotifier().notifyNewLead({
      ...notice,
      name: '<b>Анна</b> [x](http://evil)',
    });

    expect(sentBody()).not.toHaveProperty('parse_mode');
  });

  it('добавляет ответы анкеты аудита, если они есть', async () => {
    await makeNotifier().notifyNewLead({
      ...notice,
      serviceType: 'ai_consultation',
      auditAnswers: { business: 'Клиника', hoursPerWeek: 10 },
    });

    expect(sentBody().text).toEqual(
      expect.stringMatching(/business.*Клиника[\s\S]*hoursPerWeek.*10/),
    );
  });

  it('ничего не шлёт, если токен или chat_id не заданы', async () => {
    await makeNotifier({}).notifyNewLead(notice);
    await makeNotifier({ TELEGRAM_BOT_TOKEN: TOKEN }).notifyNewLead(notice);
    await makeNotifier({ TELEGRAM_CHAT_ID: CHAT_ID }).notifyNewLead(notice);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('бросает ошибку, если Telegram ответил не 2xx, и без токена в тексте', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });

    await expect(makeNotifier().notifyNewLead(notice)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('401'),
      }),
    );
    await expect(makeNotifier().notifyNewLead(notice)).rejects.toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining(TOKEN),
      }),
    );
  });

  it('бросает ошибку при сетевом сбое, и без токена в тексте', async () => {
    fetchMock.mockRejectedValue(
      new Error(`fetch failed https://api.telegram.org/bot${TOKEN}/sendMessage`),
    );

    await expect(makeNotifier().notifyNewLead(notice)).rejects.toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining(TOKEN),
      }),
    );
  });

  it('показывает КП кратко: название, задача, состав, срок и цена', async () => {
    await makeNotifier().notifyNewLead({
      ...notice,
      proposal: {
        title: 'Лендинг для клиники',
        problemSummary: 'Вы хотите принимать записи онлайн',
        scope: ['Дизайн', 'Вёрстка'],
        estimatedTimelineText: '2 недели',
        priceRangeMin: 50000,
        priceRangeMax: 80000,
        disclaimer: 'не должно попасть в сообщение',
      },
    });

    const text = sentBody().text as string;
    expect(text).toContain('КП:\nЛендинг для клиники');
    expect(text).toContain('Задача: Вы хотите принимать записи онлайн');
    expect(text).toContain('Состав:\n- Дизайн\n- Вёрстка');
    expect(text).toContain('Срок: 2 недели');
    expect(text).toContain('Цена: 50000–80000 ₽');
    expect(text).not.toContain('не должно попасть');
  });

  it('не падает на КП неожиданной формы', async () => {
    await makeNotifier().notifyNewLead({
      ...notice,
      proposal: { title: 42, scope: 'не список', priceRangeMin: '10' },
    });

    const text = sentBody().text as string;
    expect(text).toContain(notice.leadId);
    expect(text).not.toContain('Состав:');
    expect(text).not.toContain('Цена:');
  });

  it('одно свободное описание подписывает как «Запрос клиента»', async () => {
    await makeNotifier().notifyNewLead({
      ...notice,
      auditAnswers: { details: 'Нужен бот для записи' },
    });

    const text = sentBody().text as string;
    expect(text).toContain('Запрос клиента:\nНужен бот для записи');
    expect(text).not.toContain('Анкета аудита');
  });

  it('при длинном КП режет тело, а шапка с контактом и id лида остаётся целой', async () => {
    await makeNotifier().notifyNewLead({
      ...notice,
      proposal: { title: 'Б'.repeat(10_000) },
    });

    const text = sentBody().text as string;
    expect(text.length).toBeLessThanOrEqual(4096);
    expect(text).toContain(`Контакт: ${notice.contact}`);
    expect(text).toContain(`Лид: ${notice.leadId}`);
    expect(text.endsWith('…')).toBe(true);
  });

  it('обрезает текст до лимита Telegram (4096 символов)', async () => {
    await makeNotifier().notifyNewLead({
      ...notice,
      name: 'А'.repeat(200),
      auditAnswers: { long: 'Б'.repeat(10_000) },
    });

    expect((sentBody().text as string).length).toBeLessThanOrEqual(4096);
  });
});
