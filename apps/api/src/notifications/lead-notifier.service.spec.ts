import { Logger } from '@nestjs/common';
import type { EmailNotifier } from './email-notifier.service.js';
import { LeadNotifier } from './lead-notifier.service.js';
import type {
  NewLeadNotice,
  TelegramNotifier,
} from './telegram-notifier.service.js';

const notice: NewLeadNotice = {
  leadId: '11111111-1111-4111-8111-111111111111',
  name: 'Анна Секретова',
  contact: '@anna_secret_contact',
  serviceType: 'website_landing',
};

function setup(
  telegram = vi.fn().mockResolvedValue(undefined),
  email = vi.fn().mockResolvedValue(undefined),
) {
  const notifier = new LeadNotifier(
    { notifyNewLead: telegram } as unknown as TelegramNotifier,
    { notifyNewLead: email } as unknown as EmailNotifier,
  );
  return { notifier, telegram, email };
}

describe('LeadNotifier', () => {
  let errorLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorLog = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('отправляет заявку в оба канала', async () => {
    const { notifier, telegram, email } = setup();

    await notifier.notifyNewLead(notice);

    expect(telegram).toHaveBeenCalledWith(notice);
    expect(email).toHaveBeenCalledWith(notice);
  });

  it('повторяет Telegram при сбоях, пока не получится (до 3 попыток)', async () => {
    vi.useFakeTimers();
    const telegram = vi
      .fn()
      .mockRejectedValueOnce(new Error('таймаут'))
      .mockRejectedValueOnce(new Error('таймаут'))
      .mockResolvedValue(undefined);
    const { notifier, email } = setup(telegram);

    const promise = notifier.notifyNewLead(notice);
    await vi.runAllTimersAsync();
    await promise;

    expect(telegram).toHaveBeenCalledTimes(3);
    expect(email).toHaveBeenCalledTimes(1);
    expect(errorLog).not.toHaveBeenCalled();
  });

  it('повторяет письмо при сбоях (до 3 попыток)', async () => {
    vi.useFakeTimers();
    const email = vi
      .fn()
      .mockRejectedValueOnce(new Error('smtp'))
      .mockResolvedValue(undefined);
    const { notifier, telegram } = setup(undefined, email);

    const promise = notifier.notifyNewLead(notice);
    await vi.runAllTimersAsync();
    await promise;

    expect(email).toHaveBeenCalledTimes(2);
    expect(telegram).toHaveBeenCalledTimes(1);
  });

  it('сбой Telegram не мешает письму', async () => {
    vi.useFakeTimers();
    const telegram = vi.fn().mockRejectedValue(new Error('нет связи'));
    const { notifier, email } = setup(telegram);

    const promise = notifier.notifyNewLead(notice);
    await vi.runAllTimersAsync();
    await promise;

    expect(telegram).toHaveBeenCalledTimes(3);
    expect(email).toHaveBeenCalledTimes(1);
  });

  it('сбой письма не мешает Telegram', async () => {
    vi.useFakeTimers();
    const email = vi.fn().mockRejectedValue(new Error('smtp недоступен'));
    const { notifier, telegram } = setup(undefined, email);

    const promise = notifier.notifyNewLead(notice);
    await vi.runAllTimersAsync();
    await promise;

    expect(email).toHaveBeenCalledTimes(3);
    expect(telegram).toHaveBeenCalledTimes(1);
  });

  it('не бросает ошибку, даже если упали оба канала', async () => {
    vi.useFakeTimers();
    const { notifier } = setup(
      vi.fn().mockRejectedValue(new Error('telegram')),
      vi.fn().mockRejectedValue(new Error('email')),
    );

    const promise = notifier.notifyNewLead(notice);
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBeUndefined();
  });

  it('в лог пишет канал, id лида и причину, но не имя и не контакт', async () => {
    vi.useFakeTimers();
    const { notifier } = setup(
      vi.fn().mockRejectedValue(new Error('Не удалось связаться с Telegram')),
    );

    const promise = notifier.notifyNewLead(notice);
    await vi.runAllTimersAsync();
    await promise;

    expect(errorLog).toHaveBeenCalledTimes(1);
    const line = String(errorLog.mock.calls[0][0]);
    expect(line).toContain('Telegram');
    expect(line).toContain(notice.leadId);
    expect(line).toContain('Не удалось связаться с Telegram');
    expect(line).not.toContain('Секретова');
    expect(line).not.toContain('anna_secret_contact');
  });
});
