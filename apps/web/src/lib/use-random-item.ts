import { useSyncExternalStore } from 'react';

const picked = new WeakMap<readonly unknown[], unknown>();

function pick<T>(items: readonly T[]): T {
  if (!picked.has(items)) {
    picked.set(items, items[Math.floor(Math.random() * items.length)]);
  }
  return picked.get(items) as T;
}

const subscribe = () => () => {};

// Случайный элемент, один на загрузку страницы. На сервере возвращает null, на
// клиенте выбирает: так HTML сервера и первый рендер клиента совпадают (случайное
// значение прямо в рендере дало бы ошибку гидрации). Та же схема, что у ThemeToggle.
export function useRandomItem<T>(items: readonly T[]): T | null {
  return useSyncExternalStore(subscribe, () => pick(items), () => null);
}
