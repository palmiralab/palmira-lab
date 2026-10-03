import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sendContact = vi.hoisted(() => vi.fn());
const checkRateLimit = vi.hoisted(() => vi.fn());

vi.mock('@/lib/intake-client', () => ({ sendContact }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit }));

import { POST } from './route';

function post(body: unknown) {
  return POST(
    new Request('http://site.test/api/contact', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  );
}

const valid = { name: ' Анна ', contact: ' @anna ', serviceType: 'telegram_automation' };

describe('POST /api/contact', () => {
  beforeEach(() => {
    checkRateLimit.mockReturnValue({ rateLimited: false });
    sendContact.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('передаёт в API очищенные поля и serviceType, отвечает ok', async () => {
    const response = await post(valid);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(sendContact).toHaveBeenCalledWith({
      name: 'Анна',
      contact: '@anna',
      serviceType: 'telegram_automation',
    });
  });

  it('описание из auditAnswers.details уходит в API очищенным', async () => {
    await post({ ...valid, auditAnswers: { details: '  Нужно автоматизировать склад  ' } });

    expect(sendContact).toHaveBeenCalledWith({
      name: 'Анна',
      contact: '@anna',
      serviceType: 'telegram_automation',
      auditAnswers: { details: 'Нужно автоматизировать склад' },
    });
  });

  it('пустое описание не превращается в auditAnswers', async () => {
    await post({ ...valid, auditAnswers: { details: '   ' } });

    expect(sendContact.mock.calls[0][0]).not.toHaveProperty('auditAnswers.details');
    expect(sendContact.mock.calls[0][0].auditAnswers).toBeUndefined();
  });

  it('слишком длинное описание: 400, в API не ходим', async () => {
    const response = await post({ ...valid, auditAnswers: { details: 'а'.repeat(2001) } });

    expect(response.status).toBe(400);
    expect(sendContact).not.toHaveBeenCalled();
  });

  it('лимит запросов: 429, в API не ходим', async () => {
    checkRateLimit.mockReturnValue({ rateLimited: true });

    expect((await post(valid)).status).toBe(429);
    expect(sendContact).not.toHaveBeenCalled();
  });

  it.each([
    ['нет имени', { ...valid, name: '  ' }],
    ['нет контакта', { ...valid, contact: '' }],
    ['слишком длинное имя', { ...valid, name: 'а'.repeat(201) }],
    ['неизвестный serviceType', { ...valid, serviceType: 'hack' }],
    ['нет serviceType', { name: 'Анна', contact: '@anna' }],
  ])('%s: 400, в API не ходим', async (_title, body) => {
    expect((await post(body)).status).toBe(400);
    expect(sendContact).not.toHaveBeenCalled();
  });

  it('ошибка API передаётся посетителю с её статусом и текстом', async () => {
    sendContact.mockResolvedValue({ ok: false, status: 502, error: 'Сервис временно недоступен' });

    const response = await post(valid);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'Сервис временно недоступен' });
  });
});
