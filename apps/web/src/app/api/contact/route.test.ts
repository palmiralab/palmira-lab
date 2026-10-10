import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUDIT_QUESTIONS, CHAT_CONTEXT_QUESTION } from '@/lib/audit-questions';
import { HONEYPOT_FIELD } from '@/lib/honeypot';

const sendContact = vi.hoisted(() => vi.fn());
const checkRateLimit = vi.hoisted(() => vi.fn());

vi.mock('@/lib/intake-client', () => ({ sendContact }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit }));

import { POST } from './route';

function post(body: unknown) {
  return POST(
    new Request('http://site.test/api/contact', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  );
}

const questionText = (key: string) => AUDIT_QUESTIONS.find((q) => q.key === key)?.question;

const valid = { name: ' Анна ', contact: ' @anna ', serviceType: 'telegram_automation' };

describe('POST /api/contact', () => {
  beforeEach(() => {
    checkRateLimit.mockReturnValue({ rateLimited: false });
    sendContact.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('передаёт в API очищенные поля и serviceType, отвечает ok', async () => {
    const response = await post(valid);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(sendContact).toHaveBeenCalledWith({
      name: 'Анна',
      contact: '@anna',
      serviceType: 'telegram_automation',
    });
  });

  it('заполненная приманка для ботов: отвечает ok, но заявку не отправляет', async () => {
    const response = await post({ ...valid, [HONEYPOT_FIELD]: 'http://spam.example' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(sendContact).not.toHaveBeenCalled();
  });

  it('пустая приманка (и из одних пробелов) заявку не мешает отправить', async () => {
    await post({ ...valid, [HONEYPOT_FIELD]: '   ' });

    expect(sendContact).toHaveBeenCalledOnce();
  });

  it('описание из auditAnswers.details уходит в API очищенным', async () => {
    await post({ ...valid, auditAnswers: { details: '  Нужно автоматизировать склад  ' } });

    expect(sendContact).toHaveBeenCalledWith({
      name: 'Анна',
      contact: '@anna',
      serviceType: 'telegram_automation',
      auditAnswers: { details: 'Нужно автоматизировать склад' },
    });
  });

  it('пустое описание не превращается в auditAnswers', async () => {
    await post({ ...valid, auditAnswers: { details: '   ' } });

    expect(sendContact.mock.calls[0][0]).not.toHaveProperty('auditAnswers.details');
    expect(sendContact.mock.calls[0][0].auditAnswers).toBeUndefined();
  });

  it('КП из запроса уходит в API как есть', async () => {
    const proposal = { title: 'Бот для записи', scope: ['Сценарий', 'Подключение'] };

    await post({ ...valid, proposal });

    expect(sendContact).toHaveBeenCalledWith(expect.objectContaining({ proposal }));
  });

  it.each([
    ['строка', 'текст'],
    ['массив', [1, 2]],
    ['число', 42],
  ])('КП не объект (%s): отбрасываем, заявка уходит без него', async (_title, proposal) => {
    const response = await post({ ...valid, proposal });

    expect(response.status).toBe(200);
    expect(sendContact.mock.calls[0][0].proposal).toBeUndefined();
  });

  it('отброшенное КП попадает в лог без содержимого', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await post({ ...valid, proposal: 'секретный текст' });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).not.toContain('секретный текст');
    warn.mockRestore();
  });

  it('заявка без КП ничего не логирует', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await post(valid);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('слишком большое КП: 400, в API не ходим', async () => {
    const response = await post({ ...valid, proposal: { title: 'а'.repeat(11_000) } });

    expect(response.status).toBe(400);
    expect(sendContact).not.toHaveBeenCalled();
  });

  describe('анкета аудита (auditForm)', () => {
    const audit = { ...valid, serviceType: 'ai_consultation' };
    const required = { businessDescription: ' Салон ', mainPainPoint: 'Запись вручную' };

    it('собирает пары вопрос-ответ из нашего списка, лишние ключи отбрасывает', async () => {
      await post({
        ...audit,
        auditForm: {
          answers: {
            ...required,
            weeklyHours: '5–20 часов',
            currentTools: ['Мессенджеры', 'Excel или Google Таблицы'],
            status: 'won',
          },
        },
      });

      expect(sendContact.mock.calls[0][0].serviceType).toBe('ai_consultation');
      expect(sendContact.mock.calls[0][0].auditAnswers).toEqual({
        businessDescription: { question: questionText('businessDescription'), answer: 'Салон' },
        mainPainPoint: { question: questionText('mainPainPoint'), answer: 'Запись вручную' },
        weeklyHours: { question: questionText('weeklyHours'), answer: '5–20 часов' },
        currentTools: {
          question: questionText('currentTools'),
          answer: ['Excel или Google Таблицы', 'Мессенджеры'],
        },
      });
    });

    it('реплики из чата идут последней парой', async () => {
      await post({ ...audit, auditForm: { answers: required, chatContext: '  Нужен бот  ' } });

      const answers = sendContact.mock.calls[0][0].auditAnswers;
      expect(Object.keys(answers).at(-1)).toBe('chatDescription');
      expect(answers.chatDescription).toEqual({ question: CHAT_CONTEXT_QUESTION, answer: 'Нужен бот' });
    });

    it('текст вопроса из запроса не принимаем: берём свой', async () => {
      await post({
        ...audit,
        auditForm: { answers: { ...required, businessDescription: { question: 'подмена', answer: 'x' } } },
      });

      // объект вместо строки: ответ не принят, обязательный вопрос пуст
      expect(sendContact).not.toHaveBeenCalled();
    });

    it.each([
      ['нет обязательных ответов', { answers: {} }],
      ['только один из двух', { answers: { businessDescription: 'Салон' } }],
      ['ответ из одних пробелов', { answers: { ...required, mainPainPoint: '   ' } }],
      ['answers не объект', { answers: 'текст' }],
      ['auditForm не объект', 'текст'],
    ])('%s: 400, в API не ходим', async (_title, auditForm) => {
      const response = await post({ ...audit, auditForm });

      expect(response.status).toBe(400);
      expect(sendContact).not.toHaveBeenCalled();
    });

    it('анкета побеждает старое описание details', async () => {
      await post({ ...audit, auditAnswers: { details: 'старое' }, auditForm: { answers: required } });

      expect(sendContact.mock.calls[0][0].auditAnswers).not.toHaveProperty('details');
      expect(sendContact.mock.calls[0][0].auditAnswers).toHaveProperty('businessDescription');
    });

    it('у не-аудита анкету отбрасываем с записью в лог, заявка уходит', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const response = await post({ ...valid, auditForm: { answers: required } });

      expect(response.status).toBe(200);
      expect(sendContact.mock.calls[0][0].auditAnswers).toBeUndefined();
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('telegram_automation');
      expect(warn.mock.calls[0][0]).not.toContain('Салон');
      warn.mockRestore();
    });
  });

  it('слишком длинное описание: 400, в API не ходим', async () => {
    const response = await post({ ...valid, auditAnswers: { details: 'а'.repeat(2001) } });

    expect(response.status).toBe(400);
    expect(sendContact).not.toHaveBeenCalled();
  });

  it('лимит запросов: 429, в API не ходим', async () => {
    checkRateLimit.mockReturnValue({ rateLimited: true });

    expect((await post(valid)).status).toBe(429);
    expect(sendContact).not.toHaveBeenCalled();
  });

  it.each([
    ['нет имени', { ...valid, name: '  ' }],
    ['нет контакта', { ...valid, contact: '' }],
    ['слишком длинное имя', { ...valid, name: 'а'.repeat(201) }],
    ['неизвестный serviceType', { ...valid, serviceType: 'hack' }],
    ['нет serviceType', { name: 'Анна', contact: '@anna' }],
  ])('%s: 400, в API не ходим', async (_title, body) => {
    expect((await post(body)).status).toBe(400);
    expect(sendContact).not.toHaveBeenCalled();
  });

  it('ошибка API передаётся посетителю с её статусом и текстом', async () => {
    sendContact.mockResolvedValue({ ok: false, status: 502, error: 'Сервис временно недоступен' });

    const response = await post(valid);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'Сервис временно недоступен' });
  });
});
