import { randomUUID } from 'crypto';

export type SandboxTemplate = 'note' | 'announcement' | 'fact';

export type LandingDesign = 'light' | 'bold';

// Страницы демо бывают двух видов, различаются полем kind: заметка из
// «Быстрых заметок» и визитка из демо «Визитка по описанию». По kind
// TypeScript понимает, какие поля есть у записи.
export type NotePageData = {
  kind: 'note';
  title: string;
  body: string;
  template: SandboxTemplate;
};

export type LandingPageData = {
  kind: 'landing';
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  design: LandingDesign;
};

export type DemoPageData = NotePageData | LandingPageData;

export type SandboxPage = DemoPageData & { expiresAt: number };

const TTL_MS = 5 * 60_000;
const CLEANUP_INTERVAL_MS = 60_000;

// In-memory, как rate-limit.ts — не переживает рестарт процесса, не
// работает на несколько инстансов. Для эфемерной песочницы это ОК: если
// сервер перезапустился, старые ссылки и так должны были истечь.
//
// globalThis, а не просто module-level переменная — Next.js (Turbopack)
// компилирует Route Handler (/api/demo) и Server Component
// (/demo/[id]) в разные бандлы, каждый из которых заново выполняет
// этот модуль. Обычная `const pages = new Map()` дала бы отдельную Map
// на каждый бандл (проверено: лог показывал 3 разных инстанса модуля) —
// запись через API и чтение со страницы работали бы с разными картами.
// globalThis один на процесс Node.js независимо от того, сколько раз
// пересобирался и переисполнялся сам модуль.
const globalForSandbox = globalThis as unknown as {
  __sandboxPages?: Map<string, SandboxPage>;
  __sandboxCleanupStarted?: boolean;
};
const pages = globalForSandbox.__sandboxPages ?? new Map<string, SandboxPage>();
globalForSandbox.__sandboxPages = pages;

// Тот же globalThis-флаг не даёт запустить три таймера чистки вместо
// одного — по той же причине, что и выше с pages.
if (!globalForSandbox.__sandboxCleanupStarted) {
  globalForSandbox.__sandboxCleanupStarted = true;
  setInterval(() => {
    const now = Date.now();
    for (const [id, page] of pages) {
      if (page.expiresAt <= now) {
        pages.delete(id);
      }
    }
  }, CLEANUP_INTERVAL_MS).unref();
}

export function createSandboxPage(data: DemoPageData): {
  id: string;
  expiresAt: number;
} {
  const id = randomUUID();
  const expiresAt = Date.now() + TTL_MS;
  pages.set(id, { ...data, expiresAt });
  return { id, expiresAt };
}

export function getSandboxPage(id: string): SandboxPage | null {
  const page = pages.get(id);
  if (!page) return null;

  // Ленивая проверка — на случай, если запрос пришёл между двумя
  // прогонами периодической чистки, не ждать до 60с.
  if (page.expiresAt <= Date.now()) {
    pages.delete(id);
    return null;
  }

  return page;
}
