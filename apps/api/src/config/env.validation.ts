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
    .string()
    .regex(
      /^postgres(ql)?:\/\/\S+$/,
      'должен начинаться с postgres:// или postgresql://',
    ),
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
