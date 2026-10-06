import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { submitContact, type SubmitContactPayload } from './submit-contact';

const payload: SubmitContactPayload = {
  name: 'Анна',
  contact: '@anna',
  serviceType: 'ai_consultation',
};

const reply = (status: number, body?: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => (body === undefined ? Promise.reject(new Error('нет тела')) : Promise.resolve(body)),
  }) as unknown as Response;

describe('submitContact', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('шлёт POST на /api/contact с JSON-телом', async () => {
    fetchMock.mockResolvedValue(reply(200, { ok: true }));

    await submitContact({ ...payload, auditForm: { answers: { weeklyHours: '5–20 часов' } } });

    const [url, init] = fetchMock.mock.calls[0] as [string, { method: string; body: string }];
    expect(url).toBe('/api/contact');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({
      name: 'Анна',
      auditForm: { answers: { weeklyHours: '5–20 часов' } },
    });
  });

  it('успех: { ok: true }', async () => {
    fetchMock.mockResolvedValue(reply(200, { ok: true }));

    await expect(submitContact(payload)).resolves.toEqual({ ok: true });
  });

  it('400: показывает текст сервера, посетитель может поправить', async () => {
    fetchMock.mockResolvedValue(reply(400, { error: 'Слишком длинное описание' }));

    await expect(submitContact(payload)).resolves.toEqual({
      ok: false,
      kind: 'invalid',
      message: 'Слишком длинное описание',
    });
  });

  it('400 без тела: запасной текст', async () => {
    fetchMock.mockResolvedValue(reply(400));

    await expect(submitContact(payload)).resolves.toEqual({
      ok: false,
      kind: 'invalid',
      message: 'Проверьте введённые данные',
    });
  });

  it('429: показывает текст сервера, нужно подождать', async () => {
    fetchMock.mockResolvedValue(reply(429, { error: 'Слишком много запросов, попробуйте позже' }));

    await expect(submitContact(payload)).resolves.toEqual({
      ok: false,
      kind: 'rate_limited',
      message: 'Слишком много запросов, попробуйте позже',
    });
  });

  it.each([502, 500, 503])('%s: фиксированная фраза, текст сервера не показываем', async (status) => {
    fetchMock.mockResolvedValue(reply(status, { error: 'внутренняя деталь сервера' }));

    const result = await submitContact(payload);

    expect(result).toEqual({
      ok: false,
      kind: 'unavailable',
      message: 'Не удалось отправить, попробуйте ещё раз',
    });
  });

  it('обрыв сети: та же фиксированная фраза, исключение наружу не летит', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(submitContact(payload)).resolves.toEqual({
      ok: false,
      kind: 'unavailable',
      message: 'Не удалось отправить, попробуйте ещё раз',
    });
  });

  it('слишком длинный текст сервера обрезается до 200 символов', async () => {
    fetchMock.mockResolvedValue(reply(400, { error: 'а'.repeat(500) }));

    const result = await submitContact(payload);

    expect(result.ok === false && result.message).toHaveLength(200);
  });
});
