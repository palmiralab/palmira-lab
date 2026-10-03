import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit } from './rate-limit';

let ipCounter = 0;
// Каждому тесту свой IP, чтобы счётчики не пересекались.
function requestFrom(ip: string) {
  return new Request('http://site.test/', { headers: { 'x-forwarded-for': ip } });
}
function freshIp() {
  ipCounter += 1;
  return `10.0.0.${ipCounter}`;
}

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('пропускает до max запросов, дальше блокирует', () => {
    const request = requestFrom(freshIp());

    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(request, 'a', 3).rateLimited).toBe(false);
    }
    expect(checkRateLimit(request, 'a', 3).rateLimited).toBe(true);
  });

  it('по умолчанию лимит 5', () => {
    const request = requestFrom(freshIp());

    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(request, 'default-scope').rateLimited).toBe(false);
    }
    expect(checkRateLimit(request, 'default-scope').rateLimited).toBe(true);
  });

  it('счётчики разных маршрутов независимы', () => {
    const request = requestFrom(freshIp());

    for (let i = 0; i < 2; i++) checkRateLimit(request, 'chat', 2);
    expect(checkRateLimit(request, 'chat', 2).rateLimited).toBe(true);
    expect(checkRateLimit(request, 'contact', 2).rateLimited).toBe(false);
  });

  it('разные IP не мешают друг другу', () => {
    const first = requestFrom(freshIp());
    const second = requestFrom(freshIp());

    checkRateLimit(first, 'a', 1);
    expect(checkRateLimit(first, 'a', 1).rateLimited).toBe(true);
    expect(checkRateLimit(second, 'a', 1).rateLimited).toBe(false);
  });

  it('через минуту окно сбрасывается', () => {
    const request = requestFrom(freshIp());

    checkRateLimit(request, 'a', 1);
    expect(checkRateLimit(request, 'a', 1).rateLimited).toBe(true);

    vi.advanceTimersByTime(60_001);
    expect(checkRateLimit(request, 'a', 1).rateLimited).toBe(false);
  });
});
