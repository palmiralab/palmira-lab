import { BusinessCardForm } from '@/components/BusinessCardForm';

// Тело демо «Визитка по описанию»: объяснение, форма и пояснение, чем это полезно
// бизнесу. Заголовок и вводный абзац страницы берутся из данных (lib/content.ts).
export function BusinessCardDemo() {
  return (
    <>
      <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Что здесь происходит
        </h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-slate-600 dark:text-slate-400">
          <li>Вы вводите название и описание, добавляете контакты (по желанию) и выбираете дизайн.</li>
          <li>Сервер проверяет данные и собирает из них отдельную страницу-визитку.</li>
          <li>Вы получаете ссылку. Страница открывается у любого, у кого есть эта ссылка.</li>
          <li>Через 5 минут страница удаляется: мы ничего не храним насовсем.</li>
        </ol>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Это демонстрация. Пожалуйста, используйте вымышленные контакты и ничего
          конфиденциального: ссылку может открыть любой, у кого она есть.
        </p>
      </section>

      <BusinessCardForm />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Чем это полезно бизнесу
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Это уменьшенная версия того, что мы делаем для клиентов: быстро собранные страницы
          под конкретную задачу (визитка, лендинг, страница акции) в нужном дизайне. Описали
          дело, получили готовую страницу и ссылку.
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          В работе структура, дизайн и содержание подбираются под вас, по согласованию: от
          визитки на один экран до сайта из нескольких разделов.
        </p>
      </section>
    </>
  );
}
