import { gigaChatProvider } from '@/lib/ai-provider/gigachat';
import { mergeProposal } from '@/lib/ai-provider/merge';

export async function POST(request: Request) {
  const body = await request.json();
  const message = typeof body?.message === 'string' ? body.message.trim() : '';

  if (!message) {
    return Response.json({ error: 'message is required' }, { status: 400 });
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
