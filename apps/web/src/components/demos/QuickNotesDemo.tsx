import Link from 'next/link';
import { QuickNotesForm } from '@/components/QuickNotesForm';
import { primaryButtonClass } from '@/lib/ui-classes';

// Тело демо «Быстрые заметки»: объяснение, форма и пояснение, чем это полезно бизнесу.
// Заголовок и вводный абзац страницы берутся из данных (lib/content.ts, demos).
export function QuickNotesDemo() {
  return (
    <>
      <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Что здесь происходит
        </h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-slate-600 dark:text-slate-400">
          <li>Вы вводите заголовок и текст и выбираете оформление: заметка, объявление или факт.</li>
          <li>Сервер собирает из них отдельную страницу по выбранному шаблону.</li>
          <li>Вы получаете ссылку. Страница открывается у любого, у кого есть эта ссылка.</li>
          <li>Через 5 минут страница удаляется: мы ничего не храним насовсем.</li>
        </ol>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Это демонстрация. Пожалуйста, не вводите персональные данные и ничего конфиденциального:
          ссылку может открыть любой, у кого она есть.
        </p>
      </section>

      <QuickNotesForm />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Чем это полезно бизнесу
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Это уменьшенная версия того, что мы делаем для клиентов: быстрые заметки, объявления и
          новости в вашем фирменном дизайне, которыми можно мгновенно делиться в интернете.
          Написали текст, получили красивую страницу и ссылку. Без ожидания разработчика и без
          ручной вёрстки.
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          В работе дизайн, типы страниц и срок жизни ссылки подбираются под вас, по согласованию:
          от разовых заметок до постоянных страниц.
        </p>
        <Link href="/" className={`${primaryButtonClass} mt-2 self-start text-center`}>
          Обсудить быстрые заметки для вашего бизнеса
        </Link>
      </section>
    </>
  );
}
