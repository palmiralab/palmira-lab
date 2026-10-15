// У GigaChat на бесплатном тарифе один поток: второй одновременный запрос
// получает 429. Поэтому запросы к нему идут по одному, а 429 (чужой запрос ещё
// не закончился) повторяем с короткой паузой, а не показываем посетителю ошибку.

// Выполняет задачи строго по одной в порядке вызова. Упавшая задача не
// блокирует следующую.
export function createSerialGate() {
  let tail: Promise<unknown> = Promise.resolve();

  return function run<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task, task);
    tail = result.catch(() => undefined);
    return result;
  };
}

type RetryOptions = {
  isRateLimit: (err: unknown) => boolean;
  // Сколько всего можно ждать между попытками; дальше отдаём исходную ошибку.
  maxWaitMs: number;
  // Паузы между попытками; после последней используется она же.
  delaysMs: readonly number[];
  sleep?: (ms: number) => Promise<void>;
};

export async function retryOnRateLimit<T>(
  task: () => Promise<T>,
  { isRateLimit, maxWaitMs, delaysMs, sleep = defaultSleep }: RetryOptions,
): Promise<T> {
  let waited = 0;

  for (let attempt = 0; ; attempt++) {
    try {
      return await task();
    } catch (err) {
      if (!isRateLimit(err)) throw err;

      const delay = delaysMs[Math.min(attempt, delaysMs.length - 1)];
      if (waited + delay > maxWaitMs) throw err;

      await sleep(delay);
      waited += delay;
    }
  }
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
