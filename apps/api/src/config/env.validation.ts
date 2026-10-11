import { z } from 'zod';

// Схема описывает, какие переменные окружения нужны и что считается верным.
// Тип конфига выводится из неё же (см. Env), отдельно его не пишем.
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Переменные окружения приходят строками, поэтому число приводим явно.
  PORT: z.coerce.number().int().min(1).max(65535).default(3100),

  // Значения по умолчанию нет намеренно: угаданный адрес базы опаснее,
  // чем упавший при старте сервер.
  DATABASE_URL: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'переменная не задана'
          : 'должна быть строкой',
    })
    .regex(
      /^postgres(ql)?:\/\/\S+$/,
      'должен начинаться с postgres:// или postgresql://',
    ),

  // Уведомления о новых лидах в Telegram. Необязательны: без них (например,
  // в тестах и локальной разработке) уведомления просто выключены. Пустая
  // строка в .env считается «не задано».
  TELEGRAM_BOT_TOKEN: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  TELEGRAM_CHAT_ID: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),

  // Почтовый дубль уведомления о заявке (Telegram с сервера нестабилен).
  // Необязателен: без SMTP_USER, SMTP_PASSWORD и LEAD_EMAIL_TO канал выключен.
  SMTP_HOST: z.string().trim().min(1).default('smtp.gmail.com'),
  // 465: TLS сразу; 587: STARTTLS.
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(465),
  SMTP_USER: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  // Пароль приложения почты. Только в .env, не в репозитории и не в логах.
  SMTP_PASSWORD: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  // Куда слать заявки (ящик, который читает владелец).
  LEAD_EMAIL_TO: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  // От чьего имени слать; по умолчанию SMTP_USER.
  LEAD_EMAIL_FROM: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
}).superRefine((env, ctx) => {
  // Одно без другого означает ошибку в настройке: тихо выключенные
  // уведомления заметили бы только когда лид уже потерялся.
  if (env.TELEGRAM_BOT_TOKEN && !env.TELEGRAM_CHAT_ID) {
    ctx.addIssue({
      code: 'custom',
      path: ['TELEGRAM_CHAT_ID'],
      message: 'задан токен бота, нужен и chat_id',
    });
  }
  if (env.TELEGRAM_CHAT_ID && !env.TELEGRAM_BOT_TOKEN) {
    ctx.addIssue({
      code: 'custom',
      path: ['TELEGRAM_BOT_TOKEN'],
      message: 'задан chat_id, нужен и токен бота',
    });
  }
  // Почта включается только целиком: полуготовая настройка означает ошибку,
  // а тихо выключенный канал заметили бы, когда заявка уже потерялась.
  const smtp = {
    SMTP_USER: env.SMTP_USER,
    SMTP_PASSWORD: env.SMTP_PASSWORD,
    LEAD_EMAIL_TO: env.LEAD_EMAIL_TO,
  };
  if (Object.values(smtp).some(Boolean)) {
    for (const [name, value] of Object.entries(smtp)) {
      if (!value) {
        ctx.addIssue({
          code: 'custom',
          path: [name],
          message: 'почта настроена не полностью, нужны SMTP_USER, SMTP_PASSWORD и LEAD_EMAIL_TO',
        });
      }
    }
  }
  if (env.LEAD_EMAIL_TO && !/^\S+@\S+\.\S+$/.test(env.LEAD_EMAIL_TO)) {
    ctx.addIssue({
      code: 'custom',
      path: ['LEAD_EMAIL_TO'],
      message: 'должен быть адресом почты',
    });
  }
});

export type Env = z.infer<typeof envSchema>;

// Вызывается один раз при старте (см. ConfigModule.forRoot). Любая ошибка
// здесь роняет приложение до того, как оно начнёт принимать запросы.
export function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    // Zod по умолчанию не кладёт входные значения в ошибку, а в DATABASE_URL
    // лежит пароль. Не включайте reportInput и не печатайте config целиком.
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Некорректная конфигурация окружения:\n${details}`);
  }

  return result.data;
}
