import type { Proposal, ProposalGenerationProvider, ServiceType } from './provider';
import { DEEPSEEK_PROPOSAL_DRAFT_SYSTEM_PROMPT } from './prompts';

const COMPLETIONS_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_VALIDATION_ATTEMPTS = 3;

const VALID_SERVICE_TYPES: ServiceType[] = [
  'telegram_automation',
  'website_landing',
  'content_automation',
  'ai_consultation',
  'manual_review',
];

// У DeepSeek response_format: json_object гарантирует только валидный
// синтаксис JSON, не форму объекта — в отличие от strict-схемы GigaChat.
// Эту проверку GigaChat делал за нас на уровне API, здесь её приходится
// писать самим.
function isValidProposalDraft(value: unknown): value is Partial<Proposal> {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.serviceType === 'string' &&
    VALID_SERVICE_TYPES.includes(v.serviceType as ServiceType) &&
    typeof v.title === 'string' &&
    typeof v.problemSummary === 'string' &&
    Array.isArray(v.scope) && v.scope.every((x) => typeof x === 'string') &&
    Array.isArray(v.assumptions) && v.assumptions.every((x) => typeof x === 'string') &&
    Array.isArray(v.exclusions) && v.exclusions.every((x) => typeof x === 'string') &&
    typeof v.nextStep === 'string'
  );
}

type DeepSeekCompletionsResponse = {
  choices: Array<{
    message: { content: string };
  }>;
};

async function requestCompletionContent(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not set');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`DeepSeek request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`DeepSeek completions failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as DeepSeekCompletionsResponse;
  const rawContent = data.choices?.[0]?.message?.content;
  if (typeof rawContent !== 'string') {
    throw new Error('DeepSeek response missing message content');
  }

  return rawContent;
}

export const deepSeekProvider: ProposalGenerationProvider = {
  async classifyAndDraft({ messages, answers }) {
    const requestMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: DEEPSEEK_PROPOSAL_DRAFT_SYSTEM_PROMPT },
      ...messages,
      { role: 'user', content: `Уже собранные ответы клиента: ${JSON.stringify(answers)}` },
    ];

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_VALIDATION_ATTEMPTS; attempt++) {
      const rawContent = await requestCompletionContent(requestMessages);
      try {
        const parsed: unknown = JSON.parse(rawContent);
        if (!isValidProposalDraft(parsed)) {
          throw new Error('DeepSeek response does not match the expected Proposal shape');
        }
        return parsed;
      } catch (err) {
        lastError = err;
      }
    }

    throw new Error(
      `DeepSeek returned invalid/malformed JSON after ${MAX_VALIDATION_ATTEMPTS} attempts: ${String(lastError)}`,
    );
  },
};
