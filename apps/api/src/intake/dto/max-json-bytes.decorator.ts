import { registerDecorator, type ValidationOptions } from 'class-validator';

// class-validator не умеет ограничивать размер объекта, поэтому считаем сами:
// размер JSON в байтах UTF-8 (кириллица занимает по 2 байта, длина строки в
// символах тут не годится). Не-сериализуемое значение (например, BigInt)
// считаем превышением, а не даём ему уронить запрос исключением.
export function MaxJsonBytes(
  max: number,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target, propertyName) => {
    registerDecorator({
      name: 'maxJsonBytes',
      target: target.constructor,
      propertyName: propertyName as string,
      constraints: [max],
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          try {
            return Buffer.byteLength(JSON.stringify(value)) <= max;
          } catch {
            return false;
          }
        },
        defaultMessage(): string {
          return `${String(propertyName)} слишком большой: максимум ${max} байт в JSON`;
        },
      },
    });
  };
}
