import { withRetry } from './retry.js';

describe('withRetry', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('возвращает результат с первой попытки, не ждёт и не повторяет', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    await expect(withRetry(fn, { attempts: 3, delayMs: 1000 })).resolves.toBe(
      'ok',
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('повторяет после сбоя и отдаёт результат первой удачной попытки', async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('a'))
      .mockRejectedValueOnce(new Error('b'))
      .mockResolvedValue('ok');

    const promise = withRetry(fn, { attempts: 3, delayMs: 1000 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('после последней неудачной попытки бросает её ошибку', async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('первая'))
      .mockRejectedValueOnce(new Error('вторая'))
      .mockRejectedValueOnce(new Error('последняя'));

    const promise = withRetry(fn, { attempts: 3, delayMs: 1000 });
    const assertion = expect(promise).rejects.toThrow('последняя');
    await vi.runAllTimersAsync();

    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('выдерживает паузу между попытками, а не бьёт подряд', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(new Error('сбой'));

    const promise = withRetry(fn, { attempts: 3, delayMs: 1000 });
    const assertion = expect(promise).rejects.toThrow('сбой');

    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(2);

    await vi.runAllTimersAsync();
    await assertion;
  });

  it('после последней попытки не ждёт лишнюю паузу', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(new Error('сбой'));

    const promise = withRetry(fn, { attempts: 2, delayMs: 1000 });
    const assertion = expect(promise).rejects.toThrow('сбой');
    await vi.advanceTimersByTimeAsync(1000);

    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});
