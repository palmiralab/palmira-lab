const WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS_PER_WINDOW = 5;
const CLEANUP_INTERVAL_MS = 5 * 60_000;

// In-memory — не переживает рестарт процесса, не работает на несколько
// инстансов. Достаточно для MVP одного процесса; при реальном деплое за
// nginx стоит держать rate limit и там (nginx переживёт рестарт Node и
// не завязан на один процесс) — код-level check тут не замена, а
// дополнительный слой, как и рекомендует дока Next.js.
const requestLog = new Map<string, number[]>();

// Без этого Map растёт бесконечно: запись каждого IP чистится только при
// его СЛЕДУЮЩЕМ запросе (лениво, при вызове checkRateLimit), а IP, который
// зашёл один раз и не вернулся, никогда не получает этот следующий вызов —
// запись повисает навсегда. Периодическая чистка убирает именно такие
// "мёртвые" записи, не только у активных IP. WeakMap тут не решение:
// ключ — строка (примитив, WeakMap требует объект), да и очистка нужна
// по времени, а не по недостижимости объекта, которую отслеживает GC.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of requestLog) {
    const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) {
      requestLog.delete(key);
    } else {
      requestLog.set(key, fresh);
    }
  }
}, CLEANUP_INTERVAL_MS);

// unref — чтобы этот таймер не мешал процессу Node корректно завершиться
// (например, при штатном шатдауне) — сам по себе он не должен быть
// причиной держать процесс живым.
cleanupTimer.unref();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'unknown';
}

// Счётчики раздельные по `scope` (имя маршрута): чат, контакт и демо
// не делят одну квоту. Лимит `max` у каждого маршрута свой.
export function checkRateLimit(
  request: Request,
  scope: string,
  max: number = DEFAULT_MAX_REQUESTS_PER_WINDOW,
): { rateLimited: boolean } {
  const key = `${scope}:${getClientIp(request)}`;
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= max) {
    return { rateLimited: true };
  }

  timestamps.push(now);
  requestLog.set(key, timestamps);
  return { rateLimited: false };
}
