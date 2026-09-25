import { gigaChatProvider } from '@/lib/ai-provider/gigachat';
import { mergeProposal } from '@/lib/ai-provider/merge';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_MESSAGE_LENGTH = 2000;
// Запас над реалистичным максимумом диалога (1 исходное сообщение + до 4
// пар вопрос/ответ) — не даёт клиенту прислать искусственно раздутую
// историю на каждый запрос.
const MAX_MESSAGES = 20;

type IncomingMessage = { role: 'user' | 'assistant'; content: string };

function isValidMessage(value: unknown): value is IncomingMessage {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.role === 'user' || v.role === 'assistant') &&
    typeof v.content === 'string' &&
    v.content.trim().length > 0 &&
    v.content.length <= MAX_MESSAGE_LENGTH
  );
}

export async function POST(request: Request) {
  const { rateLimited } = checkRateLimit(request);
  if (rateLimited) {
    return Response.json({ error: 'Слишком много запросов, попробуйте позже' }, { status: 429 });
  }

  const body = await request.json();
  const rawMessages = body?.messages;

  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return Response.json({ error: 'messages is required' }, { status: 400 });
  }

  if (rawMessages.length > MAX_MESSAGES) {
    return Response.json({ error: 'Слишком длинный диалог' }, { status: 400 });
  }

  if (!rawMessages.every(isValidMessage)) {
    return Response.json(
      { error: `Каждое сообщение — не длиннее ${MAX_MESSAGE_LENGTH} символов, с ролью user/assistant` },
      { status: 400 },
    );
  }

  const messages = rawMessages as IncomingMessage[];
  if (messages[messages.length - 1].role !== 'user') {
    return Response.json({ error: 'last message must be from user' }, { status: 400 });
  }

  try {
    const modelResponse = await gigaChatProvider.classifyAndDraft({ messages });

    if (modelResponse.type === 'question') {
      return Response.json({ type: 'question', text: modelResponse.text });
    }

    return Response.json({ type: 'proposal', proposal: mergeProposal(modelResponse) });
  } catch (err) {
    console.error('proposal generation failed', err);
    return Response.json({ error: 'Не удалось сгенерировать предложение' }, { status: 502 });
  }
}
