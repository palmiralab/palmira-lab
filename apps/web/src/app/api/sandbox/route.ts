import { checkRateLimit } from '@/lib/rate-limit';
import { createSandboxPage, type SandboxTemplate } from '@/lib/sandbox-store';

const MAX_TITLE_LENGTH = 80;
const MAX_BODY_LENGTH = 1000;
const VALID_TEMPLATES: SandboxTemplate[] = ['note', 'announcement', 'fact'];

function isSandboxTemplate(value: unknown): value is SandboxTemplate {
  return typeof value === 'string' && VALID_TEMPLATES.includes(value as SandboxTemplate);
}

export async function POST(request: Request) {
  const { rateLimited } = checkRateLimit(request);
  if (rateLimited) {
    return Response.json({ error: 'Слишком много запросов, попробуйте позже' }, { status: 429 });
  }

  const body = await request.json();
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const text = typeof body?.body === 'string' ? body.body.trim() : '';
  const template = body?.template;

  if (!title || !text) {
    return Response.json({ error: 'Укажите заголовок и текст' }, { status: 400 });
  }

  if (title.length > MAX_TITLE_LENGTH || text.length > MAX_BODY_LENGTH) {
    return Response.json(
      { error: `Заголовок — до ${MAX_TITLE_LENGTH} символов, текст — до ${MAX_BODY_LENGTH}` },
      { status: 400 },
    );
  }

  if (!isSandboxTemplate(template)) {
    return Response.json({ error: 'Неизвестный шаблон' }, { status: 400 });
  }

  const { id, expiresAt } = createSandboxPage({ title, body: text, template });
  return Response.json({ id, url: `/sandbox/${id}`, expiresAt });
}
