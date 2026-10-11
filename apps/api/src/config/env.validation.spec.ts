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

  it('Telegram-переменные необязательны: без них уведомления выключены', () => {
    const config = validate(validEnv);

    expect(config.TELEGRAM_BOT_TOKEN).toBeUndefined();
    expect(config.TELEGRAM_CHAT_ID).toBeUndefined();
  });

  it('принимает токен и chat_id вместе', () => {
    const config = validate({
      ...validEnv,
      TELEGRAM_BOT_TOKEN: '123456:abc',
      TELEGRAM_CHAT_ID: '987654321',
    });

    expect(config.TELEGRAM_BOT_TOKEN).toBe('123456:abc');
    expect(config.TELEGRAM_CHAT_ID).toBe('987654321');
  });

  it('падает, если задан токен без chat_id и наоборот', () => {
    expect(() =>
      validate({ ...validEnv, TELEGRAM_BOT_TOKEN: '123456:abc' }),
    ).toThrow(/TELEGRAM_CHAT_ID/);
    expect(() =>
      validate({ ...validEnv, TELEGRAM_CHAT_ID: '987654321' }),
    ).toThrow(/TELEGRAM_BOT_TOKEN/);
  });

  it('не выводит токен бота в текст ошибки', () => {
    expect(() =>
      validate({ ...validEnv, TELEGRAM_BOT_TOKEN: '123456:topsecrettoken' }),
    ).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining('topsecrettoken'),
      }),
    );
  });

  it('не выводит значения переменных в текст ошибки', () => {
    const secretUrl = 'mysql://palmira:topsecret@localhost/db';

    expect(() => validate({ DATABASE_URL: secretUrl })).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining('topsecret'),
      }),
    );
  });

  describe('почта для уведомлений о заявках', () => {
    const smtp = {
      SMTP_USER: 'agent@example.com',
      SMTP_PASSWORD: 'app-password',
      LEAD_EMAIL_TO: 'roman@example.com',
    };

    it('по умолчанию: сервер smtp.gmail.com, порт 465, почта выключена', () => {
      const config = validate(validEnv);

      expect(config.SMTP_HOST).toBe('smtp.gmail.com');
      expect(config.SMTP_PORT).toBe(465);
      expect(config.SMTP_USER).toBeUndefined();
      expect(config.LEAD_EMAIL_TO).toBeUndefined();
    });

    it('принимает полный набор настроек', () => {
      const config = validate({ ...validEnv, ...smtp, SMTP_PORT: '587' });

      expect(config.SMTP_PORT).toBe(587);
      expect(config.SMTP_USER).toBe('agent@example.com');
      expect(config.LEAD_EMAIL_TO).toBe('roman@example.com');
    });

    it.each(['SMTP_USER', 'SMTP_PASSWORD', 'LEAD_EMAIL_TO'])(
      'падает, если задана часть настроек, а %s нет',
      (missing) => {
        const partial: Record<string, string> = { ...smtp };
        delete partial[missing];

        expect(() => validate({ ...validEnv, ...partial })).toThrow(
          new RegExp(missing),
        );
      },
    );

    it('пустые строки считаются «не задано»', () => {
      const config = validate({
        ...validEnv,
        SMTP_USER: '',
        SMTP_PASSWORD: '  ',
        LEAD_EMAIL_TO: '',
      });

      expect(config.SMTP_USER).toBeUndefined();
      expect(config.LEAD_EMAIL_TO).toBeUndefined();
    });

    it('падает, если LEAD_EMAIL_TO не похож на адрес почты', () => {
      expect(() =>
        validate({ ...validEnv, ...smtp, LEAD_EMAIL_TO: 'не-адрес' }),
      ).toThrow(/LEAD_EMAIL_TO/);
    });

    it('падает на некорректном SMTP_PORT', () => {
      expect(() => validate({ ...validEnv, SMTP_PORT: 'abc' })).toThrow(
        /SMTP_PORT/,
      );
    });

    it('пароль не попадает в текст ошибки', () => {
      let message = '';
      try {
        validate({
          ...validEnv,
          SMTP_USER: 'agent@example.com',
          SMTP_PASSWORD: 'SECRET-APP-PASSWORD',
        });
      } catch (error) {
        message = (error as Error).message;
      }

      expect(message).toMatch(/LEAD_EMAIL_TO/);
      expect(message).not.toContain('SECRET-APP-PASSWORD');
    });
  });
});
