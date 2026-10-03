import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendContact } from './intake-client';

const payload = {
  name: 'Анна',
  contact: '@anna',
  serviceType: 'telegram_automation',
} as const;

describe('sendContact', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv('API_URL', 'http://api.test/api/v1');
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('шлёт POST на /intake/contact с телом JSON и возвращает ok', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 201 }));

    const result = await sendContact(payload);

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/v1/intake/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });

  it('400 превращает в понятный ответ посетителю', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 400 }));

    expect(await sendContact(payload)).toEqual({
      ok: false,
      status: 400,
      error: 'Проверьте имя и контакт для связи',
    });
  });

  it.each([404, 409, 500, 503])('%i отвечает как при сбое сервиса (502)', async (status) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));

    expect(await sendContact(payload)).toMatchObject({ ok: false, status: 502 });
  });

  it('сеть недоступна: 502, исключение наружу не летит', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    expect(await sendContact(payload)).toMatchObject({ ok: false, status: 502 });
  });

  it('API_URL не задан: 502 и fetch не вызывается', async () => {
    vi.stubEnv('API_URL', '');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(await sendContact(payload)).toMatchObject({ ok: false, status: 502 });
    expect(fetchMock).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
