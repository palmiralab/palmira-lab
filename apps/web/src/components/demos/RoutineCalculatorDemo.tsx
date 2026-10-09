import Link from 'next/link';
import { RoutineCalculatorForm } from '@/components/RoutineCalculatorForm';
import { primaryButtonClass } from '@/lib/ui-classes';

// Тело демо «Калькулятор рутины»: форма с живым расчётом и пояснения. Заголовок и
// вводный абзац страницы берутся из данных (lib/content.ts).
export function RoutineCalculatorDemo() {
  return (
    <>
      <RoutineCalculatorForm />

      <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Как это считается
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Это арифметика ваших чисел: часы в неделю на одного человека, умноженные на число
          людей и на рабочие недели в году. Мы ничего не прогнозируем и не обещаем: какую
          часть рутины можно автоматизировать, вы оцениваете сами.
        </p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Расчёт выполняется прямо в вашем браузере. Введённые числа никуда не отправляются и
          не сохраняются.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Чем это полезно бизнесу
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Когда рутина выражена в часах, днях и деньгах за год, проще решить, что из неё
          стоит автоматизировать в первую очередь, а что лучше оставить как есть.
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          Следующий шаг после калькулятора — разбор конкретных процессов: на бесплатном
          ИИ-аудите мы вместе смотрим, что реально поддаётся автоматизации и сколько это
          стоит.
        </p>
        <Link href="/audit" className={`${primaryButtonClass} mt-2 self-start text-center`}>
          Заказать бесплатный ИИ-аудит
        </Link>
      </section>
    </>
  );
}
