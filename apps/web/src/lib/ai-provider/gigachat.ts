import type { Proposal, ProposalGenerationProvider } from './provider';
import { PROPOSAL_DRAFT_SYSTEM_PROMPT } from './prompts';

const OAUTH_URL = 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const COMPLETIONS_URL = 'https://api.giga.chat/v1/chat/completions';
const MODEL = process.env.GIGACHAT_MODEL || 'GigaChat-2-Max';
const REQUEST_TIMEOUT_MS = 30_000;
const TOKEN_REFRESH_MARGIN_MS = 60_000;
const MAX_JSON_PARSE_ATTEMPTS = 3;

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

const PROPOSAL_DRAFT_SCHEMA = {
  type: 'object',
  properties: {
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
  required: ['serviceType', 'title', 'problemSummary', 'scope', 'assumptions', 'exclusions', 'nextStep'],
} as const;

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
      body: JSON.stringify({
        model: MODEL,
        messages,
        response_format: {
          type: 'json_schema',
          schema: PROPOSAL_DRAFT_SCHEMA,
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

export const gigaChatProvider: ProposalGenerationProvider = {
  async classifyAndDraft({ messages, answers }) {
    const requestMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: PROPOSAL_DRAFT_SYSTEM_PROMPT },
      ...messages,
      { role: 'user', content: `Уже собранные ответы клиента: ${JSON.stringify(answers)}` },
    ];

    let lastParseError: unknown;
    for (let attempt = 1; attempt <= MAX_JSON_PARSE_ATTEMPTS; attempt++) {
      const rawContent = await requestCompletionContent(requestMessages);
      try {
        return JSON.parse(rawContent) as Partial<Proposal>;
      } catch (err) {
        lastParseError = err;
      }
    }

    throw new Error(
      `GigaChat returned invalid JSON after ${MAX_JSON_PARSE_ATTEMPTS} attempts: ${String(lastParseError)}`,
    );
  },
};
