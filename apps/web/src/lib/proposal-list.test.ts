import { describe, expect, it } from 'vitest';
import { listItems } from './proposal-list';

describe('listItems', () => {
  it('убирает маркер списка, который модель иногда добавляет сама', () => {
    expect(listItems(['- Дизайн', '• Вёрстка', 'Запуск'])).toEqual(['Дизайн', 'Вёрстка', 'Запуск']);
  });

  it('пустые и пробельные пункты, в том числе из одного маркера, выбрасывает', () => {
    expect(listItems(['', '  ', '- ', '•', 'Тесты'])).toEqual(['Тесты']);
  });

  it('пустой список остаётся пустым: раздел в КП не показываем', () => {
    expect(listItems([])).toEqual([]);
  });
});
