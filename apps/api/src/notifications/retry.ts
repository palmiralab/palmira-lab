const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface RetryOptions {
  // Сколько всего попыток (первая тоже считается).
  attempts: number;
  // Пауза между попытками, мс. После последней попытки не ждём.
  delayMs: number;
}

// Повторяет асинхронное действие при сбое. Нужен для уведомлений: канал до
// Telegram с нашего сервера нестабилен (каждый третий запрос зависает), а
// повтор обычно проходит. Возвращает результат первой удачной попытки,
// иначе бросает ошибку последней.
export async function withRetry<T>(
  action: () => Promise<T>,
  { attempts, delayMs }: RetryOptions,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(delayMs);
    }
  }
  throw lastError;
}
