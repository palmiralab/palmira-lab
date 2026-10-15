import { describe, expect, it } from 'vitest';
import { createSerialGate, retryOnRateLimit } from './concurrency-gate';

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createSerialGate', () => {
  it('выполняет задачи по одной, в порядке поступления', async () => {
    const gate = createSerialGate();
    const events: string[] = [];
    let running = 0;
    let maxRunning = 0;

    const first = deferred();
    const task = (name: string, wait?: Promise<void>) => async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      events.push(`start ${name}`);
      await wait;
      events.push(`end ${name}`);
      running--;
      return name;
    };

    const a = gate(task('a', first.promise));
    const b = gate(task('b'));
    await Promise.resolve();
    expect(events).toEqual(['start a']); // b ждёт, пока a не закончится

    first.resolve();
    expect(await Promise.all([a, b])).toEqual(['a', 'b']);
    expect(events).toEqual(['start a', 'end a', 'start b', 'end b']);
    expect(maxRunning).toBe(1);
  });

  it('упавшая задача не блокирует следующую и отдаёт свою ошибку', async () => {
    const gate = createSerialGate();
    const failing = gate(async () => {
      throw new Error('boom');
    });
    const next = gate(async () => 'ok');

    await expect(failing).rejects.toThrow('boom');
    await expect(next).resolves.toBe('ok');
  });
});

describe('retryOnRateLimit', () => {
  const isRateLimit = (err: unknown) => err instanceof Error && err.message === '429';
  const noSleep = () => Promise.resolve();

  it('повторяет после 429 и возвращает результат', async () => {
    let calls = 0;
    const delays: number[] = [];
    const result = await retryOnRateLimit(
      async () => {
        calls++;
        if (calls < 3) throw new Error('429');
        return 'ok';
      },
      {
        isRateLimit,
        maxWaitMs: 10_000,
        delaysMs: [1000, 2000, 3000],
        sleep: async (ms) => void delays.push(ms),
      },
    );

    expect(result).toBe('ok');
    expect(calls).toBe(3);
    expect(delays).toEqual([1000, 2000]);
  });

  it('сдаётся с исходной ошибкой, когда лимит ожидания исчерпан', async () => {
    let calls = 0;
    await expect(
      retryOnRateLimit(
        async () => {
          calls++;
          throw new Error('429');
        },
        { isRateLimit, maxWaitMs: 2500, delaysMs: [1000, 2000], sleep: noSleep },
      ),
    ).rejects.toThrow('429');
    // ждали 1000, следующая пауза 2000 уже не влезает в 2500
    expect(calls).toBe(2);
  });

  it('не повторяет ошибки, не связанные с лимитом', async () => {
    let calls = 0;
    await expect(
      retryOnRateLimit(
        async () => {
          calls++;
          throw new Error('timeout');
        },
        { isRateLimit, maxWaitMs: 10_000, delaysMs: [1000], sleep: noSleep },
      ),
    ).rejects.toThrow('timeout');
    expect(calls).toBe(1);
  });
});
