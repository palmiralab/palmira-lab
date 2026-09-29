import { validate } from './env.validation.js';

const validEnv = {
  DATABASE_URL: 'postgresql://palmira:secret@localhost:5432/palmira_lab',
};

describe('validate (env)', () => {
  it('приводит PORT к числу и подставляет значения по умолчанию', () => {
    const config = validate({ ...validEnv, PORT: '3200' });

    expect(config.PORT).toBe(3200);
    expect(config.NODE_ENV).toBe('development');
    expect(config.DATABASE_URL).toBe(validEnv.DATABASE_URL);
  });

  it('использует порт 3100, если PORT не задан', () => {
    expect(validate(validEnv).PORT).toBe(3100);
  });

  it('падает без DATABASE_URL и называет переменную', () => {
    expect(() => validate({})).toThrow(/DATABASE_URL/);
  });

  it('пишет понятно, что DATABASE_URL не задана, без английского жаргона', () => {
    expect(() => validate({})).toThrow(/DATABASE_URL: переменная не задана/);
  });

  it('падает на некорректном PORT', () => {
    expect(() => validate({ ...validEnv, PORT: 'abc' })).toThrow(/PORT/);
    expect(() => validate({ ...validEnv, PORT: '70000' })).toThrow(/PORT/);
  });

  it('падает на неизвестном NODE_ENV', () => {
    expect(() => validate({ ...validEnv, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });

  it('падает, если DATABASE_URL не похож на адрес postgres', () => {
    expect(() =>
      validate({ ...validEnv, DATABASE_URL: 'mysql://localhost/db' }),
    ).toThrow(/DATABASE_URL/);
  });

  it('не выводит значения переменных в текст ошибки', () => {
    const secretUrl = 'mysql://palmira:topsecret@localhost/db';

    expect(() => validate({ DATABASE_URL: secretUrl })).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining('topsecret'),
      }),
    );
  });
});
