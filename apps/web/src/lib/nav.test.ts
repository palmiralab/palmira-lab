import { describe, expect, it } from 'vitest';
import { isActivePath } from './nav';

describe('isActivePath', () => {
  it('совпадает с самой страницей', () => {
    expect(isActivePath('/cases', '/cases')).toBe(true);
  });

  it('совпадает с вложенными страницами', () => {
    expect(isActivePath('/cases/deploy', '/cases')).toBe(true);
  });

  it('не путает похожие начала адресов', () => {
    expect(isActivePath('/auditor', '/audit')).toBe(false);
  });

  it('главная не подсвечивает чужие пункты', () => {
    expect(isActivePath('/', '/cases')).toBe(false);
  });
});
