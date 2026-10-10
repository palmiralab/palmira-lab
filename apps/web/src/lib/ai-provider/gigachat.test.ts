import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Токен кэшируется в модуле, поэтому каждый тест импортирует модуль заново.
async function loadProvider() {
  vi.resetModules();
  return (await import('./gigachat')).gigaChatProvider;
}

const fetchMock = vi.fn();

function oauthResponse() {
  return Response.json({ access_token: 'token', expires_at: Date.now() + 3_600_000 });
}

function completionResponse(content: string, finishReason: string) {
  return Response.json({ choices: [{ message: { content }, finish_reason: finishReason }] });
}

describe('gigaChatProvider.classifyAndDraft', () => {
  beforeEach(() => {
    vi.stubEnv('GIGACHAT_AUTH_KEY', 'test-key');
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('фильтр GigaChat (blacklist): вместо заглушки модели отвечает своим текстом, без повторов', async () => {
    fetchMock
      .mockResolvedValueOnce(oauthResponse())
      .mockResolvedValueOnce(
        completionResponse(
          'Как и любая языковая модель, GigaChat не обладает собственным мнением…',
          'blacklist',
        ),
      );
    const provider = await loadProvider();

    const result = await provider.classifyAndDraft({
      messages: [{ role: 'user', content: 'Хочу открыть секс-шоп' }],
    });

    expect(result).toEqual({
      type: 'question',
      text: 'С этой темой мы помочь не сможем. Опишите другую задачу (сайт, бот, автоматизацию рутины) или переформулируйте запрос.',
    });
    // Один запрос токена и один запрос ответа: повторов нет.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('обычный ответ модели в нужном формате возвращается как есть', async () => {
    fetchMock
      .mockResolvedValueOnce(oauthResponse())
      .mockResolvedValueOnce(
        completionResponse(JSON.stringify({ type: 'question', text: 'Для кого сайт?' }), 'stop'),
      );
    const provider = await loadProvider();

    const result = await provider.classifyAndDraft({
      messages: [{ role: 'user', content: 'Нужен сайт' }],
    });

    expect(result).toEqual({ type: 'question', text: 'Для кого сайт?' });
  });
});
