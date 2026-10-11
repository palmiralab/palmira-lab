import type { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation.js';
import { EmailNotifier } from './email-notifier.service.js';
import type { NewLeadNotice } from './telegram-notifier.service.js';

const mocks = vi.hoisted(() => ({
  sendMail: vi.fn(),
  createTransport: vi.fn(),
}));

vi.mock('nodemailer', () => ({
  createTransport: mocks.createTransport,
}));

const PASSWORD = 'SECRET-APP-PASSWORD';

const fullConfig: Record<string, string | number | undefined> = {
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: 465,
  SMTP_USER: 'agent@example.com',
  SMTP_PASSWORD: PASSWORD,
  LEAD_EMAIL_TO: 'roman@example.com',
};

const notice: NewLeadNotice = {
  leadId: '11111111-1111-4111-8111-111111111111',
  name: 'Анна',
  contact: '@anna_test',
  serviceType: 'website_landing',
};

function makeNotifier(config = fullConfig) {
  const configService = {
    get: (key: string) => config[key],
  } as unknown as ConfigService<Env, true>;
  return new EmailNotifier(configService);
}

const sentMail = () =>
  mocks.sendMail.mock.calls[0][0] as {
    from: string;
    to: string;
    subject: string;
    text: string;
  };

describe('EmailNotifier', () => {
  beforeEach(() => {
    mocks.sendMail.mockReset().mockResolvedValue({});
    mocks.createTransport
      .mockReset()
      .mockReturnValue({ sendMail: mocks.sendMail });
  });

  it('шлёт письмо на LEAD_EMAIL_TO с данными заявки', async () => {
    await makeNotifier().notifyNewLead(notice);

    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    const mail = sentMail();
    expect(mail.to).toBe('roman@example.com');
    expect(mail.from).toBe('agent@example.com');
    expect(mail.text).toContain('Анна');
    expect(mail.text).toContain('@anna_test');
    expect(mail.text).toContain(notice.leadId);
  });

  it('тема начинается с [Palmira Lab] Заявка (по ней работает фильтр почты)', async () => {
    await makeNotifier().notifyNewLead(notice);

    expect(sentMail().subject).toBe('[Palmira Lab] Заявка: website_landing — Анна');
  });

  it('перевод строки в имени не ломает тему письма', async () => {
    await makeNotifier().notifyNewLead({
      ...notice,
      name: 'Анна\r\nBcc: spam@example.com',
    });

    expect(sentMail().subject).not.toMatch(/[\r\n]/);
  });

  it('LEAD_EMAIL_FROM, если задан, используется как отправитель', async () => {
    await makeNotifier({
      ...fullConfig,
      LEAD_EMAIL_FROM: 'Palmira Lab <agent@example.com>',
    }).notifyNewLead(notice);

    expect(sentMail().from).toBe('Palmira Lab <agent@example.com>');
  });

  it('подключается к SMTP по настройкам: порт 465 это TLS сразу', async () => {
    await makeNotifier().notifyNewLead(notice);

    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: 'agent@example.com', pass: PASSWORD },
      }),
    );
  });

  it('на другом порту (587) шифрование включается через STARTTLS', async () => {
    await makeNotifier({ ...fullConfig, SMTP_PORT: 587 }).notifyNewLead(notice);

    expect(mocks.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false }),
    );
  });

  it('у соединения заданы таймауты: сбой не должен висеть минутами', async () => {
    await makeNotifier().notifyNewLead(notice);

    const options = mocks.createTransport.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(options.connectionTimeout).toEqual(expect.any(Number));
    expect(options.socketTimeout).toEqual(expect.any(Number));
  });

  it('ничего не шлёт, если почта не настроена', async () => {
    await makeNotifier({}).notifyNewLead(notice);

    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });

  it('бросает ошибку при сбое отправки, и без пароля и адреса в тексте', async () => {
    mocks.sendMail.mockRejectedValue(
      new Error(`Invalid login ${PASSWORD} for agent@example.com`),
    );

    const error = await makeNotifier()
      .notifyNewLead(notice)
      .catch((e: unknown) => e as Error);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain(PASSWORD);
    expect((error as Error).message).not.toContain('agent@example.com');
  });
});
