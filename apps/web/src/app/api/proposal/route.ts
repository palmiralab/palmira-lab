import { gigaChatProvider } from '@/lib/ai-provider/gigachat';
import { mergeProposal } from '@/lib/ai-provider/merge';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_MESSAGE_LENGTH = 2000;

export async function POST(request: Request) {
  const { rateLimited } = checkRateLimit(request);
  if (rateLimited) {
    return Response.json({ error: 'Слишком много запросов, попробуйте позже' }, { status: 429 });
  }

  const body = await request.json();
  const message = typeof body?.message === 'string' ? body.message.trim() : '';

  if (!message) {
    return Response.json({ error: 'message is required' }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json(
      { error: `Сообщение слишком длинное (максимум ${MAX_MESSAGE_LENGTH} символов)` },
      { status: 400 },
    );
  }

  try {
    const draft = await gigaChatProvider.classifyAndDraft({
      messages: [{ role: 'user', content: message }],
      answers: {},
    });
    return Response.json(mergeProposal(draft));
  } catch (err) {
    console.error('proposal generation failed', err);
    return Response.json({ error: 'Не удалось сгенерировать предложение' }, { status: 502 });
  }
}
