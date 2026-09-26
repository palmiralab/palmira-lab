import type { ProposalGenerationProvider } from './provider';
import { buildTextJsonProposalSystemPrompt } from './prompts';
import { isValidModelResponse } from './validate-model-response';

const COMPLETIONS_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_VALIDATION_ATTEMPTS = 3;

// У DeepSeek response_format: json_object гарантирует только валидный
// синтаксис JSON, не форму объекта — никакой серверной гарантии формы нет,
// проверяем обе ветки union сами (isValidModelResponse, общая с GigaChat —
// у него с 26.09 та же ситуация, см. gigachat.ts).

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
  async classifyAndDraft({ messages }) {
    const questionsAsked = messages.filter((m) => m.role === 'assistant').length;
    const requestMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: buildTextJsonProposalSystemPrompt(questionsAsked) },
      ...messages,
    ];

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_VALIDATION_ATTEMPTS; attempt++) {
      const rawContent = await requestCompletionContent(requestMessages);
      try {
        const parsed: unknown = JSON.parse(rawContent);
        if (!isValidModelResponse(parsed)) {
          throw new Error('DeepSeek response does not match the expected shape');
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
