import type { ModelResponse, ProposalGenerationProvider } from './provider';
import { buildProposalSystemPrompt, buildTextJsonProposalSystemPrompt } from './prompts';
import { isValidModelResponse } from './validate-model-response';

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const COMPLETIONS_URL = 'https://api.giga.chat/v1/chat/completions';
const MODEL = process.env.GIGACHAT_MODEL || 'GigaChat-2-Max';
const REQUEST_TIMEOUT_MS = 30_000;
const TOKEN_REFRESH_MARGIN_MS = 60_000;

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

type GigaChatOAuthResponse = {
  access_token: string;
  expires_at: number;
};

let cachedToken: CachedToken | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
    return cachedToken.accessToken;
  }

  const authKey = process.env.GIGACHAT_AUTH_KEY;
  if (!authKey) {
    throw new Error('GIGACHAT_AUTH_KEY is not set');
  }

  const response = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      RqUID: crypto.randomUUID(),
      Authorization: `Basic ${authKey}`,
    },
    body: 'scope=GIGACHAT_API_PERS',
  });

  if (!response.ok) {
    throw new Error(`GigaChat OAuth failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as GigaChatOAuthResponse;
  cachedToken = { accessToken: data.access_token, expiresAt: data.expires_at };
  return cachedToken.accessToken;
}

type GigaChatCompletionsResponse = {
  choices: Array<{
    message: { content: string };
  }>;
};

// ============================================================================
// Активная реализация (с 26.09) — обычный текстовый ответ, без response_format.
//
// Причина: и response_format: json_schema (строгая схема, была здесь раньше),
// и response_format: json_object (loose-режим, как у DeepSeek) у GigaChat
// сейчас нестабильны — детерминированно возвращают пустой content на части
// вводов (например, "авито" одним словом — 5/5 пусто), у GigaChat-2 Lite
// почти на любом вводе. Без response_format вообще — стабильно, 3/3 на
// обоих тирах, включая ровно те вводы, которые ломали строгий режим.
// Полный разбор с контрольными тестами — dev/palmira-lab-notes/llm-nature-log.md,
// записи 26.09. Deprecated-реализация со строгой схемой сохранена ниже
// (gigaChatProviderStrictSchema) для справки/обсуждения — не используется.
// ============================================================================

const MAX_VALIDATION_ATTEMPTS = 3;

async function requestCompletionContent(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const accessToken = await getAccessToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, messages }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`GigaChat request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`GigaChat completions failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as GigaChatCompletionsResponse;
  const rawContent = data.choices?.[0]?.message?.content;
  if (typeof rawContent !== 'string') {
    throw new Error('GigaChat response missing message content');
  }

  return rawContent;
}

// Модель без response_format иногда оборачивает JSON в markdown-код-блок
// (```json ... ```) или добавляет пояснение вокруг, хотя промпт просит не
// делать этого — без серверной гарантии формата это не баг, а такая же
// вещь, с которой уже живёт DeepSeek. Вырезаем блок кода, если он есть,
// прежде чем пытаться JSON.parse.
function extractJsonFromContent(rawContent: string): string {
  const fencedMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fencedMatch ? fencedMatch[1] : rawContent).trim();
}

export const gigaChatProvider: ProposalGenerationProvider = {
  async classifyAndDraft({ messages }) {
    const questionsAsked = messages.filter((m) => m.role === 'assistant').length;
    const requestMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: buildTextJsonProposalSystemPrompt(questionsAsked) },
      ...messages,
    ];

    let lastError: unknown;
    let lastNonEmptyContent = '';
    for (let attempt = 1; attempt <= MAX_VALIDATION_ATTEMPTS; attempt++) {
      const rawContent = await requestCompletionContent(requestMessages);
      if (rawContent.trim()) {
        lastNonEmptyContent = rawContent.trim();
      }
      try {
        const parsed: unknown = JSON.parse(extractJsonFromContent(rawContent));
        if (!isValidModelResponse(parsed)) {
          throw new Error('GigaChat response does not match the expected shape');
        }
        return parsed;
      } catch (err) {
        lastError = err;
      }
    }

    // Временный fallback (26.09, см. llm-nature-log.md) — на некоторых
    // конкретных вводах (найден один конкретный: реплика "На авито и
    // телеграм" именно как ОТВЕТ на предыдущий вопрос, не как первое
    // сообщение) модель стабильно игнорирует инструкцию формата и отвечает
    // обычным текстом вместо JSON, во всех наблюдавшихся случаях —
    // содержательным уточняющим вопросом, не мусором. Раз ни один из
    // MAX_VALIDATION_ATTEMPTS не дал валидный JSON, но живой текст есть —
    // считаем его уточняющим вопросом, а не рушим диалог ошибкой. Если
    // контента не было вообще (пустая строка — старый баг деградации,
    // см. Тему 8 pm-explainer.md) — fallback пуст, кидаем обычную ошибку.
    // Пересмотреть после первых внешних тестовых прогонов (через
    // несколько дней) — не постоянное решение, эвристика может маскировать
    // случаи, где текст модели НЕ является вопросом.
    //
    // Сужено 27.09 (см. day-plan-2026-09-27.md, найдено Романом) — не
    // применять этот fallback, если сырой текст похож на JSON (начинается
    // с { или [): в наблюдавшемся случае модель перепутала serviceType:
    // "manual_review" с верхнеуровневым type и вернула `{ "type":
    // "manual_review" }` — синтаксически валидный, но не проходящий
    // isValidModelResponse JSON, и старый fallback показывал эту сырую
    // строку посетителю как "уточняющий вопрос".
    const looksLikeJson = /^[{[]/.test(lastNonEmptyContent);
    if (lastNonEmptyContent && !looksLikeJson) {
      return { type: 'question', text: lastNonEmptyContent };
    }

    // 27.09 (продолжение) — вместо ошибки просим пользователя переформулировать,
    // а не рушим диалог. requestCompletionContent выше НЕ обёрнут в try/catch —
    // настоящие сетевые/API-сбои (таймаут, не-2xx от GigaChat) вылетают из цикла
    // сразу и наверх, не долетая до этой точки. Сюда попадают только случаи,
    // когда GigaChat трижды подряд честно что-то ответил (лог lastError это
    // подтверждает), просто ни разу не в валидном формате — JSON-подобный
    // мусор (looksLikeJson выше) или совсем пустой content (старый баг
    // деградации, Тема 8 pm-explainer.md). В обоих случаях канал связи жив,
    // просто конкретный ввод не задался модели — переформулировка почти
    // всегда даёт разный (обычно рабочий) результат, честная ошибка тут не
    // нужнее, чем при обычном непонятном вопросе от посетителя.
    console.error(
      `GigaChat format failure after ${MAX_VALIDATION_ATTEMPTS} attempts, asking user to rephrase: ${String(lastError)}`,
    );
    return {
      type: 'question',
      text: 'Не получилось разобрать ваш последний ответ — не могли бы вы переформулировать его другими словами?',
    };
  },
};

// ============================================================================
// DEPRECATED, не используется — оставлено по просьбе Романа для справки и
// обсуждения на собеседованиях (строгая схема / structured output — тема
// сама по себе интересная и правильная, просто текущая реализация GigaChat
// её нестабильно поддерживает, см. разбор выше). Не импортируется route.ts.
// ============================================================================

const MAX_JSON_PARSE_ATTEMPTS = 3;

const MODEL_RESPONSE_SCHEMA = {
  type: 'object',
  oneOf: [
    {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['question'] },
        text: { type: 'string', description: 'Текст короткого уточняющего вопроса клиенту' },
      },
      required: ['type', 'text'],
    },
    {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['proposal'] },
        serviceType: {
          type: 'string',
          enum: [
            'telegram_automation',
            'website_landing',
            'content_automation',
            'ai_consultation',
            'manual_review',
          ],
          description: 'Категория услуги, к которой относится запрос клиента',
        },
        title: { type: 'string', description: 'Короткое название предложения' },
        problemSummary: { type: 'string', description: 'Суть задачи клиента, как её понял ассистент' },
        scope: { type: 'array', items: { type: 'string' }, description: 'Состав работ' },
        assumptions: { type: 'array', items: { type: 'string' }, description: 'Допущения предложения' },
        exclusions: { type: 'array', items: { type: 'string' }, description: 'Что явно не входит в объём' },
        nextStep: { type: 'string', description: 'Следующий шаг для клиента' },
      },
      required: [
        'type',
        'serviceType',
        'title',
        'problemSummary',
        'scope',
        'assumptions',
        'exclusions',
        'nextStep',
      ],
    },
  ],
} as const;

async function requestCompletionContentStrictSchema(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const accessToken = await getAccessToken();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        response_format: {
          type: 'json_schema',
          schema: MODEL_RESPONSE_SCHEMA,
          strict: true,
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`GigaChat request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`GigaChat completions failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as GigaChatCompletionsResponse;
  const rawContent = data.choices?.[0]?.message?.content;
  if (typeof rawContent !== 'string') {
    throw new Error('GigaChat response missing message content');
  }

  return rawContent;
}

export const gigaChatProviderStrictSchema: ProposalGenerationProvider = {
  async classifyAndDraft({ messages }) {
    const questionsAsked = messages.filter((m) => m.role === 'assistant').length;
    const requestMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: buildProposalSystemPrompt(questionsAsked) },
      ...messages,
    ];

    let lastParseError: unknown;
    for (let attempt = 1; attempt <= MAX_JSON_PARSE_ATTEMPTS; attempt++) {
      const rawContent = await requestCompletionContentStrictSchema(requestMessages);
      try {
        const parsed = JSON.parse(rawContent) as { type?: unknown };
        if (parsed.type !== 'question' && parsed.type !== 'proposal') {
          throw new Error(`unexpected response type: ${String(parsed.type)}`);
        }
        return parsed as ModelResponse;
      } catch (err) {
        lastParseError = err;
      }
    }

    throw new Error(
      `GigaChat returned invalid JSON after ${MAX_JSON_PARSE_ATTEMPTS} attempts: ${String(lastParseError)}`,
    );
  },
};
