import { checkRateLimit } from '@/lib/rate-limit';
import { parseLandingInput } from '@/lib/landing-input';
import { createSandboxPage } from '@/lib/sandbox-store';

export async function POST(request: Request) {
  const { rateLimited } = checkRateLimit(request, 'demo-landing', 10);
  if (rateLimited) {
    return Response.json({ error: 'Слишком много запросов, попробуйте позже' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Некорректный запрос' }, { status: 400 });
  }

  const parsed = parseLandingInput(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const { id, expiresAt } = createSandboxPage(parsed.data);
  return Response.json({ id, url: `/demo/business-card/${id}`, expiresAt });
}
