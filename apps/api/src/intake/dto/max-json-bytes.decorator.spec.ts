import { validate } from 'class-validator';
import { MaxJsonBytes } from './max-json-bytes.decorator.js';

class Sample {
  @MaxJsonBytes(20)
  value!: unknown;
}

const check = (value: unknown) =>
  validate(Object.assign(new Sample(), { value }));

describe('MaxJsonBytes', () => {
  it('пропускает объект в пределах лимита', async () => {
    expect(await check({ a: 1 })).toHaveLength(0);
  });

  it('пропускает объект ровно на границе лимита', async () => {
    // {"a":"xxxxxxxxxxxx"} = 20 байт
    expect(await check({ a: 'x'.repeat(12) })).toHaveLength(0);
  });

  it('отклоняет объект больше лимита', async () => {
    const errors = await check({ a: 'x'.repeat(13) });
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.maxJsonBytes).toContain('максимум 20 байт');
  });

  it('считает байты, а не символы: кириллица занимает по 2 байта', async () => {
    // По символам 8 + 7 = 15 (прошло бы), по байтам 8 + 7 * 2 = 22 (больше 20)
    expect(await check({ a: 'ж'.repeat(7) })).toHaveLength(1);
  });

  it('несериализуемое значение считает превышением, а не падает', async () => {
    expect(await check({ a: 1n })).toHaveLength(1);
  });
});
